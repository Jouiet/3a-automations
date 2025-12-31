#!/usr/bin/env node
/**
 * AUDIT: Détection de l'incohérence "78" vs "86" automations
 * Scan TOUS les fichiers HTML, JS, TXT, MD, JSON
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
const CORRECT_VALUE = '86';
const INCORRECT_VALUE = '78';

// Patterns to detect
const PATTERNS = [
  { regex: /78\s*automatisations?/gi, context: 'automations text' },
  { regex: /78\s*workflows?/gi, context: 'workflows text' },
  { regex: /data-count="78"/gi, context: 'data-count attribute' },
  { regex: />78</gi, context: 'HTML content >78<' },
  { regex: /"78"/gi, context: 'quoted "78"' },
  { regex: /:\s*78\b/gi, context: 'colon 78' },
  { regex: /\b78\s*(automatisations?|workflows?|scripts?)/gi, context: 'number before keyword' },
];

// Files to scan
const EXTENSIONS = ['.html', '.js', '.json', '.txt', '.md', '.css'];

// Results storage
const results = {
  filesScanned: 0,
  issuesFound: [],
  fileDetails: {}
};

function scanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.includes(ext)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  results.filesScanned++;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check each pattern
    PATTERNS.forEach(({ regex, context }) => {
      regex.lastIndex = 0; // Reset regex
      const matches = line.match(regex);
      if (matches) {
        matches.forEach(match => {
          // Avoid false positives (like port numbers, years, etc.)
          // Check if it's in automation/workflow context
          const lineContext = line.toLowerCase();
          const isRelevant =
            lineContext.includes('automat') ||
            lineContext.includes('workflow') ||
            lineContext.includes('script') ||
            lineContext.includes('catalogue') ||
            lineContext.includes('catalog') ||
            lineContext.includes('data-count') ||
            lineContext.includes('stat-number') ||
            (context === 'HTML content >78<' && lineContext.includes('stat'));

          if (isRelevant) {
            const issue = {
              file: relativePath,
              line: lineNum,
              match: match,
              context: context,
              lineContent: line.trim().substring(0, 150)
            };
            results.issuesFound.push(issue);

            if (!results.fileDetails[relativePath]) {
              results.fileDetails[relativePath] = [];
            }
            results.fileDetails[relativePath].push(issue);
          }
        });
      }
    });
  });
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return;
  }

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    // Skip hidden folders and node_modules
    if (item.startsWith('.') || item === 'node_modules') return;

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile()) {
      scanFile(fullPath);
    }
  });
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT: Incohérence "78" vs "86" Automations');
  console.log('='.repeat(80));
  console.log(`\n📁 Fichiers scannés: ${results.filesScanned}`);
  console.log(`⚠️  Issues trouvées: ${results.issuesFound.length}`);

  if (results.issuesFound.length === 0) {
    console.log('\n✅ AUCUNE incohérence "78" trouvée. Toutes les valeurs sont correctes.');
    return true;
  }

  console.log('\n' + '-'.repeat(80));
  console.log('DÉTAIL PAR FICHIER:');
  console.log('-'.repeat(80));

  Object.keys(results.fileDetails).forEach(file => {
    const issues = results.fileDetails[file];
    console.log(`\n📄 ${file} (${issues.length} issues)`);
    issues.forEach(issue => {
      console.log(`   L${issue.line}: ${issue.match} [${issue.context}]`);
      console.log(`   └── ${issue.lineContent}`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('RÉSUMÉ:');
  console.log('='.repeat(80));
  console.log(`\n❌ ${results.issuesFound.length} occurrences de "78" à corriger en "86"`);
  console.log(`📁 ${Object.keys(results.fileDetails).length} fichiers affectés`);

  // Output JSON for automated fix
  const outputPath = path.join(__dirname, '..', 'outputs', 'audit-78-results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📝 Résultats sauvegardés: ${outputPath}`);

  return false;
}

// Also scan llms.txt and other root files
function scanRootFiles() {
  const rootFiles = [
    path.join(__dirname, '..', 'landing-page-hostinger', 'llms.txt'),
    path.join(__dirname, '..', 'CLAUDE.md'),
  ];

  rootFiles.forEach(file => {
    if (fs.existsSync(file)) {
      scanFile(file);
    }
  });
}

// Main
console.log('🔍 Scanning landing-page-hostinger for "78" inconsistencies...\n');
scanDirectory(LANDING_DIR);
scanRootFiles();
const success = printResults();

process.exit(success ? 0 : 1);
