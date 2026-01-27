# 3A Automation
> Version: 119.1 | 27/01/2026 | Session 176bis | Optimized Memory

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ LIVE)

---

## État Actuel (27/01/2026)

### MCP Server
```
Version: 1.5.0 | SDK: 1.25.3 | SOTA: 95%
Tools: 124 (121 automations + 3 meta)
Tests: 99/99 (100%)
Transport: stdio, http | Auth: Bearer token (optional)
```

### Voice MENA Stack
```
Primary:     Grok-4-1-fast (testé OK)
Fallback 1:  Atlas-Chat-9B (voice real-time, Gemma license)
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

## Sensors (19 total - v1.1.0 REAL API Tests)

| Status | Count | Sensors |
|:---|:---|:---|
| ✅ OK | 10 | ga4, shopify, klaviyo, email-health, google-trends, cost-tracking, lead-velocity, product-seo, apify-trends, gsc |
| ⚠️ NO CREDS | 6 | meta-ads, tiktok-ads, whatsapp-status, google-ads-planner, supplier-health, content-perf |
| ❌ BLOCKED | 3 | retention, voice-quality, lead-scoring |

**Check:** `node automations/agency/core/SENSOR.cjs --health`

---

## BLOCKERS (Action Requise)

| Problème | Impact | Action |
|:---|:---|:---|
| TELNYX_API_KEY vide | Telephony MENA OFF | [Créer compte Telnyx](https://portal.telnyx.com) |
| META_ACCESS_TOKEN vide | Meta Ads cassé | Configurer token |
| TIKTOK_ACCESS_TOKEN vide | TikTok Ads cassé | Configurer token |
| Apify trial expiré | Scraping broken | [Payer $49/mois](https://console.apify.com/billing) |

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
