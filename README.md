# Overhear

**Turn any topic or article into a two-host audio episode with its own theme song.**

Paste a link's text or type a topic. Overhear reasons out a tight two-host script,
gives each host a real voice, composes an original theme for the piece, and mixes
it all into one audio file you can play, download, and share. Reasoning, speech,
and music are all MiniMax models served on GMI Cloud.

Built for **MiniMax Week** (the MiniMaxathon), Multimodality track.

- Live demo: https://overhear-eight.vercel.app
- Demo video: `<add after upload>`

## Why

There is more worth understanding than there is time to sit and read. Podcasts
fixed that for shows, not for the article open in your tab or the topic you got
curious about at 11pm. Overhear turns either one into something you can listen to
on a walk: two people talking it through, with a little music behind them, in the
time it takes to make coffee.

## What it does

- **Reasons out a real script.** One host asks the questions, one expert answers,
  built from the source and kept accurate rather than padded.
- **Two real voices.** Each speaker gets a distinct MiniMax voice, with a per-line
  emotion so a surprised question does not sound like a calm one.
- **An original theme, every time.** The score is composed for that episode from
  lyrics the model writes about the topic. No stock loops.
- **One file out.** Narration and a ducked music bed are mixed in your browser into
  a single track you can play inline, download, or share on X.
- **Four formats:** curious explainer, two-sided debate, cozy wind-down, hype trailer.
  Each picks its own voices and musical mood.

## How it works

```
topic / article
   -> MiniMax M3            reasons out {title, outline, two-host script, theme spec} as JSON
   -> MiniMax Speech 2.8    voices each line (two voices, per-line emotion), async queue
   -> MiniMax Music 3.0     composes the theme from the model-written lyrics + style
   -> browser (Web Audio)   intro theme, ducked bed under the talk, outro, then one WAV
```

The API key stays server-side. The browser only ever talks to this app's own
routes (`/api/script`, `/api/tts`, `/api/music`, `/api/audio`), which call GMI Cloud.
Music generation blocks for about a minute, so that route streams keepalives (Edge
runtime) to stay inside serverless limits.

## Run it locally

```bash
cp .env.example .env.local        # then paste your GMI Cloud API key into GMI_API_KEY
npm install
npm run dev                       # http://localhost:3000
```

Get a key at `console.gmicloud.ai` -> API Keys. During MiniMax Week the models
(M3, Speech 2.8, Music 3.0) are free.

## Verify

```bash
npm run build                     # type-check + production build
node scripts/e2e-smoke.mjs        # drives the full pipeline in headless Chrome, asserts a playable episode
```

`docs/API-REFERENCE.md` and `docs/VERIFY-RESULTS.md` record the exact GMI request
shapes and the live checks behind this build.

## Stack

Next.js (App Router) and React, Tailwind, TypeScript. No audio processing on the
server: the mix is done client-side with the Web Audio API, so the download and
the inline player are the same bytes.

## Honesty and AI use

Everything on the page is generated live from your input by MiniMax models on GMI
Cloud. Nothing is pre-baked. AI assistance was used to build this project; the
author reviewed, ran, and verified it before shipping.
