#!/usr/bin/env node
/**
 * OPTION 1: Warehouse CSV Parser
 *
 * PURPOSE: Parse supplier CSV export to extract warehouse location data
 *
 * CRITICAL ASSUMPTION: CSV export MUST contain warehouse/shipping location
 * Status: UNVERIFIED - User must export CSV first to validate fields
 *
 * Expected CSV columns (TO VERIFY):
 * - Product Title / Name
 * - SKU
 * - Shipping From / Warehouse Location
 * - Supplier Country
 *
 * Usage:
 *   1. Export CSV from supplier dashboard → Products → Export
 *   2. Save as warehouse-export.csv in project root
 *   3. Run: node scripts/parse-warehouse-csv.cjs
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

// CONFIGURATION
const CSV_FILE_PATH = process.env.WAREHOUSE_CSV_PATH || './warehouse-export.csv';
const OUTPUT_FILE = './warehouse-location-data.json';

/**
 * Parse CSV manually (no dependencies)
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  console.log('📋 CSV Headers detected:');
  headers.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));
  console.log('');

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

    if (values.length !== headers.length) {
      console.warn(`⚠️  Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Extract warehouse location from parsed CSV
 */
function extractWarehouseData(rows) {
  const results = [];

  // Possible column names for warehouse location (case-insensitive search)
  const warehouseColumns = [
    'Shipping From',
    'Warehouse Location',
    'Ships From',
    'Origin Country',
    'Supplier Country',
    'Warehouse',
    'Location'
  ];

  // Possible column names for product identifier
  const idColumns = ['SKU', 'Product ID', 'ID', 'Variant SKU'];
  const titleColumns = ['Product Title', 'Title', 'Product Name', 'Name'];

  for (const row of rows) {
    const productData = {
      id: null,
      title: null,
      warehouse: null,
      raw_row: row
    };

    // Find product identifier
    for (const col of idColumns) {
      const matchingKey = Object.keys(row).find(k =>
        k.toLowerCase().includes(col.toLowerCase())
      );
      if (matchingKey && row[matchingKey]) {
        productData.id = row[matchingKey];
        break;
      }
    }

    // Find product title
    for (const col of titleColumns) {
      const matchingKey = Object.keys(row).find(k =>
        k.toLowerCase().includes(col.toLowerCase())
      );
      if (matchingKey && row[matchingKey]) {
        productData.title = row[matchingKey];
        break;
      }
    }

    // Find warehouse location
    for (const col of warehouseColumns) {
      const matchingKey = Object.keys(row).find(k =>
        k.toLowerCase().includes(col.toLowerCase())
      );
      if (matchingKey && row[matchingKey]) {
        productData.warehouse = row[matchingKey];
        break;
      }
    }

    results.push(productData);
  }

  return results;
}

/**
 * Analyze warehouse locations
 */
function analyzeWarehouses(products) {
  const warehouseStats = {};
  let unknownCount = 0;
  let totalCount = 0;

  for (const product of products) {
    totalCount++;

    if (!product.warehouse || product.warehouse === '') {
      unknownCount++;
      continue;
    }

    const location = product.warehouse;
    warehouseStats[location] = (warehouseStats[location] || 0) + 1;
  }

  console.log('═'.repeat(70));
  console.log('📊 WAREHOUSE LOCATION ANALYSIS');
  console.log('═'.repeat(70));
  console.log(`Total products: ${totalCount}`);
  console.log(`Unknown location: ${unknownCount} (${(unknownCount/totalCount*100).toFixed(1)}%)`);
  console.log('');

  if (Object.keys(warehouseStats).length > 0) {
    console.log('Warehouse breakdown:');
    Object.entries(warehouseStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([location, count]) => {
        const pct = (count / totalCount * 100).toFixed(1);
        console.log(`  ${location}: ${count} products (${pct}%)`);
      });
  } else {
    console.log('⚠️  NO warehouse location data found in CSV');
    console.log('');
    console.log('POSSIBLE REASONS:');
    console.log('1. CSV export does NOT include warehouse/shipping location');
    console.log('2. Column names different than expected (check headers above)');
    console.log('3. Data is empty for all products');
  }

  console.log('');
}

