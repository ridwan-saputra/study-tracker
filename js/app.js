// DOM ELEMENTS
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

// STATE MANAGEMENT
const state = {
  mode: "standby", // 'standby', 'study', 'rest'
  topic: "Programming",
  sessionStartTime: null, // Waktu saat tombol start pertama kali ditekan
  lastTickTime: null, // Waktu terakhir stopwatch di-update
  studyAccumulated: 0, // Total waktu belajar (ms)
  restAccumulated: 0, // Total waktu istirahat (ms)
  intervalId: null, // ID untuk setInterval
};

const STORAGE_KEY = "studyTrackerHistory";

// --- UTILITY FUNCTIONS ---

// Helper function: Convert milidetik ke HH:MM:SS
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

// Mengambil data dari Local Storage
function getHistoryData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

// Menyimpan data ke Local Storage
function saveHistoryData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// --- CORE LOGIC ---

// Update tampilan UI setiap detik
function updateUI() {
  const now = Date.now();
  let currentStudy = state.studyAccumulated;
  let currentRest = state.restAccumulated;

  if (state.mode === "study") {
    currentStudy += now - state.lastTickTime;
  } else if (state.mode === "rest") {
    currentRest += now - state.lastTickTime;
    console.log(currentRest);
  }

  ui.displayStudy.textContent = formatTime(currentStudy);
  ui.displayRest.textContent = formatTime(currentRest);
}

// Mulai atau lanjutkan belajar
function startStudy() {
  if (state.mode === "study") return;

  const now = Date.now();

  if (state.mode === "standby") {
    state.sessionStartTime = now;
  } else if (state.mode === "rest") {
    // Simpan akumulasi istirahat sebelum pindah ke mode belajar
    state.restAccumulated += now - state.lastTickTime;
  }

  state.mode = "study";
  state.lastTickTime = now;
  ui.lblStatus.textContent = "Studying";

  if (state.intervalId === null) {
    state.intervalId = setInterval(updateUI, 200);
  }
}

// Pause belajar (Mulai istirahat)
function pauseStudy() {
  if (state.mode !== "study") return;

  const now = Date.now();
  // Simpan akumulasi belajar sebelum pindah ke mode istirahat
  state.studyAccumulated += now - state.lastTickTime;

  state.mode = "rest";
  state.lastTickTime = now;
  ui.lblStatus.textContent = "Resting";
}

// Reset semua state ke awal
function resetStopwatch() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.mode = "standby";
  state.sessionStartTime = null;
  state.studyAccumulated = 0;
  state.restAccumulated = 0;

  ui.lblStatus.textContent = "Study Tracker";
  updateUI();
}

// --- RENDER & DATA MANAGEMENT ---

// Menampilkan data sesi saat ini di dalam Popover Save Menu
function renderSaveMenu() {}

// Eksekusi penyimpanan data ke Local Storage
function saveToHistory() {}

// Menampilkan semua history yang tersimpan
function renderHistory() {}

// Menghapus spesifik baris di history
function deleteHistory(id) {}

// --- EVENT LISTENERS ---

ui.btnStart.addEventListener("click", startStudy);
ui.btnPause.addEventListener("click", pauseStudy);
ui.btnReset.addEventListener("click", resetStopwatch);

ui.btnSaveMenu.addEventListener("click", renderSaveMenu);
ui.btnSaveConfirm.addEventListener("click", saveToHistory);
ui.btnHistory.addEventListener("click", renderHistory);

// Event Delegation untuk tombol delete di tabel yang di-render dinamis
ui.tbodyHistory.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-delete")) {
    const id = parseInt(e.target.getAttribute("data-id"));
    if (confirm("Yakin ingin menghapus history ini?")) {
      deleteHistory(id);
    }
  }
});

// Render history saat aplikasi pertama kali dimuat
document.addEventListener("DOMContentLoaded", renderHistory);
