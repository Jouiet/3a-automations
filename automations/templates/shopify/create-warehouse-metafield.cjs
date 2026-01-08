#!/usr/bin/env node
/**
 * OPTION 3: Create Warehouse Location Metafield
 *
 * PURPOSE: Create custom metafield for warehouse location tracking
 *
 * WHAT THIS DOES:
 * 1. Creates metafield definition in Shopify: custom.warehouse_location
 * 2. Optionally imports data from warehouse-location-data.json (from Option 1)
 * 3. Provides update script for future product imports
 *
 * CRITICAL: This does NOT fetch warehouse data from suppliers
 * It only creates the STRUCTURE to store this data when available
 *
 * Usage:
 *   node scripts/create-warehouse-metafield.cjs
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const https = require('https');
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE.replace('https://', '').replace('.myshopify.com', '');
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const DATA_FILE = './warehouse-location-data.json';

/**
 * Create metafield definition
 */
async function createMetafieldDefinition() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      metafield_definition: {
        name: 'Warehouse Location',
        namespace: 'custom',
        key: 'warehouse_location',
        description: 'Product warehouse/shipping origin location (e.g., USA, Canada, China)',
        type: 'single_line_text_field',
        owner_type: 'PRODUCT'
      }
    });

    const options = {
      hostname: `${SHOPIFY_STORE}.myshopify.com`,
      path: '/admin/api/2025-10/metafield_definitions.json',
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(JSON.parse(responseData).metafield_definition);
        } else if (res.statusCode === 422) {
          // Already exists
          console.log('ℹ️  Metafield definition already exists');
          resolve({ exists: true });
        } else {
          reject(new Error(`API Error: ${res.statusCode} ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Update product metafield
 */
async function updateProductMetafield(productId, warehouseLocation) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      metafield: {
        namespace: 'custom',
        key: 'warehouse_location',
        value: warehouseLocation,
        type: 'single_line_text_field'
      }
    });

    const options = {
      hostname: `${SHOPIFY_STORE}.myshopify.com`,
      path: `/admin/api/2025-10/products/${productId}/metafields.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(JSON.parse(responseData).metafield);
        } else {
          reject(new Error(`API Error: ${res.statusCode} ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// MAIN EXECUTION
(async () => {
  console.log('🔧 Warehouse Location Metafield Creator');
  console.log('═'.repeat(70));
  console.log('');

  try {
    // Step 1: Create metafield definition
    console.log('📝 Creating metafield definition...');
    const definition = await createMetafieldDefinition();

    if (definition.exists) {
      console.log('✅ Metafield definition already exists: custom.warehouse_location');
    } else {
      console.log('✅ Metafield definition created:');
      console.log(`   Namespace: ${definition.namespace}`);
      console.log(`   Key: ${definition.key}`);
      console.log(`   Type: ${definition.type}`);
      console.log(`   ID: ${definition.id}`);
    }
    console.log('');

    // Step 2: Check if warehouse data file exists
    if (!fs.existsSync(DATA_FILE)) {
      console.log('ℹ️  No warehouse data file found');
      console.log(`   Expected: ${DATA_FILE}`);
      console.log('');
      console.log('NEXT STEPS:');
      console.log('1. Export CSV from supplier dashboard');
      console.log('2. Run: node scripts/parse-warehouse-csv.cjs');
      console.log('3. Re-run this script to import data');
      console.log('');
      console.log('OR manually update metafields via Shopify Admin:');
      console.log('   Products → Select product → Metafields → custom.warehouse_location');
      process.exit(0);
    }

    // Step 3: Load warehouse data
    console.log('📂 Loading warehouse data...');
    const warehouseData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`✅ Loaded data for ${warehouseData.products.length} products`);
    console.log('');

    // Step 4: Update product metafields
    console.log('🔄 Updating product metafields...');
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of warehouseData.products) {
      if (!product.warehouse || product.warehouse === '') {
        skipped++;
        continue;
      }

      if (!product.id) {
        console.warn(`⚠️  Skipping product "${product.title}": No product ID`);
        skipped++;
        continue;
      }

      try {
        await updateProductMetafield(product.id, product.warehouse);
        updated++;
        console.log(`✅ ${updated}/${warehouseData.products.length} ${product.title.substring(0, 50)} - ${product.warehouse}`);

        // Rate limiting: 2 requests/second
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errors++;
        console.error(`❌ Error updating ${product.title}: ${error.message}`);
      }
    }

    console.log('');
    console.log('═'.repeat(70));
    console.log('📊 RESULTS');
    console.log('═'.repeat(70));
    console.log(`Total products: ${warehouseData.products.length}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped (no warehouse data): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('');

    if (updated > 0) {
      console.log('✅ Metafield system ready!');
      console.log('');
      console.log('USAGE:');
      console.log('- Liquid: {{ product.metafields.custom.warehouse_location }}');
      console.log('- GraphQL: metafield(namespace: "custom", key: "warehouse_location") { value }');
      console.log('');
      console.log('CONDITIONAL LOGIC EXAMPLE:');
      console.log('{% if product.metafields.custom.warehouse_location contains "USA" %}');
      console.log('  Fast shipping available (5-7 days)');
      console.log('{% else %}');
      console.log('  Standard shipping (10-20 days)');
      console.log('{% endif %}');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
})();
