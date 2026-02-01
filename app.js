import { LESSON1 } from "./lesson1_segments.js";
// ---------- TTS (Text-to-Speech) ----------


let idx = 0;
let inGate = false;
let pausedAt = 0;

let flowIndex = 0;
let nextMode = "segment"; // "flow" or "segment"


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
  nextMode = "segment";   // we are DONE with flow
  enterGate();            // unlock Next for segment navigation
  return;
}


  if (item.type === "audio") {
nextMode = "flow";
inGate = false;
btnNext.disabled = true;



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

  nextMode = "flow";      // important
  inGate = true;
  btnNext.disabled = false;

  gateBox.textContent = item.text;
  return;
}


}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { lessons: {} };
  } catch {
    return { lessons: {} };
  }
}

function saveProgress(p) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function ensureLesson(progress, lessonNum) {
  const key = String(lessonNum);
  if (!progress.lessons[key]) {
    progress.lessons[key] = { completedSegments: {}, completed: false };
  }
  return progress.lessons[key];
}

function markSegmentComplete(lessonNum, segmentId) {
  const progress = loadProgress();
  const lesson = ensureLesson(progress, lessonNum);

  lesson.completedSegments[segmentId] = true;

  // lesson complete if all segments are complete
  const allDone = segments.every(s => lesson.completedSegments[s.id]);
  lesson.completed = allDone;

  saveProgress(progress);
  return { allDone };
}

function isSegmentComplete(lessonNum, segmentId) {
  const progress = loadProgress();
  const lesson = progress.lessons?.[String(lessonNum)];
  return !!lesson?.completedSegments?.[segmentId];
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
const btnBack = document.getElementById("btnBack");
const btnExit = document.getElementById("btnExit");


const qModal = document.getElementById("qModal");
const respPrompt = document.getElementById("respPrompt");
const respContinue = document.getElementById("respContinue");
const respModal = document.getElementById("respModal");


const qText = document.getElementById("qText");
const btnSend = document.getElementById("btnSend");
const btnClose = document.getElementById("btnClose");
const answerText = document.getElementById("answerText");
const btnMic = document.getElementById("btnMic");

const LESSON_NUMBER = 1;
const PROGRESS_KEY = "jim_progress_v1";

let currentIndex = 0;

const segments = [
  { id: "seg1", title: "Spoken Overview", requirement: "audio" },
  { id: "seg2", title: "Spoken Learning Objectives", requirement: "audio" },
  { id: "seg3", title: "Demonstration 1 — Articulation of Intent", requirement: "audio" }, 
  { id: "seg4", title: "Demonstration 2 — Context, Clarity, Constraints", requirement: "audio" },
  { id: "seg5", title: "Demonstration 3 — AI Mirrors Inquiry Quality", requirement: "audio" },
  { id: "seg6", title: "Demonstration 4 — Automation vs Cognitive Expansion", requirement: "audio" }, 
  { id: "seg7", title: "Demonstration 5 — Structured vs Unstructured Thinking", requirement: "audio"   },
  { id: "seg8", title: "Spoken Key Insights", requirement: "audio" },
  { id: "seg9", title: "Spoken Lesson Summary", requirement: "audio" },
];

audio.addEventListener("ended", () => {
  const seg = segments[currentIndex];
  if (!seg) return;

  if (seg.requirement === "audio") {
    markSegmentComplete(LESSON_NUMBER, seg.id);
    btnNext.disabled = false;

    // enable Exit ONLY after last segment completes
    const isLast = currentIndex === segments.length - 1;
    if (isLast && btnExit) btnExit.disabled = false;
  }
});



function renderProgress() {
  progress.innerHTML = "";
  LESSON1.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = (i === idx ? "▶ " : "") + s.title;
    progress.appendChild(li);
li.className = (i === idx) ? "active" : "";
  });
}

setupSTT();


function loadSegment(i) {
  stopTTS();
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  
  const lastSeg = LESSON1[LESSON1.length - 1];
btnExit.disabled = !isSegmentComplete(LESSON_NUMBER, lastSeg.id);


  idx = i;
  const s = LESSON1[idx];

  segTitle.textContent = `${idx + 1}. ${s.title}`;
  transcript.textContent = s.transcript || "";
  gateBox.textContent = "";
  inGate = false;

  btnBack.disabled = i === 0;
  btnNext.disabled = true;
  btnExit.disabled = true;

  renderProgress();
  updateExitState();


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

btnBack.onclick = () => {
  // Stop anything currently playing
  stopTTS();
  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  // Hide any active prompts/modals
  respModal.classList.add("hidden");
  qModal.classList.add("hidden");

  // Reset flow state
  flowIndex = 0;
  inGate = false;

  // Go to previous segment if possible
  if (idx > 0) {
    loadSegment(idx - 1);
  }
};


btnNext.onclick = () => {
  // If we're inside a FLOW gate, Next should advance the flow
  if (nextMode === "flow") {
    if (!inGate) return; // only allow Next when the gate is open

    // close gate + move to next flow item
    inGate = false;
    btnNext.disabled = true;
    gateBox.textContent = "";

    flowIndex += 1;
    playFlowItem();
    return;
  }

  // Otherwise, normal segment navigation
  if (!inGate) return;

  stopTTS();
  audio.pause();

  if (idx < LESSON1.length - 1) loadSegment(idx + 1);
  else gateBox.textContent = "Lesson complete.";
};

btnExit.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  // TEMP: reload page or navigate to dashboard
  // Later this becomes showDashboard()
  window.location.reload();
});



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
    console.log("CLOSE clicked");
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
  console.log("SEND clicked");
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
function updateExitState() {
  const lastSeg = LESSON1[LESSON1.length - 1];
  btnExit.disabled = !isSegmentComplete(LESSON_NUMBER, lastSeg.id);
}



btnMic.onclick = () => startListening();
  console.log("MIC clicked");
  startListening();

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
const aiInput = document.getElementById("aiInput");
const aiBtn = document.getElementById("aiBtn");
const aiOutput = document.getElementById("aiOutput");

aiBtn.onclick = () => {
  const q = aiInput.value.trim();

  if (!q) {
    aiOutput.classList.remove("hidden");
    aiOutput.textContent = "Type a question to explore this lesson.";
    return;
  }

  // Placeholder until API is live
  aiOutput.classList.remove("hidden");
  aiOutput.textContent =
    "AI Workspace is coming online soon.\n\nYou’ll be able to explore ideas directly here without leaving the lesson.";
};





`AI Workspace is coming online soon.

For now, use this space to:
• Write the question you would ask
• Clarify your assumptions
• Note what you’re testing or exploring

Once enabled, this AI will respond within the lesson context instead of sending you elsewhere.`;


// Start at segment 1
loadSegment(0);
flowIndex = 0;
