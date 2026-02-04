import { LESSON1 } from "./lesson1_segments.js";
// ---------- TTS (Text-to-Speech) ----------


let idx = 0;
let inGate = false;
let pausedAt = 0;

let flowIndex = 0;
let nextMode = "segment"; // "flow" or "segment"
let isPaused = false;


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

  const allDone = LESSON1.every(s => lesson.completedSegments[s.id]);
  lesson.completed = allDone;

  saveProgress(progress);
  return allDone;
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
  if (said.includes("play") || said.includes("pause") || said.includes("stop")) {
    btnPlayPause.click();
  } else if (said.includes("repeat") || said.includes("again")) {
    btnRepeat.click();
  } else if (said === "next" || said.includes("next")) {
    btnNext.click();
  } else if (said.startsWith("ask ")) {
    const question = said.replace(/^ask\s+/, "");
    btnAsk.click();
    qText.value = question;
  } else {
    console.log("Heard:", said);
  }
}


const audio = document.getElementById("audio");
const segTitle = document.getElementById("segTitle");
const transcript = document.getElementById("transcript");
const gateBox = document.getElementById("gateBox");
const progress = document.getElementById("progress");


const btnPlayPause = document.getElementById("btnPlayPause");
const btnRepeat = document.getElementById("btnRepeat");
const btnAsk = document.getElementById("btnAsk");
const btnNext = document.getElementById("btnNext");
const btnBack = document.getElementById("btnBack");
const btnExit = document.getElementById("btnExit");

let isPlaying = false;


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

  // Reset pause state when changing segments
  isPaused = false;

// If audio is already completed (or has no duration yet), keep Next locked.
// When metadata loads, we can check again.
audio.onloadedmetadata = () => {
  // if audio duration exists and we're basically at the end, unlock
  if (audio.duration && audio.currentTime >= audio.duration - 0.05) {
    unlockNextForCurrentSegment();
  }
};


  idx = i;
  const s = LESSON1[idx];

  segTitle.textContent = `${idx + 1}. ${s.title}`;
  transcript.textContent = s.transcript || "";
  gateBox.textContent = "";
  inGate = false;

  btnBack.disabled = i === 0;
  btnNext.disabled = true;
  

  // Exit button is always enabled for navigation to homepage

  renderProgress();

  // Reset flow UI whenever we change segments
  respModal.classList.add("hidden");
  flowIndex = 0;
  nextMode = "segment";

  

if (!hasFlow(s) && s.audioUrl && s.audioUrl.trim()) {
  audio.src = s.audioUrl;
  audio.currentTime = 0;
  audio.load();
}
}




function unlockNextForCurrentSegment() {
  const isLast = idx === LESSON1.length - 1;
  if (isLast) {
    btnNext.disabled = true;
    return;
  }
  inGate = true;
  btnNext.disabled = false;
  gateBox.textContent = LESSON1[idx].gate;
}




function enterGate() {
  inGate = true;
  gateBox.textContent = LESSON1[idx].gate;
  btnNext.disabled = false;
}
// --- Controls ---
btnPlayPause.onclick = () => {
  const s = LESSON1[idx];

  if (isPlaying) {
    // Currently playing, so pause
    console.log("Pause clicked", s.id);
    isPaused = true;
    isPlaying = false;

    audio.pause();
    stopTTS();

    btnPlayPause.innerHTML = "▶️ Play";
    btnPlayPause.classList.remove("btn-danger");
    btnPlayPause.classList.add("btn-primary");
  } else {
    // Currently paused/stopped, so play
    console.log("Play clicked", s.id);
    isPlaying = true;

    // Show Repeat button after first play
    btnRepeat.classList.remove("hidden");

    // Disable Continue button until audio/content finishes
    btnNext.disabled = true;
    inGate = false;

    btnPlayPause.innerHTML = "⏸️ Pause";
    btnPlayPause.classList.remove("btn-primary");
    btnPlayPause.classList.add("btn-danger");

    if (hasFlow(s)) {
      if (isPaused) {
        isPaused = false;
        playFlowItem();
      } else {
        resetFlow();
        playFlowItem();
      }
      return;
    }

    if (isUsingAudio()) {
      isPaused = false;
      audio.play().catch((e) => console.error(e));
    } else {
      speakText(s.transcript);
    }
  }
};

