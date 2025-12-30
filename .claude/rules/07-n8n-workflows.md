# n8n Workflows - Session 115

## Architecture

```
n8n Community Edition: NE SUPPORTE PAS $env variables
n8n Code Node: Problèmes avec JS complexe (fetch non supporté)
Solution: Scripts natifs (.cjs) avec process.env + multi-provider fallback
```

## ANALYSE COMPARATIVE FACTUELLE (30/12/2025)

### Scripts Natifs vs n8n - Verdict Objectif

| Critère | n8n Workflows | Scripts Natifs | Verdict |
|---------|---------------|----------------|---------|
| AI Providers | 1 (single point of failure) | 3+ avec fallback | **Script SUPÉRIEUR** |
| Blocage $env | 100% bloqués (Community) | 0% (process.env) | **Script SUPÉRIEUR** |
| Social platforms | 2 (FB, LinkedIn) | 3 (+ X/Twitter OAuth 1.0a) | **Script SUPÉRIEUR** |
| Fallback chains | 0 | 3+ par script | **Script SUPÉRIEUR** |
| CLI/Testing | 0 modes | 15+ flags | **Script SUPÉRIEUR** |
| Health checks | 0 intégrés | 3 intégrés | **Script SUPÉRIEUR** |
| Lignes de code | ~1,076 JSON | ~2,735 .cjs | n8n moins |
| Visual debugging | UI n8n | Console only | n8n mieux |

**VERDICT GLOBAL: Scripts natifs SUPÉRIEURS sur 6/8 critères**

### AUDIT FAIBLESSES - Scripts Natifs (Session 115)

| Sévérité | Pattern | Scripts | Lignes |
|----------|---------|---------|--------|
| CRITIQUE | Pas de timeout HTTP complet | 3/3 | whatsapp:278, blog:157, grok:141 |
| CRITIQUE | Mémoire non bornée (Set/Map) | 2/3 | whatsapp:356, grok:619 |
| CRITIQUE | Pas de limite body size | 3/3 | whatsapp:570, blog:649, grok:657 |
| HIGH | Pas de retry exponential | 3/3 | Fallback only, 1 try/provider |
| HIGH | JSON parsing fragile | 1/3 | blog:288-302 |
| HIGH | Validation input insuffisante | 2/3 | whatsapp:260, grok:657 |
| MEDIUM | Session ID collision | 1/3 | grok:629 (Date.now()) |
| MEDIUM | CORS trop permissif (*) | 2/3 | whatsapp:460, blog:695 |
| MEDIUM | API key en query string | 1/3 | blog:245 (Gemini) |
| LOW | Graceful shutdown manquant | 2/3 | whatsapp, blog |
| LOW | Logging non structuré | 3/3 | console.log basique |
| LOW | Pas de metrics | 3/3 | Aucune observabilité |
| LOW | Pas de rate limiting outbound | 3/3 | Risque ban API |

**Total: 13 patterns à améliorer, ~9h effort estimé**

### CORRECTIONS IMPLÉMENTÉES (Session 116)

| Script | Fixes Appliqués |
|--------|-----------------|
| whatsapp-booking-notifications.cjs | P0: timeout, body size, security headers. P1: rate limiter, bounded memory. P2: CORS whitelist. P3: graceful shutdown |
| blog-generator-resilient.cjs | P0: timeout, body size, response limit. P1: rate limiter. P2: CORS whitelist, improved JSON parsing, env regex. P3: graceful shutdown |
| grok-voice-realtime.cjs | P0: fetch timeout, message size limit. P1: rate limiter, session pool limit, zombie cleanup. P2: secure session ID, input validation, CORS whitelist |

**STATUS: 13/13 patterns corrigés (100%)**

### Workflows SUPPRIMÉS (Session 115)

| Workflow | n8n Nodes | Script | Amélioration Factuelle |
|----------|-----------|--------|------------------------|
| Blog Article Generator | 14 nodes, 1 AI | blog-generator-resilient.cjs v2.1 | +2 AI providers, +1 social platform |
| Enhance Product Photos | 6 nodes | product-photos-resilient.cjs | +fallback chain 4 providers |
| WhatsApp Confirmation | 6 nodes | whatsapp-booking-notifications.cjs | +CLI, +text fallback |
| WhatsApp Reminders | 7 nodes | whatsapp-booking-notifications.cjs | +deduplication Set() |

### Workflows n8n RESTANTS (1)

| Workflow | n8n Status | Script Natif | Status Final |
|----------|------------|--------------|--------------|
| Grok Voice Telephony | ⛔ BLOQUÉ | grok-voice-realtime.cjs (2 providers) | ⛔ Twilio credentials externes |

**Résultat: 0/1 n8n fonctionnel - Bloqué par credentials externes**

### Scripts Natifs RÉSILIENTS (Multi-Provider Fallback) - Vérifié Dec 2025

| Script | Usage | Fallback Chain (modèles vérifiés) | Port |
|--------|-------|-----------------------------------|------|
| blog-generator-resilient.cjs | TEXT + SOCIAL | Anthropic→Grok 3→Gemini 2.5 + FB/LinkedIn/X | 3003 |
| voice-api-resilient.cjs | TEXT (pas audio!) | Grok 3 Mini→Gemini 2.5 Flash→Claude Sonnet 4→Local | 3004 |
| product-photos-resilient.cjs | IMAGE GEN | Gemini 2.5 Flash Image→Grok Image→fal.ai→Replicate | 3005 |
| product-photos-resilient.cjs | VISION | Gemini 2.5 Flash→Grok 2 Vision→Claude Sonnet 4 | 3005 |
| email-personalization-resilient.cjs | TEXT | Grok 3 Mini→Gemini 2.5 Flash→Claude Sonnet 4→Static | 3006 |
| grok-voice-realtime.cjs | AUDIO WebSocket | Grok Realtime→Gemini 2.5 Flash TTS | 3007 |
| whatsapp-booking-notifications.cjs | WHATSAPP | WhatsApp Cloud API (Meta) | 3008 |

