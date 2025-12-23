#!/usr/bin/env node
/**
 * Fix Automation Count: 66/70 → 72
 * Source of truth: automations-registry.json (totalCount: 72)
 *
 * Date: 2025-12-23 | Session 75
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, 'landing-page-hostinger');
const CORRECT_COUNT = 72;

console.log('🔍 Fixing automation count: 66/70 → 72\n');
console.log('Source of truth: automations-registry.json\n');

let totalFixes = 0;
const fixedFiles = [];

// Patterns to replace (order matters - more specific first)
const replacements = [
  // French patterns
  { from: /66 Automatisations?/g, to: `${CORRECT_COUNT} Automatisations` },
  { from: /70 automatisations?/g, to: `${CORRECT_COUNT} automatisations` },
  { from: /70 Automatisations?/g, to: `${CORRECT_COUNT} Automatisations` },
  { from: /66 automatisations?/g, to: `${CORRECT_COUNT} automatisations` },

  // English patterns
  { from: /66 Automations?/g, to: `${CORRECT_COUNT} Automations` },
  { from: /70 Automations?/g, to: `${CORRECT_COUNT} Automations` },
  { from: /66 automations?/g, to: `${CORRECT_COUNT} automations` },
  { from: /70 automations?/g, to: `${CORRECT_COUNT} automations` },

  // Meta descriptions / titles
  { from: /catalogue de 70 automations/gi, to: `catalogue de ${CORRECT_COUNT} automations` },
  { from: /catalog of 70 automations/gi, to: `catalog of ${CORRECT_COUNT} automations` },
  { from: /Catalogue 70 Automations/g, to: `Catalogue ${CORRECT_COUNT} Automations` },

  // Stat numbers and data attributes
  { from: /data-count="66"/g, to: `data-count="${CORRECT_COUNT}"` },
  { from: /data-count="70"/g, to: `data-count="${CORRECT_COUNT}"` },
  { from: />66<\/span>/g, to: `>${CORRECT_COUNT}</span>` },
  { from: />70<\/span>/g, to: `>${CORRECT_COUNT}</span>` },

  // With preceding numbers for stats
  { from: /avec 70 automatisations/g, to: `avec ${CORRECT_COUNT} automatisations` },
  { from: /avec 66 automatisations/g, to: `avec ${CORRECT_COUNT} automatisations` },

  // JS patterns (total: X)
  { from: /total: 66/g, to: `total: ${CORRECT_COUNT}` },
  { from: /total: 70/g, to: `total: ${CORRECT_COUNT}` },

  // "I have X" patterns in voice widgets
  { from: /I have 66 ready/g, to: `I have ${CORRECT_COUNT} ready` },
  { from: /I have 70 ready/g, to: `I have ${CORRECT_COUNT} ready` },
  { from: /J'ai 66 automatisations/g, to: `J'ai ${CORRECT_COUNT} automatisations` },
  { from: /J'ai 70 automatisations/g, to: `J'ai ${CORRECT_COUNT} automatisations` },

  // Workflows patterns
  { from: /70 workflows/g, to: `${CORRECT_COUNT} workflows` },
  { from: /66 workflows/g, to: `${CORRECT_COUNT} workflows` },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileFixCount = 0;

  for (const { from, to } of replacements) {
    const matches = content.match(from);
    if (matches) {
      fileFixCount += matches.length;
      content = content.replace(from, to);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedFiles.push({ path: filePath.replace(ROOT + '/', ''), fixes: fileFixCount });
    totalFixes += fileFixCount;
    console.log(`✅ ${filePath.replace(ROOT + '/', '')} (${fileFixCount} fixes)`);
  }
}

// 1. Fix HTML files
console.log('\n📄 HTML FILES:\n');
const htmlFiles = glob.sync('**/*.html', { cwd: SITE_DIR });
for (const file of htmlFiles) {
  fixFile(path.join(SITE_DIR, file));
}

// 2. Fix JS files
console.log('\n📜 JS FILES:\n');
const jsFiles = [
  'voice-assistant/voice-widget.js',
  'voice-assistant/voice-widget-en.js',
  'voice-assistant/voice-widget.min.js',
  'voice-assistant/voice-widget-en.min.js',
  'voice-assistant/knowledge-base.js',
];
for (const file of jsFiles) {
  const fullPath = path.join(SITE_DIR, file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  }
}

// 3. Fix JSON files
console.log('\n📊 JSON FILES:\n');
const jsonFiles = ['voice-assistant/knowledge.json'];
for (const file of jsonFiles) {
  const fullPath = path.join(SITE_DIR, file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  }
}

// 4. Fix TXT files
console.log('\n📝 TXT FILES:\n');
const txtFiles = ['llms.txt', 'llms-full.txt'];
for (const file of txtFiles) {
  const fullPath = path.join(SITE_DIR, file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  }
}

// 5. Fix documentation files
console.log('\n📚 DOCUMENTATION:\n');
const docFiles = [
  'CLAUDE.md',
  'docs/action-plan.md',
  'docs/business-model.md',
  'docs/flywheel.md',
  'outputs/FORENSIC-AUDIT-2025-12-18.md',
  'HISTORY.md',
];
for (const file of docFiles) {
  const fullPath = path.join(ROOT, file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  }
}

// 6. Fix old scripts that reference wrong counts
console.log('\n🔧 SCRIPTS:\n');
const scriptFiles = [
  'scripts/fix-seo-issues.cjs',
  'scripts/fix-footer-automations-count.cjs',
];
for (const file of scriptFiles) {
  const fullPath = path.join(ROOT, file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n🎯 SUMMARY: ${totalFixes} fixes in ${fixedFiles.length} files\n`);
console.log('Files modified:');
for (const f of fixedFiles) {
  console.log(`  - ${f.path}: ${f.fixes} changes`);
}

// Verify source of truth
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'automations/automations-registry.json'), 'utf8'));
console.log(`\n✅ Source of truth: automations-registry.json`);
console.log(`   Version: ${registry.version}`);
console.log(`   Total Count: ${registry.totalCount}`);

if (registry.totalCount !== CORRECT_COUNT) {
  console.error(`\n❌ ERROR: Registry says ${registry.totalCount}, but script fixes to ${CORRECT_COUNT}!`);
  process.exit(1);
}

console.log('\n✅ All automation counts synchronized to 72\n');
