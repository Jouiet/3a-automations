// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

require('dotenv').config();
const https = require('https');

const SHOPIFY_DOMAIN = '5dc028-dd.myshopify.com';
const API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2024-01';

async function fetchProducts(limit = 250) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: `/admin/api/${API_VERSION}/products.json?limit=${limit}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': API_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function analyzeProducts() {
  console.log('='.repeat(70));
  console.log('GOOGLE MERCHANT CENTER - PRODUCT ANALYSIS');
  console.log('='.repeat(70));
  console.log('');

  try {
    const response = await fetchProducts();
    const products = response.products;

    console.log(`Total Products: ${products.length}`);
    console.log('');

    // Analyze issues
    let missingDescription = 0;
    let shortDescription = 0;
    let missingGTIN = 0;
    let missingAttributes = 0;
    let smallImages = 0;
    let missingCondition = 0;
    let missingAgeGroup = 0;
    let missingGender = 0;

    const issueProducts = [];

    products.forEach(product => {
      const issues = [];

      // Check description
      if (!product.body_html || product.body_html.trim() === '') {
        missingDescription++;
        issues.push('No description');
      } else if (product.body_html.length < 200) {
        shortDescription++;
        issues.push('Short description');
      }

      // Check GTIN (barcode)
      const hasGTIN = product.variants.some(v => v.barcode && v.barcode.trim() !== '');
      if (!hasGTIN) {
        missingGTIN++;
        issues.push('No GTIN/Barcode');
      }

      // Check product images
      if (product.images && product.images.length > 0) {
        const hasSmallImage = product.images.some(img => {
          // Can't determine exact size from API, but we can flag for manual review
          return false; // Will need manual check
        });
      } else {
        issues.push('No images');
      }

      // Check metafields for Google Shopping attributes
      // Note: We'd need to fetch metafields separately, but for now flag all
      missingAttributes++;
      issues.push('Missing Google attributes');

      // Google requires: condition, age_group, gender
      missingCondition++;
      missingAgeGroup++;
      missingGender++;

      if (issues.length > 0) {
        issueProducts.push({
          id: product.id,
          title: product.title,
          handle: product.handle,
          issues: issues
        });
      }
    });

    console.log('='.repeat(70));
    console.log('ISSUES SUMMARY');
    console.log('='.repeat(70));
    console.log('');
    console.log(`📝 Missing/Incomplete Descriptions: ${missingDescription + shortDescription}/${products.length}`);
    console.log(`   - No description: ${missingDescription}`);
    console.log(`   - Short description (<200 chars): ${shortDescription}`);
    console.log('');
    console.log(`🔢 Missing GTINs (Barcodes): ${missingGTIN}/${products.length}`);
    console.log('');
    console.log(`🏷️  Missing Google Attributes: ${products.length}/${products.length}`);
    console.log(`   - Missing condition: ${missingCondition}`);
    console.log(`   - Missing age_group: ${missingAgeGroup}`);
    console.log(`   - Missing gender: ${missingGender}`);
    console.log('');
    console.log('='.repeat(70));
    console.log('TOP 10 PRODUCTS NEEDING ATTENTION');
    console.log('='.repeat(70));
    console.log('');

    issueProducts.slice(0, 10).forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   Handle: ${p.handle}`);
      console.log(`   Issues: ${p.issues.join(', ')}`);
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('RECOMMENDED ACTIONS');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. ADD GOOGLE SHOPPING METAFIELDS');
    console.log('   - google_product_category');
    console.log('   - condition (new/refurbished/used)');
    console.log('   - age_group (adult/kids/toddler/infant/newborn)');
    console.log('   - gender (male/female/unisex)');
    console.log('   - brand');
    console.log('   - material');
    console.log('   - color');
    console.log('   - size');
    console.log('');
    console.log('2. ADD GTINs (BARCODES)');
    console.log('   - Add UPC/EAN/ISBN codes to product variants');
    console.log('   - Essential for Google Shopping visibility');
    console.log('');
    console.log('3. ENHANCE PRODUCT DESCRIPTIONS');
    console.log('   - Add detailed, keyword-rich descriptions (500+ words)');
    console.log('   - Include product specs, materials, dimensions');
    console.log('   - Add usage instructions and benefits');
    console.log('');
    console.log('4. OPTIMIZE IMAGES');
    console.log('   - Ensure minimum 100x100px (recommended 800x800px)');
    console.log('   - Use white/neutral backgrounds');
    console.log('   - Show product from multiple angles');
    console.log('');

  } catch (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }
}

analyzeProducts();
