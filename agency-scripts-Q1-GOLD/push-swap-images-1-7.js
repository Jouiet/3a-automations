#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = 147139985460;
const API_VERSION = '2024-10';

async function pushTemplate() {
  console.log('🚀 Pushing image swap (positions 1 <=> 7) to Shopify theme', THEME_ID);

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
  console.log('🔄 IMAGE SWAP COMPLETE:');
  console.log('   Position 1: motorcycle-lady-optimized.webp (4.4MB) → motorcycle-1-optimized.webp (819KB)');
  console.log('   Position 7: motorcycle-1-optimized.webp (819KB) → motorcycle-lady-optimized.webp (4.4MB)');
  console.log('');
  console.log('✅ Carousel configuration updated');
}

pushTemplate().catch(console.error);
