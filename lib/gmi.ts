// Server-side GMI Cloud x MiniMax client. The API key lives only on the server.
// Two surfaces, one key:
//   - text/reasoning: OpenAI-compatible /chat/completions on api.gmi-serving.com
//   - speech + music: async request-queue on console.gmicloud.ai
// See docs/API-REFERENCE.md for the primary-source shapes.

const TEXT_BASE = process.env.GMI_TEXT_BASE_URL ?? "https://api.gmi-serving.com/v1";
const QUEUE_BASE =
  process.env.GMI_QUEUE_BASE_URL ??
  "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey";

export const TEXT_MODEL = process.env.GMI_TEXT_MODEL ?? "MiniMaxAI/MiniMax-M3";
export const TTS_MODEL = process.env.GMI_TTS_MODEL ?? "minimax-tts-speech-2.8-hd";
export const MUSIC_MODEL = process.env.GMI_MUSIC_MODEL ?? "minimax-music-3.0";

function apiKey(): string {
  const k = process.env.GMI_API_KEY;
  if (!k) throw new Error("GMI_API_KEY is not set (see .env.example)");
  return k;
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** One blocking chat completion. Returns the assistant text. */
export async function chat(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number; model?: string } = {},
): Promise<string> {
  const res = await fetch(`${TEXT_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: opts.model ?? TEXT_MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
    }),
  });
  if (!res.ok) {
    throw new Error(`chat ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("chat: no content in response");
  return content;
}

/** List model ids available to this key. */
export async function listModels(): Promise<string[]> {
  const res = await fetch(`${TEXT_BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) throw new Error(`models ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data?.data ?? []).map((m: { id: string }) => m.id);
}

export type QueuePayload = Record<string, unknown>;

/** Submit an async audio (TTS/music) request. Returns the request id. */
export async function submitQueue(model: string, payload: QueuePayload): Promise<string> {
  const res = await fetch(`${QUEUE_BASE}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({ model, payload }),
  });
  if (!res.ok) {
    throw new Error(`submit ${model} ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  const data = await res.json();
  const id = data?.request_id;
  if (!id) throw new Error(`submit ${model}: no request_id`);
  return id;
}

export type QueueStatus = {
  // Speech is truly async ("dispatched" -> poll). Music blocks and returns "success".
  status: "queued" | "dispatched" | "processing" | "success" | "failed" | "cancelled" | string;
  audioUrl?: string;
  durationMs?: number;
  raw: unknown;
};

/** Poll one async request once. */
export async function getQueue(id: string): Promise<QueueStatus> {
  const res = await fetch(`${QUEUE_BASE}/requests/${id}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) throw new Error(`status ${id} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const outcome = data?.outcome ?? {};
  const url =
    outcome?.media_urls?.[0]?.url ?? outcome?.audio_url ?? outcome?.medias?.[0]?.url;
  return {
    status: data?.status,
    audioUrl: url,
    durationMs: outcome?.duration_ms,
    raw: data,
  };
}

/** Submit then poll to completion (server-side helper for scripts/tests). */
export async function runQueue(
  model: string,
  payload: QueuePayload,
  { timeoutMs = 120_000, intervalMs = 2_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<QueueStatus> {
  const id = await submitQueue(model, payload);
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const s = await getQueue(id);
    if (s.status === "success") return s;
    if (s.status === "failed" || s.status === "cancelled") {
      throw new Error(`${model} ${s.status}: ${JSON.stringify(s.raw).slice(0, 400)}`);
    }
    if (Date.now() > deadline) throw new Error(`${model} timed out after ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
