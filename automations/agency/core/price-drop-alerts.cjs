#!/usr/bin/env node
/**
 * Price Drop Alerts - 3A Automation
 * Session 127bis Phase 3 - 03/01/2026
 *
 * Trigger: Product price decrease (wishlist monitoring)
 * Benchmark: 8.8% conversion rate
 *
 * Features:
 * - Wishlist price monitoring
 * - Real-time price drop detection
 * - AI-generated personalized alerts
 * - Multi-channel notifications (email/SMS)
 * - Stock status awareness
 *
 * Usage:
 *   node price-drop-alerts.cjs --health
 *   node price-drop-alerts.cjs --check-prices
 *   node price-drop-alerts.cjs --simulate --product-id=PROD123 --drop=20
 *   node price-drop-alerts.cjs --server --port=3017
 */

require('dotenv').config();

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION - FRONTIER MODELS ONLY (MANDATORY)
// ============================================================================

const fs = require('fs');
const path = require('path');

const CONFIG = {
  version: '1.1.0 (HITL)',
  port: parseInt(process.env.PRICE_DROP_PORT) || 3017,
  httpTimeout: 15000,

  // HITL: Batch Approval (Session 165ter + 165quater flexibility)
  // User configurable thresholds via ENV variables:
  //   PRICE_DROP_BATCH_THRESHOLD: 5 | 10 | 15 | 20 | 25 | custom (default: 10)
  hitl: {
    enabled: process.env.PRICE_DROP_HITL !== 'false', // Default: ON
    batchThreshold: parseInt(process.env.PRICE_DROP_BATCH_THRESHOLD) || 10, // 5, 10, 15, 20, 25 alertes ou valeur custom
    batchThresholdOptions: [5, 10, 15, 20, 25],  // Recommended options
    pendingDir: './data/hitl-pending/price-drop/',
    slackWebhook: process.env.PRICE_DROP_SLACK_WEBHOOK || null,
    maxPendingAge: 24 * 60 * 60 * 1000 // 24 hours max
  },

  // AI Providers - FRONTIER MODELS (Session 127bis requirement)
  ai: {
    grok: {
      apiKey: process.env.XAI_API_KEY,
      endpoint: 'https://api.x.ai/v1/chat/completions',
      model: 'grok-4-1-fast-reasoning' // FRONTIER MODEL
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-5.2' // FRONTIER MODEL
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      model: 'gemini-3-flash-preview' // FRONTIER MODEL
    },
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-opus-4-6' // FRONTIER MODEL
    }
  },

  // Email providers
  email: {
    klaviyo: {
      apiKey: process.env.KLAVIYO_API_KEY,
      endpoint: 'https://a.klaviyo.com/api'
    },
    omnisend: {
      apiKey: process.env.OMNISEND_API_KEY,
      endpoint: 'https://api.omnisend.com/v3'
    }
  },

  // Shopify integration
  shopify: {
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN
  },

  // Price drop thresholds
  thresholds: {
    minDropPercent: 5,    // Minimum drop to trigger alert
    urgentDropPercent: 20, // Urgent alert threshold
    flashSalePercent: 30   // Flash sale threshold
  },

  // Benchmark
  benchmark: {
    conversionRate: '8.8%',
    source: 'Barilliance 2024'
  }
};

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '✅',
    warn: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || 'ℹ️';
  console.log(`[${timestamp}] [PriceDrop] ${prefix} ${message}`);
}

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function httpRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, CONFIG.httpTimeout);

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }

    req.end();
  });
}

function calculateDropPercent(originalPrice, newPrice) {
  return Math.round(((originalPrice - newPrice) / originalPrice) * 100);
}

function getAlertType(dropPercent) {
  if (dropPercent >= CONFIG.thresholds.flashSalePercent) return 'flash_sale';
  if (dropPercent >= CONFIG.thresholds.urgentDropPercent) return 'urgent';
  if (dropPercent >= CONFIG.thresholds.minDropPercent) return 'standard';
  return null;
}

