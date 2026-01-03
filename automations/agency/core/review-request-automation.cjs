#!/usr/bin/env node
/**
 * Review Request Automation - 3A Automation
 * Session 127bis Phase 2 - 03/01/2026
 *
 * Automated review collection with AI-personalized requests
 * Multi-provider fallback: Grok → OpenAI → Gemini → Claude → Template
 *
 * Benchmark: +270% reviews (Klaviyo industry data)
 *
 * Flow:
 * 1. Shopify webhook receives order.fulfilled event
 * 2. Wait 7-14 days after delivery
 * 3. Send personalized review request email
 * 4. Offer incentive for photo review
 * 5. Alert merchant if review < 3 stars
 */

require('dotenv').config();
const http = require('http');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  // Timing configuration
  timing: {
    minDaysAfterDelivery: 7,    // Wait at least 7 days
    maxDaysAfterDelivery: 14,   // Send by day 14 max
    defaultWaitDays: 10,        // Default: 10 days
    reminderDays: 7             // Reminder if no review after 7 days
  },
  // Incentive configuration
  incentives: {
    textReview: {
      discountPercent: 10,
      discountCode: 'REVIEW10'
    },
    photoReview: {
      discountPercent: 20,
      discountCode: 'PHOTOREVIEW20'
    },
    videoReview: {
      discountPercent: 25,
      discountCode: 'VIDEOREVIEW25'
    }
  },
  // Alert thresholds
  alerts: {
    lowRatingThreshold: 3,      // Alert if rating < 3 stars
    alertEmail: process.env.MERCHANT_ALERT_EMAIL || process.env.NOTIFICATION_EMAIL
  },
  // Rate limiting
  rateLimit: {
    maxPerMinute: 30,
    maxPerHour: 500
  },
  // Timeout
  timeout: 30000,
  // Benchmarks
  benchmarks: {
    reviewIncrease: 2.70,       // +270% reviews
    photoReviewRate: 0.35,      // 35% submit photos
    averageRating: 4.2          // Average 4.2 stars
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AI PROVIDERS (Frontier Models - Session 127bis)
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDERS = {
  grok: {
    name: 'Grok 4.1 Fast Reasoning',
    enabled: !!process.env.XAI_API_KEY,
    model: 'grok-4-1-fast-reasoning',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    apiKey: process.env.XAI_API_KEY
  },
  openai: {
    name: 'OpenAI GPT-5.2',
    enabled: !!process.env.OPENAI_API_KEY,
    model: 'gpt-5.2',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY
  },
  gemini: {
    name: 'Gemini 3 Flash',
    enabled: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3-flash-preview',
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    apiKey: process.env.GEMINI_API_KEY
  },
  anthropic: {
    name: 'Claude Sonnet 4',
    enabled: !!process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL APIS
// ─────────────────────────────────────────────────────────────────────────────

const EXTERNAL_APIS = {
  shopify: {
    name: 'Shopify Admin API',
    enabled: !!(process.env.SHOPIFY_STORE_URL && process.env.SHOPIFY_ACCESS_TOKEN),
    storeUrl: process.env.SHOPIFY_STORE_URL,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET
  },
  klaviyo: {
    name: 'Klaviyo Email API',
    enabled: !!process.env.KLAVIYO_API_KEY,
    apiKey: process.env.KLAVIYO_API_KEY,
    endpoint: 'https://a.klaviyo.com/api'
  },
  omnisend: {
    name: 'Omnisend Email API',
    enabled: !!process.env.OMNISEND_API_KEY,
    apiKey: process.env.OMNISEND_API_KEY,
    endpoint: 'https://api.omnisend.com/v3'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = {
  requests: [],
  maxSize: 1000,

  canProcess() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Cleanup old entries
    this.requests = this.requests.filter(t => t > oneHourAgo).slice(-this.maxSize);

    const lastMinute = this.requests.filter(t => t > oneMinuteAgo).length;
    const lastHour = this.requests.length;

    return lastMinute < CONFIG.rateLimit.maxPerMinute && lastHour < CONFIG.rateLimit.maxPerHour;
  },

  record() {
    this.requests.push(Date.now());
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PENDING REVIEWS STORE (bounded)
// ─────────────────────────────────────────────────────────────────────────────

const pendingReviews = new Map();
const MAX_PENDING = 10000;

function addPendingReview(orderId, data) {
  if (pendingReviews.size >= MAX_PENDING) {
    // Remove oldest entry
    const firstKey = pendingReviews.keys().next().value;
    pendingReviews.delete(firstKey);
  }
  pendingReviews.set(orderId, { ...data, addedAt: Date.now() });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

async function fetchWithTimeout(url, options, timeoutMs = CONFIG.timeout) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const prefix = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }[level] || '📝';
  console.log(`${prefix} [${timestamp}] ${message}`, Object.keys(data).length ? JSON.stringify(data) : '');
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPIFY INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

function verifyShopifyWebhook(body, hmacHeader) {
  if (!EXTERNAL_APIS.shopify.webhookSecret) {
    log('warning', 'No SHOPIFY_WEBHOOK_SECRET configured, skipping verification');
    return true;
  }

  const hash = crypto
    .createHmac('sha256', EXTERNAL_APIS.shopify.webhookSecret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader || ''));
}

async function getOrderDetails(orderId) {
  if (!EXTERNAL_APIS.shopify.enabled) {
    throw new Error('Shopify not configured');
  }

  const response = await fetchWithTimeout(
    `https://${EXTERNAL_APIS.shopify.storeUrl}/admin/api/2025-01/orders/${orderId}.json`,
    {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': EXTERNAL_APIS.shopify.accessToken,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.order;
}

async function getProductDetails(productId) {
  if (!EXTERNAL_APIS.shopify.enabled) {
    throw new Error('Shopify not configured');
  }

  const response = await fetchWithTimeout(
    `https://${EXTERNAL_APIS.shopify.storeUrl}/admin/api/2025-01/products/${productId}.json`,
    {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': EXTERNAL_APIS.shopify.accessToken,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.product;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI-POWERED PERSONALIZATION
// ─────────────────────────────────────────────────────────────────────────────

async function generatePersonalizedEmail(customer, order, products, language = 'fr') {
  const prompt = buildEmailPrompt(customer, order, products, language);

  // Try providers in order
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    if (!provider.enabled) continue;

    try {
      log('info', `Trying ${provider.name} for email personalization`);
      const result = await callProvider(key, provider, prompt);
      if (result) {
        log('success', `Email generated with ${provider.name}`);
        return result;
      }
    } catch (error) {
      log('warning', `${provider.name} failed: ${error.message}`);
    }
  }

  // Fallback to template
  log('info', 'Using template fallback');
  return generateTemplateEmail(customer, order, products, language);
}

function buildEmailPrompt(customer, order, products, language) {
  const productList = products.map(p => `- ${p.title}`).join('\n');

  return `Generate a friendly, personalized review request email in ${language === 'fr' ? 'French' : 'English'}.

Customer: ${customer.firstName} ${customer.lastName}
Order #: ${order.name}
Products purchased:
${productList}

Requirements:
1. Be warm and genuine, not salesy
2. Mention specific product(s) they bought
3. Explain why their feedback matters
4. Mention the photo review incentive (${CONFIG.incentives.photoReview.discountPercent}% off)
5. Include a clear call-to-action
6. Keep it under 150 words

Return JSON format:
{
  "subject": "Email subject line",
  "preheader": "Preview text (max 90 chars)",
  "greeting": "Personalized greeting",
  "body": "Main email content",
  "cta": "Call to action button text",
  "incentive": "Incentive mention"
}`;
}

async function callProvider(key, provider, prompt) {
  if (key === 'gemini') {
    return callGemini(provider, prompt);
  } else if (key === 'anthropic') {
    return callAnthropic(provider, prompt);
  } else {
    return callOpenAICompatible(provider, prompt);
  }
}

async function callOpenAICompatible(provider, prompt) {
  const response = await fetchWithTimeout(provider.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: 'You are an expert at writing engaging, personalized review request emails that feel genuine and drive action.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  // Extract JSON from response
  const jsonMatch = content?.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return safeJsonParse(jsonMatch[0]);
  }

  return null;
}

async function callGemini(provider, prompt) {
  const response = await fetchWithTimeout(provider.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  const jsonMatch = content?.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return safeJsonParse(jsonMatch[0]);
  }

  return null;
}

async function callAnthropic(provider, prompt) {
  const response = await fetchWithTimeout(provider.endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  const jsonMatch = content?.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return safeJsonParse(jsonMatch[0]);
  }

  return null;
}

function generateTemplateEmail(customer, order, products, language) {
  const productName = products[0]?.title || 'votre commande';

  if (language === 'fr') {
    return {
      subject: `${customer.firstName}, votre avis compte pour nous! ⭐`,
      preheader: `Dites-nous ce que vous pensez de ${productName}`,
      greeting: `Bonjour ${customer.firstName},`,
      body: `Nous espérons que vous êtes satisfait(e) de ${productName}! Votre avis nous aide à nous améliorer et aide d'autres clients à faire leur choix. Prenez quelques minutes pour partager votre expérience.`,
      cta: 'Donner mon avis',
      incentive: `💝 Bonus: Ajoutez une photo et recevez ${CONFIG.incentives.photoReview.discountPercent}% de réduction sur votre prochaine commande!`
    };
  }

  return {
    subject: `${customer.firstName}, your feedback matters! ⭐`,
    preheader: `Tell us what you think about ${productName}`,
    greeting: `Hi ${customer.firstName},`,
    body: `We hope you're enjoying ${productName}! Your review helps us improve and helps other customers make informed decisions. Take a few minutes to share your experience.`,
    cta: 'Write a Review',
    incentive: `💝 Bonus: Add a photo and get ${CONFIG.incentives.photoReview.discountPercent}% off your next order!`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SENDING (Klaviyo or Omnisend)
// ─────────────────────────────────────────────────────────────────────────────

async function sendReviewRequestEmail(customer, order, emailContent) {
  // Try Klaviyo first
  if (EXTERNAL_APIS.klaviyo.enabled) {
    try {
      return await sendViaKlaviyo(customer, order, emailContent);
    } catch (error) {
      log('warning', `Klaviyo failed: ${error.message}`);
    }
  }

  // Try Omnisend
  if (EXTERNAL_APIS.omnisend.enabled) {
    try {
      return await sendViaOmnisend(customer, order, emailContent);
    } catch (error) {
      log('warning', `Omnisend failed: ${error.message}`);
    }
  }

  throw new Error('No email provider available');
}

async function sendViaKlaviyo(customer, order, emailContent) {
  // Create event that triggers review request flow
  const response = await fetchWithTimeout(`${EXTERNAL_APIS.klaviyo.endpoint}/events/`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${EXTERNAL_APIS.klaviyo.apiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: 'Review Request Sent' } } },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: customer.email,
                first_name: customer.firstName,
                last_name: customer.lastName
              }
            }
          },
          properties: {
            order_id: order.id,
            order_name: order.name,
            email_subject: emailContent.subject,
            email_body: emailContent.body,
            email_cta: emailContent.cta,
            incentive: emailContent.incentive,
            photo_discount_code: CONFIG.incentives.photoReview.discountCode,
            text_discount_code: CONFIG.incentives.textReview.discountCode
          },
          time: new Date().toISOString()
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Klaviyo error: ${error}`);
  }

  log('success', 'Review request event sent to Klaviyo', { email: customer.email, orderId: order.id });
  return { provider: 'klaviyo', success: true };
}

async function sendViaOmnisend(customer, order, emailContent) {
  // Create event in Omnisend
  const response = await fetchWithTimeout(`${EXTERNAL_APIS.omnisend.endpoint}/events`, {
    method: 'POST',
    headers: {
      'X-API-Key': EXTERNAL_APIS.omnisend.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: customer.email,
      eventName: 'review_request_sent',
      eventTime: new Date().toISOString(),
      eventID: `review_${order.id}_${Date.now()}`,
      fields: {
        orderId: order.id,
        orderName: order.name,
        emailSubject: emailContent.subject,
        emailBody: emailContent.body,
        emailCta: emailContent.cta,
        incentive: emailContent.incentive,
        photoDiscountCode: CONFIG.incentives.photoReview.discountCode,
        textDiscountCode: CONFIG.incentives.textReview.discountCode
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Omnisend error: ${error}`);
  }

  log('success', 'Review request event sent to Omnisend', { email: customer.email, orderId: order.id });
  return { provider: 'omnisend', success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW PROCESSING
// ─────────────────────────────────────────────────────────────────────────────

async function processNewReview(review) {
  log('info', 'Processing new review', { productId: review.productId, rating: review.rating });

  // Check if low rating - alert merchant
  if (review.rating < CONFIG.alerts.lowRatingThreshold) {
    await alertMerchant(review);
  }

  // Track review for analytics
  if (EXTERNAL_APIS.klaviyo.enabled) {
    await trackReviewEvent(review);
  }

  return { processed: true, alerted: review.rating < CONFIG.alerts.lowRatingThreshold };
}

async function alertMerchant(review) {
  if (!CONFIG.alerts.alertEmail) {
    log('warning', 'No alert email configured');
    return;
  }

  log('warning', `Low rating alert: ${review.rating} stars`, {
    customer: review.customerEmail,
    product: review.productTitle
  });

  // Send alert via email provider
  if (EXTERNAL_APIS.klaviyo.enabled) {
    await fetchWithTimeout(`${EXTERNAL_APIS.klaviyo.endpoint}/events/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${EXTERNAL_APIS.klaviyo.apiKey}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: 'Low Rating Alert' } } },
            profile: {
              data: {
                type: 'profile',
                attributes: { email: CONFIG.alerts.alertEmail }
              }
            },
            properties: {
              customer_email: review.customerEmail,
              product_title: review.productTitle,
              rating: review.rating,
              review_text: review.text,
              order_id: review.orderId
            },
            time: new Date().toISOString()
          }
        }
      })
    });
  }
}

async function trackReviewEvent(review) {
  if (!EXTERNAL_APIS.klaviyo.enabled) return;

  await fetchWithTimeout(`${EXTERNAL_APIS.klaviyo.endpoint}/events/`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${EXTERNAL_APIS.klaviyo.apiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: 'Product Reviewed' } } },
          profile: {
            data: {
              type: 'profile',
              attributes: { email: review.customerEmail }
            }
          },
          properties: {
            product_id: review.productId,
            product_title: review.productTitle,
            rating: review.rating,
            has_photo: review.hasPhoto || false,
            has_video: review.hasVideo || false,
            review_text_length: review.text?.length || 0
          },
          time: new Date().toISOString()
        }
      }
    })
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FLOW
// ─────────────────────────────────────────────────────────────────────────────

async function processDeliveredOrder(order) {
  if (!rateLimiter.canProcess()) {
    log('warning', 'Rate limit exceeded, skipping', { orderId: order.id });
    return { success: false, reason: 'rate_limit' };
  }

  rateLimiter.record();

  try {
    // Extract customer info
    const customer = {
      email: order.email,
      firstName: order.customer?.first_name || order.shipping_address?.first_name || 'Client',
      lastName: order.customer?.last_name || order.shipping_address?.last_name || ''
    };

    // Extract products
    const products = order.line_items?.map(item => ({
      id: item.product_id,
      title: item.title,
      variant: item.variant_title,
      quantity: item.quantity,
      price: item.price
    })) || [];

    if (products.length === 0) {
      log('warning', 'No products in order', { orderId: order.id });
      return { success: false, reason: 'no_products' };
    }

    // Detect language from order
    const language = order.customer_locale?.startsWith('fr') ? 'fr' : 'en';

    // Generate personalized email
    const emailContent = await generatePersonalizedEmail(customer, order, products, language);

    // Send email
    const result = await sendReviewRequestEmail(customer, order, emailContent);

    log('success', 'Review request sent', {
      orderId: order.id,
      email: customer.email,
      provider: result.provider
    });

    return { success: true, ...result };

  } catch (error) {
    log('error', `Failed to process order: ${error.message}`, { orderId: order.id });
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK SERVER
// ─────────────────────────────────────────────────────────────────────────────

function startServer(port = 3011) {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    const allowedOrigins = ['https://3a-automation.com', 'https://dashboard.3a-automation.com'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Hmac-Sha256');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        pendingReviews: pendingReviews.size,
        providers: Object.entries(PROVIDERS).map(([k, v]) => ({ name: k, enabled: v.enabled })),
        emailProviders: Object.entries(EXTERNAL_APIS).filter(([k]) => k !== 'shopify').map(([k, v]) => ({ name: k, enabled: v.enabled }))
      }));
      return;
    }

    // Webhook: Shopify order fulfilled
    if (req.method === 'POST' && req.url === '/webhook/shopify/fulfilled') {
      let body = '';
      let bodySize = 0;
      const maxBodySize = 1024 * 1024; // 1MB

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > maxBodySize) {
          res.writeHead(413);
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        try {
          // Verify webhook signature
          const hmac = req.headers['x-shopify-hmac-sha256'];
          if (!verifyShopifyWebhook(body, hmac)) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Invalid signature' }));
            return;
          }

          const order = safeJsonParse(body);
          if (!order) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }

          // Schedule review request for later (after delivery delay)
          const sendDate = new Date();
          sendDate.setDate(sendDate.getDate() + CONFIG.timing.defaultWaitDays);

          addPendingReview(order.id, {
            order,
            scheduledFor: sendDate.toISOString()
          });

          log('info', 'Review request scheduled', {
            orderId: order.id,
            scheduledFor: sendDate.toISOString()
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            orderId: order.id,
            scheduledFor: sendDate.toISOString()
          }));

        } catch (error) {
          log('error', `Webhook error: ${error.message}`);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // Webhook: New review submitted
    if (req.method === 'POST' && req.url === '/webhook/review/submitted') {
      let body = '';
      let bodySize = 0;
      const maxBodySize = 100 * 1024; // 100KB

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > maxBodySize) {
          res.writeHead(413);
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const review = safeJsonParse(body);
          if (!review) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }

          const result = await processNewReview(review);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));

        } catch (error) {
          log('error', `Review webhook error: ${error.message}`);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // Manual trigger
    if (req.method === 'POST' && req.url === '/trigger') {
      let body = '';

      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const data = safeJsonParse(body);
          if (!data?.orderId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'orderId required' }));
            return;
          }

          const order = await getOrderDetails(data.orderId);
          const result = await processDeliveredOrder(order);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));

        } catch (error) {
          log('error', `Trigger error: ${error.message}`);
          res.writeHead(500);
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    log('success', `Review Request Automation server running on port ${port}`);
    log('info', 'Endpoints:', {
      health: `GET http://localhost:${port}/health`,
      webhookFulfilled: `POST http://localhost:${port}/webhook/shopify/fulfilled`,
      webhookReview: `POST http://localhost:${port}/webhook/review/submitted`,
      trigger: `POST http://localhost:${port}/trigger`
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('info', 'Shutting down gracefully...');
    server.close(() => {
      log('info', 'Server closed');
      process.exit(0);
    });
  });

  return server;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED PROCESSOR
// ─────────────────────────────────────────────────────────────────────────────

async function processPendingReviews() {
  const now = Date.now();
  let processed = 0;

  for (const [orderId, data] of pendingReviews) {
    if (new Date(data.scheduledFor).getTime() <= now) {
      try {
        await processDeliveredOrder(data.order);
        pendingReviews.delete(orderId);
        processed++;
      } catch (error) {
        log('error', `Failed to process pending review: ${error.message}`, { orderId });
      }
    }
  }

  if (processed > 0) {
    log('success', `Processed ${processed} pending review requests`);
  }

  return processed;
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

async function healthCheck() {
  console.log('\n📊 Review Request Automation - Health Check\n');
  console.log('═'.repeat(60));

  // AI Providers
  console.log('\n🤖 AI Providers:');
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    const status = provider.enabled ? '✅' : '⚠️';
    console.log(`  ${status} ${provider.name}: ${provider.enabled ? 'Configured' : 'Not configured'}`);
  }

  // Email Providers
  console.log('\n📧 Email Providers:');
  console.log(`  ${EXTERNAL_APIS.klaviyo.enabled ? '✅' : '⚠️'} Klaviyo: ${EXTERNAL_APIS.klaviyo.enabled ? 'Configured' : 'KLAVIYO_API_KEY missing'}`);
  console.log(`  ${EXTERNAL_APIS.omnisend.enabled ? '✅' : '⚠️'} Omnisend: ${EXTERNAL_APIS.omnisend.enabled ? 'Configured' : 'OMNISEND_API_KEY missing'}`);

  // Shopify
  console.log('\n🛒 Shopify:');
  console.log(`  ${EXTERNAL_APIS.shopify.enabled ? '✅' : '⚠️'} Admin API: ${EXTERNAL_APIS.shopify.enabled ? 'Configured' : 'SHOPIFY_STORE_URL or SHOPIFY_ACCESS_TOKEN missing'}`);
  console.log(`  ${EXTERNAL_APIS.shopify.webhookSecret ? '✅' : '⚠️'} Webhook Secret: ${EXTERNAL_APIS.shopify.webhookSecret ? 'Configured' : 'SHOPIFY_WEBHOOK_SECRET missing (optional)'}`);

  // Configuration
  console.log('\n⚙️ Configuration:');
  console.log(`  📅 Wait time: ${CONFIG.timing.defaultWaitDays} days after delivery`);
  console.log(`  🎁 Photo review discount: ${CONFIG.incentives.photoReview.discountPercent}%`);
  console.log(`  ⚠️ Alert threshold: < ${CONFIG.alerts.lowRatingThreshold} stars`);
  console.log(`  📧 Alert email: ${CONFIG.alerts.alertEmail || 'Not configured'}`);

  // Summary
  const aiCount = Object.values(PROVIDERS).filter(p => p.enabled).length;
  const emailCount = [EXTERNAL_APIS.klaviyo.enabled, EXTERNAL_APIS.omnisend.enabled].filter(Boolean).length;

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📈 Summary: ${aiCount}/4 AI providers, ${emailCount}/2 email providers`);

  const isOperational = aiCount > 0 || true; // Template fallback always works
  const hasEmailProvider = emailCount > 0;

  if (isOperational && hasEmailProvider) {
    console.log('✅ Status: FULLY OPERATIONAL');
    console.log(`📊 Expected benchmark: +${CONFIG.benchmarks.reviewIncrease * 100}% reviews\n`);
  } else if (isOperational) {
    console.log('⚠️ Status: DEGRADED (no email provider configured)');
    console.log('   Configure KLAVIYO_API_KEY or OMNISEND_API_KEY\n');
  } else {
    console.log('❌ Status: NOT OPERATIONAL\n');
  }

  return { aiCount, emailCount, isOperational, hasEmailProvider };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--health')) {
    await healthCheck();
    return;
  }

  if (args.includes('--server')) {
    const portArg = args.find(a => a.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1]) : 3011;
    startServer(port);

    // Start periodic processor (every 5 minutes)
    setInterval(processPendingReviews, 5 * 60 * 1000);
    return;
  }

  if (args.includes('--test')) {
    console.log('\n🧪 Testing review request generation...\n');

    const testOrder = {
      id: 'test-123',
      name: '#1001',
      email: 'test@example.com',
      customer: { first_name: 'Marie', last_name: 'Dupont' },
      line_items: [
        { product_id: 1, title: 'Sérum Anti-Âge Premium', price: '89.00', quantity: 1 }
      ],
      customer_locale: 'fr'
    };

    const customer = {
      email: testOrder.email,
      firstName: testOrder.customer.first_name,
      lastName: testOrder.customer.last_name
    };

    const products = testOrder.line_items.map(item => ({
      id: item.product_id,
      title: item.title,
      price: item.price,
      quantity: item.quantity
    }));

    const emailContent = await generatePersonalizedEmail(customer, testOrder, products, 'fr');

    console.log('📧 Generated Email:');
    console.log('━'.repeat(50));
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`Preheader: ${emailContent.preheader}`);
    console.log(`\n${emailContent.greeting}\n`);
    console.log(emailContent.body);
    console.log(`\n[${emailContent.cta}]\n`);
    console.log(emailContent.incentive);
    console.log('━'.repeat(50));

    return;
  }

  if (args.includes('--process-pending')) {
    const count = await processPendingReviews();
    console.log(`\n✅ Processed ${count} pending review requests\n`);
    return;
  }

  // Show help
  console.log(`
📧 Review Request Automation - 3A Automation
═══════════════════════════════════════════════════

Usage:
  node review-request-automation.cjs --health          Check configuration
  node review-request-automation.cjs --test            Test email generation
  node review-request-automation.cjs --server          Start webhook server (port 3011)
  node review-request-automation.cjs --server --port=3012
  node review-request-automation.cjs --process-pending Process scheduled requests

Shopify Webhook Setup:
  URL: https://your-domain.com/webhook/shopify/fulfilled
  Topic: orders/fulfilled

Environment Variables:
  SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN, SHOPIFY_WEBHOOK_SECRET
  KLAVIYO_API_KEY or OMNISEND_API_KEY
  XAI_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY

Benchmark: +270% reviews with automated requests
`);
}

main().catch(console.error);
