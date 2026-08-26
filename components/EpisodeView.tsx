"use client";
import { useState, type ReactNode } from "react";
import { FORMATS, type FormatId } from "@/lib/voices";
import type { Episode } from "@/lib/types";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
};

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted">
      {children}
    </span>
  );
}

export function EpisodeView({
  episode,
  format,
  audioUrl,
  total,
  starts,
  playing,
  cur,
  currentSeg,
  onToggle,
  onSeek,
}: {
  episode: Episode;
  format: FormatId;
  audioUrl: string | null;
  total: number;
  starts: number[];
  playing: boolean;
  cur: number;
  currentSeg: number;
  onToggle: () => void;
  onSeek: (t: number) => void;
}) {
  const preset = FORMATS[format];
  const [showLyrics, setShowLyrics] = useState(false);
  const site = "https://overhear-eight.vercel.app";
  const share =
    `https://twitter.com/intent/tweet?text=` +
    encodeURIComponent(
      `I turned "${episode.title}" into a two-host audio episode with its own theme song 🎧\nBuilt with MiniMax M3 + Speech 2.8 + Music 3.0 on GMI Cloud. #MiniMaxWeek`,
    ) +
    `&url=${encodeURIComponent(site)}`;

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold grad-text">{episode.title}</h2>
        {episode.dek && <p className="mt-1 text-muted">{episode.dek}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>{preset.label}</Chip>
          <Chip>script · M3</Chip>
          <Chip>voices · Speech 2.8</Chip>
          <Chip>theme · Music 3.0</Chip>
        </div>
      </div>

      {audioUrl && (
        <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggle}
              aria-label={playing ? "Pause" : "Play"}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full grad-btn text-black text-xl"
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={Math.max(total, 0.1)}
                step={0.1}
                value={Math.min(cur, total)}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="mt-1 flex justify-between font-mono text-xs text-muted">
                <span>{fmt(cur)}</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-end gap-1 h-8" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-1.5 rounded-full bg-accent2"
                  style={{ height: "100%", animationPlayState: playing ? "running" : "paused", animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={audioUrl} download={`overhear-${episode.title.slice(0, 40).replace(/\W+/g, "-")}.wav`}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
              ↓ Download episode
            </a>
            <a href={share} target="_blank" rel="noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
              Share on X
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {episode.segments.map((seg, i) => {
          const isHost = seg.speaker === "host";
          const name = isHost ? preset.hostName : preset.expertName;
          const active = i === currentSeg;
          return (
            <button
              key={i}
              onClick={() => onSeek(starts[i] ?? 0)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                active ? "border-accent/60 bg-accent/10" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="mb-1 flex items-center gap-2 text-xs">
                <span className={`h-2 w-2 rounded-full ${isHost ? "bg-accent" : "bg-accent2"}`} />
                <span className="font-medium">{name}</span>
                <span className="text-muted">· {seg.emotion}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/90">{seg.text}</p>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Original theme · Music 3.0</div>
            <div className="font-medium">{episode.music.title}</div>
          </div>
          <button onClick={() => setShowLyrics((v) => !v)} className="text-sm text-muted hover:text-foreground">
            {showLyrics ? "Hide lyrics" : "Show lyrics"}
          </button>
        </div>
        {showLyrics && (
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-muted">{episode.music.lyrics}</pre>
        )}
      </div>
    </section>
  );
}
