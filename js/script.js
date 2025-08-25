/* =============================
   script.js — enhanced ZenoMoz Hub
   (visualizer, crossfade, achievements, tilt, cursor trail, offline etc.)
   =============================*/

/* ---------------------------
   Utilities & Audio helpers
   ---------------------------*/
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.7;
    audio.playbackRate = 0.95 + Math.random() * 0.2;
    audio.play().catch(()=>{});
  } catch(e){}
}

// crossfade music player (two <audio> objects swapped)
let playerA = new Audio('sounds/bg-music1.mp3');
let playerB = new Audio();
playerA.loop = playerB.loop = true;
playerA.volume = 0.28;
playerB.volume = 0;

let activePlayer = playerA;
let fadingPlayer = playerB;
let fadeDuration = 800; // ms

function setVolume(v){
  playerA.volume = v;
  playerB.volume = v;
}

/* change music with crossfade */
function changeMusic(src){
  playClick();
  try{
    // if same src, toggle play/pause
    if (activePlayer.src && activePlayer.src.includes(src) && !activePlayer.paused) {
      activePlayer.pause();
      return;
    }
    // prepare fading player
    fadingPlayer.pause();
    fadingPlayer.src = src;
    fadingPlayer.currentTime = 0;
    fadingPlayer.loop = true;
    fadingPlayer.volume = 0;
    fadingPlayer.play().catch(()=>{});
    // crossfade
    const start = performance.now();
    const baseVol = Math.max(0.04, activePlayer.volume || 0.28);
    const step = (t) => {
      const now = performance.now();
      const p = Math.min(1, (now - start) / fadeDuration);
      activePlayer.volume = baseVol * (1 - p);
      fadingPlayer.volume = baseVol * p;
      if (p < 1) requestAnimationFrame(step);
      else {
        try { activePlayer.pause(); } catch(e){}
        // swap
        const tmp = activePlayer;
        activePlayer = fadingPlayer;
        fadingPlayer = tmp;
      }
    };
    requestAnimationFrame(step);
    // ensure analyzer reconnect
    if (typeof connectVisualizer === 'function') {
      try { connectVisualizer(activePlayer); }catch(e){}
    }
  }catch(e){
    // fallback simple swap
    try { activePlayer.pause(); activePlayer = new Audio(src); activePlayer.loop=true; activePlayer.volume=0.28; activePlayer.play().catch(()=>{}); } catch(e){}
  }
}

/* ---------------------------
   DOM elements
   ---------------------------*/
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btnsContainer = document.getElementById('links-list');
const btns = () => document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const loadingPercent = document.querySelector('.loading-percent');
const loadingText = document.querySelector('.loading-text');
const searchInput = document.getElementById('search-input');
const bgModeSelect = document.getElementById('bg-mode');
const themeToggle = document.getElementById('theme-toggle');
const volumeSlider = document.getElementById('volume-slider');
const offlineBanner = document.getElementById('offline-banner');
const achievementToast = document.getElementById('achievement-toast');
const aiAvatar = document.getElementById('ai-avatar');
const aiBubble = document.getElementById('ai-bubble');
const aiText = document.getElementById('ai-text');
const aiReadBtn = document.getElementById('ai-read');
const aiCloseBtn = document.getElementById('ai-close');
const achList = document.getElementById('ach-list');

/* ---------------------------
   Visualizer setup
   ---------------------------*/
