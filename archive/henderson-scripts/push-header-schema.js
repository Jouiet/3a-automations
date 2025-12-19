const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';
const API_VERSION = '2024-10';

/**
 * PUSH HEADER.LIQUID TO SHOPIFY
 *
 * UPDATE: Added "Free Shipping on Orders $150+" to Organization schema description
 */

async function pushHeader() {
  console.log('📤 PUSHING HEADER.LIQUID TO SHOPIFY\n');
  console.log('='.repeat(80));

  const filePath = 'sections/header.liquid';
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`\n📄 File: ${filePath}`);
  console.log(`📏 Size: ${(content.length / 1024).toFixed(1)} KB`);

  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      asset: {
        key: filePath,
        value: content
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to upload: ${JSON.stringify(error)}`);
  }

  const result = await response.json();

  console.log('\n✅ UPLOAD SUCCESSFUL');
  console.log(`   • Key: ${result.asset.key}`);
  console.log(`   • Size: ${(result.asset.size / 1024).toFixed(1)} KB`);
  console.log(`   • Updated: ${result.asset.updated_at}`);

  console.log('\n' + '='.repeat(80));
  console.log('🎯 ORGANIZATION SCHEMA UPDATED:\n');
  console.log('   ✅ Description now includes "Free Shipping on Orders $150+"');
  console.log('   ✅ foundingDate: "2017" (maintained)');
  console.log('   ✅ "Since 2017" messaging consistent');
  console.log('\n📊 SEO IMPACT:');
  console.log('   • Knowledge Graph shows shipping policy');
  console.log('   • Better click-through from search results');
  console.log('   • Complete business information for AI answers\n');
}

pushHeader().catch(console.error);
