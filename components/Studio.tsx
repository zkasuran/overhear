"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FORMATS, type FormatId } from "@/lib/voices";
import type { Episode } from "@/lib/types";
import { requestScript, narrateAll, composeMusic, proxied } from "@/lib/client";
import { assembleEpisode, type AssembledAudio } from "@/lib/audioEngine";
import { Stages, type Phase } from "@/components/Stages";
import { EpisodeView } from "@/components/EpisodeView";

const SAMPLES = [
  "Why do octopuses have three hearts and blue blood?",
  "Explain how a bill becomes a law, simply.",
  "The story of how coffee spread across the world.",
];

export default function Studio() {
  const [source, setSource] = useState("");
  const [format, setFormat] = useState<FormatId>("explainer");
  const [phase, setPhase] = useState<Phase>("idle");
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [voiced, setVoiced] = useState<boolean[]>([]);
  const [audio, setAudio] = useState<AssembledAudio | null>(null);
  const [error, setError] = useState("");
  const [composeAt, setComposeAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const busy = ["scripting", "voicing", "composing", "mixing"].includes(phase);

  // Progressive-reveal hook for the demo-video web capture (see CODEX-VIDEO-BRIEF).
  // Inert for real users: elements default to full opacity; only a capture calls this.
  useEffect(() => {
    (window as unknown as { setReveal?: (k: number, scope?: string) => void }).setReveal = (
      k: number,
      scope = "#stage",
    ) => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(`${scope} [data-step]`));
      els.forEach((el, i) => {
        el.style.transition = "opacity .25s ease";
        el.style.opacity = i < k ? "1" : "0.12";
      });
    };
  }, []);

  const generate = useCallback(async () => {
    try {
      setError(""); setAudio(null); setEpisode(null); setVoiced([]); setPlaying(false); setCur(0);
      setPhase("scripting");
      const { episode: ep } = await requestScript(source.trim(), format);
      setEpisode(ep);
      setVoiced(new Array(ep.segments.length).fill(false));
      setPhase("voicing");
      // Voice every line first. The theme runs after, not in parallel: the GMI
      // audio queue is shared per account and a music render will starve the TTS
      // lines if they compete, so sequential is both faster and more reliable here.
      const urls = await narrateAll(ep, format, (i) =>
        setVoiced((v) => { const n = [...v]; n[i] = true; return n; }),
      );
      setPhase("composing"); setComposeAt(Date.now());
      let musicUrl: string | null = null;
      try { musicUrl = (await composeMusic(ep)).url; } catch { musicUrl = null; }
      setPhase("mixing");
      const a = await assembleEpisode(urls.map(proxied), musicUrl ? proxied(musicUrl) : null);
      setAudio(a);
      setPhase("ready");
    } catch (e) {
      setError(String((e as Error)?.message ?? e)); setPhase("error");
    }
  }, [source, format]);

  const currentSeg = useMemo(() => {
    if (!audio) return -1;
    let idx = -1;
    audio.timeline.starts.forEach((s, i) => { if (cur >= s) idx = i; });
    return idx;
  }, [audio, cur]);

  const toggle = () => {
    const el = audioRef.current; if (!el) return;
    if (el.paused) void el.play(); else el.pause();
  };
  const seek = (t: number) => { const el = audioRef.current; if (el) { el.currentTime = t; setCur(t); } };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14 flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg grad-btn text-black font-bold">O</span>
          <span className="text-lg font-semibold tracking-tight">Overhear</span>
        </div>
        <span className="glass rounded-full px-3 py-1 text-xs text-muted">MiniMax Week × GMI Cloud</span>
      </header>

      {!episode && (
        <div className="flex flex-col gap-3 pt-2">
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
            Reading is optional. <span className="grad-text">Press play instead.</span>
          </h1>
          <p className="text-muted max-w-xl">
            Paste an article or type a topic. Overhear reasons out a two-host episode, gives each host a
            real voice, and scores it with an original theme song, then hands you one audio file.
          </p>
        </div>
      )}

      <div id="stage" className="glass rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
        <textarea
          data-step
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Paste an article, or type a topic like “why the sky is blue”…"
          rows={4}
          className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-[15px] outline-none focus:border-accent/60"
        />
        {!episode && (
          <div data-step className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => setSource(s)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        )}
        <div data-step className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(FORMATS).map((f) => (
            <button key={f.id} onClick={() => setFormat(f.id)} title={f.blurb}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                format === f.id ? "border-accent/70 bg-accent/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div data-step className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted font-mono">M3 · Speech 2.8 · Music 3.0 on GMI Cloud</span>
          <button onClick={generate} disabled={busy || source.trim().length < 3}
            className="grad-btn text-black font-semibold rounded-xl px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
            {busy ? "Working…" : episode ? "Regenerate" : "Generate episode"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}
      {busy && <Stages phase={phase} voicedCount={voiced.filter(Boolean).length} total={voiced.length} composeAt={composeAt} />}

      {episode && (
        <EpisodeView
          episode={episode} format={format}
          audioUrl={audio?.url ?? null} total={audio?.total ?? 0}
          starts={audio?.timeline.starts ?? []}
          playing={playing} cur={cur} currentSeg={currentSeg}
          onToggle={toggle} onSeek={seek}
        />
      )}

      <audio ref={audioRef} src={audio?.url ?? undefined} className="hidden"
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />

      <footer className="mt-4 border-t border-white/8 pt-5 text-xs text-muted flex flex-col gap-1">
        <span>Reasoning, speech, and music by MiniMax models, served on GMI Cloud. Audio is mixed in your browser.</span>
        <span>Built for MiniMax Week. AI assistance was used to build this; the author reviewed and verified it.</span>
      </footer>
    </main>
  );
}
