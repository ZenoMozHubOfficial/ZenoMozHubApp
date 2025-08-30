/* =============================
   script.js — single stable build
   - integrated XP/Level (localStorage)
   - redeem codes (one-time, localStorage)
   - burger/sidebar toggle (robust)
   - particles guards
   - audio + visualizer kept
   ============================= */

(function () {
  'use strict';

  /* -------------------------
     Helpers
  ------------------------- */
  function $(ids) {
    // Accept array of ids and return first found element or null
    for (const id of ids) {
      if (!id) continue;
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function safeGet(id) { return document.getElementById(id) || null; }

  function playClick() {
    try {
      const audio = new Audio('sounds/click.mp3');
      audio.volume = 0.8;
      audio.playbackRate = 0.9 + Math.random() * 0.25;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  /* =========================
     Audio + Visualizer Setup
     (kept compatible with your original)
     ========================= */
  let bgMusic = new Audio('sounds/bg-music1.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.28;

  function changeMusic(src) {
    playClick();
    try { bgMusic.pause(); } catch (e) {}
    bgMusic = new Audio(src);
    bgMusic.loop = true;
    bgMusic.volume = 0.28;
    bgMusic.play().catch(() => {});
    if (typeof connectVisualizer === 'function') {
      try { connectVisualizer(bgMusic); } catch(e){}
    }
  }

  // DOM elements (some may not exist — guarded)
  const startOverlay = safeGet('start-overlay');
  const startBtn = safeGet('start-btn');
  const btns = document.querySelectorAll('.buttons .btn');
  const logo = document.querySelector('.logo img');
  const loadingScreen = safeGet('loading-screen');
  const loadingFill = document.querySelector('.loading-fill');
  const loadingPercent = document.querySelector('.loading-percent');

  const canvas = safeGet('music-visualizer');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = 120;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const audioCtx = (function(){
    try { return new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return null; }
  })();
  const analyser = audioCtx ? audioCtx.createAnalyser() : null;
  let source = null;

  function connectVisualizer(audio) {
    if (!audioCtx || !analyser) return;
    try {
      if (source) source.disconnect();
      source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 256;
      renderVisualizer();
      pulseElements();
    } catch (e) {
      console.warn('connectVisualizer error', e);
    }
  }

  let visualizerRunning = false;
  function renderVisualizer() {
    if (!ctx || !analyser) return;
    if (!visualizerRunning) visualizerRunning = true;
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

  let pulseRunning = false;
  function pulseElements() {
    if (!analyser) return;
    if (!pulseRunning) pulseRunning = true;
    requestAnimationFrame(pulseElements);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    const bass = dataArray.slice(0, 10).reduce((a,b)=>a+b,0)/10;

    btns.forEach(btn => {
      const scale = 1 + bass/400;
      if (!btn.dataset.pressed) btn.style.transform = `scale(${scale})`;
    });

    const logoScale = 1 + bass/600;
    if (logo) logo.style.transform = `rotate(${Date.now()*0.06}deg) scale(${logoScale})`;
  }

  /* -------------------------
     Loading screen (kept)
  ------------------------- */
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
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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

  if (startBtn) startBtn.addEventListener('click', () => {
    playClick();
    if (startOverlay) startOverlay.classList.add('hidden');
    setTimeout(() => { if (startOverlay) startOverlay.style.display = 'none'; }, 400);
    startLoading();
  });

  if (loadingScreen) {
    loadingScreen.addEventListener('click', finishLoading);
    loadingScreen.addEventListener('touchstart', finishLoading);
  }

  /* Button press hold/touch */
  btns.forEach(btn => {
    btn.addEventListener('mousedown', () => { btn.dataset.pressed = 'true'; btn.style.transform = 'scale(1.12)'; });
    btn.addEventListener('mouseup', () => { btn.dataset.pressed = ''; btn.style.transform = ''; });
    btn.addEventListener('mouseleave', () => { btn.dataset.pressed = ''; btn.style.transform = ''; });
    btn.addEventListener('touchstart', () => { btn.dataset.pressed = 'true'; btn.style.transform = 'scale(1.12)'; }, {passive:true});
    btn.addEventListener('touchend', () => { btn.dataset.pressed = ''; btn.style.transform = ''; }, {passive:true});
  });

  /* -------------------------
     Particles main background (init once)
  ------------------------- */
  try {
    const mainParticlesEl = document.getElementById('particles-js');
    if (typeof particlesJS === 'function' && mainParticlesEl && !mainParticlesEl.dataset.pInit) {
      particlesJS("particles-js", {
        "particles": {
          "number": { "value": 200 },
          "color": { "value": "#ff3333" },
          "shape": { "type": "circle" },
          "opacity": { "value": 0.5, "random": true },
          "size": { "value": 3, "random": true },
          "line_linked": { "enable": true, "distance": 150, "color": "#ff3333", "opacity": 0.4, "width": 1 },
          "move": { "enable": true, "speed": 1.6 }
        },
        "interactivity": { "events": { "onhover": { "enable": true, "mode": "repulse" } } },
        "retina_detect": true
      });
      mainParticlesEl.dataset.pInit = "1";
    }
  } catch(e){ console.warn('particles init error', e); }

  /* ============================
     XP + Level System (single source)
     ============================ */

  // Use the same keys your site used previously so saved progress remains
  let xp = parseInt(localStorage.getItem("zmh_xp")) || 0;
  let level = parseInt(localStorage.getItem("zmh_level")) || 1;
  const maxLevel = 10000;

  const levelDisplay = safeGet("level-display");
  const xpFill = safeGet("xp-fill");
  const xpText = safeGet("xp-text");

  function xpNeededForLevel(lvl) {
    // original formula you used
    return 100 + (lvl - 1) * 20;
  }

  function saveProgress() {
    try {
      localStorage.setItem("zmh_xp", String(xp));
      localStorage.setItem("zmh_level", String(level));
    } catch(e){}
  }

  function updateHUD_main() {
    if (!xpFill || !levelDisplay || !xpText) return;

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

  function addXP_main(amount) {
    if (typeof amount !== 'number' || amount <= 0) return;
    xp += Math.floor(amount);
    updateHUD_main();
  }

  function setLevelAtLeast(minLevel) {
    if (typeof minLevel !== 'number' || minLevel < 1) return;
    if (level < minLevel) {
      level = Math.min(minLevel, maxLevel);
      xp = 0;
      updateHUD_main();
    }
  }

  // Idle XP
  try {
    setInterval(() => addXP_main(1), 1000);
  } catch(e){}

  // button click xp behavior (keep original)
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let reward = 5;
      if (btn.classList.contains('social') || btn.dataset.social === 'true') reward = 100;
      addXP_main(reward);
    });
  });

  // expose to console
  window.zmh = window.zmh || {};
  window.zmh.addXP = addXP_main;
  window.zmh.getProgress = () => ({ xp, level });

  // initial HUD render
  updateHUD_main();

  // auto resume audio context on user click
  document.addEventListener('click', function __zmh_resume() {
    try {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch(e){}
  }, {once: true});

  /* ============================
     Redeem System (one-time, persistent)
     ============================ */

  // original codes: easy to edit here
  const CODES = {
    "JustAl3xHere": { type: "xp", amount: 600, message: "+600 XP" },
    "ZenoMozHub": { type: "level_min", level: 5, message: "Level set to at least 5" },
    "SkyeMozScriptz": { type: "xp", amount: 8000, message: "+8000 XP" },
    "LimLimLemonMyAss": { type: "xp", amount: 50, message: "+50 XP" },
    "2025Code": { type: "xp", amount: 2025, message: "+2025 XP" }
  };

  // normalize for case-insensitive matching
  const normalizedCodes = {};
  Object.keys(CODES).forEach(k => { normalizedCodes[k.toLowerCase()] = CODES[k]; });

  const redeemedKey = "zmh_redeemed_codes";
  function getRedeemedSet() {
    try {
      const raw = localStorage.getItem(redeemedKey);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr.map(s => String(s)));
    } catch (e) {
      return new Set();
    }
  }
  function saveRedeemedSet(set) {
    try {
      localStorage.setItem(redeemedKey, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  let redeemedSet = getRedeemedSet();

  // find redeem DOM elements (support multiple possible ids)
  const redeemOverlayEl = $(['redeem-overlay','redeemOverlay','redeemModal']) || null;
  const redeemParticlesEl = safeGet('redeem-particles');
  const redeemInputEl = $(['redeem-input','redeemInput']) || null;
  const redeemSubmitEl = $(['redeem-submit','redeem-submit-btn','redeemSubmit']) || null;
  const redeemMsgEl = $(['redeem-msg','redeem-result','redeem-message','redeem_result','redeemMessage']) || null;
  const redeemOpenButtons = Array.from(document.querySelectorAll('[id^="open-redeem"], #open-redeem, #redeem-btn, #redeem-link, .open-redeem'));

  // open redeem overlay
  function openRedeem() {
    if (redeemOverlayEl) {
      redeemOverlayEl.classList.add('active');
      redeemOverlayEl.setAttribute('aria-hidden','false');
    }
    if (redeemMsgEl) { redeemMsgEl.textContent = ''; redeemMsgEl.className = redeemMsgEl.className.replace(/\b(ok|err)\b/g,'').trim(); }
    if (redeemInputEl) { redeemInputEl.value = ''; setTimeout(()=>redeemInputEl.focus(), 80); }
    playClick();

    // init redeem particles once
    try {
      if (redeemParticlesEl && typeof particlesJS === 'function' && !redeemParticlesEl.dataset.pInit) {
        particlesJS(redeemParticlesEl.id, {
          particles: {
            number: { value: 120 },
            color: { value: "#ff3333" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 140, color: "#ff3333", opacity: 0.35, width: 1 },
            move: { enable: true, speed: 1.4 }
          },
          interactivity: { events: { onhover: { enable: true, mode: "repulse" } } },
          retina_detect: true
        });
        redeemParticlesEl.dataset.pInit = "1";
      }
    } catch(e) { console.warn('redeem particles', e); }
  }

  function closeRedeem() {
    if (redeemOverlayEl) {
      redeemOverlayEl.classList.remove('active');
      redeemOverlayEl.setAttribute('aria-hidden','true');
    }
  }

  // handle redeem action
  function handleRedeem() {
    if (!redeemInputEl || !redeMsgEl) {
      // fallback: try another message element
      const fallbackMsg = redeemMsgEl || document.querySelector('.redeem-msg') || document.querySelector('#redeem-message');
      if (fallbackMsg) fallbackMsg.textContent = "Redeem system not available (missing elements).";
      return;
    }
    const raw = (redeemInputEl.value || "").trim();
    if (!raw) {
      redeemMsgEl.textContent = "Please enter a code.";
      redeemMsgEl.className = 'redeem-msg err';
      return;
    }
    const codeKey = raw.toLowerCase();
    const reward = normalizedCodes[codeKey];
    if (!reward) {
      redeemMsgEl.textContent = "Invalid code.";
      redeemMsgEl.className = 'redeem-msg err';
      return;
    }
    if (redeemedSet.has(codeKey)) {
      redeemMsgEl.textContent = "You already redeemed this code.";
      redeemMsgEl.className = 'redeem-msg err';
      return;
    }

    // grant reward
    if (reward.type === 'xp') {
      addXP_main(reward.amount);
      redeemMsgEl.textContent = `Success! ${reward.message}`;
      redeemMsgEl.className = 'redeem-msg ok';
    } else if (reward.type === 'level_min') {
      const before = level;
      setLevelAtLeast(reward.level);
      const changed = level !== before;
      redeemMsgEl.textContent = changed ? `Success! ${reward.message}` : `Already level ${level}+`;
      redeemMsgEl.className = 'redeem-msg ok';
    } else {
      redeemMsgEl.textContent = "Unknown reward type.";
      redeemMsgEl.className = 'redeem-msg err';
      return;
    }

    // mark redeemed and persist
    redeemedSet.add(codeKey);
    saveRedeemedSet(redeemedSet);

    playClick();
    // close after a short delay so user sees message
    setTimeout(closeRedeem, 900);
    if (redeemInputEl) redeemInputEl.value = '';
  }

  // wire redeem event listeners (if present)
  if (redeemSubmitEl) redeemSubmitEl.addEventListener('click', handleRedeem);
  if (redeemInputEl) redeemInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRedeem(); });

  // open-redeem buttons
  redeemOpenButtons.forEach(b => b.addEventListener('click', (ev) => { ev.preventDefault(); openRedeem(); }));

  // try to wire other possible IDs used earlier
  const openRedeemFallback = $(['open-redeem','openRedeem']);
  if (openRedeemFallback) openRedeemFallback.addEventListener('click', (e)=>{ e.preventDefault(); openRedeem(); });

  // close redeem via cancel ids
  const redeemCancelEls = Array.from(document.querySelectorAll('#redeem-cancel, #redeem-close, .redeem-cancel, .close-redeem'));
  redeemCancelEls.forEach(el => el.addEventListener('click', (e)=>{ e.preventDefault(); playClick(); closeRedeem(); }));

  // close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeRedeem();
      // also close menu if open
      const globalMenu = $( ['sidebar','menu-overlay','drawer','menu-container','menu'] );
      if (globalMenu && globalMenu.classList.contains('active')) globalMenu.classList.remove('active');
    }
  });

  /* ============================
     Burger / Sidebar toggle (robust)
     ============================ */
  const burgerEl = $(['burger-menu','burger-btn','burger','hamburger','hamburger-btn','burger-menu']);
  const menuEl = $(['sidebar','menu-overlay','drawer','menu-container','menu']);

  if (burgerEl && menuEl) {
    burgerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      menuEl.classList.toggle('active');
      playClick();
    });

    // clicking outside the menu closes it
    document.addEventListener('click', (e) => {
      if (!menuEl.classList.contains('active')) return;
      const clickInside = menuEl.contains(e.target) || burgerEl.contains(e.target);
      if (!clickInside) {
        menuEl.classList.remove('active');
      }
    });
  } else {
    // if missing, try older ids/markup (no errors)
    // nothing to do - just safe fallback
  }

  /* ============================
     Expose helpers for debugging
     ============================ */
  window.zmh = window.zmh || {};
  window.zmh.addXP = addXP_main;
  window.zmh.getProgress = () => ({ xp, level });
  window.zmh.redeem = function(code) {
    try {
      if (!code) return;
      if (typeof code !== 'string') code = String(code);
      if (!normalizedCodes[code.toLowerCase()]) return { ok:false, msg:'invalid' };
      // emulate manual redeem
      const fakeInput = redeemInputEl;
      if (fakeInput) {
        fakeInput.value = code;
        handleRedeem();
      } else {
        // direct logic if input missing
        const key = code.toLowerCase();
        if (redeemedSet.has(key)) return { ok:false, msg:'redeemed' };
        const reward = normalizedCodes[key];
        if (reward.type === 'xp') addXP_main(reward.amount);
        else if (reward.type === 'level_min') setLevelAtLeast(reward.level);
        redeemedSet.add(key);
        saveRedeemedSet(redeemedSet);
        return { ok:true, msg:'redeemed' };
      }
      return { ok:true, msg:'queued' };
    } catch(e){ return { ok:false, msg:'err' }; }
  };

  // initial done
  // Note: updateHUD_main already called above to reflect stored values
})();
