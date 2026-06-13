import type { Input } from '../input';

// On-screen touch controls for phones and tablets: a left-hand movement
// joystick plus interact / menu / report buttons. They drive the same Input
// the keyboard uses (virtual held keys + tap edges), so every mode - including
// the 3D arcade minigame - works on touch with no extra wiring.

export function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
}

const RADIUS = 55; // joystick travel in px
const DEADZONE = 0.32;

export class TouchControls {
  readonly visible: boolean;

  constructor(parent: HTMLElement, input: Input) {
    this.visible = isTouchDevice();
    const container = document.createElement('div');
    container.className = 'touch-controls';
    if (!this.visible) container.style.display = 'none';

    // --- movement joystick (bottom-left) ---
    const base = document.createElement('div');
    base.className = 'touch-stick';
    const thumb = document.createElement('div');
    thumb.className = 'touch-thumb';
    base.appendChild(thumb);

    let activeId = -1;
    const clearMove = () => {
      thumb.style.transform = 'translate(-50%, -50%)';
      for (const c of ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ShiftLeft']) input.setVirtual(c, false);
    };
    const handle = (e: PointerEvent) => {
      const r = base.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const mag = Math.hypot(dx, dy);
      const clamped = Math.min(mag, RADIUS);
      const ang = Math.atan2(dy, dx);
      const tx = Math.cos(ang) * clamped;
      const ty = Math.sin(ang) * clamped;
      thumb.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
      const nx = (Math.cos(ang) * clamped) / RADIUS;
      const ny = (Math.sin(ang) * clamped) / RADIUS;
      input.setVirtual('KeyW', ny < -DEADZONE);
      input.setVirtual('KeyS', ny > DEADZONE);
      input.setVirtual('KeyA', nx < -DEADZONE);
      input.setVirtual('KeyD', nx > DEADZONE);
      input.setVirtual('ShiftLeft', clamped / RADIUS > 0.9);
    };
    base.addEventListener('pointerdown', (e) => {
      activeId = e.pointerId;
      base.setPointerCapture(activeId);
      handle(e);
      e.preventDefault();
    });
    base.addEventListener('pointermove', (e) => {
      if (e.pointerId === activeId) {
        handle(e);
        e.preventDefault();
      }
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId === activeId) {
        activeId = -1;
        clearMove();
      }
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);

    // --- action buttons ---
    const makeBtn = (cls: string, label: string, code: string): HTMLButtonElement => {
      const b = document.createElement('button');
      b.className = `touch-btn ${cls}`;
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => {
        input.tap(code);
        e.preventDefault();
      });
      return b;
    };
    // Interact (E), report (R), and a menu button mapped to Escape, which the
    // game already treats contextually (pause in the world, forfeit in a game).
    const interact = makeBtn('touch-e', 'E', 'KeyE');
    const report = makeBtn('touch-small touch-report', '☰', 'KeyR');
    const menu = makeBtn('touch-small touch-menu', '⏸', 'Escape');

    container.append(base, interact, report, menu);
    parent.appendChild(container);
  }
}
