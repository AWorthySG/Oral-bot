// Keyboard state: held keys plus edge-triggered "pressed this frame" set.
// On-screen touch controls feed in through the same API via setVirtual()/tap().

export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private virtual = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.repeat) return;
      this.down.add(e.code);
      this.pressed.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }

  isDown(code: string): boolean {
    return this.down.has(code) || this.virtual.has(code);
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  /** Held-key state from an on-screen control (e.g. a joystick direction). */
  setVirtual(code: string, on: boolean): void {
    if (on) this.virtual.add(code);
    else this.virtual.delete(code);
  }

  /** One-frame edge press from an on-screen button (interact, menu, ...). */
  tap(code: string): void {
    this.pressed.add(code);
  }

  /** Call once at the end of every frame. */
  endFrame(): void {
    this.pressed.clear();
  }
}
