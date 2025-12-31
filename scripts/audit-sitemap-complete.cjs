#!/usr/bin/env node
/**
 * AUDIT: Sitemap Completeness
 * Vérifie que TOUTES les pages HTML publiques sont dans le sitemap
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
const SITEMAP_PATH = path.join(LANDING_DIR, 'sitemap.xml');

// Pages to EXCLUDE from sitemap (noindex, internal, etc.)
const EXCLUDE_PATTERNS = [
  /academie/i,
  /academy/i,
  /404\.html$/,
  /test/i,
  /draft/i,
];

const results = {
  htmlFiles: [],
  sitemapUrls: [],
  missingFromSitemap: [],
  inSitemapNotFound: [],
  success: false
};

// Parse sitemap.xml
function parseSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('❌ sitemap.xml not found!');
    return [];
  }

  const content = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g) || [];

  return urlMatches.map(match => {
    const url = match.replace(/<\/?loc>/g, '');
    // Extract path from URL
    const urlObj = new URL(url);
    return urlObj.pathname;
  });
}

// Find all public HTML files
function findHtmlFiles(dir, basePath = '') {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (item.startsWith('.') || item === 'node_modules') return;

    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath, `${basePath}/${item}`));
    } else if (item.endsWith('.html')) {
      const relativePath = `${basePath}/${item}`;

      // Check if should be excluded
      const shouldExclude = EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath));

      if (!shouldExclude) {
        // Convert to URL path
        let urlPath = relativePath;
        if (urlPath.endsWith('/index.html')) {
          urlPath = urlPath.replace('/index.html', '/');
        } else if (urlPath.endsWith('.html')) {
          urlPath = urlPath.replace('.html', '');
        }
        // Ensure starts with /
        if (!urlPath.startsWith('/')) {
          urlPath = '/' + urlPath;
        }

        files.push({
          file: relativePath,
          urlPath: urlPath
        });
      }
    }
  });

  return files;
}

// Main audit
function runAudit() {
  console.log('🔍 Parsing sitemap.xml...');
  results.sitemapUrls = parseSitemap();
  console.log(`   Found ${results.sitemapUrls.length} URLs in sitemap`);

  console.log('\n🔍 Scanning HTML files...');
  results.htmlFiles = findHtmlFiles(LANDING_DIR);
  console.log(`   Found ${results.htmlFiles.length} public HTML files`);

  // Find missing from sitemap
  results.htmlFiles.forEach(({ file, urlPath }) => {
    // Check various URL formats
    const variations = [
      urlPath,
      urlPath + '/',
      urlPath.replace(/\/$/, ''),
      urlPath + '.html',
    ];

    const found = results.sitemapUrls.some(sitemapUrl =>
      variations.some(v => sitemapUrl === v || sitemapUrl.endsWith(v))
    );

    if (!found) {
      results.missingFromSitemap.push({ file, urlPath });
    }
  });

  // Check if sitemap has dead URLs
  // (URLs in sitemap but file doesn't exist)
  results.sitemapUrls.forEach(url => {
    // Convert URL back to possible file paths
    let possiblePaths = [
      path.join(LANDING_DIR, url),
      path.join(LANDING_DIR, url + '.html'),
      path.join(LANDING_DIR, url, 'index.html'),
    ];

    const exists = possiblePaths.some(p => fs.existsSync(p));
    if (!exists) {
      results.inSitemapNotFound.push(url);
    }
  });
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT: Sitemap Completeness');
  console.log('='.repeat(80));

  console.log(`\n📁 HTML files (public): ${results.htmlFiles.length}`);
  console.log(`📄 Sitemap URLs: ${results.sitemapUrls.length}`);

  // Missing from sitemap
  console.log('\n' + '-'.repeat(40));
  console.log('❌ MISSING FROM SITEMAP:');
  console.log('-'.repeat(40));

  if (results.missingFromSitemap.length === 0) {
    console.log('✅ All public pages are in sitemap');
  } else {
    console.log(`\n⚠️  ${results.missingFromSitemap.length} pages missing:\n`);
    results.missingFromSitemap.forEach(({ file, urlPath }) => {
      console.log(`   ${urlPath}`);
      console.log(`      File: ${file}`);
    });
  }

  // Dead URLs in sitemap
  console.log('\n' + '-'.repeat(40));
  console.log('🔗 DEAD URLS IN SITEMAP:');
  console.log('-'.repeat(40));

  if (results.inSitemapNotFound.length === 0) {
    console.log('✅ All sitemap URLs have corresponding files');
  } else {
    console.log(`\n⚠️  ${results.inSitemapNotFound.length} dead URLs:\n`);
    results.inSitemapNotFound.forEach(url => {
      console.log(`   ${url}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  const totalIssues = results.missingFromSitemap.length + results.inSitemapNotFound.length;
  results.success = totalIssues === 0;

  if (results.success) {
    console.log('✅ AUDIT PASSED: Sitemap is complete');
  } else {
    console.log(`❌ AUDIT FAILED: ${totalIssues} issues found`);
  }

  return results.success;
}

// Main
runAudit();
const success = printResults();

// Save results
const outputPath = path.join(__dirname, '..', 'outputs', 'audit-sitemap.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n📝 Résultats sauvegardés: ${outputPath}`);

process.exit(success ? 0 : 1);
