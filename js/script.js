/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: Arial, sans-serif;
  color: #fff;
  overflow: hidden;
}

/* Particle background */
#particles-js {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: #111;
}

/* Start overlay */
#start-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

#start-btn {
  padding: 25px 80px;
  font-size: 32px;
  font-weight: bold;
  background: #ff3333;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 0 40px #ff3333, 0 0 80px #ff3333;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

#start-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 60px #ff3333, 0 0 100px #ff3333;
}

/* Main content */
.content {
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  text-align: center;
}

/* Logo */
.logo img {
  width: 180px;
  animation: logoSpin 10s linear infinite;
}

@keyframes logoSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Title */
h1 {
  margin-top: 20px;
  font-size: 48px;
  color: #ff3333;
  text-shadow: 0 0 15px #ff3333;
}

p {
  margin: 10px 0 30px;
  font-size: 22px;
  color: #ccc;
}

/* Buttons */
.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
}

.buttons button {
  padding: 15px 30px;
  background: black;
  border: 2px solid #ff3333;
  color: #fff;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.6;
  pointer-events: none;
  transition: all 0.3s ease;
}

.buttons button:hover {
  background: #ff3333;
  color: #fff;
  box-shadow: 0 0 25px #ff3333, 0 0 50px #ff3333;
}

/* Version text */
.version {
  position: fixed;
  bottom: 10px;
  right: 10px;
  font-size: 14px;
  color: gray;
}    },
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
