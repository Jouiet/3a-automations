#!/usr/bin/env node
/**
 * FORENSIC AUDIT SESSION 132 - ULTRA COMPREHENSIVE
 * Date: 2026-01-03
 * Analyzes ALL frontend aspects with empirical verification
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const LANDING_DIR = path.join(__dirname, '../landing-page-hostinger');
const BASE_URL = 'https://3a-automation.com';

const results = {
  timestamp: new Date().toISOString(),
  session: 132,
  categories: {},
  scores: {},
  issues: {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: []
  },
  summary: {}
};

// Utility functions
function addIssue(severity, category, issue, details = '') {
  results.issues[severity].push({ category, issue, details });
}

function getFiles(dir, ext) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { recursive: true });
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isFile() && fullPath.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

async function fetchUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data,
        url
      }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message, url }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout', url }); });
  });
}

// ========== PHASE 1: PAGE STRUCTURE ==========
function auditPageStructure() {
  console.log('\n📁 PHASE 1: PAGE STRUCTURE AUDIT');
  const htmlFiles = getFiles(LANDING_DIR, '.html');

  const pages = {
    total: htmlFiles.length,
    fr: htmlFiles.filter(f => !f.includes('/en/')).length,
    en: htmlFiles.filter(f => f.includes('/en/')).length,
    services: htmlFiles.filter(f => f.includes('/services/')).length,
    blog: htmlFiles.filter(f => f.includes('/blog/')).length,
    academy: htmlFiles.filter(f => f.includes('/academ')).length,
    legal: htmlFiles.filter(f => f.includes('/legal/')).length
  };

  results.categories.pageStructure = {
    totalPages: pages.total,
    frenchPages: pages.fr,
    englishPages: pages.en,
    servicePages: pages.services,
    blogPages: pages.blog,
    academyPages: pages.academy,
    legalPages: pages.legal,
    files: htmlFiles.map(f => f.replace(LANDING_DIR + '/', ''))
  };

  // Check FR/EN parity
  const frPages = htmlFiles.filter(f => !f.includes('/en/')).map(f => {
    return f.replace(LANDING_DIR + '/', '').replace('.html', '');
  });
  const enPages = htmlFiles.filter(f => f.includes('/en/')).map(f => {
    return f.replace(LANDING_DIR + '/en/', '').replace('.html', '');
  });

  const frOnly = frPages.filter(p => !enPages.includes(p.replace('services/pme', 'services/smb').replace('mentions-legales', 'terms').replace('politique-confidentialite', 'privacy').replace('academie', 'academy').replace('a-propos', 'about').replace('cas-clients', 'case-studies').replace('investisseurs', 'investors')));
  const enOnly = enPages.filter(p => !frPages.map(fp => fp.replace('services/pme', 'services/smb').replace('mentions-legales', 'terms').replace('politique-confidentialite', 'privacy').replace('academie', 'academy').replace('a-propos', 'about').replace('cas-clients', 'case-studies').replace('investisseurs', 'investors')).includes(p));

  if (frOnly.length > 0) {
    addIssue('medium', 'i18n', 'Pages FR sans equivalent EN', frOnly.join(', '));
  }
  if (enOnly.length > 0) {
    addIssue('medium', 'i18n', 'Pages EN sans equivalent FR', enOnly.join(', '));
  }

  console.log(`   Total: ${pages.total} | FR: ${pages.fr} | EN: ${pages.en}`);
  return pages;
}

// ========== PHASE 2: SEO/META AUDIT ==========
function auditSEO() {
  console.log('\n🔍 PHASE 2: SEO/META AUDIT');
  const htmlFiles = getFiles(LANDING_DIR, '.html');

  const seoResults = {
    metaDescription: { pass: 0, fail: 0, missing: [] },
    metaRobots: { pass: 0, fail: 0, missing: [] },
    canonical: { pass: 0, fail: 0, missing: [] },
    ogTags: { pass: 0, fail: 0, missing: [] },
    twitterCard: { pass: 0, fail: 0, missing: [] },
    hreflang: { pass: 0, fail: 0, missing: [] },
    xDefault: { pass: 0, fail: 0, missing: [] },
    title: { pass: 0, fail: 0, missing: [], issues: [] },
    h1: { pass: 0, fail: 0, missing: [], multiple: [] },
    structuredData: { pass: 0, fail: 0, missing: [] }
  };

  for (const file of htmlFiles) {
    const relativePath = file.replace(LANDING_DIR + '/', '');
    const content = fs.readFileSync(file, 'utf8');

    // Meta description
    if (/<meta\s+name=["']description["'][^>]*content=["'][^"']+["']/i.test(content)) {
      seoResults.metaDescription.pass++;
    } else {
      seoResults.metaDescription.fail++;
      seoResults.metaDescription.missing.push(relativePath);
    }

    // Meta robots
    if (/<meta\s+name=["']robots["'][^>]*content=["'][^"']+["']/i.test(content)) {
      seoResults.metaRobots.pass++;
    } else {
      seoResults.metaRobots.fail++;
      seoResults.metaRobots.missing.push(relativePath);
    }

    // Canonical
    if (/<link\s+rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(content)) {
      seoResults.canonical.pass++;
    } else {
      seoResults.canonical.fail++;
      seoResults.canonical.missing.push(relativePath);
    }

    // Open Graph
    const hasOgTitle = /<meta\s+property=["']og:title["']/i.test(content);
    const hasOgDesc = /<meta\s+property=["']og:description["']/i.test(content);
    const hasOgImage = /<meta\s+property=["']og:image["']/i.test(content);
    const hasOgUrl = /<meta\s+property=["']og:url["']/i.test(content);
    if (hasOgTitle && hasOgDesc && hasOgImage && hasOgUrl) {
      seoResults.ogTags.pass++;
    } else {
      seoResults.ogTags.fail++;
      const missing = [];
      if (!hasOgTitle) missing.push('og:title');
      if (!hasOgDesc) missing.push('og:description');
      if (!hasOgImage) missing.push('og:image');
      if (!hasOgUrl) missing.push('og:url');
      seoResults.ogTags.missing.push(`${relativePath} (missing: ${missing.join(', ')})`);
    }

    // Twitter Card
    const hasTwitterCard = /<meta\s+name=["']twitter:card["']/i.test(content);
    const hasTwitterTitle = /<meta\s+name=["']twitter:title["']/i.test(content);
    const hasTwitterDesc = /<meta\s+name=["']twitter:description["']/i.test(content);
    if (hasTwitterCard && hasTwitterTitle && hasTwitterDesc) {
      seoResults.twitterCard.pass++;
    } else {
      seoResults.twitterCard.fail++;
      seoResults.twitterCard.missing.push(relativePath);
    }

    // Hreflang
    if (/<link\s+rel=["']alternate["'][^>]*hreflang=["'][^"']+["']/i.test(content)) {
      seoResults.hreflang.pass++;
    } else {
      seoResults.hreflang.fail++;
      seoResults.hreflang.missing.push(relativePath);
    }

    // x-default
    if (/hreflang=["']x-default["']/i.test(content)) {
      seoResults.xDefault.pass++;
    } else {
      seoResults.xDefault.fail++;
      seoResults.xDefault.missing.push(relativePath);
    }

    // Title tag
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      seoResults.title.pass++;
      const titleLen = titleMatch[1].length;
      if (titleLen > 60) {
        seoResults.title.issues.push(`${relativePath}: ${titleLen} chars (>60)`);
      }
    } else {
      seoResults.title.fail++;
      seoResults.title.missing.push(relativePath);
    }

    // H1 tag
    const h1Matches = content.match(/<h1[^>]*>/gi) || [];
    if (h1Matches.length === 1) {
      seoResults.h1.pass++;
    } else if (h1Matches.length === 0) {
      seoResults.h1.fail++;
      seoResults.h1.missing.push(relativePath);
    } else {
      seoResults.h1.pass++;
      seoResults.h1.multiple.push(`${relativePath}: ${h1Matches.length} H1s`);
    }

    // Structured Data (Schema.org)
    if (/type=["']application\/ld\+json["']/i.test(content)) {
      seoResults.structuredData.pass++;
    } else {
      seoResults.structuredData.fail++;
      seoResults.structuredData.missing.push(relativePath);
    }
  }

  results.categories.seo = seoResults;

  // Log issues
  if (seoResults.metaDescription.missing.length > 0) {
    addIssue('high', 'SEO', 'Pages missing meta description', seoResults.metaDescription.missing.join(', '));
  }
  if (seoResults.canonical.missing.length > 0) {
    addIssue('high', 'SEO', 'Pages missing canonical URL', seoResults.canonical.missing.join(', '));
  }
  if (seoResults.ogTags.missing.length > 0) {
    addIssue('medium', 'SEO', 'Pages with incomplete OG tags', seoResults.ogTags.missing.slice(0, 5).join('; '));
  }
  if (seoResults.h1.missing.length > 0) {
    addIssue('high', 'SEO', 'Pages missing H1', seoResults.h1.missing.join(', '));
  }
  if (seoResults.h1.multiple.length > 0) {
    addIssue('medium', 'SEO', 'Pages with multiple H1s', seoResults.h1.multiple.join(', '));
  }
  if (seoResults.structuredData.missing.length > 0) {
    addIssue('medium', 'SEO', 'Pages without Schema.org', seoResults.structuredData.missing.slice(0, 5).join(', '));
  }

  // Calculate score
  const total = htmlFiles.length;
  const metaScore = Math.round((seoResults.metaDescription.pass / total) * 100);
  const ogScore = Math.round((seoResults.ogTags.pass / total) * 100);
  const schemaScore = Math.round((seoResults.structuredData.pass / total) * 100);

  console.log(`   Meta descriptions: ${seoResults.metaDescription.pass}/${total} (${metaScore}%)`);
  console.log(`   OG tags complete: ${seoResults.ogTags.pass}/${total} (${ogScore}%)`);
  console.log(`   Schema.org: ${seoResults.structuredData.pass}/${total} (${schemaScore}%)`);

  results.scores.seo = Math.round((metaScore + ogScore + schemaScore) / 3);
  return seoResults;
}

// ========== PHASE 3: SCHEMA.ORG DEEP AUDIT ==========
function auditSchemaOrg() {
  console.log('\n📊 PHASE 3: SCHEMA.ORG DEEP AUDIT');
  const htmlFiles = getFiles(LANDING_DIR, '.html');

  const schemaTypes = {
    Organization: 0,
    FAQPage: 0,
    BreadcrumbList: 0,
    SoftwareApplication: 0,
    Service: 0,
    Product: 0,
    Offer: 0,
    Article: 0,
    BlogPosting: 0,
    WebPage: 0,
    WebSite: 0,
    HowTo: 0,
    LocalBusiness: 0,
    Person: 0
  };

  const faqPages = [];
  const breadcrumbPages = [];
  const servicePages = [];

  for (const file of htmlFiles) {
    const relativePath = file.replace(LANDING_DIR + '/', '');
    const content = fs.readFileSync(file, 'utf8');

    // Extract JSON-LD blocks
    const jsonLdMatches = content.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

    for (const match of jsonLdMatches) {
      const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const data = JSON.parse(jsonContent);
        const types = [];

        // Handle @graph or single type
        if (data['@graph']) {
          for (const item of data['@graph']) {
            if (item['@type']) types.push(item['@type']);
          }
        } else if (data['@type']) {
          types.push(data['@type']);
        }

        for (const type of types) {
          if (schemaTypes.hasOwnProperty(type)) {
            schemaTypes[type]++;
          }
          if (type === 'FAQPage') faqPages.push(relativePath);
          if (type === 'BreadcrumbList') breadcrumbPages.push(relativePath);
          if (type === 'Service') servicePages.push(relativePath);
        }
      } catch (e) {
        addIssue('high', 'Schema', `Invalid JSON-LD in ${relativePath}`, e.message);
      }
    }
  }

  results.categories.schemaOrg = {
    types: schemaTypes,
    faqPages: faqPages,
    breadcrumbPages: breadcrumbPages,
    servicePages: servicePages
  };

  // Check for missing FAQPage on key pages
  const keyPagesNeedingFAQ = [
    'pricing.html', 'en/pricing.html',
    'contact.html', 'en/contact.html',
    'services/ecommerce.html', 'en/services/ecommerce.html'
  ];
  const missingFAQ = keyPagesNeedingFAQ.filter(p => !faqPages.includes(p));
  if (missingFAQ.length > 0) {
    addIssue('medium', 'Schema', 'Key pages missing FAQPage schema', missingFAQ.join(', '));
  }

  // Check for missing BreadcrumbList on services
  const serviceFiles = htmlFiles.filter(f => f.includes('/services/'));
  const serviceFilesRelative = serviceFiles.map(f => f.replace(LANDING_DIR + '/', ''));
  const missingBreadcrumb = serviceFilesRelative.filter(p => !breadcrumbPages.includes(p));
  if (missingBreadcrumb.length > 0) {
    addIssue('low', 'Schema', 'Service pages missing BreadcrumbList', missingBreadcrumb.join(', '));
  }

  console.log(`   FAQPage: ${schemaTypes.FAQPage} pages`);
  console.log(`   BreadcrumbList: ${schemaTypes.BreadcrumbList} pages`);
  console.log(`   Organization: ${schemaTypes.Organization} pages`);

  return schemaTypes;
}

// ========== PHASE 4: SECURITY HEADERS ==========
async function auditSecurity() {
  console.log('\n🔒 PHASE 4: SECURITY AUDIT');

  const res = await fetchUrl(BASE_URL);
  if (res.status !== 200) {
    addIssue('critical', 'Security', 'Cannot reach site', `Status: ${res.status}`);
    return {};
  }

  const headers = res.headers;
  const security = {
    https: res.url.startsWith('https'),
    hsts: !!headers['strict-transport-security'],
    hstsPreload: headers['strict-transport-security']?.includes('preload'),
    csp: !!headers['content-security-policy'],
    xFrameOptions: !!headers['x-frame-options'],
    xContentTypeOptions: !!headers['x-content-type-options'],
    xXssProtection: !!headers['x-xss-protection'],
    referrerPolicy: !!headers['referrer-policy'],
    permissionsPolicy: !!headers['permissions-policy'],
    server: headers['server'] || 'Not disclosed'
  };

  results.categories.security = {
    headers: security,
    rawHeaders: headers
  };

  // Issues
  if (!security.csp) {
    addIssue('high', 'Security', 'Missing Content-Security-Policy header', 'CSP prevents XSS and injection attacks');
  }
  if (!security.hsts) {
    addIssue('high', 'Security', 'Missing HSTS header');
  } else if (!security.hstsPreload) {
    addIssue('low', 'Security', 'HSTS not in preload list');
  }
  if (!security.xFrameOptions) {
    addIssue('medium', 'Security', 'Missing X-Frame-Options header');
  }
  if (!security.xContentTypeOptions) {
    addIssue('medium', 'Security', 'Missing X-Content-Type-Options header');
  }

  // Check for exposed server version
  if (headers['server'] && /\d+\.\d+/.test(headers['server'])) {
    addIssue('low', 'Security', 'Server version exposed', headers['server']);
  }

  // Calculate score
  const securityChecks = [
    security.https, security.hsts, security.csp, security.xFrameOptions,
    security.xContentTypeOptions, security.xXssProtection, security.referrerPolicy
  ];
  const securityScore = Math.round((securityChecks.filter(Boolean).length / securityChecks.length) * 100);
  results.scores.security = securityScore;

  console.log(`   HTTPS: ${security.https ? '✅' : '❌'}`);
  console.log(`   HSTS: ${security.hsts ? '✅' : '❌'} ${security.hstsPreload ? '(preload)' : ''}`);
  console.log(`   CSP: ${security.csp ? '✅' : '❌ MISSING'}`);
  console.log(`   X-Frame-Options: ${security.xFrameOptions ? '✅' : '❌'}`);
  console.log(`   Score: ${securityScore}%`);

  return security;
}

// ========== PHASE 5: ACCESSIBILITY ==========
function auditAccessibility() {
  console.log('\n♿ PHASE 5: ACCESSIBILITY AUDIT');
  const htmlFiles = getFiles(LANDING_DIR, '.html');

  const a11y = {
    skipLinks: { pass: 0, fail: 0, missing: [] },
    altText: { pass: 0, fail: 0, missingAlt: [] },
    formLabels: { pass: 0, fail: 0, issues: [] },
    langAttribute: { pass: 0, fail: 0, missing: [] },
    ariaLandmarks: { pass: 0, fail: 0, missing: [] },
    headingOrder: { pass: 0, fail: 0, issues: [] },
    contrastIssues: [],
    focusIndicators: { pass: 0, fail: 0 }
  };

  for (const file of htmlFiles) {
    const relativePath = file.replace(LANDING_DIR + '/', '');
    const content = fs.readFileSync(file, 'utf8');

    // Skip links
    if (/skip[- ]?(to[- ]?)?(main|content|nav)/i.test(content)) {
      a11y.skipLinks.pass++;
    } else {
      a11y.skipLinks.fail++;
      a11y.skipLinks.missing.push(relativePath);
    }

    // Alt text on images
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    let hasAllAlt = true;
    for (const img of imgTags) {
      if (!/alt=["'][^"']*["']/i.test(img) && !/alt=""/i.test(img)) {
        hasAllAlt = false;
        const src = img.match(/src=["']([^"']+)["']/i);
        a11y.altText.missingAlt.push(`${relativePath}: ${src ? src[1] : 'unknown'}`);
      }
    }
    if (hasAllAlt) {
      a11y.altText.pass++;
    } else {
      a11y.altText.fail++;
    }

    // Lang attribute
    if (/<html[^>]*lang=["'][^"']+["']/i.test(content)) {
      a11y.langAttribute.pass++;
    } else {
      a11y.langAttribute.fail++;
      a11y.langAttribute.missing.push(relativePath);
    }

    // ARIA landmarks (main, nav, header, footer)
    const hasMain = /<main[^>]*>/i.test(content) || /role=["']main["']/i.test(content);
    const hasNav = /<nav[^>]*>/i.test(content) || /role=["']navigation["']/i.test(content);
    if (hasMain && hasNav) {
      a11y.ariaLandmarks.pass++;
    } else {
      a11y.ariaLandmarks.fail++;
      a11y.ariaLandmarks.missing.push(relativePath);
    }

    // Heading order (check for skipped levels)
    const headings = content.match(/<h[1-6][^>]*>/gi) || [];
    const levels = headings.map(h => parseInt(h.match(/h([1-6])/i)[1]));
    let previousLevel = 0;
    let hasIssue = false;
    for (const level of levels) {
      if (level > previousLevel + 1 && previousLevel > 0) {
        hasIssue = true;
        a11y.headingOrder.issues.push(`${relativePath}: skipped from h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    }
    if (!hasIssue) {
      a11y.headingOrder.pass++;
    } else {
      a11y.headingOrder.fail++;
    }
  }

  results.categories.accessibility = a11y;

  // Issues
  if (a11y.skipLinks.missing.length > 0) {
    addIssue('medium', 'Accessibility', 'Pages missing skip links', `${a11y.skipLinks.missing.length} pages`);
  }
  if (a11y.altText.missingAlt.length > 0) {
    addIssue('high', 'Accessibility', 'Images missing alt text', a11y.altText.missingAlt.slice(0, 5).join('; '));
  }
  if (a11y.ariaLandmarks.missing.length > 0) {
    addIssue('medium', 'Accessibility', 'Pages missing ARIA landmarks', `${a11y.ariaLandmarks.missing.length} pages`);
  }
  if (a11y.headingOrder.issues.length > 0) {
    addIssue('medium', 'Accessibility', 'Heading order issues', a11y.headingOrder.issues.slice(0, 3).join('; '));
  }

  // Score
  const a11yChecks = [
    a11y.skipLinks.fail === 0,
    a11y.altText.fail === 0,
    a11y.langAttribute.fail === 0,
    a11y.ariaLandmarks.fail === 0,
    a11y.headingOrder.fail === 0
  ];
  const a11yScore = Math.round((a11yChecks.filter(Boolean).length / a11yChecks.length) * 100);
  results.scores.accessibility = a11yScore;

  console.log(`   Skip links: ${a11y.skipLinks.pass}/${a11y.skipLinks.pass + a11y.skipLinks.fail}`);
  console.log(`   Alt text: ${a11y.altText.pass}/${a11y.altText.pass + a11y.altText.fail}`);
  console.log(`   ARIA landmarks: ${a11y.ariaLandmarks.pass}/${a11y.ariaLandmarks.pass + a11y.ariaLandmarks.fail}`);
  console.log(`   Score: ${a11yScore}%`);

  return a11y;
}

// ========== PHASE 6: 404 / BROKEN LINKS ==========
async function audit404Links() {
  console.log('\n🔗 PHASE 6: LINK AUDIT');
  const htmlFiles = getFiles(LANDING_DIR, '.html');

  const internalLinks = new Set();
  const externalLinks = new Set();

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Extract href links
    const hrefs = content.match(/href=["']([^"'#]+)["']/gi) || [];
    for (const href of hrefs) {
      const url = href.match(/href=["']([^"'#]+)["']/i)[1];
      if (url.startsWith('http')) {
        externalLinks.add(url);
      } else if (url.startsWith('/') || url.endsWith('.html')) {
        internalLinks.add(url);
      }
    }
  }

  // Check internal links exist
  const brokenInternal = [];
  for (const link of internalLinks) {
    let filePath = link;
    if (filePath.startsWith('/')) filePath = filePath.slice(1);
    if (!filePath.endsWith('.html') && !filePath.includes('.')) {
      filePath = filePath + (filePath.endsWith('/') ? 'index.html' : '/index.html');
    }
    if (filePath === '' || filePath === '/') filePath = 'index.html';

    const fullPath = path.join(LANDING_DIR, filePath);
    if (!fs.existsSync(fullPath) && !fs.existsSync(fullPath.replace('/index.html', '.html'))) {
      brokenInternal.push(link);
    }
  }

  results.categories.links = {
    internalCount: internalLinks.size,
    externalCount: externalLinks.size,
    brokenInternal: brokenInternal
  };

  if (brokenInternal.length > 0) {
    addIssue('high', 'Links', 'Broken internal links', brokenInternal.slice(0, 10).join(', '));
  }

  console.log(`   Internal links: ${internalLinks.size}`);
  console.log(`   External links: ${externalLinks.size}`);
  console.log(`   Broken internal: ${brokenInternal.length}`);

  return { internal: internalLinks.size, external: externalLinks.size, broken: brokenInternal.length };
}

// ========== PHASE 7: MARKETING / CRO ==========
function auditMarketing() {
  console.log('\n📈 PHASE 7: MARKETING/CRO AUDIT');

  const htmlFiles = getFiles(LANDING_DIR, '.html');
  const marketing = {
    ctas: { total: 0, pages: 0 },
    socialProof: { testimonials: 0, caseStudies: 0, stats: 0 },
    trustSignals: { logos: 0, certifications: 0, guarantees: 0 },
    urgency: { limited: 0, countdown: 0 },
    forms: { total: 0, pages: [] },
    pricing: { visible: false, anchored: false },
    valueProposition: { clear: 0, unclear: 0 }
  };

  for (const file of htmlFiles) {
    const relativePath = file.replace(LANDING_DIR + '/', '');
    const content = fs.readFileSync(file, 'utf8');

    // CTAs
    const ctaPatterns = /btn[-_]?(primary|cta|action)|call[-_]?to[-_]?action|book[-_]?(now|call)|get[-_]?started|free[-_]?(audit|trial)|reserver|commencer/gi;
    const ctas = content.match(ctaPatterns) || [];
    if (ctas.length > 0) {
      marketing.ctas.total += ctas.length;
      marketing.ctas.pages++;
    }

    // Social proof patterns
    if (/testimonial|review|avis|temoignage/i.test(content)) {
      marketing.socialProof.testimonials++;
    }
    if (/case[-_]?study|cas[-_]?client|success[-_]?story/i.test(content)) {
      marketing.socialProof.caseStudies++;
    }
    if (/\d+%|\+\d+|\d+x|roi|return[-_]?on[-_]?investment/i.test(content)) {
      marketing.socialProof.stats++;
    }

    // Forms
    if (/<form/i.test(content)) {
      marketing.forms.total++;
      marketing.forms.pages.push(relativePath);
    }

    // Value prop on homepage
    if (relativePath === 'index.html') {
      if (/hero[-_]?(subtitle|description)|value[-_]?prop/i.test(content)) {
        marketing.valueProposition.clear++;
      }
    }
  }

  results.categories.marketing = marketing;

  // Issues
  if (marketing.ctas.total < 30) {
    addIssue('medium', 'CRO', 'Low CTA density', `${marketing.ctas.total} CTAs across site`);
  }
  if (marketing.socialProof.testimonials < 5) {
    addIssue('medium', 'CRO', 'Few testimonials/reviews visible', `${marketing.socialProof.testimonials} pages`);
  }

  console.log(`   CTAs found: ${marketing.ctas.total} across ${marketing.ctas.pages} pages`);
  console.log(`   Forms: ${marketing.forms.total}`);
  console.log(`   Social proof pages: ${marketing.socialProof.testimonials + marketing.socialProof.caseStudies}`);

  return marketing;
}

// ========== PHASE 8: BRANDING AUDIT ==========
function auditBranding() {
  console.log('\n🎨 PHASE 8: BRANDING AUDIT');

  // Check CSS for brand colors
  const cssPath = path.join(LANDING_DIR, 'styles.min.css');
  const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

  const branding = {
    colors: {
      primary: '#4FBAF1',
      primaryDark: '#2B6685',
      secondary: '#191E35',
      found: {
        primary: cssContent.includes('4FBAF1') || cssContent.includes('4fbaf1'),
        secondary: cssContent.includes('191E35') || cssContent.includes('191e35')
      }
    },
    logo: {
      exists: fs.existsSync(path.join(LANDING_DIR, 'logo.webp')),
      favicon: fs.existsSync(path.join(LANDING_DIR, 'favicon.ico'))
    },
    fonts: {
      inter: cssContent.includes('Inter') || cssContent.includes('inter')
    },
    consistency: {
      '3A': 0,
      'AAA': 0,
      'Triple A': 0
    }
  };

  // Check brand name consistency
  const htmlFiles = getFiles(LANDING_DIR, '.html');
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (/3A Automation/i.test(content)) branding.consistency['3A']++;
    if (/AAA/i.test(content)) branding.consistency['AAA']++;
    if (/Triple A/i.test(content)) branding.consistency['Triple A']++;
  }

  results.categories.branding = branding;

  console.log(`   Primary color (#4FBAF1): ${branding.colors.found.primary ? '✅' : '❌'}`);
  console.log(`   Logo: ${branding.logo.exists ? '✅' : '❌'}`);
  console.log(`   Favicon: ${branding.logo.favicon ? '✅' : '❌'}`);
  console.log(`   Font (Inter): ${branding.fonts.inter ? '✅' : '❌'}`);
  console.log(`   Brand mentions: 3A(${branding.consistency['3A']}) AAA(${branding.consistency['AAA']})`);

  return branding;
}

// ========== PHASE 9: SITEMAP/ROBOTS AUDIT ==========
function auditSitemapRobots() {
  console.log('\n🗺️ PHASE 9: SITEMAP/ROBOTS AUDIT');

  const sitemapPath = path.join(LANDING_DIR, 'sitemap.xml');
  const robotsPath = path.join(LANDING_DIR, 'robots.txt');

  const audit = {
    sitemap: {
      exists: fs.existsSync(sitemapPath),
      urls: 0,
      hasHreflang: false,
      lastmod: false
    },
    robots: {
      exists: fs.existsSync(robotsPath),
      hasSitemapRef: false,
      aiCrawlers: [],
      disallowed: []
    }
  };

  if (audit.sitemap.exists) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const urls = sitemapContent.match(/<loc>/gi) || [];
    audit.sitemap.urls = urls.length;
    audit.sitemap.hasHreflang = /hreflang/i.test(sitemapContent);
    audit.sitemap.lastmod = /<lastmod>/i.test(sitemapContent);
  }

  if (audit.robots.exists) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    audit.robots.hasSitemapRef = /Sitemap:/i.test(robotsContent);

    // Check AI crawlers
    const aiCrawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot'];
    for (const crawler of aiCrawlers) {
      if (robotsContent.includes(crawler)) {
        const isAllowed = new RegExp(`User-agent:\\s*${crawler}[\\s\\S]*?Allow:`, 'i').test(robotsContent);
        audit.robots.aiCrawlers.push({ crawler, allowed: isAllowed });
      }
    }

    // Check disallowed
    const disallowed = robotsContent.match(/Disallow:\s*(.+)/gi) || [];
    audit.robots.disallowed = disallowed.map(d => d.replace('Disallow:', '').trim());
  }

  results.categories.sitemapRobots = audit;

  // Issues
  if (!audit.sitemap.exists) {
    addIssue('high', 'SEO', 'Missing sitemap.xml');
  }
  if (!audit.robots.hasSitemapRef) {
    addIssue('medium', 'SEO', 'robots.txt missing sitemap reference');
  }

  // Check HTML page count vs sitemap URLs
  const htmlFiles = getFiles(LANDING_DIR, '.html');
  const indexablePages = htmlFiles.filter(f => !f.includes('404') && !f.includes('/academ')).length;
  if (audit.sitemap.urls < indexablePages - 5) {
    addIssue('medium', 'SEO', 'Sitemap may be incomplete', `${audit.sitemap.urls} URLs vs ${indexablePages} indexable pages`);
  }

  console.log(`   Sitemap: ${audit.sitemap.exists ? '✅' : '❌'} (${audit.sitemap.urls} URLs)`);
  console.log(`   Robots.txt: ${audit.robots.exists ? '✅' : '❌'}`);
  console.log(`   Sitemap in robots: ${audit.robots.hasSitemapRef ? '✅' : '❌'}`);
  console.log(`   AI Crawlers allowed: ${audit.robots.aiCrawlers.filter(c => c.allowed).length}/${audit.robots.aiCrawlers.length}`);

  return audit;
}

// ========== PHASE 10: i18n AUDIT ==========
function auditi18n() {
  console.log('\n🌍 PHASE 10: i18n AUDIT');

  const htmlFiles = getFiles(LANDING_DIR, '.html');
  const i18n = {
    frPages: [],
    enPages: [],
    missingTranslations: [],
    langAttribute: { correct: 0, incorrect: 0 },
    hreflangIssues: []
  };

  for (const file of htmlFiles) {
    const relativePath = file.replace(LANDING_DIR + '/', '');
    const content = fs.readFileSync(file, 'utf8');

    const isEnglish = relativePath.startsWith('en/');
    if (isEnglish) {
      i18n.enPages.push(relativePath);
    } else {
      i18n.frPages.push(relativePath);
    }

    // Check lang attribute matches content
    const langMatch = content.match(/<html[^>]*lang=["']([^"']+)["']/i);
    if (langMatch) {
      const lang = langMatch[1];
      if ((isEnglish && lang === 'en') || (!isEnglish && lang === 'fr')) {
        i18n.langAttribute.correct++;
      } else {
        i18n.langAttribute.incorrect++;
        addIssue('medium', 'i18n', `Wrong lang attribute in ${relativePath}`, `Expected ${isEnglish ? 'en' : 'fr'}, got ${lang}`);
      }
    }

    // Check hreflang points to correct URLs
    const hreflangFr = content.match(/hreflang=["']fr["'][^>]*href=["']([^"']+)["']/i);
    const hreflangEn = content.match(/hreflang=["']en["'][^>]*href=["']([^"']+)["']/i);

    if (hreflangFr && hreflangFr[1].includes('/en/')) {
      i18n.hreflangIssues.push(`${relativePath}: FR hreflang points to EN page`);
    }
    if (hreflangEn && !hreflangEn[1].includes('/en/') && hreflangEn[1] !== 'https://3a-automation.com/') {
      i18n.hreflangIssues.push(`${relativePath}: EN hreflang points to FR page`);
    }
  }

  results.categories.i18n = i18n;

  if (i18n.hreflangIssues.length > 0) {
    addIssue('high', 'i18n', 'Hreflang pointing to wrong language', i18n.hreflangIssues.slice(0, 3).join('; '));
  }

  console.log(`   FR pages: ${i18n.frPages.length}`);
  console.log(`   EN pages: ${i18n.enPages.length}`);
  console.log(`   Lang attribute: ${i18n.langAttribute.correct}/${i18n.langAttribute.correct + i18n.langAttribute.incorrect} correct`);
  console.log(`   Hreflang issues: ${i18n.hreflangIssues.length}`);

  return i18n;
}

// ========== PHASE 11: AEO SPECIFIC ==========
function auditAEO() {
  console.log('\n🤖 PHASE 11: AEO (AI Engine Optimization) AUDIT');

  const aeo = {
    llmsTxt: {
      exists: fs.existsSync(path.join(LANDING_DIR, 'llms.txt')),
      size: 0,
      sections: []
    },
    aiCrawlersAllowed: 0,
    faqPageCount: 0,
    structuredContent: {
      lists: 0,
      tables: 0,
      codeBlocks: 0
    },
    freshness: {
      recentDates: 0,
      outdatedDates: 0
    }
  };

  // llms.txt analysis
  const llmsPath = path.join(LANDING_DIR, 'llms.txt');
  if (aeo.llmsTxt.exists) {
    const llmsContent = fs.readFileSync(llmsPath, 'utf8');
    aeo.llmsTxt.size = llmsContent.length;

    // Count sections
    const sections = llmsContent.match(/^##\s+/gm) || [];
    aeo.llmsTxt.sections = sections.length;
  }

  // Count AI-friendly structured content
  const htmlFiles = getFiles(LANDING_DIR, '.html');
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Lists (good for AI parsing)
    const uls = content.match(/<ul[^>]*>/gi) || [];
    const ols = content.match(/<ol[^>]*>/gi) || [];
    aeo.structuredContent.lists += uls.length + ols.length;

    // Tables
    const tables = content.match(/<table[^>]*>/gi) || [];
    aeo.structuredContent.tables += tables.length;

    // Dates for freshness
    const dateMatches = content.match(/202[5-6]/g) || [];
    aeo.freshness.recentDates += dateMatches.length;

    const oldDates = content.match(/202[0-4]/g) || [];
    aeo.freshness.outdatedDates += oldDates.length;
  }

  results.categories.aeo = aeo;

  // Issues
  if (!aeo.llmsTxt.exists) {
    addIssue('high', 'AEO', 'Missing llms.txt file', 'Required for AI engine optimization');
  } else if (aeo.llmsTxt.size < 2000) {
    addIssue('medium', 'AEO', 'llms.txt too short', `${aeo.llmsTxt.size} bytes, recommend 3000+`);
  }

  if (aeo.freshness.outdatedDates > aeo.freshness.recentDates) {
    addIssue('medium', 'AEO', 'Content freshness concerns', 'More old dates than recent dates found');
  }

  const aeoScore = Math.min(100, Math.round(
    (aeo.llmsTxt.exists ? 30 : 0) +
    (aeo.llmsTxt.size > 3000 ? 20 : aeo.llmsTxt.size / 150) +
    (aeo.structuredContent.lists > 50 ? 20 : aeo.structuredContent.lists / 2.5) +
    (aeo.freshness.recentDates > aeo.freshness.outdatedDates ? 30 : 15)
  ));
  results.scores.aeo = aeoScore;

  console.log(`   llms.txt: ${aeo.llmsTxt.exists ? '✅' : '❌'} (${aeo.llmsTxt.size} bytes)`);
  console.log(`   Structured lists: ${aeo.structuredContent.lists}`);
  console.log(`   Tables: ${aeo.structuredContent.tables}`);
  console.log(`   Recent dates (2025-2026): ${aeo.freshness.recentDates}`);
  console.log(`   AEO Score: ${aeoScore}%`);

  return aeo;
}

// ========== GENERATE SUMMARY ==========
function generateSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 FORENSIC AUDIT SUMMARY - SESSION 132');
  console.log('═'.repeat(60));

  // Count issues by severity
  const issueCounts = {
    critical: results.issues.critical.length,
    high: results.issues.high.length,
    medium: results.issues.medium.length,
    low: results.issues.low.length,
    info: results.issues.info.length
  };

  // Calculate overall score
  const scores = Object.values(results.scores).filter(s => typeof s === 'number');
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  results.summary = {
    overallScore: avgScore,
    issueCounts,
    scores: results.scores
  };

  console.log('\n📊 SCORES:');
  for (const [key, value] of Object.entries(results.scores)) {
    const bar = '█'.repeat(Math.round(value / 5)) + '░'.repeat(20 - Math.round(value / 5));
    console.log(`   ${key.padEnd(15)} ${bar} ${value}%`);
  }

  console.log(`\n   ${'OVERALL'.padEnd(15)} ${'█'.repeat(Math.round(avgScore / 5))}${'░'.repeat(20 - Math.round(avgScore / 5))} ${avgScore}%`);

  console.log('\n⚠️ ISSUES FOUND:');
  console.log(`   🔴 CRITICAL: ${issueCounts.critical}`);
  console.log(`   🟠 HIGH: ${issueCounts.high}`);
  console.log(`   🟡 MEDIUM: ${issueCounts.medium}`);
  console.log(`   🔵 LOW: ${issueCounts.low}`);

  if (issueCounts.critical > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    for (const issue of results.issues.critical) {
      console.log(`   - [${issue.category}] ${issue.issue}: ${issue.details}`);
    }
  }

  if (issueCounts.high > 0) {
    console.log('\n🟠 HIGH PRIORITY ISSUES:');
    for (const issue of results.issues.high) {
      console.log(`   - [${issue.category}] ${issue.issue}: ${issue.details}`);
    }
  }

  return results;
}

// ========== MAIN ==========
async function main() {
  console.log('═'.repeat(60));
  console.log('🔬 FORENSIC AUDIT SESSION 132 - 3A AUTOMATION');
  console.log('   Date: ' + new Date().toISOString());
  console.log('   Target: ' + BASE_URL);
  console.log('═'.repeat(60));

  // Run all audits
  auditPageStructure();
  auditSEO();
  auditSchemaOrg();
  await auditSecurity();
  auditAccessibility();
  await audit404Links();
  auditMarketing();
  auditBranding();
  auditSitemapRobots();
  auditi18n();
  auditAEO();

  // Generate summary
  const finalResults = generateSummary();

  // Save results
  const outputPath = path.join(__dirname, '../outputs/FORENSIC-AUDIT-SESSION-132.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
  console.log(`\n💾 Full results saved to: ${outputPath}`);

  return finalResults;
}

main().catch(console.error);
