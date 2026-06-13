import {
  CORE_SUBJECTS,
  SUBJECT_IDS,
  SUBJECT_NAMES,
  type Grade,
  type MinigameKind,
  type MinigameResult,
  type SaveData,
  type SubjectId,
  type Tier,
} from '../types';
import { A_TIER_UNLOCK_GRADE, computeXp, gradeForXp, hasGrade } from './grades';

export interface AwardSummary {
  xpGain: number;
  oldGrade: Grade;
  newGrade: Grade;
  /** Banner lines for things that just unlocked. */
  messages: string[];
  zoneUnlocks: SubjectId[];
  cosmeticUnlocks: string[];
}

export const COSMETIC_DEFS: { id: string; name: string; hint: string; test: (p: Progression) => boolean }[] = [
  {
    id: 'colors',
    name: 'Outfit Colours',
    hint: 'Reach C6 in any subject',
    test: (p) => SUBJECT_IDS.some((s) => hasGrade(p.xp[s], 'C6')),
  },
  {
    id: 'cap',
    name: "Scholar's Cap",
    hint: 'Reach B3 in any subject',
    test: (p) => SUBJECT_IDS.some((s) => hasGrade(p.xp[s], 'B3')),
  },
  {
    id: 'scarf',
    name: 'Golden Scarf',
    hint: 'Reach A1 in any subject',
    test: (p) => SUBJECT_IDS.some((s) => hasGrade(p.xp[s], 'A1')),
  },
  {
    id: 'trim',
    name: "Graduate's Gold Trim",
    hint: 'All five O-level subjects at C6',
    test: (p) => CORE_SUBJECTS.every((s) => hasGrade(p.xp[s], 'C6')),
  },
];

export const OUTFIT_COLORS = ['#4f7df9', '#e25563', '#2fae62', '#f2b53a', '#8e5ff0'];

/** XP ledger plus everything derived from it: grades, unlocks, cosmetics. */
export class Progression {
  xp: Record<SubjectId, number>;
  equippedColor: string | null;
  unlockedCosmetics: string[];
  stats: SaveData['stats'];

  constructor(save: SaveData | null) {
    this.xp = {
      math: 0,
      english: 0,
      physics: 0,
      chemistry: 0,
      biology: 0,
      econs: 0,
      gp: 0,
    };
    if (save) {
      for (const s of SUBJECT_IDS) this.xp[s] = save.xp[s] ?? 0;
    }
    this.equippedColor = save?.equippedColor ?? null;
    this.unlockedCosmetics = save?.unlockedCosmetics ? [...save.unlockedCosmetics] : [];
    this.stats = save?.stats ?? { gamesPlayed: 0, questionsAnswered: 0, questionsCorrect: 0 };
  }

  gradeOf(subject: SubjectId): Grade {
    return gradeForXp(this.xp[subject]);
  }

  countCoreAt(grade: Grade): number {
    return CORE_SUBJECTS.filter((s) => hasGrade(this.xp[s], grade)).length;
  }

  isZoneUnlocked(subject: SubjectId): boolean {
    if (subject === 'econs') return hasGrade(this.xp.math, 'C6') && this.countCoreAt('C6') >= 2;
    if (subject === 'gp') return hasGrade(this.xp.english, 'C6') && this.countCoreAt('D7') >= 3;
    return true;
  }

  isATierUnlocked(subject: SubjectId): boolean {
    if (subject === 'econs' || subject === 'gp') return this.isZoneUnlocked(subject);
    return hasGrade(this.xp[subject], A_TIER_UNLOCK_GRADE);
  }

  availableTiers(subject: SubjectId): Tier[] {
    if (subject === 'econs' || subject === 'gp') return ['A'];
    return this.isATierUnlocked(subject) ? ['O', 'A'] : ['O'];
  }

  award(subject: SubjectId, kind: MinigameKind, tier: Tier, result: MinigameResult): AwardSummary {
    this.stats.gamesPlayed += 1;
    this.stats.questionsAnswered += result.total;
    this.stats.questionsCorrect += result.correct;
    return this.applyXp(subject, computeXp(kind, tier, result));
  }

  /** Add XP and report grade changes plus anything that just unlocked. */
  applyXp(subject: SubjectId, gain: number): AwardSummary {
    const zonesBefore = { econs: this.isZoneUnlocked('econs'), gp: this.isZoneUnlocked('gp') };
    const aTiersBefore = new Map(CORE_SUBJECTS.map((s) => [s, this.isATierUnlocked(s)]));
    const oldGrade = this.gradeOf(subject);

    this.xp[subject] += Math.max(0, Math.round(gain));
    const newGrade = this.gradeOf(subject);

    const messages: string[] = [];
    const zoneUnlocks: SubjectId[] = [];
    for (const s of ['econs', 'gp'] as const) {
      if (!zonesBefore[s] && this.isZoneUnlocked(s)) {
        zoneUnlocks.push(s);
        messages.push(`${SUBJECT_NAMES[s]} zone unlocked!`);
      }
    }
    for (const s of CORE_SUBJECTS) {
      if (!aTiersBefore.get(s) && this.isATierUnlocked(s)) {
        messages.push(`A-Level ${SUBJECT_NAMES[s]} unlocked!`);
      }
    }
    const cosmeticUnlocks: string[] = [];
    for (const def of COSMETIC_DEFS) {
      if (!this.unlockedCosmetics.includes(def.id) && def.test(this)) {
        this.unlockedCosmetics.push(def.id);
        cosmeticUnlocks.push(def.id);
        messages.push(`New reward: ${def.name}`);
      }
    }
    return { xpGain: gain, oldGrade, newGrade, messages, zoneUnlocks, cosmeticUnlocks };
  }

  /** A short suggested next goal, shown on the HUD and pause screen. */
  nextObjective(): string {
    const belowC6 = CORE_SUBJECTS.filter((s) => !hasGrade(this.xp[s], 'C6'));
    if (belowC6.length > 0) {
      const target = belowC6.sort((a, b) => this.xp[b] - this.xp[a])[0]!;
      return `Reach C6 in ${SUBJECT_NAMES[target]} to unlock its A-Level paper`;
    }
    if (!this.isZoneUnlocked('econs')) {
      return 'Lift Maths and two more subjects to C6 to open the Economics zone';
    }
    if (!this.isZoneUnlocked('gp')) {
      return 'Build three subjects to D7+ to open the General Paper zone';
    }
    const notTopped = SUBJECT_IDS.filter((s) => this.isZoneUnlocked(s) && this.gradeOf(s) !== 'A1');
    if (notTopped.length > 0) {
      const target = notTopped.sort((a, b) => this.xp[b] - this.xp[a])[0]!;
      return `Push ${SUBJECT_NAMES[target]} all the way to A1`;
    }
    return 'You have topped every subject — a perfect scholar!';
  }

  toSave(): SaveData {
    return {
      version: 1,
      xp: { ...this.xp },
      equippedColor: this.equippedColor,
      unlockedCosmetics: [...this.unlockedCosmetics],
      stats: { ...this.stats },
      savedAt: new Date().toISOString(),
    };
  }
}
