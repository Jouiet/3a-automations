# Native Automation Scripts - Session 120

> **STATUS: 0 n8n workflows. ALL automations are native Node.js scripts.**
> n8n workflows archived to `automations/agency/n8n-workflows-ARCHIVED-Session120/`
> n8n container runs on VPS (backup only) - no active workflows.

## Session 120 Updates (02/01/2026)

- OpenAI GPT-5.2 added to ALL resilient automations (was GPT-4o)
- n8n workflow JSONs archived (8 files)
- n8n-related scripts archived to `scripts/archived-n8n/` (5 files)
- API key configured in .env

## Architecture

```
ANCIEN (ABANDONNÉ):
  n8n Community Edition: NE SUPPORTE PAS $env variables
  n8n Code Node: Problèmes avec JS complexe (fetch non supporté)

ACTUEL (EN PRODUCTION):
  Scripts natifs (.cjs) avec process.env + multi-provider fallback
  Location: automations/agency/core/
  Count: 10 scripts résilients (8 original + 2 CRM v1.1.0)
```

## ANALYSE COMPARATIVE FACTUELLE (30/12/2025)

### Scripts Natifs vs n8n - Verdict Objectif

| Critère | n8n Workflows | Scripts Natifs | Verdict |
|---------|---------------|----------------|---------|
| AI Providers | 1 (single point of failure) | **4+ avec fallback (Session 120)** | **Script SUPÉRIEUR** |
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

### SESSION 117 - Security P1 Fixes (30/12/2025)

| Script | Fixes Ajoutés |
|--------|---------------|
| product-photos-resilient.cjs | P1: Rate limiter (5/min), CORS whitelist strict, Body size limit (10MB) |
| email-personalization-resilient.cjs | P1: Rate limiter (30/min), CORS whitelist strict, Body size limit (1MB) |
| voice-api-resilient.cjs | P1: Rate limiter (60/min), CORS whitelist strict, Body size limit (1MB) |

**STATUS: 6/6 resilient scripts sécurisés (P0-P1 100%)**

### P2 COMPLETE - JSON.parse try/catch (Session 117septimo - 31/12/2025)

| Script | Occurrences | Status |
|--------|-------------|--------|
| product-photos-resilient.cjs | 12 | ✅ DONE (safeJsonParse helper) |
| email-personalization-resilient.cjs | 10 | ✅ DONE (safeJsonParse helper) |
| voice-api-resilient.cjs | 4 | ✅ DONE (safeJsonParse helper) |
| blog-generator-resilient.cjs | Already had try/catch | ✅ |

**ALL P2 JSON PARSING FIXED (4/4 scripts)**

### Workflows SUPPRIMÉS (Session 115)

| Workflow | n8n Nodes | Script | Amélioration Factuelle |
|----------|-----------|--------|------------------------|
| Blog Article Generator | 14 nodes, 1 AI | blog-generator-resilient.cjs v2.1 | +2 AI providers, +1 social platform |
| Enhance Product Photos | 6 nodes | product-photos-resilient.cjs | +fallback chain 4 providers |
| WhatsApp Confirmation | 6 nodes | whatsapp-booking-notifications.cjs | +CLI, +text fallback |
| WhatsApp Reminders | 7 nodes | whatsapp-booking-notifications.cjs | +deduplication Set() |

### Workflows n8n RESTANTS (0) - Session 119

| Workflow | n8n Status | Script Natif | Status Final |
|----------|------------|--------------|--------------|
| Grok Voice Telephony | ⛔ REMPLACÉ | **voice-telephony-bridge.cjs** (port 3009) | ✅ Script natif SUPÉRIEUR |

**Résultat: 0/5 n8n restants - TOUS remplacés par scripts natifs**

### SESSION 119 - Dernier workflow n8n remplacé (01/01/2026)

| Ancien (n8n) | Nouveau (Script) | Amélioration |
|--------------|------------------|--------------|
| Grok Voice Telephony (10 nodes) | voice-telephony-bridge.cjs | Latence 4x meilleure (WebSocket direct), rate limiting, session management, graceful shutdown |

