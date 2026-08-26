> ## Documentation Index
> Fetch the complete documentation index at: https://docs.gmicloud.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# minimax-tts-speech-2.8-hd

> API usage guide for minimax-tts-speech-2.8-hd.

**Model ID**

```bash theme={null}
minimax-tts-speech-2.8-hd
```

**Calling method:** sync

# Minimax TTS Speech 2.8 HD API Usage Guide

## Overview

**Minimax TTS Speech 2.8 HD** is MiniMax's latest high-performance text-to-speech model, capable of turning text into ultra-fast, natural, expressive speech, even mimicking a target voice from a short reference clip with zero-shot voice cloning and emotional nuance.

## Authentication

All API requests require authentication using an API key. Include your API key in the Authorization header:

```bash theme={null}
Authorization: Bearer YOUR_API_KEY
```

## Submit Video Generation Request

### Base URL

```
https://console.gmicloud.ai
```

### Endpoint

```
POST /api/v1/ie/requestqueue/apikey/requests
```

### Request Format

```bash theme={null}
curl -X POST "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-tts-speech-2.8-hd",
    "payload": {
      "text": "Let's convert text to speech.",
      "voice_id": "English_expressive_narrator",
      "speed": "1",
      "vol": "1",
      "pitch": "0",
      "emotion": "auto",
      "language_boost": "auto",
      "format": "mp3",
      "audio_sample_rate": "32000",
      "bitrate": "128000",
      "channel": "2",
      "vm_pitch": 0,
      "intensity": 0,
      "timbre": 0,
      "sound_effects": "spacious_echo"
    }
  }'
```

### Request Parameters

| Parameter           | Type    | Required | Description                                                                                                                                                                                  | Default                         | Constraints                                                                           |
| ------------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `text`              | string  | Yes      | Text content to be converted to speech.                                                                                                                                                      | -                               | Required                                                                              |
| `voice_id`          | string  | No       | Voice ID for speech synthesis.                                                                                                                                                               | "English\_expressive\_narrator" | Alphanumeric string, underscores allowed                                              |
| `speed`             | float   | No       | Speech speed multiplier.                                                                                                                                                                     | 1                               | 0.5 to 2 with step 0.1                                                                |
| `vol`               | float   | No       | Volume level multiplier.                                                                                                                                                                     | 1                               | 0 to 10 with step 0.1                                                                 |
| `pitch`             | integer | No       | Pitch adjustment in semitones.                                                                                                                                                               | 0                               | -12 to 12 with step 1                                                                 |
| `emotion`           | string  | No       | Emotion control for synthesized speech. By default, the model automatically selects the most natural emotion based on text. Manual specification is only recommended when explicitly needed. | "auto"                          | Options: "auto", "calm", "happy", "sad", "angry", "fearful", "disgusted", "surprised" |
| `language_boost`    | string  | No       | Controls whether recognition for specific minority languages and dialects is enhanced. If the language type is unknown, set to 'auto' and the model will automatically detect it.            | "auto"                          | -                                                                                     |
| `format`            | string  | No       | Specifies the format of the generated audio. Default is mp3.                                                                                                                                 | "mp3"                           | Options: "mp3", "flac"                                                                |
| `audio_sample_rate` | string  | No       | Specifies the sampling rate of the generated audio. Default is 32000 Hz.                                                                                                                     | "32000"                         | Options: "8000", "16000", "22050", "24000", "32000", "44100"                          |
| `bitrate`           | string  | No       | Specifies the bitrate of the generated audio. Default is 128000. Note: This parameter only applies to audio in mp3 format.                                                                   | "128000"                        | Options: "32000", "64000", "128000", "256000"                                         |
| `channel`           | string  | No       | Specifies the number of audio channels. 1 = mono, 2 = stereo. Default is 2 (stereo).                                                                                                         | "2"                             | Options: "1", "2"                                                                     |
| `vm_pitch`          | integer | No       | Voice modification pitch adjustment. Adjusts the pitch of the synthesized voice for voice-changing effects. Range: -100 (lower) to 100 (higher).                                             | 0                               | -100 to 100 with step 1                                                               |
| `intensity`         | integer | No       | Voice intensity adjustment. Controls the strength/power of the voice. Range: -100 (weaker) to 100 (stronger).                                                                                | 0                               | -100 to 100 with step 1                                                               |
| `timbre`            | integer | No       | Voice timbre adjustment. Modifies the tonal quality and character of the voice. Range: -100 to 100.                                                                                          | 0                               | -100 to 100 with step 1                                                               |
| `sound_effects`     | string  | No       | Applies special sound effects to the synthesized voice. These effects can create atmospheric or stylistic variations.                                                                        | ""                              | Options: "", "spacious\_echo", "auditorium\_echo", "lofi\_telephone", "robotic"       |

