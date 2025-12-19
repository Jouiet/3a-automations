#!/usr/bin/env node
/**
 * Henderson Shop - Export Products to CSV
 *
 * Exports all ACTIVE products to Shopify-compatible CSV format
 * Compatible with Shopify Import functionality
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-10';

if (!ACCESS_TOKEN || !SHOP) {
  console.error('❌ SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN required in .env.local');
  process.exit(1);
}

console.log('📦 Henderson Shop - Export Products to CSV');
console.log('═'.repeat(70));
console.log('');

/**
 * Fetch all ACTIVE products via REST API
 */
async function fetchAllProducts() {
  const allProducts = [];
  let nextPageInfo = null;
  const limit = 250;

  console.log('📊 Fetching ACTIVE products from Shopify...');

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

            // Parse Link header for next page
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

    // Rate limiting: 2 requests/second (Shopify limit: 40/second)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return allProducts;
}

/**
 * Convert products to Shopify CSV format
 */
function productsToCSV(products) {
  // Shopify CSV headers (minimal for reimport)
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Option2 Name',
    'Option2 Value',
    'Option3 Name',
    'Option3 Value',
    'Variant SKU',
    'Variant Grams',
    'Variant Inventory Tracker',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Fulfillment Service',
    'Variant Price',
    'Variant Compare At Price',
    'Variant Requires Shipping',
    'Variant Taxable',
    'Variant Barcode',
    'Image Src',
    'Image Position',
    'Image Alt Text',
    'Gift Card',
    'SEO Title',
    'SEO Description',
    'Google Shopping / Google Product Category',
    'Google Shopping / Gender',
    'Google Shopping / Age Group',
    'Google Shopping / MPN',
    'Google Shopping / AdWords Grouping',
    'Google Shopping / AdWords Labels',
    'Google Shopping / Condition',
    'Google Shopping / Custom Product',
    'Google Shopping / Custom Label 0',
    'Google Shopping / Custom Label 1',
    'Google Shopping / Custom Label 2',
    'Google Shopping / Custom Label 3',
    'Google Shopping / Custom Label 4',
    'Variant Image',
    'Variant Weight Unit',
    'Variant Tax Code',
    'Cost per item',
    'Status'
  ];

  const rows = [headers];

  products.forEach(product => {
    const baseRow = {
      'Handle': product.handle || '',
      'Title': product.title || '',
      'Body (HTML)': product.body_html || '',
      'Vendor': product.vendor || '',
      'Type': product.product_type || '',
      'Tags': product.tags || '',
      'Published': product.published_at ? 'TRUE' : 'FALSE',
      'Gift Card': 'FALSE',
      'SEO Title': product.title || '',
      'SEO Description': '', // Will be filled by P0.3
      'Status': product.status || 'active'
    };

    // First row: product data + first variant
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      const option1 = product.options && product.options[0];
      const option2 = product.options && product.options[1];
      const option3 = product.options && product.options[2];

      const firstRow = {
        ...baseRow,
        'Option1 Name': option1 ? option1.name : '',
        'Option1 Value': variant.option1 || '',
        'Option2 Name': option2 ? option2.name : '',
        'Option2 Value': variant.option2 || '',
        'Option3 Name': option3 ? option3.name : '',
        'Option3 Value': variant.option3 || '',
        'Variant SKU': variant.sku || '',
        'Variant Grams': variant.grams || '',
        'Variant Inventory Tracker': variant.inventory_management || '',
        'Variant Inventory Qty': variant.inventory_quantity || 0,
        'Variant Inventory Policy': variant.inventory_policy || 'deny',
        'Variant Fulfillment Service': variant.fulfillment_service || 'manual',
        'Variant Price': variant.price || '',
        'Variant Compare At Price': variant.compare_at_price || '',
        'Variant Requires Shipping': variant.requires_shipping ? 'TRUE' : 'FALSE',
        'Variant Taxable': variant.taxable ? 'TRUE' : 'FALSE',
        'Variant Barcode': variant.barcode || '',
        'Variant Weight Unit': variant.weight_unit || 'kg'
      };

      // Add first image
      if (product.images && product.images.length > 0) {
        const image = product.images[0];
        firstRow['Image Src'] = image.src || '';
        firstRow['Image Position'] = '1';
        firstRow['Image Alt Text'] = image.alt || '';
      }

      rows.push(headersToRow(headers, firstRow));

      // Additional variants (empty product fields)
      for (let i = 1; i < product.variants.length; i++) {
        const v = product.variants[i];
        const variantRow = {
          'Handle': product.handle,
          'Title': '',
          'Body (HTML)': '',
          'Vendor': '',
          'Type': '',
          'Tags': '',
          'Published': '',
          'Option1 Name': '',
          'Option1 Value': v.option1 || '',
          'Option2 Name': '',
          'Option2 Value': v.option2 || '',
          'Option3 Name': '',
          'Option3 Value': v.option3 || '',
          'Variant SKU': v.sku || '',
          'Variant Grams': v.grams || '',
          'Variant Inventory Tracker': v.inventory_management || '',
          'Variant Inventory Qty': v.inventory_quantity || 0,
          'Variant Inventory Policy': v.inventory_policy || 'deny',
          'Variant Fulfillment Service': v.fulfillment_service || 'manual',
          'Variant Price': v.price || '',
          'Variant Compare At Price': v.compare_at_price || '',
          'Variant Requires Shipping': v.requires_shipping ? 'TRUE' : 'FALSE',
          'Variant Taxable': v.taxable ? 'TRUE' : 'FALSE',
          'Variant Barcode': v.barcode || '',
          'Variant Weight Unit': v.weight_unit || 'kg',
          'Status': ''
        };

        rows.push(headersToRow(headers, variantRow));
      }

      // Additional images (empty variant fields)
      for (let i = 1; i < (product.images || []).length; i++) {
        const img = product.images[i];
        const imageRow = {
          'Handle': product.handle,
          'Image Src': img.src || '',
          'Image Position': String(i + 1),
          'Image Alt Text': img.alt || ''
        };

        rows.push(headersToRow(headers, imageRow));
      }
    }
  });

  return rows.map(row => row.map(escapeCSVField).join(',')).join('\n');
}

function headersToRow(headers, dataObj) {
  return headers.map(h => dataObj[h] || '');
}

function escapeCSVField(field) {
  if (!field && field !== 0) return '';

  const fieldStr = String(field);
  const needsQuotes = fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n');

  if (needsQuotes) {
    const escaped = fieldStr.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return fieldStr;
}

/**
 * Main execution
 */
async function main() {
  try {
    const products = await fetchAllProducts();
    console.log(`✅ Total: ${products.length} active products\n`);

    console.log('📝 Converting to CSV format...');
    const csv = productsToCSV(products);

    const filename = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csv, 'utf-8');

    console.log('');
    console.log('═'.repeat(70));
    console.log('📊 EXPORT COMPLETE');
    console.log('═'.repeat(70));
    console.log(`✅ File saved: ${filename}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`💾 Size: ${(csv.length / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log(`1. Run: node scripts/add-since-2017-to-csv.cjs ${filename}`);
    console.log('2. Import modified CSV to Shopify Admin');
    console.log('3. Check "Overwrite products with same handle"');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
