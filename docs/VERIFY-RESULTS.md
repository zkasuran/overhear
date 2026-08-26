# Live verification — GMI x MiniMax (2026-08-26)

All three model families confirmed working with the real API key. Evidence mp3s
in `artifacts/` (verify-tts.mp3 120KB, verify-voice2.mp3, verify-music.mp3).

## Models (GET /v1/models — 77 total; MiniMax present)
- `MiniMaxAI/MiniMax-M3`   ✓  (reasoning; returns `content` cleanly, no wasted thinking tokens) -> **chosen**
- `MiniMaxAI/MiniMax-M2.7` ✓  (reasoning; with small max_tokens returned empty content — thinking ate the budget)
- `MiniMaxAI/MiniMax-M2.5` ✓

## Reasoning chat  — POST api.gmi-serving.com/v1/chat/completions
- M3 round-trip OK. finish_reason "stop", content in `choices[0].message.content`.
- Big implicit system/template: ~170 prompt tokens for a tiny prompt, ~140 cached.

## Speech 2.8 HD  — POST console.gmicloud.ai/.../requests  (ASYNC)
- Submit returns `status:"dispatched"` immediately + `request_id`. Poll GET `.../requests/{id}` -> `success`, url in `outcome.media_urls[0].url`.
- Valid English voice_ids (probed): English_expressive_narrator, English_Trustworth_Man,
  English_Graceful_Lady, English_Gentle-voiced_man, English_Diligent_Man, English_Wiselady,
  English_CalmWoman, English_captivating_female1, English_radiant_girl,
  English_magnetic_voiced_man, English_Aussie_Bloke, English_PatientMan, English_Debator.
- INVALID: English_Deep-VoicedMan (Error 2013 voice id wrong). Always validate voice ids.

## Music 3.0  — POST console.gmicloud.ai/.../requests  (SYNC / BLOCKING)
- The POST **blocks ~76s** then returns `status:"success"` with `outcome.audio_url` inline
  (duration_ms ~60000, i.e. a ~60s track). No early request_id / no poll needed.
- **Deploy impact:** music route needs `maxDuration >= 90`. Vercel Hobby caps functions
  (~60s) — OPEN RISK: verify music in prod after deploy; if it times out, host the app
  somewhere without the cap (Render/Fly) or run music as its own long step. TTS + script
  are well under 60s.
