import Anthropic from "@anthropic-ai/sdk";
import type {
  ExaminerRequest,
  FeedbackRequest,
  FeedbackReport,
  InteractionTurn,
} from "./types";

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

export function isConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Marking guidance modelled on the Cambridge/SEAB 1184 Paper 4 oral assessment.
 * Part 1 (Planned Response, 15 marks) and Part 2 (Spoken Interaction, 15 marks)
 * are each judged on clarity & fluency of expression, organisation/coherence of
 * ideas, and engagement / personal response. Wording is an approximation of the
 * published band descriptors, so scores are labelled "estimated".
 */
const RUBRIC = `You are an experienced Singapore GCE O-Level English (syllabus 1184) Paper 4 oral examiner.

You assess two components, each out of 15 marks:

PART 1 — PLANNED RESPONSE (15 marks): the student watches a short video and speaks for up to 2 minutes giving their own response to a prompt. Judge:
- Clarity & fluency: pronunciation, pace, audibility, smooth delivery with few unnatural pauses.
- Organisation: a clear stand/main idea, developed with reasons and examples, in a logical order.
- Engagement & personal response: genuine personal voice, relevant ideas, awareness of audience.

PART 2 — SPOKEN INTERACTION (15 marks): a conversation in which the student responds to the examiner's questions. Judge:
- Clarity & fluency of spoken expression.
- The ability to engage: answering the actual question, developing ideas, giving reasons/examples, and sustaining a natural conversation rather than one-word answers.
- Depth and relevance of personal response and opinions.

Indicative bands (for both parts):
- 13-15 (Strong): fluent, well-organised, perceptive and fully engaged; ideas well developed with apt examples.
- 9-12 (Competent): generally clear and fluent; relevant ideas with some development; mostly engaged.
- 5-8 (Developing): understandable but hesitant or under-developed; ideas thin or repetitive; limited engagement.
- 1-4 (Limited): hard to follow, very brief, or largely off-point.

Be encouraging but honest. Base every judgement ONLY on the transcript you are given. Remember the input is auto-transcribed speech, so ignore minor transcription quirks (missing punctuation, homophones) and do not penalise spelling — focus on what the student actually communicated.`;

export async function generateExaminerQuestion(
  req: ExaminerRequest
): Promise<string> {
  const transcript = formatInteraction(req.history);
  const askedSeeds = req.history.length;
  const seedHint =
    askedSeeds < req.seeds.length
      ? `\n\nIf it fits naturally, you may build on this planned discussion point: "${req.seeds[askedSeeds]}". Adapt it to what the student actually said rather than asking it word-for-word.`
      : "";

  const userPrompt = `Discussion topic: ${req.title} (theme: ${req.theme}).

The student's Part 1 task was: "${req.part1Prompt}"

The student's Part 1 spoken response (auto-transcribed):
"""
${req.part1Response || "(no response was recorded)"}
"""

Conversation so far in Part 2:
${transcript || "(none yet — this is your first question)"}

Ask ONE next question to continue the spoken interaction. Requirements:
- Sound like a warm, natural examiner having a real conversation.
- Build on something specific the student just said when possible; otherwise open a fresh but related angle.
- One clear question only. No preamble, no feedback, no numbering. Output just the question.${seedHint}`;

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 200,
    system: RUBRIC,
    messages: [{ role: "user", content: userPrompt }],
  });

  return textOf(msg).trim();
}

export async function generateFeedback(
  req: FeedbackRequest
): Promise<FeedbackReport> {
  const transcript = formatInteraction(req.interaction);

  const userPrompt = `Assess this practice attempt and return ONLY a JSON object (no markdown fences, no commentary).

Theme: ${req.theme} — ${req.title}

PART 1 task: "${req.part1Prompt}"
PART 1 student response (auto-transcribed):
"""
${req.part1Response || "(no response recorded)"}
"""

PART 2 spoken interaction:
${transcript || "(no interaction recorded)"}

Return this exact JSON shape:
{
  "overallComment": "2-3 warm, specific sentences summarising how the student did and the single most useful thing to work on.",
  "part1": {
    "score": <integer 0-15>,
    "band": "Strong | Competent | Developing | Limited",
    "strengths": ["short point", "short point"],
    "improvements": ["short, actionable point", "short, actionable point"]
  },
  "part2": {
    "score": <integer 0-15>,
    "band": "Strong | Competent | Developing | Limited",
    "strengths": ["short point", "short point"],
    "improvements": ["short, actionable point", "short, actionable point"]
  },
  "modelPhrases": ["a useful sentence opener or phrase the student could have used", "another", "another"]
}

Keep each list item under 20 words. Be encouraging and concrete.`;

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: RUBRIC,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = textOf(msg).trim();
  const parsed = JSON.parse(extractJson(raw));

  return {
    configured: true,
    estimated: true,
    overallComment: String(parsed.overallComment ?? ""),
    part1: {
      score: clampScore(parsed.part1?.score),
      outOf: 15,
      band: String(parsed.part1?.band ?? "—"),
      strengths: toStringArray(parsed.part1?.strengths),
      improvements: toStringArray(parsed.part1?.improvements),
    },
    part2: {
      score: clampScore(parsed.part2?.score),
      outOf: 15,
      band: String(parsed.part2?.band ?? "—"),
      strengths: toStringArray(parsed.part2?.strengths),
      improvements: toStringArray(parsed.part2?.improvements),
    },
    modelPhrases: toStringArray(parsed.modelPhrases),
  };
}

function formatInteraction(turns: InteractionTurn[]): string {
  return turns
    .map(
      (t, i) =>
        `Examiner Q${i + 1}: ${t.examiner}\nStudent: ${t.student || "(no answer)"}`
    )
    .join("\n\n");
}

function textOf(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw;
}

function clampScore(v: unknown): number {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(15, n));
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean).slice(0, 5);
}
