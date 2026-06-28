"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  seconds: number;
  running: boolean;
  onComplete?: () => void;
  className?: string;
}

export default function Countdown({
  seconds,
  running,
  onComplete,
  className = "",
}: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const completed = useRef(false);

  // Reset whenever the configured length changes (e.g. practice-mode toggle).
  useEffect(() => {
    setRemaining(seconds);
    completed.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running && !completed.current) {
      completed.current = true;
      onComplete?.();
    }
  }, [remaining, running, onComplete]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const low = remaining <= 15;

  return (
    <div
      className={`tabular-nums font-mono ${low ? "text-red-600" : "text-slate-900"} ${className}`}
    >
      {mm}:{ss.toString().padStart(2, "0")}
    </div>
  );
}
