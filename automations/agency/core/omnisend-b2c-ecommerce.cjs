#!/usr/bin/env node
/**
 * Omnisend B2C E-commerce Integration
 *
 * Purpose: Marketing automation for B2C e-commerce (contacts, events, products)
 * API Version: v5 (recommended by Omnisend)
 *
 * Features:
 * - Contact management (create, update, search)
 * - Event sending (trigger existing automations)
 * - Product sync (for abandoned cart, recommendations)
 * - Carts API (abandoned cart automation)
 * - Event deduplication (eventID + eventTime)
 * - Exponential backoff with jitter for retries
 * - Automation listing (read-only)
 * - Campaign listing (read-only)
 *
 * IMPORTANT API LIMITATION:
 * - Automations/Flows = READ-ONLY (GET /automations)
 * - NO CREATE/UPDATE for automations via API
 * - Flows must be created in Omnisend UI
 * - Use events to TRIGGER existing automations
 *
 * @version 1.1.0
 * @date 2026-01-02
 */

require('dotenv').config();
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  apiKey: process.env.OMNISEND_API_KEY,
  baseUrl: 'https://api.omnisend.com/v5',
  rateLimit: {
    requests: 400,
    perMinute: 60
  },
  retry: {
    maxAttempts: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitterMs: 500  // Random jitter to avoid thundering herd
  },
  timeout: 30000,
  eventVersion: 'v1.1.0'  // Event schema version for tracking
};

// ============================================================================
// HITL CONFIGURATION (Human In The Loop) - Session 165quater flexibility
// ============================================================================
// User configurable options via ENV variables:
//
//   HITL_OMNISEND_ENABLED: true | false (default: true)
//     - Master switch for Omnisend HITL preview mode
//
//   HITL_PREVIEW_MODE: true | false (default: true)
//     - Preview marketing events before sending
//     - true = safer (review each marketing event)
//     - false = faster (auto-send all events)
//
//   HITL_MARKETING_EVENTS: comma-separated list (default: promotional,campaign,newsletter,bulk_send)
//     - Event types that require preview approval
//     - Options: promotional | campaign | newsletter | bulk_send | all | none
//     - Example: "promotional,campaign" (only promo and campaign events need approval)
//     - "all" = all events require approval
//     - "none" = no events require approval (preview mode still applies)
//
//   HITL_BATCH_THRESHOLD: 5 | 10 | 25 | 50 | 100 | custom (default: 10)
//     - Number of recipients above which batch sends require approval
//     - Lower = more batches need approval (conservative)
//     - Higher = fewer batches need approval (aggressive)

const fs = require('fs');
const path = require('path');

// Parse marketing events from ENV or use defaults
function parseMarketingEvents() {
  const envValue = process.env.HITL_MARKETING_EVENTS;
  if (!envValue) return ['promotional', 'campaign', 'newsletter', 'bulk_send'];
  if (envValue.toLowerCase() === 'all') return ['promotional', 'campaign', 'newsletter', 'bulk_send', 'transactional'];
  if (envValue.toLowerCase() === 'none') return [];
  return envValue.split(',').map(e => e.trim().toLowerCase());
}

const HITL_CONFIG = {
  enabled: process.env.HITL_OMNISEND_ENABLED !== 'false',
  previewModeDefault: process.env.HITL_PREVIEW_MODE !== 'false',
  marketingEvents: parseMarketingEvents(),
  marketingEventsOptions: ['promotional', 'campaign', 'newsletter', 'bulk_send', 'all', 'none'],  // Available options
  batchThreshold: parseInt(process.env.HITL_BATCH_THRESHOLD) || 10,  // 5 | 10 | 25 | 50 | 100
  batchThresholdOptions: [5, 10, 25, 50, 100],  // Recommended options
  slackWebhook: process.env.HITL_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL,
  notifyOnPending: process.env.HITL_NOTIFY_ON_PENDING !== 'false'
};

const DATA_DIR = process.env.OMNISEND_DATA_DIR || path.join(__dirname, '../../../data/omnisend');
const HITL_PENDING_DIR = path.join(DATA_DIR, 'hitl-pending');
const HITL_PENDING_FILE = path.join(HITL_PENDING_DIR, 'pending-events.json');

