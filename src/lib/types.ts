export interface PracticeSet {
  id: string;
  theme: string;
  title: string;
  youtubeId: string;
  videoNote?: string;
  part1Prompt: string;
  part2Seeds: string[];
}

export interface InteractionTurn {
  examiner: string;
  student: string;
}

/** Payload sent to /api/examiner to get the next spoken-interaction question. */
export interface ExaminerRequest {
  theme: string;
  title: string;
  part1Prompt: string;
  part1Response: string;
  history: InteractionTurn[];
  seeds: string[];
}

export interface ExaminerResponse {
  question: string;
  configured: boolean;
}

/** Payload sent to /api/feedback for the final report. */
export interface FeedbackRequest {
  theme: string;
  title: string;
  part1Prompt: string;
  part1Response: string;
  interaction: InteractionTurn[];
}

export interface BandScore {
  score: number;
  outOf: number;
  band: string;
  strengths: string[];
  improvements: string[];
}

export interface FeedbackReport {
  configured: boolean;
  estimated: boolean;
  overallComment: string;
  part1: BandScore;
  part2: BandScore;
  modelPhrases: string[];
}
