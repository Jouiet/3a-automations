#!/usr/bin/env node
/**
 * VALIDATE DESIGN SYSTEM - Automated Branding Enforcement
 * Source of Truth: docs/DESIGN-SYSTEM.md
 *
 * @version 2.0.0
 * @date 2026-01-23
 * @session 142
 *
 * Usage:
 *   node scripts/validate-design-system.cjs [--fix] [--ci]
 *
 * Validates:
 * 1. CSS variables consistency
 * 2. Forbidden patterns (hardcoded colors, old classes)
 * 3. Automation/Agent counts
 * 4. SVG icon colors
 */

const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - SOURCE OF TRUTH
// ════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  SITE_DIR: path.join(__dirname, '..', 'landing-page-hostinger'),
  EXPECTED_AUTOMATIONS: 119,
  EXPECTED_AGENTS: 22,

  // Allowed hardcoded colors (brand logos, semantic red for errors)
  ALLOWED_HARDCODED: [
    '#EF4444', // Error red (intentional for "not available" sections)
    '#EA4B71', // Instagram brand
    '#E4405F', // Instagram brand
    '#95BF47', // Shopify brand
    '#25F4EE', // TikTok brand
    '#191E35', // Navy (sometimes needed)
    '#06B6D4', // Tailwind brand
  ],

  // Forbidden patterns
  FORBIDDEN: {
    classes: [
      { pattern: /class="section-title"/g, fix: 'class="section-title-ultra"', reason: 'Use section-title-ultra' },
    ],
    svgColors: [
      { pattern: /stroke="#4FBAF1"/g, fix: 'stroke="currentColor"', reason: 'Use currentColor' },
      { pattern: /stroke="#10B981"/g, fix: 'stroke="currentColor"', reason: 'Use currentColor' },
      { pattern: /stroke="#8B5CF6"/g, fix: 'stroke="currentColor"', reason: 'Use currentColor' },
      { pattern: /stroke="#F59E0B"/g, fix: 'stroke="currentColor"', reason: 'Use currentColor' },
      { pattern: /fill="#4FBAF1"/g, fix: 'fill="currentColor"', reason: 'Use currentColor' },
    ],
    cssVariables: [
      { pattern: /--color-primary/g, fix: '--primary', reason: 'Old naming convention' },
      { pattern: /--color-bg-dark/g, fix: '--bg-dark', reason: 'Old naming convention' },
      { pattern: /--color-text-light/g, fix: '--text-light', reason: 'Old naming convention' },
    ]
  }
};

// ════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const FIX_MODE = args.includes('--fix');
const CI_MODE = args.includes('--ci');

let totalErrors = 0;
let totalWarnings = 0;
let totalFixed = 0;

const results = {
  errors: [],
  warnings: [],
  fixed: [],
  passed: []
};

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
  } catch (e) {
    // Directory doesn't exist
  }
  return files;
}

function relPath(file) {
  return path.relative(CONFIG.SITE_DIR, file);
}

function addError(category, file, message, fix = null) {
  totalErrors++;
  results.errors.push({ category, file: relPath(file), message, fix });
}

function addWarning(category, file, message) {
  totalWarnings++;
  results.warnings.push({ category, file: relPath(file), message });
}

function addPassed(category, message) {
  results.passed.push({ category, message });
}

function addFixed(file, what) {
  totalFixed++;
  results.fixed.push({ file: relPath(file), what });
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDATORS
// ════════════════════════════════════════════════════════════════════════════

function validateAutomationCount() {
  console.log('\n📊 Validating Automation Count...');

  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');
  const pattern174 = /174\s*(automation|automatisation|workflow)/gi;
  let found174 = false;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(pattern174);
    if (matches) {
      found174 = true;
      addError('Count', file, `Found "174" but expected "${CONFIG.EXPECTED_AUTOMATIONS}"`,
        `Replace with ${CONFIG.EXPECTED_AUTOMATIONS}`);
    }
  }

  // Check JSON files
  const jsonFiles = findFiles(CONFIG.SITE_DIR, '.json');
  for (const file of jsonFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('"174"') || content.match(/:\s*174[,\s}]/)) {
        addError('Count', file, 'Found hardcoded "174" in JSON');
      }
    } catch (e) {}
  }

  // Check llms.txt
  const llmsPath = path.join(CONFIG.SITE_DIR, 'llms.txt');
  if (fs.existsSync(llmsPath)) {
    const llms = fs.readFileSync(llmsPath, 'utf8');
    if (llms.includes('174')) {
      addError('Count', llmsPath, 'llms.txt contains "174"');
    }
  }

  if (!found174) {
    addPassed('Count', `No "174" found - correctly using ${CONFIG.EXPECTED_AUTOMATIONS}`);
  }
}