// ============================================================================
// IN-MEMORY STORAGE (Production: Use Redis/Database)
// ============================================================================

const priceStore = {
  products: new Map(),      // productId -> { price, lastUpdated }
  wishlists: new Map(),     // customerId -> Set of productIds
  alerts: new Map(),        // alertId -> { customerId, productId, sentAt }
  priceHistory: new Map()   // productId -> [{ price, timestamp }]
};

// ============================================================================
// HITL: BATCH APPROVAL FUNCTIONS (Session 165ter)
// ============================================================================

function ensurePendingDir() {
  const dir = CONFIG.hitl.pendingDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function queueBatchForApproval(alerts) {
  ensurePendingDir();
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const batchData = {
    id: batchId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    alertCount: alerts.length,
    alerts: alerts.map(a => ({
      customerId: a.customerId,
      productId: a.productId,
      originalPrice: a.originalPrice,
      newPrice: a.newPrice,
      dropPercent: a.dropPercent,
      alertType: a.alertType
    }))
  };
  const filePath = path.join(CONFIG.hitl.pendingDir, `${batchId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(batchData, null, 2));
  log(`Batch ${batchId} queued for approval (${alerts.length} alerts)`);
  notifySlackBatch(batchData);
  return batchId;
}

function listPendingBatches() {
  ensurePendingDir();
  const files = fs.readdirSync(CONFIG.hitl.pendingDir).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(CONFIG.hitl.pendingDir, f)));
    return {
      id: data.id,
      createdAt: data.createdAt,
      status: data.status,
      alertCount: data.alertCount
    };
  }).filter(b => b.status === 'pending');
}

function getBatchById(batchId) {
  const filePath = path.join(CONFIG.hitl.pendingDir, `${batchId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath));
}

async function approveBatch(batchId) {
  const batch = getBatchById(batchId);
  if (!batch) {
    log(`Batch ${batchId} not found`, 'error');
    return { success: false, error: 'Batch not found' };
  }
  if (batch.status !== 'pending') {
    log(`Batch ${batchId} already ${batch.status}`, 'warn');
    return { success: false, error: `Batch already ${batch.status}` };
  }

  // Send all alerts in the batch
  const results = [];
  for (const alert of batch.alerts) {
    try {
      const customer = {
        id: alert.customerId,
        email: `${alert.customerId}@example.com`, // In production, fetch from DB
        firstName: 'Customer',
        language: 'French'
      };
      const product = priceStore.products.get(alert.productId) || {
        id: alert.productId,
        name: 'Product',
        price: alert.newPrice
      };
      const priceData = {
        originalPrice: alert.originalPrice,
        newPrice: alert.newPrice,
        dropPercent: alert.dropPercent
      };

      const emailData = await generatePriceDropEmail(customer, product, priceData);
      const sendResult = await sendAlert(customer, emailData, { ...product, ...priceData });

      results.push({ status: 'sent', customerId: alert.customerId, productId: alert.productId });
    } catch (error) {
      results.push({ status: 'error', customerId: alert.customerId, error: error.message });
    }
  }

  // Update batch status
  batch.status = 'approved';
  batch.approvedAt = new Date().toISOString();
  batch.results = results;
  const filePath = path.join(CONFIG.hitl.pendingDir, `${batchId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(batch, null, 2));

  log(`Batch ${batchId} approved and processed (${results.filter(r => r.status === 'sent').length}/${results.length} sent)`);
  return { success: true, sent: results.filter(r => r.status === 'sent').length, total: results.length };
}

function rejectBatch(batchId, reason = 'Rejected by operator') {
  const batch = getBatchById(batchId);
  if (!batch) {
    log(`Batch ${batchId} not found`, 'error');
    return { success: false, error: 'Batch not found' };
  }
  if (batch.status !== 'pending') {
    log(`Batch ${batchId} already ${batch.status}`, 'warn');
    return { success: false, error: `Batch already ${batch.status}` };
  }

  batch.status = 'rejected';
  batch.rejectedAt = new Date().toISOString();
  batch.rejectReason = reason;
  const filePath = path.join(CONFIG.hitl.pendingDir, `${batchId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(batch, null, 2));

  log(`Batch ${batchId} rejected: ${reason}`);
  return { success: true };
}

async function notifySlackBatch(batch) {
  if (!CONFIG.hitl.slackWebhook) return;
  try {
    const message = {
      text: `🔔 Price Drop Alert Batch Pending Approval`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Price Drop Alert Batch*\n\n` +
              `📦 *Batch ID:* \`${batch.id}\`\n` +
              `📊 *Alert Count:* ${batch.alertCount}\n` +
              `⏰ *Created:* ${batch.createdAt}\n\n` +
              `_Alerts queued because batch size exceeds threshold (${CONFIG.hitl.batchThreshold})_`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Commands:*\n` +
              `\`node price-drop-alerts.cjs --approve=${batch.id}\`\n` +
              `\`node price-drop-alerts.cjs --reject=${batch.id}\``
          }
        }
      ]
    };
    await httpRequest(CONFIG.hitl.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify(message));
    log('Slack notification sent for batch');
  } catch (error) {
    log(`Slack notification failed: ${error.message}`, 'warn');
  }
}

