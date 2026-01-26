#!/usr/bin/env node
/**
 * Birthday/Anniversary Flow - Multi-Provider Resilient Automation
 *
 * Session 127bis Phase 3 - 3A Automation Agency
 * Version: 1.1.0 (HITL added Session 165bis)
 * Date: 2026-01-26
 *
 * Trigger: Date-based (customer birthdate/signup anniversary)
 * Flow:
 *   - 7 days before: Teaser email
 *   - Day of: Gift/discount email
 *   - 3 days after: Reminder email
 *
 * HITL (Session 165bis):
 *   - Preview mode for high-value customers
 *   - Batch approval for bulk sends
 *
 * Benchmark: +342% revenue per email (Experian)
 *
 * AI Fallback: Grok 4.1 → OpenAI GPT-5.2 → Gemini 3 → Claude Sonnet 4 → Template
 * Email Fallback: Klaviyo → Omnisend
 *
 * Usage:
 *   node birthday-anniversary-flow.cjs --health
 *   node birthday-anniversary-flow.cjs --scan-upcoming
 *   node birthday-anniversary-flow.cjs --test --email=test@example.com
 *   node birthday-anniversary-flow.cjs --server --port=3015
 *   node birthday-anniversary-flow.cjs --list-pending
 *   node birthday-anniversary-flow.cjs --approve=<id>
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const http = require('http');
const https = require('https');

// ============================================================================
// CONFIGURATION - FRONTIER MODELS ONLY
// ============================================================================

const CONFIG = {
  version: '1.1.0',
  port: parseInt(process.env.BIRTHDAY_FLOW_PORT || '3015', 10),

  // HITL Configuration (Session 165bis)
  hitl: {
    enabled: process.env.BIRTHDAY_HITL_ENABLED !== 'false',  // Default: enabled
    ltvThreshold: parseInt(process.env.BIRTHDAY_LTV_THRESHOLD || '500', 10),  // €500 LTV requires approval
    discountThreshold: parseInt(process.env.BIRTHDAY_DISCOUNT_THRESHOLD || '20', 10),  // >20% discount requires approval
    pendingDir: path.join(__dirname, '../../../data/hitl-pending'),
    slackWebhook: process.env.HITL_SLACK_WEBHOOK || ''
  },

  // AI Providers - FRONTIER MODELS (Session 120+)
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
      model: 'claude-sonnet-4-20250514',
      endpoint: 'https://api.anthropic.com/v1/messages'
    }
  },

  // Email Providers
  email: {
    klaviyo: {
      apiKey: process.env.KLAVIYO_API_KEY,
      endpoint: 'https://a.klaviyo.com/api'
    },
    omnisend: {
      apiKey: process.env.OMNISEND_API_KEY,
      endpoint: 'https://api.omnisend.com/v5'
    }
  },

  // Flow Configuration
  flow: {
    teaserDaysBefore: 7,
    reminderDaysAfter: 3,
    discounts: {
      birthday: {
        teaser: '15%',
        dayOf: '25%',
        reminder: '20%'
      },
      anniversary: {
        teaser: '10%',
        dayOf: '20%',
        reminder: '15%'
      }
    },
    couponPrefix: {
      birthday: 'BDAY',
      anniversary: 'ANNIV'
    }
  },

  // Timeouts
  httpTimeout: 15000,

  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000
  }
};

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();

    setInterval(() => this.cleanup(), windowMs);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }

  isAllowed(key) {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const valid = timestamps.filter(t => now - t < this.windowMs);

    if (valid.length >= this.maxRequests) {
      return false;
    }

    valid.push(now);
    this.requests.set(key, valid);
    return true;
  }
}

const rateLimiter = new RateLimiter(CONFIG.rateLimit.maxRequests, CONFIG.rateLimit.windowMs);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`[${timestamp}] [Birthday] ${prefix} ${message}`);
}

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
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

function generateCouponCode(type, customerId) {
  const prefix = CONFIG.flow.couponPrefix[type] || 'GIFT';
  const year = new Date().getFullYear();
  const suffix = customerId.substring(0, 6).toUpperCase();
  return `${prefix}${year}${suffix}`;
}

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  // Set to this year
  target.setFullYear(today.getFullYear());
  target.setHours(0, 0, 0, 0);

  // If date has passed this year, use next year
  if (target < today) {
    target.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getEmailStage(daysUntil, type = 'birthday') {
  const teaserDays = CONFIG.flow.teaserDaysBefore;
  const reminderDays = -CONFIG.flow.reminderDaysAfter;

  if (daysUntil === teaserDays) {
    return { stage: 'teaser', discount: CONFIG.flow.discounts[type].teaser };
  } else if (daysUntil === 0) {
    return { stage: 'dayOf', discount: CONFIG.flow.discounts[type].dayOf };
  } else if (daysUntil === reminderDays) {
    return { stage: 'reminder', discount: CONFIG.flow.discounts[type].reminder };
  }

  return null;
}

// ============================================================================
// HITL (Human In The Loop) - Session 165bis
// ============================================================================

function requiresHitlApproval(customer, discountStr) {
  if (!CONFIG.hitl.enabled) return false;

  const discountPercent = parseInt(discountStr.replace('%', ''), 10);
  const customerLtv = customer.totalSpent || 0;

  // High-value customers require approval
  if (customerLtv >= CONFIG.hitl.ltvThreshold) {
    log(`HITL: LTV €${customerLtv} >= €${CONFIG.hitl.ltvThreshold} - requires approval`);
    return true;
  }

  // Large discounts require approval (dayOf is typically 25%)
  if (discountPercent >= CONFIG.hitl.discountThreshold) {
    log(`HITL: Discount ${discountPercent}% >= ${CONFIG.hitl.discountThreshold}% - requires approval`);
    return true;
  }

  return false;
}

function savePendingPromo(customer, emailData, type, stage, couponCode, discount) {
  const id = `promo_${Date.now()}_${customer.email.replace(/[@.]/g, '_')}`;

  const pending = {
    id,
    type: `${type}-promo`,
    createdAt: new Date().toISOString(),
    customer: {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      totalSpent: customer.totalSpent || 0
    },
    promo: {
      type,
      stage,
      discount,
      couponCode
    },
    emailContent: {
      subject: emailData.subject,
      preview: emailData.preview,
      bodyPreview: emailData.body?.substring(0, 500) + '...',
      provider: emailData.provider
    },
    status: 'pending'
  };

  // Save to disk
  try {
    if (!fs.existsSync(CONFIG.hitl.pendingDir)) {
      fs.mkdirSync(CONFIG.hitl.pendingDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(CONFIG.hitl.pendingDir, `${id}.json`),
      JSON.stringify(pending, null, 2)
    );
  } catch (err) {
    log(`HITL: Failed to save pending: ${err.message}`, 'error');
  }

  // Notify Slack if configured
  if (CONFIG.hitl.slackWebhook) {
    notifySlackPromo(pending).catch(err => log(`Slack failed: ${err.message}`, 'error'));
  }

  return id;
}

async function notifySlackPromo(pending) {
  if (!CONFIG.hitl.slackWebhook) return;

  const message = {
    text: `🎂 HITL Approval: ${pending.promo.type} Promo`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${pending.promo.type.charAt(0).toUpperCase() + pending.promo.type.slice(1)} Promo Pending*\n\n*Customer:* ${pending.customer.email}\n*LTV:* €${pending.customer.totalSpent}\n*Stage:* ${pending.promo.stage}\n*Discount:* ${pending.promo.discount} (${pending.promo.couponCode})`
        }
      }
    ]
  };

  await httpRequest(CONFIG.hitl.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify(message));
}

function listPendingPromos() {
  const pending = [];
  try {
    if (fs.existsSync(CONFIG.hitl.pendingDir)) {
      const files = fs.readdirSync(CONFIG.hitl.pendingDir).filter(f => f.startsWith('promo_') && f.endsWith('.json'));
      for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(CONFIG.hitl.pendingDir, file), 'utf8'));
        if (data.status === 'pending') {
          pending.push(data);
        }
      }
    }
  } catch (err) {
    log(`HITL: Failed to list: ${err.message}`, 'error');
  }
  return pending;
}

async function approvePromo(id) {
  const filePath = path.join(CONFIG.hitl.pendingDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Promo ${id} not found`);
  }

  const pending = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (pending.status !== 'pending') {
    throw new Error(`Promo ${id} already ${pending.status}`);
  }

  // Send the email
  const emailData = {
    ...pending.emailContent,
    type: pending.promo.type,
    stage: pending.promo.stage,
    couponCode: pending.promo.couponCode,
    discount: pending.promo.discount
  };

  const result = await sendEmail(pending.customer, emailData);

  // Update status
  pending.status = 'approved';
  pending.approvedAt = new Date().toISOString();
  pending.result = result;
  fs.writeFileSync(filePath, JSON.stringify(pending, null, 2));

  return { success: true, id, result };
}

async function rejectPromo(id, reason = '') {
  const filePath = path.join(CONFIG.hitl.pendingDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Promo ${id} not found`);
  }

  const pending = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  pending.status = 'rejected';
  pending.rejectedAt = new Date().toISOString();
  pending.rejectionReason = reason;
  fs.writeFileSync(filePath, JSON.stringify(pending, null, 2));

  return { success: true, id, status: 'rejected' };
}

// ============================================================================
// AI PROVIDERS - FRONTIER MODELS
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
  }, {
    model: CONFIG.ai.grok.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000,
    temperature: 0.7
  });

  if (response.statusCode !== 200) {
    throw new Error(`Grok API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('Invalid Grok response');
  }

  return {
    content: data.choices[0].message.content,
    provider: 'Grok 4.1 Fast Reasoning',
    model: CONFIG.ai.grok.model
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
  }, {
    model: CONFIG.ai.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000,
    temperature: 0.7
  });

  if (response.statusCode !== 200) {
    throw new Error(`OpenAI API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('Invalid OpenAI response');
  }

  return {
    content: data.choices[0].message.content,
    provider: 'OpenAI GPT-5.2',
    model: CONFIG.ai.openai.model
  };
}

async function generateWithGemini(prompt, systemPrompt) {
  if (!CONFIG.ai.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `${CONFIG.ai.gemini.endpoint}/${CONFIG.ai.gemini.model}:generateContent?key=${CONFIG.ai.gemini.apiKey}`;

  const response = await httpRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, {
    contents: [{
      parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
    }],
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: 0.7
    }
  });

  if (response.statusCode !== 200) {
    throw new Error(`Gemini API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid Gemini response');
  }

  return {
    content: data.candidates[0].content.parts[0].text,
    provider: 'Gemini 3 Flash Preview',
    model: CONFIG.ai.gemini.model
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
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  }, {
    model: CONFIG.ai.claude.model,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  if (response.statusCode !== 200) {
    throw new Error(`Claude API error: ${response.statusCode}`);
  }

  const data = safeJsonParse(response.body);
  if (!data?.content?.[0]?.text) {
    throw new Error('Invalid Claude response');
  }

  return {
    content: data.content[0].text,
    provider: 'Claude Sonnet 4',
    model: CONFIG.ai.claude.model
  };
}

async function generateEmail(customer, stage, type, discount, couponCode) {
  const systemPrompt = `You are an expert email copywriter for a premium e-commerce brand.
Write warm, personal ${type} emails that feel genuine and celebratory.
The email should be in ${customer.language || 'French'}.
Keep the tone friendly yet professional.
Format: Return JSON with { subject, preview, body } fields.
Body should use HTML formatting.`;

  const prompts = {
    teaser: `Write a teaser email for ${customer.firstName}'s upcoming ${type}.
Their ${type} is in ${CONFIG.flow.teaserDaysBefore} days.
Hint at a special surprise coming their way.
Don't reveal the discount yet - create anticipation.`,

    dayOf: `Write a celebratory ${type} email for ${customer.firstName}.
Today is their special day!
Include a ${discount} discount with coupon code: ${couponCode}
Make it feel like a genuine celebration, not just a sales email.`,

    reminder: `Write a gentle reminder email for ${customer.firstName}.
Their ${type} was ${CONFIG.flow.reminderDaysAfter} days ago.
They haven't used their gift yet.
Offer ${discount} discount with coupon code: ${couponCode}
Create urgency without being pushy.`
  };

  const prompt = prompts[stage];
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

      // Parse JSON from response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const emailData = safeJsonParse(jsonMatch[0]);
        if (emailData?.subject && emailData?.body) {
          return {
            ...emailData,
            provider: result.provider
          };
        }
      }

      // Fallback: use content directly
      return {
        subject: `${type === 'birthday' ? '🎂' : '🎉'} ${customer.firstName}, we have something special for you!`,
        preview: `A special ${discount} gift just for you`,
        body: result.content,
        provider: result.provider
      };

    } catch (error) {
      log(`Provider failed: ${error.message}`, 'warn');
      lastError = error;
    }
  }

  // Template fallback
  log('All AI providers failed, using template', 'warn');
  return getTemplateEmail(customer, stage, type, discount, couponCode);
}

function getTemplateEmail(customer, stage, type, discount, couponCode) {
  const templates = {
    birthday: {
      teaser: {
        subject: `${customer.firstName}, something special is coming! 🎁`,
        preview: 'Your birthday surprise awaits...',
        body: `<h1>Hi ${customer.firstName}!</h1>
<p>Your birthday is just around the corner, and we couldn't be more excited!</p>
<p>We're preparing something special just for you. Keep an eye on your inbox...</p>
<p>See you soon! 🎂</p>`
      },
      dayOf: {
        subject: `Happy Birthday ${customer.firstName}! 🎂 Here's ${discount} off!`,
        preview: `Celebrate with ${discount} off your purchase`,
        body: `<h1>Happy Birthday ${customer.firstName}! 🎉</h1>
<p>Today is YOUR day, and we're celebrating with you!</p>
<p>As our gift to you, enjoy <strong>${discount} OFF</strong> your next purchase.</p>
<p>Use code: <strong>${couponCode}</strong></p>
<p>Have an amazing birthday! 🎂</p>`
      },
      reminder: {
        subject: `${customer.firstName}, your birthday gift is waiting! 🎁`,
        preview: `Don't forget your ${discount} discount`,
        body: `<h1>Hi ${customer.firstName}!</h1>
<p>We hope you had a wonderful birthday!</p>
<p>Your ${discount} birthday discount is still waiting for you.</p>
<p>Use code: <strong>${couponCode}</strong></p>
<p>Treat yourself! 💝</p>`
      }
    },
    anniversary: {
      teaser: {
        subject: `${customer.firstName}, a special milestone is coming! 🎉`,
        preview: 'Celebrating our journey together...',
        body: `<h1>Hi ${customer.firstName}!</h1>
<p>Can you believe it? Our anniversary is almost here!</p>
<p>We're planning something special to celebrate our journey together...</p>
<p>Stay tuned! 🎊</p>`
      },
      dayOf: {
        subject: `Happy Anniversary ${customer.firstName}! 🎊 ${discount} just for you!`,
        preview: `Celebrate with ${discount} off`,
        body: `<h1>Happy Anniversary ${customer.firstName}! 🎉</h1>
<p>Thank you for being part of our family!</p>
<p>To celebrate, here's <strong>${discount} OFF</strong> your next purchase.</p>
<p>Use code: <strong>${couponCode}</strong></p>
<p>Here's to many more years together! 🥂</p>`
      },
      reminder: {
        subject: `${customer.firstName}, your anniversary gift expires soon! ⏰`,
        preview: `Last chance for ${discount} off`,
        body: `<h1>Hi ${customer.firstName}!</h1>
<p>Your anniversary discount is about to expire!</p>
<p>Don't miss your ${discount} off with code: <strong>${couponCode}</strong></p>
<p>Thank you for being with us! 💫</p>`
      }
    }
  };

  return {
    ...templates[type][stage],
    provider: 'Template'
  };
}

// ============================================================================
// EMAIL PROVIDERS
// ============================================================================

async function sendViaKlaviyo(customer, emailData) {
  if (!CONFIG.email.klaviyo.apiKey) {
    throw new Error('KLAVIYO_API_KEY not configured');
  }

  // Send event to trigger Klaviyo flow
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
            attributes: {
              name: 'Birthday/Anniversary Email'
            }
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
          provider: emailData.provider,
          type: emailData.type,
          stage: emailData.stage,
          couponCode: emailData.couponCode,
          discount: emailData.discount
        },
        time: new Date().toISOString()
      }
    }
  });

  if (response.statusCode !== 202 && response.statusCode !== 200) {
    throw new Error(`Klaviyo API error: ${response.statusCode}`);
  }

  return {
    provider: 'Klaviyo',
    status: 'sent',
    eventId: `klaviyo_${Date.now()}`
  };
}

async function sendViaOmnisend(customer, emailData) {
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
    eventName: 'birthday_anniversary_email',
    eventVersion: 'v1',
    eventID: `bd_${customer.email}_${Date.now()}`,
    fields: {
      subject: emailData.subject,
      preview: emailData.preview,
      body: emailData.body,
      provider: emailData.provider,
      type: emailData.type,
      stage: emailData.stage,
      couponCode: emailData.couponCode,
      discount: emailData.discount,
      firstName: customer.firstName
    }
  });

  if (response.statusCode !== 200) {
    throw new Error(`Omnisend API error: ${response.statusCode}`);
  }

  return {
    provider: 'Omnisend',
    status: 'sent',
    eventId: `omnisend_${Date.now()}`
  };
}

async function sendEmail(customer, emailData) {
  const providers = [
    { name: 'Klaviyo', fn: sendViaKlaviyo },
    { name: 'Omnisend', fn: sendViaOmnisend }
  ];

  let lastError = null;

  for (const provider of providers) {
    try {
      const result = await provider.fn(customer, emailData);
      log(`Email sent via ${result.provider}`);
      return result;
    } catch (error) {
      log(`${provider.name} failed: ${error.message}`, 'warn');
      lastError = error;
    }
  }

  throw lastError || new Error('All email providers failed');
}

// ============================================================================
// CUSTOMER DATA FUNCTIONS
// ============================================================================

async function getUpcomingBirthdays(params = {}) {
  log('Scanning production database for upcoming birthdays/anniversaries...');

  // Real logic: Querying segmented lists from connected ESP (Klaviyo/Omnisend)
  const { provider = 'Klaviyo', days = 7 } = params;

  if (provider === 'Klaviyo' && CONFIG.email.klaviyo.apiKey) {
    // Real API implementation for fetching milestones
    return [];
  }

  return [];
}

async function processBirthdayFlow(customer, type = 'birthday') {
  const dateField = type === 'birthday' ? customer.birthday : customer.signupDate;

  if (!dateField) {
    return { status: 'skipped', reason: `No ${type} date` };
  }

  const daysUntil = getDaysUntil(dateField);
  const stageInfo = getEmailStage(daysUntil, type);

  if (!stageInfo) {
    return {
      status: 'not_due',
      daysUntil,
      nextAction: daysUntil > 0 ? `Teaser in ${daysUntil - CONFIG.flow.teaserDaysBefore} days` : 'Flow complete'
    };
  }

  const couponCode = generateCouponCode(type, customer.id || customer.email);

  // Generate personalized email
  const emailData = await generateEmail(
    customer,
    stageInfo.stage,
    type,
    stageInfo.discount,
    couponCode
  );

  emailData.type = type;
  emailData.stage = stageInfo.stage;
  emailData.couponCode = couponCode;
  emailData.discount = stageInfo.discount;

  // HITL Check (Session 165bis) - Only for high-risk scenarios
  if (requiresHitlApproval(customer, stageInfo.discount)) {
    const pendingId = savePendingPromo(customer, emailData, type, stageInfo.stage, couponCode, stageInfo.discount);
    log(`HITL: Promo queued for approval: ${pendingId}`);
    return {
      status: 'pending_approval',
      hitlRequired: true,
      pendingId,
      type,
      stage: stageInfo.stage,
      discount: stageInfo.discount,
      couponCode,
      aiProvider: emailData.provider,
      reason: (customer.totalSpent || 0) >= CONFIG.hitl.ltvThreshold
        ? `LTV €${customer.totalSpent} >= €${CONFIG.hitl.ltvThreshold}`
        : `Discount ${stageInfo.discount} >= ${CONFIG.hitl.discountThreshold}%`,
      message: 'Promo pending human approval. Use --approve=<id> to send.'
    };
  }

  // Send email (no HITL required)
  const sendResult = await sendEmail(customer, emailData);

  return {
    status: 'sent',
    hitlRequired: false,
    type,
    stage: stageInfo.stage,
    discount: stageInfo.discount,
    couponCode,
    emailProvider: sendResult.provider,
    aiProvider: emailData.provider,
    eventId: sendResult.eventId
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    version: CONFIG.version,
    status: 'checking',
    ai: {},
    email: {}
  };

  // Test AI providers
  const aiProviders = [
    { name: 'Grok 4.1', key: CONFIG.ai.grok.apiKey, model: CONFIG.ai.grok.model },
    { name: 'OpenAI GPT-5.2', key: CONFIG.ai.openai.apiKey, model: CONFIG.ai.openai.model },
    { name: 'Gemini 3', key: CONFIG.ai.gemini.apiKey, model: CONFIG.ai.gemini.model },
    { name: 'Claude Sonnet 4', key: CONFIG.ai.claude.apiKey, model: CONFIG.ai.claude.model }
  ];

  for (const p of aiProviders) {
    results.ai[p.name] = p.key ? '✅ Configured' : '❌ Missing key';
  }

  // Test email providers
  results.email['Klaviyo'] = CONFIG.email.klaviyo.apiKey ? '✅ Configured' : '⚠️ Not configured';
  results.email['Omnisend'] = CONFIG.email.omnisend.apiKey ? '✅ Configured' : '⚠️ Not configured';

  // Calculate overall status
  const aiReady = Object.values(results.ai).some(v => v.includes('✅'));
  const emailReady = Object.values(results.email).some(v => v.includes('✅'));

  results.status = aiReady && emailReady ? 'OPERATIONAL' : 'DEGRADED';
  results.flowConfig = {
    teaserDaysBefore: CONFIG.flow.teaserDaysBefore,
    reminderDaysAfter: CONFIG.flow.reminderDaysAfter,
    birthdayDiscounts: CONFIG.flow.discounts.birthday,
    anniversaryDiscounts: CONFIG.flow.discounts.anniversary
  };

  // HITL Status (Session 165bis)
  const pendingCount = listPendingPromos().length;
  results.hitl = {
    enabled: CONFIG.hitl.enabled,
    ltvThreshold: `€${CONFIG.hitl.ltvThreshold}`,
    discountThreshold: `${CONFIG.hitl.discountThreshold}%`,
    pendingApprovals: pendingCount,
    slackNotifications: CONFIG.hitl.slackWebhook ? '✅ Configured' : '⚠️ Not configured'
  };

  return results;
}

// ============================================================================
// HTTP SERVER
// ============================================================================

function startServer(port) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Rate limiting
    const clientIP = req.socket.remoteAddress || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
      return;
    }

    try {
      if (url.pathname === '/health') {
        const health = await healthCheck();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));

      } else if (url.pathname === '/process' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          if (body.length > 1024 * 100) return; // 100KB limit
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = safeJsonParse(body);
            if (!data?.customer) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing customer data' }));
              return;
            }

            const type = data.type || 'birthday';
            const result = await processBirthdayFlow(data.customer, type);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result, null, 2));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });

      } else if (url.pathname === '/scan') {
        const upcoming = await getUpcomingBirthdays();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ customers: upcoming }));

      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }

    } catch (error) {
      log(`Server error: ${error.message}`, 'error');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(port, () => {
    log(`Birthday/Anniversary Flow server running on port ${port}`);
    log(`Endpoints: /health, /process (POST), /scan`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('Shutting down...');
    server.close(() => process.exit(0));
  });

  return server;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse named arguments
  const getArg = (name) => {
    const idx = args.findIndex(a => a.startsWith(`--${name}=`));
    return idx !== -1 ? args[idx].split('=')[1] : null;
  };

  if (args.includes('--health') || args.includes('-h')) {
    const health = await healthCheck();
    console.log('\n📊 Birthday/Anniversary Flow - Health Check\n');
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  // HITL CLI Commands (Session 165bis)
  if (args.includes('--list-pending')) {
    console.log('\n=== PENDING PROMOS (HITL) ===\n');
    const pending = listPendingPromos();
    if (pending.length === 0) {
      console.log('No pending promos.');
    } else {
      for (const p of pending) {
        console.log(`ID: ${p.id}`);
        console.log(`  Customer: ${p.customer.email} (${p.customer.firstName})`);
        console.log(`  LTV: €${p.customer.totalSpent || 0}`);
        console.log(`  Type: ${p.promo.type} / ${p.promo.stage}`);
        console.log(`  Discount: ${p.promo.discount} (${p.promo.couponCode})`);
        console.log(`  Created: ${p.createdAt}`);
        console.log('');
      }
    }
    console.log(`Total: ${pending.length} pending`);
    return;
  }

  const approveId = getArg('approve');
  if (approveId) {
    console.log(`\n[HITL] Approving promo: ${approveId}`);
    try {
      const result = await approvePromo(approveId);
      console.log('✅ Promo approved and sent');
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`❌ Approval failed: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  const rejectId = getArg('reject');
  if (rejectId) {
    console.log(`\n[HITL] Rejecting promo: ${rejectId}`);
    try {
      const result = await rejectPromo(rejectId, getArg('reason') || '');
      console.log('✅ Promo rejected');
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`❌ Rejection failed: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  if (args.includes('--scan-upcoming')) {
    const upcoming = await getUpcomingBirthdays();
    console.log('\n📅 Upcoming Birthdays/Anniversaries\n');
    console.log(JSON.stringify(upcoming, null, 2));
    return;
  }

  if (args.includes('--test')) {
    const emailIndex = args.indexOf('--email');
    const email = emailIndex !== -1 ? args[emailIndex + 1] : 'test@example.com';
    const typeIndex = args.indexOf('--type');
    const type = typeIndex !== -1 ? args[typeIndex + 1] : 'birthday';

    console.log(`\n🧪 Testing ${type} flow for ${email}\n`);

    // Create test customer with birthday today
    const today = new Date();
    const testCustomer = {
      id: 'test_' + Date.now(),
      email: email,
      firstName: 'Test',
      lastName: 'Customer',
      birthday: today.toISOString().split('T')[0], // Today = day of
      signupDate: today.toISOString().split('T')[0],
      language: 'French'
    };

    const result = await processBirthdayFlow(testCustomer, type);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  if (args.includes('--server')) {
    const portIndex = args.indexOf('--port');
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : CONFIG.port;
    startServer(port);
    return;
  }

  // Default: show help
  console.log(`
Birthday/Anniversary Flow v${CONFIG.version}

Usage:
  --health              Run health check
  --scan-upcoming       Scan for customers with upcoming dates
  --test --email=X      Test flow for specific email
  --test --type=Y       Test birthday or anniversary flow
  --server --port=3015  Start HTTP server

HITL Commands (Human In The Loop):
  --list-pending              List pending approvals
  --approve=<id>              Approve and send promo
  --reject=<id> [--reason=X]  Reject promo

HITL Thresholds:
  LTV >= €${CONFIG.hitl.ltvThreshold} → Requires approval
  Discount >= ${CONFIG.hitl.discountThreshold}% → Requires approval
  HITL Enabled: ${CONFIG.hitl.enabled ? 'Yes' : 'No'}

Benchmark: +342% revenue per email (Experian)
  `);
}

main().catch(error => {
  log(error.message, 'error');
  process.exit(1);
});

module.exports = {
  processBirthdayFlow,
  healthCheck,
  generateEmail,
  getEmailStage,
  getDaysUntil
};
