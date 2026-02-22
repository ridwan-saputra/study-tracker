// ==========================================
// 1. DOM ELEMENTS
// ==========================================
const ui = {
  lblStatus: document.getElementById("lbl-status"),
  displayStudy: document.getElementById("stopwatch-study"),
  displayRest: document.getElementById("stopwatch-rest"),
  btnStart: document.getElementById("btn-start"),
  btnPause: document.getElementById("btn-pause"),
  btnReset: document.getElementById("btn-reset"),
  btnSaveMenu: document.getElementById("btn-save-menu"),
  btnSaveConfirm: document.getElementById("btn-save-confirm"),
  btnHistory: document.getElementById("btn-history"),
  tbodySession: document.getElementById("tbody-session"),
  tbodyHistory: document.getElementById("tbody-history"),
};

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
const state = {
  mode: "standby", // 'standby', 'study', 'rest'
  sessionStartTimestamp: null, // Waktu pertama kali klik Start
  phaseStartTime: null, // Waktu saat berpindah antar study/rest
  studyAccumulated: 0,
  restAccumulated: 0,
  intervalId: null,
  topic: "Programming",
};

// ==========================================
// 3. CORE LOGIC (STOPWATCH)
// ==========================================

function startStudy() {
  // GUARD CLAUSE: Cegah glitch jika diklik berkali-kali saat sedang belajar
  if (state.mode === "study") return;

  const now = Date.now();

  // Jika baru pertama kali mulai sesi
  if (state.mode === "standby") {
    state.sessionStartTimestamp = now;
  }
  // Jika lanjut dari istirahat, simpan akumulasi waktu istirahat
  else if (state.mode === "rest") {
    state.restAccumulated += now - state.phaseStartTime;
  }

  state.mode = "study";
  state.phaseStartTime = now;
  ui.lblStatus.textContent = "Studying";

  // Mulai UI Loop
  clearInterval(state.intervalId);
  state.intervalId = setInterval(updateUI, 1000);
  updateUI();
}

function pauseStudy() {
  // GUARD CLAUSE: Cegah glitch jika diklik saat sudah pause atau belum mulai
  if (state.mode === "rest" || state.mode === "standby") return;

  const now = Date.now();

  // Simpan akumulasi waktu belajar
  state.studyAccumulated += now - state.phaseStartTime;

  state.mode = "rest";
  state.phaseStartTime = now;
  ui.lblStatus.textContent = "Resting";

  updateUI();

  // Interval tetap berjalan untuk update stopwatch istirahat
}

function resetStopwatch() {
  clearInterval(state.intervalId);

  state.mode = "standby";
  state.sessionStartTimestamp = null;
  state.phaseStartTime = null;
  state.studyAccumulated = 0;
  state.restAccumulated = 0;
  state.intervalId = null;

  ui.lblStatus.textContent = "Standby";
  ui.displayStudy.textContent = "00:00:00";
  ui.displayRest.textContent = "00:00:00";
}

function updateUI() {
  const now = Date.now();
  let currentStudyTime = state.studyAccumulated;
  let currentRestTime = state.restAccumulated;

  // Tambahkan waktu yang sedang berjalan berdasarkan mode aktif
  if (state.mode === "study") {
    currentStudyTime += now - state.phaseStartTime;
  } else if (state.mode === "rest") {
    currentRestTime += now - state.phaseStartTime;
  }

  ui.displayStudy.textContent = formatTime(currentStudyTime);
  ui.displayRest.textContent = formatTime(currentRestTime);
}

// ==========================================
// 4. DATA MANAGEMENT (LOCAL STORAGE & RENDER)
// ==========================================

function getHistory() {
  const data = localStorage.getItem("studyHistory");
  return data ? JSON.parse(data) : [];
}

function saveToHistory() {
  // Jangan simpan jika belum ada sesi belajar
  if (state.mode === "standby" && state.studyAccumulated === 0) {
    alert("Tidak ada sesi belajar untuk disimpan!");
    return;
  }

  // Kalkulasi total waktu terakhir sebelum disimpan
  const now = Date.now();
  if (state.mode === "study")
    state.studyAccumulated += now - state.phaseStartTime;
  if (state.mode === "rest")
    state.restAccumulated += now - state.phaseStartTime;

  const newRecord = {
    id: now,
    date: new Date(state.sessionStartTimestamp).toLocaleDateString("id-ID"),
    startTime: new Date(state.sessionStartTimestamp).toLocaleTimeString(
      "id-ID",
      { hour: "2-digit", minute: "2-digit" },
    ),
    endTime: new Date(now).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    studyTime: formatTime(state.studyAccumulated),
    restTime: formatTime(state.restAccumulated),
    topic: state.topic,
  };

  const history = getHistory();
  history.push(newRecord);
  localStorage.setItem("studyHistory", JSON.stringify(history));

  // Sembunyikan popover dan reset stopwatch
  document.getElementById("popover-save").hidePopover();
  resetStopwatch();
  renderHistory();
}

function deleteHistory(id) {
  let history = getHistory();
  history = history.filter((record) => record.id !== id);
  localStorage.setItem("studyHistory", JSON.stringify(history));
  renderHistory();
}

// ==========================================
// 5. VIEW RENDERING
// ==========================================

function renderSaveMenu() {
  ui.tbodySession.innerHTML = "";

  // Jika belum ada aktivitas, biarkan kosong
  if (state.sessionStartTimestamp === null) return;

  const now = Date.now();
  let tempStudy = state.studyAccumulated;
  let tempRest = state.restAccumulated;

  if (state.mode === "study") tempStudy += now - state.phaseStartTime;
  if (state.mode === "rest") tempRest += now - state.phaseStartTime;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>1</td>
    <td>${new Date(state.sessionStartTimestamp).toLocaleDateString("id-ID")}</td>
    <td>${new Date(state.sessionStartTimestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
    <td>${new Date(now).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
    <td>${formatTime(tempStudy)}</td>
    <td>${formatTime(tempRest)}</td>
    <td>${state.topic}</td>
  `;
  ui.tbodySession.appendChild(tr);
}

function renderHistory() {
  const history = getHistory();
  ui.tbodyHistory.innerHTML = "";

  history.forEach((record, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${record.date}</td>
      <td>${record.startTime}</td>
      <td>${record.endTime}</td>
      <td>${record.studyTime}</td>
      <td>${record.restTime}</td>
      <td>${record.topic}</td>
      <td><button class="btn-delete" data-id="${record.id}">Hapus</button></td>
    `;
    ui.tbodyHistory.appendChild(tr);
  });
}

// ==========================================
// 6. UTILS
// ==========================================
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// ==========================================
// 7. EVENT LISTENERS
// ==========================================
ui.btnStart.addEventListener("click", startStudy);
ui.btnPause.addEventListener("click", pauseStudy);
ui.btnReset.addEventListener("click", resetStopwatch);

ui.btnSaveMenu.addEventListener("click", renderSaveMenu);
ui.btnSaveConfirm.addEventListener("click", saveToHistory);
ui.btnHistory.addEventListener("click", renderHistory);

ui.tbodyHistory.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-delete")) {
    const id = parseInt(e.target.getAttribute("data-id"));
    deleteHistory(id);
  }
});

document.addEventListener("DOMContentLoaded", renderHistory);
