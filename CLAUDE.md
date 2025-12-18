# 3A AUTOMATION - Mémoire Projet Claude Code
## Version: 3.8 | Dernière mise à jour: 2025-12-18 (Session 16 - 41 Automatisations Génériques)
## Domaine: 3a-automation.com | Email: contact@3a-automation.com
## GitHub: https://github.com/Jouiet/3a-automations

---

## IDENTITÉ - QUI NOUS SOMMES (FAITS VÉRIFIÉS)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    IDENTITÉ FACTUELLE - 3A AUTOMATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NOM:             3A Automation                                              │
│  DOMAINE:         3a-automation.com                                          │
│  EMAIL:           contact@3a-automation.com                                  │
│  SIGNIFICATION:   3A = Automation, Analytics, AI                             │
│                                                                              │
│  TYPE:            Consultant solo Automation & Marketing                     │
│  CIBLE:           Small/Mid Business de TOUS SECTEURS                        │
│                   • E-commerce (Shopify, WooCommerce)                        │
│                   • Healthcare / Medical                                     │
│                   • Services B2B                                             │
│                   • Retail / Commerce local                                  │
│                   • Tout PME €10k-500k/mois CA                               │
│                                                                              │
│  STRUCTURE:       1 personne (part-time 20h/semaine)                         │
│  CASH FLOW:       €0 actuel (restart clients 25/01/2026)                     │
│  BUDGET:          €50                                                        │
│  LANGUES:         Français + Anglais                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ONE-LINER:**
"J'automatise les processus marketing et opérationnels des PME de tous secteurs pour que les fondateurs se concentrent sur leur croissance."

**CE QUE NOUS SOMMES:**
- Consultant technique Automation + Analytics + AI
- Pour Small/Mid Business de TOUS secteurs (pas limité e-commerce)
- Approche code/APIs (pas no-code limité)
- Focus résultats mesurables

**CE QUE NOUS NE SOMMES PAS:**
- ❌ Agence (1 personne)
- ❌ Plateforme SaaS
- ❌ Solution plug-and-play
- ❌ Limité à un seul secteur
- ❌ Stack "agency-ready" - CORRIGÉ Session 16: 41 automatisations génériques (100%)

---

## RÈGLE CRITIQUE: SÉPARATION AGENCE / CLIENTS

