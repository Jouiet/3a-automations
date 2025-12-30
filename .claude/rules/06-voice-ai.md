# Voice AI System - Session 115

## Architecture Overview

```
VOICE WIDGET v2.0 (UNIFIED):

┌─────────────────────────────────────────────────────────────────┐
│ voice-widget.js (v2.0) - 37KB minified                         │
│                                                                 │
│ MODE FREE (default):                                            │
│   └── STT: Web Speech API (browser)                            │
│   └── AI: voice-api.3a-automation.com (Grok→Gemini→Claude)    │
│   └── TTS: Web Speech API (robotic but FREE)                   │
│                                                                 │
│ MODE PREMIUM (optional):                                        │
│   └── STT: Web Speech API (browser)                            │
│   └── AI+TTS: Grok Realtime WebSocket (native audio)           │
│   └── Cost: $0.05/min                                           │
│   └── Voices: ara, eve, leo, sal, rex, mika, valentin          │
│                                                                 │
│ AUTO-FALLBACK: Premium → Free if proxy unavailable              │
└─────────────────────────────────────────────────────────────────┘

GROK VOICE TELEPHONY (BLOCKED - Twilio required)
   └── LiveKit/Dial.Plus integration
```

## grok-voice-realtime.cjs v2.0 - RESILIENT (Session 115)

```
FALLBACK CHAIN (vérifié 29/12/2025):

┌─────────────────────────────────────────────────────────────────┐
│ NIVEAU 1: Grok Realtime WebSocket                               │
│   └── Endpoint: wss://api.x.ai/v1/realtime                     │
│   └── Full conversational AI + native audio                    │
│   └── Cost: $0.05/min                                           │
│   └── Si ÉCHEC → NIVEAU 2                                       │
├─────────────────────────────────────────────────────────────────┤
│ NIVEAU 2: Gemini 2.5 Flash TTS                                  │
│   └── Endpoint: generativelanguage.googleapis.com/v1beta        │
│   └── Model: gemini-2.5-flash-preview-tts                      │
│   └── Text→Audio seulement (mode dégradé)                      │
│   └── Cost: ~$0.001/1K chars                                    │
│   └── Format: PCM16 24kHz (compatible Grok)                    │
└─────────────────────────────────────────────────────────────────┘

HEALTH CHECK (29/12/2025):
├── Grok Realtime:    ✅ OPERATIONAL
└── Gemini Fallback:  ✅ OPERATIONAL
```

### Grok Voices (7)
| Voice | Description |
|-------|-------------|
| ara | Default voice |
| eve | Female voice |
| leo | Male voice |
| sal | Male voice |
| rex | Male voice |
| mika | Female voice |
| valentin | Male voice |

### Gemini Voices (8) - Fallback
| Voice | Description |
|-------|-------------|
| Kore | Firm female |
| Sulafat | Warm female |
| Aoede | Clear female |
| Puck | Upbeat neutral |
| Zephyr | Bright neutral |
| Algieba | Smooth neutral |
| Charon | Deep male |
| Enceladus | Breathy female |

### Voice Mapping (Grok → Gemini)
```javascript
ara → Kore, eve → Sulafat, mika → Aoede
leo → Puck, sal → Charon, rex → Zephyr, valentin → Algieba
```

### Scripts
```bash
# Health check (teste les 2 providers)
node automations/agency/core/grok-voice-realtime.cjs --health

# Test text to audio (auto-fallback)
node automations/agency/core/grok-voice-realtime.cjs --test="Bonjour, comment puis-je vous aider?"

# Start proxy server (for browser clients)
node automations/agency/core/grok-voice-realtime.cjs --server --port=3007
```

### Browser Integration
```html
<!-- Load realtime client -->
<script src="/voice-assistant/voice-realtime-client.js"></script>
<script>
  // Start voice conversation
  const client = await startVoiceConversation({
    voice: 'ara',
    onUserSpeak: (text) => console.log('User:', text),
    onAssistantSpeak: (text) => console.log('AI:', text)
  });

  // Or use class directly
  const grok = new GrokRealtimeClient({ voice: 'eve' });
  await grok.connect();
  await grok.startMicrophone();
</script>
```

## Web Widget (OPERATIONAL)

- **Location:** /voice-assistant/voice-widget.min.js (32KB)
- **Tech:** Web Speech API (free, robotic)
- **Features:** 33 keywords, booking flow, GA4 tracking
- **Browsers:** Chrome, Edge (Firefox/Safari = text fallback)
- **Deployed:** 28 pages

### Backend Fallback Chain
```
Text Generation: Grok 3 Mini → Gemini 2.5 Flash → Claude Sonnet 4 → Local patterns
Audio Output: Browser Web Speech API (free)
```

## Grok Voice Telephony (BLOCKED)

- **Blocker:** Twilio credentials missing
- **n8n workflow:** Deployed but non-functional
- **xAI API:** Tested OK
- **Dial.Plus:** +1 775 254 7428 (internal use only)
- **LiveKit:** Requires LiveKit Cloud setup

## TTS Fallback Options

| Provider | Model | Type | Status |
|----------|-------|------|--------|
| Grok Realtime | wss://api.x.ai | Native voice | ✅ OPERATIONAL |
| Gemini TTS | gemini-2.5-flash-tts | Cloud TTS | Available |
| Browser | Web Speech API | Free TTS | ✅ OPERATIONAL |

## Fichiers

```
automations/agency/core/
├── grok-voice-realtime.cjs     # WebSocket proxy server (port 3007)
└── voice-api-resilient.cjs     # Text generation fallback (port 3004)

landing-page-hostinger/voice-assistant/
├── voice-widget.js             # Widget v2.0 avec Realtime intégré
├── voice-widget.min.js         # Minified (37KB)
└── knowledge.json              # FAQ database

SUPPRIMÉS (Session 115):
├── grok-voice-poc.cjs          # API TEXT, commentaires mensongers
├── grok-voice-poc.py           # LiveKit non configuré, inutile
└── voice-realtime-client.js    # Intégré dans widget
```

## Configuration

```javascript
// Dans voice-widget.js - CONFIG
realtimeEnabled: false,       // true = force premium mode
realtimeAutoUpgrade: true,    // try premium, fallback to free
realtimeProxyUrl: 'wss://voice-api.3a-automation.com/realtime',
realtimeVoice: 'ara',         // ara, eve, leo, sal, rex, mika, valentin
```

## Documentation

- [Grok Voice Agent API](https://docs.x.ai/docs/guides/voice)
- [LiveKit xAI Plugin](https://docs.livekit.io/agents/models/realtime/plugins/xai/)
- [Gemini TTS](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts)
