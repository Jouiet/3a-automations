# 3A AUTOMATION - Projet Claude Code
## Version: 11.1 | Date: 2025-12-23 | Session: 77
## Site: https://3a-automation.com | Email: contact@3a-automation.com

---

## SOURCE DE VERITE

**Automations Registry:** `automations/automations-registry.json` (74 automations v1.3.0)
**Historique Sessions:** `HISTORY.md` (Sessions 0-77)
**Audit Forensique:** `outputs/FORENSIC-AUDIT-2025-12-18.md`

---

## ETAT ACTUEL (Session 77 - 23/12/2025)

| Metrique | Valeur |
|----------|--------|
| Site | https://3a-automation.com LIVE |
| Pages | 28 (14 FR + 14 EN) - HTTP 200 |
| Automations | **74** (Lead Gen 18, Shopify 13, SEO 9, Email 9, Analytics 9, Content 10, AI Avatar 2, CinematicAds 4, **WhatsApp 2**) |
| Audit SEO/AEO | 0 issues PASSED |
| Audit WCAG/RGAA | 0 issues PASSED |
| Lighthouse Perf | ~70% |
| hreflang SEO | 28/28 (100%) |
| GA4 | G-87F6FDJG45 |
| GTM | GTM-WLVJQC3M |

### Session 77 Completée
```
WHATSAPP BUSINESS API:
├── ✅ whatsapp-booking-confirmation.json (n8n workflow)
├── ✅ whatsapp-booking-reminders.json (24h + 1h avant RDV)
├── ✅ Registry v1.3.0 (72 → 74 automations)
└── ✅ HTML pages updated (74 automations)

RECHERCHE WHATSAPP:
├── Service messages: GRATUITS (24h window)
├── Template messages: ~$0.005-0.015/msg
├── Free tier: 1000 conversations/mois
├── Open rate: 98% vs 20% SMS
└── No-show reduction: -30%
```

---

## TARIFICATION

### Packs Setup (One-Time)
| Pack | EUR | USD | MAD |
|------|-----|-----|-----|
| Quick Win | 390 | $450 | 3.990 DH |
| Essentials | 790 | $920 | 7.990 DH |
| Growth | 1.399 | $1,690 | 14.990 DH |

### Retainers Mensuels
| Plan | EUR/mois | USD/mois | MAD/mois |
|------|----------|----------|----------|
| Maintenance | 290 | $330 | 2.900 DH |
| Optimization | 490 | $550 | 5.200 DH |

*Annuel = 10 mois pour 12 (2 mois gratuits)*

---

## INFRASTRUCTURE

```
VPS Hostinger (ID: 1168256)
IP: 148.230.113.163
Containers: nginx (site) + traefik (proxy+SSL) + n8n
Deploy: GitHub Action -> Hostinger API -> git pull
```

**URLs:**
- Site: https://3a-automation.com
- n8n: https://n8n.srv1168256.hstgr.cloud

---

## MCPs CONFIGURES

| MCP | Status |
|-----|--------|
| chrome-devtools | OK |
| playwright | OK |
| github | OK |
| hostinger | OK |
| klaviyo | OK |
| gemini | OK |
| google-analytics | OK |
| google-sheets | OK |
| apify | OK |
| shopify | PLACEHOLDER |
| n8n | PLACEHOLDER |

---

## ARCHITECTURE PROJET

```
/Users/mac/Desktop/JO-AAA/           <- AGENCE
├── automations/                     <- 74 automations
│   ├── automations-registry.json    <- SOURCE VERITE (v1.3.0)
│   ├── agency/core/                 <- Outils internes
│   ├── clients/                     <- Templates clients
│   └── generic/                     <- Utilitaires
├── landing-page-hostinger/          <- Site 28 pages
├── scripts/                         <- Outils session
├── docs/                            <- Documentation
├── outputs/                         <- Rapports
└── .env                             <- Credentials

/Users/mac/Desktop/clients/          <- CLIENTS (isoles)
├── henderson/                       <- 114 scripts
├── mydealz/                         <- 59 scripts
└── alpha-medical/                   <- 7 scripts
```

---

## COMMANDES ESSENTIELLES

```bash
# Validation
node scripts/forensic-audit-complete.cjs    # SEO/AEO audit
node scripts/audit-accessibility.cjs        # WCAG/RGAA audit
node scripts/test-voice-widget.cjs          # Voice widget test
node scripts/test-seo-complete.cjs          # SEO 142 tests

# APIs
node automations/generic/test-all-apis.cjs

# Deploy (automatique via GitHub Action)
git push origin main
```

---

## ASSETS OPTIMISES

| Asset | Taille |
|-------|--------|
| styles.min.css | 100KB |
| script.min.js | 11KB |
| voice-widget.min.js | 33KB |
| geo-locale.min.js | 3.4KB |

---

## VOICE AI ASSISTANT

- **Widget:** Deploye 28 pages
- **Tech:** Web Speech API (gratuit)
- **Booking:** Google Apps Script (gratuit)
- **Features:** Reconnaissance vocale, synthese vocale, 33 keywords (FR+EN)

---

## IDENTITE

**3A = Automation, Analytics, AI**
- Consultant solo automation & marketing
- Cible: PME tous secteurs 10k-500k CA
- Marches: Maghreb (MA, DZ, TN), Europe, International

---

## REGLES CRITIQUES

1. **Separation Agence/Clients** - Jamais de credentials clients dans repo agence
2. **Factualite** - Verifier empiriquement avant affirmation
3. **Source de verite** - automations-registry.json pour automations
4. **Code Standards** - CommonJS (.cjs), process.env pour credentials
5. **Pas de placeholders** - Code complet ou rien

---

## DERNIERE SESSION (75 - 23/12/2025)

**Optimisations:**
- CLAUDE.md reduit de 53.1k a 5.1k chars (-90%)
- HISTORY.md mis a jour (Sessions 0-74)
- Footer automation count: 66 -> 72 (27 fichiers)
- HTML malformed attributes corriges (43 fixes)
- en/404.html: duplicate scripts retires

**Scripts crees:**
- scripts/fix-footer-automations-count.cjs

**Audit Status:** SEO/AEO PASSED (0 issues), WCAG/RGAA PASSED (0 issues)

---

## ACTIONS MANUELLES REQUISES

1. **n8n API Key** - https://n8n.srv1168256.hstgr.cloud/settings/api
2. **Shopify Dev Store** - https://partners.shopify.com
3. **xAI Credits ($5)** - https://console.x.ai/billing

---

## DOCUMENTATION

| Document | Usage |
|----------|-------|
| HISTORY.md | Historique sessions 0-75 |
| outputs/FORENSIC-AUDIT-2025-12-18.md | Audit factuel |
| docs/deployment.md | Processus deploiement |
| docs/website-blueprint.md | Design & UX |
| .claude/rules/*.md | Standards code |

---

*Principe: Verite factuelle uniquement. Consulter FORENSIC-AUDIT avant affirmation.*
