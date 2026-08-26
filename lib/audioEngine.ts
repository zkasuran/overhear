"use client";
// Client audio: decode the MiniMax narration + theme, mix them into one episode
// with a full-volume intro, a ducked music bed under the talk, and an outro, then
// hand back a single WAV. We play that one file with a plain <audio> element, so
// playback/seek/download are all the same rock-solid bytes.

const INTRO = 6; // seconds of theme up front
const GAP = 0.32; // breath between lines
const OUTRO = 5; // theme tail
const BED = 0.14; // music gain under narration
const LEAD = 0.85; // music gain during intro/outro

export type Timeline = {
  starts: number[];
  durs: number[];
  bodyStart: number;
  bodyEnd: number;
  total: number;
};

export async function decodeUrl(ctx: BaseAudioContext, proxiedUrl: string): Promise<AudioBuffer> {
  const res = await fetch(proxiedUrl);
  if (!res.ok) throw new Error(`fetch audio failed (${res.status})`);
  const bytes = await res.arrayBuffer();
  return await ctx.decodeAudioData(bytes);
}

export function buildTimeline(durs: number[]): Timeline {
  const starts: number[] = [];
  let t = INTRO;
  for (const d of durs) {
    starts.push(t);
    t += d + GAP;
  }
  const bodyEnd = durs.length ? t - GAP : INTRO;
  return { starts, durs, bodyStart: INTRO, bodyEnd, total: bodyEnd + OUTRO };
}

function wire(
  ctx: BaseAudioContext,
  narration: AudioBuffer[],
  music: AudioBuffer | null,
  tl: Timeline,
) {
  const dest = ctx.destination;
  if (music) {
    const src = ctx.createBufferSource();
    src.buffer = music;
    src.loop = true;
    const g = ctx.createGain();
    src.connect(g).connect(dest);
    const gain = g.gain;
    gain.setValueAtTime(LEAD, 0);
    gain.setValueAtTime(LEAD, Math.max(0.01, tl.bodyStart - 0.8));
    gain.linearRampToValueAtTime(BED, tl.bodyStart + 0.4);
    gain.setValueAtTime(BED, tl.bodyEnd);
    gain.linearRampToValueAtTime(LEAD, tl.bodyEnd + 1.2);
    gain.setValueAtTime(LEAD, tl.total - 2);
    gain.linearRampToValueAtTime(0.0001, tl.total);
    src.start(0);
    src.stop(tl.total);
  }
  narration.forEach((b, i) => {
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(dest);
    src.start(tl.starts[i]);
  });
}

/** Offline-render the whole episode to a single AudioBuffer. */
export async function renderMix(
  narration: AudioBuffer[],
  music: AudioBuffer | null,
  tl: Timeline,
  sampleRate = 44100,
): Promise<AudioBuffer> {
  const frames = Math.ceil(tl.total * sampleRate) + sampleRate;
  const ctx = new OfflineAudioContext(2, frames, sampleRate);
  wire(ctx, narration, music, tl);
  return await ctx.startRendering();
}

/** 16-bit PCM WAV from an AudioBuffer. */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const chans = Math.min(2, buffer.numberOfChannels);
  const len = buffer.length;
  const rate = buffer.sampleRate;
  const bytes = 44 + len * chans * 2;
  const ab = new ArrayBuffer(bytes);
  const view = new DataView(ab);
  const ws = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, chans, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * chans * 2, true);
  view.setUint16(32, chans * 2, true);
  view.setUint16(34, 16, true);
  ws(36, "data");
  view.setUint32(40, len * chans * 2, true);
  const data: Float32Array[] = [];
  for (let c = 0; c < chans; c++) data.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < chans; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

export type AssembledAudio = { url: string; wav: Blob; timeline: Timeline; total: number };

/** Decode every clip, mix once, and return one playable/downloadable WAV. */
export async function assembleEpisode(
  narrationProxiedUrls: string[],
  musicProxiedUrl: string | null,
): Promise<AssembledAudio> {
  const AC: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const narration = await Promise.all(narrationProxiedUrls.map((u) => decodeUrl(ctx, u)));
    const music = musicProxiedUrl ? await decodeUrl(ctx, musicProxiedUrl) : null;
    const tl = buildTimeline(narration.map((b) => b.duration));
    const mix = await renderMix(narration, music, tl);
    const wav = audioBufferToWav(mix);
    return { url: URL.createObjectURL(wav), wav, timeline: tl, total: tl.total };
  } finally {
    void ctx.close();
  }
}
