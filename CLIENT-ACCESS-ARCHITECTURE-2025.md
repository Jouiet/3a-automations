# Architecture Technique Accès Clients - 3A Automation
## Version 1.0 | 19 Décembre 2025
## Document de référence opérationnelle

---

## TABLE DES MATIÈRES

1. [Synthèse Exécutive](#synthèse-exécutive)
2. [Modèles d'Architecture Client-Agence](#modèles-darchitecture-client-agence)
3. [Accès Par Plateforme (Patterns Vérifiés)](#accès-par-plateforme)
4. [Clients Sans API - Solutions RPA/Browser](#clients-sans-api)
5. [Gestion des Credentials](#gestion-des-credentials)
6. [Architecture n8n Multi-Client](#architecture-n8n)
7. [Processus d'Onboarding Client](#processus-donboarding)
8. [Framework Décisionnel](#framework-décisionnel)
9. [Sources et Références](#sources)

---

## 1. SYNTHÈSE EXÉCUTIVE

### Question Centrale
> Comment 3A Automation accède-t-il techniquement aux systèmes de ses clients pour implémenter des automatisations ?

### Réponse Factuelle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODÈLE HYBRIDE RECOMMANDÉ                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PRINCIPE: "Le client possède, l'agence opère"                             │
│                                                                              │
│   1. CLIENT POSSÈDE:                                                        │
│      • Ses comptes (Shopify, Klaviyo, GA4, Meta, TikTok)                    │
│      • Ses données et credentials                                           │
│      • Sa facturation et paiements                                          │
│                                                                              │
│   2. AGENCE OPÈRE VIA:                                                      │
│      • Accès Partner/Délégué (OAuth, permissions granulaires)               │
│      • Tokens temporaires avec scopes limités                               │
│      • Isolation stricte par client (/clients/{nom}/.env)                   │
│                                                                              │
│   3. JAMAIS:                                                                │
│      • Revente de services (violates ToS)                                   │
│      • Credentials client dans repo agence                                  │
│      • Accès admin complet sauf nécessité absolue                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Réalité Business

| Scénario Client | % Estimé | Complexité Technique |
|-----------------|----------|---------------------|
| Client avec APIs natives (Shopify, Klaviyo, GA4) | 70% | Faible |
| Client avec système legacy sans API | 15% | Élevée (RPA requis) |
| Client sans système digital | 10% | Setup complet requis |
| Client avec infrastructure custom | 5% | Variable |

---

## 2. MODÈLES D'ARCHITECTURE CLIENT-AGENCE

### Modèle A: Client-Owned (RECOMMANDÉ)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODÈLE A: CLIENT-OWNED                               │
│                    "Le client possède tout, on opère"                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CLIENT                              AGENCE (3A Automation)                │
│   ══════                              ══════════════════════                │
│                                                                              │
│   ┌─────────────────┐                 ┌─────────────────┐                   │
│   │ Shopify Store   │ ──Partner──────▶│ MCP Shopify     │                   │
│   │ (admin access)  │   Access        │ (delegated)     │                   │
│   └─────────────────┘                 └─────────────────┘                   │
│                                                                              │
│   ┌─────────────────┐                 ┌─────────────────┐                   │
│   │ Klaviyo Account │ ──API Key──────▶│ MCP Klaviyo     │                   │
│   │ (owns data)     │   (scoped)      │ (read/write)    │                   │
│   └─────────────────┘                 └─────────────────┘                   │
│                                                                              │
│   ┌─────────────────┐                 ┌─────────────────┐                   │
│   │ GA4 Property    │ ──User Add─────▶│ Analytics MCP   │                   │
│   │ (owns property) │   (editor)      │ (read-only)     │                   │
│   └─────────────────┘                 └─────────────────┘                   │
│                                                                              │
│   ┌─────────────────┐                 ┌─────────────────┐                   │
│   │ Meta Business   │ ──Partner ID───▶│ Meta Ads MCP    │                   │
│   │ (owns accounts) │   (advertiser)  │ (campaigns)     │                   │
│   └─────────────────┘                 └─────────────────┘                   │
│                                                                              │
│   AVANTAGES:                                                                │
│   ✅ Conforme aux ToS de tous les services                                  │
│   ✅ Client conserve propriété et contrôle                                  │
│   ✅ Révocation facile en fin de contrat                                    │
│   ✅ Audit trail clair                                                      │
│                                                                              │
│   INCONVÉNIENTS:                                                            │
│   ⚠️ Dépend de la coopération client pour setup                            │
│   ⚠️ Client doit avoir comptes existants                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modèle B: Agency-Managed (RISQUÉ)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MODÈLE B: AGENCY-MANAGED                              │
│                    "L'agence setup et gère tout"                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ⚠️ ATTENTION: Violates Terms of Service for most platforms!              │
│                                                                              │
│   Zapier ToS: "You agree to use the Service only for your own              │
│   internal business operations, and not to transfer, distribute,            │
│   sell, republish, resell, lease, sublease, license, sublicense,            │
│   whitelabel or assign the Service."                                        │
│                                                                              │
│   QUAND UTILISER (avec précaution):                                         │
│   • Client n'a aucun système existant                                       │
│   • Projet de développement initial (puis transfert)                        │
│   • Accord écrit explicite sur propriété                                    │
│                                                                              │
│   STRUCTURE:                                                                │
│   Agence crée → Agence opère → Transfert au client en fin de contrat       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modèle C: Hybride (NOTRE APPROCHE)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MODÈLE C: HYBRIDE 3A AUTOMATION                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INFRASTRUCTURE AGENCE (nous gérons):                                      │
│   ├── n8n self-hosted (Hostinger VPS)                                       │
│   ├── GitHub Actions (CI/CD)                                                │
│   ├── Scripts génériques (notre IP)                                         │
│   └── Reporting dashboards                                                  │
│                                                                              │
│   INFRASTRUCTURE CLIENT (ils possèdent):                                    │
│   ├── Shopify/WooCommerce store                                             │
│   ├── Klaviyo/Omnisend account                                              │
│   ├── GA4 property                                                          │
│   ├── Meta/TikTok Business accounts                                         │
│   └── Leurs données et paiements                                            │
│                                                                              │
│   CONNEXION:                                                                │
│   ├── OAuth delegated tokens (quand disponible)                             │
│   ├── API keys scoped (stockés dans /clients/{nom}/.env)                    │
│   ├── Partner access (Meta, TikTok, Google)                                 │
│   └── n8n workflows dédiés par client                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ACCÈS PAR PLATEFORME

### 3.1 Shopify

| Méthode | Description | Permissions | Recommandation |
|---------|-------------|-------------|----------------|
| **Partner Access** | Via Shopify Partners Dashboard | Collaborateur store | ✅ RECOMMANDÉ |
| **Custom App** | App privée installée sur store | Scopes définis | ✅ Pour automation |
| **Delegate Token** | Token dérivé d'un parent token | Subset de permissions | Pour microservices |

**Process d'accès:**
```
1. Client va dans Admin > Settings > Users and permissions
2. Click "Add staff" ou "Collaborator request"
3. Entre email agence: contact@3a-automation.com
4. Sélectionne permissions: Products, Orders, Customers, Analytics
5. Agence accepte invitation
6. Pour API: Client crée Custom App avec scopes requis
7. Client partage Access Token (JAMAIS via email non sécurisé)
```

**Scopes API typiques pour automation:**
```
read_products, write_products
read_orders, write_orders
read_customers, write_customers
read_inventory, write_inventory
read_analytics
```

**Source:** [Shopify API Access Scopes](https://shopify.dev/docs/api/usage/access-scopes)

---

### 3.2 Klaviyo

| Méthode | Description | Permissions | Recommandation |
|---------|-------------|-------------|----------------|
| **User Role: Manager** | Accès compte complet | Tout sauf admin | ✅ RECOMMANDÉ |
| **API Key Scoped** | Clé avec scopes limités | Read/Write/Custom | ✅ Pour automation |
| **OAuth App** | Pour intégrations tierces | Tokens délégués | Pour apps publiées |

**Process d'accès:**
```
1. Client va dans Settings > Account > Users
2. Click "Add User"
3. Entre email: contact@3a-automation.com
4. Sélectionne role: "Manager" (recommandé) ou "Analyst"
5. Pour API: Settings > API Keys > Create Private API Key
6. Client définit scopes: lists:read, lists:write, flows:read, etc.
7. Client partage clé via password manager (LastPass, 1Password)
```

**Scopes API recommandés:**
```
lists:read, lists:write
profiles:read, profiles:write
flows:read, flows:write
campaigns:read, campaigns:write
metrics:read
segments:read
```

**Source:** [Klaviyo API Authentication](https://developers.klaviyo.com/en/docs/authenticate_)

---

### 3.3 Google Analytics 4 (GA4)

| Méthode | Description | Permissions | Recommandation |
|---------|-------------|-------------|----------------|
| **Property Access** | Ajout utilisateur property | Editor/Analyst | ✅ RECOMMANDÉ |
| **Service Account** | Machine-to-machine | API only | Pour automation |
| **OAuth App** | User consent flow | Dynamic access | Pour apps multi-tenant |

**Process d'accès:**
```
1. Client va dans GA4 Admin > Property Access Management
2. Click "+ Add users"
3. Entre email: contact@3a-automation.com
4. Sélectionne role:
   - "Analyst": View reports, create explorations (SUFFISANT)
   - "Editor": + Modify configurations, events
5. NE PAS donner "Administrator" (gestion users)

POUR AUTOMATION (Service Account):
1. Client crée projet Google Cloud
2. Enable Analytics Data API
3. Create Service Account
4. Download JSON key
5. Share with agence via secure channel
6. Agence stocke dans /clients/{nom}/service-account.json
```

**⚠️ IMPORTANT:**
> "I almost never grant anyone account level access with manage users
> permissions. That level of access is like giving someone the deed to
> your Google Analytics account."
> — Expert Google Analytics

**Source:** [GA4 Access Management](https://support.google.com/analytics/answer/9305587)

---

### 3.4 Meta (Facebook/Instagram)

| Méthode | Description | Permissions | Recommandation |
|---------|-------------|-------------|----------------|
| **Partner Access** | Via Business Manager | Per-asset permissions | ✅ RECOMMANDÉ |
| **System User** | Pour API automation | Token permanent | Pour CAPI, reporting |

**Process d'accès:**
```
1. Client va dans Business Settings > Users > Partners
2. Click "Add" > Enter Partner Business ID
3. Agence Business ID: [À CRÉER - Meta Business Manager]
4. Client assigne assets:
   - Ad Account: "Advertiser" (pas Admin)
   - Page: "Create content", "Manage comments"
   - Pixel: "Analyze" ou "Edit"
5. Agence accepte dans son Business Manager

POUR CONVERSIONS API:
1. Client crée System User dans Business Settings
2. Generate token avec permissions:
   - ads_management
   - ads_read
   - pages_read_engagement
3. Client partage token (rotation tous 60 jours!)
```

**⚠️ IMPORTANT:**
> "Typically the client should own the ad account, pixel, and payment
> method. Agencies should request partner access."

**Source:** [Meta Partner Access](https://www.connexify.io/blog/meta-business-setup-secure-access-steps-for-agencies)

---

### 3.5 TikTok Business

| Méthode | Description | Permissions | Recommandation |
|---------|-------------|-------------|----------------|
| **Partner Access** | Via Business Center | Per-account permissions | ✅ RECOMMANDÉ |
| **Media Agency Partnership** | Formal agency designation | Full campaign access | Pour clients majeurs |

**Process d'accès:**
```
1. Client va dans TikTok Business Center > Settings > Partners
2. Click "Add Partner"
3. Entre Business Center ID de l'agence
4. Sélectionne assets à partager:
   - Ad Account: Admin/Advertiser/Analyst
   - TikTok Account: Spark Ads permissions
5. Agence accepte invitation

NOTE: TikTok ne permet pas de "demander" accès à pixels,
catalogues, audiences. Le client doit les partager proactivement.
```

**Source:** [TikTok Partner Access](https://ads.tiktok.com/help/article/tiktok-business-center-partners)

---

### 3.6 WordPress Sites

| Méthode | Description | Permissions | Recommandation |
|---------|-------------|-------------|----------------|
| **Admin User** | Compte WordPress | Full access | Pour setup initial |
| **MainWP** | Dashboard centralisé (self-hosted) | Multi-site management | ✅ RECOMMANDÉ agence |
| **ManageWP** | SaaS dashboard | Multi-site management | Alternative cloud |
| **REST API** | Application Password | API access | Pour automation |

**Process d'accès:**
```
OPTION 1: Compte Admin
1. Client crée user admin pour agence
2. Username: 3a-automation
3. Role: Administrator (ou Editor si limité)
4. Agence se connecte et travaille

OPTION 2: MainWP (RECOMMANDÉ pour multi-clients)
1. Installer MainWP Dashboard sur serveur agence
2. Client installe MainWP Child plugin
3. Connexion sécurisée établie
4. Gestion centralisée de tous les sites clients

AVANTAGES MainWP:
- 100% gratuit (core dashboard)
- Self-hosted (pas de données tierces)
- Bulk updates, backups, monitoring
- Client reports automatisés
```

**Source:** [MainWP WordPress Management](https://mainwp.com/)

---

### 3.7 n8n Workflows

| Méthode | Description | Isolation | Recommandation |
|---------|-------------|-----------|----------------|
| **Separate Instances** | 1 instance n8n par client | Complète | Pour gros clients |
| **Shared Instance** | Workflows tagués par client | Logique | ✅ Pour PME |
| **n8n Cloud** | Managed hosting | Par workspace | Si budget client |

**Architecture Multi-Client (Shared Instance):**
```
n8n.srv1168256.hstgr.cloud/
├── Workflows/
│   ├── [alpha-medical] Welcome Email Flow
│   ├── [alpha-medical] Abandoned Cart
│   ├── [henderson] Inventory Sync
│   ├── [henderson] Order Notifications
│   └── [generic] SEO Audit Template
├── Credentials/
│   ├── alpha-medical-shopify
│   ├── alpha-medical-klaviyo
│   ├── henderson-shopify
│   └── henderson-klaviyo
└── Tags/
    ├── client:alpha-medical
    ├── client:henderson
    └── type:template
```

**⚠️ LIMITATION CRITIQUE:**
> "Currently, credentials in n8n nodes must be selected statically at
> design time. This creates a major scalability issue for multi-tenant
> workflows."

**Workaround:** Créer credentials séparés par client, les référencer par ID dans workflows clonés.

**Source:** [n8n Multi-Tenant Architecture](https://community.n8n.io/t/possible-to-do-multi-tenant-workflows-that-can-reference-credentials-dynamically/62218)

---

## 4. CLIENTS SANS API - SOLUTIONS RPA/BROWSER

### Quand utiliser RPA/Browser Automation?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARBRE DE DÉCISION: API vs RPA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Le système client a-t-il une API documentée?                              │
│                     │                                                        │
│          ┌─────────┴─────────┐                                              │
│          ▼                   ▼                                              │
│         OUI                 NON                                             │
│          │                   │                                              │
│          ▼                   ▼                                              │
│   Utiliser API        Le système a-t-il une interface web?                  │
│   (toujours préféré)              │                                         │
│                        ┌─────────┴─────────┐                               │
│                        ▼                   ▼                               │
│                       OUI                 NON                              │
│                        │                   │                               │
│                        ▼                   ▼                               │
│                   Browser               Le système exporte-t-il            │
│                   Automation            des fichiers (CSV, Excel)?         │
│                   (Playwright)                    │                        │
│                                         ┌───────┴───────┐                  │
│                                         ▼               ▼                  │
│                                        OUI             NON                 │
│                                         │               │                  │
│                                         ▼               ▼                  │
│                                    File-based      Screen Scraping         │
│                                    Automation      (dernier recours)       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Solutions Par Complexité

#### 4.1 Browser Automation (Playwright) - RECOMMANDÉ

**Cas d'usage:**
- Portails fournisseurs sans API
- ERP legacy avec interface web
- Sites gouvernementaux
- Dashboards propriétaires

**Notre stack:**
```javascript
// Playwright MCP déjà configuré
// ~/.config/claude-code/mcp.json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@playwright/mcp"]
  }
}
```

**Exemple: Scraper inventaire fournisseur**
```javascript
const { chromium } = require('playwright');

async function scrapeFournisseur(credentials) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Login
  await page.goto('https://portail-fournisseur.com/login');
  await page.fill('#email', credentials.email);
  await page.fill('#password', credentials.password);
  await page.click('button[type="submit"]');

  // Navigate to inventory
  await page.waitForURL('**/dashboard');
  await page.click('a[href="/inventory"]');

  // Extract data
  const products = await page.$$eval('.product-row', rows =>
    rows.map(row => ({
      sku: row.querySelector('.sku').textContent,
      stock: parseInt(row.querySelector('.stock').textContent),
      price: parseFloat(row.querySelector('.price').textContent.replace('€', ''))
    }))
  );

  await browser.close();
  return products;
}
```

**Avantages:**
- ✅ Fonctionne avec n'importe quelle interface web
- ✅ Playwright MCP déjà configuré
- ✅ Multi-navigateur (Chrome, Firefox, Safari)
- ✅ Auto-wait intelligent (moins de flakiness)

**Inconvénients:**
- ⚠️ Plus lent que les APIs
- ⚠️ Fragile si l'UI change
- ⚠️ Détection bot possible
- ⚠️ Maintenance plus élevée

**Source:** [Playwright MCP Guide 2025](https://medium.com/@bluudit/playwright-mcp-comprehensive-guide-to-ai-powered-browser-automation-in-2025-712c9fd6cffa)

---

#### 4.2 AI Browser Agents (Tendance 2025)

**Nouveauté 2025:** AI-powered browser agents qui "voient" et interagissent comme un humain.

**Solutions disponibles:**
| Outil | Type | Prix | Use Case |
|-------|------|------|----------|
| EverWorker | SaaS | $$$ | Legacy systems sans API |
| Tarsier | Open-source | Free | Complex UIs, dashboards |
| Browse.ai | SaaS | $$ | No-code scraping |
| Axiom.ai | SaaS | $ | Simple automation |

**Comment ça marche:**
```
1. L'agent "voit" l'écran via accessibility tree ou screenshot
2. LLM comprend le contexte et l'objectif
3. Agent génère et exécute les actions (click, type, scroll)
4. Extraction de données structurées automatique
```

**Notre approche:**
```
Playwright MCP + Claude = AI Browser Agent natif
(Déjà disponible dans notre stack!)
```

**Source:** [AI Browser Agents 2025](https://everworker.ai/blog/connect-ai-agents-with-agentic-browser)

---

#### 4.3 Screen Scraping (RPA Classique)

**Quand utiliser:**
- Applications desktop (pas web)
- Systèmes mainframe
- Terminaux texte

**Outils:**
- UiPath (enterprise, payant)
- Robot Framework (open-source)
- PyAutoGUI (Python, basique)

**⚠️ LIMITATION:**
> "Screen scraping frequently enables modern apps to access data from
> legacy systems that don't offer an API or other means of viable
> source data access."

Mais:
> "Open-source automation tools still leave behind a digital fingerprint
> that websites can analyze to differentiate between bots and real users."

**Source:** [UiPath Screen Scraping](https://www.uipath.com/blog/rpa/screen-scraping-software-everything-you-need-to-know)

---

## 5. GESTION DES CREDENTIALS

### Architecture de Stockage (Notre Modèle)

```
/Users/mac/Desktop/
├── JO-AAA/                          # AGENCE
│   ├── .env                         # Credentials AGENCE uniquement
│   ├── .env.mcp.example             # Template pour nouveaux projets
│   └── .mcp.json                    # Configuration MCPs agence
│
└── clients/                         # CLIENTS (isolation stricte)
    ├── alpha-medical/
    │   ├── .env                     # Credentials Alpha Medical
    │   ├── .mcp.json                # MCPs spécifiques client
    │   └── service-account.json     # Google SA si applicable
    │
    ├── henderson/
    │   ├── .env
    │   └── .mcp.json
    │
    └── mydealz/
        ├── .env
        └── .mcp.json
```

### Best Practices Credentials

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RÈGLES DE GESTION CREDENTIALS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ✅ À FAIRE:                                                               │
│   ──────────────────────────────────────────────────────────────────────    │
│   • Stocker dans .env par client (jamais dans code)                         │
│   • Utiliser password manager pour transmission (1Password, LastPass)       │
│   • Rotation régulière (60-90 jours)                                        │
│   • Scopes minimaux requis (principle of least privilege)                   │
│   • Documenter quels credentials pour quels services                        │
│   • .gitignore strict (*.env, *credentials*, *secret*)                      │
│                                                                              │
│   ❌ À NE JAMAIS FAIRE:                                                     │
│   ──────────────────────────────────────────────────────────────────────    │
│   • Credentials client dans repo agence                                     │
│   • Partage par email non chiffré                                           │
│   • Même token pour plusieurs clients                                       │
│   • Full admin access quand analyst suffit                                  │
│   • Hardcoder credentials dans scripts                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Solutions Enterprise (Pour Scale)

| Solution | Type | Prix | Quand utiliser |
|----------|------|------|----------------|
| HashiCorp Vault | Self-hosted/Cloud | Free-$$$ | 10+ clients, compliance |
| AWS Secrets Manager | Cloud | ~$0.40/secret/mois | Si déjà sur AWS |
| Azure Key Vault | Cloud | ~$0.03/10K ops | Si déjà sur Azure |
| 1Password Business | SaaS | $8/user/mois | Simple, équipe petite |

**Pour 3A Automation (actuellement):**
```
Fichiers .env isolés par client = SUFFISANT pour 5-10 clients
Envisager Vault si >10 clients ou clients enterprise
```

**Source:** [HashiCorp Vault](https://www.hashicorp.com/products/vault)

---

## 6. ARCHITECTURE N8N

### Notre Setup Actuel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    N8N MULTI-CLIENT - 3A AUTOMATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   URL: https://n8n.srv1168256.hstgr.cloud                                   │
│   Hosting: Hostinger VPS (self-hosted)                                      │
│   Version: Latest stable                                                    │
│                                                                              │
│   STRUCTURE WORKFLOWS:                                                      │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   Par Convention de Nommage:                                                │
│   ├── [CLIENT] Workflow Name                                                │
│   │   Ex: [alpha-medical] Welcome Email Automation                          │
│   │                                                                          │
│   Par Tags:                                                                 │
│   ├── client:alpha-medical                                                  │
│   ├── client:henderson                                                      │
│   ├── type:email                                                            │
│   ├── type:inventory                                                        │
│   └── status:production                                                     │
│                                                                              │
│   CREDENTIALS (séparés par client):                                         │
│   ═══════════════════════════════════════════════════════════════════════   │
│   ├── alpha-medical-shopify-admin                                           │
│   ├── alpha-medical-klaviyo                                                 │
│   ├── alpha-medical-ga4                                                     │
│   ├── henderson-shopify-admin                                               │
│   └── henderson-klaviyo                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quand Créer Instance Séparée?

| Critère | Instance Partagée | Instance Dédiée |
|---------|-------------------|-----------------|
| Volume workflows | < 50 | > 50 |
| Données sensibles | Standard | HIPAA, PCI-DSS |
| SLA requis | Best effort | Garanti 99.9% |
| Budget client | < €500/mois | > €1000/mois |
| Compliance | Aucune | SOC2, GDPR strict |

---

## 7. PROCESSUS D'ONBOARDING CLIENT

### Checklist Onboarding (Template)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ONBOARDING CLIENT - CHECKLIST                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   JOUR 1: KICKOFF & AUDIT                                                   │
│   ═══════════════════════════════════════════════════════════════════════   │
│   □ Appel kickoff (30min)                                                   │
│   □ Identifier tous les systèmes utilisés                                   │
│   □ Créer dossier: /clients/{nom}/                                          │
│   □ Créer .env template pour client                                         │
│   □ Envoyer questionnaire accès (formulaire sécurisé)                       │
│                                                                              │
│   JOUR 2-3: CONFIGURATION ACCÈS                                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│   □ Shopify: Recevoir Partner access ou API token                           │
│   □ Klaviyo: Recevoir API key (scoped) ou user invite                       │
│   □ GA4: Recevoir Property access (Analyst role)                            │
│   □ Meta: Recevoir Partner access via Business ID                           │
│   □ TikTok: Recevoir Partner access via Business Center                     │
│   □ WordPress: Recevoir admin access ou MainWP Child                        │
│   □ Autres: Documenter méthode d'accès custom                               │
│                                                                              │
│   JOUR 3-5: VALIDATION & TEST                                               │
│   ═══════════════════════════════════════════════════════════════════════   │
│   □ Tester chaque connexion API                                             │
│   □ Exécuter audit automatique (node scripts/audit-*.cjs)                   │
│   □ Identifier gaps et problèmes                                            │
│   □ Documenter architecture client                                          │
│   □ Créer workflows n8n initiaux                                            │
│                                                                              │
│   JOUR 5-7: DÉPLOIEMENT INITIAL                                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│   □ Activer workflows production                                            │
│   □ Setup monitoring & alertes                                              │
│   □ Livrer rapport d'audit initial                                          │
│   □ Call review avec client                                                 │
│                                                                              │
│   ONGOING: MAINTENANCE                                                      │
│   ═══════════════════════════════════════════════════════════════════════   │
│   □ Check hebdomadaire workflows                                            │
│   □ Rotation credentials (60-90j)                                           │
│   □ Rapports mensuels automatisés                                           │
│   □ Review trimestrielle optimisations                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Questionnaire Accès Client (Template)

```markdown
# Questionnaire Accès - [Nom Client]

## E-commerce
- [ ] Shopify store URL: _______________
- [ ] Accès souhaité: □ Partner □ Custom App □ Les deux
- [ ] Permissions requises: □ Products □ Orders □ Customers □ Analytics

## Email Marketing
- [ ] Plateforme: □ Klaviyo □ Omnisend □ Mailchimp □ Autre: _____
- [ ] Méthode accès: □ User invite □ API key scoped

## Analytics
- [ ] GA4 Property ID: _______________
- [ ] Accès souhaité: □ Analyst □ Editor
- [ ] Service Account requis? □ Oui □ Non

## Publicité
- [ ] Meta Business ID: _______________
- [ ] TikTok Business Center ID: _______________
- [ ] Permissions: □ Advertiser □ Analyst

## Site Web
- [ ] Hébergeur: □ Hostinger □ WordPress.com □ Autre: _____
- [ ] CMS: □ WordPress □ Shopify themes □ Custom
- [ ] Accès requis: □ Admin □ FTP □ API

## Systèmes Sans API
- [ ] Systèmes legacy à automatiser: _______________
- [ ] Interface: □ Web □ Desktop □ Terminal
- [ ] Credentials login disponibles? □ Oui □ Non
```

---

## 8. FRAMEWORK DÉCISIONNEL

### Arbre de Décision Par Type de Client

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRAMEWORK DÉCISIONNEL CLIENT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ÉTAPE 1: ÉVALUATION INFRASTRUCTURE CLIENT                                 │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   Q1: Le client a-t-il un site e-commerce?                                  │
│       ├── Shopify → Accès Partner + MCP Shopify ✅                          │
│       ├── WooCommerce → REST API + WordPress access                         │
│       ├── Magento → REST/GraphQL API                                        │
│       ├── Custom → Évaluer API disponible                                   │
│       └── Aucun → Recommander Shopify (setup inclus)                        │
│                                                                              │
│   Q2: Le client a-t-il un CRM/Email marketing?                              │
│       ├── Klaviyo → API key + MCP Klaviyo ✅                                │
│       ├── Omnisend → API (pas de MCP, HTTP requests)                        │
│       ├── Mailchimp → API (MCP disponible)                                  │
│       ├── HubSpot → API (MCP disponible)                                    │
│       └── Aucun → Recommander Klaviyo (meilleur ROI e-commerce)             │
│                                                                              │
│   Q3: Le client a-t-il Analytics configuré?                                 │
│       ├── GA4 → Property access + Service Account                           │
│       ├── Autre → Évaluer API/export                                        │
│       └── Aucun → Setup GA4 (gratuit)                                       │
│                                                                              │
│   Q4: Le client fait-il de la publicité payante?                            │
│       ├── Meta Ads → Partner access via Business Manager                    │
│       ├── Google Ads → MCC (Manager Account) access                         │
│       ├── TikTok Ads → Partner access via Business Center                   │
│       └── Aucun → Optionnel, focus organic d'abord                          │
│                                                                              │
│   Q5: Le client a-t-il des systèmes legacy sans API?                        │
│       ├── Interface web → Playwright automation                             │
│       ├── Application desktop → UiPath/RPA                                  │
│       ├── Export fichiers → File-based automation                           │
│       └── Aucun accès → Escalade / hors scope                               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ÉTAPE 2: DÉTERMINER MODÈLE DE TRAVAIL                                     │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   CLIENT TYPE A: "Tech-Savvy"                                               │
│   • A déjà tous ses comptes                                                 │
│   • Sait générer API keys                                                   │
│   • Comprend OAuth/permissions                                              │
│   → MODÈLE: Client-Owned (délégation pure)                                  │
│   → TEMPS SETUP: 1-2 jours                                                  │
│                                                                              │
│   CLIENT TYPE B: "Standard PME"                                             │
│   • A ses comptes mais peu technique                                        │
│   • Besoin de guidance pour accès                                           │
│   • Fait confiance à l'agence                                               │
│   → MODÈLE: Guided Client-Owned                                             │
│   → TEMPS SETUP: 3-5 jours (avec accompagnement)                            │
│                                                                              │
│   CLIENT TYPE C: "Nouveau Digital"                                          │
│   • Peu ou pas de présence digitale                                         │
│   • Besoin de créer les comptes                                             │
│   • Budget pour setup complet                                               │
│   → MODÈLE: Agency-Setup puis transfert                                     │
│   → TEMPS SETUP: 5-10 jours (création + config)                             │
│                                                                              │
│   CLIENT TYPE D: "Legacy Systems"                                           │
│   • Systèmes anciens sans API                                               │
│   • Processus manuels à automatiser                                         │
│   • Souvent dans secteurs traditionnels                                     │
│   → MODÈLE: Hybrid (API où possible + RPA)                                  │
│   → TEMPS SETUP: 10-20 jours (développement custom)                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Matrice Compatibilité Services

| Service 3A | Type A | Type B | Type C | Type D |
|------------|--------|--------|--------|--------|
| Audit E-commerce | ✅ | ✅ | ⚠️ (post-setup) | ⚠️ |
| Email Machine | ✅ | ✅ | ✅ (setup inclus) | ⚠️ |
| SEO Quick Fix | ✅ | ✅ | ⚠️ | ❌ |
| Lead Sync | ✅ | ✅ | ✅ | ⚠️ (custom dev) |
| Maintenance | ✅ | ✅ | ✅ | ⚠️ |

---

## 9. SOURCES ET RÉFÉRENCES

### Documentation Officielle
- [Shopify API Access Scopes](https://shopify.dev/docs/api/usage/access-scopes)
- [Shopify Delegate Tokens](https://shopify.dev/docs/apps/auth/oauth/delegate-access-tokens)
- [Klaviyo API Authentication](https://developers.klaviyo.com/en/docs/authenticate_)
- [GA4 Access Management](https://support.google.com/analytics/answer/9305587)
- [Meta Partner Access](https://www.facebook.com/business/help)
- [TikTok Business Center Partners](https://ads.tiktok.com/help/article/tiktok-business-center-partners)
- [n8n Community Multi-Tenant](https://community.n8n.io/t/possible-to-do-multi-tenant-workflows-that-can-reference-credentials-dynamically/62218)

### Articles & Guides
- [Building Multi-Tenant n8n Workflows](https://www.wednesday.is/writing-articles/building-multi-tenant-n8n-workflows-for-agency-clients)
- [Zapier for Agencies](https://spp.co/blog/zapier-for-agencies/)
- [OAuth for AI Agents 2025](https://workos.com/blog/best-oauth-oidc-providers-for-authenticating-ai-agents-2025)
- [Playwright MCP Guide](https://medium.com/@bluudit/playwright-mcp-comprehensive-guide-to-ai-powered-browser-automation-in-2025-712c9fd6cffa)
- [Browser Automation Landscape 2025](https://substack.thewebscraping.club/p/browser-automation-landscape-2025)
- [UiPath Screen Scraping](https://www.uipath.com/blog/rpa/screen-scraping-software-everything-you-need-to-know)
- [MainWP WordPress Management](https://mainwp.com/)

### Secrets Management
- [HashiCorp Vault](https://www.hashicorp.com/products/vault)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/overview)

---

## CHANGELOG

| Date | Version | Modification |
|------|---------|--------------|
| 2025-12-19 | 1.0 | Création initiale - Framework complet accès clients |

---

**PRINCIPE FONDAMENTAL:**
> Le client possède ses données et comptes.
> L'agence opère avec accès délégué et permissions minimales.
> Isolation stricte entre clients.
> Documentation et traçabilité complètes.
