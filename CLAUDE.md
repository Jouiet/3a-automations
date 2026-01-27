# 3A Automation
> Version: 131.0 | 27/01/2026 | Session 180 | Engineering Score: 94/100 (Learning Loop E2E VERIFIED)

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ LIVE)

---

## Engineering Scores (Session 179 - AGENT OPS v3.0 COMPLETE)

**3A = Agence qui vend des services automation, PAS un e-commerce**

| Discipline | Max | Current | Note |
|:---|:---:|:---:|:---|
| **Voice AI** | 15 | **15** | ✅ Bug fixed, 5 langues, 4 providers |
| **Multi-Tenant** | 15 | **15** | ✅ RLS, 7 Personas, tenant isolation |
| **Agent Ops v3.0** | 20 | **20** | ✅ ALL 5 modules @ v3.0, EventBus, State Machine |
| **Tools/Scripts** | 15 | **14** | 85 scripts, HITL 18/18, resilient fallbacks |
| **MCP Platform** | 15 | **15** | 99/99 tests, 124 tools exposés |
| **Sensors** | 10 | **7** | 14/19 OK (4 blocked by missing creds) |
| **Integrations** | 10 | **8** | Core OK, META/TIKTOK external creds missing |
| **TOTAL** | **100** | **94** | **SOTA Multi-Agent Platform** |

### Agent Ops v3.0 (Session 179 - ALL COMPLETE ✅)
| Module | Version | SOTA Features |
|:---|:---:|:---|
| **AgencyEventBus.cjs** | 3.0 | Event persistence, idempotency, DLQ, retry backoff, multi-tenant |
| **ContextBox.cjs** | 3.0 | EventBus subscriptions, predictive context, state machine |
| **BillingAgent.cjs** | 3.0 | Event emission, state machine, cost tracking |
| **ErrorScience.cjs** | 3.0 | EventBus integration, recordError() API, CLI --health |
| **RevenueScience.cjs** | 3.0 | EventBus integration, pricing analytics, CLI --health |
| **KBEnrichment.cjs** | 2.0 | KB versioning, rollback, audit trail, EventBus emit |
| **ConversationLearner.cjs** | 2.0 | Pattern extraction, HITL queue, EventBus emit |

### Session 180 - Learning Loop E2E VERIFIED ✅
- ✅ Voice Services: 3/3 HEALTHY (voice-api:3004, grok-realtime:3007, telephony-bridge:3009)
- ✅ Bug Fix: voice-ecommerce-tools.cjs - Export singleton instance (was class)
- ✅ Bug Fix: Learning Queue API path - Added `..` for project root access
- ✅ Learning Loop E2E Test:
  - Voice Conversation → ContextBox history (4 messages)
  - ConversationLearner → 3 facts extracted (gap, correction)
  - Learning Queue API → Dashboard works (3 pending facts)
  - Human Review → 1 fact approved via PATCH API
  - KBEnrichment → 1 fact injected (136 chunks, +1 learned)
- ✅ Landing Page verified: Futuristic design, 121 workflows, 22 agents displayed

### Session 179 - Complete Summary
- ✅ Learning Queue Dashboard UI (`/admin/agent-ops/learning`)
- ✅ KBEnrichment.cjs (350 lines) - KB versioning, rollback, audit trail
- ✅ Circular dependency fix (EventBus lazy loading)
- ✅ Sidebar navigation updated (Agent Ops > Learning Queue)
- ✅ ErrorScience v3.0 - EventBus integration, recordError() API
- ✅ RevenueScience v3.0 - EventBus integration, pricing analytics

### Session 178quater - Agent Ops v3.0
- ✅ Voice API `/respond` bug fixed (VOICE_CONFIG import)
- ✅ Telephony Bridge syntax error fixed (Session 178ter)
- ✅ Agent Ops upgraded to v3.0 with EventBus
- ✅ Multi-agent coordination (LangGraph-inspired)

### Pour atteindre 100/100 (User Actions)
| Credential | Impact | Points |
|:---|:---|:---:|
| META_ACCESS_TOKEN | Tracking ads clients | +4 |
| TIKTOK_ACCESS_TOKEN | TikTok ads clients | +3 |
| STRIPE_SECRET_KEY | Facturation clients | +4 |
| TELNYX_API_KEY | Appels téléphoniques | +3 |
| CJ/BIGBUY keys | Dropshipping clients | +2 |

---

## Agent Ops Modules (Session 178 - SOTA)

