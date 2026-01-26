#!/usr/bin/env node
/**
 * Dropshipping Order Flow v1.0.0
 *
 * Orchestration layer for multi-supplier dropshipping:
 * - Routes orders to appropriate suppliers (CJDropshipping, BigBuy)
 * - Creates supplier orders automatically
 * - Syncs tracking back to storefronts
 * - Handles multi-supplier orders (split shipping)
 *
 * Date: 2026-01-04
 * Author: 3A Automation
 *
 * Supported Storefronts: Shopify, WooCommerce
 * Supported Suppliers: CJDropshipping, BigBuy
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                    Storefront (Shopify/WooCommerce)                 │
 * │                              ↓ webhook                               │
 * │ ┌──────────────────────────────────────────────────────────────────┐│
 * │ │              dropshipping-order-flow.cjs (port 3022)             ││
 * │ │                                                                    ││
 * │ │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   ││
 * │ │  │   Order      │ →  │   Routing    │ →  │  Supplier Order  │   ││
 * │ │  │   Parser     │    │   Engine     │    │  Creator         │   ││
 * │ │  └──────────────┘    └──────────────┘    └──────────────────┘   ││
 * │ │                                                 ↓                 ││
 * │ │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   ││
 * │ │  │   Tracking   │ ←  │   Status     │ ←  │  Supplier APIs   │   ││
 * │ │  │   Sync       │    │   Monitor    │    │  (CJ, BigBuy)    │   ││
 * │ │  └──────────────┘    └──────────────┘    └──────────────────┘   ││
 * │ └──────────────────────────────────────────────────────────────────┘│
 * └─────────────────────────────────────────────────────────────────────┘
 */

require('dotenv').config();

// Import supplier modules
const fs = require('fs');
const path = require('path');
const cjDropshipping = require('./cjdropshipping-automation.cjs');
const bigBuy = require('./bigbuy-supplier-sync.cjs');

// ============================================================================
// FILE-BASED PERSISTENCE
// ============================================================================

const DATA_DIR = process.env.DROPSHIP_DATA_DIR || path.join(__dirname, '../../../data/dropshipping');
const ORDER_STORE_FILE = path.join(DATA_DIR, 'order-store.json');
const PENDING_TRACKING_FILE = path.join(DATA_DIR, 'pending-tracking.json');
const HITL_PENDING_DIR = path.join(DATA_DIR, 'hitl-pending');
const HITL_PENDING_FILE = path.join(HITL_PENDING_DIR, 'pending-orders.json');

// ============================================================================
// HITL CONFIGURATION (Human In The Loop)
// User configurable thresholds via ENV variables:
//   HITL_ORDER_VALUE_THRESHOLD: 200 | 300 | 400 | 500 | custom (default: 300)
// ============================================================================

const HITL_CONFIG = {
  enabled: process.env.HITL_DROPSHIP_ENABLED !== 'false',
  orderValueThreshold: parseFloat(process.env.HITL_ORDER_VALUE_THRESHOLD) || 300, // €200, €300, €400, €500 ou valeur custom
  orderValueOptions: [200, 300, 400, 500],  // Recommended options
  slackWebhook: process.env.HITL_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL,
  notifyOnPending: process.env.HITL_NOTIFY_ON_PENDING !== 'false'
};

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Created data directory: ${DATA_DIR}`);
  }
}

// Load Map from JSON file
function loadMapFromFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.warn(`⚠️ Could not load ${path.basename(filePath)}: ${error.message}`);
  }
  return new Map();
}

// Save Map to JSON file (atomic write)
function saveMapToFile(map, filePath) {
  try {
    const data = Object.fromEntries(map);
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`❌ Failed to persist ${path.basename(filePath)}: ${error.message}`);
  }
}

// Persistent Map wrapper
function createPersistentMap(filePath) {
  const map = loadMapFromFile(filePath);

  return {
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
      saveMapToFile(map, filePath);
      return map;
    },
    has: (key) => map.has(key),
    delete: (key) => {
      const result = map.delete(key);
      saveMapToFile(map, filePath);
      return result;
    },
    clear: () => {
      map.clear();
      saveMapToFile(map, filePath);
    },
    get size() { return map.size; },
    keys: () => map.keys(),
    values: () => map.values(),
    entries: () => map.entries(),
    forEach: (callback) => map.forEach(callback),
    [Symbol.iterator]: () => map[Symbol.iterator]()
  };
}

// Initialize persistence on startup
ensureDataDir();

// Ensure HITL directory exists
function ensureHitlDir() {
  if (!fs.existsSync(HITL_PENDING_DIR)) {
    fs.mkdirSync(HITL_PENDING_DIR, { recursive: true });
    console.log(`📁 Created HITL directory: ${HITL_PENDING_DIR}`);
  }
}
ensureHitlDir();

// ============================================================================
// HITL FUNCTIONS (Human In The Loop)
// ============================================================================

/**
 * Load pending HITL orders
 */
function loadPendingOrders() {
  try {
    if (fs.existsSync(HITL_PENDING_FILE)) {
      return JSON.parse(fs.readFileSync(HITL_PENDING_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn(`⚠️ Could not load HITL pending orders: ${error.message}`);
  }
  return [];
}

/**
 * Save pending HITL orders
 */
function savePendingOrders(orders) {
  try {
    const tempPath = `${HITL_PENDING_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(orders, null, 2));
    fs.renameSync(tempPath, HITL_PENDING_FILE);
  } catch (error) {
    console.error(`❌ Failed to save HITL pending orders: ${error.message}`);
  }
}

