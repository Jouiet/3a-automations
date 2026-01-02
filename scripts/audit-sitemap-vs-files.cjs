#!/usr/bin/env node
/**
 * Sitemap vs Files Audit
 * Verifies every URL in sitemap.xml exists as a file
 */

const fs = require('fs');
const path = require('path');

const SITE_ROOT = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';
const SITEMAP_PATH = path.join(SITE_ROOT, 'sitemap.xml');
const DOMAIN = 'https://3a-automation.com';

// Read sitemap
const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf8');

// Extract all URLs from sitemap
const urlRegex = /<loc>([^<]+)<\/loc>/g;
const urls = [];
let match;
while ((match = urlRegex.exec(sitemapContent)) !== null) {
  urls.push(match[1]);
}

console.log(`\n🔍 SITEMAP vs FILES AUDIT`);
console.log('='.repeat(80));
console.log(`\nFound ${urls.length} URLs in sitemap.xml\n`);

const missing = [];
const found = [];

for (const url of urls) {
  // Convert URL to file path
  let filePath = url.replace(DOMAIN, '');
  
  // Handle root URLs
  if (filePath === '/' || filePath === '') {
    filePath = '/index.html';
  } else if (filePath.endsWith('/')) {
    filePath = filePath + 'index.html';
  }
  
  const fullPath = path.join(SITE_ROOT, filePath);
  
  if (fs.existsSync(fullPath)) {
    found.push({ url, file: filePath });
  } else {
    missing.push({ url, expectedFile: filePath });
  }
}

if (missing.length === 0) {
  console.log('✅ All sitemap URLs have corresponding files!\n');
} else {
  console.log(`❌ ${missing.length} SITEMAP URLs WITHOUT FILES:\n`);
  for (const m of missing) {
    console.log(`   URL: ${m.url}`);
    console.log(`   Expected file: ${m.expectedFile}`);
    console.log('');
  }
}

console.log('='.repeat(80));
console.log(`\n📊 SUMMARY:`);
console.log(`   • URLs in sitemap: ${urls.length}`);
console.log(`   • Files found: ${found.length}`);
console.log(`   • Files missing: ${missing.length}`);
console.log('');

// Also check: Files that exist but are NOT in sitemap
const getAllHtmlFiles = (dir) => {
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
};

const allFiles = getAllHtmlFiles(SITE_ROOT);
const sitemapPaths = found.map(f => f.file);

const notInSitemap = allFiles.filter(f => {
  const relativePath = f.replace(SITE_ROOT, '');
  // Check various forms
  return !sitemapPaths.includes(relativePath) && 
         !sitemapPaths.includes(relativePath.replace('/index.html', '/')) &&
         !relativePath.includes('/academie/') && // Exclude academy for now
         !relativePath.includes('/academy/') &&
         !relativePath.includes('404.html');
});

if (notInSitemap.length > 0) {
  console.log(`\n⚠️  ${notInSitemap.length} FILES NOT IN SITEMAP (may be intentional):\n`);
  for (const f of notInSitemap) {
    console.log(`   ${f.replace(SITE_ROOT, '')}`);
  }
}

process.exit(missing.length > 0 ? 1 : 0);
