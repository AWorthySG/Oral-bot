"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FeedbackReport,
  InteractionTurn,
  PracticeSet,
} from "@/lib/types";
import {
  AudioCapture,
  Dictation,
  speak,
  speechRecognitionSupported,
  speechSynthesisSupported,
  stopSpeaking,
} from "@/lib/speech";
import Countdown from "./Countdown";
import FeedbackView from "./FeedbackView";

type Stage = "briefing" | "watch" | "prep" | "part1" | "part2" | "feedback";

const PREP_SECONDS = { full: 600, practice: 120 };
const PART1_SECONDS = { full: 120, practice: 60 };
const MAX_QUESTIONS = 4;

export default function ExamFlow({ set }: { set: PracticeSet }) {
  const [stage, setStage] = useState<Stage>("briefing");
  const [practiceMode, setPracticeMode] = useState(true);
  const [notes, setNotes] = useState("");

  // Part 1 state
  const [p1Transcript, setP1Transcript] = useState("");
  const [p1Audio, setP1Audio] = useState<string | null>(null);
  const [p1Recording, setP1Recording] = useState(false);
  const [p1Started, setP1Started] = useState(false);

  // Part 2 state
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [interaction, setInteraction] = useState<InteractionTurn[]>([]);
  const [interactionAudio, setInteractionAudio] = useState<(string | null)[]>([]);
  const [p2Recording, setP2Recording] = useState(false);
  const [examinerSpeaking, setExaminerSpeaking] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // Feedback
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Feature support (resolved on mount to avoid SSR mismatch)
  const [support, setSupport] = useState({ stt: true, tts: true });

  const dictationRef = useRef<Dictation | null>(null);
  const audioRef = useRef<AudioCapture | null>(null);

  useEffect(() => {
    setSupport({
      stt: speechRecognitionSupported(),
      tts: speechSynthesisSupported(),
    });
    // Warm up the TTS voice list.
    if (speechSynthesisSupported()) window.speechSynthesis.getVoices();
  }, []);

  // ---- recording helpers -------------------------------------------------

  const beginRecording = useCallback(
    (onUpdate: (full: string) => void) => {
      const dict = new Dictation((full) => onUpdate(full));
      dict.start();
      dictationRef.current = dict;
      const cap = new AudioCapture();
      cap.start();
      audioRef.current = cap;
    },
    []
  );

  const endRecording = useCallback(async (): Promise<{
    text: string;
    audio: string | null;
  }> => {
    const text = dictationRef.current?.stop() ?? "";
    const audio = (await audioRef.current?.stop()) ?? null;
    dictationRef.current = null;
    audioRef.current = null;
    return { text, audio };
  }, []);

  // ---- Part 1 ------------------------------------------------------------

  function startPart1() {
    setP1Started(true);
    setP1Recording(true);
    setP1Transcript("");
    beginRecording((full) => setP1Transcript(full));
  }

  async function stopPart1() {
    setP1Recording(false);
    const { text, audio } = await endRecording();
    setP1Transcript((prev) => text || prev);
    setP1Audio(audio);
  }

  // ---- Part 2 ------------------------------------------------------------

  const fetchQuestion = useCallback(
    async (history: InteractionTurn[]) => {
      setLoadingQuestion(true);
      try {
        const res = await fetch("/api/examiner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme: set.theme,
            title: set.title,
            part1Prompt: set.part1Prompt,
            part1Response: p1Transcript,
            history,
            seeds: set.part2Seeds,
          }),
        });
        const data = await res.json();
        const q: string = data.question;
        setQuestion(q);
        setLoadingQuestion(false);
        setExaminerSpeaking(true);
        await speak(q);
        setExaminerSpeaking(false);
      } catch {
        setLoadingQuestion(false);
      }
    },
    [set, p1Transcript]
  );

  function enterPart2() {
    setStage("part2");
    setInteraction([]);
    setInteractionAudio([]);
    fetchQuestion([]);
  }

  function startAnswer() {
    stopSpeaking();
    setExaminerSpeaking(false);
    setAnswerText("");
    setP2Recording(true);
    beginRecording((full) => setAnswerText(full));
  }

  async function submitAnswer() {
    setP2Recording(false);
    const { text, audio } = await endRecording();
    const finalAnswer = text || answerText;
    const turn: InteractionTurn = { examiner: question, student: finalAnswer };
    const nextInteraction = [...interaction, turn];
    setInteraction(nextInteraction);
    setInteractionAudio((a) => [...a, audio]);
    setAnswerText("");

    if (nextInteraction.length >= MAX_QUESTIONS) {
      goToFeedback(nextInteraction);
    } else {
      fetchQuestion(nextInteraction);
    }
  }

  function endConversationEarly() {
    if (p2Recording) {
      // Save whatever has been said before finishing.
      submitAnswer().then(() => {});
      return;
    }
    goToFeedback(interaction);
  }

  // ---- Feedback ----------------------------------------------------------

  async function goToFeedback(finalInteraction: InteractionTurn[]) {
    stopSpeaking();
    setStage("feedback");
    setLoadingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: set.theme,
          title: set.title,
          part1Prompt: set.part1Prompt,
          part1Response: p1Transcript,
          interaction: finalInteraction,
        }),
      });
      setReport(await res.json());
    } catch {
      setReport(null);
    } finally {
      setLoadingFeedback(false);
    }
  }

  // ---- render ------------------------------------------------------------

  return (
    <div>
      <ProgressBar stage={stage} />

      {stage === "briefing" && (
        <Briefing
          set={set}
          support={support}
          practiceMode={practiceMode}
          setPracticeMode={setPracticeMode}
          onStart={() => setStage("watch")}
        />
      )}

      {stage === "watch" && (
        <section className="space-y-4">
          <YouTube id={set.youtubeId} note={set.videoNote} />
          <PromptCard prompt={set.part1Prompt} />
          <NavButton onClick={() => setStage("prep")}>
            I&apos;ve watched it — start preparing →
          </NavButton>
        </section>
      )}

      {stage === "prep" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Preparation time
              </p>
              <p className="text-xs text-slate-400">
                Jot down your ideas. Your notes stay with you while you speak.
              </p>
            </div>
            <Countdown
              seconds={practiceMode ? PREP_SECONDS.practice : PREP_SECONDS.full}
              running
              onComplete={() => setStage("part1")}
              className="text-3xl"
            />
          </div>
          <PromptCard prompt={set.part1Prompt} compact />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Your notes…"
            className="h-44 w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <NavButton onClick={() => setStage("part1")}>
            I&apos;m ready to speak →
          </NavButton>
        </section>
      )}

      {stage === "part1" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Part 1 · Planned Response
              </p>
              <p className="text-xs text-slate-400">
                Speak for up to {practiceMode ? "1" : "2"} minute
                {practiceMode ? "" : "s"}. Talk clearly into your mic.
              </p>
            </div>
            <Countdown
              seconds={practiceMode ? PART1_SECONDS.practice : PART1_SECONDS.full}
              running={p1Recording}
              onComplete={stopPart1}
              className="text-3xl"
            />
          </div>

          {notes && (
            <details className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
              <summary className="cursor-pointer font-medium text-slate-600">
                Your notes
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{notes}</p>
            </details>
          )}

          <PromptCard prompt={set.part1Prompt} compact />

          {!support.stt && <UnsupportedNotice />}

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            {!p1Started && (
              <button
                onClick={startPart1}
                className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700"
              >
                ● Start speaking
              </button>
            )}
            {p1Recording && (
              <button
                onClick={stopPart1}
                className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700"
              >
                ■ Stop
              </button>
            )}
            {p1Started && (
              <div className="mt-3 min-h-[3rem] rounded-lg bg-slate-50 p-3 text-slate-700">
                {p1Transcript || (
                  <span className="text-slate-400">
                    {p1Recording
                      ? "Listening… your words will appear here."
                      : "No speech captured."}
                  </span>
                )}
              </div>
            )}
            {p1Started && !p1Recording && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={startPart1}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  ↻ Try again
                </button>
                <button
                  onClick={enterPart2}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Continue to the conversation →
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {stage === "part2" && (
        <section className="space-y-4">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Part 2 · Spoken Interaction
            </p>
            <p className="text-xs text-slate-400">
              Question {Math.min(interaction.length + 1, MAX_QUESTIONS)} of{" "}
              {MAX_QUESTIONS}. Listen, then answer in full sentences.
            </p>
          </div>

          <div className="rounded-xl bg-brand-50 p-5 ring-1 ring-brand-100">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👩‍🏫</span>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Examiner
                </p>
                <p className="mt-1 text-slate-800">
                  {loadingQuestion ? "Thinking of a question…" : question}
                </p>
                {support.tts && question && !loadingQuestion && (
                  <button
                    onClick={() => speak(question)}
                    className="mt-2 text-sm text-brand-600 hover:text-brand-800"
                  >
                    🔊 Hear it again
                  </button>
                )}
              </div>
            </div>
          </div>

          {!support.stt && <UnsupportedNotice />}

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            {!p2Recording ? (
              <button
                onClick={startAnswer}
                disabled={loadingQuestion || examinerSpeaking}
                className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {examinerSpeaking ? "Examiner is speaking…" : "● Answer now"}
              </button>
            ) : (
              <button
                onClick={submitAnswer}
                className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700"
              >
                ■ Done answering
              </button>
            )}
            {(p2Recording || answerText) && (
              <div className="mt-3 min-h-[3rem] rounded-lg bg-slate-50 p-3 text-slate-700">
                {answerText || (
                  <span className="text-slate-400">
                    Listening… your answer will appear here.
                  </span>
                )}
              </div>
            )}
          </div>

          {interaction.length > 0 && (
            <button
              onClick={endConversationEarly}
              className="text-sm text-slate-500 underline hover:text-slate-800"
            >
              End the conversation &amp; get feedback now
            </button>
          )}
        </section>
      )}

      {stage === "feedback" && (
        <FeedbackStage
          loading={loadingFeedback}
          report={report}
          set={set}
          notes={notes}
          p1Transcript={p1Transcript}
          p1Audio={p1Audio}
          interaction={interaction}
          interactionAudio={interactionAudio}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-views
// --------------------------------------------------------------------------

function ProgressBar({ stage }: { stage: Stage }) {
  const steps: { key: Stage; label: string }[] = [
    { key: "watch", label: "Watch" },
    { key: "prep", label: "Prepare" },
    { key: "part1", label: "Part 1" },
    { key: "part2", label: "Part 2" },
    { key: "feedback", label: "Feedback" },
  ];
  const order: Stage[] = ["briefing", "watch", "prep", "part1", "part2", "feedback"];
  const current = order.indexOf(stage);
  return (
    <div className="no-print mb-5 flex items-center gap-2">
      {steps.map((s) => {
        const done = order.indexOf(s.key) <= current;
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full ${done ? "bg-brand-500" : "bg-slate-200"}`}
            />
            <span
              className={`text-[11px] ${done ? "text-brand-700" : "text-slate-400"}`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Briefing({
  set,
  support,
  practiceMode,
  setPracticeMode,
  onStart,
}: {
  set: PracticeSet;
  support: { stt: boolean; tts: boolean };
  practiceMode: boolean;
  setPracticeMode: (v: boolean) => void;
  onStart: () => void;
}) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{set.title}</h1>
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-800">How this works</h2>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-700">
          <li>Watch a short video on the topic.</li>
          <li>Prepare your ideas (with an on-screen notepad).</li>
          <li>
            <strong>Part 1:</strong> speak your planned response into the mic.
          </li>
          <li>
            <strong>Part 2:</strong> have a spoken conversation with the AI
            examiner.
          </li>
          <li>Get instant feedback and replay your recordings.</li>
        </ol>
      </div>

      {!support.stt && <UnsupportedNotice />}

      <label className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <input
          type="checkbox"
          checked={practiceMode}
          onChange={(e) => setPracticeMode(e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-slate-700">
          <strong>Quick practice mode</strong> — shorter timers (2 min prep, 1
          min response). Uncheck for full exam timing (10 min prep, 2 min
          response).
        </span>
      </label>

      <NavButton onClick={onStart}>Begin →</NavButton>
    </section>
  );
}

function FeedbackStage({
  loading,
  report,
  set,
  notes,
  p1Transcript,
  p1Audio,
  interaction,
  interactionAudio,
}: {
  loading: boolean;
  report: FeedbackReport | null;
  set: PracticeSet;
  notes: string;
  p1Transcript: string;
  p1Audio: string | null;
  interaction: InteractionTurn[];
  interactionAudio: (string | null)[];
}) {
  return (
    <section className="space-y-5">
      {loading && (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-slate-600">Marking your responses…</p>
        </div>
      )}

      {!loading && report && <FeedbackView report={report} />}

      {!loading && (
        <>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-800">
              Part 1 · Your planned response
            </h3>
            {p1Audio && (
              <audio controls src={p1Audio} className="mt-2 w-full" />
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {p1Transcript || "(no response captured)"}
            </p>
          </div>

          {interaction.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-800">
                Part 2 · The conversation
              </h3>
              <div className="mt-3 space-y-4">
                {interaction.map((t, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-brand-700">
                      Examiner: {t.examiner}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      You: {t.student || "(no answer)"}
                    </p>
                    {interactionAudio[i] && (
                      <audio
                        controls
                        src={interactionAudio[i]!}
                        className="mt-1 w-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="no-print flex flex-wrap gap-3">
            <a
              href={`/practice/${set.id}`}
              className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
            >
              Practise again
            </a>
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 hover:bg-slate-200"
            >
              Print / save as PDF
            </button>
            <a
              href="/"
              className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 hover:bg-slate-200"
            >
              Try another topic
            </a>
          </div>
          {notes && (
            <details className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
              <summary className="cursor-pointer font-medium text-slate-600">
                Your preparation notes
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{notes}</p>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function YouTube({ id, note }: { id: string; note?: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="relative aspect-video bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          title="Stimulus video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="flex items-center justify-between gap-2 p-3 text-xs text-slate-500">
        <span>{note || "Watch the clip, then continue."}</span>
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-brand-600 hover:text-brand-800"
        >
          Open on YouTube ↗
        </a>
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  compact = false,
}: {
  prompt: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-amber-50 ring-1 ring-amber-200 ${compact ? "p-3" : "p-5"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Your task
      </p>
      <p className="mt-1 text-slate-800">{prompt}</p>
    </div>
  );
}

function UnsupportedNotice() {
  return (
    <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
      <strong>Speech features need Chrome or Edge.</strong> Your browser
      doesn&apos;t support live speech-to-text, so your spoken words won&apos;t
      be transcribed. You can still watch, prepare and read along, but for the
      full experience please switch to Google Chrome or Microsoft Edge on a
      laptop.
    </div>
  );
}

function NavButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700"
    >
      {children}
    </button>
  );
}
