# n8n Workflows - Session 110

## DÉCOUVERTE CRITIQUE

```
n8n Community Edition NE SUPPORTE PAS $env variables!
API: "Your license does not allow for feat:variables"

IMPACT: 7/9 workflows ÉCHOUENT à l'exécution
```

## État Factuel (28/12/2025 22:50 CET)

| # | Workflow | Active | $env | Status |
|---|----------|--------|------|--------|
| 1 | Blog Generator | ✅ | - | OK (credentials UI) |
| 2 | Product Photos (Gemini) | ✅ | - | OK (credentials UI) |
| 3 | Grok Voice Telephony | ✅ | XAI, WHATSAPP, GROK | ⛔ FAIL |
| 4 | Klaviyo Welcome Series | ✅ | KLAVIYO | ⛔ FAIL |
| 5 | Email Outreach Sequence | ✅ | KLAVIYO | ⛔ FAIL |
| 6 | LinkedIn Lead Scraper | ✅ | KLAVIYO | ⛔ FAIL |
| 7 | WhatsApp Confirmation | ✅ | WHATSAPP | ⛔ FAIL |
| 8 | WhatsApp Reminders | ✅ | WHATSAPP | ⛔ FAIL |
| 9 | Newsletter 3A | ❌ | KLAVIYO | ⛔ INACTIVE |

**Résultat: 2/9 fonctionnels (22%)**

## Solution Hybride Déployée

| Automation | n8n | Script Natif |
|------------|-----|--------------|
| Email Outreach | ⛔ $env | ✅ email-automation-unified.cjs |
| Klaviyo Welcome | ⛔ $env | ✅ email-automation-unified.cjs |
| Blog Generator | ✅ OK | - |
| Product Photos | ✅ OK | - |
| Grok Voice | ⛔ $env + Twilio | ⏳ Bloqué credentials |
| WhatsApp | ⛔ $env + Meta | ⏳ Bloqué Meta approval |
| LinkedIn Scraper | ⛔ $env | ⏳ À convertir |

## Script Unifié (TESTÉ OK)

```bash
# Location
automations/agency/email-automation-unified.cjs

# Welcome series
node email-automation-unified.cjs --mode=welcome --email=test@example.com

# Outreach sequence
node email-automation-unified.cjs --mode=outreach --json='{"email":"...","company":"..."}'

# Server mode (webhooks HTTP)
node email-automation-unified.cjs --server --port=3001

# Double usage (clients agence)
CLIENT_ENV_PATH=/path/to/client/.env node email-automation-unified.cjs --mode=welcome
```

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- API: https://n8n.srv1168256.hstgr.cloud/api/v1/workflows
