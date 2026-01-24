# MÉTHODOLOGIE HERO ANIMATION v3.3 "Tech on the Shelf"

## 3A Automation - Standard de Production

> **UPDATE v3.3 (24/01/2026):** Fix auto-loop + 16:9 aspect ratio.
> **UPDATE v3.2 (24/01/2026):** Ajout incident CSP + piège #7.
> **UPDATE v3.1 (24/01/2026):** Ajout étape OBLIGATOIRE de synchronisation CSS.
> Sans ces étapes, le déploiement échoue ou l'animation ne fonctionne pas.

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
```

### Étape 3.5 : SYNCHRONISER VERSIONS CSS (OBLIGATOIRE)

**⚠️ CRITIQUE:** Ne PAS incrémenter manuellement `?v=XX` dans index.html.
Utiliser le script automatique qui synchronise TOUS les 70 fichiers HTML:

```bash
# Auto-fix: synchronise toutes les versions CSS
node scripts/design-auto-fix.cjs

# Vérifier que tout est cohérent
node scripts/design-auto-fix.cjs --check
```

**POURQUOI:** Le CI vérifie la cohérence des versions. Si index.html a v=53 mais les autres fichiers v=52, le déploiement ÉCHOUE.

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
# Vérifier derniers déploiements (doit être SUCCESS)
gh run list --limit 3

# Commit (SANS --no-verify pour que le pre-commit valide)
git add .
git commit -m "feat: vXX Hero Animation - [VIDEO_NAME]"
git push origin main

# Surveiller le déploiement
gh run watch
```

**⚠️ NE PAS UTILISER `--no-verify`** - Le pre-commit hook détecte les versions CSS inconsistantes.

Le workflow GitHub Actions se déclenchera automatiquement sur push vers `landing-page-hostinger/**`.

---

## ⚠️ PIÈGES COURANTS

1. **frameCount incorrect** : Doit être = durée × 30
2. **Versions CSS inconsistantes** : TOUJOURS exécuter `design-auto-fix.cjs` avant commit
3. **Workflow non déclenché** : Le commit doit modifier `landing-page-hostinger/**`
4. **Anciennes vidéos** : Supprimer les fichiers v51, v50, etc.
5. **`--no-verify` sur commit** : INTERDIT - bypass les validations critiques
6. **Déploiements précédents en échec** : Vérifier `gh run list` AVANT de commiter
7. **CSP bloque GSAP** : La CSP est dans les `<meta>` tags HTML, pas nginx.conf (voir Incident 2)

---

## 📊 INCIDENT SESSION 147 (24/01/2026)

**Symptôme:** Vidéo v52-luminous rendue mais site affiche ancienne version.

**Diagnostic forensique:**
```
| Élément | Local | Live | Status |
|---------|-------|------|--------|
| CSS version | v=53.0 | v=52.0 | ❌ Desync |
| Frames | 240 | 240 | ✅ |
| frameCount | 240 | 240 | ✅ |
```

**Cause racine:** 3 derniers déploiements ÉCHOUÉS car:
- `index.html` → v=53.0 (modifié manuellement)
- 66 autres fichiers → v=52.0 (non synchronisés)
- CI détecte: `❌ Multiple versions: 52.0, 53.0`

**Fix:** `node scripts/design-auto-fix.cjs` → synchronise TOUS les fichiers à v=54.0

**Leçon:** TOUJOURS utiliser le script auto-fix, JAMAIS modifier manuellement les versions CSS.

---

## 📊 INCIDENT 2 - CSP BLOQUE GSAP (24/01/2026)

**Symptôme:** Animation scroll bloquée sur frame 1, console affiche:
```
Loading the script 'cdnjs.cloudflare.com/gsap.min.js' violates CSP
[ScrollAnimation] GSAP or ScrollTrigger not found
```

**Diagnostic:**
```
| Élément | Valeur | Status |
|---------|--------|--------|
| CSP source | <meta> tag HTML (pas nginx.conf) | ⚠️ |
| script-src | manquait cdnjs.cloudflare.com | ❌ |
| Fichiers affectés | 53 HTML | ❌ |
```

**Cause racine:** La CSP était définie via `<meta http-equiv="Content-Security-Policy">` dans les fichiers HTML (ligne ~44), pas dans nginx.conf. Le domaine `https://cdnjs.cloudflare.com` manquait dans `script-src`.

**Fix:** Modification de 53 fichiers HTML:
```diff
- script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com;
+ script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdnjs.cloudflare.com;
```

**Leçon:** Lors de l'ajout de nouvelles librairies externes (CDN), vérifier la CSP dans les `<meta>` tags HTML, pas seulement nginx.conf.

---

## 📊 INCIDENT 3 - ASPECT RATIO 16:9 (24/01/2026)

**Symptôme:** Décalage visuel sur grands écrans - animation ne couvre pas tout le viewport.

**Diagnostic:**
```
| Élément | Avant | Après |
|---------|-------|-------|
| CSS canvas | height: 100vh | min-width: 177.78vh |
| Positioning | non centré | left: 50%; transform: translateX(-50%) |
```

**Cause racine:** Le canvas utilisait `height: 100vh` sans contrainte de largeur minimum, causant des bandes noires sur écrans larges.

**Fix:** Modification de `styles.css`:
```css
.hero-scroll-canvas {
  left: 50%;
  transform: translateX(-50%);
  min-width: 177.78vh; /* 16:9 ratio garantit couverture */
}
```

**Leçon:** Utiliser `min-width: 177.78vh` (100vh × 16/9) pour forcer le ratio 16:9 sur tous les écrans.

---

## 📊 INCIDENT 4 - AUTO-LOOP NE DÉMARRE PAS (24/01/2026)

**Symptôme:** Animation s'arrête quand l'utilisateur cesse de scroller au lieu de boucler.

**Diagnostic:**
```
| Version | Condition startAutoLoop | Comportement |
|---------|------------------------|--------------|
| v2.0 | if (isAutoLooping || scrollTriggerActive) | ❌ Bloqué dans hero |
| v2.2 | if (isAutoLooping) | ✅ Fonctionne partout |
```

**Cause racine:** Le code v2.0 avait deux guards empêchant l'auto-loop:
1. `startIdleChecker()` vérifiait `!scrollTriggerActive`
2. `startAutoLoop()` vérifiait `scrollTriggerActive`

Quand l'utilisateur était dans la section hero (viewport), `scrollTriggerActive = true` et l'auto-loop ne démarrait jamais.

**Fix:** scroll-animation.js v2.2:
- Retirer `!scrollTriggerActive` de `startIdleChecker()`
- Retirer `scrollTriggerActive` de `startAutoLoop()`
- Initialiser `lastScrollTime = Date.now()` au chargement

**Résultat:** Auto-loop démarre après 2s d'inactivité, même dans la section hero.

**Console de vérification:**
```
[ScrollAnimation] ScrollTrigger configured
[ScrollAnimation] Initialized with 240 frames
[ScrollAnimation] Auto-loop started  ✅
```

---

**Status** : ✅ PRODUCTION READY | **Version** : 3.3 | **Date** : 2026-01-24
