# 3A Automation - Catalogue Automatisations
## Version 4.0 | 27 Décembre 2025 (Màj Session 99)

---

## Vue d'Ensemble

**Source de Vérité:** `automations-registry.json` (v1.8.0)

```
automations/
├── agency/                    # Outils internes 3A Automation
│   └── core/                  # Automatisations système
│
├── clients/                   # Automatisations offertes aux clients
│   ├── shopify/               # E-commerce Shopify (13)
│   ├── klaviyo/               # Email Marketing CRM (9)
│   ├── analytics/             # Tracking & Reporting (9)
│   ├── leads/                 # Lead Generation (20)
│   ├── seo/                   # SEO & Contenu (9)
│   ├── content/               # Contenu & Vidéo (8)
│   ├── ai-avatar/             # AI Avatar & Influencer (2)
│   ├── whatsapp/              # WhatsApp Business (2)
│   └── voice-ai/              # Voice AI & Téléphonie (2)
│
├── shared-components/         # Composants réutilisables
│   ├── voice-widget/          # Widget vocal configurable
│   └── whatsapp-workflows/    # Templates WhatsApp n8n
│
├── invoicing/                 # Système de facturation
│   └── invoice-generator.cjs  # Multi-currency MAD/EUR/USD
│
└── external/
    └── cinematicads/          # CinematicAds AI (4) → cinematicads.studio

TOTAL: 89 automatisations client-facing (Registry v1.8.0)
```

---

## Catégories

### 1. Agency Core (11 automatisations internes)

| Automatisation | Description | Usage |
|----------------|-------------|-------|
| `grok-client.cjs` | Client Grok/xAI avec RAG | Chat AI interne |
| `grok-client.py` | Client Grok Python | Intégrations Python |
| `forensic-api-test.cjs` | Test APIs clients | Audit technique |
| `test-env.cjs` | Validation configuration | Onboarding |
| `prompt-feedback-tracker.cjs` | Suivi feedback prompts | Amélioration continue |
| `test_system_readiness.py` | Test readiness système | Pre-deployment |
| `check-env-status.cjs` | Vérification statut .env | Diagnostic |
| `test-ga4.cjs` | Test connexion GA4 | Validation tracking |
| `test-gemini.cjs` | Test API Gemini | Test LLM |
| `test-google-auth.cjs` | Test auth Google | Validation OAuth |
| `test-google-sheets.cjs` | Test Google Sheets API | Validation Sheets |
| `google-apps-script-booking.js` | Système de réservation RDV | Google Calendar |
| `google-calendar-booking.cjs` | Module booking Node.js | API |
| `BOOKING-SETUP.md` | Guide déploiement booking | Documentation |

### 2. Voice Assistant + Booking (2 automatisations)

| Automatisation | Description | Déclencheur |
|----------------|-------------|-------------|
| `voice-widget.js` | Assistant vocal FR avec booking | Widget flottant |
| `voice-widget-en.js` | Assistant vocal EN avec booking | Widget flottant |

**Fonctionnalités Voice Booking:**
- Reconnaissance vocale (Web Speech API)
- Conversation multi-étapes (nom → email → créneau → confirmation)
- Appel API Google Apps Script
- Création événement Google Calendar
- Email confirmation automatique

**Mots-clés booking FR:** rdv, rendez-vous, réserver, appel, discuter
**Mots-clés booking EN:** appointment, book, schedule, call, meeting

### 3. Shopify (11 automatisations)

| Automatisation | Description | Déclencheur |
|----------------|-------------|-------------|
| `audit-shopify-complete.cjs` | Audit complet store | Manuel/Scheduled |
| `audit-shopify-store.cjs` | Audit rapide | Manuel |
| `test-shopify-connection.cjs` | Test connexion API | Onboarding |
| `export-shopify-customers-facebook.cjs` | Export clients → Facebook | Scheduled |
| `create-warehouse-metafield.cjs` | Métafields warehouse | Manuel |
| `import-taxonomy-*.cjs` | Import taxonomie produits | Manuel |
| `parse-warehouse-csv.cjs` | Parse CSV warehouse | Manuel |
| `publish-bundles-*.cjs` | Publication bundles | Manuel |

