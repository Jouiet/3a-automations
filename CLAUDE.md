# 3A Automation
> Version: 101.0 | 26/01/2026 | Session 165quater - HITL 100% Coverage Complete

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

---

## SESSION 165 - CONSOLIDATED (26/01/2026)

### Ecosystem Audit Results (VERIFIED)

| Component | Reality | Status |
| :--- | :--- | :--- |
| Scripts Core | **85** | ✅ (+stitch-to-3a-css.cjs) |
| Scripts --health | **27** (32%) | ⚠️ 68% sans health check |
| Automations Registry | **121** (88 w/ scripts) | ✅ 33 external configs |
| Skills (SKILL.md) | **42** | ✅ 95% |
| Sensors Working | **15/19 (79%)** | ⚠️ 4 blocked |
| MCP Servers | **11** | ✅ |
| Remotion Compositions | **7** | ✅ |
| HTML Pages | **79** | ✅ |
| Credentials SET | **61%** (57/93) | ⚠️ 36 empty |

### HITL Coverage: 100% (18/18 Scripts) ✅

| Category | Scripts | HITL Type |
| :--- | :--- | :--- |
| **Financial (2)** | at-risk-customer-flow, birthday-anniversary-flow | LTV €500 / Discount ≥20% |
| **Communication (5)** | referral-program, replenishment-reminder, price-drop-alerts, review-request, omnisend-b2c | Preview/Cap/Batch |
| **Content (3)** | blog-generator, email-personalization, podcast-generator | Approval/Preview/Review |
| **Operations (5)** | dropshipping-order-flow, bigbuy-supplier-sync, hubspot-b2b-crm, lead-qualification-chatbot, voice-telephony-bridge | Threshold approvals |
| **Cost Control (2)** | sms-automation, churn-prediction | Daily limit / LTV threshold |
| **Supply Chain (1)** | cjdropshipping-automation | confirmOrder() |

### CSS Status

| Metric | Value |
| :--- | :--- |
| CSS Version | **v=86.0** |
| Validator Errors | **0** |
| Validator Warnings | **75** |
| CSS Duplicates | **22** |

### Protocols

| Protocol | Status | Location |
| :--- | :--- | :--- |
| **A2A** | ✅ PRODUCTION | automations/a2a/server.js (624 lines, 12 endpoints) |
| **ACP** | ❌ DEPRECATED | Merged into A2A (Jan 2026) |
| **UCP** | ✅ INTEGRATED | In A2A server |
| **GPM** | ✅ PRODUCTION | 20 sensors → pressure-matrix.json |

### Optimization Backlog (P0-P1)

| Stack | Finding | Priority |
| :--- | :--- | :--- |
| Shopify Flow | 100 items MAX per loop | **P0** |
| Gemini 3 | thought_signatures REQUIRED for function calling | **P1** |
| OpenAI | 90% cost reduction with cached inputs | P1 |
| ElevenLabs | Flash v2.5 = 75ms latency (vs 300ms) | P1 |
| GA4 | Consent Mode v2 MANDATORY EU | P1 |
| WCAG 2.2 | Level AA April 2026 EU deadline | P1 |

---

## SENSORS (20 total - Verified 26/01/2026)

| Status | Count | Sensors |
| :--- | :--- | :--- |
| ✅ OK | 15 | product-seo(0), gsc(0), cost-tracking(30), google-trends(8), shopify(75), klaviyo(65), email-health(60), lead-velocity(75), supplier-health(80), voice-quality(90), meta-ads(95), tiktok-ads(95), content-perf(90), lead-scoring(95), whatsapp(90) |
| ❌ BLOCKED | 4 | retention(NETWORK), ga4(API_DISABLED), bigquery(API_DISABLED), apify(PAID_REQUIRED) |

---

## BLOCKERS (USER ACTION REQUIRED)

| Problème | Impact | Action |
| :--- | :--- | :--- |
| GA4 API disabled | Analytics broken | [Enable API](https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=932220171320) |
| BigQuery API disabled | Trends broken | Enable BigQuery API |
| META_ACCESS_TOKEN vide | Meta Ads cassé | Configurer token |
| TIKTOK_ACCESS_TOKEN vide | TikTok Ads cassé | Configurer token |
| Apify trial expiré | Scraping broken | [Payer $49/mois](https://console.apify.com/billing) |
| 36 credentials vides | 39% features OFF | Configurer .env |

---

## Add-Ons (TOP 10)

| # | Add-On | Monthly | Script | HITL |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Anti-Churn AI | €180 | churn-prediction-resilient.cjs | ✅ |
| 2 | Review Booster | €80 | review-request-automation.cjs | ✅ |
| 3 | Replenishment | €100 | replenishment-reminder.cjs | ✅ |
| 4 | Email Cart Series | €150 | email-personalization-resilient.cjs | ✅ |
| 5 | SMS Automation | €120 | sms-automation-resilient.cjs | ✅ |
| 6 | Price Drop | €80 | price-drop-alerts.cjs | ✅ |
| 7 | WhatsApp Booking | €60 | whatsapp-booking-notifications.cjs | ✅ |
| 8 | Blog Factory | €200 | blog-generator-resilient.cjs | ✅ |
| 9 | Podcast Generator | €100 | podcast-generator-resilient.cjs | ✅ |
| 10 | Dropshipping | €250 | cjdropshipping-automation.cjs | ✅ |

---

## Règles Strictes

1. **Factuality**: 100% (Probes empiriques vs Mocks)
2. **Architecture**: Forensic Engine isolé (`/forensic-engine/`)
3. **Zero Debt**: 0 TODO/placeholder dans le core
4. **Source**: `SFAP_PROTOCOL_v3_LEVEL5.md.resolved` est la vérité
5. **Autonomy**: L5 (Sovereign DOE) gère l'orchestration finale

---

## AI Fallback (Faldown Protocol)

| Provider | Model |
| :--- | :--- |
| Grok | grok-4-1-fast-reasoning |
| OpenAI | gpt-5.2 |
| Gemini | gemini-3-flash-preview |
| Claude | claude-sonnet-4-20250514 / claude-opus-4-5-20251101 |

**Trigger**: Latency > 15s OR Status != 200

---

## Commandes

```bash
node scripts/forensic-audit-complete.cjs  # Audit
git push origin main                       # Deploy auto
```

### Health Check Pattern
```bash
node automations/agency/core/SCRIPT.cjs --health
```

### HITL Commands
```bash
node SCRIPT.cjs --list-pending     # List pending approvals
node SCRIPT.cjs --approve=<id>     # Approve
node SCRIPT.cjs --reject=<id>      # Reject
```

### Stitch API
```bash
node automations/agency/core/stitch-api.cjs --health
node automations/agency/core/stitch-api.cjs list
node automations/agency/core/stitch-api.cjs generate <id> "prompt"
```

---

## Références (charger via @)

| Topic | File |
| :--- | :--- |
| Session History | @docs/session-history/ |
| External Workflows | @docs/external_workflows.md |
| Voice AI | @.claude/rules/voice-ai.md |
| Scripts | @.claude/rules/scripts.md |
| Infra | @docs/reference/infrastructure.md |
| Remotion Video | @.claude/skills/remotion-video/SKILL.md |
| Étagère Tech | @docs/ETAGERE-TECHNOLOGIQUE-ECOSYSTEME-3A.md |
| Transfert Shopify | @docs/ANALYSE-TRANSFERT-DESIGN-AUTOMATION-SHOPIFY.md |
| Ecosystem Audit | @docs/AUDIT-SESSION-165-ECOSYSTEM.md |