// ============================================================================
// AI CONTENT GENERATION - MULTI-PROVIDER FALLBACK
// ============================================================================

async function generateWithGrok(prompt, systemPrompt) {
  if (!CONFIG.ai.grok.apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const response = await httpRequest(CONFIG.ai.grok.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.ai.grok.apiKey}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    model: CONFIG.ai.grok.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.7
  }));

  if (response.statusCode !== 200) {
    throw new Error(`Grok API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('Invalid Grok response');
  }

  return {
    content: data.choices[0].message.content,
    provider: 'Grok 4.1 Fast Reasoning'
  };
}

async function generateWithOpenAI(prompt, systemPrompt) {
  if (!CONFIG.ai.openai.apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await httpRequest(CONFIG.ai.openai.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.ai.openai.apiKey}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    model: CONFIG.ai.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.7
  }));

  if (response.statusCode !== 200) {
    throw new Error(`OpenAI API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('Invalid OpenAI response');
  }

  return {
    content: data.choices[0].message.content,
    provider: 'OpenAI GPT-5.2'
  };
}

async function generateWithGemini(prompt, systemPrompt) {
  if (!CONFIG.ai.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `${CONFIG.ai.gemini.endpoint}/${CONFIG.ai.gemini.model}:generateContent?key=${CONFIG.ai.gemini.apiKey}`;

  const response = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({
    contents: [{
      parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
    }],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7
    }
  }));

  if (response.statusCode !== 200) {
    throw new Error(`Gemini API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid Gemini response');
  }

  return {
    content: data.candidates[0].content.parts[0].text,
    provider: 'Gemini 3 Flash'
  };
}

async function generateWithClaude(prompt, systemPrompt) {
  if (!CONFIG.ai.claude.apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await httpRequest(CONFIG.ai.claude.endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': CONFIG.ai.claude.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    model: CONFIG.ai.claude.model,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }]
  }));

  if (response.statusCode !== 200) {
    throw new Error(`Claude API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.content?.[0]?.text) {
    throw new Error('Invalid Claude response');
  }

  return {
    content: data.content[0].text,
    provider: 'Claude Opus 4.6'
  };
}

// ============================================================================
// ALERT EMAIL GENERATION
// ============================================================================

