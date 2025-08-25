// --- Click sound with pitch randomizer ---
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 0.9 + Math.random() * 0.25; // random pitch
    audio.play().catch(() => {});
  } catch (e) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 600 + Math.random() * 120; // random pitch
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 90);
    } catch (err) {}
  }
}

// --- Background music ---
const bgMusic = new Audio('sounds/bg-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.28;

// --- Elements ---
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btns = document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');

// --- Helper: finish loading ---
function finishLoading(skip = false) {
  if (!loadingScreen.classList.contains('active')) return;

  // instantly finish bar if skipping
  if (skip) loadingFill.style.width = "100%";

  setTimeout(() => {
    loadingScreen.classList.remove('active');

    // Start background music
    bgMusic.play().catch(() => {});

    // Enable & animate buttons
    btns.forEach((btn, i) => {
      setTimeout(() => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, 120 * i + 80);
    });

    // Quick logo spin burst
    const comp = getComputedStyle(logo);
    const prevDur = comp.animationDuration || '10s';
    logo.style.animationDuration = '0.6s';
    setTimeout(() => { logo.style.animationDuration = prevDur; }, 700);
  }, skip ? 300 : 400);
}

// --- Run Button Logic ---
startBtn.addEventListener('click', () => {
  playClick();

  // Hide overlay
  startOverlay.classList.add('hidden');
  setTimeout(() => { startOverlay.style.display = 'none'; }, 360);

  // Show loading
  loadingScreen.classList.add('active');

  // Animate fake loading progress
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += Math.random() * 18; // random speed chunks
    if (progress >= 100) progress = 100;
    loadingFill.style.width = progress + "%";

    if (progress >= 100) {
      clearInterval(loadingInterval);
      finishLoading(false);
    }
  }, 300);
});

// --- Skip loading screen if user taps/clicks anywhere ---
if (loadingScreen) {
  loadingScreen.addEventListener("click", () => finishLoading(true));
  loadingScreen.addEventListener("touchstart", () => finishLoading(true));
}

// --- particles.js safe init ---
if (typeof particlesJS === 'function') {
  // config already in index.html
}
