# Voice Widget - Generic AI Voice Assistant

> Drop-in voice assistant widget for any website

## Overview

This voice widget provides:
- Voice input via Web Speech API (free)
- Text input fallback
- AI-powered responses (via your backend)
- Multi-language support (FR/EN)
- Customizable branding

## Files

| File | Description |
|------|-------------|
| `config-template.js` | Base template - copy and customize |
| `config-cinematicads.js` | Example: CinematicAds configuration |
| `voice-widget-generic.js` | Main widget code (to be integrated) |

## Quick Start

### 1. Copy Configuration

```bash
cp config-template.js config-myproject.js
```

### 2. Customize Your Config

Edit `config-myproject.js`:

```javascript
const VOICE_WIDGET_CONFIG = {
  BRAND: {
    name: 'My Project',
    url: 'https://myproject.com',
    email: 'contact@myproject.com',
  },
  COLORS: {
    primary: '#4FBAF1',  // Your brand color
    // ...
  },
  // ...
};
```

### 3. Add to Your Website

```html
<!-- Load config first -->
<script src="/js/config-myproject.js"></script>

<!-- Load widget -->
<script src="/js/voice-widget.js"></script>

<!-- Initialize -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const widget = new VoiceWidget(VOICE_WIDGET_CONFIG);
    widget.init();
  });
</script>
```

## Configuration Options

### Brand Settings

```javascript
BRAND: {
  name: 'Your Brand',           // Displayed in widget
  url: 'https://site.com',      // For links/redirects
  email: 'contact@site.com',    // For contact actions
  phone: '+1234567890',         // Optional
  logo: '/logo.png',            // Optional
}
```

### Colors

```javascript
COLORS: {
  primary: '#4FBAF1',     // Main accent (buttons, highlights)
  secondary: '#1E3A5F',   // Secondary elements
  background: '#0F1629',  // Widget background
  text: '#FFFFFF',        // Primary text
  textMuted: '#94A3B8',   // Secondary text
  success: '#10B981',     // Success states
  error: '#EF4444',       // Error states
}
```

### Widget Behavior

```javascript
SETTINGS: {
  position: 'bottom-right',     // Widget position
  defaultLanguage: 'fr',        // Default language
  autoGreet: true,              // Show welcome on load
  enableVoice: true,            // Voice input
  enableText: true,             // Text input
  enableSpeechSynthesis: true,  // Read responses
  apiEndpoint: '/api/voice',    // Your backend
  apiTimeout: 30000,            // Request timeout
}
```

### AI Prompts

Customize the system prompts for your brand:

```javascript
PROMPT_FR: `Tu es l'assistant de [BRAND].
- Reponses courtes (2-3 phrases)
- Toujours proposer un rdv si interet
- Services: [LIST]
...`,

PROMPT_EN: `You are [BRAND]'s assistant.
...`
```

## Backend Integration

The widget calls your `apiEndpoint` with:

```javascript
POST /api/voice
Content-Type: application/json

{
  "message": "User's question",
  "language": "fr",
  "conversationId": "uuid"
}
```

Expected response:

```javascript
{
  "response": "AI's answer",
  "actions": [  // Optional
    { "type": "redirect", "url": "/booking" },
    { "type": "email", "to": "contact@..." }
  ]
}
```

## Keyword Actions

Configure quick actions for common keywords:

```javascript
KEYWORDS: {
  fr: {
    booking: ['rendez-vous', 'rdv', 'reserver'],
    pricing: ['prix', 'tarif', 'cout'],
    contact: ['contact', 'email', 'telephone'],
  },
}
```

When detected, the widget can trigger `QUICK_RESPONSES` immediately without API call.

## Examples

### E-commerce Store

```javascript
PROMPT_FR: `Tu es l'assistant de MyShop.
- Aide les clients a trouver des produits
- Reponds aux questions sur les livraisons
- Guide vers le panier/checkout

CATEGORIES: Mode, Accessoires, Maison
LIVRAISON: Gratuite des 50 euros
RETOURS: 30 jours gratuit`
```

### SaaS Product

```javascript
PROMPT_EN: `You are SaaSApp's assistant.
- Explain product features
- Guide to free trial signup
- Answer pricing questions

PLANS: Free, Pro ($29/mo), Enterprise
TRIAL: 14 days free, no credit card`
```

### Agency

```javascript
PROMPT_FR: `Tu es l'assistant de AgenceXYZ.
- Presente les services
- Propose des rendez-vous decouverte
- Qualifie les leads

SERVICES: SEO, Ads, Automation
AUDIT: Gratuit, 30 minutes`
```

## Styling

Override styles with CSS:

```css
.voice-widget {
  --vw-primary: #8B5CF6;
  --vw-bg: #1a1a2e;
  --vw-radius: 16px;
}

.voice-widget__button {
  box-shadow: 0 0 30px var(--vw-primary);
}
```

## Browser Support

- Chrome 33+ (full support)
- Edge 79+
- Safari 14.1+ (partial voice)
- Firefox 49+ (no speech recognition)

Voice recognition requires Chrome/Edge for best results. Text input works everywhere.

## Support

- 3A Automation: https://3a-automation.com
- Contact: contact@3a-automation.com
