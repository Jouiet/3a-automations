# 3A AUTOMATION - WEBSITE BLUEPRINT

## LE PROTOCOLE VÉRITÉ (The Truth Protocol)

### Version: 1.0 (Reboot) | Date: 09/01/2026 | Auteur: Ultrathink
>
> **PRINCIPE DIRECTEUR:** "Pas de bullshit. Pas de suppositions. Juste le code."

---

## 1. ARCHITECTURE & INFRASTRUCTURE (VÉRIFIÉ)

### 1.1 Stack Technique (Réalité vs Fiction)

| Composant | État Réel (Vérifié) | Notes Forensiques |
| :--- | :--- | :--- |
| **Frontend** | Static HTML5 / CSS3 / Vanilla JS | Pas de React, pas de Vue. Performance native. |
| **Backend** | Google Apps Script (Proxy) | Le "branding" Node.js est un proxy vers GAS (script.js:174). |
| **Hosting** | Hostinger VPS (1168256) | Traefik + Nginx (Fichiers statiques servis). |
| **Database** | Google Sheets / JSON Files | `data/agentic-status.json` (Source de vérité). |
| **CMS** | Aucun (Hardcoded HTML) | Gestion manuelle ou via scripts d'injection. |

### 1.3 External Integrations (Partner Projects)

| Workflow | Status | Reference Project |
| :--- | :--- | :--- |
| **YouTube Content Maker** | ✅ **Active** | `cinematicAds` (External) |

### 1.2 Volumétrie des Fichiers Clés

- **index.html**: ~72 KB (Contenu riche: Hero, Services, FAQ, Schema).
- **styles.css**: ~172 KB (CSS natif, Animations 3D, Cyber-theme complet).
- **script.js**: ~39 KB (Logique form, animations, tracking multicanal).

---

## 2. AUDIT DE CONTENU & STRUCTURE

### 2.1 Arborescence Vérifiée (Filesystem Scan)

```text
/
├── index.html               # Homepage (Landing principale)
├── automations.html         # Catalogue (174 tools listés)
├── pricing.html             # Grille tarifaire (3 offres + Retainers)
├── booking.html             # Prise de RDV (Iframe Cal)
├── cas-clients.html         # Preuve sociale (Racine)
├── contact.html             # Formulaire simple
├── services/
│   ├── ecommerce.html       # Pilier principal (Shopify/Klaviyo)
│   ├── pme.html             # Pilier secondaire (B2B)
│   ├── flywheel-360.html    # Offre holistique
│   └── voice-ai.html        # Assistant Vocal (Demo)
└── legal/
    ├── mentions-legales.html
    └── politique-confidentialite.html
```

### 2.2 Éléments MANQUANTS (Factuel)
>
> Ce qui n'est pas dans le code n'existe pas. Point.

1. ❌ **Section "Problèmes" (Pain Points)** : Absente de `index.html`. Aucune trace de copywriting "Agitation".
2. ❌ **Fichier CGU** : `legal/cgu.html` est inexistant.
3. ❌ **Pixel Configuration** : Les IDs Meta et LinkedIn sont des placeholders (`PIXEL_ID_HERE` dans index.html).
4. ❌ **Tableau de Bord Client** : L'accès "Dashboard" renvoie vers une page statique ou externe, pas de SAAS complet derrière.

---

## 3. FONCTIONNALITÉS & UX (TESTÉ)

### 3.1 Interface Utilisateur

- **Navigation Mobile**: ✅ **Fonctionnelle** (Hamburger menu géré par `script.js`).
- **Dark Mode**: ✅ **Natif** (Thème par défaut `var(--secondary): #191E35`).
- **Formulaire**: ✅ **Hybride** (Frontend HTML -> Webhook Google Apps Script avec Fallback Mailto).
- **Animations**: ✅ **Actives** (Orbital rings, Scroll reveal, 3D cards).

### 3.2 Accessibilité & Performance (Audit Session 129)

- **Alt Text**: ✅ **100%** (84/84 images ont un attribut alt).
- **Heading Map**: ✅ **Correcte** (H1 -> H2 structure respectée).
- **Interactive**: ⚠️ **Partiel** (Manque `aria-label` sur boutons Cookie/Submit).
- **Performance**: ✅ **Preload** (Logo LCP preloadé avec `fetchpriority="high"`).

### 3.3 Avertissements Console (Connus & Assumés)

| Warning IDE | Cause | Impact | Décision |
| :--- | :--- | :--- | :--- |
| `img[fetchpriority]` | Non supporté Firefox/Opera | Aucun (Ignoré par le navigateur) | **CONSERVER** (Vital pour LCP Chrome) |
| `meta[name=theme-color]` | Non supporté Firefox | Aucun (Ignoré) | **CONSERVER** (Vital pour PWA/Mobile Chrome) |

---

## 4. POSITIONNEMENT & CIBLE (RECTIFICATION)

### 4.1 La Cible Réelle

- **Primaire**: E-commerce (Shopify/Klaviyo) & PME de services.
- **Legacy**: Healthcare (Mentionné historiquement dans `cas-clients` / Alpha Medical, but not an active target of current marketing).
- **Offre**: "Automatisation Holistique" (Tech + Marketing).

### 4.2 Preuve Sociale (Chiffres Vérifiés)

- **Automations**: 174 (Sovereign Units v6.0)
- **Agents**: 18 (Hardened L5 Swarm)
- **Partenaires**: 10+ (Logos présents dans `assets/logos/`).

---

## 5. PLAN D'ACTION (BASÉ SUR LES MANQUES)

### Priorité P0 (Intégrité)

1. [ ] Créer `legal/cgu.html`.
2. [ ] Rédiger et intégrer la section "Pain Points" dans `index.html` (Copywriting manquant).
3. [ ] Obtenir et injecter les Pixel IDs (Client input requis).

### Priorité P1 (Expérience)

1. [ ] Ajouter les `aria-label` manquants sur les boutons interactifs.
2. [ ] Vérifier la cohérence des titres H1 sur les sous-pages services (ex: audit-gratuit).

---
*Ce document est la SEULE source de vérité. Si c'est écrit ici, c'est que c'est dans le code.*
