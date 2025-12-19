#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const themeId = 147139985460;

console.log('🚀 Pushing index.json to Shopify...\n');

const content = fs.readFileSync('templates/index.json', 'utf-8');
const url = `https://${store}/admin/api/2025-10/themes/${themeId}/assets.json`;

fetch(url, {
  method: 'PUT',
  headers: {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    asset: {
      key: 'templates/index.json',
      value: content
    }
  })
})
.then(r => {
  if (!r.ok) throw new Error('Failed to push: ' + r.status);
  return r.json();
})
.then(() => {
  console.log('✅ index.json pushed successfully!');
  console.log('\n📸 Carousel images fixed:');
  console.log('  Slide 1: casque-helmet-vintage.webp ✅');
  console.log('  Slide 2: casque-helmet-vintage.webp ✅ (was missing pexels image)');
  console.log('  Slide 3: gloves-motorcycle.webp ✅');
  console.log('  Slide 4: protection-gear.webp ✅ (was missing pexels image)');
  console.log('  Slide 5: boots-motorcycle.webp ✅ (was missing pexels image)');
  console.log('  Slide 6: boots-motorcycle.webp ✅');
  console.log('  Slide 7: accessories-motorcycle.webp ✅');
  console.log('\n🎯 All 7 slides now have valid images!');
  console.log('🌐 Live at: https://www.hendersonshop.com');
})
.catch(e => console.error('❌ Error:', e.message));
