# 3A AUTOMATION - Mémoire Projet Claude Code
## Version: 6.6 | Dernière mise à jour: 2025-12-19 (Session 37 - API Tests + Verification)
## Site: https://3a-automation.com | Email: contact@3a-automation.com

---

## IDENTITÉ (Faits vérifiés)

**3A = Automation, Analytics, AI**
- Consultant solo automation & marketing (1 personne, 20h/semaine)
- Cible: PME tous secteurs €10k-500k/mois CA
- Budget: €50 | Cash flow: €0 (restart clients 25/01/2026)

---

## RÈGLES CRITIQUES

### Séparation Agence/Clients
```
/Users/mac/Desktop/JO-AAA/           ← AGENCE (pas de creds clients!)
/Users/mac/Desktop/clients/[nom]/    ← Chaque client isolé avec son .env
```

### Factualité
- **Consulter** `outputs/FORENSIC-AUDIT-2025-12-18.md` avant toute affirmation
- **Pas de claims non vérifiés** - Vérification empirique obligatoire
- **Pas de placeholders** - Code complet ou rien

---

## MÉTRIQUES ACTUELLES (Session 35 - 19/12/2025)

| Métrique | Valeur |
|----------|--------|
| Site | https://3a-automation.com ✅ LIVE |
| Pages FR | **13** |
| Pages EN | **13** |
| Total Pages | **26** ✅ |
| hreflang SEO | **26/26 (100%)** ✅ |
| Marchés | **3** (MA/Maghreb, EU, International) |
| GA4 | G-87F6FDJG45 |
| GTM | GTM-WLVJQC3M |
| Automatisations validées | **64** (validé par script) |
| MCPs configurés | **12** |
| APIs fonctionnelles | Klaviyo ✅, Apify ✅, GA4 ✅ (3/7 testé 19/12) |

## TARIFICATION (Refonte Session 34 - Data-Driven 2025-2026)

| Plan | Prix/mois | Heures | Cible CA |
|------|-----------|--------|----------|
| **Essentiel** | 390€ | 4-5h | <10k€/mois |
| **Pro** | 790€ | 8-10h | 10k-50k€/mois |
| **Premium** | 1490€ | 15-18h | 50k€+/mois |

| Projet One-Time | Prix |
|-----------------|------|
| Quick Start | 990-1490€ |
| Full Setup | 2490-3990€ |
| Transformation | Sur devis |

## TOP 3 SERVICES (Data-Driven 2025-2026)

| Rang | Service | Score | Demande Marché |
|------|---------|-------|----------------|
| 🥇 #1 | Email Automation Klaviyo | 9.25/10 | 26.7% marché, ROI $42:$1 |
| 🥈 #2 | Analytics & Dashboards | 7.75/10 | 18.4% CAGR (fastest) |
| 🥉 #3 | Audit E-commerce + Quick Wins | 6.95/10 | Entry point, Flywheel |

**Sources:** Klaviyo 2025 Benchmark, Gartner 2026, Forrester 2026, Mordor Intelligence

---

## COMMANDES ESSENTIELLES

```bash
# Validation
node automations/generic/test-all-apis.cjs

# Audits
node automations/clients/shopify/audit-shopify-complete.cjs
node automations/clients/klaviyo/audit-klaviyo-flows.cjs

# Déploiement (automatique via GitHub Action)
git push origin main  # Déclenche Deploy Website workflow
```

---

## STRUCTURE PROJET (Optimisée Session 23b)

```
/Users/mac/Desktop/JO-AAA/        # 15MB hors node_modules
├── CLAUDE.md                     # Mémoire Claude
├── README.md                     # Documentation racine
├── GROK.md                       # Config Grok AI
├── HISTORY.md                    # Changelog
├── docker-compose.yml            # Config déploiement
│
├── automations/                  # 56 automatisations
│   ├── agency/core/              # 11 outils internes
│   ├── clients/                  # 41 templates clients
│   ├── generic/                  # 2 utilitaires
│   └── legacy-client-specific/   # 2 legacy
│
├── docs/                         # 8 docs actives
├── landing-page-hostinger/       # Site web (auto-deploy)
├── knowledge-base/               # RAG system (484KB)
├── outputs/                      # Rapports & résultats
├── archive/                      # Legacy (scripts + docs + assets)
└── .claude/rules/                # 4 règles modulaires
```

---

## MCPs CONFIGURÉS (Audit 19/12/2025)

| MCP | Status | Credentials |
|-----|--------|-------------|
| ✅ chrome-devtools | Fonctionnel | NPX standard |
| ✅ playwright | Fonctionnel | NPX standard |
| ✅ github | Fonctionnel | Token réel |
| ✅ hostinger | Fonctionnel | Token réel |
| ✅ klaviyo | Fonctionnel | API key réelle |
| ✅ gemini | Fonctionnel | API key réelle |
| ✅ google-analytics | Fonctionnel | Service Account |
| ✅ google-sheets | Fonctionnel | Service Account |
| ✅ apify | Fonctionnel | Token réel |
| ⚠️ shopify | PLACEHOLDER | Config client requise |
| ⚠️ n8n | PLACEHOLDER | API key à générer |
| ⚠️ wordpress | PLACEHOLDER | wp-sites.json incomplet |

---

## INFRASTRUCTURE

```
VPS Hostinger (ID: 1168256)
├── IP: 148.230.113.163
├── Containers: nginx (site) + traefik (proxy) + n8n
├── SSL: Let's Encrypt via Traefik
└── Deploy: GitHub Action → Hostinger API → git pull
```

---