const canvas = document.getElementById('music-visualizer');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
function resizeCanvas(){ if(!canvas) return; canvas.width = window.innerWidth; canvas.height = 120; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let sourceNode = null;

function connectVisualizer(audio){
  try{
    if (sourceNode) { try{ sourceNode.disconnect(); }catch(e){} }
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    renderVisualizer();
    pulseElements();
  }catch(e){
    console.warn('connectVisualizer error', e);
  }
}

/* render bars (no white line) */
let visualizerRunning = false;
function renderVisualizer(){
  if(!ctx || !analyser) return;
  if(!visualizerRunning) visualizerRunning = true;
  requestAnimationFrame(renderVisualizer);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // bars
  const barWidth = Math.max(2, (canvas.width / bufferLength) * 2);
  let x = 0;
  for(let i=0;i<bufferLength;i++){
    const barHeight = dataArray[i];
    const hue = (i*3 + Date.now()*0.03)%360;
    ctx.fillStyle = `hsl(${hue},100%,50%)`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

/* pulse buttons to music (update CSS var for glow) */
let pulseRunning = false;
function pulseElements(){
  if(!analyser) return;
  if(!pulseRunning) pulseRunning = true;
  requestAnimationFrame(pulseElements);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const bass = dataArray.slice(0,8).reduce((a,b)=>a+b,0)/8;
  const glow = Math.min(1, Math.max(0, bass/160));

  document.querySelectorAll('.buttons .btn').forEach(b=>{
    // set a custom shadow intensity
    b.style.boxShadow = `0 6px 24px rgba(0,0,0,0.6), 0 0 ${20 + glow*40}px rgba(255,80,80,${glow})`;
    // slight scale
    if(!b.dataset.pressed) b.style.transform = `scale(${1 + glow*0.035})`;
  });

  if(logo) logo.style.transform = `rotate(${Date.now()*0.04}deg) scale(${1 + Math.min(0.09, bass/2000)})`;
}

/* ---------------------------
   Loading + intro
   ---------------------------*/
const loadingMessages = [
  "Booting modules...",
  "Connecting ZenoMoz Core...",
  "Injecting scripts...",
  "Compiling neon shaders...",
  "Decrypting assets...",
  "Synchronizing visualizer...",
  "Almost ready..."
];

let loadingProgress=0, loadingInterval=null;
function startLoading(){
  if(loadingScreen) loadingScreen.classList.add('active');
  loadingProgress=0;
  if(loadingFill) loadingFill.style.width='0%';
  if(loadingPercent) loadingPercent.textContent='0%';
  let msgIndex=0;
  loadingInterval = setInterval(()=>{
    loadingProgress += 6 + Math.random()*18;
    if(loadingProgress>=100) loadingProgress=100;
    if(loadingFill) loadingFill.style.width = loadingProgress + "%";
    if(loadingPercent) loadingPercent.textContent = Math.floor(loadingProgress) + "%";
    if(loadingText) {
      loadingText.textContent = loadingMessages[msgIndex];
      msgIndex = (msgIndex+1) % loadingMessages.length;
    }
    if(loadingProgress>=100) finishLoading();
  }, 220);
}

function finishLoading(){
  clearInterval(loadingInterval);
  if(loadingFill) loadingFill.style.width = "100%";
  if(loadingPercent) loadingPercent.textContent = "100%";
  setTimeout(()=>{
    if(loadingScreen) loadingScreen.classList.remove('active');
    try{ activePlayer.play().catch(()=>{}); }catch(e){}
    if(audioCtx.state === 'suspended') audioCtx.resume();
    connectVisualizer(activePlayer);
    // reveal buttons (stagger)
    document.querySelectorAll('.buttons .btn').forEach((btn,i)=>{
      setTimeout(()=> btn.classList.add('active'), i*80);
    });
  }, 300);
}

if(startBtn) startBtn.addEventListener('click', ()=>{
  playClick();
  if(startOverlay) startOverlay.classList.add('hidden');
  setTimeout(()=>{ if(startOverlay) startOverlay.style.display='none'; }, 420);
  startLoading();
});

/* skip loading by tapping loading screen */
if(loadingScreen){
  loadingScreen.addEventListener('click', finishLoading);
  loadingScreen.addEventListener('touchstart', finishLoading, {passive:true});
}

/* ---------------------------
   Button interactions: tilt + hold
   ---------------------------*/
function setupButtonInteractions(){
  document.querySelectorAll('.buttons .btn').forEach(btn=>{
    btn.addEventListener('mousedown', ()=>{ btn.dataset.pressed='true'; btn.style.transform='scale(1.06)';});
    btn.addEventListener('mouseup', ()=>{ btn.dataset.pressed=''; btn.style.transform='';});
    btn.addEventListener('mouseleave', ()=>{ btn.dataset.pressed=''; btn.style.transform='';});
    btn.addEventListener('touchstart', ()=>{ btn.dataset.pressed='true'; btn.style.transform='scale(1.06)'; }, {passive:true});
    btn.addEventListener('touchend', ()=>{ btn.dataset.pressed=''; btn.style.transform=''; }, {passive:true});
  });
}
setupButtonInteractions();

/* tilt effect: mousemove on container */
document.addEventListener('mousemove', e=>{
  document.querySelectorAll('.buttons .btn').forEach(btn=>{
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = (e.clientX - cx);
    const dy = (e.clientY - cy);
    const rx = -dy / 30;
    const ry = dx / 30;
    btn.style.transform = (btn.dataset.pressed ? btn.style.transform : `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1)`);
  });
});

/* gyro tilt for mobile */
window.addEventListener('deviceorientation', (ev)=>{
  const gamma = ev.gamma || 0; // left-right
  const beta = ev.beta || 0;   // front-back
  document.querySelectorAll('.buttons .btn').forEach(btn=>{
    const rx = (beta/12);
    const ry = (gamma/12);
    btn.style.transform = (btn.dataset.pressed ? btn.style.transform : `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1)`);
  });
}, true);

/* ---------------------------
   Cursor trail
   ---------------------------*/
(function cursorTrail(){
  if(typeof document === 'undefined') return;
  const trailCount = 10;
  const trail = [];
  for(let i=0;i<trailCount;i++){
    const d = document.createElement('div');
    d.className = 'cursor-dot';
    d.style.position='fixed';
    d.style.width = (6 + i*1.2) + 'px';
    d.style.height = d.style.width;
    d.style.borderRadius = '50%';
    d.style.pointerEvents='none';
    d.style.zIndex = 999999;
    d.style.opacity = String(0.6 - i*(0.05));
    d.style.background = 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.2))';
    d.style.mixBlendMode = 'screen';
    document.body.appendChild(d);
    trail.push(d);
  }
  let mouse = {x:-100,y:-100}, pos = Array(trailCount).fill({x:-100,y:-100});
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  function anim(){
    pos.unshift({x:mouse.x,y:mouse.y});
    pos.pop();
    for(let i=0;i<trailCount;i++){
      const d = trail[i];
      d.style.transform = `translate(${pos[i].x - 6}px, ${pos[i].y - 6}px)`;
      d.style.background = `radial-gradient(circle, rgba(255,${50+i*6},${50+i*6},${0.9 - i*0.03}), rgba(0,0,0,0))`;
    }
    requestAnimationFrame(anim);
  }
  anim();
})();

/* ---------------------------
   XP + achievements (localStorage)
   ---------------------------*/
let xp = parseInt(localStorage.getItem("zmh_xp")) || 0;
let level = parseInt(localStorage.getItem("zmh_level")) || 1;
const maxLevel = 10000;
const levelDisplay = document.getElementById("level-display");
const xpFill = document.getElementById("xp-fill");
const xpText = document.getElementById("xp-text");

function xpNeededForLevel(lvl){ return 100 + (lvl - 1) * 20; }
function saveProgress(){ try{ localStorage.setItem("zmh_xp", String(xp)); localStorage.setItem("zmh_level", String(level)); }catch(e){} }
function updateHUD(){
  if(!xpFill || !levelDisplay || !xpText) return;
  let needed = xpNeededForLevel(level);
  while(xp >= needed && level < maxLevel){
    xp -= needed; level++; needed = xpNeededForLevel(level);
    unlockAchievement(`Leveled up to ${level}`);
  }
  if(level >= maxLevel){ level = maxLevel; xp = Math.min(xp, xpNeededForLevel(level)); }
  const percent = Math.floor((xp / xpNeededForLevel(level)) * 100);
  xpFill.style.width = percent + "%";
  levelDisplay.textContent = level;
  xpText.textContent = `${xp} / ${xpNeededForLevel(level)} XP`;
  saveProgress();
}
function addXP(amount){ if(typeof amount !== 'number' || amount <= 0) return; xp += Math.floor(amount); updateHUD(); }

let idleInterval = setInterval(()=>{ addXP(1); }, 1000);

/* button XP (default 5, special social 100) */
function wireButtonXP(){
  document.querySelectorAll('.btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      let reward = 5;
      if(btn.classList.contains('social') || btn.dataset.social === 'true') reward = 100;
      addXP(reward);
      // small achievement for clicking
      unlockAchievement(`Clicked: ${btn.textContent.trim().slice(0,20)}`);
    });
  });
}
wireButtonXP();
updateHUD();

