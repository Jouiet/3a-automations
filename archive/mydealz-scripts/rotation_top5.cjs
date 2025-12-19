// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * SYSTEM2: ROTATION AUTOMATIQUE PRODUITS FEATURED
 * Date: November 5, 2025
 * Objectif: Rotation tous les 15 jours - sélection 3 produits/catégorie parmi Top 5
 *
 * Process:
 * 1. Fetch all products (106) from Shopify API
 * 2. Group by product_type (9 categories)
 * 3. Calculate Top 5 per category (scoring formula)
 * 4. Select 3 random from Top 5 (anti-repetition logic)
 * 5. Update Shopify metafields (email.featured = true)
 * 6. Clear previous featured products
 * 7. Log rotation history to data/rotation_history.json
 *
 * Run: node scripts/rotation_top5.cjs
 * Frequency: Every 15 days (via cron or manual)
 */

require('dotenv').config({ path: '/Users/mac/Desktop/MyDealz/.env' });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';
const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

const DATA_DIR = path.join(__dirname, '../data');
const ROTATION_LOG = path.join(DATA_DIR, 'rotation_history.json');

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

async function updateProductMetafield(productId, featured) {
  const endpoint = `/products/${productId}/metafields.json`;

  const metafield = {
    namespace: 'email',
    key: 'featured',
    type: 'boolean',
    value: featured
  };

  try {
    await makeRequest(endpoint, {
      method: 'POST',
      body: { metafield }
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to update metafield for product ${productId}: ${error.message}`);
    return false;
  }
}

async function clearAllFeaturedProducts(products) {
  console.log('\n🧹 Clearing previous featured products...');

  let cleared = 0;
  for (const product of products) {
    const success = await updateProductMetafield(product.id, false);
    if (success) cleared++;
  }

  console.log(`✅ Cleared ${cleared}/${products.length} products`);
}

async function setFeaturedProducts(selections) {
  console.log('\n⭐ Setting new featured products...');

  let updated = 0;
  const allProductIds = Object.values(selections).flat().map(p => p.id);

  for (const productId of allProductIds) {
    const success = await updateProductMetafield(productId, true);
    if (success) updated++;
  }

  console.log(`✅ Updated ${updated}/${allProductIds.length} featured products`);
}

// ============================================================================
// SCORING & SELECTION LOGIC
// ============================================================================

function groupProductsByType(products) {
  const byType = {};

  products.forEach(product => {
    const type = product.product_type || 'Uncategorized';
    if (!byType[type]) {
      byType[type] = [];
    }

    const variant = (product.variants && product.variants.length > 0) ? product.variants[0] : null;
    byType[type].push({
      id: product.id,
      title: product.title,
      handle: product.handle,
      created_at: product.created_at,
      inventory: variant ? (variant.inventory_quantity || 0) : 0,
      price: variant ? parseFloat(variant.price || 0) : 0,
      image: product.image ? product.image.src : null
    });
  });

  return byType;
}

function calculateScore(product) {
  const now = new Date();
  const createdDate = new Date(product.created_at);
  const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

  let score = 0;

  // Inventory score (more stock = potentially more popular)
  score += product.inventory * 2;

  // Newness bonus (<30 days)
  if (daysSinceCreated < 30) {
    score += 50;
  }

  // Price range bonus (mid-high range products)
  if (product.price >= 70 && product.price <= 150) {
    score += 20;
  }

  return {
    ...product,
    score,
    days_since_created: daysSinceCreated
  };
}

function calculateTop5ByCategory(productsByType) {
  console.log('\n🏆 Calculating Top 5 per category...\n');

  const top5ByCategory = {};

  Object.entries(productsByType).forEach(([type, products]) => {
    if (products.length === 0) {
      console.log(`📦 ${type}: No products - skipping`);
      return;
    }

    // Calculate scores
    const scored = products.map(calculateScore);

    // Sort by score DESC
    const sorted = scored.sort((a, b) => b.score - a.score);

    // Take top 5 (or all if less than 5)
    const top5 = sorted.slice(0, Math.min(5, sorted.length));

    top5ByCategory[type] = top5;

    console.log(`📦 ${type}: ${products.length} products → Top ${top5.length}`);
    top5.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.title.substring(0, 45)}... (Score: ${p.score})`);
    });
  });

  return top5ByCategory;
}