/**
 * Queue order for HITL approval
 */
function queueOrderForApproval(order, reason) {
  const pending = loadPendingOrders();
  const pendingOrder = {
    id: `hitl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    source: order.source,
    customer: order.customer,
    shippingAddress: order.shippingAddress,
    items: order.items,
    totalValue: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    reason,
    queuedAt: new Date().toISOString(),
    status: 'pending'
  };

  pending.push(pendingOrder);
  savePendingOrders(pending);

  console.log(`🔒 Order #${order.orderNumber} queued for HITL approval (${reason})`);

  // Send Slack notification if configured
  if (HITL_CONFIG.slackWebhook && HITL_CONFIG.notifyOnPending) {
    sendHitlNotification(pendingOrder).catch(e => console.error(`❌ Slack notification failed: ${e.message}`));
  }

  return pendingOrder;
}

/**
 * Send Slack notification for pending HITL order
 */
async function sendHitlNotification(pendingOrder) {
  if (!HITL_CONFIG.slackWebhook) return;

  const message = {
    text: `🔒 HITL Approval Required - Dropshipping Order`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔒 HITL: High-Value Order Pending', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Order:* #${pendingOrder.orderNumber}` },
          { type: 'mrkdwn', text: `*Value:* €${pendingOrder.totalValue.toFixed(2)}` },
          { type: 'mrkdwn', text: `*Customer:* ${pendingOrder.customer?.email || 'N/A'}` },
          { type: 'mrkdwn', text: `*Reason:* ${pendingOrder.reason}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`node dropshipping-order-flow.cjs --approve=${pendingOrder.id}\`\`\`` }
      }
    ]
  };

  const response = await fetch(HITL_CONFIG.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}

/**
 * Approve pending HITL order
 */
async function approveOrder(hitlId) {
  const pending = loadPendingOrders();
  const index = pending.findIndex(o => o.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL order ${hitlId} not found`);
    return { success: false, error: 'Order not found' };
  }

  const order = pending[index];
  order.status = 'approved';
  order.approvedAt = new Date().toISOString();

  // Remove from pending
  pending.splice(index, 1);
  savePendingOrders(pending);

  console.log(`✅ HITL order #${order.orderNumber} approved, processing...`);

  // Process the order
  const result = await processOrderInternal(order);

  return { success: true, order, result };
}

/**
 * Reject pending HITL order
 */
function rejectOrder(hitlId, reason = 'Rejected by operator') {
  const pending = loadPendingOrders();
  const index = pending.findIndex(o => o.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL order ${hitlId} not found`);
    return { success: false, error: 'Order not found' };
  }

  const order = pending[index];
  order.status = 'rejected';
  order.rejectedAt = new Date().toISOString();
  order.rejectionReason = reason;

  // Remove from pending (or keep in history file)
  pending.splice(index, 1);
  savePendingOrders(pending);

  console.log(`❌ HITL order #${order.orderNumber} rejected: ${reason}`);

  return { success: true, order };
}

/**
 * List pending HITL orders
 */
function listPendingOrders() {
  const pending = loadPendingOrders();
  console.log(`\n🔒 Pending HITL Orders (${pending.length}):\n`);

  if (pending.length === 0) {
    console.log('  No pending orders');
    return pending;
  }

  pending.forEach(o => {
    console.log(`  • ${o.id}`);
    console.log(`    Order: #${o.orderNumber} | Value: €${o.totalValue.toFixed(2)}`);
    console.log(`    Customer: ${o.customer?.email || 'N/A'}`);
    console.log(`    Reason: ${o.reason}`);
    console.log(`    Queued: ${o.queuedAt}`);
    console.log();
  });

  return pending;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Server
  port: parseInt(process.env.DROPSHIP_PORT) || 3022,

  // Storefront configuration
  storefronts: {
    shopify: {
      enabled: !!process.env.SHOPIFY_ACCESS_TOKEN,
      shop: process.env.SHOPIFY_SHOP_DOMAIN,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN
    },
    woocommerce: {
      enabled: !!process.env.WOO_CONSUMER_KEY,
      url: process.env.WOO_STORE_URL,
      consumerKey: process.env.WOO_CONSUMER_KEY,
      consumerSecret: process.env.WOO_CONSUMER_SECRET
    }
  },

  // Supplier configuration
  suppliers: {
    cjdropshipping: {
      enabled: !!process.env.CJ_API_KEY,
      // SKU prefixes that route to CJ
      skuPrefixes: ['CJ-', 'CJD-', 'CJDS-'],
      module: cjDropshipping
    },
    bigbuy: {
      enabled: !!process.env.BIGBUY_API_KEY,
      // SKU prefixes that route to BigBuy
      skuPrefixes: ['BB-', 'BIG-', 'BIGBUY-'],
      module: bigBuy
    }
  },

  // Default supplier for unmatched SKUs
  defaultSupplier: process.env.DEFAULT_SUPPLIER || 'cjdropshipping',

  // Webhook secrets (for verification)
  webhookSecrets: {
    shopify: process.env.SHOPIFY_WEBHOOK_SECRET,
    woocommerce: process.env.WOO_WEBHOOK_SECRET
  },

  // Order processing
  processing: {
    autoFulfill: process.env.AUTO_FULFILL !== 'false', // Default true
    syncTracking: process.env.SYNC_TRACKING !== 'false', // Default true
    trackingCheckInterval: 6 * 60 * 60 * 1000 // 6 hours
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000
  }
};

// File-based persistent order tracking (survives restarts)
const orderStore = createPersistentMap(ORDER_STORE_FILE);
const pendingTracking = createPersistentMap(PENDING_TRACKING_FILE);
console.log(`📦 Loaded ${orderStore.size} orders, ${pendingTracking.size} pending tracking from disk`);

// ============================================================================
// UTILITIES
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function getBackoffDelay(attempt) {
  const delay = Math.min(
    CONFIG.retry.baseDelay * Math.pow(2, attempt),
    CONFIG.retry.maxDelay
  );
  const jitter = Math.random() * 500;
  return delay + jitter;
}

async function withRetry(fn, maxAttempts = CONFIG.retry.maxAttempts) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      const delay = getBackoffDelay(attempt);
      console.log(`⚠️ Retry ${attempt + 1}/${maxAttempts} in ${Math.round(delay)}ms: ${error.message}`);
      await sleep(delay);
    }
  }
}