/* ---------------------------
   Achievements system
   ---------------------------*/
let achievements = JSON.parse(localStorage.getItem('zmh_ach')) || {};
function unlockAchievement(key){
  if(achievements[key]) return;
  achievements[key] = { when: Date.now() };
  localStorage.setItem('zmh_ach', JSON.stringify(achievements));
  showToast(key);
  refreshAchList();
}
function showToast(text){
  const t = document.createElement('div'); t.className='toast'; t.textContent = text;
  achievementToast.appendChild(t);
  setTimeout(()=>{ t.style.opacity = '0'; t.style.transform='translateX(20px)'; }, 2600);
  setTimeout(()=> t.remove(), 3200);
}
function refreshAchList(){
  if(!achList) return;
  achList.innerHTML = '';
  Object.keys(achievements).slice(-6).reverse().forEach(k=>{
    const li = document.createElement('li');
    li.textContent = k;
    achList.appendChild(li);
  });
}
refreshAchList();

/* ---------------------------
   Search filter for links/buttons
   ---------------------------*/
if(searchInput){
  searchInput.addEventListener('input', e=>{
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.buttons .btn').forEach(b=>{
      const t = (b.dataset.title || b.textContent || '').toLowerCase();
      if(q === '' || t.includes(q)) b.classList.remove('btn--hidden'); else b.classList.add('btn--hidden');
    });
  });
}