function selectRandomProducts(top5ByCategory, previousSelections = {}) {
  console.log('\n🎲 Selecting 3 random products per category (anti-repetition)...\n');

  const selections = {};

  Object.entries(top5ByCategory).forEach(([type, top5]) => {
    if (top5.length === 0) return;

    // Get previous selections for this category to avoid repetition
    const previousIds = previousSelections[type] || [];

    // Filter out previous selections if possible
    let availablePool = top5.filter(p => !previousIds.includes(p.id));

    // If filtered pool is empty (all were selected before), use full Top 5
    if (availablePool.length === 0) {
      availablePool = top5;
    }

    // Shuffle and select 3 (or less if pool is smaller)
    const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(3, shuffled.length));

    selections[type] = selected;

    console.log(`📦 ${type}: Selected ${selected.length} products`);
    selected.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.title.substring(0, 50)}...`);
    });
  });

  return selections;
}

// ============================================================================
// ROTATION LOG
// ============================================================================

function saveRotationLog(selections, top5ByCategory) {
  const rotationNumber = rotationHistory.rotations.length + 1;
  const timestamp = new Date().toISOString();

  // Build previous selections map for anti-repetition next time
  const previousSelectionsMap = {};
  Object.entries(selections).forEach(([type, products]) => {
    previousSelectionsMap[type] = products.map(p => p.id);
  });

  const rotation = {
    rotation_number: rotationNumber,
    timestamp,
    date: timestamp.split('T')[0],
    selections: {},
    top5_summary: {},
    previous_selections: previousSelectionsMap
  };

  // Log selected products
  Object.entries(selections).forEach(([type, products]) => {
    rotation.selections[type] = products.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      price: p.price,
      score: p.score,
      inventory: p.inventory
    }));
  });

  // Log Top 5 summary
  Object.entries(top5ByCategory).forEach(([type, products]) => {
    rotation.top5_summary[type] = products.map(p => ({
      id: p.id,
      title: p.title,
      score: p.score
    }));
  });

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
  console.log('║         SYSTEM2: ROTATION AUTOMATIQUE PRODUITS FEATURED       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    // Step 1: Fetch all products
    const allProducts = await fetchAllProducts();

    // Step 2: Group by product type
    const productsByType = groupProductsByType(allProducts);
    console.log(`\n📊 Products grouped into ${Object.keys(productsByType).length} categories`);

    // Step 3: Calculate Top 5 per category
    const top5ByCategory = calculateTop5ByCategory(productsByType);

    // Step 4: Get previous selections for anti-repetition
    const lastRotation = getLastRotation();
    const previousSelections = lastRotation ? lastRotation.previous_selections : {};

    // Step 5: Select 3 random products per category
    const selections = selectRandomProducts(top5ByCategory, previousSelections);

    // Step 6: Clear previous featured products
    await clearAllFeaturedProducts(allProducts);

    // Step 7: Set new featured products
    await setFeaturedProducts(selections);

    // Step 8: Save rotation log
    saveRotationLog(selections, top5ByCategory);

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ ROTATION COMPLETE                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Summary
    const totalSelected = Object.values(selections).flat().length;
    console.log(`📊 SUMMARY:`);
    console.log(`   - Categories processed: ${Object.keys(selections).length}`);
    console.log(`   - Total products featured: ${totalSelected}`);
    console.log(`   - Rotation number: ${rotationHistory.rotations.length}`);
    console.log(`   - Log file: ${ROTATION_LOG}\n`);

    console.log('✅ Next rotation: 15 days from now\n');

  } catch (error) {
    console.error('\n❌ ROTATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, calculateScore, groupProductsByType };
