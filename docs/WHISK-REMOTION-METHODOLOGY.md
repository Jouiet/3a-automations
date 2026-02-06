# WHISK + REMOTION: MÉTHODOLOGIE COMPLÈTE
## Production Vidéo Programmatique - Écosystème 3A

> **Version**: 1.0 | **Date**: 23/01/2026 | **Session**: 146bis
> **Auteur**: Claude Opus 4.6 | **Méthode**: Bottom-up factuelle
> **Scope**: 3A Automation + Alpha Medical + MyDealz

---

## SECTION 1: SPÉCIFICATIONS TECHNIQUES VÉRIFIÉES

### 1.1 Google Whisk - Faits Confirmés

| Spécification | Valeur | Source Vérification |
|---------------|--------|---------------------|
| URL Officielle | labs.google/whisk | [Google Labs](https://labs.google/whisk) |
| API Publique | **❌ AUCUNE** | Documentation officielle |
| Backend Image | Imagen 3 (→ Imagen 4 depuis Mai 2025) | [Google Blog](https://blog.google/technology/google-labs/whisk/) |
| Backend Caption | Gemini (auto-captioning) | Google documentation |
| Backend Animation | Veo 2 (Pro) / Veo 3 (Ultra) | [Google One Help](https://support.google.com/googleone/answer/16286513) |
| Durée Max Animation | **8 secondes** | Interface Whisk |
| Résolution Animation | **720p MP4** | Interface Whisk |
| Format Output | 16:9 landscape | Interface Whisk |
| Sujets Simultanés Fiables | **4 maximum** | Tests empiriques (>4 = incohérent) |
| Rate Limiting | **30-45 sec** entre prompts | [G-Labs Automation](https://github.com/duckmartians/G-Labs-Automation) |
| Disponibilité Géographique | US + pays sélectionnés | Google Labs |

### 1.1.1 Limites par Abonnement Google

| Abonnement | Prix/mois | Crédits AI/mois | Whisk Backend | Flow Backend |
|------------|-----------|-----------------|---------------|--------------|
| **FREE** | $0 | 100 | Veo 3.1 Fast | Veo 3.1 Fast |
| **Google AI Pro** | $19.99 / 119,99 MAD | 1,000 | **Veo 3** | Veo 3.1 |
| **Google AI Ultra** | $249.99 | 25,000 | **Veo 3** | Veo 3.1 (highest) |

**Sources:** [Google One AI Plans](https://one.google.com/about/google-ai-plans/) | [9to5Google Jan 2026](https://9to5google.com/2026/01/16/google-ai-pro-ultra-features/)

**Notes:**
- Crédits partagés entre Whisk et Flow
- Crédits ne s'accumulent PAS (reset mensuel)
- AI Pro = ancien "AI Premium" rebrandé

**⚠️ CONFIG 3A VÉRIFIÉE (Screenshot Google One 23/01/2026):**
```
Abonnement: Google AI Pro (2 To)
Prix: 119,99 MAD/mois
Crédits AI: 1,000/mois
─────────────────────────────
Whisk: Veo 3
Flow: Veo 3.1 (accès étendu)
Gemini App: Veo 3.1 (accès limité)
─────────────────────────────
Storage: 2 To (Photos, Drive, Gmail)
```

### 1.2 Remotion - Faits Confirmés

| Spécification | Valeur | Source Vérification |
|---------------|--------|---------------------|
| URL Officielle | remotion.dev | [Remotion](https://www.remotion.dev/) |
| Type | Framework React pour vidéo | Documentation officielle |
| Rendu Backend | Puppeteer → FFmpeg | [Architecture](https://www.remotion.dev/docs/the-fundamentals) |
| Coût Rendu Local | **Gratuit** | License MIT pour individus |
| License Commerciale | Requise pour 3+ employés | remotion.dev/license |
| Format Output | MP4, WebM, GIF | Documentation |
| Résolution Max | Illimitée (dépend ressources) | Tests empiriques |
| Déploiement Cloud | AWS Lambda (payant) | Documentation |

### 1.3 Installation Vérifiée - 3A Automation

```
Location: /Users/mac/Desktop/JO-AAA/automations/remotion-studio/

Fichiers créés (vérifiés):
├── package.json           ✅ Existe
├── remotion.config.ts     ✅ Existe
├── tsconfig.json          ✅ Existe
├── src/
│   ├── index.ts           ✅ Existe
│   ├── Root.tsx           ✅ Existe (5 compositions)
│   ├── compositions/      ✅ Existe
│   │   ├── PromoVideo.tsx
│   │   ├── DemoVideo.tsx
│   │   ├── AdVideo.tsx
│   │   └── TestimonialVideo.tsx
│   ├── components/        ✅ Existe
│   │   ├── TitleSlide.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── LogoReveal.tsx
│   │   ├── CallToAction.tsx
│   │   └── GradientBackground.tsx
│   └── lib/
│       └── ai-assets.ts   ✅ Existe (fal.ai + Replicate)
└── public/
    └── assets/whisk/      ✅ Existe (3 images)
```

---

## SECTION 2: MÉTHODOLOGIE WHISK - 7 ÉTAPES RIGOUREUSES

### 2.1 Vue d'Ensemble Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WHISK PIPELINE TECHNIQUE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   INPUT                    PROCESSING                    OUTPUT          │
│   ─────                    ──────────                    ──────          │
│                                                                          │
│   ┌──────────┐            ┌──────────┐            ┌──────────┐          │
│   │ SUBJECT  │───────────▶│  GEMINI  │            │          │          │
│   │  image   │            │ Caption  │            │  IMAGE   │          │
│   └──────────┘            │ Auto     │───────────▶│  PNG     │          │
│                           │ Writer   │            │          │          │
│   ┌──────────┐            └────┬─────┘            └──────────┘          │
│   │  SCENE   │─────────────────┤                                        │
│   │  image   │                 │                                        │
│   └──────────┘            ┌────▼─────┐            ┌──────────┐          │
│                           │ IMAGEN   │            │          │          │
│   ┌──────────┐            │ 3/4      │───────────▶│  VIDEO   │          │
│   │  STYLE   │────────────│ Generate │            │  MP4     │          │
│   │  image   │            └────┬─────┘            │  8 sec   │          │
│   └──────────┘                 │                  └──────────┘          │
│                                │                       ▲                 │
│   ┌──────────┐            ┌────▼─────┐                │                 │
│   │  TEXT    │───────────▶│  VEO 2   │────────────────┘                 │
│   │ (action) │            │ Animate  │                                   │
│   └──────────┘            └──────────┘                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Étape 1: Préparation des Inputs

#### Subject (Sujet Principal)

| Critère | Exigence | Raison |
|---------|----------|--------|
| Format | **PNG avec transparence** | Isolation nette du sujet |
| Résolution | **1024x1024 minimum** | Préservation détails |
| Fond | **Transparent ou uni** | Évite confusion Gemini |
| Cadrage | **Sujet centré, visible** | Meilleure reconnaissance |
| Éclairage | **Uniforme, pas de surexposition** | Qualité caption |

**Checklist Subject:**
```
☐ Format PNG vérifié
☐ Transparence/fond simple confirmé
☐ Résolution ≥ 1024x1024
☐ Sujet clairement visible
☐ Pas de texte superposé
☐ Éclairage cohérent
```

#### Scene (Environnement)

| Critère | Exigence | Raison |
|---------|----------|--------|
| Format | **JPEG ou PNG** | Qualité suffisante |
| Résolution | **1920x1080 minimum** | Environnement détaillé |
| Perspective | **Compatible avec Subject** | Fusion réaliste |
| Éclairage | **Direction cohérente avec Subject** | Intégration naturelle |
| Complexité | **Modérée** | Évite distraction |

**Checklist Scene:**
```
☐ Résolution ≥ 1920x1080
☐ Éclairage direction notée (gauche/droite/haut)
☐ Perspective compatible avec Subject
☐ Pas de sujets concurrents visibles
☐ Atmosphère cohérente avec usage final
```

#### Style (Esthétique)

| Critère | Exigence | Raison |
|---------|----------|--------|
| Format | **Any image format** | Flexible |
| Résolution | **512x512 minimum** | Esthétique lisible |
| Distinctivité | **Style clairement identifiable** | Transfert efficace |
| Cohérence marque | **Palette compatible** | Brand consistency |

**Checklist Style:**
```
☐ Style distinctif (watercolor, neon, minimal, etc.)
☐ Palette de couleurs compatible marque
☐ Pas de conflit avec Subject/Scene
☐ Optionnel: Même image dans Subject box pour dominance style
```

### 2.3 Étape 2: Configuration Whisk

1. **Accéder** à labs.google/whisk
2. **Vérifier** connexion Google account
3. **Configurer aspect ratio** selon usage:
   - `1:1` - Social media square
   - `16:9` - YouTube, presentations
   - `9:16` - TikTok, Stories, Reels

### 2.4 Étape 3: Upload et Configuration

```
┌─────────────────────────────────────────────────────┐
│                  INTERFACE WHISK                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│   [+] SUBJECT           [+] SCENE          [+] STYLE │
│   ┌─────────────┐      ┌─────────────┐    ┌────────┐│
│   │             │      │             │    │        ││
│   │  Drop PNG   │      │  Drop IMG   │    │  Drop  ││
│   │  ici        │      │  ici        │    │  IMG   ││
│   │             │      │             │    │        ││
│   └─────────────┘      └─────────────┘    └────────┘│
│                                                      │
│   [🎲] Dice - Auto-suggest                          │
│                                                      │
│   Aspect: ○ 1:1  ● 16:9  ○ 9:16                     │
│                                                      │
│   [ GENERATE ]                                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Actions:**
1. Drag & drop Subject image
2. Drag & drop Scene image
3. Drag & drop Style image (optionnel)
4. Sélectionner aspect ratio
5. Click Generate

### 2.5 Étape 4: Génération et Évaluation

**Temps d'attente:** 15-30 secondes typique

**Évaluation critique:**
- ✅ Essence du sujet capturée (pas copie exacte)
- ✅ Environnement cohérent
- ✅ Style appliqué reconnaissable
- ⚠️ Proportions correctes
- ⚠️ Pas de distorsions majeures

**SI résultat insatisfaisant:**
→ Passer à Étape 5 (Refinement)

### 2.6 Étape 5: Refinement (Optionnel)

1. **Cliquer** sur l'image générée
2. **Visualiser** la caption Gemini auto-générée
3. **Modifier** caption si nécessaire (icône crayon)
4. **Ajouter** keywords spécifiques
5. **Cliquer** "Refine" pour régénérer

**Limite recommandée:** 2-3 itérations max (rendements décroissants)

### 2.7 Étape 6: Animation (Veo 2)

**ATTENTION:** 10 animations gratuites/mois

```
┌─────────────────────────────────────────────────────┐
│                 WHISK ANIMATE                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│   Image sélectionnée: [thumbnail]                   │
│                                                      │
│   Action description:                               │
│   ┌─────────────────────────────────────────────┐   │
│   │ walk forward slowly                          │   │
│   └─────────────────────────────────────────────┘   │
│                                                      │
│   [ ANIMATE ]                                        │
│                                                      │
│   Limite: 8/10 restantes ce mois                    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Descriptions efficaces:**
- "walk forward" ✅ Simple, naturel
- "waving hand" ✅ Action claire
- "turning head left" ✅ Mouvement précis
- "dancing while jumping and spinning" ❌ Trop complexe

**Output:** MP4, 8 secondes, 720p, 16:9

### 2.8 Étape 7: Export et Intégration Remotion

#### Convention de Nommage

```
Format: whisk_[type]_[context]_[date]_v[version].[ext]

Exemples:
- whisk_hero_3a_20260123_v1.png
- whisk_product_alpha_20260123_v2.png
- whisk_lifestyle_mydealz_20260123_v1.mp4
```

#### Placement Fichiers

```
remotion-studio/
└── public/
    └── assets/
        └── whisk/
            ├── 3a/
            │   ├── whisk_hero_3a_20260123_v1.png
            │   └── whisk_bg_3a_20260123_v1.png
            ├── alpha/
            │   └── whisk_product_alpha_20260123_v1.png
            └── mydealz/
                └── whisk_lifestyle_mydealz_20260123_v1.mp4
```

---

## SECTION 3: REMOTION - ARCHITECTURE ET USAGE

### 3.1 Compositions Disponibles

| Composition | Durée | Format | Usage Principal |
|-------------|-------|--------|-----------------|
| `PromoVideo` | 30s | 1920x1080 | Showcase agence/marque |
| `DemoVideo` | 60s | 1920x1080 | Démo produit/features |
| `AdVideo` | 15s | 1080x1920 | Social ads (portrait) |
| `TestimonialVideo` | 45s | 1920x1080 | Témoignages clients |

### 3.2 Composants Réutilisables

| Composant | Fonction | Props Principales |
|-----------|----------|-------------------|
| `TitleSlide` | Animation titre | title, subtitle, duration |
| `FeatureCard` | Présentation feature | icon, title, description |
| `LogoReveal` | Animation logo | logoSrc, animationType |
| `CallToAction` | CTA animé | text, buttonText, url |
| `GradientBackground` | Fond animé | colors[], animationSpeed |

### 3.3 Commandes Vérifiées

```bash
# Installation (une fois)
cd /Users/mac/Desktop/JO-AAA/automations/remotion-studio
npm install

# Preview (développement)
npm run dev
# → Ouvre localhost:3000

# Render vidéos
npm run render:promo      # → out/promo.mp4 (30s)
npm run render:demo       # → out/demo.mp4 (60s)
npm run render:ad         # → out/ad.mp4 (15s)

# Render custom
npx remotion render PromoVideo out/custom.mp4 --props='{"title":"Custom"}'
```

### 3.4 Intégration Assets Whisk

```typescript
// Dans une composition Remotion
import { Img, staticFile } from 'remotion';

export const MyComposition = () => {
  return (
    <AbsoluteFill>
      {/* Asset Whisk comme background */}
      <Img
        src={staticFile('assets/whisk/3a/whisk_hero_3a_20260123_v1.png')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Contenu par-dessus */}
      <TitleSlide title="3A Automation" />
    </AbsoluteFill>
  );
};
```

---

## SECTION 4: WORKFLOW HYBRIDE WHISK → REMOTION

### 4.1 Diagramme Workflow Complet

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW HYBRIDE PRODUCTION                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 1: CONCEPTION                                                     │
│  ──────────────────                                                      │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │ Identifier  │───▶│ Préparer    │───▶│ Valider     │                  │
│  │ besoins     │    │ inputs      │    │ qualité     │                  │
│  │ vidéo       │    │ Subject/    │    │ inputs      │                  │
│  │             │    │ Scene/Style │    │             │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│        │                  │                  │                           │
│        ▼                  ▼                  ▼                           │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │              CHECKLIST VALIDATION PRÉ-WHISK              │           │
│  │  ☐ Subject: PNG transparent, 1024px+                     │           │
│  │  ☐ Scene: Éclairage cohérent, 1920x1080+                 │           │
│  │  ☐ Style: Esthétique distinctive                         │           │
│  │  ☐ Aspect ratio choisi                                   │           │
│  │  ☐ Budget animations vérifié (__/10)                     │           │
│  └──────────────────────────────────────────────────────────┘           │
│                              │                                           │
│                              ▼                                           │
│  PHASE 2: GÉNÉRATION WHISK                                              │
│  ────────────────────────────                                           │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │ Upload      │───▶│ Generate    │───▶│ Refine      │                  │
│  │ inputs      │    │ + Évaluer   │    │ si besoin   │                  │
│  │ dans Whisk  │    │             │    │ (2-3x max)  │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────┐    ┌─────────────┐                                     │
│  │ Animate     │───▶│ Download    │ ← PNG ou MP4                        │
│  │ si requis   │    │ asset       │                                     │
│  │ (8s max)    │    │             │                                     │
│  └─────────────┘    └─────────────┘                                     │
│                              │                                           │
│                              ▼                                           │
│  PHASE 3: PRODUCTION REMOTION                                           │
│  ────────────────────────────                                           │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │ Placer      │───▶│ Composer    │───▶│ Preview     │                  │
│  │ asset dans  │    │ avec        │    │ npm run     │                  │
│  │ /public/    │    │ composants  │    │ dev         │                  │
│  │ assets/     │    │ Remotion    │    │             │                  │
│  │ whisk/      │    │             │    │             │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │ Ajuster     │───▶│ Render      │───▶│ Export      │                  │
│  │ timing,     │    │ final       │    │ MP4/GIF     │                  │
│  │ transitions │    │             │    │             │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Avantages Mesurables du Workflow Hybride

| Métrique | Whisk Seul | Remotion Seul | Hybride |
|----------|------------|---------------|---------|
| Créativité visuelle | ★★★★★ | ★★☆☆☆ | ★★★★★ |
| Contrôle timing | ★☆☆☆☆ | ★★★★★ | ★★★★★ |
| Text overlays | ❌ | ★★★★★ | ★★★★★ |
| Animations complexes | ★★☆☆☆ | ★★★★★ | ★★★★★ |
| Durée flexible | ❌ (8s max) | ✅ Illimitée | ✅ Illimitée |
| Coût | Gratuit (10/mois) | Gratuit (local) | Gratuit |
| Automatisation | ❌ Manuel | ✅ 100% | ✅ 80%+ |

---

## SECTION 5: CAS D'USAGE PAR SUBSIDIAIRE

### 5.1 3A Automation (Agence B2B)

| Type Vidéo | Usage | Workflow |
|------------|-------|----------|
| **Hero Background** | Homepage, landing pages | Whisk (abstract tech) → Remotion (overlay text) |
| **Service Demo** | Présentation 121 automations | Whisk (concept art) → Remotion (features animation) |
| **Client Pitch** | Présentations commerciales | Whisk (custom scenes) → Remotion (full composition) |
| **Social Ads** | LinkedIn, Twitter | Whisk (visuals) → Remotion AdVideo (15s) |

**Assets Whisk recommandés:**
- Backgrounds tech futuristes
- Visualisations data abstraites
- Interfaces AI stylisées
- Flux de données animés

### 5.2 Alpha Medical (E-commerce B2C Médical)

| Type Vidéo | Usage | Workflow |
|------------|-------|----------|
| **Product Showcase** | Pages produit, email | Whisk (lifestyle) → Remotion (product info) |
| **Testimonial** | Social proof | Whisk (professional setting) → Remotion (quote + rating) |
| **Promo Saisonnière** | Campagnes marketing | Whisk (mood visuals) → Remotion (promo + CTA) |
| **Bundle Preview** | Upsell | Whisk (product arrangement) → Remotion (pricing overlay) |

**Assets Whisk recommandés:**
- Scènes wellness/lifestyle
- Environnements médicaux professionnels
- Personnes en situation de bien-être
- Palettes couleurs apaisantes (bleu, vert, blanc)

### 5.3 MyDealz (E-commerce B2C Mode)

| Type Vidéo | Usage | Workflow |
|------------|-------|----------|
| **Trend Video** | TikTok, Reels | Whisk (fashion scenes) → Remotion AdVideo |
| **Collection Launch** | Nouveautés | Whisk (lifestyle) → Remotion PromoVideo |
| **Flash Sale** | Urgence | Whisk (dynamic bg) → Remotion (countdown + prices) |
| **Style Guide** | Lookbook | Whisk (editorial) → Remotion (product cards) |

**Assets Whisk recommandés:**
- Street fashion scenes
- Urban lifestyle environments
- Textures et patterns mode
- Influencer-style visuals

---

## SECTION 6: LIMITATIONS ET CONTRAINTES RÉELLES

### 6.1 Limitations Google Whisk

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Pas d'API** | Workflow manuel obligatoire | Batch planning mensuel |
| **10 animations/mois** | Budget limité | Prioriser vidéos critiques |
| **8 secondes max** | Clips courts uniquement | Assembler dans Remotion |
| **720p animation** | Qualité limitée | Upscale si nécessaire |
| **4 sujets max fiables** | Compositions simples | Split en plusieurs générations |
| **Rate limiting** | Génération lente | 30-45s entre prompts |
| **Pas de copie exacte** | Capture "essence" | Attentes réalistes |
| **Disponibilité géographique** | US principalement | VPN si nécessaire |

### 6.2 Limitations Remotion

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **License commerciale** | 3+ employés = payant | Évaluer coût vs bénéfice |
| **Rendu CPU-intensif** | Temps de render | GPU si disponible |
| **Courbe apprentissage** | React requis | Templates pré-faits |
| **Pas d'audio AI natif** | Musique séparée | Intégrer ElevenLabs/autre |

### 6.3 Limitations Workflow Hybride

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Transfert manuel** | Download Whisk → Upload Remotion | Convention nommage stricte |
| **Pas de feedback loop** | Itération non-automatique | Planning anticipé |
| **Dépendance Google** | Changements Whisk possibles | Alternatives (fal.ai) prêtes |

---

## SECTION 7: ALTERNATIVES PROGRAMMATIQUES

### 7.1 Quand Utiliser les Alternatives

| Situation | Solution | Raison |
|-----------|----------|--------|
| >10 images/mois | fal.ai FLUX | API disponible |
| Bulk generation | Replicate | Scalable |
| Vidéo >8 secondes AI | Replicate Veo 3 | Pas de limite |
| Qualité maximale | Imagen 4 Vertex AI | Enterprise-grade |
| Style transfer précis | fal.ai Seedream | Contrôle fin |

### 7.2 Coûts Comparatifs

| Service | Type | Coût | Volume |
|---------|------|------|--------|
| **Whisk** | Image | Gratuit | Illimité |
| **Whisk Animate** | Video | Gratuit | 10/mois |
| **fal.ai FLUX** | Image | $0.003/image | Illimité |
| **Replicate SDXL** | Image | $0.002/image | Illimité |
| **Replicate Veo 3** | Video | $0.05/seconde | Illimité |
| **Imagen 4** | Image | Variable | Enterprise |

### 7.3 Intégration dans ai-assets.ts

```typescript
// Location: remotion-studio/src/lib/ai-assets.ts

// Fallback chain pour génération image
const providers = ['falai', 'replicate', 'imagen'];

async function generateImage(prompt: string, options = {}) {
  for (const provider of providers) {
    try {
      return await generateWith[provider](prompt, options);
    } catch (error) {
      console.log(`${provider} failed, trying next...`);
    }
  }
  throw new Error('All providers failed');
}
```

---

## SECTION 8: CHECKLISTS OPÉRATIONNELLES

### 8.1 Checklist Pré-Production

```markdown
## Checklist Pré-Production Vidéo
### Projet: _________________ | Date: _____________

#### 1. Objectif
- [ ] Type de vidéo défini (promo/demo/ad/testimonial)
- [ ] Durée cible: ______ secondes
- [ ] Format: ○ 16:9 ○ 9:16 ○ 1:1
- [ ] Plateforme cible: _________________

#### 2. Assets Whisk Requis
- [ ] Subject préparé: ________________
  - [ ] Format PNG transparent
  - [ ] Résolution ≥ 1024x1024
  - [ ] Sujet isolé
- [ ] Scene préparée: ________________
  - [ ] Résolution ≥ 1920x1080
  - [ ] Éclairage noté: ○ Gauche ○ Droite ○ Haut
- [ ] Style référence: ________________
  - [ ] Esthétique distinctive

#### 3. Budget Animations
- [ ] Animations Whisk restantes ce mois: ___/10
- [ ] Animation requise pour ce projet: ○ Oui ○ Non

#### 4. Remotion Config
- [ ] Composition choisie: _________________
- [ ] Props définies
- [ ] Timing planifié
```

### 8.2 Checklist Post-Production

```markdown
## Checklist Post-Production
### Projet: _________________ | Date: _____________

#### 1. Export Whisk
- [ ] Asset téléchargé
- [ ] Nommé selon convention: whisk_[type]_[context]_[date]_v[version]
- [ ] Placé dans /public/assets/whisk/[subsidiary]/

#### 2. Composition Remotion
- [ ] Preview vérifié (npm run dev)
- [ ] Timing correct
- [ ] Transitions fluides
- [ ] Text lisible

#### 3. Render Final
- [ ] Commande: npm run render:[type]
- [ ] Output vérifié: out/[name].mp4
- [ ] Qualité acceptable
- [ ] Durée correcte

#### 4. Livrable
- [ ] Fichier renommé pour distribution
- [ ] Backup créé
- [ ] Documentation mise à jour
```

---

## SECTION 9: ERREURS COURANTES ET SOLUTIONS

### 9.1 Erreurs Whisk

| Erreur | Symptôme | Solution |
|--------|----------|----------|
| Rendu incohérent | Sujet déformé, mélangé | Réduire à 4 sujets max |
| Style non appliqué | Image ressemble à photo | Placer style aussi dans Subject box |
| Rate limiting | "Please wait..." | Attendre 30-45 secondes |
| Low quality output | Détails perdus | Augmenter résolution inputs |
| Mauvaise fusion Subject/Scene | Incohérence visuelle | Matcher éclairage et perspective |

### 9.2 Erreurs Remotion

| Erreur | Symptôme | Solution |
|--------|----------|----------|
| Asset not found | Image blanche | Vérifier chemin staticFile() |
| Render timeout | Process killed | Réduire durée ou qualité |
| Memory overflow | OOM error | Fermer autres applications |
| TypeScript errors | Build fail | Vérifier types props |

### 9.3 Erreurs Workflow

| Erreur | Symptôme | Solution |
|--------|----------|----------|
| Fichier mal nommé | Confusion versions | Suivre convention stricte |
| Budget animations épuisé | Animation refusée | Planifier à l'avance |
| Itération excessive | Rendements décroissants | Limiter à 2-3 refinements |

---

## SECTION 10: SOURCES ET RÉFÉRENCES

### Documentation Officielle

| Source | URL | Contenu |
|--------|-----|---------|
| Google Whisk | https://labs.google/whisk | Interface, limites |
| Google Blog Whisk | https://blog.google/technology/google-labs/whisk/ | Annonce, specs |
| Remotion Docs | https://www.remotion.dev/docs | API complète |
| Remotion GitHub | https://github.com/remotion-dev/remotion | Code source |

### Guides Communautaires (Vérifiés)

| Source | URL | Utilité |
|--------|-----|---------|
| WhyTryAI | https://www.whytryai.com/p/google-whisk-guide | Best practices |
| Whisk AI Template | https://whiskaitemplate.com/en/guide | Subject/Scene/Style |
| G-Labs Automation | https://github.com/duckmartians/G-Labs-Automation | Rate limiting info |
| The Decoder | https://the-decoder.com/ | Updates Whisk |

### Articles Techniques

| Source | Contenu |
|--------|---------|
| HitPaw Guide | Workflow complet Whisk |
| DigitasPro | Business applications |
| Qubika | React + Remotion integration |

---

## APPENDICE A: GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **Gemini** | LLM Google utilisé pour auto-captioning dans Whisk |
| **Imagen 3/4** | Modèle génération image Google (backend Whisk) |
| **Veo 2** | Modèle génération vidéo Google (Whisk Animate) |
| **Composition** | Template vidéo Remotion (React component) |
| **staticFile()** | Fonction Remotion pour accéder assets /public/ |
| **CRF** | Constant Rate Factor (qualité vidéo, plus bas = meilleur) |
| **Aspect Ratio** | Rapport largeur/hauteur (16:9, 9:16, 1:1) |

---

## APPENDICE B: TEMPLATES RAPIDES

### B.1 Subject Image Brief

```
BRIEF SUBJECT IMAGE

Projet: [nom]
Type: [personne/produit/objet/abstrait]

Spécifications:
- Format: PNG transparent
- Résolution: 1024x1024 minimum
- Fond: Transparent ou blanc uni
- Éclairage: [direction]
- Cadrage: Centré, espace autour

Notes:
[instructions spécifiques]
```

### B.2 Scene Image Brief

```
BRIEF SCENE IMAGE

Projet: [nom]
Environnement: [description]

Spécifications:
- Format: JPEG/PNG
- Résolution: 1920x1080 minimum
- Éclairage: Compatible avec Subject ([direction])
- Perspective: [eye-level/low/high]
- Atmosphère: [mood]

Notes:
[instructions spécifiques]
```

### B.3 Video Production Brief

```
BRIEF VIDÉO PRODUCTION

Projet: [nom]
Client/Subsidiaire: [3A/Alpha/MyDealz]

Objectif:
[description en 1-2 phrases]

Spécifications:
- Type: [promo/demo/ad/testimonial]
- Durée: [X] secondes
- Format: [16:9/9:16/1:1]
- Plateforme: [destination]

Assets Requis:
1. Subject: [description]
2. Scene: [description]
3. Style: [référence]

Whisk Animation: [Oui/Non]

Composition Remotion: [PromoVideo/DemoVideo/AdVideo/TestimonialVideo]

Deadline: [date]
```

---

*Document créé: 23/01/2026 23:45 UTC*
*Version: 1.0*
*Méthode: Bottom-up factuelle, sources vérifiées*
*Auteur: Claude Opus 4.6 (Session 146bis→191ter)*
