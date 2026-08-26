import type { NextRequest } from "next/server";
import { writeEpisode } from "@/lib/episode";
import { FORMATS, type FormatId } from "@/lib/voices";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { source?: unknown; format?: unknown };
    const source = typeof body.source === "string" ? body.source.trim() : "";
    if (source.length < 3) {
      return Response.json({ error: "Give me a topic or some text to work from." }, { status: 400 });
    }
    const format: FormatId =
      typeof body.format === "string" && body.format in FORMATS
        ? (body.format as FormatId)
        : "explainer";
    const episode = await writeEpisode({ source, format });
    return Response.json({ episode, format });
  } catch (e) {
    return Response.json({ error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
}
