# ÉTAGÈRE TECHNOLOGIQUE - ÉCOSYSTÈME 3A
## Mutualisation des Technologies Selon le Modèle du "Potentiel de Situation"

> **Version**: 3.2 | **Date**: 26/01/2026 | **Session**: 162 (Stitch API Operational)
> **Document dédié**: `docs/WHISK-REMOTION-METHODOLOGY.md` (méthodologie exhaustive)
> **Méthode**: Inspirée du modèle industriel chinois (François Jullien / Sun Tzu)
> **Principe**: Coopération technique → Potentiel → Concurrence commerciale

### UPDATE SESSION 162 - STITCH API OPÉRATIONNEL (26/01/2026)

**Nouvelle technologie ajoutée à l'étagère:** Stitch MCP Wrapper
- **Location**: `automations/agency/core/stitch-api.cjs`
- **Usage**: Génération UI programmatique via MCP JSON-RPC
- **Avantage**: Bypass DCR authentication, token auto-refresh via gcloud ADC
- **Endpoint**: `stitch.googleapis.com/mcp`
- **Commit**: `d4985ad`

**Résultats vérifiés:**
- ✅ Wrapper fonctionnel (279 lignes)
- ✅ 2 screens générés (pricing page glassmorphism)
- ✅ Projet actif: `705686758968107418`

---

### UPDATE SESSION 146 - REMOTION VIDEO PRODUCTION

**Nouvelle technologie ajoutée à l'étagère:** Remotion (React Video Framework)
- **Location**: `automations/remotion-studio/`
- **Usage**: Génération vidéo programmatique pour 3A + subsidiaires (MyDealz, Alpha Medical)
- **Avantage**: Rendu local gratuit, vibe coding avec Claude

**Google Whisk - VERDICT FACTUEL:**
- ❌ **NO API** disponible (web-only à labs.google/whisk)
- ✅ Assets existants utilisables: `/assets/whisk/*.png`
- ✅ Alternative programmatique: fal.ai FLUX, Replicate, Imagen 4 API

---

## PHILOSOPHIE

### Le "Potentiel de Situation" (勢 shì)

