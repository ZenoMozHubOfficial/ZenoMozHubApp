/* =============================
   script.js — stable + XP HUD
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

/* --- Change music --- */
function changeMusic(src) {
  playClick();
  bgMusic.pause();
  bgMusic = new Audio(src);
  bgMusic.loop = true;
  bgMusic.volume = 0.28;
  bgMusic.play().catch(() => {});
  if (typeof connectVisualizer === 'function') {
    try { connectVisualizer(bgMusic); } catch(e){}
  }
}

/* --- DOM elements --- */
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btns = document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const loadingPercent = document.querySelector('.loading-percent');

/* --- Music Visualizer --- */
const canvas = document.getElementById('music-visualizer');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = 120;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let source;

function connectVisualizer(audio) {
  try {
    if (source) source.disconnect();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256; // Higher resolution
    renderVisualizer();
    pulseElements();
  } catch (e) {
    // some browsers throw if reused; tolerate it
    console.warn('connectVisualizer error', e);
  }
}

/* --- Render Visualizer --- */
let visualizerRunning = false;
function renderVisualizer() {
  if (!ctx || !analyser) return;
  if (visualizerRunning === false) visualizerRunning = true;
  requestAnimationFrame(renderVisualizer);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / bufferLength) * 2;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i];

    const hue = (i * 3 + Date.now() * 0.05) % 360;
    ctx.fillStyle = `hsl(${hue},100%,50%)`;

    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;

    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }

  // wave line
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < bufferLength; i++) {
    const y = canvas.height / 2 - (dataArray[i] / 3);
    const x = (i / bufferLength) * canvas.width;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* --- Pulse Buttons & Logo to Music --- */
let pulseRunning = false;
function pulseElements() {
  if (!analyser) return;
  if (pulseRunning === false) pulseRunning = true;
  requestAnimationFrame(pulseElements);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const bass = dataArray.slice(0, 10).reduce((a,b)=>a+b,0)/10;

  btns.forEach(btn => {
    const scale = 1 + bass/400;
    // do not override the pressed transform (hold)
    if (!btn.dataset.pressed) btn.style.transform = `scale(${scale})`;
  });

  const logoScale = 1 + bass/600;
  if (logo) logo.style.transform = `rotate(${Date.now()*0.06}deg) scale(${logoScale})`;
}

/* --- Loading Screen --- */
let loadingProgress = 0;
let loadingInterval;

function startLoading() {
  if (loadingScreen) loadingScreen.classList.add('active');
  loadingProgress = 0;
  if (loadingFill) loadingFill.style.width = '0%';
  if (loadingPercent) loadingPercent.textContent = '0%';

  const loadingMessages = [
    "Booting modules...",
    "Connecting ZenoMoz Core...",
    "Injecting scripts...",
    "Almost ready..."
  ];
  let msgIndex = 0;
  const loadingText = document.querySelector('.loading-text');

  loadingInterval = setInterval(() => {
    loadingProgress += Math.random() * 18;
    if (loadingProgress >= 100) loadingProgress = 100;
    if (loadingFill) loadingFill.style.width = loadingProgress + "%";
    if (loadingPercent) loadingPercent.textContent = Math.floor(loadingProgress) + "%";

    if (loadingText) {
      loadingText.textContent = loadingMessages[msgIndex];
      msgIndex = (msgIndex + 1) % loadingMessages.length;
    }

    if (loadingProgress >= 100) finishLoading();
  }, 200);
}

function finishLoading() {
  clearInterval(loadingInterval);
  if (loadingFill) loadingFill.style.width = "100%";
  if (loadingPercent) loadingPercent.textContent = "100%";

  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.remove('active');
    bgMusic.play().catch(() => {});
    if (audioCtx.state === 'suspended') audioCtx.resume();
    connectVisualizer(bgMusic);

    btns.forEach((btn, i) => {
      setTimeout(() => btn.classList.add('active'), i * 120);
    });

    if (logo) {
      logo.style.animationDuration = '0.6s';
      setTimeout(() => { logo.style.animationDuration = '10s'; }, 700);
    }
  }, 400);
}

/* --- Start Button --- */
if (startBtn) startBtn.addEventListener('click', () => {
  playClick();
  if (startOverlay) startOverlay.classList.add('hidden');
  setTimeout(() => { if (startOverlay) startOverlay.style.display = 'none'; }, 400);
  startLoading();
});

/* --- Skip Loading --- */
if (loadingScreen) loadingScreen.addEventListener('click', finishLoading);
if (loadingScreen) loadingScreen.addEventListener('touchstart', finishLoading);

