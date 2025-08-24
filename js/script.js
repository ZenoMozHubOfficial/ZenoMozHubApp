// --- Existing click sound ---
function playClick() {
  const audio = new Audio('sounds/click.ogg');
  audio.play();
}

// --- Background music ---
const bgMusic = new Audio('sounds/bg-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

// --- Tap-to-play setup ---
let musicStarted = false;
function startIntro() {
  if (!musicStarted) {
    bgMusic.play().catch(e => console.log("Autoplay blocked, please interact"));
    musicStarted = true;

    // Logo spin on first tap
    const logo = document.querySelector('.logo img');
    logo.style.animation = 'logoSpin 0.5s ease-out forwards';

    // Remove this event listener after first tap
    window.removeEventListener('click', startIntro);
  }
}

// --- Attach to whole window ---
window.addEventListener('click', startIntro);
