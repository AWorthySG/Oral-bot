// Shared contracts used across the game: subjects, grades, content banks,
// minigame results, zone configs and the save format.

export type SubjectId =
  | 'math'
  | 'english'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'econs'
  | 'gp';

export const SUBJECT_IDS: SubjectId[] = [
  'math',
  'english',
  'physics',
  'chemistry',
  'biology',
  'econs',
  'gp',
];

/** The five subjects with an O-level tier (the "core" school subjects). */
export const CORE_SUBJECTS: SubjectId[] = [
  'math',
  'english',
  'physics',
  'chemistry',
  'biology',
];

export const SUBJECT_NAMES: Record<SubjectId, string> = {
  math: 'Mathematics',
  english: 'English',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  econs: 'Economics',
  gp: 'General Paper',
};

export const SUBJECT_SHORT: Record<SubjectId, string> = {
  math: 'MA',
  english: 'EN',
  physics: 'PH',
  chemistry: 'CH',
  biology: 'BI',
  econs: 'EC',
  gp: 'GP',
};

export type Tier = 'O' | 'A';

export type MinigameKind = 'quiz' | 'match' | 'balance' | 'arcade';

export const GRADES = ['F9', 'E8', 'D7', 'C6', 'C5', 'B4', 'B3', 'A2', 'A1'] as const;
export type Grade = (typeof GRADES)[number];

export interface Question {
  prompt: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation?: string;
}

export interface MatchSet {
  title: string;
  pairs: { left: string; right: string }[];
}

/** Fill in the numeric blanks (null slots in `parts`); solution[i] is the i-th blank. */
export interface CoefficientPuzzle {
  kind: 'coefficients';
  prompt: string;
  parts: (string | null)[];
  solution: number[];
}

/** Arrange shuffled tokens into the correct order; `tokens` is stored in the correct order. */
export interface OrderingPuzzle {
  kind: 'ordering';
  prompt: string;
  tokens: string[];
}

export type BalancePuzzle = CoefficientPuzzle | OrderingPuzzle;

export interface TierBank {
  questions: Question[];
  matchSets: MatchSet[];
  balancePuzzles: BalancePuzzle[];
}

export interface SubjectBank {
  subject: SubjectId;
  tiers: Partial<Record<Tier, TierBank>>;
}

export interface MinigameResult {
  correct: number;
  total: number;
  perfect: boolean;
  forfeited: boolean;
  /** Used by the match puzzle to apply an XP penalty. */
  mistakes?: number;
}

export interface SaveData {
  version: 1;
  xp: Record<SubjectId, number>;
  equippedColor: string | null;
  unlockedCosmetics: string[];
  stats: {
    gamesPlayed: number;
    questionsAnswered: number;
    questionsCorrect: number;
  };
  savedAt: string;
}
