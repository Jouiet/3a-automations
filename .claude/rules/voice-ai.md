---
paths:
  - "**/voice*"
  - "**/audio*"
  - "**/grok*"
  - "**/tts*"
  - "**/speech*"
---

# Voice AI System

## Architecture
```
MODE FREE: Web Speech API (browser) → voice-api.3a-automation.com → Web Speech TTS
MODE PREMIUM: Web Speech API → Grok Realtime WebSocket → Native audio ($0.05/min)
```

## Scripts
| Script | Port | Usage |
|--------|------|-------|
| grok-voice-realtime.cjs | 3007 | WebSocket proxy |
| voice-api-resilient.cjs | 3004 | Text generation |
| voice-telephony-bridge.cjs | 3009 | Twilio PSTN (awaiting creds) |

## Grok Voices
ara (default), eve, leo, sal, rex, mika, valentin

## Gemini Fallback Voices
Kore, Sulafat, Aoede, Puck, Zephyr, Algieba, Charon, Enceladus

## Commands
```bash
node automations/agency/core/grok-voice-realtime.cjs --health
node automations/agency/core/grok-voice-realtime.cjs --server --port=3007
```
