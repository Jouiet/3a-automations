#!/usr/bin/env node
/**
 * BigBuy Supplier Sync v1.0.0
 *
 * Complete integration with BigBuy REST API
 * Features:
 * - Product catalog synchronization
 * - Real-time stock and pricing
 * - Order creation and tracking
 * - Multi-shipping support
 * - European dropshipping focus
 *
 * Date: 2026-01-04
 * Author: 3A Automation
 *
 * API Documentation: https://api.bigbuy.eu/rest/doc
 * Target: European dropshippers (fast delivery, EU warehouses)
 */

require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Production vs Sandbox
  production: {
    baseUrl: 'https://api.bigbuy.eu/rest'
  },
  sandbox: {
    baseUrl: 'https://api.sandbox.bigbuy.eu/rest'
  },
  // Use sandbox if BIGBUY_SANDBOX=true
  useSandbox: process.env.BIGBUY_SANDBOX === 'true',
  apiKey: process.env.BIGBUY_API_KEY,
  // Rate limiting (BigBuy: ~100 req/min for catalog, stricter for orders)
  rateLimits: {
    catalog: { interval: 600, lastCall: 0 }, // ~100/min
    order: { interval: 2000, lastCall: 0 }   // ~30/min
  },
  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000
  },
  // Cache TTL (prices/stock can change frequently)
  cacheTTL: {
    categories: 24 * 60 * 60 * 1000,  // 24h
    products: 1 * 60 * 60 * 1000,      // 1h
    stock: 5 * 60 * 1000,              // 5min
    prices: 15 * 60 * 1000             // 15min
  },
  // Server config
  port: parseInt(process.env.BIGBUY_PORT) || 3021
};

// ============================================================================
// HITL CONFIGURATION (Human In The Loop)
// ============================================================================

const fs = require('fs');
const path = require('path');

const HITL_CONFIG = {
  enabled: process.env.HITL_BIGBUY_ENABLED !== 'false',
  batchThreshold: parseInt(process.env.HITL_BATCH_THRESHOLD) || 100, // products
  slackWebhook: process.env.HITL_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL,
  notifyOnPending: process.env.HITL_NOTIFY_ON_PENDING !== 'false'
};

const DATA_DIR = process.env.BIGBUY_DATA_DIR || path.join(__dirname, '../../../data/bigbuy');
const HITL_PENDING_DIR = path.join(DATA_DIR, 'hitl-pending');
const HITL_PENDING_FILE = path.join(HITL_PENDING_DIR, 'pending-syncs.json');

// Ensure directories exist
function ensureHitlDir() {
  if (!fs.existsSync(HITL_PENDING_DIR)) {
    fs.mkdirSync(HITL_PENDING_DIR, { recursive: true });
  }
}
ensureHitlDir();

