#!/usr/bin/env node
/**
 * FIX: 78 → 86 Complete - All patterns
 * Fixes ALL occurrences of 78 automations to 86
 * Date: 2025-12-31
 * Version: 2.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

const PATTERNS = [
  // Meta descriptions and titles
  { find: /78 automations?/gi, replace: '86 automations' },
  { find: /78 automatisations?/gi, replace: '86 automatisations' },
  { find: /Catalogue 78/gi, replace: 'Catalogue 86' },
  { find: /catalog of 78/gi, replace: 'catalog of 86' },

  // Specific badge patterns
  { find: /<span>78 automations<\/span>/gi, replace: '<span>86 automations</span>' },
  { find: /<span>78 automatisations<\/span>/gi, replace: '<span>86 automatisations</span>' },

  // Card badges
  { find: /card-badge">78 automations/gi, replace: 'card-badge">86 automations' },
  { find: /card-badge">78 automatisations/gi, replace: 'card-badge">86 automatisations' },

  // Schema.org
  { find: /"78 automations/gi, replace: '"86 automations' },
  { find: /"78 automatisations/gi, replace: '"86 automatisations' },
  { find: /"78 marketing and operational/gi, replace: '"86 marketing and operational' },

  // Content text
  { find: />78 automations/gi, replace: '>86 automations' },
  { find: />78 automatisations/gi, replace: '>86 automatisations' },
];

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0
};

function processFile(filePath) {
  if (!filePath.endsWith('.html')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  stats.filesProcessed++;

  let fileReplacements = 0;

  PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.find);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(pattern.find, pattern.replace);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesModified++;
    stats.totalReplacements += fileReplacements;
    console.log(`✅ Fixed ${fileReplacements} occurrences: ${relativePath}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (item.startsWith('.') || item === 'node_modules') return;

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

// Main
console.log('🔧 Fixing ALL 78 → 86 occurrences...\n');
processDirectory(LANDING_DIR);

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log('='.repeat(60));
console.log(`📁 Fichiers traités: ${stats.filesProcessed}`);
console.log(`✅ Fichiers modifiés: ${stats.filesModified}`);
console.log(`🔄 Remplacements totaux: ${stats.totalReplacements}`);
console.log('='.repeat(60));

// Verify
console.log('\n🔍 Vérification...');
const remaining = require('child_process').execSync(
  `grep -r "78" ${LANDING_DIR} 2>/dev/null | grep -iE "78.*(automation|automatisation)" | wc -l`,
  { encoding: 'utf-8' }
).trim();

if (remaining === '0') {
  console.log('✅ Aucune occurrence de "78 automations" restante!');
} else {
  console.log(`⚠️  ${remaining} occurrences restantes`);
}