### 3. Klaviyo (3 automatisations)

| Automatisation | Description | Déclencheur |
|----------------|-------------|-------------|
| `audit-klaviyo-flows.cjs` | Audit flows email | Manuel/Scheduled |
| `audit-klaviyo-flows-v2.cjs` | Audit flows v2 | Manuel |
| `test-klaviyo-connection.cjs` | Test connexion API | Onboarding |

### 4. Analytics (4 automatisations)

| Automatisation | Description | Déclencheur |
|----------------|-------------|-------------|
| `track-bnpl-performance.cjs` | Suivi BNPL | Scheduled |
| `audit-tiktok-pixel-config.cjs` | Audit TikTok Pixel | Manuel |
| `check-pixel-status.js` | Vérification pixels | Manuel |
| `verify-facebook-pixel-native.js` | Validation FB Pixel | Manuel |

### 5. Leads (6 automatisations)

| Automatisation | Description | Déclencheur |
|----------------|-------------|-------------|
| `segment-leads.js` | Segmentation leads | Scheduled |
| `import-facebook-lead-ads.js` | Import FB Lead Ads | Webhook/Scheduled |
| `facebook_lead_ads_api.py` | API FB Lead Ads | API |
| `import_leads_to_sheet.py` | Leads → Google Sheets | Scheduled |
| `sync_typeform_to_sheet.py` | Typeform → Sheets | Webhook |
| `convert-fb-leads-to-emailsearch-format.py` | Conversion format | Manuel |

### 6. SEO (4 automatisations)

| Automatisation | Description | Déclencheur |
|----------------|-------------|-------------|
| `fix-missing-alt-text.cjs` | Correction alt text | Manuel |
| `generate-tags-csv.js` | Génération tags CSV | Manuel |
| `import-alt-text-api.js` | Import alt text via API | Manuel |
| `upload-llms.js` | Upload llms.txt | Manuel |

### 7. Social (4 automatisations)

| Automatisation | Description | Déclencheur |
|----------------|-------------|-------------|
| `verify-hubspot-status.cjs` | Vérification HubSpot | Manuel |
| `apify-inspect-raw-data.cjs` | Inspection données Apify | Manuel |
| `apify-verify-connection.cjs` | Test connexion Apify | Onboarding |
| `enable-apify-schedulers.js` | Activation schedulers | Manuel |

---

## Méthodologie d'Intégration Client

### Phase 1: Onboarding (Jour 1)

```bash
# 1. Créer fichier .env client
cp .env.example .env.client-[NOM]

# 2. Configurer credentials
SHOPIFY_STORE_DOMAIN=client-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxx
KLAVIYO_API_KEY=pk_xxxx
# ... autres API keys

# 3. Valider connexions
node automations/clients/shopify/test-shopify-connection.cjs
node automations/clients/klaviyo/test-klaviyo-connection.cjs
```

### Phase 2: Audit Initial (Jour 1-2)

```bash
# Audit complet Shopify
node automations/clients/shopify/audit-shopify-complete.cjs

# Audit flows Klaviyo
node automations/clients/klaviyo/audit-klaviyo-flows.cjs

# Résultats dans outputs/
```

### Phase 3: Déploiement Automatisations

#### Option A: Exécution Directe (Simple)
```bash
# Exécution manuelle ou via cron
node automations/clients/seo/fix-missing-alt-text.cjs
```

#### Option B: n8n Workflows (Recommandé)
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Trigger   │ →  │  HTTP Node   │ →  │  Automation │
│  (Webhook/  │    │  (Execute)   │    │  (Script)   │
│   Schedule) │    │              │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
```

Configuration n8n:
1. Créer workflow avec trigger (Webhook ou Schedule)
2. Ajouter node "Execute Command"
3. Command: `node /path/to/automation.cjs`
4. Variables d'environnement depuis .env client

#### Option C: MCP Integration (Avancé)
```json
{
  "mcpServers": {
    "3a-automations": {
      "command": "node",
      "args": ["/path/to/mcp-server.cjs"],
      "env": {
        "CLIENT_CONFIG": "/path/to/.env.client"
      }
    }
  }
}
```

### Phase 4: Monitoring

```bash
# Vérification quotidienne
node automations/agency/core/test_system_readiness.py

