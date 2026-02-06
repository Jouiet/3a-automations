# 3A AUTOMATION - BRANDING GUIDE
## Version: 1.1 | Updated: 2026-01-23 | Session 142
## Extracted from Official Logo

> ⚠️ **IMPORTANT**: Ce document est maintenant COMPLÉMENTÉ par:
> - **`docs/DESIGN-SYSTEM.md`** - Source de vérité technique (CSS variables, classes)
> - **`scripts/validate-design-system.cjs`** - Validation automatique
>
> Ce fichier contient les guidelines visuels/marketing.
> Pour l'implémentation technique, voir DESIGN-SYSTEM.md.

---

## 1. LOGO

### Fichiers Officiels
```
/3a-automations Logo/
├── Logo 3a-automations.png          (272 KB - Web usage)
├── Logo 3a-automations.svg          (273 KB - Print/Vector)
└── Logo Transparent - 3a-automations.svg (273 KB - Overlay)
```

### Description
- **Icone**: Triple "A" interconnecte en forme geometrique/triangulaire
- **Style**: Moderne, tech, professionnel
- **Orientation**: Centree verticale
- **Texte**: "3A" (bold) + "AUTOMATIONS" (light, espace)

---

## 2. PALETTE DE COULEURS (Exacte)

### Couleurs Primaires

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Cyan Primary** | `#4FBAF1` | rgb(79, 186, 241) | CTA, accents, liens |
| **Ice White** | `#E4F4FC` | rgb(228, 244, 252) | Texte sur fond sombre |
| **Light Blue** | `#ADD4F0` | rgb(173, 212, 240) | Gradients, highlights |

### Couleurs Fond/Background

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Navy Deep** | `#191E35` | rgb(25, 30, 53) | Fond principal dark |
| **Navy Blue** | `#1B2F54` | rgb(27, 47, 84) | Fond secondaire |
| **Dark Teal** | `#254E70` | rgb(37, 78, 112) | Fond tertiaire |

### Couleurs Secondaires

| Nom | Hex | RGB | Usage |
|-----|-----|-----|-------|
| **Teal Blue** | `#2B6685` | rgb(43, 102, 133) | Accents secondaires |
| **Blue Gray** | `#516C86` | rgb(81, 108, 134) | Texte secondaire |
| **Muted Purple** | `#4E4962` | rgb(78, 73, 98) | Ombres, overlays |

### Gradient Principal (Logo)
```css
/* Direction: Haut vers Bas */
background: linear-gradient(180deg,
  #E4F4FC 0%,    /* Ice White */
  #ADD4F0 30%,   /* Light Blue */
  #4FBAF1 100%   /* Cyan Primary */
);
```

---

## 3. TYPOGRAPHIE

### Police Principale
```
Font Family: Inter (Google Fonts)
Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

### Hierarchie

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| H1 | Inter | 700 (Bold) | 48px / 3rem | 1.1 |
| H2 | Inter | 600 (SemiBold) | 32px / 2rem | 1.2 |
| H3 | Inter | 600 (SemiBold) | 24px / 1.5rem | 1.3 |
| Body | Inter | 400 (Regular) | 16px / 1rem | 1.6 |
| Small | Inter | 400 (Regular) | 14px / 0.875rem | 1.5 |
| Caption | Inter | 500 (Medium) | 12px / 0.75rem | 1.4 |

### Logo Text
- "3A": Inter Bold, 32px, letterspacing: 0
- "AUTOMATIONS": Inter Light/Regular, 14px, letterspacing: 0.2em (uppercase)

---

## 4. VARIABLES CSS

> ⚠️ **SECTION DÉPLACÉE**: Les variables CSS techniques sont maintenant dans:
> **`docs/DESIGN-SYSTEM.md`** (Section 1. CSS VARIABLES)
>
> Ce document contient uniquement les guidelines visuels/marketing.
> Pour l'implémentation CSS, consultez DESIGN-SYSTEM.md.

### Quick Reference (voir DESIGN-SYSTEM.md pour détails complets)

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--primary` | #4FBAF1 | CTAs, accents |
| `--accent` | #10B981 | Success, validations |
| `--bg-dark` | #191E35 | Fond principal |
| `--text-light` | #E4F4FC | Texte sur fond sombre |

---

## 5. COMPOSANTS UI

### Boutons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-bg-dark);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 10px 22px;
  border-radius: var(--radius-md);
  font-weight: 600;
}

.btn-secondary:hover {
  background: rgba(79, 186, 241, 0.1);
}
```

### Cards

```css
.card {
  background: var(--color-bg-navy);
  border: 1px solid rgba(79, 186, 241, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.card:hover {
  border-color: rgba(79, 186, 241, 0.3);
  box-shadow: var(--shadow-lg);
}
```

### Forms

```css
.input {
  background: rgba(25, 30, 53, 0.5);
  border: 1px solid var(--color-text-muted);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--color-text-light);
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 186, 241, 0.2);
}
```

---

## 6. USAGE DU LOGO

### Zones de Protection
```
┌─────────────────────────────┐
│                             │
│    ┌───────────────┐        │
│    │               │        │
│    │   LOGO 3A     │ ← min 20px margin
│    │               │        │
│    └───────────────┘        │
│                             │
└─────────────────────────────┘
```

### Tailles Minimales
- Web: 120px largeur minimum
- Print: 30mm largeur minimum
- Favicon: 32x32px (icone seule)

### Versions Autorisees
1. Logo complet (icone + texte) - Usage principal
2. Icone seule - Favicon, avatar, espaces reduits
3. Texte seul "3A" - Header compact

### Interdictions
- Ne pas deformer le logo
- Ne pas changer les couleurs du gradient
- Ne pas ajouter d'effets (ombre portee, glow excessif)
- Ne pas utiliser sur fond cyan (contraste insuffisant)

---

## 7. FONDS AUTORISES

### Fond Sombre (Recommande)
```css
/* Option 1: Navy uni */
background: #191E35;

