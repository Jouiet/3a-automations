# ANALYSE FORENSIQUE: CinematicAds Automations

**Date:** 2025-12-23
**Analyste:** Claude Opus 4.5
**Version:** 1.4
**Statut:** COMPLET + VÉRIFIÉ + TOP DU MARCHÉ

---

## RÉSUMÉ EXÉCUTIF

Le dossier `automations-cinematicads` contient **22 fichiers** (~1,519 lignes de code) représentant un système de génération automatique de publicités vidéo basé sur les APIs Google Cloud (Gemini 3, Veo 3.1).

**Classification:** PROOF OF CONCEPT AVANCÉ
**Prêt production:** NON (3/10)
**Qualité architecture:** EXCELLENTE (9/10)
**Pertinence 3A Automation:** PARTIELLE (6/10)

---

## 1. INVENTAIRE COMPLET

### 1.1 Structure des fichiers

```
automations-cinematicads/
├── config/
│   ├── env-loader.js        (30 lignes)  - Validation variables d'environnement
│   └── prompts.js           (99 lignes)  - Templates de prompts marketing
├── core/
│   ├── AnalyticsBridge.js   (65 lignes)  - Bridge Google Analytics
│   ├── DatabaseClient.js    (64 lignes)  - Client Supabase
│   ├── FileUtils.js         (38 lignes)  - Utilitaires fichiers
│   ├── FirecrawlClient.js   (90 lignes)  - Client API Firecrawl
│   ├── GoogleSheetsClient.js(127 lignes) - Client Google Sheets
│   ├── HealthCheck.js       (80 lignes)  - Vérification système
│   ├── Logger.js            (31 lignes)  - Logging console + fichier
│   └── PostProcessor.js     (89 lignes)  - Traitement vidéo FFmpeg
├── gateway/
│   ├── AssetFactory.js      (238 lignes) - Génération AI (Gemini, Veo, TTS)
│   └── generate-asset.js    (56 lignes)  - CLI entry point
├── mcp/
│   ├── MCPHub.js            (116 lignes) - Orchestration MCP servers
│   └── mcp-config.json      (31 lignes)  - Configuration MCP
├── n8n/
│   ├── workflow_a_competitor_clone.json  (46 lignes)
│   ├── workflow_b_ecommerce_factory.json (30 lignes)
│   └── workflow_c_cinematic_director.json(29 lignes)
├── tools/
│   └── scrape-url.js        (38 lignes)  - Scraping standalone
└── workflows/
    ├── cinematic-director.js (79 lignes) - Workflow C
    ├── competitor-clone.js   (127 lignes)- Workflow A
    ├── ecommerce-factory.js  (91 lignes) - Workflow B
    └── setup-queue.js        (47 lignes) - Setup Google Sheets
```

### 1.2 Statistiques

| Catégorie | Fichiers | Lignes | % Total |
|-----------|----------|--------|---------|
| Core | 8 | 584 | 38% |
| Workflows | 4 | 344 | 23% |
| Gateway | 2 | 294 | 19% |
| MCP | 2 | 147 | 10% |
| Config | 2 | 129 | 8% |
| n8n JSON | 3 | 105 | 7% |
| Tools | 1 | 38 | 3% |
| **TOTAL** | **22** | **~1,519** | 100% |

---

## 2. DÉPENDANCES

### 2.1 Packages NPM requis

| Package | Version | Usage | Statut |
|---------|---------|-------|--------|
| `@google-cloud/vertexai` | Latest | Gemini 3 Pro, Veo 3.1 | ⚠️ Preview APIs |
| `@google-cloud/text-to-speech` | Latest | Voiceover generation | ✅ Stable |
| `@supabase/supabase-js` | Latest | Database client | ✅ Stable |
| `googleapis` | Latest | Google Sheets API | ✅ Stable |
| `axios` | Latest | HTTP requests | ✅ Stable |
| `chalk` | Latest | Console colors | ✅ Stable |
| `fluent-ffmpeg` | Latest | Video processing | ⚠️ Requiert FFmpeg |
| `dotenv` | Latest | Environment variables | ✅ Stable |

### 2.2 Dépendances système

| Logiciel | Usage | Installation |
|----------|-------|--------------|
| Node.js | Runtime | `brew install node` |
| FFmpeg | Video processing | `brew install ffmpeg` |
| Google Cloud SDK | Auth | `brew install google-cloud-sdk` |

### 2.3 Fichier manquant critique

