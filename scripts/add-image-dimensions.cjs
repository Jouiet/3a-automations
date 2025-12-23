#!/usr/bin/env node
/**
 * Add Width/Height to Images for CLS Prevention
 * Session 68 - 2025-12-23
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Default dimensions for different image types
const DIMENSIONS = {
  'assets/logos/': { width: 48, height: 48 },        // Logo icons
  'assets/icons/': { width: 24, height: 24 },        // UI icons
  'logo.webp': { width: 40, height: 40 },            // Header logo
  'logo.png': { width: 40, height: 40 },             // Header logo fallback
  'og-image': { width: 1200, height: 630 },          // OG image
  'favicon': { width: 32, height: 32 },              // Favicons
  'default': { width: 48, height: 48 }               // Default
};

// Find all HTML files
function findHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.')) {
      findHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function getDimensionsForSrc(src) {
  for (const [pattern, dims] of Object.entries(DIMENSIONS)) {
    if (src.includes(pattern)) {
      return dims;
    }
  }
  return DIMENSIONS.default;
}

function addImageDimensions(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(LANDING_DIR + '/', '');
    let modifications = 0;

    // Find img tags without width attribute
    const imgRegex = /<img(?![^>]*width=)[^>]*>/gi;

    content = content.replace(imgRegex, (match) => {
      // Extract src
      const srcMatch = match.match(/src="([^"]+)"/);
      if (!srcMatch) return match;

      const src = srcMatch[1];
      const dims = getDimensionsForSrc(src);

      modifications++;
      // Add width and height before closing >
      return match.replace(/>$/, ` width="${dims.width}" height="${dims.height}">`);
    });

    if (modifications > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { status: 'updated', count: modifications };
    }

    return { status: 'skipped', reason: 'All images have dimensions', count: 0 };
  } catch (err) {
    return { status: 'error', reason: err.message, count: 0 };
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    ADD IMAGE DIMENSIONS - Session 68');
console.log('═══════════════════════════════════════════════════════════════\n');

const htmlFiles = findHtmlFiles(LANDING_DIR);
let stats = { updated: 0, skipped: 0, errors: 0, totalImages: 0 };

console.log(`📝 Processing ${htmlFiles.length} HTML files...\n`);

for (const file of htmlFiles) {
  const result = addImageDimensions(file);
  const relativePath = file.replace(LANDING_DIR + '/', '');

  if (result.status === 'updated') {
    console.log(`  ✅ ${relativePath}: ${result.count} images`);
    stats.updated++;
    stats.totalImages += result.count;
  } else if (result.status === 'skipped') {
    console.log(`  ⏭️  ${relativePath}`);
    stats.skipped++;
  } else {
    console.log(`  ❌ ${relativePath}: ${result.reason}`);
    stats.errors++;
  }
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                        SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Files updated:        ${stats.updated}`);
console.log(`  Images with dims:     ${stats.totalImages}`);
console.log(`  Skipped:              ${stats.skipped}`);
console.log(`  Errors:               ${stats.errors}`);
console.log('\n✅ Image dimensions complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