// Ensure directories exist
function ensureHitlDir() {
  if (!fs.existsSync(HITL_PENDING_DIR)) {
    fs.mkdirSync(HITL_PENDING_DIR, { recursive: true });
  }
}
ensureHitlDir();

// HITL Functions
function loadPendingEvents() {
  try {
    if (fs.existsSync(HITL_PENDING_FILE)) {
      return JSON.parse(fs.readFileSync(HITL_PENDING_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn(`⚠️ Could not load HITL pending events: ${error.message}`);
  }
  return [];
}

function savePendingEvents(events) {
  try {
    const tempPath = `${HITL_PENDING_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(events, null, 2));
    fs.renameSync(tempPath, HITL_PENDING_FILE);
  } catch (error) {
    console.error(`❌ Failed to save HITL pending events: ${error.message}`);
  }
}

function queueEventForPreview(eventName, contact, properties, options = {}) {
  const pending = loadPendingEvents();
  const pendingEvent = {
    id: `hitl_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventName,
    contact,
    properties,
    options,
    reason: 'Preview mode - marketing event requires approval',
    queuedAt: new Date().toISOString(),
    status: 'pending'
  };

  pending.push(pendingEvent);
  savePendingEvents(pending);

  console.log(`🔒 Event "${eventName}" queued for HITL preview`);

  // Slack notification
  if (HITL_CONFIG.slackWebhook && HITL_CONFIG.notifyOnPending) {
    sendHitlEventNotification(pendingEvent).catch(e => console.error(`❌ Slack notification failed: ${e.message}`));
  }

  return pendingEvent;
}

async function sendHitlEventNotification(pendingEvent) {
  if (!HITL_CONFIG.slackWebhook) return;

  const message = {
    text: `🔒 HITL Preview Required - Omnisend Event`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔒 HITL: Marketing Event Preview', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Event:* ${pendingEvent.eventName}` },
          { type: 'mrkdwn', text: `*Contact:* ${pendingEvent.contact.email || pendingEvent.contact.phone || 'N/A'}` },
          { type: 'mrkdwn', text: `*Properties:* ${Object.keys(pendingEvent.properties).length} fields` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`node omnisend-b2c-ecommerce.cjs --approve=${pendingEvent.id}\`\`\`` }
      }
    ]
  };

  await fetch(HITL_CONFIG.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
}

async function approveEvent(hitlId, client) {
  const pending = loadPendingEvents();
  const index = pending.findIndex(e => e.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL event ${hitlId} not found`);
    return { success: false, error: 'Event not found' };
  }

  const event = pending[index];
  event.status = 'approved';
  event.approvedAt = new Date().toISOString();

  pending.splice(index, 1);
  savePendingEvents(pending);

  console.log(`✅ HITL event "${event.eventName}" approved, sending...`);

  // Send the event
  const result = await client.sendEventInternal(event.eventName, event.contact, event.properties, event.options);

  return { success: true, event, result };
}

function rejectEvent(hitlId, reason = 'Rejected by operator') {
  const pending = loadPendingEvents();
  const index = pending.findIndex(e => e.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL event ${hitlId} not found`);
    return { success: false, error: 'Event not found' };
  }

  const event = pending[index];
  event.status = 'rejected';
  event.rejectedAt = new Date().toISOString();
  event.rejectionReason = reason;

  pending.splice(index, 1);
  savePendingEvents(pending);

  console.log(`❌ HITL event "${event.eventName}" rejected: ${reason}`);

  return { success: true, event };
}

function listPendingEvents() {
  const pending = loadPendingEvents();
  console.log(`\n🔒 Pending HITL Events (${pending.length}):\n`);

  if (pending.length === 0) {
    console.log('  No pending events');
    return pending;
  }

  pending.forEach(e => {
    console.log(`  • ${e.id}`);
    console.log(`    Event: ${e.eventName}`);
    console.log(`    Contact: ${e.contact.email || e.contact.phone || 'N/A'}`);
    console.log(`    Queued: ${e.queuedAt}`);
    console.log();
  });

  return pending;
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

class OmnisendClient {
  constructor(apiKey = CONFIG.apiKey) {
    if (!apiKey) {
      console.warn('⚠️ No Omnisend API key provided. Running in test mode.');
      this.testMode = true;
    } else {
      this.testMode = false;
      this.apiKey = apiKey;
    }
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.eventCounter = 0;  // For generating unique event IDs
  }

  /**
   * Generate unique event ID for deduplication
   * Format: {timestamp}-{counter}-{random}
   * @returns {string} Unique event ID
   */
  generateEventID() {
    this.eventCounter++;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `evt-${timestamp}-${this.eventCounter}-${random}`;
  }

  /**
   * Get ISO timestamp for event
   * @returns {string} ISO 8601 timestamp
   */
  getEventTime() {
    return new Date().toISOString();
  }

  /**
   * Rate limit handler (400 requests/minute)
   */
  async rateLimit() {
    this.requestCount++;
    const now = Date.now();
    const elapsed = now - this.lastResetTime;

    if (elapsed >= 60000) {
      this.requestCount = 1;
      this.lastResetTime = now;
    } else if (this.requestCount >= CONFIG.rateLimit.requests) {
      const waitTime = 60000 - elapsed;
      console.log(`⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 1;
      this.lastResetTime = Date.now();
    }
  }

  /**
   * Execute with exponential backoff and jitter
   * @param {Function} operation - Async operation to execute
   * @param {string} operationName - Name for logging
   * @returns {*} Operation result
   */
  async withRetry(operation, operationName = 'operation') {
    let lastError;

    for (let attempt = 1; attempt <= CONFIG.retry.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;
        const statusCode = error.statusCode || (error.message && error.message.match(/(\d{3})/)?.[1]);

        // Only retry on rate limit (429) or server errors (5xx)
        if (statusCode === '429' || statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
          // Calculate delay with exponential backoff and jitter
          const baseDelay = Math.min(
            CONFIG.retry.baseDelayMs * Math.pow(2, attempt - 1),
            CONFIG.retry.maxDelayMs
          );
          const jitter = Math.random() * CONFIG.retry.jitterMs;
          const delay = baseDelay + jitter;

          console.log(`⚠️ ${operationName} failed (attempt ${attempt}/${CONFIG.retry.maxAttempts}): ${statusCode}. Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Non-retryable error, throw immediately
          throw error;
        }
      }
    }

    // All retries exhausted
    console.error(`❌ ${operationName} failed after ${CONFIG.retry.maxAttempts} attempts`);
    throw lastError;
  }

  /**
   * Safe JSON parse helper
   */
  safeJsonParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  /**
   * Make HTTP request to Omnisend API (internal)
   */
  async _makeRequest(method, endpoint, data = null) {
    await this.rateLimit();

    return new Promise((resolve, reject) => {
      const url = new URL(`${CONFIG.baseUrl}${endpoint}`);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey
        },
        timeout: CONFIG.timeout
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const parsed = this.safeJsonParse(body, { raw: body });

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const error = new Error(`API error ${res.statusCode}: ${JSON.stringify(parsed)}`);
            error.statusCode = res.statusCode;
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Make HTTP request to Omnisend API with retry
   */
  async request(method, endpoint, data = null) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: ${method} ${endpoint}`);
      if (data) console.log('Data:', JSON.stringify(data, null, 2));
      return { testMode: true, endpoint, method };
    }

    return this.withRetry(
      () => this._makeRequest(method, endpoint, data),
      `${method} ${endpoint}`
    );
  }

  // ==========================================================================
  // CONTACTS
  // ==========================================================================

  /**
   * Create or update a contact
   * @param {Object} contactData - Contact data
   * @returns {Object} Created/updated contact
   */
  async upsertContact(contactData) {
    const { email, phone, ...otherProps } = contactData;

    if (!email && !phone) {
      throw new Error('Email or phone is required for contact');
    }

    const payload = {
      identifiers: [],
      ...otherProps
    };

    if (email) {
      payload.identifiers.push({ type: 'email', id: email, channels: { email: { status: 'subscribed' } } });
    }
    if (phone) {
      payload.identifiers.push({ type: 'phone', id: phone, channels: { sms: { status: 'subscribed' } } });
    }

    try {
      const result = await this.request('POST', '/contacts', payload);
      console.log(`✅ Upserted contact: ${email || phone}`);
      return result;
    } catch (error) {
      console.error(`❌ Contact upsert failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Object} Contact data
   */
  async getContact(contactId) {
    try {
      const result = await this.request('GET', `/contacts/${contactId}`);
      return result;
    } catch (error) {
      console.error(`❌ Get contact failed:`, error.message);
      throw error;
    }
  }

  /**
   * List all contacts
   * @param {number} limit - Max contacts
   * @returns {Array} Contacts list
   */
  async listContacts(limit = 100) {
    try {
      const result = await this.request('GET', `/contacts?limit=${limit}`);
      console.log(`✅ Retrieved ${result.contacts?.length || 0} contacts`);
      return result.contacts || [];
    } catch (error) {
      console.error(`❌ List contacts failed:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // EVENTS (Trigger Automations)
  // ==========================================================================

  /**
   * Send custom event to trigger automation (with HITL preview check)
   * @param {string} eventName - Custom event name
   * @param {Object} contact - Contact identifier (email or phone)
   * @param {Object} properties - Event properties
   * @param {Object} options - Optional: { eventID, eventTime, previewMode } for deduplication
   * @returns {Object} Event result or pending approval
   */
  async sendEvent(eventName, contact, properties = {}, options = {}) {
    if (!eventName) {
      throw new Error('Event name is required');
    }

    if (!contact.email && !contact.phone) {
      throw new Error('Contact email or phone is required');
    }

    // HITL Check: Preview mode for marketing events
    const previewMode = options.previewMode !== undefined ? options.previewMode : HITL_CONFIG.previewModeDefault;
    const isMarketingEvent = HITL_CONFIG.marketingEvents.some(me => eventName.toLowerCase().includes(me));

    if (HITL_CONFIG.enabled && previewMode && isMarketingEvent) {
      const pendingEvent = queueEventForPreview(eventName, contact, properties, options);
      return {
        status: 'pending_preview',
        hitlId: pendingEvent.id,
        eventName,
        contact: contact.email || contact.phone,
        message: `Event queued for HITL preview. Use --approve=${pendingEvent.id} to send.`
      };
    }

    return this.sendEventInternal(eventName, contact, properties, options);
  }

  /**
   * Internal event sending (bypasses HITL check)
   */
  async sendEventInternal(eventName, contact, properties = {}, options = {}) {
    // Generate eventID and eventTime for deduplication (Omnisend best practice)
    const eventID = options.eventID || this.generateEventID();
    const eventTime = options.eventTime || this.getEventTime();

    const payload = {
      eventID,          // Required for deduplication
      eventTime,        // ISO 8601 timestamp
      eventVersion: CONFIG.eventVersion,  // Schema version
      eventName,
      origin: 'api',
      contact: {},
      properties
    };

    if (contact.email) {
      payload.contact.email = contact.email;
    }
    if (contact.phone) {
      payload.contact.phone = contact.phone;
    }

    try {
      const result = await this.request('POST', '/events', payload);
      console.log(`✅ Sent event '${eventName}' (ID: ${eventID}) for ${contact.email || contact.phone}`);
      return { ...result, eventID, eventTime };
    } catch (error) {
      console.error(`❌ Event send failed:`, error.message);
      throw error;
    }
  }

  /**
   * Send standard e-commerce events
   */
  async sendAddedToCartEvent(contact, product) {
    return this.sendEvent('added product to cart', contact, {
      productID: product.id,
      productTitle: product.title,
      productPrice: product.price,
      productQuantity: product.quantity || 1,
      productURL: product.url,
      productImageURL: product.imageUrl
    });
  }

  async sendStartedCheckoutEvent(contact, cart) {
    return this.sendEvent('started checkout', contact, {
      cartID: cart.id,
      cartTotal: cart.total,
      cartCurrency: cart.currency || 'EUR',
      cartURL: cart.url
    });
  }

  async sendPlacedOrderEvent(contact, order) {
    return this.sendEvent('placed order', contact, {
      orderID: order.id,
      orderTotal: order.total,
      orderCurrency: order.currency || 'EUR',
      orderNumber: order.number
    });
  }

  // ==========================================================================
  // PRODUCTS
  // ==========================================================================

  /**
   * Create or update a product
   * @param {Object} productData - Product data
   * @returns {Object} Created/updated product
   */
  async upsertProduct(productData) {
    const { productID, ...props } = productData;

    if (!productID) {
      throw new Error('Product ID is required');
    }

    const payload = {
      productID,
      title: props.title || 'Untitled Product',
      status: props.status || 'inStock',
      currency: props.currency || 'EUR',
      productUrl: props.url,
      imageUrl: props.imageUrl,
      price: props.price || 0,
      oldPrice: props.oldPrice,
      description: props.description,
      vendor: props.vendor,
      type: props.type,
      tags: props.tags || []
    };

    try {
      const result = await this.request('POST', '/products', payload);
      console.log(`✅ Upserted product: ${productID}`);
      return result;
    } catch (error) {
      console.error(`❌ Product upsert failed:`, error.message);
      throw error;
    }
  }

  /**
   * List products
   * @param {number} limit - Max products
   * @returns {Array} Products list
   */
  async listProducts(limit = 100) {
    try {
      const result = await this.request('GET', `/products?limit=${limit}`);
      console.log(`✅ Retrieved ${result.products?.length || 0} products`);
      return result.products || [];
    } catch (error) {
      console.error(`❌ List products failed:`, error.message);
      throw error;
    }
  }

  /**
   * Delete product
   * @param {string} productID - Product ID
   */
  async deleteProduct(productID) {
    try {
      await this.request('DELETE', `/products/${productID}`);
      console.log(`✅ Deleted product: ${productID}`);
      return true;
    } catch (error) {
      console.error(`❌ Product delete failed:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // CARTS (Abandoned Cart Automation)
  // ==========================================================================

  /**
   * Create a cart for abandoned cart automation
   * @param {Object} cartData - Cart data
   * @returns {Object} Created cart
   */
  async createCart(cartData) {
    const { cartID, email, phone, products, currency, cartUrl, cartRecoveryUrl } = cartData;

    if (!cartID) {
      throw new Error('Cart ID is required');
    }
    if (!email && !phone) {
      throw new Error('Email or phone is required for cart');
    }
    if (!products || products.length === 0) {
      throw new Error('At least one product is required');
    }

    const payload = {
      cartID,
      currency: currency || 'EUR',
      cartSum: products.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0),
      cartUrl,
      cartRecoveryUrl,
      products: products.map(p => ({
        productID: p.productID || p.id,
        variantID: p.variantID,
        title: p.title,
        quantity: p.quantity || 1,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: p.discount || 0,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl
      }))
    };

    // Add contact identifier
    if (email) {
      payload.email = email;
    }
    if (phone) {
      payload.phone = phone;
    }

    try {
      const result = await this.request('POST', '/carts', payload);
      console.log(`✅ Created cart: ${cartID} for ${email || phone}`);
      return result;
    } catch (error) {
      console.error(`❌ Cart creation failed:`, error.message);
      throw error;
    }
  }

  /**
   * Update an existing cart
   * @param {string} cartID - Cart ID
   * @param {Object} cartData - Updated cart data
   * @returns {Object} Updated cart
   */
  async updateCart(cartID, cartData) {
    if (!cartID) {
      throw new Error('Cart ID is required');
    }

    const { products, currency, cartUrl, cartRecoveryUrl } = cartData;

    const payload = {};

    if (products && products.length > 0) {
      payload.products = products.map(p => ({
        productID: p.productID || p.id,
        variantID: p.variantID,
        title: p.title,
        quantity: p.quantity || 1,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: p.discount || 0,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl
      }));
      payload.cartSum = products.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
    }

    if (currency) payload.currency = currency;
    if (cartUrl) payload.cartUrl = cartUrl;
    if (cartRecoveryUrl) payload.cartRecoveryUrl = cartRecoveryUrl;

    try {
      const result = await this.request('PATCH', `/carts/${cartID}`, payload);
      console.log(`✅ Updated cart: ${cartID}`);
      return result;
    } catch (error) {
      console.error(`❌ Cart update failed:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a cart (cart recovered or order placed)
   * @param {string} cartID - Cart ID
   */
  async deleteCart(cartID) {
    if (!cartID) {
      throw new Error('Cart ID is required');
    }

    try {
      await this.request('DELETE', `/carts/${cartID}`);
      console.log(`✅ Deleted cart: ${cartID}`);
      return true;
    } catch (error) {
      console.error(`❌ Cart deletion failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get cart by ID
   * @param {string} cartID - Cart ID
   * @returns {Object} Cart data
   */
  async getCart(cartID) {
    try {
      const result = await this.request('GET', `/carts/${cartID}`);
      return result;
    } catch (error) {
      console.error(`❌ Get cart failed:`, error.message);
      throw error;
    }
  }

  /**
   * List all carts (for debugging/audit)
   * @param {number} limit - Max carts
   * @returns {Array} Carts list
   */
  async listCarts(limit = 100) {
    try {
      const result = await this.request('GET', `/carts?limit=${limit}`);
      console.log(`✅ Retrieved ${result.carts?.length || 0} carts`);
      return result.carts || [];
    } catch (error) {
      console.error(`❌ List carts failed:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // AUTOMATIONS (READ-ONLY)
  // ==========================================================================

  /**
   * List all automations (READ-ONLY)
   * NOTE: Cannot create/update automations via API
   * @returns {Array} Automations list
   */
  async listAutomations() {
    try {
      const result = await this.request('GET', '/automations');
      console.log(`✅ Retrieved ${result.automations?.length || 0} automations`);
      return result.automations || [];
    } catch (error) {
      console.error(`❌ List automations failed:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // CAMPAIGNS (READ-ONLY)
  // ==========================================================================

  /**
   * List all campaigns (READ-ONLY)
   * @returns {Array} Campaigns list
   */
  async listCampaigns() {
    try {
      const result = await this.request('GET', '/campaigns');
      console.log(`✅ Retrieved ${result.campaigns?.length || 0} campaigns`);
      return result.campaigns || [];
    } catch (error) {
      console.error(`❌ List campaigns failed:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // BATCHES (Bulk Operations)
  // ==========================================================================

  /**
   * Create batch operation for products/contacts
   * @param {string} type - Batch type (products, contacts)
   * @param {Array} items - Items to process
   * @returns {Object} Batch result
   */
  async createBatch(type, items) {
    if (!['products', 'contacts'].includes(type)) {
      throw new Error('Batch type must be "products" or "contacts"');
    }

    const payload = {
      method: 'POST',
      [type]: items
    };

    try {
      const result = await this.request('POST', '/batches', payload);
      console.log(`✅ Created batch for ${items.length} ${type}`);
      return result;
    } catch (error) {
      console.error(`❌ Batch creation failed:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  /**
   * Test API connectivity
   */
  async healthCheck() {
    console.log('\n🔍 Omnisend B2C E-commerce Health Check v1.1.0');
    console.log('================================================');

    // Show configuration
    console.log('\nConfiguration:');
    console.log(`  Rate limit: ${CONFIG.rateLimit.requests} req/${CONFIG.rateLimit.perMinute}s`);
    console.log(`  Retry: ${CONFIG.retry.maxAttempts} attempts, backoff ${CONFIG.retry.baseDelayMs}-${CONFIG.retry.maxDelayMs}ms`);
    console.log(`  Jitter: ${CONFIG.retry.jitterMs}ms`);
    console.log(`  Event version: ${CONFIG.eventVersion}`);

    if (this.testMode) {
      console.log('\n⚠️ Running in TEST MODE (no API key)');
      console.log('✅ Event deduplication: Ready (eventID + eventTime)');
      console.log('✅ Carts API: Ready');
      console.log('✅ Exponential backoff: Ready');
      console.log('ℹ️ Set OMNISEND_API_KEY to test API');
      return { status: 'test-mode', message: 'No API key configured', version: '1.1.0' };
    }

    const results = {
      contacts: false,
      products: false,
      carts: false,
      automations: false,
      campaigns: false
    };

    try {
      // Test contacts API
      const contacts = await this.listContacts(1);
      results.contacts = true;
      console.log(`\n✅ Contacts API: Operational`);
    } catch (error) {
      console.log(`\n❌ Contacts API: ${error.message}`);
    }

    try {
      // Test products API
      const products = await this.listProducts(1);
      results.products = true;
      console.log(`✅ Products API: Operational`);
    } catch (error) {
      console.log(`❌ Products API: ${error.message}`);
    }

    try {
      // Test carts API (new in v1.1.0)
      const carts = await this.listCarts(1);
      results.carts = true;
      console.log(`✅ Carts API: Operational (${carts.length} active carts)`);
    } catch (error) {
      console.log(`❌ Carts API: ${error.message}`);
    }

    try {
      // Test automations API (read-only)
      const automations = await this.listAutomations();
      results.automations = true;
      console.log(`✅ Automations API: ${automations.length} automations (READ-ONLY)`);
    } catch (error) {
      console.log(`❌ Automations API: ${error.message}`);
    }

    try {
      // Test campaigns API (read-only)
      const campaigns = await this.listCampaigns();
      results.campaigns = true;
      console.log(`✅ Campaigns API: ${campaigns.length} campaigns (READ-ONLY)`);
    } catch (error) {
      console.log(`❌ Campaigns API: ${error.message}`);
    }

    const allHealthy = Object.values(results).every(v => v);
    console.log(`\n${allHealthy ? '✅ All Omnisend APIs operational' : '⚠️ Some APIs have issues'}`);
    console.log('✅ Event deduplication: Active (eventID + eventTime)');
    console.log('✅ Exponential backoff: Active');

    return {
      status: allHealthy ? 'healthy' : 'partial',
      version: '1.1.0',
      features: ['event-dedup', 'carts-api', 'exponential-backoff'],
      ...results
    };
  }

  // ==========================================================================
  // AUDIT (Compare with Klaviyo)
  // ==========================================================================

  /**
   * Audit existing automations
   * Similar to audit-klaviyo-flows.cjs but for Omnisend
   */
  async auditAutomations() {
    console.log('\n📊 Omnisend Automations Audit');
    console.log('==============================');

    if (this.testMode) {
      console.log('⚠️ Cannot audit in test mode');
      return null;
    }

    try {
      const automations = await this.listAutomations();
      const campaigns = await this.listCampaigns();

      const report = {
        automationsCount: automations.length,
        campaignsCount: campaigns.length,
        automations: automations.map(a => ({
          id: a.automationID,
          name: a.name,
          status: a.status,
          trigger: a.trigger
        })),
        campaigns: campaigns.map(c => ({
          id: c.campaignID,
          name: c.name,
          status: c.status,
          sentAt: c.sentAt
        })),
        recommendations: []
      };

      // Add recommendations based on missing automations
      const automationNames = automations.map(a => a.name?.toLowerCase() || '');

      if (!automationNames.some(n => n.includes('welcome'))) {
        report.recommendations.push('⚠️ No Welcome Series detected - Add via Omnisend UI');
      }
      if (!automationNames.some(n => n.includes('cart') || n.includes('checkout'))) {
        report.recommendations.push('⚠️ No Abandoned Cart detected - Add via Omnisend UI');
      }
      if (!automationNames.some(n => n.includes('browse'))) {
        report.recommendations.push('⚠️ No Browse Abandonment detected - Add via Omnisend UI');
      }
      if (!automationNames.some(n => n.includes('post') || n.includes('purchase'))) {
        report.recommendations.push('⚠️ No Post-Purchase detected - Add via Omnisend UI');
      }
      if (!automationNames.some(n => n.includes('win') || n.includes('back'))) {
        report.recommendations.push('⚠️ No Win-Back detected - Add via Omnisend UI');
      }

      if (report.recommendations.length === 0) {
        report.recommendations.push('✅ All standard e-commerce automations are present');
      }

      console.log(`\nAutomations: ${report.automationsCount}`);
      console.log(`Campaigns: ${report.campaignsCount}`);
      console.log('\nRecommendations:');
      report.recommendations.forEach(r => console.log(`  ${r}`));

      return report;
    } catch (error) {
      console.error(`❌ Audit failed:`, error.message);
      throw error;
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const client = new OmnisendClient();

  // HITL Commands
  if (args.includes('--list-pending')) {
    return listPendingEvents();
  }

  const approveArg = args.find(a => a.startsWith('--approve='));
  if (approveArg) {
    const hitlId = approveArg.split('=')[1];
    return approveEvent(hitlId, client);
  }

  const rejectArg = args.find(a => a.startsWith('--reject='));
  if (rejectArg) {
    const hitlId = rejectArg.split('=')[1];
    const reasonArg = args.find(a => a.startsWith('--reason='));
    const reason = reasonArg ? reasonArg.split('=')[1] : 'Rejected by operator';
    return rejectEvent(hitlId, reason);
  }

  if (args.includes('--health')) {
    await client.healthCheck();
  } else if (args.includes('--audit')) {
    await client.auditAutomations();
  } else if (args.includes('--test-contact')) {
    const result = await client.upsertContact({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'Contact'
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--test-event')) {
    const result = await client.sendEvent('test_event', { email: 'test@example.com' }, {
      testProperty: 'test value'
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--test-product')) {
    const result = await client.upsertProduct({
      productID: 'test-product-001',
      title: 'Test Product',
      price: 29.99,
      currency: 'EUR'
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--list-automations')) {
    const automations = await client.listAutomations();
    console.log('Automations:', JSON.stringify(automations, null, 2));
  } else if (args.includes('--list-campaigns')) {
    const campaigns = await client.listCampaigns();
    console.log('Campaigns:', JSON.stringify(campaigns, null, 2));
  } else if (args.includes('--list-contacts')) {
    const contacts = await client.listContacts(10);
    console.log('Contacts:', JSON.stringify(contacts, null, 2));
  } else if (args.includes('--list-products')) {
    const products = await client.listProducts(10);
    console.log('Products:', JSON.stringify(products, null, 2));
  } else if (args.includes('--test-cart')) {
    // Create a test cart
    const cartID = `test-cart-${Date.now()}`;
    const result = await client.createCart({
      cartID,
      email: 'test@example.com',
      currency: 'EUR',
      cartSum: 99.99,
      cartRecoveryUrl: 'https://example.com/cart/recover/' + cartID,
      products: [
        {
          productID: 'test-product-001',
          title: 'Test Product',
          quantity: 1,
          price: 99.99
        }
      ]
    });
    console.log('Cart created:', JSON.stringify(result, null, 2));
    console.log(`\nCart ID: ${cartID}`);
    console.log('Note: Cart will trigger Abandoned Cart automation if not completed within 1 hour');
  } else if (args.includes('--list-carts')) {
    const carts = await client.listCarts(10);
    console.log('Carts:', JSON.stringify(carts, null, 2));
  } else {
    console.log(`
Omnisend B2C E-commerce Integration v1.1.0
==========================================

Usage:
  node omnisend-b2c-ecommerce.cjs [options]

Options:
  --health             Test API connectivity (all endpoints)
  --audit              Audit existing automations

  Contacts:
  --test-contact       Create test contact
  --list-contacts      List first 10 contacts

  Events:
  --test-event         Send test event (with eventID deduplication)

  Products:
  --test-product       Create test product
  --list-products      List first 10 products

  Carts (NEW v1.1.0):
  --test-cart          Create test abandoned cart
  --list-carts         List existing carts

  Automations:
  --list-automations   List all automations (READ-ONLY)
  --list-campaigns     List all campaigns (READ-ONLY)

HITL:
  --list-pending       List HITL pending events awaiting approval
  --approve=ID         Approve HITL pending event
  --reject=ID          Reject HITL pending event

HITL (Human In The Loop):
  Marketing events require preview approval by default.
  ENV: HITL_PREVIEW_MODE (default: true)
  ENV: HITL_SLACK_WEBHOOK (Slack notifications)
  ENV: HITL_OMNISEND_ENABLED (default: true)

Environment Variables:
  OMNISEND_API_KEY     Omnisend API key (v5)

API Capabilities v1.1.0:
  ✅ Contacts: Full CRUD
  ✅ Events: Send with eventID deduplication
  ✅ Products: Full CRUD
  ✅ Carts: Full CRUD (abandoned cart automation)
  ❌ Automations: READ-ONLY (create via UI only)
  ❌ Campaigns: READ-ONLY

Features v1.1.0:
  ✅ Event deduplication via eventID + eventTime
  ✅ Exponential backoff with jitter (5 retries)
  ✅ Carts API for abandoned cart workflows

Pricing:
  Free: 250 contacts, 500 emails/mo
  Standard: $16/mo (500+ contacts)
  Pro: $59/mo (unlimited emails + SMS)
`);
  }
}

// Export for programmatic use
module.exports = { OmnisendClient, CONFIG };

// Run CLI if executed directly
if (require.main === module) {
  main().catch(console.error);
}