// ============================================================================
// SUPPLIER ROUTING
// ============================================================================

/**
 * Determine supplier for a product based on SKU
 */
function routeToSupplier(sku) {
  const skuUpper = (sku || '').toUpperCase();

  for (const [supplierName, config] of Object.entries(CONFIG.suppliers)) {
    if (!config.enabled) continue;

    for (const prefix of config.skuPrefixes) {
      if (skuUpper.startsWith(prefix.toUpperCase())) {
        return supplierName;
      }
    }
  }

  // Return default supplier if enabled
  const defaultConfig = CONFIG.suppliers[CONFIG.defaultSupplier];
  if (defaultConfig?.enabled) {
    return CONFIG.defaultSupplier;
  }

  return null;
}

/**
 * Group order items by supplier
 */
function groupItemsBySupplier(items) {
  const groups = {};

  for (const item of items) {
    const supplier = routeToSupplier(item.sku);

    if (!supplier) {
      console.log(`⚠️ No supplier found for SKU: ${item.sku}`);
      continue;
    }

    if (!groups[supplier]) {
      groups[supplier] = [];
    }

    groups[supplier].push(item);
  }

  return groups;
}

// ============================================================================
// ORDER PARSING
// ============================================================================

/**
 * Parse Shopify order webhook
 */
function parseShopifyOrder(payload) {
  return {
    source: 'shopify',
    orderId: payload.id?.toString(),
    orderNumber: payload.order_number?.toString() || payload.name,
    customer: {
      email: payload.email,
      firstName: payload.shipping_address?.first_name || payload.customer?.first_name,
      lastName: payload.shipping_address?.last_name || payload.customer?.last_name,
      phone: payload.shipping_address?.phone || payload.customer?.phone
    },
    shippingAddress: {
      firstName: payload.shipping_address?.first_name,
      lastName: payload.shipping_address?.last_name,
      address1: payload.shipping_address?.address1,
      address2: payload.shipping_address?.address2,
      city: payload.shipping_address?.city,
      province: payload.shipping_address?.province,
      provinceCode: payload.shipping_address?.province_code,
      country: payload.shipping_address?.country,
      countryCode: payload.shipping_address?.country_code,
      zip: payload.shipping_address?.zip,
      phone: payload.shipping_address?.phone
    },
    items: (payload.line_items || []).map(item => ({
      sku: item.sku,
      productId: item.product_id?.toString(),
      variantId: item.variant_id?.toString(),
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      fulfillmentStatus: item.fulfillment_status
    })),
    currency: payload.currency,
    totalPrice: parseFloat(payload.total_price),
    financialStatus: payload.financial_status,
    fulfillmentStatus: payload.fulfillment_status,
    note: payload.note,
    createdAt: payload.created_at,
    rawPayload: payload
  };
}

/**
 * Parse WooCommerce order webhook
 */
function parseWooCommerceOrder(payload) {
  const shipping = payload.shipping || {};
  const billing = payload.billing || {};

  return {
    source: 'woocommerce',
    orderId: payload.id?.toString(),
    orderNumber: payload.number?.toString(),
    customer: {
      email: billing.email,
      firstName: shipping.first_name || billing.first_name,
      lastName: shipping.last_name || billing.last_name,
      phone: billing.phone
    },
    shippingAddress: {
      firstName: shipping.first_name,
      lastName: shipping.last_name,
      address1: shipping.address_1,
      address2: shipping.address_2,
      city: shipping.city,
      province: shipping.state,
      provinceCode: shipping.state,
      country: shipping.country,
      countryCode: shipping.country,
      zip: shipping.postcode,
      phone: billing.phone
    },
    items: (payload.line_items || []).map(item => ({
      sku: item.sku,
      productId: item.product_id?.toString(),
      variantId: item.variation_id?.toString(),
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      fulfillmentStatus: null
    })),
    currency: payload.currency,
    totalPrice: parseFloat(payload.total),
    financialStatus: payload.status,
    fulfillmentStatus: null,
    note: payload.customer_note,
    createdAt: payload.date_created,
    rawPayload: payload
  };
}

// ============================================================================
// SUPPLIER ORDER CREATION
// ============================================================================

/**
 * Create order on CJDropshipping
 */
