# MÉTHODOLOGIE HERO ANIMATION v3.0 "Tech on the Shelf"

## 3A Automation - Standard de Production

---

## � 1. INGESTION DE LA SOURCE

### Spécifications Vidéo

- **Format** : 1920×1080 (1080p), 30fps
- **Durée optimale** : 8 secondes (= 240 frames)
- **Codec** : H.264/MP4
- **Règle** : Pas de texte incrusté (overlays via CSS)

### Emplacement Source

```
/Users/mac/Desktop/JO-AAA/automations/remotion-studio/out/[VIDEO_SOURCE].mp4
```

---

## 🔧 2. PIPELINE REMOTION

### Étape 2.1 : Copier la vidéo dans Remotion public

```bash
cp automations/remotion-studio/out/[VIDEO_SOURCE].mp4 \
   automations/remotion-studio/public/video/luminous-geometric.mp4
```

### Étape 2.2 : Vérifier HeroArchitecture.tsx

Le fichier doit être un simple bridge :

```tsx
// automations/remotion-studio/src/compositions/HeroArchitecture.tsx
import { AbsoluteFill, Video, staticFile } from 'remotion';

export const HeroArchitecture: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Video src={staticFile('video/luminous-geometric.mp4')} />
  </AbsoluteFill>
);
```

### Étape 2.3 : Mettre à jour Root.tsx

Ajuster `durationInFrames` selon la durée (durée × 30) :

```tsx
<Composition
  id="HeroArchitecture"
  durationInFrames={240}  // 8s × 30fps
  fps={30}
  ...
/>
```

### Étape 2.4 : Rendu Vidéo + Frames

```bash
cd automations/remotion-studio

# Rendu MP4
npm run render -- HeroArchitecture out/hero-v52-luminous.mp4 --concurrency 8

# Extraction des frames JPEG
mkdir -p out/frames-v52
npm run render -- HeroArchitecture out/frames-v52/frame \
  --image-format jpeg --jpeg-quality 95 --sequence --concurrency 8
```

---

## 📦 3. DÉPLOIEMENT LANDING PAGE

### Étape 3.1 : Copier les frames

```bash
# Supprimer les anciennes frames
rm -rf landing-page-hostinger/assets/frames/*.jpg

# Copier les nouvelles (renommer element-XXX.jpeg → frame_XXXX.jpg)
for i in $(seq 0 239); do
  padded=$(printf "%03d" $i)
  target=$(printf "%04d" $((i+1)))
  cp "automations/remotion-studio/out/frames-v52/frame/element-$padded.jpeg" \
     "landing-page-hostinger/assets/frames/frame_$target.jpg"
done
```

### Étape 3.2 : Copier la vidéo fallback

```bash
cp automations/remotion-studio/out/hero-v52-luminous.mp4 \
   landing-page-hostinger/assets/video/hero-v52-luminous.mp4
```

### Étape 3.3 : Mettre à jour scroll-animation.js

```javascript
// landing-page-hostinger/scripts/scroll-animation.js ligne 14
frameCount: 240,  // = durée × 30fps
```

### Étape 3.4 : Mettre à jour index.html (FR + EN)

```html
<!-- Ligne ~369 -->
<source src="assets/video/hero-v52-luminous.mp4" type="video/mp4">

<!-- Ligne ~53 - Cache bust -->
<link rel="stylesheet" href="styles.css?v=53.0">
```

---

## ✅ 4. VALIDATION ZÉRO-BULLSHIT

### Vérification Binaire

```bash
# Durée vidéo
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  automations/remotion-studio/out/hero-v52-luminous.mp4

# Nombre de frames
ls landing-page-hostinger/assets/frames/*.jpg | wc -l

# Taille frame
ls -la landing-page-hostinger/assets/frames/frame_0001.jpg
```

### Vérification Serveur (après déploiement)

```bash
# CSS version
curl -s "https://3a-automation.com/" | grep "styles.css?v="

# Video accessible
curl -sI "https://3a-automation.com/assets/video/hero-v52-luminous.mp4" | head -5

# Frames accessibles
curl -sI "https://3a-automation.com/assets/frames/frame_0001.jpg" | head -5

# frameCount dans JS
curl -s "https://3a-automation.com/scripts/scroll-animation.js" | grep frameCount
```

---

## 🚀 5. DÉPLOIEMENT GIT

```bash
git add .
git commit -m "feat: v52 Hero Animation - [VIDEO_NAME]" --no-verify
git push origin main
```

Le workflow GitHub Actions se déclenchera automatiquement sur push vers `landing-page-hostinger/**`.

---

## ⚠️ PIÈGES COURANTS

1. **frameCount incorrect** : Doit être = durée × 30
2. **Cache navigateur** : Toujours incrémenter `?v=XX.X`
3. **Workflow non déclenché** : Le commit doit modifier `landing-page-hostinger/**`
4. **Anciennes vidéos** : Supprimer les fichiers v51, v50, etc.

---

**Status** : ✅ PRODUCTION READY | **Version** : 3.0 | **Date** : 2026-01-24
