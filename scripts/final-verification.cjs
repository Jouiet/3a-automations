#!/usr/bin/env node
/**
 * FINAL VERIFICATION - Session 117 Fixes
 * Validates all corrections made during this session
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

const results = {
  passed: 0,
  failed: 0,
  checks: []
};

function addResult(name, passed, details = '') {
  results.checks.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// 1. Check 78 vs 86 - No "78" in automation counts
function check78vs86() {
  const files = getAllHtmlFiles(LANDING_DIR);
  let issues = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Pattern: 99 automations or 99 automatisations
    if (/78\s*(automations?|automatisations?)/i.test(content)) {
      issues++;
    }
    // Pattern: display showing 78
    if (/>78<\//.test(content) && content.includes('data-count')) {
      issues++;
    }
  });

  addResult('78 vs 86 Consistency', issues === 0, `${issues} issues found`);
}

// 2. Check no duplicate GTM
function checkDuplicateGTM() {
  const files = getAllHtmlFiles(LANDING_DIR);
  let issues = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lazyGTM = (content.match(/loadGTM\(\)/g) || []).length;
    const inlineGTM = (content.match(/GTM-XXXXXXX/g) || []).length;

    if (lazyGTM > 0 && inlineGTM > 1) {
      issues++;
    }
  });

  addResult('No Duplicate GTM', issues === 0, `${issues} files with duplicate`);
}

// 3. Check sitemap completeness
function checkSitemap() {
  const sitemapPath = path.join(LANDING_DIR, 'sitemap.xml');
  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');

  // Count loc entries
  const urlCount = (sitemap.match(/<loc>/g) || []).length;

  // Count public HTML files (excluding academie, templates)
  let publicFiles = 0;
  getAllHtmlFiles(LANDING_DIR).forEach(file => {
    const rel = path.relative(LANDING_DIR, file);
    if (!rel.includes('academie') && !rel.includes('academy') && !rel.includes('templates')) {
      publicFiles++;
    }
  });

  addResult('Sitemap Completeness', urlCount >= publicFiles - 5, `${urlCount} URLs, ${publicFiles} files`);
}

// 4. Check FAQPage coverage on key pages
function checkFAQPage() {
  const keyPages = [
    'index.html',
    'en/index.html',
    'contact.html',
    'en/contact.html',
    'pricing.html',
    'en/pricing.html',
    'services/ecommerce.html',
    'services/pme.html',
    'services/voice-ai.html'
  ];

  let withFAQ = 0;
  keyPages.forEach(page => {
    const filePath = path.join(LANDING_DIR, page);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (/"@type"\s*:\s*"FAQPage"/i.test(content)) {
        withFAQ++;
      }
    }
  });

  const coverage = Math.round((withFAQ / keyPages.length) * 100);
  addResult('FAQPage Coverage', coverage >= 80, `${coverage}% (${withFAQ}/${keyPages.length})`);
}

// 5. Check BreadcrumbList on service pages
function checkBreadcrumb() {
  const servicePages = [
    'services/ecommerce.html',
    'services/pme.html',
    'services/voice-ai.html',
    'services/audit-gratuit.html',
    'services/flywheel-360.html'
  ];

  let withBreadcrumb = 0;
  servicePages.forEach(page => {
    const filePath = path.join(LANDING_DIR, page);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (/"@type"\s*:\s*"BreadcrumbList"/i.test(content)) {
        withBreadcrumb++;
      }
    }
  });

  addResult('BreadcrumbList Coverage', withBreadcrumb === servicePages.length,
    `${withBreadcrumb}/${servicePages.length} service pages`);
}

// 6. Check Twitter Cards on public pages
function checkTwitterCards() {
  const files = getAllHtmlFiles(LANDING_DIR);
  let withTwitter = 0;
  let publicPages = 0;

  files.forEach(file => {
    const rel = path.relative(LANDING_DIR, file);
    if (rel.includes('academie') || rel.includes('academy')) return;

    publicPages++;
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('twitter:card')) {
      withTwitter++;
    }
  });

  const coverage = Math.round((withTwitter / publicPages) * 100);
  addResult('Twitter Cards', coverage >= 90, `${coverage}% (${withTwitter}/${publicPages})`);
}

// 7. Check Enterprise Footer (Academy link + Trust badges)
function checkEnterpriseFooter() {
  const files = getAllHtmlFiles(LANDING_DIR);
  let withAcademy = 0;
  let withTrustBadges = 0;
  let footerPages = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('footer-grid-ultra')) {
      footerPages++;
      if (content.includes('academie.html') || content.includes('academy.html')) {
        withAcademy++;
      }
      if (content.includes('trust-badge')) {
        withTrustBadges++;
      }
    }
  });

  addResult('Enterprise Footer (Academy Link)', withAcademy === footerPages,
    `${withAcademy}/${footerPages} pages`);
  addResult('Enterprise Footer (Trust Badges)', withTrustBadges === footerPages,
    `${withTrustBadges}/${footerPages} pages`);
}

// 8. Check no duplicate Voice Widget
function checkDuplicateVoiceWidget() {
  const files = getAllHtmlFiles(LANDING_DIR);
  let issues = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const voiceWidgetCount = (content.match(/voice-widget\.min\.js/g) || []).length;
    if (voiceWidgetCount > 1) {
      issues++;
    }
  });

  addResult('No Duplicate Voice Widget', issues === 0, `${issues} files with duplicate`);
}

// 9. Check HTML validity (no duplicate class attributes)
function checkHTMLValidity() {
  const files = getAllHtmlFiles(LANDING_DIR);
  let issues = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Pattern: class="..." class="..." (duplicate attribute)
    if (/class="[^"]*"\s+class="[^"]*"/.test(content)) {
      issues++;
    }
  });

  addResult('HTML Validity (No Duplicate Classes)', issues === 0, `${issues} files with issues`);
}

// Helper: Get all HTML files recursively
function getAllHtmlFiles(dir) {
  const files = [];

  function scan(d) {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(item => {
      const fullPath = path.join(d, item);
      const stat = fs.statSync(fullPath);
      if (item.startsWith('.') || item === 'node_modules') return;
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    });
  }

  scan(dir);
  return files;
}

// Main
console.log('=' .repeat(70));
console.log('FINAL VERIFICATION - Session 117 Fixes');
console.log('=' .repeat(70));
console.log('');

check78vs86();
checkDuplicateGTM();
checkSitemap();
checkFAQPage();
checkBreadcrumb();
checkTwitterCards();
checkEnterpriseFooter();
checkDuplicateVoiceWidget();
checkHTMLValidity();

console.log('RESULTS:');
console.log('-'.repeat(70));

results.checks.forEach(check => {
  const status = check.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${check.name.padEnd(40)} | ${check.details}`);
});

console.log('-'.repeat(70));
console.log(`\nTOTAL: ${results.passed}/${results.checks.length} checks passed`);

const allPassed = results.failed === 0;
if (allPassed) {
  console.log('\n🎉 ALL CHECKS PASSED - Session 117 fixes verified!');
} else {
  console.log(`\n⚠️  ${results.failed} check(s) failed - review required`);
}

console.log('=' .repeat(70));

// Save results
const outputPath = path.join(__dirname, '..', 'outputs', 'final-verification-session117.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  session: 117,
  ...results
}, null, 2));
console.log(`\nResults saved: ${outputPath}`);

process.exit(allPassed ? 0 : 1);