btnRepeat.onclick = () => {
  console.log("Repeat clicked, idx:", idx);
  const s = LESSON1[idx];

  // Reset pause state - repeat always starts from beginning
  isPaused = false;
  isPlaying = true;

  // Update button state
  btnPlayPause.innerHTML = "⏸️ Pause";
  btnPlayPause.classList.remove("btn-primary");
  btnPlayPause.classList.add("btn-danger");

  // stop TTS if active
  stopTTS();
  // stop any audio
  audio.pause();

  // If this segment has a flow, reset and replay it
  if (hasFlow(s)) {
    resetFlow();
    playFlowItem();
    return;
  }

  // Otherwise handle normal audio/TTS
  if (isUsingAudio()) {
    console.log("Repeating audio");
    audio.src = s.audioUrl;
    audio.currentTime = 0;
    audio.load();
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

  // Reset playing state
  isPlaying = false;
  btnPlayPause.innerHTML = "▶️ Play";
  btnPlayPause.classList.remove("btn-danger");
  btnPlayPause.classList.add("btn-primary");

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
  console.log("Continue clicked, idx:", idx, "nextMode:", nextMode, "inGate:", inGate);

  // If we're inside a FLOW gate, Next should advance the flow
  if (nextMode === "flow") {
    if (!inGate) return; // only allow Next when the gate is open

    // close gate + move to next flow item
    inGate = false;
    btnNext.disabled = true;
    gateBox.textContent = "";

    flowIndex += 1;
    console.log("Advancing flow to index:", flowIndex);
    playFlowItem();
    return;
  }

  // Otherwise, normal segment navigation
  if (!inGate) return;

  stopTTS();
  audio.pause();

  if (idx < LESSON1.length - 1) {
    console.log("Loading next segment:", idx + 1);
    loadSegment(idx + 1);
  } else {
    gateBox.textContent = "Lesson complete.";
  }
};

btnExit.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  // Navigate to dashboard
  window.location.href = "dashboard.html";
});



function setModalOpen(isOpen) {
  document.body.classList.toggle("modal-open", isOpen);
}

btnAsk.onclick = () => {
  // pause whichever mode is active
  if (isUsingAudio()) {
    pausedAt = audio.currentTime || 0;
    audio.pause();
  } else {
    stopTTS();
    pausedAt = 0;
  }

  // Update playing state
  if (isPlaying) {
    isPlaying = false;
    isPaused = true;
    btnPlayPause.innerHTML = "▶️ Play";
    btnPlayPause.classList.remove("btn-danger");
    btnPlayPause.classList.add("btn-primary");
  }

  // Hide AI workspace output if visible
  aiOutput.classList.add("hidden");

  // Show Ask modal
  qModal.classList.remove("hidden");
  setModalOpen(true);
  qText.focus();
};


btnClose.onclick = () => {
    console.log("CLOSE clicked");
  qModal.classList.add("hidden");
  setModalOpen(false);

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
  answerText.innerHTML = '<span class="loading-spinner"></span>Thinking...';

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

    // Clear input after successful response
    qText.value = "";
  } catch (err) {
    answerText.textContent = "Error contacting the AI. Please try again.";
    console.error(err);
  }
};


btnMic.onclick = () => {
  console.log("MIC clicked");
  startListening();
};


audio.addEventListener("ended", () => {
  const s = LESSON1[idx];
  if (!s) return;

  // Reset pause and playing state when audio finishes
  isPaused = false;
  isPlaying = false;
  btnPlayPause.innerHTML = "▶️ Play";
  btnPlayPause.classList.remove("btn-danger");
  btnPlayPause.classList.add("btn-primary");

  // Flow mode: keep advancing flow
  if (nextMode === "flow") {
    flowIndex += 1;
    playFlowItem();
    return;
  }

  // Segment finished
  markSegmentComplete(LESSON_NUMBER, s.id);

  const isLast = idx === LESSON1.length - 1;
  if (isLast) {
    btnNext.disabled = true;
    gateBox.textContent = "Lesson complete. Click Exit Lesson.";
    return;
  }

  unlockNextForCurrentSegment();
});



audio.addEventListener("error", () => {
  console.error("Audio failed:", audio.src);

  // If we're in flow mode, show error and enable manual skip
  if (nextMode === "flow") {
    gateBox.textContent = "Audio file missing. Click Continue to skip.";
    inGate = true;
    btnNext.disabled = false;
    return;
  }

  // For regular segments, show error and enable Continue
  gateBox.textContent = "Audio missing. Click Continue to proceed.";
  inGate = true;
  btnNext.disabled = false;
});
const aiInput = document.getElementById("aiInput");
const aiBtn = document.getElementById("aiBtn");
const aiOutput = document.getElementById("aiOutput");

aiBtn.onclick = async () => {
  const q = aiInput.value.trim();

  if (!q) {
    aiOutput.classList.remove("hidden");
    aiOutput.innerHTML = '<span class="empty-state">Type a question to explore this lesson.</span>';
    return;
  }

  // Show loading state with spinner
  aiOutput.classList.remove("hidden");
  aiOutput.innerHTML = '<span class="loading-spinner"></span>Thinking...';

  const payload = {
    lesson: "Lesson 1",
    segment: LESSON1[idx].title,
    question: q
  };

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    aiOutput.textContent = data.answer || JSON.stringify(data, null, 2);

    // Clear input after successful response
    aiInput.value = "";
  } catch (err) {
    aiOutput.textContent = "Error contacting the AI. Please try again.";
    console.error(err);
  }
};


// Keyboard shortcuts
// Enter to send in AI Workspace
aiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    aiBtn.click();
  }
});

// Enter to send in Ask modal
qText.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    btnSend.click();
  }
});

// Escape to close Ask modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !qModal.classList.contains("hidden")) {
    btnClose.click();
  }
});

// Start at segment 1
loadSegment(0);
flowIndex = 0;

// Auto-play the first segment
setTimeout(() => {
  btnPlayPause.click();
}, 500);

