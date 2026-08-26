"use client";
import { useEffect, useState } from "react";

export type Phase = "idle" | "scripting" | "voicing" | "composing" | "mixing" | "ready" | "error";

const STEPS: { key: Phase; label: string; model: string }[] = [
  { key: "scripting", label: "Writing the script", model: "MiniMax M3" },
  { key: "voicing", label: "Voicing the hosts", model: "Speech 2.8" },
  { key: "composing", label: "Composing the theme", model: "Music 3.0" },
  { key: "mixing", label: "Mixing your episode", model: "in your browser" },
];

const ORDER: Phase[] = ["scripting", "voicing", "composing", "mixing", "ready"];

export function Stages({
  phase,
  voicedCount,
  total,
  composeAt,
}: {
  phase: Phase;
  voicedCount: number;
  total: number;
  composeAt: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== "composing" || !composeAt) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - composeAt) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase, composeAt]);

  const activeIdx = ORDER.indexOf(phase);

  return (
    <ol className="glass rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      {STEPS.map((s) => {
        const idx = ORDER.indexOf(s.key);
        const done = activeIdx > idx;
        const active = phase === s.key;
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-accent text-black"
                  : active
                    ? "grad-btn text-black pulse-ring"
                    : "bg-white/10 text-muted"
              }`}
            >
              {done ? "✓" : idx + 1}
            </span>
            <div className="flex-1">
              <div className={active || done ? "text-foreground" : "text-muted"}>
                {s.label}
                {active && s.key === "voicing" && total > 0 && (
                  <span className="text-muted"> · {voicedCount}/{total} lines</span>
                )}
                {active && s.key === "composing" && (
                  <span className="text-muted"> · {elapsed}s (about a minute)</span>
                )}
              </div>
            </div>
            <span className="font-mono text-[11px] text-muted">{s.model}</span>
          </li>
        );
      })}
    </ol>
  );
}
