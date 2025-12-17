// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * Get Product Images for Contest Page
 * Extract real product images from Shopify catalog
 */

import 'dotenv/config';
import fetch from 'node-fetch';

const STORE_URL = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2025-10';
const BASE_URL = `https://${STORE_URL}/admin/api/${API_VERSION}`;

async function getProducts() {
  const response = await fetch(`${BASE_URL}/products.json?limit=250`, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.products;
}

async function findContestImages() {
  console.log('🔍 Searching for winter products in your catalog...\n');

  const products = await getProducts();

  // Filter winter products
  const coats = products.filter(p =>
    (p.title.toLowerCase().includes('coat') ||
     p.title.toLowerCase().includes('jacket')) &&
    p.status === 'active' &&
    p.images.length > 0
  );

  const scarves = products.filter(p =>
    p.title.toLowerCase().includes('scarf') &&
    p.status === 'active' &&
    p.images.length > 0
  );

  const gloves = products.filter(p =>
    p.title.toLowerCase().includes('glove') &&
    p.status === 'active' &&
    p.images.length > 0
  );

  console.log('📊 Winter Products Found:');
  console.log(`   Coats/Jackets: ${coats.length}`);
  console.log(`   Scarves: ${scarves.length}`);
  console.log(`   Gloves: ${gloves.length}\n`);

  if (coats.length === 0) {
    console.log('❌ No winter coats found in catalog!\n');
    process.exit(1);
  }

  // If scarves/gloves missing, find alternatives
  let scarf = scarves[0];
  let glove = gloves[0];

  if (!scarf) {
    console.log('⚠️  No scarves found - using alternative winter accessory\n');
    // Find bags or accessories as alternative
    const alternatives = products.filter(p =>
      (p.title.toLowerCase().includes('bag') ||
       p.title.toLowerCase().includes('backpack')) &&
      p.status === 'active' &&
      p.images.length > 0
    );
    scarf = alternatives[0] || products[0];
  }

  if (!glove) {
    console.log('⚠️  No gloves found - using alternative winter accessory\n');
    // Find second alternative
    const alternatives = products.filter(p =>
      (p.title.toLowerCase().includes('bag') ||
       p.title.toLowerCase().includes('backpack')) &&
      p.status === 'active' &&
      p.images.length > 0
    );
    glove = alternatives[1] || products[1];
  }

  // Select best images
  console.log('✅ IMAGES FOR CONTEST PAGE:\n');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Image 1: Best coat for hero/bundle
  const heroCoat = coats.sort((a, b) => b.images.length - a.images.length)[0];
  console.log('📸 Image 1: Winter Coat Bundle (Hero)');
  console.log(`   Product: ${heroCoat.title}`);
  console.log(`   URL: ${heroCoat.images[0].src}`);
  console.log(`   Size: ${heroCoat.images[0].width}x${heroCoat.images[0].height}px\n`);

  // Image 2: Second best coat
  const productCoat = coats[1] || coats[0];
  console.log('📸 Image 2: Winter Coat (Product)');
  console.log(`   Product: ${productCoat.title}`);
  console.log(`   URL: ${productCoat.images[0].src}`);
  console.log(`   Size: ${productCoat.images[0].width}x${productCoat.images[0].height}px\n`);

  // Image 3: Best scarf (or alternative)
  console.log('📸 Image 3: Winter Accessory');
  console.log(`   Product: ${scarf.title}`);
  console.log(`   URL: ${scarf.images[0].src}`);
  console.log(`   Size: ${scarf.images[0].width}x${scarf.images[0].height}px\n`);

  // Image 4: Best gloves (or alternative)

  console.log('📸 Image 4: Gloves');
  console.log(`   Product: ${glove.title}`);
  console.log(`   URL: ${glove.images[0].src}`);
  console.log(`   Size: ${glove.images[0].width}x${glove.images[0].height}px\n`);

  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log('📋 NEXT STEPS:\n');
  console.log('   1. Copy the 4 URLs above');
  console.log('   2. Run: node scripts/get-contest-page.js');
  console.log('   3. Edit contest-page-current.html with these URLs');
  console.log('   4. Run: node scripts/update-contest-page.js\n');

  // Save URLs to file for easy copy-paste
  const imageData = {
    'winter-coat-bundle': {
      product: heroCoat.title,
      url: heroCoat.images[0].src,
      alt: `${heroCoat.title} - Premium Winter Coat`,
    },
    'winter-coat': {
      product: productCoat.title,
      url: productCoat.images[0].src,
      alt: `${productCoat.title}`,
    },
    'scarf': {
      product: scarf.title,
      url: scarf.images[0].src,
      alt: `${scarf.title}`,
    },
    'gloves': {
      product: glove.title,
      url: glove.images[0].src,
      alt: `${glove.title}`,
    },
  };

  // Write to JSON for scripts
  const fs = await import('fs/promises');
  await fs.writeFile(
    'contest-images.json',
    JSON.stringify(imageData, null, 2),
    'utf-8'
  );

  console.log('💾 Image data saved to: contest-images.json\n');

  return imageData;
}

findContestImages().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
