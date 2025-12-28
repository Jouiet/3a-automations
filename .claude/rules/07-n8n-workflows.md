# n8n Workflows - Session 111

## DÉCOUVERTE CRITIQUE

```
n8n Community Edition NE SUPPORTE PAS $env variables!
API: "Your license does not allow for feat:variables"

SOLUTION: Scripts natifs (.cjs) avec process.env
```

## État Factuel (28/12/2025 23:30 CET)

| # | Workflow | n8n Status | Script Natif | Status Final |
|---|----------|------------|--------------|--------------|
| 1 | Blog Generator | ✅ OK | - | ✅ FONCTIONNE |
| 2 | Product Photos (Gemini) | ✅ OK | - | ✅ FONCTIONNE |
| 3 | Grok Voice Telephony | ⛔ $env | ⏳ | ⛔ BLOQUÉ (Twilio) |
| 4 | Klaviyo Welcome Series | ⛔ $env | ✅ email-automation-unified.cjs | ✅ TESTÉ OK |
| 5 | Email Outreach Sequence | ⛔ $env | ✅ email-automation-unified.cjs | ✅ TESTÉ OK |
| 6 | LinkedIn Lead Scraper | ⛔ $env | ✅ linkedin-lead-automation.cjs | ✅ TESTÉ OK |
| 7 | WhatsApp Confirmation | ⛔ $env | ⏳ | ⛔ BLOQUÉ (Meta) |
| 8 | WhatsApp Reminders | ⛔ $env | ⏳ | ⛔ BLOQUÉ (Meta) |
| 9 | Newsletter 3A | ⛔ INACTIVE | ✅ newsletter-automation.cjs | ⚠️ PRÊT (API credits) |

**Résultat: 6/9 fonctionnels (67%) - 3 bloqués par credentials externes**

## Scripts Natifs Déployés

```bash
# Email (Welcome + Outreach)
automations/agency/email-automation-unified.cjs
node email-automation-unified.cjs --mode=welcome --email=test@example.com
node email-automation-unified.cjs --mode=outreach --json='{"email":"...","company":"..."}'
node email-automation-unified.cjs --server --port=3001

# LinkedIn Lead Automation
automations/agency/linkedin-lead-automation.cjs
node linkedin-lead-automation.cjs --test
node linkedin-lead-automation.cjs --file=/path/to/leads.json

# Newsletter
automations/agency/newsletter-automation.cjs
node newsletter-automation.cjs --preview --topic="Sujet"
node newsletter-automation.cjs --topic="Sujet" --list-id=XXX
```

## BLOCKERS EXTERNES (Non-code)

| Workflow | Blocker | Action Requise |
|----------|---------|----------------|
| Grok Voice | Twilio | Créer compte Twilio + Phone Number |
| WhatsApp x2 | Meta | Business Manager approval |
| Newsletter | API Credits | Ajouter crédits Anthropic ou attendre reset Gemini |

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- API: https://n8n.srv1168256.hstgr.cloud/api/v1/workflows
