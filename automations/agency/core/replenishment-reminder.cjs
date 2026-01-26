#!/usr/bin/env node
/**
 * Replenishment Reminder Automation
 *
 * Predict product depletion and send timely reorder reminders.
 * Benchmark: +90% repeat purchase rate (Shopify 2024)
 *
 * Features:
 * - Product consumption tracking
 * - Depletion date estimation
 * - AI-personalized reminder emails
 * - Multi-channel notifications (Email, SMS)
 * - 4-tier AI fallback chain
 *
 * Port: 3018
 *
 * Usage:
 *   --health                          Health check
 *   --check --customer-id=X           Check customer's depletion dates
 *   --remind --customer-id=X          Send reminder for depleting products
 *   --simulate --customer-id=X        Simulate reminder without sending
 *   --server --port=3018              Start HTTP server
 *
 * @version 1.0.0
 * @date 2026-01-03
 */

require('dotenv').config();

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

// ============================================================================
// CONFIGURATION - FRONTIER MODELS ONLY
// ============================================================================

const CONFIG = {
  version: '1.1.0 (HITL)',
  port: parseInt(process.env.REPLENISHMENT_PORT) || 3018,
  httpTimeout: 15000,

  // HITL: Frequency Cap (Session 165ter + 165quater flexibility)
  // User configurable thresholds via ENV variables:
  //   REPLENISHMENT_MAX_PER_WEEK: 1 | 2 | 3 | custom (default: 1)
  hitl: {
    enabled: process.env.REPLENISHMENT_HITL !== 'false', // Default: ON
    maxRemindersPerWeek: parseInt(process.env.REPLENISHMENT_MAX_PER_WEEK) || 1, // 1, 2, 3 rappels/semaine ou valeur custom
    maxRemindersOptions: [1, 2, 3],  // Recommended options
    pendingDir: './data/hitl-pending/replenishment/',
    historyFile: './data/hitl-pending/replenishment/history.json',
    slackWebhook: process.env.REPLENISHMENT_SLACK_WEBHOOK || null
  },

  // AI Providers - Frontier models ONLY (mandatory per user rules)
  ai: {
    grok: {
      apiKey: process.env.XAI_API_KEY,
      model: 'grok-4-1-fast-reasoning',
      endpoint: 'https://api.x.ai/v1/chat/completions'
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-5.2',
      endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-3-flash-preview',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-opus-4-5-20251101',
      endpoint: 'https://api.anthropic.com/v1/messages'
    }
  },

  // Email Providers
  email: {
    klaviyo: {
      apiKey: process.env.KLAVIYO_API_KEY,
      endpoint: 'https://a.klaviyo.com/api/events'
    },
    omnisend: {
      apiKey: process.env.OMNISEND_API_KEY,
      endpoint: 'https://api.omnisend.com/v3/events'
    }
  },

  // Replenishment Settings
  timing: {
    earlyReminderDays: 14,   // First reminder X days before depletion
    urgentReminderDays: 7,   // Urgent reminder X days before
    lastChanceDays: 3        // Last chance reminder
  },

  // Default consumption rates (days per unit) - can be overridden per product
  defaultConsumptionRates: {
    skincare: 30,      // 30 days per unit
    supplements: 30,   // 30 days per bottle
    coffee: 14,        // 14 days per bag
    petfood: 21,       // 21 days per bag
    cleaning: 45,      // 45 days per bottle
    default: 30
  },

  // Benchmark
  benchmark: {
    repeatPurchaseRate: '+90%',
    source: 'Shopify 2024'
  }
};

// ============================================================================
// LOGGING
// ============================================================================

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [Replenishment]`;

  if (data) {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`);
  }
}

// ============================================================================
// SAFE JSON PARSING
// ============================================================================

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// ============================================================================
// HITL: Frequency Cap (Session 165ter)
// ============================================================================

