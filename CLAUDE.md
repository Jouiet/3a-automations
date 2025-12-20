# 3A AUTOMATION - Mémoire Projet Claude Code
## Version: 7.7 | Dernière mise à jour: 2025-12-20 (Session 49 - Mobile UX Complete)
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

## TARIFICATION (Session 40 - Bottom-Up, ~90€/h)

### Packs Setup (One-Time)
| Pack | Prix | Temps | Contenu |
|------|------|-------|---------|
| **Quick Win** | 390€ | ~3-4h | Audit express + 1 flow + Doc PDF |
| **Essentials** | 790€ | ~7-9h | Audit + 3 flows + A/B + Support 30j |
| **Growth** | 1490€ | ~14-18h | 5 flows + RFM + Dashboard + Support 60j |

### Retainers Mensuels (Après Setup)
| Plan | Prix/mois | Heures | Contenu |
|------|-----------|--------|---------|
| **Maintenance** | 290€ | 3h | Monitoring + fixes + rapport |
| **Optimization** | 490€ | 5h | + A/B tests + optimisation |
| **Growth** | 890€ | 10h | + nouveaux flows + stratégie |

### Processus (Sans Appels)
1. Formulaire diagnostic (5-10 min)
2. Rapport PDF (24-48h)
3. Proposition Google Docs
4. Livraison + Documentation

### Voice AI Assistant ✅ LIVE (100% Vérifié Session 41)
- **Widget déployé**: 24/26 pages (FR + EN) ✅
- **Test empirique**: `node scripts/test-voice-widget.cjs` → 100%
- **Technologie**: Web Speech API (gratuit, pas de coût API)
- **Fonctionnalités**:
  - Reconnaissance vocale (micro) ✅
  - Synthèse vocale (réponses parlées) ✅
  - 33 mots-clés reconnus (16 FR + 17 EN) ✅
  - fadeIn/fadeOut animations ✅
  - CTA links corrects (/contact.html, /en/contact.html) ✅
  - Fallback texte pour tous navigateurs
- **Fichiers**: `/voice-assistant/voice-widget.js` (FR) + `voice-widget-en.js` (EN)
- **Upgrade futur**: Grok Voice API ($0.05/min) quand crédits achetés

**Sources:** Klaviyo 2025, xAI Docs, Mordor Intelligence

---

## COMMANDES ESSENTIELLES

```bash
# Validation
node automations/generic/test-all-apis.cjs
node scripts/test-voice-widget.cjs  # Voice widget 100% test

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
5. ~~Fusionner CSS~~ ✅ FAIT - styles.min.css (82KB minifié)

## SESSION 49 COMPLÉTÉE ✅ (20/12/2025 - Mobile UX Complete)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Orbital repositionné | ✅ | 390px, margin-top: 20px (évite header) |
| Process Timeline -20% | ✅ | step-marker 50px→40px, fonts réduits |
| Containers centrés | ✅ | Sélecteur corrigé: .hero-ultra-content |
| CTA "Ready to Scale" | ✅ | Centré + form agrandi |
| Footer mobile | ✅ | Flex column + tout centré |
| Flywheel +20% | ✅ | 280px→340px, stage 90px→108px |
| CSS minifié | ✅ | 130KB → 87KB |

**FORENSIC ANALYSIS - Bug centrage identifié:**
```
PROBLÈME:
├── HTML utilise: class="hero-ultra-content" (index.html:156)
├── CSS ciblait: .hero-content, .hero-content-ultra (INCORRECT)
└── RÉSULTAT: Centrage ne s'appliquait pas!

