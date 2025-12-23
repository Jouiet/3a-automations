#!/usr/bin/env node
/**
 * Add Lazy Loading to Below-Fold Images
 * Session 68 - 2025-12-23
 *
 * Adds loading="lazy" to footer/below-fold images
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

function addLazyLoading(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(LANDING_DIR + '/', '');
    let modifications = 0;

    // Find all img tags without loading attribute
    // But skip hero/above-fold images (first img in body)
    const imgRegex = /<img(?![^>]*loading=)[^>]*>/gi;
    const matches = content.match(imgRegex);

    if (!matches || matches.length === 0) {
      return { status: 'skipped', reason: 'No images to update', count: 0 };
    }

    // Add loading="lazy" to footer images (those appearing after <footer>)
    // Also add to any img without loading attribute that's not the first one
    content = content.replace(imgRegex, (match, offset) => {
      // Check if this is in footer section
      const beforeMatch = content.substring(0, offset);
      const isInFooter = beforeMatch.includes('<footer');
      const isAfterHero = beforeMatch.includes('</section>'); // After first section

      if (isInFooter || isAfterHero) {
        modifications++;
        // Add loading="lazy" before the closing >
        return match.replace(/>$/, ' loading="lazy">').replace(/\s+>/g, '>');
      }
      return match;
    });

    if (modifications > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { status: 'added', count: modifications };
    }

    return { status: 'skipped', reason: 'No below-fold images found', count: 0 };
  } catch (err) {
    return { status: 'error', reason: err.message, count: 0 };
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    ADD LAZY LOADING TO IMAGES - Session 68');
console.log('═══════════════════════════════════════════════════════════════\n');

const htmlFiles = findHtmlFiles(LANDING_DIR);
let stats = { totalImages: 0, filesModified: 0, skipped: 0, errors: 0 };

console.log(`📝 Processing ${htmlFiles.length} HTML files...\n`);

for (const file of htmlFiles) {
  const result = addLazyLoading(file);
  const relativePath = file.replace(LANDING_DIR + '/', '');

  if (result.status === 'added') {
    console.log(`  ✅ ${relativePath}: ${result.count} images`);
    stats.totalImages += result.count;
    stats.filesModified++;
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
console.log(`  Files modified:       ${stats.filesModified}`);
console.log(`  Images lazy loaded:   ${stats.totalImages}`);
console.log(`  Skipped:              ${stats.skipped}`);
console.log(`  Errors:               ${stats.errors}`);
console.log('\n✅ Lazy loading complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