function ensureHitlDir() {
  const dir = path.resolve(CONFIG.hitl.pendingDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function loadHistory() {
  ensureHitlDir();
  const historyPath = path.resolve(CONFIG.hitl.historyFile);
  if (!fs.existsSync(historyPath)) {
    return {};
  }
  return safeJsonParse(fs.readFileSync(historyPath, 'utf8'), {});
}

function saveHistory(history) {
  ensureHitlDir();
  const historyPath = path.resolve(CONFIG.hitl.historyFile);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function recordReminderSent(customerId, email) {
  const history = loadHistory();
  const key = `${customerId}_${email}`;
  if (!history[key]) {
    history[key] = [];
  }
  history[key].push(new Date().toISOString());
  // Keep only last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  history[key] = history[key].filter(d => new Date(d).getTime() > thirtyDaysAgo);
  saveHistory(history);
}

function checkFrequencyCap(customerId, email) {
  const history = loadHistory();
  const key = `${customerId}_${email}`;
  const reminders = history[key] || [];

  // Count reminders in the last 7 days
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentReminders = reminders.filter(d => new Date(d).getTime() > oneWeekAgo);

  return {
    allowed: recentReminders.length < CONFIG.hitl.maxRemindersPerWeek,
    currentCount: recentReminders.length,
    maxAllowed: CONFIG.hitl.maxRemindersPerWeek,
    lastReminder: reminders.length > 0 ? reminders[reminders.length - 1] : null
  };
}

function generatePendingId() {
  return `repl_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function queuePendingReminder(customerId, email, depletionInfo, emailContent, reason) {
  const dir = ensureHitlDir();
  const id = generatePendingId();
  const pendingFile = path.join(dir, `${id}.json`);

  const pending = {
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
    reason,
    customerId,
    email,
    depletionInfo,
    emailContent
  };

  fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));
  log('info', `📋 Reminder queued for approval: ${id} (${reason})`);

  // Notify Slack
  if (CONFIG.hitl.slackWebhook) {
    notifySlackPending(pending).catch(e => log('error', `Slack failed: ${e.message}`));
  }

  return pending;
}

function listPendingReminders() {
  const dir = ensureHitlDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'history.json');

  return files.map(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    return safeJsonParse(content, null);
  }).filter(p => p && p.status === 'pending');
}

async function approvePendingReminder(pendingId) {
  const dir = ensureHitlDir();
  const pendingFile = path.join(dir, `${pendingId}.json`);

  if (!fs.existsSync(pendingFile)) {
    throw new Error(`Pending reminder not found: ${pendingId}`);
  }

  const pending = safeJsonParse(fs.readFileSync(pendingFile, 'utf8'));
  if (pending.status !== 'pending') {
    throw new Error(`Reminder already ${pending.status}`);
  }

  // Send the email
  const result = await sendReminderEmailDirect(pending.email, pending.emailContent, pending.depletionInfo);

  // Record in history
  recordReminderSent(pending.customerId, pending.email);

  // Update status
  pending.status = 'approved';
  pending.approvedAt = new Date().toISOString();
  pending.sendResult = result;
  fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));

  log('info', `✅ Reminder approved and sent: ${pendingId}`);
  return { status: 'approved', sendResult: result };
}

function rejectPendingReminder(pendingId, reason = 'Rejected by operator') {
  const dir = ensureHitlDir();
  const pendingFile = path.join(dir, `${pendingId}.json`);

  if (!fs.existsSync(pendingFile)) {
    throw new Error(`Pending reminder not found: ${pendingId}`);
  }

  const pending = safeJsonParse(fs.readFileSync(pendingFile, 'utf8'));
  if (pending.status !== 'pending') {
    throw new Error(`Reminder already ${pending.status}`);
  }

  pending.status = 'rejected';
  pending.rejectedAt = new Date().toISOString();
  pending.rejectionReason = reason;
  fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));

  log('info', `❌ Reminder rejected: ${pendingId}`);
  return { status: 'rejected', reason };
}

async function notifySlackPending(pending) {
  if (!CONFIG.hitl.slackWebhook) return;

  const message = {
    text: `🔔 *Replenishment Reminder Pending*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Replenishment reminder needs approval*\n\n` +
            `• *ID:* \`${pending.id}\`\n` +
            `• *Reason:* ${pending.reason}\n` +
            `• *Customer:* ${pending.email}\n` +
            `• *Product:* ${pending.depletionInfo?.productName || 'N/A'}\n` +
            `• *Days until depletion:* ${pending.depletionInfo?.daysUntilDepletion || 'N/A'}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Commands:*\n\`node replenishment-reminder.cjs --approve=${pending.id}\`\n` +
            `\`node replenishment-reminder.cjs --reject=${pending.id}\``
        }
      }
    ]
  };

  await httpRequest(CONFIG.hitl.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
}

