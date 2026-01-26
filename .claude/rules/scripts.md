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

## HITL (Human In The Loop) - Session 165sexies (18/18 = 100%) ✅ FULL FLEXIBILITY
| Script | HITL Type | Default | Options (configurable) |
|--------|-----------|---------|------------------------|
| blog-generator-resilient | Draft approval + Agentic | true, 8/10 | true \| false, 6-9/10 |
| email-personalization-resilient | Preview mode + Cart delays | true, 1/24/72h | true \| false, custom hours |
| churn-prediction-resilient | LTV + RFM + Churn Risk | €300 | Full RFM config, risk thresholds |
| sms-automation-resilient | Daily spend | €50/day | €25, €50, €75, €100 |
| cjdropshipping-automation | Order confirm | required | confirmOrder() |
| podcast-generator-resilient | Script review | required | required |
| **at-risk-customer-flow** | LTV/Discount | €300 / 15% | €250-500 / 10-20% |
| **birthday-anniversary-flow** | LTV/Discount | €300 / 15% | €250-500 / 10-20% |
| referral-program-automation | Rewards + Tiers | All flexible | Full tier config |
| **replenishment-reminder** | Frequency cap | 1/week | 1, 2, 3 reminders/week |
| **price-drop-alerts** | Batch approval | 10 | 5, 10, 15, 20, 25 |
| **review-request-automation** | VIP threshold | €300 | €250, €300, €400, €500 |
| **dropshipping-order-flow** | Order value | €300 | €200, €300, €400, €500 |
| **bigbuy-supplier-sync** | Batch sync | 75 | 50, 75, 100, 150, 200 |
| **hubspot-b2b-crm** | Deal value | €1500 | €1000-5000 |
| **omnisend-b2c-ecommerce** | Preview + Batch | 10 | 5, 10, 25, 50, 100 |
| **lead-qualification-chatbot** | Hot lead score | 70 | 60, 70, 80, 90 |
| **voice-telephony-bridge** | BANT score | 70 | 60, 70, 80, 90 |

