"use client";
// Browser-side orchestration. Calls our same-origin API routes (which hold the
// key) and drives the three MiniMax stages: M3 script -> Speech 2.8 narration ->
// Music 3.0 theme. Audio urls are wrapped through /api/audio for decode-safe fetch.
import { FORMATS, type FormatId } from "./voices";
import type { Episode, Segment } from "./types";

export function proxied(url: string): string {
  return `/api/audio?src=${encodeURIComponent(url)}`;
}

async function asJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `request failed (${res.status})`);
  return data;
}

// Both the script and music routes stream NDJSON: {status} keepalives while the
// model works, then a final line with the result (or {error}). Read to the end
// and return the last line that satisfies `isResult`.
async function ndjsonResult(
  res: Response,
  isResult: (o: Record<string, unknown>) => boolean,
  onTick?: () => void,
): Promise<Record<string, unknown>> {
  if (!res.ok || !res.body) throw new Error(`request failed (${res.status})`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let final: Record<string, unknown> | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let o: Record<string, unknown>;
      try {
        o = JSON.parse(line);
      } catch {
        continue;
      }
      if (typeof o.error === "string") throw new Error(o.error);
      if (o.status && onTick) onTick();
      if (isResult(o)) final = o;
    }
  }
  if (!final) throw new Error("stream ended without a result");
  return final;
}

export async function requestScript(
  source: string,
  format: FormatId,
): Promise<{ episode: Episode; format: FormatId }> {
  const res = await fetch("/api/script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, format }),
  });
  const o = await ndjsonResult(res, (x) => x.episode !== undefined);
  return { episode: o.episode as Episode, format: (o.format as FormatId) ?? format };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Synthesize one narration line: submit, then poll to the mp3 url. Retries once
 * if a line stalls (the async queue occasionally leaves one stuck in processing). */
export async function synthLine(
  text: string,
  voice: string,
  emotion: string,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const sub = await asJson(
        await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice, emotion }),
        }),
      );
      const id = sub.id as string;
      for (let i = 0; i < 48; i++) {
        const s = await asJson(await fetch(`/api/tts?id=${id}`));
        if (s.status === "success" && s.url) return s.url as string;
        if (s.status === "failed" || s.status === "cancelled") {
          throw new Error(`voice line ${s.status}`);
        }
        await sleep(2500);
      }
      throw new Error("voice line timed out");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("voice line failed");
}

export type NarrationResult = { index: number; url: string };

/** Narrate every segment with the format's two voices, limited concurrency. */
export async function narrateAll(
  episode: Episode,
  format: FormatId,
  onDone: (index: number) => void,
): Promise<string[]> {
  const preset = FORMATS[format];
  const urls: string[] = new Array(episode.segments.length).fill("");
  const queue = episode.segments.map((seg, index) => ({ seg, index }));
  const workers = new Array(3).fill(0).map(async () => {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      const { seg, index } = job;
      const voice = seg.speaker === "expert" ? preset.expertVoice : preset.hostVoice;
      urls[index] = await synthLine(seg.text, voice, seg.emotion);
      onDone(index);
    }
  });
  await Promise.all(workers);
  return urls;
}

// Music streams NDJSON keepalives while it renders (see app/api/music/route.ts),
// then a final line carrying the url.
export async function composeMusic(
  episode: Episode,
  onTick?: () => void,
): Promise<{ url: string; durationMs: number | null }> {
  const res = await fetch("/api/music", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: episode.music.prompt, lyrics: episode.music.lyrics }),
  });
  const o = await ndjsonResult(res, (x) => x.url !== undefined, onTick);
  if (!o.url) throw new Error("theme produced no audio");
  return { url: o.url as string, durationMs: (o.durationMs as number) ?? null };
}

export type Voiced = { segment: Segment; url: string };
