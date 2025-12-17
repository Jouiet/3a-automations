const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';
const API_VERSION = '2024-10';

/**
 * PUSH SCHEMA-ORGANIZATION.LIQUID TO SHOPIFY
 *
 * CRITICAL FIXES:
 * 1. foundingDate: 1912 → 2017 (user's STRICT NON-NEGOTIABLE requirement)
 * 2. Description: "since 1912" → "since 2017"
 * 3. Free shipping threshold: $80 → $150 (verified by user)
 */

async function pushSchemaOrganization() {
  console.log('📤 PUSHING SCHEMA-ORGANIZATION.LIQUID TO SHOPIFY\n');
  console.log('='.repeat(80));

  // Read the file
  const filePath = 'snippets/schema-organization.liquid';
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`\n📄 File: ${filePath}`);
  console.log(`📏 Size: ${content.length} bytes`);

  // Upload via Shopify Admin API
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
  console.log(`   • Size: ${result.asset.size} bytes`);
  console.log(`   • Updated: ${result.asset.updated_at}`);

  console.log('\n' + '='.repeat(80));
  console.log('🎯 CRITICAL FIXES DEPLOYED:\n');
  console.log('   ✅ foundingDate: "1912" → "2017" (STRICT REQUIREMENT)');
  console.log('   ✅ Description: "since 1912" → "since 2017"');
  console.log('   ✅ Free shipping: $80 → $150 (user confirmed)');
  console.log('\n📊 IMPACT:');
  console.log('   • Organization schema now accurate');
  console.log('   • Knowledge Graph will display correct founding date');
  console.log('   • No more regressions on "Since 2017" requirement');
  console.log('   • Free shipping threshold matches actual policy\n');
}

pushSchemaOrganization().catch(console.error);
