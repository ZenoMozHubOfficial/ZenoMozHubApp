// --- Existing click sound ---
function playClick() {
  const audio = new Audio('sounds/click.ogg');
  audio.play();
}

// --- Background music ---
const bgMusic = new Audio('sounds/bg-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

// --- Start button logic ---
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
  // Play background music
  bgMusic.play().catch(e => console.log("Autoplay blocked"));

  // Spin logo
  const logo = document.querySelector('.logo img');
  logo.style.animation = 'logoSpin 0.5s ease-out forwards';

  // Enable buttons
  document.querySelectorAll('.buttons button').forEach(btn => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
  });

  // Hide overlay
  startOverlay.style.display = 'none';
});
