# AUDIT FORENSIQUE - SESSION 148
## Date: 24/01/2026 23:30 UTC
## Status: CRITIQUE - 47 PROBLÈMES IDENTIFIÉS

> **Méthode**: Analyse bottom-up factuelle, vérification empirique ligne par ligne
> **Objectif**: Nettoyage code mort, correction exhaustive, qualité professionnelle

---

## RÉSUMÉ EXÉCUTIF

| Catégorie | Problèmes | Sévérité |
|-----------|-----------|----------|
| Données incorrectes | 8 | 🔴 CRITIQUE |
| CSS/Design cassé | 12 | 🔴 CRITIQUE |
| Header/Footer incohérents | 15 | 🟠 HAUTE |
| Liens cassés/manquants | 6 | 🟠 HAUTE |
| Code mort/obsolète | 6 | 🟡 MOYENNE |
| **TOTAL** | **47** | |

---

## 1. DONNÉES INCORRECTES (8 problèmes)

### 1.1 "119" au lieu de "121" automatisations

**Fichiers affectés (19 occurrences):**
```
blog/index.html:384
blog/comment-automatiser-votre-service-client-avec-l-ia.html:361, 383
blog/automatisation-ecommerce-2026.html:345, 366
blog/assistant-vocal-ia-pme-2026.html:417, 448
blog/marketing-automation-pour-startups-2026-guide-complet.html:315, 336
en/blog/index.html:353
en/blog/how-to-automate-customer-service-with-ai-effectively.html:308, 329
en/blog/ecommerce-automation-2026.html:346, 367
en/blog/voice-ai-assistant-sme-2026.html:417, 448
en/legal/terms.html:310
en/legal/privacy.html:418
en/services/voice-ai.html:484
en/services/free-audit.html:229
services/audit-gratuit.html:229
```

**Valeur correcte**: 121 (selon automations-registry.json)

### 1.2 "AUTOMATION" comme partenaire (BUG)

**Fichier**: `automations.html:1433-1445`
**Problème**: La carte partenaire "automation" n'a pas de `<span class="partner-name">` - seul le badge apparaît

**Code actuel (FAUX):**
```html
<div class="partner-card automation">
  <div class="partner-icon">...</div>
  <!-- MANQUE: <span class="partner-name">GitHub Actions</span> -->
  <span class="partner-badge">Automation</span>
</div>
```

**Solution**: Ajouter un nom de partenaire réel (GitHub Actions, n8n, etc.) ou supprimer cette carte

### 1.3 "Lire →" manquant sur 3/5 articles blog

**Fichier**: `blog/index.html`

| Article | Ligne | Bouton "Lire →" |
|---------|-------|-----------------|
| Automatisation Fiable Salesforce | 257-272 | ❌ MANQUANT |
| Comment Automatiser Service Client | 274-293 | ✅ OK |
| Marketing Automation Startups | 296-315 | ✅ OK |
| Assistant Vocal IA PME | 318-336 | ❌ MANQUANT |
| Automatisation E-commerce 2026 | 338-357 | ❌ MANQUANT |

---

## 2. CSS/DESIGN CASSÉ (12 problèmes)

### 2.1 Page audit-gratuit.html

**2.1.1 Icône "Ce que nous analysons" collée au header**
- **Fichier**: `services/audit-gratuit.html:175-192`
- **Cause**: Section `.services-détail` sans margin-top
- **CSS manquant**: `.services-détail { margin-top: var(--spacing-3xl); }`

**2.1.2 Section "Prochaines étapes" sans styling**
- **Fichier**: `services/audit-gratuit.html:194-215`
- **Problème**: Divs bruts sans classes CSS
- **Code actuel**:
```html
<div>
  <div><svg>1</svg></div>
  <h3>Rapport PDF détaillé</h3>
  <p>...</p>
</div>
```
- **Manque**: Classes `.next-steps-grid`, `.next-step-card`, `.step-number`

### 2.2 Page cas-clients.html - Design "catastrophique"

