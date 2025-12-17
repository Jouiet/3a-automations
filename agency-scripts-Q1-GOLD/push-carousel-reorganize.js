#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = 147139985460;
const API_VERSION = '2024-10';

async function pushTemplate() {
  console.log('🚀 Pushing reorganized carousel (8 slides) to Shopify theme', THEME_ID);

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
  console.log('   Size:', (templateContent.length / 1024).toFixed(1), 'KB');
  console.log('');
  console.log('📊 CAROUSEL REORGANIZATION:');
  console.log('   Slide 1: motorcycle-lady-optimized.webp (4.4MB) ← PREMIÈRE PLACE');
  console.log('   Slide 2: pexels-saad-aljasser-740728748-18530662-optimized.webp (258KB)');
  console.log('   Slide 3: pexels-pixabay-37527.webp (288.7KB) - Gloves');
  console.log('   Slide 4: pexels-nicholas-dias-1119542-2116475-optimized.webp (1.9MB) ← NOUVEAU');
  console.log('   Slide 5: motorcycle-3-optimized.webp (861KB)');
  console.log('   Slide 6: pexels-pixabay-46224.webp (257.9KB)');
  console.log('   Slide 7: motorcycle-1-optimized.webp (819KB)');
  console.log('   Slide 8: pexels-ene-marius-241207761-33015693.webp (274.6KB)');
  console.log('');
  console.log('✅ Total: 8 slides (was 7)');
}

pushTemplate().catch(console.error);
