#!/usr/bin/env node
/**
 * Final 404 Audit - Comprehensive Link Checker
 * Ignores intentionally noindexed pages
 * Focus on user-facing navigation issues
 */

const fs = require('fs');
const path = require('path');

const SITE_ROOT = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';
const DOMAIN = 'https://3a-automation.com';

function getAllHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.')) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Extract all internal links
function extractInternalLinks(content) {
  const links = [];
  const hrefRegex = /href=["']([^"'#]+)["']/g;
  let match;
  
  while ((match = hrefRegex.exec(content)) !== null) {
    let href = match[1];
    
    // Skip external, mailto, tel, javascript, protocol-relative
    if (href.startsWith('http') || 
        href.startsWith('//') ||
        href.startsWith('mailto:') || 
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.startsWith('data:') ||
        href === '') {
      continue;
    }
    links.push(href);
  }
  return [...new Set(links)]; // Dedupe
}

function resolveLink(href, sourceFile) {
  const sourceDir = path.dirname(sourceFile);
  if (href.startsWith('/')) {
    return path.join(SITE_ROOT, href);
  }
  return path.resolve(sourceDir, href);
}

function fileExists(filePath) {
  let checkPath = filePath.split('?')[0].split('#')[0];
  if (checkPath.endsWith('/')) {
    checkPath = path.join(checkPath, 'index.html');
  }
  return fs.existsSync(checkPath);
}

console.log(`\n${'='.repeat(80)}`);
console.log('🔍 FINAL 404 AUDIT REPORT');
console.log(`${'='.repeat(80)}`);

const htmlFiles = getAllHtmlFiles(SITE_ROOT);
console.log(`\nScanning ${htmlFiles.length} HTML files for broken links...\n`);

const brokenLinks = [];
const linkStats = { total: 0, internal: 0, broken: 0 };

for (const file of htmlFiles) {
  const relativePath = file.replace(SITE_ROOT, '');
  const content = fs.readFileSync(file, 'utf8');
  const links = extractInternalLinks(content);
  
  linkStats.total += links.length;
  linkStats.internal += links.length;
  
  for (const link of links) {
    const resolved = resolveLink(link, file);
    if (!fileExists(resolved)) {
      brokenLinks.push({
        source: relativePath,
        href: link,
        expected: resolved.replace(SITE_ROOT, '')
      });
      linkStats.broken++;
    }
  }
}

if (brokenLinks.length === 0) {
  console.log('✅ NO BROKEN LINKS FOUND!\n');
  console.log('All internal navigation is correct.\n');
} else {
  console.log(`❌ FOUND ${brokenLinks.length} BROKEN LINKS:\n`);
  
  // Group by source
  const bySource = {};
  for (const link of brokenLinks) {
    if (!bySource[link.source]) bySource[link.source] = [];
    bySource[link.source].push(link);
  }
  
  for (const [source, links] of Object.entries(bySource)) {
    console.log(`📄 ${source}`);
    for (const l of links) {
      console.log(`   ❌ ${l.href}`);
      console.log(`      Expected: ${l.expected}`);
    }
    console.log('');
  }
}

// Check for common SEO issues
console.log(`${'='.repeat(80)}`);
console.log('📊 STATISTICS:');
console.log(`${'='.repeat(80)}`);
console.log(`   • Files scanned: ${htmlFiles.length}`);
console.log(`   • Internal links found: ${linkStats.internal}`);
console.log(`   • Broken links: ${linkStats.broken}`);
console.log(`   • Health: ${((linkStats.internal - linkStats.broken) / linkStats.internal * 100).toFixed(1)}%`);
console.log('');

// Verify critical pages exist
console.log(`${'='.repeat(80)}`);
console.log('✓ CRITICAL PAGES VERIFICATION:');
console.log(`${'='.repeat(80)}`);

const criticalPages = [
  '/index.html',
  '/pricing.html',
  '/contact.html',
  '/automations.html',
  '/booking.html',
  '/services/ecommerce.html',
  '/services/pme.html',
  '/services/flywheel-360.html',
  '/services/voice-ai.html',
  '/services/audit-gratuit.html',
  '/en/index.html',
  '/en/pricing.html',
  '/en/contact.html',
  '/en/services/ecommerce.html',
  '/en/services/smb.html',
  '/en/services/flywheel-360.html',
  '/en/services/voice-ai.html',
  '/en/services/free-audit.html',
];

let allCriticalExist = true;
for (const page of criticalPages) {
  const fullPath = path.join(SITE_ROOT, page);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${page}`);
  if (!exists) allCriticalExist = false;
}

console.log('');

if (allCriticalExist && brokenLinks.length === 0) {
  console.log('🎉 SITE IS HEALTHY - NO 404 ISSUES DETECTED\n');
  process.exit(0);
} else {
  console.log('⚠️  ISSUES FOUND - REVIEW ABOVE\n');
  process.exit(1);
}