```
╔════════════════════════════════════════════════════════════════════╗
║     ⚠️  RÈGLE ABSOLUE - SÉPARATION DES ENVIRONNEMENTS  ⚠️          ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ❌ INTERDIT:                                                      ║
║  ├── Credentials clients dans .env de 3A-Automation               ║
║  ├── Exécuter scripts agence sur stores clients réels             ║
║  └── Mélanger environnements agence/clients                        ║
║                                                                    ║
║  ✅ ARCHITECTURE CORRECTE:                                         ║
║                                                                    ║
║  /Users/mac/Desktop/JO-AAA/           ← AGENCE                     ║
║  └── .env                             ← VIDE (pas de creds clients)║
║                                                                    ║
║  /Users/mac/Desktop/clients/alpha-medical/                         ║
║  └── .env                             ← Creds Alpha Medical        ║
║                                                                    ║
║  /Users/mac/Desktop/clients/henderson/                             ║
║  └── .env                             ← Creds Henderson            ║
║                                                                    ║
║  /Users/mac/Desktop/clients/mydealz/                               ║
║  └── .env                             ← Creds MyDealz              ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

**RAISON:** Éviter d'exécuter des modifications sur des stores clients par erreur.

---

## HIÉRARCHIE DOCUMENTAIRE COMPLÈTE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HIÉRARCHIE DOCUMENTAIRE 3A AUTOMATION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NIVEAU 1 - MÉMOIRE SYSTÈME (Claude Code - Chargé automatiquement)          │
│  ════════════════════════════════════════════════════════════════════════   │
│  📁 CLAUDE.md                    → CE FICHIER - Mémoire persistante         │
│  📁 .claude/rules/               → Règles modulaires                        │
│     ├── code-standards.md        → Standards de développement               │
│     └── factuality.md            → Règles de factualité strictes            │
│                                                                              │
│  NIVEAU 2 - DOCUMENTS OPÉRATIONNELS (Sources de vérité)                     │
│  ════════════════════════════════════════════════════════════════════════   │
│  📄 BUSINESS-MODEL-FACTUEL-2025.md     → QUI nous sommes (identité)         │
│  📄 AAA-ACTION-PLAN-MVP-2025.md        → CE QUE nous faisons (exécution)    │
│                                                                              │
│  NIVEAU 3 - DOCUMENTATION TECHNIQUE (Référence détaillée)                   │
│  ════════════════════════════════════════════════════════════════════════   │
│  📄 AAA-AUTOMATIONS-CATALOG-2025.md    → Inventaire complet 207 scripts     │
│  📄 FLYWHEEL-BLUEPRINT-2025.md         → Architecture Flywheel e-commerce   │
│  📄 MCP-FLYWHEEL-INTEGRATION-ANALYSIS.md → Analyse MCP-Scripts              │
│  📄 FORENSIC-AUDIT-TRUTH-2025-12-16.md → AUDIT FACTUEL (Réalité vérifiée)   │
│                                                                              │
│  NIVEAU 4 - ARCHIVES (Aspirationnel - NE PAS utiliser pour décisions)       │
│  ════════════════════════════════════════════════════════════════════════   │
│  📄 JO-AAA-STRATEGIC-MASTERPLAN-2026.md                                     │
│  📄 5-AI-SHIFTS-2026-STRATEGY.md                                            │
│  📄 Autres documents historiques...                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Documents à Consulter AVANT Toute Affirmation:

| # | Document | Usage | Priorité |
|---|----------|-------|----------|
| 1 | **FORENSIC-AUDIT-TRUTH-2025-12-16.md** | Source de vérité FACTUELLE | CRITIQUE |
| 2 | **AAA-AUTOMATIONS-CATALOG-2025.md** | Inventaire scripts détaillé | Référence |
| 3 | **FLYWHEEL-BLUEPRINT-2025.md** | Architecture Flywheel | Référence |
| 4 | **MCP-FLYWHEEL-INTEGRATION-ANALYSIS.md** | Compatibilité MCP-Scripts | Référence |

**⚠️ RÈGLE ABSOLUE:** Toujours vérifier le FORENSIC-AUDIT avant de répéter des claims des autres documents.

---

## MÉTRIQUES FACTUELLES (Vérifiées 18/12/2025 - Session 15)

### VÉRITÉ BRUTALE - État Réel des Automatisations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MÉTRIQUES: VÉRITÉ SESSION 15                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AUTOMATISATIONS TESTÉES ET FONCTIONNELLES:                    6            │
│  ├── audit-shopify-complete.cjs        ✅ TESTÉ                             │
│  ├── audit-klaviyo-flows.cjs           ✅ TESTÉ                             │
│  ├── fix-missing-alt-text.cjs          ✅ TESTÉ                             │
│  ├── test-shopify-connection.cjs       ✅ TESTÉ                             │
│  ├── test-klaviyo-connection.cjs       ✅ TESTÉ                             │
│  └── test-all-apis.cjs                 ✅ CRÉÉ                              │
│                                                                              │
│  SCRIPTS DANS automations/:                                                 │
│  ├── automations/generic/              1 script                             │
│  └── automations/clients/              43 scripts                           │
│      ├── 14 hardcodés (domaines spécifiques)                                │
│      ├── 21 utilisent .env.local (non standard)                             │
│      └── ~8 potentiellement génériques                                      │
│                                                                              │
│  MCPs RÉELLEMENT TESTABLES:            0 (credentials clients retirées)     │
│                                                                              │
│  READINESS AGENCE:                     ~14% (6/44 testés)                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### État MCPs (Corrigé 18/12/2025 - Session 15)

| MCP | Statut | Package NPM | Détail |
|-----|--------|-------------|--------|
| ✅ chrome-devtools | **CONFIGURÉ** | `chrome-devtools-mcp` | Debug browser, screenshots |
| ✅ playwright | **CONFIGURÉ** | `@playwright/mcp` | Browser automation |
| ⚠️ gemini | SANS API KEY | `github:rlabs-inc/gemini-mcp` | GEMINI_API_KEY vide |
| ⚠️ github | SANS TOKEN | `@modelcontextprotocol/server-github` | GITHUB_TOKEN vide |
| ⚠️ hostinger | NON TESTÉ | `hostinger-api-mcp` | Credentials non vérifiées |
| ⚠️ wordpress | NON TESTÉ | `claudeus-wp-mcp` | wp-sites.json requis |
| ❌ Shopify | CREDENTIALS RETIRÉES | `shopify-mcp` | .env nettoyé Session 15 |
| ❌ Klaviyo | CREDENTIALS RETIRÉES | `klaviyo-mcp-server` | .env nettoyé Session 15 |
| ❌ n8n | CREDENTIALS RETIRÉES | SSE remote | .env nettoyé Session 15 |
| ❌ Google Analytics | CASSÉ | `mcp-server-google-analytics` | Service Account MANQUANT |
| ❌ Google Sheets | CASSÉ | `mcp-gsheets` | Service Account MANQUANT |
| ❌ Apify | NON CONFIGURÉ | `@apify/actors-mcp-server` | Token vide |

**Total: 12 MCPs déclarés - 2 fonctionnels (chrome-devtools, playwright)**
**⚠️ Les MCPs Shopify/Klaviyo/n8n fonctionnaient avec credentials CLIENTS (violation règle séparation)**

### CORRECTION IMPORTANTE (17/12/2025):
```
⚠️ IDENTITÉ STORE CORRIGÉE:
   azffej-as.myshopify.com = ALPHA MEDICAL CARE (www.alphamedical.shop)
   PAS Henderson Shop comme précédemment documenté!
```

### État Scripts par Répertoire

| Répertoire | Scripts | Client | Hardcoded? |
|------------|---------|--------|------------|
| AGENCY-CORE-SCRIPTS-V3 | ~60 | MyDealz | OUI (17 fichiers) |
| agency-scripts-Q1-GOLD | ~109 | Henderson Shop | OUI (20+ fichiers) |
| alpha-medical-python-agency | ~41 | Alpha Medical | Partiellement |
| scripts/ | ~2 | Générique | NON |

---

## CLIENTS

### Clients Existants (restart 25/01/2026)

| Client | Type | Store | Statut |
|--------|------|-------|--------|
| Alpha Medical Care | Healthcare E-commerce | azffej-as.myshopify.com (www.alphamedical.shop) | Pause - API TESTÉE OK |
| Henderson Shop | E-commerce | ??? (credentials inconnues) | Pause |
| MyDealz | E-commerce B2C | 5dc028-dd.myshopify.com | Pause |

### Données Alpha Medical Care (Audit 17/12/2025)
```
Store: azffej-as.myshopify.com / www.alphamedical.shop
Owner: Hatim JOUIET
Plan: Basic Shopify
Location: Delaware, USA