| Module | Version | Lignes | SOTA Features |
|:---|:---:|:---:|:---|
| ContextBox.cjs | 1.0 | 330 | Token management, compaction, TTL |
| BillingAgent.cjs | 2.0 | 195 | Idempotency keys, webhook verify, dedup |
| ErrorScience.cjs | 2.0 | 240 | Confidence scoring, trend detection, TTL |
| RevenueScience.cjs | 2.0 | 170 | Demand curve, urgency pricing |
| meta-capi-gateway.cjs | 2.0 | 270 | Event dedup, retry backoff, EMQ |
| stripe-global-gateway.cjs | 2.0 | 180 | Idempotency, webhook HMAC |

**Total: 1385 lignes engineering (+775 SOTA)**

### Engineering v3.0 Tools (Session 178ter)
```bash
# Credential Validation (pre-flight check)
node credential-validator.cjs --check    # Score: 60%

# Voice Services Management
node startup-orchestrator.cjs --status   # 0/3 running
node startup-orchestrator.cjs --start    # Auto-start all
node startup-orchestrator.cjs --stop     # Stop all
```

### Learning Queue (Session 178-179) ✅ COMPLETE
```
Backend:  ConversationLearner.cjs (458 lines)
Storage:  data/learning/learning_queue.jsonl
API:      dashboard/src/app/api/learning/
UI:       /admin/agent-ops/learning (S179)
KB Loop:  KBEnrichment.cjs (350 lines, S179)
```

| Endpoint | Method | Function |
|:---|:---|:---|
| `/api/learning/queue` | GET | List facts (filter: status, type) |
| `/api/learning/queue/[id]` | GET | Single fact |
| `/api/learning/queue/[id]` | PATCH | Approve/Reject/Modify |
| `/api/learning/batch` | POST | Bulk operations |
| `/api/learning/stats` | GET | Dashboard stats |

---

## État Actuel (27/01/2026)

### MCP Stack (14 servers - Verified 178quater)

#### Global MCPs (~/.config/claude-code/mcp.json)
| MCP | Status | Verification |
|:---|:---|:---|
| chrome-devtools | ✅ OK | list_pages, screenshots |
| playwright | ✅ OK | browser_tabs, automation |
| gemini | ✅ OK | gemini-2.5-pro-latest |
| hostinger | ✅ OK | VPS 1168256 access |
| github | ✅ OK | Repo operations work |
| filesystem | ✅ OK | Built-in |
| memory | ✅ OK | Built-in |

#### Project MCPs (.mcp.json)
| MCP | Status | Verification |
|:---|:---|:---|
| **3a-global-mcp** | ✅ **99/99 tests** | 124 tools (121 automations + 3 meta) |
| grok | ✅ OK | XAI_API_KEY configured |
| google-sheets | ✅ OK | Service account auth |
| klaviyo | ✅ OK | API works (SSL local only) |
| shopify-dev | ✅ OK | API docs, no auth needed |
| shopify-admin | ✅ OK | Store management |
| apify | ✅ OK | Actor execution |

#### 3a-global-mcp Details
```
Location:   automations/3a-global-mcp/
Version:    1.5.0
SDK:        @modelcontextprotocol/sdk 1.25.3
Tools:      124 (121 automations + 3 meta)
Tests:      99/99 (100%) - ALL PASSED
Transport:  stdio, http
Auth:       Bearer token (optional)
Registry:   automations-registry.json (121 entries)
```

**Verify MCP:** `node automations/3a-global-mcp/verify-core.js`

### Voice MENA Stack
```
Primary:     Grok-4-1-fast (testé OK)
Fallback 1:  Atlas-Chat-9B (✅ Featherless AI + Contexte FACTUEL)
Fallback 2:  Atlas-Chat-27B (offline analytics)
TTS:         ElevenLabs Ghizlane
STT:         ElevenLabs Scribe Maghrebi
```

### Voice Services: 3/3 HEALTHY
| Service | Port | Latence |
|:---|:---|:---|
| Voice API | 3004 | 23ms |
| Grok Realtime | 3007 | 2ms |
| Telephony Bridge | 3009 | 3ms |

---

## Sensors (19 total - Session 178quater VERIFIED 27/01/2026 19:45 CET)