// HITL Functions
function loadPendingSyncs() {
  try {
    if (fs.existsSync(HITL_PENDING_FILE)) {
      return JSON.parse(fs.readFileSync(HITL_PENDING_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn(`⚠️ Could not load HITL pending syncs: ${error.message}`);
  }
  return [];
}

function savePendingSyncs(syncs) {
  try {
    const tempPath = `${HITL_PENDING_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(syncs, null, 2));
    fs.renameSync(tempPath, HITL_PENDING_FILE);
  } catch (error) {
    console.error(`❌ Failed to save HITL pending syncs: ${error.message}`);
  }
}

function queueSyncForApproval(categoryIds, productCount, options = {}) {
  const pending = loadPendingSyncs();
  const pendingSync = {
    id: `hitl_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    categoryIds,
    productCount,
    options,
    reason: `Batch sync ${productCount} products >= ${HITL_CONFIG.batchThreshold} threshold`,
    queuedAt: new Date().toISOString(),
    status: 'pending'
  };

  pending.push(pendingSync);
  savePendingSyncs(pending);

  console.log(`🔒 Sync queued for HITL approval (${productCount} products)`);

  // Slack notification
  if (HITL_CONFIG.slackWebhook && HITL_CONFIG.notifyOnPending) {
    sendHitlNotification(pendingSync).catch(e => console.error(`❌ Slack notification failed: ${e.message}`));
  }

  return pendingSync;
}

async function sendHitlNotification(pendingSync) {
  if (!HITL_CONFIG.slackWebhook) return;

  const message = {
    text: `🔒 HITL Approval Required - BigBuy Catalog Sync`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔒 HITL: Large Batch Sync Pending', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Products:* ${pendingSync.productCount}` },
          { type: 'mrkdwn', text: `*Categories:* ${pendingSync.categoryIds.join(', ')}` },
          { type: 'mrkdwn', text: `*Reason:* ${pendingSync.reason}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`node bigbuy-supplier-sync.cjs --approve=${pendingSync.id}\`\`\`` }
      }
    ]
  };

  await fetch(HITL_CONFIG.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
}

async function approveSync(hitlId) {
  const pending = loadPendingSyncs();
  const index = pending.findIndex(s => s.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL sync ${hitlId} not found`);
    return { success: false, error: 'Sync not found' };
  }

  const sync = pending[index];
  sync.status = 'approved';
  sync.approvedAt = new Date().toISOString();

  pending.splice(index, 1);
  savePendingSyncs(pending);

  console.log(`✅ HITL sync approved, processing ${sync.productCount} products...`);

  // Execute sync
  const result = await syncCatalogInternal(sync.categoryIds, sync.options);

  return { success: true, sync, result };
}

function rejectSync(hitlId, reason = 'Rejected by operator') {
  const pending = loadPendingSyncs();
  const index = pending.findIndex(s => s.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL sync ${hitlId} not found`);
    return { success: false, error: 'Sync not found' };
  }

  const sync = pending[index];
  sync.status = 'rejected';
  sync.rejectedAt = new Date().toISOString();
  sync.rejectionReason = reason;

  pending.splice(index, 1);
  savePendingSyncs(pending);

  console.log(`❌ HITL sync rejected: ${reason}`);

  return { success: true, sync };
}

function listPendingSyncs() {
  const pending = loadPendingSyncs();
  console.log(`\n🔒 Pending HITL Syncs (${pending.length}):\n`);

  if (pending.length === 0) {
    console.log('  No pending syncs');
    return pending;
  }

  pending.forEach(s => {
    console.log(`  • ${s.id}`);
    console.log(`    Products: ${s.productCount} | Categories: ${s.categoryIds.join(', ')}`);
    console.log(`    Reason: ${s.reason}`);
    console.log(`    Queued: ${s.queuedAt}`);
    console.log();
  });

  return pending;
}

// Simple in-memory cache
const cache = new Map();

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get base URL based on environment
 */
function getBaseUrl() {
  return CONFIG.useSandbox ? CONFIG.sandbox.baseUrl : CONFIG.production.baseUrl;
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff with jitter
 */
function getBackoffDelay(attempt) {
  const delay = Math.min(
    CONFIG.retry.baseDelay * Math.pow(2, attempt),
    CONFIG.retry.maxDelay
  );
  const jitter = Math.random() * 500;
  return delay + jitter;
}

/**
 * Rate limiter
 */
async function rateLimit(type = 'catalog') {
  const limit = CONFIG.rateLimits[type];
  const now = Date.now();
  const elapsed = now - limit.lastCall;

  if (elapsed < limit.interval) {
    await sleep(limit.interval - elapsed);
  }

  limit.lastCall = Date.now();
}

/**
 * Cache get/set with TTL
 */
function cacheGet(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function cacheSet(key, value, ttl) {
  cache.set(key, {
    value,
    expires: Date.now() + ttl
  });
}

/**
 * HTTP fetch with timeout and retry
 */
async function fetchWithRetry(url, options = {}, retries = CONFIG.retry.maxAttempts) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);

    if (retries > 0 && error.name !== 'AbortError') {
      const delay = getBackoffDelay(CONFIG.retry.maxAttempts - retries);
      console.log(`⚠️ Retry in ${Math.round(delay)}ms...`);
      await sleep(delay);
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint (without .json suffix)
 * @param {string} method - HTTP method
 * @param {Object} body - Request body for POST/PUT
 * @param {string} rateType - Rate limit type ('catalog' or 'order')
 */
async function apiRequest(endpoint, method = 'GET', body = null, rateType = 'catalog') {
  await rateLimit(rateType);

  const baseUrl = getBaseUrl();
  // BigBuy endpoints end with .json
  const url = endpoint.endsWith('.json') ? `${baseUrl}${endpoint}` : `${baseUrl}${endpoint}.json`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.apiKey}`
    }
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    const errorData = safeJsonParse(errorText, { message: errorText });
    throw new Error(`BigBuy API error (${response.status}): ${errorData.message || errorText}`);
  }

  // Some endpoints return empty body on success
  const text = await response.text();
  if (!text) return { success: true };

  return safeJsonParse(text, { raw: text });
}

// ============================================================================
// CATALOG OPERATIONS
// ============================================================================

/**
 * Get all categories
 */
async function getCategories(options = {}) {
  const cacheKey = 'categories';
  const cached = cacheGet(cacheKey);
  if (cached && !options.fresh) return cached;

  const result = await apiRequest('/catalog/categories');
  cacheSet(cacheKey, result, CONFIG.cacheTTL.categories);
  return result;
}

/**
 * Get products by category or all products
 * Note: BigBuy catalog is LARGE (100k+ products), use pagination
 */
async function getProducts(options = {}) {
  const params = new URLSearchParams();

  if (options.categoryId) {
    params.set('category', options.categoryId);
  }
  if (options.page) {
    params.set('pageNumber', options.page);
  }
  if (options.limit) {
    params.set('pageSize', Math.min(options.limit, 1000)); // Max 1000 per page
  }

  const endpoint = `/catalog/products${params.toString() ? '?' + params.toString() : ''}`;
  return apiRequest(endpoint);
}

/**
 * Get product details by SKU
 */
async function getProduct(sku) {
  const cacheKey = `product:${sku}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const result = await apiRequest(`/catalog/product/${sku}`);
  cacheSet(cacheKey, result, CONFIG.cacheTTL.products);
  return result;
}

/**
 * Get product prices (batch by SKUs)
 */
async function getProductPrices(skus = []) {
  if (skus.length === 0) {
    // All products - warning: large response
    return apiRequest('/catalog/productprices');
  }

  // Filter by SKUs
  const results = [];
  for (const sku of skus) {
    const cacheKey = `price:${sku}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      results.push(cached);
      continue;
    }

    const price = await apiRequest(`/catalog/productprice/${sku}`);
    cacheSet(cacheKey, price, CONFIG.cacheTTL.prices);
    results.push(price);
  }
  return results;
}

/**
 * Get stock levels (batch by SKUs)
 */
async function getStock(skus = []) {
  if (skus.length === 0) {
    // All products - warning: large response
    return apiRequest('/catalog/productsstock');
  }

  const results = [];
  for (const sku of skus) {
    const cacheKey = `stock:${sku}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      results.push(cached);
      continue;
    }

    const stock = await apiRequest(`/catalog/productstock/${sku}`);
    cacheSet(cacheKey, stock, CONFIG.cacheTTL.stock);
    results.push(stock);
  }
  return results;
}

/**
 * Get product images
 */
async function getProductImages(sku) {
  return apiRequest(`/catalog/productimages/${sku}`);
}

/**
 * Get product variations (sizes, colors, etc.)
 */
async function getProductVariations(sku) {
  return apiRequest(`/catalog/productvariations/${sku}`);
}

/**
 * Search products by name/description
 * Note: BigBuy doesn't have native search - filter locally or use category browse
 */
async function searchProducts(query, categoryId = null) {
  console.log('⚠️ BigBuy has no native search API - fetching category and filtering...');

  if (!categoryId) {
    // Get all categories and search within first few
    const categories = await getCategories();
    // This is inefficient but BigBuy doesn't provide search
    console.log('💡 Tip: Provide categoryId for faster search');
    return [];
  }

  const products = await getProducts({ categoryId, limit: 1000 });
  const queryLower = query.toLowerCase();

  return (products || []).filter(p =>
    (p.name && p.name.toLowerCase().includes(queryLower)) ||
    (p.description && p.description.toLowerCase().includes(queryLower))
  );
}

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

/**
 * Check order feasibility before creating
 * @param {Object} orderData - Order to validate
 */
async function checkOrder(orderData) {
  const payload = {
    delivery: {
      isoCountry: orderData.countryCode,
      postcode: orderData.postcode
    },
    products: orderData.products.map(p => ({
      reference: p.sku,
      quantity: p.quantity
    }))
  };

  const result = await apiRequest('/order/check', 'POST', payload, 'order');
  return result;
}

/**
 * Create order
 * @param {Object} orderData - Full order information
 */
async function createOrder(orderData) {
  const payload = {
    internalReference: orderData.reference || `3A-${Date.now()}`,
    cashOnDelivery: orderData.cashOnDelivery || false,
    delivery: {
      isoCountry: orderData.address.countryCode,
      postcode: orderData.address.postcode,
      town: orderData.address.city,
      address: orderData.address.address1,
      firstName: orderData.address.firstName,
      lastName: orderData.address.lastName,
      phone: orderData.address.phone,
      email: orderData.address.email,
      comment: orderData.comment || ''
    },
    products: orderData.products.map(p => ({
      reference: p.sku,
      quantity: p.quantity
    }))
  };

  // Add carrier if specified
  if (orderData.carrierId) {
    payload.delivery.carrierId = orderData.carrierId;
  }

  const result = await apiRequest('/order/create', 'POST', payload, 'order');
  return {
    success: true,
    orderId: result.id || result.orderId,
    reference: payload.internalReference,
    ...result
  };
}

/**
 * Create multi-shipping order (different addresses)
 */
async function createMultiShippingOrder(orderData) {
  const payload = {
    internalReference: orderData.reference || `3A-MULTI-${Date.now()}`,
    shipments: orderData.shipments.map(s => ({
      delivery: {
        isoCountry: s.address.countryCode,
        postcode: s.address.postcode,
        town: s.address.city,
        address: s.address.address1,
        firstName: s.address.firstName,
        lastName: s.address.lastName,
        phone: s.address.phone,
        email: s.address.email
      },
      products: s.products.map(p => ({
        reference: p.sku,
        quantity: p.quantity
      }))
    }))
  };

  const result = await apiRequest('/order/create/multishipping', 'POST', payload, 'order');
  return result;
}

// ============================================================================
// SHIPPING OPERATIONS
// ============================================================================

/**
 * Get available carriers
 */
async function getCarriers() {
  return apiRequest('/shipping/carriers');
}

/**
 * Get shipping options for destination
 */
async function getShippingOptions(countryCode, products) {
  const payload = {
    delivery: {
      isoCountry: countryCode
    },
    products: products.map(p => ({
      reference: p.sku,
      quantity: p.quantity
    }))
  };

  return apiRequest('/shipping/options', 'POST', payload);
}

/**
 * Get shipping orders (list)
 */
async function getShippingOrders() {
  return apiRequest('/shipping/orders');
}

/**
 * Get shipping order details
 */
async function getShippingOrder(orderId) {
  return apiRequest(`/shipping/order/${orderId}`);
}

// ============================================================================
// TRACKING OPERATIONS
// ============================================================================

/**
 * Get tracking info for order
 */
async function getTracking(orderId) {
  const result = await apiRequest(`/tracking/order/${orderId}`);
  return {
    orderId,
    trackingNumber: result.trackingNumber,
    carrier: result.carrier,
    status: result.status,
    events: result.trackingEvents || [],
    estimatedDelivery: result.estimatedDeliveryDate
  };
}

/**
 * Get tracking for multiple orders
 */
async function getTrackingBatch(orderIds) {
  const results = [];
  for (const orderId of orderIds) {
    try {
      const tracking = await getTracking(orderId);
      results.push(tracking);
    } catch (e) {
      results.push({ orderId, error: e.message });
    }
  }
  return results;
}

// ============================================================================
// SYNC OPERATIONS (for e-commerce platforms)
// ============================================================================

/**
 * Sync products to external platform (with HITL check)
 * Returns products with prices and stock ready for import
 */
async function syncCatalog(categoryIds = [], options = {}) {
  // HITL Check: Large batch syncs require approval
  if (HITL_CONFIG.enabled) {
    // First, count total products without syncing
    let totalProductCount = 0;
    for (const categoryId of categoryIds) {
      try {
        const products = await getProducts({ categoryId, limit: options.limit || 100 });
        totalProductCount += (products || []).length;
      } catch (e) {
        // Continue counting
      }
    }

    if (totalProductCount >= HITL_CONFIG.batchThreshold) {
      const pendingSync = queueSyncForApproval(categoryIds, totalProductCount, options);
      return {
        status: 'pending_approval',
        hitlId: pendingSync.id,
        productCount: totalProductCount,
        categoryIds,
        message: `Sync queued for HITL approval. Use --approve=${pendingSync.id} to process.`
      };
    }
  }

  // Process sync normally
  return syncCatalogInternal(categoryIds, options);
}

/**
 * Internal sync (bypasses HITL check)
 */
async function syncCatalogInternal(categoryIds = [], options = {}) {
  const results = {
    products: [],
    errors: [],
    syncedAt: new Date().toISOString()
  };

  for (const categoryId of categoryIds) {
    try {
      console.log(`📦 Syncing category ${categoryId}...`);

      // Get products
      const products = await getProducts({ categoryId, limit: options.limit || 100 });

      if (!products || products.length === 0) {
        console.log(`  ⚠️ No products in category ${categoryId}`);
        continue;
      }

      // Get prices and stock for each product
      for (const product of products) {
        try {
          const [prices, stock] = await Promise.all([
            getProductPrices([product.sku]),
            getStock([product.sku])
          ]);

          results.products.push({
            sku: product.sku,
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            price: prices[0]?.price || null,
            retailPrice: prices[0]?.retailPrice || null,
            stock: stock[0]?.quantity || 0,
            inStock: (stock[0]?.quantity || 0) > 0,
            images: product.images || []
          });
        } catch (e) {
          results.errors.push({
            sku: product.sku,
            error: e.message
          });
        }
      }

      console.log(`  ✅ Synced ${products.length} products`);
    } catch (e) {
      results.errors.push({
        categoryId,
        error: e.message
      });
    }
  }

  console.log(`\n📊 Sync complete: ${results.products.length} products, ${results.errors.length} errors`);
  return results;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║              BigBuy Supplier Sync - Health Check                 ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  const env = CONFIG.useSandbox ? 'SANDBOX' : 'PRODUCTION';
  console.log(`║  Environment: ${env.padEnd(51)}║`);

  const checks = {
    config: false,
    categories: false,
    products: false,
    carriers: false
  };

  // Check config
  if (!CONFIG.apiKey) {
    console.log('║  ❌ BIGBUY_API_KEY not configured                                ║');
  } else {
    console.log('║  ✅ BIGBUY_API_KEY configured                                    ║');
    checks.config = true;
  }

  if (!checks.config) {
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Status: ⚠️  TEST MODE (no credentials)                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    return { status: 'test_mode', checks, environment: env };
  }

  // Check categories API
  try {
    const categories = await getCategories({ fresh: true });
    const count = Array.isArray(categories) ? categories.length : 0;
    console.log(`║  ✅ Categories API (${count} categories)`.padEnd(67) + '║');
    checks.categories = true;
  } catch (e) {
    console.log(`║  ❌ Categories API: ${e.message.substring(0, 40).padEnd(40)}║`);
  }

  // Check products API (single product to avoid large response)
  try {
    const products = await getProducts({ limit: 1 });
    const count = Array.isArray(products) ? products.length : (products ? 1 : 0);
    console.log(`║  ✅ Products API accessible`.padEnd(67) + '║');
    checks.products = true;
  } catch (e) {
    console.log(`║  ❌ Products API: ${e.message.substring(0, 42).padEnd(42)}║`);
  }

  // Check carriers API
  try {
    const carriers = await getCarriers();
    const count = Array.isArray(carriers) ? carriers.length : 0;
    console.log(`║  ✅ Carriers API (${count} carriers)`.padEnd(67) + '║');
    checks.carriers = true;
  } catch (e) {
    console.log(`║  ❌ Carriers API: ${e.message.substring(0, 42).padEnd(42)}║`);
  }

  const allOk = Object.values(checks).every(v => v);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Status: ${allOk ? '✅ OPERATIONAL' : '⚠️  PARTIAL'}`.padEnd(67) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  return { status: allOk ? 'operational' : 'partial', checks, environment: env };
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--health')) {
    return healthCheck();
  }

  if (args.includes('--help')) {
    console.log(`
BigBuy Supplier Sync v1.0.0

Usage:
  node bigbuy-supplier-sync.cjs [options]

Options:
  --health              Check API connectivity
  --categories          List all categories
  --products            List products (use with --category)
  --category=ID         Filter by category ID
  --product=SKU         Get product details
  --stock=SKU           Get stock level
  --price=SKU           Get price info
  --carriers            List shipping carriers
  --check-order         Validate order feasibility
  --sync                Sync catalog (with --category)
  --server              Start HTTP server (port ${CONFIG.port})
  --sandbox             Use sandbox environment
  --list-pending        List HITL pending syncs awaiting approval
  --approve=ID          Approve HITL pending sync
  --reject=ID           Reject HITL pending sync
  --help                Show this help

HITL (Human In The Loop):
  Syncs >= ${HITL_CONFIG.batchThreshold} products require manual approval.
  ENV: HITL_BATCH_THRESHOLD (default: 100)
  ENV: HITL_SLACK_WEBHOOK (Slack notifications)
  ENV: HITL_BIGBUY_ENABLED (default: true)

Environment:
  BIGBUY_API_KEY       Your BigBuy API key
  BIGBUY_SANDBOX       Set to 'true' for sandbox mode
  BIGBUY_PORT          Server port (default: 3021)

Examples:
  node bigbuy-supplier-sync.cjs --health
  node bigbuy-supplier-sync.cjs --categories
  node bigbuy-supplier-sync.cjs --products --category=123 --limit=50
  node bigbuy-supplier-sync.cjs --product=ABC123
  node bigbuy-supplier-sync.cjs --sync --category=123
`);
    return;
  }

  // Override sandbox from CLI
  if (args.includes('--sandbox')) {
    CONFIG.useSandbox = true;
    console.log('🧪 Using SANDBOX environment');
  }

  // HITL Commands
  if (args.includes('--list-pending')) {
    return listPendingSyncs();
  }

  const approveArg = args.find(a => a.startsWith('--approve='));
  if (approveArg) {
    const hitlId = approveArg.split('=')[1];
    return approveSync(hitlId);
  }

  const rejectArg = args.find(a => a.startsWith('--reject='));
  if (rejectArg) {
    const hitlId = rejectArg.split('=')[1];
    const reasonArg = args.find(a => a.startsWith('--reason='));
    const reason = reasonArg ? reasonArg.split('=')[1] : 'Rejected by operator';
    return rejectSync(hitlId, reason);
  }

  if (args.includes('--categories')) {
    const categories = await getCategories({ fresh: true });
    console.log(`📂 Categories (${categories.length}):\n`);
    (categories || []).slice(0, 30).forEach(c => {
      console.log(`  • ${c.name || c.id} (ID: ${c.id})`);
    });
    return categories;
  }

  if (args.includes('--products')) {
    const catArg = args.find(a => a.startsWith('--category='));
    const limitArg = args.find(a => a.startsWith('--limit='));

    const categoryId = catArg ? catArg.split('=')[1] : null;
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 20;

    const products = await getProducts({ categoryId, limit });
    console.log(`📦 Products (showing ${Math.min(limit, (products || []).length)}):\n`);
    (products || []).slice(0, limit).forEach(p => {
      console.log(`  • ${p.name || p.sku}`);
      console.log(`    SKU: ${p.sku}`);
    });
    return products;
  }

  const productArg = args.find(a => a.startsWith('--product='));
  if (productArg) {
    const sku = productArg.split('=')[1];
    const product = await getProduct(sku);
    console.log('📦 Product Details:\n');
    console.log(JSON.stringify(product, null, 2));
    return product;
  }

  const stockArg = args.find(a => a.startsWith('--stock='));
  if (stockArg) {
    const sku = stockArg.split('=')[1];
    const stock = await getStock([sku]);
    console.log('📊 Stock Level:\n');
    console.log(JSON.stringify(stock, null, 2));
    return stock;
  }

  const priceArg = args.find(a => a.startsWith('--price='));
  if (priceArg) {
    const sku = priceArg.split('=')[1];
    const prices = await getProductPrices([sku]);
    console.log('💰 Price Info:\n');
    console.log(JSON.stringify(prices, null, 2));
    return prices;
  }

  if (args.includes('--carriers')) {
    const carriers = await getCarriers();
    console.log(`🚚 Carriers (${(carriers || []).length}):\n`);
    (carriers || []).forEach(c => {
      console.log(`  • ${c.name || c.id} (ID: ${c.id})`);
    });
    return carriers;
  }

  if (args.includes('--sync')) {
    const catArg = args.find(a => a.startsWith('--category='));
    if (!catArg) {
      console.error('❌ --sync requires --category=ID');
      process.exit(1);
    }
    const categoryId = catArg.split('=')[1];
    const limitArg = args.find(a => a.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

    const result = await syncCatalog([categoryId], { limit });
    console.log('\n📊 Sync Results:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  if (args.includes('--server')) {
    return startServer();
  }

  // Default: health check
  return healthCheck();
}

// ============================================================================
// HTTP SERVER
// ============================================================================

async function startServer() {
  const http = require('http');

  // CORS whitelist
  const CORS_WHITELIST = [
    'https://3a-automation.com',
    'https://dashboard.3a-automation.com',
    'http://localhost:3000',
    'http://localhost:3021'
  ];

  const server = http.createServer(async (req, res) => {
    // CORS with whitelist
    const origin = req.headers.origin;
    if (origin && CORS_WHITELIST.some(allowed => origin.startsWith(allowed))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${CONFIG.port}`);
    const path = url.pathname;

    try {
      let result;

      switch (path) {
        case '/health':
          result = await healthCheck();
          break;
        case '/categories':
          result = await getCategories();
          break;
        case '/products':
          result = await getProducts({
            categoryId: url.searchParams.get('category'),
            page: parseInt(url.searchParams.get('page')) || 1,
            limit: parseInt(url.searchParams.get('limit')) || 20
          });
          break;
        case '/carriers':
          result = await getCarriers();
          break;
        default:
          // Handle /product/:sku, /stock/:sku, /price/:sku
          const productMatch = path.match(/^\/product\/(.+)$/);
          if (productMatch) {
            result = await getProduct(productMatch[1]);
            break;
          }

          const stockMatch = path.match(/^\/stock\/(.+)$/);
          if (stockMatch) {
            result = await getStock([stockMatch[1]]);
            break;
          }

          const priceMatch = path.match(/^\/price\/(.+)$/);
          if (priceMatch) {
            result = await getProductPrices([priceMatch[1]]);
            break;
          }

          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(CONFIG.port, () => {
    const env = CONFIG.useSandbox ? 'SANDBOX' : 'PRODUCTION';
    console.log(`🚀 BigBuy API server running on port ${CONFIG.port} (${env})`);
    console.log(`   Health: http://localhost:${CONFIG.port}/health`);
    console.log(`   Categories: http://localhost:${CONFIG.port}/categories`);
    console.log(`   Products: http://localhost:${CONFIG.port}/products?category=ID`);
    console.log(`   Product: http://localhost:${CONFIG.port}/product/:sku`);
    console.log(`   Stock: http://localhost:${CONFIG.port}/stock/:sku`);
    console.log(`   Carriers: http://localhost:${CONFIG.port}/carriers`);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Catalog
  getCategories,
  getProducts,
  getProduct,
  getProductPrices,
  getStock,
  getProductImages,
  getProductVariations,
  searchProducts,

  // Orders
  checkOrder,
  createOrder,
  createMultiShippingOrder,

  // Shipping
  getCarriers,
  getShippingOptions,
  getShippingOrders,
  getShippingOrder,

  // Tracking
  getTracking,
  getTrackingBatch,

  // Sync
  syncCatalog,

  // Utilities
  healthCheck,
  apiRequest
};

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}
