import type { SubjectBank, SubjectId, Tier, TierBank } from '../types';
import { biology } from './questions/biology';
import { chemistry } from './questions/chemistry';
import { economics } from './questions/economics';
import { english } from './questions/english';
import { gp } from './questions/gp';
import { math } from './questions/math';
import { physics } from './questions/physics';

export const BANKS: Record<SubjectId, SubjectBank> = {
  math,
  english,
  physics,
  chemistry,
  biology,
  econs: economics,
  gp,
};

export function getTierBank(subject: SubjectId, tier: Tier): TierBank | null {
  return BANKS[subject].tiers[tier] ?? null;
}

// Dev-only sanity check: fail loudly if a bank is malformed.
if (import.meta.env?.DEV) {
  for (const subject of Object.keys(BANKS) as SubjectId[]) {
    const bank = BANKS[subject];
    for (const tier of Object.keys(bank.tiers) as Tier[]) {
      const tb = bank.tiers[tier]!;
      if (tb.questions.length < 8) {
        console.warn(`[data] ${subject} ${tier}: only ${tb.questions.length} questions`);
      }
      for (const q of tb.questions) {
        if (q.answerIndex < 0 || q.answerIndex > 3 || q.choices.length !== 4) {
          throw new Error(`[data] ${subject} ${tier}: bad question "${q.prompt}"`);
        }
      }
      for (const p of tb.balancePuzzles) {
        if (p.kind === 'coefficients') {
          const blanks = p.parts.filter((x) => x === null).length;
          if (blanks !== p.solution.length) {
            throw new Error(`[data] ${subject} ${tier}: coefficient blanks mismatch in "${p.prompt}"`);
          }
        }
      }
    }
  }
}
