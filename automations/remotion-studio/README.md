# 3A Remotion Studio

> Programmatic video production using React + Remotion

## Quick Start

```bash
# Install dependencies
npm install

# Launch preview (opens browser)
npm run dev

# Render video
npm run render:promo
```

## Available Videos

| Command | Output | Duration | Format |
|---------|--------|----------|--------|
| `npm run render:promo` | `out/promo.mp4` | 30s | 1920x1080 |
| `npm run render:demo` | `out/demo.mp4` | 60s | 1920x1080 |
| `npm run render:ad` | `out/ad.mp4` | 15s | 1080x1920 |

## Custom Rendering

```bash
# With custom props
npx remotion render PromoVideo out/custom.mp4 --props='{"title":"Custom Title"}'

# Different quality
npx remotion render PromoVideo out/hq.mp4 --crf=15

# Portrait format
npx remotion render AdVideo out/tiktok.mp4
```

## Project Structure

```
remotion-studio/
├── src/
│   ├── compositions/     # Video templates
│   │   ├── PromoVideo.tsx
│   │   ├── DemoVideo.tsx
│   │   ├── AdVideo.tsx
│   │   └── TestimonialVideo.tsx
│   ├── components/       # Reusable pieces
│   │   ├── TitleSlide.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── LogoReveal.tsx
│   │   └── CallToAction.tsx
│   ├── lib/              # AI integrations
│   │   └── ai-assets.ts
│   └── utils/            # Helpers
│       └── timing.ts
├── public/               # Static assets
│   ├── logo.webp
│   └── assets/whisk/     # Whisk-generated images
└── out/                  # Rendered videos
```

## AI Asset Generation

The `ai-assets.ts` module connects to:
- **fal.ai FLUX** - Fast image generation
- **Replicate** - Images + Video (Veo 3)

```typescript
import { generateImage } from './lib/ai-assets';

const { url } = await generateImage('Futuristic dashboard');
```

## Environment Variables

```bash
# Required for AI generation (optional for basic rendering)
FAL_API_KEY=your_key
REPLICATE_API_TOKEN=your_token
```

## Claude Code Integration

Use "vibe coding" to create videos:

```
Claude, create a 15-second ad video with:
- Headline: "Automate Your Business"
- CTA: "Start Free Trial"
- Use the neural_cortex_bg.png as background
```

See `.claude/skills/remotion-video/SKILL.md` for full documentation.

## Notes

- **Google Whisk**: NO API available. Use existing assets in `/public/assets/whisk/`
- **Rendering**: Videos render locally via FFmpeg (free, no API costs)
- **License**: Remotion requires a license for companies with 3+ employees
