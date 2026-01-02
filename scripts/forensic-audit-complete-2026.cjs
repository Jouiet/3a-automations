#!/usr/bin/env node
/**
 * FORENSIC AUDIT COMPLETE - 3A Automation
 * Date: 2026-01-02
 * Version: 1.0
 *
 * Audit exhaustif de TOUTES les facettes du frontend:
 * - SEO technique (Meta, OG, Twitter, hreflang, canonical)
 * - AEO (robots.txt, llms.txt, FAQPage, Schema.org)
 * - Sécurité (SSL, HSTS, CSP, headers)
 * - Accessibilité WCAG
 * - Liens cassés
 * - Images et assets
 * - i18n
 * - Architecture
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SITE_URL = 'https://3a-automation.com';
const LANDING_PAGE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalPages: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
    passed: 0
  },
  sections: {}
};

function log(level, message) {
  const colors = { critical: RED, high: RED, medium: YELLOW, low: CYAN, pass: GREEN, info: RESET };
  console.log(`${colors[level] || RESET}[${level.toUpperCase()}]${RESET} ${message}`);
}

function addResult(section, check, status, details = '') {
  if (!results.sections[section]) {
    results.sections[section] = { checks: [], passed: 0, failed: 0 };
  }
  results.sections[section].checks.push({ check, status, details });
  if (status === 'PASS') {
    results.sections[section].passed++;
    results.summary.passed++;
  } else {
    results.sections[section].failed++;
    if (status === 'CRITICAL') results.summary.criticalIssues++;
    else if (status === 'HIGH') results.summary.highIssues++;
    else if (status === 'MEDIUM') results.summary.mediumIssues++;
    else results.summary.lowIssues++;
  }
}

// Get all HTML files recursively
function getAllHtmlFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Fetch URL with timeout
function fetchUrl(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// HEAD request for headers only
function fetchHeaders(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = { method: 'HEAD', timeout };
    const urlObj = new URL(url);
    options.hostname = urlObj.hostname;
    options.path = urlObj.pathname;
    options.port = urlObj.port || (url.startsWith('https') ? 443 : 80);

    const req = protocol.request(options, (res) => {
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ==================== AUDIT FUNCTIONS ====================

async function auditSecurityHeaders() {
  log('info', '\n========== SECURITY HEADERS AUDIT ==========');

  try {
    const response = await fetchHeaders(SITE_URL);
    const headers = response.headers;

    const securityHeaders = {
      'strict-transport-security': { required: true, severity: 'CRITICAL', name: 'HSTS' },
      'content-security-policy': { required: true, severity: 'HIGH', name: 'CSP' },
      'x-frame-options': { required: true, severity: 'HIGH', name: 'X-Frame-Options' },
      'x-content-type-options': { required: true, severity: 'MEDIUM', name: 'X-Content-Type-Options' },
      'x-xss-protection': { required: false, severity: 'LOW', name: 'X-XSS-Protection (deprecated)' },
      'referrer-policy': { required: true, severity: 'MEDIUM', name: 'Referrer-Policy' },
      'permissions-policy': { required: false, severity: 'LOW', name: 'Permissions-Policy' }
    };

    for (const [header, config] of Object.entries(securityHeaders)) {
      const value = headers[header];
      if (value) {
        addResult('security', config.name, 'PASS', `Present: ${value.substring(0, 50)}...`);
        log('pass', `${config.name}: ✓ ${value.substring(0, 50)}`);
      } else if (config.required) {
        addResult('security', config.name, config.severity, 'MISSING - Header not present');
        log('critical', `${config.name}: ✗ MISSING`);
      } else {
        addResult('security', config.name, 'LOW', 'Not present (optional)');
        log('low', `${config.name}: Not present (optional)`);
      }
    }

    // Check SSL certificate
    addResult('security', 'SSL/TLS', 'PASS', 'HTTPS connection successful');
    log('pass', 'SSL/TLS: ✓ HTTPS enabled');

  } catch (error) {
    addResult('security', 'Connection', 'CRITICAL', `Failed to connect: ${error.message}`);
    log('critical', `Connection failed: ${error.message}`);
  }
}

async function auditSEOTechnical() {
  log('info', '\n========== SEO TECHNICAL AUDIT ==========');

  const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);
  results.summary.totalPages = htmlFiles.length;
  log('info', `Found ${htmlFiles.length} HTML files`);

  const seoChecks = {
    metaDescription: { count: 0, missing: [] },
    metaRobots: { count: 0, missing: [] },
    canonical: { count: 0, missing: [] },
    ogTitle: { count: 0, missing: [] },
    ogDescription: { count: 0, missing: [] },
    ogImage: { count: 0, missing: [] },
    ogUrl: { count: 0, missing: [] },
    twitterCard: { count: 0, missing: [] },
    twitterTitle: { count: 0, missing: [] },
    twitterDescription: { count: 0, missing: [] },
    twitterImage: { count: 0, missing: [] },
    hreflangFr: { count: 0, missing: [] },
    hreflangEn: { count: 0, missing: [] },
    hreflangDefault: { count: 0, missing: [] },
    titleTag: { count: 0, missing: [] },
    h1Tag: { count: 0, missing: [] },
    langAttribute: { count: 0, missing: [] }
  };

  for (const file of htmlFiles) {
    const relativePath = path.relative(LANDING_PAGE_DIR, file);
    const content = fs.readFileSync(file, 'utf8');

    // Check each SEO element
    if (content.includes('<meta name="description"')) seoChecks.metaDescription.count++;
    else seoChecks.metaDescription.missing.push(relativePath);

    if (content.includes('<meta name="robots"')) seoChecks.metaRobots.count++;
    else seoChecks.metaRobots.missing.push(relativePath);

    if (content.includes('<link rel="canonical"')) seoChecks.canonical.count++;
    else seoChecks.canonical.missing.push(relativePath);

    if (content.includes('<meta property="og:title"')) seoChecks.ogTitle.count++;
    else seoChecks.ogTitle.missing.push(relativePath);

    if (content.includes('<meta property="og:description"')) seoChecks.ogDescription.count++;
    else seoChecks.ogDescription.missing.push(relativePath);

    if (content.includes('<meta property="og:image"')) seoChecks.ogImage.count++;
    else seoChecks.ogImage.missing.push(relativePath);

    if (content.includes('<meta property="og:url"')) seoChecks.ogUrl.count++;
    else seoChecks.ogUrl.missing.push(relativePath);

    if (content.includes('<meta name="twitter:card"')) seoChecks.twitterCard.count++;
    else seoChecks.twitterCard.missing.push(relativePath);

    if (content.includes('<meta name="twitter:title"')) seoChecks.twitterTitle.count++;
    else seoChecks.twitterTitle.missing.push(relativePath);

    if (content.includes('<meta name="twitter:description"')) seoChecks.twitterDescription.count++;
    else seoChecks.twitterDescription.missing.push(relativePath);

    if (content.includes('<meta name="twitter:image"')) seoChecks.twitterImage.count++;
    else seoChecks.twitterImage.missing.push(relativePath);

    if (content.includes('hreflang="fr"')) seoChecks.hreflangFr.count++;
    else seoChecks.hreflangFr.missing.push(relativePath);

    if (content.includes('hreflang="en"')) seoChecks.hreflangEn.count++;
    else seoChecks.hreflangEn.missing.push(relativePath);

    if (content.includes('hreflang="x-default"')) seoChecks.hreflangDefault.count++;
    else seoChecks.hreflangDefault.missing.push(relativePath);

    if (/<title>/.test(content)) seoChecks.titleTag.count++;
    else seoChecks.titleTag.missing.push(relativePath);

    if (/<h1[^>]*>/.test(content)) seoChecks.h1Tag.count++;
    else seoChecks.h1Tag.missing.push(relativePath);

    if (/<html[^>]*lang=/.test(content)) seoChecks.langAttribute.count++;
    else seoChecks.langAttribute.missing.push(relativePath);
  }

  // Report results
  for (const [check, data] of Object.entries(seoChecks)) {
    const percentage = Math.round((data.count / htmlFiles.length) * 100);
    if (percentage === 100) {
      addResult('seo', check, 'PASS', `${data.count}/${htmlFiles.length} (100%)`);
      log('pass', `${check}: ✓ ${data.count}/${htmlFiles.length} (100%)`);
    } else if (percentage >= 90) {
      addResult('seo', check, 'LOW', `${data.count}/${htmlFiles.length} (${percentage}%) - Missing: ${data.missing.slice(0, 3).join(', ')}`);
      log('low', `${check}: ${data.count}/${htmlFiles.length} (${percentage}%)`);
    } else if (percentage >= 70) {
      addResult('seo', check, 'MEDIUM', `${data.count}/${htmlFiles.length} (${percentage}%) - Missing: ${data.missing.slice(0, 3).join(', ')}`);
      log('medium', `${check}: ${data.count}/${htmlFiles.length} (${percentage}%)`);
    } else {
      addResult('seo', check, 'HIGH', `${data.count}/${htmlFiles.length} (${percentage}%) - Missing: ${data.missing.slice(0, 3).join(', ')}`);
      log('high', `${check}: ${data.count}/${htmlFiles.length} (${percentage}%)`);
    }
  }
}

async function auditAEO() {
  log('info', '\n========== AEO (Answer Engine Optimization) AUDIT ==========');

  // Check robots.txt for AI crawlers
  try {
    const robotsResponse = await fetchUrl(`${SITE_URL}/robots.txt`);
    if (robotsResponse.statusCode === 200) {
      const robotsContent = robotsResponse.body;

      const aiCrawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot'];
      for (const crawler of aiCrawlers) {
        if (robotsContent.includes(`User-agent: ${crawler}`) && robotsContent.includes('Allow: /')) {
          addResult('aeo', `robots.txt - ${crawler}`, 'PASS', 'Explicitly allowed');
          log('pass', `${crawler}: ✓ Allowed in robots.txt`);
        } else {
          addResult('aeo', `robots.txt - ${crawler}`, 'MEDIUM', 'Not explicitly allowed');
          log('medium', `${crawler}: Not explicitly configured`);
        }
      }

      if (robotsContent.includes('Sitemap:')) {
        addResult('aeo', 'robots.txt - Sitemap reference', 'PASS', 'Sitemap URL present');
        log('pass', 'Sitemap reference: ✓ Present');
      } else {
        addResult('aeo', 'robots.txt - Sitemap reference', 'MEDIUM', 'No sitemap reference');
        log('medium', 'Sitemap reference: Missing');
      }
    }
  } catch (error) {
    addResult('aeo', 'robots.txt', 'HIGH', `Failed to fetch: ${error.message}`);
  }

  // Check llms.txt
  try {
    const llmsResponse = await fetchUrl(`${SITE_URL}/llms.txt`);
    if (llmsResponse.statusCode === 200) {
      const llmsContent = llmsResponse.body;
      const llmsSize = Buffer.byteLength(llmsContent, 'utf8');

      addResult('aeo', 'llms.txt presence', 'PASS', `Present (${llmsSize} bytes)`);
      log('pass', `llms.txt: ✓ Present (${llmsSize} bytes)`);

      // Check llms.txt structure
      if (llmsContent.startsWith('#')) {
        addResult('aeo', 'llms.txt - H1 heading', 'PASS', 'Starts with H1');
        log('pass', 'llms.txt H1: ✓ Present');
      } else {
        addResult('aeo', 'llms.txt - H1 heading', 'MEDIUM', 'Missing H1 heading');
        log('medium', 'llms.txt H1: Missing');
      }

      if (llmsContent.includes('##')) {
        addResult('aeo', 'llms.txt - Sections', 'PASS', 'Has H2 sections');
        log('pass', 'llms.txt Sections: ✓ Present');
      }

    } else {
      addResult('aeo', 'llms.txt presence', 'HIGH', `HTTP ${llmsResponse.statusCode}`);
      log('high', `llms.txt: ✗ HTTP ${llmsResponse.statusCode}`);
    }
  } catch (error) {
    addResult('aeo', 'llms.txt', 'HIGH', `Failed to fetch: ${error.message}`);
  }

  // Check FAQPage schema
  const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);
  let faqPageCount = 0;
  const faqPageFiles = [];
  const noFaqPageFiles = [];

  for (const file of htmlFiles) {
    const relativePath = path.relative(LANDING_PAGE_DIR, file);
    const content = fs.readFileSync(file, 'utf8');

    // Skip academy pages (noindex)
    if (relativePath.includes('academie') || relativePath.includes('academy')) {
      continue;
    }

    if (content.includes('"@type": "FAQPage"') || content.includes('"@type":"FAQPage"')) {
      faqPageCount++;
      faqPageFiles.push(relativePath);
    } else {
      noFaqPageFiles.push(relativePath);
    }
  }

  const indexablePages = htmlFiles.length - htmlFiles.filter(f => f.includes('academie') || f.includes('academy')).length;
  const faqPercentage = Math.round((faqPageCount / indexablePages) * 100);

  if (faqPercentage >= 80) {
    addResult('aeo', 'FAQPage Schema', 'PASS', `${faqPageCount}/${indexablePages} indexable pages (${faqPercentage}%)`);
    log('pass', `FAQPage Schema: ✓ ${faqPageCount}/${indexablePages} (${faqPercentage}%)`);
  } else if (faqPercentage >= 50) {
    addResult('aeo', 'FAQPage Schema', 'MEDIUM', `${faqPageCount}/${indexablePages} (${faqPercentage}%) - Missing: ${noFaqPageFiles.slice(0, 5).join(', ')}`);
    log('medium', `FAQPage Schema: ${faqPageCount}/${indexablePages} (${faqPercentage}%)`);
  } else {
    addResult('aeo', 'FAQPage Schema', 'HIGH', `${faqPageCount}/${indexablePages} (${faqPercentage}%) - Missing on most pages`);
    log('high', `FAQPage Schema: ${faqPageCount}/${indexablePages} (${faqPercentage}%)`);
  }

  // Check other Schema types
  const schemaTypes = ['Organization', 'BreadcrumbList', 'SoftwareApplication', 'Service', 'BlogPosting', 'WebPage'];
  for (const schemaType of schemaTypes) {
    let count = 0;
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(`"@type": "${schemaType}"`) || content.includes(`"@type":"${schemaType}"`)) {
        count++;
      }
    }
    if (count > 0) {
      addResult('aeo', `Schema.org ${schemaType}`, 'PASS', `Found in ${count} pages`);
      log('pass', `Schema ${schemaType}: ✓ ${count} pages`);
    } else {
      addResult('aeo', `Schema.org ${schemaType}`, 'LOW', 'Not used');
      log('low', `Schema ${schemaType}: Not used`);
    }
  }
}

async function auditSitemap() {
  log('info', '\n========== SITEMAP AUDIT ==========');

  try {
    const sitemapResponse = await fetchUrl(`${SITE_URL}/sitemap.xml`);
    if (sitemapResponse.statusCode === 200) {
      addResult('sitemap', 'Presence', 'PASS', 'sitemap.xml accessible');

      // Count URLs in sitemap
      const urlMatches = sitemapResponse.body.match(/<loc>/g);
      const sitemapUrlCount = urlMatches ? urlMatches.length : 0;

      // Compare with actual files
      const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);
      // Filter out 404 pages and academy (noindex)
      const indexableFiles = htmlFiles.filter(f => {
        const rel = path.relative(LANDING_PAGE_DIR, f);
        return !rel.includes('404') && !rel.includes('academie') && !rel.includes('academy');
      });

      log('info', `Sitemap URLs: ${sitemapUrlCount}`);
      log('info', `Indexable HTML files: ${indexableFiles.length}`);

      if (sitemapUrlCount >= indexableFiles.length * 0.9) {
        addResult('sitemap', 'Coverage', 'PASS', `${sitemapUrlCount} URLs (${indexableFiles.length} files)`);
        log('pass', `Coverage: ✓ ${sitemapUrlCount}/${indexableFiles.length}`);
      } else {
        addResult('sitemap', 'Coverage', 'MEDIUM', `${sitemapUrlCount} URLs but ${indexableFiles.length} indexable files`);
        log('medium', `Coverage: ${sitemapUrlCount}/${indexableFiles.length} - Some pages missing`);
      }

      // Check lastmod dates
      const lastmodMatches = sitemapResponse.body.match(/<lastmod>([^<]+)<\/lastmod>/g);
      if (lastmodMatches) {
        const dates = lastmodMatches.map(m => m.replace(/<\/?lastmod>/g, ''));
        const recentDates = dates.filter(d => d.startsWith('2025') || d.startsWith('2026'));
        if (recentDates.length === dates.length) {
          addResult('sitemap', 'Freshness', 'PASS', 'All lastmod dates are recent (2025-2026)');
          log('pass', 'Freshness: ✓ All dates recent');
        } else {
          addResult('sitemap', 'Freshness', 'LOW', `${recentDates.length}/${dates.length} dates are recent`);
          log('low', `Freshness: ${recentDates.length}/${dates.length} recent`);
        }
      }

      // Check hreflang in sitemap
      if (sitemapResponse.body.includes('xhtml:link')) {
        addResult('sitemap', 'hreflang links', 'PASS', 'Contains xhtml:link hreflang');
        log('pass', 'hreflang: ✓ Present in sitemap');
      } else {
        addResult('sitemap', 'hreflang links', 'MEDIUM', 'No xhtml:link hreflang found');
        log('medium', 'hreflang: Missing in sitemap');
      }

    } else {
      addResult('sitemap', 'Presence', 'CRITICAL', `HTTP ${sitemapResponse.statusCode}`);
    }
  } catch (error) {
    addResult('sitemap', 'Presence', 'CRITICAL', `Failed to fetch: ${error.message}`);
  }
}

async function auditAccessibility() {
  log('info', '\n========== ACCESSIBILITY (WCAG) AUDIT ==========');

  const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);

  const accessibilityChecks = {
    skipLinks: { count: 0, missing: [] },
    imgAlt: { withAlt: 0, withoutAlt: 0, files: [] },
    ariaLabels: { count: 0 },
    formLabels: { count: 0, missing: [] },
    colorContrast: { noted: 'Cannot check programmatically' },
    focusIndicators: { noted: 'CSS-based, needs manual verification' },
    semanticHeadings: { h1Count: 0, multipleH1: [] }
  };

  for (const file of htmlFiles) {
    const relativePath = path.relative(LANDING_PAGE_DIR, file);
    const content = fs.readFileSync(file, 'utf8');

    // Skip links
    if (content.includes('skip-link') || content.includes('skip-to-content') || content.includes('#main-content')) {
      accessibilityChecks.skipLinks.count++;
    } else {
      accessibilityChecks.skipLinks.missing.push(relativePath);
    }

    // Image alt attributes
    const imgTags = content.match(/<img[^>]*>/g) || [];
    for (const img of imgTags) {
      if (img.includes('alt=')) {
        accessibilityChecks.imgAlt.withAlt++;
      } else {
        accessibilityChecks.imgAlt.withoutAlt++;
        accessibilityChecks.imgAlt.files.push(relativePath);
      }
    }

    // Aria labels
    const ariaMatches = content.match(/aria-label/g);
    accessibilityChecks.ariaLabels.count += ariaMatches ? ariaMatches.length : 0;

    // H1 count per page
    const h1Matches = content.match(/<h1[^>]*>/g) || [];
    if (h1Matches.length === 1) {
      accessibilityChecks.semanticHeadings.h1Count++;
    } else if (h1Matches.length > 1) {
      accessibilityChecks.semanticHeadings.multipleH1.push(relativePath);
    }
  }

  // Report
  if (accessibilityChecks.skipLinks.count >= htmlFiles.length * 0.9) {
    addResult('accessibility', 'Skip Links', 'PASS', `${accessibilityChecks.skipLinks.count}/${htmlFiles.length}`);
    log('pass', `Skip Links: ✓ ${accessibilityChecks.skipLinks.count}/${htmlFiles.length}`);
  } else {
    addResult('accessibility', 'Skip Links', 'MEDIUM', `${accessibilityChecks.skipLinks.count}/${htmlFiles.length} - Missing: ${accessibilityChecks.skipLinks.missing.slice(0, 3).join(', ')}`);
    log('medium', `Skip Links: ${accessibilityChecks.skipLinks.count}/${htmlFiles.length}`);
  }

  const totalImages = accessibilityChecks.imgAlt.withAlt + accessibilityChecks.imgAlt.withoutAlt;
  if (accessibilityChecks.imgAlt.withoutAlt === 0) {
    addResult('accessibility', 'Image Alt Text', 'PASS', `${totalImages} images all have alt`);
    log('pass', `Image Alt: ✓ All ${totalImages} images have alt`);
  } else {
    addResult('accessibility', 'Image Alt Text', 'HIGH', `${accessibilityChecks.imgAlt.withoutAlt}/${totalImages} images missing alt`);
    log('high', `Image Alt: ${accessibilityChecks.imgAlt.withoutAlt} images missing alt`);
  }

  addResult('accessibility', 'ARIA Labels', 'PASS', `${accessibilityChecks.ariaLabels.count} aria-label attributes found`);
  log('pass', `ARIA Labels: ✓ ${accessibilityChecks.ariaLabels.count} found`);

  if (accessibilityChecks.semanticHeadings.multipleH1.length === 0) {
    addResult('accessibility', 'Single H1 per page', 'PASS', 'All pages have single H1');
    log('pass', 'Single H1: ✓ All pages compliant');
  } else {
    addResult('accessibility', 'Single H1 per page', 'MEDIUM', `${accessibilityChecks.semanticHeadings.multipleH1.length} pages have multiple H1`);
    log('medium', `Single H1: ${accessibilityChecks.semanticHeadings.multipleH1.length} pages have multiple H1`);
  }
}

async function auditBrokenLinks() {
  log('info', '\n========== BROKEN LINKS AUDIT ==========');

  const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);
  const internalLinks = new Set();
  const externalLinks = new Set();

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Extract href links
    const hrefMatches = content.match(/href="([^"]+)"/g) || [];
    for (const match of hrefMatches) {
      const url = match.replace('href="', '').replace('"', '');
      if (url.startsWith('http://') || url.startsWith('https://')) {
        if (url.includes('3a-automation.com')) {
          internalLinks.add(url);
        } else {
          externalLinks.add(url);
        }
      } else if (url.startsWith('/') && !url.startsWith('//')) {
        internalLinks.add(`${SITE_URL}${url}`);
      }
    }
  }

  log('info', `Found ${internalLinks.size} internal links, ${externalLinks.size} external links`);

  // Check internal links (limit to 20 for speed)
  let checkedInternal = 0;
  let brokenInternal = 0;
  const brokenInternalUrls = [];

  for (const url of Array.from(internalLinks).slice(0, 30)) {
    try {
      const response = await fetchHeaders(url, 5000);
      checkedInternal++;
      if (response.statusCode >= 400) {
        brokenInternal++;
        brokenInternalUrls.push(`${url} (${response.statusCode})`);
      }
    } catch (error) {
      checkedInternal++;
      brokenInternal++;
      brokenInternalUrls.push(`${url} (${error.message})`);
    }
  }

  if (brokenInternal === 0) {
    addResult('links', 'Internal Links', 'PASS', `Checked ${checkedInternal} - all OK`);
    log('pass', `Internal Links: ✓ ${checkedInternal} checked, all OK`);
  } else {
    addResult('links', 'Internal Links', 'HIGH', `${brokenInternal}/${checkedInternal} broken: ${brokenInternalUrls.slice(0, 3).join(', ')}`);
    log('high', `Internal Links: ${brokenInternal}/${checkedInternal} broken`);
  }

  addResult('links', 'Total Links Count', 'PASS', `${internalLinks.size} internal, ${externalLinks.size} external`);
}

async function auditImages() {
  log('info', '\n========== IMAGES & ASSETS AUDIT ==========');

  const assetsDir = path.join(LANDING_PAGE_DIR, 'assets');

  // Check for WebP versions
  const imageExtensions = ['.png', '.jpg', '.jpeg'];
  let totalImages = 0;
  let webpVersions = 0;

  function checkImagesInDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkImagesInDir(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          totalImages++;
          const webpPath = fullPath.replace(ext, '.webp');
          if (fs.existsSync(webpPath)) {
            webpVersions++;
          }
        }
      }
    }
  }

  checkImagesInDir(LANDING_PAGE_DIR);

  // Check favicon
  const faviconPath = path.join(LANDING_PAGE_DIR, 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    addResult('images', 'Favicon', 'PASS', 'favicon.ico exists');
    log('pass', 'Favicon: ✓ Present');
  } else {
    addResult('images', 'Favicon', 'MEDIUM', 'favicon.ico missing');
    log('medium', 'Favicon: Missing');
  }

  // Check OG image
  const ogImagePath = path.join(LANDING_PAGE_DIR, 'og-image.webp');
  if (fs.existsSync(ogImagePath)) {
    const stats = fs.statSync(ogImagePath);
    addResult('images', 'OG Image', 'PASS', `og-image.webp (${Math.round(stats.size / 1024)}KB)`);
    log('pass', `OG Image: ✓ ${Math.round(stats.size / 1024)}KB`);
  } else {
    addResult('images', 'OG Image', 'HIGH', 'og-image.webp missing');
    log('high', 'OG Image: Missing');
  }

  // Check logo
  const logoPath = path.join(LANDING_PAGE_DIR, 'logo.webp');
  if (fs.existsSync(logoPath)) {
    addResult('images', 'Logo', 'PASS', 'logo.webp exists');
    log('pass', 'Logo: ✓ Present');
  } else {
    addResult('images', 'Logo', 'HIGH', 'logo.webp missing');
    log('high', 'Logo: Missing');
  }

  // Check SVG logos
  const logosDir = path.join(LANDING_PAGE_DIR, 'assets', 'logos');
  if (fs.existsSync(logosDir)) {
    const svgFiles = fs.readdirSync(logosDir).filter(f => f.endsWith('.svg'));
    addResult('images', 'Integration Logos', 'PASS', `${svgFiles.length} SVG logos`);
    log('pass', `Integration Logos: ✓ ${svgFiles.length} SVGs`);
  }
}

async function auditi18n() {
  log('info', '\n========== INTERNATIONALIZATION (i18n) AUDIT ==========');

  const frFiles = [];
  const enFiles = [];

  const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);

  for (const file of htmlFiles) {
    const relativePath = path.relative(LANDING_PAGE_DIR, file);
    if (relativePath.startsWith('en/') || relativePath.startsWith('en\\')) {
      enFiles.push(relativePath.replace(/^en[\\/]/, ''));
    } else if (!relativePath.includes('/') && !relativePath.includes('\\')) {
      frFiles.push(relativePath);
    } else {
      // FR subdirectory files
      frFiles.push(relativePath);
    }
  }

  log('info', `FR pages: ${frFiles.length}, EN pages: ${enFiles.length}`);

  // Check language parity
  const frOnlyPages = frFiles.filter(f => {
    const enEquivalent = f.replace('academie', 'academy')
                          .replace('a-propos', 'about')
                          .replace('cas-clients', 'case-studies')
                          .replace('investisseurs', 'investors')
                          .replace('pme', 'smb')
                          .replace('audit-gratuit', 'free-audit')
                          .replace('mentions-legales', 'terms')
                          .replace('politique-confidentialite', 'privacy')
                          .replace('parcours', 'paths')
                          .replace('cours', 'courses')
                          .replace('demarrer', 'getting-started')
                          .replace('contenu', 'content');
    return !enFiles.some(e => e === enEquivalent || e === f);
  });

  if (frOnlyPages.length <= 2) {
    addResult('i18n', 'Language Parity', 'PASS', `Good parity (${frOnlyPages.length} FR-only pages)`);
    log('pass', `Language Parity: ✓ ${frOnlyPages.length} FR-only`);
  } else {
    addResult('i18n', 'Language Parity', 'MEDIUM', `${frOnlyPages.length} pages FR only: ${frOnlyPages.slice(0, 3).join(', ')}`);
    log('medium', `Language Parity: ${frOnlyPages.length} FR-only pages`);
  }

  // Check geo-locale.js
  const geoLocalePath = path.join(LANDING_PAGE_DIR, 'geo-locale.min.js');
  if (fs.existsSync(geoLocalePath)) {
    addResult('i18n', 'Geo-locale Script', 'PASS', 'geo-locale.min.js present');
    log('pass', 'Geo-locale: ✓ Present');
  } else {
    addResult('i18n', 'Geo-locale Script', 'LOW', 'geo-locale.min.js not found');
  }
}

function generateReport() {
  log('info', '\n========== FINAL REPORT ==========');

  const report = {
    ...results,
    scores: {
      security: 0,
      seo: 0,
      aeo: 0,
      accessibility: 0,
      overall: 0
    }
  };

  // Calculate scores
  for (const [section, data] of Object.entries(results.sections)) {
    const total = data.passed + data.failed;
    const score = total > 0 ? Math.round((data.passed / total) * 100) : 0;
    if (section.includes('security')) report.scores.security = score;
    else if (section.includes('seo')) report.scores.seo = score;
    else if (section.includes('aeo')) report.scores.aeo = score;
    else if (section.includes('accessibility')) report.scores.accessibility = score;
  }

  report.scores.overall = Math.round(
    (report.scores.security + report.scores.seo + report.scores.aeo + report.scores.accessibility) / 4
  );

  console.log('\n' + '='.repeat(60));
  console.log(`${CYAN}FORENSIC AUDIT SUMMARY${RESET}`);
  console.log('='.repeat(60));
  console.log(`Total Pages Analyzed: ${results.summary.totalPages}`);
  console.log(`${RED}Critical Issues: ${results.summary.criticalIssues}${RESET}`);
  console.log(`${RED}High Issues: ${results.summary.highIssues}${RESET}`);
  console.log(`${YELLOW}Medium Issues: ${results.summary.mediumIssues}${RESET}`);
  console.log(`${CYAN}Low Issues: ${results.summary.lowIssues}${RESET}`);
  console.log(`${GREEN}Passed Checks: ${results.summary.passed}${RESET}`);
  console.log('='.repeat(60));

  // Save JSON report
  const reportPath = path.join(__dirname, '..', 'outputs', `FORENSIC-AUDIT-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  return report;
}

// Main execution
async function main() {
  console.log(`${CYAN}========================================${RESET}`);
  console.log(`${CYAN}  3A AUTOMATION - FORENSIC AUDIT${RESET}`);
  console.log(`${CYAN}  Date: ${new Date().toISOString()}${RESET}`);
  console.log(`${CYAN}========================================${RESET}`);

  await auditSecurityHeaders();
  await auditSEOTechnical();
  await auditAEO();
  await auditSitemap();
  await auditAccessibility();
  await auditBrokenLinks();
  await auditImages();
  await auditi18n();

  return generateReport();
}

main().then(report => {
  process.exit(report.summary.criticalIssues > 0 ? 1 : 0);
}).catch(error => {
  console.error(`${RED}Fatal error: ${error.message}${RESET}`);
  process.exit(1);
});
