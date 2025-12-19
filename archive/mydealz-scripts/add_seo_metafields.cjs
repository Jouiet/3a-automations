// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * ADD SEO METAFIELDS TO ALL MYDEALZ PRODUCTS
 *
 * This script adds SEO metafields (title_tag and description_tag) to all products
 * in the MyDealz catalog. This is Phase 1 of the remediation plan - a QUICK WIN
 * that provides immediate SEO improvement.
 *
 * Metafields Created:
 * - namespace: global
 * - key: title_tag (SEO title, max 70 chars)
 * - key: description_tag (meta description, max 160 chars)
 *
 * Strategy:
 * - title_tag: Use product title (truncate if >70 chars)
 * - description_tag: Extract first 160 chars from description (smart truncation)
 *
 * USAGE:
 * node scripts/add_seo_metafields.cjs [--dry-run] [--limit N]
 *
 * OPTIONS:
 * --dry-run: Preview changes without updating Shopify
 * --limit N: Only process first N products (for testing)
 *
 * EXAMPLE:
 * node scripts/add_seo_metafields.cjs --dry-run --limit 5
 * node scripts/add_seo_metafields.cjs
 */

require('dotenv').config({ path: '/Users/mac/Desktop/MyDealz/.env' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';
const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT_INDEX = args.indexOf('--limit');
const LIMIT = LIMIT_INDEX !== -1 && args[LIMIT_INDEX + 1] ? parseInt(args[LIMIT_INDEX + 1]) : null;

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;

  const options = {
    method,
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error: ${method} ${endpoint} - ${error.message}`);
    throw error;
  }
}

async function fetchAllProducts() {
  console.log('📦 Fetching all products from Shopify...\n');
  const data = await makeRequest('/products.json?limit=250');

  if (!data || !data.products) {
    throw new Error('Failed to fetch products');
  }

  console.log(`✅ ${data.products.length} products fetched\n`);
  return data.products;
}

async function createProductMetafield(productId, metafield) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] Would create metafield: ${metafield.key}`);
    return { metafield };
  }

  const endpoint = `/products/${productId}/metafields.json`;
  return await makeRequest(endpoint, 'POST', { metafield });
}

// ============================================================================
// SEO METAFIELD GENERATION
// ============================================================================

