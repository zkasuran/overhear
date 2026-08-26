import type { NextRequest } from "next/server";
import { runQueue, MUSIC_MODEL } from "@/lib/gmi";

// Music 3.0's request blocks ~60-90s. Node functions on Vercel Hobby are capped
// at 60s, but the Edge runtime can keep streaming for up to 300s as long as the
// first byte goes out fast. So we stream NDJSON keepalives while the theme cooks,
// then emit the final url. Works unchanged on a plain Node host too.
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let lyrics = "";
  let prompt = "";
  try {
    const b = (await req.json()) as { lyrics?: unknown; prompt?: unknown };
    lyrics = typeof b.lyrics === "string" ? b.lyrics.trim() : "";
    prompt = typeof b.prompt === "string" ? b.prompt : "";
  } catch {
    // fall through to the missing-lyrics guard
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      if (!lyrics) {
        send({ error: "missing lyrics" });
        controller.close();
        return;
      }
      send({ status: "started" });
      const keepAlive = setInterval(() => send({ status: "working" }), 5000);
      try {
        const s = await runQueue(
          MUSIC_MODEL,
          {
            lyrics: lyrics.slice(0, 3500),
            prompt: prompt.slice(0, 2000),
            sample_rate: 44100,
            bitrate: 256000,
            format: "mp3",
          },
          { timeoutMs: 280_000, intervalMs: 3_000 },
        );
        send({ url: s.audioUrl ?? null, durationMs: s.durationMs ?? null });
      } catch (e) {
        send({ error: String((e as Error)?.message ?? e) });
      } finally {
        clearInterval(keepAlive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
