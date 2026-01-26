---
paths:
  - "automations/**"
  - "**/core/*.cjs"
---

# Native Scripts

## Status VÉRIFIÉ (26/01/2026 - Session 165ter)

### Scripts Core
| Category | Count | Status |
|----------|-------|--------|
| Total core | **85** | `ls agency/core/*.cjs` (+stitch-to-3a-css.cjs S163) |
| Avec --health | **26** | Testables (verified S165) |
| Resilient | 7 | Multi-AI fallback |
| Sensors | 20 | Data fetchers → GPM |

### Add-Ons Health (TOP 10 - Verified Session 165)
| Status | Count | Add-Ons |
|--------|-------|---------|
| ✅ OPERATIONAL | 7 | Anti-Churn, Review Booster, Replenishment, Email Cart, Price Drop, Blog Factory, Podcast |
| ⚠️ PARTIAL | 2 | SMS Automation (no providers), Dropshipping Suite (no API keys) |
| ❌ BLOCKED | 1 | WhatsApp Booking (no META tokens) |

### Sensors (20 total - Testé Session 165)
| Status | Count | Sensors |
|--------|-------|---------|
| ✅ OK (0-50) | 9 | retention(0), product-seo(0), gsc(0), cost-tracking(30), google-ads-planner(50), google-trends(8), klaviyo, shopify, email-health |
| ⚠️ PARTIAL (60-80) | 5 | lead-velocity(75), supplier-health(80), voice-quality, content-perf, lead-scoring |
| ❌ BLOCKED (90-95) | 6 | whatsapp(90), meta-ads(95), tiktok-ads(95), ga4(API disabled), bigquery(API disabled), apify(trial expired) |

### New Sensors (Session 139) - Per DOE v2 Spec
| Sensor | Description | Priority |
|--------|-------------|----------|
| shopify-sensor | Store health, orders, inventory | HAUTE |
| klaviyo-sensor | Email flows, campaigns | HAUTE |
| google-trends (REWRITTEN) | AI-powered market analysis (Grok→OpenAI→Gemini) | HAUTE |
| email-health-sensor | Bounce/spam/open rates | CRITIQUE |
| content-performance-sensor | WordPress blog metrics | HAUTE |
| supplier-health-sensor | CJ/BigBuy API health | MOYENNE |
| whatsapp-status-sensor | Template approval, quality | MOYENNE |
| voice-quality-sensor | Voice API latency, providers | HAUTE |
| cost-tracking-sensor | API costs, burn rate | MOYENNE |

### Blockers Sensors
| Sensor | Problème | Fix |
|--------|----------|-----|
| gsc-sensor | API non activée | [Activer](https://console.developers.google.com/apis/api/searchconsole.googleapis.com) |
| meta-ads | Credentials vides | Configurer META_ACCESS_TOKEN |
| tiktok-ads | Credentials vides | Configurer TIKTOK_ACCESS_TOKEN |
| apify-trends | Trial expiré | [Payer](https://console.apify.com/billing) |

## Key Scripts
| Script | Usage | Port |
|--------|-------|------|
| blog-generator-resilient.cjs | Content + social | 3003 |
| voice-api-resilient.cjs | Text gen | 3004 |
| email-personalization-resilient.cjs | Emails | 3006 |
| churn-prediction-resilient.cjs | Analytics | - |
| uptime-monitor.cjs | Monitoring | - |
| **stitch-api.cjs** | **UI Generation (MCP)** | - |

## Health Check Pattern
```bash
node automations/agency/core/SCRIPT.cjs --health
```

## Fallback Pattern (All Resilient Scripts)
```javascript
providers: ['grok', 'openai', 'gemini', 'anthropic']
// Auto-rotate on failure
```

## HITL (Human In The Loop) - Session 165quater (18/18 = 100%) ✅
| Script | HITL Type | Threshold |
|--------|-----------|-----------|
| blog-generator-resilient | Draft approval | requireApproval: true |
| email-personalization-resilient | Preview mode | previewModeDefault: true |
| churn-prediction-resilient | LTV threshold | €500 |
| sms-automation-resilient | Daily spend | €50/day |
| cjdropshipping-automation | Order confirm | confirmOrder() |
| podcast-generator-resilient | Script review | Required |
| at-risk-customer-flow | LTV/Discount | €500 or ≥20% |
| birthday-anniversary-flow | LTV/Discount | €500 or ≥20% |
| **referral-program-automation** | **Email preview** | **Preview mode default ON** |
| **replenishment-reminder** | **Frequency cap** | **1 reminder/week/customer** |
| **price-drop-alerts** | **Batch approval** | **>10 alerts in batch** |
| **review-request-automation** | **VIP approval** | **€500+ orders** |
| **dropshipping-order-flow** | **Order value** | **€500+ orders** |
| **bigbuy-supplier-sync** | **Batch sync** | **>100 products** |
| **hubspot-b2b-crm** | **Deal value** | **€2000+ deals** |
| **omnisend-b2c-ecommerce** | **Preview mode** | **Marketing events** |
| **lead-qualification-chatbot** | **Hot lead review** | **Score ≥80** |
| **voice-telephony-bridge** | **Call actions** | **Transfers + hot bookings** |

### HITL Commands
```bash
node SCRIPT.cjs --list-pending     # List pending approvals
node SCRIPT.cjs --approve=<id>     # Approve intervention
node SCRIPT.cjs --reject=<id>      # Reject intervention

# Script-specific
node price-drop-alerts.cjs --list-batches   # List pending batches
node price-drop-alerts.cjs --approve=<id>   # Approve batch
```