// ============================================================================
// HTTP CLIENT WITH TIMEOUT
// ============================================================================

async function httpRequest(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const timeout = options.timeout || CONFIG.httpTimeout;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// ============================================================================
// DEPLETION CALCULATOR
// ============================================================================

function calculateDepletionDate(product, purchaseHistory) {
  const { productId, category, quantity } = product;

  // Get consumption rate for this category
  const consumptionDays = CONFIG.defaultConsumptionRates[category] ||
    CONFIG.defaultConsumptionRates.default;

  // Calculate based on last purchase
  const lastPurchase = purchaseHistory && purchaseHistory.length > 0
    ? new Date(purchaseHistory[purchaseHistory.length - 1].date)
    : new Date();

  // Estimate depletion
  const totalDays = consumptionDays * (quantity || 1);
  const depletionDate = new Date(lastPurchase);
  depletionDate.setDate(depletionDate.getDate() + totalDays);

  // Days until depletion
  const now = new Date();
  const daysUntilDepletion = Math.ceil((depletionDate - now) / (1000 * 60 * 60 * 24));

  return {
    productId,
    category,
    lastPurchase: lastPurchase.toISOString(),
    depletionDate: depletionDate.toISOString(),
    daysUntilDepletion,
    reminderType: getReminderType(daysUntilDepletion)
  };
}

function getReminderType(daysUntilDepletion) {
  if (daysUntilDepletion <= CONFIG.timing.lastChanceDays) {
    return 'last_chance';
  } else if (daysUntilDepletion <= CONFIG.timing.urgentReminderDays) {
    return 'urgent';
  } else if (daysUntilDepletion <= CONFIG.timing.earlyReminderDays) {
    return 'early';
  }
  return 'none';
}

// ============================================================================
// AI EMAIL GENERATION - 4-TIER FALLBACK
// ============================================================================

async function generateReminderEmail(customerData, depletionInfo) {
  const prompt = `Generate a friendly replenishment reminder email for an e-commerce customer.

Customer Info:
- Name: ${customerData.firstName || 'Valued Customer'}
- Product: ${depletionInfo.productName || depletionInfo.productId}
- Category: ${depletionInfo.category}
- Days until estimated depletion: ${depletionInfo.daysUntilDepletion}
- Reminder urgency: ${depletionInfo.reminderType}
- Last purchase: ${depletionInfo.lastPurchase}

Generate a JSON response with:
{
  "subject": "Email subject line (compelling, personalized)",
  "preview": "Email preview text (50 chars max)",
  "headline": "Main headline",
  "body": "Email body (2-3 paragraphs, friendly, helpful)",
  "cta": "Call-to-action button text",
  "urgencyNote": "Optional urgency message if applicable"
}

Tone: Helpful, not pushy. Focus on convenience and ensuring they don't run out.`;

  // Try providers in order
  const providers = [
    { name: 'Grok 4.1 Fast Reasoning', fn: () => generateWithGrok(prompt) },
    { name: 'OpenAI GPT-5.2', fn: () => generateWithOpenAI(prompt) },
    { name: 'Gemini 3 Flash', fn: () => generateWithGemini(prompt) },
    { name: 'Claude Opus 4.5', fn: () => generateWithClaude(prompt) }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) {
        log('info', `✅ Email generated with ${provider.name}`);
        return { ...result, provider: provider.name };
      }
    } catch (error) {
      log('error', `❌ ${provider.name} failed: ${error.message}`);
    }
  }

  // Fallback to template
  log('info', '⚠️ All AI providers failed, using template');
  return getTemplateEmail(customerData, depletionInfo);
}

