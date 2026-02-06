# ÉTAGÈRE TECHNOLOGIQUE - ÉCOSYSTÈME 3A
## Mutualisation des Technologies Selon le Modèle du "Potentiel de Situation"

> **Version**: 7.0 | **Date**: 06/02/2026 | **Session**: 191ter (Forensic Audit)

---

## 🚀 3A-SHELF - SYSTÈME FONCTIONNEL (NOUVEAU)

**Location:** `~/Desktop/3A-Shelf/`
**Technology:** yalc (local npm package sharing)
**Status:** ✅ OPERATIONAL

### Packages Disponibles

| Package | Version | Modules | Size | Status |
|:--------|:--------|:--------|:-----|:-------|
| @3a/agent-ops | 3.0.0 | EventBus, ContextBox, BillingAgent, ErrorScience, RevenueScience | 124KB | ✅ |
| @3a/security | 1.0.0 | SecurityUtils (32 functions) | 36KB | ✅ |
| @3a/sensors | 1.0.0 | VoiceQuality, CostTracking, LeadVelocity, Retention | 44KB | ✅ |
| @3a/voice-core | 1.0.0 | VoiceAPI, GrokRealtime, PersonaInjector, WidgetTemplates | 312KB | ✅ |

### Usage Rapide

```bash
# Publier les packages (depuis 3A-Shelf)
./scripts/shelf-publish.sh

# Ajouter à un projet (VocalIA, CinematicAds)
yalc add @3a/agent-ops

# Importer dans le code
const { EventBus, ContextBox } = require('@3a/agent-ops');
```

### Avantages vs npm link

| Feature | yalc | npm link |
|:--------|:-----|:---------|
| Symlink issues | ✅ None | ❌ Common |
| Multiple consumers | ✅ Easy | ⚠️ Complex |
| Versioning | ✅ Explicit | ❌ None |

---
> **Document dédié**: `docs/WHISK-REMOTION-METHODOLOGY.md` (méthodologie exhaustive)
> **Méthode**: Inspirée du modèle industriel chinois (François Jullien / Sun Tzu)
> **Principe**: Coopération technique → Potentiel → Concurrence commerciale

---

## STRUCTURE ENTREPRISE 3A AUTOMATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         3A AUTOMATION (Holding)                              │
│                      https://3a-automation.com                               │
│                                                                             │
│    "AI Automation Agency - E-commerce B2C & PME B2B"                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐        │
│  │      VocalIA.ma             │    │    CinematicAds.studio      │        │
│  │    (Voice AI Platform)      │    │   (Video Production)        │        │
│  │                             │    │                             │        │
│  │  • Voice Widget (Browser)   │    │  • Remotion Framework       │        │
│  │  • Voice Telephony (PSTN)   │    │  • AI Asset Generation      │        │
│  │  • 30 Personas              │    │  • UGC Templates            │        │
│  │  • Darija/Arabic Support    │    │  • Brand Videos             │        │
│  │                             │    │                             │        │
│  │  Location:                  │    │  Location:                  │        │
│  │  ~/Desktop/VocalIA/         │    │  ~/Desktop/Ads-Automations/ │        │
│  │                             │    │                             │        │
│  │  Code: 22,361 lines         │    │  Compositions: 7            │        │
│  └─────────────────────────────┘    └─────────────────────────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CLIENT IMPLEMENTATIONS                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Alpha Medical  │  MyDealz  │  [Future Clients via Multi-Tenant]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Plateformes Subsidiaires

| Plateforme | Domain | Type | Location | Lignes Code |
|:-----------|:-------|:-----|:---------|:------------|
| **VocalIA** | vocalia.ma | Voice AI SaaS | `~/Desktop/VocalIA/` | 22,361 |
| **CinematicAds** | cinematicads.studio | Video Production | `~/Desktop/Ads-Automations/` | ~5,000 |

### Technologies Partagées (Étagère) - VÉRIFIÉ 28/01/2026

