#!/usr/bin/env node
/**
 * SMS Automation - Resilient Multi-Provider
 *
 * Purpose: SMS marketing automation for e-commerce
 * - Abandoned Cart SMS (15-30min after abandon)
 * - Shipping Notification SMS
 * - Order Confirmation SMS
 * - Custom event-triggered SMS
 *
 * Providers:
 * - Omnisend SMS (primary, via events API)
 * - Twilio (fallback)
 *
 * Benchmark: 98% open rate, 21-32% conversion
 *
 * IMPORTANT:
 * - SMS flows must be created in Omnisend UI first
 * - This script triggers those flows via events
 * - Contacts must have phone number with SMS consent
 *
 * @version 1.0.0
 * @date 2026-01-03
 */

require('dotenv').config();
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Omnisend (primary)
  omnisend: {
    apiKey: process.env.OMNISEND_API_KEY,
    baseUrl: 'https://api.omnisend.com/v5'
  },
  // Twilio (fallback for direct SMS)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  // Retry configuration
  retry: {
    maxAttempts: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitterMs: 500
  },
  timeout: 30000,
  // SMS event types for triggering automations
  smsEventTypes: {
    ABANDONED_CART: 'sms_abandoned_cart',
    ORDER_CONFIRMED: 'sms_order_confirmed',
    SHIPPING_UPDATE: 'sms_shipping_update',
    DELIVERY_CONFIRMED: 'sms_delivery_confirmed',
    REVIEW_REQUEST: 'sms_review_request',
    FLASH_SALE: 'sms_flash_sale',
    BACK_IN_STOCK: 'sms_back_in_stock',
    CUSTOM: 'sms_custom'
  }
};

// ============================================================================
// SMS CLIENT
// ============================================================================

class SMSAutomationClient {
  constructor() {
    this.omnisendAvailable = !!CONFIG.omnisend.apiKey;
    this.twilioAvailable = !!(CONFIG.twilio.accountSid && CONFIG.twilio.authToken && CONFIG.twilio.phoneNumber);
    this.eventCounter = 0;
    this.rateLimitCount = 0;
    this.rateLimitReset = Date.now();
  }

