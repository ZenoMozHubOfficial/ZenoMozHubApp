function playClick() {
  const audio = new Audio('sounds/click.ogg');
  audio.play();
}
window.addEventListener('load', () => {
  const music = new Audio('sounds/bg-music.mp3');
  music.loop = true;
  music.volume = 0.3;
  music.play().catch(e => {
    console.log("Autoplay blocked, user needs to interact with the page first");
  });
});
