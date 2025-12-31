#!/usr/bin/env node
/**
 * FIX: Broken Internal Links
 * Session 117quater - Investor-Ready Audit
 * Fixes all 404-causing internal links
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Link replacements: broken -> fixed
const LINK_FIXES = {
  // Non-existent pages
  'href="/services.html"': 'href="/services/ecommerce.html"',
  'href="/en/services.html"': 'href="/en/services/ecommerce.html"',
  'href="/en/legal.html"': 'href="/en/legal/privacy.html"',
  'href="/automatisations.html"': 'href="/automations.html"',

  // Links without .html extension (FR)
  'href="/a-propos"': 'href="/a-propos.html"',
  'href="/contact"': 'href="/contact.html"',
  'href="/cas-clients"': 'href="/cas-clients.html"',
  'href="/services/ecommerce"': 'href="/services/ecommerce.html"',
  'href="/legal/mentions-legales"': 'href="/legal/mentions-legales.html"',
  'href="/legal/politique-confidentialite"': 'href="/legal/politique-confidentialite.html"',

  // Links without .html extension (EN)
  'href="/en/about"': 'href="/en/about.html"',
  'href="/en/contact"': 'href="/en/contact.html"',
  'href="/en/case-studies"': 'href="/en/case-studies.html"',
  'href="/en/services/ecommerce"': 'href="/en/services/ecommerce.html"',
  'href="/en/legal/privacy"': 'href="/en/legal/privacy.html"',
  'href="/en/legal/terms"': 'href="/en/legal/terms.html"',

  // Wrong language file in wrong folder
  'href="/en/blog/marketing-automation-pour-startups-2026-guide-complet.html"':
    'href="/en/blog/ecommerce-automation-2026.html"'
};

let totalFixes = 0;
const fixedFiles = [];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileFixed = false;
  let fixCount = 0;

  for (const [broken, fixed] of Object.entries(LINK_FIXES)) {
    if (content.includes(broken)) {
      const count = (content.match(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      content = content.split(broken).join(fixed);
      fixCount += count;
      fileFixed = true;
    }
  }

  if (fileFixed) {
    fs.writeFileSync(filePath, content);
    totalFixes += fixCount;
    fixedFiles.push({ file: path.relative(LANDING_DIR, filePath), fixes: fixCount });
    console.log('  ✅ ' + path.relative(LANDING_DIR, filePath) + ': ' + fixCount + ' fixes');
  }

  return fileFixed;
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir).forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (item.startsWith('.') || item === 'node_modules') return;

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (item.endsWith('.html')) {
      fixFile(fullPath);
    }
  });
}

console.log('='.repeat(60));
console.log('FIX: Broken Internal Links');
console.log('Session 117quater - Investor Due Diligence');
console.log('='.repeat(60));
console.log('');
console.log('Scanning for broken links...');
console.log('');

scanDir(LANDING_DIR);

console.log('');
console.log('='.repeat(60));
console.log('SUMMARY: ' + totalFixes + ' broken links fixed in ' + fixedFiles.length + ' files');
console.log('='.repeat(60));

// Save results
const outputPath = path.join(__dirname, '..', 'outputs', 'fix-broken-links.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalFixes,
  fixedFiles,
  linkFixes: LINK_FIXES
}, null, 2));
console.log('\nResults saved: ' + outputPath);
