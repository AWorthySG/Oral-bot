import type { Progression } from '../progression/progression';
import { SUBJECT_IDS, SUBJECT_SHORT, type SubjectId } from '../types';

// Persistent HUD: grade strip, XP toasts, centre banner, interaction prompt
// and the arcade question banner. Plain DOM under #ui-root.

function div(className: string, text?: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = className;
  if (text !== undefined) d.textContent = text;
  return d;
}

export class Hud {
  private chips = new Map<SubjectId, HTMLElement>();
  private toastBox: HTMLElement;
  private bannerEl: HTMLElement;
  private promptEl: HTMLElement;
  private arcadeEl: HTMLElement;
  private arcadeQuestion: HTMLElement;
  private arcadeRound: HTMLElement;
  private arcadeTimerFill: HTMLElement;
  private arcadeFlash: HTMLElement;
  private hintEl: HTMLElement;
  private bannerTimer: number | null = null;

  constructor(root: HTMLElement) {
    const strip = div('hud-grades');
    for (const s of SUBJECT_IDS) {
      const chip = div('hud-chip', `${SUBJECT_SHORT[s]} --`);
      this.chips.set(s, chip);
      strip.appendChild(chip);
    }
    this.toastBox = div('hud-toasts');
    this.bannerEl = div('hud-banner hidden');
    this.promptEl = div('hud-prompt hidden');

    this.arcadeEl = div('hud-arcade hidden');
    this.arcadeRound = div('hud-arcade-round');
    this.arcadeQuestion = div('hud-arcade-question');
    const timer = div('mg-timer');
    this.arcadeTimerFill = div('mg-timer-fill');
    timer.appendChild(this.arcadeTimerFill);
    this.arcadeEl.append(this.arcadeRound, this.arcadeQuestion, timer);
    this.arcadeFlash = div('hud-arcade-flash hidden');

    this.hintEl = div('hud-hint hidden');

    root.append(strip, this.toastBox, this.bannerEl, this.promptEl, this.arcadeEl, this.arcadeFlash, this.hintEl);
  }

  refreshGrades(p: Progression): void {
    for (const s of SUBJECT_IDS) {
      const chip = this.chips.get(s)!;
      chip.textContent = p.isZoneUnlocked(s)
        ? `${SUBJECT_SHORT[s]} ${p.gradeOf(s)}`
        : `${SUBJECT_SHORT[s]} \u{1F512}`;
    }
  }

  flashChip(subject: SubjectId): void {
    const chip = this.chips.get(subject);
    if (!chip) return;
    chip.classList.remove('flash');
    void chip.offsetWidth; // restart the animation
    chip.classList.add('flash');
  }

  toast(text: string): void {
    const t = div('hud-toast', text);
    this.toastBox.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2700);
  }

  banner(title: string, lines: string[] = []): void {
    this.bannerEl.innerHTML = '';
    this.bannerEl.appendChild(div('hud-banner-title', title));
    for (const l of lines) this.bannerEl.appendChild(div('hud-banner-line', l));
    this.bannerEl.classList.remove('hidden');
    if (this.bannerTimer !== null) window.clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => {
      this.bannerEl.classList.add('hidden');
      this.bannerTimer = null;
    }, 3200);
  }

  setPrompt(text: string | null): void {
    if (text === null) {
      this.promptEl.classList.add('hidden');
    } else {
      this.promptEl.innerHTML = '';
      const key = document.createElement('span');
      key.className = 'hud-key';
      key.textContent = 'E';
      this.promptEl.append(key, document.createTextNode(' ' + text));
      this.promptEl.classList.remove('hidden');
    }
  }

  showArcade(question: string, round: number, total: number, timeFrac: number): void {
    this.arcadeEl.classList.remove('hidden');
    this.arcadeRound.textContent = `Round ${round} / ${total}`;
    if (this.arcadeQuestion.textContent !== question) {
      this.arcadeQuestion.textContent = question;
    }
    this.arcadeTimerFill.style.width = `${timeFrac * 100}%`;
  }

  flashAnswer(correctAnswer: boolean, text: string): void {
    this.arcadeFlash.textContent = correctAnswer ? '✓ Correct!' : `✗ Answer: ${text}`;
    this.arcadeFlash.className = `hud-arcade-flash ${correctAnswer ? 'good' : 'bad'}`;
    setTimeout(() => this.arcadeFlash.classList.add('hidden'), 1300);
  }

  hideArcade(): void {
    this.arcadeEl.classList.add('hidden');
    this.arcadeFlash.classList.add('hidden');
  }

  showHint(text: string, ms = 12000): void {
    this.hintEl.textContent = text;
    this.hintEl.classList.remove('hidden');
    setTimeout(() => this.hintEl.classList.add('hidden'), ms);
  }
}
