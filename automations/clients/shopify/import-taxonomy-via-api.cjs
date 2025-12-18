#!/usr/bin/env node
/**
 * P0.2: Import Shopify Product Taxonomy via API
 * Reads products_taxonomy_import.csv and updates each product
 */

require('dotenv').config({ path: '.env' });
const https = require('https');
const fs = require('fs');

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-10';

console.log('🔧 P0.2: IMPORT SHOPIFY PRODUCT TAXONOMY');
console.log('═'.repeat(70));

// Parse CSV
function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parse (handle quoted fields)
    const match = line.match(/^([^,]+),"(.+)"$/);
    if (match) {
      products.push({
        handle: match[1].trim(),
        productCategory: match[2].trim()
      });
    }
  }

  return products;
}

// Get product ID from handle
async function getProductIdByHandle(handle) {
  return new Promise((resolve) => {
    https.get({
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/products.json?handle=${handle}&fields=id`,
      headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const products = JSON.parse(data).products;
          if (products && products.length > 0) {
            resolve(products[0].id);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Update product taxonomy via GraphQL
async function updateProductTaxonomy(productId, productCategory) {
  return new Promise((resolve) => {
    const mutation = `
      mutation {
        productUpdate(input: {
          id: "gid://shopify/Product/${productId}"
          productCategory: "${productCategory}"
        }) {
          product {
            id
            productCategory
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const payload = JSON.stringify({ query: mutation });

    const req = https.request({
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/graphql.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          if (result.data && result.data.productUpdate && result.data.productUpdate.userErrors.length === 0) {
            resolve({ success: true });
          } else {
            resolve({
              success: false,
              errors: result.data ? result.data.productUpdate.userErrors : [{ message: 'Unknown error' }]
            });
          }
        } else {
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  // 1. Parse CSV
  console.log('\n📊 Parsing taxonomy CSV...\n');
  const products = parseCSV('products_taxonomy_import.csv');
  console.log(`Found ${products.length} products in CSV\n`);

  // 2. Process each product
  const results = {
    timestamp: new Date().toISOString(),
    total: products.length,
    updated: 0,
    failed: 0,
    notFound: 0,
    details: []
  };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const num = i + 1;

    console.log(`${num}/${products.length} ${product.handle.substring(0, 50)}...`);

    // Get product ID
    const productId = await getProductIdByHandle(product.handle);

    if (!productId) {
      console.log(`   ❌ NOT FOUND`);
      results.notFound++;
      results.details.push({
        handle: product.handle,
        status: 'NOT_FOUND'
      });
      await new Promise(resolve => setTimeout(resolve, 200));
      continue;
    }

    // Update taxonomy
    const updateResult = await updateProductTaxonomy(productId, product.productCategory);

    if (updateResult.success) {
      console.log(`   ✅ UPDATED`);
      results.updated++;
      results.details.push({
        handle: product.handle,
        productId,
        productCategory: product.productCategory,
        status: 'SUCCESS'
      });
    } else {
      console.log(`   ❌ FAILED: ${updateResult.errors ? updateResult.errors[0].message : updateResult.error}`);
      results.failed++;
      results.details.push({
        handle: product.handle,
        productId,
        productCategory: product.productCategory,
        status: 'FAILED',
        error: updateResult.errors ? updateResult.errors[0].message : updateResult.error
      });
    }

    // Rate limiting: 2 requests/sec
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 3. Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RÉSULTATS P0.2');
  console.log('═'.repeat(70));
  console.log(`Total: ${results.total}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Not found: ${results.notFound}`);
  console.log(`Success rate: ${(results.updated/results.total*100).toFixed(1)}%`);

  // Save results
  fs.writeFileSync('import-taxonomy-results.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved: import-taxonomy-results.json`);

  if (results.updated === results.total) {
    console.log(`\n🎉 P0.2: 100% COMPLETE!`);
  } else {
    console.log(`\n⚠️  P0.2: ${(results.updated/results.total*100).toFixed(1)}% complete`);
    console.log(`   ${results.failed + results.notFound} products need attention`);
  }
}

main().catch(console.error);
