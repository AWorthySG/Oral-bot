import type { BalancePuzzle, CoefficientPuzzle, OrderingPuzzle } from '../types';
import { el, sample, shuffle, type Minigame, type MinigameContext } from './minigame';

// Interactive puzzle station: 3 puzzles per session. "coefficients" puzzles
// (balance the equation / fill the expansion) use +/- steppers; "ordering"
// puzzles arrange shuffled tokens into the right sequence. Two wrong checks
// on a puzzle reveals the answer and the puzzle counts as missed.

const PUZZLES_PER_SESSION = 3;
const MAX_WRONG_CHECKS = 2;
const REVEAL_TIME = 2.2;

export function createBalancePuzzle(ctx: MinigameContext): Minigame {
  const puzzles = sample(ctx.bank.balancePuzzles, PUZZLES_PER_SESSION);
  let index = 0;
  let solved = 0;
  let totalWrong = 0;
  let done = false;
  let nextTimer = -1;

  let bodyEl: HTMLElement;
  let feedbackEl: HTMLElement;
  let progressEl: HTMLElement;
  let wrongThisPuzzle = 0;
  let getAttempt: (() => string) | null = null;
  let answerText = '';

  function build(): void {
    const root = ctx.panel!;
    progressEl = el('div', 'mg-subtitle');
    bodyEl = el('div', 'mg-puzzle-body');
    feedbackEl = el('div', 'mg-feedback');
    root.append(progressEl, bodyEl, feedbackEl);
    showPuzzle();
  }

  function showPuzzle(): void {
    const p = puzzles[index]!;
    wrongThisPuzzle = 0;
    nextTimer = -1;
    progressEl.textContent = `Puzzle ${index + 1} of ${puzzles.length}`;
    feedbackEl.textContent = '';
    feedbackEl.className = 'mg-feedback';
    bodyEl.innerHTML = '';
    bodyEl.appendChild(el('div', 'mg-prompt', p.prompt));
    if (p.kind === 'coefficients') buildCoefficients(p);
    else buildOrdering(p);

    const check = el('button', 'mg-button', 'Check');
    check.addEventListener('click', onCheck);
    bodyEl.appendChild(check);
  }

  function buildCoefficients(p: CoefficientPuzzle): void {
    const row = el('div', 'mg-coef-row');
    const values: number[] = p.solution.map(() => 1);
    let blank = 0;
    for (const part of p.parts) {
      if (part === null) {
        const slot = blank++;
        const stepper = el('div', 'mg-stepper');
        const minus = el('button', 'mg-step', '−');
        const value = el('span', 'mg-step-value', '1');
        const plus = el('button', 'mg-step', '+');
        minus.addEventListener('click', () => {
          values[slot] = Math.max(1, values[slot]! - 1);
          value.textContent = String(values[slot]);
        });
        plus.addEventListener('click', () => {
          values[slot] = Math.min(12, values[slot]! + 1);
          value.textContent = String(values[slot]);
        });
        stepper.append(minus, value, plus);
        row.appendChild(stepper);
      } else {
        row.appendChild(el('span', 'mg-coef-part', part));
      }
    }
    bodyEl.appendChild(row);
    getAttempt = () => values.join(',');
    answerText = p.solution.join(', ');
  }

  function buildOrdering(p: OrderingPuzzle): void {
    let tokens = shuffle(p.tokens);
    if (tokens.join('|') === p.tokens.join('|') && tokens.length > 1) {
      tokens = [...tokens.slice(1), tokens[0]!];
    }
    const picked: string[] = [];
    const answerRow = el('div', 'mg-order-answer');
    const pool = el('div', 'mg-order-pool');
    const buttons = tokens.map((t) => {
      const b = el('button', 'mg-card mg-token', t);
      b.addEventListener('click', () => {
        if (b.disabled) return;
        b.disabled = true;
        picked.push(t);
        answerRow.appendChild(el('span', 'mg-token-placed', t));
      });
      pool.appendChild(b);
      return b;
    });
    const undo = el('button', 'mg-button mg-secondary', 'Undo');
    undo.addEventListener('click', () => {
      const last = picked.pop();
      if (last === undefined) return;
      answerRow.lastElementChild?.remove();
      const btn = buttons.find((b) => b.disabled && b.textContent === last);
      if (btn) btn.disabled = false;
    });
    bodyEl.append(pool, el('div', 'mg-subtitle', 'Your order:'), answerRow, undo);
    getAttempt = () => picked.join('|');
    answerText = p.tokens.join('  →  ');
  }

  function onCheck(): void {
    if (done || nextTimer >= 0 || !getAttempt) return;
    const p = puzzles[index]!;
    const want = p.kind === 'coefficients' ? p.solution.join(',') : p.tokens.join('|');
    if (getAttempt() === want) {
      solved++;
      ctx.playSfx('correct');
      feedbackEl.textContent = 'Solved!';
      feedbackEl.className = 'mg-feedback good';
      nextTimer = 1.0;
    } else {
      wrongThisPuzzle++;
      totalWrong++;
      ctx.playSfx('wrong');
      if (wrongThisPuzzle >= MAX_WRONG_CHECKS) {
        feedbackEl.textContent = `Answer: ${answerText}`;
        feedbackEl.className = 'mg-feedback bad';
        nextTimer = REVEAL_TIME;
      } else {
        feedbackEl.textContent = 'Not quite - try again!';
        feedbackEl.className = 'mg-feedback bad';
      }
    }
  }

  function next(): void {
    index++;
    if (index >= puzzles.length) {
      done = true;
      ctx.finish({
        correct: solved,
        total: puzzles.length,
        perfect: solved === puzzles.length && totalWrong === 0,
        forfeited: false,
      });
      return;
    }
    showPuzzle();
  }

  return {
    start: build,
    update(dt: number) {
      if (done || nextTimer < 0) return;
      nextTimer -= dt;
      if (nextTimer <= 0) next();
    },
    dispose() {
      done = true;
    },
  };
}
