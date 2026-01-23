# UI Validator Skill

## Metadata
- **provider**: Claude
- **version**: 1.0.0
- **created**: 2026-01-23
- **session**: 142

## Description
Validates UI/CSS compliance with 3A Automation Design System.
Prevents visual regression and branding inconsistencies.

## Capabilities

### 1. Design System Validation
```bash
node scripts/validate-design-system.cjs [--fix] [--ci]
```

Validates:
- CSS variables consistency
- Forbidden patterns (hardcoded colors, old classes)
- SVG icon colors (must use currentColor)
- Automation count (119) / Agent count (22)

### 2. Visual Regression Testing
```bash
node scripts/visual-regression.cjs --baseline  # Create baseline
node scripts/visual-regression.cjs --compare   # Compare current vs baseline
node scripts/visual-regression.cjs --update    # Update baseline
```

### 3. Stylelint Validation
```bash
npx stylelint "landing-page-hostinger/**/*.css"
```

## Design System Reference

Source of truth: `docs/DESIGN-SYSTEM.md`

### Required CSS Variables
```css
--primary: #4FBAF1
--accent: #10B981
--accent-purple: #8B5CF6
--bg-dark: #191E35
--text-light: #E4F4FC
--glass-bg: rgba(255, 255, 255, 0.03)
```

### Required Classes
- `section-title-ultra` (NOT section-title)
- `glass-panel`
- `cta-button-ultra`

### Forbidden Patterns
- Hardcoded SVG colors (use `currentColor`)
- `class="section-title"` (use `section-title-ultra`)
- Old CSS variable names (`--color-*`)

## Image Generation Workflow

### Google Whisk (Recommended for Concepts)
1. Access: https://labs.google/fx/tools/whisk
2. Upload reference images for subject/scene/style
3. Uses Imagen 4 + Gemini for generation
4. Export and optimize for web

### Existing Whisk Assets
```
/assets/whisk/
├── neural_cortex_bg.png      # Hero background
├── pricing_concept.png       # Pricing visuals
└── trust_thumbnail_growth.png # Trust section
```

### Vertex AI Imagen 4 (Programmatic)
For batch generation, use Vertex AI API:
```javascript
// See automations/agency/core/product-photos-resilient.cjs
const { ImageGenerationModel } = require('@google-cloud/aiplatform');
```

## Integration Points

### Pre-commit Hook
`.git/hooks/pre-commit` validates before each commit

### CI/CD
`.github/workflows/deploy-website.yml` validates before deployment

### MCP Tools
- `chrome-devtools` - Screenshots, debugging
- `playwright` - E2E visual testing
- `stitch` - Design-to-code generation

## Usage Examples

### Quick Validation
```bash
# Check for issues
node scripts/validate-design-system.cjs

# Auto-fix issues
node scripts/validate-design-system.cjs --fix
```

### Full Visual Regression Test
```bash
# 1. Create baseline (do once)
node scripts/visual-regression.cjs --baseline

# 2. After changes, compare
node scripts/visual-regression.cjs --compare

# 3. If changes are intentional, update baseline
node scripts/visual-regression.cjs --update
```

## Troubleshooting

### Pre-commit hook blocks commit
```bash
# Option 1: Fix the issue
node scripts/validate-design-system.cjs --fix

# Option 2: Skip (not recommended)
git commit --no-verify
```

### Visual regression fails
1. Check diff images in `tests/visual-diff/`
2. If changes are intentional: `--update`
3. If regression: fix the CSS/HTML
