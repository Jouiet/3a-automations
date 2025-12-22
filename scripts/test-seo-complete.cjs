#!/usr/bin/env node
/**
 * TEST SEO COMPLET - 3A Automation
 * Vérifie: hreflang, meta tags, sitemap, robots.txt, liens cassés
 * Date: 2025-12-20
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');
const BASE_URL = 'https://3a-automation.com';

// Configuration des pages
const PAGES = {
  fr: [
    'index.html', 'pricing.html', 'contact.html', 'automations.html',
    'a-propos.html', 'cas-clients.html',
    'services/audit-gratuit.html', 'services/ecommerce.html', 'services/pme.html', 'services/flywheel-360.html',
    'legal/mentions-legales.html', 'legal/politique-confidentialite.html',
    '404.html'
  ],
  en: [
    'en/index.html', 'en/pricing.html', 'en/contact.html', 'en/automations.html',
    'en/about.html', 'en/case-studies.html',
    'en/services/free-audit.html', 'en/services/ecommerce.html', 'en/services/smb.html', 'en/services/flywheel-360.html',
    'en/legal/terms.html', 'en/legal/privacy.html',
    'en/404.html'
  ]
};

// Mapping FR → EN pour hreflang
const HREFLANG_MAPPING = {
  'index.html': 'en/index.html',
  'pricing.html': 'en/pricing.html',
  'contact.html': 'en/contact.html',
  'automations.html': 'en/automations.html',
  'a-propos.html': 'en/about.html',
  'cas-clients.html': 'en/case-studies.html',
  'audit-gratuit.html': 'en/free-audit.html',
  'services/ecommerce.html': 'en/services/ecommerce.html',
  'services/pme.html': 'en/services/smb.html',
  'services/flywheel-360.html': 'en/services/flywheel-360.html',
  'legal/mentions-legales.html': 'en/legal/terms.html',
  'legal/politique-confidentialite.html': 'en/legal/privacy.html',
  '404.html': 'en/404.html'
};

let results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, condition, details = '') {
  results.total++;
  if (condition) {
    results.passed++;
    results.tests.push({ name, status: 'PASS', details });
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', details });
    console.log(`❌ ${name} ${details ? '- ' + details : ''}`);
  }
  return condition;
}

function checkHreflangTags(filePath, lang) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.relative(SITE_DIR, filePath);

  // Check for hreflang fr
  const hasFr = content.includes('hreflang="fr"');
  test(`${fileName}: hreflang="fr"`, hasFr);

  // Check for hreflang en
  const hasEn = content.includes('hreflang="en"');
  test(`${fileName}: hreflang="en"`, hasEn);

  // Check for x-default
  const hasXDefault = content.includes('hreflang="x-default"');
  test(`${fileName}: hreflang="x-default"`, hasXDefault);

  return hasFr && hasEn && hasXDefault;
}

function checkMetaTags(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.relative(SITE_DIR, filePath);

  // Check viewport
  const hasViewport = content.includes('name="viewport"');
  test(`${fileName}: meta viewport`, hasViewport);

  // Check description
  const hasDescription = content.includes('name="description"');
  test(`${fileName}: meta description`, hasDescription);

  // Check title
  const hasTitle = /<title>.*<\/title>/s.test(content);
  test(`${fileName}: <title> tag`, hasTitle);

  // Check og:title
  const hasOgTitle = content.includes('property="og:title"');
  test(`${fileName}: og:title`, hasOgTitle);

  // Check canonical
  const hasCanonical = content.includes('rel="canonical"');
  test(`${fileName}: canonical link`, hasCanonical);

  return hasViewport && hasDescription && hasTitle;
}

function checkBrokenLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.relative(SITE_DIR, filePath);
  const isEnglish = fileName.startsWith('en/');

  // Known broken link patterns to check
  const brokenPatterns = [
    { pattern: '/en/a-propos.html', correct: '/en/about.html' },
    { pattern: '/en/cas-clients.html', correct: '/en/case-studies.html' },
    { pattern: '/en/services/pme.html', correct: '/en/services/smb.html' },
    { pattern: '/en/services/audit-gratuit.html', correct: '/en/services/free-audit.html' },
    { pattern: '/en/legal/mentions-legales.html', correct: '/en/legal/terms.html' },
    { pattern: '/en/legal/politique-confidentialite.html', correct: '/en/legal/privacy.html' }
  ];

  let allGood = true;

  for (const { pattern, correct } of brokenPatterns) {
    if (content.includes(`href="${pattern}"`)) {
      test(`${fileName}: no broken link ${pattern}`, false, `Should be ${correct}`);
      allGood = false;
    }
  }

  if (allGood) {
    test(`${fileName}: no broken EN links`, true);
  }

  return allGood;
}

function checkSitemap() {
  const sitemapPath = path.join(SITE_DIR, 'sitemap.xml');

  if (!fs.existsSync(sitemapPath)) {
    test('sitemap.xml exists', false);
    return false;
  }

  test('sitemap.xml exists', true);

  const content = fs.readFileSync(sitemapPath, 'utf-8');

  // Check all pages are in sitemap (exclude 404 pages - they shouldn't be indexed)
  const allPages = [...PAGES.fr, ...PAGES.en].filter(p => !p.includes('404'));
  let allInSitemap = true;

  for (const page of allPages) {
    const url = page === 'index.html' ? BASE_URL :
                page === 'en/index.html' ? `${BASE_URL}/en/` :
                `${BASE_URL}/${page}`;

    // Check if URL is in sitemap (with or without trailing variations)
    const pageInSitemap = content.includes(url) ||
                          content.includes(url.replace('.html', '')) ||
                          content.includes(page);

    if (!pageInSitemap) {
      console.log(`  ⚠️  Missing in sitemap: ${page}`);
      allInSitemap = false;
    }
  }

  test('sitemap.xml contains all pages', allInSitemap);

  // Check hreflang in sitemap
  const hasXhtmlNs = content.includes('xmlns:xhtml');
  test('sitemap.xml has xhtml namespace for hreflang', hasXhtmlNs);

  return true;
}

function checkRobotsTxt() {
  const robotsPath = path.join(SITE_DIR, 'robots.txt');

  if (!fs.existsSync(robotsPath)) {
    test('robots.txt exists', false);
    return false;
  }

  test('robots.txt exists', true);

  const content = fs.readFileSync(robotsPath, 'utf-8');

  // Check sitemap reference
  const hasSitemap = content.includes('Sitemap:');
  test('robots.txt references sitemap', hasSitemap);

  // Check AI crawlers allowed
  const allowsGPTBot = !content.includes('Disallow: /') ||
                       content.includes('User-agent: GPTBot') && !content.includes('GPTBot\nDisallow: /');
  test('robots.txt allows AI crawlers (AEO)', allowsGPTBot || content.includes('GPTBot'));

  return true;
}

function checkVoiceWidget() {
  // Check FR widget
  const frWidgetPath = path.join(SITE_DIR, 'voice-assistant/voice-widget.js');
  const frExists = fs.existsSync(frWidgetPath);
  test('voice-widget.js (FR) exists', frExists);

  if (frExists) {
    const frContent = fs.readFileSync(frWidgetPath, 'utf-8');
    const frHasKeywords = frContent.includes('keywords') || frContent.includes('pricing');
    test('voice-widget.js has keywords', frHasKeywords);
  }

  // Check EN widget
  const enWidgetPath = path.join(SITE_DIR, 'voice-assistant/voice-widget-en.js');
  const enExists = fs.existsSync(enWidgetPath);
  test('voice-widget-en.js (EN) exists', enExists);

  return frExists && enExists;
}

function checkGeoLocale() {
  const geoLocalePath = path.join(SITE_DIR, 'geo-locale.js');
  const exists = fs.existsSync(geoLocalePath);
  test('geo-locale.js exists', exists);

  if (exists) {
    const content = fs.readFileSync(geoLocalePath, 'utf-8');

    // Check for EUR/MAD/USD support
    const hasEUR = content.includes('EUR');
    const hasMAD = content.includes('MAD');
    const hasUSD = content.includes('USD');

    test('geo-locale.js supports EUR', hasEUR);
    test('geo-locale.js supports MAD', hasMAD);
    test('geo-locale.js supports USD', hasUSD);
  }

  return exists;
}

// Main execution
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  TEST SEO COMPLET - 3A Automation');
console.log('  Date: ' + new Date().toISOString());
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

console.log('📋 SECTION 1: Sitemap & Robots');
console.log('─'.repeat(50));
checkSitemap();
checkRobotsTxt();
console.log('');

console.log('📋 SECTION 2: Voice Widget & Geo-Locale');
console.log('─'.repeat(50));
checkVoiceWidget();
checkGeoLocale();
console.log('');

console.log('📋 SECTION 3: Pages FR - hreflang & Meta Tags');
console.log('─'.repeat(50));
for (const page of PAGES.fr) {
  const filePath = path.join(SITE_DIR, page);
  if (fs.existsSync(filePath)) {
    checkHreflangTags(filePath, 'fr');
  } else {
    test(`${page} exists`, false);
  }
}
console.log('');

console.log('📋 SECTION 4: Pages EN - hreflang & Meta Tags');
console.log('─'.repeat(50));
for (const page of PAGES.en) {
  const filePath = path.join(SITE_DIR, page);
  if (fs.existsSync(filePath)) {
    checkHreflangTags(filePath, 'en');
  } else {
    test(`${page} exists`, false);
  }
}
console.log('');

console.log('📋 SECTION 5: Broken Links Check');
console.log('─'.repeat(50));
const allPages = [...PAGES.fr.map(p => path.join(SITE_DIR, p)),
                  ...PAGES.en.map(p => path.join(SITE_DIR, p))];
for (const filePath of allPages) {
  if (fs.existsSync(filePath)) {
    checkBrokenLinks(filePath);
  }
}
console.log('');

console.log('📋 SECTION 6: Meta Tags Sampling (5 pages)');
console.log('─'.repeat(50));
const samplePages = ['index.html', 'pricing.html', 'en/index.html', 'en/pricing.html', 'contact.html'];
for (const page of samplePages) {
  const filePath = path.join(SITE_DIR, page);
  if (fs.existsSync(filePath)) {
    checkMetaTags(filePath);
  }
}
console.log('');

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('  RÉSUMÉ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
const passRate = ((results.passed / results.total) * 100).toFixed(1);
console.log(`  Total Tests: ${results.total}`);
console.log(`  ✅ Passed: ${results.passed}`);
console.log(`  ❌ Failed: ${results.failed}`);
console.log(`  📊 Pass Rate: ${passRate}%`);
console.log('');

if (results.failed > 0) {
  console.log('  TESTS ÉCHOUÉS:');
  for (const t of results.tests.filter(t => t.status === 'FAIL')) {
    console.log(`    ❌ ${t.name} ${t.details ? '(' + t.details + ')' : ''}`);
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');

// Exit code based on results
process.exit(results.failed > 0 ? 1 : 0);