  /**
   * Generate unique event ID for deduplication
   */
  generateEventID() {
    this.eventCounter++;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sms-${timestamp}-${this.eventCounter}-${random}`;
  }

  /**
   * Rate limiting (400 req/min for Omnisend)
   */
  async rateLimit() {
    this.rateLimitCount++;
    const now = Date.now();
    const elapsed = now - this.rateLimitReset;

    if (elapsed >= 60000) {
      this.rateLimitCount = 1;
      this.rateLimitReset = now;
    } else if (this.rateLimitCount >= 400) {
      const waitTime = 60000 - elapsed;
      console.log(`⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimitCount = 1;
      this.rateLimitReset = Date.now();
    }
  }

  /**
   * Execute with exponential backoff
   */
  async withRetry(operation, operationName = 'operation') {
    let lastError;

    for (let attempt = 1; attempt <= CONFIG.retry.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const statusCode = error.statusCode || (error.message?.match(/(\d{3})/)?.[1]);

        if (statusCode === '429' || statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
          const baseDelay = Math.min(
            CONFIG.retry.baseDelayMs * Math.pow(2, attempt - 1),
            CONFIG.retry.maxDelayMs
          );
          const jitter = Math.random() * CONFIG.retry.jitterMs;
          const delay = baseDelay + jitter;

          console.log(`⚠️ ${operationName} retry ${attempt}/${CONFIG.retry.maxAttempts} in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Safe JSON parse
   */
  safeJsonParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  // ==========================================================================
  // OMNISEND API
  // ==========================================================================

  /**
   * Make Omnisend API request
   */
  async omnisendRequest(method, endpoint, data = null) {
    if (!this.omnisendAvailable) {
      throw new Error('Omnisend API key not configured');
    }

    await this.rateLimit();

    return new Promise((resolve, reject) => {
      const url = new URL(`${CONFIG.omnisend.baseUrl}${endpoint}`);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': CONFIG.omnisend.apiKey
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
            const error = new Error(`Omnisend API error ${res.statusCode}: ${JSON.stringify(parsed)}`);
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

  // ==========================================================================
  // TWILIO API (Fallback)
  // ==========================================================================

  /**
   * Send SMS via Twilio (direct SMS, fallback)
   */
  async twilioSendSMS(to, message) {
    if (!this.twilioAvailable) {
      throw new Error('Twilio credentials not configured');
    }

    const auth = Buffer.from(`${CONFIG.twilio.accountSid}:${CONFIG.twilio.authToken}`).toString('base64');
    const postData = new URLSearchParams({
      To: to,
      From: CONFIG.twilio.phoneNumber,
      Body: message
    }).toString();

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${CONFIG.twilio.accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
          'Content-Length': Buffer.byteLength(postData)
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
            const error = new Error(`Twilio error ${res.statusCode}: ${JSON.stringify(parsed)}`);
            error.statusCode = res.statusCode;
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Twilio timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  // ==========================================================================
  // CONTACT MANAGEMENT
  // ==========================================================================

  /**
   * Subscribe contact for SMS
   * @param {Object} contact - { phone, email?, firstName?, lastName? }
   */
  async subscribeForSMS(contact) {
    if (!contact.phone) {
      throw new Error('Phone number is required for SMS subscription');
    }

    // Normalize phone number to international format
    const phone = this.normalizePhone(contact.phone);

    const payload = {
      identifiers: [
        {
          type: 'phone',
          id: phone,
          channels: {
            sms: {
              status: 'subscribed',
              statusDate: new Date().toISOString()
            }
          }
        }
      ]
    };

    if (contact.email) {
      payload.identifiers.push({
        type: 'email',
        id: contact.email
      });
    }

    if (contact.firstName) payload.firstName = contact.firstName;
    if (contact.lastName) payload.lastName = contact.lastName;

    try {
      const result = await this.withRetry(
        () => this.omnisendRequest('POST', '/contacts', payload),
        'subscribeForSMS'
      );
      console.log(`✅ SMS subscription: ${phone}`);
      return result;
    } catch (error) {
      console.error(`❌ SMS subscription failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Normalize phone number to international format
   */
  normalizePhone(phone) {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Add + if missing and starts with country code
    if (!normalized.startsWith('+')) {
      // Assume Morocco (+212) or France (+33) based on prefix
      if (normalized.startsWith('0')) {
        // French format: 0612345678 → +33612345678
        normalized = '+33' + normalized.substring(1);
      } else if (normalized.startsWith('212')) {
        normalized = '+' + normalized;
      } else if (normalized.startsWith('33')) {
        normalized = '+' + normalized;
      } else {
        // Default to French
        normalized = '+33' + normalized;
      }
    }

    return normalized;
  }

  // ==========================================================================
  // SMS EVENT TRIGGERS
  // ==========================================================================

  /**
   * Send SMS event to trigger Omnisend automation
   * @param {string} eventType - One of CONFIG.smsEventTypes
   * @param {Object} contact - { phone, email? }
   * @param {Object} data - Event-specific data
   */
  async sendSMSEvent(eventType, contact, data = {}) {
    if (!contact.phone && !contact.email) {
      throw new Error('Contact phone or email required');
    }

    const eventID = this.generateEventID();
    const eventTime = new Date().toISOString();

    const payload = {
      eventID,
      eventTime,
      eventVersion: '1.0.0',
      eventName: eventType,
      origin: 'api',
      contact: {},
      properties: {
        ...data,
        smsEventType: eventType,
        triggeredAt: eventTime
      }
    };

    if (contact.phone) {
      payload.contact.phone = this.normalizePhone(contact.phone);
    }
    if (contact.email) {
      payload.contact.email = contact.email;
    }

    try {
      const result = await this.withRetry(
        () => this.omnisendRequest('POST', '/events', payload),
        `sendSMSEvent:${eventType}`
      );
      console.log(`✅ SMS event '${eventType}' sent (ID: ${eventID})`);
      return { ...result, eventID, eventTime };
    } catch (error) {
      console.error(`❌ SMS event failed: ${error.message}`);
      throw error;
    }
  }

  // ==========================================================================
  // ABANDONED CART SMS (15-30min delay)
  // ==========================================================================

  /**
   * Trigger Abandoned Cart SMS automation
   * @param {Object} contact - { phone, email?, firstName? }
   * @param {Object} cart - { cartId, total, currency, recoveryUrl, products[] }
   */
  async triggerAbandonedCartSMS(contact, cart) {
    console.log(`📱 Triggering Abandoned Cart SMS for ${contact.phone || contact.email}`);

    const data = {
      cartID: cart.cartId || cart.id,
      cartTotal: cart.total,
      cartCurrency: cart.currency || 'EUR',
      cartRecoveryUrl: cart.recoveryUrl,
      productsCount: cart.products?.length || 0,
      firstProductName: cart.products?.[0]?.title || 'your items',
      customerName: contact.firstName || 'there'
    };

    // First, ensure the cart exists in Omnisend for abandoned cart automation
    if (cart.products && cart.products.length > 0) {
      try {
        await this.omnisendRequest('POST', '/carts', {
          cartID: cart.cartId || cart.id,
          email: contact.email,
          phone: this.normalizePhone(contact.phone),
          currency: cart.currency || 'EUR',
          cartSum: cart.total,
          cartRecoveryUrl: cart.recoveryUrl,
          products: cart.products.map(p => ({
            productID: p.id || p.productID,
            title: p.title,
            quantity: p.quantity || 1,
            price: p.price,
            imageUrl: p.imageUrl,
            productUrl: p.productUrl
          }))
        });
        console.log(`  ↳ Cart synced to Omnisend`);
      } catch (error) {
        console.log(`  ↳ Cart sync skipped: ${error.message}`);
      }
    }

    // Then send the SMS event
    return this.sendSMSEvent(CONFIG.smsEventTypes.ABANDONED_CART, contact, data);
  }

  // ==========================================================================
  // ORDER CONFIRMATION SMS
  // ==========================================================================

  /**
   * Trigger Order Confirmation SMS
   * @param {Object} contact - { phone, email?, firstName? }
   * @param {Object} order - { orderId, orderNumber, total, currency, itemsCount }
   */
  async triggerOrderConfirmationSMS(contact, order) {
    console.log(`📱 Triggering Order Confirmation SMS for ${contact.phone || contact.email}`);

    const data = {
      orderID: order.orderId || order.id,
      orderNumber: order.orderNumber || order.number,
      orderTotal: order.total,
      orderCurrency: order.currency || 'EUR',
      itemsCount: order.itemsCount || 1,
      customerName: contact.firstName || 'there'
    };

    return this.sendSMSEvent(CONFIG.smsEventTypes.ORDER_CONFIRMED, contact, data);
  }

  // ==========================================================================
  // SHIPPING NOTIFICATION SMS
  // ==========================================================================

  /**
   * Trigger Shipping Notification SMS
   * @param {Object} contact - { phone, email?, firstName? }
   * @param {Object} shipment - { orderId, trackingNumber, trackingUrl, carrier, estimatedDelivery }
   */
  async triggerShippingSMS(contact, shipment) {
    console.log(`📱 Triggering Shipping SMS for ${contact.phone || contact.email}`);

    const data = {
      orderID: shipment.orderId,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      carrier: shipment.carrier || 'Carrier',
      estimatedDelivery: shipment.estimatedDelivery,
      customerName: contact.firstName || 'there'
    };

    return this.sendSMSEvent(CONFIG.smsEventTypes.SHIPPING_UPDATE, contact, data);
  }

  // ==========================================================================
  // DELIVERY CONFIRMATION SMS
  // ==========================================================================

  /**
   * Trigger Delivery Confirmation SMS
   * @param {Object} contact - { phone, email?, firstName? }
   * @param {Object} delivery - { orderId, orderNumber }
   */
  async triggerDeliverySMS(contact, delivery) {
    console.log(`📱 Triggering Delivery SMS for ${contact.phone || contact.email}`);

    const data = {
      orderID: delivery.orderId,
      orderNumber: delivery.orderNumber,
      deliveredAt: new Date().toISOString(),
      customerName: contact.firstName || 'there'
    };

    return this.sendSMSEvent(CONFIG.smsEventTypes.DELIVERY_CONFIRMED, contact, data);
  }

  // ==========================================================================
  // REVIEW REQUEST SMS
  // ==========================================================================

  /**
   * Trigger Review Request SMS (7-14 days after delivery)
   * @param {Object} contact - { phone, email?, firstName? }
   * @param {Object} order - { orderId, orderNumber, reviewUrl }
   */
  async triggerReviewRequestSMS(contact, order) {
    console.log(`📱 Triggering Review Request SMS for ${contact.phone || contact.email}`);

    const data = {
      orderID: order.orderId,
      orderNumber: order.orderNumber,
      reviewUrl: order.reviewUrl,
      customerName: contact.firstName || 'there'
    };

    return this.sendSMSEvent(CONFIG.smsEventTypes.REVIEW_REQUEST, contact, data);
  }

  // ==========================================================================
  // FLASH SALE SMS
  // ==========================================================================

  /**
   * Trigger Flash Sale SMS
   * @param {Object} contact - { phone, email?, firstName? }
   * @param {Object} sale - { saleTitle, discountPercent, validUntil, saleUrl }
   */
  async triggerFlashSaleSMS(contact, sale) {
    console.log(`📱 Triggering Flash Sale SMS for ${contact.phone || contact.email}`);

    const data = {
      saleTitle: sale.saleTitle,
      discountPercent: sale.discountPercent,
      validUntil: sale.validUntil,
      saleUrl: sale.saleUrl,
      customerName: contact.firstName || 'there'
    };

    return this.sendSMSEvent(CONFIG.smsEventTypes.FLASH_SALE, contact, data);
  }

  // ==========================================================================
  // BACK IN STOCK SMS
  // ==========================================================================

  /**
   * Trigger Back in Stock SMS
   * @param {Object} contact - { phone, email?, firstName? }
   * @param {Object} product - { productId, productTitle, productUrl, imageUrl }
   */
  async triggerBackInStockSMS(contact, product) {
    console.log(`📱 Triggering Back in Stock SMS for ${contact.phone || contact.email}`);

    const data = {
      productID: product.productId,
      productTitle: product.productTitle,
      productUrl: product.productUrl,
      imageUrl: product.imageUrl,
      customerName: contact.firstName || 'there'
    };

    return this.sendSMSEvent(CONFIG.smsEventTypes.BACK_IN_STOCK, contact, data);
  }

  // ==========================================================================
  // DIRECT SMS (Twilio Fallback)
  // ==========================================================================

  /**
   * Send direct SMS via Twilio (fallback if Omnisend unavailable)
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   */
  async sendDirectSMS(phone, message) {
    const normalizedPhone = this.normalizePhone(phone);

    // Try Omnisend first (via custom event)
    if (this.omnisendAvailable) {
      try {
        return await this.sendSMSEvent(CONFIG.smsEventTypes.CUSTOM, { phone }, { message });
      } catch (error) {
        console.log(`⚠️ Omnisend failed, trying Twilio: ${error.message}`);
      }
    }

    // Fallback to Twilio
    if (this.twilioAvailable) {
      try {
        const result = await this.withRetry(
          () => this.twilioSendSMS(normalizedPhone, message),
          'twilioSendSMS'
        );
        console.log(`✅ SMS sent via Twilio to ${normalizedPhone}`);
        return result;
      } catch (error) {
        console.error(`❌ Twilio SMS failed: ${error.message}`);
        throw error;
      }
    }

    throw new Error('No SMS provider available');
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  async healthCheck() {
    console.log('\n🔍 SMS Automation Health Check v1.0.0');
    console.log('=====================================');

    const results = {
      omnisend: false,
      twilio: false,
      providers: []
    };

    // Check Omnisend
    console.log('\n📧 Omnisend SMS (via Events):');
    if (this.omnisendAvailable) {
      try {
        const contacts = await this.omnisendRequest('GET', '/contacts?limit=1');
        results.omnisend = true;
        results.providers.push('Omnisend');
        console.log(`  ✅ Connected (API key valid)`);
        console.log(`  ℹ️ SMS flows triggered via events`);
        console.log(`  ℹ️ Create SMS automations in Omnisend UI`);
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    } else {
      console.log(`  ⚠️ OMNISEND_API_KEY not configured`);
    }

    // Check Twilio
    console.log('\n📱 Twilio (Direct SMS Fallback):');
    if (this.twilioAvailable) {
      results.twilio = true;
      results.providers.push('Twilio');
      console.log(`  ✅ Credentials configured`);
      console.log(`  📞 From: ${CONFIG.twilio.phoneNumber}`);
    } else {
      console.log(`  ⚠️ TWILIO_* credentials not configured`);
    }

    // SMS Event Types
    console.log('\n📨 Available SMS Event Types:');
    Object.entries(CONFIG.smsEventTypes).forEach(([key, value]) => {
      console.log(`  • ${key}: ${value}`);
    });

    // Summary
    console.log('\n📊 Summary:');
    const operational = results.providers.length > 0;
    console.log(`  Providers: ${results.providers.length > 0 ? results.providers.join(', ') : 'NONE'}`);
    console.log(`  Status: ${operational ? '✅ OPERATIONAL' : '❌ NO PROVIDERS'}`);

    if (!operational) {
      console.log('\n⚠️ To enable SMS automation:');
      console.log('  1. Set OMNISEND_API_KEY (primary) OR');
      console.log('  2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (fallback)');
    }

    console.log('\n📈 SMS Benchmarks (Industry):');
    console.log('  • Open rate: 98%');
    console.log('  • Conversion: 21-32%');
    console.log('  • Abandoned cart recovery: +15-25%');

    return {
      status: operational ? 'healthy' : 'unavailable',
      version: '1.0.0',
      ...results
    };
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const client = new SMSAutomationClient();

  if (args.includes('--health')) {
    await client.healthCheck();
  } else if (args.includes('--test-abandoned-cart')) {
    const result = await client.triggerAbandonedCartSMS(
      { phone: '+33612345678', firstName: 'Test' },
      {
        cartId: `test-cart-${Date.now()}`,
        total: 99.99,
        currency: 'EUR',
        recoveryUrl: 'https://example.com/cart/recover',
        products: [{ id: 'prod-001', title: 'Test Product', price: 99.99, quantity: 1 }]
      }
    );
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--test-order')) {
    const result = await client.triggerOrderConfirmationSMS(
      { phone: '+33612345678', firstName: 'Test' },
      {
        orderId: `order-${Date.now()}`,
        orderNumber: '10001',
        total: 149.99,
        currency: 'EUR',
        itemsCount: 2
      }
    );
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--test-shipping')) {
    const result = await client.triggerShippingSMS(
      { phone: '+33612345678', firstName: 'Test' },
      {
        orderId: 'order-123',
        trackingNumber: 'TRK123456789',
        trackingUrl: 'https://tracking.example.com/TRK123456789',
        carrier: 'DHL',
        estimatedDelivery: '2026-01-05'
      }
    );
    console.log('Result:', JSON.stringify(result, null, 2));
  } else if (args.includes('--subscribe')) {
    const phoneIndex = args.indexOf('--phone');
    const phone = phoneIndex !== -1 ? args[phoneIndex + 1] : '+33612345678';
    const result = await client.subscribeForSMS({ phone });
    console.log('Result:', JSON.stringify(result, null, 2));
  } else {
    console.log(`
SMS Automation v1.0.0 - Resilient Multi-Provider
================================================

Usage:
  node sms-automation-resilient.cjs [options]

Options:
  --health               Test SMS providers connectivity

  Testing:
  --test-abandoned-cart  Test abandoned cart SMS trigger
  --test-order           Test order confirmation SMS trigger
  --test-shipping        Test shipping notification SMS trigger
  --subscribe --phone=X  Subscribe phone number for SMS

Environment Variables:
  OMNISEND_API_KEY        Omnisend API key (primary)
  TWILIO_ACCOUNT_SID      Twilio Account SID (fallback)
  TWILIO_AUTH_TOKEN       Twilio Auth Token (fallback)
  TWILIO_PHONE_NUMBER     Twilio Phone Number (fallback)

SMS Event Types:
  ${Object.entries(CONFIG.smsEventTypes).map(([k, v]) => `${k}: ${v}`).join('\n  ')}

Benchmarks:
  • Open rate: 98% (vs 20% email)
  • Conversion: 21-32%
  • Abandoned cart recovery: +15-25%

IMPORTANT:
  1. Create SMS automations in Omnisend UI first
  2. This script triggers those automations via events
  3. Contacts must have valid phone + SMS consent
`);
  }
}

// Export for programmatic use
module.exports = { SMSAutomationClient, CONFIG };

// Run CLI if executed directly
if (require.main === module) {
  main().catch(console.error);
}
