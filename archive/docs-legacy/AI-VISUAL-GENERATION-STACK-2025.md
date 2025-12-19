# AI VISUAL GENERATION STACK - AGENCE AAA
## Documentation Technique Factuelle et Exhaustive

**Version:** 1.1
**Date:** 17 Décembre 2025
**Dernière mise à jour:** 17 Décembre 2025 - Architecture Organisme AAA
**Statut:** VÉRIFIÉ - Sources citées
**Auteur:** Documentation technique AAA

---

## TABLE DES MATIÈRES

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Architecture Stratégique Hybride](#2-architecture-stratégique-hybride)
3. [Architecture Organisme AAA](#3-architecture-organisme-aaa) ⭐ **NOUVEAU**
4. [Inventaire des Outils - Analyse Factuelle](#4-inventaire-des-outils---analyse-factuelle)
5. [Capacités Gratuites Vérifiées](#5-capacités-gratuites-vérifiées)
6. [Limitations et Contraintes Réelles](#6-limitations-et-contraintes-réelles)
7. [Tarification Détaillée](#7-tarification-détaillée)
8. [APIs et Intégration Technique](#8-apis-et-intégration-technique)
9. [Workflows d'Automatisation](#9-workflows-dautomatisation) ⭐ **ENRICHI**
10. [Recommandations par Cas d'Usage](#10-recommandations-par-cas-dusage)
11. [Roadmap et Évolutions](#11-roadmap-et-évolutions)
12. [Sources et Références](#12-sources-et-références)

---

## 1. RÉSUMÉ EXÉCUTIF

### Principe Fondamental

```
STRATÉGIE HYBRIDE OPTIMALE (COÛT: $0/mois pour démarrage)

┌─────────────────────────────────────────────────────────────────┐
│  CLAUDE (Anthropic)     │  Texte, Code, Raisonnement, Analyse  │
├─────────────────────────────────────────────────────────────────┤
│  GEMINI (Google)        │  Images statiques (500/jour)         │
├─────────────────────────────────────────────────────────────────┤
│  GROK (xAI)             │  Images + Vidéos (gratuit limité)    │
├─────────────────────────────────────────────────────────────────┤
│  LEONARDO.AI            │  Images alternatives (150 tok/jour)  │
├─────────────────────────────────────────────────────────────────┤
│  KLING (Kuaishou)       │  Vidéos pro (payant, backup)         │
├─────────────────────────────────────────────────────────────────┤
│  GSAP + LOTTIE          │  Animations web (100% gratuit)       │
└─────────────────────────────────────────────────────────────────┘
```

### Capacité Totale Gratuite Estimée

| Type de Contenu | Par Jour | Par Mois |
|-----------------|----------|----------|
| Images statiques | ~520-670 | ~17,000+ |
| Vidéos 6-15s | Variable* | Variable* |
| Animations web | Illimité | Illimité |
| Texte/Code Claude | Illimité | Illimité |

*Grok Imagine gratuit actuellement pour utilisateurs US - durée limitée

---

## 2. ARCHITECTURE STRATÉGIQUE HYBRIDE

### 2.1 Principe de Séparation des Responsabilités

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATION                               │
│                      Claude (Anthropic)                             │
│         Raisonnement │ Code │ Prompts │ Analyse │ Décisions        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    IMAGES       │  │    VIDÉOS       │  │  ANIMATIONS WEB │
│                 │  │                 │  │                 │
│ Gemini (500/j)  │  │ Grok Imagine    │  │ GSAP (gratuit)  │
│ Grok Aurora     │  │ Kling (backup)  │  │ Lottie (gratuit)│
│ Leonardo        │  │ Veo (premium)   │  │ CSS/JS          │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Stratégie de Fallback

```
IMAGES:
  Primary   → Gemini API (500/jour, watermark)
  Fallback1 → Grok Aurora (10-20/jour)
  Fallback2 → Leonardo.ai (150 tokens/jour)
  Fallback3 → Kling (payant)

VIDÉOS:
  Primary   → Grok Imagine (gratuit temporaire)
  Fallback1 → Kling API ($0.125/5s)
  Fallback2 → Runway ($0.25/5s)
  Fallback3 → Veo 3.1 ($0.50/s - premium)

ANIMATIONS WEB:
  Primary   → GSAP (100% gratuit)
  Secondary → Lottie/LottieFiles
  Tertiary  → CSS animations natives
```

---

## 3. ARCHITECTURE ORGANISME AAA

### 3.1 Philosophie: "Each Tool For What It Does Best"

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    STRATÉGIE HYBRIDE VALIDÉE                              ║
║                     "L'ORGANISME INTELLIGENT AAA"                         ║
║                                                                           ║
║  Principe: Spécialisation × Intégration = Excellence Systématique        ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Anti-Pattern à éviter:**
```
❌ "Un seul outil pour tout faire"
   → Compromis sur tout, excellence sur rien

✅ "Chaque outil pour sa spécialité"
   → Excellence partout, coût minimal
```

### 3.2 Modèle Organisme Complet

```
                              ┌─────────────────┐
                              │    🧠 CERVEAU   │
                              │     CLAUDE      │
                              │                 │
                              │ • Raisonnement  │
                              │ • Stratégie     │
                              │ • Code          │
                              │ • Analyse       │
                              │ • Orchestration │
                              │ • Décisions     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
          │   🖐️ MAINS      │ │  🖐️ MAINS     │ │   🖐️ MAINS     │
          │    GAUCHE       │ │   DROITE      │ │   PRÉCISION     │
          │                 │ │               │ │                 │
          │ GEMINI          │ │ GROK          │ │ KLING/LEONARDO  │
          │ • 500 img/jour  │ │ • Images      │ │ • Vidéos pro    │
          │ • Volume        │ │ • Vidéos 6-15s│ │ • Qualité art   │
          │ • Gratuit       │ │ • Audio natif │ │ • Backup        │
          │                 │ │ • Gratuit*    │ │                 │
          └────────┬────────┘ └───────┬───────┘ └────────┬────────┘
                   │                  │                  │
                   └──────────────────┼──────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
          │   💪 MUSCLES    │ │  💪 MUSCLES   │ │   💪 MUSCLES    │
          │   AUTOMATION    │ │   STORAGE     │ │   SCHEDULING    │
          │                 │ │               │ │                 │
          │ n8n / Make      │ │ Google Cloud  │ │ GitHub Actions  │
          │ • Workflows     │ │ • GCS/S3      │ │ • Cron jobs     │
          │ • Webhooks      │ │ • Sheets DB   │ │ • CI/CD         │
          │ • Intégrations  │ │ • BigQuery    │ │ • Batch         │
          └─────────────────┘ └───────────────┘ └─────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │   🎯 OUTPUT   │
                              │    CLIENT     │
                              │               │
                              │ • Images      │
                              │ • Vidéos      │
                              │ • Animations  │
                              │ • Rapports    │
                              │ • Assets      │
                              └───────────────┘
```

### 3.3 Tableau des Rôles

| Organe | Composant(s) | Fonction | Coût |
|--------|--------------|----------|------|
| **🧠 Cerveau** | Claude | Pense, décide, code, analyse, orchestre | API |
| **🖐️ Main Volume** | Gemini | Production d'images en masse | $0 |
| **🖐️ Main Créative** | Grok | Images + Vidéos avec audio | $0* |
| **🖐️ Main Précision** | Kling/Leonardo | Qualité pro, finition | Variable |
| **💪 Muscle Auto** | n8n / Make | Workflows automatisés | $0-20/mois |
| **💪 Muscle Data** | Google Sheets/Cloud | Stockage, tracking, DB légère | $0 |
| **💪 Muscle Cron** | GitHub Actions | Jobs planifiés, CI/CD | $0 |

### 3.4 Flux de Travail Type

```
1. CLIENT REQUEST
        │
        ▼
2. 🧠 CLAUDE analyse le besoin
        │
        ├─→ Besoin = Images volume?   → 🖐️ GEMINI (500/jour)
        ├─→ Besoin = Vidéo courte?    → 🖐️ GROK IMAGINE
        ├─→ Besoin = Qualité pro?     → 🖐️ KLING/LEONARDO
        ├─→ Besoin = Animation web?   → 🖐️ GSAP/LOTTIE
        └─→ Besoin = Code/Stratégie?  → 🧠 CLAUDE (self)
                │
                ▼
3. 💪 MUSCLES exécutent
        │
        ├─→ n8n orchestre le pipeline
        ├─→ GitHub Actions schedule les jobs batch
        └─→ Google Sheets track les résultats/métriques
                │
                ▼
4. OUTPUT livré au client
        │
        └─→ Stocké dans GCS/S3
        └─→ Tracké dans Sheets
        └─→ Notifié via webhook
```

### 3.5 Stack Technique YAML

```yaml
# AAA-HYBRID-STACK.yaml
# Configuration de l'Organisme AAA

brain:
  primary: claude-opus-4.5
  capabilities:
    - reasoning
    - coding
    - orchestration
    - analysis
    - prompt_engineering
  role: "Intelligence centrale - décisions et code"

hands:
  images:
    primary:
      name: gemini-2.5-flash-image
      quota: 500/day
      cost: $0
    fallback_1:
      name: grok-aurora
      quota: 10-20/day
      cost: $0
    fallback_2:
      name: leonardo-ai
      quota: 150-tokens/day
      cost: $0

  videos:
    primary:
      name: grok-imagine
      duration: 6-15s
      cost: $0 (temporaire)
    fallback:
      name: kling-2.1
      duration: 5-10s
      cost: $0.125/5s

  web_animations:
    primary: gsap
    secondary: lottie
    cost: $0

muscles:
  automation:
    primary: n8n
    alternative: make.com
    features:
      - workflows
      - webhooks
      - integrations
    cost: $0-20/month

  storage:
    primary: google-cloud-storage
    database: google-sheets
    analytics: bigquery
    cost: $0 (free tier)

  scheduling:
    primary: github-actions
    alternative: cloud-scheduler
    features:
      - cron_jobs
      - ci_cd
      - batch_processing
    cost: $0

cost_summary:
  startup: $0/month
  production_light: $30-50/month
  production_full: $100-150/month
  enterprise: $300+/month
```

### 3.6 Avantages de l'Architecture Organisme

| Avantage | Description |
|----------|-------------|
| **Résilience** | Si un outil tombe, fallback automatique vers le suivant |
| **Scalabilité** | Chaque "organe" scale indépendamment selon la charge |
| **Coût optimal** | Gratuit en majorité, payant uniquement si nécessaire |
| **Qualité maximale** | Chaque outil fait ce qu'il fait de mieux |
| **Maintenabilité** | Modules découplés, faciles à remplacer/upgrader |
| **Évolutivité** | Nouveaux outils intégrables sans refonte |

### 3.7 Équation Fondamentale

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🧠 + 🖐️ + 💪 = ORGANISME COMPLET                           ║
║                                                               ║
║   Intelligence (Claude)                                       ║
║   + Création (Gemini/Grok/Kling/Leonardo)                    ║
║   + Automatisation (n8n/GitHub Actions/Google Cloud)         ║
║                                                               ║
║   = AGENCE AAA AUTONOME & SCALABLE                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 4. INVENTAIRE DES OUTILS - ANALYSE FACTUELLE

### 4.1 CLAUDE (Anthropic)

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Génération d'images** | ❌ NON | [Anthropic Help Center](https://support.claude.com/en/articles/9002504-can-claude-produce-images) |
| **Génération de vidéos** | ❌ NON | Vérifié Déc 2025 |
| **Animations natives** | ❌ NON | Vérifié Déc 2025 |
| **Analyse d'images** | ✅ OUI | Vision multimodale Claude 3/4 |
| **Génération code graphique** | ✅ OUI | SVG, CSS, Canvas, GSAP, etc. |
| **Modèle actuel** | Claude Opus 4.5 | [Anthropic News](https://www.anthropic.com/news/claude-opus-4-5) |
| **Force principale** | "Best coding model" | Anthropic claims |

**IMPORTANT:** Claude ne génère PAS d'images/vidéos. Il peut:
- Analyser des images uploadées
- Générer du code qui produit des graphiques (SVG, Canvas, etc.)
- Écrire des prompts optimisés pour d'autres outils
- Orchestrer des workflows via MCP

---

### 4.2 GEMINI (Google) - Images

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Modèle images** | Nano Banana (Gemini 2.5 Flash Image) | [Google AI Docs](https://ai.google.dev/gemini-api/docs/image-generation) |
| **Modèle pro** | Nano Banana Pro (Gemini 3 Pro Image) | [Google Blog](https://blog.google/technology/ai/nano-banana-pro/) |
| **Free tier** | 500 images/jour | [AI Free API](https://www.aifreeapi.com/en/posts/gemini-image-api-free-tier) |
| **Rate limit** | 15 requêtes/minute | Vérifié |
| **Watermark free tier** | ✅ OUI (Gemini sparkle logo) | Vérifié |
| **Résolutions** | 1K, 2K, 4K (Pro) | Documentation officielle |
| **Animation/Vidéo** | ❌ NON (Veo séparé, payant) | Vérifié |

#### Capacités Nano Banana Pro:
- Texte dans images (multilangue)
- Jusqu'à 14 images de référence
- Mode "Thinking" pour compositions complexes
- Character consistency (jusqu'à 5 personnes)
- Grounding avec Google Search

#### Limitations vérifiées:
- Petits visages parfois problématiques
- Orthographe pas toujours exacte
- Détails fins variables
- Données factuelles peuvent être incorrectes

---

### 4.3 GEMINI VEO (Google) - Vidéos

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Modèle** | Veo 3.1 / Veo 3.1 Fast | [Google Developers Blog](https://developers.googleblog.com/en/veo-3-fast-image-to-video-capabilities-now-available-gemini-api/) |
| **Free tier** | ❌ NON - Payant uniquement | Vérifié |
| **Prix (sans audio)** | $0.50/seconde (Vertex AI) | [Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| **Prix (avec audio)** | $0.75/seconde | Vérifié |
| **Veo 3.1 Fast (sans audio)** | $0.10/seconde | Vérifié |
| **Durée max** | 8s base, extensible jusqu'à ~148s | Documentation |
| **Résolutions** | 720p, 1080p | Vérifié |
| **Image-to-video** | ✅ OUI | [Google Blog](https://developers.googleblog.com/en/veo-3-fast-image-to-video-capabilities-now-available-gemini-api/) |

---

### 4.4 GROK (xAI) - Images & Vidéos

#### Interface X/App (Gratuit)

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Images Aurora** | 10-20/jour OU 10/2h | [Arsturn](https://www.arsturn.com/blog/grok-imagines-daily-generation-limits-what-you-need-to-know) |
| **Vidéos Grok Imagine** | ✅ GRATUIT (temporaire) | [Business Standard](https://www.business-standard.com/technology/tech-news/xai-makes-grok-ai-imagine-image-video-generation-free-for-all-users-details-125080800609_1.html) |
| **Durée vidéos** | 6-15 secondes | Vérifié |
| **Audio natif** | ✅ OUI | Vérifié |
| **Région** | US principalement | Vérifié |
| **Résolution images** | 1024x768 (4:3) | Vérifié |

#### API xAI

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Free credits (data sharing)** | $150/mois | [xAI Data Sharing](https://cloudcredits.io/providers/xai/programs/data-sharing-program) |
| **Prérequis** | Dépenser $5 minimum d'abord | Vérifié |
| **Prix image API** | $0.07/image | [Landian News](https://landian.news/article/6147.html) |
| **Images avec $150** | ~2,142 images/mois | Calculé |
| **SDK** | xai-sdk-python | [GitHub xAI SDK](https://github.com/xai-org/xai-sdk-python) |
| **Compatibilité** | Format OpenAI | Vérifié |

#### Abonnements Grok

| Plan | Prix | Images | Vidéos |
|------|------|--------|--------|
| Free | $0 | 10-20/jour | Temporaire |
| Premium (X) | ~$8/mois | Plus élevé | Inclus |
| Premium+ (X) | ~$16/mois | Plus élevé | 100/jour |
| SuperGrok | $30/mois | Illimité | Inclus |
| SuperGrok Heavy | $300/mois | Illimité | 500/jour + priorité |

---

### 4.5 LEONARDO.AI

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Free tier** | 150 tokens/jour | [Leonardo Pricing](https://leonardo.ai/pricing/) |
| **Coût par image** | ~5-8 tokens | Vérifié |
| **Images/jour (free)** | ~18-30 images | Calculé |
| **Watermark free tier** | ✅ OUI | Vérifié |
| **Vidéos** | ✅ OUI (Maestro plan) | Vérifié |
| **API** | Maestro/Enterprise tier | [Leonardo API](https://leonardo.ai/api/) |
| **SDK Python** | leonardo-api (PyPI) | [GitHub](https://github.com/wwakabobik/leonardo_api) |

#### Plans Payants

| Plan | Prix/mois | Tokens |
|------|-----------|--------|
| Free | $0 | 150/jour |
| Apprentice | $10-12 | Plus |
| Artisan | $24-30 | Plus |
| Maestro | $48-60 | 60,000 Fast + vidéos illimitées relaxed |

---

### 4.6 KLING AI (Kuaishou)

| Attribut | Valeur | Source |
|----------|--------|--------|
| **API officielle** | ❌ NON (via tiers) | [PiAPI](https://piapi.ai/kling-api) |
| **Free tier (app)** | 66 crédits/jour (login) | [Kling Pricing](https://magichour.ai/blog/kling-ai-pricing) |
| **Prix API 720p** | $0.125/5s | [Kie.ai](https://kie.ai/kling/v2-1) |
| **Prix API 1080p** | $0.25/5s | Vérifié |
| **Prix API Master** | $0.80/5s | Vérifié |
| **Motion Brush** | ✅ OUI | Feature unique |
| **Image-to-video** | ✅ OUI | Vérifié |

---

### 4.7 RUNWAY ML

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Free tier** | 125 crédits (one-time) | [Runway Pricing](https://runwayml.com/pricing) |
| **Modèle actuel** | Gen-4, Gen-4 Turbo | Vérifié |
| **Prix Gen-4 Turbo** | 5 crédits/seconde | [Runway API Docs](https://docs.dev.runwayml.com/guides/pricing/) |
| **Prix Gen-4** | 12-15 crédits/seconde | Vérifié |
| **Standard plan** | $12/mois (625 crédits) | Vérifié |
| **Watermark free** | ✅ NON (pas de watermark) | Vérifié |

---

### 4.8 PIKA LABS

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Free tier** | Généreux, max 5s | [Pika vs Kling](https://www.fahimai.com/pika-vs-kling) |
| **Watermark free** | Variable | Vérifié |
| **Commercial free** | ✅ OUI (crédit requis) | Vérifié |
| **Pro plan** | $28-35/mois | Vérifié |
| **Vitesse** | <30 secondes | Vérifié |
| **Pikaffects** | Effets spéciaux uniques | Feature unique |

---

### 4.9 ANIMATIONS WEB

#### GSAP (GreenSock)

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Prix** | ✅ 100% GRATUIT | [GSAP](https://gsap.com/) |
| **Plugins premium** | ✅ GRATUITS (depuis Webflow) | Vérifié |
| **Performance** | 20x plus rapide que jQuery | Claims GSAP |
| **Installation** | npm install gsap | Vérifié |
| **Documentation** | Excellente | gsap.com |

#### Lottie

| Attribut | Valeur | Source |
|----------|--------|--------|
| **Prix** | ✅ GRATUIT (open source) | [GitHub Airbnb](https://github.com/airbnb/lottie-web) |
| **Format** | JSON (After Effects export) | Vérifié |
| **LottieFiles** | Bibliothèque gratuite | [LottieFiles](https://lottiefiles.com) |
| **AI Generator** | Motion Copilot | LottieFiles |
| **Installation** | npm install lottie-web | Vérifié |

---

## 5. CAPACITÉS GRATUITES VÉRIFIÉES

### 5.1 Tableau Récapitulatif Quotidien

| Outil | Type | Quota Gratuit/Jour | Watermark | Qualité |
|-------|------|-------------------|-----------|---------|
| Gemini | Images | 500 | ✅ Oui | Haute |
| Grok Aurora | Images | 10-20 | ❌ Non | Haute |
| Grok Imagine | Vidéos 6-15s | Illimité* | ❌ Non | Moyenne |
| Leonardo | Images | ~20 | ✅ Oui | Haute |
| Runway | Vidéos | 125 crédits total | ❌ Non | Haute |
| Pika | Vidéos 5s | Limité | Variable | Moyenne |
| GSAP | Animations web | Illimité | ❌ Non | Excellente |
| Lottie | Animations web | Illimité | ❌ Non | Excellente |

*Temporaire - durée limitée, US principalement

### 5.2 Estimation Mensuelle (Gratuit)

```
IMAGES:
├── Gemini............... 500 × 30 = 15,000 images
├── Grok Aurora.......... 15 × 30 = 450 images
├── Leonardo............. 20 × 30 = 600 images
└── TOTAL................ ~16,000+ images/mois

VIDÉOS:
├── Grok Imagine......... Variable (promotion active)
├── Runway............... 125 crédits = ~25s total (one-time)
├── Pika................. Variable
└── TOTAL................ Dépend des promotions

ANIMATIONS WEB:
└── GSAP + Lottie........ ILLIMITÉ
```

### 5.3 Option API xAI Data Sharing

Si opt-in au programme de partage de données xAI:

```
PRÉREQUIS:
├── Dépenser $5 minimum sur l'API
├── Accepter le partage de données
└── Pays éligible

BÉNÉFICE:
├── $150/mois en crédits API
├── Images: ~2,142/mois ($0.07/image)
├── Texte: Inclus
└── RENOUVELLEMENT: Mensuel automatique

ATTENTION:
└── Opt-in IRRÉVERSIBLE une fois activé
```

---

## 6. LIMITATIONS ET CONTRAINTES RÉELLES

### 6.1 Limitations par Outil

#### Claude (Anthropic)
```
❌ NE PEUT PAS:
├── Générer des images
├── Générer des vidéos
├── Créer des animations visuelles
├── Éditer des photos
└── Convertir image → vidéo

✅ PEUT:
├── Analyser des images (vision)
├── Générer du code graphique (SVG, CSS, Canvas)
├── Écrire des prompts pour autres outils
├── Orchestrer via MCP
└── Raisonner sur le design
```

#### Gemini
```
❌ LIMITATIONS:
├── Watermark sur toutes les images (free tier)
├── Vidéos = Veo = PAYANT uniquement
├── Petits visages problématiques parfois
├── Orthographe imparfaite dans images
├── Données factuelles peuvent être fausses
└── gemini-2.5-flash-preview-image-generation retire 31 Oct 2025

✅ FORCES:
├── 500 images/jour = très généreux
├── Haute qualité (jusqu'à 4K avec Pro)
├── Texte multilangue dans images
├── Character consistency
└── API bien documentée
```

#### Grok
```
❌ LIMITATIONS:
├── Vidéos gratuites = TEMPORAIRE
├── Région US principalement
├── Qualité vidéo < Sora/Veo3
├── API image = $0.07/image (pas gratuit)
├── Data sharing = irréversible
└── Vidéos max 15 secondes

✅ FORCES:
├── Vidéos GRATUITES actuellement
├── Audio natif dans vidéos
├── $150/mois si data sharing
├── Format compatible OpenAI
└── Rapidité de génération
```

#### Leonardo
```
❌ LIMITATIONS:
├── 150 tokens/jour = ~20 images
├── Watermark sur free tier
├── API = plans payants (Maestro+)
├── Queues aux heures de pointe
└── Pas de vidéos en free

✅ FORCES:
├── Qualité excellente
├── Bonne variété de styles
├── Vidéos "relaxed" illimitées (Maestro)
└── SDK Python disponible
```

### 6.2 Contraintes Régionales

| Outil | Restriction Géographique |
|-------|-------------------------|
| Grok Imagine (gratuit) | US principalement |
| xAI Data Sharing | "Pays éligibles" |
| Kling | Disponible globalement |
| Gemini | Disponible globalement |
| Leonardo | Disponible globalement |

### 6.3 Contraintes Temporelles

```
⚠️ PROMOTIONS TEMPORAIRES (Décembre 2025):
├── Grok Imagine gratuit = "quelques jours" (annoncé août 2025)
│   └── Statut actuel: À VÉRIFIER - peut avoir expiré
├── Free tiers généreux = Phase "land grab"
│   └── Prévision: Vont probablement diminuer
└── Modèles Gemini preview = Dates d'expiration

⚠️ MIGRATIONS REQUISES:
└── gemini-2.5-flash-preview-image-generation
    └── Migrer vers gemini-2.5-flash-image avant 31 Oct 2025
```

---

## 7. TARIFICATION DÉTAILLÉE

### 7.1 Images - Comparaison des Prix

| Service | Free Tier | Prix Payant | Meilleur Pour |
|---------|-----------|-------------|---------------|
| Gemini | 500/jour | $0.039/image (1K) | Volume |
| Grok API | $150/mois (data share) | $0.07/image | Qualité + Volume |
| Leonardo | 150 tok/jour | $10-60/mois | Qualité artistique |
| Midjourney | ❌ Non | $10-60/mois | Style artistique |
| DALL-E 3 | ❌ Non | $0.04-0.08/image | Intégration OpenAI |

### 7.2 Vidéos - Comparaison des Prix (par 5 secondes)

| Service | Free Tier | 720p | 1080p | Avec Audio |
|---------|-----------|------|-------|------------|
| Grok Imagine | ✅ Gratuit* | N/A | N/A | Inclus |
| Kling 2.1 | 66 crédits/jour | $0.125 | $0.25 | +100% |
| Kling 2.6 | Non | $0.28 | $0.55 | $0.55-1.10 |
| Runway Gen-4 Turbo | 125 crédits | ~$0.25 | ~$0.50 | N/A |
| Veo 3.1 | ❌ Non | $2.50 | $2.50 | $3.75 |
| Veo 3.1 Fast | ❌ Non | $0.50 | $0.50 | $0.75 |

*Temporaire, US principalement

### 7.3 Budget Mensuel Recommandé

#### Scénario 1: MVP / Démarrage ($0/mois)
```
├── Gemini Free.............. 15,000 images
├── Grok Free................ 450 images + vidéos*
├── Leonardo Free............ 600 images
├── GSAP + Lottie............ Illimité
└── TOTAL.................... $0/mois
```

#### Scénario 2: Production Légère (~$35/mois)
```
├── Gemini Free.............. 15,000 images
├── SuperGrok................ $30/mois (images + vidéos illimités)
├── Leonardo Free............ 600 images
├── GSAP + Lottie............ Illimité
└── TOTAL.................... ~$30/mois
```

#### Scénario 3: Production Professionnelle (~$100-150/mois)
```
├── Gemini Free.............. 15,000 images
├── SuperGrok................ $30/mois
├── Leonardo Maestro......... $48/mois (vidéos relaxed illimitées)
├── Kling (backup)........... ~$25/mois usage
├── GSAP + Lottie............ Illimité
└── TOTAL.................... ~$103/mois
```

#### Scénario 4: Agence Premium (~$300+/mois)
```
├── Gemini Payant............ Variable
├── SuperGrok Heavy.......... $300/mois
├── Veo 3.1.................. Pay-per-use
├── Runway Unlimited......... $76/mois
├── Leonardo Enterprise...... Custom
└── TOTAL.................... $400+/mois
```

---

## 8. APIs ET INTÉGRATION TECHNIQUE

### 8.1 Installation des SDKs

```bash
# Google Gemini
pip install google-genai

# xAI Grok
pip install xai-sdk

# Leonardo.ai
pip install leonardo-api

# Animations
npm install gsap
npm install lottie-web
```

### 8.2 Configuration des Clés API

```python
# .env file
GEMINI_API_KEY=your_gemini_key
XAI_API_KEY=your_xai_key
LEONARDO_API_KEY=your_leonardo_key
```

### 8.3 Exemple d'Intégration Multi-Provider

```python
"""
ai_image_orchestrator.py
Orchestrateur multi-provider avec fallback automatique
"""
import os
import asyncio
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential

# Imports des SDKs
import google.genai as genai
from xai_sdk import Client as XAIClient
from leonardo_api import LeonardoAsync


@dataclass
class RateLimiter:
    """Token bucket rate limiter per provider"""
    max_tokens: int
    tokens: int = field(init=False)
    last_reset: datetime = field(default_factory=datetime.now)
    reset_interval: timedelta = timedelta(days=1)

    def __post_init__(self):
        self.tokens = self.max_tokens

    def can_consume(self, amount: int = 1) -> bool:
        self._maybe_reset()
        return self.tokens >= amount

    def consume(self, amount: int = 1) -> bool:
        if self.can_consume(amount):
            self.tokens -= amount
            return True
        return False

    def _maybe_reset(self):
        if datetime.now() - self.last_reset > self.reset_interval:
            self.tokens = self.max_tokens
            self.last_reset = datetime.now()


@dataclass
class GenerationResult:
    provider: str
    image_data: bytes
    prompt: str
    success: bool
    error: Optional[str] = None


class AIImageOrchestrator:
    """Multi-provider image generation with automatic fallback"""

    def __init__(self):
        # Initialize providers
        self.gemini_client = genai.Client(
            api_key=os.getenv('GEMINI_API_KEY')
        )
        self.grok_client = XAIClient(
            api_key=os.getenv('XAI_API_KEY')
        )
        self.leonardo_client = LeonardoAsync(
            token=os.getenv('LEONARDO_API_KEY')
        )

        # Rate limiters (daily free quotas)
        self.rate_limiters = {
            'gemini': RateLimiter(max_tokens=500),    # 500 images/day
            'grok': RateLimiter(max_tokens=50),       # ~50 images/day free
            'leonardo': RateLimiter(max_tokens=20),   # 150 tokens = ~20 images
        }

        # Provider priority order
        self.providers = ['gemini', 'grok', 'leonardo']

    async def generate_image(self, prompt: str) -> GenerationResult:
        """Generate image with automatic fallback"""
        for provider in self.providers:
            if self.rate_limiters[provider].can_consume():
                try:
                    result = await self._generate_with_provider(provider, prompt)
                    if result.success:
                        self.rate_limiters[provider].consume()
                        return result
                except Exception as e:
                    print(f"[{provider}] Error: {e}, trying next...")
                    continue

        return GenerationResult(
            provider="none",
            image_data=b"",
            prompt=prompt,
            success=False,
            error="All providers exhausted or rate limited"
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def _generate_with_provider(
        self, provider: str, prompt: str
    ) -> GenerationResult:
        if provider == 'gemini':
            return await self._generate_gemini(prompt)
        elif provider == 'grok':
            return await self._generate_grok(prompt)
        elif provider == 'leonardo':
            return await self._generate_leonardo(prompt)

    async def _generate_gemini(self, prompt: str) -> GenerationResult:
        """Generate with Gemini API"""
        response = self.gemini_client.models.generate_content(
            model="gemini-2.5-flash-preview-image-generation",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )
        )

        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return GenerationResult(
                    provider="gemini",
                    image_data=part.inline_data.data,
                    prompt=prompt,
                    success=True
                )

        raise Exception("No image in Gemini response")

    async def _generate_grok(self, prompt: str) -> GenerationResult:
        """Generate with Grok Aurora"""
        response = self.grok_client.image.sample(
            model="grok-2-image",
            prompt=prompt,
            image_format="base64"
        )

        import base64
        image_data = base64.b64decode(response.image)

        return GenerationResult(
            provider="grok",
            image_data=image_data,
            prompt=prompt,
            success=True
        )

    async def _generate_leonardo(self, prompt: str) -> GenerationResult:
        """Generate with Leonardo.ai"""
        import aiohttp

        response = await self.leonardo_client.post_generations(
            prompt=prompt,
            num_images=1,
            width=1024,
            height=1024
        )

        generation_id = response['sdGenerationJob']['generationId']

        # Poll for completion
        for _ in range(30):
            await asyncio.sleep(2)
            result = await self.leonardo_client.get_single_generation(
                generation_id
            )
            if result['generations_by_pk']['status'] == 'COMPLETE':
                image_url = result['generations_by_pk']['generated_images'][0]['url']
                async with aiohttp.ClientSession() as session:
                    async with session.get(image_url) as resp:
                        image_data = await resp.read()

                return GenerationResult(
                    provider="leonardo",
                    image_data=image_data,
                    prompt=prompt,
                    success=True
                )

        raise Exception("Leonardo generation timeout")

    async def generate_batch(
        self,
        prompts: List[str],
        max_concurrent: int = 5
    ) -> List[GenerationResult]:
        """Generate multiple images with concurrency control"""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def bounded_generate(prompt):
            async with semaphore:
                return await self.generate_image(prompt)

        return await asyncio.gather(
            *[bounded_generate(p) for p in prompts]
        )

    def get_daily_capacity(self) -> dict:
        """Get remaining capacity for each provider"""
        return {
            provider: limiter.tokens
            for provider, limiter in self.rate_limiters.items()
        }


# Usage
async def main():
    orchestrator = AIImageOrchestrator()

    result = await orchestrator.generate_image(
        "Professional logo for tech agency, modern minimalist style"
    )

    if result.success:
        with open(f"output_{result.provider}.png", "wb") as f:
            f.write(result.image_data)
        print(f"Generated with {result.provider}")

    print(f"Remaining: {orchestrator.get_daily_capacity()}")


if __name__ == "__main__":
    asyncio.run(main())
```

### 8.4 Exemple Grok Vidéo (via Interface)

```python
"""
Note: Grok Imagine vidéos = via app X, pas API directe
Pour automatisation vidéo, utiliser Kling API
"""
from piapi import PiAPI  # Third-party Kling wrapper

async def generate_video_kling(image_path: str, prompt: str):
    """Generate video from image using Kling API"""
    client = PiAPI(api_key=os.getenv('PIAPI_KEY'))

    result = await client.kling.image_to_video(
        image=image_path,
        prompt=prompt,
        duration=5,  # 5 seconds
        resolution="720p"  # or "1080p"
    )

    return result.video_url
```

### 8.5 Animations Web avec GSAP

```javascript
// gsap-animations.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Logo animation
export function animateLogo(element) {
  return gsap.timeline()
    .from(element, {
      scale: 0,
      rotation: -180,
      duration: 1,
      ease: "elastic.out(1, 0.5)"
    })
    .to(element, {
      y: -10,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut"
    });
}

// Banner entrance
export function animateBanner(container) {
  const elements = container.querySelectorAll('.animate-in');

  return gsap.from(elements, {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out"
  });
}

// Scroll-triggered animation
export function setupScrollAnimations() {
  gsap.utils.toArray('.fade-section').forEach(section => {
    gsap.from(section, {
      opacity: 0,
      y: 100,
      duration: 1,
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
  });
}
```

### 8.6 Lottie Integration

```javascript
// lottie-loader.js
import lottie from 'lottie-web';

export function loadAnimation(container, animationPath, options = {}) {
  return lottie.loadAnimation({
    container: container,
    renderer: 'svg',
    loop: options.loop ?? true,
    autoplay: options.autoplay ?? true,
    path: animationPath,
    ...options
  });
}

// Usage
const logoAnimation = loadAnimation(
  document.getElementById('logo-container'),
  '/animations/logo-intro.json',
  { loop: false }
);

logoAnimation.addEventListener('complete', () => {
  console.log('Animation finished');
});
```

---

## 9. WORKFLOWS D'AUTOMATISATION (💪 MUSCLES)

> Cette section détaille l'implémentation des "Muscles" de l'Organisme AAA:
> automation (n8n), storage (Google Sheets/Cloud), scheduling (GitHub Actions).

### 9.1 Vue d'Ensemble des Muscles

```
💪 MUSCLES - INFRASTRUCTURE D'AUTOMATISATION

┌─────────────────────────────────────────────────────────────────┐
│                      COUCHE ORCHESTRATION                       │
│                           n8n / Make                            │
│  • Workflows visuels    • Webhooks    • 400+ intégrations      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  SCHEDULING   │    │    STORAGE    │    │   TRACKING    │
│               │    │               │    │               │
│ GitHub Actions│    │ Google Cloud  │    │ Google Sheets │
│ • Cron jobs   │    │ • GCS buckets │    │ • Métriques   │
│ • CI/CD       │    │ • CDN         │    │ • Logs        │
│ • Batch       │    │ • Backup      │    │ • Dashboard   │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 9.2 GitHub Actions - Scheduling & Batch

#### Workflow: Génération Batch Quotidienne

```yaml
# .github/workflows/daily-image-generation.yml
name: Daily AI Image Generation

on:
  schedule:
    # Exécution tous les jours à 6h00 UTC
    - cron: '0 6 * * *'
  workflow_dispatch:
    inputs:
      prompt_file:
        description: 'Fichier de prompts à traiter'
        required: false
        default: 'prompts/daily.json'

env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  XAI_API_KEY: ${{ secrets.XAI_API_KEY }}
  LEONARDO_API_KEY: ${{ secrets.LEONARDO_API_KEY }}

jobs:
  generate-images:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install google-genai xai-sdk leonardo-api aiohttp tenacity

      - name: Run batch generation
        run: |
          python scripts/batch_generator.py \
            --prompts ${{ github.event.inputs.prompt_file || 'prompts/daily.json' }} \
            --output artifacts/generated/

      - name: Upload to Google Cloud Storage
        uses: google-github-actions/upload-cloud-storage@v2
        with:
          path: artifacts/generated/
          destination: aaa-generated-images/${{ github.run_id }}
          credentials: ${{ secrets.GCP_CREDENTIALS }}

      - name: Update tracking sheet
        run: |
          python scripts/update_sheets.py \
            --report artifacts/batch_report.json

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: generated-images-${{ github.run_id }}
          path: artifacts/
          retention-days: 30
```

#### Workflow: Surveillance des Quotas

```yaml
# .github/workflows/quota-monitor.yml
name: API Quota Monitor

on:
  schedule:
    # Toutes les 4 heures
    - cron: '0 */4 * * *'

jobs:
  check-quotas:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Check Gemini quota
        id: gemini
        run: |
          # Script de vérification du quota Gemini
          python scripts/check_quota.py --provider gemini

      - name: Check Grok quota
        id: grok
        run: |
          python scripts/check_quota.py --provider grok

      - name: Slack notification if low
        if: steps.gemini.outputs.remaining < 100 || steps.grok.outputs.remaining < 5
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ Quota Alert: Gemini=${{ steps.gemini.outputs.remaining }}, Grok=${{ steps.grok.outputs.remaining }}"
            }
```

### 9.3 Google Sheets - Tracking & Dashboard

#### Structure du Sheet de Tracking

```
📊 AAA-Generation-Tracker (Google Sheet)

TAB 1: Generations
┌────────┬───────────┬──────────┬────────┬─────────┬────────┬───────────┐
│ Date   │ Provider  │ Prompt   │ Status │ FileURL │ Cost   │ Duration  │
├────────┼───────────┼──────────┼────────┼─────────┼────────┼───────────┤
│ 2025-  │ gemini    │ Logo...  │ ✅     │ gs://...│ $0.00  │ 2.3s      │
│ 12-17  │           │          │        │         │        │           │
└────────┴───────────┴──────────┴────────┴─────────┴────────┴───────────┘

TAB 2: Daily Stats
┌────────┬─────────┬───────┬──────────┬────────────┬───────────┐
│ Date   │ Gemini  │ Grok  │ Leonardo │ Total Cost │ Success % │
├────────┼─────────┼───────┼──────────┼────────────┼───────────┤
│ 2025-  │ 234     │ 15    │ 12       │ $0.00      │ 98.2%     │
│ 12-17  │         │       │          │            │           │
└────────┴─────────┴───────┴──────────┴────────────┴───────────┘

TAB 3: Quotas
┌───────────┬───────────┬───────────┬─────────────┬──────────────┐
│ Provider  │ Daily Max │ Used      │ Remaining   │ Reset Time   │
├───────────┼───────────┼───────────┼─────────────┼──────────────┤
│ Gemini    │ 500       │ 234       │ 266         │ 00:00 UTC    │
│ Grok      │ 20        │ 15        │ 5           │ 00:00 UTC    │
│ Leonardo  │ 20        │ 12        │ 8           │ 00:00 UTC    │
└───────────┴───────────┴───────────┴─────────────┴──────────────┘
```

#### Script Python: Google Sheets Integration

```python
# scripts/sheets_tracker.py
"""
Google Sheets integration for AAA generation tracking
"""
import os
from datetime import datetime
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = os.getenv('TRACKING_SHEET_ID')

class SheetsTracker:
    def __init__(self):
        creds = Credentials.from_service_account_file(
            'credentials.json', scopes=SCOPES
        )
        self.service = build('sheets', 'v4', credentials=creds)
        self.sheet = self.service.spreadsheets()

    def log_generation(self, provider: str, prompt: str,
                       status: str, file_url: str,
                       cost: float, duration: float):
        """Log a single generation to the Generations tab"""
        values = [[
            datetime.now().isoformat(),
            provider,
            prompt[:100],  # Truncate long prompts
            status,
            file_url,
            f"${cost:.4f}",
            f"{duration:.2f}s"
        ]]

        self.sheet.values().append(
            spreadsheetId=SPREADSHEET_ID,
            range='Generations!A:G',
            valueInputOption='USER_ENTERED',
            body={'values': values}
        ).execute()

    def update_daily_stats(self, stats: dict):
        """Update daily statistics"""
        values = [[
            datetime.now().strftime('%Y-%m-%d'),
            stats.get('gemini', 0),
            stats.get('grok', 0),
            stats.get('leonardo', 0),
            f"${stats.get('total_cost', 0):.2f}",
            f"{stats.get('success_rate', 0):.1f}%"
        ]]

        self.sheet.values().append(
            spreadsheetId=SPREADSHEET_ID,
            range='Daily Stats!A:F',
            valueInputOption='USER_ENTERED',
            body={'values': values}
        ).execute()

    def update_quotas(self, quotas: dict):
        """Update current quota status"""
        # Clear and rewrite quotas tab
        self.sheet.values().clear(
            spreadsheetId=SPREADSHEET_ID,
            range='Quotas!A2:E10'
        ).execute()

        values = []
        for provider, data in quotas.items():
            values.append([
                provider,
                data['max'],
                data['used'],
                data['remaining'],
                data['reset_time']
            ])

        self.sheet.values().update(
            spreadsheetId=SPREADSHEET_ID,
            range='Quotas!A2',
            valueInputOption='USER_ENTERED',
            body={'values': values}
        ).execute()

    def get_remaining_quota(self, provider: str) -> int:
        """Get remaining quota for a provider"""
        result = self.sheet.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range='Quotas!A:D'
        ).execute()

        for row in result.get('values', [])[1:]:
            if row[0].lower() == provider.lower():
                return int(row[3])
        return 0
```

### 9.4 n8n - Workflows Visuels

#### Workflow: Pipeline Complet de Génération

```json
{
  "name": "AAA Complete Generation Pipeline",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "generate",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Validate Request",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [{
            "value1": "={{$json.prompt}}",
            "operation": "isNotEmpty"
          }]
        }
      }
    },
    {
      "name": "Check Gemini Quota",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://sheets.googleapis.com/v4/spreadsheets/{{SHEET_ID}}/values/Quotas!D2",
        "method": "GET"
      }
    },
    {
      "name": "Route by Quota",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "rules": [{
          "value": "={{$json.values[0][0] > 0}}",
          "output": 0
        }],
        "fallbackOutput": 1
      }
    },
    {
      "name": "Generate with Gemini",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-preview-image-generation:generateContent",
        "method": "POST",
        "headers": {
          "x-goog-api-key": "={{$env.GEMINI_API_KEY}}"
        },
        "body": {
          "contents": [{"parts": [{"text": "={{$json.prompt}}"}]}],
          "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
        }
      }
    },
    {
      "name": "Fallback to Grok",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.x.ai/v1/images/generations",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{$env.XAI_API_KEY}}"
        },
        "body": {
          "model": "grok-2-image",
          "prompt": "={{$json.prompt}}"
        }
      }
    },
    {
      "name": "Save to GCS",
      "type": "n8n-nodes-base.googleCloudStorage",
      "parameters": {
        "operation": "upload",
        "bucketName": "aaa-generated-images",
        "fileName": "={{$json.id}}.png"
      }
    },
    {
      "name": "Log to Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "append",
        "sheetId": "{{SHEET_ID}}",
        "range": "Generations!A:G",
        "columns": {
          "Date": "={{$now}}",
          "Provider": "={{$json.provider}}",
          "Prompt": "={{$json.prompt}}",
          "Status": "success",
          "FileURL": "={{$json.gcs_url}}",
          "Cost": "$0.00",
          "Duration": "={{$json.duration}}s"
        }
      }
    },
    {
      "name": "Return Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": {
          "success": true,
          "image_url": "={{$json.gcs_url}}",
          "provider": "={{$json.provider}}"
        }
      }
    }
  ]
}
```

### 9.5 Workflow n8n Simple - Génération d'Images

```json
{
  "name": "AI Image Generation Pipeline",
  "nodes": [
    {
      "type": "webhook",
      "name": "Trigger",
      "parameters": {
        "path": "generate-image"
      }
    },
    {
      "type": "gemini",
      "name": "Generate with Gemini",
      "parameters": {
        "model": "gemini-2.5-flash-preview-image-generation",
        "prompt": "={{$json.prompt}}"
      }
    },
    {
      "type": "s3",
      "name": "Save to Storage",
      "parameters": {
        "bucket": "aaa-generated-images",
        "key": "={{$json.filename}}"
      }
    }
  ]
}
```

### 9.6 Pipeline Batch Processing

```python
"""
batch_processor.py
Traitement batch avec gestion des quotas
"""
import asyncio
from datetime import datetime
import json

class BatchProcessor:
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator
        self.results = []
        self.failed = []

    async def process_from_file(self, filepath: str):
        """Process prompts from JSON file"""
        with open(filepath) as f:
            prompts = json.load(f)

        print(f"Processing {len(prompts)} prompts...")
        print(f"Capacity: {self.orchestrator.get_daily_capacity()}")

        results = await self.orchestrator.generate_batch(prompts)

        for prompt, result in zip(prompts, results):
            if result.success:
                self.results.append({
                    'prompt': prompt,
                    'provider': result.provider,
                    'timestamp': datetime.now().isoformat()
                })
            else:
                self.failed.append({
                    'prompt': prompt,
                    'error': result.error
                })

        self._save_report()
        return self.results

    def _save_report(self):
        report = {
            'timestamp': datetime.now().isoformat(),
            'success_count': len(self.results),
            'failed_count': len(self.failed),
            'results': self.results,
            'failed': self.failed,
            'remaining_capacity': self.orchestrator.get_daily_capacity()
        }

        with open(f"batch_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", 'w') as f:
            json.dump(report, f, indent=2)
```

---

## 10. RECOMMANDATIONS PAR CAS D'USAGE

### 10.1 Marketing & Ads

| Besoin | Solution Recommandée | Coût |
|--------|---------------------|------|
| Images social media | Gemini (500/jour) | Gratuit |
| Bannières web | GSAP + images Gemini | Gratuit |
| Vidéos courtes (<15s) | Grok Imagine | Gratuit* |
| Vidéos pro (>15s) | Kling ou Runway | $0.125-0.25/5s |
| Animations email | Lottie + images | Gratuit |

### 10.2 Branding & Logos

| Besoin | Solution Recommandée | Coût |
|--------|---------------------|------|
| Logo statique | Gemini ou Grok Aurora | Gratuit |
| Logo animé web | GSAP | Gratuit |
| Logo animé vidéo | Grok Imagine ou Kling | Gratuit* à $0.125/5s |
| Variations de logo | Gemini batch | Gratuit |

### 10.3 Contenu Client

| Besoin | Solution Recommandée | Coût |
|--------|---------------------|------|
| Mockups produit | Leonardo (qualité) | 150 tok/jour |
| Photos produit | Gemini | Gratuit |
| Vidéos démo | Kling 1080p | $0.25/5s |
| Présentations | GSAP + Lottie | Gratuit |

### 10.4 Site Web Agence

| Élément | Solution | Coût |
|---------|----------|------|
| Hero animé | GSAP ScrollTrigger | Gratuit |
| Illustrations | Gemini | Gratuit |
| Icônes animées | Lottie | Gratuit |
| Vidéo background | Grok ou Kling | Variable |
| Portfolio items | Multi-provider | Gratuit |

---

## 11. ROADMAP ET ÉVOLUTIONS

### 11.1 Actions Immédiates (Semaine 1)

- [ ] Créer comptes API: Gemini, xAI, Leonardo
- [ ] Configurer environnement de développement
- [ ] Tester quotas gratuits de chaque provider
- [ ] Implémenter orchestrateur de base
- [ ] Setup GSAP + Lottie pour animations web

### 11.2 Court Terme (Mois 1)

- [ ] Développer pipeline de batch processing
- [ ] Créer bibliothèque de prompts optimisés
- [ ] Intégrer workflow n8n ou Make
- [ ] Documenter les meilleures pratiques
- [ ] Évaluer qualité par provider

### 11.3 Moyen Terme (Mois 2-3)

- [ ] Évaluer ROI de la stratégie gratuite
- [ ] Décider des upgrades payants si nécessaire
- [ ] Optimiser les prompts pour chaque provider
- [ ] Créer templates d'animations réutilisables
- [ ] Former l'équipe sur les outils

### 11.4 Points de Vigilance

```
⚠️ À SURVEILLER:
├── Expiration promotion Grok Imagine (vérifier régulièrement)
├── Changements de pricing (industry en évolution)
├── Nouvelles fonctionnalités (Claude image generation?)
├── Qualité des outputs (benchmarks réguliers)
└── Migration Gemini models (deadline Oct 2025)
```

---

## 12. SOURCES ET RÉFÉRENCES

### Documentation Officielle

| Service | Lien |
|---------|------|
| Claude/Anthropic | https://docs.claude.com/ |
| Gemini API | https://ai.google.dev/gemini-api/docs |
| xAI/Grok API | https://docs.x.ai/ |
| Leonardo.ai API | https://docs.leonardo.ai/ |
| Runway API | https://docs.dev.runwayml.com/ |
| GSAP | https://gsap.com/docs/ |
| Lottie | https://airbnb.io/lottie/ |

### Sources Vérifiées (Décembre 2025)

1. **Anthropic - Can Claude produce images?**
   - https://support.claude.com/en/articles/9002504-can-claude-produce-images
   - Vérifié: Claude NE génère PAS d'images

2. **Google - Nano Banana Pro**
   - https://blog.google/technology/ai/nano-banana-pro/
   - https://ai.google.dev/gemini-api/docs/image-generation

3. **xAI - Free Credits Program**
   - https://cloudcredits.io/providers/xai/programs/data-sharing-program
   - https://docs.x.ai/docs/guides/image-generations

4. **Grok Imagine Free**
   - https://www.business-standard.com/technology/tech-news/xai-makes-grok-ai-imagine-image-video-generation-free-for-all-users-details-125080800609_1.html

5. **Veo 3.1 Pricing**
   - https://ai.google.dev/gemini-api/docs/pricing
   - https://developers.googleblog.com/en/veo-3-fast-image-to-video-capabilities-now-available-gemini-api/

6. **Kling API**
   - https://piapi.ai/blogs/kling-api-pricing-features-documentation
   - https://kie.ai/kling/v2-1

7. **Leonardo Pricing**
   - https://leonardo.ai/pricing/

8. **GSAP Free**
   - https://gsap.com/
   - https://github.com/greensock/GSAP

9. **Lottie**
   - https://github.com/airbnb/lottie-web
   - https://lottiefiles.com

---

## CHANGELOG

| Version | Date | Modifications |
|---------|------|---------------|
| 1.1 | 17 Déc 2025 | Architecture Organisme AAA (Section 3) + Workflows enrichis (Section 9) |
| 1.0 | 17 Déc 2025 | Création initiale |

---

## AVERTISSEMENTS

```
⚠️ LIMITATIONS DE CE DOCUMENT:

1. TARIFS: Peuvent changer sans préavis
2. FREE TIERS: Promotions temporaires, vérifier régulièrement
3. FONCTIONNALITÉS: Évoluent rapidement dans l'industrie AI
4. QUALITÉ: Subjective, faire vos propres tests
5. RÉGION: Certains services limités géographiquement

Ce document reflète l'état des connaissances au 17 décembre 2025.
Vérifier les sources officielles pour informations à jour.
```

---

**Document préparé pour:** Agence AAA
**Classification:** Documentation Technique Interne
**Mise à jour recommandée:** Mensuelle
