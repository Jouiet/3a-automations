#!/usr/bin/env node
/**
 * P0.2: Import Shopify Product Taxonomy via Metafield
 * Uses product.metafields.custom.shopify_product_taxonomy
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-10';

console.log('🔧 P0.2: IMPORT TAXONOMY VIA METAFIELD');
console.log('═'.repeat(70));

// Parse CSV
function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

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

// Get product
async function getProduct(handle) {
  return new Promise((resolve) => {
    https.get({
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/products.json?handle=${handle}&fields=id,title,handle`,
      headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const products = JSON.parse(data).products;
          resolve(products && products.length > 0 ? products[0] : null);
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Update product taxonomy via metafield
async function updateProductTaxonomy(productId, productCategory) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      product: {
        id: productId,
        metafields: [
          {
            namespace: 'custom',
            key: 'product_taxonomy',
            value: productCategory,
            type: 'single_line_text_field'
          }
        ]
      }
    });

    const req = https.request({
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/products/${productId}.json`,
      method: 'PUT',
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
          resolve({ success: true });
        } else {
          resolve({ success: false, status: res.statusCode, error: data.substring(0, 200) });
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
  console.log('\n📊 Parsing taxonomy CSV...\n');
  const products = parseCSV('products_taxonomy_test.csv');
  console.log(`Found ${products.length} products\n`);

  const results = {
    timestamp: new Date().toISOString(),
    total: products.length,
    updated: 0,
    failed: 0,
    notFound: 0,
    details: []
  };

  let batchStart = 0;
  const batchSize = 50; // Process in batches

  while (batchStart < products.length) {
    const batch = products.slice(batchStart, batchStart + batchSize);
    console.log(`\n📦 BATCH ${Math.floor(batchStart/batchSize) + 1} (${batchStart + 1}-${batchStart + batch.length}/${products.length})`);
    console.log('─'.repeat(70));

    for (let i = 0; i < batch.length; i++) {
      const product = batch[i];
      const globalNum = batchStart + i + 1;

      console.log(`${globalNum}/${products.length} ${product.handle.substring(0, 45)}...`);

      // Get product
      const productData = await getProduct(product.handle);

      if (!productData) {
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
      const updateResult = await updateProductTaxonomy(productData.id, product.productCategory);

      if (updateResult.success) {
        console.log(`   ✅ OK`);
        results.updated++;
        results.details.push({
          handle: product.handle,
          productId: productData.id,
          status: 'SUCCESS'
        });
      } else {
        console.log(`   ❌ FAILED`);
        results.failed++;
        results.details.push({
          handle: product.handle,
          productId: productData.id,
          status: 'FAILED',
          error: updateResult.error || updateResult.status
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nBatch complete: ${results.updated}/${globalNum} updated so far`);
    batchStart += batchSize;
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RÉSULTATS P0.2');
  console.log('═'.repeat(70));
  console.log(`Total: ${results.total}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Not found: ${results.notFound}`);
  console.log(`Success rate: ${(results.updated/results.total*100).toFixed(1)}%`);

  fs.writeFileSync('import-taxonomy-metafield-results.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Results: import-taxonomy-metafield-results.json`);

  if (results.updated === results.total) {
    console.log(`\n🎉 P0.2: 100% COMPLETE!`);
  } else {
    console.log(`\n⚠️  P0.2: ${(results.updated/results.total*100).toFixed(1)}% complete`);
  }
}

main().catch(console.error);