Selon [François Jullien](https://en.wikipedia.org/wiki/Fran%C3%A7ois_Jullien), la stratégie chinoise diffère fondamentalement de l'approche occidentale:

| Approche Occidentale | Approche Chinoise |
|---------------------|-------------------|
| Plan projeté d'avance | Exploitation du potentiel de situation |
| Moyens → Fin | Conditionnement → Effet naturel |
| Action directe | Transformation progressive |
| Efficacité (résultat visé) | Efficience (laisser advenir) |

**Application à l'écosystème 3A:**
1. **Phase 1 - Coopération**: Mutualiser les technologies entre plateformes
2. **Phase 2 - Potentiel**: Créer un avantage structurel partagé
3. **Phase 3 - Action**: Chaque plateforme compete sur son marché

### Analogie Industrielle Chinoise

Source: [L'ADN - L'automobile à l'heure chinoise](https://www.ladn.eu/entreprises-innovantes/linnovation-a-toute-vitesse-comment-la-chine-bouscule-lavenir-de-lautomobile-mondiale/)

- 18 constructeurs chinois ont développé des VE complets en 4 ans
- Xiaomi (téléphones) a lancé une voiture rivalisant avec Porsche
- 100,000 commandes en 1 heure sans bureau d'études propre
- **Secret**: Technologies "sur étagère" partagées entre constructeurs

---

## INVENTAIRE TECHNOLOGIES PAR PLATEFORME

### 1. 3A-AUTOMATION (Central Orchestrator)

| Technologie | Status | Fichier Principal | Prêt à Partager |
|-------------|--------|-------------------|-----------------|
| **A2A Protocol** | ✅ Production | `automations/a2a/server.js` | ✅ OUI |
| **UCP Protocol** | ✅ Production | `pages/api/ucp/products.js` | ✅ OUI |
| **ACP Protocol** | ✅ Fonctionnel | `automations/acp/server.js` | ✅ OUI |
| **GPM Central** | ✅ Production | `data/pressure-matrix.json` | ✅ OUI |
| **22 L5 Agents** | ✅ Production | `agency/core/*.cjs` | ✅ OUI |
| **20 Sensors** | ✅ 6 OK, 10 Partial | `agency/core/*-sensor.cjs` | ✅ OUI |
| **Multi-AI Fallback** | ✅ Production | `*-resilient.cjs` | ✅ OUI |
| **Design System** | ✅ Production | `DESIGN-SYSTEM.md` | ✅ OUI |
| **Stylelint Config** | ✅ 0 issues | `.stylelintrc.cjs` | ✅ OUI |
| **Visual Regression** | ✅ 9 baselines | `visual-regression/*.png` | ✅ OUI |
| **Design Validator** | ✅ **26 checks (v5.2.0)** | `validate-design-system.cjs` | ✅ OUI |
| **HTML→CSS Validator** | ✅ S145 | Détecte classes sans CSS | ✅ OUI |
| **SVG Size Validator** | ✅ S145 | Détecte SVG sans contraintes | ✅ OUI |
| **CSS Link Validator** | ✅ **NEW S154bis** | Détecte balises CSS cassées | ✅ OUI |
| **Button Class Validator** | ✅ **NEW S154bis** | Détecte btn-* sans CSS | ✅ OUI |
| **VPS Docker** | ✅ Production | `docker-compose.yml` | ⚠️ Spécifique |
| **121 Automations** | ✅ Production | `automations-registry.json` | ✅ OUI |
| **Voice Agent B2B** | ✅ Production | `agency/core/voice-agent-b2b.cjs` | ✅ OUI |
| **Service KB (TF-IDF)** | ✅ 129 chunks | `knowledge_base/chunks.json` | ✅ OUI |
| **Remotion Video** | ✅ Production | `remotion-studio/` | ✅ OUI |
| **AI Asset Gen** | ✅ Multi-provider | `remotion-studio/src/lib/ai-assets.ts` | ✅ OUI |
| **Stitch MCP Wrapper** | ✅ **NEW S162** | `agency/core/stitch-api.cjs` | ✅ OUI |

**Technologies UNIQUES 3A:**
- Orchestration multi-subsidiaires (Twin Sovereignty)
- AG-UI (Governance interface)
- Forensic Engine (audit technique avancé)

---

### 2. ALPHA MEDICAL (Shopify B2C Medical)

| Technologie | Status | Fichier Principal | Prêt à Partager |
|-------------|--------|-------------------|-----------------|
| **Flywheel 100%** | ✅ Production | Klaviyo+Shopify Email+Loox | ✅ OUI |
| **Theme Check CI** | ✅ Production | `.github/workflows/theme-check.yml` | ✅ OUI |
| **Cookie Consent** | ✅ 596 lignes | `snippets/cookie-consent-banner.liquid` | ✅ OUI |
| **xAI Voice Agent** | ✅ Ready | `scripts/ai-production/xai_voice_agent.py` | ✅ OUI |
| **Voice Knowledge Base** | ✅ Ready | `scripts/ai-production/voice_knowledge_base.py` | ✅ OUI |
| **4 Sensors Shopify** | ✅ Production | `sensors/*.cjs` | ✅ OUI |
| **GPM Sync** | ✅ Production | `sensors/sync-to-3a.cjs` | ✅ OUI |
| **Pre-commit Hooks** | ✅ Active | `.husky/pre-commit` | ✅ OUI |
| **Progressive Memory** | ✅ 3 levels | `.claude/memory/*.md` | ✅ OUI |
| **Loox Integration** | ✅ Configured | Reviews, Referrals, Upsells | ⚠️ Config-specific |

**Technologies UNIQUES Alpha Medical:**
- xAI LiveKit Voice (plus moderne que Grok Realtime)
- Flywheel Zero-duplication pattern
- Cookie Consent GDPR/CCPA native (no SaaS dependency)
- Theme Check CI/CD pour Shopify Liquid

---

### 3. MYDEALZ (Shopify B2C Fashion)

| Technologie | Status | Fichier Principal | Prêt à Partager |
|-------------|--------|-------------------|-----------------|
| **Knowledge Base RAG** | ✅ Production | `knowledge_base/*.json` | ✅ OUI |
| **TF-IDF Search** | ✅ 508 chunks | `tfidf_index.json`, `vectors.npy` | ✅ OUI |
| **Voice Agent Core** | ✅ Ready | `scripts/voice_agent_core.py` | ✅ OUI |
| **Apify Automation** | ✅ Ready | `apify-automation/*.js` | ✅ OUI |
| **Lead Management** | ✅ Production | `lead-management/*.js` | ✅ OUI |
| **Facebook Scraper** | ✅ Ready | `apify-automation/facebook-scraper.js` | ✅ OUI |
| **Lead Qualification** | ✅ Ready | `apify-automation/qualify-leads.js` | ✅ OUI |
| **10 GitHub Actions** | ✅ Ready | `.github/workflows/*.yml` | ✅ OUI |
| **Omnisend Flows** | ⚠️ 2/6 active | Email automation | ⚠️ Migration |
| **Product Sync** | ✅ Daily | `scripts/product_sync_pipeline.py` | ✅ OUI |

**Technologies UNIQUES MyDealz:**
- RAG Knowledge Base avec TF-IDF (254 produits, 508 chunks)
- Apify scraping pipeline complet
- Facebook Lead Ads integration
- Lead qualification avec segmentation

---

## MATRICE DE TRANSFERT BIDIRECTIONNEL

### Légende
- ✅ TRANSFERT RECOMMANDÉ (ROI élevé)
- ⚠️ TRANSFERT OPTIONNEL (utile mais pas critique)
- ❌ NON PERTINENT (spécifique à la plateforme)

### De 3A vers Alpha Medical

| Technologie | Priorité | Effort | ROI |
|-------------|----------|--------|-----|
| Multi-AI Fallback pattern | ✅ HIGH | 4h | Résilience |
| Design System document | ⚠️ MEDIUM | 2h | Cohérence |
| GA4 Sensor template | ✅ DONE | 2h | Observabilité → Alpha Medical |
| More sensors (content-perf) | ⚠️ LOW | 4h | Monitoring |
| A2A Client native | ⚠️ LOW | 4h | Future interop |
| ACP (async jobs) | ❌ N/A | - | Overkill |
| VPS Docker | ❌ N/A | - | Shopify-hosted |

### De 3A vers MyDealz

| Technologie | Priorité | Effort | ROI |
|-------------|----------|--------|-----|
| Multi-AI Fallback pattern | ✅ HIGH | 4h | Résilience |
| Sensors pattern | ✅ HIGH | 4h | Observabilité |
| GPM Sync | ✅ HIGH | 2h | Central monitoring |
| Design System template | ⚠️ MEDIUM | 2h | Cohérence |
| A2A Protocol | ⚠️ LOW | 4h | Future interop |

### D'Alpha Medical vers 3A

| Technologie | Priorité | Effort | ROI |
|-------------|----------|--------|-----|
| **Theme Check CI** | ✅ HIGH | 2h | Liquid validation |
| **Flywheel pattern** | ✅ HIGH | 4h | Zero-duplication |
| **Cookie Consent native** | ⚠️ MEDIUM | 2h | GDPR savings |
| **xAI Voice pattern** | ⚠️ MEDIUM | 4h | Modern voice |
| Pre-commit hooks | ⚠️ LOW | 1h | DX improvement |

### D'Alpha Medical vers MyDealz

| Technologie | Priorité | Effort | ROI |
|-------------|----------|--------|-----|
| **Sensors Shopify** | ✅ HIGH | 2h | Store monitoring |
| **GPM Sync** | ✅ HIGH | 1h | Central visibility |
| **Flywheel pattern** | ✅ HIGH | 4h | Email optimization |
| **Theme Check CI** | ⚠️ MEDIUM | 2h | Liquid validation |
| Cookie Consent | ⚠️ LOW | 2h | GDPR (if needed) |

### De MyDealz vers 3A

| Technologie | Priorité | Effort | ROI |
|-------------|----------|--------|-----|
| **RAG Knowledge Base** | ✅ HIGH | 4h | AI product search |
| **Apify pipeline** | ⚠️ MEDIUM | 4h | Scraping |
| Lead Management | ❌ N/A | - | B2B specific |
| Facebook Scraper | ⚠️ LOW | 2h | Social data |

### De MyDealz vers Alpha Medical

| Technologie | Priorité | Effort | ROI |
|-------------|----------|--------|-----|
| **RAG Knowledge Base** | ✅ HIGH | 4h | Voice AI enhancement |
| Product Sync pipeline | ⚠️ MEDIUM | 2h | Auto-update |
| TF-IDF Search | ⚠️ MEDIUM | 2h | Better search |
| Apify automation | ❌ N/A | - | Different needs |

---

## TECHNOLOGIES "SUR ÉTAGÈRE" (Prêtes à l'Emploi)

### Catégorie A: Protocoles Standardisés (3A)

```
ÉTAGÈRE: PROTOCOLES
├── A2A Protocol v1.0 (Google/Linux Foundation)
│   ├── server.js (43 agents)
│   ├── client.cjs (pour subsidiaires)
│   └── agent.json (manifest)
│
├── UCP Protocol v1.0 (Commerce)
│   ├── products.js (JSON-LD)
│   ├── services.json (catalog)
│   └── manifest.json (discovery)
│
├── GPM (Global Pressure Matrix)
│   ├── pressure-matrix.json (schema)
│   ├── sync-to-3a.cjs (subsidiary sync)
│   └── dashboard.html (visualization)
│
└── ACP Protocol (IBM async)
    ├── server.js (job queue)
    └── client.cjs (submission)
```

### Catégorie B: Sensors (Multi-Platform)

```
ÉTAGÈRE: SENSORS
├── shopify-sensor.cjs (store health)
├── klaviyo-sensor.cjs (email metrics)
├── retention-sensor.cjs (churn analysis)
├── ga4-sensor.cjs (analytics)
├── content-performance-sensor.cjs (blog)
├── voice-quality-sensor.cjs (AI voice)
├── cost-tracking-sensor.cjs (API costs)
└── sync-to-3a.cjs (central sync)
```

### Catégorie C: AI Patterns (Reusable)

```
ÉTAGÈRE: AI PATTERNS
├── Multi-AI Fallback
│   ├── resilient-template.cjs
│   └── providers: [grok, openai, gemini, claude]
│
├── RAG Knowledge Base
│   ├── knowledge_base_builder.py (FAISS)
│   ├── knowledge_base_simple.py (TF-IDF)
│   └── product_sync_pipeline.py
│
├── Voice Agent
│   ├── xai_voice_agent.py (LiveKit - Alpha Medical)
│   ├── voice_agent_core.py (MyDealz e-commerce)
│   ├── voice-agent-b2b.cjs (3A agency B2B)
│   ├── knowledge-base-services.cjs (3A 119 automations)
│   └── grok-voice-realtime.cjs (WebSocket)
│
└── Progressive Memory
    ├── 00-metadata.md (L1)
    ├── 01-core-constraints.md (L1)
    └── agent_docs/*.md (L2)
```

### Catégorie F: Video Production (UPDATED SESSION 160+)

```
ÉTAGÈRE: VIDEO PRODUCTION
├── Remotion Studio (3A Central - Multisubsidiary)
│   ├── remotion-studio/src/compositions/
│   │   ├── PromoVideo.tsx (30s agency showcase)
│   │   ├── AdVideo.tsx (15s social media)
│   │   ├── DemoVideo.tsx (60s product demo)
│   │   ├── TestimonialVideo.tsx (45s client quote)
│   │   ├── HeroArchitecture.tsx (8s homepage hero)
│   │   ├── **AlphaMedicalAd.tsx** (15s medical e-commerce) ✅ NEW
│   │   └── **MyDealzAd.tsx** (15s fashion e-commerce) ✅ NEW
│   │
│   ├── remotion-studio/src/components/
│   │   ├── TitleSlide.tsx (animated titles)
│   │   ├── FeatureCard.tsx (feature showcase)
│   │   ├── LogoReveal.tsx (logo animation)
│   │   └── GradientBackground.tsx (animated bg)
│   │
│   └── remotion-studio/src/lib/
│       └── ai-assets.ts (fal.ai + Replicate integration)
│
├── Subsidiary Compositions (SESSION 160+)
│   ├── AlphaMedicalAd - Medical equipment ads
│   │   ├── Brand: #0ea5e9 (blue), #22c55e (green)
│   │   ├── Features: Trust badges, product showcase
│   │   └── Variants: Portrait, Square
│   │
│   └── MyDealzAd - Fashion e-commerce ads
│       ├── Brand: #ec4899 (pink), #fbbf24 (gold)
│       ├── Features: Flash sale mode, discount badges
│       └── Note: Store HTTP 402 (pending payment)
│
├── AI Image Generation (Multi-Provider)
│   ├── fal.ai FLUX (fast, high quality)
│   ├── Replicate SDXL/Veo 3 (reliable fallback)
│   └── Imagen 4 (Vertex AI - Google)
│
├── Existing Assets (Google Whisk - Manual Only)
│   ├── /assets/whisk/neural_cortex_bg.png
│   ├── /assets/whisk/pricing_concept.png
│   └── /assets/whisk/trust_thumbnail_growth.png
│
└── Commands
    ├── npm run dev (preview at localhost:3000)
    ├── npm run render:promo (→ out/promo.mp4)
    └── npm run render:ad (→ out/ad.mp4)
```

**IMPORTANT - Google Whisk:**
- ❌ **NO API** - Cannot be automated
- ✅ Use for manual concept art generation
- ✅ For programmatic: Use fal.ai, Replicate, or Imagen 4 API
- 📋 **MÉTHODOLOGIE COMPLÈTE**: Voir section "Google Whisk - MÉTHODOLOGIE RIGOUREUSE" ci-dessous

### Catégorie D: CI/CD Patterns (DevOps)

```
ÉTAGÈRE: CI/CD
├── Theme Check (Shopify)
│   ├── theme-check.yml (workflow)
│   ├── .theme-check.yml (config)
│   └── lint-staged (pre-commit)
│
├── Design System (CSS)
│   ├── DESIGN-SYSTEM.md (documentation)
│   ├── .stylelintrc.cjs (validation)
│   └── design-auto-fix.cjs (automation)
│
├── Visual Regression
│   ├── visual-tests.yml (workflow)
│   └── baselines/*.png (screenshots)
│
└── Sensor Monitor
    ├── sensor-monitor.yml (6h cron)
    └── health-check.yml (API status)
```

### Catégorie E: Flywheel Automation

```
ÉTAGÈRE: FLYWHEEL
├── Acquisition
│   ├── Welcome Series (Klaviyo)
│   └── Lead Capture (Forms)
│
├── Conversion
│   ├── Browse Abandonment (Shopify Email)
│   ├── Cart Abandonment (Shopify Email)
│   └── Checkout Abandonment (Klaviyo)
│
├── Retention
│   ├── Post-Purchase Nurture (Klaviyo)
│   ├── Win-back (Klaviyo)
│   └── Loyalty Tagging (Shopify Flow)
│
└── Advocacy
    ├── Review Request (Loox 14d)
    ├── Referrals ($10/$10)
    └── Smart Upsells (22%)
```

---

## PLAN D'ACTION - MUTUALISATION

### Phase 1: Quick Wins (Semaine 1) - ✅ COMPLETED

| Transfer | From | To | Status | Commit |
|----------|------|-----|--------|--------|
| Sensors Shopify | Alpha | MyDealz | ✅ DONE | `decd856` |
| GPM Sync | Alpha | MyDealz | ✅ DONE | `decd856` |
| Theme Check CI | Alpha | MyDealz | ✅ DONE | `99be932` |
| Flywheel pattern doc | Alpha | MyDealz | ✅ EXISTS | N/A (94 files) |

### Phase 2: Core Patterns (Semaine 2) - ✅ COMPLETED

| Transfer | From | To | Status | Commit |
|----------|------|-----|--------|--------|
| Multi-AI Fallback | 3A | Alpha | ✅ DONE | `10f65bc` |
| Multi-AI Fallback | 3A | MyDealz | ✅ DONE | `51f4c8a` |
| RAG Knowledge Base | MyDealz | Alpha | ✅ DONE | `914e73d` |
| Design System template | 3A | Alpha | ✅ DONE | `914e73d` |
| Design System template | 3A | MyDealz | ✅ DONE | `51f4c8a` |

### Phase 3: Advanced Integration (Semaine 3-4) - ✅ CORE COMPLETED

| Transfer | From | To | Status | Commit |
|----------|------|-----|--------|--------|
| Voice Agent B2B | MyDealz | 3A | ✅ DONE | `d4f4f5a` |
| Service KB (121 autos) | 3A | 3A | ✅ DONE | `d4f4f5a` |
| Sensors (klaviyo, retention, ga4) | 3A | MyDealz | ✅ DONE | `577fc55` |
| xAI Voice pattern | Alpha | MyDealz | ✅ EXISTS | `voice_agent_core.py` |
| A2A Client | 3A | Alpha, MyDealz | ⏳ LOW | Future (not critical) |
| Cookie Consent | Alpha | MyDealz | ⏳ LOW | Future (if needed) |

---

## REGISTRE CENTRALISÉ

**Location**: `/Users/mac/Desktop/JO-AAA/docs/ETAGERE-TECHNOLOGIQUE-ECOSYSTEME-3A.md`

**Index des Fichiers Partageables**:

| ID | Nom | Plateforme | Chemin |
|----|-----|------------|--------|
| P001 | A2A Server | 3A | `automations/a2a/server.js` |
| P002 | UCP API | 3A | `pages/api/ucp/products.js` |
| P003 | GPM Schema | 3A | `data/pressure-matrix.json` |
| P004 | Resilient Template | 3A | `agency/core/*-resilient.cjs` |
| P005 | Design System | 3A | `DESIGN-SYSTEM.md` |
| S001 | Shopify Sensor | Alpha | `sensors/shopify-sensor.cjs` |
| S002 | Klaviyo Sensor | Alpha | `sensors/klaviyo-sensor.cjs` |
| S003 | Retention Sensor | Alpha | `sensors/retention-sensor.cjs` |
| S004 | Sync to 3A | Alpha | `sensors/sync-to-3a.cjs` |
| F001 | Theme Check CI | Alpha | `.github/workflows/theme-check.yml` |
| F002 | Cookie Consent | Alpha | `snippets/cookie-consent-banner.liquid` |
| V001 | xAI Voice Agent | Alpha | `scripts/ai-production/xai_voice_agent.py` |
| V002 | Voice KB | Alpha | `scripts/ai-production/voice_knowledge_base.py` |
| R001 | RAG KB Builder | MyDealz | `scripts/knowledge_base_builder.py` |
| R002 | TF-IDF Simple | MyDealz | `scripts/knowledge_base_simple.py` |
| S005 | Omnisend Sensor | MyDealz | `sensors/omnisend-sensor.cjs` |
| S006 | Retention Sensor | MyDealz | `sensors/retention-sensor.cjs` |
| S007 | GA4 Sensor | MyDealz | `sensors/ga4-sensor.cjs` |
| B001 | Voice Agent B2B | 3A | `agency/core/voice-agent-b2b.cjs` |
| B002 | Service KB | 3A | `agency/core/knowledge-base-services.cjs` |
| A001 | Apify Config | MyDealz | `apify-automation/config.js` |
| L001 | Lead Qualify | MyDealz | `apify-automation/qualify-leads.js` |

---

## CONCLUSION

Ce registre implémente le modèle chinois du "potentiel de situation":

1. **Mutualisation** - Technologies "sur étagère" accessibles à toutes les plateformes
2. **Spécialisation** - Chaque plateforme développe ses forces uniques
3. **Vitesse** - Réduction du temps de développement (semaines → jours)
4. **Compétition** - Une fois déployées, les plateformes competent sur leurs marchés

**Avantage structurel créé:**
- 3A: Orchestration centrale + Protocols + Agents
- Alpha Medical: Shopify excellence + Voice AI + Flywheel
- MyDealz: RAG + Lead management + Scraping

**Sources:**
- [François Jullien - Wikipedia](https://en.wikipedia.org/wiki/Fran%C3%A7ois_Jullien)
- [L'ADN - L'automobile chinoise](https://www.ladn.eu/entreprises-innovantes/linnovation-a-toute-vitesse-comment-la-chine-bouscule-lavenir-de-lautomobile-mondiale/)
- [IMD - Xiaomi's EV Rise](https://www.imd.org/ibyimd/innovation/xiaomis-monumental-ev-rise/)
- [S&P Global - China Automotive](https://www.spglobal.com/automotive-insights/en/blogs/2025/09/china-automotive-industry-semiconductor-supply-chain)

---

## PLAN ACTIONNABLE FIN SESSION 144

### Tâches COMPLÉTÉES (23/01/2026)

| # | Tâche | Status |
|---|-------|--------|
| 1 | Blog FR: Leçons Salesforce | ✅ DONE |
| 2 | Blog EN: Salesforce Lessons | ✅ DONE |
| 3 | Academy FR: Architecture Hybride | ✅ DONE |
| 4 | Academy EN: Hybrid Architecture | ✅ DONE |
| 5 | MyDealz: 5 sensors transferred | ✅ DONE |
| 6 | Sitemap: +2 URLs blog | ✅ DONE |
| 7 | Blog index FR/EN: updated | ✅ DONE |

### Tâches RESTANTES (Priorité Haute) - ✅ 100% COMPLETED

| # | Tâche | Status | Session |
|---|-------|--------|---------|
| 1 | ~~**Copie marketing homepage**~~ | ✅ DONE | 144 |
| 2 | ~~**Sitemap** - +2 URLs academy~~ | ✅ DONE | 144bis |
| 3 | ~~**Registry sync** - 119 → 121~~ | ✅ DONE | 144bis |

### Tâches USER ACTION REQUIRED (Credentials)

| # | Tâche | Impact | Action |
|---|-------|--------|--------|
| 1 | **Alpha Medical Shopify token** | Sensors OFF | Régénérer token |
| 2 | **Alpha Medical Klaviyo key** | Email metrics OFF | Vérifier API key |

### Tâches BLOQUÉES (User Action Required)

| # | Tâche | Blocker |
|---|-------|---------|
| 1 | GSC Sensor | API disabled - [Activer](https://console.developers.google.com/apis/api/searchconsole.googleapis.com) |
| 2 | Meta Ads Sensor | META_ACCESS_TOKEN vide |
| 3 | TikTok Ads Sensor | TIKTOK_ACCESS_TOKEN vide |
| 4 | Apify Trends | Trial expiré - $49/mois |

### Incohérences Détectées - ✅ ALL RESOLVED (Session 145)

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| ~~Catalog vs Registry~~ | 121 vs 119 | 121 = 121 | ✅ SYNCED |
| ~~HTML pages vs docs~~ | 70 vs 66 | 70 (docs updated) | ✅ FIXED |
| ~~CSS Version~~ | 38.0 vs 37.0 | 38.0 (all files) | ✅ SYNCED |
| ~~Deployment blocked~~ | CI failing | CI passing | ✅ DEPLOYED |
| Sitemap URLs | 66 | 70+ (missing new content) |

---

---

## PLAN ACTIONNABLE FIN SESSION 146

### Tâches COMPLÉTÉES (23/01/2026)

| # | Tâche | Status | Commit/Location |
|---|-------|--------|-----------------|
| 1 | Remotion Studio créé | ✅ DONE | `automations/remotion-studio/` |
| 2 | 4 Compositions vidéo | ✅ DONE | PromoVideo, DemoVideo, AdVideo, Testimonial |
| 3 | 5 Composants réutilisables | ✅ DONE | TitleSlide, FeatureCard, LogoReveal, etc. |
| 4 | AI Assets integration | ✅ DONE | fal.ai + Replicate fallback |
| 5 | Claude Skill créé | ✅ DONE | `.claude/skills/remotion-video/SKILL.md` |
| 6 | Whisk assets copiés | ✅ DONE | `public/assets/whisk/` |
| 7 | Documentation màj | ✅ DONE | 3 docs updated |

### Tâches RESTANTES (Priorité Haute)

| # | Tâche | Effort | Responsable |
|---|-------|--------|-------------|
| 1 | `npm install` dans remotion-studio | 2min | USER |
| 2 | Tester `npm run dev` | 5min | USER |
| 3 | Première vidéo render test | 10min | USER |
| 4 | Adapter compositions pour MyDealz | 2h | CLAUDE |
| 5 | Adapter compositions pour Alpha | 2h | CLAUDE |

### Google Whisk - MÉTHODOLOGIE RIGOUREUSE (Session 146)

> **IMPORTANT**: Cette méthodologie est conçue pour être exportée vers tous les sites subsidiaires.
> Labs.google/whisk | Gemini captioning → Imagen 3/4 generation

#### CONTRAINTES TECHNIQUES (Vérifiées 23/01/2026)

| Aspect | Valeur | Source |
|--------|--------|--------|
| API publique | ❌ **AUCUNE** | labs.google - web only |
| Durée animation | **8 secondes max** | Format 720p MP4 |
| Sujets simultanés fiables | **4 max** | >4 = résultats incohérents |
| Rate limiting | **30-45 sec** entre prompts | Éviter blocage compte |

#### LIMITES PAR ABONNEMENT GOOGLE

| Abonnement | Crédits AI/mois | Whisk Backend | Flow Backend |
|------------|-----------------|---------------|--------------|
| FREE | 100 | Veo 3.1 Fast | Veo 3.1 Fast |
| **AI Pro** ($19.99 / 119,99 MAD) | 1,000 | **Veo 3** | Veo 3.1 |
| **AI Ultra** ($249.99) | 25,000 | **Veo 3** | Veo 3.1 (highest) |

**3A Status VÉRIFIÉ (Screenshot 23/01/2026):**
- Forfait: Google AI Pro (2 To) - 119,99 MAD/mois
- **Whisk: Veo 3**
- Flow: Veo 3.1 (accès étendu)
- Crédits AI: 1,000/mois

#### WORKFLOW EN 7 ÉTAPES

```
┌─────────────────────────────────────────────────────────────────────┐
│                   WHISK METHODOLOGY v1.0                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ÉTAPE 1: PRÉPARATION DES INPUTS                                    │
│  ────────────────────────────────────────────                       │
│  □ Subject: PNG transparent, haute-résolution, sujet isolé          │
│  □ Scene: Éclairage cohérent, perspective compatible                │
│  □ Style: Esthétique distinctive, couleurs de marque                │
│                                                                      │
│  ÉTAPE 2: VÉRIFICATION QUALITÉ                                      │
│  ────────────────────────────────────────────                       │
│  □ Résolution minimum: 1024x1024 recommandé                         │
│  □ Format: PNG (Subject), JPEG/PNG (Scene/Style)                    │
│  □ Fond: Simple et clair pour Subject                               │
│  □ Éclairage: Cohérent entre Subject et Scene                       │
│                                                                      │
│  ÉTAPE 3: UPLOAD DANS WHISK                                         │
│  ────────────────────────────────────────────                       │
│  □ Subject box: Image principale (objet/personne)                   │
│  □ Scene box: Environnement/arrière-plan                            │
│  □ Style box: Référence esthétique                                  │
│  □ ASTUCE: Style dans Subject box = style dominant                  │
│                                                                      │
│  ÉTAPE 4: GÉNÉRATION INITIALE                                       │
│  ────────────────────────────────────────────                       │
│  □ Cliquer Generate                                                 │
│  □ Attendre ~15-30 secondes                                         │
│  □ Évaluer le résultat (essence, pas copie exacte)                  │
│                                                                      │
│  ÉTAPE 5: REFINEMENT (OPTIONNEL)                                    │
│  ────────────────────────────────────────────                       │
│  □ Cliquer image générée → voir caption Gemini                      │
│  □ Modifier caption (icône crayon) si nécessaire                    │
│  □ Bouton "Refine" pour ajustements mineurs                         │
│  □ Itérer 2-3 fois maximum                                          │
│                                                                      │
│  ÉTAPE 6: ANIMATION (SI NÉCESSAIRE)                                 │
│  ────────────────────────────────────────────                       │
│  □ Cliquer "Animate" en haut                                        │
│  □ Description simple: "walk forward", "waving hand"                │
│  □ LIMITE: 10 animations gratuites/mois                             │
│  □ Résultat: 8 sec, 720p, MP4                                       │
│                                                                      │
│  ÉTAPE 7: EXPORT & INTÉGRATION REMOTION                             │
│  ────────────────────────────────────────────                       │
│  □ Download image/vidéo générée                                     │
│  □ Nommer: whisk_[type]_[date]_[version].png                        │
│  □ Placer dans: remotion-studio/public/assets/whisk/                │
│  □ Utiliser dans composition Remotion                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### STANDARDS DE QUALITÉ PAR TYPE D'INPUT

| Type | Format | Résolution | Fond | Éclairage |
|------|--------|------------|------|-----------|
| **Subject** | PNG transparent | 1024x1024+ | Isolé/transparent | Net, pas de surexposition |
| **Scene** | JPEG/PNG | 1920x1080+ | N/A | Cohérent avec Subject |
| **Style** | Any | 512x512+ | N/A | Caractéristique visible |

#### CAS D'USAGE PAR SUBSIDIAIRE

| Subsidiaire | Usage Whisk | Composition Remotion | Asset Type |
|-------------|-------------|---------------------|------------|
| **3A Automation** | Hero backgrounds, concept art | PromoVideo, DemoVideo | Backgrounds tech |
| **Alpha Medical** | Product shots, lifestyle scenes | ProductShowcase | Medical/wellness |
| **MyDealz** | Fashion layouts, trend visuals | AdVideo | Fashion lifestyle |

#### CHECKLIST PRÉ-GÉNÉRATION

```markdown
## Checklist Whisk - [Date] - [Projet]

### 1. Inputs Préparés
- [ ] Subject: PNG transparent, sujet isolé
- [ ] Scene: Environnement haute qualité
- [ ] Style: Référence esthétique claire
- [ ] Éclairage cohérent entre images

### 2. Paramètres
- [ ] Aspect ratio: 1:1 / 16:9 / 9:16
- [ ] Animation requise? □ Oui □ Non
- [ ] Budget animations restant: __/10

### 3. Post-Génération
- [ ] Résultat acceptable (essence capturée)
- [ ] Refinement nécessaire? □ Oui □ Non
- [ ] Nommage fichier correct
- [ ] Upload vers /assets/whisk/
```

#### WORKFLOW HYBRIDE WHISK → REMOTION

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   WHISK     │────▶│   DOWNLOAD  │────▶│  REMOTION   │────▶│   OUTPUT    │
│   Manual    │     │   Assets    │     │  Compose    │     │   MP4/GIF   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │                    │
     │  • Subject         │  • PNG/MP4        │  • TitleSlide      │  • promo.mp4
     │  • Scene           │  • Organized      │  • FeatureCard     │  • ad.mp4
     │  • Style           │    /assets/whisk/ │  • GradientBG      │  • demo.mp4
     │                    │                   │  • AI overlays     │
     └────────────────────┴───────────────────┴────────────────────┘

AVANTAGE HYBRIDE:
- Whisk: Créativité conceptuelle (AI image-to-image unique)
- Remotion: Contrôle précis timing/animation/text overlays
- Résultat: Vidéos uniques impossibles autrement
```

#### ALTERNATIVES PROGRAMMATIQUES (QUAND WHISK INSUFFISANT)

| Besoin | Solution | API | Coût |
|--------|----------|-----|------|
| Génération bulk | fal.ai FLUX | ✅ Oui | $0.003/image |
| Vidéo AI | Replicate Veo 3 | ✅ Oui | $0.05/sec |
| Style transfer | fal.ai Seedream | ✅ Oui | $0.01/image |
| Haute qualité | Imagen 4 Vertex | ✅ Oui | Variable |

#### ERREURS COURANTES À ÉVITER

| Erreur | Conséquence | Solution |
|--------|-------------|----------|
| >4 sujets simultanés | Rendu incohérent | Limiter à 4 max |
| Image basse résolution | Détails perdus | Min 1024x1024 |
| Fond complexe sur Subject | Fusion incorrecte | PNG transparent |
| Prompts trop rapides | Rate limiting | 30-45 sec entre |
| Attendre copie exacte | Déception | Whisk capture l'essence |

#### SOURCES MÉTHODOLOGIE

- [Google Labs - Whisk Official](https://blog.google/technology/google-labs/whisk/)
- [WhyTryAI - Beginner's Guide](https://www.whytryai.com/p/google-whisk-guide)
- [Whisk AI Template Guide](https://whiskaitemplate.com/en/guide)
- [HitPaw - Complete Guide](https://online.hitpaw.com/learn/ultimate-guide-to-whisk-ai.html)
- [G-Labs Automation GitHub](https://github.com/duckmartians/G-Labs-Automation)

### Transferts Video Production (✅ COMPLÉTÉ SESSION 160+)

| Direction | Technologie | Status | Files |
|-----------|-------------|--------|-------|
| 3A → MyDealz | MyDealzAd composition | ✅ DONE | `MyDealzAd.tsx` |
| 3A → Alpha | AlphaMedicalAd composition | ✅ DONE | `AlphaMedicalAd.tsx` |
| 3A → All | Root.tsx registration | ✅ DONE | 5 new compositions |

---

*Document mis à jour: 26/01/2026 UTC*
*Session: 162 - Stitch MCP Wrapper Implementation*
*Session: 160+ - Subsidiary Compositions Implementation*