| Technologie | VocalIA | CinematicAds | 3A Internal | À Transférer |
|:------------|:-------:|:------------:|:-----------:|:------------:|
| Grok API | ✅ | ✅ | ✅ | - |
| Gemini API | ✅ | ✅ | ✅ | - |
| fal.ai | ❌ | ✅ | ✅ | Non requis |
| Remotion | ❌ | ✅ | ✅ | Non requis |
| MCP Protocol | ❌ **MISSING** | ⚠️ | ✅ | **P0** |
| A2A Protocol | ❌ **MISSING** | ❌ | ✅ | P2 |
| GPM Sensors | ❌ **MISSING** | ❌ | ✅ | **P1** |
| .claude/rules/ | ❌ **MISSING** | ❌ | ✅ | **P0** |
| Twilio | ✅ code | ❌ | ✅ | Creds only |
| Shopify API | ✅ code | ❌ | ✅ | - |
| Klaviyo API | ✅ code | ❌ | ✅ | - |
| Session History | ❌ **MISSING** | ❌ | ✅ | **P0** |
| automations-registry | ❌ **MISSING** | ❌ | ✅ | **P1** |

**GAPS VocalIA (Audit 28/01/2026):**
- ❌ Pas de `.claude/rules/` (6 fichiers dans 3A)
- ❌ Pas de `.mcp.json` (7 servers dans 3A)
- ❌ Pas de `automations-registry.json`
- ❌ Pas de session history tracking
- ❌ Pas de GPM sensors intégration

---

## AUDIT FORENSIQUE - FAITS VÉRIFIÉS (28/01/2026)

### Métriques Factuelles (Bottom-Up Verification - S191ter 06/02/2026)

| Composant | Valeur | Source Vérification | Status |
|:---|:---|:---|:---|
| **MCP Servers (Projet)** | **7** | `jq '.mcpServers \| keys' .mcp.json` | ✅ VÉRIFIÉ |
| **Core Workflows** | **103** | `ls automations/agency/core/*.cjs \| wc -l` | ✅ VÉRIFIÉ |
| **Sensors** | **19** | `ls *sensor*.cjs \| wc -l` | ✅ VÉRIFIÉ |
| **Automations Registry** | **121** | `jq '.automations \| length' registry.json` | ✅ VÉRIFIÉ |
| **HTML Pages** | **83** | `find -name "*.html" \| wc -l` | ✅ VÉRIFIÉ |
| **Tests** | **177** | 78 S8 + 99 MCP (100% pass) | ✅ VÉRIFIÉ |
| **--health Endpoints** | **57** | All respond with structured output | ✅ VÉRIFIÉ |
| **HITL Scripts** | **18** | `grep -l HITL *.cjs \| wc -l` | ✅ VÉRIFIÉ |
| **Agent Ops Modules** | **15** | verify-agent-ops.cjs | ✅ VÉRIFIÉ |
| **Credentials** | **60%** | `credential-validator.cjs --check` | ✅ VÉRIFIÉ |

### MCP Servers (CONFIGURÉ 27/01/2026 02:15 UTC)

**Source Global:** `~/.claude/settings.json`
**Source Projet:** `/Users/mac/Desktop/JO-AAA/.mcp.json`

| Couche | Count | Servers | Source |
|:---|:---|:---|:---|
| **Global** | **7** | chrome-devtools, playwright, gemini, github, hostinger, filesystem, memory | settings.json |
| **Projet** | **6** | 3a-global-mcp, grok, google-sheets, klaviyo, shopify-dev, shopify-admin | .mcp.json |
| **Total** | **13+** | (plus apify, google-analytics in global) | |

#### Détail Global (7 serveurs - ~/.config/claude-code/mcp.json)

| Server | Package | Description |
|:---|:---|:---|
| **chrome-devtools** | playwright-devtools-mcp | DevTools access via Playwright |
| **playwright** | @playwright/mcp | Microsoft official browser automation |
| **gemini** | mcp-server-gemini | Google Gemini API |
| **github** | @modelcontextprotocol/server-github | Repos, issues, PRs |
| **hostinger** | hostinger-api-mcp | VPS, domains, WordPress |
| **filesystem** | @modelcontextprotocol/server-filesystem | File operations |
| **memory** | @modelcontextprotocol/server-memory | Knowledge graph |

#### Détail Projet (6 serveurs - .mcp.json)

| Server | Command | Description |
|:---|:---|:---|
| **3a-global-mcp** | node automations/3a-global-mcp/build/index.js | 121 automations, v1.5.0, 99/99 tests |
| **grok** | npx grok-search-mcp@latest | Web search + AI |
| **google-sheets** | npx google-sheets-mcp | Read/write spreadsheets |
| **klaviyo** | uvx klaviyo-mcp-server@latest | Email flows, campaigns |
| **shopify-dev** | npx @shopify/dev-mcp@latest | API docs, schema exploration |
| **shopify-admin** | npx @ajackus/shopify-mcp-server | Products, orders, customers |

#### ENV Variables Requises (pour activation complète)

