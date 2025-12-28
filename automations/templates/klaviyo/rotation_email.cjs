#!/usr/bin/env node
/**
 * EMAIL ROTATION - 5 PRODUITS POUR CUSTOM LIQUID
 * Purpose: Create shop metafields for email product rotation
 * Method: Scoring algorithm + anti-repetition + Shopify metafields API
 *
 * Process:
 * 1. Fetch all products from Shopify API
 * 2. Calculate score for ALL products (global top 5)
 * 3. Select top 5 products with anti-repetition
 * 4. Create/update shop metafields: email_rotation.product_1 to product_5
 * 5. Store product HANDLES (not IDs) for Liquid all_products[handle]
 * 6. Log rotation history
 *
 * Run: node automations/clients/klaviyo/rotation_email.cjs
 * Frequency: Every 15 days (via GitHub Actions)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';
const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

const DATA_DIR = path.join(__dirname, '../data');
const ROTATION_LOG = path.join(DATA_DIR, 'email_rotation_history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load rotation history
let rotationHistory = { rotations: [] };
if (fs.existsSync(ROTATION_LOG)) {
  try {
    rotationHistory = JSON.parse(fs.readFileSync(ROTATION_LOG, 'utf8'));
  } catch (e) {
    console.warn('⚠️  Could not load rotation history, starting fresh');
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error: ${endpoint} - ${error.message}`);
    throw error;
  }
}

async function fetchAllProducts() {
  console.log('\n📦 Fetching all products from Shopify...');
  const data = await makeRequest('/products.json?limit=250');

  if (!data || !data.products) {
    throw new Error('Failed to fetch products');
  }

  console.log(`✅ ${data.products.length} products fetched`);
  return data.products;
}

/**
 * Create or update a SHOP metafield (not product metafield)
 * This is what Custom Liquid code reads: shop.metafields.email_rotation[key]
 */
async function updateShopMetafield(key, productHandle) {
  const endpoint = `/metafields.json`;

  const metafield = {
    namespace: 'email_rotation',
    key: key,  // product_1, product_2, etc.
    type: 'single_line_text_field',
    value: productHandle,  // e.g., "leather-tote-bag"
    owner_resource: 'shop',
    owner_id: null  // For shop metafields, owner_id is null
  };

  try {
    // First, try to find existing metafield
    const existing = await makeRequest(`/metafields.json?namespace=email_rotation&key=${key}`);

    if (existing.metafields && existing.metafields.length > 0) {
      // Update existing
      const metafieldId = existing.metafields[0].id;
      await makeRequest(`/metafields/${metafieldId}.json`, {
        method: 'PUT',
        body: { metafield: { value: productHandle } }
      });
      console.log(`   ✅ Updated ${key}: ${productHandle}`);
    } else {
      // Create new
      await makeRequest(endpoint, {
        method: 'POST',
        body: { metafield }
      });
      console.log(`   ✅ Created ${key}: ${productHandle}`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Failed to update shop metafield ${key}: ${error.message}`);
    return false;
  }
}

// ============================================================================
// SCORING & SELECTION LOGIC
// ============================================================================

function calculateScore(product) {
  const now = new Date();
  const createdDate = new Date(product.created_at);
  const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

  const variant = (product.variants && product.variants.length > 0) ? product.variants[0] : null;
  const inventory = variant ? (variant.inventory_quantity || 0) : 0;
  const price = variant ? parseFloat(variant.price || 0) : 0;

  let score = 0;

  // Inventory score (more stock = potentially more popular)
  score += inventory * 2;

  // Newness bonus (<30 days)
  if (daysSinceCreated < 30) {
    score += 50;
  }

  // Price range bonus (mid-high range products)
  if (price >= 70 && price <= 150) {
    score += 20;
  }

  // Has image bonus
  if (product.image || (product.images && product.images.length > 0)) {
    score += 10;
  }

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    product_type: product.product_type || 'Uncategorized',
    created_at: product.created_at,
    inventory,
    price,
    image: product.image ? product.image.src : (product.images && product.images[0] ? product.images[0].src : null),
    score,
    days_since_created: daysSinceCreated
  };
}

function selectTop5Products(products, previousHandles = []) {
  console.log('\n🏆 Selecting Top 5 products for email rotation...\n');

  // Calculate scores for all products
  const scored = products.map(calculateScore);

  // Sort by score DESC
  const sorted = scored.sort((a, b) => b.score - a.score);

  // Filter out previous selections if possible (anti-repetition)
  let availablePool = sorted.filter(p => !previousHandles.includes(p.handle));

  // If filtered pool has less than 5, use full pool
  if (availablePool.length < 5) {
    console.log(`⚠️  Only ${availablePool.length} new products available, using top scored from all`);
    availablePool = sorted;
  }

  // Add randomness: shuffle top 10 and pick 5 for variety
  const top10 = availablePool.slice(0, 10);
  const shuffled = [...top10].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 5);

  console.log('📋 Selected 5 products:\n');
  selected.forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.title}`);
    console.log(`      Handle: ${p.handle}`);
    console.log(`      Type: ${p.product_type}`);
    console.log(`      Score: ${p.score}`);
    console.log(`      Price: $${p.price}`);
    console.log('');
  });

  return selected;
}