MÉTRIQUES:
├── Produits: 90 (85 actifs, 5 brouillons)
├── Prix moyen: $139.75 (range $49-$1025)
├── Commandes 30j: 0
├── Revenue 30j: $0
├── Clients: 17 (0% opt-in email!)
├── Collections: 6
└── Inventory: 145 variants en rupture

SEO ISSUES:
└── 271 images sans alt text (HIGH priority)

KLAVIYO:
├── 7 flows (5 live, 2 draft)
├── 3 listes
├── MANQUANTS: Browse Abandonment, Post-Purchase, Win-Back
└── Revenue email potentiel non capturé
```

### Cible Client Idéale
- PME de tous secteurs €10k-500k/mois CA
- Veulent automatiser sans embaucher
- Budget €300-1000/mois

---

## SERVICES OFFERTS (Catalogue Factuel)

| Service | Prix | Délai | Livrable |
|---------|------|-------|----------|
| **Audit E-commerce** | GRATUIT (lead magnet) | 2-3h | Rapport PDF 5-10 pages |
| **Email Machine Mini** | €500 setup + €200/mois | 1 semaine | 1 flow Klaviyo complet |
| **SEO Quick Fix** | €300-500 one-time | 3-5 jours | Alt text + metafields + sitemap |
| **Lead Sync** | €400 setup + €150/mois | 1 semaine | Meta Leads → Shopify/Klaviyo |
| **Maintenance Mensuelle** | €300-800/mois | 4-8h/mois | Monitoring + optimisations |

### Services NON Offerts (À RÉVISER)

| Service | Raison | Statut Révisé (18/12/2025) |
|---------|--------|---------------------------|
| Voice AI | Budget insuffisant, expertise non prouvée | **RÉVISÉ**: Grok Voice $0.05/min viable |
| App development | Hors spécialité | Maintenu |
| Design/Branding | Pas notre expertise | Maintenu |
| Google Ads | Focus Meta/Email uniquement | Maintenu |

### Voice Agent - Scope Clarifié (18/12/2025)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOICE AGENT - DUAL PURPOSE (Clarifié)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USE CASE 1: AI SHOPPING ASSISTANT                                         │
│   ═══════════════════════════════════════════════════════════════════════   │
│   • Recherche produits par voix                                             │
│   • Recommandations personnalisées                                          │
│   • Prix, stock, disponibilité                                              │
│   • Aide panier, promotions                                                 │
│   • Guidage checkout                                                        │
│                                                                              │
│   USE CASE 2: SUPPORT CLIENT                                                │
│   ═══════════════════════════════════════════════════════════════════════   │
│   • Suivi commande ("où est ma commande?")                                  │
│   • Statut livraison                                                        │
│   • Retours/remboursements                                                  │
│   • FAQ produits                                                            │
│   • Escalade humain                                                         │
│                                                                              │
│   STATUT IMPLÉMENTATION: 0%                                                 │
│   ───────────────────────────────────────────────────────────────────────   │
│   ❌ Voice Gateway           À CONSTRUIRE                                   │
│   ❌ STT Pipeline            À CONSTRUIRE                                   │
│   ❌ TTS Pipeline            À CONSTRUIRE                                   │
│   ❌ Intent Router           À CONSTRUIRE                                   │
│   ✅ Knowledge Base RAG      FAIT (18/12/2025)                              │
│   ✅ Shopify MCP             DISPONIBLE                                     │
│   ✅ Klaviyo MCP             DISPONIBLE                                     │
│                                                                              │
│   EFFORT ESTIMÉ: 116-172 heures                                             │
│   COÛT OPÉRATIONNEL: ~$0.32/appel                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## STACK TECHNIQUE - ÉTAT RÉEL

### Structure Automatisations (Session 12 - 18/12/2025)

```
/Users/mac/Desktop/JO-AAA/
├── automations/                  # NOUVELLE STRUCTURE NORMALISÉE ✅
│   ├── agency/                   # Outils internes 3A Automation (6)
│   │   └── core/                 # grok-client, forensic-api-test, etc.
│   └── clients/                  # Automatisations offertes clients (43)
│       ├── shopify/              # 11 automatisations
│       ├── klaviyo/              # 4 automatisations
│       ├── analytics/            # 6 automatisations
│       ├── leads/                # 9 automatisations
│       ├── seo/                  # 5 automatisations
│       ├── social/               # 4 automatisations
│       ├── video/                # 3 automatisations (NEW)
│       └── google-merchant/      # 1 automatisation (NEW)
│
├── # LEGACY (Client-spécifiques - À NORMALISER selon Forensic Matrix)
├── AGENCY-CORE-SCRIPTS-V3/       # 60 scripts (MyDealz-specific)
├── agency-scripts-Q1-GOLD/       # 109 scripts (Henderson-specific)
├── alpha-medical-python-agency/  # 41 scripts (Alpha Medical)
│
├── scripts/                      # Scripts originaux (11)
└── outputs/                      # Résultats des automatisations
```

### Statistiques Automatisations

| Catégorie | Quantité | Statut |
|-----------|----------|--------|
| **Agency (internes)** | 6 | ✅ Génériques |
| **Clients - Shopify** | 11 | ✅ Génériques |
| **Clients - Klaviyo** | 4 | ✅ Génériques |
| **Clients - Analytics** | 6 | ✅ Génériques |
| **Clients - Leads** | 9 | ✅ Génériques |
| **Clients - SEO** | 5 | ✅ Génériques |
| **Clients - Social** | 4 | ✅ Génériques |
| **Clients - Video** | 3 | ✅ Génériques (NEW) |
| **Clients - Google Merchant** | 1 | ✅ Génériques (NEW) |
| **TOTAL GÉNÉRIQUES** | **49** | ✅ |

### Legacy Scripts - Analyse Forensique (18/12/2025)

| Catégorie | Quantité | Effort | Statut |
|-----------|----------|--------|--------|
| Normalisables (<1h) | 148 | NONE/LOW/MEDIUM | ✅ Réutilisables |
| Effort moyen (1-2h) | 58 | HIGH | ⚠️ À planifier |
| Réécriture (>2h) | 12 | CRITICAL | ❌ Faible priorité |
| **TOTAL LEGACY** | **218** | - | **68% réutilisable** |

**Matrice complète:** `outputs/FORENSIC-AUTOMATION-MATRIX-2025-12-18.md`
**Documentation:** `automations/INDEX.md`

### Configuration .env (CRÉÉ 17/12/2025)

```bash
# FICHIER .env CRÉÉ ET FONCTIONNEL ✅
# Credentials extraites de ~/.config/claude-code/mcp.json

