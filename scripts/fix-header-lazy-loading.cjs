#!/usr/bin/env node
/**
 * Fix Header Images - Add lazy loading properly
 * Session 68 - 2025-12-23
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

function fixHeaderImages(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(LANDING_DIR + '/', '');
    let modifications = 0;

    // Find img tags in header that don't have loading attribute
    // Header logos should use loading="eager" (not lazy) for LCP
    // But for audit purposes, we need to mark them

    // Pattern: img without loading attribute
    const imgRegex = /<img(?![^>]*loading)[^>]*src="[^"]*logo[^"]*"[^>]*>/gi;

    content = content.replace(imgRegex, (match) => {
      if (!match.includes('loading=')) {
        modifications++;
        // Header logo should be eager for performance
        return match.replace(/(<img)/, '$1 loading="eager"');
      }
      return match;
    });

    // Also add loading="lazy" to any remaining images without loading attribute
    content = content.replace(/<img(?![^>]*loading=)[^>]*>/gi, (match) => {
      modifications++;
      return match.replace(/(<img)/, '$1 loading="lazy"');
    });

    if (modifications > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { status: 'fixed', count: modifications };
    }

    return { status: 'skipped', reason: 'All images have loading attribute', count: 0 };
  } catch (err) {
    return { status: 'error', reason: err.message, count: 0 };
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    FIX HEADER IMAGE LOADING - Session 68');
console.log('═══════════════════════════════════════════════════════════════\n');

const htmlFiles = findHtmlFiles(LANDING_DIR);
let stats = { fixed: 0, skipped: 0, errors: 0, totalImages: 0 };

console.log(`📝 Processing ${htmlFiles.length} HTML files...\n`);

for (const file of htmlFiles) {
  const result = fixHeaderImages(file);
  const relativePath = file.replace(LANDING_DIR + '/', '');

  if (result.status === 'fixed') {
    console.log(`  ✅ ${relativePath}: ${result.count} images`);
    stats.fixed++;
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
console.log(`  Files fixed:          ${stats.fixed}`);
console.log(`  Images updated:       ${stats.totalImages}`);
console.log(`  Skipped:              ${stats.skipped}`);
console.log(`  Errors:               ${stats.errors}`);
console.log('\n✅ Header image loading fix complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
