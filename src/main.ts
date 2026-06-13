import * as THREE from 'three';
import './styles.css';
import { Game } from './game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const game = new Game(canvas, renderer);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  game.onResize();
});

const clock = new THREE.Clock();
function loop(): void {
  const dt = Math.min(clock.getDelta(), 0.05);
  game.update(dt);
  requestAnimationFrame(loop);
}
loop();
