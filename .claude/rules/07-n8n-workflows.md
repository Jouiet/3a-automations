# n8n Workflows - Session 115

## Architecture

```
n8n Community Edition: NE SUPPORTE PAS $env variables
n8n Code Node: Problèmes avec JS complexe (fetch non supporté)
Solution: Scripts natifs (.cjs) avec process.env + fallback
```

## État Factuel (29/12/2025 19:00 CET)

### Workflows n8n (5)

| Workflow | n8n Status | Script Natif | Status Final |
|----------|------------|--------------|--------------|
| Blog Article Generator | ⚠️ Code Node KO | ✅ blog-generator-resilient.cjs | ✅ SCRIPT OK |
| Enhance Product Photos | ✅ OK | - | ✅ FONCTIONNE |
| Grok Voice Telephony | ⛔ BLOQUÉ | - | ⛔ Twilio |
| WhatsApp Confirmation | ⛔ BLOQUÉ | - | ⛔ Meta |
| WhatsApp Reminders | ⛔ BLOQUÉ | - | ⛔ Meta |

**Résultat: 2/5 n8n OK + 1 script natif = 3/5 fonctionnels (60%)**

### Scripts Natifs (Remplacent n8n)

| Script | Status | Notes |
|--------|--------|-------|
| blog-generator-resilient.cjs | ✅ | **Fallback: Anthropic→Grok→Gemini** |
| linkedin-lead-automation.cjs | ✅ | Apify STARTER OK |
| google-maps-to-klaviyo-pipeline.cjs | ✅ | Apify STARTER OK |
| newsletter-automation.cjs | ✅ | xAI/Grok OK |
| email-automation-unified.cjs | ✅ | Testé OK |
| lead-gen-scheduler.cjs | ✅ | Cron ready |
| uptime-monitor.cjs | ✅ | 5 endpoints, alerting |
| voice-widget-generator.cjs | ✅ | Client config generator |

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
# Blog Generator (RESILIENT - Fallback automatique)
node automations/agency/core/blog-generator-resilient.cjs --health
node automations/agency/core/blog-generator-resilient.cjs --topic="E-commerce 2026" --language=fr
node automations/agency/core/blog-generator-resilient.cjs --topic="Topic" --publish
node automations/agency/core/blog-generator-resilient.cjs --server --port=3003

# Uptime Monitor
node automations/agency/core/uptime-monitor.cjs
node automations/agency/core/uptime-monitor.cjs --server --port=3002
node automations/agency/core/uptime-monitor.cjs --cron

# Voice Widget Generator
node automations/agency/core/voice-widget-generator.cjs --interactive
node automations/agency/core/voice-widget-generator.cjs --client="Name" --domain="client.com"

# Scheduler
node automations/agency/lead-gen-scheduler.cjs --status
node automations/agency/lead-gen-scheduler.cjs --pipeline=linkedin --market=morocco

# Email
node automations/agency/email-automation-unified.cjs --mode=welcome --email=test@example.com
node automations/agency/email-automation-unified.cjs --server --port=3001

# Newsletter
node automations/agency/newsletter-automation.cjs --preview --topic="Sujet"
```

## BLOCKERS

| Type | Blocker | Action | Priorité |
|------|---------|--------|----------|
| n8n | Twilio | Créer compte | P2 |
| n8n | Meta Business | Approval | P3 |

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- Apify: https://console.apify.com (STARTER $39/mo ✅)
