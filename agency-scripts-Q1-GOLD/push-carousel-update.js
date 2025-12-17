#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = 147139985460;
const API_VERSION = '2024-10';

async function pushTemplate() {
  console.log('🚀 Pushing templates/index.json to Shopify theme', THEME_ID);

  const templateContent = fs.readFileSync('templates/index.json', 'utf8');

  const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json`, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      asset: {
        key: 'templates/index.json',
        value: templateContent
      }
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  console.log('✅ templates/index.json deployed to Shopify');
  console.log('   Size:', (templateContent.length / 1024).toFixed(1), 'KB');
  console.log('   Updated carousel slides 6 & 7');
  console.log('   - Slide 6: motorcycle-lady-optimized.webp (4.4MB)');
  console.log('   - Slide 7: motorcycle-1-optimized.webp (819KB)');
}

pushTemplate().catch(console.error);
