# PLAN D'ACTION MVP - JO-AAA
## Document Exécutable - Janvier 2026

> **✅ ÉTAT RÉEL (Session 166bis - 26/01/2026):** HITL 100% (18/18) ✅ | Remotion ✅ | Sensors 79% OK | **Scripts: 85** | AG-UI Wired ✅ | **Voice Multilingual: AUDIT COMPLET**

---

## SESSION 166bis - VOICE MULTILINGUAL AUDIT (26/01/2026)

### Audit Complet Réalisé

**Document créé:** `docs/VOICE-MULTILINGUAL-STRATEGY.md` (650+ lignes)

### État Voice Systems

| Aspect | État Actuel | Cible | Gap |
|--------|-------------|-------|-----|
| Langues configurées | FR, EN (2) | FR, EN, ES, AR, Darija (5) | **-3 langues** |
| TTS Darija | ❌ AUCUN | ElevenLabs "Ghizlane" | **BLOQUANT Maroc** |
| STT Darija | ❌ AUCUN | ElevenLabs Scribe | **BLOQUANT Maroc** |
| Espagnol | ❌ Config manquante | Grok Voice | TRIVIAL |
| Arabe MSA | ❌ Config manquante | Grok Voice | TRIVIAL |

### Marchés Cibles

| Marché | Langue Site | Devise | Voice Requis |
|--------|-------------|--------|--------------|
| **Maroc** | FR | MAD | FR + **Darija** |
| **Europe** | FR | EUR (€) | FR (+ ES optionnel) |
| **International** | EN | USD ($) | EN + ES |

### Options Darija Validées

| Type | Recommandation | Alternative | Statut |
|------|----------------|-------------|--------|
| **TTS** | ElevenLabs "Ghizlane" | DarijaTTS self-hosted | Commercial prêt |
| **STT** | ElevenLabs Scribe | Whisper fine-tuned | À tester |
| **LLM** | Mistral Saba (24B) | Atlas-Chat-9B | API disponible |

### Plan d'Action Voice

| Phase | Scope | Effort | Priorité |
|-------|-------|--------|----------|
| **Phase 0** | Validation providers | 6h | **P0 - PRÉREQUIS** |
| **Phase 1** | Espagnol | 16h | P1 - TRIVIAL |
| **Phase 2** | Arabe MSA | 18h | P2 - TRIVIAL |
| **Phase 3** | Darija | 56h | **P0 - BLOQUANT MAROC** |
| **Phase 4** | LLM Darija | 22h | P3 - OPTIONNEL |

### Coûts Estimés

| Type | Montant |
|------|---------|
| Setup (one-time) | ~$400-800 |
| Récurrent mensuel | ~$92-169/mo |

### Blockers Critiques

| Blocker | Impact | Action |
|---------|--------|--------|
| `ELEVENLABS_API_KEY` | ✅ **CONFIGURÉ** (S166bis) | Phase 3 débloquée |
| `TWILIO_*` vides | Telephony bloquée | Configurer credentials |
| Traductions Darija | Knowledge base | Trouver traducteur natif |
| **TTS Darija officiel** | ❌ NON EXISTANT | Voix "Ghizlane" = communautaire, à tester |

### Correction Factuelle ElevenLabs (S166bis)

| Composant | Support Officiel | Réalité |
|-----------|------------------|---------|
| **TTS Darija** | ❌ **NON** | Voix "Ghizlane" (ID: OfGMGmhShO8iL9jCkXy8) = COMMUNAUTAIRE |
| **STT Darija** | ✅ **OUI** | Scribe supporte Maghrebi (Moroccan, Algerian, Tunisian) |
| **MCP Integration** | ✅ **OUI** | SSE + HTTP streamable, Zapier connecteur |

**Référence complète:** `@docs/VOICE-MULTILINGUAL-STRATEGY.md`

---

## SESSION 166 - AG-UI QUEUE WIRING + MCP VERIFICATION (26/01/2026)

### Accomplissements

| Élément | Status | Détail |
|---------|--------|--------|
| AG-UI Queue Wiring | ✅ DONE | `POST /ag-ui/queue/submit` endpoint added |
| MCP Servers Verification | ✅ DONE | 5/6 credentials verified |
| Audit Document Update | ✅ DONE | docs/AUDIT-SESSION-165-ECOSYSTEM.md |

