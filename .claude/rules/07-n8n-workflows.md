# n8n Workflows - Session 114

## Architecture

```
n8n Community Edition: NE SUPPORTE PAS $env variables
Solution: Scripts natifs (.cjs) avec process.env
```

## État Factuel (29/12/2025 12:30 CET)

### Workflows n8n (5)

| Workflow | Status | Blocker |
|----------|--------|---------|
| Blog Article Generator | ✅ FONCTIONNE | - |
| Enhance Product Photos | ✅ FONCTIONNE | - |
| Grok Voice Telephony | ⛔ BLOQUÉ | Twilio credentials |
| WhatsApp Booking Confirmation | ⛔ BLOQUÉ | Meta Business |
| WhatsApp Booking Reminders | ⛔ BLOQUÉ | Meta Business |

**Résultat: 2/5 fonctionnels (40%)**

### Scripts Natifs (Remplacent n8n)

| Script | Status | Blocker |
|--------|--------|---------|
| linkedin-lead-automation.cjs | ⛔ | Apify $0.01 |
| google-maps-to-klaviyo-pipeline.cjs | ⛔ | Apify $0.01 |
| newsletter-automation.cjs | ✅ | - |
| email-automation-unified.cjs | ✅ | - |
| lead-gen-scheduler.cjs | ✅ | - |

## Lead Generation System (Session 114)

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
# Scheduler
node automations/agency/lead-gen-scheduler.cjs --status
node automations/agency/lead-gen-scheduler.cjs --pipeline=linkedin --market=morocco
node automations/agency/lead-gen-scheduler.cjs --pipeline=daily --dry-run

# Email
node automations/agency/email-automation-unified.cjs --mode=welcome --email=test@example.com
node automations/agency/email-automation-unified.cjs --server --port=3001

# Newsletter
node automations/agency/newsletter-automation.cjs --preview --topic="Sujet"
node automations/agency/newsletter-automation.cjs --server --port=3002
```

## BLOCKERS

| Type | Blocker | Action | Priorité |
|------|---------|--------|----------|
| Lead Gen | Apify crédits | https://console.apify.com/billing | **P0** |
| n8n | Twilio | Créer compte | P2 |
| n8n | Meta Business | Approval | P3 |

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- Apify: https://console.apify.com/billing
