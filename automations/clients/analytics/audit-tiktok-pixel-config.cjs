#!/usr/bin/env node
/**
 * AUDIT: TikTok Pixel Configuration
 * Purpose: Verify TikTok Pixel ID in theme vs .env.local
 * Method: Read theme files + env vars
 * Zero manual work: Automated verification
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const TIKTOK_PIXEL_ID_ENV = process.env.TIKTOK_PIXEL_ID;

console.log('================================================================================');
console.log('TIKTOK PIXEL CONFIGURATION - AUDIT');
console.log('================================================================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================================\n');

// Check .env.local
console.log('1. .ENV.LOCAL CHECK:');
console.log(`   TIKTOK_PIXEL_ID: ${TIKTOK_PIXEL_ID_ENV || '❌ NOT SET'}\n`);

// Check theme file
console.log('2. THEME FILE CHECK (snippets/tiktok-pixel-init.liquid):');

const themeFilePath = path.join(__dirname, '..', 'snippets', 'tiktok-pixel-init.liquid');

try {
  const themeContent = fs.readFileSync(themeFilePath, 'utf8');

  // Extract pixel ID from theme
  const pixelIdMatch = themeContent.match(/assign tiktok_pixel_id = ['"]([^'"]+)['"]/);
  const themePixelId = pixelIdMatch ? pixelIdMatch[1] : null;

  console.log(`   Pixel ID in theme: ${themePixelId}`);

  if (themePixelId === 'YOUR_TIKTOK_PIXEL_ID') {
    console.log(`   Status: ❌ PLACEHOLDER (not configured)\n`);
  } else if (themePixelId && themePixelId.length > 10) {
    console.log(`   Status: ✅ CONFIGURED (real pixel ID found)\n`);
  } else {
    console.log(`   Status: ⚠️  UNKNOWN\n`);
  }

  // Check for console warnings
  if (themeContent.includes("console.warn('[TikTok Pixel] ⚠️ Not configured")) {
    console.log('   Warning in code: ✅ Has placeholder warning (good for dev)\n');
  }

} catch (error) {
  console.log(`   ❌ ERROR: Cannot read theme file - ${error.message}\n`);
}

// Check if TikTok Access Token exists
console.log('3. TIKTOK ADS API CHECK:');
console.log(`   TIKTOK_ACCESS_TOKEN: ${process.env.TIKTOK_ACCESS_TOKEN || '❌ NOT SET'}`);
console.log(`   TIKTOK_ADVERTISER_ID: ${process.env.TIKTOK_ADVERTISER_ID || '❌ NOT SET'}\n`);

console.log('================================================================================');
console.log('RECOMMENDATIONS');
console.log('================================================================================\n');

if (!TIKTOK_PIXEL_ID_ENV) {
  console.log('❌ P0.3 STATUS: NOT CONFIGURED\n');
  console.log('NEXT STEPS:');
  console.log('1. Get TikTok Pixel ID from: https://ads.tiktok.com/i18n/events_manager');
  console.log('2. Add to .env.local: TIKTOK_PIXEL_ID=YOUR_PIXEL_ID');
  console.log('3. Update snippets/tiktok-pixel-init.liquid to use environment variable\n');
  console.log('ALTERNATIVE: Use TikTok Events Manager API to fetch pixel ID automatically');
  console.log('   Requires: TIKTOK_ACCESS_TOKEN + TIKTOK_ADVERTISER_ID\n');
} else {
  console.log('✅ P0.3 STATUS: CONFIGURED in .env.local\n');
  console.log('NEXT STEP: Update theme to use environment variable');
  console.log('   Current: Hardcoded placeholder');
  console.log('   Target: Read from .env.local or Shopify metafield\n');
}

console.log('================================================================================\n');
