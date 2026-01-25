# ADD-ONS CATALOG - 3A Automation
> Version: 1.0 | Date: 25/01/2026 | Session: 156
> Source: Analyse bottom-up des 83 scripts agency/core/

## Executive Summary

| Metric | Value |
|--------|-------|
| Total scripts agency/core | 83 |
| Scripts with --health (functional) | 24 |
| Scripts eligible for add-ons | 16 |
| TOP 10 add-ons selected | 10 |
| Human In The Loop (HITL) coverage | 30% (3/10) |

---

## TOP 10 ADD-ONS

### #1 - Anti-Churn AI
```yaml
Script: churn-prediction-resilient.cjs
Health Check: ✅ --health supported
ROI Verified: -25% churn rate, +260% at-risk conversion
Pricing:
  Setup: $200
  Monthly: $180/month
What It Does:
  - RFM scoring (Recency, Frequency, Monetary)
  - AI churn prediction (4 provider fallback)
  - Auto-intervention flows
HITL Status: ⚠️ PARTIAL
  - Thresholds configurable (declineThreshold: 0.50)
  - NO human approval before intervention
  - RECOMMENDATION: Add approval workflow for high-value customers
Dependencies:
  - Klaviyo API
  - Shopify API
  - AI providers (Anthropic/Grok/Gemini/OpenAI)
```

### #2 - Review Booster
```yaml
Script: review-request-automation.cjs
Health Check: ✅ --health supported
ROI Verified: +270% reviews with photo incentives
Pricing:
  Setup: $100
  Monthly: $80/month
What It Does:
  - Smart timing post-purchase (7-14 days)
  - AI-personalized request
  - Photo incentive system
HITL Status: ❌ NONE (Fully automated)
  - OK for this use case (low risk)
Dependencies:
  - Klaviyo API
  - Shopify API
```

### #3 - Replenishment Reminder
```yaml
Script: replenishment-reminder.cjs
Health Check: ✅ --health supported
ROI Verified: +90% repeat purchase
Pricing:
  Setup: $120
  Monthly: $100/month
What It Does:
  - Consumption rate calculation per product
  - AI timing prediction
  - Personalized reminder emails
HITL Status: ❌ NONE (Fully automated)
  - OK for this use case (non-critical)
Dependencies:
  - Klaviyo API
  - Shopify API
  - Product metadata (consumption rates)
```

### #4 - Email Cart Series AI
```yaml
Script: email-personalization-resilient.cjs
Health Check: ✅ --health supported
ROI Verified: +69% orders vs single email
Pricing:
  Setup: $150
  Monthly: $150/month
What It Does:
  - 3-email cart recovery series (1h/24h/72h)
  - AI personalization (4 provider fallback)
  - Dynamic product recommendations
HITL Status: ⚠️ PARTIAL
  - No preview before send
  - RECOMMENDATION: Add email preview approval option
Dependencies:
  - Klaviyo API
  - AI providers (Anthropic/Grok/Gemini/OpenAI)
```

### #5 - SMS Automation
```yaml
Script: sms-automation-resilient.cjs
Health Check: ✅ --health supported
ROI Verified: 98% open rate, 21-32% conversion
Pricing:
  Setup: $150
  Monthly: $120/month + SMS usage
What It Does:
  - Order confirmation SMS
  - Delivery updates
  - Review requests via SMS
  - Multi-provider (Omnisend + Twilio fallback)
HITL Status: ⚠️ PARTIAL
  - Templates pre-approved
  - No per-message approval (cost implications)
  - RECOMMENDATION: Add daily spend limit with alert
Dependencies:
  - Omnisend API
  - Twilio API (fallback)
```

### #6 - Price Drop Alerts
```yaml
Script: price-drop-alerts.cjs
Health Check: ✅ --health supported
ROI Verified: 8.8% conversion rate
Pricing:
  Setup: $100
  Monthly: $80/month
What It Does:
  - Wishlist monitoring
  - Price drop detection (thresholds: 20% urgent, 30% flash)
  - Automated alert emails
HITL Status: ⚠️ PARTIAL
  - Thresholds configurable
  - No approval needed (triggered by price changes)
Dependencies:
  - Klaviyo API
  - Shopify API (price webhooks)
```

### #7 - WhatsApp Booking
```yaml
Script: whatsapp-booking-notifications.cjs
Health Check: ✅ --health supported
ROI Verified: -30% no-shows (98% open vs 20% email)
Pricing:
  Setup: $80
  Monthly: $60/month + WhatsApp usage
What It Does:
  - Booking confirmation via WhatsApp
  - 24h reminder
  - 1h reminder
  - Uses Meta-approved templates
HITL Status: ✅ IMPLICIT
  - Templates must be pre-approved by Meta
  - No per-message approval (standard flow)
Dependencies:
  - WhatsApp Business API
  - Google Calendar API
```

### #8 - Blog Factory AI
```yaml
Script: blog-generator-resilient.cjs
Health Check: ✅ --health supported
ROI Verified: 3 AI fallback + 3 social channels
Pricing:
  Setup: $200
  Monthly: $200/month
What It Does:
  - AI-generated blog articles (Anthropic→Grok→Gemini fallback)
  - Automatic social distribution (Facebook, LinkedIn, X)
  - SEO optimization
  - Quality threshold system
HITL Status: ⚠️ PARTIAL
  - Quality threshold auto-check
  - NO human review before publish
  - CRITICAL RECOMMENDATION: Add mandatory review step before publish
Dependencies:
  - AI providers (Anthropic/Grok/Gemini)
  - Social APIs (Meta, LinkedIn, X)
  - WordPress/CMS API
```

