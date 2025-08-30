/* =============================
   script.js — stable + XP HUD + Theme System
   ============================= */

/* --- Click sound --- */
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 0.9 + Math.random() * 0.25;
    audio.play().catch(() => {});
  } catch (e) {}
}

/* --- Background music --- */
let bgMusic = new Audio('sounds/bg-music1.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.28;

/* --- DOM elements --- */
const btns = document.querySelectorAll('.buttons .btn');
const title = document.getElementById('title');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const loadingPercent = document.querySelector('.loading-percent');

/* --- Music Visualizer --- */
const canvas = document.getElementById('music-visualizer');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = 120;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let source;

function connectVisualizer(audio) {
  if (source) source.disconnect();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 256;
  renderVisualizer();
}

function renderVisualizer() {
  requestAnimationFrame(renderVisualizer);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / bufferLength) * 2;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i];
    ctx.fillStyle = currentThemeColor;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

/* ============================
   XP + Level System
   ============================ */
let xp = parseInt(localStorage.getItem("zmh_xp")) || 0;
let level = parseInt(localStorage.getItem("zmh_level")) || 1;
const maxLevel = 10000;

const levelDisplay = document.getElementById("level-display");
const xpFill = document.getElementById("xp-fill");
const xpText = document.getElementById("xp-text");

function xpNeededForLevel(lvl) {
  return 100 + (lvl - 1) * 20;
}
function saveProgress() {
  localStorage.setItem("zmh_xp", xp);
  localStorage.setItem("zmh_level", level);
}
function updateHUD() {
  let needed = xpNeededForLevel(level);
  while (xp >= needed && level < maxLevel) {
    xp -= needed;
    level++;
    needed = xpNeededForLevel(level);
  }
  const percent = Math.floor((xp / needed) * 100);
  xpFill.style.width = percent + "%";
  levelDisplay.textContent = level;
  xpText.textContent = `${xp} / ${needed} XP`;
  saveProgress();
}
function addXP(amount) {
  xp += amount;
  updateHUD();
}
setInterval(() => { addXP(1); }, 1000);
btns.forEach(btn => btn.addEventListener('click', () => addXP(5)));
updateHUD();

/* ============================
   Theme System
   ============================ */
const themes = {
  red: "#ff3333",
  purple: "#9b59b6",
  blue: "#3498db",
  green: "#2ecc71",
  gold: "#f1c40f",
  pink: "#ff66cc",
  cyan: "#00ffff"
};
let currentTheme = localStorage.getItem("zmh_theme") || "red";
let currentThemeColor = themes[currentTheme];

function applyTheme(theme) {
  currentTheme = theme;
  currentThemeColor = themes[theme];
  localStorage.setItem("zmh_theme", theme);

  // Change UI
  title.style.color = currentThemeColor;
  title.style.textShadow = `0 0 20px ${currentThemeColor}`;
  btns.forEach(btn => {
    btn.style.background = currentThemeColor;
    btn.style.boxShadow = `0 0 12px ${currentThemeColor}`;
  });
  xpFill.style.background = currentThemeColor;
  document.querySelector('.loading-fill').style.background = currentThemeColor;

  // Update particles
  particlesJS("particles-js", {
    particles: {
      number: { value: 80 },
      color: { value: currentThemeColor },
      shape: { type: "circle" },
      opacity: { value: 0.5 },
      size: { value: 3 },
      line_linked: { enable: true, color: currentThemeColor, opacity: 0.4 },
      move: { enable: true, speed: 2 }
    }
  });
}

// Hook theme buttons
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    playClick();
    applyTheme(btn.dataset.theme);
  });
});

// Apply saved theme
applyTheme(currentTheme);

/* --- Loading Screen --- */
let loadingProgress = 0;
let loadingInterval;
function startLoading() {
  loadingProgress = 0;
  loadingInterval = setInterval(() => {
    loadingProgress += Math.random() * 18;
    if (loadingProgress >= 100) loadingProgress = 100;
    loadingFill.style.width = loadingProgress + "%";
    loadingPercent.textContent = Math.floor(loadingProgress) + "%";
    if (loadingProgress >= 100) finishLoading();
  }, 200);
}
function finishLoading() {
  clearInterval(loadingInterval);
  loadingFill.style.width = "100%";
  loadingPercent.textContent = "100%";
  setTimeout(() => {
    loadingScreen.style.display = "none";
    bgMusic.play().catch(() => {});
    if (audioCtx.state === 'suspended') audioCtx.resume();
    connectVisualizer(bgMusic);
  }, 400);
}
window.addEventListener("load", () => startLoading());
