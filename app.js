"use strict";

const STORAGE_KEYS = {
  students: "mathAdventure.students.v1",
  results: "mathAdventure.results.v1",
  settings: "mathAdventure.supabase.v1",
  audio: "mathAdventure.audio.v1",
  auth: "mathAdventure.teacherAuth.v1"
};
const DEFAULT_SUPABASE_SETTINGS = {
  url: "https://cokfvtaxplcgdgkpmbpv.supabase.co",
  key: "sb_publishable_EVJF9xPN1GBp11OBJ2sXew_d0GA6xid"
};
const savedSupabaseSettings = readStorage(STORAGE_KEYS.settings, {});
const TOPICS = [
  { id: "pecahan", name: "Pecahan", icon: "🍰", tag: "YUK, BAGI!", note: "Kenali pecahan dan bagian dari satu keseluruhan.", color: "#e88868", soft: "#fff0e8" },
  { id: "desimal-persen", name: "Desimal & Persen", icon: "💯", tag: "UBAH BENTUK!", note: "Jelajahi bilangan desimal, persen, dan pecahan.", color: "#6aaf91", soft: "#eaf7ef" },
  { id: "kpk-fpb", name: "KPK & FPB", icon: "🧩", tag: "CARI POLA!", note: "Temukan kelipatan dan faktor persekutuan.", color: "#8a82cc", soft: "#f0effb" },
  { id: "operasi", name: "Operasi Bilangan Cacah", icon: "🧮", tag: "HITUNG CERDAS!", note: "Asah tambah, kurang, kali, dan bagi.", color: "#e3ae50", soft: "#fff6df" },
  { id: "keliling-luas", name: "Keliling & Luas", icon: "📐", tag: "UKUR YUK!", note: "Hitung keliling dan luas bangun datar.", color: "#60a6ca", soft: "#eaf5fb" },
  { id: "sudut", name: "Sudut", icon: "📏", tag: "UKUR SUDUT!", note: "Kenali sudut dan hubungan antar-sudut.", color: "#df8298", soft: "#fff0f3" },
  { id: "bangun-datar", name: "Bangun Datar", icon: "🔷", tag: "BENTUK SERU!", note: "Jelajahi sifat dan ciri aneka bangun datar.", color: "#79a36e", soft: "#f0f7e9" },
  { id: "pengolahan-data", name: "Pengolahan Data", icon: "📊", tag: "BACA DATA!", note: "Baca tabel dan temukan informasi dari data.", color: "#718dd0", soft: "#eef2fd" }
];
const $ = (selector) => document.querySelector(selector);
const dialogs = {
  student: $("#studentDialog"), game: $("#gameDialog"), result: $("#resultDialog"),
  teacher: $("#teacherDialog"), settings: $("#settingsDialog"), instructions: $("#instructionsDialog")
};
const state = {
  students: readStorage(STORAGE_KEYS.students, []),
  results: readStorage(STORAGE_KEYS.results, []),
  settings: {
    url: savedSupabaseSettings.url || DEFAULT_SUPABASE_SETTINGS.url,
    key: savedSupabaseSettings.key || DEFAULT_SUPABASE_SETTINGS.key
  },
  auth: readStorage(STORAGE_KEYS.auth, null),
  teacherAuthenticated: false,
  activeStudentId: localStorage.getItem("mathAdventure.activeStudent.v1") || "",
  audio: localStorage.getItem(STORAGE_KEYS.audio) !== "off",
  game: null,
  toastTimer: null
};
const safeId = () => globalThis.crypto?.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
  const random = Math.random() * 16 | 0;
  return (char === "x" ? random : random & 3 | 8).toString(16);
});
const nowIso = () => new Date().toISOString();
const prettyDate = (date) => new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const getTopic = (id) => TOPICS.find((topic) => topic.id === id);

