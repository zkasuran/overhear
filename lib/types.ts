// Shared, client-safe episode types (no server imports so the browser bundle
// stays clean). The server orchestration in lib/episode.ts re-uses these.
import type { Emotion } from "./voices";

export type Speaker = "host" | "expert";

export type Segment = {
  speaker: Speaker;
  emotion: Emotion;
  text: string;
};

export type MusicSpec = {
  title: string;
  prompt: string;
  lyrics: string;
};

export type Episode = {
  title: string;
  dek: string;
  outline: string[];
  segments: Segment[];
  music: MusicSpec;
};
