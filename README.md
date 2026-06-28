# Oral Practice — O-Level English 1184, Paper 4

A website where students practise **Paper 4 (Oral Communication)** of the Singapore
GCE O-Level English syllabus **1184**:

- **Part 1 – Planned Response:** watch a short video, get preparation time with an
  on-screen notepad, then speak a response (recorded and transcribed live).
- **Part 2 – Spoken Interaction:** hold a real spoken conversation with an AI
  examiner that listens to the student and asks follow-up questions by voice.
- **Instant feedback:** an estimated mark out of 15 for each part against the 1184
  assessment objectives, with strengths, things to improve, and model phrases.
  Students can replay their own recordings and print/save the report.

The speech-to-text and the examiner's voice run **free in the browser** (Web Speech
API). The only paid part is the text-only AI calls to Claude.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # then edit .env.local (see below)
npm run dev                  # open http://localhost:3000
```

Use **Google Chrome** or **Microsoft Edge** — the microphone/speech features rely
on the Web Speech API, which Safari and Firefox don't fully support.

## Environment variables

Set these in `.env.local` (local) and in your host's project settings (production):

| Variable            | Required | What it does |
|---------------------|----------|--------------|
| `ANTHROPIC_API_KEY` | No\*     | Enables the AI examiner & AI feedback. Get one at <https://console.anthropic.com>. |
| `CLAUDE_MODEL`      | No       | `claude-sonnet-4-6` (default, better) or `claude-haiku-4-5` (≈10× cheaper). |
| `CLASS_PASSCODE`    | No       | If set, students must enter this passcode to use the site. Leave blank to make it open (handy for local testing). |

\* Without `ANTHROPIC_API_KEY` the site still runs: timers, video, recording and
self-review all work. Part 2 falls back to the topic's preset questions and the
feedback page explains that AI marking is switched off.

### What does the AI cost?

Speech is handled in the browser, so the AI only does text calls. A full practice
session (a few follow-up questions + one feedback report) is roughly
**US$0.03–0.10 on Sonnet**, and about a tenth of that on Haiku. A class of 40
students practising weekly is typically a few dollars a month.

## Deploying (Vercel — free tier)

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new>.
3. Under **Settings → Environment Variables**, add `ANTHROPIC_API_KEY`,
   `CLASS_PASSCODE`, and optionally `CLAUDE_MODEL`.
4. Deploy, and share the URL + passcode with your class.

The API key lives only on the server — it is never sent to students' browsers.

## Adding or changing practice topics

Topics live in [`data/practice-sets.json`](data/practice-sets.json). Each entry:

```jsonc
{
  "id": "single-use-plastic",       // unique, url-safe
  "theme": "The Environment",        // groups topics on the home page
  "title": "Reducing Single-Use Plastic",
  "youtubeId": "_6xlNyWPpB8",        // the YouTube video ID (the part after v=)
  "videoNote": "Short caption shown under the video.",
  "part1Prompt": "The question the student responds to in Part 1.",
  "part2Seeds": [                     // starter questions for the conversation;
    "First follow-up question…",      // the AI builds on the student's answers
    "Second follow-up question…",     // and uses these as a backbone / fallback.
    "Third follow-up question…"
  ]
}
```

**Choosing videos:** the `youtubeId` is the code after `watch?v=` in a YouTube
URL (e.g. `https://www.youtube.com/watch?v=_6xlNyWPpB8` → `_6xlNyWPpB8`). Please
check each video plays inside the site before sharing it with students — some
videos have embedding disabled by their owner, and availability can change. If a
clip ever fails to load, students can still use the **Open on YouTube** link and
the on-screen prompt. The starter videos are suggestions; swap in clips you prefer.

> **About "generating" videos:** a short authentic video stimulus is part of the
> real exam, but reliable AI video generation isn't available here, so this app
> uses curated YouTube clips instead. Editing the JSON above is all it takes to
> point each topic at the video you want.

## Tech notes

- **Next.js (App Router) + TypeScript + Tailwind.**
- Browser: `SpeechRecognition` (live transcription), `speechSynthesis`
  (examiner's voice), `MediaRecorder` (playback) — see `src/lib/speech.ts`.
- Server: Claude calls in `src/lib/claude.ts`, exposed via `/api/examiner` and
  `/api/feedback`. The marking rubric is in that file — tweak the wording there
  if you want it to match your own marking.
- Passcode gate: `src/middleware.ts` + `/api/auth`.

The marks are an AI estimate to guide practice, **not** official grades.