function readStorage(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null");
    return stored ?? fallback;
  } catch (error) {
    console.error(`Data lokal ${key} tidak dapat dibaca.`, error);
    return fallback;
  }
}
function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Data lokal ${key} tidak dapat disimpan.`, error);
    showToast("Penyimpanan browser penuh atau tidak tersedia.");
  }
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}
function playTone(correct) {
  if (!state.audio) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = correct ? 740 : 240;
    gain.gain.setValueAtTime(0.11, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.19);
    oscillator.onended = () => context.close();
  } catch (error) {
    console.warn("Audio tidak dapat diputar di browser ini.", error);
  }
}
function updateAudioButton() {
  const button = $("#soundToggle");
  button.innerHTML = `${state.audio ? "🔊" : "🔇"} <span>Audio ${state.audio ? "ON" : "OFF"}</span>`;
  button.setAttribute("aria-label", state.audio ? "Matikan audio" : "Nyalakan audio");
  button.title = state.audio ? "Matikan audio" : "Nyalakan audio";
}

function renderTopics() {
  $("#topicGrid").innerHTML = TOPICS.map((topic) => {
    const attempts = state.results.filter((result) => result.topic_id === topic.id).length;
    return `<article class="topic-card" style="--topic-color:${topic.color};--topic-soft:${topic.soft}">
      <span class="topic-tag">${topic.tag}</span><div class="topic-icon" aria-hidden="true">${topic.icon}</div>
      <h3>${topic.name}</h3><p>${topic.note}</p>
      <div class="topic-bottom"><span>20 soal <span class="topic-stars">· ${attempts ? `${attempts} misi` : "10–15 menit"}</span></span><button class="start-link" type="button" data-topic="${topic.id}">Main →</button></div>
    </article>`;
  }).join("");
  $("#topicGrid").querySelectorAll("[data-topic]").forEach((button) => {
    button.addEventListener("click", () => startGame(button.dataset.topic));
  });
}
function renderStudents() {
  const select = $("#studentSelect");
  const active = state.students.find((student) => student.id === state.activeStudentId);
  select.innerHTML = `<option value="">Pilih petualang...</option>${state.students.map((student) =>
    `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)}${student.class_name ? ` · ${escapeHtml(student.class_name)}` : ""}</option>`
  ).join("")}`;
  select.value = active?.id || "";
  $("#activeStudentName").textContent = active ? active.name : "Siapa namamu?";
  $("#studentAvatar").textContent = active ? ["🧑‍🚀", "🧑‍🎓", "🧒", "👧", "🦸"][Math.abs(active.name.charCodeAt(0)) % 5] : "👋";
}
function updateHomeStats() {
  const totalCorrect = state.results.reduce((sum, result) => sum + Number(result.correct || 0), 0);
  const totalQuestions = state.results.reduce((sum, result) => sum + Number(result.total || 0), 0);
  $("#heroPlayed").textContent = state.results.length;
  $("#heroStars").textContent = state.results.reduce((sum, result) => sum + Number(result.score || 0), 0);
  $("#heroAccuracy").textContent = totalQuestions ? `${Math.round(totalCorrect / totalQuestions * 100)}%` : "—";
}
function renderDashboard() {
  const resultRows = state.results.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const totalCorrect = resultRows.reduce((sum, item) => sum + Number(item.correct || 0), 0);
  const totalQuestions = resultRows.reduce((sum, item) => sum + Number(item.total || 0), 0);
  $("#dashStudents").textContent = new Set(resultRows.map((item) => item.student_id || item.student_name)).size;
  $("#dashMissions").textContent = resultRows.length;
  $("#dashStars").textContent = resultRows.reduce((sum, item) => sum + Number(item.score || 0), 0);
  $("#dashAccuracy").textContent = totalQuestions ? `${Math.round(totalCorrect / totalQuestions * 100)}%` : "—";
  $("#recordCount").textContent = resultRows.length ? `${resultRows.length} hasil misi${isCloudConfigured() && state.auth?.access_token ? " · termasuk data cloud" : ""}` : "Belum ada hasil misi";
  updateExportAccess();
  $("#resultsTable").innerHTML = resultRows.length ? resultRows.map((result) => `
    <tr><td>${escapeHtml(result.student_name || "Petualang")}</td><td>${escapeHtml(result.class_name || "—")}</td>
    <td>${escapeHtml(result.topic_name || getTopic(result.topic_id)?.name || "—")}</td>
    <td>${Number(result.correct || 0)}/${Number(result.total || 20)}</td><td>${Math.round(Number(result.score || 0) / Math.max(1, Number(result.total || 20)) * 100)}%</td>
    <td>Level ${Number(result.level || 1)}</td><td>${prettyDate(result.created_at || nowIso())}</td></tr>`).join("")
    : '<tr><td class="empty-table" colspan="7">Belum ada misi selesai. Yuk, mulai petualangan!</td></tr>';
}
function renderAll() {
  renderStudents();
  renderTopics();
  updateHomeStats();
  renderDashboard();
  updateCloudStatus();
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function updateCloudStatus(message) {
  const status = $("#cloudStatus");
  status.classList.toggle("connected", Boolean(isCloudConfigured() && state.teacherAuthenticated));
  status.classList.remove("error");
  $("#cloudStatusText").textContent = message || (isCloudConfigured() ? (state.teacherAuthenticated ? "Supabase aktif" : "Cloud · login guru") : "Mode lokal");
}
function updateExportAccess() {
  $("#teacherData").hidden = !state.teacherAuthenticated;
  $("#exportLoginNotice").hidden = state.teacherAuthenticated;
}
function isCloudConfigured() {
  return Boolean(state.settings.url && state.settings.key);
}
function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("dialog-open");
}
function closeDialog(dialog) {
  if (dialog.open) dialog.close();
  if (!Object.values(dialogs).some((item) => item.open)) document.body.classList.remove("dialog-open");
}

function fractionQuestions(i, level) {
  const n = level === 1 ? 2 + i % 4 : level === 2 ? 3 + i % 5 : 4 + i % 6;
  if (i % 4 === 0) {
    const numerator = 1 + (i * 3) % (n - 1);
    const divisor = gcd(numerator, n);
    return makeQuestion(`${numerator / divisor}/${n / divisor}`, `Sederhanakan pecahan ${numerator}/${n}.`, [`${numerator}/${n}`, `${numerator}/${n + 1}`, `${n}/${numerator}`]);
  }
  if (i % 4 === 1) {
    const numerator = level + 1 + (i % 3);
    const denominator = 4 + (i % 5);
    return makeQuestion(`${numerator * 2}/${denominator * 2}`, `Pecahan yang senilai dengan ${numerator}/${denominator} adalah ...`, [`${numerator + 1}/${denominator + 1}`, `${numerator}/${denominator + 1}`, `${numerator * 2 + 1}/${denominator * 2}`]);
  }
  if (i % 4 === 2) {
    const d = 5 + i % 4;
    const a = 1 + i % (d - 2);
    const b = 1 + (i + 1) % (d - a);
    return makeQuestion(`${a + b}/${d}`, `Berapakah ${a}/${d} + ${b}/${d}?`, [`${a + b}/${d * 2}`, `${a + b + 1}/${d}`, `${a + b - 1}/${d}`]);
  }
  const unit = 8 + (i % 5) * 4;
  const part = level * 2 + 1;
  return makeQuestion(String(unit * part), `Berapakah ${part}/${unit} dari ${unit * unit}?`, [String(unit * (part - 1)), String(unit * (part + 1)), String(unit + part)]);
}
function decimalQuestions(i, level) {
  const whole = (i * 7 + level * 3) % 18 + 1;
  switch (i % 4) {
    case 0: {
      const tenths = 1 + i % 8;
      return makeQuestion(`${tenths * 10}%`, `${tenths}/10 sama dengan ...`, [`${tenths}%`, `${100 - tenths * 10}%`, `${tenths * 5}%`]);
    }
    case 1:
      return makeQuestion(`${whole}/10`, `Tuliskan ${whole / 10} dalam bentuk pecahan berpenyebut 10.`, [`${whole + 1}/10`, `${whole}/100`, `${whole - 1}/10`]);
    case 2: {
      const percent = 10 + i % 8 * 10;
      return makeQuestion(String(percent / 100), `${percent}% dalam bentuk desimal adalah ...`, [`${percent / 10}`, `${percent / 1000}`, `${(100 - percent) / 100}`]);
    }
    default: {
      const a = whole / 10;
      const b = (i % 6 + 1) / 10;
      const sum = (a + b).toFixed(1);
      return makeQuestion(sum, `Berapakah ${a.toFixed(1)} + ${b.toFixed(1)}?`, [(a + b + .2).toFixed(1), (a + b - .2).toFixed(1), `${Math.abs(a - b).toFixed(1)}`]);
    }
  }
}
function kpkFpbQuestions(i, level) {
  const a = (i % 9) + 2 + level;
  const b = ((i * 3) % 8) + 3 + (level - 1);
  const kpk = lcm(a, b);
  const fpb = gcd(a, b);
  if (i % 2 === 0) return makeQuestion(String(kpk), `Berapa KPK dari ${a} dan ${b}?`, [String(kpk + a), String(Math.max(a, b)), String(kpk - b)]);
  return makeQuestion(String(fpb), `Berapa FPB dari ${a} dan ${b}?`, [String(Math.min(a, b)), String(fpb + 1), String(Math.max(1, fpb - 1))]);
}
function operationQuestions(i, level) {
  const scale = level * 100 + 50;
  const a = scale + i * 19;
  const b = 20 + i * 7;
  const c = 2 + i % 9;
  const d = 2 + i % 7;
  switch (i % 4) {
    case 0: return makeQuestion(String(a + b), `Berapakah ${a.toLocaleString("id-ID")} + ${b.toLocaleString("id-ID")}?`, [String(a + b + 10), String(a + b - 10), String(a - b)]);
    case 1: return makeQuestion(String(a - b), `Berapakah ${a.toLocaleString("id-ID")} − ${b.toLocaleString("id-ID")}?`, [String(a - b + 10), String(a + b), String(a - b - 20)]);
    case 2: return makeQuestion(String(c * d), `Berapakah ${c} × ${d}?`, [String(c + d), String(c * d + c), String(Math.max(1, c * d - d))]);
    default: {
      const quotient = c + 2;
      return makeQuestion(String(quotient), `Berapakah ${quotient * d} ÷ ${d}?`, [String(quotient + 1), String(Math.max(1, quotient - 1)), String(d)]);
    }
  }
}
function geometryQuestions(i, level) {
  const a = 4 + (i * 3) % (8 + level * 2);
  const b = 3 + (i * 2) % (7 + level * 2);
  if (i % 4 === 0) return makeQuestion(`${2 * (a + b)} cm`, `Persegi panjang memiliki panjang ${a} cm dan lebar ${b} cm. Berapa kelilingnya?`, [`${a * b} cm`, `${2 * a + b} cm`, `${a + b} cm`]);
  if (i % 4 === 1) return makeQuestion(`${a * b} cm²`, `Persegi panjang memiliki panjang ${a} cm dan lebar ${b} cm. Berapa luasnya?`, [`${2 * (a + b)} cm²`, `${a + b} cm²`, `${(a + b) * 2} cm²`]);
  if (i % 8 === 2) return makeQuestion(`${4 * a} cm`, `Sebuah persegi memiliki panjang sisi ${a} cm. Berapa kelilingnya?`, [`${a * a} cm`, `${3 * a} cm`, `${2 * a} cm`]);
  if (i % 8 === 6) return makeQuestion(`${a * a} cm²`, `Sebuah persegi memiliki panjang sisi ${a} cm. Berapa luasnya?`, [`${4 * a} cm²`, `${2 * a} cm²`, `${a + a} cm²`]);
  const base = 4 + (i % 6) * 2;
  const height = 2 + (i * 3) % 8;
  const area = base * height / 2;
  return makeQuestion(`${area} cm²`, `Segitiga memiliki alas ${base} cm dan tinggi ${height} cm. Berapa luasnya?`, [`${base * height} cm²`, `${area + base} cm²`, `${area + height} cm²`]);
}
function angleQuestions(i, level) {
  if (i % 3 === 0) {
    const angle = 20 + (i * 19) % 150;
    const type = angle < 90 ? "lancip" : angle === 90 ? "siku-siku" : angle < 180 ? "tumpul" : "lurus";
    return makeQuestion(type, `Sudut ${angle}° termasuk sudut ...`, ["lancip", "siku-siku", "tumpul", "lurus"].filter((item) => item !== type));
  }
  if (i % 3 === 1) {
    const value = 25 + (i * 13 + level * 7) % 145;
    return makeQuestion(`${180 - value}°`, `Sudut pelurus dari ${value}° adalah ...`, [`${90 - value}°`, `${360 - value}°`, `${value}°`]);
  }
  const value = 10 + (i * 13 + level * 7) % 75;
  return makeQuestion(`${90 - value}°`, `Sudut ${value}° dan sudut ... membentuk sudut siku-siku.`, [`${180 - value}°`, `${90 + value}°`, `${value}°`]);
}
function shapeQuestions(i) {
  const bank = [
    { q: "Bangun datar dengan 4 sisi sama panjang dan 4 sudut siku-siku adalah ...", a: "Persegi", w: ["Persegi panjang", "Belah ketupat", "Trapesium"] },
    { q: "Segitiga yang ketiga sisinya sama panjang disebut ...", a: "Segitiga sama sisi", w: ["Segitiga sama kaki", "Segitiga siku-siku", "Segitiga sembarang"] },
    { q: "Bangun datar yang memiliki sepasang sisi sejajar adalah ...", a: "Trapesium", w: ["Lingkaran", "Segitiga", "Layang-layang"] },
    { q: "Bangun datar yang tidak memiliki titik sudut adalah ...", a: "Lingkaran", w: ["Persegi", "Segitiga", "Jajargenjang"] },
    { q: "Persegi panjang mempunyai berapa pasang sisi sejajar?", a: "2 pasang", w: ["1 pasang", "3 pasang", "Tidak ada"] },
    { q: "Segi lima memiliki berapa sisi?", a: "5 sisi", w: ["4 sisi", "6 sisi", "8 sisi"] },
    { q: "Bangun dengan dua pasang sisi berdekatan yang sama panjang adalah ...", a: "Layang-layang", w: ["Persegi panjang", "Trapesium", "Segitiga"] },
    { q: "Berapa jumlah sudut pada segitiga?", a: "3 sudut", w: ["2 sudut", "4 sudut", "5 sudut"] },
    { q: "Bangun datar dengan dua pasang sisi sejajar disebut ...", a: "Jajargenjang", w: ["Trapesium", "Segitiga", "Lingkaran"] },
    { q: "Segi enam memiliki berapa titik sudut?", a: "6 titik sudut", w: ["5 titik sudut", "7 titik sudut", "8 titik sudut"] },
    { q: "Berapa jumlah diagonal pada persegi?", a: "2 diagonal", w: ["1 diagonal", "3 diagonal", "4 diagonal"] },
    { q: "Jumlah besar sudut dalam sebuah segitiga adalah ...", a: "180°", w: ["90°", "270°", "360°"] },
    { q: "Berapa banyak simetri lipat pada persegi?", a: "4", w: ["2", "3", "6"] },
    { q: "Persegi panjang mempunyai berapa sudut siku-siku?", a: "4", w: ["2", "3", "5"] },
    { q: "Keempat sisi belah ketupat memiliki panjang yang ...", a: "Sama", w: ["Berbeda", "Selalu dua pasang berbeda", "Tidak beraturan"] },
    { q: "Pada jajargenjang, sisi-sisi yang berhadapan selalu ...", a: "Sama panjang", w: ["Tegak lurus", "Tidak sejajar", "Berbentuk lengkung"] },
    { q: "Bangun datar bersisi delapan disebut ...", a: "Segi delapan", w: ["Segi enam", "Segi tujuh", "Segi sembilan"] },
    { q: "Berapa jumlah sisi pada segi tujuh?", a: "7 sisi", w: ["5 sisi", "6 sisi", "8 sisi"] }
  ];
  const item = bank[i % bank.length];
  return makeQuestion(item.a, item.q, item.w);
}
function dataQuestions(i) {
  const a = Array.from({ length: 5 }, (_, index) => 2 + ((index * 3 + (i % 5) * 2) % 11));
  if (i % 4 === 0) {
    const total = a.reduce((sum, number) => sum + number, 0);
    return makeQuestion(String(total), `Data jumlah buku dibaca: ${a.join(", ")} buku. Berapa jumlah semuanya?`, [String(total + 2), String(total - 2), String(total + 5)]);
  }
  if (i % 4 === 1) {
    const max = Math.max(...a);
    const index = a.indexOf(max) + 1;
    return makeQuestion(`Hari ke-${index}`, `Data buku dibaca per hari: ${a.join(", ")}. Pada hari ke berapa buku terbanyak dibaca?`, [`Hari ke-${(index % 5) + 1}`, `Hari ke-${((index + 1) % 5) + 1}`, `Hari ke-${((index + 2) % 5) + 1}`]);
  }
  if (i % 4 === 2) {
    const sorted = a.slice().sort((x, y) => x - y);
    return makeQuestion(String(sorted[2]), `Median dari data ${a.join(", ")} adalah ...`, [String(sorted[0]), String(sorted[1]), String(sorted[4])]);
  }
  const range = Math.max(...a) - Math.min(...a);
  return makeQuestion(String(range), `Jangkauan data ${a.join(", ")} adalah ...`, [String(range + 1), String(Math.max(1, range - 1)), String(a.reduce((sum, n) => sum + n, 0))]);
}
function makeQuestion(answer, prompt, wrong) {
  const choices = [...new Set([String(answer), ...wrong.map(String)])];
  const fraction = /^(-?\d+)\/(\d+)$/.exec(String(answer));
  const numeric = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(String(answer));
  let offset = 1;
  while (choices.length < 4) {
    let alternative;
    if (fraction) alternative = `${Number(fraction[1]) + offset}/${fraction[2]}`;
    else if (numeric) alternative = `${Number(numeric[1]) + offset}${numeric[2]}`;
    else alternative = `Pilihan ${choices.length}`;
    if (!choices.includes(alternative)) choices.push(alternative);
    offset++;
  }
  return { prompt, answer: String(answer), choices: choices.slice(0, 4) };
}
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }
function lcm(a, b) { return a * b / gcd(a, b); }
const QUESTION_GENERATORS = {
  pecahan: fractionQuestions,
  "desimal-persen": decimalQuestions,
  "kpk-fpb": kpkFpbQuestions,
  operasi: operationQuestions,
  "keliling-luas": geometryQuestions,
  sudut: angleQuestions,
  "bangun-datar": shapeQuestions,
  "pengolahan-data": dataQuestions
};

function startGame(topicId) {
  const student = state.students.find((item) => item.id === state.activeStudentId);
  if (!student) {
    showToast("Pilih atau tambahkan siswa dulu, ya!");
    $("#studentNameInput").focus();
    openDialog(dialogs.student);
    return;
  }
  state.game = { topicId, student, index: 0, correct: 0, streak: 0, level: 1, maxLevel: 1, locked: false, score: 0 };
  $("#gameTopic").textContent = getTopic(topicId).name.toUpperCase();
  $("#gameTitle").textContent = `Misi ${getTopic(topicId).name}`;
  $("#gameScore").textContent = "0";
  $("#streakText").textContent = "Semangat, kamu pasti bisa!";
  showQuestion();
  openDialog(dialogs.game);
}
function showQuestion() {
  const game = state.game;
  if (!game) return;
  if (game.index >= 20) return finishGame();
  const question = QUESTION_GENERATORS[game.topicId](game.index, game.level);
  const choices = question.choices.slice().sort(() => Math.random() - .5);
  game.currentAnswer = question.answer;
  game.locked = false;
  $("#questionCounter").textContent = `SOAL ${game.index + 1} DARI 20`;
  $("#gameLevel").textContent = `LEVEL ${game.level} · ${["PEMULA", "PENJELAJAH", "JUARA"][game.level - 1]}`;
  $("#progressFill").style.width = `${game.index / 20 * 100}%`;
  $("#questionText").textContent = question.prompt;
  $("#answerFeedback").textContent = "";
  $("#answerFeedback").classList.remove("is-wrong");
  $("#answerGrid").innerHTML = choices.map((choice) => `<button class="answer-option" type="button" data-answer="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join("");
  $("#answerGrid").querySelectorAll(".answer-option").forEach((button) => button.addEventListener("click", () => submitAnswer(button)));
}
function submitAnswer(button) {
  const game = state.game;
  if (!game || game.locked) return;
  game.locked = true;
  const isCorrect = button.dataset.answer === game.currentAnswer;
  $("#answerGrid").querySelectorAll(".answer-option").forEach((option) => {
    option.disabled = true;
    if (option.dataset.answer === game.currentAnswer) option.classList.add("correct");
  });
  if (isCorrect) {
    game.correct++;
    game.score++;
    game.streak++;
    if (game.streak >= 2 && game.level < 3) {
      game.level++;
      game.streak = 0;
      $("#answerFeedback").textContent = `Hebat! Kamu naik ke level ${game.level}! 🚀`;
    } else {
      $("#answerFeedback").textContent = "Tepat sekali! Jawabanmu benar! ✨";
    }
    game.maxLevel = Math.max(game.maxLevel, game.level);
  } else {
    button.classList.add("incorrect");
    game.streak = 0;
    if (game.level > 1) game.level--;
    $("#answerFeedback").classList.add("is-wrong");
    $("#answerFeedback").textContent = `Belum tepat. Jawaban yang benar: ${game.currentAnswer}`;
  }
  playTone(isCorrect);
  $("#gameScore").textContent = game.score;
  $("#streakText").textContent = game.streak ? `🔥 ${game.streak} jawaban benar berturut-turut!` : "Terus mencoba, kamu pasti bisa!";
  setTimeout(() => {
    if (!state.game) return;
    state.game.index++;
    showQuestion();
  }, 1100);
}
function finishGame() {
  const game = state.game;
  if (!game) return;
  const result = {
    id: safeId(), student_id: game.student.id, student_name: game.student.name,
    class_name: game.student.class_name || "", topic_id: game.topicId,
    topic_name: getTopic(game.topicId).name, correct: game.correct, total: 20,
    score: game.correct, level: game.maxLevel, created_at: nowIso()
  };
  state.results.unshift(result);
  saveStorage(STORAGE_KEYS.results, state.results);
  renderAll();
  closeDialog(dialogs.game);
  $("#resultStudent").textContent = `${game.student.name} · ${getTopic(game.topicId).name}`;
  $("#resultScore").textContent = `${game.correct}/20`;
  $("#resultCorrect").textContent = game.correct;
  $("#resultAccuracy").textContent = `${game.correct * 5}%`;
  $("#resultLevel").textContent = `Level ${game.maxLevel}`;
  $("#resultMessage").textContent = game.correct >= 16 ? "Luar biasa! Kamu benar-benar jago matematika! 🏆" : game.correct >= 10 ? "Kerja bagus! Terus berlatih agar makin hebat! ✨" : "Setiap petualangan membuatmu makin pintar. Coba lagi! 💪";
  state.game = null;
  openDialog(dialogs.result);
  syncRecord(result);
}

