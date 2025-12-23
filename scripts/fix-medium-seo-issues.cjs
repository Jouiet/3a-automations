#!/usr/bin/env node
/**
 * Fix MEDIUM Priority SEO Issues - Canonical, OG descriptions, AEO
 * Session 66 - 2025-12-23
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';
const BASE_URL = 'https://3a-automation.com';

// Pages needing canonical URLs
const CANONICAL_URLS = {
  '404.html': `${BASE_URL}/404.html`,
  'en/404.html': `${BASE_URL}/en/404.html`
};

// OG descriptions for pages missing them
const OG_DESCRIPTIONS = {
  '404.html': 'La page que vous recherchez n\'existe pas. Retournez à l\'accueil de 3A Automation.',
  'en/404.html': 'The page you\'re looking for doesn\'t exist. Return to 3A Automation homepage.',
  'legal/mentions-legales.html': 'Mentions légales de 3A Automation. Consultant en automatisation e-commerce.',
  'legal/politique-confidentialite.html': 'Politique de confidentialité de 3A Automation. Protection de vos données conformément au RGPD.',
  'en/legal/privacy.html': 'Privacy Policy of 3A Automation. We protect your data in compliance with GDPR.',
  'en/legal/terms.html': 'Terms of Service for 3A Automation. E-commerce automation consultant services.'
};

let stats = {
  canonicalAdded: 0,
  ogDescAdded: 0,
  errors: []
};

function addCanonicalUrl(filePath, canonicalUrl) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if canonical already exists
    if (content.includes('rel="canonical"') || content.includes("rel='canonical'")) {
      return false;
    }

    // Add canonical after <title> or in <head>
    if (content.includes('</title>')) {
      content = content.replace(
        '</title>',
        `</title>\n    <link rel="canonical" href="${canonicalUrl}">`
      );
    } else if (content.includes('</head>')) {
      content = content.replace(
        '</head>',
        `    <link rel="canonical" href="${canonicalUrl}">\n</head>`
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    stats.canonicalAdded++;
    return true;
  } catch (err) {
    stats.errors.push(`Canonical ${filePath}: ${err.message}`);
    return false;
  }
}

function addOgDescription(filePath, description) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if og:description exists
    if (content.includes('og:description')) {
      return false;
    }

    // Add after existing OG tags or after meta description
    if (content.includes('og:title')) {
      content = content.replace(
        /<meta\s+property="og:title"[^>]*>/i,
        `$&\n    <meta property="og:description" content="${description}">`
      );
    } else if (content.includes('meta name="description"')) {
      content = content.replace(
        /<meta\s+name="description"[^>]*>/i,
        `$&\n    <meta property="og:description" content="${description}">`
      );
    } else if (content.includes('</head>')) {
      content = content.replace(
        '</head>',
        `    <meta property="og:description" content="${description}">\n</head>`
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    stats.ogDescAdded++;
    return true;
  } catch (err) {
    stats.errors.push(`OG Desc ${filePath}: ${err.message}`);
    return false;
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    FIX MEDIUM PRIORITY SEO ISSUES - Session 66');
console.log('═══════════════════════════════════════════════════════════════\n');

// Process canonical URLs
console.log('🔗 Adding canonical URLs...\n');
for (const [page, url] of Object.entries(CANONICAL_URLS)) {
  const filePath = path.join(LANDING_DIR, page);
  if (fs.existsSync(filePath)) {
    if (addCanonicalUrl(filePath, url)) {
      console.log(`  ✅ ${page}: Canonical added`);
    } else {
      console.log(`  ⏭️  ${page}: Canonical already exists`);
    }
  } else {
    console.log(`  ❌ ${page}: File not found`);
  }
}

// Process OG descriptions
console.log('\n📱 Adding OG descriptions...\n');
for (const [page, desc] of Object.entries(OG_DESCRIPTIONS)) {
  const filePath = path.join(LANDING_DIR, page);
  if (fs.existsSync(filePath)) {
    if (addOgDescription(filePath, desc)) {
      console.log(`  ✅ ${page}: OG description added`);
    } else {
      console.log(`  ⏭️  ${page}: OG description already exists`);
    }
  } else {
    console.log(`  ❌ ${page}: File not found`);
  }
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                        SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Canonical URLs added:   ${stats.canonicalAdded}`);
console.log(`  OG descriptions added:  ${stats.ogDescAdded}`);
console.log(`  Errors:                 ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n⚠️  Errors encountered:');
  stats.errors.forEach(err => console.log(`  - ${err}`));
}

console.log('\n✅ MEDIUM priority SEO fixes complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
