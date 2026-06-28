"use client";

// Minimal typings for the Web Speech API (not in the standard DOM lib).
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function speechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function mediaRecorderSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/**
 * Live dictation. onUpdate receives the full transcript (finalised + interim)
 * so the caller can show it growing in real time.
 */
export class Dictation {
  private rec: SpeechRecognitionLike | null = null;
  private finalText = "";
  private running = false;
  private wantRunning = false;

  constructor(
    private onUpdate: (full: string, interim: string) => void,
    private onError?: (err: string) => void
  ) {}

  start(): boolean {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return false;
    this.finalText = "";
    this.wantRunning = true;
    this.rec = new Ctor();
    this.rec.lang = "en-SG";
    this.rec.continuous = true;
    this.rec.interimResults = true;

    this.rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) this.finalText += text + " ";
        else interim += text;
      }
      this.onUpdate((this.finalText + interim).trim(), interim);
    };
    this.rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        this.onError?.(e.error);
      }
    };
    // Chrome stops recognition after a pause; auto-restart while we still want it.
    this.rec.onend = () => {
      this.running = false;
      if (this.wantRunning) {
        try {
          this.rec?.start();
          this.running = true;
        } catch {
          /* already starting */
        }
      }
    };

    try {
      this.rec.start();
      this.running = true;
      return true;
    } catch {
      return false;
    }
  }

  stop(): string {
    this.wantRunning = false;
    if (this.rec && this.running) {
      try {
        this.rec.stop();
      } catch {
        /* ignore */
      }
    }
    this.running = false;
    return this.finalText.trim();
  }
}

/** Records mic audio to a playable object URL. */
export class AudioCapture {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    if (!mediaRecorderSupported()) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return false;
    }
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
    return true;
  }

  stop(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(null);
        return;
      }
      this.recorder.onstop = () => {
        this.stream?.getTracks().forEach((t) => t.stop());
        if (this.chunks.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(this.chunks, {
          type: this.recorder?.mimeType || "audio/webm",
        });
        resolve(URL.createObjectURL(blob));
      };
      try {
        this.recorder.stop();
      } catch {
        resolve(null);
      }
    });
  }
}

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!speechSynthesisSupported()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  cachedVoice =
    voices.find((v) => /en-GB|en_GB/i.test(v.lang)) ||
    voices.find((v) => /en-SG|en_SG/i.test(v.lang)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  return cachedVoice;
}

/** Speaks text aloud; resolves when finished (or immediately if unsupported). */
export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!speechSynthesisSupported()) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.rate = 0.98;
    utter.pitch = 1;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export function stopSpeaking(): void {
  if (speechSynthesisSupported()) window.speechSynthesis.cancel();
}
