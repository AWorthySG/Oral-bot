import { NextRequest, NextResponse } from "next/server";
import { generateFeedback, isConfigured } from "@/lib/claude";
import type { FeedbackReport, FeedbackRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as FeedbackRequest;

  if (!isConfigured()) {
    const res: FeedbackReport = {
      configured: false,
      estimated: true,
      overallComment:
        "AI feedback isn't switched on for this site yet, so no marks were generated. You can still replay your recordings and read your transcript below to review your own performance. (Teacher: add an ANTHROPIC_API_KEY to enable automatic feedback.)",
      part1: { score: 0, outOf: 15, band: "—", strengths: [], improvements: [] },
      part2: { score: 0, outOf: 15, band: "—", strengths: [], improvements: [] },
      modelPhrases: [],
    };
    return NextResponse.json(res);
  }

  try {
    const report = await generateFeedback(body);
    return NextResponse.json(report);
  } catch (err) {
    console.error("feedback error", err);
    return NextResponse.json(
      {
        configured: true,
        estimated: true,
        overallComment:
          "Sorry — something went wrong while generating your feedback. Please try again, or review your transcript and recordings below.",
        part1: { score: 0, outOf: 15, band: "—", strengths: [], improvements: [] },
        part2: { score: 0, outOf: 15, band: "—", strengths: [], improvements: [] },
        modelPhrases: [],
      } satisfies FeedbackReport,
      { status: 200 }
    );
  }
}
