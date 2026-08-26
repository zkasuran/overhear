import type { NextRequest } from "next/server";
import { writeEpisode } from "@/lib/episode";
import { FORMATS, type FormatId } from "@/lib/voices";

// M3 usually answers in well under a minute, but it can occasionally run long or
// hit a transient upstream blip. Streaming from the Edge runtime keeps us clear
// of the 60s Node function cap; writeEpisode also retries once internally.
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let source = "";
  let format: FormatId = "explainer";
  try {
    const b = (await req.json()) as { source?: unknown; format?: unknown };
    source = typeof b.source === "string" ? b.source.trim() : "";
    if (typeof b.format === "string" && b.format in FORMATS) format = b.format as FormatId;
  } catch {
    // handled by the guard below
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      if (source.length < 3) {
        send({ error: "Give me a topic or some text to work from." });
        controller.close();
        return;
      }
      send({ status: "started" });
      const keepAlive = setInterval(() => send({ status: "working" }), 5000);
      try {
        const episode = await writeEpisode({ source, format });
        send({ episode, format });
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
