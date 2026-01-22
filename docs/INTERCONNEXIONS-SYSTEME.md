# INTERCONNEXIONS SYSTÈME RÉELLES
## 3A Automation - Cartographie des Flux
### Date: 22 Janvier 2026 | Session 138

---

# 1. FLUX PRINCIPAL: ACQUISITION → CONVERSION → RÉTENTION

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              FLUX COMPLET CLIENT E-COMMERCE                               │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: ACQUISITION                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   [SENSORS: Détection Opportunités]                                                     │
│   ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐                   │
│   │ ga4-sensor.cjs  │    │ meta-ads-sensor  │    │google-trends    │                   │
│   │ (traffic data)  │    │ (ad performance) │    │(market signals) │                   │
│   └────────┬────────┘    └────────┬─────────┘    └────────┬────────┘                   │
│            │                      │                       │                             │
│            └──────────────────────┼───────────────────────┘                             │
│                                   ▼                                                     │
│                         ┌─────────────────────┐                                         │
│                         │  pressure-matrix.json│                                        │
│                         │  marketing.pressure  │                                        │
│                         └──────────┬──────────┘                                         │
│                                    │                                                    │
│   [SCRIPTS: Génération Leads]      │                                                    │
│                                    ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐              │
│   │ IF marketing.pressure > 60 THEN autonomy-daemon TRIGGERS:           │              │
│   │   • sourcing-google-maps-agentic.cjs (--location=XX --query=XX)     │              │
│   │   • sourcing-linkedin-agentic.cjs (--industry=XX)                   │              │
│   │   • blog-generator-resilient.cjs (--topic=trending --publish)       │              │
│   └────────────────────────────────┬────────────────────────────────────┘              │
│                                    │                                                    │
│                                    ▼                                                    │
│   [OUTPUT: Leads Bruts → CRM]                                                           │
│   ┌────────────────────────────────────────────────────────────────────┐               │
│   │ leads-manager.cjs → hubspot-b2b-crm.cjs (sync)                     │               │
│   │                   → Klaviyo (tag: NEW_LEAD)                        │               │
│   └────────────────────────────────────────────────────────────────────┘               │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                         │
                                         ▼

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: QUALIFICATION                                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   [INPUT: Lead Brut]                                                                    │
│   { email, source, first_touch }                                                        │
│                                                                                         │
│   ┌────────────────────────────────────────────────────────────────────┐               │
│   │ lead-scoring-agentic.cjs                                           │               │
│   │                                                                    │               │
│   │   Scoring Criteria:                                                │               │
│   │   ┌─────────────────────────────────────────────────────────────┐ │               │
│   │   │ Source Quality:   Google=+20, LinkedIn=+15, Cold=+5         │ │               │
│   │   │ Engagement:       Email open=+10, Click=+15, Reply=+25      │ │               │
│   │   │ Fit:              E-commerce=+20, B2B PME=+15, Other=+5     │ │               │
│   │   │ Intent:           Demo request=+30, Pricing=+20, Blog=+5    │ │               │
│   │   └─────────────────────────────────────────────────────────────┘ │               │
│   │                                                                    │               │
│   │   Output: score 0-100                                              │               │
│   └────────────────────────────┬───────────────────────────────────────┘               │
│                                │                                                        │
│   ┌────────────────────────────┼────────────────────────────────────────┐              │
│   │                            ▼                                        │              │
│   │   ┌─────────────────────────────────────────────────────────────┐  │              │
│   │   │ IF score >= 75 (HOT)                                        │  │              │
│   │   │   → voice-api-resilient.cjs (qualification BANT vocale)     │  │              │
│   │   │   → Extraction: budget, timeline, authority, need           │  │              │
│   │   │   → Update: Klaviyo (tag: HOT_LEAD, properties: BANT)       │  │              │
│   │   │   → Alert: Slack/Email → commercial humain                  │  │              │
│   │   └─────────────────────────────────────────────────────────────┘  │              │
│   │                                                                     │              │
│   │   ┌─────────────────────────────────────────────────────────────┐  │              │
│   │   │ IF score 50-74 (WARM)                                       │  │              │
│   │   │   → email-personalization-resilient.cjs (nurture sequence)  │  │              │
│   │   │   → 5-email drip over 14 days                               │  │              │
│   │   │   → Re-score après engagement                               │  │              │
│   │   └─────────────────────────────────────────────────────────────┘  │              │
│   │                                                                     │              │
│   │   ┌─────────────────────────────────────────────────────────────┐  │              │
│   │   │ IF score < 50 (COLD)                                        │  │              │
│   │   │   → Klaviyo (tag: COLD_LEAD)                                │  │              │
│   │   │   → Newsletter only (1x/week)                               │  │              │
│   │   │   → blog-generator content = top of funnel                  │  │              │
│   │   └─────────────────────────────────────────────────────────────┘  │              │
│   └─────────────────────────────────────────────────────────────────────┘              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                         │
                                         ▼

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: CONVERSION                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   [TRIGGER: Lead qualifié fait action]                                                  │
│   • Visite page pricing                                                                 │
│   • Ajoute au panier (e-commerce)                                                       │
│   • Demande démo                                                                        │
│                                                                                         │
│   ┌────────────────────────────────────────────────────────────────────┐               │
│   │ SCÉNARIO A: Panier abandonné (E-commerce)                          │               │
│   │                                                                    │               │
│   │   Shopify Webhook → price-drop-alerts.cjs (détection abandon)     │               │
│   │                  → email-personalization-resilient.cjs             │               │
│   │                                                                    │               │
│   │   Série 3 emails:                                                  │               │
│   │   ┌──────────────────────────────────────────────────────────────┐│               │
│   │   │ T+1h:  Email 1 - Reminder (image panier + CTA)               ││               │
│   │   │ T+24h: Email 2 - Social proof (avis clients similaires)      ││               │
│   │   │ T+72h: Email 3 - Discount (10% code unique)                  ││               │
│   │   └──────────────────────────────────────────────────────────────┘│               │
│   │                                                                    │               │
│   │   Benchmark: +69% orders vs single email (Klaviyo 2025)           │               │
│   └────────────────────────────────────────────────────────────────────┘               │
│                                                                                         │
│   ┌────────────────────────────────────────────────────────────────────┐               │
│   │ SCÉNARIO B: Demande démo (B2B)                                     │               │
│   │                                                                    │               │
│   │   Form submission → voice-api-resilient.cjs (callback instantané) │               │
│   │                  → Qualification BANT en 5 min                     │               │
│   │                  → google-calendar-booking.cjs (RDV auto)          │               │
│   │                  → hubspot-b2b-crm.cjs (deal créé, stage=DEMO)     │               │
│   │                                                                    │               │
│   │   Benchmark: +70% conversion, -95% temps qualification            │               │
│   └────────────────────────────────────────────────────────────────────┘               │
│                                                                                         │
│   ┌────────────────────────────────────────────────────────────────────┐               │
│   │ SCÉNARIO C: Commande Dropshipping                                  │               │
│   │                                                                    │               │
│   │   Shopify Order → dropshipping-order-flow.cjs (port 3022)         │               │
│   │                                                                    │               │
│   │   ┌──────────────────────────────────────────────────────────────┐│               │
│   │   │ 1. Parse order (products, customer, shipping)                ││               │
│   │   │ 2. Route by SKU prefix:                                      ││               │
│   │   │    CJ-* → cjdropshipping-automation.cjs                      ││               │
│   │   │    BB-* → bigbuy-supplier-sync.cjs                           ││               │
│   │   │ 3. Create supplier order                                     ││               │
│   │   │ 4. Sync tracking → Shopify                                   ││               │
│   │   │ 5. Send confirmation email (via Klaviyo)                     ││               │
│   │   └──────────────────────────────────────────────────────────────┘│               │
│   └────────────────────────────────────────────────────────────────────┘               │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                         │
                                         ▼

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: RÉTENTION                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   [SENSORS: Détection Signaux Churn]                                                    │
│   ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐                   │
│   │ retention-sensor│    │ lead-scoring     │    │ Klaviyo metrics │                   │
│   │ (order freq)    │    │ (engagement drop)│    │ (open rate)     │                   │
│   └────────┬────────┘    └────────┬─────────┘    └────────┬────────┘                   │
│            │                      │                       │                             │
│            └──────────────────────┼───────────────────────┘                             │
│                                   ▼                                                     │
│                     ┌─────────────────────────────┐                                     │
│                     │ churn-prediction-resilient  │                                     │
│                     │                             │                                     │
│                     │ Inputs:                     │                                     │
│                     │ • daysSinceLastPurchase     │                                     │
│                     │ • totalOrders               │                                     │
│                     │ • totalSpent                │                                     │
│                     │ • emailOpenRate             │                                     │
│                     │ • supportTickets            │                                     │
│                     │                             │                                     │
│                     │ Process:                    │                                     │
│                     │ 1. calculateRFM()           │                                     │
│                     │ 2. getRFMSegment()          │                                     │
│                     │ 3. calculateChurnRisk()     │                                     │
│                     │ 4. getAIChurnAnalysis()     │                                     │
│                     └──────────────┬──────────────┘                                     │
│                                    │                                                    │
│   ┌────────────────────────────────┼────────────────────────────────────────┐          │
│   │                                ▼                                        │          │
│   │   ┌─────────────────────────────────────────────────────────────┐      │          │
│   │   │ IF churnRisk >= 0.85 (CRITICAL)                             │      │          │
│   │   │   → grok-voice-realtime.cjs (appel sortant proactif)        │      │          │
│   │   │   → Offre personnalisée (AI-generated via voice-api)        │      │          │
│   │   │   → Update Klaviyo: AT_RISK_CRITICAL                        │      │          │
│   │   │   → Alert équipe rétention                                  │      │          │
│   │   └─────────────────────────────────────────────────────────────┘      │          │
│   │                                                                         │          │
│   │   ┌─────────────────────────────────────────────────────────────┐      │          │
│   │   │ IF churnRisk >= 0.70 (HIGH)                                 │      │          │
│   │   │   → at-risk-customer-flow.cjs                               │      │          │
│   │   │   → Série emails personnalisés (exclusivité, récompense)    │      │          │
│   │   │   → SMS reminder (si opt-in)                                │      │          │
│   │   └─────────────────────────────────────────────────────────────┘      │          │
│   │                                                                         │          │
│   │   ┌─────────────────────────────────────────────────────────────┐      │          │
│   │   │ IF churnRisk >= 0.50 (MEDIUM)                               │      │          │
│   │   │   → replenishment-reminder.cjs (si produit consommable)     │      │          │
│   │   │   → birthday-anniversary-flow.cjs (occasion spéciale)       │      │          │
│   │   │   → referral-program-automation.cjs (transformer en avocat) │      │          │
│   │   └─────────────────────────────────────────────────────────────┘      │          │
│   └─────────────────────────────────────────────────────────────────────────┘          │
│                                                                                         │
│   [OUTPUT: Métriques Rétention]                                                         │
│   → pressure-matrix.json (retention.churn_rate)                                         │
│   → Klaviyo segments updated                                                            │
│   → HubSpot deal stages updated (B2B)                                                   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. FLUX DOE: DIRECTIVE → ORCHESTRATION → EXECUTION

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              DOE DISPATCHER FLOW                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: DIRECTIVE (Input)                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   Sources de Directives:                                                                │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐             │
│   │ A. Humain (CLI)                                                       │             │
│   │    $ node doe-dispatcher.cjs "Find SaaS leads in Morocco on Maps"     │             │
│   └──────────────────────────────────────────────────────────────────────┘             │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐             │
│   │ B. Autonomy Daemon (automatique)                                      │             │
│   │    autonomy-daemon.cjs détecte gap (reality vs goal)                  │             │
│   │    → Génère directive: "Generate 10 leads because velocity < target"  │             │
│   └──────────────────────────────────────────────────────────────────────┘             │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐             │
│   │ C. Webhook externe                                                    │             │
│   │    Zapier/n8n → POST /api/directive                                   │             │
│   │    { "directive": "Create blog about X", "params": {...} }            │             │
│   └──────────────────────────────────────────────────────────────────────┘             │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                         │
                                         ▼

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: ORCHESTRATION (Planning)                                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   doe-dispatcher.cjs                                                                    │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐             │
│   │ Phase 2a: PLANNER (Tool Selection)                                    │             │
│   │                                                                       │             │
│   │   Input: "Find SaaS leads in Morocco on Maps"                         │             │
│   │                                                                       │             │
│   │   Process: findBestTool(directive)                                    │             │
│   │   ┌────────────────────────────────────────────────────────────────┐ │             │
│   │   │ 1. Load automations-registry.json (119 tools)                  │ │             │
│   │   │ 2. Semantic matching via LLM (spawn_agent.js)                  │ │             │
│   │   │    Prompt: "Select best tool ID for directive..."              │ │             │
│   │   │ 3. Fallback: Heuristic keyword matching                        │ │             │
│   │   │    "maps" in directive → match "google-maps-scraper"           │ │             │
│   │   └────────────────────────────────────────────────────────────────┘ │             │
│   │                                                                       │             │
│   │   Output: tool = {                                                    │             │
│   │     id: "google-maps-scraper",                                        │             │
│   │     script: "agency/core/sourcing-google-maps-agentic.cjs"            │             │
│   │   }                                                                   │             │
│   └──────────────────────────────────────────────────────────────────────┘             │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐             │
│   │ Phase 2b: PARAM EXTRACTOR                                             │             │
│   │                                                                       │             │
│   │   Process: extractParams(directive, tool)                             │             │
│   │   ┌────────────────────────────────────────────────────────────────┐ │             │
│   │   │ 1. LLM extraction via spawn_agent.js                           │ │             │
│   │   │    Prompt: "Extract CLI params for sourcing-google-maps..."    │ │             │
│   │   │ 2. Parse JSON array output                                     │ │             │
│   │   │ 3. Fallback: Heuristic extraction                              │ │             │
│   │   │    "Morocco" detected → --location=morocco                     │ │             │
│   │   │    "SaaS" detected → --query="SaaS"                            │ │             │
│   │   └────────────────────────────────────────────────────────────────┘ │             │
│   │                                                                       │             │
│   │   Output: params = ["--location=morocco", "--query=SaaS"]             │             │
│   └──────────────────────────────────────────────────────────────────────┘             │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐             │
│   │ Phase 2c: CRITIC (Validation)                                         │             │
│   │                                                                       │             │
│   │   Process: critique(plan, directive)                                  │             │
│   │   ┌────────────────────────────────────────────────────────────────┐ │             │
│   │   │ Checks:                                                        │ │             │
│   │   │ ✓ Script file exists?                                          │ │             │
│   │   │ ✓ Required params present? (--location, --query for maps)      │ │             │
│   │   │ ✓ Params align with directive? (Morocco in directive = morocco)│ │             │
│   │   └────────────────────────────────────────────────────────────────┘ │             │
│   │                                                                       │             │
│   │   Output: { valid: true } OR { valid: false, issues: [...] }          │             │
│   └──────────────────────────────────────────────────────────────────────┘             │
│                                                                                         │
│   Final Plan:                                                                           │
│   {                                                                                     │
│     toolId: "google-maps-scraper",                                                      │
│     script: "agency/core/sourcing-google-maps-agentic.cjs",                             │
│     params: ["--location=morocco", "--query=SaaS"],                                     │
│     reasoning: "Selected google-maps-scraper because directive contains 'Maps'..."      │
│   }                                                                                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                         │
                                         ▼

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3: EXECUTION                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   doe-dispatcher.cjs → execute(plan)                                                    │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐             │
│   │ 1. Resolve script path                                                │             │
│   │    scriptPath = path.join(__dirname, '../../../', plan.script)        │             │
│   │                                                                       │             │
│   │ 2. Verify script exists                                               │             │
│   │    if (!fs.existsSync(scriptPath)) → ERROR                            │             │
│   │                                                                       │             │
│   │ 3. Execute with dry-run (safety)                                      │             │
│   │    execSync(`node ${scriptPath} --dry-run ${params.join(' ')}`)       │             │
│   │                                                                       │             │
│   │ 4. Capture output                                                     │             │
│   │    result = { success: true, output: stdout }                         │             │
│   │                                                                       │             │
│   │ 5. Save session                                                       │             │
│   │    saveSession(plan, result) → sessions/session_${timestamp}.json     │             │
│   └──────────────────────────────────────────────────────────────────────┘             │
│                                                                                         │
│   Session File Example:                                                                 │
│   {                                                                                     │
│     "timestamp": "2026-01-22T16:30:00.000Z",                                            │
│     "plan": { "toolId": "google-maps-scraper", ... },                                   │
│     "result": { "success": true, "output": "Found 50 leads..." }                        │
│   }                                                                                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. FLUX VOICE AI: TEMPS RÉEL

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              VOICE AI REALTIME FLOW                                       │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   [FRONTEND: Widget Voice sur 3a-automation.com]                                        │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐              │
│   │ 1. User clicks microphone icon                                       │              │
│   │ 2. Browser requests mic permission                                   │              │
│   │ 3. Start recording (Web Speech API or MediaRecorder)                 │              │
│   │ 4. Establish WebSocket to grok-voice-realtime.cjs (port 3007)        │              │
│   └─────────────────────────────────────────────────────────────────────┘              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                         │
                                         ▼ WebSocket

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [BACKEND: grok-voice-realtime.cjs - Port 3007]                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐              │
│   │ Primary Path: Grok Realtime WebSocket                                │              │
│   │                                                                      │              │
│   │   Browser ──WS──► 3007 ──WS──► wss://api.x.ai/v1/realtime            │              │
│   │                                                                      │              │
│   │   Audio Format: PCM16, 24000Hz, mono, base64                         │              │
│   │   Latency: < 500ms (streaming)                                       │              │
│   │   Cost: $0.05/min                                                    │              │
│   │                                                                      │              │
│   │   Events:                                                            │              │
│   │   • session.created → configure voice, turn detection                │              │
│   │   • input_audio_buffer.append → send user audio chunks               │              │
│   │   • response.audio.delta → receive AI audio chunks                   │              │
│   │   • response.audio_transcript.delta → receive text transcript        │              │
│   └─────────────────────────────────────────────────────────────────────┘              │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐              │
│   │ Fallback Path: Gemini TTS (si Grok down)                             │              │
│   │                                                                      │              │
│   │   GeminiTTSFallback class                                            │              │
│   │                                                                      │              │
│   │   Flow:                                                              │              │
│   │   1. Browser sends text (pas audio) → voice-api-resilient.cjs        │              │
│   │   2. voice-api-resilient génère réponse text (multi-AI fallback)     │              │
│   │   3. Text → Gemini TTS → audio PCM                                   │              │
│   │   4. Audio → Browser (Web Audio API playback)                        │              │
│   │                                                                      │              │
│   │   Latency: ~2-3s (REST call + TTS)                                   │              │
│   │   Cost: ~$0.001/1K chars                                             │              │
│   │   Mode: Dégradé (pas de conversation fluide)                         │              │
│   └─────────────────────────────────────────────────────────────────────┘              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                         │
                                         ▼ Si qualification active

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [QUALIFICATION: voice-api-resilient.cjs - Port 3004]                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐              │
│   │ Parallel Processing                                                  │              │
│   │                                                                      │              │
│   │   Transcript from voice session                                      │              │
│   │           │                                                          │              │
│   │           ▼                                                          │              │
│   │   ┌──────────────────────────────────────────────────────────────┐  │              │
│   │   │ BANT Extraction (runs on every user turn)                    │  │              │
│   │   │                                                              │  │              │
│   │   │ extractBudget(text)      → "1000€" → budget: 1000            │  │              │
│   │   │ extractTimeline(text)    → "urgent" → timeline: immediate    │  │              │
│   │   │ extractDecisionMaker()   → "CEO" → authority: yes            │  │              │
│   │   │ extractIndustryFit()     → "shopify" → fit: perfect          │  │              │
│   │   └──────────────────────────────────────────────────────────────┘  │              │
│   │                       │                                              │              │
│   │                       ▼                                              │              │
│   │   ┌──────────────────────────────────────────────────────────────┐  │              │
│   │   │ Score Calculation                                            │  │              │
│   │   │                                                              │  │              │
│   │   │ score = (budget * 0.30) + (timeline * 0.25) +                │  │              │
│   │   │         (authority * 0.20) + (fit * 0.15) + (engagement * 0.10)│              │
│   │   │                                                              │  │              │
│   │   │ Example: 30 + 25 + 20 + 15 + 10 = 100 (perfect lead)         │  │              │
│   │   └──────────────────────────────────────────────────────────────┘  │              │
│   │                       │                                              │              │
│   │                       ▼                                              │              │
│   │   ┌──────────────────────────────────────────────────────────────┐  │              │
│   │   │ Actions Based on Score                                       │  │              │
│   │   │                                                              │  │              │
│   │   │ score >= 75 → HOT                                            │  │              │
│   │   │   • Sync to HubSpot: createContact() + createDeal()          │  │              │
│   │   │   • Sync to Klaviyo: updateProfile(tag: HOT_LEAD)            │  │              │
│   │   │   • Trigger: google-calendar-booking.cjs (propose RDV)       │  │              │
│   │   │   • Alert: Slack webhook → commercial                        │  │              │
│   │   │                                                              │  │              │
│   │   │ score 50-74 → WARM                                           │  │              │
│   │   │   • Sync to Klaviyo: tag WARM_LEAD                           │  │              │
│   │   │   • Trigger: email-personalization-resilient (nurture)       │  │              │
│   │   └──────────────────────────────────────────────────────────────┘  │              │
│   └─────────────────────────────────────────────────────────────────────┘              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. DÉPENDANCES INTER-SCRIPTS