## CLIENTS (restart 25/01/2026)

| Client | Store | Statut |
|--------|-------|--------|
| Alpha Medical Care | azffej-as.myshopify.com | Pause |
| Henderson Shop | (credentials inconnues) | Pause |
| MyDealz | 5dc028-dd.myshopify.com | Pause |

---

## SERVICES OFFERTS

| Service | Prix |
|---------|------|
| Audit E-commerce | GRATUIT |
| Email Machine Mini | €500 + €200/mois |
| SEO Quick Fix | €300-500 |
| Lead Sync | €400 + €150/mois |
| Maintenance | €300-800/mois |

---

## DOCUMENTATION RÉFÉRENCE

| Document | Usage |
|----------|-------|
| `outputs/FORENSIC-AUDIT-2025-12-18.md` | Source de vérité factuelle |
| `docs/deployment.md` | Processus déploiement |
| `docs/website-blueprint.md` | Design & UX site |
| `docs/business-model.md` | Modèle économique |
| `docs/flywheel.md` | Architecture Flywheel |
| `.claude/rules/*.md` | Standards code & factualité |

---

## ACTIONS PRIORITAIRES (Manuelles)

1. **n8n API Key** - https://n8n.srv1168256.hstgr.cloud/settings/api
2. **Shopify Dev Store** - https://partners.shopify.com
3. **xAI Crédits ($5)** - https://console.x.ai/billing
4. ~~Archiver legacy scripts~~ ✅ FAIT (Session 22c)

## SESSION 37 COMPLÉTÉE ✅ (19/12/2025 - API Tests + Verification)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Test APIs empirique | ✅ | 3/7 fonctionnelles (Klaviyo, Apify, GA4) |
| FORENSIC-AUDIT v6.0 | ✅ | Métriques Session 37 |
| Site FR LIVE | ✅ | 13 pages, HTTP 200 |
| Site EN LIVE | ✅ | 13 pages, HTTP 200 |
| Lang-switch | ✅ | Fonctionnel FR↔EN |

**APIs Testées (19/12/2025 20:43 UTC):**
- ✅ Klaviyo: OK
- ✅ Apify: OK
- ✅ Google Analytics: Credentials OK
- ⚠️ Shopify: Non configuré (clients pause)
- ⚠️ n8n: Token à régénérer
- ⚠️ Meta: Non configuré
- 🚫 xAI: Crédits requis ($5)

**Commit Session 37:**
- `[pending]` docs: Session 37 - API tests + verification

---

## SESSION 36b COMPLÉTÉE ✅ (19/12/2025 - CRM Geo-Targeting)

| Tâche | Statut | Détails |
|-------|--------|---------|
| geo-markets.cjs | ✅ | Module core 8 marchés |
| Klaviyo geo-segment | ✅ | Segmentation par pays |
| Generic CRM adapter | ✅ | HubSpot, Mailchimp, Brevo, AC |
| Documentation | ✅ | docs/geo-targeting.md |

**Scripts créés:**
- `automations/generic/geo-markets.cjs` - Module core
- `automations/clients/klaviyo/geo-segment-profiles.cjs` - Klaviyo
- `automations/clients/crm/geo-segment-generic.cjs` - Multi-CRM

**8 Marchés définis:**
- Europe (FR, DE, IT...) → FR + EUR
- Maghreb (MA, DZ, TN) → FR + MAD
- North America (US, CA) → EN + USD
- UK & Commonwealth → EN + USD
- LATAM, APAC, Middle East, ROW

**CRMs supportés:**
- Klaviyo, HubSpot, Mailchimp, Brevo, ActiveCampaign

**Commits Session 36b:**
- `d455a3b` feat(crm): Add geo-segmentation templates for all CRMs

---

## SESSION 36 COMPLÉTÉE ✅ (19/12/2025 - Lang-Switch + Currency)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Lang-switch header | ✅ | 26/26 pages avec bouton FR↔EN |
| geo-locale.js v2.0 | ✅ | Conversion devises real-time |
| Multi-devise | ✅ | EUR, USD, MAD, GBP |
| Pricing intégré | ✅ | Auto-détection currency |

**Fonctionnalités ajoutées:**
- Sélecteur de langue dans header de toutes les pages
- Conversion automatique EUR→USD/MAD selon géolocalisation
- `data-price-eur` pour tarifs dynamiques
- localStorage pour persistance préférences

**geo-locale.js v2.0:**
```javascript
exchangeRates: { EUR: 1.00, USD: 1.08, MAD: 10.90, GBP: 0.83 }
convert(amountEUR, toCurrency)
formatPrice(amount, currency)  // Locale-aware
updatePrices(currency)         // data-price-eur elements
setCurrency(currency)          // Manual override
```

**Commits Session 36:**
- `7e15949` feat(i18n): Add language switcher + currency conversion system

---

## SESSION 35 COMPLÉTÉE ✅ (19/12/2025 - i18n Complet)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Site EN complet | ✅ | 13 pages EN créées |
| hreflang SEO | ✅ | 26/26 pages avec tags fr/en/x-default |
| Geo-detection | ✅ | geo-locale.js v1.0 |
| Sitemap.xml | ✅ | 26 URLs avec hreflang |

**Commits Session 35:**
- `a24fae5` feat(i18n): Complete English website + hreflang SEO implementation
- `3e22366` docs: Update CLAUDE.md v6.3 + FORENSIC-AUDIT v5.8

---

*Historique complet: voir `HISTORY.md`*
*Principe: Vérité factuelle uniquement. Consulter FORENSIC-AUDIT avant affirmation.*