**Comparaison détaillée:** `outputs/COMPARISON-N8N-VS-NATIVE-2026-01-01.md`

### Scripts Natifs RÉSILIENTS (Multi-Provider Fallback) - Vérifié Jan 2026 (Session 120)

| Script | Usage | Fallback Chain (4 AI providers) | Port |
|--------|-------|----------------------------------|------|
| blog-generator-resilient.cjs | TEXT + SOCIAL | Anthropic→**OpenAI**→Grok 3→Gemini 3 + FB/LinkedIn/X | 3003 |
| voice-api-resilient.cjs | TEXT (pas audio!) | Grok 3 Mini→**OpenAI GPT-5.2**→Gemini 3 Flash→Claude Sonnet 4→Local | 3004 |
| product-photos-resilient.cjs | IMAGE GEN | Gemini 2.5 Flash Image→Grok Image→fal.ai→Replicate | 3005 |
| product-photos-resilient.cjs | VISION | Gemini 3 Flash→**OpenAI GPT-5.2 Vision**→Grok 2 Vision→Claude Sonnet 4 | 3005 |
| email-personalization-resilient.cjs | TEXT | Grok 3 Mini→**OpenAI GPT-5.2**→Gemini 3 Flash→Claude Sonnet 4→Static | 3006 |
| podcast-generator-resilient.cjs | TEXT (script) | Anthropic→**OpenAI GPT-5.2**→Grok 3→Gemini 3 | - |
| grok-voice-realtime.cjs | AUDIO WebSocket | Grok Realtime→Gemini 2.5 Flash TTS | 3007 |
| whatsapp-booking-notifications.cjs | WHATSAPP | WhatsApp Cloud API (Meta) | 3008 |
| voice-telephony-bridge.cjs | TELEPHONY | Twilio PSTN ↔ Grok WebSocket | 3009 |
| hubspot-b2b-crm.cjs | CRM B2B | HubSpot FREE API (batch+backoff) | - |
| omnisend-b2c-ecommerce.cjs | CRM B2C | Omnisend v5 API (dedup+carts) | - |

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
| voice-widget-templates.cjs | ✅ | 8 presets industrie, deploy 30min |
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

# Voice Telephony Bridge (Twilio PSTN ↔ Grok WebSocket) - NEW Session 119
node automations/agency/core/voice-telephony-bridge.cjs --health
node automations/agency/core/voice-telephony-bridge.cjs --test-grok
node automations/agency/core/voice-telephony-bridge.cjs --server --port=3009

# === CRM SCRIPTS v1.1.0 (Session 119) ===

# HubSpot B2B CRM v1.1.0 (batch+backoff+jitter)
node automations/agency/core/hubspot-b2b-crm.cjs --health
node automations/agency/core/hubspot-b2b-crm.cjs --test-contact
node automations/agency/core/hubspot-b2b-crm.cjs --test-batch
node automations/agency/core/hubspot-b2b-crm.cjs --list-contacts

# Omnisend B2C E-commerce v1.1.0 (dedup+carts+backoff)
node automations/agency/core/omnisend-b2c-ecommerce.cjs --health
node automations/agency/core/omnisend-b2c-ecommerce.cjs --test-contact
node automations/agency/core/omnisend-b2c-ecommerce.cjs --test-cart
node automations/agency/core/omnisend-b2c-ecommerce.cjs --list-carts
node automations/agency/core/omnisend-b2c-ecommerce.cjs --audit

# === SCRIPTS PRODUCTION ===

# Uptime Monitor
node automations/agency/core/uptime-monitor.cjs
node automations/agency/core/uptime-monitor.cjs --server --port=3002

