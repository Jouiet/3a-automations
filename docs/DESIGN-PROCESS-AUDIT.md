# DESIGN PROCESS FORENSIC AUDIT
## Version: 1.0 | Date: 23/01/2026 | Session 142

---

## EXECUTIVE SUMMARY

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Automated Validation | 0% | 100% | Implemented |
| Pre-commit Blocking | No | Yes | Active |
| CI/CD Validation | No | Yes | Configured |
| Visual Regression | No | Available | Tool Ready |
| Design Documentation | Fragmented | Unified | DESIGN-SYSTEM.md |
| Stylelint Coverage | 0 | Full | 55→0 issues (FIXED Session 142) |

---

## 1. TOOLS AUDIT

### 1.1 validate-design-system.cjs
| Test | Result | Notes |
|------|--------|-------|
| Automation count (119) | PASS | No old "174" values found |
| Agent count (22) | PASS | Validated |
| Forbidden patterns | PASS | section-title-ultra enforced |
| SVG colors | PASS | currentColor used |
| CSS variables | PASS | All required vars present |

**Command**: `node scripts/validate-design-system.cjs [--fix] [--ci]`

### 1.2 Stylelint
| Config | Status | Notes |
|--------|--------|-------|
| stylelint-config-standard | Installed | v40.0.0 |
| stylelint-declaration-strict-value | Installed | v1.10.11 |
| postcss-html | Installed | For HTML inline styles |

**Issues Detected**: 0 (FIXED - was 55: color-named, hardcoded colors)

**Command**: `npx stylelint "landing-page-hostinger/*.css"`

### 1.3 Pre-commit Hook
| Check | Status |
|-------|--------|
| File exists | /.git/hooks/pre-commit |
| Executable | -rwxr-xr-x |
| Validation call | node scripts/validate-design-system.cjs --ci |
| Blocking | Exits 1 on failure |

### 1.4 Visual Regression (visual-regression.cjs)
| Feature | Status | Notes |
|---------|--------|-------|
| Playwright support | Configured | Primary method |
| Puppeteer fallback | Available | Secondary method |
| MCP integration | Documented | chrome-devtools instructions |
| Pages covered | 9 | Homepage, Pricing, Booking (FR/EN/Mobile) |
| Threshold | 5% | Configurable in CONFIG |

**Commands**:
- `node scripts/visual-regression.cjs --baseline` - Create baseline
- `node scripts/visual-regression.cjs --compare` - Compare vs baseline
- `node scripts/visual-regression.cjs --update` - Update baseline

### 1.5 MCP Tools
| MCP Server | Purpose | Status |
|------------|---------|--------|
| chrome-devtools | Screenshots, debugging, DOM inspection | Configured |
| playwright | E2E testing, visual regression | Configured |
| stitch | Design-to-code generation | Configured |

---

## 2. DESIGN SYSTEM ANALYSIS

### 2.1 CSS Variables (Source of Truth)
```css
/* Primary Colors */
--primary: #4FBAF1        /* Cyan - CTAs, accents */
--primary-dark: #2B6685   /* Teal - hover states */
--primary-light: #ADD4F0  /* Light blue - highlights */
--primary-ice: #E4F4FC    /* Ice white - text on dark */

/* Backgrounds */
--secondary: #191E35      /* Navy deep - main dark bg */
--bg-dark: #191E35        /* Alias */
--bg-navy: #1B2F54        /* Secondary dark */
--bg-teal: #254E70        /* Tertiary */

/* Accents */
--accent: #10B981         /* Success green */
--accent-purple: #8B5CF6  /* Purple accent */
--accent-orange: #F59E0B  /* Warning */
--error: #EF4444          /* Error red */

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.03)
--glass-border: rgba(255, 255, 255, 0.1)
--glass-highlight: rgba(255, 255, 255, 0.05)
```

### 2.2 Required Classes
| Class | Purpose | Enforced |
|-------|---------|----------|
| section-title-ultra | Section headings | Yes |
| glass-panel | Glassmorphism containers | Yes |
| cta-button-ultra | Primary CTAs | Yes |
| benefit-icon | Icon color inheritance | Yes |

### 2.3 Forbidden Patterns
| Pattern | Replacement | Validation |
|---------|-------------|------------|
| `class="section-title"` | `class="section-title-ultra"` | validate-design-system.cjs |
| `stroke="#4FBAF1"` | `stroke="currentColor"` | validate-design-system.cjs |
| `color: white` | `color: var(--text-light)` | stylelint |
| `--color-primary` | `--primary` | Manual |

---

## 3. IMAGE GENERATION WORKFLOW