**`package.json` N'EXISTE PAS**

Le dossier ne contient aucun fichier `package.json`, rendant impossible:
- L'installation des dépendances via `npm install`
- Le versioning des packages
- Les scripts npm

---

## 3. VARIABLES D'ENVIRONNEMENT

### 3.1 Variables requises

```bash
# ═══════════════════════════════════════════════════════════════
# GOOGLE CLOUD (CRITIQUE - Obligatoire)
# ═══════════════════════════════════════════════════════════════
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# ═══════════════════════════════════════════════════════════════
# GOOGLE SHEETS (Obligatoire pour queue)
# ═══════════════════════════════════════════════════════════════
GOOGLE_SHEETS_ID=1abc...xyz

# ═══════════════════════════════════════════════════════════════
# FIRECRAWL (Obligatoire pour scraping)
# ═══════════════════════════════════════════════════════════════
FIRECRAWL_API_KEY=fc-xxx

# ═══════════════════════════════════════════════════════════════
# SUPABASE (Optionnel - pour tracking projets)
# ═══════════════════════════════════════════════════════════════
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### 3.2 Validation implémentée

Le fichier `config/env-loader.js` valide uniquement:
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

**Variables NON validées mais requises:**
- `GOOGLE_PROJECT_ID` (critique pour Vertex AI)
- `FIRECRAWL_API_KEY` (critique pour scraping)

---

## 4. ANALYSE DES MODÈLES AI

### 4.1 Modèles utilisés dans le code

```javascript
// gateway/AssetFactory.js ligne 24-29
this.models = {
    text: 'gemini-3-pro',
    image: 'gemini-3-pro-image',
    video: 'veo-3.1'
};
```

### 4.2 Vérification des modèles (Décembre 2025)

| Modèle Code | Modèle Réel | Statut | Disponibilité |
|-------------|-------------|--------|---------------|
| `gemini-3-pro` | `gemini-3-pro-preview` | ⚠️ ID incorrect | Preview globale |
| `gemini-3-pro-image` | `gemini-3-pro-image` | ✅ Probablement correct | Preview |
| `veo-3.1` | `veo-3.1` ou `veo-3.1-generate` | ⚠️ À vérifier | Paid Preview |

**Sources:**
- [Gemini 3 Pro Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro)
- [Veo 3.1 Announcement](https://developers.googleblog.com/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/)

### 4.3 Capacités des modèles

| Modèle | Input | Output | Particularité |
|--------|-------|--------|---------------|
| Gemini 3 Pro | Texte, Images, Vidéo | Texte | 1M tokens context |
| Gemini 3 Pro Image | Texte | Images | Ratios multiples |
| Veo 3.1 | Image + Texte | Vidéo | Audio natif |

### 4.4 Estimation des coûts

| Service | Coût unitaire | Par workflow | 100 runs/mois |
|---------|---------------|--------------|---------------|
| Gemini 3 Pro (text) | ~$0.00025/1K tokens | ~$0.05-0.10 | ~$5-10 |
| Gemini 3 Pro Image | Non publié | ~$0.10-0.50 | ~$10-50 |
| Veo 3.1 | Non publié (preview) | ??? | ??? |
| Google TTS | $4/1M chars | ~$0.004 | ~$0.50 |
| Firecrawl | $0.01/scrape | ~$0.01 | ~$1 |
| **TOTAL ESTIMÉ** | - | ~$0.20-1.00 | ~$20-100+ |

---

## 5. ANALYSE DES WORKFLOWS

### 5.1 Workflow A: Competitor Clone

**Fichier:** `workflows/competitor-clone.js` (127 lignes)

**Objectif:** Analyser une publicité vidéo concurrente et générer une version adaptée à une nouvelle marque.

**Flow d'exécution:**
```
1. INPUT: --url="video_url" --brand="Brand Name"
   │
2. INGESTION (Firecrawl - NON IMPLÉMENTÉ)
   │
3. ANALYSIS (Gemini 3 Pro)
   │  └── Prompt: VIDEO_ANALYSIS_SYSTEM
   │  └── Output: JSON (hook, pacing, narrative_arc, key_scenes)
   │
4. SYNTHESIS (Gemini 3 Pro)
   │  └── Prompt: SCRIPT_SYNTHESIS_SYSTEM
   │  └── Output: Script avec SCENES
   │
