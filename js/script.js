/* ===========================
   ZenoMoz Hub — supercharged
   script.js (full)
   =========================== */

/* ---------------------------
   Utilities & small helpers
   --------------------------- */
function $qs(sel) { return document.querySelector(sel); }
function $qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* ---------------------------
   Click sound
   --------------------------- */
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.75;
    audio.playbackRate = 0.9 + Math.random() * 0.25;
    audio.play().catch(() => {});
  } catch (e) {}
}

/* ---------------------------
   Background music (default)
   --------------------------- */
let bgMusic = new Audio('sounds/bg-music1.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.28;

/* change music with crossfade */
let musicFadeTarget = null;
function changeMusic(src) {
  playClick();
  // crossfade current -> new
  const newMusic = new Audio(src);
  newMusic.loop = true;
  newMusic.volume = 0;
  newMusic.play().catch(()=>{});
  // fade out old, fade in new
  const fadeDur = 600;
  const start = Date.now();
  const old = bgMusic;
  musicFadeTarget = newMusic;

  function step() {
    const t = Math.min(1, (Date.now() - start) / fadeDur);
    old.volume = (1 - t) * 0.28;
    newMusic.volume = t * 0.28;
    if (t < 1) requestAnimationFrame(step);
    else {
      try { old.pause(); } catch(e){}
      bgMusic = newMusic;
      musicFadeTarget = null;
      // (re)connect visualizer
      if (audioCtx && typeof connectVisualizer === 'function') connectVisualizer(bgMusic);
    }
  }
  step();
}

/* ---------------------------
   DOM elements
   --------------------------- */
const startOverlay = $qs('#start-overlay');
const startBtn = $qs('#start-btn');
const btns = $qsa('.buttons .btn');
const logo = $qs('.logo img');
const loadingScreen = $qs('#loading-screen');
const loadingFill = $qs('.loading-fill');
const loadingPercent = $qs('.loading-percent');
const loadingText = $qs('.loading-text');
const canvas = $qs('#music-visualizer');

/* ---------------------------
   Canvas / Visualizer setup
   --------------------------- */
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = 140;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ---------------------------
   AudioContext & analyser
   --------------------------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 512; // gives freq bins = 256
let source = null;
let visualizerRunning = false;
let pulseLoopRunning = false;
let detectBeatRunning = false;

/* connect audio element to analyser & destination */
function connectVisualizer(audioElement) {
  try {
    if (source) {
      try { source.disconnect(); } catch(e){}
    }
    source = audioCtx.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 512;
  } catch (e) {
    // On some browsers creating MediaElementSource multiple times errors; ignore gracefully
    console.warn('visualizer connect failed', e);
  }
  if (!visualizerRunning) {
    visualizerRunning = true;
    renderVisualizer();
  }
  if (!pulseLoopRunning) {
    pulseLoopRunning = true;
    pulseElementsLoop();
  }
  if (!detectBeatRunning) {
    detectBeatRunning = true;
    detectBeat();
  }
}

/* ---------------------------
   Visual rendering
   --------------------------- */
function renderVisualizer() {
  if (!visualizerRunning) return;
  requestAnimationFrame(renderVisualizer);

  const bufferLength = analyser.frequencyBinCount; // 256
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // radial pulse background (very subtle)
  const bass = dataArray.slice(0, 10).reduce((a,b)=>a+b,0) / 10;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(0.02 + bass/800, 0.02, 0.35);
  const grdHue = (Date.now()*0.02)%360;
  const grd = ctx.createRadialGradient(canvas.width/2, canvas.height, 10, canvas.width/2, canvas.height, Math.max(canvas.width/3, 200)+bass);
  grd.addColorStop(0, `hsla(${grdHue},100%,60%,0.12)`);
  grd.addColorStop(1, `rgba(0,0,0,0)`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // bars
  const barCount = Math.min(128, bufferLength); // keep manageable
  const barWidth = (canvas.width / barCount) * 0.9;
  let x = (canvas.width - (barWidth + 1) * barCount) / 2;

  for (let i = 0; i < barCount; i++) {
    const v = dataArray[i];
    const barHeight = (v / 255) * (canvas.height * 0.9);

    // dynamic hue so bars cycle across spectrum
    const hue = (i * 2 + (Date.now() * 0.03)) % 360;
    // build gradient for each bar
    const g = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
    g.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
    g.addColorStop(1, `hsl(${(hue+40)%360}, 100%, 45%)`);

    ctx.fillStyle = g;
    ctx.shadowColor = `hsl(${hue}, 100%, 55%)`;
    ctx.shadowBlur = 14;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

    x += barWidth + 1;
  }

  // top wave line
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  let px = 0;
  for (let i = 0; i < barCount; i++) {
    const v = dataArray[i];
    const y = canvas.height * 0.5 - (v / 255) * (canvas.height * 0.35);
    const xPos = (i / (barCount-1)) * canvas.width;
    if (i === 0) ctx.moveTo(xPos, y);
    else ctx.lineTo(xPos, y);
    px = xPos;
  }
  ctx.stroke();
}

/* ---------------------------
   Pulse UI elements (logo & buttons)
   --------------------------- */
function pulseElementsLoop() {
  if (!pulseLoopRunning) return;
  requestAnimationFrame(pulseElementsLoop);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // bass average + overall energy
  const bass = dataArray.slice(0, 8).reduce((a,b)=>a+b,0) / 8; // 0-255
  const energy = dataArray.reduce((a,b)=>a+b,0) / bufferLength;

  // buttons: subtle scale + glow based on energy
  const btnScale = 1 + clamp(bass / 1200, 0, 0.12);
  btns.forEach(btn => {
    // keep transient hold/tap transform if user is pressing (so we don't override)
    const pressed = btn.dataset.pressed === 'true';
    if (!pressed) btn.style.transform = `scale(${btnScale})`;
    // glow via CSS variables (you can hook these in CSS)
    btn.style.setProperty('--neon-hue', `${(Date.now()*0.04)%360}`);
    btn.style.filter = `drop-shadow(0 0 ${8 + energy/40}px hsl(${(Date.now()*0.04)%360},100%,55%))`;
  });

  // logo: rotate slowly + pulse scale based on bass
  const logoScale = 1 + clamp(bass / 900, 0, 0.35);
  const rotateDeg = (Date.now() * 0.04) % 360;
  logo.style.transform = `rotate(${rotateDeg}deg) scale(${logoScale})`;
  const hue = (Date.now()*0.05 + bass*0.3) % 360;
  logo.style.filter = `drop-shadow(0 0 ${16 + bass/20}px hsl(${hue},100%,60%))`;
}

/* ---------------------------
   Beat detection -> effects
   --------------------------- */
let lastBeatTs = 0;
let beatCooldown = 200; // ms

function detectBeat() {
  if (!detectBeatRunning) return;
  requestAnimationFrame(detectBeat);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // compute a simple bass metric
  const bassArray = dataArray.slice(0, 8);
  const bass = bassArray.reduce((a,b)=>a+b,0) / bassArray.length; // 0..255

  // dynamic threshold — we want it to be robust, so compare to rolling average
  // simple adaptive threshold using small smoothing
  if (!detectBeat.lastAvg) detectBeat.lastAvg = bass;
  detectBeat.lastAvg = detectBeat.lastAvg * 0.92 + bass * 0.08;
  const threshold = detectBeat.lastAvg * 1.4 + 30;

  const now = Date.now();
  if (bass > threshold && now - lastBeatTs > beatCooldown) {
    lastBeatTs = now;
    onBeat(bass);
  }
}

/* what happens on a detected beat */
function onBeat(bassVal) {
  // spawn speed particles (intensity based on bass)
  const intensity = clamp(3 + Math.floor(bassVal / 30), 4, 18);
  spawnSpeedParticles(intensity);

  // burst particles in particles.js (if exists)
  spawnParticleBurst(intensity);

  // subtle screen shake
  const shakeIntensity = clamp(1 + Math.floor(bassVal / 80), 2, 12);
  screenShake(shakeIntensity);

  // quick flash background vignette
  flashBackground(bassVal);

  // logo micro-spin
  microLogoSurge(bassVal);
}

/* ---------------------------
   Speed particles (DOM)
   --------------------------- */
function spawnSpeedParticles(count = 8) {
  for (let i = 0; i < count; i++) {
    const sp = document.createElement('div');
    sp.className = 'speed-particle';
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * (window.innerHeight * 0.8);
    sp.style.left = startX + 'px';
    sp.style.top = startY + 'px';
    // random angle mostly downwards
    const angle = (Math.random() * Math.PI) + (Math.PI/6); // downward
    const dist = 200 + Math.random()*300;
    document.body.appendChild(sp);

    sp.animate([
      { transform: `translate(0,0) scale(1)`, opacity: 1 },
      { transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0.3)`, opacity: 0 }
    ], {
      duration: 300 + Math.random() * 500,
      easing: 'cubic-bezier(.2,.8,.2,1)'
    });

    setTimeout(()=> {
      if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
    }, 900);
  }
}

/* add CSS for speed-particle via JS (so one file deploy) */
(function injectSpeedParticleCSS(){
  const id = 'zenom-speed-particles-style';
  if ($qs('#'+id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = `
    .speed-particle {
      position: fixed;
      width: 2px;
      height: 24px;
      background: linear-gradient(to bottom, rgba(255,80,80,1), transparent);
      border-radius: 2px;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: screen;
      will-change: transform, opacity;
      filter: drop-shadow(0 0 6px rgba(255,80,80,0.8));
    }
    .spark {
      position: fixed;
      width:6px; height:6px;
      background: linear-gradient(45deg,#ff33ff,#ff6666);
      border-radius:50%;
      pointer-events:none; z-index:99999;
      mix-blend-mode:screen;
      will-change: transform, opacity;
      filter: drop-shadow(0 0 8px rgba(255,100,100,0.8));
    }
  `;
  document.head.appendChild(s);
})();

/* ---------------------------
   Button sparks on click
   --------------------------- */
function spawnButtonSparks(btn) {
  const rect = btn.getBoundingClientRect();
  for (let i = 0; i < 9; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    spark.style.left = (rect.left + rect.width/2 - 3) + 'px';
    spark.style.top = (rect.top + rect.height/2 - 3) + 'px';
    document.body.appendChild(spark);

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 70;
    spark.animate([
      { transform: `translate(0,0) scale(1)`, opacity: 1 },
      { transform: `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px) scale(0)`, opacity: 0 }
    ], {
      duration: 420 + Math.random() * 260,
      easing: 'cubic-bezier(.2,.7,.1,1)'
    });

    setTimeout(()=> spark.remove(), 800);
  }
}

/* attach to existing buttons */
btns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // existing html may open links — we'll still spawn sparks/click
    spawnButtonSparks(btn);
    playClick();
  });

  // hold/tap pressed state so pulseElements doesn't override
  btn.addEventListener('mousedown', () => { btn.dataset.pressed = 'true'; btn.style.transform = 'scale(1.12)'; });
  btn.addEventListener('mouseup', () => { btn.dataset.pressed = 'false'; btn.style.transform = ''; });
  btn.addEventListener('mouseleave', () => { btn.dataset.pressed = 'false'; btn.style.transform = ''; });
  btn.addEventListener('touchstart', () => { btn.dataset.pressed = 'true'; btn.style.transform = 'scale(1.12)'; }, {passive:true});
  btn.addEventListener('touchend', () => { btn.dataset.pressed = 'false'; btn.style.transform = ''; }, {passive:true});
});

/* ---------------------------
   Screen shake
   --------------------------- */
let shakeTimeout = null;
function screenShake(intensity = 4, duration = 140) {
  const body = document.body;
  const prev = body.style.transform;
  const start = Date.now();
  const id = `shake-${Date.now()}`;

  function step() {
    const elapsed = Date.now() - start;
    if (elapsed > duration) {
      body.style.transform = '';
      return;
    }
    const progress = 1 - (elapsed / duration);
    const x = (Math.random()*2 - 1) * intensity * progress;
    const y = (Math.random()*2 - 1) * intensity * progress;
    body.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(step);
  }
  step();
}

/* ---------------------------
   Flash background vignette
   --------------------------- */
function flashBackground(intensity) {
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.left = 0;
  flash.style.top = 0;
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.zIndex = 1200;
  flash.style.pointerEvents = 'none';
  flash.style.background = `radial-gradient(circle at 50% 80%, rgba(255,80,80,${clamp(intensity/600,0.06,0.28)}) 0%, transparent 40%)`;
  flash.style.transition = 'opacity 260ms ease-out';
  document.body.appendChild(flash);
  requestAnimationFrame(()=> flash.style.opacity = '1');
  setTimeout(()=> {
    flash.style.opacity = '0';
    setTimeout(()=> flash.remove(), 300);
  }, 120);
}

/* logo micro surge on beat */
function microLogoSurge(bassVal) {
  const prev = logo.style.transition;
  logo.style.transition = 'transform 280ms cubic-bezier(.2,.8,.2,1), filter 280ms';
  logo.style.transform = `rotate(${Date.now()*0.1}deg) scale(${1 + clamp(bassVal/700, 0, 0.35)})`;
  setTimeout(()=> { logo.style.transition = prev || ''; }, 300);
}

/* ---------------------------
   Integrate with particles.js if present
   --------------------------- */
function spawnParticleBurst(intensity = 6) {
  try {
    if (window && window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
      const pJS = window.pJSDom[0].pJS;
      // increase velocity and size of some particles briefly
      pJS.particles.array.forEach((pt, idx) => {
        // small random boost for some particles
        if (Math.random() < 0.06 * (intensity/6)) {
          pt.radius = clamp(pt.radius + Math.random()*3 + 1, 0.5, 8);
          pt.vx *= 1 + Math.random()*1.6;
          pt.vy *= 1 + Math.random()*1.6;
        }
      });
      // after short time, gently normalize back
      setTimeout(()=> {
        pJS.particles.array.forEach(pt => {
          // slowly reduce radius towards original-ish value
          pt.radius = Math.max(0.5, pt.radius - (0.5 + Math.random()*1.2));
        });
      }, 400);
    }
  } catch (e) {
    // ignore if particles not present
  }
}

/* ---------------------------
   Start / Loading screen
   --------------------------- */
let loadingProgress = 0;
let loadingInterval = null;
function startLoading() {
  if (!loadingScreen) return;
  loadingScreen.classList.add('active');
  loadingProgress = 0;
  loadingFill.style.width = '0%';
  loadingPercent.textContent = '0%';

  const messages = [
    "Booting modules...",
    "Connecting ZenoMoz Core...",
    "Injecting scripts...",
    "Decrypting neon shaders...",
    "Almost ready..."
  ];
  let mi = 0;

  loadingInterval = setInterval(()=> {
    loadingProgress += Math.random() * 18;
    loadingProgress = Math.min(100, loadingProgress);
    loadingFill.style.width = loadingProgress + '%';
    loadingPercent.textContent = Math.floor(loadingProgress) + '%';
    loadingText.textContent = messages[mi];
    mi = (mi + 1) % messages.length;

    if (loadingProgress >= 100) finishLoading();
  }, 180);
}

function finishLoading() {
  clearInterval(loadingInterval);
  loadingInterval = null;
  loadingFill.style.width = '100%';
  loadingPercent.textContent = '100%';

  setTimeout(()=> {
    loadingScreen.classList.remove('active');
    // play bg music (user gesture already required on some browsers)
    bgMusic.play().catch(()=>{});
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    connectVisualizer(bgMusic);

    // stagger show buttons
    btns.forEach((b, i) => {
      setTimeout(() => b.classList.add('active'), i * 110);
    });

    // quick logo burst
    logo.style.animationDuration = '0.6s';
    setTimeout(()=> logo.style.animationDuration = '10s', 700);
  }, 380);
}

/* skip loading on click */
loadingScreen && loadingScreen.addEventListener('click', finishLoading, {passive:true});
loadingScreen && loadingScreen.addEventListener('touchstart', finishLoading, {passive:true});

/* ---------------------------
   Start button handler
   --------------------------- */
startBtn && startBtn.addEventListener('click', () => {
  playClick();
  // hide overlay
  startOverlay.classList.add('hidden');
  setTimeout(()=> startOverlay.style.display = 'none', 420);

  // resume audioCtx on user gesture
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(()=>{});
  }

  startLoading();
});

/* ---------------------------
   Beat-based hover & cursor trail (optional)
   --------------------------- */
/* Cursor trail: small dots follow mouse (lightweight) */
(function initCursorTrail(){
  let lastMove = 0;
  const trailCount = 12;
  const nodes = [];
  for (let i=0;i<trailCount;i++){
    const d = document.createElement('div');
    d.className = 'cursor-dot';
    d.style.position = 'fixed';
    d.style.left = '-100px';
    d.style.top = '-100px';
    d.style.width = `${4 - Math.min(3, i*0.2)}px`;
    d.style.height = d.style.width;
    d.style.borderRadius = '50%';
    d.style.pointerEvents = 'none';
    d.style.zIndex = 9998;
    d.style.mixBlendMode = 'screen';
    d.style.transition = 'transform 120ms linear, left 120ms linear, top 120ms linear, opacity 220ms';
    d.style.opacity = '0.8';
    d.style.background = `linear-gradient(45deg, hsl(${(i*30)%360},100%,60%), hsl(${(i*30+60)%360},100%,50%))`;
    document.body.appendChild(d);
    nodes.push(d);
  }

  window.addEventListener('mousemove', e => {
    lastMove = Date.now();
    let x = e.clientX, y = e.clientY;
    nodes.forEach((n, i) => {
      setTimeout(()=> {
        n.style.left = (x - 2) + 'px';
        n.style.top = (y - 2) + 'px';
        n.style.transform = `translate(${(Math.random()-0.5)*4}px, ${(Math.random()-0.5)*4}px) scale(${1 - i*0.015})`;
        n.style.opacity = `${1 - i*0.06}`;
      }, i*12);
    });
  }, {passive:true});

  // hide when no movement for a bit
  setInterval(()=> {
    if (Date.now() - lastMove > 1500) nodes.forEach(n => n.style.opacity = '0');
  }, 700);
})();

/* ---------------------------
   Safe particles.js initialization placeholder
   (we don't re-init - we only tweak if present)
   --------------------------- */
if (typeof particlesJS === 'function') {
  // leave original init to your HTML. We will adapt particles when beats happen.
}

/* ---------------------------
   Auto-resume & user-gesture helpers
   --------------------------- */
document.addEventListener('click', function autoResumeHandler() {
  try {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch(e){}
}, {once:true});

/* ---------------------------
   Small polyfill / safe exports (if dev console wants)
   --------------------------- */
window.zmh = window.zmh || {};
window.zmh.connectVisualizer = connectVisualizer;
window.zmh.changeMusic = changeMusic;
window.zmh.spawnSpeedParticles = spawnSpeedParticles;
window.zmh.onBeat = onBeat;

/* ===========================
   END OF script.js
   =========================== */
