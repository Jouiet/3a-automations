# 3A AUTOMATION - Mémoire Projet Claude Code
## Version: 5.6 | Dernière mise à jour: 2025-12-19 (Session 25 - Formulaires & Claims)
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

## MÉTRIQUES ACTUELLES (Session 25 - 19/12/2025)

| Métrique | Valeur |
|----------|--------|
| Site | https://3a-automation.com ✅ LIVE (12 pages HTTP 200) |
| GA4 | G-87F6FDJG45 |
| GTM | GTM-WLVJQC3M |
| Automatisations | **56 total** (41 clients, 11 agency, 4 utils) |
| MCPs fonctionnels | **9/12** (credentials réelles) |
| Formulaires | **3 connectés** (Google Apps Script v2) |
| Leads Sheet | [Google Sheets](https://docs.google.com/spreadsheets/d/1rRKJ6sKfSOm6OYD1Hl5S5vFDTj8iLKeVTEmezaUqAjc/edit) |
| Claims marketing | **Corrigés** (56 auto, 9 MCPs, 10+ APIs) |

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

---

*Historique complet: voir `HISTORY.md`*
*Principe: Vérité factuelle uniquement. Consulter FORENSIC-AUDIT avant affirmation.*
