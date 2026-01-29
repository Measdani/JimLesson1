import { LESSON1 } from "./lesson1_segments.js";
// ---------- TTS (Text-to-Speech) ----------


let idx = 0;
let inGate = false;
let pausedAt = 0;

let flowIndex = 0;

function hasFlow(seg) {
  return !!(seg.flow && Array.isArray(seg.flow) && seg.flow.length);
}

function resetFlow() {
  flowIndex = 0;
    if (respModal) respModal.classList.add("hidden");
}

function playFlowItem() {
  const s = LESSON1[idx];
  const item = s.flow?.[flowIndex];

  if (!item) {
    enterGate(); // done with this segment
    return;
  }

  if (item.type === "audio") {
    respModal.classList.add("hidden");
    audio.src = item.src;
    audio.currentTime = 0;
    audio.load();
    audio.play().catch(() => {});
    return;
  }

 if (item.type === "gate") {
  stopTTS();
  audio.pause();

  gateBox.textContent = item.text;
  inGate = true;
  btnNext.disabled = false;

  return;
}

}




let ttsUtterance = null;

function stopTTS() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  ttsUtterance = null;
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    alert("TTS not supported in this browser.");
    return;
  }
  stopTTS();

  ttsUtterance = new SpeechSynthesisUtterance(text);
  ttsUtterance.rate = 1.0;
  ttsUtterance.pitch = 1.0;
  ttsUtterance.onend = () => enterGate(); // unlock Next when TTS finishes
  window.speechSynthesis.speak(ttsUtterance);
}

function isUsingAudio() {
  const s = LESSON1[idx];
  return !!(s.audioUrl && s.audioUrl.trim());
}
// ---------- STT (Speech-to-Text) ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

function setupSTT() {
  if (!SpeechRecognition) return;

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const said = event.results[0][0].transcript.trim().toLowerCase();
    handleVoiceCommand(said);
  };

  recognition.onend = () => {
    listening = false;
  };
}

function startListening() {
  if (!recognition) {
    alert("Speech recognition not supported in this browser. Use Chrome/Edge.");
    return;
  }
  if (listening) return;
  listening = true;
  recognition.start();
}

function handleVoiceCommand(said) {
  // common commands
  if (said.includes("play")) btnPlay.click();
  else if (said.includes("pause") || said.includes("stop")) btnPause.click();
  else if (said.includes("repeat") || said.includes("again")) btnRepeat.click();
  else if (said === "next" || said.includes("next")) btnNext.click();
  else if (said.startsWith("ask ")) {
    const question = said.replace(/^ask\s+/, "");
    btnAsk.click();
    qText.value = question;
  } else {
    // If you want: show what was heard somewhere
    console.log("Heard:", said);
  }
}


const audio = document.getElementById("audio");
const segTitle = document.getElementById("segTitle");
const transcript = document.getElementById("transcript");
const gateBox = document.getElementById("gateBox");
const progress = document.getElementById("progress");

const btnPlay = document.getElementById("btnPlay");
const btnPause = document.getElementById("btnPause");
const btnRepeat = document.getElementById("btnRepeat");
const btnAsk = document.getElementById("btnAsk");
const btnNext = document.getElementById("btnNext");

const qModal = document.getElementById("qModal");
const respPrompt = document.getElementById("respPrompt");
const respContinue = document.getElementById("respContinue");
const respModal = document.getElementById("respModal");


const qText = document.getElementById("qText");
const btnSend = document.getElementById("btnSend");
const btnClose = document.getElementById("btnClose");
const answerText = document.getElementById("answerText");
const btnMic = document.getElementById("btnMic");


function renderProgress() {
  progress.innerHTML = "";
  LESSON1.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = (i === idx ? "▶ " : "") + s.title;
    progress.appendChild(li);

  });
}

setupSTT();


function loadSegment(i) {
  stopTTS();
  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  idx = i;
  const s = LESSON1[idx];

  segTitle.textContent = `${idx + 1}. ${s.title}`;
  transcript.textContent = s.transcript || "";
  gateBox.textContent = "";
  inGate = false;

  btnNext.disabled = true;
  renderProgress();

  // Reset flow UI whenever we change segments
  respModal.classList.add("hidden");
  flowIndex = 0;

  // Only preload audio for non-flow segments
  if (!hasFlow(s) && isUsingAudio()) {
    audio.src = s.audioUrl;
    audio.load();
  }
}



function enterGate() {
  inGate = true;
  gateBox.textContent = LESSON1[idx].gate;
  btnNext.disabled = false;
}
// --- Controls ---
btnPlay.onclick = () => {
  const s = LESSON1[idx];
  console.log("Play clicked", s.id);

  if (hasFlow(s)) {
    resetFlow();
    playFlowItem();
    return;
  }

  if (isUsingAudio()) {
    audio.play().catch((e) => console.error(e));
  } else {
    speakText(s.transcript);
  }
};



btnPause.onclick = () => {
  if (isUsingAudio()) {
    audio.pause();
  } else {
    stopTTS();
  }
};

btnRepeat.onclick = () => {
  const s = LESSON1[idx];
  if (isUsingAudio()) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    speakText(s.transcript);
  }
};

btnNext.onclick = () => {
  if (!inGate) return;
  stopTTS();
  audio.pause();

  if (idx < LESSON1.length - 1) loadSegment(idx + 1);
  else gateBox.textContent = "Lesson complete.";
};

btnAsk.onclick = () => {
  // pause whichever mode is active
  if (isUsingAudio()) {
    pausedAt = audio.currentTime || 0;
    audio.pause();
  } else {
    stopTTS();
    pausedAt = 0;
  }

  qModal.classList.remove("hidden");
  qText.focus();
};

btnClose.onclick = () => {
  qModal.classList.add("hidden");

  // resume only if we were mid-playback
  if (!inGate) {
    const s = LESSON1[idx];

    if (isUsingAudio() && audio.src) {
      audio.currentTime = pausedAt;
      audio.play().catch(() => {});
    } else {
      // resume TTS from the start (browser doesn't support "resume from timestamp" reliably)
      speakText(s.transcript);
    }
  }
};

btnSend.onclick = async () => {
  answerText.textContent = "Thinking...";

  const question = qText.value.trim();
  if (!question) {
    answerText.textContent = "Please type a question.";
    return;
  }

  const payload = {
    lesson: "Lesson 1",
    segment: LESSON1[idx].title,
    question
  };

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    answerText.textContent = data.answer || JSON.stringify(data, null, 2);
  } catch (err) {
    answerText.textContent = "Error contacting /api/ask. (This is expected unless you built that endpoint.)";
    console.error(err);
  }
};
respContinue.onclick = () => {
  respModal.classList.add("hidden");
  flowIndex += 1;
  playFlowItem();
};


btnMic.onclick = () => startListening();


audio.addEventListener("ended", () => {
  const s = LESSON1[idx];

  if (hasFlow(s)) {
    flowIndex += 1;
    playFlowItem();
  } else {
    enterGate();
  }
});

audio.addEventListener("error", () => {
  console.error("Audio failed:", audio.src);
  gateBox.textContent = "Audio missing or wrong path: " + audio.src;
});


// Start at segment 1
loadSegment(0);
flowIndex = 0;
