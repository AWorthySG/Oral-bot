import Link from "next/link";
import { notFound } from "next/navigation";
import { getPracticeSet, practiceSets } from "@/lib/practice-sets";
import ExamFlow from "@/components/ExamFlow";

export function generateStaticParams() {
  return practiceSets.map((s) => ({ setId: s.id }));
}

export default function PracticePage({
  params,
}: {
  params: { setId: string };
}) {
  const set = getPracticeSet(params.setId);
  if (!set) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← All topics
        </Link>
        <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
          {set.theme}
        </span>
      </div>
      <ExamFlow set={set} />
    </main>
  );
}
