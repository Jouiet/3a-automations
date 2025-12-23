#!/usr/bin/env node
/**
 * LCP Optimization Script
 * Adds preload hints for critical resources to improve Largest Contentful Paint
 *
 * Optimizations:
 * 1. Preload logo.webp (above-fold image)
 * 2. Add fetchpriority="high" to logo
 * 3. Ensure DNS-prefetch for critical domains
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Get all HTML files
function getHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.')) {
      files.push(...getHtmlFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Preload hint to add after manifest link
const PRELOAD_LOGO = `
  <!-- Preload critical above-fold image for LCP -->
  <link rel="preload" href="/logo.webp" as="image" type="image/webp" fetchpriority="high">`;

// DNS prefetch hints
const DNS_PREFETCH = `
  <!-- DNS Prefetch for performance -->
  <link rel="dns-prefetch" href="//www.googletagmanager.com">
  <link rel="dns-prefetch" href="//www.google-analytics.com">`;

let modified = 0;
let alreadyOptimized = 0;

const htmlFiles = getHtmlFiles(SITE_DIR);

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  const relPath = path.relative(SITE_DIR, file);

  // 1. Add preload for logo if not present
  if (!content.includes('preload" href="/logo.webp"') && !content.includes("preload' href='/logo.webp'")) {
    // Insert after manifest link
    if (content.includes('<link rel="manifest"')) {
      content = content.replace(
        /(<link rel="manifest"[^>]*>)/,
        `$1${PRELOAD_LOGO}`
      );
      changed = true;
    }
  }

  // 2. Add fetchpriority="high" to header logo
  if (content.includes('loading="eager" src="/logo.webp"') && !content.includes('fetchpriority="high"')) {
    content = content.replace(
      /loading="eager" src="\/logo\.webp"/g,
      'loading="eager" src="/logo.webp" fetchpriority="high"'
    );
    changed = true;
  }

  // 3. Add DNS prefetch if not present
  if (!content.includes('dns-prefetch" href="//www.googletagmanager.com"')) {
    // Insert after preconnect to fonts.gstatic.com
    if (content.includes('preconnect" href="https://fonts.gstatic.com"')) {
      content = content.replace(
        /(<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>)/,
        `$1${DNS_PREFETCH}`
      );
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`✅ Optimized: ${relPath}`);
    modified++;
  } else {
    alreadyOptimized++;
  }
}

console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`LCP OPTIMIZATION COMPLETE`);
console.log(`═══════════════════════════════════════════════════════════`);
console.log(`Modified:          ${modified} files`);
console.log(`Already optimized: ${alreadyOptimized} files`);
console.log(`Total:             ${htmlFiles.length} files`);