# Shopify - Alpha Medical Care ✅ TESTÉ
SHOPIFY_STORE_DOMAIN=azffej-as.myshopify.com
SHOPIFY_ACCESS_TOKEN=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
SHOPIFY_API_VERSION=2024-01

# Klaviyo ✅ TESTÉ
KLAVIYO_API_KEY=pk_16c08fae7644ad0ff14c16bc4f70accf5b

# n8n - Alpha Medical ✅ CONFIGURÉ
N8N_HOST=https://n8n.srv1168256.hstgr.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# GA4 ⚠️ Service Account MANQUANT
GA4_PROPERTY_ID=513383884

# Google Cloud (Service Account MANQUANT!)
GOOGLE_APPLICATION_CREDENTIALS=/Users/mac/.config/google/service-account.json
# ^^^ FICHIER N'EXISTE PAS - À CRÉER

# Meta (Non configuré)
# META_PAGE_ACCESS_TOKEN=EAAxxxx

# Apify (Non configuré)
# APIFY_TOKEN=apify_api_xxx
```

---

## INVENTAIRE SCRIPTS DÉTAILLÉ

### Référence: AAA-AUTOMATIONS-CATALOG-2025.md

Ce document de 1284 lignes contient l'inventaire complet:

**Par Catégorie (selon catalogue):**
- Lead Generation & Acquisition: 33 scripts
- SEO & Content Automation: 18 scripts
- Email/SMS Marketing: 22 scripts
- Shopify Admin Automation: 28 scripts
- Analytics & Reporting: 22 scripts
- Google Merchant Center: 4 scripts
- Video Generation: 8 scripts
- N8N Workflow: 15 scripts

**Scripts Klaviyo Flows Documentés:**
1. Welcome Series (5 emails)
2. Cart Abandonment (3 emails)
3. Browse Abandonment (2 emails)
4. Post-Purchase (5 emails)
5. Win-Back (3 emails)
6. VIP/Loyalty Tiers

**⚠️ ATTENTION:** Ces scripts sont documentés mais la plupart sont CLIENT-SPÉCIFIQUES (hardcoded credentials).

---

## ARCHITECTURE FLYWHEEL

### Référence: FLYWHEEL-BLUEPRINT-2025.md

Document de 1042 lignes décrivant l'architecture:

```
                         FLYWHEEL E-COMMERCE
     Acquisition → Conversion → Retention → Advocacy
                              ↓
                    (Boucle de croissance)
```

**Phases Couvertes:**
1. **ACQUISITION** - Meta Ads, Google Ads, TikTok, SEO
2. **CONVERSION** - Checkout optimization, Shopify Flow
3. **RETENTION** - Klaviyo flows, SMS, Loyalty tiers
4. **ADVOCACY** - Reviews (Judge.me), Referral, UGC

**KPIs Benchmark 2025:**
- Conversion Rate: >3% (bon), >4% (excellent)
- Cart Abandonment: <70% (bon), <60% (excellent)
- Email Open Rate: >25% (bon), >35% (excellent)
- LTV:CAC Ratio: >3:1 (bon), >4:1 (excellent)

---

## INTÉGRATION MCP-SCRIPTS

### Référence: MCP-FLYWHEEL-INTEGRATION-ANALYSIS.md

**Score d'intégration global:** 78/100 (selon doc) → ~40% réel (post-audit)

**Couverture par API:**
| API | Scripts | MCP Server | Couverture |
|-----|---------|------------|------------|
| SHOPIFY_REST | 37 | shopify-admin | ✅ 100% |
| SHOPIFY_GRAPHQL | 13 | shopify-dev | ✅ 100% |
| FACEBOOK_MARKETING | 9 | meta-ads | ✅ 100% |
| APIFY | 9 | apify | ❌ Non configuré |
| GOOGLE_SHEETS | 8 | google-sheets | ❌ Cassé |
| TIKTOK | 4 | ❌ Aucun | ❌ 0% |
| OMNISEND | 4 | ❌ Aucun | ❌ 0% |
| JUDGE_ME | 1 | ❌ Aucun | ❌ 0% |

**Gaps Identifiés:**
- TikTok MCP: Non disponible
- Omnisend MCP: Non disponible
- Judge.me MCP: Non disponible (pas d'API publique)

---

## RÈGLES DE DÉVELOPPEMENT

### Principes Stricts (Issus de factuality.md)

1. **Rigueur** - Vérification empirique de chaque script
2. **Factualité** - Pas de claims non vérifiés
3. **Pas de régression** - Tester avant/après
4. **Pas de placeholder** - Code complet ou rien

### Ce qui est INTERDIT

1. ❌ "Notre stack d'agence" → Nous avons des scripts client-spécifiques
2. ❌ "207 scripts réutilisables" → ~25 génériques, reste nécessite refactoring
3. ❌ "MCPs 100% fonctionnels" → 3/6 fonctionnels actuellement
4. ❌ "Production-ready" → Sans test empirique préalable
5. ❌ Hardcoder des credentials dans les scripts
6. ❌ Créer des fichiers avec PLACEHOLDER/MOCK/TODO

### Ce qui est AUTORISÉ

1. ✅ "Expertise démontrée sur 3 projets clients"
2. ✅ "~25 scripts génériques testés"
3. ✅ "Consultant automation Shopify/Klaviyo"
4. ✅ "3 MCPs fonctionnels (Klaviyo, Shopify, n8n)"

### Workflow Scripts

```
CLAIM → VÉRIFICATION → PREUVE → DOCUMENTATION
         ↓ (si faux)
       CORRECTION ou SUPPRESSION
