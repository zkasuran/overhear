import type { NextRequest } from "next/server";
import { submitQueue, getQueue, TTS_MODEL } from "@/lib/gmi";
import { EMOTIONS, isValidVoice, type Emotion } from "@/lib/voices";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Submit one narration line. Speech 2.8 is async -> returns a request id to poll.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { text?: unknown; voice?: unknown; emotion?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return Response.json({ error: "empty text" }, { status: 400 });
    const voice = isValidVoice(String(body.voice)) ? String(body.voice) : "English_expressive_narrator";
    const emotion: Emotion = (EMOTIONS as readonly string[]).includes(String(body.emotion))
      ? (String(body.emotion) as Emotion)
      : "auto";
    const id = await submitQueue(TTS_MODEL, {
      text: text.slice(0, 1200),
      voice_id: voice,
      emotion,
      format: "mp3",
      audio_sample_rate: "32000",
      bitrate: "128000",
      channel: "2",
    });
    return Response.json({ id });
  } catch (e) {
    return Response.json({ error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
}

// Poll one narration line.
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return Response.json({ error: "missing id" }, { status: 400 });
    const s = await getQueue(id);
    return Response.json({ status: s.status, url: s.audioUrl ?? null, durationMs: s.durationMs ?? null });
  } catch (e) {
    return Response.json({ error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
}
