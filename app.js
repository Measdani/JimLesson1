import { LESSON1 } from "./lesson1_segments.js";
// ---------- TTS (Text-to-Speech) ----------


let idx = 0;
let inGate = false;
let pausedAt = 0;



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

const qText = document.getElementById("qText");
const btnSend = document.getElementById("btnSend");
const btnClose = document.getElementById("btnClose");
const answerText = document.getElementById("answerText");
const btnMic = document.getElementById("btnMic");

let flowIndex = 0;
function playFlowItem() {
  const s = LESSON1[idx];
  const item = s.flow?.[flowIndex];

  if (!item) {
    enterGate(); // done with this segment
    return;
  }

  if (item.type === "audio") {
    audio.src = item.src;
    audio.load();
    audio.play().catch(() => {});
    return;
  }

  if (item.type === "prompt") {
    stopTTS();
    audio.pause();

    respPrompt.textContent = item.text;
    respModal.classList.remove("hidden");
  }
}


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

  idx = i;
  const s = LESSON1[idx];
  segTitle.textContent = `${idx + 1}. ${s.title}`;
  transcript.textContent = s.transcript || "";
  gateBox.textContent = "";
  inGate = false;

  btnNext.disabled = true;
  renderProgress();

  if (isUsingAudio()) {
    audio.src = s.audioUrl;
    audio.load();
  } else {
    audio.removeAttribute("src");
    // don't auto-enter gate; gate will open when TTS finishes (or you can allow immediately)
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

  // If this segment uses flow (interactive)
  if (s.flow && Array.isArray(s.flow)) {
    flowIndex = 0;
    playFlowItem();
    return;
  }

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

  respContinue.onclick = () => {
  respModal.classList.add("hidden");
  flowIndex += 1;
  playFlowItem();
};


  // Minimal lesson context (segment title only)

  const payload = {
    lesson: "Lesson 1",
    segment: LESSON1[idx].title,
    question
  };

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  answerText.textContent = data.answer || JSON.stringify(data, null, 2);
};

btnMic.onclick = () => startListening();


audio.addEventListener("ended", () => {
  flowIndex += 1;
  playFlowItem();
});


// Start at segment 1
loadSegment(0);
flowIndex = 0;
}