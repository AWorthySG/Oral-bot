"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        router.replace(from);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect passcode.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-2xl">
            🎤
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Oral Practice</h1>
          <p className="mt-1 text-sm text-slate-500">
            O-Level English 1184 · Paper 4
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="passcode"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Class passcode
            </label>
            <input
              id="passcode"
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              placeholder="Enter the passcode from your teacher"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </main>
  );
}
