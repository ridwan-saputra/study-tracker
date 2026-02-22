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

  if (!state.intervalId) {
    state.intervalId = setInterval(updateUI, 1000);
  }
  updateUI();
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
  updateUI();
}

// Reset semua state ke awal
function resetStopwatch() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.mode = "standby";
  state.sessionStartTime = null;
  state.lastTickTime = null;
  state.studyAccumulated = 0;
  state.restAccumulated = 0;

  ui.lblStatus.textContent = "Standby";
  updateUI(); // Mengembalikan angka UI ke 00:00:00
}

// --- RENDER & DATA MANAGEMENT ---

// Menampilkan data sesi saat ini di dalam Popover Save Menu
function renderSaveMenu() {
  if (state.mode === "standby") {
    ui.tbodySession.innerHTML = `<tr><td colspan="6" style="text-align:center;">Belum ada sesi dimulai</td></tr>`;
    return;
  }

  const now = Date.now();
  let finalStudy = state.studyAccumulated;
  let finalRest = state.restAccumulated;

  if (state.mode === "study") finalStudy += now - state.lastTickTime;
  if (state.mode === "rest") finalRest += now - state.lastTickTime;

  const date = new Date(state.sessionStartTime).toISOString().split("T")[0];
  const startTimeStudy = new Date(state.sessionStartTime).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const endTimeStudy = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const netStudyTime = formatTime(finalStudy);
  const netRestTime = formatTime(finalRest);
  const topic = state.topic;

  ui.tbodySession.innerHTML = `
    <tr>
      <td>${date}</td>
      <td>${startTimeStudy}</td>
      <td>${endTimeStudy}</td>
      <td>${netStudyTime}</td>
      <td>${netRestTime}</td>
      <td>${topic}</td>
    </tr>
  `;
}

// Eksekusi penyimpanan data ke Local Storage
function saveToHistory() {
  if (state.mode === "standby") {
    alert("Mulai belajar terlebih dahulu sebelum menyimpan!");
    return;
  }

  const now = Date.now();
  let finalStudy = state.studyAccumulated;
  let finalRest = state.restAccumulated;

  if (state.mode === "study") finalStudy += now - state.lastTickTime;
  if (state.mode === "rest") finalRest += now - state.lastTickTime;

  const sessionData = {
    id: crypto.randomUUID(),
    topic: state.topic,
    createdAt: new Date(state.sessionStartTime).toISOString(),
    endedAt: new Date().toISOString(),
    duration: {
      study: finalStudy, // dalam millisecond
      rest: finalRest,
    },
  };

  const history = getHistoryData();
  history.push(sessionData);
  saveHistoryData(history);

  resetStopwatch();

  // Menutup popover setelah save (API Popover HTML5)
  document.getElementById("popover-save").hidePopover();

  renderHistory();
  alert("Data berhasil disimpan!");
}

// Menampilkan semua history yang tersimpan
function renderHistory() {
  const history = getHistoryData();
  ui.tbodyHistory.innerHTML = "";

  if (history.length === 0) {
    ui.tbodyHistory.innerHTML = `<tr><td colspan="8" style="text-align:center;">Belum ada data history</td></tr>`;
    return;
  }

  history.forEach((session, index) => {
    const no = index + 1;
    const rawDate = session.createdAt;
    const date = rawDate.split("T")[0];
    const startTimeStudy = new Date(session.createdAt).toLocaleTimeString();
    const endTimeStudy = new Date(session.endedAt).toLocaleTimeString();
    const netStudyTime = formatTime(session.duration.study);
    const netRestTime = formatTime(session.duration.rest);
    const topic = session.topic;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${no}</td>
      <td>${date}</td>
      <td>${startTimeStudy}</td>
      <td>${endTimeStudy}</td>
      <td>${netStudyTime}</td>
      <td>${netRestTime}</td>
      <td>${topic}</td>
      <td><button class="btn-delete" data-id="${session.id}">X</button></td>
    `;
    ui.tbodyHistory.appendChild(tr);
  });
}

// Menghapus spesifik baris di history
function deleteHistory(id) {
  let history = getHistoryData();
  history = history.filter((session) => session.id !== id); // Buang data yang ID-nya cocok
  saveHistoryData(history);
  renderHistory();
}

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
    const id = e.target.getAttribute("data-id");
    if (confirm("Yakin ingin menghapus history ini?")) {
      deleteHistory(id);
    }
  }
});

// Render history saat aplikasi pertama kali dimuat
document.addEventListener("DOMContentLoaded", renderHistory);
