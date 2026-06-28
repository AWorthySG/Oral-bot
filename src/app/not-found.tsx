import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Topic not found</h1>
      <p className="text-slate-600">
        That practice topic doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
      >
        Back to all topics
      </Link>
    </main>
  );
}
