# GMI Cloud x MiniMax API (primary-source notes, 2026-08-26)

One API key (Bearer) drives all three model families. Key is minted in the
console (Settings -> API Keys). Two different hosts:

- **Text / reasoning** -> `https://api.gmi-serving.com/v1` (OpenAI-compatible + Anthropic-compatible)
- **Speech (TTS) + Music** -> `https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/...` (async request queue)

All requests: `Authorization: Bearer <API_KEY>`.

## 1. Reasoning LLM — MiniMax M2.7 (and M3 if live)

- Model id (M2.7): `MiniMaxAI/MiniMax-M2.7`. Campaign lists **M3** free too; confirm the exact id with `GET /v1/models` once we have a key (likely `MiniMaxAI/MiniMax-M3`).
- OpenAI-compatible: `POST https://api.gmi-serving.com/v1/chat/completions`
  ```json
  {"model":"MiniMaxAI/MiniMax-M2.7","messages":[{"role":"system","content":"..."},{"role":"user","content":"..."}],"max_tokens":1024}
  ```
- Anthropic-compatible (extended thinking / reasoning blocks): `POST /v1/messages`, header `x-api-key`, returns `thinking` + `text` content blocks. Supports `stream:true`.
- List models: `GET https://api.gmi-serving.com/v1/models` (Bearer). 401 without key (confirmed).

## 2. TTS — minimax-tts-speech-2.8-hd  (async, poll)

- Submit: `POST https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests`
  ```json
  {"model":"minimax-tts-speech-2.8-hd","payload":{
    "text":"...","voice_id":"English_expressive_narrator","speed":"1","vol":"1",
    "pitch":"0","emotion":"auto","language_boost":"auto","format":"mp3",
    "audio_sample_rate":"32000","bitrate":"128000","channel":"2"}}
  ```
  Returns `{request_id, status, ...}`.
- Poll: `GET .../requests/{request_id}` until `status:"success"`, then read `outcome.media_urls[0].url` (mp3 on storage.googleapis.com).
- `emotion`: auto|calm|happy|sad|angry|fearful|disgusted|surprised. `sound_effects`: ""|spacious_echo|auditorium_echo|lofi_telephone|robotic.
- Two distinct hosts = two different `voice_id`s. Voice ids look like `English_expressive_narrator` (need the full voice list from the console/docs; start with the documented one + probe).
- Pricing: $0.10 per 1000 chars.

## 3. Music — minimax-music-3.0  (sync-ish, 30-60s; same submit+poll shape)

- Submit: `POST https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests`
  ```json
  {"model":"minimax-music-3.0","payload":{
    "lyrics":"[verse]\n...\n[chorus]\n...","prompt":"genre, mood, instruments, tempo",
    "sample_rate":44100,"bitrate":256000,"format":"mp3"}}
  ```
- Poll: `GET .../requests/{request_id}` -> `outcome.audio_url` / `outcome.media_urls[0].url`, plus `duration_ms`.
- Lyrics 1-3500 chars; structure tags `[Intro][Verse][Pre Chorus][Chorus][Bridge][Outro][Interlude][Hook][Inst][Solo]`. prompt 0-2000 chars.

## Status values (queue)
`queued | processing | success | failed | cancelled`

## Notes learned
- `console.gmicloud.ai` is reachable headless with cf_clearance; `/api/v1/ie/requestqueue/apikey/models` 401s with only a session token -> needs a real API key.
- Key management routes under `/api/v1/...` were not found by gu. Mint the key in the browser console (interactive-auth step).
- Outward-facing wording: never name the exact model/gateway beyond what the program needs; the program itself requires "MiniMax models via GMI Cloud", so here that IS the disclosed stack.