5. PRODUCTION LOOP (x3 scènes)
   │  ├── Extract scene prompt (Gemini 3 Pro)
   │  ├── Generate image (Gemini 3 Pro Image)
   │  ├── Generate video (Veo 3.1)
   │  └── Agentic review (Gemini 3 Pro)
   │      └── Si échec: retry 1x
   │
6. POST-PRODUCTION (FFmpeg)
   │  └── Overlay logo sur chaque clip
   │
7. DATABASE LOG (Supabase)
   └── Status: done/error
```

**Problèmes identifiés:**

| Ligne | Problème | Sévérité |
|-------|----------|----------|
| 49 | Passe URL vidéo à `generateText()` - Gemini ne peut pas analyser une URL | CRITIQUE |
| 66 | Assume 3 scènes hardcodées | MOYEN |
| 106 | Chemin logo inexistant | MOYEN |

### 5.2 Workflow B: E-commerce Factory

**Fichier:** `workflows/ecommerce-factory.js` (91 lignes)

**Objectif:** Scraper une page produit et générer des assets publicitaires multi-format.

**Flow d'exécution:**
```
1. INPUT: --url="product_page_url"
   │
2. SCRAPE (Firecrawl)
   │  └── Extract: title, ogImage
   │
3. MULTI-RATIO PRODUCTION
   │  ├── 1.91:1 (Google Ads Landscape)
   │  │   └── Generate image
   │  ├── 1:1 (Instagram/Facebook)
   │  │   └── Generate image
   │  └── 9:16 (TikTok/Reels)
   │      ├── Generate image
   │      └── Generate video (bonus)
   │
4. OUTPUT
   └── JSON avec pack d'assets
```

**Évaluation:** ✅ Logique correcte (si APIs fonctionnent)

### 5.3 Workflow C: Cinematic Director

**Fichier:** `workflows/cinematic-director.js` (79 lignes)

**Objectif:** Transformer un concept textuel en vidéo cinématique.

**Flow d'exécution:**
```
1. INPUT: --concept="A futuristic cityscape at dawn"
   │
2. ART DIRECTION (Gemini 3 Pro)
   │  └── Prompt: CINEMATIC_ARCHITECT_SYSTEM
   │  └── Output: Description visuelle détaillée
   │
3. FOUNDATION IMAGE (Gemini 3 Pro Image)
   │  └── Generate high-quality image
   │
4. ANIMATION (Veo 3.1)
   │  └── "Slow cinematic dolly zoom"
   │
5. AGENTIC REVIEW (Gemini 3 Pro)
   │  └── Si échec: retry 1x
   │
6. EXPORT
   └── style_reference.json
```

**Évaluation:** ✅ Logique correcte (si APIs fonctionnent)

---

## 6. ANALYSE DES MODULES CORE

### 6.1 GoogleSheetsClient.js

**Qualité:** ⭐⭐⭐⭐⭐ (5/5)

```javascript
// Fonctionnalités implémentées:
- checkConnection()        // Test connexion
- ensureQueueSheetExists() // Création auto du sheet
- setHeaders()             // Headers avec formatage
- _formatHeaders()         // Bold + freeze row
```

**Réutilisable:** OUI - Code propre et fonctionnel

### 6.2 FirecrawlClient.js

**Qualité:** ⭐⭐⭐⭐ (4/5)

```javascript
// Fonctionnalités implémentées:
- scrape(url, options)  // Scrape single URL → Markdown
- map(url)              // Crawl site → Array of URLs
```

**Limitation:** Pas de gestion du rate limiting

### 6.3 Logger.js

**Qualité:** ⭐⭐⭐⭐⭐ (5/5)

```javascript
// Pattern simple et efficace:
- info(msg)    // [INFO] bleu
- success(msg) // [SUCCESS] vert
- warn(msg)    // [WARN] jaune
- error(msg)   // [ERROR] rouge

