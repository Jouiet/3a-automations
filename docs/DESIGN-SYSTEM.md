# 3A AUTOMATION - DESIGN SYSTEM
## Version: 2.0 | Updated: 23/01/2026 | Session 142
## Merged from: branding.md + styles.css (Best of Both Worlds)

> **Ce document est la SOURCE DE VÉRITÉ pour tout design 3A Automation.**
> Validé automatiquement par `scripts/validate-design-system.cjs`

---

## 1. CSS VARIABLES (AUTHORITATIVE)

```css
:root {
  /* ═══════════════════════════════════════════════════════════════════════
     PRIMARY COLORS (from logo gradient)
     ═══════════════════════════════════════════════════════════════════════ */
  --primary: #4FBAF1;           /* Cyan Primary - CTAs, accents */
  --primary-dark: #2B6685;      /* Teal Blue - hover states */
  --primary-light: #ADD4F0;     /* Light Blue - highlights */
  --primary-ice: #E4F4FC;       /* Ice White - text on dark */

  /* ═══════════════════════════════════════════════════════════════════════
     BACKGROUND COLORS (from logo background)
     ═══════════════════════════════════════════════════════════════════════ */
  --secondary: #191E35;         /* Navy Deep - main dark bg */
  --bg-dark: #191E35;           /* Alias for secondary */
  --bg-navy: #1B2F54;           /* Navy Blue - secondary dark */
  --bg-teal: #254E70;           /* Dark Teal - tertiary */
  --bg-light: #f8fafc;          /* Light mode bg */
  --bg-white: #ffffff;          /* Pure white */

  /* ═══════════════════════════════════════════════════════════════════════
     ACCENT COLORS (semantic)
     ═══════════════════════════════════════════════════════════════════════ */
  --accent: #10B981;            /* Success green */
  --accent-purple: #8B5CF6;     /* Purple accent */
  --accent-orange: #F59E0B;     /* Warning/Orange */
  --error: #EF4444;             /* Error red */

  /* ═══════════════════════════════════════════════════════════════════════
     TEXT COLORS
     ═══════════════════════════════════════════════════════════════════════ */
  --text-primary: #191E35;      /* Navy Deep - for light bg */
  --text-secondary: #8BA3B9;    /* Blue Gray - IMPROVED contrast */
  --text-muted: #4E4962;        /* Muted Purple */
  --text-light: #E4F4FC;        /* Ice White - for dark bg */

  /* ═══════════════════════════════════════════════════════════════════════
     BORDERS
     ═══════════════════════════════════════════════════════════════════════ */
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --border-dark: rgba(79, 186, 241, 0.2);

  /* ═══════════════════════════════════════════════════════════════════════
     GLASSMORPHISM (IMPLEMENTATION IMPROVEMENT)
     ═══════════════════════════════════════════════════════════════════════ */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-highlight: rgba(255, 255, 255, 0.05);
  --glass-backdrop: blur(20px);
  --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);

  /* ═══════════════════════════════════════════════════════════════════════
     GRADIENTS
     ═══════════════════════════════════════════════════════════════════════ */
  --gradient-primary: linear-gradient(180deg, #E4F4FC 0%, #ADD4F0 30%, #4FBAF1 100%);
  --gradient-bg-dark: linear-gradient(135deg, #191E35 0%, #1B2F54 50%, #254E70 100%);
  --gradient-cyber: linear-gradient(135deg, #4FBAF1 0%, #2B6685 50%, #10B981 100%);

  /* ═══════════════════════════════════════════════════════════════════════
     SHADOWS
     ═══════════════════════════════════════════════════════════════════════ */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-glow: 0 0 40px rgba(79, 186, 241, 0.3);
  --shadow-glow-strong: 0 0 60px rgba(79, 186, 241, 0.5);

  /* ═══════════════════════════════════════════════════════════════════════
     TYPOGRAPHY
     ═══════════════════════════════════════════════════════════════════════ */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-weight-bold: 800;

  /* ═══════════════════════════════════════════════════════════════════════
     SPACING
     ═══════════════════════════════════════════════════════════════════════ */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;
  --spacing-4xl: 6rem;

  /* ═══════════════════════════════════════════════════════════════════════
     BORDER RADIUS
     ═══════════════════════════════════════════════════════════════════════ */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;
  --radius-full: 9999px;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --primary: #00BFFF;
    --text-secondary: #CCCCCC;
    --border-dark: rgba(255, 255, 255, 0.5);
  }
}
```

---

## 2. REQUIRED CSS CLASSES

### Section Headers (MANDATORY)
```css
.section-title-ultra { /* USE THIS - NOT section-title */ }
.section-header-ultra { }
.section-tag { }
.section-desc-ultra { }
```

### Cards
```css
.glass-panel { /* Glassmorphism effect */ }
.feature-card-ultra { }
.squad-card { }
.benefit-card { }
.testimonial-card { }
```

### Buttons
```css
.cta-button-ultra { /* Primary CTA */ }
.btn-nav { }
.btn-squad { }
.btn-secondary-ultra { }
```

### Icons
```css
/* ALWAYS use stroke="currentColor" - NEVER hardcode colors */
<svg stroke="currentColor" ...>

/* CSS controls color via parent */
.benefit-icon { color: var(--primary); }
.benefit-card:nth-child(2) .benefit-icon { color: var(--accent); }
.benefit-card:nth-child(3) .benefit-icon { color: var(--accent-purple); }
```

---

## 3. FORBIDDEN PATTERNS

| Pattern | Reason | Fix |
|---------|--------|-----|
| `class="section-title"` | Old naming | Use `section-title-ultra` |
| `stroke="#4FBAF1"` | Hardcoded color | Use `stroke="currentColor"` |
| `--color-primary` | Old naming | Use `--primary` |
| Inline styles for colors | Not maintainable | Use CSS variables |

---

## 4. VALIDATION RULES

These rules are enforced by `validate-design-system.cjs`:

1. **No hardcoded hex colors in SVG stroke/fill** (except brand logos)
2. **section-title-ultra** must be used, not section-title
3. **All CSS variables** must match this document
4. **Automations count** must be 119 (from registry)
5. **Agents count** must be 22

---

## 5. ASSETS

### Generated by Google Whisk
- `/assets/whisk/neural_cortex_bg.png` - Hero background
- `/assets/whisk/pricing_concept.png` - Pricing page
- `/assets/whisk/trust_thumbnail_growth.png` - Trust section

### Logo
- `/logo.webp` - Main logo
- `/logo.png` - Fallback
- `/favicon.ico` - Browser icon

---

## 6. TOOLS INTEGRATION

| Tool | Purpose | Config |
|------|---------|--------|
| **chrome-devtools MCP** | Visual testing | `.mcp.json` |
| **playwright MCP** | E2E visual regression | To configure |
| **validate-design-system.cjs** | CSS/HTML validation | CI/CD |

---

## CHANGELOG

| Date | Version | Change |
|------|---------|--------|
| 2025-12-17 | 1.0 | Initial branding.md |
| 2026-01-23 | 2.0 | Merged with styles.css improvements, added validation |