function validateForbiddenPatterns() {
  console.log('\n🚫 Validating Forbidden Patterns...');

  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');

  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Check forbidden classes
    for (const rule of CONFIG.FORBIDDEN.classes) {
      const matches = content.match(rule.pattern);
      if (matches) {
        if (FIX_MODE) {
          content = content.replace(rule.pattern, rule.fix);
          modified = true;
          addFixed(file, rule.reason);
        } else {
          addError('Class', file, `${rule.reason}: found ${matches.length} instances`, rule.fix);
        }
      }
    }

    // Check forbidden SVG colors
    for (const rule of CONFIG.FORBIDDEN.svgColors) {
      const matches = content.match(rule.pattern);
      if (matches) {
        if (FIX_MODE) {
          content = content.replace(rule.pattern, rule.fix);
          modified = true;
          addFixed(file, rule.reason);
        } else {
          addError('SVG', file, `${rule.reason}: found ${matches.length} hardcoded colors`, rule.fix);
        }
      }
    }

    if (modified && FIX_MODE) {
      fs.writeFileSync(file, content, 'utf8');
    }
  }

  // Check CSS files
  const cssFiles = findFiles(CONFIG.SITE_DIR, '.css');
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf8');

    for (const rule of CONFIG.FORBIDDEN.cssVariables) {
      const matches = content.match(rule.pattern);
      if (matches) {
        addWarning('CSS', file, `${rule.reason}: found ${matches.length} instances`);
      }
    }
  }
}

function validateSVGIcons() {
  console.log('\n🎨 Validating SVG Icons...');

  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');
  const hardcodedPattern = /stroke="#([A-Fa-f0-9]{6})"/g;
  let totalHardcoded = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;

    while ((match = hardcodedPattern.exec(content)) !== null) {
      const color = `#${match[1]}`;
      if (!CONFIG.ALLOWED_HARDCODED.includes(color.toUpperCase()) &&
          !CONFIG.ALLOWED_HARDCODED.includes(color.toLowerCase())) {
        totalHardcoded++;
        addWarning('SVG', file, `Hardcoded color ${color} - consider using currentColor`);
      }
    }
  }

  if (totalHardcoded === 0) {
    addPassed('SVG', 'All SVG icons use currentColor or allowed brand colors');
  }
}

function validateAgentCount() {
  console.log('\n🤖 Validating Agent Count...');

  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');
  const pattern18 = /18\s*(agent|Agent)/g;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(pattern18);
    if (matches) {
      addError('Count', file, `Found "18 agents" but expected "${CONFIG.EXPECTED_AGENTS}"`,
        `Replace with ${CONFIG.EXPECTED_AGENTS}`);
    }
  }

  addPassed('Count', `Agent count validation complete (expected: ${CONFIG.EXPECTED_AGENTS})`);
}

function validateCSSVariables() {
  console.log('\n🎨 Validating CSS Variables...');

  const stylesPath = path.join(CONFIG.SITE_DIR, 'styles.css');
  if (!fs.existsSync(stylesPath)) {
    addError('CSS', stylesPath, 'styles.css not found');
    return;
  }

  const content = fs.readFileSync(stylesPath, 'utf8');

  // Required variables
  const required = [
    '--primary',
    '--accent',
    '--accent-purple',
    '--bg-dark',
    '--text-light',
    '--glass-bg',
    '--gradient-cyber'
  ];

  for (const varName of required) {
    if (!content.includes(`${varName}:`)) {
      addError('CSS', stylesPath, `Missing required variable: ${varName}`);
    }
  }

  addPassed('CSS', 'Required CSS variables present');
}

