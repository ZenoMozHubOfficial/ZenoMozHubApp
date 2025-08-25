// --- Click sound with pitch randomizer ---
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 0.9 + Math.random() * 0.25;
    audio.play().catch(() => {});
  } catch (e) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 600 + Math.random() * 120;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 90);
    } catch (err) {}
  }
}

// --- Background music ---
let bgMusic = new Audio('sounds/bg-music1.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.28;

function changeMusic(src) {
  playClick();
  bgMusic.pause();
  bgMusic = new Audio(src);
  bgMusic.loop = true;
  bgMusic.volume = 0.28;
  bgMusic.play().catch(() => {});
}

// --- Elements ---
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btns = document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const loadingPercent = document.querySelector('.loading-percent');

// --- Finish loading function ---
function finishLoading(skip=false) {
  clearInterval(window.loadingInterval);
  loadingFill.style.width = "100%";
  loadingPercent.textContent = "100%";
  setTimeout(() => {
    loadingScreen.classList.remove('active');
    bgMusic.play().catch(() => {});
    btns.forEach((btn, i) => {
      setTimeout(() => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, 120 * i + 80);
    });
    const comp = getComputedStyle(logo);
    const prevDur = comp.animationDuration || '10s';
    logo.style.animationDuration = '0.6s';
    setTimeout(() => { logo.style.animationDuration = prevDur; }, 700);
  }, skip ? 0 : 400);
}

// --- Run Button Logic ---
startBtn.addEventListener('click', () => {
  playClick();
  startOverlay.classList.add('hidden');
  setTimeout(() => { startOverlay.style.display = 'none'; }, 360);

  loadingScreen.classList.add('active');

  let progress = 0;
  window.loadingInterval = setInterval(() => {
    progress += Math.random() * 18;
    if (progress >= 100) progress = 100;
    loadingFill.style.width = progress + "%";
    loadingPercent.textContent = Math.floor(progress) + "%";

    if (progress >= 100) {
      clearInterval(window.loadingInterval);
      setTimeout(() => { finishLoading(); }, 400);
    }
  }, 300);
});

// --- Skip loading screen on tap/click ---
loadingScreen.addEventListener("click", () => finishLoading(true));
loadingScreen.addEventListener("touchstart", () => finishLoading(true));

// --- particles.js safe init ---
if (typeof particlesJS === 'function') {
  // config already in index.html
}
