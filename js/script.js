// --- Click sound ---
function playClick() {
  try { const audio = new Audio('sounds/click.mp3'); audio.volume=0.8; audio.playbackRate=0.9+Math.random()*0.25; audio.play().catch(()=>{}); } catch(e){}
}

// --- Playlist ---
const playlist = [
  { name:"Heaviness", src:"sounds/bg-music1.mp3" },
  { name:"The Heist", src:"sounds/bg-music2.mp3" },
  { name:"Back to Me", src:"sounds/bg-music3.mp3" },
  { name:"Reborn", src:"sounds/bg-music4.mp3" },
  { name:"Track 5", src:"sounds/bg-music5.mp3" },
  { name:"Track 6", src:"sounds/bg-music6.mp3" },
  { name:"Track 7", src:"sounds/bg-music7.mp3" },
  { name:"Track 8", src:"sounds/bg-music8.mp3" },
  { name:"Track 9", src:"sounds/bg-music9.mp3" },
  { name:"Track 10", src:"sounds/bg-music10.mp3" }
];

let currentTrack = 0;
let audio = new Audio();
const trackName = document.getElementById("track-name");
const playPauseBtn = document.getElementById("play-pause-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");
const progressBar = document.getElementById("progress-bar");

// --- Load Track ---
function loadTrack(index){
  audio.src = playlist[index].src;
  trackName.textContent = playlist[index].name;
  audio.play();
  playPauseBtn.textContent = "❚❚";
}

// --- Play/Pause ---
playPauseBtn.addEventListener("click",()=>{
  if(audio.paused){ audio.play(); playPauseBtn.textContent="❚❚"; }
  else { audio.pause(); playPauseBtn.textContent="►"; }
});

// --- Next / Previous ---
nextBtn.addEventListener("click",()=>{ currentTrack=(currentTrack+1)%playlist.length; loadTrack(currentTrack); });
prevBtn.addEventListener("click",()=>{ currentTrack=(currentTrack-1+playlist.length)%playlist.length; loadTrack(currentTrack); });

// --- Update Progress ---
audio.addEventListener("timeupdate",()=>{
  const percent=(audio.currentTime/audio.duration)*100;
  progressBar.value = percent||0;
});

// --- Seek ---
progressBar.addEventListener("input",()=>{ audio.currentTime=(progressBar.value
