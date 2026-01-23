# Prompts Optimisés - Hero Architecture Video
## 3A Automation Homepage

> **Date**: 23/01/2026 | **Session**: 146bis
> **Concept**: "L'IA propose. Le code limite. L'humain décide."
> **Palette**: Bleu #27CCFF | Violet #4A27CC | Dark #0a0a1a

---

## 1. PROMPT WHISK VEO 3 - Animation 8 secondes

### Prompt Principal (PRÊT À COPIER)

```
Cinematic 8-second animation. Fast dolly-in through chaotic swirling data particles (electric blue #27CCFF, deep violet #4A27CC) with glassmorphism panels. Camera slows as particles hit translucent code barriers, getting filtered and organized. A glowing human hand touches a frosted glass interface, approving the flow. Camera pulls back to reveal harmonious data streams converging into holographic stats "121 | 22 | 100%" floating in space. Volumetric lighting, lens flares, futuristic atmosphere. 16:9, smooth transitions.
```

### Instructions Whisk
1. Aller sur labs.google/whisk
2. Aspect Ratio: 16:9
3. Cliquer "Animate"
4. Coller le prompt ci-dessus
5. Télécharger → `whisk_hero_architecture_20260123_v1.mp4`

---

## 2. PROMPTS IMAGEN 4 - Images Statiques

### 2.1 Background Neural Network

```
A vast, complex, and infinitely deep neural network, rendered in exquisite glassmorphism style. Thousands of interconnected, glowing nodes pulse with luminous energy, sending intricate data streams as ethereal light trails through translucent, frosted glass panels. These overlapping panels create profound depth and subtle refractions. Dominant color palette: vibrant electric blue (#27CCFF) and deep royal violet (#4A27CC), with subtle gradients and iridescent shifts. Volumetric light rays pierce through the network, highlighting its intricate structure. Ultra-futuristic and high-tech atmosphere. Cinematic, ultra-high detail, 16:9 aspect ratio, 4K resolution. Wide-angle shot, slightly from above, emphasizing scale and complexity.
```

**Output**: `whisk_neural_bg_20260123_v1.png`

### 2.2 Layer 1 - "L'IA Propose"

```
A luminous, abstract AI core, represented as a sophisticated geometric structure with intricate glassmorphism layers and iridescent chrome accents, positioned centrally. This core pulses with internal vibrant energy, primarily in electric blue (#27CCFF) and deep violet (#4A27CC). From its center, a multitude of dynamic, multi-colored light particles, holographic projections, and ethereal organic data tendrils elegantly stream outwards and upwards. These elements form complex, branching patterns visualizing suggestions, creative ideas, and unlimited possibilities. Background is softly blurred glassmorphism neural network. Cinematic, ultra-sharp focus, 16:9 aspect ratio, 4K resolution. Medium close-up shot, slightly from below, emphasizing power and potential. Volumetric light rays emanate from the core.
```

**Output**: `whisk_ai_proposes_20260123_v1.png`

### 2.3 Layer 2 - "Le Code Limite"

```
A powerful and structured scene dominated by sharp, glowing digital barriers and intricate transparent code structures, all rendered in precise glassmorphism style. These barriers manifest as interlocking planes of frosted glass and luminous energy grids, crisscrossing and forming precise unyielding boundaries. Data streams depicted as flowing light particles (blue #27CCFF and violet #4A27CC) attempt to traverse these obstacles, being fragmenting, redirected, and filtered. Some blocked (red glow), others pass through (green approval). Clean geometric lines and precise shapes underscore the strict nature of deterministic rules. Volumetric lighting creates refraction and diffraction effects through glass layers. 16:9, 4K, cinematic, with pronounced depth of field.
```

**Output**: `whisk_code_limits_20260123_v1.png`

### 2.4 Layer 3 - "L'Humain Décide"

```
A futuristic and clean user interface where human intervention is highlighted as an act of power and direction. A central frosted glass panel, slightly curved, acts as a dynamic touchscreen. A stylized, luminous fingerprint or abstract glowing hand (blue #27CCFF and violet #4A27CC) is interacting with this interface. Around the interaction point, validation graphic elements appear - stylized checkmark icons, luminous progress bars, an authorized flow that opens and propagates through other transparent glass panels. The digital landscape in background reacts and reorganizes following this action, barriers dissolving, paths illuminating and unlocking. Soft diffuse light emanates from the interface with more intense vibrant halo around interaction point. Glassmorphism dominant, 16:9, 4K, cinematic.
```