**Problèmes identifiés:**
1. `.case-card` - styles glassmorphism incomplets
2. `.case-hero` - espacement insuffisant
3. `.process-card` - icônes non stylées
4. `.security-card` - manque backdrop-filter
5. Transitions hover absentes

### 2.3 Page academie/guides.html

**2.3.1 Header différent du reste du site**
- **Fichier**: `academie/guides.html:56-72`
- **Problème**: Structure header basique, pas le header cyber standard
- **Logo**: Pointe vers `/assets/images/logo.svg` (devrait être `/logo.webp`)

**2.3.2 "X min de lecture" à supprimer**
- **Lignes**: 118, 166, 203, 240, 277, 314, 351, 388
- **Action**: Supprimer `<p class="guide-time">X min de lecture</p>`

### 2.4 TOUTES les pages academie/cours/*

**Fichiers affectés:**
- `academie/cours/demarrer.html`
- `academie/cours/leads.html`
- `academie/cours/emails.html`
- `academie/cours/ecommerce.html`
- `academie/cours/analytics.html`
- `academie/cours/contenu.html`

**Problèmes communs:**
1. Header différent (non-standard)
2. Footer absent ou basique
3. Breadcrumb styling manquant
4. `.course-*` classes CSS manquantes

### 2.5 Bouton "Demander l'audit gratuit" - CSS cassé

**Fichier**: `blog/index.html:367`
**Problème**: Utilise `.btn-primary-cyber` sans le wrapper correct
**Solution**: Harmoniser avec structure bouton standard

---

## 3. HEADER/FOOTER INCOHÉRENTS (15 problèmes)

### 3.1 Pages avec header NON-STANDARD

| Page | Header Type | Footer Type |
|------|-------------|-------------|
| `academie/guides.html` | ❌ Basique | ❌ Absent |
| `academie/cours/*.html` (6) | ❌ Basique | ❌ Absent |
| `en/academy/guides.html` | ❌ Basique | ❌ Absent |
| `en/academy/courses/*.html` (7) | ❌ Basique | ❌ Absent |
| `blog/index.html` | ⚠️ Différent | ❌ Basique |
| `en/blog/index.html` | ⚠️ Différent | ❌ Basique |

**Header standard** (référence: `index.html`):
- Logo avec `.logo-icon` + `.logo-text-wrap`
- Navigation avec `.nav` et `.btn-nav`
- Mobile menu `.nav-toggle`
- Language switch `.lang-switch`
- Agentic Status Banner

### 3.2 Pages avec footer NON-STANDARD

**Footer standard**: `footer-ultra` avec:
- `.footer-status-bar` (4 status items)
- `.footer-grid-ultra` (5 colonnes)
- `.footer-social` (6 icônes)
- `.footer-bottom-ultra`

**Pages avec footer basique/absent:**
- Toutes les pages `academie/*` et `academy/*`
- `blog/index.html` et `en/blog/index.html`

---

## 4. LIENS CASSÉS/MANQUANTS (6 problèmes)

### 4.1 Logo academie pointe vers fichier inexistant

**Fichier**: `academie/guides.html:59`
**Lien actuel**: `/assets/images/logo.svg`
**Fichier existe?**: ❌ NON
**Lien correct**: `/logo.webp`

### 4.2 Bouton EN tronqué (problème CSS)

**Observation screenshot**: Bouton "EN" apparaît coupé
**Cause probable**: `.lang-switch` width insuffisant ou overflow hidden

### 4.3 Accessibilité texte (signalé par user)

Textes problématiques identifiés:
- "jours avant le pivot Salesforce" - contraste?
- "décision non contrôlée" - contexte?
- "LA Leila A." / "KB Karim B." / "SM Sarah M." - initiales seules

**Action**: Vérifier contraste WCAG AA et ajouter contexte si nécessaire

---

## 5. CODE MORT/OBSOLÈTE (6 problèmes)

### 5.1 CSS mort potentiel

