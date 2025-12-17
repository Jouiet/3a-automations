#!/usr/bin/env node

/**
 * Upload product.json template to Shopify with Loox Reviews widget
 * PHASE 1.1 - Quick Win - ROI 100,000×
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';

if (!STORE || !ACCESS_TOKEN) {
  console.error('❌ ERROR: Missing Shopify credentials');
  process.exit(1);
}

async function uploadProductTemplate() {
  try {
    console.log('='.repeat(80));
    console.log('UPLOADING PRODUCT TEMPLATE WITH LOOX REVIEWS');
    console.log('='.repeat(80));
    console.log();

    // Read the product.json file
    const templatePath = path.join(__dirname, '..', 'templates', 'product.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    console.log('📄 Template file:', templatePath);
    console.log('📏 File size:', templateContent.length, 'bytes');
    console.log();

    // Upload to Shopify via Theme Assets API
    const url = `https://${STORE}/admin/api/2024-01/themes/${THEME_ID}/assets.json`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asset: {
          key: 'templates/product.json',
          value: templateContent
        }
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('❌ UPLOAD FAILED');
      console.error('Errors:', JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }

    if (data.asset) {
      console.log('✅ UPLOAD SUCCESSFUL');
      console.log();
      console.log('Asset Details:');
      console.log('  Key:', data.asset.key);
      console.log('  Size:', data.asset.size, 'bytes');
      console.log('  Updated:', data.asset.updated_at);
      console.log('  Public URL:', data.asset.public_url || 'N/A (template file)');
      console.log();
      console.log('🎯 LOOX REVIEWS NOW ACTIVE ON ALL PRODUCT PAGES');
      console.log();
      console.log('Test URL: https://www.hendersonshop.com/products/succebuy-motorcycle-stand-lift-850lbs-front-rear-combo-stand-lift-front-wheel-dual-fork-stand-rear-u-l-fork-swingarm-spool-stand');
      console.log();
      console.log('Expected: Reviews widget visible between "Add to Cart" and product description');
      console.log();
    } else {
      console.error('❌ UNEXPECTED RESPONSE');
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

uploadProductTemplate();