**Output**: `whisk_human_decides_20260123_v1.png`

### 2.5 Stats Holographique "121 | 22 | 100%"

```
A sleek holographic display floating in dark space, showing three glowing statistics in a horizontal row: "121", "22", and "100%" separated by subtle vertical light dividers. The numbers are rendered in electric blue (#27CCFF) with soft glow and light trails. Below each number, small labels in white: "Workflows", "Agents L5", "Factuel". The entire display is encased in a subtle glassmorphism panel with frosted edges. Background is deep dark space (#0a0a1a) with faint neural network patterns. Volumetric lighting, subtle lens flares, clean futuristic typography. 16:9, 4K, ultra-sharp focus on the statistics.
```

**Output**: `whisk_stats_hologram_20260123_v1.png`

---

## 3. WORKFLOW COMPLET

### Phase 1: Génération Assets (Whisk + Imagen 4)

| # | Asset | Outil | Prompt Section | Output |
|---|-------|-------|----------------|--------|
| 1 | Background animé | Whisk Veo 3 | Section 1 | `hero_architecture_bg.mp4` |
| 2 | Neural BG static | Imagen 4 | Section 2.1 | `neural_bg.png` |
| 3 | AI Proposes | Imagen 4 | Section 2.2 | `ai_proposes.png` |
| 4 | Code Limits | Imagen 4 | Section 2.3 | `code_limits.png` |
| 5 | Human Decides | Imagen 4 | Section 2.4 | `human_decides.png` |
| 6 | Stats Hologram | Imagen 4 | Section 2.5 | `stats_hologram.png` |

### Phase 2: Composition Remotion

```bash
# Après avoir placé les assets dans public/assets/whisk/

# Preview
cd automations/remotion-studio
npm run dev
# Ouvrir localhost:3000 → Sélectionner "HeroArchitecture"

# Render final
npx remotion render HeroArchitecture out/hero-architecture.mp4

# Version loop 8s
npx remotion render HeroArchitecture-Loop out/hero-architecture-loop.mp4
```

### Phase 3: Intégration Homepage

```html
<!-- Dans index.html hero section -->
<div class="hero-cinematic-bg">
  <video autoplay muted loop playsinline>
    <source src="assets/video/hero-architecture-loop.mp4" type="video/mp4">
  </video>
  <div class="cinematic-overlay"></div>
</div>
```

---

## 4. CHECKLIST PRÉ-GÉNÉRATION

```markdown
## Checklist Hero Architecture Video

### Assets Whisk (Budget: 100/mois)
- [ ] Animation 8s principale (1 crédit)
- [ ] Variantes si nécessaire (garder marge)

### Assets Imagen 4
- [ ] Neural background
- [ ] AI proposes visual
- [ ] Code limits visual
- [ ] Human decides visual
- [ ] Stats hologram

### Remotion
- [ ] Composition créée: HeroArchitecture.tsx ✅
- [ ] Enregistrée dans Root.tsx ✅
- [ ] Preview testé
- [ ] Render final exporté

### Intégration
- [ ] Video placée dans landing-page-hostinger/assets/video/
- [ ] HTML modifié pour video background
- [ ] Fallback image configuré
- [ ] Test mobile/responsive
```

---

## 5. SOURCES

- [Google DeepMind Veo Prompt Guide](https://deepmind.google/models/veo/prompt-guide/)
- [Imagen 4 API Documentation](https://ai.google.dev/gemini-api/docs/imagen)
- [Mastering Veo 3 - Medium](https://medium.com/@miguelivanov/mastering-veo-3-an-expert-guide-to-optimal-prompt-structure-and-cinematic-camera-control-693d01ae9f8b)
- [Veo 3 Prompt Examples - Powtoon](https://www.powtoon.com/blog/veo-3-video-prompt-examples/)

---

*Document créé: 23/01/2026 | Méthode: Gemini prompt engineering + Web research*