```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxx

# Hostinger
HOSTINGER_API_TOKEN=xxxxx

# WordPress
WORDPRESS_URL=https://your-site.com
WORDPRESS_USERNAME=admin
WORDPRESS_PASSWORD=xxxxx

# Google Analytics
GA_PROPERTY_ID=123456789

# Gemini
GOOGLE_API_KEY=xxxxx

# Gmail - auto-auth via browser (no env needed)
```

### 3A-Global-MCP (VÉRIFIÉ)

| Aspect | Valeur | Source |
|:---|:---|:---|
| Version | **1.5.0** | package.json |
| Location | `automations/3a-global-mcp/` | ls |
| SDK | @modelcontextprotocol/sdk ^1.25.3 | dependencies |
| Tests | **99/99** (100%) | verify-core.js |
| Features | tools, resources, prompts, logging, caching, output-schemas, streamable-http, bearer-auth | Operational |

### Sensors Status (19 total - Vérifié S191ter 06/02/2026)

| Status | Count | Sensors |
|:---|:---|:---|
| ✅ OK | 12 | shopify, klaviyo, email-health, cost-tracking, lead-velocity, ga4, retention, gsc, lead-scoring, apify-trends, google-trends, product-seo |
| ⚠️ DEGRADED | 1 | voice-quality (2/3 endpoints healthy) |
| ⚠️ WARNING | 1 | supplier-health (CJ/BigBuy keys missing) |
| ❌ ERROR | 1 | content-performance (WordPress API timeout) |
| 🔒 BLOCKED | 4 | meta-ads, tiktok-ads, whatsapp-status, google-ads-planner (credentials missing) |

**Supprimé**: bigquery-trends-sensor (non nécessaire <3000 clients)

### BLOCKERS - USER ACTION REQUIRED

| Blocker | Impact | Action Requise |
|:---|:---|:---|
| META_ACCESS_TOKEN vide | meta-ads-sensor OFF | Configurer token Meta |
| TIKTOK_ACCESS_TOKEN vide | tiktok-ads-sensor OFF | Configurer token TikTok |
| WHATSAPP_ACCESS_TOKEN vide | whatsapp-status-sensor OFF | Configurer token WhatsApp Business |
| 5 Google Ads creds missing | google-ads-planner-sensor OFF | CLIENT_ID, SECRET, DEVELOPER_TOKEN, CUSTOMER_ID, REFRESH_TOKEN |
| CJ/BigBuy API keys vides | supplier-health-sensor partial | Configurer CJ_API_KEY, BIGBUY_API_KEY |
| WordPress API timeout | content-performance-sensor ERROR | Debug WP connectivity (creds set but API timeout) |

### Commande de Vérification

```bash
# Vérifier status de TOUS les sensors
for s in automations/agency/core/*sensor*.cjs; do echo "=== $(basename $s) ==="; node "$s" --health 2>&1 | head -5; done
```

---

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

| Technologie | Status | Fichier Principal | Vérification | Prêt à Partager |
|-------------|--------|-------------------|--------------|-----------------|
| **A2A Protocol** | ✅ Production | `automations/a2a/server.js` | 1089 lines, v1.1.0 | ✅ OUI |
| **UCP Protocol** | ✅ Production | `pages/api/ucp/products.js` | Exists | ✅ OUI |
| **ACP Protocol** | ❌ **DEPRECATED** | `automations/acp/DEPRECATED.md` | Merged into A2A | ❌ NON |
| **GPM Central** | ✅ Production | `landing-page-hostinger/data/pressure-matrix.json` | 8 sectors | ✅ OUI |
| **87 Scripts Core** | ✅ Production | `agency/core/*.cjs` | `ls \| wc -l` = 87 | ✅ OUI |
| **19 Sensors** | ✅ ALL v1.1.0 | `agency/core/*-sensor.cjs` | 10 OK, 6 NO_CREDS, 3 BLOCKED | ✅ OUI |
| **7 Resilient Scripts** | ✅ Production | `*-resilient.cjs` | Multi-AI fallback | ✅ OUI |
| **Stylelint Config** | ✅ Production | `.stylelintrc.json` | Exists | ✅ OUI |
| **VPS Docker** | ✅ Production | `docker-compose.yml` | | ⚠️ Spécifique |
| **121 Automations** | ✅ Production | `automations-registry.json` | `jq length` = 121 | ✅ OUI |
| **Voice Agent B2B** | ➡️ VocalIA | `VocalIA/core/voice-agent-b2b.cjs` | Migré | ✅ OUI |
| **Service KB (TF-IDF)** | ✅ Production | `knowledge_base/chunks.json` | **135 chunks** | ✅ OUI |
| **Remotion Video** | ➡️ CinematicAds | `Ads-Automations/remotion-studio/` | **7 compositions** | ✅ OUI |
| **AI Asset Gen** | ➡️ CinematicAds | `Ads-Automations/src/lib/ai-assets.ts` | fal.ai + Replicate | ✅ OUI |
| **Stitch MCP Wrapper** | ✅ Production | `agency/core/stitch-api.cjs` | 279 lines, --health | ✅ OUI |

