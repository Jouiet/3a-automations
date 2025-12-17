#!/usr/bin/env node

/**
 * PUSH layout/theme.liquid TO SHOPIFY
 *
 * Fix: Remove reference to non-existent welcome-popup.liquid snippet
 * Theme ID: 147139985460 (Henderson-Shop/main)
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

const STORE = process.env.SHOPIFY_STORE || 'jqp1x4-7e.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';
const FILE_KEY = 'layout/theme.liquid';
const LOCAL_FILE = 'layout/theme.liquid';

console.log('🚀 PUSH layout/theme.liquid TO SHOPIFY');
console.log('═'.repeat(70));
console.log('');
console.log(`Store: ${STORE}`);
console.log(`Theme ID: ${THEME_ID}`);
console.log(`File: ${FILE_KEY}`);
console.log('');

// Read local file
const localContent = fs.readFileSync(LOCAL_FILE, 'utf8');

console.log(`File size: ${localContent.length} bytes`);
console.log('');

// Verify the fix is present (welcome-popup reference should NOT be present)
const hasWelcomePopup = localContent.includes("render 'welcome-popup'");
const hasExitIntent = localContent.includes("render 'exit-intent-popup'");

console.log('Verification:');
console.log(`  - exit-intent-popup reference: ${hasExitIntent ? '✅ PRESENT (correct)' : '❌ MISSING'}`);
console.log(`  - welcome-popup reference: ${hasWelcomePopup ? '❌ STILL PRESENT (error)' : '✅ REMOVED (correct)'}`);
console.log('');

if (hasWelcomePopup) {
  console.error('❌ ERROR: welcome-popup reference still present in file');
  process.exit(1);
}

if (!hasExitIntent) {
  console.error('⚠️  WARNING: exit-intent-popup reference missing (unexpected)');
}

// Prepare API request
const payload = JSON.stringify({
  asset: {
    key: FILE_KEY,
    value: localContent
  }
});

const options = {
  hostname: STORE,
  path: `/admin/api/2024-10/themes/${THEME_ID}/assets.json`,
  method: 'PUT',
  headers: {
    'X-Shopify-Access-Token': TOKEN,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('📤 Pushing to Shopify...');
console.log('');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✅ SUCCESS!');
      console.log('');
      console.log('Response:');
      console.log(`  - Key: ${response.asset.key}`);
      console.log(`  - Theme ID: ${response.asset.theme_id}`);
      console.log(`  - Updated: ${response.asset.updated_at}`);
      console.log(`  - Size: ${response.asset.size} bytes`);
      console.log(`  - Checksum: ${response.asset.checksum}`);
      console.log('');
      console.log('═'.repeat(70));
      console.log('✅ layout/theme.liquid DEPLOYED TO SHOPIFY');
      console.log('═'.repeat(70));
      console.log('');
      console.log('Liquid error should be RESOLVED:');
      console.log('  ❌ OLD: "Could not find asset snippets/welcome-popup.liquid"');
      console.log('  ✅ NEW: No error (reference removed)');
      console.log('');
      console.log('Next: Verify homepage at https://www.hendersonshop.com');
      console.log('(Allow 5-10 minutes for cache to clear)');
    } else {
      console.error(`❌ API Error: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  process.exit(1);
});

req.write(payload);
req.end();