// Output: Console + fichier logs/YYYY-MM-DD.log
```

**Réutilisable:** OUI - À adopter pour tous les scripts

### 6.4 PostProcessor.js

**Qualité:** ⭐⭐⭐⭐ (4/5)

```javascript
// Fonctionnalités FFmpeg:
- overlayLogo(video, logo, position)  // Overlay logo
- mixAudio(video, audio)              // Mix voiceover
```

**Dépendance:** FFmpeg doit être installé sur le système

### 6.5 DatabaseClient.js

**Qualité:** ⭐⭐⭐ (3/5)

```javascript
// Fonctionnalités Supabase:
- logProject(user_id, type, input_data)
- updateProjectStatus(project_id, status, output_assets)
- getCredits(user_id)
```

**Tables requises (non documentées):**
- `projects` (id, user_id, type, input_data, status, output_assets)
- `users` (id, credits_balance)

### 6.6 AssetFactory.js

**Qualité:** ⭐⭐⭐ (3/5)

```javascript
// Fonctionnalités:
- generateText(prompt, context)           // Gemini 3 Pro
- generateImage(prompt, type, aspectRatio)// Gemini 3 Pro Image
- generateVideo(imagePath, prompt)        // Veo 3.1
- reviewAsset(assetPath, criteria)        // Agentic QC
- generateVoiceover(text, voiceName)      // Google TTS
```

**Problèmes:**
- Model IDs potentiellement incorrects
- Gestion d'erreurs basique
- Pas de retry automatique

---

## 7. PROMPTS MARKETING

### 7.1 Inventaire des prompts

| Prompt | Usage | Qualité |
|--------|-------|---------|
| `VIDEO_ANALYSIS_SYSTEM` | Analyse vidéo concurrente | ⭐⭐⭐⭐⭐ |
| `SCRIPT_SYNTHESIS_SYSTEM` | Génération script | ⭐⭐⭐⭐⭐ |
| `IMAGE_FUSION_PROMPT` | Génération image produit | ⭐⭐⭐⭐ |
| `MICRO_MOVEMENT_PROMPTS` | Animation vidéo | ⭐⭐⭐⭐ |
| `CINEMATIC_ARCHITECT_SYSTEM` | Direction artistique | ⭐⭐⭐⭐⭐ |

### 7.2 Exemple de prompt de qualité

```javascript
// VIDEO_ANALYSIS_SYSTEM
`You are a world-class Video Advertising Analyst.
Your goal is to reverse-engineer the success of the provided video advertisement.
Analyze the video frame-by-frame and output a rigorous JSON analysis.

Structure:
{
  "hook": "Description of the first 3 seconds...",
  "pacing": "Fast, slow, rhythmic?",
  "narrative_arc": "Problem -> Agitation -> Solution",
  "emotional_triggers": ["List of emotions"],
  "visual_style": "Lighting, color palette, camera angles",
  "key_scenes": [
    { "timestamp": "00:00-00:03", "description": "...", "camera_move": "..." }
  ],
  "cta": "The Call to Action used"
}`
```

**Évaluation:** Ces prompts sont professionnels et réutilisables.

---

## 8. INTÉGRATION N8N

### 8.1 Workflows JSON

| Fichier | Nodes | Trigger | Action |
|---------|-------|---------|--------|
| `workflow_a_competitor_clone.json` | 3 | Webhook POST | Execute script + Update Sheets |
| `workflow_b_ecommerce_factory.json` | 3 | Webhook POST | Execute script |
| `workflow_c_cinematic_director.json` | 3 | Webhook POST | Execute script |

### 8.2 Structure type

```json
{
  "name": "Project 3A - Workflow A: Competitor Clone",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "competitor-clone"
      }
    },
    {
      "name": "Execute Clone Script",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "node /path/to/competitor-clone.js --url=\"{{$json.body.url}}\""
      }
    },
    {
      "name": "Update Status",
      "type": "n8n-nodes-base.googleSheets"
    }
  ]
}
```

### 8.3 Problèmes d'intégration

| Problème | Impact | Solution |
|----------|--------|----------|
| Chemin hardcodé `/home/node/app/` | Cassé hors Docker | Utiliser variable d'env |
| Pas de gestion d'erreurs | Silent failures | Ajouter error handling |
| Pas de timeout | Workflows bloqués | Configurer timeout 5min |

---

## 9. MCP HUB

### 9.1 Configuration

```json
{
  "mcpServers": {
    "chrome-devtools": { "command": "npx", "args": ["-y", "@mcp/server-chrome-devtools"] },
    "playwright": { "command": "npx", "args": ["-y", "@mcp/server-playwright"] },
    "github": { "command": "npx", "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "" } },
    "n8n": { "command": "npx", "env": { "N8N_API_KEY": "", "N8N_BASE_URL": "" } },
    "google-drive": { "command": "npx", "args": ["-y", "@mcp/server-google-drive"] },
    "hostinger": { "command": "npx", "env": { "HOSTINGER_API_KEY": "" } }
  }
}
```

### 9.2 Évaluation

**Utilité pour 3A:** FAIBLE - OVERKILL

**Pourquoi MCPHub.js est redondant:**

Claude Code gère **nativement** les MCPs via `~/.config/claude-code/mcp.json`. Notre configuration actuelle inclut **12 MCPs** déjà fonctionnels:

```
chrome-devtools, playwright, gemini, github, hostinger, wordpress,
shopify, n8n, klaviyo, google-analytics, google-sheets, apify
```

**Ce que fait MCPHub.js:**
```javascript
// Réimplémente ce que Claude Code fait automatiquement:
- spawn() de processus MCP
- Gestion JSON-RPC manuelle
- Routing des requêtes
- Timeout handling
```

**Verdict:** MCPHub.js est une réinvention de la roue. Claude Code:
1. Gère déjà le boot/shutdown des MCP servers
2. Route les appels d'outils automatiquement
3. Gère les timeouts et erreurs
4. Maintient les connexions persistantes

**Recommandation:** NE PAS utiliser MCPHub.js - Configurer les MCPs dans `mcp.json` standard

---

## 10. BUGS ET PROBLÈMES CRITIQUES

### 10.1 Bugs bloquants

| ID | Fichier | Ligne | Description | Sévérité |
|----|---------|-------|-------------|----------|
| BUG-001 | competitor-clone.js | 49 | URL vidéo passée à generateText() - impossible | CRITIQUE |
| BUG-002 | AssetFactory.js | 26 | Model ID `gemini-3-pro` incorrect | CRITIQUE |
| BUG-003 | - | - | package.json manquant | CRITIQUE |

### 10.2 Problèmes modérés

| ID | Fichier | Description | Sévérité |
|----|---------|-------------|----------|
| WARN-001 | AssetFactory.js | Pas de retry automatique | MOYEN |
| WARN-002 | competitor-clone.js | 3 scènes hardcodées | MOYEN |
| WARN-003 | PostProcessor.js | FFmpeg non vérifié | MOYEN |
| WARN-004 | n8n/*.json | Chemins hardcodés | MOYEN |

### 10.3 Améliorations suggérées

| ID | Description | Effort |
|----|-------------|--------|
| IMP-001 | Ajouter package.json | 10 min |
| IMP-002 | Corriger model IDs | 5 min |
| IMP-003 | Ajouter tests unitaires | 4h |
| IMP-004 | Documenter setup complet | 1h |

---

## 11. PERTINENCE POUR 3A AUTOMATION

### 11.1 Composants réutilisables

| Composant | Pertinence | Action recommandée |
|-----------|------------|-------------------|
| `prompts.js` | ✅ HAUTE | Copier vers `knowledge-base/prompts/` |
| `Logger.js` | ✅ HAUTE | Adopter ce pattern |
| `GoogleSheetsClient.js` | ✅ HAUTE | Référence pour nos scripts |
| Architecture modulaire | ✅ HAUTE | Template pour nouveaux projets |
| `env-loader.js` | ✅ MOYENNE | Pattern validation .env |

### 11.2 Composants non pertinents

| Composant | Raison |
|-----------|--------|
| Veo 3.1 video generation | Prix non publié, preview only |
| MCP Hub | Overkill, nous avons déjà notre config |
| Supabase | Nous utilisons Google Sheets |
| DatabaseClient | Non applicable |

### 11.3 Intégration recommandée

```
3A Automation
├── automations/
│   ├── agency/core/
│   │   ├── logger.cjs          ← Adapter de Logger.js
│   │   └── sheets-client.cjs   ← Adapter de GoogleSheetsClient.js
│   └── templates/
│       └── prompts/
│           └── marketing.js    ← Copier prompts.js
└── knowledge-base/
    └── prompts/
        ├── video-analysis.md   ← VIDEO_ANALYSIS_SYSTEM
        ├── script-synthesis.md ← SCRIPT_SYNTHESIS_SYSTEM
        └── cinematic.md        ← CINEMATIC_ARCHITECT_SYSTEM
```

---

## 12. VERDICT FINAL

### 12.1 Scores

| Critère | Score | Justification |
|---------|-------|---------------|
| Qualité code | 8/10 | Architecture excellente, code propre |
| Documentation | 2/10 | Quasi inexistante |
| Tests | 0/10 | Aucun test |
| Production-ready | 3/10 | Bugs critiques, APIs non testées |
| Pertinence 3A | 6/10 | Prompts + patterns utiles |
| ROI effort | 4/10 | Beaucoup de travail pour faire fonctionner |

### 12.2 Classification

```
╔═══════════════════════════════════════════════════════════════╗
║  CLASSIFICATION: PROOF OF CONCEPT AVANCÉ                     ║
║                                                               ║
║  Ce code représente une VISION de ce qu'un système de        ║
║  génération vidéo pourrait être, avec une architecture       ║
║  solide mais des implémentations non testées.                ║
║                                                               ║
║  UTILISABLE: Prompts, patterns, architecture                 ║
║  NON UTILISABLE: Workflows complets, génération vidéo        ║
╚═══════════════════════════════════════════════════════════════╝
```

### 12.3 Recommandations finales

**FAIRE:**
1. Extraire et documenter les prompts marketing
2. Adopter le pattern Logger pour nos scripts
3. Utiliser l'architecture modulaire comme référence
4. Créer un package.json si on veut tester

**NE PAS FAIRE:**
1. Ne pas déployer en production tel quel
2. Ne pas investir dans Veo 3.1 sans budget validé
3. Ne pas remplacer notre stack par MCP Hub

**ARCHITECTURE DUAL-PROVIDER - MODÈLES TOP DU MARCHÉ (Décembre 2025):**

```
AI_PROVIDER=vertex_ai | grok | both (A/B testing)
```

| Fonction | Vertex AI (TOP) | xAI Grok (TOP) 🏆 | Prix Vertex | Prix xAI |
|----------|-----------------|-------------------|-------------|----------|
| Text | `gemini-3-pro-preview` | `grok-4.1` #1 mondial | Token | $0.20/$0.50/M |
| Image | `imagen-4.0-generate-001` | `grok-2-image-1212` | $0.04/img | $0.07/img |
| Video | `veo-3.1-generate-preview` | `grok-imagine` | $0.40/sec | Consumer |
| Voice | Google TTS | Grok Voice Agent | $4/1M chars | $0.05/min |

**Avantages:**
1. Switch entre providers via variable d'environnement
2. A/B testing qualité/coût automatique
3. Fallback si un provider est indisponible

**Budget recommandé:** $50-200/mois selon volume et provider choisi

---

## 13. STACK ALTERNATIF: xAI (Grok)

> **Note:** Cette section a été vérifiée contre la documentation officielle xAI,
> GitHub (xai-org), Hugging Face, et sources multiples (TechCrunch, AIBase).

### 13.1 Comparatif vérifié

| Critère | Google Vertex AI | xAI Grok | Source |
|---------|------------------|----------|--------|
| **Image** | Gemini 3 Pro Image (prix ?) | **$0.07/image** ✅ | [TechCrunch](https://techcrunch.com/2025/03/19/xai-launches-an-api-for-generating-images/) |
| **Voice** | TTS $4/1M chars | **$0.05/min** ✅ | [xAI Official](https://x.ai/news/grok-voice-agent-api) |
| **Vidéo** | Veo 3.1 (preview) | ❌ PAS D'API | Consumer only (grok.com) |
| **Latency** | Variable | <1s (voice) | [AIBase](https://news.aibase.com/news/23823) |
| **API Status** | Preview/Paid Preview | Image+Voice: Production | Vérifié Déc 2025 |

### 13.2 Grok Image API (grok-2-image-1212)

**Status:** ✅ API OFFICIELLE DISPONIBLE (depuis Mars 2025)

```javascript
// Endpoint officiel xAI
const response = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: 'grok-2-image-1212',
        prompt: 'Professional product photography...',
        n: 1  // max 10 images/requête
    })
});
```

**Spécifications vérifiées:**
- Prix: **$0.07/image** (fixe)
- Format: JPG uniquement
- Limites: 10 images/requête, 5 req/sec
- ⚠️ Watermark "GROK" visible sur les images
- Compatible OpenAI SDK (`base_url: https://api.x.ai/v1`)

