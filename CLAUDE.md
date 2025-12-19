# 3A AUTOMATION - Mémoire Projet Claude Code
## Version: 5.0 | Dernière mise à jour: 2025-12-19 (Session 22)
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

## MÉTRIQUES ACTUELLES (Session 22 - 19/12/2025)

| Métrique | Valeur |
|----------|--------|
| Site | https://3a-automation.com ✅ LIVE |
| GA4 | G-87F6FDJG45 (11 pages) |
| GTM | GTM-WLVJQC3M |
| Automatisations génériques | 50+ |
| MCPs fonctionnels | 3 (Shopify, Klaviyo, n8n) |
| MCPs configurés | 12 |
| Scripts legacy | ~210 (à migrer) |

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

## STRUCTURE PROJET

```
/Users/mac/Desktop/JO-AAA/
├── automations/              # Automatisations normalisées
│   ├── generic/              # 100% réutilisables
│   └── clients/              # Par service (shopify/, klaviyo/, etc.)
├── landing-page-hostinger/   # Site web (auto-deploy)
├── outputs/                  # Résultats audits
├── .claude/rules/            # Règles modulaires
│   ├── code-standards.md
│   ├── factuality.md
│   ├── infrastructure.md     # Config Hostinger/Docker/n8n
│   └── mcps.md               # Configuration MCPs
└── # LEGACY (à archiver):
    ├── AGENCY-CORE-SCRIPTS-V3/
    ├── agency-scripts-Q1-GOLD/
    └── alpha-medical-python-agency/
```

---

## MCPs CONFIGURÉS

| MCP | Status | Usage |
|-----|--------|-------|
| ✅ chrome-devtools | Fonctionnel | Debug browser |
| ✅ playwright | Fonctionnel | Tests automatisés |
| ✅ github | Fonctionnel | Gestion repo |
| ✅ hostinger | Fonctionnel | Déploiement VPS |
| ✅ klaviyo | Fonctionnel | Email marketing |
| ✅ gemini | Fonctionnel | AI assistance |
| ✅ google-analytics | Fonctionnel | GA4 data |
| ✅ google-sheets | Fonctionnel | Spreadsheets |
| ⚠️ shopify | Placeholder | Dev store à créer |
| ⚠️ n8n | Instance OK | API key à générer |
| ⚠️ wordpress | Non testé | wp-sites.json requis |
| ⚠️ apify | Configuré | Non testé |

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
| `DEPLOYMENT-GUIDE.md` | Processus déploiement |
| `3A-WEBSITE-BLUEPRINT-2025.md` | Design & UX site |
| `.claude/rules/*.md` | Standards code & factualité |

---

## ACTIONS PRIORITAIRES

1. **n8n API Key** - https://n8n.srv1168256.hstgr.cloud/settings/api
2. **Shopify Dev Store** - https://partners.shopify.com
3. **xAI Crédits ($5)** - https://console.x.ai/billing
4. **Archiver legacy scripts** - Déplacer vers archive/

---

*Historique complet: voir `HISTORY.md`*
*Principe: Vérité factuelle uniquement. Consulter FORENSIC-AUDIT avant affirmation.*
