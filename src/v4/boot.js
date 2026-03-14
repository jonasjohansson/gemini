import * as THREE from 'three';
import { Game } from './Game.js';

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
renderer.autoClear = false;
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const game = new Game(renderer);

let prev = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now;
  game.update(dt);
  game.render();
}
requestAnimationFrame(loop);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  game.onResize();
});
