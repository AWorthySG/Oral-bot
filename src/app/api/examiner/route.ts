import { NextRequest, NextResponse } from "next/server";
import { generateExaminerQuestion, isConfigured } from "@/lib/claude";
import type { ExaminerRequest, ExaminerResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExaminerRequest;

  if (!isConfigured()) {
    // Graceful fallback: walk through the set's seed questions in order.
    const seed =
      body.seeds?.[body.history?.length ?? 0] ??
      "Thank you. Can you tell me a little more about why you feel that way?";
    const res: ExaminerResponse = { question: seed, configured: false };
    return NextResponse.json(res);
  }

  try {
    const question = await generateExaminerQuestion(body);
    const res: ExaminerResponse = { question, configured: true };
    return NextResponse.json(res);
  } catch (err) {
    console.error("examiner error", err);
    const seed =
      body.seeds?.[body.history?.length ?? 0] ??
      "Thank you. Could you say a bit more about that?";
    return NextResponse.json({ question: seed, configured: true });
  }
}
