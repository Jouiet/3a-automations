#!/usr/bin/env node
/**
 * INVESTOR-CRITICAL: 404 Audit
 * Verifies ALL pages are accessible - NO 404 errors allowed
 * Session 117quater - 31/12/2025
 * For: VC, Angel, Strategic Partner, PE Acquisition
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOMAIN = '3a-automation.com';
const BASE_URL = `https://${DOMAIN}`;
const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

const results = {
  timestamp: new Date().toISOString(),
  domain: DOMAIN,
  totalPages: 0,
  accessible: 0,
  errors: [],
  redirects: [],
  slowPages: [],
  allUrls: []
};

// Get all HTML files and convert to URLs
function getUrlsFromFiles() {
  const urls = new Set();

  function scanDir(dir, basePath = '') {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (item.startsWith('.') || item === 'node_modules') return;

      if (stat.isDirectory()) {
        scanDir(fullPath, path.join(basePath, item));
      } else if (item.endsWith('.html')) {
        let urlPath = path.join(basePath, item);
        // Convert to URL format
        urlPath = urlPath.replace(/\\/g, '/');
        // index.html -> /
        if (urlPath === 'index.html') {
          urls.add('/');
        } else if (urlPath.endsWith('/index.html')) {
          urls.add('/' + urlPath.replace('/index.html', '/'));
        } else {
          urls.add('/' + urlPath);
        }
      }
    });
  }

  scanDir(LANDING_DIR);
  return Array.from(urls).sort();
}

// Extract internal links from HTML files
function extractInternalLinks() {
  const links = new Set();

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (item.startsWith('.') || item === 'node_modules') return;

      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Find all href attributes
        const hrefMatches = content.matchAll(/href="([^"]+)"/g);
        for (const match of hrefMatches) {
          const href = match[1];
          // Internal links only
          if (href.startsWith('/') && !href.startsWith('//')) {
            links.add(href.split('#')[0].split('?')[0]); // Remove anchors and query strings
          } else if (href.startsWith('https://3a-automation.com')) {
            const urlPath = href.replace('https://3a-automation.com', '');
            links.add(urlPath.split('#')[0].split('?')[0] || '/');
          }
        }
      }
    });
  }

  scanDir(LANDING_DIR);
  return Array.from(links).filter(l => l && l !== '').sort();
}

// Check a single URL
function checkUrl(urlPath) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = BASE_URL + urlPath;

    const options = {
      hostname: DOMAIN,
      port: 443,
      path: urlPath || '/',
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'InvestorAudit/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const responseTime = Date.now() - startTime;

      resolve({
        url: urlPath,
        status: res.statusCode,
        responseTime,
        location: res.headers.location || null
      });
    });

    req.on('error', (e) => {
      resolve({
        url: urlPath,
        status: 'ERROR',
        error: e.message,
        responseTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url: urlPath,
        status: 'TIMEOUT',
        responseTime: Date.now() - startTime
      });
    });

    req.end();
  });
}

// Check sitemap
function parseSitemap() {
  const sitemapPath = path.join(LANDING_DIR, 'sitemap.xml');
  const urls = [];

  if (fs.existsSync(sitemapPath)) {
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    const locMatches = content.matchAll(/<loc>([^<]+)<\/loc>/g);
    for (const match of locMatches) {
      const url = match[1].replace('https://3a-automation.com', '');
      urls.push(url || '/');
    }
  }

  return urls;
}

async function main() {
  console.log('='.repeat(70));
  console.log('INVESTOR-CRITICAL: 404 Audit');
  console.log('Target: ZERO 404 errors for PE acquisition due diligence');
  console.log('='.repeat(70));
  console.log('');

  // Collect all URLs to test
  const fileUrls = getUrlsFromFiles();
  const linkUrls = extractInternalLinks();
  const sitemapUrls = parseSitemap();

  // Combine all unique URLs
  const allUrls = [...new Set([...fileUrls, ...linkUrls, ...sitemapUrls])].sort();

  console.log(`📁 Pages from files: ${fileUrls.length}`);
  console.log(`🔗 Internal links found: ${linkUrls.length}`);
  console.log(`📋 Sitemap URLs: ${sitemapUrls.length}`);
  console.log(`📊 Total unique URLs to test: ${allUrls.length}`);
  console.log('');
  console.log('Testing all URLs...');
  console.log('-'.repeat(70));

  results.totalPages = allUrls.length;
  results.allUrls = allUrls;

  // Test all URLs with concurrency limit
  const concurrency = 5;
  const urlResults = [];

  for (let i = 0; i < allUrls.length; i += concurrency) {
    const batch = allUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(checkUrl));
    urlResults.push(...batchResults);

    // Progress indicator
    process.stdout.write(`\rProgress: ${Math.min(i + concurrency, allUrls.length)}/${allUrls.length}`);
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('RESULTS:');
  console.log('-'.repeat(70));

  // Categorize results
  for (const result of urlResults) {
    if (result.status === 200) {
      results.accessible++;
      if (result.responseTime > 2000) {
        results.slowPages.push({ url: result.url, time: result.responseTime });
      }
    } else if (result.status >= 300 && result.status < 400) {
      results.redirects.push({ url: result.url, status: result.status, location: result.location });
    } else {
      results.errors.push({ url: result.url, status: result.status, error: result.error });
    }
  }

  // Print errors (CRITICAL)
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS (CRITICAL - MUST FIX):');
    results.errors.forEach(e => {
      console.log(`   ${e.status} | ${e.url} ${e.error ? '| ' + e.error : ''}`);
    });
  }

  // Print redirects
  if (results.redirects.length > 0) {
    console.log('\n⚠️  REDIRECTS:');
    results.redirects.forEach(r => {
      console.log(`   ${r.status} | ${r.url} → ${r.location}`);
    });
  }

  // Print slow pages
  if (results.slowPages.length > 0) {
    console.log('\n🐌 SLOW PAGES (>2s):');
    results.slowPages.forEach(s => {
      console.log(`   ${s.time}ms | ${s.url}`);
    });
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY:');
  console.log(`   ✅ Accessible: ${results.accessible}/${results.totalPages}`);
  console.log(`   ❌ Errors: ${results.errors.length}`);
  console.log(`   ↪️  Redirects: ${results.redirects.length}`);
  console.log(`   🐌 Slow: ${results.slowPages.length}`);

  const investorReady = results.errors.length === 0;
  if (investorReady) {
    console.log('\n✅ INVESTOR-READY: All pages accessible, ZERO 404 errors');
  } else {
    console.log('\n❌ NOT INVESTOR-READY: Fix errors above before due diligence');
  }

  console.log('='.repeat(70));

  // Save results
  const outputPath = path.join(__dirname, '..', 'outputs', 'audit-investor-404.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved: ${outputPath}`);

  return results.errors.length === 0;
}

main().catch(console.error);