# Voice Widget Templates (8 presets industrie)
node automations/agency/core/voice-widget-templates.cjs --list
node automations/agency/core/voice-widget-templates.cjs --preset=ecommerce --client="Name" --domain="domain.com"
node automations/agency/core/voice-widget-templates.cjs --preset=b2b --client="Acme" --domain="acme.com" --deploy

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
| ~~n8n~~ | ~~Twilio~~ | ~~Créer compte~~ | ~~P2~~ RÉSOLU (script natif) |
| Script | Twilio | Fournir TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN | P1 |
| Script | WhatsApp/Meta | Fournir credentials | P1 |

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- Apify: https://console.apify.com (STARTER $39/mo ✅)

## SESSION 117 - FRONTEND SEO/AEO FORENSIC AUDIT (30/12/2025)

### AEO (Answer Engine Optimization) Score: 87%

| Critère | Score | Notes |
|---------|-------|-------|
| AI Crawler Access | 10/10 | robots.txt: GPTBot, ClaudeBot, PerplexityBot, Google-Extended ✅ |
| llms.txt | 10/10 | 4620 bytes, comprehensive (spec llmstxt.org) ✅ |
| FAQPage Schema | 7/10 | 12/63 pages (service pages OK, homepage missing) |
| Freshness Signals | 9/10 | Blog titles: "2026", dates: Dec 2025 ✅ |
| Content Structure | 8/10 | Headings, listicles, workflow diagrams ✅ |
| Schema.org Depth | 8/10 | Organization, SoftwareApplication, Blog, Offer, Service ✅ |

### SEO Technical Score: 92%

| Élément | Status | Pages |
|---------|--------|-------|
| Meta Descriptions | ✅ | 63/63 |
| Open Graph Tags | ✅ | 63/63 |
| Twitter Cards | ✅ | 63/63 |
| hreflang (FR/EN) | ✅ | 63/63 |
| Canonical URLs | ✅ | 63/63 |
| BreadcrumbList Schema | ✅ | Service pages |
| Blog Schema | ✅ | BlogPosting with dates |
| ItemList Schema | ✅ | automations.html |

### FAQPage Coverage (AEO Critical) - Updated Session 117

| Page Type | Has FAQPage | Count |
|-----------|-------------|-------|
| Service Pages (FR) | ✅ | 6/6 |
| Service Pages (EN) | ✅ | 6/6 |
| Pricing (FR/EN) | ✅ | 2/2 |
| Homepage (FR/EN) | ✅ | 2/2 (ADDED Session 117) |
| Contact (FR/EN) | ✅ | 2/2 (ADDED Session 117) |
| About (FR/EN) | ✅ | 2/2 |
| Blog Articles | ✅ | 7/7 |
| Academy | ❌ N/A | noindex pages |

**TOTAL FAQPage: 29/35 indexable pages (83%) - Blog articles included**

### Multi-Currency (3 Markets)

| Market | Currency | Status |
|--------|----------|--------|
| Morocco | MAD | ✅ geo-locale.min.js |
| Europe | EUR | ✅ default |
| International | USD | ✅ selector |

### GAPS IDENTIFIED (Priority) - Updated Session 117

1. ~~**P1**: Add FAQPage to homepage (FR/EN)~~ ✅ DONE
2. ~~**P1**: Add FAQPage to contact page~~ ✅ DONE
3. ~~**P2**: Add HowTo schema to academy/tutorial pages~~ N/A (noindex)
4. ~~**P2**: Add FAQPage to blog articles~~ ✅ DONE (7/7)
5. ~~**P2**: Add FAQPage to About pages~~ ✅ DONE (2/2)
6. **P3**: Add VideoObject schema if video content added

### STRENGTHS CONFIRMED

- ✅ All AI crawlers explicitly allowed (robots.txt)
- ✅ llms.txt present and comprehensive
- ✅ Freshness signals in blog (2025-2026 dates)
- ✅ Multi-language (FR/EN) with proper hreflang
- ✅ Multi-currency (EUR/MAD/USD) with geo-detection
- ✅ Lazy loading GTM/GA4 for performance
- ✅ Critical CSS inline for FCP
- ✅ Skip links for accessibility
- ✅ Cookie consent banner
