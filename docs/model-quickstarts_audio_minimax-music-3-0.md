> ## Documentation Index
> Fetch the complete documentation index at: https://docs.gmicloud.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# minimax-music-3.0

> API usage guide for minimax-music-3.0.

**Model ID**

```bash theme={null}
minimax-music-3.0
```

**Calling method:** sync

# Minimax Music Generation API Usage Guide

## Overview

**Minimax Music 3.0** is an AI-powered music generation model that creates complete songs from lyrics and style descriptions. Simply provide your lyrics and an optional style prompt, and the model will compose and produce a full audio track.

### Key Features:

* **Lyrics-Based Generation**: Create songs from your custom lyrics (1-3500 characters)
* **Style Control**: Optional prompt to specify music genre, mood, and style (0-2000 characters)
* **Structure Tags**: Support for song structure tags like \[Verse], \[Chorus], \[Bridge], etc.
* **High-Quality Audio**: Output in MP3, WAV, or PCM formats
* **Synchronous Operation**: Get results immediately (typically 30-60 seconds)

***

## Authentication

All API requests require authentication using an API key. Include your API key in the Authorization header:

```bash theme={null}
Authorization: Bearer YOUR_API_KEY
```

## Submit Music Generation Request

### Endpoint

```
POST /api/v1/apikey/requests
```

### Request Format

```bash theme={null}
curl -X POST "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-music-3.0",
    "payload": {
      "lyrics": "[verse]\nStreetlights flicker, the night breeze sighs\nShadows stretch as I walk alone\nAn old coat wraps my silent sorrow\nWandering, longing, where should I go\n[chorus]\nPushing the wooden door, the aroma spreads\nIn a familiar corner, a stranger gazes",
      "prompt": "Indie folk, melancholic, introspective, longing, solitary walk, coffee shop",
      "sample_rate": 44100,
      "bitrate": 256000,
      "format": "mp3"
    }
  }'
```

### Request Parameters

| Parameter             | Type    | Required | Description                                                                                             | Default | Constraints                  |
| --------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------- | ------- | ---------------------------- |
| `model`               | string  | Yes      | Model identifier                                                                                        | -       | `"minimax-music-3.0"`        |
| `payload.lyrics`      | string  | Yes      | Song lyrics. Use `\n` for line breaks. Support structure tags like \[Verse], \[Chorus], \[Bridge], etc. | -       | 1-3500 characters            |
| `payload.prompt`      | string  | No       | Music style description (genre, mood, scenario)                                                         | -       | 0-2000 characters            |
| `payload.sample_rate` | integer | No       | Audio sample rate in Hz                                                                                 | 44100   | 16000, 24000, 32000, 44100   |
| `payload.bitrate`     | integer | No       | Audio bitrate in bps                                                                                    | 256000  | 32000, 64000, 128000, 256000 |
| `payload.format`      | string  | No       | Output audio format                                                                                     | "mp3"   | "mp3", "wav", "pcm"          |

### Supported Structure Tags

You can use the following tags in your lyrics to control song structure:

* `[Intro]` - Introduction section
* `[Verse]` - Verse section
* `[Pre Chorus]` - Pre-chorus section
* `[Chorus]` - Chorus/refrain section
* `[Bridge]` - Bridge section
* `[Outro]` - Outro/ending section
* `[Interlude]` - Instrumental interlude
* `[Hook]` - Hook section
* `[Inst]` - Instrumental section
* `[Solo]` - Solo section

***

## Response

Music Generation is **synchronous** and returns the result immediately (typically within 30-60 seconds).

```json theme={null}
{
    "request_id": "5c30b275-d669-4a25-8151-de6d60214853",
    "model": "minimax-music-3.0",
    "status": "success",
    "created_at": 1762215580,
    "updated_at": 1762215640,
    "queued_at": 1762215580
}
```

***

## Check Request Status

### Endpoint

```
GET /api/v1/apikey/requests/{request_id}
```

### Example

```bash theme={null}
curl -X GET "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests/your_request_id" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response

```json theme={null}
{
    "request_id": "5c3abcde-d669-4a25-8151-de6d602abcde",
    "org_id": "637abcde-1870-4ff4-80b0-d485980abcde",
    "user_id": "5edabcde-4eed-4dcd-b732-996a956abcde",
    "model": "minimax-music-3.0",
    "status": "success",
    "is_public": false,
    "payload": {
        "lyrics": "[verse]\nStreetlights flicker...",
        "prompt": "Indie folk, melancholic",
        "sample_rate": 44100,
        "bitrate": 256000,
        "format": "mp3"
    },
    "outcome": {
        "audio_url": "https://storage.googleapis.com/your_generated_music.mp3",
        "status": "music_generated_successfully",
        "duration_ms": 25364,
        "sample_rate": 44100,
        "channels": 2,
        "bitrate": 256000,
        "medias": [
            {
                "request_id": "5c3abcde-d669-4a25-8151-de6d602abcde",
                "id": "0",
                "url": "https://storage.googleapis.com/your_generated_music.mp3",
                "type": "audio",
                "format": "mp3"
            }
        ],
        "media_urls": [
            {
                "id": "0",
                "url": "https://storage.googleapis.com/your_generated_music.mp3"
            }
        ]
    },
    "created_at": 1762215580,
    "updated_at": 1762215640,
    "queued_at": 1762215580
}
```

***

## Request Status Values

Music Generation is **synchronous**, so the response will immediately return one of these statuses:

| Status    | Description                                 |
| --------- | ------------------------------------------- |
| `success` | Music generation completed successfully     |
| `failed`  | Music generation failed (see error message) |

***

## Example Use Cases

### Basic Music Generation (Minimal Parameters)

```bash theme={null}
curl -X POST "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-music-3.0",
    "payload": {
      "lyrics": "[verse]\nHello world, this is my song\nSinging along, all day long\n[chorus]\nLa la la, feeling free\nThis is where I want to be"
    }
  }'
```

### Full Music Generation (All Parameters)

```bash theme={null}
curl -X POST "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-music-3.0",
    "payload": {
      "lyrics": "[intro]\n(Soft guitar strumming)\n\n[verse]\nWalking down the empty street\nMemories dancing at my feet\nThe autumn leaves fall all around\nWhispering without a sound\n\n[chorus]\nBut I remember when you smiled\nAnd everything felt worthwhile\nNow the silence fills the air\nWishing you were still here\n\n[bridge]\nTime keeps moving on\nBut my heart stays where you belong\n\n[outro]\n(Fade out with gentle piano)",
      "prompt": "Acoustic ballad, emotional, nostalgic, autumn, lost love, gentle guitar and piano, male vocals, slow tempo",
      "sample_rate": 44100,
      "bitrate": 256000,
      "format": "mp3"
    }
  }'
```

***

## Tips for Best Results

1. **Use Structure Tags**: Adding tags like \[Verse], \[Chorus], \[Bridge] helps the model understand song structure
2. **Descriptive Prompts**: Be specific about genre, mood, instruments, and tempo in your prompt
3. **Appropriate Lyrics Length**: Aim for 500-2000 characters for optimal song length
4. **Clear Line Breaks**: Use `\n` to separate lines properly
5. **Avoid Special Characters**: Stick to standard punctuation in lyrics
