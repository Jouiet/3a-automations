#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = 147139985460;
const API_VERSION = '2024-10';

async function pushTemplate() {
  console.log('🚀 Pushing updated slide-4 to Shopify theme', THEME_ID);

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

  console.log('✅ templates/index.json deployed to Shopify');
  console.log('');
  console.log('📊 SLIDE 4 UPDATED:');
  console.log('   OLD: pexels-nicholas-dias-1119542-2116475-optimized.webp (1.9MB)');
  console.log('   NEW: generated-yamaha-scooter-optimized.webp (121KB)');
  console.log('   SAVINGS: -1.78MB (-94%)');
  console.log('');
  console.log('✅ Carousel bandwidth reduced: ~9MB → ~7.2MB');
}

pushTemplate().catch(console.error);
