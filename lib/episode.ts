// M3 orchestration: turn a topic/document into a structured two-host episode
// (script + outline) plus an original theme song spec. All text is model-authored.

import { chat, type ChatMessage } from "./gmi";
import { EMOTIONS, FORMATS, type Emotion, type FormatId } from "./voices";
import type { Episode, Segment } from "./types";

export type EpisodeInput = { source: string; format: FormatId };

function buildMessages(input: EpisodeInput): ChatMessage[] {
  const p = FORMATS[input.format];
  const emotions = EMOTIONS.join(", ");
  const system =
    "You are the show-runner for Overhear, an AI audio studio. You turn a topic or " +
    "pasted text into a short two-host audio episode plus an original theme song. " +
    "You output ONLY one valid minified JSON object and nothing else: no markdown, no fences, no commentary.";
  const user = `SOURCE (topic or document to cover):
"""
${input.source.slice(0, 8000)}
"""

FORMAT: ${p.label}. Tone: ${p.tone}.
The two speakers are ${p.hostName} (the "host") and ${p.expertName} (the "expert").

Write the episode as JSON with exactly this shape:
{
 "title": string,            // <=60 chars, punchy, specific to the source
 "dek": string,              // one-line subtitle, <=120 chars
 "outline": string[],        // 3 to 6 short beats the episode moves through
 "segments": [               // 8 to 12 spoken lines
   {"speaker":"host"|"expert","emotion": one of [${emotions}], "text": string}
 ],
 "music": {
   "title": string,          // the theme song's name
   "prompt": string,         // <=200 chars: genre, mood, instruments, tempo. Seed: ${p.musicSeed}
   "lyrics": string          // 4 to 12 short lines about the source, using [Intro]/[Verse]/[Chorus] tags, \\n between lines
 }
}

Rules:
- Open with the host, then alternate; two lines in a row from one speaker is fine occasionally.
- Each "text" is 1 to 3 sentences of natural spoken English. No stage directions, no markdown, no URLs read aloud.
- Be accurate to the source. If the source is thin, stay general and honest rather than inventing specifics.
- Vary "emotion" for effect; keep it believable for the format.
- Lyrics must be catchy, clean, and clearly about the source. Keep the whole "lyrics" under 1200 characters.
- Return ONLY the JSON object.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// Take the first complete, brace-balanced JSON object. M3 sometimes wraps it in
// a code fence or adds a trailing sentence, so lastIndexOf("}") is not safe.
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  if (start === -1) throw new Error("model did not return JSON");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) return JSON.parse(body.slice(start, i + 1));
    }
  }
  throw new Error("model returned incomplete JSON");
}

function asEmotion(v: unknown): Emotion {
  return (EMOTIONS as readonly string[]).includes(v as string) ? (v as Emotion) : "auto";
}

export function parseEpisode(raw: string): Episode {
  const o = extractJson(raw) as Record<string, unknown>;
  const segsIn = Array.isArray(o.segments) ? o.segments : [];
  const segments: Segment[] = segsIn
    .map((s) => s as Record<string, unknown>)
    .filter((s) => typeof s.text === "string" && (s.text as string).trim().length > 0)
    .map((s) => ({
      speaker: s.speaker === "expert" ? "expert" : "host",
      emotion: asEmotion(s.emotion),
      text: (s.text as string).trim(),
    }));
  if (segments.length === 0) throw new Error("episode has no segments");
  const music = (o.music ?? {}) as Record<string, unknown>;
  return {
    title: String(o.title ?? "Untitled episode").slice(0, 80),
    dek: String(o.dek ?? "").slice(0, 160),
    outline: Array.isArray(o.outline) ? o.outline.map(String).slice(0, 6) : [],
    segments: segments.slice(0, 16),
    music: {
      title: String(music.title ?? "Theme").slice(0, 80),
      prompt: String(music.prompt ?? FORMATS.explainer.musicSeed).slice(0, 300),
      lyrics: String(music.lyrics ?? "[Verse]\nOverhear\n[Chorus]\nTune in").slice(0, 1400),
    },
  };
}

/** Generate the full episode script + theme spec with M3. Retries once, since a
 * single call can hit a transient upstream error or return unparseable JSON. */
export async function writeEpisode(input: EpisodeInput): Promise<Episode> {
  const messages = buildMessages(input);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await chat(messages, { maxTokens: 2200, temperature: attempt === 0 ? 0.8 : 0.4 });
      return parseEpisode(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("script generation failed");
}
