// --- Click sound (tries local file, fallback to web-audio beep) ---
function playClick() {
  try {
    const audio = new Audio('sounds/click.ogg');
    audio.volume = 0.8;
    audio.play().catch(() => {
      // ignore autoplay block
    });
  } catch (e) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 650;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 80);
    } catch (err) { /* ignore */ }
  }
}

// --- Background music ---
const bgMusic = new Audio('sounds/bg-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.28;

// --- Start button logic ---
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btns = document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');

startBtn.addEventListener('click', () => {
  // try play music (might be blocked until user interacts)
  bgMusic.play().catch(() => { /* autoplay blocked — fine */ });

  // enable and animate buttons with a stagger
  btns.forEach((btn, i) => {
    setTimeout(() => {
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    }, 110 * i + 60);
  });

  // visually hide overlay
  startOverlay.classList.add('hidden');
  setTimeout(() => { startOverlay.style.display = 'none'; }, 360);

  // quick speed-up effect for logo (temporarily speed animation)
  const comp = getComputedStyle(logo);
  const prevDur = comp.animationDuration || '10s';
  logo.style.animationDuration = '0.6s';
  setTimeout(() => {
    logo.style.animationDuration = prevDur;
  }, 700);
});

// --- particles.js config (in case script.js loaded before inline config) ---
// (index.html also initializes particles with config — this is a safe no-op)
if (typeof particlesJS === 'function') {
  // nothing here — config in index.html ensures initialization
}
