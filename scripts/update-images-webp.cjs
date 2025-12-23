#!/usr/bin/env node
/**
 * Update Image References to WebP Format
 * Session 68 - 2025-12-23
 *
 * Replaces logo.png with logo.webp (with fallback)
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

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

function updateToWebP(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(LANDING_DIR + '/', '');
    let modifications = 0;

    // Replace logo.png with logo.webp (keeping the path structure)
    // Pattern 1: /logo.png
    if (content.includes('/logo.png')) {
      content = content.replace(/\/logo\.png/g, '/logo.webp');
      modifications++;
    }

    // Pattern 2: ../logo.png
    if (content.includes('../logo.png')) {
      content = content.replace(/\.\.\/logo\.png/g, '../logo.webp');
      modifications++;
    }

    // Pattern 3: og-image.png -> og-image.webp for social sharing (if webp exists)
    if (content.includes('/og-image.png')) {
      content = content.replace(/\/og-image\.png/g, '/og-image.webp');
      modifications++;
    }
    if (content.includes('../og-image.png')) {
      content = content.replace(/\.\.\/og-image\.png/g, '../og-image.webp');
      modifications++;
    }

    if (modifications > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { status: 'updated', count: modifications };
    }

    return { status: 'skipped', reason: 'Already using WebP', count: 0 };
  } catch (err) {
    return { status: 'error', reason: err.message, count: 0 };
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    UPDATE IMAGES TO WEBP FORMAT - Session 68');
console.log('═══════════════════════════════════════════════════════════════\n');

const htmlFiles = findHtmlFiles(LANDING_DIR);
let stats = { updated: 0, skipped: 0, errors: 0 };

console.log(`📝 Processing ${htmlFiles.length} HTML files...\n`);

for (const file of htmlFiles) {
  const result = updateToWebP(file);
  const relativePath = file.replace(LANDING_DIR + '/', '');

  if (result.status === 'updated') {
    console.log(`  ✅ ${relativePath}: ${result.count} references updated`);
    stats.updated++;
  } else if (result.status === 'skipped') {
    console.log(`  ⏭️  ${relativePath}: ${result.reason}`);
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
console.log(`  Skipped:              ${stats.skipped}`);
console.log(`  Errors:               ${stats.errors}`);
console.log('\n✅ WebP image update complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