/* ---------------------------
   Theme & background modes
   ---------------------------*/
function applyBgMode(mode){
  // update particles and theme class
  if(mode === 'neon'){ document.body.className = 'theme-neon'; window.particlesConfig && window.particlesConfig('neon'); }
  else if(mode === 'space'){ document.body.className = 'theme-space'; window.particlesConfig && window.particlesConfig('space'); }
  else if(mode === 'matrix'){ document.body.className = 'theme-matrix'; window.particlesConfig && window.particlesConfig('matrix'); }
}
if(bgModeSelect){
  bgModeSelect.addEventListener('change', e => applyBgMode(e.target.value));
}

/* theme toggle */
if(themeToggle){
  themeToggle.addEventListener('change', e=>{
    document.body.classList.toggle('theme-neon');
    document.body.classList.toggle('theme-space');
  });
}

/* volume slider */
if(volumeSlider){
  volumeSlider.value = activePlayer.volume;
  volumeSlider.addEventListener('input', e=>{
    const v = parseFloat(e.target.value);
    setVolume(v);
    localStorage.setItem('zmh_volume', String(v));
  });
}
const savedVol = parseFloat(localStorage.getItem('zmh_volume'));
if(!isNaN(savedVol)) { setVolume(savedVol); if(volumeSlider) volumeSlider.value = savedVol; }

/* ---------------------------
   Offline detection + offline screen
   ---------------------------*/