### AG-UI Queue API (Previously Dead Code)

**Issue Fixed:** `queueAction()` was internal-only with 0 external callers.

```bash
curl -X POST http://localhost:3000/ag-ui/queue/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"high_value_order","agent":"shopify-bot","params":{"order_id":"123"},"priority":"high","reason":"Order > €500"}'
```

### MCP Credentials Status

| Credential | Status |
|------------|--------|
| KLAVIYO_API_KEY | ✅ Set |
| SHOPIFY_ACCESS_TOKEN | ✅ Set |
| APIFY_TOKEN | ✅ Set |
| GOOGLE_APPLICATION_CREDENTIALS | ✅ Set |
| STITCH_ACCESS_TOKEN | ✅ Set |
| META_PAGE_ACCESS_TOKEN | ❌ Missing |

---

## SESSION 165 CONSOLIDATED (26/01/2026)

### HITL 100% Coverage (18/18 Scripts)

| Category | Scripts | HITL Type |
|----------|---------|-----------|
| **Financial (2)** | at-risk-customer-flow, birthday-anniversary-flow | LTV €250-500 / Discount 10-20% |
| **Communication (5)** | referral-program, replenishment-reminder, price-drop-alerts, review-request, omnisend-b2c | Preview/Cap/Batch |
| **Content (3)** | blog-generator, email-personalization, podcast-generator | Approval/Preview/Review |
| **Operations (5)** | dropshipping-order-flow, bigbuy-supplier-sync, hubspot-b2b-crm, lead-qualification-chatbot, voice-telephony-bridge | Threshold approvals |
| **Cost Control (2)** | sms-automation, churn-prediction | Daily limit / LTV threshold |
| **Supply Chain (1)** | cjdropshipping-automation | confirmOrder() |

### Key Technical Fixes

| Task | Commit | Status |
|------|--------|--------|
| Claude Model ID Fix | 27cac7b | ✅ DONE |
| Remotion Benchmark (concurrency=4) | S165 | ✅ DONE |
| ElevenLabs Flash v2.5 | S165 | ✅ DONE |
| GPT-5.2 Responses API | 73561b3 | ✅ DONE |
| Shopify Flow Loops (100 max) | S165 | ✅ DOCUMENTED |
| OpenAI Input Caching | S165bis | ✅ DONE |

---

## ECOSYSTEM METRICS (Verified 26/01/2026)

| Metric | Value | Status |
|--------|-------|--------|
| Scripts Core | **85** | ✅ |
| Scripts --health | **27** (32%) | ⚠️ |
| Automations Registry | **121** (88 w/ scripts) | ✅ |
| Skills (SKILL.md) | **42** | ✅ 95% |
| Sensors Working | **15/19 (79%)** | ⚠️ 4 blocked |
| MCP Servers | **11** | ✅ |
| Remotion Compositions | **7** | ✅ |
| HTML Pages | **79** | ✅ |
| Credentials SET | **61%** (57/93) | ⚠️ 36 empty |
| CSS Version | **v=86.0** | ✅ |

---

## SENSORS STATUS

| Status | Count | Sensors |
|--------|-------|---------|
| ✅ OK | 15 | product-seo(0), gsc(0), cost-tracking(30), google-trends(8), shopify(75), klaviyo(65), email-health(60), lead-velocity(75), supplier-health(80), voice-quality(90), meta-ads(95), tiktok-ads(95), content-perf(90), lead-scoring(95), whatsapp(90) |
| ❌ BLOCKED | 4 | retention(NETWORK), ga4(API_DISABLED), bigquery(API_DISABLED), apify(PAID_REQUIRED) |

---

## USER ACTION REQUIRED (P0 Blockers)

