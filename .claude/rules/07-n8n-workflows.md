# n8n Workflows - Session 114

## Architecture Finale

```
n8n Community Edition: NE SUPPORTE PAS $env variables
Solution: Scripts natifs (.cjs) avec process.env
```

## État Factuel (29/12/2025 11:00 CET)

### Workflows Actifs (6)

| # | Workflow | Status | Usage |
|---|----------|--------|-------|
| 1 | Blog Article Generator | ✅ ACTIF | Claude API |
| 2 | Enhance Product Photos | ✅ ACTIF | Gemini API |
| 3 | Grok Voice Telephony | ⏸️ BLOQUÉ | Twilio requis |
| 4 | WhatsApp Booking Confirmation | ⏸️ BLOQUÉ | Meta Business requis |
| 5 | WhatsApp Booking Reminders | ⏸️ BLOQUÉ | Meta Business requis |
| 6 | Newsletter 3A Automation | ⏸️ INACTIF | API credits requis |

### Workflows Supprimés (Session 114)

| Workflow | Remplacement |
|----------|--------------|
| Klaviyo Welcome Series | `email-automation-unified.cjs` |
| Email Outreach Sequence | `email-automation-unified.cjs` |
| LinkedIn Lead Scraper | `linkedin-lead-automation.cjs` |

**Raison:** Ces workflows utilisaient `$env` variables non supportées. Les scripts natifs utilisent `process.env` qui fonctionne.

## Scripts Natifs - Usage

```bash
# Email (Welcome + Outreach)
node automations/agency/email-automation-unified.cjs --mode=welcome --email=test@example.com
node automations/agency/email-automation-unified.cjs --mode=outreach --json='{"email":"...","company":"..."}'
node automations/agency/email-automation-unified.cjs --server --port=3001

# LinkedIn Lead Automation
node automations/agency/linkedin-lead-automation.cjs --test
node automations/agency/linkedin-lead-automation.cjs --file=/path/to/leads.json

# Google Maps Local B2B
node automations/agency/google-maps-to-klaviyo-pipeline.cjs --test
node automations/agency/google-maps-to-klaviyo-pipeline.cjs --file=/path/to/businesses.json

# Newsletter
node automations/agency/newsletter-automation.cjs --preview --topic="Sujet"
node automations/agency/newsletter-automation.cjs --topic="Sujet" --list-id=XXX
```

## BLOCKERS EXTERNES (Non-code)

| Workflow | Blocker | Action Requise |
|----------|---------|----------------|
| Grok Voice | Twilio | Créer compte Twilio + Phone Number |
| WhatsApp x2 | Meta | Business Manager approval |
| Newsletter | API Credits | Ajouter crédits Anthropic ou attendre reset Gemini |

## Webhooks Disponibles

| Workflow | Webhook URL |
|----------|-------------|
| Blog Generator | `https://n8n.srv1168256.hstgr.cloud/webhook/blog/generate` |
| Product Photos | `https://n8n.srv1168256.hstgr.cloud/webhook/photos/enhance` |
| Voice Inbound | `https://n8n.srv1168256.hstgr.cloud/webhook/voice/inbound` |
| Booking Confirm | `https://n8n.srv1168256.hstgr.cloud/webhook/booking-confirmation` |
| Newsletter | `https://n8n.srv1168256.hstgr.cloud/webhook/newsletter/send` |

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- API: https://n8n.srv1168256.hstgr.cloud/api/v1/workflows