/* Option 2: Gradient */
background: linear-gradient(135deg, #191E35 0%, #1B2F54 100%);

/* Option 3: Avec texture motion blur (comme logo original) */
background: #191E35;
/* + image texture en overlay */
```

### Fond Clair
```css
/* Blanc pur */
background: #FFFFFF;

/* Gris tres clair */
background: #F8FAFC;
```

Note: Sur fond clair, utiliser version sombre du logo (a creer si necessaire)

---

## 8. IDENTITÉ & TONE OF VOICE

### Identité 3A Automation

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         3A AUTOMATION - IDENTITÉ                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   TYPE:       Agence d'Automatisation AI                                     ║
║   MARCHÉ:     E-commerce & PME B2B                                           ║
║   SIGNIFICATION: 3A = Automation, Analytics, AI                              ║
║                                                                               ║
║   CIBLE PRIMAIRE:                                                            ║
║   • Boutiques e-commerce (Shopify, WooCommerce) €10k-500k/mois              ║
║   • PME B2B cherchant à automatiser leurs processus                         ║
║                                                                               ║
║   EXPERTISE:                                                                  ║
║   • Email Marketing Automation (Klaviyo, HubSpot)                           ║
║   • Lead Generation & Nurturing                                              ║
║   • Intégrations API & Data Sync                                            ║
║   • SEO Technique & Analytics                                                ║
║   • AI-Powered Workflows                                                     ║
║                                                                               ║
║   DIFFÉRENCIATION:                                                           ║
║   • Approche technique (code/APIs, pas de no-code limité)                   ║
║   • Focus résultats mesurables (ROI, temps gagné)                           ║
║   • Stack moderne: Node.js natif, Apify, Claude, Gemini, Grok               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Règle Absolue: NOUS, jamais "je"

```
✅ CORRECT:   "Nous automatisons..."
✅ CORRECT:   "Notre équipe..."
✅ CORRECT:   "3A Automation propose..."

❌ INTERDIT:  "J'automatise..."
❌ INTERDIT:  "Je propose..."
❌ INTERDIT:  "Mon expertise..."
```

### Messages Clés

**ONE-LINER:**
> "Nous automatisons les boutiques e-commerce et PME B2B pour éliminer les tâches répétitives et maximiser le ROI."

**ELEVATOR PITCH (30 sec):**
> "3A Automation est une agence spécialisée en automatisation AI pour l'e-commerce et les PME B2B. Nous connectons vos outils, automatisons vos emails, et synchronisons vos données. Nos clients récupèrent 10-20h/semaine et augmentent leur revenue email de 25%+."

**TAGLINE:**
> "Automation. Analytics. AI."

### Principes de Communication

1. **Professionnel** - Expert technique, pas vendeur agressif
2. **Direct** - Pas de jargon inutile, aller droit au but
3. **Factuel** - Que des faits vérifiables, pas de promesses vides
4. **Accessible** - Compréhensible par non-techniciens
5. **Orienté Résultats** - Toujours mentionner le bénéfice concret

### Exemples de Ton

**BON:**
> "Nous automatisons vos flows Klaviyo pour augmenter le revenue email de 20-40%."
> "Notre intégration synchronise vos leads Meta vers Klaviyo en temps réel."
> "3A Automation a aidé 3 clients e-commerce à récupérer 15h/semaine."

**À ÉVITER:**
> "Notre solution révolutionnaire va transformer votre business!" (trop vendeur)
> "La meilleure agence d'automatisation du monde!" (non vérifiable)
> "Nous allons exploser vos résultats!" (promesse vide)
> Tout usage de "je" au lieu de "nous"

### Mots-clés de Marque

| Catégorie | Mots-clés |
|-----------|-----------|
| Core | Automation, Analytics, AI, 3A |
| Technique | API, Integration, Workflow, Data Sync |
| Business | ROI, Efficacité, Temps gagné, Revenue |
| Cible | E-commerce, PME, B2B, Shopify, Klaviyo |
| Valeurs | Transparence, Résultats, Expertise |

---

## 9. ICONOGRAPHIE

### Style
- Line icons (stroke 1.5-2px)
- Coins arrondis
- Style coherent avec Lucide/Feather icons

### Couleurs Icones
- Primaire: `#4FBAF1` (Cyan)
- Secondaire: `#E4F4FC` (Ice White)
- Disabled: `#516C86` (Blue Gray)

---

## 10. APPLICATION

### Website
- Fond: Gradient navy ou uni dark
- Texte: Ice White pour titres, Blue Gray pour body
- Accents: Cyan Primary pour CTAs et liens

### Documents
- Fond: Blanc
- Texte: Navy Deep
- Accents: Cyan Primary

### Emails
- Header: Navy avec logo
- Body: Fond blanc
- CTAs: Cyan Primary buttons

### Social Media
- Avatar: Logo icone seule
- Posts: Fond navy ou gradient
- Text overlays: Ice White

---

## CHANGELOG

| Date | Version | Modification |
|------|---------|--------------|
| 2025-12-17 | 1.0 | Creation - Extraction couleurs du logo officiel |
| 2026-01-23 | 1.2 | CSS variables moved to DESIGN-SYSTEM.md (Session 142) |