function validateH2Consistency() {
  console.log('\n📝 Validating H2 Title Consistency...');

  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');

  // Patterns that indicate a section h2 that SHOULD have section-title-ultra
  // but doesn't have any class attribute
  const bareH2Pattern = /<h2>([^<]+)<\/h2>/g;

  // Contexts where bare h2 is NOT acceptable
  const sectionContexts = [
    'category-header',  // Automation catalog categories
    'cta-section',      // CTA sections
    'cta-content',      // CTA content blocks
    'faq-section',      // FAQ sections
    'faq-category',     // FAQ categories
    'faq-cta',          // FAQ CTA
    'flywheel-cta',     // Flywheel CTA
    'cta '              // Generic CTA class
  ];

  // Files/paths to SKIP (blog articles, legal pages, academy content)
  const skipPaths = [
    '/blog/',
    '/legal/',
    '/academie/cours/',
    '/academy/courses/',
    '404.html'
  ];

  let totalBareH2 = 0;

  for (const file of htmlFiles) {
    const filePath = relPath(file);

    // Skip certain file types
    if (skipPaths.some(skip => filePath.includes(skip))) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');

    // Find bare h2 tags (no class attribute)
    let match;
    while ((match = bareH2Pattern.exec(content)) !== null) {
      const h2Text = match[1].trim();

      // Get surrounding context (200 chars before)
      const start = Math.max(0, match.index - 200);
      const context = content.substring(start, match.index);

      // Check if this h2 is in a section context that requires styling
      const isInSectionContext = sectionContexts.some(ctx => context.includes(ctx));

      if (isInSectionContext) {
        totalBareH2++;
        addWarning('H2', file, `Bare h2 "${h2Text.substring(0, 30)}..." in section context - add section-title-ultra`);
      }
    }
  }

  if (totalBareH2 === 0) {
    addPassed('H2', 'All section h2 tags have section-title-ultra class');
  } else {
    addWarning('H2', 'summary', `${totalBareH2} bare h2 tags found in section contexts - run --fix or add class manually`);
  }
}

function validateH1Consistency() {
  console.log('\n📝 Validating H1 Title Consistency...');

  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');

  // Pattern for h1 without class attribute
  const bareH1Pattern = /<h1>([^<]+)<\/h1>/g;
  // Pattern for h1 with old class
  const oldClassH1Pattern = /<h1 class="([^"]*)">/g;

  // Files to skip (legal, blog articles have different styling)
  const skipPaths = ['/blog/', '/legal/', '404.html'];

  // H1 should have one of these classes in section contexts
  const allowedH1Classes = [
    'hero-title-ultra',
    'section-title-ultra',
    'page-title',
    'sr-only'  // Screen reader only is acceptable
  ];

  let totalBareH1 = 0;
  let totalOldClassH1 = 0;

  for (const file of htmlFiles) {
    const filePath = relPath(file);
    if (skipPaths.some(skip => filePath.includes(skip))) continue;

    const content = fs.readFileSync(file, 'utf8');

    // Check bare h1
    let match;
    while ((match = bareH1Pattern.exec(content)) !== null) {
      const h1Text = match[1].trim();
      // Skip if it's in a hero section (likely intentional)
      const start = Math.max(0, match.index - 300);
      const context = content.substring(start, match.index);

      if (!context.includes('hero-')) {
        totalBareH1++;
        addWarning('H1', file, `Bare h1 "${h1Text.substring(0, 30)}..." - add hero-title-ultra or section-title-ultra`);
      }
    }

    // Check h1 with non-standard classes
    while ((match = oldClassH1Pattern.exec(content)) !== null) {
      const classes = match[1].split(' ');
      const hasAllowed = classes.some(c => allowedH1Classes.includes(c));
      if (!hasAllowed && !classes.includes('')) {
        totalOldClassH1++;
        addWarning('H1', file, `H1 with non-standard class "${match[1]}" - use hero-title-ultra or section-title-ultra`);
      }
    }
  }

  if (totalBareH1 === 0 && totalOldClassH1 === 0) {
    addPassed('H1', 'All H1 tags have proper classes');
  }
}

function validateCSSVersionConsistency() {
  console.log('\n🔄 Validating CSS Version Consistency...');

  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');
  const versions = new Map();

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/styles\.css\?v=(\d+\.\d+)/);
    if (match) {
      const version = match[1];
      if (!versions.has(version)) {
        versions.set(version, []);
      }
      versions.get(version).push(relPath(file));
    }
  }

  if (versions.size === 0) {
    addWarning('CSS', 'summary', 'No CSS version parameters found - add ?v=X.X for cache busting');
  } else if (versions.size === 1) {
    const [version] = versions.keys();
    addPassed('CSS', `All files use consistent CSS version (v=${version})`);
  } else {
    addError('CSS', 'summary',
      `Multiple CSS versions detected: ${[...versions.keys()].join(', ')} - run bump-css-version.cjs to fix`,
      'node scripts/bump-css-version.cjs');
  }
}

