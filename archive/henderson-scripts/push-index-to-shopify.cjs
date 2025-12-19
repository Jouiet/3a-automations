#!/usr/bin/env node

/**
 * PUSH templates/index.json TO SHOPIFY
 *
 * Theme ID: 147139985460 (Henderson-Shop/main)
 * File: templates/index.json
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

const STORE = process.env.SHOPIFY_STORE || 'jqp1x4-7e.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';
const FILE_KEY = 'templates/index.json';
const LOCAL_FILE = 'templates/index.json';

console.log('🚀 PUSH templates/index.json TO SHOPIFY');
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

// Verify the fix is present
const hasBundlesKits = localContent.includes('"collection": "bundles-and-kits"');
const hasTouring = localContent.includes('"collection": "touring"');

console.log('Verification:');
console.log(`  - bundles-and-kits: ${hasBundlesKits ? '✅ PRESENT' : '❌ MISSING'}`);
console.log(`  - touring: ${hasTouring ? '✅ PRESENT' : '❌ MISSING'}`);
console.log('');

if (!hasBundlesKits || !hasTouring) {
  console.error('❌ ERROR: Expected collections not found in file');
  process.exit(1);
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
      console.log('✅ templates/index.json DEPLOYED TO SHOPIFY');
      console.log('═'.repeat(70));
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
