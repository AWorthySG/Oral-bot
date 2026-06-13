import { el, sample, shuffle, type Minigame, type MinigameContext } from './minigame';

// Pair-matching puzzle: 6 terms on the left, 6 definitions on the right.
// Pick one from each column; wrong pairings count as mistakes (XP penalty).

export function createMatchPuzzle(ctx: MinigameContext): Minigame {
  const set = sample(ctx.bank.matchSets, 1)[0]!;
  const pairs = set.pairs;
  let mistakes = 0;
  let matched = 0;
  let done = false;
  let endTimer = -1;

  let selectedLeft: HTMLButtonElement | null = null;
  let selectedRight: HTMLButtonElement | null = null;

  function build(): void {
    const root = ctx.panel!;
    root.appendChild(el('div', 'mg-subtitle', set.title));
    const grid = el('div', 'mg-match-grid');
    const colL = el('div', 'mg-match-col');
    const colR = el('div', 'mg-match-col');
    grid.append(colL, colR);

    for (const p of shuffle(pairs)) {
      const b = el('button', 'mg-card', p.left);
      b.dataset['key'] = p.left;
      b.addEventListener('click', () => pick(b, 'L'));
      colL.appendChild(b);
    }
    for (const p of shuffle(pairs)) {
      const b = el('button', 'mg-card', p.right);
      b.dataset['key'] = p.left;
      b.addEventListener('click', () => pick(b, 'R'));
      colR.appendChild(b);
    }
    root.appendChild(grid);
  }

  function pick(btn: HTMLButtonElement, side: 'L' | 'R'): void {
    if (done || btn.classList.contains('matched')) return;
    if (side === 'L') {
      selectedLeft?.classList.remove('selected');
      selectedLeft = selectedLeft === btn ? null : btn;
      selectedLeft?.classList.add('selected');
    } else {
      selectedRight?.classList.remove('selected');
      selectedRight = selectedRight === btn ? null : btn;
      selectedRight?.classList.add('selected');
    }
    if (selectedLeft && selectedRight) check(selectedLeft, selectedRight);
  }

  function check(l: HTMLButtonElement, r: HTMLButtonElement): void {
    selectedLeft = null;
    selectedRight = null;
    if (l.dataset['key'] === r.dataset['key']) {
      for (const b of [l, r]) {
        b.classList.remove('selected');
        b.classList.add('matched');
        b.disabled = true;
      }
      matched++;
      if (matched === pairs.length) endTimer = 0.8;
    } else {
      mistakes++;
      for (const b of [l, r]) {
        b.classList.add('shake');
        setTimeout(() => {
          b.classList.remove('selected', 'shake');
        }, 450);
      }
    }
  }

  return {
    start: build,
    update(dt: number) {
      if (done || endTimer < 0) return;
      endTimer -= dt;
      if (endTimer <= 0) {
        done = true;
        ctx.finish({
          correct: pairs.length,
          total: pairs.length,
          perfect: mistakes === 0,
          forfeited: false,
          mistakes,
        });
      }
    },
    dispose() {
      done = true;
    },
  };
}
