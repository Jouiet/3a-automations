#!/usr/bin/env node
/**
 * FIX: Complete URL Extension Fix
 * Session 117quater - Investor-Ready Audit
 * Fixes ALL URLs without .html extension:
 * - og:url meta tags
 * - hreflang link tags
 * - canonical links
 * - internal hrefs
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Pages that should have .html extension (not index pages)
const PAGES_NEEDING_EXTENSION = [
  'a-propos',
  'contact',
  'cas-clients',
  'automations',
  'pricing',
  'booking',
  'en/about',
  'en/contact',
  'en/case-studies',
  'en/automations',
  'en/pricing',
  'en/booking',
  'services/ecommerce',
  'services/pme',
  'services/flywheel-360',
  'services/voice-ai',
  'services/audit-gratuit',
  'en/services/ecommerce',
  'en/services/smb',
  'en/services/flywheel-360',
  'en/services/voice-ai',
  'en/services/free-audit',
  'legal/mentions-legales',
  'legal/politique-confidentialite',
  'en/legal/terms',
  'en/legal/privacy',
  'academie',
  'en/academy'
];

let totalFixes = 0;
const fixedFiles = [];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileFixCount = 0;

  for (const page of PAGES_NEEDING_EXTENSION) {
    // Full URL patterns (with domain)
    const escapedPage = page.replace(/\//g, '\\/');
    
    // og:url and canonical - content attribute
    const ogPattern = new RegExp('content="https://3a-automation\\.com/' + escapedPage + '"', 'g');
    if (ogPattern.test(content)) {
      const matches = content.match(ogPattern);
      fileFixCount += matches.length;
      content = content.replace(ogPattern, 'content="https://3a-automation.com/' + page + '.html"');
    }
    
    // hreflang href - full URL
    const hreflangPattern = new RegExp('href="https://3a-automation\\.com/' + escapedPage + '"', 'g');
    if (hreflangPattern.test(content)) {
      const matches = content.match(hreflangPattern);
      fileFixCount += matches.length;
      content = content.replace(hreflangPattern, 'href="https://3a-automation.com/' + page + '.html"');
    }
    
    // Relative URLs
    const relPattern = new RegExp('href="/' + escapedPage + '"', 'g');
    if (relPattern.test(content)) {
      const matches = content.match(relPattern);
      fileFixCount += matches.length;
      content = content.replace(relPattern, 'href="/' + page + '.html"');
    }
  }

  // Fix the wrong EN blog file reference
  const wrongBlogPatterns = [
    /href="\/en\/blog\/marketing-automation-pour-startups-2026-guide-complet\.html"/g,
    /href="https:\/\/3a-automation\.com\/en\/blog\/marketing-automation-pour-startups-2026-guide-complet\.html"/g
  ];
  
  for (const pattern of wrongBlogPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      fileFixCount += matches.length;
      content = content.replace(pattern, pattern.source.includes('https') 
        ? 'href="https://3a-automation.com/en/blog/ecommerce-automation-2026.html"'
        : 'href="/en/blog/ecommerce-automation-2026.html"');
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    totalFixes += fileFixCount;
    fixedFiles.push({ file: path.relative(LANDING_DIR, filePath), fixes: fileFixCount });
    console.log('  ✅ ' + path.relative(LANDING_DIR, filePath) + ': ' + fileFixCount + ' fixes');
  }
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
console.log('FIX: Complete URL Extension Fix');
console.log('Session 117quater - Investor Due Diligence');
console.log('='.repeat(60));
console.log('');
console.log('Fixing og:url, hreflang, and internal links...');
console.log('');

scanDir(LANDING_DIR);

console.log('');
console.log('='.repeat(60));
console.log('SUMMARY: ' + totalFixes + ' URLs fixed in ' + fixedFiles.length + ' files');
console.log('='.repeat(60));

// Save results
const outputPath = path.join(__dirname, '..', 'outputs', 'fix-url-extensions.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalFixes,
  fixedFiles,
  pagesFixed: PAGES_NEEDING_EXTENSION
}, null, 2));
console.log('\nResults saved: ' + outputPath);
