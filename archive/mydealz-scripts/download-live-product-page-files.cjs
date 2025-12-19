// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = process.env.THEME_ID;

const FILES_TO_DOWNLOAD = [
  'assets/sticky-widget-fix.js',
  'sections/main-product.liquid',
  'snippets/product-form.liquid',
  'snippets/cart-drawer.liquid',
  'templates/product.json'
];

async function downloadFile(key) {
  const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=${key}`;

  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN
    }
  });

  if (!response.ok) {
    console.error(`❌ Failed to download ${key}: ${response.statusText}`);
    return null;
  }

  const data = await response.json();
  return data.asset.value;
}

async function main() {
  console.log('🔍 DOWNLOADING LIVE FILES FROM SHOPIFY (MyDealz)\n');
  console.log('='.repeat(80));
  console.log(`Store: ${SHOPIFY_STORE}`);
  console.log(`Theme: ${THEME_ID}`);
  console.log('='.repeat(80));
  console.log('');

  for (const file of FILES_TO_DOWNLOAD) {
    console.log(`📥 Downloading: ${file}`);

    const content = await downloadFile(file);

    if (content) {
      const localPath = `/Users/mac/Desktop/MyDealz/LIVE_${file.replace(/\//g, '_')}`;
      fs.writeFileSync(localPath, content, 'utf8');
      console.log(`   ✅ Saved to: ${localPath}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ DOWNLOAD COMPLETE');
  console.log('='.repeat(80));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
