# 3A Automation
> Version: 107.0 | 26/01/2026 | Session 166sexies - Telephony Bridge Multilingue

## Identité

- **Type**: AI Automation Agency (E-commerce B2C **OU** PME B2B)
- **Sites**: 3a-automation.com (✅ 200) | dashboard.3a-automation.com (✅ 200)

---

## SESSION 166sexies - TELEPHONY BRIDGE MULTILINGUE (26/01/2026)

### Audit Forensique Corrigé

**Source:** `docs/VOICE-DARIJA-FORENSIC.md` (audit externe vérifié)

| Faille | Status | Fix Appliqué |
| :--- | :--- | :--- |
| TwiML hardcodé fr-FR (5 instances) | ✅ CORRIGÉ | `TWIML_MESSAGES` multilingue |
| Persona Injector fallback fr | ✅ CORRIGÉ | `VOICE_CONFIG.defaultLanguage` via ENV |
| RAG keywords FR seulement | ✅ CORRIGÉ | +ES/AR/ARY keywords ajoutés |
| WhatsApp template FR | ✅ CORRIGÉ | `WHATSAPP_LANG_CODES` mapping |
| RAG fallback messages FR | ✅ CORRIGÉ | `RAG_MESSAGES` multilingue |

### Fichiers Modifiés

| Fichier | Lignes | Description |
| :--- | :--- | :--- |
| `voice-telephony-bridge.cjs` | +150 | Constantes TWIML_MESSAGES, RAG_MESSAGES, WHATSAPP_LANG_CODES |
| `voice-persona-injector.cjs` | +6 | VOICE_CONFIG avec ENV support |

### ENV Variable

```bash
VOICE_DEFAULT_LANGUAGE=fr    # fr | en | es | ar | ary
```

---

## SESSION 166ter - DARIJA VALIDATION COMPLETE (26/01/2026)

### Validation Empirique Phase 0

| Test | Provider | Résultat | Latence |
| :--- | :--- | :--- | :--- |
| TTS Darija | ElevenLabs Ghizlane | ✅ SUCCESS | 1.3s |
| LLM Darija | Grok-4-1-fast-reasoning | ✅ SUCCESS | 10.3s |
| STT Darija | ElevenLabs Scribe v1 | ✅ SUCCESS | 707ms |

### Découverte: SAWT IA (sawtia.ma)

