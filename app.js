import { LESSON1 } from "./lesson1_segments.js";

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
const qText = document.getElementById("qText");
const btnSend = document.getElementById("btnSend");
const btnClose = document.getElementById("btnClose");
const answerText = document.getElementById("answerText");

let idx = 0;
let inGate = false;
let pausedAt = 0;

function renderProgress() {
  progress.innerHTML = "";
  LESSON1.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = (i === idx ? "▶ " : "") + s.title;
    progress.appendChild(li);
  });
}

function loadSegment(i) {
  idx = i;
  const s = LESSON1[idx];
  segTitle.textContent = `${idx + 1}. ${s.title}`;
  transcript.textContent = s.transcript || "";
  gateBox.textContent = "";
  inGate = false;

  btnNext.disabled = true; // enable only at gate
  renderProgress();

  if (s.audioUrl) {
    audio.src = s.audioUrl;
    audio.load();
  } else {
    audio.removeAttribute("src");
  }
}

function enterGate() {
  inGate = true;
  gateBox.textContent = LESSON1[idx].gate;
  btnNext.disabled = false;
}

btnPlay.onclick = () => audio.play();
btnPause.onclick = () => audio.pause();
btnRepeat.onclick = () => {
  audio.currentTime = 0;
  audio.play().catch(()=>{});
};
btnNext.onclick = () => {
  if (!inGate) return;
  if (idx < LESSON1.length - 1) loadSegment(idx + 1);
  else gateBox.textContent = "Lesson complete.";
};

btnAsk.onclick = () => {
  pausedAt = audio.currentTime || 0;
  audio.pause();
  qModal.classList.remove("hidden");
  qText.focus();
};

btnClose.onclick = () => {
  qModal.classList.add("hidden");
  // resume only if we were mid-playback
  if (!inGate && audio.src) {
    audio.currentTime = pausedAt;
    audio.play().catch(()=>{});
  }
};

btnSend.onclick = async () => {
  answerText.textContent = "Thinking...";
  const question = qText.value.trim();
  if (!question) {
    answerText.textContent = "Please type a question.";
    return;
  }

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

audio.addEventListener("ended", () => {
  enterGate();
});

// Start at segment 1
loadSegment(0);
