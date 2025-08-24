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

  // Show buttons + re-trigger their slide-up animations
  document.querySelectorAll('.buttons button').forEach((btn, index) => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '0'; // reset opacity
    btn.style.transform = 'translateY(30px)'; // reset position

    // trigger slide-up with staggered delay
    setTimeout(() => {
      btn.style.transition = 'all 0.8s ease-out';
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 0 20px #ff3333, 0 0 40px #ff3333';
    }, 100 * (index + 1)); // stagger each button
  });

  // Fade in title and subtitle
  const title = document.querySelector('h1');
  const subtitle = document.querySelector('p');
  title.style.opacity = '0';
  subtitle.style.opacity = '0';
  title.style.transform = 'translateY(-20px)';
  subtitle.style.transform = 'translateY(-20px)';
  title.style.transition = 'all 1s ease-out';
  subtitle.style.transition = 'all 1s ease-out';
  setTimeout(() => {
    title.style.opacity = '1';
    title.style.transform = 'translateY(0)';
    subtitle.style.opacity = '1';
    subtitle.style.transform = 'translateY(0)';
  }, 200);

  // Hide overlay
  startOverlay.style.display = 'none';
});