## 4.1 Matrice d'Importation

| Script | Importe | Fonction Utilisée |
|--------|---------|-------------------|
| blog-generator-resilient | marketing-science-core | getPsychologyFramework() |
| blog-generator-resilient | security-utils | RateLimiter, setSecurityHeaders |
| blog-generator-resilient | telemetry | logTelemetry() |
| email-personalization-resilient | marketing-science-core | getPersuasionElements() |
| email-personalization-resilient | security-utils | RateLimiter |
| churn-prediction-resilient | (standalone) | - |
| voice-api-resilient | security-utils | RateLimiter |
| grok-voice-realtime | security-utils | secureRandomString |
| dropshipping-order-flow | cjdropshipping-automation | createOrder(), getProducts() |
| dropshipping-order-flow | bigbuy-supplier-sync | createOrder(), getProducts() |
| doe-dispatcher | automations-registry.json | Tool definitions |
| doe-dispatcher | spawn_agent.js | LLM extraction |
| autonomy-daemon | pressure-matrix.json | Current state |
| autonomy-daemon | strategic_goals.json | Target state |
| autonomy-daemon | doe-dispatcher | execute() |

## 4.2 Graphe de Dépendances

```
                         ┌─────────────────────┐
                         │  autonomy-daemon    │
                         │  (Decision Layer)   │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │ pressure-matrix │   │ strategic_goals │   │  doe-dispatcher │
    │     (State)     │   │    (Goals)      │   │ (Orchestration) │
    └────────┬────────┘   └─────────────────┘   └────────┬────────┘
             │                                           │
    ┌────────┴────────┐                         ┌────────┴────────┐
    │    SENSORS      │                         │ automations-    │
    │  (Data Input)   │                         │ registry.json   │
    └────────┬────────┘                         └────────┬────────┘
             │                                           │
    ┌────────┴────────┐                                  │
    │ ga4, gsc, meta, │                                  │
    │ retention, etc. │                                  │
    └─────────────────┘                                  │
                                                         │
              ┌──────────────────────────────────────────┘
              │
              ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                    EXECUTION SCRIPTS                          │
    ├───────────────────────────────────────────────────────────────┤
    │                                                               │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │                    SHARED UTILITIES                      │ │
    │  │  ┌─────────────────┐  ┌──────────────────┐              │ │
    │  │  │ security-utils  │  │ marketing-science│              │ │
    │  │  │ (rate limit,    │  │ (persuasion      │              │ │
    │  │  │  headers, etc.) │  │  frameworks)     │              │ │
    │  │  └────────┬────────┘  └────────┬─────────┘              │ │
    │  │           │                    │                         │ │
    │  └───────────┼────────────────────┼─────────────────────────┘ │
    │              │                    │                           │
    │              ▼                    ▼                           │
    │  ┌──────────────────────────────────────────────────────────┐│
    │  │              RESILIENT SCRIPTS (7)                        ││
    │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      ││
    │  │  │blog-generator│ │churn-predict │ │voice-api     │      ││
    │  │  └──────────────┘ └──────────────┘ └──────────────┘      ││
    │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      ││
    │  │  │email-person. │ │grok-voice    │ │podcast-gen   │      ││
    │  │  └──────────────┘ └──────────────┘ └──────────────┘      ││
    │  │  ┌──────────────┐                                        ││
    │  │  │product-photos│                                        ││
    │  │  └──────────────┘                                        ││
    │  └──────────────────────────────────────────────────────────┘│
    │                                                               │
    │  ┌──────────────────────────────────────────────────────────┐│
    │  │              INTEGRATION SCRIPTS                          ││
    │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      ││
    │  │  │dropship-flow │→│cjdropshipping│ │bigbuy-sync   │      ││
    │  │  └──────────────┘ └──────────────┘ └──────────────┘      ││
    │  │  ┌──────────────┐ ┌──────────────┐                       ││
    │  │  │hubspot-crm   │ │google-cal    │                       ││
    │  │  └──────────────┘ └──────────────┘                       ││
    │  └──────────────────────────────────────────────────────────┘│
    │                                                               │
    └───────────────────────────────────────────────────────────────┘
```

---

# 5. POINTS DE RUPTURE (SPOF)

| Composant | Impact si down | Fallback | Criticité |
|-----------|----------------|----------|-----------|
| automations-registry.json | DOE ne peut pas sélectionner tool | Crash | CRITIQUE |
| XAI_API_KEY (Grok) | Fallback sur OpenAI | Automatique | FAIBLE |
| OPENAI_API_KEY | Fallback sur Gemini | Automatique | FAIBLE |
| Tous AI keys down | Scripts resilient → static fallback | Dégradé | MOYENNE |
| pressure-matrix.json | Autonomy daemon aveugle | Dernière valeur | HAUTE |
| Klaviyo API | Email flows stoppés | Queue locale | HAUTE |
| Shopify Webhook | Orders non captés | Polling backup | HAUTE |
| grok-voice-realtime WebSocket | Voice AI down | Gemini TTS dégradé | MOYENNE |

---

*Document généré: 22/01/2026 17:00 UTC*
*Session 138 - Interconnexions Système Réelles*
*Total: ~500 lignes de cartographie*
