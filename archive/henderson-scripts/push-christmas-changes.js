#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';

const shopify = axios.create({
  baseURL: `https://${SHOP}/admin/api/2025-10`,
  headers: {
    'X-Shopify-Access-Token': ACCESS_TOKEN,
    'Content-Type': 'application/json',
  },
});

const files = [
  'snippets/christmas-badge.liquid',
  'snippets/card-product.liquid',
  'sections/main-product.liquid',
];

async function pushFiles() {
  console.log('='.repeat(80));
  console.log('🎄 PUSH CHRISTMAS UPDATES TO SHOPIFY');
  console.log('='.repeat(80));

  try {
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      console.log(`\n📤 Uploading ${file}...`);
      
      await shopify.put(`/themes/${THEME_ID}/assets.json`, {
        asset: {
          key: file,
          value: content,
        },
      });
      
      console.log(`   ✅ Success`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Delete old black-friday-badge.liquid
    console.log(`\n🗑️  Deleting old black-friday-badge.liquid...`);
    await shopify.delete(`/themes/${THEME_ID}/assets.json`, {
      params: { 'asset[key]': 'snippets/black-friday-badge.liquid' }
    });
    console.log(`   ✅ Deleted`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ CHRISTMAS UPDATES LIVE!');
    console.log('='.repeat(80));
    console.log('🎄 Changes applied:');
    console.log('   - Black Friday badge → Merry Christmas badge');
    console.log('   - Color scheme: Orange/Red → Red/Green (Christmas colors)');
    console.log('   - Icon: 🔥 → 🎄');
    console.log('   - Text: BLACK FRIDAY → MERRY CHRISTMAS');
    console.log('\n🌐 Live site: https://www.hendersonshop.com');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

pushFiles();