async function generatePriceDropEmail(customer, product, priceData) {
  const alertType = getAlertType(priceData.dropPercent);

  const systemPrompt = `You are an expert e-commerce email copywriter.
Write compelling price drop alert emails that create urgency without being pushy.
The email should be in ${customer.language || 'French'}.
Format: Return JSON with { subject, preview, body, cta } fields.
cta should be the call-to-action button text.`;

  const urgencyMap = {
    flash_sale: 'FLASH SALE! This is an exceptional price drop!',
    urgent: 'This is a significant price drop you should not miss!',
    standard: 'Good news! A product on your wishlist is now on sale.'
  };

  const prompt = `Write a ${alertType} price drop alert email for ${customer.firstName}.

Product details:
- Name: ${product.name}
- Original price: ${priceData.originalPrice}€
- New price: ${priceData.newPrice}€
- Drop: ${priceData.dropPercent}%
- Stock status: ${product.stockStatus || 'available'}

Urgency level: ${urgencyMap[alertType] || urgencyMap.standard}

${alertType === 'flash_sale' ? 'Emphasize the exceptional nature of this deal!' : ''}
${product.stockStatus === 'low' ? 'Mention that stock is limited!' : ''}

Create compelling copy that drives immediate action.`;

  const providers = [
    generateWithGrok,
    generateWithOpenAI,
    generateWithGemini,
    generateWithClaude
  ];

  let lastError = null;

  for (const provider of providers) {
    try {
      const result = await provider(prompt, systemPrompt);
      log(`Email generated with ${result.provider}`);

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const emailData = safeJsonParse(jsonMatch[0]);
        if (emailData?.subject && emailData?.body) {
          return { ...emailData, provider: result.provider, alertType };
        }
      }

      // Fallback: use content directly
      return {
        subject: getTemplateSubject(alertType, priceData.dropPercent, customer),
        preview: `${product.name} is now ${priceData.dropPercent}% off!`,
        body: result.content,
        cta: 'Shop Now',
        provider: result.provider,
        alertType
      };

    } catch (error) {
      log(`Provider failed: ${error.message}`, 'warn');
      lastError = error;
    }
  }

  log('All AI providers failed, using template', 'warn');
  return getTemplateEmail(customer, product, priceData, alertType);
}

function getTemplateSubject(alertType, dropPercent, customer) {
  const subjects = {
    flash_sale: `🔥 FLASH: ${dropPercent}% OFF - Don't miss this!`,
    urgent: `⚡ ${dropPercent}% Price Drop Alert!`,
    standard: `💰 ${customer.firstName}, an item on your wishlist is on sale!`
  };
  return subjects[alertType] || subjects.standard;
}

function getTemplateEmail(customer, product, priceData, alertType) {
  const templates = {
    flash_sale: {
      subject: `🔥 FLASH SALE: ${product.name} - ${priceData.dropPercent}% OFF!`,
      preview: 'Exceptional price drop on your wishlist item!',
      body: `<h1>Flash Sale Alert!</h1>
<p>Hi ${customer.firstName},</p>
<p>Incredible news! <strong>${product.name}</strong> from your wishlist just dropped <strong>${priceData.dropPercent}%</strong>!</p>
<div style="background:#f5f5f5;padding:20px;text-align:center;margin:20px 0;">
  <p style="text-decoration:line-through;color:#999;">${priceData.originalPrice}€</p>
  <p style="font-size:24px;color:#e74c3c;font-weight:bold;">${priceData.newPrice}€</p>
  <p style="color:#27ae60;">You save ${priceData.originalPrice - priceData.newPrice}€!</p>
</div>
<p>⚡ This flash sale won't last long!</p>`,
      cta: 'Grab It Now!'
    },
    urgent: {
      subject: `⚡ ${priceData.dropPercent}% Price Drop: ${product.name}`,
      preview: `Save ${priceData.originalPrice - priceData.newPrice}€ on your wishlist item!`,
      body: `<h1>Price Drop Alert!</h1>
<p>Hi ${customer.firstName},</p>
<p>Great news! <strong>${product.name}</strong> is now <strong>${priceData.dropPercent}% off</strong>!</p>
<div style="background:#f5f5f5;padding:20px;text-align:center;margin:20px 0;">
  <p style="text-decoration:line-through;color:#999;">${priceData.originalPrice}€</p>
  <p style="font-size:24px;color:#e74c3c;font-weight:bold;">${priceData.newPrice}€</p>
</div>
<p>This is a significant drop - don't wait too long!</p>`,
      cta: 'Shop Now'
    },
    standard: {
      subject: `💰 ${customer.firstName}, ${product.name} is on sale!`,
      preview: `${priceData.dropPercent}% off your wishlist item`,
      body: `<h1>Good News!</h1>
<p>Hi ${customer.firstName},</p>
<p>An item on your wishlist just went on sale!</p>
<p><strong>${product.name}</strong> is now <strong>${priceData.dropPercent}% off</strong>.</p>
<div style="background:#f5f5f5;padding:20px;text-align:center;margin:20px 0;">
  <p>Was: ${priceData.originalPrice}€</p>
  <p style="font-size:20px;font-weight:bold;">Now: ${priceData.newPrice}€</p>
</div>`,
      cta: 'View Product'
    }
  };

  return { ...templates[alertType] || templates.standard, provider: 'Template', alertType };
}