**NOTE:** voice-api-resilient.cjs génère du TEXTE. L'audio robotic par Web Speech API.
**NOTE:** grok-voice-realtime.cjs utilise WebSocket pour audio NATIF ($0.05/min) avec fallback Gemini TTS.
**NOTE:** Claude NE GÉNÈRE PAS d'images, seulement vision (analyse).
**NOTE:** whatsapp-booking-notifications.cjs prêt, awaiting WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID.

### Scripts Natifs (Production)

| Script | Status | Notes |
|--------|--------|-------|
| newsletter-automation.cjs | ✅ | **Fallback: Grok→Gemini→Claude** |
| linkedin-lead-automation.cjs | ✅ | Apify STARTER OK |
| google-maps-to-klaviyo-pipeline.cjs | ✅ | Apify STARTER OK |
| email-automation-unified.cjs | ✅ | Testé OK |
| lead-gen-scheduler.cjs | ✅ | Cron ready |
| uptime-monitor.cjs | ✅ | 5 endpoints, alerting |
| voice-widget-generator.cjs | ✅ | Client config generator |
| whatsapp-booking-notifications.cjs | ⏳ | Awaiting Meta credentials |

## Lead Generation System (Session 114-115)

```
ARCHITECTURE:
├── config/markets.cjs           # 31 marchés, 3 devises
├── lead-gen-scheduler.cjs       # Scheduler centralisé
├── linkedin-lead-automation.cjs # Apify → Klaviyo
├── google-maps-to-klaviyo-pipeline.cjs
├── newsletter-automation.cjs    # xAI/Grok primary
└── email-automation-unified.cjs # Welcome + Outreach

GITHUB ACTIONS:
└── .github/workflows/lead-generation.yml

CRON SCHEDULE:
  6AM UTC: LinkedIn (rotating markets)
  8AM UTC: Google Maps (rotating cities)
  10AM 1st/15th: Newsletter
```

## Commandes

```bash
# === SCRIPTS RÉSILIENTS (Multi-Provider Fallback) ===

# Blog Generator v2.1 (Anthropic→Grok→Gemini + FB/LinkedIn/X distribution)
node automations/agency/core/blog-generator-resilient.cjs --health
node automations/agency/core/blog-generator-resilient.cjs --topic="E-commerce 2026" --language=fr
node automations/agency/core/blog-generator-resilient.cjs --topic="AI Marketing" --publish --distribute
node automations/agency/core/blog-generator-resilient.cjs --server --port=3003

# Voice API (Grok→Gemini→Claude→Local)
node automations/agency/core/voice-api-resilient.cjs --health
node automations/agency/core/voice-api-resilient.cjs --test="Quels sont vos services ?"
node automations/agency/core/voice-api-resilient.cjs --server --port=3004

# Product Photos (Gemini→fal.ai→Replicate)
node automations/agency/core/product-photos-resilient.cjs --health
node automations/agency/core/product-photos-resilient.cjs --image="img.jpg" --prompt="Remove background"
node automations/agency/core/product-photos-resilient.cjs --server --port=3005

# Email Personalization (Grok→Gemini→Claude→Static)
node automations/agency/core/email-personalization-resilient.cjs --health
node automations/agency/core/email-personalization-resilient.cjs --personalize --lead='{"email":"test@test.com"}'
node automations/agency/core/email-personalization-resilient.cjs --server --port=3006

# Grok Voice Realtime (WebSocket native audio → Gemini TTS fallback)
node automations/agency/core/grok-voice-realtime.cjs --health
node automations/agency/core/grok-voice-realtime.cjs --test="Bonjour, comment puis-je aider?"
node automations/agency/core/grok-voice-realtime.cjs --server --port=3007

# WhatsApp Booking Notifications (Confirmation + Reminders)
node automations/agency/core/whatsapp-booking-notifications.cjs --health
node automations/agency/core/whatsapp-booking-notifications.cjs --confirm --phone=+33612345678 --name="Jean"
node automations/agency/core/whatsapp-booking-notifications.cjs --remind --phone=+33612345678 --type=24h
node automations/agency/core/whatsapp-booking-notifications.cjs --server --port=3008

# === SCRIPTS PRODUCTION ===

# Uptime Monitor
node automations/agency/core/uptime-monitor.cjs
node automations/agency/core/uptime-monitor.cjs --server --port=3002

# Voice Widget Generator
node automations/agency/core/voice-widget-generator.cjs --interactive
node automations/agency/core/voice-widget-generator.cjs --client="Name" --domain="client.com"

# Scheduler
node automations/agency/lead-gen-scheduler.cjs --status
node automations/agency/lead-gen-scheduler.cjs --pipeline=linkedin --market=morocco

# Email Unified
node automations/agency/email-automation-unified.cjs --mode=welcome --email=test@example.com
node automations/agency/email-automation-unified.cjs --server --port=3001

# Newsletter (already has Grok→Gemini→Claude fallback)
node automations/agency/newsletter-automation.cjs --preview --topic="Sujet"
```

## BLOCKERS

| Type | Blocker | Action | Priorité |
|------|---------|--------|----------|
| n8n | Twilio | Créer compte | P2 |
| Script | WhatsApp/Meta | Fournir credentials | P1 |

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- Apify: https://console.apify.com (STARTER $39/mo ✅)
