#!/usr/bin/env node
/**
 * AUDIT: Détection de GTM/GA4 en double
 * Trouve les fichiers avec lazy-loaded GTM ET inline GTM
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Patterns to detect
const GTM_PATTERNS = {
  lazyLoaded: /loadGTM|initGTM|gtm\.start.*IntersectionObserver|setTimeout.*gtm/gi,
  inline: /\(function\s*\(\s*w\s*,\s*d\s*,\s*s\s*,\s*l\s*,\s*i\s*\)\s*\{.*gtm\.start/s,
  inlineSimple: /<script>.*gtm\.start.*<\/script>/s,
  multipleGTMJS: /googletagmanager\.com\/gtm\.js/g,
};

const results = {
  filesScanned: 0,
  duplicatesFound: [],
  fileDetails: {}
};

function scanFile(filePath) {
  if (!filePath.endsWith('.html')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  results.filesScanned++;

  // Count GTM script occurrences
  const gtmJsMatches = content.match(GTM_PATTERNS.multipleGTMJS) || [];
  const hasLazyLoaded = GTM_PATTERNS.lazyLoaded.test(content);
  const hasInline = GTM_PATTERNS.inline.test(content) || GTM_PATTERNS.inlineSimple.test(content);

  // Find line numbers for each GTM occurrence
  const lines = content.split('\n');
  const gtmLines = [];

  lines.forEach((line, index) => {
    if (line.includes('googletagmanager.com/gtm.js')) {
      gtmLines.push(index + 1);
    }
    if (line.includes('gtm.start')) {
      gtmLines.push(index + 1);
    }
  });

  // Dedupe line numbers
  const uniqueGtmLines = [...new Set(gtmLines)];

  if (gtmJsMatches.length > 1 || (hasLazyLoaded && hasInline)) {
    const issue = {
      file: relativePath,
      gtmScriptCount: gtmJsMatches.length,
      hasLazyLoaded,
      hasInline,
      gtmLines: uniqueGtmLines,
      severity: gtmJsMatches.length > 1 ? 'CRITICAL' : 'WARNING'
    };

    results.duplicatesFound.push(issue);
    results.fileDetails[relativePath] = issue;
  }
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
  console.log('📊 AUDIT: Duplicate GTM/GA4 Detection');
  console.log('='.repeat(80));
  console.log(`\n📁 Fichiers HTML scannés: ${results.filesScanned}`);
  console.log(`⚠️  Fichiers avec GTM dupliqué: ${results.duplicatesFound.length}`);

  if (results.duplicatesFound.length === 0) {
    console.log('\n✅ AUCUN GTM en double trouvé. Configuration correcte.');
    return true;
  }

  console.log('\n' + '-'.repeat(80));
  console.log('FICHIERS AVEC GTM DUPLIQUÉ:');
  console.log('-'.repeat(80));

  results.duplicatesFound.forEach(issue => {
    console.log(`\n❌ [${issue.severity}] ${issue.file}`);
    console.log(`   GTM scripts: ${issue.gtmScriptCount}`);
    console.log(`   Lazy-loaded: ${issue.hasLazyLoaded ? 'YES' : 'NO'}`);
    console.log(`   Inline GTM: ${issue.hasInline ? 'YES' : 'NO'}`);
    console.log(`   Lignes GTM: ${issue.gtmLines.join(', ')}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('ACTION REQUISE:');
  console.log('='.repeat(80));
  console.log('\nPour chaque fichier, garder SEULEMENT la version lazy-loaded et supprimer le bloc inline.');

  // Save results
  const outputPath = path.join(__dirname, '..', 'outputs', 'audit-gtm-results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📝 Résultats sauvegardés: ${outputPath}`);

  return false;
}

// Main
console.log('🔍 Scanning for duplicate GTM/GA4 scripts...\n');
scanDirectory(LANDING_DIR);
const success = printResults();

process.exit(success ? 0 : 1);
