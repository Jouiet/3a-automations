# MÉTHODOLOGIE : GÉNÉRATION DE HERO ANIMÉ (v2.1) 🚀

Ce document définit le standard technique de 3A Automation pour transformer une vidéo binaire en une animation de scroll "Apple-Style" ultra-fluide.

---

## 🏛️ Architecture du Système

L'automatisation repose sur le découplage entre le **flux binaire** (vidéo fallback) et le **flux séquentiel** (frames JPEG sur canvas).

### 1. Ingestion de la Source

- **Format** : 1080p (1920x1080), 30fps.
- **Optimisation** : Pas de texte incrusté ( overlays dynamiques via HTML/CSS préférés).
- **Règle d'or** : 8 secondes est la durée optimale pour le web (équilibre poids/durée).

### 2. Pipeline de Rendu (Remotion Bridge)

Nous utilisons Remotion non pas pour composer, mais comme un **moteur d'extraction déterministe**.

- **Bridge TSX** : Une composition `<Video />` simple pointant sur l'asset.
- **Extraction séquentielle** :

  ```bash
  npm run render -- HeroArchitecture out/frames/frame_ --image-format jpeg --sequence
  ```

- **Qualité** : 95% JPEG (meilleur compromis fluidité/artefacts).

### 3. Couche d'Intégration (Canvas Engine)

Le moteur de scroll sur la landing page synchronise le `scrollY` avec l'index des frames :

- **Nombre de frames** : Durée (s) × 30.
- **Config JS** :

  ```javascript
  const heroConfig = {
    totalFrames: 240, // Pour 8 secondes
    imagePath: 'assets/frames/frame_',
    imageExtension: 'jpg'
  };
  ```

---

## 🛡️ Protocole de Validation "Zéro-Bullshit"

Chaque déploiement doit être vérifié par audit binaire :

1. **Vérification de Durée** : `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 asset.mp4`
2. **Audit de Séquence** : Vérification manuelle de la `frame_0150.jpg` pour détecter les résidus de rendu.
3. **Cache-Bust** : Incrémentation systématique du flag `?v=XX.X` dans le HTML.

---

## shelf Status: **PRODUCTION READY** ✅

Cette méthode est désormais un asset standard de l'étagère technologique 3A Automation.
