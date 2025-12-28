# n8n Workflows - STATUS RÉEL

## Session 109 - AUDIT BRUTAL (28/12/2025)

| Statut | Count | Détail |
|--------|-------|--------|
| Déployés | 9 | Dans n8n UI |
| Actifs | 9 | Toggle ON |
| **FONCTIONNELS** | **0** | Tous en erreur |

## Workflows Déployés (9)

1. ❌ Grok Voice Telephony - Phone Booking
2. ❌ Email Outreach Sequence - Multi-Touch Campaign
3. ❌ WhatsApp Booking Confirmation
4. ❌ WhatsApp Booking Reminders
5. ❌ Blog Article Generator + Multi-Channel Distribution
6. ❌ LinkedIn Lead Scraper - Aggressive Outbound
7. ❌ Klaviyo Welcome Series - 5 Emails
8. ❌ Newsletter 3A Automation
9. ❌ Enhance Product Photos (Gemini AI)

## ERREURS IDENTIFIÉES (Logs n8n)

```
[ERROR] "Cannot read properties of undefined (reading 'name')"
[ERROR] "The workflow has issues and cannot be executed"
[ERROR] "Unused Respond to Webhook node found in the workflow"

CAUSE: Connexions JSON corrompues lors du déploiement
       Les "connections" référencent des noms de nodes incorrects
```

## Action Requise

Les fichiers locaux (`automations/agency/n8n-workflows/*.json`) ont été corrigés en Session 108, MAIS les workflows sur le serveur n8n ont toujours des connexions corrompues.

**Fix:**
1. Supprimer les workflows existants sur n8n
2. Redéployer depuis les fichiers locaux corrigés
3. Tester chaque webhook manuellement

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- Webhook base: https://n8n.srv1168256.hstgr.cloud/webhook/

## Webhooks (NON FONCTIONNELS)

- `/leads/new` - Email Outreach (ERREUR)
- `/subscribe/new` - Klaviyo welcome (ERREUR)
- `/blog/generate` - Blog generator (ERREUR)

## Blockers Additionnels

- KLAVIYO_API_KEY: Pas dans variables env n8n
- Twilio: Credentials absents
- WhatsApp Business API: Non configuré