### ✅ OPERATIONAL (14/19)
| Sensor | Function | Credentials Used | Last Verified |
|:---|:---|:---|:---|
| shopify-sensor | Store health, products, orders | SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN | ✅ API passed |
| klaviyo-sensor | Email lists, campaigns | KLAVIYO_API_KEY | ✅ 10 lists |
| email-health-sensor | Bounce/spam/open rates | KLAVIYO_API_KEY | ✅ API passed |
| cost-tracking-sensor | API costs, burn rate | OPENAI_API_KEY, ANTHROPIC_API_KEY | ✅ Budget OK |
| lead-velocity-sensor | Lead count, velocity | File-based (leads-scored.json) | ✅ 2 leads |
| ga4-sensor | Sessions, conversions, revenue | GA4_PROPERTY_ID, GOOGLE_APPLICATION_CREDENTIALS | ✅ API passed |
| retention-sensor | Order count, churn rate | SHOPIFY_* | ✅ 0 orders |
| gsc-sensor | Search impressions, clicks | GOOGLE_APPLICATION_CREDENTIALS, GSC_SITE_URL | ✅ API passed |
| lead-scoring-sensor | Lead quality score | File-based | ✅ Score: 3 |
| apify-trends-sensor | Market trends (via Apify) | APIFY_TOKEN | ✅ STARTER plan |
| google-trends-sensor | AI market analysis | Multi-AI (Grok→OpenAI→Gemini) | ✅ 4 providers |
| product-seo-sensor | Product SEO quality | SHOPIFY_* | ✅ API passed |
| content-performance-sensor | WordPress metrics | WP_SITE_URL, WP_APP_PASSWORD | ✅ API passed |
| voice-quality-sensor | Voice endpoints health | Internal | ✅ 3/3 healthy |

### ⚠️ PARTIAL (1/19)
| Sensor | Issue | Missing Credentials |
|:---|:---|:---|
| supplier-health-sensor | No supplier APIs configured | CJ_API_KEY, BIGBUY_API_KEY |