async function createCJOrder(order, items) {
  console.log(`📦 Creating CJDropshipping order for ${items.length} items...`);

  const cjOrder = {
    orderNumber: order.orderNumber,
    shippingZip: order.shippingAddress.zip,
    shippingCountry: order.shippingAddress.countryCode,
    shippingCountryState: order.shippingAddress.provinceCode,
    shippingCity: order.shippingAddress.city,
    shippingAddress: order.shippingAddress.address1,
    shippingAddress2: order.shippingAddress.address2 || '',
    shippingCustomerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim(),
    shippingPhone: order.shippingAddress.phone || order.customer.phone,
    remark: order.note || '',
    products: items.map(item => ({
      vid: item.variantId || item.sku,
      quantity: item.quantity
    }))
  };

  const result = await withRetry(() => cjDropshipping.createOrder(cjOrder));

  return {
    supplier: 'cjdropshipping',
    supplierOrderId: result.orderId,
    items: items.map(i => i.sku),
    status: 'created',
    createdAt: new Date().toISOString()
  };
}

/**
 * Create order on BigBuy
 */
async function createBigBuyOrder(order, items) {
  console.log(`📦 Creating BigBuy order for ${items.length} items...`);

  const bbOrder = {
    internalReference: order.orderNumber,
    carriers: [], // Will be determined by BigBuy
    delivery: {
      isoCountry: order.shippingAddress.countryCode,
      postcode: order.shippingAddress.zip,
      town: order.shippingAddress.city,
      address: order.shippingAddress.address1,
      firstName: order.shippingAddress.firstName,
      lastName: order.shippingAddress.lastName,
      phone: order.shippingAddress.phone || order.customer.phone,
      email: order.customer.email,
      comment: order.note || ''
    },
    products: items.map(item => ({
      reference: item.sku.replace(/^(BB-|BIG-|BIGBUY-)/i, ''),
      quantity: item.quantity
    }))
  };

  const result = await withRetry(() => bigBuy.createOrder(bbOrder));

  return {
    supplier: 'bigbuy',
    supplierOrderId: result.orderId || result.id,
    items: items.map(i => i.sku),
    status: 'created',
    createdAt: new Date().toISOString()
  };
}

// ============================================================================
// ORDER PROCESSING
// ============================================================================

/**
 * Process incoming order (with HITL check)
 */
async function processOrder(order) {
  console.log(`\n📋 Processing order #${order.orderNumber} from ${order.source}...`);

  // Check if already processed
  if (orderStore.has(order.orderId)) {
    console.log(`⚠️ Order #${order.orderNumber} already processed`);
    return { status: 'duplicate', orderId: order.orderId };
  }

  // HITL Check: High-value orders require approval
  if (HITL_CONFIG.enabled) {
    const totalValue = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalValue >= HITL_CONFIG.orderValueThreshold) {
      const pendingOrder = queueOrderForApproval(order, `Order value €${totalValue.toFixed(2)} >= €${HITL_CONFIG.orderValueThreshold} threshold`);
      return {
        status: 'pending_approval',
        hitlId: pendingOrder.id,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        totalValue,
        message: `Order queued for HITL approval. Use --approve=${pendingOrder.id} to process.`
      };
    }
  }

  // Process order normally
  return processOrderInternal(order);
}

/**
 * Internal order processing (bypasses HITL check)
 */
async function processOrderInternal(order) {
  // Group items by supplier
  const supplierGroups = groupItemsBySupplier(order.items);
  const supplierNames = Object.keys(supplierGroups);

  if (supplierNames.length === 0) {
    console.log(`❌ No valid supplier found for order items`);
    return { status: 'error', error: 'No supplier found for any items' };
  }

  console.log(`📊 Order split across ${supplierNames.length} supplier(s): ${supplierNames.join(', ')}`);

  // Create supplier orders
  const supplierOrders = [];
  const errors = [];

  for (const [supplier, items] of Object.entries(supplierGroups)) {
    try {
      let supplierOrder;

      switch (supplier) {
        case 'cjdropshipping':
          supplierOrder = await createCJOrder(order, items);
          break;
        case 'bigbuy':
          supplierOrder = await createBigBuyOrder(order, items);
          break;
        default:
          throw new Error(`Unknown supplier: ${supplier}`);
      }

      supplierOrders.push(supplierOrder);
      console.log(`✅ ${supplier}: Order ${supplierOrder.supplierOrderId} created`);

    } catch (error) {
      console.error(`❌ ${supplier}: Failed - ${error.message}`);
      errors.push({ supplier, error: error.message, items: items.map(i => i.sku) });
    }
  }

  // Store order record
  const orderRecord = {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    source: order.source,
    customer: order.customer,
    shippingAddress: order.shippingAddress,
    supplierOrders,
    errors,
    status: errors.length === 0 ? 'processing' : 'partial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orderStore.set(order.orderId, orderRecord);

  // Queue for tracking sync
  if (CONFIG.processing.syncTracking && supplierOrders.length > 0) {
    pendingTracking.set(order.orderId, orderRecord);
  }

  console.log(`✅ Order #${order.orderNumber} processed with ${supplierOrders.length} supplier order(s)`);

  return {
    status: orderRecord.status,
    orderId: order.orderId,
    supplierOrders,
    errors
  };
}

// ============================================================================
// TRACKING SYNC
// ============================================================================

/**
 * Get tracking info from supplier
 */
async function getSupplierTracking(supplier, supplierOrderId) {
  switch (supplier) {
    case 'cjdropshipping':
      return await cjDropshipping.getTracking(supplierOrderId);
    case 'bigbuy':
      return await bigBuy.getTracking(supplierOrderId);
    default:
      throw new Error(`Unknown supplier: ${supplier}`);
  }
}

/**
 * Update Shopify order with fulfillment and tracking
 * Uses Shopify Admin REST API
 */
async function updateShopifyFulfillment(orderId, tracking, lineItemIds = []) {
  if (!CONFIG.storefronts.shopify.enabled) {
    throw new Error('Shopify not configured');
  }

  const shop = CONFIG.storefronts.shopify.shop;
  const token = CONFIG.storefronts.shopify.accessToken;

  // Step 1: Get fulfillment order ID
  const fulfillmentOrdersUrl = `https://${shop}/admin/api/2024-01/orders/${orderId}/fulfillment_orders.json`;
  const foResponse = await fetch(fulfillmentOrdersUrl, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!foResponse.ok) {
    const err = await foResponse.text();
    throw new Error(`Shopify fulfillment_orders failed: ${foResponse.status} - ${err}`);
  }

  const foData = await foResponse.json();
  const fulfillmentOrders = foData.fulfillment_orders || [];

  if (fulfillmentOrders.length === 0) {
    throw new Error(`No fulfillment orders found for order ${orderId}`);
  }

  // Use first open fulfillment order
  const fulfillmentOrder = fulfillmentOrders.find(fo => fo.status === 'open') || fulfillmentOrders[0];

  // Step 2: Create fulfillment with tracking
  const fulfillmentUrl = `https://${shop}/admin/api/2024-01/fulfillments.json`;
  const fulfillmentPayload = {
    fulfillment: {
      line_items_by_fulfillment_order: [{
        fulfillment_order_id: fulfillmentOrder.id,
        fulfillment_order_line_items: lineItemIds.length > 0
          ? lineItemIds.map(id => ({ id, quantity: 1 }))
          : fulfillmentOrder.line_items.map(li => ({ id: li.id, quantity: li.remaining_quantity }))
      }],
      tracking_info: {
        number: tracking.trackingNumber,
        company: tracking.carrier || 'Other',
        url: tracking.trackingUrl || null
      },
      notify_customer: true
    }
  };

  const fulfillResponse = await fetch(fulfillmentUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fulfillmentPayload)
  });

  if (!fulfillResponse.ok) {
    const err = await fulfillResponse.text();
    throw new Error(`Shopify fulfillment create failed: ${fulfillResponse.status} - ${err}`);
  }

  const result = await fulfillResponse.json();
  console.log(`  ✅ Shopify fulfillment #${result.fulfillment.id} created`);

  return result.fulfillment;
}