function validateCSSBaseClasses() {
  console.log('\n🎨 Validating CSS Base Class Definitions...');

  const stylesPath = path.join(CONFIG.SITE_DIR, 'styles.css');
  if (!fs.existsSync(stylesPath)) return;

  const content = fs.readFileSync(stylesPath, 'utf8');

  // Critical classes that MUST have gradient text effect
  const gradientClasses = [
    '.section-title-ultra',
    '.hero-title-ultra'
  ];

  // Required properties for gradient text
  const gradientProps = [
    'background:',
    '-webkit-background-clip:',
    '-webkit-text-fill-color:'
  ];

  for (const className of gradientClasses) {
    // Find the base class definition (not nested selectors)
    const basePattern = new RegExp(`^${className.replace('.', '\\.')}\\s*\\{[^}]+\\}`, 'm');
    const match = content.match(basePattern);

    if (!match) {
      addWarning('CSS', 'styles.css', `Base class ${className} not found - may only be in nested selectors`);
      continue;
    }

    const classContent = match[0];

    // Check for gradient properties
    const hasGradient = gradientProps.every(prop =>
      classContent.includes(prop) || classContent.includes(prop.replace(':', ''))
    );

    if (!hasGradient) {
      addError('CSS', 'styles.css',
        `${className} missing gradient text effect - must have background-clip: text`,
        `Add gradient properties to base ${className} class`);
    }
  }

  addPassed('CSS', 'Base class definitions validated');
}

function validateCategoryIconConsistency() {
  console.log('\n🎯 Validating Category Icon Consistency...');

  const stylesPath = path.join(CONFIG.SITE_DIR, 'styles.css');
  const cssContent = fs.readFileSync(stylesPath, 'utf8');

  // Find all category-icon classes used in HTML
  const htmlFiles = findFiles(CONFIG.SITE_DIR, '.html');
  const usedClasses = new Set();

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.matchAll(/class="category-icon\s+([a-zA-Zéèà]+)"/g);
    for (const match of matches) {
      usedClasses.add(match[1]);
    }
  }

  // Check each used class has CSS definition
  const missingCSS = [];
  for (const className of usedClasses) {
    // Check for CSS definition (with or without accents)
    const pattern = new RegExp(`\\.category-icon\\.${className}\\s*[,{]`);
    if (!pattern.test(cssContent)) {
      missingCSS.push(className);
    }
  }

  if (missingCSS.length === 0) {
    addPassed('Icons', `All ${usedClasses.size} category-icon classes have CSS definitions`);
  } else {
    addError('Icons', 'styles.css',
      `Missing CSS for category-icon classes: ${missingCSS.join(', ')}`,
      `Add .category-icon.${missingCSS[0]} { background: ...; color: ...; } to styles.css`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

console.log('═'.repeat(70));
console.log('  DESIGN SYSTEM VALIDATION');
console.log('  Source: docs/DESIGN-SYSTEM.md');
console.log('  Mode:', FIX_MODE ? '🔧 FIX' : '🔍 CHECK', CI_MODE ? '(CI)' : '');
console.log('═'.repeat(70));

validateAutomationCount();
validateAgentCount();
validateForbiddenPatterns();
validateSVGIcons();
validateCSSVariables();
validateH1Consistency();
validateH2Consistency();
validateCSSVersionConsistency();
validateCSSBaseClasses();
validateCategoryIconConsistency();

// ════════════════════════════════════════════════════════════════════════════
// REPORT
// ════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(70));
console.log('  RESULTS');
console.log('═'.repeat(70));

if (results.errors.length > 0) {
  console.log('\n❌ ERRORS (' + results.errors.length + ')');
  for (const e of results.errors) {
    console.log(`  [${e.category}] ${e.file}: ${e.message}`);
    if (e.fix) console.log(`    → Fix: ${e.fix}`);
  }
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (' + results.warnings.length + ')');
  for (const w of results.warnings) {
    console.log(`  [${w.category}] ${w.file}: ${w.message}`);
  }
}

if (results.fixed.length > 0) {
  console.log('\n🔧 FIXED (' + results.fixed.length + ')');
  for (const f of results.fixed) {
    console.log(`  ${f.file}: ${f.what}`);
  }
}

if (results.passed.length > 0) {
  console.log('\n✅ PASSED (' + results.passed.length + ')');
  for (const p of results.passed) {
    console.log(`  [${p.category}] ${p.message}`);
  }
}

console.log('\n' + '─'.repeat(70));
console.log(`SUMMARY: ${totalErrors} errors, ${totalWarnings} warnings, ${totalFixed} fixed`);
console.log('─'.repeat(70));

if (CI_MODE && totalErrors > 0) {
  console.log('\n❌ CI FAILED - Fix errors before deploying');
  process.exit(1);
}

if (totalErrors === 0) {
  console.log('\n✅ DESIGN SYSTEM VALIDATION PASSED');
  process.exit(0);
} else {
  console.log('\n⚠️  Run with --fix to auto-fix some issues');
  process.exit(FIX_MODE ? 0 : 1);
}
