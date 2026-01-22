# ARCHITECTURE SYSTÈME 3A AUTOMATION
## Documentation Technique Approfondie
### Date: 22 Janvier 2026 | Session 138

---

# TABLE DES MATIÈRES

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Couche 1: Sensors (Collecte)](#2-couche-1-sensors)
3. [Couche 2: Pressure Matrix (État)](#3-couche-2-pressure-matrix)
4. [Couche 3: Autonomy Daemon (Décision)](#4-couche-3-autonomy-daemon)
5. [Couche 4: DOE Dispatcher (Orchestration)](#5-couche-4-doe-dispatcher)
6. [Couche 5: Scripts Resilient (Exécution)](#6-couche-5-scripts-resilient)
7. [Couche 6: Skills (Personas)](#7-couche-6-skills)
8. [Couche 7: Protocols (Communication)](#8-couche-7-protocols)
9. [Couche 8: MCPs (Intégrations)](#9-couche-8-mcps)
10. [Couche 9: Gateways (Routage)](#10-couche-9-gateways)
11. [Services Vendables](#11-services-vendables)
12. [Matrice de Dépendances](#12-matrice-de-dependances)

---

# 1. VUE D'ENSEMBLE

## 1.1 Architecture en Couches

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COUCHE 9: GATEWAYS                           │
│                 (Routage AI, Paiements, APIs)                       │
├─────────────────────────────────────────────────────────────────────┤
│                        COUCHE 8: MCPs                               │
│              (14 serveurs: Klaviyo, Shopify, GA4...)                │
├─────────────────────────────────────────────────────────────────────┤
│                      COUCHE 7: PROTOCOLS                            │
│                    (A2A, UCP, JSON-RPC 2.0)                         │
├─────────────────────────────────────────────────────────────────────┤
│                       COUCHE 6: SKILLS                              │
│                 (49 personas: agency, devops...)                    │
├─────────────────────────────────────────────────────────────────────┤
│                   COUCHE 5: SCRIPTS RESILIENT                       │
│           (7 scripts avec fallback AI multi-provider)               │
├─────────────────────────────────────────────────────────────────────┤
│                    COUCHE 4: DOE DISPATCHER                         │
│             (Orchestration Directive→Execution)                     │
├─────────────────────────────────────────────────────────────────────┤
│                   COUCHE 3: AUTONOMY DAEMON                         │
│              (Décision: Reality vs Goals)                           │
├─────────────────────────────────────────────────────────────────────┤
│                   COUCHE 2: PRESSURE MATRIX                         │
│               (État global du système: GPM)                         │
├─────────────────────────────────────────────────────────────────────┤
│                      COUCHE 1: SENSORS                              │
│             (12 capteurs: GA4, GSC, Meta, TikTok...)                │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.2 Flux de Données

```
[MONDE RÉEL]
     │
     ▼
┌─────────────┐
│  SENSORS    │──► APIs externes (GA4, GSC, Facebook, Shopify...)
│  (12)       │
└─────┬───────┘
      │ Métriques (ROAS, CTR, pressure...)
      ▼
┌─────────────┐
│  PRESSURE   │──► pressure-matrix.json
│  MATRIX     │    (État global par secteur)
└─────┬───────┘
      │ Gaps (Reality vs Goals)
      ▼
┌─────────────┐
│  AUTONOMY   │──► strategic_goals.json
│  DAEMON     │    (Décisions autonomes)
└─────┬───────┘
      │ Directives (ex: "Générer 10 leads")
      ▼
┌─────────────┐
│    DOE      │──► automations-registry.json
│ DISPATCHER  │    (Sélection tool optimal)
└─────┬───────┘
      │ Plans (tool + params)
      ▼
┌─────────────┐
│  SCRIPTS    │──► Exécution réelle
│  RESILIENT  │    (Fallback AI: Grok→GPT→Claude→Gemini)
└─────┬───────┘
      │ Outputs (articles, emails, prédictions...)
      ▼
[CLIENTS / PLATEFORMES]
```

---

# 2. COUCHE 1: SENSORS

## 2.1 Vue d'Ensemble

| Sensor | Lignes | API | Métriques | Status |
|--------|--------|-----|-----------|--------|
| ga4-sensor.cjs | 100 | Google Analytics Data API | sessions, revenue, roas, conversion | ⚠️ PARTIEL |
| gsc-sensor.cjs | 92 | Google Search Console API | clicks, impressions, ctr, position | ❌ BROKEN |
| meta-ads-sensor.cjs | 86 | Facebook Graph API v19 | spend, clicks, ctr, conversions | ❌ DISCONNECTED |
| tiktok-ads-sensor.cjs | 95 | TikTok Business API | spend, clicks, ctr, conversions | ❌ DISCONNECTED |
| retention-sensor.cjs | 103 | Shopify Admin API | orders, repeat_rate, churn_risk | ✅ OK |
| product-seo-sensor.cjs | 86 | Shopify Admin API | products, seo_score | ✅ OK |
| lead-scoring-sensor.cjs | 57 | Internal | leads, scores | ⚠️ CRITIQUE |
| lead-velocity-sensor.cjs | 72 | Internal | velocity, trend | ❌ BROKEN |
| apify-trends-sensor.cjs | 112 | Apify API | trends, queries | ❌ BROKEN |
| bigquery-trends-sensor.cjs | 77 | BigQuery | rising_terms | ⚠️ EMPTY |
| google-trends-sensor.cjs | 142 | Google Trends (scraping) | trends, interest | ❌ BLOCKED |
| google-ads-planner-sensor.cjs | 101 | Google Ads API | keywords, volume | ⚠️ PASSIVE |

## 2.2 Détail par Sensor

### ga4-sensor.cjs
```javascript
// Fonction principale
async function fetchGA4Data(propertyId) {
    // Appelle: analyticsdata.googleapis.com
    // Retourne: { sessions, revenue, roas, conversionRate, pressure }
}

// Dépendances
- GOOGLE_APPLICATION_CREDENTIALS (Service Account JSON)
- GA4_PROPERTY_ID

// Output format
{
    "pressure": 0-100,      // 0 = bon, 100 = critique
    "sessions": number,
    "revenue": number,
    "roas": number,
    "conversionRate": number
}
```

### gsc-sensor.cjs
```javascript
// Fonction principale
async function fetchGSCData(siteUrl) {
    // Appelle: searchconsole.googleapis.com
    // Retourne: { clicks, impressions, ctr, position, pressure }
}

// STATUS: ❌ BROKEN
// Erreur: "Google Search Console API not enabled in Cloud Console"
// Fix: Activer l'API dans console.cloud.google.com
```

### retention-sensor.cjs
```javascript
// Fonction principale
async function fetchShopifyOrders(shop, token) {
    // Appelle: Shopify Admin API /orders.json
    // Calcule: repeat_purchase_rate, at_risk_customers
}

// STATUS: ✅ OK
// Dépendances: SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN
```

## 2.3 Matrice de Couverture

| Domaine | Automations | Sensors Couvrant | Couverture |
|---------|-------------|------------------|------------|
| lead-gen | 26 | lead-scoring, lead-velocity | 8% (2 broken) |
| content | 19 | AUCUN | 0% |
| shopify | 14 | product-seo, retention | 14% |
| email | 11 | AUCUN | 0% |
| seo | 10 | gsc (broken), product-seo | 5% |
| analytics | 9 | ga4 (partiel) | 10% |
| voice-ai | 4 | AUCUN | 0% |
| dropshipping | 3 | AUCUN | 0% |

**Couverture globale: ~5%** (3 OK / 12 total)

---

# 3. COUCHE 2: PRESSURE MATRIX

## 3.1 Structure

**Fichier:** `landing-page-hostinger/data/pressure-matrix.json`

```json
{
    "last_updated": "2026-01-22T11:20:59.538Z",
    "metrics": {
        "global_roas": "0.00",
        "total_revenue_7d": "0.00"
    },
    "sectors": {
        "marketing": {
            "google_ads": { "pressure": 50, "trend": "STABLE" },
            "meta_ads": { "pressure": 95, "trend": "DOWN", "error": "DISCONNECTED" },
            "retention": { "pressure": 0, "trend": "DOWN" },
            "market_demand": { "pressure": 50, "trend": "falling" }
        },
        "leads": {
            "scoring": { "pressure": 95 },
            "velocity": { "pressure": 50 }
        },
        "seo": {
            "gsc": { "pressure": 50 }
        }
    }
}
```

## 3.2 Interprétation Pressure

| Pressure | Signification | Action |
|----------|---------------|--------|
| 0-20 | Excellent | Maintenir |
| 21-40 | Bon | Surveiller |
| 41-60 | Moyen | Optimiser |
| 61-80 | Critique | Intervenir |
| 81-100 | Urgence | Action immédiate |

## 3.3 Secteurs Actuels (22/01/2026)

| Secteur | Pressure | Trend | Status |
|---------|----------|-------|--------|
| google_ads | 50 | STABLE | ⚠️ Moyen |
| meta_ads | 95 | DOWN | ❌ URGENCE (disconnected) |
| retention | 0 | DOWN | ✅ Excellent |
| market_demand | 50 | falling | ⚠️ Moyen |
| lead_scoring | 95 | - | ❌ URGENCE |
| lead_velocity | 50 | - | ⚠️ Moyen |

---

# 4. COUCHE 3: AUTONOMY DAEMON

## 4.1 Rôle

**Fichier:** `automations/agency/core/autonomy-daemon.cjs`

Le daemon autonome compare la **réalité** (Pressure Matrix) avec les **objectifs** (strategic_goals.json) et déclenche des actions via le DOE Dispatcher.

## 4.2 Flux de Décision

```
┌─────────────────────────────────────────┐
│          strategic_goals.json           │
│  { "goal": "ROAS > 3", "metric": ... }  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          measureReality(metric)         │
│  Lit pressure-matrix.json + logs        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         GAP = Desire - Reality          │
│  if (GAP > threshold) → TRIGGER         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          DOE Dispatcher                 │
│  Exécute directive pour combler gap     │
└─────────────────────────────────────────┘
```

## 4.3 Métriques Supportées

| Métrique | Source | Calcul |
|----------|--------|--------|
| active_leads_24h | mcp-logs.json | Count logs avec "source" dans 24h |
| global_roas | pressure-matrix | metrics.global_roas ou calcul |
| content_velocity | logs | Articles publiés / semaine |

## 4.4 Usage

```bash
# Mode simulation (recommandé)
node automations/agency/core/autonomy-daemon.cjs --dry-run

# Mode live (DANGEREUX - exécute réellement)
node automations/agency/core/autonomy-daemon.cjs --live
```

---

# 5. COUCHE 4: DOE DISPATCHER

## 5.1 Framework DOE

**D**irective → **O**rchestration → **E**xecution

| Phase | Rôle | Composant |
|-------|------|-----------|
| **D**irective | Input humain ou daemon | Phrase naturelle |
| **O**rchestration | Planning AI | DOEOrchestrator.plan() |
| **E**xecution | Action réelle | Script .cjs |

## 5.2 Niveaux d'Autonomie

| Level | Nom | Description | Exemples Scripts |
|-------|-----|-------------|------------------|
| L1 | Deterministic | Sync data, pas de logique | sync-google-forms.cjs |
| L2 | Conditional | Triggers, règles IF/THEN | price-drop-alerts.cjs |
| L3 | Reasoning | Analyse LLM, génération | blog-generator-resilient.cjs |
| L4 | Autonomous | Boucles auto-correctrices | churn-prediction-resilient.cjs |
| L5 | Sovereign | Décisions autonomes complètes | autonomy-daemon.cjs |

## 5.3 Classe DOEOrchestrator

```javascript
class DOEOrchestrator {
    // Phase 1: Planning
    async plan(directive) {
        // 1. Trouve le meilleur tool dans registry
        // 2. Extrait les paramètres du directive
        // 3. Retourne plan {toolId, script, params}
    }

    // Phase 2: Validation
    async critique(plan, directive) {
        // Vérifie que le script existe
        // Vérifie que les params sont complets
    }

    // Phase 3: Exécution
    async execute(plan) {
        // execSync(`node ${plan.script} ${plan.params.join(' ')}`)
    }
}
```

## 5.4 Exemple d'Exécution

```bash
# Input directive
"Génère un article sur l'automatisation e-commerce"

# Plan généré
{
    "toolId": "blog-generator",
    "script": "automations/agency/core/blog-generator-resilient.cjs",
    "params": ["--topic", "automatisation e-commerce", "--language", "fr"]
}

# Exécution
node blog-generator-resilient.cjs --topic "automatisation e-commerce" --language fr
```

---

# 6. COUCHE 5: SCRIPTS RESILIENT

## 6.1 Architecture Fallback

Tous les scripts resilient suivent le pattern:

```javascript
const AI_PROVIDERS = [
    { name: 'Grok 4.1', call: callGrok },       // Priorité 1
    { name: 'GPT-5.2', call: callOpenAI },      // Priorité 2
    { name: 'Claude 4.5', call: callAnthropic }, // Priorité 3
    { name: 'Gemini 3', call: callGemini }      // Priorité 4
];

async function generateWithFallback(prompt) {
    for (const provider of AI_PROVIDERS) {
        try {
            return await provider.call(prompt);
        } catch (e) {
            console.error(`${provider.name} failed, trying next...`);
        }
    }
    throw new Error('All AI providers failed');
}
```

## 6.2 Scripts Détaillés

### blog-generator-resilient.cjs (1258 lignes)

| Fonction | Description |
|----------|-------------|
| `buildPrompt()` | Construit prompt avec framework (PAS/AIDA) |
| `callAnthropic()` | Appel Claude API |
| `callOpenAI()` | Appel GPT API |
| `callGrok()` | Appel xAI API |
| `callGemini()` | Appel Google API |
| `critiqueArticle()` | Auto-critique du contenu |
| `refineArticle()` | Amélioration itérative |
| `publishToWordPress()` | Publication WP REST API |
| `postToFacebook()` | Partage social (optionnel) |
| `postToLinkedIn()` | Partage social (optionnel) |

**Dépendances:**
- `marketing-science-core.cjs` (frameworks persuasion)
- `utils/telemetry.cjs` (logging)
- WordPress credentials
- 4 AI provider keys

**Usage:**
```bash
node blog-generator-resilient.cjs --health
node blog-generator-resilient.cjs --topic "SEO 2026" --language fr --agentic
```

### churn-prediction-resilient.cjs (1014 lignes)

| Fonction | Description |
|----------|-------------|
| `calculateRFM()` | Scoring Recency-Frequency-Monetary |
| `getRFMSegment()` | Segmentation client (Champions, At Risk...) |
| `calculateChurnRisk()` | Probabilité de churn |
| `getAIChurnAnalysis()` | Analyse LLM personnalisée |
| `triggerVoiceAgent()` | Appel vocal pour clients à risque |
| `updateKlaviyoProfile()` | Mise à jour profil Klaviyo |
| `predictChurn()` | Prédiction individuelle |
| `predictChurnBatch()` | Prédiction batch |

**Port:** 3010 (mode serveur)

**Usage:**
```bash
node churn-prediction-resilient.cjs --health
node churn-prediction-resilient.cjs --server --port 3010
```

### voice-api-resilient.cjs (1209 lignes)

| Fonction | Description |
|----------|-------------|
| `getOrCreateLeadSession()` | Gestion session conversationnelle |
| `callGrok()` | Réponse voice via Grok |
| `extractBudget()` | Extraction BANT - Budget |
| `extractTimeline()` | Extraction BANT - Timeline |
| `extractDecisionMaker()` | Extraction BANT - Authority |
| `extractEmail()` | Extraction contact |
| `getLocalResponse()` | Fallback offline |

**Dépendances:**
- Sessions persistantes
- Extraction BANT automatique
- 4 AI providers

---

# 7. COUCHE 6: SKILLS

## 7.1 Structure d'un Skill

Chaque skill = dossier dans `.agent/skills/{skill_name}/SKILL.md`

```markdown
---
name: Nom du Skill
description: Description courte
triggers:
  - "mot-clé 1"
  - "mot-clé 2"
---

# Nom du Skill

## Role
Description du rôle de l'agent

## Objectives
- Objectif 1
- Objectif 2

## Instructions
1. Étape 1
2. Étape 2

## Review Checklist
- [ ] Vérification 1
- [ ] Vérification 2
```

## 7.2 Skills par Domaine

### Vente & Marketing (8)
| Skill | Description | Triggers |
|-------|-------------|----------|
| agency | Sales 3A Automation | besoin d'automatisation, audit gratuit |
| negotiator | Négociation prix | prix trop cher, discount |
| growth | Growth hacking | augmenter ventes |
| market_analyst | Analyse marché | étude de marché |
| content_director | Direction éditoriale | plan content, SEO gaps |
| stylist | Branding visuel | design, branding |
| producer | Production média | vidéo, podcast |
| recruiter | Recrutement | embaucher |

### Support Client (6)
| Skill | Description | Triggers |
|-------|-------------|----------|
| ecommerce_b2c | Support e-commerce | suivi commande, retour |
| sme_b2b | Réception PME | rendez-vous, horaires |
| concierge | Conciergerie | aide, assistance |
| counselor | Conseil | problème, aide |
| cleaner | Nettoyage data | doublon, erreur |
| dispatcher | Routing tâches | qui contacter |

### Verticals Métier (18)
| Skill | Industrie |
|-------|-----------|
| contractor | Construction (devis) |
| dental | Cabinet dentaire |
| funeral | Pompes funèbres |
| gym | Salle de sport |
| healer | Praticien santé |
| hoa | Syndic copropriété |
| insurer | Assurance |
| mechanic | Garage auto |
| pharmacist | Pharmacie |
| planner | Planning |
| property | Gestion immobilière |
| renter | Location |
| school | École |
| surveyor | Expert immobilier |
| trainer | Coach fitness |
| accountant | Comptabilité |
| logistician | Logistique |
| collector | Recouvrement |

### Tech & Ops (9)
| Skill | Description |
|-------|-------------|
| devops | Infrastructure check |
| sysadmin | Admin système |
| security | Cybersécurité |
| architect | Architecture tech |
| governor | Gouvernance |
| bridge_slack | Intégration Slack |
| bridge_voice | Pont téléphonie |
| logistics | Transport |
| gemini_skill_creator | Création skills |

## 7.3 Skills JS (automations/skills/)

| Module | Fonction |
|--------|----------|
| ContentDirector.js | Orchestration contenu |
| DevOps.js | Vérification env |
| Growth.js | Tactics croissance |
| Logistics.js | Gestion flux |
| MarketAnalyst.js | Analyse concurrence |
| Negotiator.js | Scripts négociation |
| Security.js | Audit sécurité |
| SystemAdmin.js | Admin système |

---

# 8. COUCHE 7: PROTOCOLS

## 8.1 A2A Protocol (Agent-to-Agent)

**Spec:** Google/Linux Foundation A2A Protocol v1.0

### Composants

| Fichier | Rôle |
|---------|------|
| registry.json | Registre des peers |
| agent-card.schema.json | Schema de description agent |
| server.js | Serveur JSON-RPC |
| rpc-server.js | Handlers RPC |

### Peers Enregistrés

```json
{
    "peers": [
        {
            "agent_id": "agency-sales-bot",
            "capabilities": ["qualify_lead", "book_audit"],
            "endpoint": "http://localhost:3000/agent/rpc/agency"
        },
        {
            "agent_id": "contractor-sales-bot",
            "capabilities": ["estimate_roofing", "estimate_solar"],
            "endpoint": "http://localhost:3000/agent/rpc/contractor"
        },
        {
            "agent_id": "finance-collector-bot",
            "capabilities": ["collect_debt", "negotiate_plan"],
            "endpoint": "http://localhost:3000/agent/rpc/collector"
        }
    ]
}
```

### Protocole de Communication

```
Agent A                         Agent B
   │                               │
   │──── JSON-RPC Request ────────►│
   │     { method: "qualify_lead", │
   │       params: {...} }         │
   │                               │
   │◄─── JSON-RPC Response ────────│
   │     { result: {...} }         │
   │                               │
```

## 8.2 UCP Protocol (Unified Commerce)

**Spec:** Google UCP (Agentic Commerce)

### Endpoints

| Endpoint | Methods | Fonction |
|----------|---------|----------|
| /api/ucp/products | GET | Catalogue produits |
| /api/ucp/cart | POST, PATCH, GET | Gestion panier |
| /api/ucp/checkout | POST | Processus paiement |
| /api/ucp/orders | GET | Historique commandes |

### États Checkout

```
incomplete → ready_for_complete → complete
```

### Auth

- Type: OAuth2
- Discovery: `/.well-known/openid-configuration`

---

# 9. COUCHE 8: MCPs

## 9.1 MCPs Globaux (4)

| MCP | Type | Fonction | Status |
|-----|------|----------|--------|
| fal | Remote URL | AI Media (vidéo, image, lip-sync) | ✅ Active |
| n8n-mcp | npx | Workflows n8n | ✅ Active |
| grok-search-mcp | npx | Recherche web via Grok | ✅ Active |
| grok2-image | npx | Génération images | ✅ Active |

## 9.2 MCPs Projet (10)

| MCP | Type | Fonction | Credentials | Status |
|-----|------|----------|-------------|--------|
| google-analytics | pipx | GA4 data | GOOGLE_APPLICATION_CREDENTIALS | ✅ |
| google-sheets | npx | Sheets CRUD | GOOGLE_APPLICATION_CREDENTIALS | ✅ |
| klaviyo | uvx | Email marketing | KLAVIYO_API_KEY | ✅ |
| chrome-devtools | npx | Browser automation | - | ✅ |
| shopify-dev | npx | Shopify dev API | SHOPIFY_ACCESS_TOKEN | ✅ |
| shopify-admin | npx | Shopify admin | SHOPIFY_ACCESS_TOKEN | ✅ |
| meta-ads | npx | Facebook/IG ads | META_ACCESS_TOKEN | ❌ Missing |
| apify | npx | Web scraping | APIFY_API_TOKEN | ❌ Trial expired |
| powerbi-remote | URL | BI dashboards | - | ⚠️ Non testé |
| stitch | URL | Data pipelines | - | ⚠️ Non testé |

---

# 10. COUCHE 9: GATEWAYS

## 10.1 LLM Global Gateway

**Fichier:** `automations/agency/core/gateways/llm-global-gateway.cjs`

```javascript
// Routage intelligent vers le meilleur provider
class LLMGateway {
    providers = [
        { name: 'grok', priority: 1, costPer1kTokens: 0.005 },
        { name: 'openai', priority: 2, costPer1kTokens: 0.01 },
        { name: 'anthropic', priority: 3, costPer1kTokens: 0.015 },
        { name: 'gemini', priority: 4, costPer1kTokens: 0.007 }
    ];

    async route(prompt, options = {}) {
        // Logique de sélection basée sur:
        // - Disponibilité
        // - Coût
        // - Performance historique
        // - Type de tâche
    }
}
```

## 10.2 Stripe Global Gateway

**Fichier:** `automations/agency/core/gateways/stripe-global-gateway.cjs`

| Fonction | Description |
|----------|-------------|
| createPaymentIntent() | Initier paiement |
| confirmPayment() | Confirmer paiement |
| createSubscription() | Abonnement récurrent |
| handleWebhook() | Events Stripe |

## 10.3 Payzone Gateway

**Fichier:** `automations/agency/core/gateways/payzone-gateway.cjs`

Gateway alternatif pour paiements EU (Maroc, etc.)

---

# 11. SERVICES VENDABLES

## 11.1 Packages B2C E-commerce

| Package | Scripts | Prix/mois |
|---------|---------|-----------|
| **Email Automation** | email-personalization, churn-prediction, Klaviyo flows | €500 |
| **Content Engine** | blog-generator, podcast-generator | €300 |
| **Analytics Suite** | ga4-sensor, retention-sensor + dashboard | €200 |
| **Dropshipping Kit** | cj, bigbuy, order-flow | €400 |
| **Voice Assistant** | voice-api, grok-voice | €600 |

## 11.2 Packages B2B PME

| Package | Scripts | Prix/mois |
|---------|---------|-----------|
| **Lead Generation** | sourcing-linkedin, sourcing-maps, lead-scoring | €800 |
| **CRM Automation** | hubspot-b2b-crm, lead-qualification | €500 |
| **Content Strategy** | content-strategist-agentic | €400 |

## 11.3 Skills Verticaux (White-label)

| Skill | Industrie | Prix setup |
|-------|-----------|------------|
| dental | Cabinet dentaire | €2000 |
| contractor | BTP/Construction | €2500 |
| property | Immobilier | €2000 |
| gym | Fitness | €1500 |
| school | Éducation | €2000 |

---

# 12. MATRICE DE DÉPENDANCES

## 12.1 Dépendances Credentials

| Composant | Variables Requises | Status |
|-----------|-------------------|--------|
| Sensors GA4 | GOOGLE_APPLICATION_CREDENTIALS, GA4_PROPERTY_ID | ✅ |
| Sensors GSC | GOOGLE_APPLICATION_CREDENTIALS | ✅ mais API disabled |
| Sensors Meta | META_ACCESS_TOKEN | ❌ Missing |
| Sensors TikTok | TIKTOK_API_KEY | ❌ Missing |
| Scripts Resilient | XAI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY | ✅ |
| Klaviyo | KLAVIYO_API_KEY, KLAVIYO_PRIVATE_KEY | ✅ |
| Shopify | SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN | ✅ |
| HubSpot | HUBSPOT_API_KEY | ❌ Empty |
| WordPress | WP_SITE_URL, WP_APP_PASSWORD | ✅ |

## 12.2 Dépendances Inter-Composants

```
autonomy-daemon.cjs
    └── doe-dispatcher.cjs
        └── automations-registry.json
        └── {script}.cjs
            └── marketing-science-core.cjs
            └── utils/telemetry.cjs
            └── gateways/llm-global-gateway.cjs
                └── AI Provider APIs

sensors/*-sensor.cjs
    └── pressure-matrix.json
        └── autonomy-daemon.cjs

a2a/server.js
    └── .agent/skills/*/SKILL.md
    └── LLM Gateway
```

---

*Document généré: 22/01/2026 15:30 UTC*
*Session 138 - Documentation Technique Approfondie*
*Total: 12 sections, ~500 lignes de documentation structurée*
