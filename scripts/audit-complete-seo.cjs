#!/usr/bin/env node
/**
 * Complete SEO Audit Script
 * Checks: Navigation, hreflang, canonical, meta, links
 */

const fs = require('fs');
const path = require('path');

const SITE_ROOT = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';
const DOMAIN = 'https://3a-automation.com';

// Get all HTML files
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

const issues = {
  missingMeta: [],
  missingCanonical: [],
  missingHreflang: [],
  brokenHreflang: [],
  missingTitle: [],
  duplicateIds: [],
  emptyLinks: [],
  navInconsistencies: []
};

const htmlFiles = getAllHtmlFiles(SITE_ROOT);

console.log(`\n${'='.repeat(80)}`);
console.log('🔍 COMPLETE SEO AUDIT REPORT');
console.log(`${'='.repeat(80)}`);
console.log(`\nAnalyzing ${htmlFiles.length} HTML files...\n`);

// Define expected navigation structure
const expectedNavFR = [
  { href: '/services/ecommerce.html', text: 'E-commerce' },
  { href: '/services/pme.html', text: 'PME' },
  { href: '/services/flywheel-360.html', text: 'Flywheel' },
  { href: '/services/voice-ai.html', text: 'Voice AI' },
  { href: '/pricing.html', text: 'Tarifs' },
  { href: '/automations.html', text: 'Automations' },
  { href: '/contact.html', text: 'Contact' },
];

const expectedNavEN = [
  { href: '/en/services/ecommerce.html', text: 'E-commerce' },
  { href: '/en/services/smb.html', text: 'SMB' },
  { href: '/en/services/flywheel-360.html', text: 'Flywheel' },
  { href: '/en/services/voice-ai.html', text: 'Voice AI' },
  { href: '/en/pricing.html', text: 'Pricing' },
  { href: '/en/automations.html', text: 'Automations' },
  { href: '/en/contact.html', text: 'Contact' },
];

for (const file of htmlFiles) {
  const relativePath = file.replace(SITE_ROOT, '');
  const content = fs.readFileSync(file, 'utf8');
  const isEnglish = relativePath.startsWith('/en/');
  
  // 1. Check for title tag
  if (!/<title[^>]*>([^<]+)<\/title>/i.test(content)) {
    issues.missingTitle.push(relativePath);
  }
  
  // 2. Check for meta description
  if (!/<meta\s+name=["']description["'][^>]*>/i.test(content) && 
      !/<meta\s+content=["'][^"']*["']\s+name=["']description["']/i.test(content)) {
    issues.missingMeta.push(relativePath);
  }
  
  // 3. Check for canonical
  if (!/<link\s+rel=["']canonical["'][^>]*>/i.test(content)) {
    issues.missingCanonical.push(relativePath);
  }
  
  // 4. Check for hreflang (skip 404 pages)
  if (!relativePath.includes('404')) {
    const hasHreflangFr = /hreflang=["']fr["']/i.test(content);
    const hasHreflangEn = /hreflang=["']en["']/i.test(content);
    
    if (!hasHreflangFr || !hasHreflangEn) {
      issues.missingHreflang.push({ file: relativePath, fr: hasHreflangFr, en: hasHreflangEn });
    }
  }
  
  // 5. Check for empty href
  const emptyHrefMatches = content.match(/href=["']\s*["']/g);
  if (emptyHrefMatches) {
    issues.emptyLinks.push({ file: relativePath, count: emptyHrefMatches.length });
  }
  
  // 6. Check navigation consistency (main pages only)
  if (!relativePath.includes('/academie/') && 
      !relativePath.includes('/academy/') && 
      !relativePath.includes('/blog/') &&
      !relativePath.includes('/legal/') &&
      !relativePath.includes('404')) {
    
    const expectedNav = isEnglish ? expectedNavEN : expectedNavFR;
    const missingNavItems = [];
    
    for (const item of expectedNav) {
      // Check if this nav item exists in the page
      const hrefPattern = new RegExp(`href=["']${item.href.replace(/\//g, '\\/')}["']`, 'i');
      if (!hrefPattern.test(content)) {
        missingNavItems.push(item.href);
      }
    }
    
    if (missingNavItems.length > 0) {
      issues.navInconsistencies.push({ file: relativePath, missing: missingNavItems });
    }
  }
}

// Print results
console.log('\n📋 AUDIT RESULTS:\n');

// Missing titles
if (issues.missingTitle.length > 0) {
  console.log(`❌ MISSING <title> TAG (${issues.missingTitle.length}):`);
  issues.missingTitle.forEach(f => console.log(`   ${f}`));
  console.log('');
} else {
  console.log('✅ All pages have <title> tags');
}

// Missing meta descriptions
if (issues.missingMeta.length > 0) {
  console.log(`\n❌ MISSING META DESCRIPTION (${issues.missingMeta.length}):`);
  issues.missingMeta.forEach(f => console.log(`   ${f}`));
} else {
  console.log('✅ All pages have meta descriptions');
}

// Missing canonical
if (issues.missingCanonical.length > 0) {
  console.log(`\n❌ MISSING CANONICAL (${issues.missingCanonical.length}):`);
  issues.missingCanonical.forEach(f => console.log(`   ${f}`));
} else {
  console.log('✅ All pages have canonical URLs');
}

// Missing hreflang
if (issues.missingHreflang.length > 0) {
  console.log(`\n⚠️  INCOMPLETE HREFLANG (${issues.missingHreflang.length}):`);
  issues.missingHreflang.forEach(h => {
    console.log(`   ${h.file}`);
    console.log(`      FR: ${h.fr ? '✓' : '✗'}  EN: ${h.en ? '✓' : '✗'}`);
  });
} else {
  console.log('✅ All pages have proper hreflang tags');
}

// Empty links
if (issues.emptyLinks.length > 0) {
  console.log(`\n⚠️  EMPTY HREF ATTRIBUTES (${issues.emptyLinks.length} files):`);
  issues.emptyLinks.forEach(e => console.log(`   ${e.file}: ${e.count} empty href(s)`));
} else {
  console.log('✅ No empty href attributes');
}

// Navigation inconsistencies
if (issues.navInconsistencies.length > 0) {
  console.log(`\n⚠️  NAVIGATION INCONSISTENCIES (${issues.navInconsistencies.length}):`);
  issues.navInconsistencies.forEach(n => {
    console.log(`   ${n.file}`);
    n.missing.forEach(m => console.log(`      Missing: ${m}`));
  });
} else {
  console.log('✅ Navigation is consistent across pages');
}

// Summary
const totalIssues = issues.missingTitle.length + issues.missingMeta.length + 
                    issues.missingCanonical.length + issues.missingHreflang.length +
                    issues.emptyLinks.length;

console.log(`\n${'='.repeat(80)}`);
console.log('\n📊 SUMMARY:');
console.log(`   • Files analyzed: ${htmlFiles.length}`);
console.log(`   • Critical issues: ${issues.missingTitle.length + issues.missingMeta.length + issues.missingCanonical.length}`);
console.log(`   • Warnings: ${issues.missingHreflang.length + issues.emptyLinks.length + issues.navInconsistencies.length}`);
console.log('');

process.exit(totalIssues > 0 ? 1 : 0);