### 3.1 Google Whisk (Recommended for Concepts)
| Feature | Value |
|---------|-------|
| URL | https://labs.google/fx/tools/whisk |
| Technology | Imagen 3 + Gemini + Veo 3 |
| Cost | Free |
| Output | PNG (high-res) |
| API | None (web UI only) |

**Workflow**:
1. Upload reference images (subject, scene, style)
2. Whisk generates variations using AI
3. Refine with text prompts
4. Export PNG
5. Convert to WebP for web

**Existing Whisk Assets**:
```
/assets/whisk/
├── neural_cortex_bg.png       # 787KB - Hero section
├── pricing_concept.png        # 595KB - Pricing page
└── trust_thumbnail_growth.png # 757KB - Trust section
```

### 3.2 Vertex AI Imagen 4 (Programmatic)
| Model | Use Case |
|-------|----------|
| imagen-4.0-generate-001 | Standard generation |
| imagen-4.0-fast-generate-001 | Quick iterations |
| imagen-4.0-ultra-generate-001 | Maximum quality |

**Endpoint**: `us-central1-aiplatform.googleapis.com`

---

## 4. OPTIMIZATION RECOMMENDATIONS

### 4.1 Based on Web Research

#### Playwright Best Practices (2026)
Source: [BrowserStack](https://www.browserstack.com/guide/playwright-best-practices)

- Use semantic selectors (getByRole, getByLabel) not CSS
- Run visual tests in consistent environment
- Keep baseline screenshots in version control
- Set viewport explicitly for consistency

#### Stylelint Best Practices
Source: [stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value)

- Use regex patterns for color properties: `/color$/`
- Allow CSS variables with: `/^var\\(--/`
- Ignore semantic keywords: `currentColor`, `inherit`, `transparent`

#### Chrome DevTools MCP
Source: [Google DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

- Use `take_snapshot` for DOM + CSS state
- Use `take_screenshot` for visual comparison
- Combine with `emulate` for device testing

### 4.2 Immediate Actions

| Priority | Action | Impact |
|----------|--------|--------|
| HIGH | Fix 60 stylelint color issues | Branding consistency |
| MEDIUM | Install Playwright globally | Enable visual regression |
| MEDIUM | Create baseline screenshots | Enable comparison |
| LOW | Add stylelint-no-indistinguishable-colors | Detect similar colors |

### 4.3 CSS Cleanup Commands
```bash
# Auto-fix named colors (manual review required)
npx stylelint "landing-page-hostinger/*.css" --fix

# Find all "white" colors
grep -rn "color: white" landing-page-hostinger/

# Find all "black" colors
grep -rn "color: black" landing-page-hostinger/
```

---

## 5. CI/CD INTEGRATION

### 5.1 GitHub Actions (.github/workflows/deploy-website.yml)
```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: node scripts/validate-design-system.cjs --ci
      - run: npx stylelint "landing-page-hostinger/**/*.css"

  deploy:
    needs: validate
    # ... deployment steps
```

### 5.2 Pre-commit Hook Flow
```
git commit
    │
    ▼
pre-commit hook
    │
    ├─► Check: landing-page-hostinger files staged?
    │       └── No → Skip validation
    │       └── Yes → Continue
    │
    ▼
validate-design-system.cjs --ci
    │
    ├─► PASS → Commit proceeds
    │
    └─► FAIL → Commit blocked
              └── Message: Run --fix or --no-verify
```

---

## 6. MONITORING CHECKLIST

### Daily (Automated)
- [ ] CI/CD validation on push
- [ ] Pre-commit hook on local commits

### Weekly (Manual)
- [ ] Review stylelint report
- [ ] Update baseline screenshots if UI changed intentionally
- [ ] Check for new CSS patterns not in design system

### Monthly
- [ ] Full visual regression test
- [ ] Update DESIGN-SYSTEM.md if new patterns added
- [ ] Review and update validation scripts

---

## 7. SOURCES

- [Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)
- [Playwright Snapshot Testing](https://www.browserstack.com/guide/playwright-snapshot-testing)
- [Playwright MCP Explained](https://www.testleaf.com/blog/playwright-mcp-ai-test-automation-2026/)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value)
- [Google Whisk](https://labs.google/fx/tools/whisk)
- [Imagen 4 API](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate)
- [Imagen 4 Gemini API](https://developers.googleblog.com/announcing-imagen-4-fast-and-imagen-4-family-generally-available-in-the-gemini-api/)

---

## CHANGELOG

| Date | Version | Change |
|------|---------|--------|
| 2026-01-23 | 1.0 | Initial forensic audit |
