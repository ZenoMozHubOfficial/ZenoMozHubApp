/* =============================
   script.js — playlist + visualizer + XP HUD
   ============================= */

/* --- Click sound --- */
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 0.9 + Math.random() * 0.25;
    audio.play().catch(() => {});
  } catch (e) {}
}

/* --- Playlist (10 tracks) --- */
const playlist = [
  { name: "Heaviness", src: "sounds/bg-music1.mp3" },
  { name: "The Heist", src: "sounds/bg-music2.mp3" },
  { name: "Back to Me", src: "sounds/bg-music3.mp3" },
  { name: "Reborn", src: "sounds/bg-music4.mp3" },
  { name: "Track 5", src: "sounds/bg-music5.mp3" },
  { name: "Track 6", src: "sounds/bg-music6.mp3" },
  { name: "Track 7", src: "sounds/bg-music7.mp3" },
  { name: "Track 8", src: "sounds/bg-music8.mp3" },
  { name: "Track 9", src: "sounds/bg-music9.mp3" },
  { name: "Track 10", src: "sounds/bg-music10.mp3" }
];

let currentTrack = 0;
let bgMusic = new Audio();
bgMusic.preload = 'auto';
bgMusic.volume = 0.28;
bgMusic.loop = false; // playlist should advance by default

/* --- DOM elements --- */
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btns = document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const loadingPercent = document.querySelector('.loading-percent');

const trackNameEl = document.getElementById('track-name');
const prevTrackBtn = document.getElementById('prev-track');
const playResumeBtn = document.getElementById('play-resume');
const pauseBtn = document.getElementById('pause-btn');
const nextTrackBtn = document.getElementById('next-track');
const trackSlider = document.getElementById('track-slider');
const timeCurrent = document.getElementById('time-current');
const timeDuration = document.getElementById('time-duration');

/* --- AUDIO CONTEXT & VISUALIZER --- */
const canvas = document.getElementById('music-visualizer');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
function resizeCanvas(){ if(!canvas) return; canvas.width = window.innerWidth; canvas.height = 80; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let sourceNode = null;

function connectVisualizer(audioElem) {
  try {
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch(e){}
    }
    sourceNode = audioCtx.createMediaElementSource(audioElem);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    // start visualizer loop if not already running
    if (!rendering) { renderVisualizer(); rendering = true; }
  } catch (e) {
    console.warn('connectVisualizer error', e);
  }
}

let rendering = false;
function renderVisualizer() {
  if (!ctx || !analyser) return;
  requestAnimationFrame(renderVisualizer);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // fill background to avoid thin lines on some WebViews
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / bufferLength) * 2;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i];
    const hue = (i * 3 + Date.now() * 0.05) % 360;
    ctx.fillStyle = `hsl(${hue},100%,50%)`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }

  // wave overlay
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < bufferLength; i++) {
    const y = canvas.height / 2 - (dataArray[i] / 3);
    const xPos = (i / bufferLength) * canvas.width;
    ctx.lineTo(xPos, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* --- Load track (use when switching in playlist) --- */
function loadTrack(index, autoplay = true) {
  if (index < 0) index = playlist.length - 1;
  if (index >= playlist.length) index = 0;
  currentTrack = index;

  // create new audio element for track to avoid weird reused-source issues
  try { bgMusic.pause(); } catch(e){}
  bgMusic = new Audio(playlist[currentTrack].src);
  bgMusic.preload = 'auto';
  bgMusic.volume = 0.28;
  bgMusic.loop = false;

  // attach basic listeners
  bgMusic.addEventListener('timeupdate', onTimeUpdate);
  bgMusic.addEventListener('ended', () => loadTrack(currentTrack + 1, true));
  bgMusic.addEventListener('loadedmetadata', () => {
    updateTimeDisplays();
  });

  // update UI
  trackNameEl.textContent = playlist[currentTrack].name;
  playResumeBtn.textContent = '▸';
  playResumeBtn.classList.remove('playing');

  // connect visualizer (createMediaElementSource)
  try {
    connectVisualizer(bgMusic);
  } catch(e) { /* ignore */ }

  if (autoplay) {
    bgMusic.play().then(()=> {
      playResumeBtn.textContent = '▸';
      playResumeBtn.classList.add('playing'); // use CSS if needed
    }).catch(()=> {
      // play may be blocked until user gesture; UI remains consistent
      playResumeBtn.textContent = '▸';
    });
  }
}

/* --- UI: play/resume/pause/prev/next handlers --- */
playResumeBtn.addEventListener('click', () => {
  // resume/play symbol (▸) requested
  try {
    if (bgMusic.paused) {
      bgMusic.play().catch(()=>{});
      playResumeBtn.textContent = '▸';
      playResumeBtn.classList.add('playing');
    } else {
      // if currently playing, this button still toggles to keep behavior consistent
      bgMusic.pause();
      playResumeBtn.classList.remove('playing');
    }
  } catch(e){}
});

pauseBtn.addEventListener('click', () => {
  try {
    bgMusic.pause();
    // ensure play symbol shows as passive (user can press play)
    playResumeBtn.classList.remove('playing');
    playResumeBtn.textContent = '▸';
  } catch(e){}
});

prevTrackBtn.addEventListener('click', () => {
  loadTrack(currentTrack - 1, true);
});

nextTrackBtn.addEventListener('click', () => {
  loadTrack(currentTrack + 1, true);
});

/* --- Slider + time update --- */
function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
function updateTimeDisplays() {
  timeDuration.textContent = isNaN(bgMusic.duration) ? '0:00' : formatTime(bgMusic.duration);
  timeCurrent.textContent = isNaN(bgMusic.currentTime) ? '0:00' : formatTime(bgMusic.currentTime);
}
function onTimeUpdate() {
  updateTimeDisplays();
  if (!isNaN(bgMusic.duration) && bgMusic.duration > 0) {
    const pct = (bgMusic.currentTime / bgMusic.duration) * 100;
    trackSlider.value = pct;
  }
}
trackSlider.addEventListener('input', () => {
  if (!isNaN(bgMusic.duration) && bgMusic.duration > 0) {
    bgMusic.currentTime = (trackSlider.value / 100) * bgMusic.duration;
  }
});

/* --- Init: start with first track but do not autoplay until user starts overlay --- */
loadTrack(0, false);

/* --- XP + Level System (keeps your keys) --- */
let xp = parseInt(localStorage.getItem("zmh_xp")) || 0;
let level = parseInt(localStorage.getItem("zmh_level")) || 1;
const maxLevel = 10000;
const levelDisplayEl = document.getElementById("level-display");
const xpFillEl = document.getElementById("xp-fill");
const xpTextEl = document.getElementById("xp-text");

function xpNeededForLevel(lvl) { return 100 + (lvl - 1) * 20; }
function saveProgress() {
  try {
    localStorage.setItem("zmh_xp", String(xp));
    localStorage.setItem("zmh_level", String(level));
  } catch(e){}
}
function updateHUD() {
  if (!xpFillEl || !levelDisplayEl || !xpTextEl) return;
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
  const pct = Math.floor((xp / xpNeededForLevel(level)) * 100);
  xpFillEl.style.width = pct + '%';
  levelDisplayEl.textContent = level;
  xpTextEl.textContent = `${xp} / ${xpNeededForLevel(level)} XP`;
  saveProgress();
}
function addXP(amount) {
  if (typeof amount !== 'number' || amount <= 0) return;
  xp += Math.floor(amount);
  updateHUD();
}
setInterval(() => addXP(1), 1000); // idle XP
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    let reward = 5;
    if (btn.classList.contains('social') || btn.dataset.social === 'true') reward = 100;
    addXP(reward);
  });
});
updateHUD();

