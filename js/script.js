// --- Click sound ---
function playClick() {
  try {
    const audio = new Audio('sounds/click.mp3');
    audio.volume = 0.8;
    audio.playbackRate = 0.9 + Math.random() * 0.25;
    audio.play().catch(() => {});
  } catch (e) {}
}

// --- Background music & playlist ---
const playlist = [
  {name:"Heaviness", src:"sounds/bg-music1.mp3"},
  {name:"The Heist", src:"sounds/bg-music2.mp3"},
  {name:"Back to Me", src:"sounds/bg-music3.mp3"},
  {name:"Reborn", src:"sounds/bg-music4.mp3"},
  {name:"Track 5", src:"sounds/bg-music5.mp3"},
  {name:"Track 6", src:"sounds/bg-music6.mp3"},
  {name:"Track 7", src:"sounds/bg-music7.mp3"},
  {name:"Track 8", src:"sounds/bg-music8.mp3"},
  {name:"Track 9", src:"sounds/bg-music9.mp3"},
  {name:"Track 10", src:"sounds/bg-music10.mp3"}
];
let currentTrack = 0;
let bgMusic = new Audio(playlist[currentTrack].src);
bgMusic.volume = 0.28;

// --- DOM elements ---
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const btns = document.querySelectorAll('.buttons .btn');
const logo = document.querySelector('.logo img');
const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const loadingPercent = document.querySelector('.loading-percent');

const trackName = document.getElementById("track-name");
const trackSlider = document.getElementById("track-slider");
const playPauseBtn = document.getElementById("play-pause");
const nextBtn = document.getElementById("next-track");
const prevBtn = document.getElementById("prev-track");

// --- XP / Level system ---
let xp = parseInt(localStorage.getItem("xp")) || 0;
let level = parseInt(localStorage.getItem("level")) || 1;
const maxLevel = 10000;
const levelDisplay = document.getElementById("level-display");
const xpFill = document.getElementById("xp-fill");
const xpText = document.getElementById("xp-text");

function xpNeededForLevel(lvl){ return 100 + (lvl-1)*20; }
function saveProgress(){ localStorage.setItem("xp", xp); localStorage.setItem("level", level); }
function updateHUD(){
  while(xp >= xpNeededForLevel(level)){
    xp -= xpNeededForLevel(level); level++;
    if(level>maxLevel) level=maxLevel;
  }
  let percent = Math.min((xp / xpNeededForLevel(level)) * 100,100);
  xpFill.style.width = percent+"%";
  levelDisplay.textContent = `Level: ${level}`;
  xpText.textContent = `${xp} / ${xpNeededForLevel(level)} XP`;
  saveProgress();
}
function addXP(amount){ xp += amount; updateHUD(); }
setInterval(()=>addXP(1),1000);
btns.forEach(btn=>{
  btn.addEventListener("click",()=>{ let reward = 5; if(btn.classList.contains("social")) reward=100; addXP(reward); });
});
updateHUD();

// --- Music Player Controls ---
function loadTrack(index){
  if(index<0) index = playlist.length-1;
  if(index>=playlist.length) index = 0;
  currentTrack = index;
  bgMusic.pause();
  bgMusic = new Audio(playlist[currentTrack].src);
  bgMusic.volume = 0.28;
  bgMusic.play();
  trackName.textContent = playlist[currentTrack].name;
  playPauseBtn.textContent = "⏸️";
}
loadTrack(currentTrack);

playPauseBtn.addEventListener("click",()=>{
  if(bgMusic.paused){ bgMusic.play(); playPauseBtn.textContent="⏸️"; }
  else{ bgMusic.pause(); playPauseBtn.textContent="▸"; }
});
nextBtn.addEventListener("click", ()=>{ loadTrack(currentTrack+1); });
prevBtn.addEventListener("click", ()=>{ loadTrack(currentTrack-1); });

// --- Track slider update ---
bgMusic.addEventListener("timeupdate", ()=>{
  trackSlider.max = Math.floor(bgMusic.duration);
  trackSlider.value = Math.floor(bgMusic.currentTime);
});
trackSlider.addEventListener("input",()=>{ bgMusic.currentTime=trackSlider.value; });

// --- Visualizer ---
const canvas = document.getElementById('music-visualizer');
const ctx = canvas.getContext('2d');
function resizeCanvas(){ canvas.width = window.innerWidth; canvas.height = 80; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
let source;
function connectVisualizer(audio){
  if(source) source.disconnect();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 256;
  renderVisualizer();
}
function renderVisualizer(){
  requestAnimationFrame(renderVisualizer);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let barWidth = (canvas.width / bufferLength) * 2;
  let x = 0;
  for(let i=0;i<bufferLength;i++){
    const barHeight=dataArray[i];
    const hue=(i*3+Date.now()*0.05)%360;
    ctx.fillStyle=`hsl(${hue},100%,50%)`;
    ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=14;
    ctx.fillRect(x, canvas.height-barHeight, barWidth, barHeight);
    x+=barWidth+1;
  }
}
connectVisualizer(bgMusic);

// --- Loading screen ---
let loadingProgress=0, loadingInterval;
function startLoading(){
  loadingScreen.classList.add('active');
  loadingProgress=0;
  loadingFill.style.width='0%'; loadingPercent.textContent='0%';
  const loadingMessages=["Booting modules...","Connecting ZenoMoz Core...","Injecting scripts...","Almost ready..."];
  let msgIndex=0; const loadingText=document.querySelector('.loading-text');
  loadingInterval=setInterval(()=>{
    loadingProgress+=Math.random()*18; if(loadingProgress>=100) loadingProgress=100;
    loadingFill.style.width=loadingProgress+"%"; loadingPercent.textContent=Math.floor(loadingProgress)+"%";
    loadingText.textContent=loadingMessages[msgIndex]; msgIndex=(msgIndex+1)%loadingMessages.length;
    if(loadingProgress>=100) finishLoading();
  },200);
}
function finishLoading(){
  clearInterval(loadingInterval);
  loadingFill.style.width="100%"; loadingPercent.textContent="100%";
  setTimeout(()=>{
    loadingScreen.classList.remove('active');
    bgMusic.play().catch(()=>{});
    if(audioCtx.state==='suspended') audioCtx.resume();
    btns.forEach((btn,i)=>{ setTimeout(()=>btn.classList.add('active'), i*120); });
  },400);
}
startBtn.addEventListener('click', ()=>{
  playClick(); startOverlay.classList.add('hidden');
  setTimeout(()=>startOverlay.style.display='none',400);
  startLoading();
});
loadingScreen.addEventListener('click', finishLoading);
loadingScreen.addEventListener('touchstart', finishLoading);

// --- Button scale ---
btns.forEach(btn=>{
  btn.addEventListener('mousedown',()=>btn.style.transform='scale(1.12)');
  btn.addEventListener('mouseup',()=>btn.style.transform='scale(1)');
  btn.addEventListener('mouseleave',()=>btn.style.transform='scale(1)');
  btn.addEventListener('touchstart',()=>btn.style.transform='scale(1.12)');
  btn.addEventListener('touchend',()=>btn.style.transform='scale(1)');
});