/**
 * Update WooCommerce order with tracking
 * Uses WooCommerce REST API + Shipment Tracking extension (if available)
 */
async function updateWooCommerceTracking(orderId, tracking) {
  if (!CONFIG.storefronts.woocommerce.enabled) {
    throw new Error('WooCommerce not configured');
  }

  const baseUrl = CONFIG.storefronts.woocommerce.url;
  const consumerKey = CONFIG.storefronts.woocommerce.consumerKey;
  const consumerSecret = CONFIG.storefronts.woocommerce.consumerSecret;

  // Basic auth
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  // Option 1: Try WooCommerce Shipment Tracking extension API
  const trackingUrl = `${baseUrl}/wp-json/wc-shipment-tracking/v3/orders/${orderId}/shipment-trackings`;
  const trackingPayload = {
    tracking_provider: tracking.carrier || 'Custom',
    tracking_number: tracking.trackingNumber,
    tracking_link: tracking.trackingUrl || '',
    date_shipped: new Date().toISOString().split('T')[0]
  };

  const trackingResponse = await fetch(trackingUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(trackingPayload)
  });

  if (trackingResponse.ok) {
    const result = await trackingResponse.json();
    console.log(`  ✅ WooCommerce shipment tracking added`);
    return result;
  }

  // Option 2: Fallback to order note + meta update
  console.log(`  ⚠️ Shipment Tracking plugin not available, using order notes`);

  // Add order note
  const noteUrl = `${baseUrl}/wp-json/wc/v3/orders/${orderId}/notes`;
  const notePayload = {
    note: `Tracking info: ${tracking.carrier || 'Carrier'} - ${tracking.trackingNumber}${tracking.trackingUrl ? ` (${tracking.trackingUrl})` : ''}`,
    customer_note: true
  };

  const noteResponse = await fetch(noteUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notePayload)
  });

  if (!noteResponse.ok) {
    const err = await noteResponse.text();
    throw new Error(`WooCommerce note failed: ${noteResponse.status} - ${err}`);
  }

  // Update order status to completed
  const orderUrl = `${baseUrl}/wp-json/wc/v3/orders/${orderId}`;
  const orderPayload = {
    status: 'completed',
    meta_data: [
      { key: '_tracking_number', value: tracking.trackingNumber },
      { key: '_tracking_carrier', value: tracking.carrier || 'Other' },
      { key: '_tracking_url', value: tracking.trackingUrl || '' }
    ]
  };

  const orderResponse = await fetch(orderUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderPayload)
  });

  if (!orderResponse.ok) {
    const err = await orderResponse.text();
    throw new Error(`WooCommerce order update failed: ${orderResponse.status} - ${err}`);
  }

  console.log(`  ✅ WooCommerce order updated with tracking meta`);
  return await orderResponse.json();
}

/**
 * Update storefront with tracking info
 */