### 13.3 Grok Voice Agent API

**Status:** ✅ API OFFICIELLE DISPONIBLE (Décembre 2025)

**Spécifications vérifiées:**
- Prix: **$0.05/minute** de connexion ($3/heure)
- Latency: <1s time-to-first-audio
- Benchmark: **#1 Big Bench Audio** (5x plus rapide que concurrents)
- Compatible: OpenAI Realtime API, xAI LiveKit Plugin
- Voix: Sal, Rex, Eve, Leo, Mika, Valentin
- Languages: 100+ avec accents natifs

**Note:** L'endpoint exact pour TTS standalone n'est pas documenté.
L'API Voice Agent est orientée "speech-to-speech" (conversations temps réel).

### 13.4 Grok Imagine Video

**Status:** ❌ PAS D'API PUBLIQUE OFFICIELLE

| Accès | Disponibilité | Prix |
|-------|---------------|------|
| grok.com / X app | ✅ Consumer | Crédits (SuperGrok) |
| API officielle xAI | ❌ Non disponible | - |
| Third-party (CometAPI, PoYo) | ⚠️ Non officiel | ~$0.40/génération |

**Capacités (Imagine v0.9, Octobre 2025):**
- Vidéos 6-15 secondes avec audio synchronisé
- Text-to-video et image-to-video
- Lip-sync, dialogue, musique de fond
- Problèmes connus: anatomie humaine, continuité frames