### Response

```json theme={null}
{
    "request_id": "5c30b275-d669-4a25-8151-de6d60214853",
    "model": "minimax-tts-speech-2.8-hd",
    "status": "success",
    "created_at": 1762215580,
    "updated_at": 1762215606,
    "queued_at": 1762215580
}

```

## Check Request Status

### Endpoint

```
GET /api/v1/ie/requestqueue/apikey/requests/{request_id}
```

### Example

```bash theme={null}
curl -X GET "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests/5c30b275-d669-4a25-8151-de6d60214853" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response

```json theme={null}
{
  "request_id": "5c30b275-d669-4a25-8151-de6d60214853",
  "org_id": "your-org-id",
  "model": "minimax-tts-speech-2.8-hd",
  "status": "success",
  "is_public": false,
  "payload": {
    "text": "Let's convert text to speech.",
    "voice_id": "English_expressive_narrator",
    "speed": "1",
    "vol": "1",
    "pitch": "0",
    "emotion": "auto",
    "language_boost": "auto",
    "format": "mp3",
    "audio_sample_rate": "32000",
    "bitrate": "128000",
    "channel": "2",
    "vm_pitch": 0,
    "intensity": 0,
    "timbre": 0,
    "sound_effects": "spacious_echo"
  },
  "outcome": {
    "media_urls": [
      {
        "id": "0",
        "url": "https://storage.googleapis.com/your_tts_result.mp3"
      }
    ],
    "voice_id": ""
  },
  "created_at": 1762215580,
  "updated_at": 1762215606,
  "queued_at": 1762215580
}
```

## Request Status Values

| Status       | Description                             |
| ------------ | --------------------------------------- |
| `queued`     | Request is waiting to be processed      |
| `processing` | Video generation is in progress         |
| `success`    | Video generation completed successfully |
| `failed`     | Video generation failed                 |
| `cancelled`  | Request was cancelled                   |

## List Your Requests

### Endpoint

```
GET api/v1/ie/requestqueue/apikey/requests?model_id=minimax-tts-speech-2.8-hd
```

### Example

```bash theme={null}
curl -X GET "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey/requests?model_id=minimax-tts-speech-2.8-hd" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Get Model Information

### Endpoint

```
GET /api/v1/ie/requestqueue/apikey/models/minimax-tts-speech-2.8-hd
```

### Example

```bash theme={null}
curl -X GET "https://api.example.com/api/v1/apikey/models/minimax-tts-speech-2.8-hd" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## List Available Models

### Endpoint

```
GET /api/v1/apikey/models
```

### Example

```bash theme={null}
curl -X GET "https://api.example.com/api/v1/apikey/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response

```json theme={null}
{
    "model_ids": [
        "minimax-tts-speech-2.8-hd",
        "other-model-1",
        "other-model-2"
    ]
}
```

## Pricing

* **Pricing Type**: Audio length based pricing
* **Unit Price**: \$0.10 per audio (per one thousand character)
