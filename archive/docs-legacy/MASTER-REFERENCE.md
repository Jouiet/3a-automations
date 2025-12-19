# MASTER REFERENCE - 3A AUTOMATION
## Document de Synthèse - Version 1.1
## Date: 17 Décembre 2025
## Domaine: 3a-automation.com | Email: contact@3a-automation.com

---

## 1. DOCUMENTS MAÎTRES (Hiérarchie)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HIÉRARCHIE DOCUMENTAIRE JO-AAA                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NIVEAU 1 - MÉMOIRE SYSTÈME (Claude Code)                                   │
│  ════════════════════════════════════════════════════════════════════════   │
│  📁 CLAUDE.md                    → Mémoire persistante Claude Code          │
│  📁 .claude/rules/               → Règles modulaires                        │
│                                                                              │
│  NIVEAU 2 - DOCUMENTS OPÉRATIONNELS (2-3 documents maîtres)                │
│  ════════════════════════════════════════════════════════════════════════   │
│  📄 BUSINESS-MODEL-FACTUEL-2025.md     → QUI nous sommes (identité)        │
│  📄 AAA-ACTION-PLAN-MVP-2025.md        → CE QUE nous faisons (exécution)   │
│                                                                              │
│  NIVEAU 3 - DOCUMENTS DE RÉFÉRENCE (consultation)                          │
│  ════════════════════════════════════════════════════════════════════════   │
│  📄 FORENSIC-AUDIT-TRUTH-2025-12-16.md → Audit factuel (vérité)            │
│                                                                              │
│  NIVEAU 4 - ARCHIVES (aspirationnel, à ignorer pour décisions)             │
│  ════════════════════════════════════════════════════════════════════════   │
│  📄 JO-AAA-STRATEGIC-MASTERPLAN-2026.md                                    │
│  📄 FLYWHEEL-BLUEPRINT-2025.md                                              │
│  📄 AAA-AUTOMATIONS-CATALOG-2025.md                                         │
│  📄 5-AI-SHIFTS-2026-STRATEGY.md                                            │
│  📄 Autres...                                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Résumé: 2-3 Documents Maîtres

| # | Document | Usage | Mise à jour |
|---|----------|-------|-------------|
| 1 | **CLAUDE.md** | Mémoire Claude Code (chargé automatiquement) | À chaque changement majeur |
| 2 | **BUSINESS-MODEL-FACTUEL-2025.md** | Source de vérité identité/modèle | Mensuel ou après pivot |
| 3 | **AAA-ACTION-PLAN-MVP-2025.md** | Plan d'exécution | Hebdomadaire |

---

## 2. SYSTÈME MÉMOIRE CLAUDE

### Structure Implémentée

```
/Users/mac/Desktop/JO-AAA/
├── CLAUDE.md                     # Mémoire projet (chargée automatiquement)
└── .claude/
    └── rules/
        ├── code-standards.md     # Standards de développement
        └── factuality.md         # Règles de factualité
```

### Comment Claude Code utilise ces fichiers:

1. **Au démarrage** → Claude charge automatiquement `CLAUDE.md`
2. **Pour chaque fichier** → Claude consulte les règles dans `.claude/rules/`
3. **Persistance** → Les informations restent entre sessions
4. **Priorité** → Project > User > Local

### Commande pour vérifier:
```bash
/memory   # Affiche les fichiers mémoire chargés
```

---

## 3. PROPOSITION NOM AGENCE / DOMAINE

### Critères de Sélection
- ✅ Fonctionne en Français ET Anglais
- ✅ Court et mémorable
- ✅ Reflète notre positionnement (Automation)
- ✅ Disponible (.com prioritaire)
- ✅ Budget Hostinger (~€10-15/an)

### Domaine Choisi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DÉCISION FINALE - 17 DÉCEMBRE 2025                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NOM:           3A Automation                                               │
│  DOMAINE:       3a-automation.com                                           │
│  EMAIL:         contact@3a-automation.com                                   │
│  SIGNIFICATION: 3A = Automation, Analytics, AI                              │
│  STATUT:        Disponible sur Hostinger ✅                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Prochaine Action

1. ✅ Domaine vérifié disponible
2. → Réserver le domaine sur Hostinger
3. → Configurer email contact@3a-automation.com
4. → Déployer landing page

---

## 4. BUSINESS MODEL FACTUEL

