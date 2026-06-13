import type * as THREE from 'three';
import type { SfxName } from '../audio';
import type { Input } from '../input';
import type { Player } from '../player';
import type { MinigameResult, SubjectId, Tier, TierBank } from '../types';

// The plug-in contract every minigame implements. Minigames never touch XP:
// they report a MinigameResult through ctx.finish() exactly once and the
// progression system turns it into XP centrally.

/** What the 3D arcade minigame is allowed to touch. */
export interface ArenaAccess {
  scene: THREE.Scene;
  player: Player;
  input: Input;
  snapCamera: () => void;
  showBanner: (question: string, round: number, total: number, timeFrac: number) => void;
  flashAnswer: (correct: boolean, text: string) => void;
  hideBanner: () => void;
}

export interface MinigameContext {
  subject: SubjectId;
  subjectName: string;
  tier: Tier;
  bank: TierBank;
  /** Modal content root for DOM minigames; null for the arcade game. */
  panel: HTMLElement | null;
  /** 3D world access for the arcade game; null for DOM minigames. */
  arena: ArenaAccess | null;
  /** Play a short sound effect (correct/wrong feedback, etc.). */
  playSfx: (name: SfxName) => void;
  finish: (result: MinigameResult) => void;
}

export interface Minigame {
  start(): void;
  update(dt: number): void;
  /** Must be idempotent; called after finish (normal or forfeit). */
  dispose(): void;
}

export type MinigameFactory = (ctx: MinigameContext) => Minigame;

// --- small shared helpers -------------------------------------------------

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
