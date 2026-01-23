# Remotion Video Generation Skill

> Create professional videos programmatically using React and Remotion

## Overview

This skill enables Claude Code to generate video content for 3A Automation using the Remotion framework. Videos are rendered locally as MP4 files.

## Project Location

```
/automations/remotion-studio/
```

## Available Compositions

| ID | Type | Duration | Aspect |
|----|------|----------|--------|
| `PromoVideo` | Agency showcase | 30s | 16:9 |
| `DemoVideo` | Product walkthrough | 60s | 16:9 |
| `AdVideo` | Social media ad | 15s | 9:16 |
| `AdVideo-Square` | Instagram ad | 15s | 1:1 |
| `TestimonialVideo` | Client quote | 45s | 16:9 |

## Core Commands

```bash
# Development (preview in browser)
cd automations/remotion-studio && npm run dev

# Render specific composition
npx remotion render PromoVideo out/promo.mp4
npx remotion render AdVideo out/ad.mp4 --props='{"headline":"Custom Text"}'

# Render with custom settings
npx remotion render PromoVideo out/promo.mp4 --codec=h264 --crf=18
```

## Component Architecture

### Compositions (Video Templates)
- `src/compositions/PromoVideo.tsx` - Full agency promo
- `src/compositions/AdVideo.tsx` - Short social ads
- `src/compositions/DemoVideo.tsx` - Product demos
- `src/compositions/TestimonialVideo.tsx` - Client testimonials

### Reusable Components
- `TitleSlide` - Animated title with subtitle
- `FeatureCard` - Feature showcase with icon
- `LogoReveal` - Animated logo entrance
- `CallToAction` - CTA with button
- `GradientBackground` - Animated gradient

## Remotion Fundamentals

### Frame-Based Animation
```tsx
const frame = useCurrentFrame();
const { fps, durationInFrames } = useVideoConfig();

// Animate opacity from 0 to 1 over 30 frames
const opacity = interpolate(
  frame,
  [0, 30],
  [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);
```

### Spring Physics
```tsx
const scale = spring({
  frame,
  fps,
  config: { damping: 200 },
});
```

### Sequencing
```tsx
<Sequence from={0} durationInFrames={90}>
  <IntroScene />
</Sequence>
<Sequence from={90} durationInFrames={120}>
  <MainContent />
</Sequence>
```

## AI Asset Integration

### Available Providers
| Provider | Use Case | API Key |
|----------|----------|---------|
| fal.ai FLUX | Background images | `FAL_API_KEY` |
| Replicate | Images + Video | `REPLICATE_API_TOKEN` |
| Imagen 4 | High-quality images | Vertex AI |

### Generate AI Image
```typescript
import { generateImage } from '../lib/ai-assets';

const { url } = await generateImage(
  'Futuristic tech dashboard, neon lights, dark theme',
  { width: 1920, height: 1080 }
);
```

### Google Whisk
**⚠️ NO API AVAILABLE** - Whisk is web-only at labs.google/whisk

For programmatic image generation, use:
- fal.ai FLUX (fast, high quality)
- Replicate SDXL (reliable fallback)
- Imagen 4 via Vertex AI (Google's API)

Existing Whisk assets: `/public/assets/whisk/`

## Best Practices

### DO
- Use `interpolate()` with `extrapolateLeft/Right: 'clamp'`
- Use `spring()` for natural motion
- Break videos into `<Sequence>` components
- Place static assets in `/public/`
- Use TypeScript for type safety

### DON'T
- Use `Math.random()` (not deterministic)
- Create monolithic composition files
- Hardcode pixel values (use relative sizing)
- Forget to set default props

## Timing Utilities

```typescript
import { secondsToFrames, createTiming } from '../utils/timing';

// Convert 5 seconds to frames at 30fps
const frames = secondsToFrames(5, 30); // 150

// Create timing object
const timing = createTiming(0, 5, 30);
// { from: 0, durationInFrames: 150 }
```

## Output Formats

| Platform | Resolution | Aspect | FPS |
|----------|------------|--------|-----|
| YouTube | 1920x1080 | 16:9 | 30 |
| Instagram Reels | 1080x1920 | 9:16 | 30 |
| TikTok | 1080x1920 | 9:16 | 30 |
| Instagram Post | 1080x1080 | 1:1 | 30 |
| Twitter/X | 1920x1080 | 16:9 | 30 |

## Troubleshooting

### "Cannot find module 'remotion'"
```bash
cd automations/remotion-studio && npm install
```

### Render fails with memory error
```bash
# Reduce concurrency
npx remotion render PromoVideo out/promo.mp4 --concurrency=2
```

### Assets not loading
- Ensure assets are in `/public/` folder
- Use `staticFile()` for local files
- Check file path case sensitivity
