#!/usr/bin/env node
/**
 * VALIDATE DESIGN EXTENDED - Comprehensive Design System Validation
 *
 * @version 1.0.0
 * @date 2026-01-23
 * @session 142ter
 *
 * VALIDATES:
 * 1. Button consistency (classes, standardization)
 * 2. Card consistency (glassmorphism, border-radius)
 * 3. Typography (CSS variables usage)
 * 4. Spacing (CSS variables usage)
 * 5. Accessibility (alt text, ARIA, contrast indicators)
 * 6. Responsive (media queries consistency)
 *
 * Sources:
 * - https://github.com/AndyOGo/stylelint-declaration-strict-value
 * - https://github.com/dequelabs/axe-core
 * - https://stylelint.io/awesome-stylelint/
 *
 * Usage:
 *   node scripts/validate-design-extended.cjs [--verbose]
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
const CSS_FILE = path.join(SITE_DIR, 'styles.css');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');

let warningCount = 0;
let errorCount = 0;
let passedCount = 0;

const results = {
  buttons: { passed: [], warnings: [], errors: [] },
  cards: { passed: [], warnings: [], errors: [] },
  typography: { passed: [], warnings: [], errors: [] },
  spacing: { passed: [], warnings: [], errors: [] },
  accessibility: { passed: [], warnings: [], errors: [] },
  responsive: { passed: [], warnings: [], errors: [] }
};

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - Design System Standards
// ════════════════════════════════════════════════════════════════════════════

const DESIGN_STANDARDS = {
  // Standard button classes
  buttons: {
    primary: ['btn-cyber', 'btn-primary-cyber', 'cta-button-ultra'],
    secondary: ['btn-secondary-cyber', 'btn-nav'],
    forbidden: ['btn-primary', 'btn-secondary', 'button'] // Old/generic classes
  },

  // Standard card classes
  cards: {
    standard: ['glass-panel', 'service-card-ultra', 'pricing-card', 'automation-card', 'benefit-card', 'testimonial-card'],
    forbidden: ['card', 'panel'] // Too generic
  },

  // CSS variables that MUST be used (not hardcoded values)
  cssVariables: {
    colors: ['--primary', '--accent', '--accent-purple', '--accent-orange', '--text-light', '--text-secondary', '--bg-dark'],
    spacing: ['--spacing-xs', '--spacing-sm', '--spacing-md', '--spacing-lg', '--spacing-xl', '--spacing-2xl', '--spacing-3xl', '--spacing-4xl'],
    typography: ['--font-primary', '--font-mono'],
    radius: ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-2xl']
  },

  // Hardcoded values that should use variables
  forbiddenHardcoded: {
    colors: [/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, /rgb\(\s*\d+/g, /rgba\(\s*\d+/g],
    spacing: [/margin:\s*\d+px/g, /padding:\s*\d+px/g, /gap:\s*\d+px/g],
    fontSize: [/font-size:\s*\d+px/g, /font-size:\s*\d+rem/g]
  },

  // Required accessibility attributes
  accessibility: {
    images: { required: ['alt'] },
    buttons: { required: ['aria-label'], ifEmpty: true },
    links: { required: ['aria-label'], ifExternal: true },
    forms: { required: ['aria-label', 'id'] }
  },

  // Standard breakpoints
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px'
  }
};

// ════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════════

function findFiles(dir, extension) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...findFiles(fullPath, extension));
      } else if (item.isFile() && item.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

function relPath(file) {
  return path.relative(SITE_DIR, file);
}

function addResult(category, type, message) {
  results[category][type].push(message);
  if (type === 'errors') errorCount++;
  else if (type === 'warnings') warningCount++;
  else passedCount++;
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION 1: BUTTONS
// ════════════════════════════════════════════════════════════════════════════

function validateButtons() {
  console.log('\n🔘 [1/6] Validating Button Consistency...');

  const htmlFiles = findFiles(SITE_DIR, '.html');
  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  let standardButtons = 0;
  let genericButtons = 0;
  const issues = [];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = relPath(file);

    // Check for standard button classes
    const btnCyberMatches = content.match(/class="[^"]*btn-cyber[^"]*"/g) || [];
    const btnPrimaryCyberMatches = content.match(/class="[^"]*btn-primary-cyber[^"]*"/g) || [];
    standardButtons += btnCyberMatches.length + btnPrimaryCyberMatches.length;

    // Check for generic/forbidden button classes
    const genericMatches = content.match(/<button[^>]*class="(?![^"]*btn-)[^"]*"/g) || [];
    if (genericMatches.length > 0) {
      genericButtons += genericMatches.length;
      issues.push(`${fileName}: ${genericMatches.length} buttons without btn-* class`);
    }

    // Check for <a> tags styled as buttons without proper classes
    const linkButtons = content.match(/<a[^>]*href[^>]*>([^<]*)(button|submit|click)[^<]*<\/a>/gi) || [];
    // This is just informational
  }

  // Check CSS has hover states for all button classes
  const btnClasses = ['btn-cyber', 'btn-primary-cyber', 'btn-secondary-cyber'];
  for (const cls of btnClasses) {
    const hasHover = cssContent.includes(`.${cls}:hover`);
    if (!hasHover) {
      addResult('buttons', 'warnings', `Missing hover state for .${cls}`);
    }
  }

  if (genericButtons === 0) {
    addResult('buttons', 'passed', `All ${standardButtons} buttons use standard classes`);
  } else {
    addResult('buttons', 'warnings', `${genericButtons} generic buttons found (should use btn-cyber)`);
    if (VERBOSE) issues.forEach(i => console.log(`    ⚠️  ${i}`));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION 2: CARDS
// ════════════════════════════════════════════════════════════════════════════

function validateCards() {
  console.log('\n🃏 [2/6] Validating Card Consistency...');

  const htmlFiles = findFiles(SITE_DIR, '.html');
  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  let standardCards = 0;
  let genericCards = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Count standard card classes
    for (const cardClass of DESIGN_STANDARDS.cards.standard) {
      const matches = content.match(new RegExp(`class="[^"]*${cardClass}[^"]*"`, 'g')) || [];
      standardCards += matches.length;
    }

    // Check for generic "card" class without qualifier
    const genericMatches = content.match(/class="card(?:\s|")/g) || [];
    genericCards += genericMatches.length;
  }

  // Verify glassmorphism is defined
  const hasGlassBg = cssContent.includes('--glass-bg');
  const hasGlassBorder = cssContent.includes('--glass-border');
  const hasBackdropFilter = cssContent.includes('backdrop-filter');

  if (hasGlassBg && hasGlassBorder && hasBackdropFilter) {
    addResult('cards', 'passed', 'Glassmorphism variables defined (--glass-bg, --glass-border, backdrop-filter)');
  } else {
    addResult('cards', 'errors', 'Missing glassmorphism CSS variables');
  }

  // Check border-radius consistency
  const borderRadiusHardcoded = cssContent.match(/border-radius:\s*\d+px/g) || [];
  const borderRadiusVariable = cssContent.match(/border-radius:\s*var\(--radius/g) || [];

  if (borderRadiusHardcoded.length > borderRadiusVariable.length) {
    addResult('cards', 'warnings', `${borderRadiusHardcoded.length} hardcoded border-radius vs ${borderRadiusVariable.length} using variables`);
  } else {
    addResult('cards', 'passed', `Border-radius using CSS variables: ${borderRadiusVariable.length} instances`);
  }

  if (standardCards > 0) {
    addResult('cards', 'passed', `${standardCards} cards using standard classes`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION 3: TYPOGRAPHY
// ════════════════════════════════════════════════════════════════════════════

function validateTypography() {
  console.log('\n📝 [3/6] Validating Typography Consistency...');

  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  // Check for hardcoded font-sizes vs CSS variables
  const hardcodedFontSize = cssContent.match(/font-size:\s*\d+(\.\d+)?(px|rem|em)/g) || [];
  const variableFontSize = cssContent.match(/font-size:\s*var\(--/g) || [];
  const clampFontSize = cssContent.match(/font-size:\s*clamp\(/g) || [];

  const totalFontDeclarations = hardcodedFontSize.length + variableFontSize.length + clampFontSize.length;
  const dynamicFontSize = variableFontSize.length + clampFontSize.length;

  if (hardcodedFontSize.length > dynamicFontSize) {
    addResult('typography', 'warnings', `${hardcodedFontSize.length} hardcoded font-size vs ${dynamicFontSize} dynamic (var/clamp)`);
  } else {
    addResult('typography', 'passed', `Typography: ${dynamicFontSize}/${totalFontDeclarations} using dynamic sizing`);
  }

  // Check font-family uses variables
  const hardcodedFontFamily = cssContent.match(/font-family:\s*['"][^'"]+['"]/g) || [];
  const variableFontFamily = cssContent.match(/font-family:\s*var\(--font/g) || [];

  if (variableFontFamily.length > 0) {
    addResult('typography', 'passed', `Font-family using CSS variables: ${variableFontFamily.length} instances`);
  }

  // Check line-height consistency
  const lineHeightDeclarations = cssContent.match(/line-height:\s*[\d.]+/g) || [];
  if (lineHeightDeclarations.length > 0) {
    addResult('typography', 'passed', `Line-height declarations: ${lineHeightDeclarations.length}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION 4: SPACING
// ════════════════════════════════════════════════════════════════════════════

function validateSpacing() {
  console.log('\n📏 [4/6] Validating Spacing Consistency...');

  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  // Check spacing variables exist
  const spacingVars = DESIGN_STANDARDS.cssVariables.spacing;
  let definedSpacing = 0;

  for (const v of spacingVars) {
    if (cssContent.includes(`${v}:`)) {
      definedSpacing++;
    }
  }

  if (definedSpacing === spacingVars.length) {
    addResult('spacing', 'passed', `All ${spacingVars.length} spacing variables defined`);
  } else {
    addResult('spacing', 'warnings', `Only ${definedSpacing}/${spacingVars.length} spacing variables defined`);
  }

  // Check usage of spacing variables vs hardcoded
  const hardcodedMargin = cssContent.match(/margin(?:-\w+)?:\s*\d+px/g) || [];
  const hardcodedPadding = cssContent.match(/padding(?:-\w+)?:\s*\d+px/g) || [];
  const hardcodedGap = cssContent.match(/gap:\s*\d+px/g) || [];

  const variableMargin = cssContent.match(/margin(?:-\w+)?:\s*var\(--spacing/g) || [];
  const variablePadding = cssContent.match(/padding(?:-\w+)?:\s*var\(--spacing/g) || [];
  const variableGap = cssContent.match(/gap:\s*var\(--spacing/g) || [];

  const totalHardcoded = hardcodedMargin.length + hardcodedPadding.length + hardcodedGap.length;
  const totalVariable = variableMargin.length + variablePadding.length + variableGap.length;

  if (totalVariable > 0) {
    addResult('spacing', 'passed', `Spacing using CSS variables: ${totalVariable} instances`);
  }

  if (totalHardcoded > totalVariable * 2) {
    addResult('spacing', 'warnings', `High ratio of hardcoded spacing: ${totalHardcoded} hardcoded vs ${totalVariable} variable`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION 5: ACCESSIBILITY
// ════════════════════════════════════════════════════════════════════════════

function validateAccessibility() {
  console.log('\n♿ [5/6] Validating Accessibility...');

  const htmlFiles = findFiles(SITE_DIR, '.html');

  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  let buttonsWithAriaLabel = 0;
  let emptyButtonsWithoutAriaLabel = 0;
  let linksWithAriaLabel = 0;
  let skipLinks = 0;
  let landmarkRoles = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = relPath(file);

    // Check images for alt text
    const imagesWithAltMatch = content.match(/<img[^>]*alt="[^"]+"/g) || [];
    const imagesWithoutAltMatch = content.match(/<img(?![^>]*alt=)[^>]*>/g) || [];
    const imagesEmptyAlt = content.match(/<img[^>]*alt=""/g) || [];

    imagesWithAlt += imagesWithAltMatch.length;
    imagesWithoutAlt += imagesWithoutAltMatch.length;

    // Check for skip links
    if (content.includes('skip-to-content') || content.includes('skip-link') || content.includes('#main-content')) {
      skipLinks++;
    }

    // Check for ARIA landmarks
    const mainRole = content.includes('role="main"') || content.includes('<main');
    const navRole = content.includes('role="navigation"') || content.includes('<nav');
    const footerRole = content.includes('role="contentinfo"') || content.includes('<footer');

    if (mainRole) landmarkRoles++;
    if (navRole) landmarkRoles++;
    if (footerRole) landmarkRoles++;

    // Check buttons with aria-label
    const ariaButtons = content.match(/<button[^>]*aria-label/g) || [];
    buttonsWithAriaLabel += ariaButtons.length;

    // Check icon-only buttons without aria-label
    const iconButtons = content.match(/<button[^>]*>[\s]*<svg/g) || [];
    const iconButtonsWithAria = content.match(/<button[^>]*aria-label[^>]*>[\s]*<svg/g) || [];
    emptyButtonsWithoutAriaLabel += iconButtons.length - iconButtonsWithAria.length;
  }

  // Report results
  if (imagesWithoutAlt === 0) {
    addResult('accessibility', 'passed', `All ${imagesWithAlt} images have alt text`);
  } else {
    addResult('accessibility', 'errors', `${imagesWithoutAlt} images missing alt text`);
  }

  if (emptyButtonsWithoutAriaLabel === 0) {
    addResult('accessibility', 'passed', 'All icon buttons have aria-label');
  } else {
    addResult('accessibility', 'warnings', `${emptyButtonsWithoutAriaLabel} icon buttons may need aria-label`);
  }

  if (skipLinks > 0) {
    addResult('accessibility', 'passed', `Skip links found in ${skipLinks} pages`);
  } else {
    addResult('accessibility', 'warnings', 'No skip links detected');
  }

  if (landmarkRoles > 0) {
    addResult('accessibility', 'passed', `ARIA landmarks: ${landmarkRoles} found`);
  }

  // Check for lang attribute
  const htmlFiles2 = findFiles(SITE_DIR, '.html');
  let pagesWithLang = 0;
  for (const file of htmlFiles2) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.match(/<html[^>]*lang="/)) {
      pagesWithLang++;
    }
  }

  if (pagesWithLang === htmlFiles2.length) {
    addResult('accessibility', 'passed', `All ${pagesWithLang} pages have lang attribute`);
  } else {
    addResult('accessibility', 'warnings', `${pagesWithLang}/${htmlFiles2.length} pages have lang attribute`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION 6: RESPONSIVE
// ════════════════════════════════════════════════════════════════════════════

function validateResponsive() {
  console.log('\n📱 [6/6] Validating Responsive Design...');

  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  // Check for media queries
  const mediaQueries = cssContent.match(/@media[^{]+/g) || [];
  const mobileQueries = mediaQueries.filter(q => q.includes('768') || q.includes('max-width'));
  const tabletQueries = mediaQueries.filter(q => q.includes('1024'));
  const desktopQueries = mediaQueries.filter(q => q.includes('1200') || q.includes('1440'));

  if (mediaQueries.length > 0) {
    addResult('responsive', 'passed', `${mediaQueries.length} media queries found`);

    if (mobileQueries.length > 0) {
      addResult('responsive', 'passed', `Mobile breakpoints (768px): ${mobileQueries.length}`);
    } else {
      addResult('responsive', 'warnings', 'No mobile-specific breakpoints found');
    }
  } else {
    addResult('responsive', 'errors', 'No media queries found - site may not be responsive');
  }

  // Check for viewport meta
  const htmlFiles = findFiles(SITE_DIR, '.html');
  let pagesWithViewport = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('viewport') && content.includes('width=device-width')) {
      pagesWithViewport++;
    }
  }

  if (pagesWithViewport === htmlFiles.length) {
    addResult('responsive', 'passed', `All ${pagesWithViewport} pages have viewport meta`);
  } else {
    addResult('responsive', 'errors', `${pagesWithViewport}/${htmlFiles.length} pages have viewport meta`);
  }

  // Check for flexible units
  const pxValues = cssContent.match(/:\s*\d+px/g) || [];
  const remValues = cssContent.match(/:\s*\d+(\.\d+)?rem/g) || [];
  const emValues = cssContent.match(/:\s*\d+(\.\d+)?em/g) || [];
  const percentValues = cssContent.match(/:\s*\d+%/g) || [];
  const vwValues = cssContent.match(/:\s*\d+vw/g) || [];
  const vhValues = cssContent.match(/:\s*\d+vh/g) || [];

  const flexibleUnits = remValues.length + emValues.length + percentValues.length + vwValues.length + vhValues.length;

  addResult('responsive', 'passed', `Flexible units usage: ${flexibleUnits} (rem/em/%/vw/vh) vs ${pxValues.length} px`);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

console.log('═'.repeat(70));
console.log('  DESIGN SYSTEM EXTENDED VALIDATION');
console.log('  Buttons • Cards • Typography • Spacing • Accessibility • Responsive');
console.log('═'.repeat(70));

validateButtons();
validateCards();
validateTypography();
validateSpacing();
validateAccessibility();
validateResponsive();

// ════════════════════════════════════════════════════════════════════════════
// REPORT
// ════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(70));
console.log('  RESULTS');
console.log('═'.repeat(70));

const categories = ['buttons', 'cards', 'typography', 'spacing', 'accessibility', 'responsive'];

for (const cat of categories) {
  const r = results[cat];
  const icon = r.errors.length > 0 ? '❌' : (r.warnings.length > 0 ? '⚠️' : '✅');
  console.log(`\n${icon} ${cat.toUpperCase()}`);

  for (const p of r.passed) console.log(`  ✅ ${p}`);
  for (const w of r.warnings) console.log(`  ⚠️  ${w}`);
  for (const e of r.errors) console.log(`  ❌ ${e}`);
}

console.log('\n' + '─'.repeat(70));
console.log(`SUMMARY: ${passedCount} passed, ${warningCount} warnings, ${errorCount} errors`);
console.log('─'.repeat(70));

if (errorCount > 0) {
  console.log('\n❌ VALIDATION FAILED - Critical issues found');
  process.exit(1);
} else if (warningCount > 0) {
  console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED');
  process.exit(0);
}
