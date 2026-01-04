# Native Automation Scripts - Session 133bis

> **STATUS: 0 n8n workflows. ALL automations are native Node.js scripts.**
> n8n workflows archived to `automations/agency/n8n-workflows-ARCHIVED-Session120/`

## Current Status (04/01/2026 - Verified Session 133bis)

| Category | Count | Notes |
|----------|-------|-------|
| **Scripts with --health** | **22** | Full CLI support |
| **Total in core/** | **35** | .cjs files |
| OPERATIONAL | 16 | + 3 dropshipping = 19 |
| TEST MODE | 2 | hubspot, omnisend (no API keys) |
| BLOCKED | 3 | whatsapp, voice-telephony, sms |
| **Registry** | **v2.7.0** | 99 automations, 64/64 valid |

## Session 133 - DROPSHIPPING P0 FIXES COMPLETE ✅

| Script | Lines | Production-Ready | Port |
|--------|-------|-----------------|------|
| cjdropshipping-automation.cjs | 726 | **90%** ✅ | 3020 |
| bigbuy-supplier-sync.cjs | 929 | **85%** | 3021 |
| dropshipping-order-flow.cjs | 1087 | **95%** ✅ | 3022 |

**Commit:** `6a8c934` - feat(dropshipping): P0 BLOCKING fixes

---

## Scripts Natifs RÉSILIENTS (22 with --health)

| Script | Usage | Fallback Chain | Port |
|--------|-------|----------------|------|
| blog-generator-resilient.cjs | TEXT + SOCIAL | Anthropic→OpenAI→Grok 4.1→Gemini 3 | 3003 |
| voice-api-resilient.cjs | TEXT | Grok 4.1→OpenAI GPT-5.2→Gemini→Claude→Local | 3004 |
| product-photos-resilient.cjs | IMAGE/VISION | Gemini→Grok→fal.ai→Replicate | 3005 |
| email-personalization-resilient.cjs | TEXT | Grok 4.1→OpenAI→Gemini→Claude→Static | 3006 |
| grok-voice-realtime.cjs | AUDIO | Grok 4 Realtime→Gemini TTS | 3007 |
| whatsapp-booking-notifications.cjs | WHATSAPP | WhatsApp Cloud API | 3008 |
| voice-telephony-bridge.cjs | TELEPHONY | Twilio↔Grok WebSocket | 3009 |
| hubspot-b2b-crm.cjs | CRM B2B | HubSpot FREE API | - |
| omnisend-b2c-ecommerce.cjs | CRM B2C | Omnisend v5 API | - |
| podcast-generator-resilient.cjs | TEXT | Anthropic→OpenAI→Grok→Gemini | 3010 |
| churn-prediction-resilient.cjs | ANALYTICS | 4 AI + rule-based | - |
| at-risk-customer-flow.cjs | RETENTION | 4 AI + Klaviyo | - |
| review-request-automation.cjs | REVIEWS | 4 AI + Klaviyo | - |
| lead-qualification-chatbot.cjs | BANT | 4 AI + scoring | - |
| birthday-anniversary-flow.cjs | LIFECYCLE | 4 AI + Klaviyo | - |
| referral-program-automation.cjs | REFERRAL | 4 AI + Klaviyo | - |
| price-drop-alerts.cjs | ALERTS | 4 AI + Shopify | 3017 |
| replenishment-reminder.cjs | REORDER | 4 AI + Klaviyo | 3018 |
| sms-automation-resilient.cjs | SMS | Omnisend/Twilio (BLOCKED) | - |
| cjdropshipping-automation.cjs | DROPSHIP | CJ API + Shopify/Woo | 3020 |
| bigbuy-supplier-sync.cjs | DROPSHIP | BigBuy API | 3021 |
| dropshipping-order-flow.cjs | DROPSHIP | Multi-supplier orchestration | 3022 |

## Quick Commands

```bash
# Health checks
node automations/agency/core/uptime-monitor.cjs
node automations/agency/core/voice-api-resilient.cjs --health
node automations/agency/core/blog-generator-resilient.cjs --health

# Dropshipping
node automations/agency/core/cjdropshipping-automation.cjs --health
node automations/agency/core/bigbuy-supplier-sync.cjs --health
node automations/agency/core/dropshipping-order-flow.cjs --health
```

## Blockers

| Script | Missing Credentials |
|--------|---------------------|
| whatsapp-booking-notifications.cjs | WHATSAPP_ACCESS_TOKEN |
| voice-telephony-bridge.cjs | TWILIO_ACCOUNT_SID |
| sms-automation-resilient.cjs | OMNISEND_API_KEY or TWILIO_* |

---

**Session History:** See `docs/session-history/` for Sessions 115-132
