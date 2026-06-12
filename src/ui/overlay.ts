import { nextGrade } from '../progression/grades';
import { COSMETIC_DEFS, OUTFIT_COLORS, type Progression } from '../progression/progression';
import { SUBJECT_IDS, SUBJECT_NAMES, type SubjectId, type Tier } from '../types';

// Modal manager: a single backdrop hosting one panel at a time - minigame
// panels, the tier chooser, pause/help, the report card and confirms.

function div(className: string, text?: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = className;
  if (text !== undefined) d.textContent = text;
  return d;
}

function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = className;
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

export class Overlay {
  private backdrop: HTMLElement;
  private panel: HTMLElement;
  private onCloseRequest: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.backdrop = div('modal-backdrop hidden');
    this.panel = div('modal-panel');
    this.backdrop.appendChild(this.panel);
    root.appendChild(this.backdrop);
  }

  get isOpen(): boolean {
    return !this.backdrop.classList.contains('hidden');
  }

  /** What ESC should do while this overlay is open (close, forfeit, ...). */
  requestClose(): void {
    this.onCloseRequest?.();
  }

  private open(title: string | null, onCloseRequest: (() => void) | null): HTMLElement {
    this.panel.innerHTML = '';
    this.onCloseRequest = onCloseRequest;
    if (title) {
      const header = div('modal-header');
      header.appendChild(div('modal-title', title));
      if (onCloseRequest) {
        header.appendChild(button('modal-close', '✕', () => onCloseRequest()));
      }
      this.panel.appendChild(header);
    }
    const body = div('modal-body');
    this.panel.appendChild(body);
    this.backdrop.classList.remove('hidden');
    return body;
  }

  close(): void {
    this.backdrop.classList.add('hidden');
    this.panel.innerHTML = '';
    this.onCloseRequest = null;
  }

  /** Modal shell for DOM minigames; ✕ / ESC triggers onQuit (forfeit). */
  openMinigamePanel(title: string, onQuit: () => void): HTMLElement {
    return this.open(title, onQuit);
  }

  showTierChooser(
    subject: SubjectId,
    tiers: { tier: Tier; enabled: boolean; note: string }[],
    onPick: (tier: Tier) => void,
    onCancel: () => void,
  ): void {
    const body = this.open(SUBJECT_NAMES[subject], onCancel);
    body.appendChild(div('mg-subtitle', 'Choose your level'));
    const row = div('tier-row');
    for (const t of tiers) {
      const label = t.tier === 'O' ? 'O-Level' : 'A-Level';
      const b = button('tier-button', label, () => onPick(t.tier));
      b.disabled = !t.enabled;
      const wrap = div('tier-wrap');
      wrap.appendChild(b);
      if (t.note) wrap.appendChild(div('tier-note', t.note));
      row.appendChild(wrap);
    }
    body.appendChild(row);
  }

  showPause(opts: { onResume: () => void; onReset: () => void }): void {
    const body = this.open('Paused', opts.onResume);
    const help = div('pause-help');
    help.innerHTML = `
      <p><strong>Welcome to Scholar World!</strong> Roam the island and play
      minigames at each subject's stations to raise your grades from F9 to A1.
      Good grades unlock A-Level papers, the JC zones and cosmetic rewards.</p>
      <ul>
        <li><strong>W / S</strong> — move, <strong>A / D</strong> — turn, <strong>Shift</strong> — run</li>
        <li><strong>E</strong> — interact with stations and signs</li>
        <li><strong>R</strong> — report card, <strong>P / Esc</strong> — pause</li>
      </ul>`;
    body.appendChild(help);
    body.appendChild(button('mg-button', 'Resume', opts.onResume));
    body.appendChild(
      button('mg-button mg-danger', 'Reset save', () => {
        this.showConfirm('Erase all progress and start over?', opts.onReset, () =>
          this.showPause(opts),
        );
      }),
    );
  }

  showConfirm(text: string, onYes: () => void, onNo: () => void): void {
    const body = this.open(null, onNo);
    body.appendChild(div('mg-prompt', text));
    const row = div('confirm-row');
    row.appendChild(button('mg-button mg-danger', 'Yes', onYes));
    row.appendChild(button('mg-button mg-secondary', 'No', onNo));
    body.appendChild(row);
  }

  showReportCard(
    p: Progression,
    opts: { onClose: () => void; onEquipColor: (color: string) => void },
  ): void {
    const body = this.open('GCE RESULTS SLIP', opts.onClose);
    body.classList.add('report');

    const table = div('report-table');
    for (const s of SUBJECT_IDS) {
      const row = div('report-row');
      const zoneOpen = p.isZoneUnlocked(s);
      row.appendChild(div('report-subject', SUBJECT_NAMES[s]));
      row.appendChild(div('report-grade', zoneOpen ? p.gradeOf(s) : '\u{1F512}'));
      const barWrap = div('report-bar');
      const fill = div('report-bar-fill');
      const next = nextGrade(p.xp[s]);
      if (next) {
        const frac = (p.xp[s] - next.from) / (next.to - next.from);
        fill.style.width = `${Math.round(frac * 100)}%`;
        barWrap.title = `${next.needed} XP to ${next.grade}`;
      } else {
        fill.style.width = '100%';
      }
      barWrap.appendChild(fill);
      row.appendChild(barWrap);
      const tierNote =
        s === 'econs' || s === 'gp'
          ? zoneOpen
            ? 'A-Level'
            : 'Zone locked'
          : p.isATierUnlocked(s)
            ? 'O + A Level'
            : 'A-Level at C6';
      row.appendChild(div('report-tier', tierNote));
      table.appendChild(row);
    }
    body.appendChild(table);

    const stats = div(
      'report-stats',
      `Games played: ${p.stats.gamesPlayed} · Questions answered: ${p.stats.questionsAnswered}` +
        ` · Accuracy: ${
          p.stats.questionsAnswered > 0
            ? Math.round((p.stats.questionsCorrect / p.stats.questionsAnswered) * 100)
            : 0
        }%`,
    );
    body.appendChild(stats);

    body.appendChild(div('mg-subtitle', 'Rewards'));
    const rewards = div('report-rewards');
    for (const def of COSMETIC_DEFS) {
      const owned = p.unlockedCosmetics.includes(def.id);
      rewards.appendChild(
        div(`report-reward ${owned ? 'owned' : ''}`, `${owned ? '★' : '☆'} ${def.name} — ${def.hint}`),
      );
    }
    body.appendChild(rewards);

    if (p.unlockedCosmetics.includes('colors')) {
      body.appendChild(div('mg-subtitle', 'Outfit colour'));
      const swatches = div('color-row');
      for (const c of OUTFIT_COLORS) {
        const b = button('color-swatch', '', () => {
          opts.onEquipColor(c);
          [...swatches.children].forEach((el) => el.classList.remove('selected'));
          b.classList.add('selected');
        });
        b.style.background = c;
        if (p.equippedColor === c) b.classList.add('selected');
        swatches.appendChild(b);
      }
      body.appendChild(swatches);
    }
  }
}
