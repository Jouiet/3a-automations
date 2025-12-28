# n8n + Scripts Hybrides - Session 109

## DÉCOUVERTE CRITIQUE (28/12/2025)

```
n8n Community Edition NE SUPPORTE PAS $env variables!
API: "Your license does not allow for feat:variables"

IMPACT: Tous workflows {{ $env.KLAVIYO_API_KEY }} ÉCHOUENT
SOLUTION: Scripts natifs pour Klaviyo (TESTÉ OK)
```

## Solution Hybride Déployée

| Composant | Statut | Méthode |
|-----------|--------|---------|
| Email Outreach | ✅ FONCTIONNEL | Script natif |
| Klaviyo Welcome | ✅ FONCTIONNEL | Script natif |
| Grok Voice | ⛔ BLOQUÉ | Twilio credentials |
| WhatsApp | ⛔ BLOQUÉ | WhatsApp Business API |
| Blog Generator | ⏳ n8n | Credentials UI requis |
| LinkedIn Scraper | ⏳ n8n | Apify token |

## Script Unifié (TESTÉ OK 21:32 CET)

```bash
# Emplacement
automations/agency/email-automation-unified.cjs

# Welcome series
node email-automation-unified.cjs --mode=welcome --email=test@example.com

# Outreach sequence
node email-automation-unified.cjs --mode=outreach --json='{"email":"...","company":"..."}'

# Server mode (webhooks HTTP)
node email-automation-unified.cjs --server --port=3001
```

## Double Usage (Agence)

```bash
# Pour client avec leurs credentials
CLIENT_ENV_PATH=/path/to/client/.env \
node email-automation-unified.cjs --mode=welcome
```

## n8n Workflows Déployés (9)

1. Grok Voice Telephony (⛔ Twilio)
2. Email Outreach (remplacé par script)
3. WhatsApp Booking Confirm (⛔ WhatsApp API)
4. WhatsApp Booking Reminders (⛔ WhatsApp API)
5. Blog Article Generator (⏳ credentials)
6. LinkedIn Lead Scraper (⏳ Apify)
7. Klaviyo Welcome Series (remplacé par script)
8. Newsletter 3A (⏳ credentials)
9. Enhance Product Photos (⏳ Gemini credentials)

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- Script: `automations/agency/email-automation-unified.cjs`
