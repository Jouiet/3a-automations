#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = 147139985460;
const API_VERSION = '2024-10';
const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

const IMAGES = [
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-timmossholder-3076826-optimized.webp',
    shopifyKey: 'assets/pexels-timmossholder-3076826.webp',
    slide: 6,
    type: 'Cruiser/touring bike'
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-bylukemiller-33141882-optimized.webp',
    shopifyKey: 'assets/pexels-bylukemiller-33141882.webp',
    slide: 7,
    type: 'Off-road/adventure bike'
  }
];

async function shopifyRequest(endpoint, method, body) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function uploadImage(img) {
  console.log(`\n📤 Slide ${img.slide}: ${img.type}`);
  console.log(`   File: ${img.localPath.split('/').pop()}`);

  const fileBuffer = fs.readFileSync(img.localPath);
  const base64Content = fileBuffer.toString('base64');
  const sizeKB = (fileBuffer.length / 1024).toFixed(1);

  console.log(`   Size: ${sizeKB} KB`);

  await shopifyRequest(`/themes/${THEME_ID}/assets.json`, 'PUT', {
    asset: {
      key: img.shopifyKey,
      attachment: base64Content
    }
  });

  console.log(`   ✅ Uploaded: ${img.shopifyKey}`);
  return { ...img, sizeKB };
}

async function main() {
  console.log('🚀 Uploading 2 additional carousel images\n');
  console.log('='.repeat(70));

  const results = [];
  for (const img of IMAGES) {
    try {
      const result = await uploadImage(img);
      results.push(result);
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${results.length}/${IMAGES.length}`);

  if (results.length > 0) {
    console.log('\n📸 Images uploaded:');
    results.forEach(r => console.log(`   Slide ${r.slide}: ${r.shopifyKey} (${r.sizeKB} KB)`));
  }

  console.log('\n⏭️  Next: Update index.json with 4 unique images');
  console.log('='.repeat(70));
}

main();