SOLUTION:
└── CSS corrigé: cible maintenant .hero-ultra-content
```

**Changements CSS mobile (768px):**
- Orbital: `390px`, `margin: 20px auto` (évite header)
- Timeline: step-marker `40px`, fonts `-20%`
- Hero: `.hero-ultra-content` centré
- CTA: container flex centered, form 100% width
- Footer: flex column + align-items center (tous éléments)
- Flywheel: +20% (wheel 340px, stage 108px, icon 44px)

**Commits Session 49:**
- `fdac0d3` feat(mobile): Comprehensive homepage mobile UX improvements
- `ed96481` fix(mobile): Orbital -5%, Timeline -20%, containers centered
- `f9009a6` fix(mobile): Restore orbital size + correct centering selectors
- `815b1ef` fix(mobile): Center CTA "Ready to Scale" + expand form
- `1beb8a3` fix(mobile): Footer centered + Flywheel +20%

---

## SESSION 48 COMPLÉTÉE ✅ (20/12/2025 - Performance + Mobile UX)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Lighthouse audit | ✅ | FR: 52/90/100/100, EN: 54/90/100/100 |
| Critical CSS inline | ✅ | ~2KB inline pour FCP rapide |
| CSS minification | ✅ | 117KB → 82KB (-30%) |
| Font async loading | ✅ | preload + onload technique |
| Alt text fix | ✅ | Redundant alt removed |
| Mobile orbital animation | ✅ | Visible sur tablet/mobile (+20% size) |
| Counter-rotation | ✅ | Tech icons text upright |

**Lighthouse Scores (Post-Optimization):**
| Métrique | Avant | Après | Target |
|----------|-------|-------|--------|
| Performance | 44 | 52 | >90 |
| Accessibility | 89 | 90 | >95 |
| Best Practices | 100 | 100 | 100 ✅ |
| SEO | 100 | 100 | 100 ✅ |

**Core Web Vitals:**
- FCP: 3.4s → 3.1s (⚠️ target <1.8s)
- LCP: 6.4s → 6.2s (❌ target <2.5s)
- TBT: 710ms → 720ms (❌ target <200ms)
- CLS: 0.001 → 0.024 (✅ target <0.1)
- SI: 15.8s → 4.4s (⚠️ target <3.4s)

**Bottleneck identifié:**
- GTM blocking: 397ms main thread
- Solution future: GTM defer/lazy load

**Fichiers créés:**
- `styles.min.css` - CSS minifié (82KB)
- `critical.css` - CSS critique pour above-fold
- `outputs/lighthouse-fr.json` - Audit pre-optimization
- `outputs/lighthouse-fr-v2.json` - Audit post-optimization

**Commits Session 48:**
- `9ea262f` perf(site): Critical CSS inlining + async font/CSS loading
- `731e956` fix(mobile): Show orbital animation on mobile + fix upside-down text
- `438c8da` fix(mobile): Increase orbital animation size +20% on tablet

---

## SESSION 41 COMPLÉTÉE ✅ (19/12/2025 - Voice Widget 100% Fix)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Vérification empirique | ✅ | Script test-voice-widget.cjs créé |
| Test syntaxe JS | ✅ | FR + EN valides |
| Couverture pages | ✅ | 24/26 pages |
| Response matching | ✅ | 16 FR + 17 EN keywords |
| Fix CSS animations | ✅ | fadeIn/fadeOut ajoutés |
| Fix CTA links | ✅ | /contact.html, /en/contact.html |
| Success rate | ✅ | **100%** (13/13 tests) |

**Corrections appliquées:**
- `voice-widget.js`: +@keyframes fadeIn/fadeOut, CTA → /contact.html
- `voice-widget-en.js`: +@keyframes fadeIn/fadeOut, CTA → /en/contact.html

**Commits Session 41:**
- `f92e2b5` fix(voice-widget): Add missing CSS animations + fix CTA links

---

## SESSION 47 COMPLÉTÉE ✅ (20/12/2025 - UX/UI Grid Fixes + Terminology)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Email flows grid (3+1 → 2+2) | ✅ | ecommerce.html flows-showcase |
| Terminology "Flywheel" | ✅ | Remplacé par termes FR-friendly |
| Footer email inline | ✅ | Déplacé sous Confidentialité + white-space: nowrap |
| CSS grid balances | ✅ | Multiple pages corrigées |

**Corrections terminologie appliquées:**
- "Flywheel 360°" → "Système 360°" (footers toutes pages)
- "Le Flywheel de Croissance" → "Le Moteur de Croissance" (index.html)
- "Audit Flywheel Complet" → "Audit Système Complet" (automations.html)
- "Voir Flywheel 360°" → "Voir le Système 360°" (automations.html)
- "Découvrir le Flywheel 360" → "Découvrir le Système 360°" (ecommerce.html)

**Problème footer résolu:**
- Email "contact@3a-automation.com" wrappait sur 2 lignes
- Fix: Déplacé en list item + CSS `white-space: nowrap` sur mailto links
- Structure finale:
  ```
  LÉGAL
  ├── Mentions légales
  ├── Confidentialité
  └── contact@3a-automation.com ← INLINE ✅
  ```

**CSS Grid fixes:**
- `.flows-showcase`: `repeat(auto-fit, minmax())` → `repeat(2, 1fr)` (2+2 équilibré)
- `.footer-links-ultra a[href^="mailto:"]`: `white-space: nowrap`

**Commits Session 47:**
- `238a8dc` fix(ux): Email flows grid balance + French terminology
- `4d63c73` fix(footer): Force email inline with nowrap
- `e10aff7` fix(footer): Prevent email text wrap
- `e447783` fix(footer): Move email to list item under Confidentialité
- `93248e6` fix(footer): Force email link to single line with white-space: nowrap

**Leçon apprise:**
- Terminologie anglophone ("Flywheel") incompréhensible pour public francophone
- Toujours utiliser termes universels ou équivalents FR

---

## SESSION 46 COMPLÉTÉE ✅ (20/12/2025 - Branding Logo Fix)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Voice widget pulse effect | ✅ | pulse-glow, pulse-ring animations |
| Logo.png application | ✅ | 26 pages + widget avec contrainte 40x40px |
| CSS fix | ✅ | .logo-icon img { object-fit: contain } |
| Revert amateur changes | ✅ | Supprimé logo sans sizing |

**Problème identifié:**
- logo.png = image marketing AVEC fond cyberpunk + texte "3A AUTOMATIONS"
- Utilisé sans contrainte CSS = débordement header/footer
- **Pas d'icône transparente disponible** dans le projet

**Solution appliquée:**
- CSS: `.logo-icon img { width: 100%; height: 100%; object-fit: contain; }`
- Résultat: logo.png contraint à 40x40px dans container

**Commits Session 46:**
- `64a6092` feat(widget): Pulse effect + 3A logo on voice assistant
- `9be2f20` feat(branding): Apply official logo.png (amateur - trop grand)
- `b31730a` revert: Remove amateur logo.png usage
- `1ae9c8e` fix(branding): Apply official logo.png with proper 40x40px sizing

**Leçon apprise:**
- Toujours vérifier l'asset AVANT application site-wide
- logo.png ≠ icône transparente → nécessite CSS contrainte
- Tester visuellement AVANT push
- **CRITIQUE:** Vérifier TOUS les fichiers CSS (styles.css ET styles-lite.css)

**Bug critique corrigé (Session 46b):**
- `styles-lite.css` manquait `.logo-icon img { width: 100% }`
- 20+ pages affichaient le logo à 500x500px au lieu de 40x40px
- Commit: `beb8aad` fix(css): Add .logo-icon img rule to styles-lite.css

---

## SESSION 45 COMPLÉTÉE ✅ (20/12/2025 - Premium UI/UX Optimization)

| Tâche | Statut | Détails |
|-------|--------|---------|
| audit-gratuit.html UI/UX | ✅ | Hero particles, FAQ grid ultra, CTA glass-panel, footer status |
| a-propos.html UI/UX | ✅ | Hero particles, trust bar, footer status, hover effects |
| free-audit.html EN | ✅ | Same as FR version |
| about.html EN | ✅ | Same as FR version |
| cas-clients.html | ✅ | "Scraping" → "Veille tarifaire automatisée" |
| pricing.html footer | ✅ | Fixed to footer-ultra structure |
| Currency selector | ✅ | Added JS handler for EUR/MAD/USD buttons |
| Process section | ✅ | Premium 4-column grid with timeline |

**Améliorations UI/UX Premium:**
- Hero particles (floating orbs + falling lines animations)
- FAQ grid ultra (2-col layout, icons, hover effects)
- CTA glass-panel (backdrop blur + glow)
- Footer status bar (system operational + stats)
- Business type selector (SVG icons, CSS classes)
- Trust indicators bar (hero metrics)
- Vision/pillar cards hover effects

**Pages optimisées:** 4 FR + 4 EN
**Commits Session 45:**
- `3229690` feat(landing): Premium UI/UX optimization for audit-gratuit + a-propos
- `6ec3504` feat(landing): Premium UI/UX for EN versions (free-audit, about)

---

## SESSION 40 COMPLÉTÉE ✅ (19/12/2025 - Pricing Refonte Bottom-Up + Voice POC)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Pricing Refonte | ✅ | Bottom-up ~90€/h, Packs 390/790/1490€, Retainers 290/490/890€ |
| Processus Sans Appels | ✅ | 4 étapes doc-based (formulaire→PDF→Docs→livraison) |
| Sources Vérifiées | ✅ | Klaviyo, Mordor, Gartner, Forrester, xAI |
| Voice AI POC | ✅ | grok-voice-poc.cjs + .py créés, API testée |
| Pricing FR+EN | ✅ | Nouvelles sections (audit, retainer, voice, process) |

**POC Voice AI Grok:**
- `automations/agency/core/grok-voice-poc.cjs` (Node.js)
- `automations/agency/core/grok-voice-poc.py` (Python/LiveKit)
- Status: Code ready, requires $5 xAI credits

**Faits Voice AI:**
- Pricing: $0.05/min (5x cheaper than competitors)
- Latency: <1s time-to-first-audio
- Languages: 100+ with native accents
- Voices: Sal, Rex, Eve, Leo, Mika, Valentin

---

## SESSION 38 COMPLÉTÉE ✅ (19/12/2025 - Pricing Currency Fix)

| Tâche | Statut | Détails |
|-------|--------|---------|
| Supprimer 🥇🥈🥉 | ✅ | Rankings retirés FR+EN |
| Harmoniser devises | ✅ | Ratios neutres (42:1, +15%) |
| Target CA dynamique | ✅ | data-ca-eur avec conversion |
| FAQ multi-devise | ✅ | Explique EUR/MAD/USD |
| JS conversion CA | ✅ | formatCA() function |

**Problèmes corrigés:**
- "$3.07 revenue/recipient" → "+15% Cart Recovery Rate"
- "$42 ROI pour $1" → "42:1 ROI"
- "0€ coût outils" → "Gratuit - Looker inclus"
- "CA 10k-50k€" → Converti dynamiquement selon devise
- FAQ obsolète → Multi-devise expliqué

**Commit Session 38:**
- `6bcd480` fix(pricing): Remove medal rankings + fix currency consistency

---

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
