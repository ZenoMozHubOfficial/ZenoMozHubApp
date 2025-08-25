// ==========================
// script.js (ZenoMoz Hub)
// ==========================

// --- Click sound (tries local file, fallback to web-audio beep) ---
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => { /* ignore autoplay block */ });
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
    } catch (err) { /* ignore fallback fail */ }
  }
}

// --- Background music ---
let bgMusic;
try {
  bgMusic = new Audio('sounds/bg-music.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.28;
} catch (err) {
  console.warn("Background music failed to load:", err);
}

// ==========================
// MAIN APP LOGIC
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const btns = document.querySelectorAll('.buttons .btn');
  const logo = document.querySelector('.logo img');

  if (!startBtn || !startOverlay) {
    console.error("Start button or overlay not found!");
    return;
  }

  // --- Start button click ---
  startBtn.addEventListener('click', () => {
    playClick();

    // Try play music (user interaction should allow it)
    if (bgMusic) {
      bgMusic.play().catch(() => { /* ignored if blocked */ });
    }

    // Enable and animate buttons with staggered reveal
    btns.forEach((btn, i) => {
      setTimeout(() => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, 110 * i + 60);
    });

    // Visually hide overlay
    startOverlay.classList.add('hidden');
    setTimeout(() => { startOverlay.style.display = 'none'; }, 360);

    // Logo "speed burst" spin
    const prevDur = getComputedStyle(logo).animationDuration || '10s';
    logo.style.animationDuration = '0.6s';
    setTimeout(() => { logo.style.animationDuration = prevDur; }, 700);
  });

  // --- Extra: Button ripple effect ---
  btns.forEach(btn => {
    btn.addEventListener('click', e => {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = e.offsetX + "px";
      ripple.style.top = e.offsetY + "px";
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  console.log("✅ ZenoMoz Hub initialized");
});

// --- particles.js safeguard (in case config missing inline) ---
if (typeof particlesJS === "function") {
  // Safe no-op: config already in index.html
}
