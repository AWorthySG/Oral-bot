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

// "Best played with a keyboard" notice on touch devices.
if (window.matchMedia('(pointer: coarse)').matches) {
  const notice = document.createElement('div');
  notice.className = 'touch-notice';
  notice.textContent = '⌨ Best played with a keyboard';
  document.getElementById('ui-root')!.appendChild(notice);
}

const clock = new THREE.Clock();
function loop(): void {
  const dt = Math.min(clock.getDelta(), 0.05);
  game.update(dt);
  requestAnimationFrame(loop);
}
loop();
