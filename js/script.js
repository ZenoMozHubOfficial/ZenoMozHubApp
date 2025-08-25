(() => {
  "use strict";

  // ---------------------------------------------
  // Utilities
  // ---------------------------------------------
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Throttle using rAF (for mousemove)
  const withRaf = (fn) => {
    let ticking = false;
    return function (...args) {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          fn.apply(this, args);
          ticking = false;
        });
        ticking = true;
      }
    };
  };

  // ---------------------------------------------
  // Audio: click + bg music
  // ---------------------------------------------
  let clickAudio;
  try {
    clickAudio = new Audio("sounds/click.mp3");
    clickAudio.volume = 0.8;
  } catch (_) {
    clickAudio = null;
  }

  function playClick() {
    // If local file fails (autoplay), fall back to a tiny web-audio beep
    if (clickAudio) {
      clickAudio.currentTime = 0;
      clickAudio.play().catch(() => fallbackBeep());
    } else {
      fallbackBeep();
    }
  }

  function fallbackBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 650;
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 80);
    } catch (_) {}
  }

  const bgMusic = (() => {
    let a = null;
    try {
      a = new Audio("sounds/bg-music.mp3");
      a.loop = true;
      a.volume = 0.28;
    } catch (_) {}
    return a;
  })();

  const music = {
    playing: false,
    async play() {
      if (!bgMusic) return;
      try {
        await bgMusic.play();
        this.playing = true;
      } catch (_) {
        // autoplay blocked until user interacts more—ignore
      }
    },
    pause() {
      if (!bgMusic) return;
      bgMusic.pause();
      this.playing = false;
    },
    fadeTo(target = 0.28, ms = 600) {
      if (!bgMusic) return;
      const start = bgMusic.volume;
      const delta = target - start;
      if (delta === 0) return;
      const startAt = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - startAt) / ms);
        bgMusic.volume = start + delta * p;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  };

  // Pause/resume bg music when tab hidden/visible
  document.addEventListener("visibilitychange", () => {
    if (!bgMusic) return;
    if (document.hidden) music.fadeTo(0.0, 300);
    else if (music.playing) music.fadeTo(0.28, 300);
  });

  // ---------------------------------------------
  // DOM refs
  // ---------------------------------------------
  const startOverlay = $("#start-overlay");
  const startBtn = $("#start-btn");
  const buttons = $$(".buttons .btn");
  const logoImg = $(".logo img");

  // Guard if essential nodes are missing
  if (!startOverlay || !startBtn) {
    console.warn("start overlay or button not found");
    return;
  }

  // ---------------------------------------------
  // Unlock sequence on START
  // ---------------------------------------------
  let started = false;

  function hideOverlay() {
    startOverlay.classList.add("hidden");
    // After CSS opacity transition, remove from layout
    setTimeout(() => { startOverlay.style.display = "none"; }, 360);
  }

  function speedBurstLogo() {
    if (!logoImg) return;
    const prevDur = getComputedStyle(logoImg).animationDuration || "10s";
    logoImg.style.animationDuration = "0.6s";
    setTimeout(() => { logoImg.style.animationDuration = prevDur; }, 700);
  }

  function unlockButtonsStaggered() {
    buttons.forEach((btn, i) => {
      setTimeout(() => {
        // Add active class (CSS handles animations/opacity/pointer-events)
        btn.classList.add("active");
        // Extra fail-safe in case custom CSS differs
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
        btn.style.transform = "translateY(0)";
        if (!prefersReducedMotion) {
          btn.style.animation = `fadeInUp 0.6s forwards, btnFloat 4s ease-in-out infinite, neonPulse 6s ease-in-out infinite`;
        }
      }, 110 * i + 60);
    });
  }

  async function onStart() {
    if (started) return;
    started = true;

    playClick();
    await music.play();
    music.fadeTo(0.28, 600);

    unlockButtonsStaggered();
    hideOverlay();
    speedBurstLogo();
  }

  // Mouse + keyboard activation for Start
  startBtn.addEventListener("click", onStart);
  startBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onStart();
    }
  });

  // ---------------------------------------------
  // Button FX: click ripple + magnetic hover + sounds
  // ---------------------------------------------

  // Ripple — JS-driven so the ripple originates at the pointer
  function attachRipple(btn) {
    btn.style.position = btn.style.position || "relative";
    btn.style.overflow = "hidden";

    const spawnRipple = (x, y) => {
      const rect = btn.getBoundingClientRect();
      const r = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      Object.assign(ripple.style, {
        position: "absolute",
        left: `${x - rect.left - r / 2}px`,
        top: `${y - rect.top - r / 2}px`,
        width: `${r}px`,
        height: `${r}px`,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.28)",
        transform: "scale(0)",
        opacity: "0.9",
        pointerEvents: "none",
        filter: "blur(0.5px)",
        transition: "transform 600ms ease, opacity 600ms ease"
      });
      btn.appendChild(ripple);
      // Kick off
      requestAnimationFrame(() => {
        ripple.style.transform = "scale(1.2)";
        ripple.style.opacity = "0";
      });
      // Cleanup
      setTimeout(() => ripple.remove(), 650);
    };

    btn.addEventListener("click", (e) => {
      spawnRipple(e.clientX, e.clientY);
    });

    // Touch ripple
    btn.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      if (t) spawnRipple(t.clientX, t.clientY);
    }, { passive: true });
  }

  // Magnetic hover — disabled for touch and reduced motion
  function attachMagnetic(btn) {
    if (prefersReducedMotion || isTouch()) return;

    const handleMove = withRaf((e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rx = (y / 25).toFixed(2);
      const ry = (x / -25).toFixed(2);
      btn.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
    });

    const reset = () => {
      btn.style.transform = "translateY(0) rotateX(0) rotateY(0) scale(1)";
    };

    btn.addEventListener("mousemove", handleMove);
    btn.addEventListener("mouseleave", reset);
    // In case it's focused via keyboard and then mouse leaves
    btn.addEventListener("blur", reset);
  }

  // Click sounds for all .btn
  function attachClickSound(btn) {
    btn.addEventListener("click", playClick);
    // Keyboard activation
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        playClick();
      }
    });
  }

  // Apply FX to each button
  buttons.forEach((btn) => {
    attachRipple(btn);
    attachMagnetic(btn);
    attachClickSound(btn);
  });

  // ---------------------------------------------
  // Optional: elevate "special" buttons with rumble
  // Usage: add class="btn rumble" in your HTML
  // ---------------------------------------------
  if (!prefersReducedMotion) {
    buttons.forEach((btn) => {
      if (btn.classList.contains("rumble")) {
        // Let CSS handle rumble on :hover; JS noop here for clarity
      }
    });
  }

  // ---------------------------------------------
  // Particles.js (safe no-op guard)
  // ---------------------------------------------
  if (typeof particlesJS === "function") {
    // Assume config is initialized in HTML. Nothing to do here.
  }

  // ---------------------------------------------
  // Accessibility niceties
  // ---------------------------------------------
  // Focus outline is visually removed in CSS; add a custom focus ring for keyboard users
  let hadKeyboardEvent = false;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
      hadKeyboardEvent = true;
      document.documentElement.classList.add("user-is-tabbing");
    }
  }, true);

  document.addEventListener("mousedown", () => {
    hadKeyboardEvent = false;
    document.documentElement.classList.remove("user-is-tabbing");
  }, true);

  // Add a minimal focus style when navigating via keyboard
  const style = document.createElement("style");
  style.textContent = `
    .user-is-tabbing .btn:focus,
    .user-is-tabbing #start-btn:focus,
    .user-is-tabbing .corner-btn:focus {
      outline: 2px solid rgba(255,51,51,0.85) !important;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px rgba(0,0,0,0.6);
    }
  `;
  document.head.appendChild(style);

})();  function playClick() {
    // If local file fails (autoplay), fall back to a tiny web-audio beep
    if (clickAudio) {
      clickAudio.currentTime = 0;
      clickAudio.play().catch(() => fallbackBeep());
    } else {
      fallbackBeep();
    }
  }

  function fallbackBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 650;
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 80);
    } catch (_) {}
  }

  const bgMusic = (() => {
    let a = null;
    try {
      a = new Audio("sounds/bg-music.mp3");
      a.loop = true;
      a.volume = 0.28;
    } catch (_) {}
    return a;
  })();

  const music = {
    playing: false,
    async play() {
      if (!bgMusic) return;
      try {
        await bgMusic.play();
        this.playing = true;
      } catch (_) {
        // autoplay blocked until user interacts more—ignore
      }
    },
    pause() {
      if (!bgMusic) return;
      bgMusic.pause();
      this.playing = false;
    },
    fadeTo(target = 0.28, ms = 600) {
      if (!bgMusic) return;
      const start = bgMusic.volume;
      const delta = target - start;
      if (delta === 0) return;
      const startAt = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - startAt) / ms);
        bgMusic.volume = start + delta * p;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  };

  // Pause/resume bg music when tab hidden/visible
  document.addEventListener("visibilitychange", () => {
    if (!bgMusic) return;
    if (document.hidden) music.fadeTo(0.0, 300);
    else if (music.playing) music.fadeTo(0.28, 300);
  });

  // ---------------------------------------------
  // DOM refs
  // ---------------------------------------------
  const startOverlay = $("#start-overlay");
  const startBtn = $("#start-btn");
  const buttons = $$(".buttons .btn");
  const logoImg = $(".logo img");

  // Guard if essential nodes are missing
  if (!startOverlay || !startBtn) {
    console.warn("start overlay or button not found");
    return;
  }

  // ---------------------------------------------
  // Unlock sequence on START
  // ---------------------------------------------
  let started = false;

  function hideOverlay() {
    startOverlay.classList.add("hidden");
    // After CSS opacity transition, remove from layout
    setTimeout(() => { startOverlay.style.display = "none"; }, 360);
  }

  function speedBurstLogo() {
    if (!logoImg) return;
    const prevDur = getComputedStyle(logoImg).animationDuration || "10s";
    logoImg.style.animation
