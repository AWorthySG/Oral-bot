"use client";

import type { BandScore, FeedbackReport } from "@/lib/types";

function bandColor(band: string): string {
  switch (band) {
    case "Strong":
      return "bg-green-100 text-green-800 ring-green-200";
    case "Competent":
      return "bg-brand-100 text-brand-800 ring-brand-200";
    case "Developing":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "Limited":
      return "bg-red-100 text-red-800 ring-red-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function ScoreCard({ title, s }: { title: string; s: BandScore }) {
  const pct = s.outOf ? (s.score / s.outOf) * 100 : 0;
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${bandColor(s.band)}`}
        >
          {s.band}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-bold text-slate-900">{s.score}</span>
        <span className="pb-1 text-slate-500">/ {s.outOf}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {s.strengths.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            What went well
          </p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-700">
            {s.strengths.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {s.improvements.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            To improve
          </p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-700">
            {s.improvements.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function FeedbackView({ report }: { report: FeedbackReport }) {
  const total = report.part1.score + report.part2.score;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Your feedback</h2>
          {report.configured && (
            <span className="text-right">
              <span className="text-2xl font-bold text-brand-700">{total}</span>
              <span className="text-slate-500"> / 30</span>
            </span>
          )}
        </div>
        <p className="mt-2 text-slate-700">{report.overallComment}</p>
        {report.estimated && report.configured && (
          <p className="mt-3 text-xs text-slate-400">
            Marks are an AI estimate based on published 1184 assessment
            objectives, meant as practice guidance — they are not official exam
            grades.
          </p>
        )}
      </div>

      {report.configured && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreCard title="Part 1 · Planned Response" s={report.part1} />
            <ScoreCard title="Part 2 · Spoken Interaction" s={report.part2} />
          </div>

          {report.modelPhrases.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-800">
                Useful phrases you could try
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {report.modelPhrases.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-slate-50 px-3 py-2 italic ring-1 ring-slate-100"
                  >
                    &ldquo;{p}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