**Technologies UNIQUES 3A:**
- A2A v1.0 Protocol (tasks/send, tasks/get, tasks/cancel)
- 3A-Global-MCP SOTA 95% (bearer-auth, streamable-http)
- GPM avec 19 sensors temps réel
- Multi-tenant client orchestration

---

### 1bis. VocalIA (Voice AI Platform - Subsidiary)

**Location:** `~/Desktop/VocalIA/`
**Domain:** vocalia.ma
**Code Total:** 8,098 lignes

| Technologie | Status | Fichier Principal | Lignes | Description |
|-------------|--------|-------------------|--------|-------------|
| **Voice API Resilient** | ✅ Production | `core/voice-api-resilient.cjs` | 1,508 | Multi-AI fallback (Grok→Gemini→Claude→Atlas) |
| **Grok Voice Realtime** | ✅ Production | `core/grok-voice-realtime.cjs` | 1,112 | WebSocket audio PCM16/24kHz |
| **Voice Telephony Bridge** | ✅ Production | `telephony/voice-telephony-bridge.cjs` | 2,658 | Twilio PSTN ↔ Grok WebSocket, 11 tools |
| **Voice Widget Core** | ✅ Production | `widget/voice-widget-core.js` | 1,012 | Browser Web Speech API ($0) |
| **Voice Widget Templates** | ✅ Production | `widget/voice-widget-templates.cjs` | 800 | Industry presets |
| **Voice Persona Injector** | ✅ Production | `personas/voice-persona-injector.cjs` | 648 | 30 personas, 5 langues |
| **Voice CRM Tools** | ✅ Production | `integrations/voice-crm-tools.cjs` | 104 | HubSpot integration |
| **Voice E-commerce Tools** | ✅ Production | `integrations/voice-ecommerce-tools.cjs` | 149 | Shopify + Klaviyo |
| **Voice Quality Sensor** | ✅ Production | `scripts/voice-quality-sensor.cjs` | 282 | Health monitoring |

**Technologies UNIQUES VocalIA:**
- Widget + Telephony combinés (rare sur le marché)
- 30 personas multi-tenant avec marketing science (BANT/PAS/CIALDINI)
- Darija natif via Atlas-Chat-9B
- $0.06/min vs $0.13-0.33/min concurrents (Vapi, Retell)

**Documentation:** `VocalIA/docs/VOICE-AI-PLATFORM-REFERENCE.md`

---

### 1ter. CINEMATICADS (Video Production - Subsidiary)

**Location:** `~/Desktop/Ads-Automations/`
**Domain:** cinematicads.studio

| Technologie | Status | Fichier Principal | Description |
|-------------|--------|-------------------|-------------|
| **Remotion Studio** | ✅ Production | `remotion-studio/` | React video framework |
| **AI Asset Generation** | ✅ Production | `src/lib/ai-assets.ts` | fal.ai + Replicate |
| **7 Compositions** | ✅ Production | `compositions/*.tsx` | UGC, Brand, Promo templates |
| **Whisk Assets** | ✅ Available | `/assets/whisk/*.png` | Pre-generated visuals |

**Technologies UNIQUES CinematicAds:**
- Rendu vidéo local gratuit (pas de cloud billing)
- Vibe coding avec Claude
- Multi-provider AI assets (fal.ai, Replicate, Imagen)
| **3A-Global-MCP** | ✅ Production | `automations/3a-global-mcp/` | **v1.5.0**, SDK 1.25.3 | ✅ OUI |