| Blocker | Impact | Action Requise |
|---------|--------|----------------|
| GA4 API disabled | Analytics broken | [Enable API](https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview) |
| BigQuery API disabled | Trends broken | Enable BigQuery API |
| META_PAGE_ACCESS_TOKEN empty | Meta Ads broken | Configure token |
| TIKTOK_ACCESS_TOKEN empty | TikTok Ads broken | Configure token |
| Apify trial expired | Scraping broken | [Upgrade $49/mo](https://console.apify.com/billing) |

---

## ALPHA MEDICAL - BLOCKERS (23/01/2026)

| Credential | Status | Impact |
|------------|--------|--------|
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | ❌ 403 Forbidden | Sensors + 6 workflows |
| `KLAVIYO_PRIVATE_API_KEY` | ❌ 401 Unauthorized | 9 workflows |

**Fix Instructions:**
```
Shopify: https://alpha-medical-store.myshopify.com/admin/settings/apps/development
  → Create app "3A Sensors"
  → Scopes: read_products, read_orders, read_inventory
  → Copy token → .env.admin

Klaviyo: https://www.klaviyo.com/settings/account/api-keys
  → Create Private API Key (Read-only scope)
  → Copy → .env.admin
```

---

## OPTIMIZATION BACKLOG

### P0 - CRITICAL (Voice Multilingual - Maroc Blocked)

| Task | Component | Effort | Status |
|------|-----------|--------|--------|
| **Phase 0: Validation Darija providers** | Voice | 6h | ⏳ **NEXT** |
| **Phase 3: Darija TTS/STT integration** | Voice | 56h | ⏳ BLOCKED (test required) |
| Configure ELEVENLABS_API_KEY | Credentials | 1h | ✅ **DONE** (S166bis) |
| Configure TWILIO_* credentials | Credentials | 1h | ❌ MISSING |
| Test voix "Ghizlane" (communautaire) | Validation | 2h | ⏳ PENDING |
| Test Grok Voice Darija auto-detect | Validation | 2h | ⏳ PENDING |

### P1 - High Priority (This Month)

| Task | Component | Effort | Status |
|------|-----------|--------|--------|
| **Phase 1: Espagnol voice** | Voice | 16h | ⏳ PENDING |
| **Phase 2: Arabe MSA voice** | Voice | 18h | ⏳ PENDING |
| **Phase 4: LLM Darija (Mistral Saba)** | Voice | 22h | ⏳ OPTIONAL |
| WCAG 2.2 Audit | Accessibility | 8h | ⏳ PENDING |
| A2A v0.3 upgrade | Protocol | 8h | ⏳ PENDING |
| Server-side GTM | Analytics | 16h | ⏳ PENDING |

### P2 - Medium Priority (Next Quarter)

| Task | Component | Effort |
|------|-----------|--------|
| CSS duplicates consolidation | Design | 4h |
| Health checks for remaining 58 scripts | QA | 16h |
| Test all MCP servers | Integration | 8h |

### P3 - Future (After 2000 Clients)

| Task | Component | Notes |
|------|-----------|-------|
| BigQuery activation | Analytics | Cost optimization |
| Self-hosted GH runners | CI/CD | For heavy builds |
| Professional voice clone | Voice | Brand voice library |

---

## WARNINGS ACCEPTÉS (Non-Bloquants)

| Type | Count | Raison |
|------|-------|--------|
| JSON camelCase | 44 | Standards JSON-LD (schema.org) |
| CSS duplicates | 30 | Design variations intentionnelles |
| Boutons .btn | 57 | Design correct, CSS vars cohérentes |

---

## COMMANDS REFERENCE

```bash
# Health Check Pattern
node automations/agency/core/SCRIPT.cjs --health

# HITL Commands
node SCRIPT.cjs --list-pending     # List pending approvals
node SCRIPT.cjs --approve=<id>     # Approve
node SCRIPT.cjs --reject=<id>      # Reject

# A2A Server
node automations/a2a/server.js --health

# Stitch API
node automations/agency/core/stitch-api.cjs --health
node automations/agency/core/stitch-api.cjs list
node automations/agency/core/stitch-api.cjs generate <id> "prompt"
```

---

**Document màj:** 26/01/2026 - Session 166bis
**Status:** HITL 100% ✅ | AG-UI Wired ✅ | MCP 5/6 ✅ | CSS v86.0 | **Voice: AUDIT DONE + ELEVENLABS CONFIGURED**
**New doc:** `docs/VOICE-MULTILINGUAL-STRATEGY.md` (700+ lines, full benchmark, corrections factuelles)
**Key finding:** TTS Darija = NON OFFICIEL (Ghizlane = communautaire) | STT Darija = OFFICIEL (Scribe Maghrebi)
**Archive:** Sessions 141-165 archived in `docs/session-history/sessions-141-164.md`