### HITL ENV Variables (Session 165sexies - Complete Flexibility)
```bash
# ═══════════════════════════════════════════════════════════════
# CHURN PREDICTION - Full RFM + Risk Flexibility (Session 165sexies)
# ═══════════════════════════════════════════════════════════════
CHURN_LTV_THRESHOLD=300            # €250|300|400|500|750|1000
CHURN_REQUIRE_APPROVAL=true        # true|false

# RFM Recency Thresholds (days)
RFM_RECENCY_EXCELLENT=30           # 14|21|30|45|60
RFM_RECENCY_GOOD=60                # 30|45|60|90|120
RFM_RECENCY_AVERAGE=90             # 60|90|120|150|180

# RFM Frequency Thresholds (orders)
RFM_FREQUENCY_EXCELLENT=10         # 5|8|10|15|20
RFM_FREQUENCY_GOOD=6               # 3|4|6|8|10

# RFM Monetary Thresholds (€)
RFM_MONETARY_EXCELLENT=1000        # 500|750|1000|1500|2000|3000
RFM_MONETARY_GOOD=500              # 250|400|500|750|1000

# Churn Risk Thresholds (0-1 scale)
CHURN_RISK_LOW=0.3                 # 0.2|0.25|0.3|0.35|0.4
CHURN_RISK_MEDIUM=0.5              # 0.4|0.45|0.5|0.55|0.6
CHURN_RISK_HIGH=0.7                # 0.6|0.65|0.7|0.75|0.8
CHURN_RISK_CRITICAL=0.85           # 0.75|0.8|0.85|0.9|0.95

# Engagement Thresholds
ENGAGEMENT_LOW_OPEN_RATE=0.10      # 0.05|0.08|0.10|0.12|0.15
ENGAGEMENT_LOW_CLICK_RATE=0.02     # 0.01|0.015|0.02|0.025|0.03
ENGAGEMENT_DECLINE_THRESHOLD=0.50  # 0.3|0.4|0.5|0.6|0.7

# ═══════════════════════════════════════════════════════════════
# REFERRAL PROGRAM - Full Tier Flexibility (Session 165sexies)
# ═══════════════════════════════════════════════════════════════
REFERRAL_TIER1_MIN=1               # 1|2|3
REFERRAL_TIER1_DISCOUNT=10         # 5|10|12|15
REFERRAL_TIER2_MIN=5               # 3|5|7|10
REFERRAL_TIER2_DISCOUNT=15         # 10|12|15|18|20
REFERRAL_TIER3_MIN=10              # 8|10|15|20
REFERRAL_TIER3_DISCOUNT=20         # 15|18|20|22|25
REFERRAL_TIER4_MIN=25              # 20|25|30|50
REFERRAL_TIER4_DISCOUNT=25         # 20|25|30|35
REFERRAL_TIER4_BONUS=50            # €25|50|75|100 credit
REFERRAL_REFEREE_DISCOUNT=15       # 10|12|15|20|25
REFERRAL_CODE_EXPIRY_DAYS=365      # 90|180|365|730
REFERRAL_REWARD_EXPIRY_DAYS=30     # 14|30|60|90
REFERRAL_AGENTIC_QUALITY_THRESHOLD=8  # 6|7|8|9

# ═══════════════════════════════════════════════════════════════
# EMAIL CART SERIES - Timing Flexibility (Session 165sexies)
# ═══════════════════════════════════════════════════════════════
CART_EMAIL1_HOURS=1                # 0.5|1|2|4
CART_EMAIL2_HOURS=24               # 12|24|36|48
CART_EMAIL3_HOURS=72               # 48|72|96|120|168
CART_EMAIL3_DISCOUNT=10            # 5|10|15|20

# ═══════════════════════════════════════════════════════════════
# BLOG GENERATOR - Agentic Loop Flexibility (Session 165sexies)
# ═══════════════════════════════════════════════════════════════
BLOG_AGENTIC_QUALITY_THRESHOLD=8   # 6|7|8|9
BLOG_AGENTIC_MAX_RETRIES=2         # 1|2|3|4
BLOG_AGENTIC_VERBOSE=false         # true|false

# ═══════════════════════════════════════════════════════════════
# EXISTING THRESHOLDS (Session 165quinquies)
# ═══════════════════════════════════════════════════════════════
# LTV/Discount thresholds
AT_RISK_LTV_THRESHOLD=300          # €250|300|400|500
AT_RISK_DISCOUNT_THRESHOLD=15      # 10%|15%|20%
BIRTHDAY_LTV_THRESHOLD=300         # €250|300|400|500
BIRTHDAY_DISCOUNT_THRESHOLD=15     # 10%|15%|20%

# Order/Deal thresholds
HITL_ORDER_VALUE_THRESHOLD=300     # €200|300|400|500
HITL_DEAL_VALUE_THRESHOLD=1500     # €1000|1500|2000|3000|5000
REVIEW_VIP_THRESHOLD=300           # €250|300|400|500

# Batch thresholds
HITL_BATCH_THRESHOLD=75            # 50|75|100|150|200 (BigBuy)
PRICE_DROP_BATCH_THRESHOLD=10      # 5|10|15|20|25

# Score thresholds
HITL_HOT_LEAD_THRESHOLD=70         # 60|70|80|90
HITL_BOOKING_SCORE_THRESHOLD=70    # 60|70|80|90

# Frequency caps
REPLENISHMENT_MAX_PER_WEEK=1       # 1|2|3
```

### HITL Commands
```bash
node SCRIPT.cjs --list-pending     # List pending approvals
node SCRIPT.cjs --approve=<id>     # Approve intervention
node SCRIPT.cjs --reject=<id>      # Reject intervention

# Script-specific
node price-drop-alerts.cjs --list-batches   # List pending batches
node price-drop-alerts.cjs --approve=<id>   # Approve batch
```
