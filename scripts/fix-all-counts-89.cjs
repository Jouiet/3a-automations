#!/usr/bin/env node
/**
 * FIX ALL AUTOMATION COUNTS TO 89
 * Date: 2026-01-03
 *
 * Registry v2.3.0 totalCount = 89
 *
 * Fixes: 78, 82, 86, 88 → 89
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// Patterns to fix
const PATTERNS = [
  // 88 → 89
  { find: /99 automations?/gi, replace: '99 automations' },
  { find: /99 automatisations?/gi, replace: '99 automatisations' },
  { find: /88 workflows?/gi, replace: '89 workflows' },

  // 86 → 89
  { find: /99 automations?/gi, replace: '99 automations' },
  { find: /86 automatisations?/gi, replace: '99 automatisations' },
  { find: /86 workflows?/gi, replace: '89 workflows' },

  // 78 → 89
  { find: /99 automations?/gi, replace: '99 automations' },
  { find: /78 automatisations?/gi, replace: '99 automatisations' },
  { find: /78 workflows?/gi, replace: '89 workflows' },

  // 82 → 89
  { find: /82 automations?/gi, replace: '99 automations' },
  { find: /82 automatisations?/gi, replace: '99 automatisations' },
  { find: /82 workflows?/gi, replace: '89 workflows' },

  // Specific patterns
  { find: /<span>99 automations<\/span>/gi, replace: '<span>99 automations</span>' },
  { find: /<span>99 automatisations<\/span>/gi, replace: '<span>99 automatisations</span>' },
  { find: /<span>99 automations<\/span>/gi, replace: '<span>99 automations</span>' },
  { find: /<span>86 automatisations<\/span>/gi, replace: '<span>99 automatisations</span>' },
  { find: /<span>99 automations<\/span>/gi, replace: '<span>99 automations</span>' },
  { find: /<span>78 automatisations<\/span>/gi, replace: '<span>99 automatisations</span>' },

  // Card badges
  { find: /card-badge">99 automations/gi, replace: 'card-badge">99 automations' },
  { find: /card-badge">99 automatisations/gi, replace: 'card-badge">99 automatisations' },
  { find: /card-badge">99 automations/gi, replace: 'card-badge">99 automations' },
  { find: /card-badge">86 automatisations/gi, replace: 'card-badge">99 automatisations' },

  // Quoted patterns
  { find: /"99 automations/gi, replace: '"99 automations' },
  { find: /"99 automatisations/gi, replace: '"99 automatisations' },
  { find: /"99 automations/gi, replace: '"99 automations' },
  { find: /"86 automatisations/gi, replace: '"99 automatisations' },
  { find: /"99 automations/gi, replace: '"99 automations' },
  { find: /"78 automatisations/gi, replace: '"99 automatisations' },

  // Dotted patterns
  { find: /\. 99 automations/gi, replace: '. 99 automations' },
  { find: /\. 99 automatisations/gi, replace: '. 99 automatisations' },
  { find: /\. 99 automations/gi, replace: '. 99 automations' },
  { find: /\. 86 automatisations/gi, replace: '. 99 automatisations' },
  { find: /\. 99 automations/gi, replace: '. 99 automations' },
  { find: /\. 78 automatisations/gi, replace: '. 99 automatisations' },
];

// Files/directories to skip
const SKIP = [
  'node_modules',
  '.git',
  '.next',
  'outputs',
  'HISTORY.md',
  'fix-all-counts-89.cjs',
  'fix-78-to-86.cjs',
  'fix-78-to-86-complete.cjs'
];

function shouldSkip(filePath) {
  return SKIP.some(skip => filePath.includes(skip));
}

function processFile(filePath) {
  if (shouldSkip(filePath)) return { file: filePath, changes: 0, skipped: true };

  const ext = path.extname(filePath);
  if (!['.html', '.js', '.cjs', '.md', '.json', '.txt'].includes(ext)) {
    return { file: filePath, changes: 0, skipped: true };
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let changeCount = 0;

  for (const pattern of PATTERNS) {
    const matches = content.match(pattern.find);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(pattern.find, pattern.replace);
    }
  }

  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { file: filePath, changes: changeCount, skipped: false };
  }

  return { file: filePath, changes: 0, skipped: false };
}

function walkDir(dir, results = []) {
  if (shouldSkip(dir)) return results;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath, results);
    } else {
      results.push(filePath);
    }
  }

  return results;
}

// Main execution
console.log('🔧 Fixing ALL automation counts to 89...\n');
console.log('Source of truth: automations-registry.json v2.3.0 totalCount=89\n');

const allFiles = walkDir(BASE_DIR);
let totalChanges = 0;
let filesChanged = 0;

for (const file of allFiles) {
  const result = processFile(file);
  if (result.changes > 0) {
    console.log(`✅ ${path.relative(BASE_DIR, result.file)}: ${result.changes} changes`);
    totalChanges += result.changes;
    filesChanged++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Total: ${totalChanges} changes in ${filesChanged} files`);
console.log('='.repeat(60));
