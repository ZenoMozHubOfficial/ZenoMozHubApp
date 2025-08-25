// --- Click sound ---
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 0.9 + Math.random() * 0.25;
    audio.play().catch(() => {});
  } catch (e) { /* fallback */ }
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

// --- Elements ---
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
  canvas.height = 80; // visualizer height
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
  analyser.fftSize = 128;
  renderFrame();
}

function renderFrame() {
  requestAnimationFrame(renderFrame);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] / 2;
    ctx.fillStyle = `rgb(255,50,50)`;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

// --- Finish loading ---
function finishLoading(skip = false) {
  clearInterval(window.loadingInterval);
  loadingFill.style.width = "100%";
  loadingPercent.textContent = "100%";

  setTimeout(() => {
    loadingScreen.classList.remove('active');
    bgMusic.play().catch(() => {});

    // Animate buttons with stagger
    btns.forEach((btn, i) => {
      setTimeout(() => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0) scale(1)'; // ensure
