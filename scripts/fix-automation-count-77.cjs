#!/usr/bin/env node
/**
 * Update automation count from 75 to 77 across all HTML pages
 * @version 1.0.0
 * @date 2025-12-23
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Patterns to replace
const replacements = [
  // Meta descriptions
  { from: /75 automations/gi, to: '77 automations' },
  { from: /75 workflows/gi, to: '77 workflows' },
  { from: /Catalogue 75 Automations/gi, to: 'Catalogue 77 Automations' },
  { from: /75 E-commerce & Marketing Automations/gi, to: '77 E-commerce & Marketing Automations' },
  // Stats
  { from: /<span class="stat-number">75<\/span>/g, to: '<span class="stat-number">77</span>' },
  { from: /<span>75 Automations<\/span>/g, to: '<span>77 Automations</span>' },
  // JSON-LD
  { from: /"75 marketing/g, to: '"77 marketing' },
  // Text content
  { from: /75 scripts d'automatisation/g, to: '77 workflows d\'automatisation' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  for (const { from, to } of replacements) {
    const matches = content.match(from);
    if (matches && matches.length > 0) {
      content = content.replace(from, to);
      modified = true;
      changes.push(`${from.toString()} → ${to} (${matches.length}x)`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { file: path.relative(SITE_DIR, filePath), changes };
  }
  return null;
}

function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.')) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('🔄 Updating automation count: 75 → 77\n');

const htmlFiles = findHtmlFiles(SITE_DIR);
const results = [];

for (const file of htmlFiles) {
  const result = processFile(file);
  if (result) {
    results.push(result);
  }
}

console.log(`📊 Results:\n`);
if (results.length === 0) {
  console.log('✅ No changes needed - already up to date');
} else {
  for (const { file, changes } of results) {
    console.log(`✅ ${file}:`);
    for (const change of changes) {
      console.log(`   - ${change}`);
    }
  }
  console.log(`\n📁 Total: ${results.length} files updated`);
}
