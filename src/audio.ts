// Procedural sound effects via the Web Audio API - no audio assets needed.
// All sounds are short synthesised note sequences. The AudioContext is only
// created after the first real user gesture (browsers require this), so it
// never logs an autoplay warning during headless tests.

export type SfxName =
  | 'select'
  | 'correct'
  | 'wrong'
  | 'xp'
  | 'gradeUp'
  | 'unlock'
  | 'start'
  | 'forfeit';

interface Note {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

const N = (freq: number, start: number, dur: number, type: OscillatorType = 'triangle', gain = 1): Note => ({
  freq,
  start,
  dur,
  type,
  gain,
});

// Simple note frequencies for the little jingles.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const A4 = 440;
const G4 = 392;

const PATTERNS: Record<SfxName, Note[]> = {
  select: [N(A4, 0, 0.08, 'square', 0.5)],
  correct: [N(E5, 0, 0.1), N(G5, 0.09, 0.14)],
  wrong: [N(220, 0, 0.16, 'sawtooth', 0.6), N(170, 0.12, 0.2, 'sawtooth', 0.6)],
  xp: [N(G5, 0, 0.08), N(C6, 0.07, 0.12)],
  gradeUp: [N(C5, 0, 0.1), N(E5, 0.1, 0.1), N(G5, 0.2, 0.1), N(C6, 0.3, 0.22)],
  unlock: [N(G4, 0, 0.09), N(C5, 0.09, 0.09), N(E5, 0.18, 0.09), N(G5, 0.27, 0.18, 'triangle', 0.9)],
  start: [N(C5, 0, 0.09), N(G5, 0.09, 0.14)],
  forfeit: [N(330, 0, 0.14, 'sawtooth', 0.5), N(247, 0.12, 0.22, 'sawtooth', 0.5)],
};

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private unlocked = false;
  muted: boolean;

  constructor() {
    this.muted = localStorage.getItem('oralbot:muted') === '1';
    const unlock = () => {
      this.unlocked = true;
      this.ensure();
      if (this.ctx?.state === 'suspended') void this.ctx.resume();
    };
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  }

  private ensure(): void {
    if (this.ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.28;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem('oralbot:muted', muted ? '1' : '0');
    if (this.master) this.master.gain.value = muted ? 0 : 0.28;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  play(name: SfxName): void {
    if (!this.unlocked || this.muted) return;
    this.ensure();
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    for (const note of PATTERNS[name]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = note.type ?? 'triangle';
      osc.frequency.value = note.freq;
      const t0 = now + note.start;
      const peak = 0.22 * (note.gain ?? 1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + note.dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + note.dur + 0.02);
    }
  }
}