async function supabaseRequest(path, { method = "GET", body, authenticated = false, headers = {} } = {}) {
  if (!isCloudConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const accessToken = authenticated ? state.auth?.access_token : "";
  if (authenticated && !accessToken) throw new Error("Login guru diperlukan untuk membaca data cloud.");
  const response = await fetch(`${state.settings.url.replace(/\/+$/, "")}${path}`, {
    method,
    headers: {
      apikey: state.settings.key,
      Authorization: `Bearer ${accessToken || state.settings.key}`,
      "Content-Type": "application/json",
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const responseBody = await response.text();
  let parsed;
  try { parsed = responseBody ? JSON.parse(responseBody) : null; } catch { parsed = responseBody; }
  if (!response.ok) {
    const detail = parsed?.message || parsed?.hint || parsed?.error_description || `HTTP ${response.status}`;
    throw new Error(detail);
  }
  return parsed;
}
async function syncStudent(student) {
  if (!isCloudConfigured()) return;
  try {
    await supabaseRequest("/rest/v1/app_students", {
      method: "POST", body: { id: student.id, name: student.name, class_name: student.class_name || "", created_at: student.created_at },
      headers: { Prefer: "return=minimal" }
    });
  } catch (error) {
    console.error("Profil siswa belum tersimpan di Supabase.", error);
    showToast(`Profil tersimpan di perangkat, tetapi gagal disinkronkan: ${error.message}`);
    $("#cloudStatus").classList.add("error");
  }
}
async function syncRecord(result) {
  if (!isCloudConfigured()) return;
  try {
    await supabaseRequest("/rest/v1/app_results", {
      method: "POST",
      body: {
        id: result.id, student_id: result.student_id, student_name: result.student_name,
        class_name: result.class_name, topic_id: result.topic_id, topic_name: result.topic_name,
        correct: result.correct, total: result.total, score: result.score, level: result.level,
        created_at: result.created_at
      },
      headers: { Prefer: "return=minimal" }
    });
    updateCloudStatus();
    showToast("Hasil misi tersimpan di Supabase ☁️");
  } catch (error) {
    console.error("Hasil misi belum tersimpan di Supabase.", error);
    showToast(`Hasil tersimpan di perangkat, tetapi gagal disinkronkan: ${error.message}`);
    $("#cloudStatus").classList.add("error");
  }
}
async function signInTeacher(email, password) {
  const data = await supabaseRequest("/auth/v1/token?grant_type=password", {
    method: "POST", body: { email, password }
  });
  if (!data?.access_token || !data?.refresh_token) throw new Error("Supabase tidak mengembalikan sesi login yang valid.");
  state.auth = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + Number(data.expires_in || 3600) * 1000 };
  saveStorage(STORAGE_KEYS.auth, state.auth);
  $("#teacherAuthFeedback").textContent = "Login berhasil. Memuat data cloud…";
  await loadCloudRecords();
}
async function refreshAuth() {
  if (!state.auth?.refresh_token) return false;
  if (state.auth.expires_at > Date.now() + 30000) return true;
  try {
    const data = await supabaseRequest("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", body: { refresh_token: state.auth.refresh_token }
    });
    state.auth = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + Number(data.expires_in || 3600) * 1000 };
    saveStorage(STORAGE_KEYS.auth, state.auth);
    return true;
  } catch (error) {
    console.error("Sesi guru sudah tidak berlaku.", error);
    state.auth = null;
    saveStorage(STORAGE_KEYS.auth, null);
    return false;
  }
}
async function loadCloudRecords() {
  state.teacherAuthenticated = false;
  updateExportAccess();
  if (!isCloudConfigured() || !state.auth?.access_token) {
    setAuthFormState();
    renderDashboard();
    return;
  }
  if (!(await refreshAuth())) {
    $("#teacherAuthFeedback").textContent = "Sesi berakhir. Silakan login kembali.";
    setAuthFormState();
    updateCloudStatus();
    return;
  }
  $("#teacherAuthFeedback").textContent = "Memverifikasi akun guru…";
  try {
    const remoteRows = await supabaseRequest("/rest/v1/app_results?select=id,student_id,student_name,class_name,topic_id,topic_name,correct,total,score,level,created_at&order=created_at.desc&limit=1000", { authenticated: true });
    state.teacherAuthenticated = true;
    const byId = new Map(state.results.map((item) => [item.id, item]));
    for (const item of remoteRows) byId.set(item.id, item);
    state.results = [...byId.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    saveStorage(STORAGE_KEYS.results, state.results);
    renderAll();
    $("#teacherAuthFeedback").textContent = `${remoteRows.length} hasil dari Supabase berhasil dimuat.`;
    setAuthFormState();
    await syncCloudStudents();
  } catch (error) {
    console.error("Data Supabase tidak dapat dimuat.", error);
    $("#teacherAuthFeedback").textContent = `Data cloud gagal dimuat: ${error.message}`;
    showToast(`Tidak dapat memuat data cloud: ${error.message}`);
    setAuthFormState();
    updateExportAccess();
  }
  updateCloudStatus();
}
async function syncCloudStudents() {
  try {
    const remoteStudents = await supabaseRequest("/rest/v1/app_students?select=id,name,class_name,created_at&limit=1000", { authenticated: true });
    const byId = new Map(state.students.map((item) => [item.id, item]));
    for (const item of remoteStudents) byId.set(item.id, item);
    state.students = [...byId.values()];
    saveStorage(STORAGE_KEYS.students, state.students);
    renderStudents();
    updateHomeStats();
  } catch (error) {
    console.error("Profil siswa Supabase tidak dapat dimuat.", error);
    $("#teacherAuthFeedback").textContent = `Hasil misi dimuat, tetapi profil cloud gagal dibaca: ${error.message}`;
  }
}
function setAuthFormState() {
  const loggedIn = state.teacherAuthenticated;
  $("#teacherEmail").hidden = loggedIn;
  $("#teacherPassword").hidden = loggedIn;
  $("#teacherAuthForm button[type=submit]").hidden = loggedIn;
  $("#teacherLogout").hidden = !loggedIn;
  if (!loggedIn) $("#teacherAuthFeedback").textContent = isCloudConfigured() ? "Login untuk memuat hasil cloud." : "Hubungkan Supabase melalui pengaturan di bawah.";
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
function exportRows() {
  return state.results.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((item) => [
    item.student_name || "", item.class_name || "", item.topic_name || getTopic(item.topic_id)?.name || "",
    `${item.correct || 0}/${item.total || 20}`, Math.round(Number(item.score || 0) / Math.max(1, Number(item.total || 20)) * 100),
    `Level ${item.level || 1}`, prettyDate(item.created_at || nowIso())
  ]);
}
function exportExcel() {
  const rows = [["Nama siswa", "Kelas", "Misi", "Jawaban benar", "Nilai (%)", "Level", "Tanggal"], ...exportRows()];
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")}`;
  downloadFile("math-adventure-hasil-siswa.csv", csv, "text/csv;charset=utf-8");
  showToast("File Excel (CSV) berhasil diunduh.");
}
function exportWord() {
  const rows = exportRows().map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Laporan Math Adventure</title><style>body{font-family:Arial,sans-serif}h1{color:#dc7950}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#fff1df}</style></head><body><h1>Laporan Hasil Math Adventure</h1><p>SD Negeri 020620 Binjai · Dicetak ${escapeHtml(prettyDate(nowIso()))}</p><table><thead><tr>${["Nama siswa", "Kelas", "Misi", "Jawaban benar", "Nilai (%)", "Level", "Tanggal"].map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows || '<tr><td colspan="7">Belum ada hasil misi</td></tr>'}</tbody></table></body></html>`;
  downloadFile("math-adventure-hasil-siswa.doc", html, "application/msword;charset=utf-8");
  showToast("Dokumen Word berhasil diunduh.");
}
function exportPdf() {
  document.body.classList.add("teacher-print-authorized");
  $("#teacherDialog").classList.add("printing");
  window.print();
  $("#teacherDialog").classList.remove("printing");
  document.body.classList.remove("teacher-print-authorized");
}
async function runAuthorizedExport(button, exportAction) {
  button.disabled = true;
  try {
    if (!isCloudConfigured() || !(await refreshAuth())) {
      state.teacherAuthenticated = false;
      setAuthFormState();
      updateExportAccess();
      updateCloudStatus();
      throw new Error("Sesi guru tidak ditemukan atau sudah berakhir. Silakan login kembali.");
    }
    await supabaseRequest("/rest/v1/app_results?select=id&limit=1", { authenticated: true });
    state.teacherAuthenticated = true;
    setAuthFormState();
    updateExportAccess();
    updateCloudStatus();
    exportAction();
  } catch (error) {
    console.error("Ekspor ditolak karena sesi guru tidak dapat diverifikasi.", error);
    state.teacherAuthenticated = false;
    setAuthFormState();
    updateExportAccess();
    updateCloudStatus();
    $("#teacherAuthFeedback").textContent = error.message;
    showToast(`Unduhan hanya tersedia untuk guru yang sudah login. ${error.message}`);
  } finally {
    button.disabled = false;
  }
}

$("#studentSelect").addEventListener("change", (event) => {
  state.activeStudentId = event.target.value;
  localStorage.setItem("mathAdventure.activeStudent.v1", state.activeStudentId);
  renderStudents();
});
$("#addStudentButton").addEventListener("click", () => openDialog(dialogs.student));
$("#studentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = String(formData.get("name") || "").trim();
  const className = String(formData.get("className") || "").trim();
  if (!name) return showToast("Nama siswa belum diisi.");
  const student = { id: safeId(), name, class_name: className, created_at: nowIso() };
  state.students.push(student);
  state.activeStudentId = student.id;
  saveStorage(STORAGE_KEYS.students, state.students);
  localStorage.setItem("mathAdventure.activeStudent.v1", student.id);
  renderAll();
  event.currentTarget.reset();
  closeDialog(dialogs.student);
  showToast(`Selamat datang, ${student.name}!`);
  syncStudent(student);
});
$("#soundToggle").addEventListener("click", () => {
  state.audio = !state.audio;
  localStorage.setItem(STORAGE_KEYS.audio, state.audio ? "on" : "off");
  updateAudioButton();
});
$("#teacherButton").addEventListener("click", async () => {
  setAuthFormState();
  renderDashboard();
  openDialog(dialogs.teacher);
  if (isCloudConfigured() && state.auth?.access_token) await loadCloudRecords();
});
$("#closeTeacher").addEventListener("click", () => closeDialog(dialogs.teacher));
$("#exitGame").addEventListener("click", () => {
  if (state.game && state.game.index > 0) {
    if (!window.confirm("Keluar dari permainan? Progres misi ini tidak akan disimpan.")) return;
  }
  state.game = null;
  closeDialog(dialogs.game);
});
$("#resultDone").addEventListener("click", () => closeDialog(dialogs.result));
$("#openCloudSettings").addEventListener("click", () => {
  $("#supabaseUrl").value = state.settings.url || "";
  $("#supabaseKey").value = state.settings.key || "";
  $("#settingsFeedback").textContent = "";
  openDialog(dialogs.settings);
});
$("#settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = $("#supabaseUrl").value.trim().replace(/\/+$/, "");
  const key = $("#supabaseKey").value.trim();
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
      throw new Error("URL harus berupa alamat HTTPS proyek Supabase, misalnya https://proyek-anda.supabase.co.");
    }
    if (!key) throw new Error("Anon / publishable key belum diisi.");
    state.settings = { url, key };
    state.auth = null;
    state.teacherAuthenticated = false;
    saveStorage(STORAGE_KEYS.settings, state.settings);
    saveStorage(STORAGE_KEYS.auth, null);
    updateExportAccess();
    updateCloudStatus();
    setAuthFormState();
    $("#settingsFeedback").textContent = "Pengaturan tersimpan. Cloud akan digunakan untuk hasil misi berikutnya.";
    showToast("Pengaturan Supabase tersimpan di browser ini.");
  } catch (error) {
    $("#settingsFeedback").textContent = error.message;
    $("#settingsFeedback").style.color = "#bd6557";
  }
});
$("#showSetupInstructions").addEventListener("click", () => openDialog(dialogs.instructions));
$("#teacherAuthForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isCloudConfigured()) {
    $("#teacherAuthFeedback").textContent = "Masukkan konfigurasi Supabase terlebih dahulu.";
    return;
  }
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  $("#teacherAuthFeedback").textContent = "Menghubungkan akun guru…";
  try {
    await signInTeacher($("#teacherEmail").value.trim(), $("#teacherPassword").value);
  } catch (error) {
    console.error("Login Supabase gagal.", error);
    $("#teacherAuthFeedback").textContent = `Login gagal: ${error.message}`;
  } finally {
    button.disabled = false;
    $("#teacherPassword").value = "";
  }
});
$("#teacherLogout").addEventListener("click", () => {
  if (state.auth?.access_token) {
    fetch(`${state.settings.url.replace(/\/+$/, "")}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: state.settings.key, Authorization: `Bearer ${state.auth.access_token}` }
    }).catch((error) => console.error("Sesi Supabase tidak dapat ditutup di server.", error));
  }
  state.auth = null;
  state.teacherAuthenticated = false;
  saveStorage(STORAGE_KEYS.auth, null);
  setAuthFormState();
  updateExportAccess();
  updateCloudStatus();
  showToast("Kamu sudah keluar dari dashboard cloud.");
});
$("#exportExcel").addEventListener("click", (event) => runAuthorizedExport(event.currentTarget, exportExcel));
$("#exportWord").addEventListener("click", (event) => runAuthorizedExport(event.currentTarget, exportWord));
$("#exportPdf").addEventListener("click", (event) => runAuthorizedExport(event.currentTarget, exportPdf));
$("#clearLocalData").addEventListener("click", () => {
  if (!window.confirm("Hapus semua data siswa dan hasil misi yang tersimpan di perangkat ini? Data Supabase tidak akan dihapus.")) return;
  state.students = [];
  state.results = [];
  state.activeStudentId = "";
  saveStorage(STORAGE_KEYS.students, state.students);
  saveStorage(STORAGE_KEYS.results, state.results);
  localStorage.removeItem("mathAdventure.activeStudent.v1");
  renderAll();
  showToast("Data lokal di perangkat ini sudah dihapus.");
});
for (const dialog of Object.values(dialogs)) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("close", () => {
    if (!Object.values(dialogs).some((item) => item.open)) document.body.classList.remove("dialog-open");
  });
}

updateAudioButton();
renderAll();
setAuthFormState();