Source: [7news.ma](https://en.7news.ma/sensei-prod-unveils-sawt-ia-the-first-voice-ai-in-moroccan-arabic/)

| Aspect | Détail |
| :--- | :--- |
| Créateur | Sensei Prod (Maroc) |
| Technologie | ML développé IN-HOUSE |
| Langues | Darija, Français, autres |
| Produit | B2B voice agents |

**Verdict:** Stack Darija VALIDÉ. Prêt pour implémentation Phase 1-3.

---

## SESSION 166bis - VOICE MULTILINGUAL AUDIT (26/01/2026)

### Audit Complet Réalisé

**Document créé:** `docs/VOICE-MULTILINGUAL-STRATEGY.md` (700+ lignes)

### État Voice Systems (FAITS VÉRIFIÉS)

| Aspect | État Actuel | Cible | Gap |
| :--- | :--- | :--- | :--- |
| Langues configurées | FR, EN (2) | FR, EN, ES, AR, Darija (5) | **-3 langues** |
| TTS Darija | ❌ **NON OFFICIEL** | Ghizlane = communautaire | À TESTER |
| STT Darija | ✅ **SUPPORTÉ** | ElevenLabs Scribe (Maghrebi) | OK |
| Espagnol | ❌ Config manquante | Grok Voice | TRIVIAL |

### Corrections Factuelles ElevenLabs

| Composant | Claim Précédent | Réalité Vérifiée |
| :--- | :--- | :--- |
| TTS Darija | "Supporté via Ghizlane" | ❌ Ghizlane = voix COMMUNAUTAIRE (pas officielle) |
| STT Darija | Non vérifié | ✅ OFFICIEL: Scribe supporte Maghrebi |
| MCP Integration | Non documenté | ✅ SSE + HTTP streamable |

### Credentials Configurés (S166bis)

| Credential | Status |
| :--- | :--- |
| ELEVENLABS_API_KEY | ✅ **CONFIGURÉ** |
| Voice ID Ghizlane | `OfGMGmhShO8iL9jCkXy8` (communautaire) |

### Documentation

| Document | Lignes | Contenu |
| :--- | :--- | :--- |
| `docs/VOICE-MULTILINGUAL-STRATEGY.md` | 700+ | Benchmark complet, 25+ sources |
| `docs/action-plan.md` | Updated | P0 Voice Multilingual added |

---

## SESSION 166 - DEAD CODE FIX + MCP VERIFICATION (26/01/2026)

### AG-UI Queue Wired (Previously DEAD CODE)

**Issue:** `queueAction()` in a2a/server.js was internal-only with 0 external callers.

**Fix Applied:**
- Added `POST /ag-ui/queue/submit` endpoint for external scripts
- Updated `queueAction()` to include `reason` field
- Updated `/ag-ui` dashboard to document new endpoint

**New API:**
```bash
curl -X POST http://localhost:3000/ag-ui/queue/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"high_value_order","agent":"shopify-bot","params":{"order_id":"123"},"priority":"high","reason":"Order > €500"}'
```

### MCP Servers Verification

| Credential | Status |
| :--- | :--- |
| KLAVIYO_API_KEY | ✅ Set |
| SHOPIFY_ACCESS_TOKEN | ✅ Set |
| APIFY_TOKEN | ✅ Set |
| GOOGLE_APPLICATION_CREDENTIALS | ✅ Set |
| META_PAGE_ACCESS_TOKEN | ❌ Missing |

**Config:** 11 MCP servers configured, 5/6 credentials verified.

### Documentation Optimized

| Task | Status |
| :--- | :--- |
| AG-UI Queue wiring | ✅ S166 COMPLETED |
| MCP Servers confirmation | ✅ S166 CONFIG VERIFIED (5/6) |
| action-plan.md optimization | ✅ 3418→189 lines (95% reduction) |
| HITL workflows verified | ✅ 18/18 operational |

---

## SESSION 165sexies - COMPLETE SYSTEM FLEXIBILITY (26/01/2026)

### Deep Flexibility Implementation

**Objective:** User demanded "100% flexibility - ALL system capabilities must be configurable"

4 core scripts updated with **comprehensive configurability**:

| Script | New Configurable Parameters | ENV Variables |
| :--- | :--- | :--- |
| **churn-prediction-resilient** | RFM thresholds (R/F/M), Churn risk levels, Engagement thresholds | 15+ ENV vars |
| **referral-program-automation** | All 4 reward tiers (min/discount), Referee discount, Expiry, Agentic quality | 12+ ENV vars |
| **email-personalization-resilient** | Abandoned cart delays (1h/24h/72h), Email3 discount | 4 ENV vars |
| **blog-generator-resilient** | Agentic quality threshold, Max reflection retries, Verbose mode | 3 ENV vars |

### Key Additions (Session 165sexies)

**Churn Prediction - Full RFM Flexibility:**
- RFM Recency: `RFM_RECENCY_EXCELLENT=30` (options: 14, 21, 30, 45, 60)
- RFM Frequency: `RFM_FREQUENCY_EXCELLENT=10` (options: 5, 8, 10, 15, 20)
- RFM Monetary: `RFM_MONETARY_EXCELLENT=1000` (options: 500-3000)
- Churn Risk: `CHURN_RISK_LOW=0.3` through `CHURN_RISK_CRITICAL=0.85`
- Engagement: `ENGAGEMENT_LOW_OPEN_RATE=0.10`, `ENGAGEMENT_DECLINE_THRESHOLD=0.50`

**Referral Program - Full Tier Flexibility:**
- Tier 1-4: Min referrals + discounts all configurable
- Bonus: `REFERRAL_TIER4_BONUS=50` (€25, 50, 75, 100)
- Referee: `REFERRAL_REFEREE_DISCOUNT=15` (10-25%)
- Expiry: Code and reward expiry configurable

**Email Cart Series - Timing Flexibility:**
- `CART_EMAIL1_HOURS=1` (0.5, 1, 2, 4)
- `CART_EMAIL2_HOURS=24` (12, 24, 36, 48)
- `CART_EMAIL3_HOURS=72` (48, 72, 96, 120, 168)
- `CART_EMAIL3_DISCOUNT=10` (5, 10, 15, 20%)

**Blog Generator - Agentic Flexibility:**
- `BLOG_AGENTIC_QUALITY_THRESHOLD=8` (6, 7, 8, 9)
- `BLOG_AGENTIC_MAX_RETRIES=2` (1, 2, 3, 4)

### Documentation Updated
- `.claude/rules/scripts.md` - Complete ENV reference (60+ variables)
- All `--health` outputs show configurable options

---

## SESSION 165quinquies - HITL FLEXIBILITY (26/01/2026)

### HITL Flexible Thresholds Implementation

All 11 HITL workflows now have **user-configurable thresholds** via ENV variables:

| Workflow | Default | Options | ENV Variable |
| :--- | :--- | :--- | :--- |
| at-risk-customer-flow | €300 / 15% | €250-500 / 10-20% | `AT_RISK_LTV_THRESHOLD` |
| birthday-anniversary-flow | €300 / 15% | €250-500 / 10-20% | `BIRTHDAY_LTV_THRESHOLD` |
| dropshipping-order-flow | €300 | €200-500 | `HITL_ORDER_VALUE_THRESHOLD` |
| hubspot-b2b-crm | €1500 | €1000-5000 | `HITL_DEAL_VALUE_THRESHOLD` |
| bigbuy-supplier-sync | 75 items | 50-200 | `HITL_BATCH_THRESHOLD` |
| review-request-automation | €300 | €250-500 | `REVIEW_VIP_THRESHOLD` |
| price-drop-alerts | 10 batch | 5-25 | `PRICE_DROP_BATCH_THRESHOLD` |
| replenishment-reminder | 1/week | 1-3 | `REPLENISHMENT_MAX_PER_WEEK` |
| lead-qualification-chatbot | Score 70 | 60-90 | `HITL_HOT_LEAD_THRESHOLD` |
| voice-telephony-bridge | Score 70 | 60-90 | `HITL_BOOKING_SCORE_THRESHOLD` |
| omnisend-b2c-ecommerce | 10 batch | 5-100 | `HITL_BATCH_THRESHOLD` |

### Commits Session 165quinquies
```
0517b77 feat(hitl): implement flexible configurable thresholds for all 11 workflows
```

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

### HITL Coverage: 100% (18/18 Scripts) ✅ FLEXIBLE

| Category | Scripts | HITL Type (Flexible) |
| :--- | :--- | :--- |
| **Financial (2)** | at-risk-customer-flow, birthday-anniversary-flow | LTV €250-500 / Discount 10-20% |
| **Communication (5)** | referral-program, replenishment-reminder, price-drop-alerts, review-request, omnisend-b2c | Preview/Cap 1-3/Batch 5-25 |
| **Content (3)** | blog-generator, email-personalization, podcast-generator | Approval/Preview/Review |
| **Operations (5)** | dropshipping-order-flow, bigbuy-supplier-sync, hubspot-b2b-crm, lead-qualification-chatbot, voice-telephony-bridge | Threshold 60-90 / €200-5000 |
| **Cost Control (2)** | sms-automation, churn-prediction | Daily €25-100 / LTV threshold |
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

## Références

**Index complet:** `@docs/DOCS-INDEX.md`

### Chargés automatiquement (petits fichiers)
- `docs/external_workflows.md` (0.6K)
- `docs/reference/infrastructure.md` (1.3K)

### À charger manuellement (gros fichiers - NE PAS auto-load)
```bash
# Utiliser @ quand nécessaire:
@docs/ETAGERE-TECHNOLOGIQUE-ECOSYSTEME-3A.md   # 34K - Tech stack complet
@docs/AUDIT-SESSION-165-ECOSYSTEM.md            # 15K - Audit écosystème
@docs/ANALYSE-TRANSFERT-DESIGN-AUTOMATION-SHOPIFY.md  # 13K - Transfert Shopify
@.claude/skills/remotion-video/SKILL.md         # 4K - Remotion skills
@.claude/rules/scripts.md                       # 10K - Scripts reference
```
