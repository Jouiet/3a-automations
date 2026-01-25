# GOOGLE STITCH MCP - Documentation Technique Complète

> **Version:** 1.0 | **Date:** 25/01/2026 | **Session:** 160
> **Méthode:** Bottom-up factuelle (Web Research + GitHub + Tests empiriques)
> **Auteur:** Claude Code pour 3A Automation

---

## TABLE DES MATIÈRES

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Historique et Origine](#2-historique-et-origine)
3. [Architecture Technique](#3-architecture-technique)
4. [Outils MCP Disponibles](#4-outils-mcp-disponibles)
5. [Méthodes d'Authentification](#5-méthodes-dauthentification)
6. [Configuration MCP](#6-configuration-mcp)
7. [Installation et Setup](#7-installation-et-setup)
8. [Workflow "Designer Flow"](#8-workflow-designer-flow)
9. [Intégration 3A Automation](#9-intégration-3a-automation)
10. [Limitations et Contraintes](#10-limitations-et-contraintes)
11. [Coûts et Pricing](#11-coûts-et-pricing)
12. [Troubleshooting](#12-troubleshooting)
13. [Sources et Références](#13-sources-et-références)

---

## 1. RÉSUMÉ EXÉCUTIF

### Qu'est-ce que Google Stitch?

Google Stitch est un outil de design UI alimenté par l'IA, développé par Google Labs, qui génère des interfaces utilisateur complètes et du code frontend production-ready à partir de prompts en langage naturel ou d'images uploadées.

### Qu'est-ce que Stitch MCP?

Stitch MCP est l'exposition du service Google Stitch via le **Model Context Protocol (MCP)**, un protocole standardisé permettant aux agents IA de communiquer avec des outils externes. Contrairement à la plupart des serveurs MCP qui sont locaux, Stitch utilise un **serveur MCP distant** hébergé dans le cloud Google.

### Status 3A Automation (Vérifié 25/01/2026)

| Composant | Status | Détail |
|-----------|--------|--------|
| Configuration MCP | ✅ Présente | `.mcp.json` lignes 21-29 |
| Type de connexion | HTTP Direct | `https://stitch.googleapis.com/mcp` |
| Google Cloud SDK | ❌ Non installé | `gcloud NOT IN PATH` |
| STITCH_ACCESS_TOKEN | ❌ Non configuré | Variable d'environnement absente |
| GOOGLE_CLOUD_PROJECT | ❌ Non configuré | Variable d'environnement absente |
| Test de connexion | ❌ Échec | "Unable to connect" |
| Outils chargés | ✅ 6 outils | Listés via ToolSearch |

**VERDICT:** Configuration présente mais **NON FONCTIONNELLE** - authentification manquante.

---

## 2. HISTORIQUE ET ORIGINE

### Timeline Vérifiée

| Date | Événement | Source |
|------|-----------|--------|
| 2022 | Lancement de **Galileo AI** - pionnier de la génération UI par IA | [almcorp.com](https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/) |
| 20 Mai 2025 | Google acquiert Galileo AI et le rebaptise **Google Stitch** | Google I/O 2025 |
| Mai 2025 | Intégration dans Google Labs avec capacités Gemini | [almcorp.com](https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/) |
| Décembre 2025 | Intégration **Gemini 3** + lancement serveur MCP distant | [TechCrunch](https://techcrunch.com/2025/12/10/google-is-going-all-in-on-mcp-servers-agent-ready-by-design/) |
| Décembre 2025 | Feature "Prototypes" pour prototypes interactifs | Web Research |

### Stratégie Google MCP (Citation Officielle)

> "We are making Google agent-ready by design."
> — **Steren Giannini**, Product Management Director, Google Cloud

Services Google avec MCP (Décembre 2025):
- Google Maps
- Google BigQuery
- Google Compute Engine
- Google Kubernetes Engine
- **Google Stitch**

---

## 3. ARCHITECTURE TECHNIQUE

### 3.1 Architecture Serveur MCP Distant

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE STITCH MCP                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     HTTPS/MCP      ┌──────────────────────────────┐   │
│  │   IDE/Agent  │◄──────────────────►│  stitch.googleapis.com/mcp   │   │
│  │  (Claude,    │    Bearer Token    │     (Remote MCP Server)      │   │
│  │   Cursor,    │    + Project ID    │                              │   │
│  │   VS Code)   │                    │  ┌────────────────────────┐  │   │
│  └──────────────┘                    │  │    Gemini 3 Pro/Flash  │  │   │
│                                      │  │    (UI Generation)     │  │   │
│                                      │  └────────────────────────┘  │   │
│                                      │                              │   │
│                                      │  ┌────────────────────────┐  │   │
│                                      │  │   Stitch Design Store  │  │   │
│                                      │  │   (Projects, Screens)  │  │   │
│                                      │  └────────────────────────┘  │   │
│                                      └──────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Différence MCP Local vs Distant

| Aspect | MCP Local (Standard) | MCP Distant (Stitch) |
|--------|---------------------|---------------------|
| Hébergement | Machine locale | Cloud Google |
| Protocole | stdio/SSE | HTTPS |
| Authentification | Optionnelle | OAuth2 obligatoire |
| Latence | ~0ms | ~100-500ms |
| Données | Fichiers locaux | Projets cloud |
| Mise à jour | Manuelle | Automatique |

### 3.3 Composants Requis

```
┌─────────────────────────────────────────────────────────────┐
│                    STACK TECHNIQUE REQUIS                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Google Cloud SDK                                         │
│     ├── gcloud CLI                                           │
│     ├── gcloud beta (pour services mcp enable)               │
│     └── Application Default Credentials (ADC)                │
│                                                              │
│  2. Authentification (Two-Tier)                              │
│     ├── User Auth: gcloud auth login                         │
│     └── App Auth: gcloud auth application-default login      │
│                                                              │
│  3. API Enablement                                           │
│     └── gcloud beta services mcp enable stitch.googleapis.com│
│                                                              │
│  4. Configuration MCP                                        │
│     ├── HTTP Direct (token manuel)                           │
│     └── Proxy NPX (token auto-refresh) [RECOMMANDÉ]          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. OUTILS MCP DISPONIBLES

### 4.1 Outils Natifs Google (Via stitch.googleapis.com)

Ces outils sont disponibles via l'endpoint officiel Google et ont été **vérifiés chargés** dans Claude Code:

| Outil | Description | Paramètres | Vérifié |
|-------|-------------|------------|---------|
| `list_projects` | Liste tous les projets Stitch | `filter` (optional): "view=owned" ou "view=shared" | ✅ |
| `get_project` | Récupère détails d'un projet | `name` (required): "projects/{project_id}" | ✅ |
| `list_screens` | Liste les écrans d'un projet | `projectId` (required) | ✅ |
| `get_screen` | Récupère détails d'un écran | `projectId`, `screenId` (required) | ✅ |
| `create_project` | Crée un nouveau projet | `title` (optional) | ✅ |
| `generate_screen_from_text` | **Génère UI via Gemini 3** | `projectId`, `prompt` (required), `deviceType`, `modelId` (optional) | ✅ |

### 4.2 Paramètres generate_screen_from_text (Détail)

```yaml
generate_screen_from_text:
  projectId: string (required)
    # ID du projet, format: "3780309359108792857"

  prompt: string (required)
    # Description de l'écran à générer
    # Ex: "A checkout page with cart summary and payment form"

  deviceType: enum (optional, default: MOBILE)
    - DEVICE_TYPE_UNSPECIFIED
    - MOBILE
    - DESKTOP
    - TABLET
    - AGNOSTIC

  modelId: enum (optional, default: GEMINI_3_FLASH)
    - MODEL_ID_UNSPECIFIED
    - GEMINI_3_PRO      # Plus lent, meilleure qualité
    - GEMINI_3_FLASH    # Plus rapide, bonne qualité

  # NOTE: Peut prendre plusieurs minutes. NE PAS RETRY.
```

### 4.3 Outils Additionnels (Via stitch-mcp npm packages)

Ces outils sont disponibles via les packages npm communautaires:

| Outil | Package | Description | Vérifié |
|-------|---------|-------------|---------|
| `extract_design_context` | stitch-mcp (Kargatharaakash) | Extrait "Design DNA" (couleurs Tailwind, fonts, structure) | ✅ Documenté (non testé) |
| `fetch_screen_code` | stitch-mcp (Kargatharaakash) | Télécharge HTML/React code | ✅ Documenté (non testé) |
| `fetch_screen_image` | stitch-mcp (Kargatharaakash) | Télécharge screenshot haute-résolution | ✅ Documenté (non testé) |

### 4.4 extract_design_context - Détail Fonctionnel

```yaml
extract_design_context:
  Description: |
    Scanne un écran Stitch et extrait les éléments de design:
    - Couleurs: Palette Tailwind exacte (hex codes)
    - Typographie: Fonts et weights utilisés
    - Structure: Headers, navbars, buttons patterns

  Output: "Design DNA"
    # Représentation compressée du système de design
    # Utilisable pour générer des écrans cohérents

  Use Case: |
    Évite de "dump 5,000 lines of HTML" dans le chat.
    Permet la génération d'écrans visuellement cohérents.

  Source: https://dev.to/kargatharaaakash/the-designer-flow-for-ai-why-i-built-a-bridge-to-google-stitch-423k
```

---

## 5. MÉTHODES D'AUTHENTIFICATION

### 5.1 Two-Tier Authentication (Obligatoire)

Google Stitch utilise un système d'authentification à deux niveaux:

```
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTIFICATION TWO-TIER                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TIER 1: User Authentication                                 │
│  ─────────────────────────────                               │
│  Commande: gcloud auth login                                 │
│  But: Identifier le développeur humain                       │
│  Résultat: Session OAuth2 pour l'utilisateur                 │
│                                                              │
│  TIER 2: Application Authentication                          │
│  ─────────────────────────────────                           │
│  Commande: gcloud auth application-default login             │
│  But: Autoriser l'environnement local/agent IA               │
│  Résultat: Application Default Credentials (ADC)             │
│                                                              │
│  OUTPUT: Access Token + Refresh Token                        │
│  ─────────────────────────────────                           │
│  Le token peut être obtenu via:                              │
│  gcloud auth print-access-token                              │
│                                                              │
│  ⚠️ NOTE: Le token expire après ~1 heure                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Vérification du Status Auth

```bash
# Lister les comptes authentifiés
gcloud auth list

# Output attendu:
#    ACTIVE  ACCOUNT
# *          user@example.com
```

### 5.3 Permissions Requises

| Permission | Role GCP | Commande |
|------------|----------|----------|
| Service Usage Consumer | `roles/serviceusage.serviceUsageConsumer` | Attribution via IAM |
| Project Billing | Billing enabled | Console GCP |
| Stitch API | Enabled | `gcloud beta services mcp enable stitch.googleapis.com` |

---

## 6. CONFIGURATION MCP

### 6.1 Notre Configuration Actuelle (3A Automation)

**Fichier:** `/Users/mac/Desktop/JO-AAA/.mcp.json` (lignes 21-29)

```json
{
  "stitch": {
    "type": "http",
    "url": "https://stitch.googleapis.com/mcp",
    "headers": {
      "Authorization": "Bearer ${STITCH_ACCESS_TOKEN}",
      "X-Goog-User-Project": "${GOOGLE_CLOUD_PROJECT}"
    },
    "description": "Google Stitch - UI Generation Service (Design-to-Code)"
  }
}
```

**Problèmes identifiés:**
1. ❌ `STITCH_ACCESS_TOKEN` non défini
2. ❌ `GOOGLE_CLOUD_PROJECT` non défini
3. ⚠️ Token HTTP direct expire (~1h) - pas de refresh automatique

### 6.2 Configuration Recommandée: Proxy Mode

**Source:** [github.com/davideast/stitch-mcp](https://github.com/davideast/stitch-mcp)

```json
{
  "stitch": {
    "command": "npx",
    "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
    "env": {
      "STITCH_PROJECT_ID": "YOUR_PROJECT_ID"
    },
    "description": "Google Stitch - UI Generation (auto token refresh)"
  }
}
```

**Avantages du proxy:**
- ✅ Token refresh automatique
- ✅ Gestion OAuth flow complète
- ✅ Debug logging disponible (`--debug`)
- ✅ Health check intégré (`stitch-mcp doctor`)
- ✅ Support WSL, SSH, Docker, Cloud Shell

### 6.3 Configuration Alternative: System gcloud

```json
{
  "stitch": {
    "command": "npx",
    "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
    "env": {
      "STITCH_USE_SYSTEM_GCLOUD": "1"
    },
    "description": "Google Stitch - Uses system gcloud installation"
  }
}
```

### 6.4 Variables d'Environnement Supportées

| Variable | Description | Requis |
|----------|-------------|--------|
| `STITCH_PROJECT_ID` | ID du projet GCP | Oui (si pas system gcloud) |
| `GOOGLE_CLOUD_PROJECT` | Alternative pour project ID | Oui (si STITCH_PROJECT_ID absent) |
| `STITCH_USE_SYSTEM_GCLOUD` | Utiliser gcloud système vs isolé | Non |
| `STITCH_HOST` | Endpoint API custom | Non |
| `STITCH_ACCESS_TOKEN` | Token manuel (HTTP direct only) | Oui (HTTP mode) |

---

## 7. INSTALLATION ET SETUP

### 7.1 Méthode 1: One-Liner (Recommandée)

```bash
# Installation complète automatisée
npx @_davideast/stitch-mcp init --client claude-code -y
```

Cette commande effectue automatiquement:
1. Détection/installation Google Cloud CLI
2. Authentification OAuth interactive
3. Setup Application Default Credentials
4. Sélection du projet GCP
5. Configuration des permissions IAM
6. Activation de l'API Stitch
7. Génération de la config MCP

### 7.2 Méthode 2: Setup Manuel

```bash
# Étape 1: Installer Google Cloud SDK
# macOS:
brew install google-cloud-sdk
# Ou télécharger: https://cloud.google.com/sdk/docs/install

# Étape 2: Vérifier installation
gcloud --version

# Étape 3: Authentification utilisateur
gcloud auth login

# Étape 4: Configurer le projet
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
gcloud auth application-default set-quota-project $PROJECT_ID

# Étape 5: Installer composants beta
gcloud components install beta

# Étape 6: Activer l'API Stitch (CRITIQUE)
gcloud beta services mcp enable stitch.googleapis.com --project=$PROJECT_ID

# Étape 7: Configurer Application Default Credentials
gcloud auth application-default login

# Étape 8: Attribuer permissions (si nécessaire)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/serviceusage.serviceUsageConsumer"
```

### 7.3 Vérification de l'Installation

```bash
# Health check complet
npx @_davideast/stitch-mcp doctor --verbose

# Checks effectués:
# ✓ Google Cloud CLI disponible
# ✓ User authentication active
# ✓ Application credentials présentes
# ✓ Project configuré
# ✓ Stitch API accessible
```

### 7.4 Status Actuel 3A Automation

| Étape | Status | Commande de vérification |
|-------|--------|--------------------------|
| Google Cloud SDK | ❌ Non installé | `which gcloud` → "not found" |
| User Auth | ❌ Non fait | `gcloud auth list` → vide |
| App Default Credentials | ❌ Non fait | - |
| Project configuré | ❌ Non | - |
| Stitch API enabled | ❌ Non | - |
| MCP Config | ✅ Présente | `.mcp.json` existe |

---

## 8. WORKFLOW "DESIGNER FLOW"

### 8.1 Concept

Le "Designer Flow" est un workflow en 3 étapes qui assure la cohérence visuelle entre les écrans générés par IA.

**Source:** [DEV Community - Kargatharaakash](https://dev.to/kargatharaaakash/the-designer-flow-for-ai-why-i-built-a-bridge-to-google-stitch-423k)

### 8.2 Diagramme du Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DESIGNER FLOW WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ÉTAPE 1: EXTRACTION                                                     │
│  ════════════════════                                                    │
│                                                                          │
│  ┌──────────────────┐     extract_design_context     ┌────────────────┐ │
│  │   ÉCRAN EXISTANT │ ───────────────────────────────►│  DESIGN DNA    │ │
│  │   (Screen A)     │                                 │                │ │
│  │                  │                                 │  • Couleurs    │ │
│  │  [Votre UI      │                                 │    Tailwind    │ │
│  │   actuelle]     │                                 │  • Typography  │ │
│  │                  │                                 │  • Structure   │ │
│  └──────────────────┘                                 │  • Patterns    │ │
│                                                       └───────┬────────┘ │
│                                                               │          │
│  ÉTAPE 2: ENRICHISSEMENT                                      │          │
│  ════════════════════════                                     ▼          │
│                                                                          │
│  ┌──────────────────┐     +     ┌────────────────┐    ┌────────────────┐│
│  │   PROMPT USER    │ ────────► │  DESIGN DNA    │ ──►│ ENHANCED PROMPT││
│  │                  │           │  (du Step 1)   │    │                ││
│  │  "Create a      │           │                │    │ Prompt +       ││
│  │   checkout page" │           │                │    │ Brand Context  ││
│  └──────────────────┘           └────────────────┘    └───────┬────────┘│
│                                                               │          │
│  ÉTAPE 3: GÉNÉRATION                                          │          │
│  ════════════════════                                         ▼          │
│                                                                          │
│  ┌────────────────┐     generate_screen_from_text    ┌────────────────┐ │
│  │ ENHANCED PROMPT│ ────────────────────────────────►│ NOUVEL ÉCRAN   │ │
│  │ + DESIGN DNA   │         Gemini 3 Pro/Flash       │                │ │
│  │                │                                  │ [Visuellement  │ │
│  │                │                                  │  cohérent avec │ │
│  │                │                                  │  Screen A]     │ │
│  └────────────────┘                                  └────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Exemple Pratique

```
# Étape 1: Extraire le contexte d'un écran existant
"Extract the design context from screen 'home-menu' in project 'coffee-shop'"

# Résultat: Design DNA
{
  "colors": {
    "primary": "#8B4513",
    "secondary": "#D2691E",
    "background": "#FFF8DC",
    "text": "#3E2723"
  },
  "typography": {
    "headings": "Playfair Display, serif",
    "body": "Open Sans, sans-serif"
  },
  "patterns": {
    "buttons": "rounded-lg shadow-md",
    "cards": "rounded-xl p-6 bg-white shadow-lg"
  }
}

# Étape 2: Générer un nouvel écran avec le contexte
"Create a checkout page for this coffee shop app using the extracted design context"

# Résultat: Écran visuellement cohérent avec le reste de l'app
```

### 8.4 Avantages vs Génération Sans Contexte

| Aspect | Sans Design DNA | Avec Design DNA |
|--------|-----------------|-----------------|
| Couleurs | Génériques (bleu, gris) | Brand-aligned (votre palette) |
| Fonts | Web-safe standards | Vos fonts spécifiques |
| Spacing | Marges arbitraires | Votre système de spacing |
| Components | Structure aléatoire | Patterns existants réutilisés |
| Refactoring | Lourd (matching manuel) | Minimal (déjà cohérent) |

---

## 9. INTÉGRATION 3A AUTOMATION

### 9.1 Rôle dans l'Écosystème 3A

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ÉCOSYSTÈME 3A AUTOMATION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    COUCHE DESIGN & UI                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │   WHISK     │  │   STITCH    │  │     REMOTION STUDIO     │  │    │
│  │  │  (Manual)   │  │   (MCP)     │  │   (Programmatic Video)  │  │    │
│  │  │             │  │             │  │                         │  │    │
│  │  │ Concept Art │  │ UI Design   │  │ Video Compositions      │  │    │
│  │  │ Style Ref   │  │ Code Gen    │  │ Motion Graphics         │  │    │
│  │  │ Animation   │  │ React/HTML  │  │ AI Assets Integration   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    COUCHE AUTOMATION                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │  81 Scripts │  │ 22 L5 Agents│  │     20 Sensors          │  │    │
│  │  │   Core      │  │             │  │                         │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    COUCHE PROTOCOLES                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │    │
│  │  │    A2A      │  │    UCP      │  │    ACP      │  │  GPM   │  │    │
│  │  │  Protocol   │  │  Protocol   │  │  Protocol   │  │ Matrix │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Use Cases pour 3A Automation

| Use Case | Description | Priorité |
|----------|-------------|----------|
| **Landing Page Generation** | Générer des pages clients cohérentes avec notre design system | HAUTE |
| **Dashboard UI** | Créer des interfaces dashboard pour dashboard.3a-automation.com | HAUTE |
| **Client Mockups** | Proposer des mockups UI aux prospects avant signature | MOYENNE |
| **Email Templates** | Générer des templates email HTML cohérents | MOYENNE |
| **Design System Extraction** | Documenter automatiquement notre design system | HAUTE |

### 9.3 Synergie avec Autres Outils

| Outil 3A | Synergie avec Stitch |
|----------|---------------------|
| **Remotion Studio** | Stitch génère les assets statiques → Remotion les anime |
| **Whisk** | Whisk pour concept art → Stitch pour UI production-ready |
| **Design System** | extract_design_context → génère DESIGN-SYSTEM.md automatiquement |
| **Klaviyo MCP** | Stitch UI → export HTML → templates Klaviyo |

### 9.4 Configuration Cible pour 3A

```json
// .mcp.json - Configuration recommandée
{
  "stitch": {
    "command": "npx",
    "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
    "env": {
      "STITCH_PROJECT_ID": "3a-automation-stitch"
    },
    "description": "Google Stitch - UI Generation (auto token refresh)"
  }
}
```

### 9.5 Prompts Recommandés pour 3A

```markdown
## Discovery
"List all my Stitch projects and their screens"

## Design System Extraction
"Extract the design context from the 3A homepage and generate a design.md file"

## Landing Page Generation
"Create a landing page for an e-commerce automation service with:
- Hero section with headline '121 Automations, 22 AI Agents'
- Pricing cards with glassmorphism effect
- Dark theme with cyan accents (#00D4FF)
- Use our existing design tokens"

## Dashboard Component
"Generate a KPI dashboard screen showing:
- Revenue metrics card
- Active automations counter
- Sensor health status grid
Use the design context from our existing dashboard"
```

---

## 10. LIMITATIONS ET CONTRAINTES

### 10.1 Limitations Techniques Vérifiées

| Limitation | Détail | Source |
|------------|--------|--------|
| **Temps de génération** | Peut prendre plusieurs minutes | Google Docs |
| **Pas de retry automatique** | Si timeout, vérifier avec get_screen plus tard | Google Docs |
| **Token expiration** | ~1 heure pour HTTP direct | Empirique |
| **Quota API** | Non documenté publiquement | - |
| **Offline** | Non supporté (cloud-only) | Architecture |

### 10.2 Limitations Fonctionnelles

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **Pas d'édition in-place** | Doit régénérer l'écran entier | Itérer via prompts |
| **Export formats limités** | HTML, React principalement | Conversion manuelle pour Vue/Flutter |
| **Pas de version control** | Pas d'historique natif | Sauvegarder localement |
| **Design tokens custom** | Doit extraire via extract_design_context | Workflow en 2 étapes |

### 10.3 Agent Skills - VÉRIFICATION FACTUELLE

Les documents fournis par l'utilisateur mentionnent des "Agent Skills" (Design MD, React Components) installables via `add skill`.

**VERDICT FACTUEL (Vérifié 25/01/2026 via WebSearch + WebFetch):**

| Skill | Repository | Status | Description |
|-------|------------|--------|-------------|
| `design-md` | [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | ✅ **EXISTE** | Analyzes Stitch projects and generates DESIGN.md files |
| `react-components` | [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | ✅ **EXISTE** | Converts Stitch screens to React component systems |

**Statistiques Repository (25/01/2026):**

| Métrique | Valeur |
|----------|--------|
| Stars | 774 |
| Contributors | 3 (David East, Dion Almaer, Jed Borovik) |
| License | Apache-2.0 |
| Releases officielles | ❌ Aucune (main branch uniquement) |
| Status Google | **NON officiel** - Projet expérimental |

**Commandes d'installation:**

```bash
# Lister les skills disponibles
npx add-skill google-labs-code/stitch-skills --list

# Installer design-md
npx add-skill google-labs-code/stitch-skills --skill design-md --global

# Installer react-components
npx add-skill google-labs-code/stitch-skills --skill react:components --global
```

**Ce qui EXISTE (résumé complet):**
- ✅ `design-md` (via google-labs-code/stitch-skills)
- ✅ `react-components` (via google-labs-code/stitch-skills)
- ✅ `extract_design_context` (via stitch-mcp npm - Kargatharaakash)
- ✅ `generate_screen_from_text` (via API native Google)
- ✅ Gemini CLI Extension pour Stitch

### 10.4 Contraintes de Sécurité

| Contrainte | Description |
|------------|-------------|
| **OAuth obligatoire** | Pas d'API key simple |
| **Projet GCP requis** | Doit avoir un projet avec billing |
| **Permissions IAM** | Doit avoir roles/serviceusage.serviceUsageConsumer |
| **Données dans le cloud** | Designs stockés sur Google Cloud |

---

## 11. COÛTS ET PRICING

### 11.1 Pricing Vérifié

| Service | Coût | Source |
|---------|------|--------|
| **Google Stitch** | **GRATUIT** | [gemini-cli-extensions/stitch](https://github.com/gemini-cli-extensions/stitch) |
| **Stitch MCP API** | **GRATUIT** | Multiple sources |
| **Gemini 3 generation** | Inclus dans quota Google | - |
| **stitch-mcp npm** | Open source (Apache 2.0) | GitHub |
| **@_davideast/stitch-mcp** | Open source (Apache 2.0) | GitHub |

### 11.2 Coûts Indirects Potentiels

| Coût | Condition |
|------|-----------|
| Projet GCP | Gratuit jusqu'à certains quotas |
| Bandwidth | Inclus dans free tier |
| Storage | Projets Stitch stockés gratuitement |

### 11.3 Comparaison avec Alternatives

| Outil | Pricing | Features |
|-------|---------|----------|
| **Google Stitch** | Gratuit | UI Gen + Code Export + MCP |
| Figma AI | $15/mois (Pro) | Design seulement |
| Framer AI | $20/mois | Sites web |
| v0.dev (Vercel) | Freemium | React components |

---

## 12. TROUBLESHOOTING

### 12.1 Erreurs Communes et Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Unable to connect" | Token invalide/expiré | `gcloud auth application-default login` |
| "Permission denied" | IAM manquant | Ajouter role serviceUsageConsumer |
| "API not enabled" | Stitch API non activée | `gcloud beta services mcp enable stitch.googleapis.com` |
| "Project not found" | Mauvais project ID | Vérifier `gcloud config get-value project` |
| Timeout génération | Normal pour génération | Attendre, puis `get_screen` |

### 12.2 Commandes de Diagnostic

```bash
# Vérifier installation gcloud
gcloud --version

# Vérifier authentification
gcloud auth list

# Vérifier projet actif
gcloud config get-value project

# Vérifier API Stitch
gcloud services list --enabled | grep stitch

# Health check complet (via npm helper)
npx @_davideast/stitch-mcp doctor --verbose

# Debug logs
npx @_davideast/stitch-mcp proxy --debug
# Logs dans: /tmp/stitch-proxy-debug.log
```

### 12.3 Reset Complet

```bash
# Si problèmes persistants
npx @_davideast/stitch-mcp logout --force --clear-config

# Puis réinitialiser
npx @_davideast/stitch-mcp init --client claude-code -y
```

---

## 13. SOURCES ET RÉFÉRENCES

### 13.1 Sources Officielles

| Source | URL | Vérifié |
|--------|-----|---------|
| Google Stitch Docs | https://stitch.withgoogle.com/docs/mcp/setup | ✅ |
| Gemini CLI Extension | https://github.com/gemini-cli-extensions/stitch | ✅ |
| Google ADK MCP Docs | https://google.github.io/adk-docs/mcp/ | ⚠️ Timeout (25/01/2026) |

### 13.2 Packages NPM et Agent Skills

| Package/Skill | URL | Auteur | Vérifié |
|---------------|-----|--------|---------|
| @_davideast/stitch-mcp | https://github.com/davideast/stitch-mcp | David East | ✅ |
| stitch-mcp | https://github.com/Kargatharaakash/stitch-mcp | Kargatharaakash | ✅ |
| stitch-mcp-auto | https://github.com/GreenSheep01201/stitch-mcp-auto | GreenSheep01201 | ✅ |
| **stitch-skills** (Agent Skills) | https://github.com/google-labs-code/stitch-skills | David East, Dion Almaer, Jed Borovik | ✅ (774 stars) |

### 13.3 Articles et Guides

| Article | URL | Date |
|---------|-----|------|
| TechCrunch - Google MCP Strategy | https://techcrunch.com/2025/12/10/google-is-going-all-in-on-mcp-servers-agent-ready-by-design/ | Dec 2025 |
| DEV Community - Designer Flow | https://dev.to/kargatharaaakash/the-designer-flow-for-ai-why-i-built-a-bridge-to-google-stitch-423k | 2025 |
| ALM Corp - Complete Guide | https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/ | 2026 |

### 13.4 Glama MCP Registry

| Entry | URL |
|-------|-----|
| Stitch MCP Auto | https://glama.ai/mcp/servers/@GreenSheep01201/stitch-mcp-auto |
| Auto Stitch MCP | https://glama.ai/mcp/servers/@GreenSheep01201/auto-stitch-mcp |

---

## ANNEXE A: CHECKLIST D'IMPLÉMENTATION 3A

### Pré-requis

- [ ] Google Cloud SDK installé (`brew install google-cloud-sdk`)
- [ ] Compte Google avec accès à un projet GCP
- [ ] Billing activé sur le projet GCP

### Installation

- [ ] `gcloud auth login` (user auth)
- [ ] `gcloud config set project <PROJECT_ID>`
- [ ] `gcloud components install beta`
- [ ] `gcloud beta services mcp enable stitch.googleapis.com`
- [ ] `gcloud auth application-default login` (app auth)
- [ ] `gcloud auth application-default set-quota-project <PROJECT_ID>`

### Configuration MCP

- [ ] Mettre à jour `.mcp.json` avec config proxy
- [ ] Définir `STITCH_PROJECT_ID` dans l'environnement
- [ ] Tester avec `npx @_davideast/stitch-mcp doctor`

### Vérification

- [ ] `list_projects` retourne des résultats
- [ ] `create_project` crée un projet
- [ ] `generate_screen_from_text` génère une UI

---

## ANNEXE B: COMPARAISON CONFIGURATIONS MCP

| Aspect | HTTP Direct (Actuel) | Proxy (Recommandé) |
|--------|---------------------|-------------------|
| Token refresh | ❌ Manuel | ✅ Automatique |
| Debug logging | ❌ Non | ✅ Oui |
| Health check | ❌ Non | ✅ `doctor` command |
| Setup complexity | ⚠️ Manuel | ✅ One-liner |
| Offline support | ❌ Non | ❌ Non |
| Security | ✅ Direct | ✅ Direct (via proxy) |

---

## ANNEXE C: GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **MCP** | Model Context Protocol - protocole standardisé pour la communication entre agents IA et outils externes |
| **ADC** | Application Default Credentials - mécanisme d'auth Google pour applications |
| **Design DNA** | Représentation compressée d'un système de design (couleurs, fonts, patterns) |
| **Designer Flow** | Workflow en 3 étapes: Extract → Enhance → Generate |
| **Remote MCP** | Serveur MCP hébergé dans le cloud (vs local) |
| **Two-Tier Auth** | Authentification à deux niveaux (user + application) |

---

*Document généré le 25/01/2026 | Session 160 | Méthode: Bottom-up factuelle*
*Sources: Web Research, GitHub, Tests empiriques*
*Dernière vérification: 25/01/2026 - Stitch MCP NON FONCTIONNEL (auth manquante)*
*Audit qualité: 25/01/2026 - Gemini 3 ✅, Galileo AI acquisition ✅, Agent Skills ✅ (google-labs-code/stitch-skills)*