# Logs centralisés dans outputs/
ls -la outputs/audit-*.json
```

---

## Configuration Requise

### Variables d'Environnement

```bash
# === SHOPIFY ===
SHOPIFY_STORE_DOMAIN=     # store.myshopify.com
SHOPIFY_ACCESS_TOKEN=     # shpat_xxxx
SHOPIFY_API_VERSION=      # 2024-01

# === KLAVIYO ===
KLAVIYO_API_KEY=          # pk_xxxx

# === ANALYTICS ===
GA4_PROPERTY_ID=          # 123456789
TIKTOK_PIXEL_ID=          # CXXXXX

# === LEADS ===
META_ACCESS_TOKEN=        # EAAxxxx
GOOGLE_SHEETS_ID=         # 1xxxx

# === SOCIAL ===
APIFY_TOKEN=              # apify_api_xxxx
HUBSPOT_API_KEY=          # pat-xxx
```

---

## Règles de Développement

### 1. Toute automatisation DOIT:
- Utiliser `process.env` pour les credentials
- Valider les variables au démarrage
- Logger avec emojis (✅ ❌ ⚠️)
- Retourner exit code approprié

### 2. Toute automatisation NE DOIT PAS:
- Hardcoder des credentials
- Contenir des références client-spécifiques
- Modifier des fichiers sans backup

### 3. Structure Standard

```javascript
#!/usr/bin/env node
/**
 * [NOM AUTOMATISATION]
 * Description: [Description claire]
 * Version: 1.0
 * Date: YYYY-MM-DD
 */

require('dotenv').config();

// Validation
const required = ['VAR1', 'VAR2'];
const missing = required.filter(v => !process.env[v]);
if (missing.length) {
  console.error(`❌ Variables manquantes: ${missing.join(', ')}`);
  process.exit(1);
}

// Configuration
const CONFIG = {
  var1: process.env.VAR1,
  var2: process.env.VAR2
};

async function main() {
  console.log('🚀 Démarrage automatisation...');
  // Logic
  console.log('✅ Terminé');
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
```

---

## Statistiques

| Métrique | Valeur |
|----------|--------|
| Automatisations client-facing | **78** |
| Lead Generation & Acquisition | 20 |
| Shopify Admin | 13 |
| SEO & Contenu | 9 |
| Email Marketing (CRM) | 9 |
| Analytics & Reporting | 9 |
| Contenu & Vidéo | 8 |
| CinematicAds AI (External) | 4 |
| AI Avatar & Influencer | 2 |
| WhatsApp Business | 2 |
| Voice AI & Téléphonie | 2 |
| Catégories | 10 |
| APIs supportées | Shopify, Klaviyo, Meta, TikTok, Apify, HubSpot, Google Sheets, GA4, Gemini, xAI/Grok, WhatsApp, ElevenLabs |

**Note:** Les scripts internes (test-*, verify-*, audit-*) sont exclus du count client-facing.

---

## Changelog

| Date | Version | Modification |
|------|---------|--------------|
| 2025-12-27 | 4.0 | **Session 99**: Sync avec registry v1.8.0, 89 automations, 10 catégories |
| 2025-12-26 | 3.2 | Voice AI Widget + Phone ajoutés, WhatsApp workflows |
| 2025-12-25 | 3.1 | CinematicAds marqué EXTERNAL (→ cinematicads.studio) |
| 2025-12-19 | 3.0 | Consolidation Session 23: Total 56 automatisations |
| 2025-12-18 | 2.0 | +11 automatisations: video/, google-merchant/, leads/ |
| 2025-12-18 | 1.0 | Création initiale - Migration 38 automatisations |