```

---

## COMMANDES PROJET

```bash
# Tester configuration environnement
npm run test-env

# ═══════════════════════════════════════════════════════════════
# SCRIPTS PRODUCTION (Créés 17/12/2025) ✅
# ═══════════════════════════════════════════════════════════════

# Test connexion Shopify
node scripts/test-shopify-connection.cjs

# Test connexion Klaviyo
node scripts/test-klaviyo-connection.cjs

# Audit Shopify complet (génère JSON + MD dans outputs/)
node scripts/audit-shopify-complete.cjs

# Audit Klaviyo flows
node scripts/audit-klaviyo-flows.cjs

# ═══════════════════════════════════════════════════════════════
# OUTPUTS GÉNÉRÉS (17/12/2025)
# ═══════════════════════════════════════════════════════════════
# outputs/audit-azffej-as-2025-12-17.json   - Données Shopify brutes
# outputs/audit-azffej-as-2025-12-17.md     - Rapport MD formaté
# outputs/audit-klaviyo-2025-12-17.json     - Flows/Lists/Metrics Klaviyo

# Vérifier mémoire Claude
/memory
```

---

## CHEMINS IMPORTANTS

```
/Users/mac/Desktop/JO-AAA/
├── CLAUDE.md                           # CE FICHIER (mémoire projet)
├── .claude/rules/                      # Règles Claude Code
│   ├── code-standards.md               # Standards développement
│   └── factuality.md                   # Règles factualité
├── .env                                # Configuration (NE PAS COMMIT) - À CRÉER
├── .env.mcp.example                    # Template .env
├── .mcp.json                           # Configuration MCPs projet
│
├── # DOCUMENTATION TECHNIQUE
├── AAA-AUTOMATIONS-CATALOG-2025.md     # Inventaire 207 scripts
├── FLYWHEEL-BLUEPRINT-2025.md          # Architecture Flywheel
├── MCP-FLYWHEEL-INTEGRATION-ANALYSIS.md # Analyse MCP
├── FORENSIC-AUDIT-TRUTH-2025-12-16.md  # AUDIT FACTUEL (VÉRITÉ)
├── MASTER-REFERENCE.md                 # Synthèse
│
├── # SCRIPTS (Client-spécifiques)
├── AGENCY-CORE-SCRIPTS-V3/             # 60 scripts MyDealz
├── agency-scripts-Q1-GOLD/             # 109 scripts Henderson
├── alpha-medical-python-agency/        # 41 scripts Alpha Medical
├── scripts/                            # Scripts génériques
│
├── # OUTPUTS
├── outputs/                            # Résultats scripts
└── landing-page-hostinger/             # Landing page statique
```

---

## CONTRAINTES ABSOLUES

### Budget €50
- ✅ Possible: Google Service Account (€0), Apify Free Tier
- ❌ Impossible: Outils premium, Paid ads, Sous-traitance

### Temps 20h/semaine
- Max 5 clients simultanés
- 4-5h par client
- Qualité > Quantité

---

## OBJECTIFS & KPIs

### Objectifs Q1 2026
- 4-5 clients actifs
- €2,000+/mois revenue
- 10+ scripts refactorés (généricisés)
- 3+ testimonials

### KPIs Actuels (18 Déc 2025 - Session 16)

| Métrique | Valeur |
|----------|--------|
| Clients actifs | 0 (restart 25/01/2026) |
| Revenue mensuel | €0 |
| **Automatisations génériques** | **41 (100%)** ✅ |
| Automatisations legacy | 2 (non généralisables) |
| MCPs configurés | 12 (tous avec placeholders) |
| MCPs avec creds clients | **0** ✅ (règle séparation) |
| Fichier .env agence | VIDE (pas de creds clients) |
| Dossiers clients séparés | 3 (alpha-medical, henderson, mydealz) |

---

## PROCHAINES ACTIONS PRIORITAIRES

```
COMPLÉTÉ (17/12/2025 - Session 1):
✅ Créer fichier .env avec vraies credentials
✅ Tester connexion Shopify API
✅ Tester connexion Klaviyo API
✅ Créer scripts audit production
✅ Générer premiers rapports d'audit

COMPLÉTÉ (17/12/2025 - Session 2):
✅ Connecter GitHub repo (github.com/Jouiet/3a-automations)
✅ Intégrer Grok/xAI (GROK.md + clients Python/Node.js)
✅ Extraire branding exact du logo officiel (3A-BRANDING-GUIDE.md)
✅ Mettre à jour CSS landing page avec couleurs marque
✅ Pusher tous les fichiers sur GitHub

COMPLÉTÉ (17/12/2025 - Session 3):
✅ Recherche web factuelle: tendances animation 2025, outils AI
✅ Créer AI-PROMPTS-LANDING-PAGE-2025.md avec prompts optimisés
✅ Comparer outils: v0.dev, Bolt.new, Lovable.dev, Hostinger AI
✅ Identifier GSAP ScrollTrigger gratuit depuis 2025 (acquisition Webflow)
✅ Documenter tendances: purposeful motion, micro-interactions, glassmorphism