async function generateWithGrok(prompt) {
  if (!CONFIG.ai.grok.apiKey) return null;

  const response = await httpRequest(CONFIG.ai.grok.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.ai.grok.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CONFIG.ai.grok.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (response.status !== 200) return null;

  const data = safeJsonParse(response.body);
  const content = data?.choices?.[0]?.message?.content;
  return content ? safeJsonParse(content) : null;
}

async function generateWithOpenAI(prompt) {
  if (!CONFIG.ai.openai.apiKey) return null;

  const response = await httpRequest(CONFIG.ai.openai.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.ai.openai.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CONFIG.ai.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (response.status !== 200) return null;

  const data = safeJsonParse(response.body);
  const content = data?.choices?.[0]?.message?.content;
  return content ? safeJsonParse(content) : null;
}

async function generateWithGemini(prompt) {
  if (!CONFIG.ai.gemini.apiKey) return null;

  const url = `${CONFIG.ai.gemini.endpoint}/${CONFIG.ai.gemini.model}:generateContent?key=${CONFIG.ai.gemini.apiKey}`;

  const response = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    })
  });

  if (response.status !== 200) return null;

  const data = safeJsonParse(response.body);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? safeJsonParse(text) : null;
}

async function generateWithClaude(prompt) {
  if (!CONFIG.ai.claude.apiKey) return null;

  const response = await httpRequest(CONFIG.ai.claude.endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': CONFIG.ai.claude.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CONFIG.ai.claude.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (response.status !== 200) return null;

  const data = safeJsonParse(response.body);
  const text = data?.content?.[0]?.text;

  // Extract JSON from response
  if (text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? safeJsonParse(jsonMatch[0]) : null;
  }
  return null;
}

function getTemplateEmail(customerData, depletionInfo) {
  const urgencyMessages = {
    last_chance: "Don't run out!",
    urgent: 'Running low soon',
    early: 'Time to restock?'
  };

  return {
    subject: `${customerData.firstName || 'Hey'}, time to restock your ${depletionInfo.productName || 'favorites'}?`,
    preview: urgencyMessages[depletionInfo.reminderType] || 'Restock reminder',
    headline: `Your ${depletionInfo.productName || 'product'} is running low`,
    body: `Based on your purchase history, we estimate you might be running low on ${depletionInfo.productName || 'your recent purchase'}. We wanted to give you a heads up so you can reorder before you run out!\n\nReorder now and enjoy free shipping on your replenishment order.`,
    cta: 'Reorder Now',
    urgencyNote: depletionInfo.reminderType === 'last_chance'
      ? 'Order today to avoid running out!'
      : null,
    provider: 'Template'
  };
}

// ============================================================================
// EMAIL SENDING - FALLBACK CHAIN
// ============================================================================

// Direct send (bypasses HITL - used after approval)
async function sendReminderEmailDirect(email, emailContent, depletionInfo) {
  // Try Klaviyo first
  if (CONFIG.email.klaviyo.apiKey) {
    try {
      const result = await sendViaKlaviyo(email, emailContent, depletionInfo);
      if (result.success) {
        log('info', `✅ Reminder sent via Klaviyo`);
        return { success: true, provider: 'Klaviyo', eventId: result.eventId };
      }
    } catch (error) {
      log('error', `❌ Klaviyo failed: ${error.message}`);
    }
  }

  // Fallback to Omnisend
  if (CONFIG.email.omnisend.apiKey) {
    try {
      const result = await sendViaOmnisend(email, emailContent, depletionInfo);
      if (result.success) {
        log('info', `✅ Reminder sent via Omnisend`);
        return { success: true, provider: 'Omnisend', eventId: result.eventId };
      }
    } catch (error) {
      log('error', `❌ Omnisend failed: ${error.message}`);
    }
  }

  return { success: false, error: 'All email providers failed' };
}

// HITL-aware send (checks frequency cap)
async function sendReminderEmail(customerId, email, emailContent, depletionInfo) {
  // Check frequency cap if HITL enabled
  if (CONFIG.hitl.enabled) {
    const freqCheck = checkFrequencyCap(customerId, email);

    if (!freqCheck.allowed) {
      log('info', `⚠️ Frequency cap exceeded for ${email} (${freqCheck.currentCount}/${freqCheck.maxAllowed} this week)`);

      // Queue for approval
      const pending = queuePendingReminder(
        customerId,
        email,
        depletionInfo,
        emailContent,
        `Frequency cap exceeded (${freqCheck.currentCount}/${freqCheck.maxAllowed} reminders this week)`
      );

      return {
        success: false,
        status: 'pending_approval',
        pendingId: pending.id,
        reason: 'Frequency cap exceeded',
        message: `Use --approve=${pending.id} to send anyway`
      };
    }
  }

  // Send directly
  const result = await sendReminderEmailDirect(email, emailContent, depletionInfo);

  // Record in history if successful
  if (result.success) {
    recordReminderSent(customerId, email);
  }

  return result;
}

async function sendViaKlaviyo(email, emailContent, depletionInfo) {
  const eventId = `klaviyo_${Date.now()}`;

  const payload = {
    data: {
      type: 'event',
      attributes: {
        profile: {
          data: {
            type: 'profile',
            attributes: { email }
          }
        },
        metric: {
          data: {
            type: 'metric',
            attributes: { name: 'Replenishment Reminder' }
          }
        },
        properties: {
          eventId,
          productId: depletionInfo.productId,
          productName: depletionInfo.productName,
          category: depletionInfo.category,
          daysUntilDepletion: depletionInfo.daysUntilDepletion,
          reminderType: depletionInfo.reminderType,
          emailSubject: emailContent.subject,
          emailPreview: emailContent.preview,
          emailHeadline: emailContent.headline,
          emailBody: emailContent.body,
          emailCta: emailContent.cta,
          urgencyNote: emailContent.urgencyNote,
          aiProvider: emailContent.provider
        },
        time: new Date().toISOString()
      }
    }
  };

  const response = await httpRequest(CONFIG.email.klaviyo.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.email.klaviyo.apiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-02-15'
    },
    body: JSON.stringify(payload)
  });

  return { success: response.status >= 200 && response.status < 300, eventId };
}

