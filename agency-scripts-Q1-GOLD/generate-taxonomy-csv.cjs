#!/usr/bin/env node
/**
 * Henderson Shop - Generate Taxonomy CSV for Shopify Import
 * NATIVE SOLUTION - No API, direct CSV generation
 *
 * Usage: node scripts/generate-taxonomy-csv.cjs
 * Output: products_taxonomy_import.csv
 *
 * Then import via: Shopify Admin → Products → Import
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-10';

// Shopify Standard Product Taxonomy Mapping
const TAXONOMY_MAP = {
  'Helmets': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Helmets',
  'Jackets': 'Apparel & Accessories > Clothing > Activewear > Motorcycle Clothing > Motorcycle Jackets',
  'Jackets & Pants': 'Apparel & Accessories > Clothing > Activewear > Motorcycle Clothing > Motorcycle Jackets',
  'Pants': 'Apparel & Accessories > Clothing > Activewear > Motorcycle Clothing > Motorcycle Pants',
  'Suits': 'Apparel & Accessories > Clothing > Activewear > Motorcycle Clothing > Motorcycle Suits',
  'Gloves': 'Apparel & Accessories > Clothing Accessories > Gloves & Mittens > Motorcycle Gloves',
  'Boots': 'Apparel & Accessories > Shoes > Motorcycle Boots',
  'Protective Gear': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Body Armor',
  'Protection': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Body Armor',
  'Body Armor': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Body Armor',
  'Accessories': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Accessories',
  'Bags & Luggage': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Accessories > Motorcycle Bags & Luggage',
  'Electronics': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Accessories > Motorcycle Electronics',
  'Tools & Maintenance': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Accessories > Motorcycle Maintenance',
  'Bundle': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Accessories',
  'Motorcycle Bundle': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Accessories',
  'DEFAULT': 'Vehicles & Parts > Vehicle Parts & Accessories > Motorcycle Parts > Motorcycle Accessories'
};

/**
 * Fetch all products via REST API
 */
async function fetchAllProducts() {
  const allProducts = [];
  let nextPageInfo = null;
  const limit = 250;

  console.log('📊 Fetching products from Shopify...');

  while (true) {
    const result = await new Promise((resolve, reject) => {
      let path;
      if (nextPageInfo) {
        path = `/admin/api/${API_VERSION}/products.json?limit=${limit}&page_info=${nextPageInfo}`;
      } else {
        path = `/admin/api/${API_VERSION}/products.json?status=active&limit=${limit}`;
      }

      const options = {
        hostname: SHOP,
        path: path,
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const products = JSON.parse(responseData).products || [];
            const linkHeader = res.headers['link'];
            let nextPage = null;
            if (linkHeader) {
              const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="next"/);
              if (nextMatch) {
                nextPage = nextMatch[1];
              }
            }
            resolve({ products, nextPage });
          } else {
            reject(new Error(`API Error: ${res.statusCode} ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    if (result.products.length === 0) break;
    allProducts.push(...result.products);
    console.log(`  Fetched ${allProducts.length} products...`);

    if (!result.nextPage) break;
    nextPageInfo = result.nextPage;
  }

  console.log(`✅ Total: ${allProducts.length} products\n`);
  return allProducts;
}

/**
 * Generate CSV for Shopify import
 */
function generateCSV(products) {
  console.log('📝 Generating taxonomy CSV...\n');

  const csvLines = [];

  // CSV Header (Shopify format)
  csvLines.push('Handle,Product Category');

  let categorized = 0;
  let unknown = 0;

  products.forEach(product => {
    const productType = product.product_type || 'DEFAULT';
    const taxonomy = TAXONOMY_MAP[productType] || TAXONOMY_MAP['DEFAULT'];

    if (TAXONOMY_MAP[productType]) {
      categorized++;
    } else {
      unknown++;
      console.log(`⚠️  Unknown product type: "${productType}" → Using DEFAULT taxonomy`);
    }

    // CSV line: Handle, Taxonomy
    csvLines.push(`${product.handle},"${taxonomy}"`);
  });

  const csvContent = csvLines.join('\n');

  console.log('\n═'.repeat(70));
  console.log('📊 TAXONOMY MAPPING RESULTS');
  console.log('═'.repeat(70));
  console.log(`Total products: ${products.length}`);
  console.log(`✅ Categorized: ${categorized}`);
  console.log(`⚠️  Unknown types (using DEFAULT): ${unknown}`);
  console.log('');

  return csvContent;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Henderson Shop - Generate Taxonomy CSV');
  console.log('═'.repeat(70));
  console.log('');

  try {
    // Step 1: Fetch products
    const products = await fetchAllProducts();

    // Step 2: Generate CSV
    const csvContent = generateCSV(products);

    // Step 3: Save CSV
    const outputPath = 'products_taxonomy_import.csv';
    fs.writeFileSync(outputPath, csvContent);

    console.log(`✅ CSV generated: ${outputPath}`);
    console.log(`   ${products.length} products ready for import\n`);

    console.log('═'.repeat(70));
    console.log('📋 NEXT STEPS - SHOPIFY ADMIN IMPORT');
    console.log('═'.repeat(70));
    console.log('1. Go to: https://admin.shopify.com/store/jqp1x4-7e/products');
    console.log('2. Click "Import" button');
    console.log(`3. Upload: ${outputPath}`);
    console.log('4. Map columns:');
    console.log('   - Handle → Handle');
    console.log('   - Product Category → Product Category');
    console.log('5. Click "Import products"');
    console.log('6. Wait for completion (~2-3 minutes)');
    console.log('');
    console.log('✅ Result: All products will have Shopify Standard Taxonomy');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
