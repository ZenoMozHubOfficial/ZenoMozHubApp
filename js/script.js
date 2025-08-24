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

  // Spin logo (quick spin at start)
  const logo = document.querySelector('.logo img');
  logo.style.animation = 'logoSpin 0.5s ease-out forwards';

  // Show buttons + re-trigger animations
  document.querySelectorAll('.buttons button').forEach((btn, index) => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(30px)';

    setTimeout(() => {
      btn.style.transition = 'all 0.8s ease-out';
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 0 20px #ff3333, 0 0 40px #ff3333';
    }, 100 * (index + 1));
  });

  // Fade in title + subtitle
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

// --- Particles.js config ---
particlesJS("particles-js", {
  "particles": {
    "number": { "value": 80 },
    "color": { "value": "#ff3333" },
    "shape": { "type": "circle" },
    "opacity": { "value": 0.5, "random": true },
    "size": { "value": 3, "random": true },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#ff3333",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 2,
      "direction": "none",
      "straight": false,
      "out_mode": "out"
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": { "enable": true, "mode": "repulse" },
      "onclick": { "enable": true, "mode": "push" }
    },
    "modes": {
      "repulse": { "distance": 100 },
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});
<!-- Version text -->
  <div class="version-text">version: 1.0.1</div>

  <!-- Your particles & main logic -->
  <script src="js/script.js"></script>

  <!-- Extra start + spinning logo script -->
  <script>
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    const logo = document.querySelector('.logo img');

    // Background music
    const bgMusic = new Audio('sounds/bg-music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;

    startBtn.addEventListener('click', () => {
      // Play music
      bgMusic.play().catch(e => console.log("Autoplay blocked"));

      // Add spinning class
      logo.classList.add('spin');

      // Show buttons + animate
      document.querySelectorAll('.buttons button').forEach((btn, index) => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(30px)';

        setTimeout(() => {
          btn.style.transition = 'all 0.8s ease-out';
          btn.style.opacity = '1';
          btn.style.transform = 'translateY(0)';
          btn.style.boxShadow = '0 0 20px #ff3333, 0 0 40px #ff3333';
        }, 150 * (index + 1));
      });

      // Fade in title & subtitle
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
  </script>
</body>
</html>