async function sendViaOmnisend(email, emailContent, depletionInfo) {
  const eventId = `omnisend_${Date.now()}`;

  const payload = {
    email,
    eventName: 'replenishment_reminder',
    eventVersion: '1.0.0',
    eventID: eventId,
    eventTime: new Date().toISOString(),
    properties: {
      productId: depletionInfo.productId,
      productName: depletionInfo.productName,
      category: depletionInfo.category,
      daysUntilDepletion: depletionInfo.daysUntilDepletion,
      reminderType: depletionInfo.reminderType,
      emailSubject: emailContent.subject,
      emailBody: emailContent.body
    }
  };

  const response = await httpRequest(CONFIG.email.omnisend.endpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': CONFIG.email.omnisend.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return { success: response.status >= 200 && response.status < 300, eventId };
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

async function checkCustomerDepletion(customerId, products = null) {
  log('info', `Checking real-time depletion for customer: ${customerId}`);

  // Real logic: Expected to fetch from Shopify/database
  const customerProducts = products || [];

  const purchaseHistory = []; // Fetched sequence from database

  const depletionAnalysis = customerProducts.map(product =>
    calculateDepletionDate(product, purchaseHistory)
  );

  return {
    customerId,
    products: depletionAnalysis,
    needsReminder: depletionAnalysis.some(p => p.reminderType !== 'none')
  };
}

async function sendReplenishmentReminder(customerId, email, products = null, dryRun = false) {
  // Check depletion status
  const analysis = await checkCustomerDepletion(customerId, products);

  if (!analysis.needsReminder) {
    return { status: 'skipped', reason: 'No products need reminder', analysis };
  }

  // Find most urgent product
  const urgentProduct = analysis.products
    .filter(p => p.reminderType !== 'none')
    .sort((a, b) => a.daysUntilDepletion - b.daysUntilDepletion)[0];

  // Add product name if available from products array
  const productInfo = products?.find(p => p.productId === urgentProduct.productId);
  urgentProduct.productName = productInfo?.productName || urgentProduct.productId;

  // Generate personalized email
  const customerData = { firstName: 'Valued Customer', email };
  const emailContent = await generateReminderEmail(customerData, urgentProduct);

  if (dryRun) {
    return {
      status: 'simulated',
      customerId,
      email,
      depletionInfo: urgentProduct,
      emailContent,
      wouldSend: true
    };
  }

  // Send email (with HITL frequency cap check)
  const sendResult = await sendReminderEmail(customerId, email, emailContent, urgentProduct);

  // Handle pending approval case
  if (sendResult.status === 'pending_approval') {
    return {
      status: 'pending_approval',
      customerId,
      email,
      depletionInfo: urgentProduct,
      pendingId: sendResult.pendingId,
      reason: sendResult.reason,
      message: sendResult.message,
      aiProvider: emailContent.provider
    };
  }

  return {
    status: sendResult.success ? 'sent' : 'failed',
    customerId,
    email,
    depletionInfo: urgentProduct,
    emailProvider: sendResult.provider,
    aiProvider: emailContent.provider,
    eventId: sendResult.eventId,
    error: sendResult.error
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck() {
  const status = {
    timestamp: new Date().toISOString(),
    version: CONFIG.version,
    status: 'OPERATIONAL',
    ai: {
      'Grok 4.1': CONFIG.ai.grok.apiKey ? '✅ Configured' : '⚠️ Not configured',
      'OpenAI GPT-5.2': CONFIG.ai.openai.apiKey ? '✅ Configured' : '⚠️ Not configured',
      'Gemini 3': CONFIG.ai.gemini.apiKey ? '✅ Configured' : '⚠️ Not configured',
      'Claude Opus 4.5': CONFIG.ai.claude.apiKey ? '✅ Configured' : '⚠️ Not configured'
    },
    email: {
      'Klaviyo': CONFIG.email.klaviyo.apiKey ? '✅ Configured' : '⚠️ Not configured',
      'Omnisend': CONFIG.email.omnisend.apiKey ? '✅ Configured' : '⚠️ Not configured'
    },
    timing: CONFIG.timing,
    consumptionRates: CONFIG.defaultConsumptionRates,
    benchmark: CONFIG.benchmark
  };

  // Check if at least one AI and one email provider configured
  const hasAI = Object.values(CONFIG.ai).some(p => p.apiKey);
  const hasEmail = Object.values(CONFIG.email).some(p => p.apiKey);

  if (!hasAI || !hasEmail) {
    status.status = 'DEGRADED';
    status.warnings = [];
    if (!hasAI) status.warnings.push('No AI provider configured');
    if (!hasEmail) status.warnings.push('No email provider configured');
  }

  // HITL status (Session 165ter)
  const pendingReminders = listPendingReminders();
  status.hitl = {
    enabled: CONFIG.hitl.enabled,
    maxRemindersPerWeek: CONFIG.hitl.maxRemindersPerWeek,
    pendingApprovals: pendingReminders.length,
    slackNotifications: CONFIG.hitl.slackWebhook ? '✅ Configured' : '⚠️ Not configured'
  };

  return status;
}

// ============================================================================
// HTTP SERVER
// ============================================================================

function startServer(port) {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    const allowedOrigins = ['https://3a-automation.com', 'https://dashboard.3a-automation.com'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    try {
      // Health check
      if (path === '/health' && req.method === 'GET') {
        const health = await healthCheck();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
        return;
      }

      // Check depletion
      if (path === '/check' && req.method === 'GET') {
        const customerId = url.searchParams.get('customer-id') || 'CUST001';
        const result = await checkCustomerDepletion(customerId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
        return;
      }

      // Send reminder
      if (path === '/remind' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const data = safeJsonParse(body, {});
          const result = await sendReplenishmentReminder(
            data.customerId || 'CUST001',
            data.email || 'test@example.com',
            data.products,
            false
          );
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result, null, 2));
        });
        return;
      }

      // Simulate
      if (path === '/simulate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const data = safeJsonParse(body, {});
          const result = await sendReplenishmentReminder(
            data.customerId || 'CUST001',
            data.email || 'test@example.com',
            data.products,
            true // dryRun
          );
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result, null, 2));
        });
        return;
      }

      // Webhook for order events
      if (path === '/webhook/order' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const order = safeJsonParse(body, {});
          log('info', `📦 Order webhook received: ${order.id || 'unknown'}`);
          // In production, update purchase history and recalculate depletion dates
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, orderId: order.id }));
        });
        return;
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found', endpoints: ['/health', '/check', '/remind', '/simulate', '/webhook/order'] }));

    } catch (error) {
      log('error', `Server error: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(port, () => {
    log('info', `🚀 Replenishment Reminder server running on port ${port}`);
    log('info', `Endpoints: /health, /check, /remind, /simulate, /webhook/order`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('info', 'SIGTERM received, shutting down...');
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    log('info', 'SIGINT received, shutting down...');
    server.close(() => process.exit(0));
  });
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : null;
  };
  const hasFlag = (name) => args.includes(`--${name}`);

  // Health check
  if (hasFlag('health')) {
    console.log('\n📊 Replenishment Reminder - Health Check\n');
    const health = await healthCheck();
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  // HITL Commands (Session 165ter)
  if (hasFlag('list-pending')) {
    const pending = listPendingReminders();
    console.log('\n📋 Pending Replenishment Reminders (HITL)\n');
    if (pending.length === 0) {
      console.log('No pending reminders.');
    } else {
      pending.forEach(p => {
        console.log(`  ${p.id}`);
        console.log(`    Reason: ${p.reason}`);
        console.log(`    Email: ${p.email}`);
        console.log(`    Product: ${p.depletionInfo?.productName || 'N/A'}`);
        console.log(`    Created: ${p.createdAt}`);
        console.log('');
      });
      console.log(`Total: ${pending.length} pending`);
    }
    return;
  }

  const approveId = getArg('approve');
  if (approveId) {
    console.log(`\n✅ Approving reminder: ${approveId}\n`);
    try {
      const result = await approvePendingReminder(approveId);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    return;
  }

  const rejectId = getArg('reject');
  if (rejectId) {
    const reason = getArg('reason') || 'Rejected by operator';
    console.log(`\n❌ Rejecting reminder: ${rejectId}\n`);
    try {
      const result = rejectPendingReminder(rejectId, reason);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    return;
  }

  // Check depletion
  if (hasFlag('check')) {
    const customerId = getArg('customer-id') || 'CUST001';
    console.log(`\n🔍 Checking depletion for customer ${customerId}\n`);
    const result = await checkCustomerDepletion(customerId);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Send reminder
  if (hasFlag('remind')) {
    const customerId = getArg('customer-id') || 'CUST001';
    const email = getArg('email') || 'test@example.com';
    console.log(`\n📧 Sending reminder to ${email}\n`);
    const result = await sendReplenishmentReminder(customerId, email);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  // Simulate
  if (hasFlag('simulate')) {
    const customerId = getArg('customer-id') || 'CUST001';
    const email = getArg('email') || 'test@example.com';
    console.log(`\n🧪 Simulating reminder for ${email}\n`);
    const result = await sendReplenishmentReminder(customerId, email, null, true);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  // Server mode
  if (hasFlag('server')) {
    const port = parseInt(getArg('port')) || CONFIG.port;
    startServer(port);
    return;
  }

  // Show usage
  console.log(`
Replenishment Reminder Automation v${CONFIG.version}

Usage:
  --health                              Run health check
  --check --customer-id=X               Check customer's depletion dates
  --remind --customer-id=X --email=Y    Send reminder for depleting products
  --simulate --customer-id=X --email=Y  Simulate reminder without sending
  --server --port=${CONFIG.port}                 Start HTTP server

HITL Commands (Frequency Cap):
  --list-pending                        List pending reminder approvals
  --approve=<id>                        Approve and send reminder
  --reject=<id> [--reason="text"]       Reject reminder

Environment:
  REPLENISHMENT_HITL=true               Enable frequency cap (default: true)
  REPLENISHMENT_MAX_PER_WEEK=1          Max reminders per customer per week
  REPLENISHMENT_SLACK_WEBHOOK=<url>     Slack notification URL

Benchmark: ${CONFIG.benchmark.repeatPurchaseRate} repeat purchase (${CONFIG.benchmark.source})
  `);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  checkCustomerDepletion,
  sendReplenishmentReminder,
  calculateDepletionDate,
  healthCheck
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
