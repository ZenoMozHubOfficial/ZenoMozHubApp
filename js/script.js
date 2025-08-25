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
    logoImg.style.animation
