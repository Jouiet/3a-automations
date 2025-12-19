#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';

async function downloadFile(key) {
  const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=${key}`;

  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN
    }
  });

  if (!response.ok) {
    throw new Error(`Failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.asset.value;
}

async function main() {
  console.log('📥 Downloading global.js from Shopify...\n');

  const content = await downloadFile('assets/global.js');
  fs.writeFileSync('LIVE_global.js', content, 'utf8');

  console.log('✅ Saved to: LIVE_global.js');
  console.log(`   Size: ${(content.length / 1024).toFixed(2)} KB`);

  // Check for custom elements
  const hasVariantSelects = content.includes("customElements.define('variant-selects'");
  const hasQuantityInput = content.includes("customElements.define('quantity-input'");
  const hasVariantRadios = content.includes("customElements.define('variant-radios'");

  console.log('\n🔍 Custom Elements Detected:');
  console.log(`   variant-selects: ${hasVariantSelects ? '✅' : '❌'}`);
  console.log(`   quantity-input: ${hasQuantityInput ? '✅' : '❌'}`);
  console.log(`   variant-radios: ${hasVariantRadios ? '✅' : '❌'}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