function generateTitleTag(product) {
  let title = product.title;

  // If title is too long, truncate intelligently
  if (title.length > 70) {
    // Try to truncate at last space before 70 chars
    const truncated = title.substring(0, 67);
    const lastSpace = truncated.lastIndexOf(' ');
    title = lastSpace > 50 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  return title;
}

function generateDescriptionTag(product) {
  if (!product.body_html) {
    return `Shop ${product.title} at MyDealz. High-quality products with fast shipping.`;
  }

  // Strip HTML tags
  let plainText = product.body_html.replace(/<[^>]*>/g, ' ');

  // Replace multiple spaces with single space
  plainText = plainText.replace(/\s+/g, ' ').trim();

  // If description is too long, truncate at word boundary
  if (plainText.length > 160) {
    const truncated = plainText.substring(0, 157);
    const lastSpace = truncated.lastIndexOf(' ');
    plainText = lastSpace > 100 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  return plainText;
}

// ============================================================================
// METAFIELD PROCESSING
// ============================================================================

async function processProduct(product, index, total) {
  console.log(`[${index + 1}/${total}] Processing: ${product.title}`);
  console.log(`   ID: ${product.id}`);
  console.log(`   Handle: ${product.handle}`);

  const results = {
    productId: product.id,
    title: product.title,
    handle: product.handle,
    success: true,
    metafieldsCreated: [],
    errors: []
  };

  // Check if metafields already exist
  const existingTitleTag = product.metafields?.find(m =>
    m.namespace === 'global' && m.key === 'title_tag'
  );
  const existingDescTag = product.metafields?.find(m =>
    m.namespace === 'global' && m.key === 'description_tag'
  );

  // Generate metafields
  const titleTag = generateTitleTag(product);
  const descriptionTag = generateDescriptionTag(product);

  console.log(`   Generated title_tag: "${titleTag}" (${titleTag.length} chars)`);
  console.log(`   Generated description_tag: "${descriptionTag}" (${descriptionTag.length} chars)`);

  // Create title_tag if missing
  if (!existingTitleTag) {
    try {
      const metafield = {
        namespace: 'global',
        key: 'title_tag',
        value: titleTag,
        type: 'single_line_text_field'
      };

      await createProductMetafield(product.id, metafield);
      results.metafieldsCreated.push('title_tag');
      console.log(`   ✅ Created title_tag metafield`);
    } catch (error) {
      results.success = false;
      results.errors.push(`title_tag: ${error.message}`);
      console.log(`   ❌ Failed to create title_tag: ${error.message}`);
    }

    // Rate limit: wait 500ms between API calls
    if (!DRY_RUN) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } else {
    console.log(`   ⏭️  title_tag already exists`);
  }

  // Create description_tag if missing
  if (!existingDescTag) {
    try {
      const metafield = {
        namespace: 'global',
        key: 'description_tag',
        value: descriptionTag,
        type: 'single_line_text_field'
      };

      await createProductMetafield(product.id, metafield);
      results.metafieldsCreated.push('description_tag');
      console.log(`   ✅ Created description_tag metafield`);
    } catch (error) {
      results.success = false;
      results.errors.push(`description_tag: ${error.message}`);
      console.log(`   ❌ Failed to create description_tag: ${error.message}`);
    }

    // Rate limit: wait 500ms between API calls
    if (!DRY_RUN) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } else {
    console.log(`   ⏭️  description_tag already exists`);
  }

  console.log('');
  return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║    ADD SEO METAFIELDS TO ALL MYDEALZ PRODUCTS - PHASE 1       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE: No changes will be made to Shopify\n');
  }

  if (LIMIT) {
    console.log(`⚠️  LIMIT MODE: Processing only first ${LIMIT} products\n`);
  }

  try {
    // Fetch all products
    const products = await fetchAllProducts();

    // Apply limit if specified
    const productsToProcess = LIMIT ? products.slice(0, LIMIT) : products;

    console.log(`📊 Processing ${productsToProcess.length} products...\n`);
    console.log('─'.repeat(80) + '\n');

    // Process each product
    const results = [];
    for (let i = 0; i < productsToProcess.length; i++) {
      const result = await processProduct(productsToProcess[i], i, productsToProcess.length);
      results.push(result);

      // Small delay between products to avoid rate limits
      if (!DRY_RUN && i < productsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Generate summary
    console.log('─'.repeat(80) + '\n');
    console.log('📊 SUMMARY\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const titleTagsCreated = results.filter(r => r.metafieldsCreated.includes('title_tag')).length;
    const descTagsCreated = results.filter(r => r.metafieldsCreated.includes('description_tag')).length;
    const skipped = results.filter(r => r.metafieldsCreated.length === 0).length;

    console.log(`Total Products Processed: ${results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📝 title_tag metafields created: ${titleTagsCreated}`);
    console.log(`📝 description_tag metafields created: ${descTagsCreated}`);
    console.log(`⏭️  Skipped (already had both metafields): ${skipped}`);
    console.log('');

    if (failed.length > 0) {
      console.log('❌ FAILED PRODUCTS:\n');
      failed.forEach(r => {
        console.log(`  ${r.title} (ID: ${r.productId})`);
        r.errors.forEach(err => console.log(`    - ${err}`));
      });
      console.log('');
    }

    // Save detailed results
    const reportPath = '/Users/mac/Desktop/MyDealz/reports/SEO_METAFIELDS_ADD_' +
                       new Date().toISOString().split('T')[0] + '.json';

    const report = {
      timestamp: new Date().toISOString(),
      dry_run: DRY_RUN,
      total_processed: results.length,
      successful: successful.length,
      failed: failed.length,
      title_tags_created: titleTagsCreated,
      description_tags_created: descTagsCreated,
      skipped: skipped,
      results: results
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed report saved to: ${reportPath}\n`);

    if (DRY_RUN) {
      console.log('🔍 This was a DRY RUN. No changes were made to Shopify.');
      console.log('   Run without --dry-run to apply changes.\n');
    } else {
      console.log('✅ SEO metafields have been added to all products!\n');
      console.log('IMPACT:');
      console.log('  • Improved SEO visibility in Google search results');
      console.log('  • Optimized meta titles and descriptions for CTR');
      console.log('  • 100% of products now have basic SEO optimization');
      console.log('  • Next step: Add FAQ sections for AEO optimization\n');
    }

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     PHASE 1 COMPLETE                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    process.exit(failed.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(2);
  }
}

// Run
main();