### ❌ BLOCKED (4/19)
| Sensor | Error | Missing Credentials | Setup Link |
|:---|:---|:---|:---|
| meta-ads-sensor | META_ACCESS_TOKEN not set | META_ACCESS_TOKEN | [Meta Business](https://business.facebook.com/settings/system-users) |
| tiktok-ads-sensor | TIKTOK tokens not set | TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID | [TikTok Business](https://ads.tiktok.com/marketing_api/docs) |
| whatsapp-status-sensor | WHATSAPP tokens not set | WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID | [Meta WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api) |
| google-ads-planner-sensor | All Google Ads creds missing | GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_REFRESH_TOKEN | [Google Ads API](https://developers.google.com/google-ads/api/docs) |

**Total Fonctionnels: 14/19 (74%)**

### Verification Commands
```bash
# Single sensor
node automations/agency/core/SENSOR-NAME-sensor.cjs --health

# All sensors (batch)
for s in shopify klaviyo ga4 retention gsc; do
  echo "=== $s ===" && node automations/agency/core/${s}-sensor.cjs --health 2>&1 | head -5
done
```

---

## BLOCKERS (Action Requise - User Must Configure)

| Credential | Impact | Action |
|:---|:---|:---|
| META_ACCESS_TOKEN | Meta Ads sensor blocked | [Meta Business](https://business.facebook.com/settings/system-users) |
| TIKTOK_ACCESS_TOKEN + ADVERTISER_ID | TikTok Ads sensor blocked | [TikTok Business](https://ads.tiktok.com/marketing_api/docs) |
| WHATSAPP_ACCESS_TOKEN + PHONE_NUMBER_ID | WhatsApp sensor blocked | [Meta WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api) |
| GOOGLE_ADS_* (5 keys) | Google Ads Planner blocked | [Google Ads API](https://developers.google.com/google-ads/api/docs) |
| TELNYX_API_KEY | Voice Telephony external calls | [Telnyx Portal](https://portal.telnyx.com) |
| STRIPE_SECRET_KEY | Payments processing | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| CJ_API_KEY, BIGBUY_API_KEY | Supplier sync (P3) | Contact suppliers |

---

## AI Fallback Strategy

### CRITICAL (churn, scoring, decisions)
| Ordre | Provider | Model |
|:---|:---|:---|
| 1 | **Claude** | claude-opus-4-5-20251101 |
| 2 | Grok | grok-4-1-fast-reasoning |
| 3 | Gemini | gemini-3-flash |
| 4 | Rules | rule-based-fallback |

### VOLUME (content, emails)
| Ordre | Provider | Model |
|:---|:---|:---|
| 1 | **Gemini** | gemini-3-flash |
| 2 | Grok | grok-4-1-fast-reasoning |
| 3 | Claude | claude-haiku |

### REAL-TIME (voice)
| Ordre | Provider | Model |
|:---|:---|:---|
| 1 | **Grok** | grok-4-1-fast-reasoning |
| 2 | ElevenLabs | eleven-multilingual-v2 |

**Trigger**: Latency > 15s OR Status != 200
**Ref**: `docs/AI-PROVIDER-STRATEGY.md`

---

## HITL Coverage: 18/18 Scripts ✅

| Category | Scripts | ENV Variables |
|:---|:---|:---|
| Financial | at-risk-customer, birthday-anniversary | LTV €250-500 |
| Communication | referral, replenishment, price-drop, review, omnisend | Batch 5-25 |
| Content | blog-generator, email-personalization, podcast | Approval |
| Operations | dropshipping, bigbuy, hubspot, lead-qual, voice | Threshold 60-90 |
| Cost Control | sms-automation, churn-prediction | Daily €25-100 |

**Commands:**
```bash
node SCRIPT.cjs --list-pending
node SCRIPT.cjs --approve=<id>
node SCRIPT.cjs --reject=<id>
```

---

## Ecosystem Counts (Vérifiés S165)

| Component | Count |
|:---|:---|
| Scripts Core | 85 |
| Automations Registry | 121 |
| Skills | 42 |
| Sensors | 19 (15 OK) |
| MCP Servers | 14 |
| HTML Pages | 79 |
| Credentials SET | 61% |

---

## Protocols

| Protocol | Status | Location |
|:---|:---|:---|
| **A2A** | ✅ PRODUCTION | automations/a2a/server.js |
| **MCP** | ✅ PRODUCTION | mcp/3a-global-mcp/ |
| **GPM** | ✅ PRODUCTION | 19 sensors → pressure-matrix.json |

---

## Règles Strictes

1. **Factuality**: 100% (Probes empiriques, pas de mocks)
2. **Zero Debt**: 0 TODO/placeholder dans le core
3. **HITL**: 100% couverture (18/18 scripts)
4. **Credentials**: `process.env.*` uniquement
5. **Health Check**: `--health` pour tous les scripts

---

## Commandes

```bash
# Audit
node scripts/forensic-audit-complete.cjs

# Deploy
git push origin main

# Health Check
node automations/agency/core/SCRIPT.cjs --health

# Stitch API
node automations/agency/core/stitch-api.cjs list
```

---

## Add-Ons (TOP 10)

| # | Add-On | Monthly | Script |
|:---|:---|:---|:---|
| 1 | Anti-Churn AI | €180 | churn-prediction-resilient.cjs |
| 2 | Review Booster | €80 | review-request-automation.cjs |
| 3 | Replenishment | €100 | replenishment-reminder.cjs |
| 4 | Email Cart Series | €150 | email-personalization-resilient.cjs |
| 5 | SMS Automation | €120 | sms-automation-resilient.cjs |
| 6 | Price Drop | €80 | price-drop-alerts.cjs |
| 7 | WhatsApp Booking | €60 | whatsapp-booking-notifications.cjs |
| 8 | Blog Factory | €200 | blog-generator-resilient.cjs |
| 9 | Podcast Generator | €100 | podcast-generator-resilient.cjs |
| 10 | Dropshipping | €250 | cjdropshipping-automation.cjs |

---

## Références

**Index:** `@docs/DOCS-INDEX.md`

### Auto-load (petits)
- `docs/external_workflows.md` (0.6K)
- `docs/reference/infrastructure.md` (1.3K)

### Manual-load (gros)
```bash
@docs/SESSION-HISTORY.md                  # Historique sessions complet
@docs/VOICE-MENA-PLATFORM-ANALYSIS.md     # Voice MENA v5.5.3
@docs/AI-PROVIDER-STRATEGY.md             # Stratégie AI providers
@docs/ETAGERE-TECHNOLOGIQUE-ECOSYSTEME-3A.md
@.claude/rules/scripts.md                 # Scripts reference (60+ ENV)
```

---

## P0 Actions (Voice MENA)

| Action | Deadline |
|:---|:---|
| Deploy Atlas-Chat-9B RunPod | J+3 |
| Tester Mistral Saba Darija | J+2 |
| Premier DID Telnyx +212 | J+1 |
| WhatsApp Business Calling | J+7 |
