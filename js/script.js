// --- Click sound ---
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 0.9 + Math.random() * 0.25;
    audio.play().catch(() => {});
  } catch (e) {}
}

// --- Background music ---
let bgMusic = new Audio('sounds/bg-music1.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.28;

// --- Change music ---
function changeMusic(src) {
  playClick();
  bgMusic.pause();
  bgMusic = new Audio(src);
  bgMusic.loop = true;
  bgMusic.volume = 0.28;
  bgMusic.play().catch(() => {});
  if (audioCtx) connectVisualizer(bgMusic);
}

// --- DOM elements ---
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btns = document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const loadingPercent = document.querySelector('.loading-percent');

// --- Music Visualizer ---
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
  analyser.fftSize = 256; // Higher resolution
  renderVisualizer();
  pulseElements();
}

// --- Render Visualizer ---
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

    // Gradient color cycling
    const hue = (i * 3 + Date.now() * 0.05) % 360;
    ctx.fillStyle = `hsl(${hue},100%,50%)`;

    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;

    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }

  // Optional wave line
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

// --- Pulse Buttons & Logo to Music ---
function pulseElements() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const bass = dataArray.slice(0, 10).reduce((a,b)=>a+b)/10;

  btns.forEach(btn => {
    const scale = 1 + bass/400;
    btn.style.transform = `scale(${scale})`;
  });

  const logoScale = 1 + bass/600;
  logo.style.transform = `rotate(${Date.now()*0.06}deg) scale(${logoScale})`;

  requestAnimationFrame(pulseElements);
}

// --- Loading Screen ---
let loadingProgress = 0;
let loadingInterval;

function startLoading() {
  loadingScreen.classList.add('active');
  loadingProgress = 0;
  loadingFill.style.width = '0%';
  loadingPercent.textContent = '0%';

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
    loadingFill.style.width = loadingProgress + "%";
    loadingPercent.textContent = Math.floor(loadingProgress) + "%";

    // Update loading text
    loadingText.textContent = loadingMessages[msgIndex];
    msgIndex = (msgIndex + 1) % loadingMessages.length;

    if (loadingProgress >= 100) finishLoading();
  }, 200);
}

function finishLoading() {
  clearInterval(loadingInterval);
  loadingFill.style.width = "100%";
  loadingPercent.textContent = "100%";

  setTimeout(() => {
    loadingScreen.classList.remove('active');

    bgMusic.play().catch(() => {});

    if (audioCtx.state === 'suspended') audioCtx.resume();
    connectVisualizer(bgMusic);

    btns.forEach((btn, i) => {
      setTimeout(() => btn.classList.add('active'), i * 120);
    });

    // Logo burst spin
    logo.style.animationDuration = '0.6s';
    setTimeout(() => { logo.style.animationDuration = '10s'; }, 700);
  }, 400);
}

// --- Start Button ---
startBtn.addEventListener('click', () => {
  playClick();
  startOverlay.classList.add('hidden');
  setTimeout(() => startOverlay.style.display = 'none', 400);
  startLoading();
});

// --- Skip Loading ---
loadingScreen.addEventListener('click', finishLoading);
loadingScreen.addEventListener('touchstart', finishLoading);

// --- Button hold/tap scale ---
btns.forEach(btn => {
  btn.addEventListener('mousedown', () => btn.style.transform = 'scale(1.12)');
  btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
  btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
  btn.addEventListener('touchstart', () => btn.style.transform = 'scale(1.12)');
  btn.addEventListener('touchend', () => btn.style.transform = 'scale(1)');
});

// --- Particles.js safe init ---
if (typeof particlesJS === 'function') {}
