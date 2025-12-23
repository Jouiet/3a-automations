#!/usr/bin/env node
/**
 * Add Twitter Card Meta Tags to All Pages
 * Session 68 - 2025-12-23
 *
 * Adds twitter:card, twitter:title, twitter:description, twitter:image
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';
const BASE_URL = 'https://3a-automation.com';
const TWITTER_HANDLE = '@3a_automation';
const DEFAULT_IMAGE = '/og-image.png';

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

function addTwitterCards(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(LANDING_DIR + '/', '');

    // Check if Twitter cards already exist
    if (content.includes('twitter:card')) {
      return { status: 'skipped', reason: 'Twitter cards already exist' };
    }

    // Extract title from <title> tag
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '3A Automation';

    // Extract description from meta description
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const description = descMatch ? descMatch[1] : 'Automatisation e-commerce avec IA - Shopify, Klaviyo, GA4';

    // Generate Twitter Card meta tags
    const twitterCards = `
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${TWITTER_HANDLE}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description.substring(0, 200)}">
    <meta name="twitter:image" content="${BASE_URL}${DEFAULT_IMAGE}">`;

    // Insert after OG tags or before </head>
    if (content.includes('og:image')) {
      content = content.replace(
        /(<meta\s+property="og:image"[^>]*>)/i,
        `$1${twitterCards}`
      );
    } else if (content.includes('</head>')) {
      content = content.replace(
        '</head>',
        `${twitterCards}\n</head>`
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    return { status: 'added', file: relativePath };
  } catch (err) {
    return { status: 'error', reason: err.message };
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    ADD TWITTER CARD META TAGS - Session 68');
console.log('═══════════════════════════════════════════════════════════════\n');

const htmlFiles = findHtmlFiles(LANDING_DIR);
let stats = { added: 0, skipped: 0, errors: 0 };

console.log(`📝 Processing ${htmlFiles.length} HTML files...\n`);

for (const file of htmlFiles) {
  const result = addTwitterCards(file);
  const relativePath = file.replace(LANDING_DIR + '/', '');

  if (result.status === 'added') {
    console.log(`  ✅ ${relativePath}`);
    stats.added++;
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
console.log(`  Twitter Cards added:  ${stats.added}`);
console.log(`  Skipped (existing):   ${stats.skipped}`);
console.log(`  Errors:               ${stats.errors}`);
console.log('\n✅ Twitter Card meta tags complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