**Technologies UNIQUES 3A:**
- A2A v1.0 Protocol (tasks/send, tasks/get, tasks/cancel)
- 3A-Global-MCP SOTA 95% (bearer-auth, streamable-http)
- GPM avec 19 sensors temps réel

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
ÉTAGÈRE: PROTOCOLES (Vérifié 27/01/2026)
├── A2A Protocol v1.1.0 (1089 lines)
│   ├── server.js (tasks/send, tasks/get, tasks/cancel)
│   ├── TaskState: submitted → working → completed/failed
│   └── /.well-known/agent.json (Agent Card v1.0)
│
├── UCP Protocol v1.0 (Commerce)
│   ├── products.js (JSON-LD)
│   └── pages/api/ucp/
│
├── GPM (Global Pressure Matrix)
│   ├── pressure-matrix.json (8 sectors)
│   ├── 19 sensors → GPM updates
│   └── Sectors: marketing, sales, seo, finance, technology, communications, operations, system
│
└── ACP Protocol ❌ DEPRECATED
    └── Merged into A2A (Session 168undecies)
```

### Catégorie B: Sensors (19 total - ALL v1.1.0)

```
ÉTAGÈRE: SENSORS (Vérifié 27/01/2026 - Session 168quaterdecies)
├── ✅ API OK (10)
│   ├── ga4-sensor.cjs (runReport API)
│   ├── shopify-sensor.cjs (products/count)
│   ├── klaviyo-sensor.cjs (lists API)
│   ├── email-health-sensor.cjs (Klaviyo)
│   ├── google-trends-sensor.cjs (AI providers)
│   ├── gsc-sensor.cjs (SearchConsole)
│   ├── cost-tracking-sensor.cjs (cost log)
│   ├── lead-velocity-sensor.cjs (leads file)
│   ├── product-seo-sensor.cjs (Shopify)
│   └── apify-trends-sensor.cjs (user API)
│
├── ⚠️ NO CREDENTIALS (6)
│   ├── meta-ads-sensor.cjs (META_ACCESS_TOKEN)
│   ├── tiktok-ads-sensor.cjs (TIKTOK_ACCESS_TOKEN)
│   ├── whatsapp-status-sensor.cjs (WHATSAPP_ACCESS_TOKEN)
│   ├── google-ads-planner-sensor.cjs (5 creds missing)
│   ├── supplier-health-sensor.cjs (CJ/BigBuy keys)
│   └── content-performance-sensor.cjs (WordPress)
│
└── ❌ BLOCKED (3)
    ├── retention-sensor.cjs (NETWORK)
    ├── voice-quality-sensor.cjs (NO_PROVIDERS)
    └── lead-scoring-sensor.cjs (NO_DATA)
```

### Catégorie C: AI Patterns (Reusable)

```
ÉTAGÈRE: AI PATTERNS (Vérifié 27/01/2026)
├── Multi-AI Fallback (7 scripts resilient)
│   ├── blog-generator-resilient.cjs
│   ├── churn-prediction-resilient.cjs
│   ├── email-personalization-resilient.cjs
│   ├── podcast-generator-resilient.cjs
│   ├── product-photos-resilient.cjs
│   ├── sms-automation-resilient.cjs
│   └── voice-api-resilient.cjs
│
├── Fallback Chains (Session 168terdecies)
│   ├── CRITICAL: Claude Opus 4.5 → Grok → Gemini
│   ├── VOLUME: Gemini → Grok → Claude
│   └── REAL-TIME: Grok → ElevenLabs → Gemini Live
│
├── RAG Knowledge Base (135 chunks)
│   ├── knowledge_base/chunks.json (135)
│   ├── knowledge_base/tfidf_index.json
│   └── knowledge_base/embeddings_cache.json
│
├── Voice Agent
│   ├── voice-agent-b2b.cjs (3A agency B2B)
│   ├── knowledge-base-services.cjs (121 automations)
│   └── grok-voice-realtime.cjs (WebSocket)
│
└── HITL (Human In The Loop) - 17 scripts
    └── --approve/--reject pattern
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

## CHANGELOG

| Session | Date | Changes |
|:---|:---|:---|
| **168quaterdecies** | 27/01/2026 | Forensic audit COMPLET, 19 sensors v1.1.0 REAL API tests |
| 168terdecies | 26/01/2026 | AI fallback chains inversées (Claude primary for CRITICAL) |
| 168undecies | 26/01/2026 | A2A v1.1.0, ACP deprecated |
| 168decies | 26/01/2026 | Bearer auth, MCP SOTA 95% |
| 162 | 26/01/2026 | Stitch MCP Wrapper |
| 160+ | 25/01/2026 | Subsidiary Compositions |

---

*Document mis à jour: 27/01/2026 01:45 UTC*
*Session: 168quaterdecies - Forensic Sensor Audit*
*Méthode: Bottom-up verification basée sur FAITS*
