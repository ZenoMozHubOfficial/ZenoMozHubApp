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
  canvas.height = 80;
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

// --- Loading logic ---
let loadingProgress = 0;
let loadingInterval;

function startLoading() {
  loadingScreen.classList.add('active');
  loadingProgress = 0;
  loadingInterval = setInterval(() => {
    loadingProgress += Math.random() * 18;
    if (loadingProgress >= 100) loadingProgress = 100;
    loadingFill.style.width = loadingProgress + "%";
    loadingPercent.textContent = Math.floor(loadingProgress) + "%";
    if (loadingProgress >= 100) finishLoading();
  }, 300);
}

// --- Finish loading ---
function finishLoading() {
  clearInterval(loadingInterval);
  loadingFill.style.width = "100%";
  loadingPercent.textContent = "100%";

  setTimeout(() => {
    loadingScreen.classList.remove('active');

    // Play bg music
    bgMusic.play().catch(() => {});
    connectVisualizer(bgMusic);

    // Animate buttons in
    btns.forEach((btn, i) => {
      setTimeout(() => {
        btn.classList.add('active');
      }, i * 120);
    });

    // Logo burst spin
    logo.style.animationDuration = '0.6s';
    setTimeout(() => {
      logo.style.animationDuration = '10s';
    }, 700);
  }, 400);
}

// --- Start button ---
startBtn.addEventListener('click', () => {
  playClick();
  startOverlay.classList.add('hidden');
  setTimeout(() => { startOverlay.style.display = 'none'; }, 400);
  startLoading();
});

// --- Skip loading on tap ---
loadingScreen.addEventListener('click', finishLoading);
loadingScreen.addEventListener('touchstart', finishLoading);

// --- Buttons hold/tap zoom effect ---
btns.forEach(btn => {
  let zoomInterval;
  const startZoom = () => {
    let scale = 1;
    zoomInterval = setInterval(() => {
      if (scale < 1.15) scale += 0.01;
      const current = btn.style.transform.replace(/scale\([^)]+\)/, '').trim();
      btn.style.transform = `${current} scale(${scale})`;
    }, 16);
  };
  const stopZoom = () => {
    clearInterval(zoomInterval);
    const current = btn.style.transform.replace(/scale\([^)]+\)/, '').trim();
    btn.style.transform = `${current} scale(1)`;
  };
  btn.addEventListener('mousedown', startZoom);
  btn.addEventListener('mouseup', stopZoom);
  btn.addEventListener('mouseleave', stopZoom);
  btn.addEventListener('touchstart', startZoom);
  btn.addEventListener('touchend', stopZoom);
});

// --- particles.js safe init ---
if (typeof particlesJS === 'function') {}