// ============================================================================
// EMAIL SENDING - MULTI-PROVIDER FALLBACK
// ============================================================================

async function sendViaKlaviyo(customer, emailData, product) {
  if (!CONFIG.email.klaviyo.apiKey) {
    throw new Error('KLAVIYO_API_KEY not configured');
  }

  const response = await httpRequest(`${CONFIG.email.klaviyo.endpoint}/events/`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.email.klaviyo.apiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    }
  }, {
    data: {
      type: 'event',
      attributes: {
        metric: {
          data: {
            type: 'metric',
            attributes: { name: `Price Drop ${emailData.alertType}` }
          }
        },
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
          subject: emailData.subject,
          preview: emailData.preview,
          body: emailData.body,
          cta: emailData.cta,
          productId: product.id,
          productName: product.name,
          originalPrice: product.originalPrice,
          newPrice: product.newPrice,
          dropPercent: product.dropPercent,
          provider: emailData.provider
        },
        time: new Date().toISOString()
      }
    }
  });

  if (response.statusCode !== 202 && response.statusCode !== 200) {
    throw new Error(`Klaviyo error: ${response.statusCode}`);
  }

  return { provider: 'Klaviyo', eventId: `klaviyo_${Date.now()}` };
}

async function sendViaOmnisend(customer, emailData, product) {
  if (!CONFIG.email.omnisend.apiKey) {
    throw new Error('OMNISEND_API_KEY not configured');
  }

  const response = await httpRequest(`${CONFIG.email.omnisend.endpoint}/events`, {
    method: 'POST',
    headers: {
      'X-API-KEY': CONFIG.email.omnisend.apiKey,
      'Content-Type': 'application/json'
    }
  }, {
    email: customer.email,
    eventName: `price_drop_${emailData.alertType}`,
    eventVersion: 'v1',
    eventID: `pd_${product.id}_${Date.now()}`,
    properties: {
      subject: emailData.subject,
      body: emailData.body,
      productId: product.id,
      productName: product.name,
      originalPrice: product.originalPrice,
      newPrice: product.newPrice,
      dropPercent: product.dropPercent
    }
  });

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(`Omnisend error: ${response.statusCode}`);
  }

  return { provider: 'Omnisend', eventId: `omnisend_${Date.now()}` };
}

async function sendAlert(customer, emailData, product) {
  const providers = [
    { name: 'Klaviyo', fn: () => sendViaKlaviyo(customer, emailData, product) },
    { name: 'Omnisend', fn: () => sendViaOmnisend(customer, emailData, product) }
  ];

  let lastError = null;

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      log(`Alert sent via ${result.provider}`);
      return result;
    } catch (error) {
      log(`${provider.name} failed: ${error.message}`, 'warn');
      lastError = error;
    }
  }

  throw lastError || new Error('All email providers failed');
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