### 4.1 Ce Que Nous Sommes (Réalité)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS MODEL - RÉALITÉ FACTUELLE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TYPE:            Consultant Solo Freelance                                 │
│  SPÉCIALITÉ:      Automation & Marketing pour PME (TOUS SECTEURS)          │
│  STRUCTURE:       1 personne, 20h/semaine                                  │
│  MODÈLE:          Services + Récurrent (setup + maintenance)               │
│                                                                              │
│  CIBLE:           Small/Mid Business de TOUS SECTEURS                      │
│                   • E-commerce (Shopify, WooCommerce)                      │
│                   • Healthcare / Medical                                   │
│                   • Services B2B                                           │
│                   • Retail / Commerce local                                │
│                   • Tout PME €10k-500k/mois CA                            │
│                   Budget €300-1000/mois                                    │
│                                                                              │
│  DIFFÉRENCIATION: Approche technique (code/APIs)                           │
│                   vs. Agences no-code limitées                             │
│                   Multi-secteur (pas limité e-commerce)                    │
│                   Focus résultats mesurables                               │
│                                                                              │
│  REVENUS 2026:    €35,000-40,000 (projection conservatrice)                │
│                   = ~€3,000/mois (part-time)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Modèle de Revenus

```
STRUCTURE REVENUS:

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ACQUISITION    │ →→→ │  CONVERSION     │ →→→ │  RÉCURRENCE     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│  Audit Gratuit  │     │  Setup Service  │     │  Maintenance    │
│  (Lead Magnet)  │     │  €300-500       │     │  €200-800/mois  │
│                 │     │                 │     │                 │
│  €0             │     │  One-time       │     │  Recurring      │
└─────────────────┘     └─────────────────┘     └─────────────────┘

FUNNEL:
- 10 audits gratuits → 3 conversions (~30%)
- 3 setups → 2 maintenances (~66%)
- LTV client: €1,500-5,000 sur 12 mois
```

### 4.3 Ce Que Nous Ne Sommes PAS

| Mythe | Réalité |
|-------|---------|
| Agence | Consultant solo |
| SaaS | Services personnalisés |
| Plateforme | Expertise humaine |
| Solution clé-en-main | Travail sur mesure |
| 207 scripts | ~25 génériques |
| Stack "agency-ready" | Stack client-spécifique |

---

## 5. SERVICES OFFERTS (Catalogue Factuel)

### 5.1 Services Validés et Livrables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CATALOGUE SERVICES - DÉCEMBRE 2025                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SERVICE 1: AUDIT E-COMMERCE (Lead Magnet)                                  │
│  ═══════════════════════════════════════════════════════════════════════    │
│  Prix: GRATUIT                                                              │
│  Temps: 2-3h                                                                │
│  Livrable: Rapport PDF 5-10 pages                                           │
│  Contenu:                                                                    │
│  • Analyse Shopify (produits, orders, conversion)                           │
│  • Analyse email marketing                                                  │
│  • 3-5 quick wins identifiés                                                │
│  • ROI estimé par action                                                    │
│  Script: audit-shopify-store.cjs                                            │
│                                                                              │
│  SERVICE 2: EMAIL MACHINE MINI                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│  Prix: €500 setup + €200/mois maintenance                                   │
│  Temps: 8-10h                                                               │
│  Délai: 1 semaine                                                           │
│  Livrable: 1 flow Klaviyo complet                                           │
│  Options:                                                                    │
│  • Welcome Series (5 emails)                                                │
│  • Cart Abandonment (3 emails)                                              │
│  • Post-Purchase (3 emails)                                                 │
│                                                                              │
│  SERVICE 3: SEO QUICK FIX                                                   │
│  ═══════════════════════════════════════════════════════════════════════    │
│  Prix: €300-500 one-time                                                    │
│  Temps: 4-6h                                                                │
│  Délai: 3-5 jours                                                           │
│  Livrable:                                                                   │
│  • Alt text batch (tous produits)                                           │
│  • Metafields SEO optimisés                                                 │
│  • Image sitemap                                                            │
│                                                                              │
│  SERVICE 4: LEAD SYNC                                                       │
│  ═══════════════════════════════════════════════════════════════════════    │
│  Prix: €400 setup + €150/mois                                               │
│  Temps: 6-8h                                                                │
│  Délai: 1 semaine                                                           │
│  Livrable: Meta Leads → Shopify/Klaviyo automatique                         │
│                                                                              │
│  SERVICE 5: MAINTENANCE MENSUELLE                                           │
│  ═══════════════════════════════════════════════════════════════════════    │
│  Prix: €300-800/mois selon scope                                            │
│  Temps: 4-8h/mois                                                           │
│  Inclus:                                                                     │
│  • Monitoring automations                                                   │
│  • Optimisations mensuelles                                                 │
│  • Support email                                                            │
│  • 1 call stratégique/mois                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Services NON Offerts (Hors Scope)