/* --- Button hold/tap scale (preserve press state) --- */
btns.forEach(btn => {
  btn.addEventListener('mousedown', () => { btn.dataset.pressed = 'true'; btn.style.transform = 'scale(1.12)'; });
  btn.addEventListener('mouseup', () => { btn.dataset.pressed = ''; btn.style.transform = ''; });
  btn.addEventListener('mouseleave', () => { btn.dataset.pressed = ''; btn.style.transform = ''; });
  btn.addEventListener('touchstart', () => { btn.dataset.pressed = 'true'; btn.style.transform = 'scale(1.12)'; }, {passive:true});
  btn.addEventListener('touchend', () => { btn.dataset.pressed = ''; btn.style.transform = ''; }, {passive:true});
});

/* --- Particles.js safe init --- */
if (typeof particlesJS === 'function') {
  // already initialized in HTML bottom script
}

/* ============================
   XP + Level System (mobile-safe)
   ============================ */

/* Load saved values or defaults */
let xp = parseInt(localStorage.getItem("zmh_xp")) || 0;
let level = parseInt(localStorage.getItem("zmh_level")) || 1;
const maxLevel = 10000;

/* DOM Elements for HUD */
const levelDisplay = document.getElementById("level-display");
const xpFill = document.getElementById("xp-fill");
const xpText = document.getElementById("xp-text");

/* XP needed formula */
function xpNeededForLevel(lvl) {
  return 100 + (lvl - 1) * 20;
}

/* Save progress */
function saveProgress() {
  try {
    localStorage.setItem("zmh_xp", String(xp));
    localStorage.setItem("zmh_level", String(level));
  } catch(e) {}
}

/* Update HUD and handle level ups (handles multiple level-ups at once) */
function updateHUD() {
  if (!xpFill || !levelDisplay || !xpText) return;

  // handle level ups
  let needed = xpNeededForLevel(level);
  while (xp >= needed && level < maxLevel) {
    xp -= needed;
    level++;
    needed = xpNeededForLevel(level);
  }
  if (level >= maxLevel) {
    level = maxLevel;
    xp = Math.min(xp, xpNeededForLevel(level));
  }

  const percent = Math.floor((xp / xpNeededForLevel(level)) * 100);
  xpFill.style.width = percent + "%";
  levelDisplay.textContent = level;
  xpText.textContent = `${xp} / ${xpNeededForLevel(level)} XP`;

  saveProgress();
}

/* Add XP safely */
function addXP(amount) {
  if (typeof amount !== 'number' || amount <= 0) return;
  xp += Math.floor(amount);
  updateHUD();
}

/* Idle XP - 1 XP per second while page open */
let idleInterval = setInterval(() => {
  addXP(1);
}, 1000);

/* Button XP: default +5, +100 for social-like buttons */
/* We'll treat buttons that have class 'social' or a data attribute data-social as social */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    let reward = 5;
    if (btn.classList.contains('social') || btn.dataset.social === 'true') reward = 100;
    addXP(reward);
  });
});

/* initialize HUD display right away */
updateHUD();

/* Auto-resume audio context on user click (mobile webview gesture) */
document.addEventListener('click', function __zmh_resume() {
  try {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch(e){}
}, {once: true});

/* Expose helpers for debugging in console (optional) */
window.zmh = window.zmh || {};
window.zmh.addXP = addXP;
window.zmh.getProgress = () => ({ xp, level });// Burger Menu Toggle
document.getElementById("burger-menu").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("active");
});

// Redeem Overlay Open/Close
function openRedeem() {
  document.getElementById("redeem-overlay").classList.add("active");
  particlesJS("redeem-particles", {
    "particles": {
      "number": { "value": 120 },
      "color": { "value": "#ff3333" },
      "shape": { "type": "circle" },
      "opacity": { "value": 0.5 },
      "size": { "value": 3 },
      "line_linked": { "enable": true, "distance": 150, "color": "#ff3333", "opacity": 0.4, "width": 1 },
      "move": { "enable": true, "speed": 1.2 }
    },
    "interactivity": { "events": { "onhover": { "enable": true, "mode": "repulse" } } },
    "retina_detect": true
  });
}

function closeRedeem() {
  document.getElementById("redeem-overlay").classList.remove("active");
}

// Redeem Codes
const codes = {
  "JustAl3xHere": { xp: 600 },
  "ZenoMozHub": { level: 5 },
  "SkyeMozScriptz": { xp: 8000 },
  "LimLimLemonMyAss": { xp: 50 },
  "2025Code": { xp: 2025 }
};

function redeemCode() {
  const input = document.getElementById("redeem-input").value.trim();
  const msg = document.getElementById("redeem-message");

  if (codes[input]) {
    let reward = codes[input];
    if (reward.xp) {
      msg.textContent = `✅ Code redeemed! You got +${reward.xp} XP!`;
    } else if (reward.level) {
      msg.textContent = `✅ Code redeemed! You unlocked Level ${reward.level}!`;
    }
  } else {
    msg.textContent = "❌ Invalid code.";
  }
}