async function updateStorefrontTracking(orderRecord, supplierOrder, tracking) {
  console.log(`🚚 Updating tracking for order #${orderRecord.orderNumber}...`);

  try {
    switch (orderRecord.source) {
      case 'shopify':
        await withRetry(() => updateShopifyFulfillment(
          orderRecord.orderId,
          tracking,
          supplierOrder.items
        ));
        break;

      case 'woocommerce':
        await withRetry(() => updateWooCommerceTracking(
          orderRecord.orderId,
          tracking
        ));
        break;

      default:
        console.log(`  ⚠️ Unknown storefront: ${orderRecord.source}`);
        return false;
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Failed to update tracking: ${error.message}`);
    return false;
  }
}

/**
 * Check and sync tracking for pending orders
 */
async function syncPendingTracking() {
  if (pendingTracking.size === 0) return;

  console.log(`\n🔄 Checking tracking for ${pendingTracking.size} pending orders...`);

  for (const [orderId, orderRecord] of pendingTracking.entries()) {
    let allTracked = true;

    for (const supplierOrder of orderRecord.supplierOrders) {
      if (supplierOrder.trackingNumber) continue; // Already have tracking

      try {
        const tracking = await getSupplierTracking(
          supplierOrder.supplier,
          supplierOrder.supplierOrderId
        );

        if (tracking?.trackingNumber) {
          supplierOrder.trackingNumber = tracking.trackingNumber;
          supplierOrder.carrier = tracking.carrier;
          supplierOrder.trackingStatus = tracking.status;
          supplierOrder.trackingEvents = tracking.events || [];

          await updateStorefrontTracking(orderRecord, supplierOrder, tracking);
          console.log(`✅ Tracking found for ${supplierOrder.supplier}: ${tracking.trackingNumber}`);
        } else {
          allTracked = false;
        }
      } catch (e) {
        console.log(`⚠️ Tracking check failed for ${supplierOrder.supplier}: ${e.message}`);
        allTracked = false;
      }
    }

    // Update order status
    if (allTracked && orderRecord.supplierOrders.length > 0) {
      orderRecord.status = 'shipped';
      orderRecord.updatedAt = new Date().toISOString();
      pendingTracking.delete(orderId);
      console.log(`✅ Order #${orderRecord.orderNumber} fully shipped`);
    }
  }
}

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

/**
 * Verify Shopify webhook signature
 */
function verifyShopifyWebhook(body, hmacHeader) {
  if (!CONFIG.webhookSecrets.shopify || !hmacHeader) return true; // Skip if not configured

  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', CONFIG.webhookSecrets.shopify)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmacHeader;
}

/**
 * Verify WooCommerce webhook signature
 */
function verifyWooCommerceWebhook(body, signature) {
  if (!CONFIG.webhookSecrets.woocommerce || !signature) return true;

  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', CONFIG.webhookSecrets.woocommerce)
    .update(body, 'utf8')
    .digest('base64');

  return hash === signature;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           Dropshipping Order Flow - Health Check                 ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  const checks = {
    cjdropshipping: false,
    bigbuy: false,
    shopify: false,
    woocommerce: false
  };

  // Check CJDropshipping
  if (CONFIG.suppliers.cjdropshipping.enabled) {
    try {
      const health = await cjDropshipping.healthCheck();
      checks.cjdropshipping = health.status === 'operational' || health.status === 'test_mode';
      const status = health.status === 'operational' ? '✅ OPERATIONAL' : '⚠️ TEST MODE';
      console.log(`║  CJDropshipping: ${status}`.padEnd(67) + '║');
    } catch (e) {
      console.log(`║  CJDropshipping: ❌ ${e.message.substring(0, 40)}`.padEnd(67) + '║');
    }
  } else {
    console.log('║  CJDropshipping: ⚪ Not configured (CJ_API_KEY)                  ║');
  }

  // Check BigBuy
  if (CONFIG.suppliers.bigbuy.enabled) {
    try {
      const health = await bigBuy.healthCheck();
      checks.bigbuy = health.status === 'operational' || health.status === 'test_mode';
      const status = health.status === 'operational' ? '✅ OPERATIONAL' : '⚠️ TEST MODE';
      console.log(`║  BigBuy: ${status}`.padEnd(67) + '║');
    } catch (e) {
      console.log(`║  BigBuy: ❌ ${e.message.substring(0, 46)}`.padEnd(67) + '║');
    }
  } else {
    console.log('║  BigBuy: ⚪ Not configured (BIGBUY_API_KEY)                      ║');
  }

  // Check Shopify
  if (CONFIG.storefronts.shopify.enabled) {
    const shopName = CONFIG.storefronts.shopify.shop || '(shop domain not set)';
    console.log(`║  Shopify: ✅ ${shopName}`.padEnd(67) + '║');
    checks.shopify = true;
  } else {
    console.log('║  Shopify: ⚪ Not configured (SHOPIFY_ACCESS_TOKEN)               ║');
  }

  // Check WooCommerce
  if (CONFIG.storefronts.woocommerce.enabled) {
    console.log(`║  WooCommerce: ✅ ${(CONFIG.storefronts.woocommerce.url || '').substring(0, 40)}`.padEnd(67) + '║');
    checks.woocommerce = true;
  } else {
    console.log('║  WooCommerce: ⚪ Not configured (WOO_CONSUMER_KEY)               ║');
  }

  console.log('╠══════════════════════════════════════════════════════════════════╣');

  // Status summary
  const suppliersOk = checks.cjdropshipping || checks.bigbuy;
  const storefrontsOk = checks.shopify || checks.woocommerce;

  console.log(`║  Pending orders: ${orderStore.size}`.padEnd(67) + '║');
  console.log(`║  Pending tracking: ${pendingTracking.size}`.padEnd(67) + '║');
  console.log(`║  Auto-fulfill: ${CONFIG.processing.autoFulfill ? 'ON' : 'OFF'}`.padEnd(67) + '║');
  console.log(`║  Tracking sync: ${CONFIG.processing.syncTracking ? 'ON' : 'OFF'}`.padEnd(67) + '║');

  console.log('╠══════════════════════════════════════════════════════════════════╣');

  let status = 'blocked';
  if (suppliersOk && storefrontsOk) {
    status = 'operational';
    console.log('║  Status: ✅ OPERATIONAL                                          ║');
  } else if (suppliersOk || storefrontsOk) {
    status = 'partial';
    console.log('║  Status: ⚠️ PARTIAL (missing suppliers or storefronts)           ║');
  } else {
    console.log('║  Status: ⚪ TEST MODE (no credentials configured)                ║');
    status = 'test_mode';
  }

  console.log('╚══════════════════════════════════════════════════════════════════╝');

  return { status, checks, pendingOrders: orderStore.size, pendingTracking: pendingTracking.size };
}

