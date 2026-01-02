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
 * - Automation listing (read-only)
 * - Campaign listing (read-only)
 *
 * IMPORTANT API LIMITATION:
 * - Automations/Flows = READ-ONLY (GET /automations)
 * - NO CREATE/UPDATE for automations via API
 * - Flows must be created in Omnisend UI
 * - Use events to TRIGGER existing automations
 *
 * @version 1.0.0
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
  timeout: 30000
};

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
   * Make HTTP request to Omnisend API
   */
  async request(method, endpoint, data = null) {
    if (this.testMode) {
      console.log(`🧪 TEST MODE: ${method} ${endpoint}`);
      if (data) console.log('Data:', JSON.stringify(data, null, 2));
      return { testMode: true, endpoint, method };
    }

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
            reject(new Error(`API error ${res.statusCode}: ${JSON.stringify(parsed)}`));
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
   * Send custom event to trigger automation
   * @param {string} eventName - Custom event name
   * @param {Object} contact - Contact identifier (email or phone)
   * @param {Object} properties - Event properties
   * @returns {Object} Event result
   */
  async sendEvent(eventName, contact, properties = {}) {
    if (!eventName) {
      throw new Error('Event name is required');
    }

    if (!contact.email && !contact.phone) {
      throw new Error('Contact email or phone is required');
    }

    const payload = {
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
      console.log(`✅ Sent event '${eventName}' for ${contact.email || contact.phone}`);
      return result;
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
    console.log('\n🔍 Omnisend B2C E-commerce Health Check');
    console.log('========================================');

    if (this.testMode) {
      console.log('⚠️ Running in TEST MODE (no API key)');
      console.log('ℹ️ Set OMNISEND_API_KEY to test API');
      return { status: 'test-mode', message: 'No API key configured' };
    }

    const results = {
      contacts: false,
      products: false,
      automations: false,
      campaigns: false
    };

    try {
      // Test contacts API
      const contacts = await this.listContacts(1);
      results.contacts = true;
      console.log(`✅ Contacts API: Operational`);
    } catch (error) {
      console.log(`❌ Contacts API: ${error.message}`);
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

    return {
      status: allHealthy ? 'healthy' : 'partial',
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
  } else {
    console.log(`
Omnisend B2C E-commerce Integration
====================================

Usage:
  node omnisend-b2c-ecommerce.cjs [options]

Options:
  --health             Test API connectivity
  --audit              Audit existing automations
  --test-contact       Create test contact
  --test-event         Send test event
  --test-product       Create test product
  --list-automations   List all automations (READ-ONLY)
  --list-campaigns     List all campaigns (READ-ONLY)
  --list-contacts      List first 10 contacts
  --list-products      List first 10 products

Environment Variables:
  OMNISEND_API_KEY     Omnisend API key (v5)

API Limitations (IMPORTANT):
  ✅ Contacts: Full CRUD
  ✅ Events: Send to trigger automations
  ✅ Products: Full CRUD
  ❌ Automations: READ-ONLY (create via UI only)
  ❌ Campaigns: READ-ONLY

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
