# Geo-Targeting CRM - Guide d'Implémentation

## Vue d'Ensemble

Ce guide explique comment implémenter la segmentation géographique pour les clients CRM.

## Marchés Supportés

| Marché | Pays | Langue | Devise |
|--------|------|--------|--------|
| Europe | FR, DE, IT, ES, BE, CH, etc. | Français | EUR (€) |
| Maghreb | MA, DZ, TN | Français | MAD (DH) |
| North America | US, CA, MX | Anglais | USD ($) |
| UK & Commonwealth | GB, AU, NZ, SG, etc. | Anglais | USD ($) |
| LATAM | BR, AR, CL, CO, etc. | Espagnol | USD ($) |
| Asia Pacific | JP, KR, TW, PH, etc. | Anglais | USD ($) |
| Middle East | AE, SA, QA, etc. | Anglais | USD ($) |
| Rest of World | Autres | Anglais | USD ($) |

## Scripts Disponibles

### 1. Module Core: `geo-markets.cjs`

**Emplacement:** `automations/generic/geo-markets.cjs`

**Fonctions:**
- `getMarketByCountry(countryCode)` - Retourne le marché pour un pays
- `convertPrice(amountEUR, currency)` - Conversion EUR → devise
- `formatPrice(amount, currency)` - Formatage avec symbole
- `getMarketStats(profiles)` - Statistiques par marché
- `generateSegmentDefinitions(crmType)` - Définitions pour CRM

**Usage:**
```javascript
const { MARKETS, getMarketByCountry, convertPrice } = require('./geo-markets.cjs');

const market = getMarketByCountry('FR'); // → europe
const price = convertPrice(100, 'MAD');   // → 1090
```

### 2. Klaviyo: `geo-segment-profiles.cjs`

**Emplacement:** `automations/clients/klaviyo/geo-segment-profiles.cjs`

**Usage:**
```bash
# Configurer le client
export CLIENT_NAME=mon-client

# Exécuter
node automations/clients/klaviyo/geo-segment-profiles.cjs
```

**Segments créés:**
- Geo - Europe - Europe
- Geo - Maghreb - Maghreb
- Geo - International - International
- Geo - ROW - Rest of World

### 3. Generic CRM: `geo-segment-generic.cjs`

**Emplacement:** `automations/clients/crm/geo-segment-generic.cjs`

**CRMs supportés:**
- HubSpot (`HUBSPOT_API_KEY`)
- Mailchimp (`MAILCHIMP_API_KEY` + `MAILCHIMP_SERVER`)
- Brevo (`BREVO_API_KEY`)
- ActiveCampaign (`AC_API_KEY` + `AC_URL`)

**Usage:**
```bash
# Configurer
export CLIENT_NAME=mon-client
export CRM_TYPE=hubspot

# Exécuter
node automations/clients/crm/geo-segment-generic.cjs
```

## Configuration Client

### Fichier .env

```bash
# /Users/mac/Desktop/clients/mon-client/.env

CLIENT_NAME=mon-client

# Klaviyo
KLAVIYO_API_KEY=pk_xxxxxxxx

# HubSpot
HUBSPOT_API_KEY=pat-xxxxxxxx

# Mailchimp
MAILCHIMP_API_KEY=xxxxxxxx-us1
MAILCHIMP_SERVER=us1

# Brevo
BREVO_API_KEY=xkeysib-xxxxxxxx

# ActiveCampaign
AC_API_KEY=xxxxxxxx
AC_URL=https://account.api-us1.com
```

## Taux de Change

Les taux sont définis dans `geo-markets.cjs` et doivent être mis à jour périodiquement:

```javascript
const EXCHANGE_RATES = {
  EUR: 1.00,   // Base
  USD: 1.08,   // 1 EUR = 1.08 USD
  MAD: 10.90,  // 1 EUR = 10.90 MAD
  GBP: 0.83    // 1 EUR = 0.83 GBP
};
```

**Sources pour mise à jour:**
- ECB: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/
- XE: https://www.xe.com/

## Workflow Recommandé

### 1. Analyse Initiale
```bash
node automations/clients/klaviyo/geo-segment-profiles.cjs
# → Affiche la distribution géographique des contacts
```

### 2. Création des Segments
Les scripts créent automatiquement les segments si ils n'existent pas.

### 3. Configuration Flows/Campaigns

Pour chaque segment, créer:
- **Email template** avec contenu localisé (FR/EN/ES)
- **Prix convertis** dans la devise du marché
- **Horaire d'envoi** adapté au timezone

### 4. A/B Testing
Tester sur un échantillon avant déploiement global.

## Bonnes Pratiques

### Contenu
- Utiliser des templates conditionnels quand possible
- Adapter le ton (formel/informel) selon le marché
- Localiser les références culturelles

### Prix
- Arrondir les prix convertis (pas de décimales)
- Afficher le symbole approprié (€, $, DH)
- Considérer la parité de pouvoir d'achat pour les prix premium

### Timing
- Europe: 10h-11h CET
- Maghreb: 10h-11h WET
- North America: 9h-10h EST
- Asia Pacific: 10h-11h JST

## ROI Attendu

| Métrique | Sans Geo | Avec Geo | Amélioration |
|----------|----------|----------|--------------|
| Open Rate | 20% | 28% | +40% |
| Click Rate | 3% | 5% | +67% |
| Conversion | 1.5% | 2.5% | +67% |

**Source:** Klaviyo Benchmark 2025, études internes 3A Automation

---

*Dernière mise à jour: 2025-12-19*
*Auteur: 3A Automation*
