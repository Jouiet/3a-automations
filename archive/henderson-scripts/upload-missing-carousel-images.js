#!/usr/bin/env node
/**
 * Upload missing carousel images from local CHOICE folder to Shopify
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';
const THEME_ID = 147139985460;

const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

// Images to upload (optimized webp versions)
const IMAGES_TO_UPLOAD = [
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-pixabay-46224-optimized.webp',
    shopifyKey: 'assets/pexels-pixabay-46224.webp'
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-jamphotography-2611690-optimized.webp',
    shopifyKey: 'assets/pexels-jamphotography-2611690.webp'
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/pexels-koprivakart-19351989-optimized.webp',
    shopifyKey: 'assets/pexels-koprivakart-19351989.webp'
  }
];

async function shopifyRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function uploadImage(localPath, shopifyKey) {
  console.log(`\n📤 Uploading: ${path.basename(localPath)}`);

  // Check if file exists
  if (!fs.existsSync(localPath)) {
    throw new Error(`File not found: ${localPath}`);
  }

  // Read file as base64 (Shopify requires base64 for binary assets)
  const fileBuffer = fs.readFileSync(localPath);
  const base64Content = fileBuffer.toString('base64');
  const fileSizeKB = (fileBuffer.length / 1024).toFixed(1);

  console.log(`   Size: ${fileSizeKB} KB`);

  // Upload to Shopify
  const endpoint = `/themes/${THEME_ID}/assets.json`;
  await shopifyRequest(endpoint, 'PUT', {
    asset: {
      key: shopifyKey,
      attachment: base64Content
    }
  });

  console.log(`   ✅ Uploaded to Shopify: ${shopifyKey}`);

  return { localPath, shopifyKey, size: fileSizeKB };
}

async function main() {
  console.log('🚀 Uploading missing carousel images to Shopify...\n');
  console.log(`📁 Source: /Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/`);
  console.log(`🎯 Destination: Shopify theme ${THEME_ID}\n`);
  console.log('═'.repeat(70));

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const image of IMAGES_TO_UPLOAD) {
    try {
      const result = await uploadImage(image.localPath, image.shopifyKey);
      results.push(result);
      successCount++;

      // Rate limiting: wait 1 second between uploads
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('═'.repeat(70));
  console.log(`✅ Successful: ${successCount}/${IMAGES_TO_UPLOAD.length}`);
  console.log(`❌ Failed: ${failCount}/${IMAGES_TO_UPLOAD.length}`);

  if (results.length > 0) {
    console.log('\n📸 Images uploaded:');
    results.forEach(r => {
      console.log(`   - ${path.basename(r.localPath)} (${r.size} KB)`);
    });
  }

  console.log('\n✅ Images are now available in Shopify!');
  console.log('⏭️  Next: Update templates/index.json to use these images');
  console.log('═'.repeat(70));

  process.exit(failCount > 0 ? 1 : 0);
}

main();