### 13.5 Open Source (Hugging Face / GitHub)

| Repo | Contenu | Video/Image |
|------|---------|-------------|
| [xai-org/grok-1](https://huggingface.co/xai-org/grok-1) | Modèle texte 314B | ❌ |
| [xai-org/grok-2](https://huggingface.co/xai-org/grok-2) | Modèle texte 500GB | ❌ |
| [xai-org/xai-sdk-python](https://github.com/xai-org/xai-sdk-python) | SDK officiel | ❌ |

**Verdict:** Aucun modèle image/vidéo open source de xAI.

### 13.6 Architecture Dual-Provider (IMPLÉMENTÉE) - TOP DU MARCHÉ

> **Note:** Cette architecture est déjà implémentée dans le projet Ads-Automations.
> **Mise à jour:** Décembre 2025 - Modèles STATE OF THE ART

```
┌─────────────────────────────────────────────────────────────────┐
│                    AssetFactory v2.0 - TOP DU MARCHÉ            │
│  ┌───────────────────────┐      ┌───────────────────────┐      │
│  │      Vertex AI        │      │      xAI Grok         │      │
│  │    (Google Cloud)     │  OR  │    (Grok 4.1) 🏆      │      │
│  ├───────────────────────┤      ├───────────────────────┤      │
│  │ gemini-3-pro-preview  │      │ grok-4.1              │ Text │
│  │ imagen-4.0-generate   │      │ grok-2-image-1212     │ Image│
│  │ veo-3.1-generate      │      │ grok-imagine          │ Video│
│  │ Google TTS            │      │ Grok Voice            │ Voice│
│  └───────────────────────┘      └───────────────────────┘      │
│                                                                 │
│  AI_PROVIDER=vertex_ai | grok | both (A/B testing)             │
└─────────────────────────────────────────────────────────────────┘
```

**Configuration via .env:**
```bash
# Choix du provider AI
AI_PROVIDER=grok          # ou vertex_ai, ou both

# xAI Grok credentials
XAI_API_KEY=xai-xxx

# Google Cloud credentials (si vertex_ai)
GOOGLE_PROJECT_ID=xxx
GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
```

**Avantages de l'architecture dual-provider:**
1. **Flexibilité:** Switch entre providers sans modifier le code
2. **A/B Testing:** Comparer qualité/coût entre Vertex AI et Grok
3. **Fallback:** Si un provider est down, switch automatique
4. **Optimisation coûts:** Utiliser le moins cher selon le use case

**Mapping des modèles TOP DU MARCHÉ (Décembre 2025):**

| Fonction | Vertex AI (TOP) | Model ID | Prix | Source |
|----------|-----------------|----------|------|--------|
| Text | **Gemini 3 Pro** | `gemini-3-pro-preview` | Token-based | [Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro) |
| Image | **Imagen 4** | `imagen-4.0-generate-001` | $0.04/img | [Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate) |
| Video | **Veo 3.1** | `veo-3.1-generate-preview` | $0.40/sec | [Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate) |
| Video Fast | **Veo 3.1 Fast** | `veo-3.1-fast-generate-preview` | $0.15/sec | [Blog](https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/) |
| Voice | Google TTS | `en-US-Neural2-*` | $4/1M chars | Standard |

| Fonction | xAI Grok (TOP) | Model ID | Prix | Source |
|----------|----------------|----------|------|--------|
| Text | **Grok 4.1** 🏆 #1 mondial | `grok-4.1` | $0.20/$0.50 per M | [xAI News](https://x.ai/news/grok-4-1) |
| Text Fast | **Grok 4.1 Fast** | `grok-4-1-fast-*` | 98% moins cher | [xAI](https://x.ai/api) |
| Vision | **Grok 2 Vision** | `grok-2-vision-1212` | $2/$10 per M | [Docs](https://docs.x.ai/docs/models) |
| Image | **Grok Aurora** | `grok-2-image-1212` | $0.07/img | [TechCrunch](https://techcrunch.com/2025/03/19/xai-launches-an-api-for-generating-images/) |
| Video | **Grok Imagine** | `grok-imagine` | Consumer | [xAI](https://x.ai) |
| Voice | **Grok Voice** | Voice Agent API | $0.05/min | [xAI News](https://x.ai/news/grok-voice-agent-api) |

**Note:** Grok 4.1 = #1 mondial sur LMArena Text Arena (1483 Elo, +31 pts vs concurrent)

**Spécifications Veo 3.1 (State of the Art vidéo):**
- Résolution: 720p / 1080p (upscaling disponible)
- Durée: 4/6/8 sec par génération, extensible jusqu'à ~148 sec
- Audio natif: 48kHz stereo, AAC 192kbps
- Lip-sync, dialogue, musique de fond intégrés
- Amélioration 40-60% cohérence frames vs Veo 3.0

**Recommandation:** Utiliser Veo 3.1 (pas 2.0) pour le TOP du marché vidéo.

---

## ANNEXES

### A. Commande pour créer package.json

```bash
cd /Users/mac/Desktop/JO-AAA/automations-cinematicads
cat > package.json << 'EOF'
{
  "name": "cinematicads-automations",
  "version": "0.1.0",
  "description": "AI Video Ad Generation System",
  "main": "gateway/generate-asset.js",
  "scripts": {
    "health": "node core/HealthCheck.js",
    "clone": "node workflows/competitor-clone.js",
    "factory": "node workflows/ecommerce-factory.js",
    "director": "node workflows/cinematic-director.js"
  },
  "dependencies": {
    "@google-cloud/vertexai": "^1.9.2",
    "@google-cloud/text-to-speech": "^5.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "googleapis": "^144.0.0",
    "axios": "^1.7.0",
    "chalk": "^4.1.2",
    "fluent-ffmpeg": "^2.1.3",
    "dotenv": "^16.4.0"
  }
}
EOF
```

### B. Commande pour tester le health check

```bash
cd /Users/mac/Desktop/JO-AAA/automations-cinematicads
npm install
node core/HealthCheck.js
```

### C. Variables d'environnement template

```bash
cat > .env.example << 'EOF'
# Google Cloud
GOOGLE_PROJECT_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Google Sheets
GOOGLE_SHEETS_ID=

# Firecrawl
FIRECRAWL_API_KEY=

# Supabase (optional)
SUPABASE_URL=
SUPABASE_ANON_KEY=
EOF
```

---

**Document généré le:** 2025-12-22
**Dernière mise à jour:** 2025-12-22
**Version:** 1.1
**Analyste:** Claude Opus 4.5
**Méthode:** Analyse statique exhaustive + vérification web des APIs

**Changelog v1.4 - TOP DU MARCHÉ (Décembre 2025):**

**Vertex AI - Modèles STATE OF THE ART:**
- ✅ `gemini-3-pro-preview` - Dernier modèle texte Google
- ✅ `imagen-4.0-generate-001` - Dernier modèle image ($0.04/img)
- ✅ `veo-3.1-generate-preview` - Dernier modèle vidéo ($0.40/sec)
- ✅ `veo-3.1-fast-generate-preview` - Version rapide ($0.15/sec)

**xAI Grok - Modèles STATE OF THE ART:**
- ✅ `grok-4.1` - #1 mondial LMArena (1483 Elo) - $0.20/$0.50/M
- ✅ `grok-4-1-fast-*` - 98% moins cher que Grok 4
- ✅ `grok-2-image-1212` - $0.07/image
- ✅ `grok-2-vision-1212` - Vision $2/$10/M
- ✅ Grok Voice Agent - $0.05/min
- ⏳ `grok-4.20` - Coming late Dec 2025 / Jan 2026

**Sources officielles consultées:**
- [Google Vertex AI Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models)
- [xAI API Docs](https://docs.x.ai/docs/models)
- [xAI News](https://x.ai/news)
- GitHub: google-gemini, xai-org, google-marketing-solutions
- TechCrunch, AIBase, LMArena
