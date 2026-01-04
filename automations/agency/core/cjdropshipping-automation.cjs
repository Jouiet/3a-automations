#!/usr/bin/env node
/**
 * CJDropshipping Automation v1.0.0
 *
 * Complete integration with CJDropshipping API v2.0
 * Features:
 * - Token management (auto-refresh)
 * - Product search and catalog sync
 * - Order creation and management
 * - Logistics tracking
 * - Inventory monitoring
 *
 * Date: 2026-01-04
 * Author: 3A Automation
 *
 * API Documentation: https://developers.cjdropshipping.com/
 */

require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  baseUrl: 'https://developers.cjdropshipping.com/api2.0/v1',
  apiKey: process.env.CJ_API_KEY,
  // Token cache
  tokenCache: {
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  },
  // Rate limiting (auth endpoints: 1 per 5 minutes)
  rateLimits: {
    auth: { interval: 5 * 60 * 1000, lastCall: 0 },
    general: { interval: 100, lastCall: 0 } // 10 req/sec
  },
  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000
  },
  // Server config
  port: parseInt(process.env.CJ_PORT) || 3020
};

// ============================================================================
// UTILITIES
// ============================================================================

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
async function rateLimit(type = 'general') {
  const limit = CONFIG.rateLimits[type];
  const now = Date.now();
  const elapsed = now - limit.lastCall;

  if (elapsed < limit.interval) {
    await sleep(limit.interval - elapsed);
  }

  limit.lastCall = Date.now();
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
// AUTHENTICATION
// ============================================================================

/**
 * Get access token (cached or new)
 */
async function getAccessToken() {
  // Check cache
  if (CONFIG.tokenCache.accessToken && CONFIG.tokenCache.expiresAt > Date.now()) {
    return CONFIG.tokenCache.accessToken;
  }

  // Try refresh first if we have a refresh token
  if (CONFIG.tokenCache.refreshToken) {
    try {
      return await refreshAccessToken();
    } catch (e) {
      console.log('⚠️ Refresh failed, getting new token...');
    }
  }

  // Get new token
  await rateLimit('auth');

  const response = await fetchWithRetry(`${CONFIG.baseUrl}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CONFIG.apiKey })
  });

  const data = await response.json();

  if (!data.result || data.code !== 200) {
    throw new Error(`Auth failed: ${data.message || 'Unknown error'}`);
  }

  // Cache tokens (access: 15 days, refresh: 180 days)
  CONFIG.tokenCache.accessToken = data.data.accessToken;
  CONFIG.tokenCache.refreshToken = data.data.refreshToken;
  CONFIG.tokenCache.expiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days safety margin

  console.log('✅ CJDropshipping authenticated');
  return CONFIG.tokenCache.accessToken;
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
  await rateLimit('auth');

  const response = await fetchWithRetry(`${CONFIG.baseUrl}/authentication/refreshAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: CONFIG.tokenCache.refreshToken })
  });

  const data = await response.json();

  if (!data.result || data.code !== 200) {
    throw new Error(`Refresh failed: ${data.message || 'Unknown error'}`);
  }

  CONFIG.tokenCache.accessToken = data.data.accessToken;
  CONFIG.tokenCache.expiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000);

  console.log('✅ Token refreshed');
  return CONFIG.tokenCache.accessToken;
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  await rateLimit('general');

  const token = await getAccessToken();

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token
    }
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetchWithRetry(`${CONFIG.baseUrl}${endpoint}`, options);
  const data = await response.json();

  if (!data.result && data.code !== 200) {
    throw new Error(`API error: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

/**
 * List products with pagination
 */
async function listProducts(options = {}) {
  const params = {
    pageNum: options.page || 1,
    pageSize: Math.min(options.limit || 20, 200),
    productNameEn: options.search || undefined,
    categoryId: options.categoryId || undefined
  };

  // Remove undefined values
  Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

  const response = await apiRequest('/product/listV2', 'POST', params);

  return {
    products: response.data?.list || [],
    total: response.data?.total || 0,
    page: params.pageNum,
    pageSize: params.pageSize
  };
}

/**
 * Get product details by ID or SKU
 */
async function getProduct(identifier) {
  const isVid = identifier.length > 20; // VIDs are longer

  const response = await apiRequest('/product/query', 'POST', {
    [isVid ? 'vid' : 'sku']: identifier
  });

  return response.data;
}

/**
 * Get product categories
 */
async function getCategories() {
  const response = await apiRequest('/product/getCategory', 'GET');
  return response.data || [];
}

/**
 * Get product variants
 */
async function getProductVariants(vid) {
  const response = await apiRequest('/product/variant/query', 'POST', { vid });
  return response.data?.list || [];
}

/**
 * Check product stock
 */
async function checkStock(vid, quantity = 1) {
  const response = await apiRequest('/product/stock', 'POST', {
    vid,
    quantity
  });
  return response.data;
}

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

/**
 * Create order (V2 - recommended)
 * @param {Object} orderData - Order information
 * @param {string} orderData.shoppingId - Unique order identifier
 * @param {Array} orderData.products - Products with vid, quantity
 * @param {Object} orderData.address - Shipping address
 */
async function createOrder(orderData) {
  const payload = {
    shoppingId: orderData.shoppingId || `3A-${Date.now()}`,
    products: orderData.products.map(p => ({
      vid: p.vid,
      quantity: p.quantity
    })),
    shippingCountryCode: orderData.address.countryCode,
    shippingProvince: orderData.address.province || '',
    shippingCity: orderData.address.city,
    shippingAddress: orderData.address.address1,
    shippingAddress2: orderData.address.address2 || '',
    shippingZip: orderData.address.zip,
    shippingPhone: orderData.address.phone,
    shippingCustomerName: orderData.address.name,
    logisticName: orderData.logisticName || 'CJPacket Ordinary',
    remark: orderData.remark || 'Created by 3A Automation',
    fromCountryCode: orderData.fromCountry || 'CN'
  };

  const response = await apiRequest('/shopping/order/createOrderV2', 'POST', payload);

  return {
    success: response.result,
    orderId: response.data?.orderId,
    orderNumber: response.data?.orderNumber,
    message: response.message
  };
}

/**
 * Get order list with filters
 */
async function listOrders(options = {}) {
  const params = {
    pageNum: options.page || 1,
    pageSize: Math.min(options.limit || 20, 100),
    orderStatus: options.status || undefined, // CREATED, IN_CART, UNPAID, UNSHIPPED, SHIPPED, DELIVERED, CANCELLED
    startDate: options.startDate || undefined,
    endDate: options.endDate || undefined
  };

  Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

  const response = await apiRequest('/shopping/order/list', 'POST', params);

  return {
    orders: response.data?.list || [],
    total: response.data?.total || 0,
    page: params.pageNum
  };
}

/**
 * Get order details
 */
async function getOrder(orderId) {
  const response = await apiRequest('/shopping/order/getOrderDetail', 'POST', { orderId });
  return response.data;
}

/**
 * Confirm order (move from IN_CART to UNPAID)
 */
async function confirmOrder(orderId) {
  const response = await apiRequest('/shopping/order/confirm', 'POST', { orderId });
  return {
    success: response.result,
    message: response.message
  };
}

/**
 * Delete/cancel order
 */
async function deleteOrder(orderId) {
  const response = await apiRequest('/shopping/order/delete', 'POST', { orderId });
  return {
    success: response.result,
    message: response.message
  };
}

// ============================================================================
// LOGISTICS OPERATIONS
// ============================================================================

/**
 * Calculate shipping freight
 */
async function calculateFreight(options) {
  const payload = {
    startCountryCode: options.fromCountry || 'CN',
    endCountryCode: options.toCountry,
    products: options.products.map(p => ({
      vid: p.vid,
      quantity: p.quantity
    }))
  };

  const response = await apiRequest('/logistic/freightCalculate', 'POST', payload);

  return response.data?.map(option => ({
    logisticName: option.logisticName,
    logisticPrice: option.logisticPrice,
    logisticPriceCn: option.logisticPriceCn,
    deliveryDays: option.logisticAging,
    trackable: option.logisticTrack === 1
  })) || [];
}

/**
 * Get tracking information
 */
async function getTracking(trackingNumber) {
  const response = await apiRequest('/logistic/trackInfo', 'POST', {
    trackNumber: trackingNumber
  });

  return {
    trackNumber: trackingNumber,
    logisticName: response.data?.logisticName,
    status: response.data?.trackingStatus,
    events: response.data?.trackingInfo || [],
    lastUpdate: response.data?.lastUpdateTime
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           CJDropshipping Automation - Health Check               ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  const checks = {
    config: false,
    auth: false,
    products: false,
    categories: false
  };

  // Check config
  if (!CONFIG.apiKey) {
    console.log('║  ❌ CJ_API_KEY not configured                                    ║');
  } else {
    console.log('║  ✅ CJ_API_KEY configured                                        ║');
    checks.config = true;
  }

  if (!checks.config) {
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Status: ⚠️  TEST MODE (no credentials)                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    return { status: 'test_mode', checks };
  }

  // Check authentication
  try {
    await getAccessToken();
    console.log('║  ✅ Authentication successful                                    ║');
    checks.auth = true;
  } catch (e) {
    console.log(`║  ❌ Authentication failed: ${e.message.substring(0, 35).padEnd(35)}║`);
  }

  if (!checks.auth) {
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  Status: ❌ BLOCKED (auth failed)                                ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    return { status: 'blocked', checks };
  }

  // Check products API
  try {
    const products = await listProducts({ limit: 1 });
    console.log(`║  ✅ Products API (${products.total} total)`.padEnd(67) + '║');
    checks.products = true;
  } catch (e) {
    console.log(`║  ❌ Products API failed: ${e.message.substring(0, 35).padEnd(35)}║`);
  }

  // Check categories API
  try {
    const categories = await getCategories();
    console.log(`║  ✅ Categories API (${categories.length} categories)`.padEnd(67) + '║');
    checks.categories = true;
  } catch (e) {
    console.log(`║  ❌ Categories API failed                                        ║`);
  }

  const allOk = Object.values(checks).every(v => v);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Status: ${allOk ? '✅ OPERATIONAL' : '⚠️  PARTIAL'}`.padEnd(67) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  return { status: allOk ? 'operational' : 'partial', checks };
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
CJDropshipping Automation v1.0.0

Usage:
  node cjdropshipping-automation.cjs [options]

Options:
  --health              Check API connectivity
  --list-products       List products
  --search=QUERY        Search products by name
  --product=ID          Get product details
  --categories          List categories
  --list-orders         List orders
  --order=ID            Get order details
  --track=NUMBER        Get tracking info
  --server              Start HTTP server (port ${CONFIG.port})
  --help                Show this help

Environment:
  CJ_API_KEY           Your CJDropshipping API key (from account settings)
  CJ_PORT              Server port (default: 3020)

Examples:
  node cjdropshipping-automation.cjs --health
  node cjdropshipping-automation.cjs --search="phone case"
  node cjdropshipping-automation.cjs --track=CJP123456789
`);
    return;
  }

  if (args.includes('--list-products')) {
    const searchArg = args.find(a => a.startsWith('--search='));
    const search = searchArg ? searchArg.split('=')[1] : undefined;

    const result = await listProducts({ search, limit: 10 });
    console.log(`📦 Products (${result.total} total):\n`);
    result.products.forEach(p => {
      console.log(`  • ${p.productNameEn || p.productName}`);
      console.log(`    SKU: ${p.productSku} | Price: $${p.sellPrice}`);
    });
    return result;
  }

  if (args.includes('--categories')) {
    const categories = await getCategories();
    console.log(`📂 Categories (${categories.length}):\n`);
    categories.slice(0, 20).forEach(c => {
      console.log(`  • ${c.categoryNameEn || c.categoryName} (${c.categoryId})`);
    });
    return categories;
  }

  if (args.includes('--list-orders')) {
    const result = await listOrders({ limit: 10 });
    console.log(`📋 Orders (${result.total} total):\n`);
    result.orders.forEach(o => {
      console.log(`  • ${o.orderId}: ${o.orderStatus} - $${o.orderAmount}`);
    });
    return result;
  }

  const productArg = args.find(a => a.startsWith('--product='));
  if (productArg) {
    const id = productArg.split('=')[1];
    const product = await getProduct(id);
    console.log('📦 Product Details:\n');
    console.log(JSON.stringify(product, null, 2));
    return product;
  }

  const orderArg = args.find(a => a.startsWith('--order='));
  if (orderArg) {
    const id = orderArg.split('=')[1];
    const order = await getOrder(id);
    console.log('📋 Order Details:\n');
    console.log(JSON.stringify(order, null, 2));
    return order;
  }

  const trackArg = args.find(a => a.startsWith('--track='));
  if (trackArg) {
    const number = trackArg.split('=')[1];
    const tracking = await getTracking(number);
    console.log('🚚 Tracking Info:\n');
    console.log(JSON.stringify(tracking, null, 2));
    return tracking;
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
    'http://localhost:3020'
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
        case '/products':
          result = await listProducts({
            search: url.searchParams.get('search'),
            page: parseInt(url.searchParams.get('page')) || 1,
            limit: parseInt(url.searchParams.get('limit')) || 20
          });
          break;
        case '/categories':
          result = await getCategories();
          break;
        case '/orders':
          result = await listOrders({
            status: url.searchParams.get('status'),
            page: parseInt(url.searchParams.get('page')) || 1
          });
          break;
        default:
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
    console.log(`🚀 CJDropshipping API server running on port ${CONFIG.port}`);
    console.log(`   Health: http://localhost:${CONFIG.port}/health`);
    console.log(`   Products: http://localhost:${CONFIG.port}/products`);
    console.log(`   Categories: http://localhost:${CONFIG.port}/categories`);
    console.log(`   Orders: http://localhost:${CONFIG.port}/orders`);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Auth
  getAccessToken,
  refreshAccessToken,

  // Products
  listProducts,
  getProduct,
  getCategories,
  getProductVariants,
  checkStock,

  // Orders
  createOrder,
  listOrders,
  getOrder,
  confirmOrder,
  deleteOrder,

  // Logistics
  calculateFreight,
  getTracking,

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
