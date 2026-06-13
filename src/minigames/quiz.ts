import type { Question } from '../types';
import { el, sample, type Minigame, type MinigameContext } from './minigame';

// Timed multiple-choice quiz: 8 questions, 20 seconds each. Wrong/timeout
// reveals the right answer (plus explanation) before moving on.

const QUESTION_COUNT = 8;
const QUESTION_TIME = 20;
const REVEAL_TIME = 1.8;

export function createQuiz(ctx: MinigameContext): Minigame {
  const questions = sample(ctx.bank.questions, QUESTION_COUNT);
  let index = 0;
  let correct = 0;
  let timeLeft = QUESTION_TIME;
  let revealTimer = -1;
  let done = false;

  let timerFill: HTMLElement;
  let dots: HTMLElement[] = [];
  let promptEl: HTMLElement;
  let choicesEl: HTMLElement;
  let feedbackEl: HTMLElement;

  function build(): void {
    const root = ctx.panel!;
    const header = el('div', 'mg-header');
    const dotRow = el('div', 'mg-dots');
    dots = questions.map(() => {
      const d = el('span', 'mg-dot');
      dotRow.appendChild(d);
      return d;
    });
    const timer = el('div', 'mg-timer');
    timerFill = el('div', 'mg-timer-fill');
    timer.appendChild(timerFill);
    header.append(dotRow, timer);
    promptEl = el('div', 'mg-prompt');
    choicesEl = el('div', 'mg-choices');
    feedbackEl = el('div', 'mg-feedback');
    root.append(header, promptEl, choicesEl, feedbackEl);
    showQuestion();
  }

  function showQuestion(): void {
    const q = questions[index]!;
    timeLeft = QUESTION_TIME;
    revealTimer = -1;
    promptEl.textContent = q.prompt;
    feedbackEl.textContent = '';
    feedbackEl.className = 'mg-feedback';
    choicesEl.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const btn = el('button', 'mg-choice', choice);
      btn.addEventListener('click', () => answer(q, i, btn));
      choicesEl.appendChild(btn);
    });
    dots[index]!.classList.add('current');
  }

  function answer(q: Question, i: number, btn: HTMLButtonElement | null): void {
    if (revealTimer >= 0 || done) return;
    const ok = i === q.answerIndex;
    const buttons = [...choicesEl.querySelectorAll('button')];
    buttons.forEach((b) => (b.disabled = true));
    buttons[q.answerIndex]?.classList.add('right');
    if (ok) {
      correct++;
      ctx.playSfx('correct');
      dots[index]!.classList.add('good');
      feedbackEl.textContent = 'Correct!';
      feedbackEl.classList.add('good');
    } else {
      ctx.playSfx('wrong');
      btn?.classList.add('wrong');
      dots[index]!.classList.add('bad');
      feedbackEl.textContent = q.explanation
        ? `${i < 0 ? "Time's up! " : ''}${q.explanation}`
        : i < 0
          ? "Time's up!"
          : 'Not quite.';
      feedbackEl.classList.add('bad');
    }
    revealTimer = REVEAL_TIME;
  }

  function next(): void {
    dots[index]!.classList.remove('current');
    index++;
    if (index >= questions.length) {
      done = true;
      ctx.finish({
        correct,
        total: questions.length,
        perfect: correct === questions.length,
        forfeited: false,
      });
      return;
    }
    showQuestion();
  }

  return {
    start: build,
    update(dt: number) {
      if (done) return;
      if (revealTimer >= 0) {
        revealTimer -= dt;
        if (revealTimer <= 0) next();
        return;
      }
      timeLeft -= dt;
      timerFill.style.width = `${Math.max(0, (timeLeft / QUESTION_TIME) * 100)}%`;
      if (timeLeft <= 0) answer(questions[index]!, -1, null);
    },
    dispose() {
      done = true;
    },
  };
}
