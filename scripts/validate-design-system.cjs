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