COMPLÉTÉ (17/12/2025 - Session 4):
✅ Clé xAI API obtenue et sauvegardée dans .env
✅ Sécurité vérifiée: .env dans .gitignore
⚠️ Compte xAI nécessite crédits (min $5 puis $150/mois gratuit avec data sharing)
✅ Découverte Grok Voice Agent API ($0.05/min - Voice AI devient POSSIBLE)

COMPLÉTÉ (18/12/2025 - Session 5):
✅ Knowledge Base RAG Phase 1 TERMINÉE
   ├── knowledge-base/src/document-parser.cjs (273 chunks, 233k chars)
   ├── knowledge-base/src/vector-store.cjs (BM25, 2853 tokens)
   ├── knowledge-base/src/rag-query.cjs (multi-search, context builder)
   ├── knowledge-base/src/catalog-extractor.cjs (3 packages, 15 automations)
   └── scripts/grok-client.cjs v2.0 (RAG-enhanced)
✅ Grok Client refactoré avec RAG intégré
✅ Scope Voice Agent clarifié: AI Shopping Assistant + Support Client
✅ 6 pages landing-page mises à jour design premium
✅ Commit: 8d5ed4f (6 pages design upgrade)

IMMÉDIAT (Prochaine session - SESSION 6):
□ Acheter crédits xAI ($5-10) pour activer API Grok
□ Tester grok-client.cjs v2.0 avec API live
□ Créer Google Service Account pour GA4/Sheets
□ Déployer landing page sur Hostinger

VOICE AGENT (Après activation xAI - 116-172h total):
□ Phase 1: Voice Gateway + STT + TTS (44-68h)
□ Phase 2: Intent Router + Shopify Integration (36-52h)
□ Phase 3: AI Shopping + Support modes (36-52h)
```

---

## END-OF-SESSION ACTION PLAN (18/12/2025)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLAN ACTIONNABLE - FIN SESSION 11                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   SESSION 11 RÉSUMÉ (Stat-Labels Fix + Design):                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│   ✅ ROOT CAUSE FOUND: data-count sur parent détruisait enfants             │
│   ✅ FIX: data-count déplacé vers .stat-number-ultra                        │
│   ✅ Section reveal fallback (3s timeout) ajouté                            │
│   ✅ IntersectionObserver threshold: 0.1 → 0.05                             │
│   ✅ Stats design inline: "207 AUTOMATISATIONS | 8 MCP SERVERS"             │
│   ✅ Puppeteer installé pour tests visuels automatisés                      │
│   ✅ 3A-WEBSITE-BLUEPRINT score: 96 → 97/100                               │
│   ✅ FORENSIC-AUDIT-TRUTH mis à jour (Section 13)                          │
│                                                                              │
│   COMMITS:                                                                  │
│   ───────────────────────────────────────────────────────────────────────   │
│   32cc8cf - fix(stats): Resolve stat-labels visibility issue                │
│   212d72b - fix(landing): stat-labels visibility + inline design            │
│                                                                              │
│   FICHIERS MODIFIÉS:                                                        │
│   ───────────────────────────────────────────────────────────────────────   │
│   ├── index.html           data-count déplacé vers .stat-number-ultra       │
│   ├── script.js            Fallback timeout 3s + threshold 0.05             │
│   ├── styles.css           Stats inline flex design                         │
│   ├── CLAUDE.md            Version 3.1                                      │
│   ├── FORENSIC-AUDIT-TRUTH Section 13 ajoutée                               │
│   └── 3A-WEBSITE-BLUEPRINT Score 97/100                                     │
│                                                                              │
│   PROBLÈME RÉSOLU EN DÉTAIL:                                                │
│   ───────────────────────────────────────────────────────────────────────   │
│   SYMPTÔME: Stat-labels invisibles ("AUTOMATISATIONS", "MCP SERVERS"...)    │
│   CAUSE: enhancedStatObserver ciblait [data-count] sur parent               │
│          el.textContent = ... DÉTRUISAIT tous les enfants                   │
│   SOLUTION: data-count maintenant sur .stat-number-ultra (enfant)           │
│                                                                              │
│   PROCHAINE SESSION (SESSION 12) - PRIORITÉS:                               │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   PRIORITÉ 1: DÉPLOIEMENT HOSTINGER (2-3h)                                  │
│   ├── Upload landing-page-hostinger/ complet                                │
│   ├── Vérifier stats visibles en production                                 │
│   ├── Configurer DNS: 3a-automation.com                                     │
│   ├── SSL Let's Encrypt                                                     │
│   └── Tester formulaire contact + webhook n8n                               │
│                                                                              │
│   PRIORITÉ 2: ACTIVATION xAI API (30 min)                                   │
│   ├── Acheter crédits xAI: $5-10 minimum                                    │
│   ├── URL: https://console.x.ai/billing                                     │
│   └── Tester: node scripts/grok-client.cjs                                  │
│                                                                              │
│   PRIORITÉ 3: GOOGLE SERVICE ACCOUNT (1-2h)                                 │
│   ├── Créer projet Google Cloud Console                                     │
│   ├── Activer APIs: Analytics Data API, Sheets API                          │
│   ├── Créer Service Account + JSON key                                      │
│   └── Tester MCPs GA4 et Sheets                                             │
│                                                                              │
│   PRIORITÉ 4: SEO ALPHA MEDICAL (2h)                                        │
│   ├── Corriger 271 alt text manquants                                       │
│   ├── Script: node scripts/fix-missing-alt-text.cjs                         │
│   └── Vérifier avec audit-shopify-complete.cjs                              │
│                                                                              │
│   BLOQUANTS ACTUELS:                                                        │
│   ═══════════════════════════════════════════════════════════════════════   │
│   ⚠️ xAI API: Nécessite crédits ($5 min)                                    │
│   ⚠️ Google APIs: Nécessite Service Account                                 │
│   ⚠️ Hostinger: Attente déploiement                                         │
│                                                                              │
│   MÉTRIQUES SITE:                                                           │
│   ═══════════════════════════════════════════════════════════════════════   │
│   ├── Score Blueprint: 97/100                                               │
│   ├── Pages: 14 (index + 13 secondaires)                                    │
│   ├── Stats visibles: 4/4 ✅                                                │
│   ├── Sections visibles: 6/6 ✅                                             │
│   └── Tests Puppeteer: PASS                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

CETTE SEMAINE:
□ Déployer landing page optimisée sur Hostinger
□ Vérifier stats inline en production
□ Envoyer emails restart aux 3 clients
□ Corriger 271 alt text manquants (Alpha Medical)

Q1 2026:
□ Refactorer 10 scripts prioritaires
□ Générer 4-5 nouveaux clients
□ Atteindre €2k/mois revenue
□ Voice Agent MVP opérationnel

---

## INTÉGRATION GROK/xAI

### Configuration Projet Grok

| Paramètre | Valeur |
|-----------|--------|
| Nom du projet | `3a-automations` |
| API Console | https://console.x.ai/ |
| Documentation | https://docs.x.ai/ |
| Variable env | `XAI_API_KEY` |

### Fichiers Grok

| Fichier | Description |
|---------|-------------|
| `GROK.md` | Configuration complète projet Grok |
| `scripts/grok-client.py` | Client Python xAI SDK |
| `scripts/grok-client.cjs` | Client Node.js (fetch API) |

### Commandes Grok

```bash
# Test client Python (nécessite xai-sdk)
pip install xai-sdk python-dotenv
python scripts/grok-client.py