/* --- Loading screen and start overlay (keeps previous logic, triggers audio resume) --- */
let loadingProgress = 0, loadingInterval = null;
function startLoading() {
  if (loadingScreen) loadingScreen.classList.add('active');
  loadingProgress = 0;
  if (loadingFill) loadingFill.style.width = '0%';
  if (loadingPercent) loadingPercent.textContent = '0%';
  const msgs = ["Booting modules...", "Connecting ZenoMoz Core...", "Injecting scripts...", "Almost ready..."];
  let idx = 0;
  const loadingText = document.querySelector('.loading-text');
  loadingInterval = setInterval(() => {
    loadingProgress += Math.random() * 18;
    if (loadingProgress >= 100) loadingProgress = 100;
    if (loadingFill) loadingFill.style.width = loadingProgress + '%';
    if (loadingPercent) loadingPercent.textContent = Math.floor(loadingProgress);
    if (loadingText) { loadingText.textContent = msgs[idx]; idx=(idx+1)%msgs.length; }
    if (loadingProgress >= 100) finishLoading();
  }, 200);
}
function finishLoading() {
  clearInterval(loadingInterval);
  if (loadingFill) loadingFill.style.width = '100%';
  if (loadingPercent) loadingPercent.textContent = '100%';
  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.remove('active');
    // ensure audio context resumed for mobile
    try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){}
    // start playing current track (user already interacted by clicking Start)
    bgMusic.play().catch(()=>{});
    // connect visualizer for current bgMusic
    try { connectVisualizer(bgMusic); } catch(e){}
    // animate buttons on load
    btns.forEach((b,i)=> setTimeout(()=> b.classList.add('active'), i*120));
  }, 400);
}

if (startBtn) startBtn.addEventListener('click', () => {
  playClick();
  if (startOverlay) startOverlay.classList.add('hidden');
  setTimeout(()=> { if (startOverlay) startOverlay.style.display = 'none'; }, 400);
  startLoading();
});

/* Allow quick changeMusic use (keeps compatibility with your existing buttons) */
function changeMusic(src, loop = false) {
  try { playClick(); } catch(e){}
  // find index in playlist if present
  const idx = playlist.findIndex(t => t.src === src);
  if (idx !== -1) {
    loadTrack(idx, true);
    bgMusic.loop = !!loop;
    return;
  }
  // otherwise create a standalone player
  try { bgMusic.pause(); } catch(e){}
  bgMusic = new Audio(src);
  bgMusic.preload = 'auto';
  bgMusic.loop = !!loop;
  bgMusic.volume = 0.28;
  bgMusic.addEventListener('timeupdate', onTimeUpdate);
  bgMusic.addEventListener('ended', ()=>{});
  trackNameEl.textContent = "Custom";
  try { connectVisualizer(bgMusic); } catch(e){}
  bgMusic.play().catch(()=>{});
}

/* Auto-resume audio context on first user gesture (mobile) */
document.addEventListener('click', function __resumeOnce() {
  try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){}
}, { once: true });

/* expose helpers for debugging */
window.zmh = window.zmh || {};
window.zmh.loadTrack = loadTrack;
window.zmh.getProgress = () => ({ xp, level, currentTrack });
