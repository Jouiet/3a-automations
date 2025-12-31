#!/usr/bin/env node
/**
 * FIX: Corrige automatiquement "78" en "86" pour les automations
 * ATTENTION: Modifie les fichiers en place
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Replacement patterns (ordered by specificity)
const REPLACEMENTS = [
  // Specific patterns first
  { from: /78 automatisations/gi, to: '86 automatisations' },
  { from: /78 Automatisations/g, to: '86 Automatisations' },
  { from: /78 workflows/gi, to: '86 workflows' },
  { from: /78 Workflows/g, to: '86 Workflows' },
  { from: /data-count="78"/g, to: 'data-count="86"' },
  { from: /<span class="stat-number">78<\/span>/g, to: '<span class="stat-number">86</span>' },
  { from: /<span class="stat-big">78<\/span>/g, to: '<span class="stat-big">86</span>' },
  { from: /<span>78 Automatisations<\/span>/g, to: '<span>86 Automatisations</span>' },
  { from: /<span>78 automatisations<\/span>/gi, to: '<span>86 automatisations</span>' },
  { from: /data-count="78">78</g, to: 'data-count="86">86<' },
  { from: /"78 automatisations/gi, to: '"86 automatisations' },
  { from: /\. 78 automatisations/gi, to: '. 86 automatisations' },
  { from: / 78 automatisations/gi, to: ' 86 automatisations' },
];

// Files to process
const EXTENSIONS = ['.html', '.js', '.json', '.txt', '.md'];

// Stats
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsTotal: 0,
  details: []
};

function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  let fileReplacements = 0;

  REPLACEMENTS.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(from, to);
    }
  });

  stats.filesProcessed++;

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesModified++;
    stats.replacementsTotal += fileReplacements;
    stats.details.push({ file: relativePath, replacements: fileReplacements });
    console.log(`✅ ${relativePath}: ${fileReplacements} corrections`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return;
  }

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

// Also process root files
function processRootFiles() {
  const rootFiles = [
    path.join(__dirname, '..', 'landing-page-hostinger', 'llms.txt'),
  ];

  rootFiles.forEach(file => {
    if (fs.existsSync(file)) {
      processFile(file);
    }
  });
}

// Main
console.log('🔧 Correcting "78" → "86" in all files...\n');
processDirectory(LANDING_DIR);
processRootFiles();

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log('='.repeat(60));
console.log(`📁 Fichiers traités: ${stats.filesProcessed}`);
console.log(`✏️  Fichiers modifiés: ${stats.filesModified}`);
console.log(`🔄 Total corrections: ${stats.replacementsTotal}`);
console.log('='.repeat(60));

if (stats.filesModified > 0) {
  console.log('\n📝 Fichiers modifiés:');
  stats.details.forEach(d => console.log(`   - ${d.file}: ${d.replacements} corrections`));
}

console.log('\n✅ Correction terminée. Relancez audit-78-vs-86.cjs pour vérifier.');