function updateOnlineStatus(){
  if(navigator.onLine){ offlineBanner.style.display='none'; unlockAchievement('Back Online'); }
  else{ offlineBanner.style.display='block'; unlockAchievement('Went Offline'); }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

/* ---------------------------
   AI Assistant
   ---------------------------*/
if(aiAvatar){
  aiAvatar.addEventListener('click', ()=>{
    aiBubble.classList.toggle('hidden');
    if(!aiBubble.classList.contains('hidden')) {
      aiText.textContent = `Hello, SkyeMoz! Current version: 1.0.1 — Level ${level}, XP ${xp}.`;
      // short text-to-speech (if available)
      try {
        const s = new SpeechSynthesisUtterance(aiText.textContent);
        speechSynthesis.cancel();
        speechSynthesis.speak(s);
      } catch(e){}
    }
  });
}
if(aiReadBtn){
  aiReadBtn.addEventListener('click', ()=>{
    // read changelog link or text if available
    const msg = "Opening ChangeLogs. You can find recent changes in the changelog link.";
    try { const u = new SpeechSynthesisUtterance(msg); speechSynthesis.speak(u); } catch(e){}
    window.open('https://tinyurl.com/ChangeLogsZenoMozHub','_blank');
  });
}
if(aiCloseBtn){ aiCloseBtn.addEventListener('click', ()=> aiBubble.classList.add('hidden')); }

/* ---------------------------
   Particles mode presets (helper)
   ---------------------------*/
window.particlesConfig = function(mode){
  try{
    const cfg = {
      neon: { color:'#ff3333', count:200, speed:1.6 },
      space:{ color:'#2ea3ff', count:140, speed:0.6 },
      matrix:{ color:'#00ff66', count:260, speed:1.2 }
    }[mode] || { color:'#ff3333', count:200, speed:1.6 };
    // re-init (simple approach)
    if(window.pJSDom && window.pJSDom.length){ window.pJSDom[0].pJS.particles.number.value = cfg.count; window.pJSDom[0].pJS.particles.color.value = cfg.color; window.pJSDom[0].pJS.particles.move.speed = cfg.speed; }
  }catch(e){}
};

/* ---------------------------
   Init: wire buttons and start default visuals
   ---------------------------*/
function init(){
  // wire xp-buttons (already wired earlier for new ones)
  wireButtonXP();
  setupButtonInteractions();
  refreshAchList();

  // start visualizer binding once user interaction happens
  document.addEventListener('click', function resumeAudio(){ try{ if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){} }, {once:true});

  // start with playerA
  try{ activePlayer = playerA; activePlayer.play().catch(()=>{}); connectVisualizer(activePlayer); }catch(e){}

  // default bg mode
  applyBgMode('neon');
}
init();

/* expose helpers for debugging */
window.zmh = window.zmh || {};
window.zmh.addXP = addXP;
window.zmh.getProgress = () => ({ xp, level });
window.zmh.unlockAchievement = unlockAchievement;
// ================= Quest System =================
const questIcon = document.getElementById('quest-icon');
const questPanel = document.getElementById('quest-panel');
const questClose = document.getElementById('quest-close');
const questList = document.getElementById('quest-list');

let quests = [
  {id:'q1', text:'Finish 1 Music', target:1, progress:0, xp:80},
  {id:'q2', text:'Afk for 30 minutes', target:30, progress:0, xp:1000},
  {id:'q3', text:'Get the key', target:1, progress:0, xp:10},
  {id:'q4', text:'Finish the music Darkfinite', target:1, progress:0, xp:5000},
  {id:'q5', text:'Click 6 musics', target:6, progress:0, xp:60},
];

const allDoneBonus = 1000;

// Load saved progress
if(localStorage.getItem('quests')){
  quests = JSON.parse(localStorage.getItem('quests'));
}

// Render quests
function renderQuests(){
  questList.innerHTML='';
  quests.forEach(q=>{
    const div = document.createElement('div');
    div.className='quest-item';
    div.id=q.id;
    div.innerHTML=`
      <p>${q.text}</p>
      <div class="quest-progress"><div class="quest-progress-fill" style="width:${Math.floor((q.progress/q.target)*100)}%"></div></div>
      <button class="quest-claim ${q.progress>=q.target?'active':''}">Claim +${q.xp} XP</button>
    `;
    questList.appendChild(div);
    div.querySelector('.quest-claim').addEventListener('click', ()=>{
      addXP(q.xp);
      q.progress=0; // reset
      saveQuests();
      renderQuests();
      checkAllDone();
    });
  });
}

// Save quests
function saveQuests(){
  localStorage.setItem('quests', JSON.stringify(quests));
}

// Toggle quest panel
questIcon.addEventListener('click', ()=>questPanel.classList.add('active'));
questClose.addEventListener('click', ()=>questPanel.classList.remove('active'));

// Progress updates
function updateQuestProgress(id, amount=1){
  const quest = quests.find(q=>q.id===id);
  if(!quest) return;
  quest.progress=Math.min(quest.progress+amount, quest.target);
  saveQuests