### #9 - Podcast Generator
```yaml
Script: podcast-generator-resilient.cjs
Health Check: ✅ --health supported
ROI Verified: Blog → Podcast (better than NotebookLM)
Pricing:
  Setup: $120
  Monthly: $100/month
What It Does:
  - Converts blog to podcast script
  - Dual voice TTS (Google TTS)
  - 2 customizable voices
HITL Status: ✅ YES
  - Saves script for review/editing before audio generation
  - Human can modify script before TTS
Dependencies:
  - AI providers (Gemini)
  - Google TTS API
```

### #10 - Dropshipping Suite
```yaml
Scripts:
  - cjdropshipping-automation.cjs
  - bigbuy-supplier-sync.cjs
  - dropshipping-order-flow.cjs
Health Check: ✅ --health supported (all 3)
ROI Verified: 100% order automation
Pricing:
  Setup: $350
  Monthly: $250/month
What It Does:
  - CJDropshipping integration (100% automated)
  - BigBuy EU catalog sync
  - Multi-supplier orchestration
  - Order routing & tracking
HITL Status: ✅ YES
  - confirmOrder() function allows manual confirmation
  - Order review possible before supplier submission
Dependencies:
  - CJDropshipping API
  - BigBuy API
  - Shopify API
```

---

## HITL ANALYSIS SUMMARY

### Current State
| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Full HITL | 3 | 30% |
| ⚠️ Partial HITL | 5 | 50% |
| ❌ No HITL | 2 | 20% |

### HITL Gap Analysis

| Add-On | Current | Risk Level | Action Required |
|--------|---------|------------|-----------------|
| Anti-Churn AI | Partial | 🟡 Medium | Add approval for >$500 LTV customers |
| Review Booster | None | 🟢 Low | None (low risk) |
| Replenishment | None | 🟢 Low | None (low risk) |
| Email Cart Series | Partial | 🟡 Medium | Add preview option |
| SMS Automation | Partial | 🟡 Medium | Add daily spend limit alert |
| Price Drop | Partial | 🟢 Low | None (triggered by data) |
| WhatsApp Booking | Implicit | 🟢 Low | None (Meta templates) |
| **Blog Factory** | **Partial** | **🔴 HIGH** | **MANDATORY: Add human review** |
| Podcast Generator | Full | 🟢 Low | Already has review step |
| Dropshipping | Full | 🟢 Low | Already has confirmOrder() |

### CRITICAL ACTION ITEMS

1. **Blog Factory AI (HIGH PRIORITY)**
   - Current: Auto-publish without human review
   - Risk: Brand reputation, factual errors, tone issues
   - Fix: Add `publishAfterApproval` flag, send draft to Slack/email for review

2. **Anti-Churn AI (MEDIUM PRIORITY)**
   - Current: Auto-intervention on all at-risk
   - Risk: Inappropriate discounts to high-value customers
   - Fix: Add LTV threshold for manual approval

3. **Email Cart Series (MEDIUM PRIORITY)**
   - Current: No preview before batch send
   - Risk: AI hallucination in personalization
   - Fix: Add `previewMode` flag, send sample to admin first

---

## PRICING STRUCTURE

### Add-On Tiers

| Tier | Add-Ons | Setup Range | Monthly Range |
|------|---------|-------------|---------------|
| Retention | Anti-Churn, Replenishment, Price Drop | $320-$420 | $260-$360 |
| Engagement | Review, Email Cart, SMS | $400-$500 | $350-$450 |
| Content | Blog Factory, Podcast | $320 | $300 |
| Operations | WhatsApp, Dropshipping | $430 | $310 |

### Bundle Discounts

| Bundle | Add-Ons | Regular | Discounted | Savings |
|--------|---------|---------|------------|---------|
| Retention Pro | #1 + #3 + #6 | $360/mo | $300/mo | 17% |
| Engagement Pro | #2 + #4 + #5 | $350/mo | $290/mo | 17% |
| Content Pro | #8 + #9 | $300/mo | $250/mo | 17% |
| Full Stack | All 10 | $1,170/mo | $900/mo | 23% |

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Pricing Page Update (4h)
- [ ] Add "Add-Ons" section to pricing.html (FR + EN)
- [ ] Create add-on cards with setup + monthly pricing
- [ ] Add bundle options
- [ ] Connect to contact form with pre-selected add-on

### Phase 2: HITL Improvements (8h)
- [ ] Blog Factory: Add `publishAfterApproval` flag
- [ ] Anti-Churn: Add LTV threshold for manual review
- [ ] Email Cart: Add `previewMode` option
- [ ] SMS: Add daily spend limit alert

### Phase 3: Documentation (2h)
- [ ] Create per-add-on setup guides
- [ ] Document HITL configuration options
- [ ] Add FAQ section

---

## SOURCES

- Scripts analyzed: `automations/agency/core/*.cjs`
- ROI data: `landing-page-hostinger/data/automations-catalog.json`
- Health check verification: `grep -l "\-\-health"` (24 scripts)
- Session: 156 (25/01/2026)

---

*Document created: 25/01/2026 | Last updated: 25/01/2026*
