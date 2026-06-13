import {
  GRADES,
  type Grade,
  type MinigameKind,
  type MinigameResult,
  type Tier,
} from '../types';

// Grade ladder, XP awards and unlock thresholds. Grade is always derived
// from cumulative XP, never stored.

/** Cumulative XP needed for each grade, parallel to GRADES (F9..A1). */
export const GRADE_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500] as const;

export const A_TIER_UNLOCK_GRADE: Grade = 'C6';

export function gradeIndex(g: Grade): number {
  return GRADES.indexOf(g);
}

export function gradeForXp(xp: number): Grade {
  let result: Grade = GRADES[0];
  for (let i = 0; i < GRADES.length; i++) {
    if (xp >= GRADE_XP[i]!) result = GRADES[i]!;
  }
  return result;
}

export function hasGrade(xp: number, target: Grade): boolean {
  return xp >= GRADE_XP[gradeIndex(target)]!;
}

/** Next grade and XP still needed, or null when already at A1. */
export function nextGrade(xp: number): { grade: Grade; needed: number; from: number; to: number } | null {
  for (let i = 0; i < GRADES.length; i++) {
    if (xp < GRADE_XP[i]!) {
      return { grade: GRADES[i]!, needed: GRADE_XP[i]! - xp, from: GRADE_XP[i - 1] ?? 0, to: GRADE_XP[i]! };
    }
  }
  return null;
}

/** Central XP table: A-tier pays roughly 1.6x the O-tier rates. */
export function computeXp(kind: MinigameKind, tier: Tier, result: MinigameResult): number {
  if (result.forfeited) return 0;
  const A = tier === 'A';
  switch (kind) {
    case 'quiz':
      return result.correct * (A ? 16 : 10) + (result.perfect ? (A ? 50 : 30) : 0);
    case 'match': {
      const base = A ? 60 : 40;
      const penalty = A ? 8 : 5;
      const floor = A ? 15 : 10;
      return Math.max(floor, base - (result.mistakes ?? 0) * penalty);
    }
    case 'balance':
      return result.correct * (A ? 25 : 15);
    case 'arcade':
      return result.correct * (A ? 20 : 12);
  }
}
