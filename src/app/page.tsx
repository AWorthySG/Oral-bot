import Link from "next/link";
import { practiceSets } from "@/lib/practice-sets";

export default function HomePage() {
  const themes = Array.from(new Set(practiceSets.map((s) => s.theme)));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          GCE O-Level English · 1184 · Paper 4
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Oral Communication Practice
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Pick a topic below to practise both parts of the oral exam: the{" "}
          <strong>Planned Response</strong> (watch a video, prepare, then speak
          for up to 2 minutes) and the <strong>Spoken Interaction</strong> (a
          conversation with an AI examiner). You&apos;ll get instant feedback and
          can replay your own recordings at the end.
        </p>
      </header>

      <div className="mb-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-100">
        <p className="font-medium">Before you start</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-brand-800">
          <li>
            Use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>{" "}
            on a laptop for the speaking features to work.
          </li>
          <li>Find a quiet room and allow microphone access when asked.</li>
          <li>Wear earphones so the examiner&apos;s voice isn&apos;t picked up by your mic.</li>
        </ul>
      </div>

      {themes.map((theme) => (
        <section key={theme} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">{theme}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {practiceSets
              .filter((s) => s.theme === theme)
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/practice/${s.id}`}
                  className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-brand-300"
                >
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
                    {s.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {s.part1Prompt}
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-brand-600">
                    Start practice →
                  </span>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