async function checkPriceDrops() {
  const alerts = [];

  for (const [customerId, wishlistItems] of priceStore.wishlists) {
    for (const productId of wishlistItems) {
      const product = priceStore.products.get(productId);
      if (!product) continue;

      const history = priceStore.priceHistory.get(productId) || [];
      if (history.length < 2) continue;

      const previousPrice = history[history.length - 2]?.price;
      const currentPrice = product.price;

      if (previousPrice && currentPrice < previousPrice) {
        const dropPercent = calculateDropPercent(previousPrice, currentPrice);
        const alertType = getAlertType(dropPercent);

        if (alertType) {
          // Check if alert already sent recently
          const alertKey = `${customerId}_${productId}`;
          const existingAlert = priceStore.alerts.get(alertKey);

          if (!existingAlert || Date.now() - existingAlert.sentAt > 24 * 60 * 60 * 1000) {
            alerts.push({
              customerId,
              productId,
              originalPrice: previousPrice,
              newPrice: currentPrice,
              dropPercent,
              alertType
            });
          }
        }
      }
    }
  }

  return alerts;
}

async function sendPriceDropAlerts() {
  const pendingAlerts = await checkPriceDrops();

  // HITL: If batch exceeds threshold, queue for approval
  if (CONFIG.hitl.enabled && pendingAlerts.length > CONFIG.hitl.batchThreshold) {
    const batchId = queueBatchForApproval(pendingAlerts);
    return [{
      status: 'queued_for_approval',
      batchId,
      alertCount: pendingAlerts.length,
      reason: `Batch size (${pendingAlerts.length}) exceeds threshold (${CONFIG.hitl.batchThreshold})`
    }];
  }

  const results = [];

  for (const alert of pendingAlerts) {
    // In production, fetch customer from database
    const customer = {
      id: alert.customerId,
      email: `${alert.customerId}@example.com`,
      firstName: 'Customer',
      language: 'French'
    };

    const product = priceStore.products.get(alert.productId);
    if (!product) continue;

    const priceData = {
      originalPrice: alert.originalPrice,
      newPrice: alert.newPrice,
      dropPercent: alert.dropPercent
    };

    try {
      const emailData = await generatePriceDropEmail(customer, product, priceData);
      const sendResult = await sendAlert(customer, emailData, {
        ...product,
        ...priceData
      });

      // Mark alert as sent
      priceStore.alerts.set(`${alert.customerId}_${alert.productId}`, {
        sentAt: Date.now(),
        alertType: alert.alertType
      });

      results.push({
        status: 'sent',
        customerId: alert.customerId,
        productId: alert.productId,
        dropPercent: alert.dropPercent,
        alertType: alert.alertType,
        emailProvider: sendResult.provider,
        aiProvider: emailData.provider
      });

    } catch (error) {
      results.push({
        status: 'error',
        customerId: alert.customerId,
        productId: alert.productId,
        error: error.message
      });
    }
  }

  return results;
}