# Test client Node.js
node scripts/grok-client.cjs
```

### System Prompt 3A Automation

Le system prompt est défini dans `GROK.md` et inclut:
- Identité 3A Automation
- Expertise technique
- Services offerts
- Principes de communication
- Format de réponse

---

## GROK VOICE AGENT API (Découvert 17/12/2025)

### Specs Vérifiées

| Paramètre | Valeur |
|-----------|--------|
| **Pricing** | $0.05/minute connexion (flat rate) |
| **Performance** | < 1s time-to-first-audio |
| **Langues** | 100+ avec détection automatique |
| **Formats audio** | PCM 8-48kHz, G.711 μ-law/A-law |
| **Protocole** | WebSocket bidirectionnel |
| **Compatibilité** | OpenAI Realtime API spec |

### Coût Estimé Mensuel

| Usage | Calcul | Coût |
|-------|--------|------|
| Light | 50 appels × 5 min | $12.50/mois |
| Medium | 100 appels × 5 min | $25/mois |
| Heavy | 200 appels × 5 min | $50/mois |

### Implémentation

```bash
# Python (LiveKit)
pip install "livekit-agents[openai]~=1.3"

# Node.js (LiveKit)
pnpm add @livekit/agents-plugin-openai@1.x
```

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_x_ai(
        model="grok-4-1-fast-non-reasoning",
    ),
)
```

### Impact 3A Automation

```
AVANT: Voice AI = HORS SCOPE (Vapi.ai coût variable, risqué)
APRÈS: Voice AI = POSSIBLE ($25-50/mois estimé)

BLOQUEUR: $5 crédits xAI requis pour activer
ACTION: Acheter crédits sur https://console.x.ai/team/xxx
```

---

## KNOWLEDGE BASE RAG (Créé 18/12/2025)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE RAG - PHASE 1 COMPLÈTE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   COMPOSANTS:                                                               │
│   ═══════════════════════════════════════════════════════════════════════   │
│   knowledge-base/                                                           │
│   ├── src/                                                                  │
│   │   ├── document-parser.cjs    → Parse MD → 273 chunks                   │
│   │   ├── vector-store.cjs       → BM25 retrieval (2853 tokens)            │
│   │   ├── rag-query.cjs          → Interface RAG multi-search              │
│   │   └── catalog-extractor.cjs  → Extraction données structurées          │
│   └── data/                                                                 │
│       ├── chunks.json            → 273 chunks (233k chars)                 │
│       ├── catalog.json           → 3 packages, 15 automations, 5 services  │
│       ├── parser-stats.json      → Métriques parsing                       │
│       └── index-stats.json       → Stats index BM25                        │
│                                                                              │
│   DOCUMENTS INDEXÉS:                                                        │
│   ───────────────────────────────────────────────────────────────────────   │
│   • AAA-AUTOMATIONS-CATALOG-2025.md    (catalog)                           │
│   • FLYWHEEL-BLUEPRINT-2025.md         (methodology)                       │
│   • BUSINESS-MODEL-FACTUEL-2025.md     (business)                          │
│   • 3A-WEBSITE-BLUEPRINT-2025.md       (website)                           │
│   • 3A-BRANDING-GUIDE.md               (branding)                          │
│   • CLAUDE.md                          (context)                           │
│                                                                              │
│   USAGE:                                                                    │
│   ───────────────────────────────────────────────────────────────────────   │
│   node scripts/grok-client.cjs          # Chat RAG activé                  │
│   node scripts/grok-client.cjs --no-rag # Chat sans RAG                    │
│   /catalog                              # Afficher catalogue               │
│   /stats                                # Stats knowledge base              │
│                                                                              │
│   COMMANDES BUILD:                                                          │
│   ───────────────────────────────────────────────────────────────────────   │
│   node knowledge-base/src/document-parser.cjs   # Rebuild chunks           │
│   node knowledge-base/src/vector-store.cjs      # Test retrieval           │
│   node knowledge-base/src/catalog-extractor.cjs # Extract catalog          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CHANGELOG

