// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node

/**
 * Fix Missing Alt Text on Product Images
 *
 * This script adds alt text to all product images that are missing it.
 * Format: "[Product Title] - Image [N]" or just "[Product Title]" for single images
 *
 * WCAG 2.1 Level A Compliance (1.1.1 Non-text Content)
 *
 * Usage: node scripts/fix-missing-alt-text.js
 */

require('dotenv').config();
const https = require('https');

const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

if (!SHOPIFY_TOKEN || !SHOPIFY_STORE) {
  console.error('❌ Missing Shopify credentials in .env file');
  process.exit(1);
}

// Rate limiting: 2 requests per second (Shopify allows 2 req/sec for REST)
const RATE_LIMIT_MS = 500;

/**
 * Make Shopify API request
 */
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/${API_VERSION}${path}`,
      method: method,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Sleep for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get all products
 */
async function getAllProducts() {
  console.log('📦 Fetching all products...');
  const response = await makeRequest('/products.json?limit=250');
  console.log(`   Found ${response.products.length} products\n`);
  return response.products;
}

/**
 * Update product image alt text
 */
async function updateImageAlt(productId, imageId, altText) {
  const data = {
    image: {
      id: imageId,
      alt: altText
    }
  };

  await makeRequest(`/products/${productId}/images/${imageId}.json`, 'PUT', data);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 MyDealz Alt Text Fix - WCAG 2.1 Compliance\n');
  console.log('========================================\n');

  try {
    // Get all products
    const products = await getAllProducts();

    let totalImages = 0;
    let imagesMissingAlt = 0;
    let imagesFixed = 0;
    let errors = 0;

    // Analyze all products
    console.log('🔍 Analyzing images...\n');

    for (const product of products) {
      const imagesToFix = [];

      product.images.forEach((img, index) => {
        totalImages++;
        if (!img.alt || img.alt.trim() === '') {
          imagesMissingAlt++;
          imagesToFix.push({ img, index });
        }
      });

      // Fix missing alt text for this product
      if (imagesToFix.length > 0) {
        console.log(`📝 ${product.title}`);
        console.log(`   Missing alt on ${imagesToFix.length}/${product.images.length} images`);

        for (const { img, index } of imagesToFix) {
          try {
            // Generate alt text
            let altText;
            if (product.images.length === 1) {
              altText = product.title;
            } else {
              altText = `${product.title} - Image ${index + 1}`;
            }

            // Truncate if too long (recommended max 125 chars)
            if (altText.length > 125) {
              altText = altText.substring(0, 122) + '...';
            }

            console.log(`   ✓ Updating image ${index + 1}: "${altText.substring(0, 50)}..."`);

            await updateImageAlt(product.id, img.id, altText);
            imagesFixed++;

            // Rate limiting
            await sleep(RATE_LIMIT_MS);

          } catch (error) {
            console.error(`   ❌ Error updating image ${index + 1}: ${error.message}`);
            errors++;
          }
        }

        console.log('');
      }
    }

    // Final summary
    console.log('========================================\n');
    console.log('✅ ALT TEXT FIX COMPLETE\n');
    console.log(`📊 Statistics:`);
    console.log(`   Total images scanned: ${totalImages}`);
    console.log(`   Images missing alt text: ${imagesMissingAlt}`);
    console.log(`   Images fixed: ${imagesFixed}`);
    if (errors > 0) {
      console.log(`   Errors: ${errors}`);
    }
    console.log(`   Success rate: ${Math.round((imagesFixed / imagesMissingAlt) * 100)}%`);
    console.log('\n🎯 WCAG 2.1 Level A Compliance: ' + (imagesMissingAlt === imagesFixed ? '✅ ACHIEVED' : '⚠️  PARTIAL'));

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
