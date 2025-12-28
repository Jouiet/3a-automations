# n8n Workflows (10 Active)

## Active Workflows (10)

1. ✅ Grok Voice Telephony - Phone Booking
2. ✅ Email Outreach Sequence - Multi-Touch Campaign (v2.3.0)
3. ✅ WhatsApp Booking Confirmation
4. ✅ WhatsApp Booking Reminders
5. ✅ Blog Article Generator + Multi-Channel Distribution
6. ✅ LinkedIn Lead Scraper - Aggressive Outbound
7. ✅ Klaviyo Welcome Series - 5 Emails (v1.2.0)
8. ✅ Newsletter 3A Automation (Bi-Monthly 1st & 15th)
9. ✅ Enhance Product Photos (Gemini AI)
10. ✅ Test Webhook - Minimal

## Session 108 Fixes (28/12/2025)

- ✅ Email Outreach v2.3.0: Fixed connections + response nodes
- ✅ Klaviyo Welcome v1.2.0: Fixed connection name mismatch
- ✅ Replaced Google Sheets OAuth → HTTP Request (Apps Script)
- ✅ All 8 local workflows deployed successfully

## Blockers (HUMAN ACTION REQUIRED)

- ⚠️ KLAVIYO_API_KEY: Not set in n8n environment variables
- ⚠️ WhatsApp Business API: Not configured
- ⚠️ Twilio: Credentials missing

## URLs

- n8n: https://n8n.srv1168256.hstgr.cloud
- Webhook base: https://n8n.srv1168256.hstgr.cloud/webhook/

## Key Webhooks

- `/leads/new` - Email Outreach Sequence
- `/subscribe/new` - Klaviyo welcome series
- `/blog/generate` - Blog article generator
- Form handlers via Google Apps Script
