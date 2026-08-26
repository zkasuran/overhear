import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same-origin proxy for the generated mp3s so the browser can decode them for
// playback and client-side mixing without cross-origin surprises. Locked to the
// GMI storage host to avoid being an open proxy (SSRF).
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) return new Response("missing src", { status: 400 });
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return new Response("bad src", { status: 400 });
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith("googleapis.com")) {
    return new Response("host not allowed", { status: 400 });
  }
  const upstream = await fetch(url.toString());
  if (!upstream.ok || !upstream.body) {
    return new Response("upstream error", { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