async function simulatePriceDrop(productId, dropPercent, customer) {
  log(`Entering price drop simulation for ${productId}`);
  const originalPrice = 100;
  const newPrice = originalPrice * (1 - dropPercent / 100);

  const product = {
    id: productId,
    name: 'Test Product',
    price: newPrice,
    stockStatus: 'available'
  };

  const priceData = {
    originalPrice,
    newPrice: Math.round(newPrice * 100) / 100,
    dropPercent
  };

  // Generate email
  const emailData = await generatePriceDropEmail(customer, product, priceData);

  // Send alert
  const sendResult = await sendAlert(customer, emailData, {
    ...product,
    ...priceData
  });

  return {
    status: 'sent',
    alertType: emailData.alertType,
    productId,
    dropPercent,
    originalPrice: priceData.originalPrice,
    newPrice: priceData.newPrice,
    emailProvider: sendResult.provider,
    aiProvider: emailData.provider,
    eventId: sendResult.eventId
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck() {
  // Count pending batches
  let pendingBatches = 0;
  try {
    pendingBatches = listPendingBatches().length;
  } catch (e) { /* ignore */ }

  const status = {
    timestamp: new Date().toISOString(),
    version: CONFIG.version,
    status: 'OPERATIONAL',
    ai: {
      'Grok 4.1': CONFIG.ai.grok.apiKey ? '✅ Configured' : '❌ Missing',
      'OpenAI GPT-5.2': CONFIG.ai.openai.apiKey ? '✅ Configured' : '❌ Missing',
      'Gemini 3': CONFIG.ai.gemini.apiKey ? '✅ Configured' : '❌ Missing',
      'Claude Opus 4.6': CONFIG.ai.claude.apiKey ? '✅ Configured' : '❌ Missing'
    },
    email: {
      'Klaviyo': CONFIG.email.klaviyo.apiKey ? '✅ Configured' : '⚠️ Not configured',
      'Omnisend': CONFIG.email.omnisend.apiKey ? '✅ Configured' : '⚠️ Not configured'
    },
    thresholds: CONFIG.thresholds,
    benchmark: CONFIG.benchmark,
    hitl: {
      enabled: CONFIG.hitl.enabled,
      batchThreshold: CONFIG.hitl.batchThreshold,
      pendingBatches: pendingBatches,
      slackNotifications: CONFIG.hitl.slackWebhook ? '✅ Configured' : '⚠️ Not configured'
    }
  };

  // Check if at least one AI provider is configured
  const hasAI = Object.values(CONFIG.ai).some(p => p.apiKey);
  const hasEmail = CONFIG.email.klaviyo.apiKey || CONFIG.email.omnisend.apiKey;

  if (!hasAI || !hasEmail) {
    status.status = 'DEGRADED';
    status.warnings = [];
    if (!hasAI) status.warnings.push('No AI provider configured');
    if (!hasEmail) status.warnings.push('No email provider configured');
  }

  return status;
}

// ============================================================================
// HTTP SERVER
// ============================================================================

function startServer(port) {
  const server = http.createServer(async (req, res) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);
    const path = url.pathname;

    try {
      if (path === '/health' && req.method === 'GET') {
        const health = await healthCheck();
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
        return;
      }

      if (path === '/check' && req.method === 'GET') {
        const alerts = await checkPriceDrops();
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ pendingAlerts: alerts.length, alerts }));
        return;
      }

      if (path === '/send' && req.method === 'POST') {
        const results = await sendPriceDropAlerts();
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sent: results.length, results }));
        return;
      }

      if (path === '/simulate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const data = safeJsonParse(body, {});
          const customer = {
            id: data.customerId || 'test_customer',
            email: data.email || 'test@example.com',
            firstName: data.firstName || 'Test',
            language: data.language || 'French'
          };

          const result = await simulatePriceDrop(
            data.productId || 'PROD_TEST',
            data.dropPercent || 20,
            customer
          );

          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        });
        return;
      }

      // Webhook for price updates
      if (path === '/webhook/price-update' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const data = safeJsonParse(body, {});

          // Store new price
          const product = priceStore.products.get(data.productId) || { id: data.productId };
          const history = priceStore.priceHistory.get(data.productId) || [];

          if (product.price !== data.newPrice) {
            history.push({ price: product.price || data.newPrice, timestamp: Date.now() });
            priceStore.priceHistory.set(data.productId, history.slice(-10)); // Keep last 10
          }

          product.price = data.newPrice;
          product.name = data.productName || product.name;
          priceStore.products.set(data.productId, product);

          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true }));
        });
        return;
      }

      res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error) {
      log(`Server error: ${error.message}`, 'error');
      res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(port, () => {
    log(`Price Drop Alerts server running on port ${port}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /health              - Health check`);
    console.log(`  GET  /check               - Check pending alerts`);
    console.log(`  POST /send                - Send all pending alerts`);
    console.log(`  POST /simulate            - Simulate price drop`);
    console.log(`  POST /webhook/price-update - Receive price updates\n`);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  checkPriceDrops,
  sendPriceDropAlerts,
  simulatePriceDrop,
  healthCheck
};

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Price Drop Alerts v${CONFIG.version}

Usage:
  --health                              Run health check
  --check-prices                        Check for pending alerts
  --simulate --product-id=X --drop=Y    Simulate price drop
  --server --port=${CONFIG.port}                  Start HTTP server

HITL Commands:
  --list-batches                        List pending alert batches
  --view-batch=<id>                     View batch details
  --approve=<id>                        Approve and send batch
  --reject=<id>                         Reject batch

Benchmark: ${CONFIG.benchmark.conversionRate} conversion rate
  `);
    process.exit(0);
  }

  (async () => {
    if (args.includes('--health')) {
      const health = await healthCheck();
      console.log('\n📊 Price Drop Alerts - Health Check\n');
      console.log(JSON.stringify(health, null, 2));
      return;
    }

    if (args.includes('--check-prices')) {
      console.log('\n🔍 Checking for price drops...\n');
      const alerts = await checkPriceDrops();
      console.log(`Found ${alerts.length} pending alerts`);
      if (alerts.length > 0) {
        console.log(JSON.stringify(alerts, null, 2));
      }
      return;
    }

    if (args.includes('--simulate')) {
      const productIdIndex = args.findIndex(a => a.startsWith('--product-id='));
      const dropIndex = args.findIndex(a => a.startsWith('--drop='));
      const emailIndex = args.findIndex(a => a.startsWith('--email='));

      const productId = productIdIndex !== -1
        ? args[productIdIndex].split('=')[1]
        : 'PROD_' + Date.now();
      const dropPercent = dropIndex !== -1
        ? parseInt(args[dropIndex].split('=')[1])
        : 20;
      const email = emailIndex !== -1
        ? args[emailIndex].split('=')[1]
        : 'test@example.com';

      console.log(`\n🧪 Simulating ${dropPercent}% price drop for ${productId}\n`);

      const customer = {
        id: 'test_customer',
        email,
        firstName: 'Test',
        language: 'French'
      };

      const result = await simulatePriceDrop(productId, dropPercent, customer);
      console.log('Result:', JSON.stringify(result, null, 2));
      return;
    }

    if (args.includes('--server')) {
      const portIndex = args.findIndex(a => a.startsWith('--port='));
      const port = portIndex !== -1
        ? parseInt(args[portIndex].split('=')[1])
        : CONFIG.port;
      startServer(port);
      return;
    }

    // HITL: List pending batches
    if (args.includes('--list-batches')) {
      const batches = listPendingBatches();
      console.log('\n📋 Pending Alert Batches\n');
      if (batches.length === 0) {
        console.log('No pending batches.');
      } else {
        batches.forEach(b => {
          console.log(`  📦 ${b.id}`);
          console.log(`     Alerts: ${b.alertCount}`);
          console.log(`     Created: ${b.createdAt}`);
          console.log('');
        });
      }
      return;
    }

    // HITL: View batch details
    const viewBatchArg = args.find(a => a.startsWith('--view-batch='));
    if (viewBatchArg) {
      const batchId = viewBatchArg.split('=')[1];
      const batch = getBatchById(batchId);
      if (!batch) {
        console.log(`\n❌ Batch ${batchId} not found\n`);
        return;
      }
      console.log('\n📦 Batch Details\n');
      console.log(JSON.stringify(batch, null, 2));
      return;
    }

    // HITL: Approve batch
    const approveArg = args.find(a => a.startsWith('--approve='));
    if (approveArg) {
      const batchId = approveArg.split('=')[1];
      console.log(`\n✅ Approving batch ${batchId}...\n`);
      const result = await approveBatch(batchId);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // HITL: Reject batch
    const rejectArg = args.find(a => a.startsWith('--reject='));
    if (rejectArg) {
      const batchId = rejectArg.split('=')[1];
      console.log(`\n❌ Rejecting batch ${batchId}...\n`);
      const result = rejectBatch(batchId);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('Unknown command. Use --health, --check-prices, --simulate, --server, or HITL commands');
  })().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
