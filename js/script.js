// --- Existing click sound ---
function playClick() {
  const audio = new Audio('sounds/click.ogg');
  audio.play();
}

// --- Background music autoplay ---
window.addEventListener('load', () => {
  const bgMusic = new Audio('sounds/bg-music.mp3');
  bgMusic.loop = true;       // loop infinitely
  bgMusic.volume = 0.3;      // adjust volume
  bgMusic.play().catch(e => {
    console.log("Autoplay blocked by browser. User must interact to start music.");
  });
});