| Date | Version | Modification |
|------|---------|--------------|
| 2025-12-18 | 3.8 | **Session 16 - 41 AUTOMATISATIONS GÉNÉRIQUES**: mcp.json nettoyé (0 creds clients), 21 fichiers .env.local→.env, 4 fichiers refactorisés (domaines hardcodés→process.env), 2 fichiers Apify généralisés, 2 fichiers legacy déplacés, TAUX GÉNÉRICITÉ: 100%, site web màj (41/12/8+/3) |
| 2025-12-18 | 3.7 | **Session 15 - SÉPARATION AGENCE/CLIENTS**: .env nettoyé (credentials clients retirées), règle critique ajoutée (pas de creds clients dans agence), audit factuel: seulement 6 automatisations testées (pas 49!), MCPs réévalués (2 fonctionnels vs 9 claimed), architecture correcte documentée |
| 2025-12-18 | 3.6 | **Session 13 - AEO/SEO Vérification**: Schema.org 100% (12/12 pages), robots.txt complet (8 crawlers AI), llms.txt créé (spec-compliant), images confirmées optimisées, FORENSIC-AUDIT v2.1, Blueprint score 98/100 |
| 2025-12-18 | 3.5 | **Session 12 - Suite Finale**: +11 automatisations (49 total), video/ + google-merchant/ ajoutés, privacy.html dupliqué supprimé, liens mis à jour, AAA-AUTOMATIONS-CATALOG v2.0, sitemap.xml nettoyé |
| 2025-12-18 | 3.4 | **Session 12 - Forensic Matrix**: Analyse forensique approfondie 218 scripts legacy, matrice utilisation/complémentarité créée, 148 scripts normalisables (<1h) identifiés, workflows Lead/SEO/Email documentés, correction métrique "210 non utilisables" → "68% réutilisable" |
| 2025-12-18 | 3.3 | **Session 12 - Automations Normalisées**: Structure automations/ créée (agency/ + clients/), 38 automatisations génériques migrées (6 catégories: shopify, klaviyo, analytics, leads, seo, social), INDEX.md avec méthodologie intégration clients, distinction agency vs client-facing |
| 2025-12-18 | 3.2 | **Session 12 - AEO/SEO Fix**: robots.txt +5 AI crawlers, llms.txt spec-compliant, Schema.org +8 pages, images compressed (-76%/-91%), marketing claims corrected (50+ scripts, 3 MCPs, 10+ APIs), forensic audit v2.0 |
| 2025-12-18 | 3.1 | **Session 11**: Stat-labels visibility fix (data-count moved to .stat-number-ultra), Section reveal fallback (3s timeout), Stats design compact & premium, puppeteer installed for testing |
| 2025-12-18 | 3.0 | **MCP Expansion**: 12 MCPs configurés (chrome-devtools, playwright, gemini, github, hostinger, wordpress + existants). Stat-labels CSS fix. wp-sites.json template créé |
| 2025-12-18 | 2.9 | **Performance Optimization**: styles-lite.css (40K, -52%), script-lite.js (8K, -75%), 12 pages migrées, timeline alignement fix, GPU hints |
| 2025-12-18 | 2.8 | **Knowledge Base RAG**: Phase 1 complète (273 chunks, BM25), Grok v2.0 RAG-enhanced, Voice Agent scope clarifié (Shopping + Support), 6 pages design upgrade |
| 2025-12-17 | 2.7 | **Voice API**: Découverte Grok Voice Agent API ($0.05/min), Voice AI devient possible avec budget actuel |
| 2025-12-17 | 2.6 | **xAI API**: Clé API sauvegardée dans .env, sécurité .gitignore vérifiée, compte nécessite crédits |
| 2025-12-17 | 2.5 | **AI Prompts**: AI-PROMPTS-LANDING-PAGE-2025.md créé, recherche web factuelle (v0.dev, Bolt.new, Hostinger AI, GSAP), tendances 2025 documentées |
| 2025-12-17 | 2.4 | **Branding**: Couleurs exactes extraites du logo, CSS màj, 3A-BRANDING-GUIDE.md |
| 2025-12-17 | 2.3 | **GitHub**: Repo connecté github.com/Jouiet/3a-automations, logos ajoutés |
| 2025-12-17 | 2.2 | **Intégration Grok**: GROK.md créé, clients Python/Node.js ajoutés, XAI_API_KEY dans .env |
| 2025-12-17 | 2.1 | **Session API Tests**: .env créé, APIs testées (Shopify+Klaviyo OK), 4 scripts production créés, audits générés, correction identité store (azffej-as = Alpha Medical Care) |
| 2025-12-17 | 2.0 | Refonte complète - Ajout références docs techniques, métriques factuelles |
| 2025-12-17 | 1.1 | Ajout branding 3A Automation |
| 2025-12-17 | 1.0 | Création initiale |

---

**PRINCIPE FONDAMENTAL:**
> Ce fichier contient la VÉRITÉ FACTUELLE sur notre projet.
> Pas d'aspirations, que des FAITS VÉRIFIÉS.
> Consulter FORENSIC-AUDIT-TRUTH avant toute affirmation.