/**
 * Identify US/Canada warehouse products (BNPL shipping optimization)
 */
function identifyNorthAmericaProducts(products) {
  const naKeywords = ['USA', 'US', 'United States', 'Canada', 'CA', 'North America'];

  const naProducts = products.filter(p => {
    if (!p.warehouse) return false;

    return naKeywords.some(keyword =>
      p.warehouse.toUpperCase().includes(keyword.toUpperCase())
    );
  });

  console.log('═'.repeat(70));
  console.log('🇺🇸 NORTH AMERICA WAREHOUSE PRODUCTS (FAST SHIPPING)');
  console.log('═'.repeat(70));
  console.log(`Total NA products: ${naProducts.length}`);
  console.log(`Percentage: ${(naProducts.length / products.length * 100).toFixed(1)}%`);
  console.log('');

  if (naProducts.length > 0) {
    console.log('Sample products:');
    naProducts.slice(0, 10).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title || p.id} - ${p.warehouse}`);
    });

    if (naProducts.length > 10) {
      console.log(`  ... and ${naProducts.length - 10} more`);
    }
  }

  console.log('');
  return naProducts;
}

// MAIN EXECUTION
(async () => {
  console.log('🔍 Warehouse CSV Parser');
  console.log('═'.repeat(70));
  console.log('');

  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error('❌ ERROR: CSV file not found');
    console.error(`   Expected path: ${CSV_FILE_PATH}`);
    console.error('');
    console.error('INSTRUCTIONS:');
    console.error('1. Login to supplier dashboard');
    console.error('2. Navigate to Products page');
    console.error('3. Click Export button');
    console.error('4. Save CSV as: warehouse-export.csv in project root');
    console.error('5. OR set WAREHOUSE_CSV_PATH environment variable');
    console.error('');
    console.error('Then run this script again.');
    process.exit(1);
  }

  try {
    // Read CSV file
    console.log(`📂 Reading CSV: ${CSV_FILE_PATH}`);
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    console.log(`✅ File loaded (${csvContent.length} bytes)`);
    console.log('');

    // Parse CSV
    console.log('🔄 Parsing CSV...');
    const rows = parseCSV(csvContent);
    console.log(`✅ Parsed ${rows.length} rows`);
    console.log('');

    // Extract warehouse data
    console.log('🔍 Extracting warehouse data...');
    const products = extractWarehouseData(rows);
    console.log(`✅ Extracted data for ${products.length} products`);
    console.log('');

    // Analyze
    analyzeWarehouses(products);
    const naProducts = identifyNorthAmericaProducts(products);

    // Save results
    const output = {
      timestamp: new Date().toISOString(),
      csv_file: CSV_FILE_PATH,
      total_products: products.length,
      products: products,
      north_america_products: naProducts,
      statistics: {
        total: products.length,
        with_warehouse_data: products.filter(p => p.warehouse).length,
        north_america: naProducts.length
      }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log('═'.repeat(70));
    console.log(`💾 Results saved to: ${OUTPUT_FILE}`);
    console.log('');

    // BNPL SHIPPING RECOMMENDATION
    if (naProducts.length > 0) {
      const naPct = (naProducts.length / products.length * 100).toFixed(1);
      console.log('═'.repeat(70));
      console.log('💡 BNPL SHIPPING OPTIMIZATION RECOMMENDATION');
      console.log('═'.repeat(70));
      console.log(`✅ ${naProducts.length} products (${naPct}%) ship from North America`);
      console.log('');
      console.log('RECOMMENDATION:');
      console.log('1. Prioritize NA products for BNPL promotions (5-7 day delivery)');
      console.log('2. Tag NA products with "fast-shipping" for conditional logic');
      console.log('3. Update product metafields: custom.warehouse_location');
      console.log('');
      console.log('Next step: Run scripts/create-warehouse-metafield.cjs');
    } else {
      console.log('⚠️  No North America warehouse products found');
      console.log('   All products ship from international warehouses (likely China)');
      console.log('   Expected delivery: 10-20 days');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
})();