| Service | Raison |
|---------|--------|
| Voice AI | Budget insuffisant, expertise non prouvée |
| Développement app custom | Hors spécialité |
| Design/Branding | Pas notre expertise |
| Google Ads | Focus Meta/Email uniquement |
| Consulting stratégique pur | Trop vague, pas mesurable |

### 5.3 Pricing Summary

| Service | Setup | Récurrent | ROI Client |
|---------|-------|-----------|------------|
| Audit | €0 | - | Acquisition |
| Email Machine | €500 | €200/mois | +25% revenue email |
| SEO Quick Fix | €300-500 | - | +15% traffic organique |
| Lead Sync | €400 | €150/mois | +20% conversion leads |
| Maintenance | - | €300-800 | Continuité opérationnelle |

---

## 6. DOCUMENTATION TECHNIQUE (Référence Détaillée)

### 6.1 Documents Techniques Existants

| Document | Lignes | Contenu |
|----------|--------|---------|
| **AAA-AUTOMATIONS-CATALOG-2025.md** | 1284 | Inventaire complet 207 scripts, flows Klaviyo |
| **FLYWHEEL-BLUEPRINT-2025.md** | 1042 | Architecture e-commerce, KPIs benchmarks |
| **MCP-FLYWHEEL-INTEGRATION-ANALYSIS.md** | 375 | Analyse compatibilité MCP-Scripts |
| **FORENSIC-AUDIT-TRUTH-2025-12-16.md** | 337 | AUDIT FACTUEL - Source de vérité |

### 6.2 Métriques: Claims vs Réalité (FORENSIC-AUDIT)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MÉTRIQUES: DOCUMENTÉ VS VÉRIFIÉ                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  MÉTRIQUE               │ DOCUMENTÉ        │ RÉALITÉ VÉRIFIÉE               │
│  ══════════════════════════════════════════════════════════════════════════ │
│  Scripts totaux         │ 207              │ ~198                           │
│  Scripts réutilisables  │ 120              │ ~25 (génériques purs)          │
│  Scripts configurables  │ -                │ ~33 (avec process.env)         │
│  Scripts hardcoded      │ -                │ ~140 (client-spécifiques)      │
│  MCPs fonctionnels      │ 8-10             │ 3 (Klaviyo, Shopify, n8n)      │
│  Readiness global       │ 68%              │ ~25%                           │
│  Fichier .env           │ Requis           │ INEXISTANT                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**⚠️ RÈGLE:** Toujours consulter `FORENSIC-AUDIT-TRUTH-2025-12-16.md` avant de répéter les claims des autres documents.

---

## 7. RÉSUMÉ EXÉCUTIF

### Questions → Réponses Factuelles

| Question | Réponse |
|----------|---------|
| **Documents maîtres?** | 1. CLAUDE.md (mémoire) 2. FORENSIC-AUDIT (vérité) 3. AAA-ACTION-PLAN-MVP.md |
| **Docs techniques?** | AAA-AUTOMATIONS-CATALOG, FLYWHEEL-BLUEPRINT, MCP-INTEGRATION |
| **Système mémoire?** | CLAUDE.md + .claude/rules/ (implémenté) |
| **Nom domaine?** | `3a-automation.com` - DÉCIDÉ ✅ |
| **Business model?** | Consultant solo Automation & Marketing, setup + récurrent |
| **Services?** | Audit gratuit, Marketing Automation €500+€200, Process Automation €300-800, Maintenance €300-800 |
| **Langues?** | Français + Anglais |
| **Cible?** | Small/Mid Business TOUS SECTEURS (e-commerce, healthcare, services B2B, retail) |
| **Scripts réels?** | ~25 génériques, ~33 configurables, ~140 hardcoded |
| **MCPs réels?** | 3 fonctionnels (Klaviyo, Shopify, n8n), 3 cassés/placeholder |

---

## 8. PROCHAINES ACTIONS

```
IMMÉDIAT (Cette session):
□ Vérifier disponibilité domaine sur Hostinger
□ Réserver domaine si disponible (€10-15)
□ Mettre à jour landing page avec nouveau nom

CETTE SEMAINE:
□ Configurer Google Service Account
□ Tester scripts avec .env
□ Envoyer emails restart aux 3 clients
```

---

**Document créé:** 17 Décembre 2025
**Principe:** Synthèse factuelle, zéro bullshit
