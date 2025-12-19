#!/usr/bin/env node
/**
 * Upload 4 unique carousel images to Shopify
 * Organization:
 * - Slide 1: racing-aprilia-bike.webp
 * - Slide 4: sportbike-black-red-track.webp
 * - Slide 6: harley-davidson-sunset.webp
 * - Slide 7: motocross-jump-action.webp
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';
const THEME_ID = 147139985460;
const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

// 4 unique images from user screenshots
const IMAGES = [
  {
    name: 'racing-aprilia-bike.webp',
    slide: 1,
    description: 'Aprilia racing bike on track - professional racing gear'
  },
  {
    name: 'sportbike-black-red-track.webp',
    slide: 4,
    description: 'Black/red sportbike cornering - protection gear showcase'
  },
  {
    name: 'harley-davidson-sunset.webp',
    slide: 6,
    description: 'Harley Davidson cruiser at sunset - classic riding'
  },
  {
    name: 'motocross-jump-action.webp',
    slide: 7,
    description: 'Motocross bike jumping - extreme riding gear'
  }
];

console.log('🚀 Uploading 4 unique carousel images to Shopify\n');
console.log('Organization:');
IMAGES.forEach(img => {
  console.log(`  Slide ${img.slide}: ${img.name}`);
});
console.log('\n' + '='.repeat(70));

// Note: Images need to be base64 encoded from the screenshots
// This script assumes images are already saved in temp directory
console.log('\n⚠️  MANUAL STEP REQUIRED:');
console.log('Screenshots provided by user need to be:');
console.log('1. Saved as WebP files');
console.log('2. Uploaded to Shopify Admin UI (Settings → Files)');
console.log('3. Or uploaded via API with base64 encoding');
console.log('\nAlternative: Use Shopify Admin UI to upload these 4 images');
console.log('Then update index.json with the correct image references');