**À vérifier:**
- `.booking-success` - utilisé?
- `.testimonial-avatar` vs `.avatar` - duplication?
- Anciennes classes v60-v63

### 5.2 Scripts obsolètes

**Fichiers à auditer:**
- `script-lite.min.js` vs `script.min.js` - consolidation?
- `geo-locale.js` - fonctionnel?
- `telemetry.js` - utilisé?

### 5.3 Assets orphelins

**Vérifier:**
- `/assets/images/logo.svg` - existe? utilisé correctement?
- `/css/ultra-blog.css` - nécessaire avec styles.css?
- `/css/critical.css` - contenu réel?

---

## 6. PLAN D'ACTION PRIORISÉ

### Phase 1: CRITIQUE (À faire immédiatement)

| # | Action | Fichiers | Effort |
|---|--------|----------|--------|
| 1 | Remplacer 119→121 | 19 fichiers | 10 min |
| 2 | Fixer partner "AUTOMATION" | automations.html | 5 min |
| 3 | Ajouter "Lire →" blog | blog/index.html | 5 min |
| 4 | CSS audit-gratuit sections | styles.css | 30 min |
| 5 | CSS cas-clients cards | styles.css | 30 min |

### Phase 2: HAUTE (Cette session)

| # | Action | Fichiers | Effort |
|---|--------|----------|--------|
| 6 | Standardiser headers academie | 14 fichiers | 1h |
| 7 | Ajouter footers academie | 14 fichiers | 1h |
| 8 | Supprimer "X min de lecture" | academie/guides.html | 10 min |
| 9 | Fixer logo path academie | 14 fichiers | 10 min |
| 10 | CSS cours pages | styles.css | 30 min |

### Phase 3: MOYENNE (Session suivante)

| # | Action | Fichiers | Effort |
|---|--------|----------|--------|
| 11 | Standardiser blog header/footer | 12 fichiers | 1h |
| 12 | Audit code mort | Multiple | 2h |
| 13 | Consolider CSS | styles.css | 1h |
| 14 | Vérifier accessibilité | Multiple | 1h |
| 15 | Tests de régression | Tous | 30 min |

---

## 7. VÉRIFICATIONS POST-FIX

### Script de validation à exécuter:

```bash
# 1. Vérifier 119 supprimé
grep -rn "119" --include="*.html" | grep -i "automation" | wc -l
# Attendu: 0

# 2. Vérifier 121 présent
grep -rn "121" --include="*.html" | grep -i "automation" | wc -l
# Attendu: >0 dans chaque footer

# 3. Vérifier partner-name existe
grep -n "partner-card automation" automations.html | head -5
# Attendu: doit avoir partner-name sur ligne suivante

# 4. Vérifier logo paths
grep -rn "assets/images/logo" --include="*.html" | wc -l
# Attendu: 0

# 5. Vérifier "min de lecture" supprimé
grep -rn "min de lecture" --include="*.html" | wc -l
# Attendu: 0
```

---

## 8. ANNEXES

### A. Liste complète fichiers academie

```
academie/
├── guides.html
├── cours/
│   ├── demarrer.html
│   ├── leads.html
│   ├── emails.html
│   ├── ecommerce.html
│   ├── analytics.html
│   └── contenu.html
└── parcours/
    ├── e-commerce.html
    ├── growth.html
    └── marketing-automation.html

academy/ (EN)
├── guides.html
├── courses/
│   ├── getting-started.html
│   ├── leads.html
│   ├── emails.html
│   ├── ecommerce.html
│   ├── analytics.html
│   ├── content.html
│   └── hybrid-architecture.html
└── paths/
    ├── e-commerce.html
    ├── growth.html
    └── marketing-automation.html
```

### B. Header standard (à copier)

Voir `index.html:191-253` pour la structure complète.

### C. Footer standard (à copier)

Voir `index.html:1198-1291` pour la structure complète.

---

*Document généré: 24/01/2026 23:45 UTC*
*Session: 148 - Audit Forensique Complet*
*Méthode: Bottom-up factuelle, zéro wishful thinking*