// ============================================================================
// HTTP SERVER
// ============================================================================

async function startServer() {
  const http = require('http');

  // Start tracking sync interval
  if (CONFIG.processing.syncTracking) {
    setInterval(syncPendingTracking, CONFIG.processing.trackingCheckInterval);
    console.log(`🔄 Tracking sync scheduled every ${CONFIG.processing.trackingCheckInterval / 3600000}h`);
  }

  // CORS whitelist (storefronts + admin)
  const CORS_WHITELIST = [
    'https://3a-automation.com',
    'https://dashboard.3a-automation.com',
    process.env.SHOPIFY_SHOP_DOMAIN ? `https://${process.env.SHOPIFY_SHOP_DOMAIN}` : null,
    process.env.WOO_STORE_URL || null,
    'http://localhost:3000',  // Dev
    'http://localhost:3022'   // Dev
  ].filter(Boolean);

  const server = http.createServer(async (req, res) => {
    // CORS with whitelist
    const origin = req.headers.origin;
    if (origin && CORS_WHITELIST.some(allowed => origin.startsWith(allowed))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Hmac-SHA256, X-WC-Webhook-Signature');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${CONFIG.port}`);
    const path = url.pathname;

    // Parse body for POST requests
    let body = '';
    if (req.method === 'POST') {
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1e6) { // 1MB limit
          res.writeHead(413);
          res.end(JSON.stringify({ error: 'Payload too large' }));
          return;
        }
      }
    }

    try {
      let result;

      switch (path) {
        case '/health':
          result = await healthCheck();
          break;

        case '/webhook/shopify':
          if (req.method !== 'POST') {
            res.writeHead(405);
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          // Verify webhook
          const shopifyHmac = req.headers['x-shopify-hmac-sha256'];
          if (!verifyShopifyWebhook(body, shopifyHmac)) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Invalid webhook signature' }));
            return;
          }

          const shopifyPayload = safeJsonParse(body);
          if (!shopifyPayload) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }

          const shopifyOrder = parseShopifyOrder(shopifyPayload);
          result = await processOrder(shopifyOrder);
          break;

        case '/webhook/woocommerce':
          if (req.method !== 'POST') {
            res.writeHead(405);
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          // Verify webhook
          const wooSignature = req.headers['x-wc-webhook-signature'];
          if (!verifyWooCommerceWebhook(body, wooSignature)) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Invalid webhook signature' }));
            return;
          }

          const wooPayload = safeJsonParse(body);
          if (!wooPayload) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }

          const wooOrder = parseWooCommerceOrder(wooPayload);
          result = await processOrder(wooOrder);
          break;

        case '/orders':
          result = {
            total: orderStore.size,
            orders: Array.from(orderStore.values()).slice(-50) // Last 50
          };
          break;

        case '/orders/pending':
          result = {
            total: pendingTracking.size,
            orders: Array.from(pendingTracking.values())
          };
          break;

        case '/sync-tracking':
          await syncPendingTracking();
          result = { synced: true, pending: pendingTracking.size };
          break;

        case '/test':
          // Test order processing with sample data
          if (req.method !== 'POST') {
            res.writeHead(405);
            res.end(JSON.stringify({ error: 'POST required with test order JSON' }));
            return;
          }

          const testPayload = safeJsonParse(body);
          if (!testPayload) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }

          const source = testPayload.source || 'shopify';
          const testOrder = source === 'woocommerce'
            ? parseWooCommerceOrder(testPayload)
            : parseShopifyOrder(testPayload);

          result = await processOrder(testOrder);
          break;

        default:
          // Handle /order/:id
          const orderMatch = path.match(/^\/order\/(.+)$/);
          if (orderMatch) {
            const orderId = orderMatch[1];
            const order = orderStore.get(orderId);
            if (order) {
              result = order;
            } else {
              res.writeHead(404);
              res.end(JSON.stringify({ error: 'Order not found' }));
              return;
            }
            break;
          }

          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`❌ Server error: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(CONFIG.port, () => {
    console.log(`\n🚀 Dropshipping Order Flow running on port ${CONFIG.port}`);
    console.log(`\n   Endpoints:`);
    console.log(`   Health:             GET  http://localhost:${CONFIG.port}/health`);
    console.log(`   Shopify Webhook:    POST http://localhost:${CONFIG.port}/webhook/shopify`);
    console.log(`   WooCommerce Webhook: POST http://localhost:${CONFIG.port}/webhook/woocommerce`);
    console.log(`   List Orders:        GET  http://localhost:${CONFIG.port}/orders`);
    console.log(`   Pending Tracking:   GET  http://localhost:${CONFIG.port}/orders/pending`);
    console.log(`   Order Details:      GET  http://localhost:${CONFIG.port}/order/:id`);
    console.log(`   Sync Tracking:      GET  http://localhost:${CONFIG.port}/sync-tracking`);
    console.log(`   Test Order:         POST http://localhost:${CONFIG.port}/test`);
    console.log();
  });

  return server;
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
Dropshipping Order Flow v1.0.0

