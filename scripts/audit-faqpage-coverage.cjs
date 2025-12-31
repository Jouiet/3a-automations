#!/usr/bin/env node
/**
 * AUDIT: FAQPage Schema Coverage
 * Vérifie quelles pages ont FAQPage et lesquelles devraient en avoir
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Pages that SHOULD have FAQPage (excluding academy which is noindex)
const SHOULD_HAVE_FAQ = [
  // Homepage
  'index.html',
  'en/index.html',
  // Services
  'services/ecommerce.html',
  'services/pme.html',
  'services/voice-ai.html',
  'services/audit-gratuit.html',
  'services/flywheel-360.html',
  'en/services/ecommerce.html',
  'en/services/smb.html',
  'en/services/voice-ai.html',
  'en/services/free-audit.html',
  'en/services/flywheel-360.html',
  // Pricing
  'pricing.html',
  'en/pricing.html',
  // Contact
  'contact.html',
  'en/contact.html',
  // About
  'a-propos.html',
  'en/about.html',
  // Automations
  'automations.html',
  'en/automations.html',
];

const FAQPAGE_PATTERN = /"@type"\s*:\s*"FAQPage"/i;

const results = {
  filesScanned: 0,
  pagesWithFAQ: [],
  pagesMissingFAQ: [],
  coverage: 0
};

function scanFile(relativePath) {
  const filePath = path.join(LANDING_DIR, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  results.filesScanned++;

  return FAQPAGE_PATTERN.test(content);
}

// Main
console.log('🔍 Scanning for FAQPage schema coverage...\n');

SHOULD_HAVE_FAQ.forEach(relativePath => {
  const hasFAQ = scanFile(relativePath);

  if (hasFAQ === true) {
    results.pagesWithFAQ.push(relativePath);
  } else if (hasFAQ === false) {
    results.pagesMissingFAQ.push(relativePath);
  }
});

results.coverage = Math.round((results.pagesWithFAQ.length / SHOULD_HAVE_FAQ.length) * 100);

// Print results
console.log('\n' + '='.repeat(80));
console.log('📊 AUDIT: FAQPage Schema Coverage');
console.log('='.repeat(80));
console.log(`\n📁 Pages importantes scannées: ${results.filesScanned}`);
console.log(`✅ Avec FAQPage: ${results.pagesWithFAQ.length}`);
console.log(`❌ Sans FAQPage: ${results.pagesMissingFAQ.length}`);
console.log(`📈 Coverage: ${results.coverage}%`);

if (results.pagesMissingFAQ.length > 0) {
  console.log('\n' + '-'.repeat(40));
  console.log('❌ PAGES SANS FAQPage:');
  console.log('-'.repeat(40));
  results.pagesMissingFAQ.forEach(p => console.log(`   - ${p}`));
}

if (results.pagesWithFAQ.length > 0) {
  console.log('\n' + '-'.repeat(40));
  console.log('✅ PAGES AVEC FAQPage:');
  console.log('-'.repeat(40));
  results.pagesWithFAQ.forEach(p => console.log(`   - ${p}`));
}

console.log('\n' + '='.repeat(80));

const success = results.coverage >= 90;
if (success) {
  console.log(`✅ AUDIT PASSED: FAQPage coverage ${results.coverage}% (≥90%)`);
} else {
  console.log(`⚠️  AUDIT WARNING: FAQPage coverage ${results.coverage}% (<90%)`);
}

// Save results
const outputPath = path.join(__dirname, '..', 'outputs', 'audit-faqpage.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n📝 Résultats sauvegardés: ${outputPath}`);

process.exit(success ? 0 : 1);
