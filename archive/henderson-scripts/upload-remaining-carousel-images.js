#!/usr/bin/env node
/**
 * Upload 4 remaining carousel images from CHOICE folder to Shopify
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';
const THEME_ID = 147139985460;

const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

// 4 images to upload for the 7-slide carousel
const IMAGES_TO_UPLOAD = [
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/Motorcycle 1-optimized.webp',
    shopifyKey: 'assets/motorcycle-1-hero.webp',
    slide: 1,
    purpose: 'Main hero - DOT Helmets & Premium Gear'
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/Motorcycle 3-optimized.webp',
    shopifyKey: 'assets/motorcycle-3-gloves.webp',
    slide: 3,
    purpose: 'Premium Riding Gloves'
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/cruiser 6-optimized.webp',
    shopifyKey: 'assets/cruiser-6-boots.webp',
    slide: 6,
    purpose: 'Motorcycle Boots & Footwear'
  },
  {
    localPath: '/Users/mac/Desktop/henderson-shopify/Motos Images/CHOICE/Motorcycle 2-optimized.webp',
    shopifyKey: 'assets/motorcycle-2-accessories.webp',
    slide: 7,
    purpose: 'Tech & Travel Accessories'
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

async function uploadImage(image) {
  console.log(`\n📤 Uploading: ${path.basename(image.localPath)}`);
  console.log(`   Slide ${image.slide}: ${image.purpose}`);

  // Check if file exists
  if (!fs.existsSync(image.localPath)) {
    throw new Error(`File not found: ${image.localPath}`);
  }

  // Read file as base64
  const fileBuffer = fs.readFileSync(image.localPath);
  const base64Content = fileBuffer.toString('base64');
  const fileSizeKB = (fileBuffer.length / 1024).toFixed(1);

  console.log(`   Size: ${fileSizeKB} KB`);

  // Upload to Shopify
  const endpoint = `/themes/${THEME_ID}/assets.json`;
  await shopifyRequest(endpoint, 'PUT', {
    asset: {
      key: image.shopifyKey,
      attachment: base64Content
    }
  });

  console.log(`   ✅ Uploaded to Shopify: ${image.shopifyKey}`);

  return { ...image, size: fileSizeKB };
}

async function main() {
  console.log('🚀 Uploading 4 remaining carousel images to Shopify...\n');
  console.log('═'.repeat(70));

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const image of IMAGES_TO_UPLOAD) {
    try {
      const result = await uploadImage(image);
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
      console.log(`   Slide ${r.slide}: ${r.shopifyKey} (${r.size} KB)`);
    });
  }

  console.log('\n✅ Images are now available in Shopify!');
  console.log('⏭️  Next: Update templates/index.json to use these images');
  console.log('═'.repeat(70));

  process.exit(failCount > 0 ? 1 : 0);
}

main();