// ============================================================================
// SHOP METAFIELDS UPDATE
// ============================================================================

async function updateEmailRotationMetafields(selectedProducts) {
  console.log('\n📧 Updating shop metafields for email rotation...\n');

  let successCount = 0;

  for (let i = 0; i < 5; i++) {
    const product = selectedProducts[i];
    const key = `product_${i + 1}`;
    const handle = product ? product.handle : '';

    if (handle) {
      const success = await updateShopMetafield(key, handle);
      if (success) successCount++;
    } else {
      console.log(`   ⚠️  No product for ${key}, skipping`);
    }
  }

  console.log(`\n✅ Updated ${successCount}/5 shop metafields`);
  console.log('\n📍 Metafields created at:');
  console.log('   Shopify Admin → Settings → Custom data → Shop metafields');
  console.log('   Namespace: email_rotation');
  console.log('   Keys: product_1, product_2, product_3, product_4, product_5');
}

// ============================================================================
// ROTATION LOG
// ============================================================================

function saveRotationLog(selectedProducts) {
  const rotationNumber = rotationHistory.rotations.length + 1;
  const timestamp = new Date().toISOString();

  const rotation = {
    rotation_number: rotationNumber,
    timestamp,
    date: timestamp.split('T')[0],
    products: selectedProducts.map(p => ({
      handle: p.handle,
      title: p.title,
      product_type: p.product_type,
      price: p.price,
      score: p.score,
      inventory: p.inventory
    })),
    previous_handles: selectedProducts.map(p => p.handle)
  };

  rotationHistory.rotations.push(rotation);

  fs.writeFileSync(ROTATION_LOG, JSON.stringify(rotationHistory, null, 2));

  console.log(`\n✅ Rotation #${rotationNumber} logged to: ${ROTATION_LOG}`);
}

function getLastRotation() {
  if (rotationHistory.rotations.length === 0) {
    return null;
  }
  return rotationHistory.rotations[rotationHistory.rotations.length - 1];
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      SYSTEM2: EMAIL ROTATION - 5 PRODUITS CUSTOM LIQUID     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    // Step 1: Fetch all products
    const allProducts = await fetchAllProducts();

    // Step 2: Get previous selections for anti-repetition
    const lastRotation = getLastRotation();
    const previousHandles = lastRotation ? lastRotation.previous_handles : [];

    if (previousHandles.length > 0) {
      console.log(`\n🔄 Anti-repetition active: Avoiding ${previousHandles.length} previous products`);
    }

    // Step 3: Select top 5 products with scoring + randomness
    const selectedProducts = selectTop5Products(allProducts, previousHandles);

    // Step 4: Update shop metafields (email_rotation.product_1-5)
    await updateEmailRotationMetafields(selectedProducts);

    // Step 5: Save rotation log
    saveRotationLog(selectedProducts);

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ ROTATION COMPLETE                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\n📧 Emails will now display these 5 products:');
    selectedProducts.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.title} (${p.handle})`);
    });
    console.log('\n🎯 Next rotation: In 15 days (automatic via GitHub Actions)');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