Orchestrates order routing between storefronts and suppliers.

Usage:
  node dropshipping-order-flow.cjs [options]

Options:
  --health              Check API connectivity
  --server              Start HTTP server (port ${CONFIG.port})
  --sync-tracking       Manually sync tracking for pending orders
  --list-orders         List processed orders
  --order=ID            Get order details
  --test                Process a test order from stdin
  --list-pending        List HITL pending orders awaiting approval
  --approve=ID          Approve HITL pending order
  --reject=ID           Reject HITL pending order
  --help                Show this help

HITL (Human In The Loop):
  Orders >= €${HITL_CONFIG.orderValueThreshold} require manual approval.
  ENV: HITL_ORDER_VALUE_THRESHOLD (default: 500)
  ENV: HITL_SLACK_WEBHOOK (Slack notifications)
  ENV: HITL_DROPSHIP_ENABLED (default: true)

Environment:
  # Storefronts
  SHOPIFY_ACCESS_TOKEN      Shopify Admin API token
  SHOPIFY_SHOP_DOMAIN       Shop domain (e.g., store.myshopify.com)
  SHOPIFY_WEBHOOK_SECRET    Webhook HMAC secret (optional)

  WOO_STORE_URL             WooCommerce store URL
  WOO_CONSUMER_KEY          WooCommerce API key
  WOO_CONSUMER_SECRET       WooCommerce API secret
  WOO_WEBHOOK_SECRET        Webhook secret (optional)

  # Suppliers
  CJ_API_KEY                CJDropshipping API key
  BIGBUY_API_KEY            BigBuy API key
  BIGBUY_SANDBOX            Set to 'true' for sandbox mode

  # Configuration
  DEFAULT_SUPPLIER          Default supplier (cjdropshipping|bigbuy)
  AUTO_FULFILL              Auto-fulfill orders (default: true)
  SYNC_TRACKING             Sync tracking to storefront (default: true)
  DROPSHIP_PORT             Server port (default: 3022)

SKU Routing:
  CJDropshipping: SKUs starting with CJ-, CJD-, CJDS-
  BigBuy:         SKUs starting with BB-, BIG-, BIGBUY-
  Other SKUs:     Routed to DEFAULT_SUPPLIER

Examples:
  node dropshipping-order-flow.cjs --health
  node dropshipping-order-flow.cjs --server
  node dropshipping-order-flow.cjs --sync-tracking
`);
    return;
  }

  if (args.includes('--server')) {
    return startServer();
  }

  // HITL Commands
  if (args.includes('--list-pending')) {
    return listPendingOrders();
  }

  const approveArg = args.find(a => a.startsWith('--approve='));
  if (approveArg) {
    const hitlId = approveArg.split('=')[1];
    return approveOrder(hitlId);
  }

  const rejectArg = args.find(a => a.startsWith('--reject='));
  if (rejectArg) {
    const hitlId = rejectArg.split('=')[1];
    const reasonArg = args.find(a => a.startsWith('--reason='));
    const reason = reasonArg ? reasonArg.split('=')[1] : 'Rejected by operator';
    return rejectOrder(hitlId, reason);
  }

  if (args.includes('--sync-tracking')) {
    await syncPendingTracking();
    return { synced: true, pending: pendingTracking.size };
  }

  if (args.includes('--list-orders')) {
    const orders = Array.from(orderStore.values());
    console.log(`📋 Processed Orders (${orders.length}):\n`);
    orders.forEach(o => {
      console.log(`  • #${o.orderNumber} [${o.source}] - ${o.status}`);
      console.log(`    Suppliers: ${o.supplierOrders.map(s => s.supplier).join(', ')}`);
    });
    return orders;
  }

  const orderArg = args.find(a => a.startsWith('--order='));
  if (orderArg) {
    const orderId = orderArg.split('=')[1];
    const order = orderStore.get(orderId);
    if (order) {
      console.log(JSON.stringify(order, null, 2));
      return order;
    } else {
      console.log(`❌ Order ${orderId} not found`);
      return null;
    }
  }

  if (args.includes('--test')) {
    // Read test order from stdin
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin });

    let input = '';
    for await (const line of rl) {
      input += line;
    }

    const testOrder = safeJsonParse(input);
    if (!testOrder) {
      console.log('❌ Invalid JSON input');
      return;
    }

    const parsed = testOrder.source === 'woocommerce'
      ? parseWooCommerceOrder(testOrder)
      : parseShopifyOrder(testOrder);

    return processOrder(parsed);
  }

  // Default: health check
  return healthCheck();
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Order processing
  processOrder,
  processOrderInternal,
  parseShopifyOrder,
  parseWooCommerceOrder,

  // Routing
  routeToSupplier,
  groupItemsBySupplier,

  // Supplier orders
  createCJOrder,
  createBigBuyOrder,

  // Tracking
  getSupplierTracking,
  syncPendingTracking,

  // HITL
  listPendingOrders,
  approveOrder,
  rejectOrder,
  HITL_CONFIG,

  // Utilities
  healthCheck,
  startServer
};

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}
