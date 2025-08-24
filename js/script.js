// --- Existing click sound ---
function playClick() {
  const audio = new Audio('sounds/click.ogg');
  audio.play();
}

// --- Background music setup ---
let musicStarted = false;
const bgMusic = new Audio('sounds/bg-music.mp3'); // correct folder
bgMusic.loop = true;
bgMusic.volume = 0.3; // adjust volume (0.0 - 1.0)

function startMusic() {
  if (!musicStarted) {
    bgMusic.play().catch(e => console.log("Autoplay blocked, user needs to interact"));
    musicStarted = true;
  }
}

// --- Attach startMusic to all buttons ---
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', startMusic);
});

// --- Logo spin on page load ---
window.addEventListener('load', () => {
  const logo = document.querySelector('.logo img');
  logo.style.animation = 'logoSpin 0.5s ease-out forwards';
});
