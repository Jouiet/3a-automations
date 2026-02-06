#!/usr/bin/env node
/**
 * Referral Program Automation - Multi-Provider Resilient
 *
 * Session 127bis Phase 3 - 3A Automation Agency
 * Version: 1.0.0
 * Date: 2026-01-03
 *
 * Features:
 *   - Unique referral link generation
 *   - Double-sided rewards (referrer + referee)
 *   - AI-powered referral email personalization
 *   - Tracking dashboard with analytics
 *   - Multi-tier rewards based on referral count
 *
 * Benchmark: +16% CLV, -80% acquisition cost (ReferralCandy)
 *
 * AI Fallback: Grok 4.1 → OpenAI GPT-5.2 → Gemini 3 → Claude Opus 4.5 → Template
 * Email Fallback: Klaviyo → Omnisend
 *
 * Usage:
 *   node referral-program-automation.cjs --health
 *   node referral-program-automation.cjs --generate --customer-id=CUST123
 *   node referral-program-automation.cjs --process-referral --code=REF123 --new-customer=email@test.com
 *   node referral-program-automation.cjs --leaderboard
 *   node referral-program-automation.cjs --server --port=3016
 */

require('dotenv').config();

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION - FRONTIER MODELS ONLY
// ============================================================================

const CONFIG = {
  version: '2.1.0 (HITL)',
  port: parseInt(process.env.REFERRAL_PROGRAM_PORT || '3016', 10),
  agenticMode: process.argv.includes('--agentic'),

  // HITL: Email Preview Mode (Session 165ter)
  hitl: {
    previewMode: process.env.REFERRAL_PREVIEW_MODE !== 'false', // Default: ON
    pendingDir: './data/hitl-pending/referral/',
    slackWebhook: process.env.REFERRAL_SLACK_WEBHOOK || null,
    autoApproveWelcome: process.env.REFERRAL_AUTO_APPROVE_WELCOME === 'true' // Welcome emails can auto-send
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
      model: 'claude-opus-4-6',
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

  // ─────────────────────────────────────────────────────────────────────────
  // REFERRAL CONFIGURATION - Session 165sexies (Full Flexibility)
  // All reward tiers and discounts are configurable via ENV variables
  // ─────────────────────────────────────────────────────────────────────────
  referral: {
    // Reward tiers - FULLY CONFIGURABLE
    rewards: {
      referrer: {
        // Tier 1: First successful referral
        // ENV: REFERRAL_TIER1_MIN=1 (options: 1, 2, 3)
        // ENV: REFERRAL_TIER1_DISCOUNT=10 (options: 5, 10, 12, 15)
        tier1: {
          minReferrals: parseInt(process.env.REFERRAL_TIER1_MIN) || 1,
          discount: `${parseInt(process.env.REFERRAL_TIER1_DISCOUNT) || 10}%`,
          type: 'percentage'
        },
        // Tier 2: Growing ambassador
        // ENV: REFERRAL_TIER2_MIN=5 (options: 3, 5, 7, 10)
        // ENV: REFERRAL_TIER2_DISCOUNT=15 (options: 10, 12, 15, 18, 20)
        tier2: {
          minReferrals: parseInt(process.env.REFERRAL_TIER2_MIN) || 5,
          discount: `${parseInt(process.env.REFERRAL_TIER2_DISCOUNT) || 15}%`,
          type: 'percentage'
        },
        // Tier 3: Power referrer
        // ENV: REFERRAL_TIER3_MIN=10 (options: 8, 10, 15, 20)
        // ENV: REFERRAL_TIER3_DISCOUNT=20 (options: 15, 18, 20, 22, 25)
        tier3: {
          minReferrals: parseInt(process.env.REFERRAL_TIER3_MIN) || 10,
          discount: `${parseInt(process.env.REFERRAL_TIER3_DISCOUNT) || 20}%`,
          type: 'percentage'
        },
        // Tier 4: Champion ambassador
        // ENV: REFERRAL_TIER4_MIN=25 (options: 20, 25, 30, 50)
        // ENV: REFERRAL_TIER4_DISCOUNT=25 (options: 20, 25, 30, 35)
        // ENV: REFERRAL_TIER4_BONUS=50 (options: 25, 50, 75, 100)
        tier4: {
          minReferrals: parseInt(process.env.REFERRAL_TIER4_MIN) || 25,
          discount: `${parseInt(process.env.REFERRAL_TIER4_DISCOUNT) || 25}%`,
          type: 'percentage',
          bonus: `€${parseInt(process.env.REFERRAL_TIER4_BONUS) || 50} credit`
        }
      },
      // Referee (new customer) discount - FLEXIBLE
      // ENV: REFERRAL_REFEREE_DISCOUNT=15 (options: 10, 12, 15, 20, 25)
      referee: {
        firstPurchase: {
          discount: `${parseInt(process.env.REFERRAL_REFEREE_DISCOUNT) || 15}%`,
          type: 'percentage'
        }
      },
      // Options for UI/configuration display
      options: {
        tier1MinOptions: [1, 2, 3],
        tier1DiscountOptions: [5, 10, 12, 15],
        tier2MinOptions: [3, 5, 7, 10],
        tier2DiscountOptions: [10, 12, 15, 18, 20],
        tier3MinOptions: [8, 10, 15, 20],
        tier3DiscountOptions: [15, 18, 20, 22, 25],
        tier4MinOptions: [20, 25, 30, 50],
        tier4DiscountOptions: [20, 25, 30, 35],
        tier4BonusOptions: [25, 50, 75, 100],
        refereeDiscountOptions: [10, 12, 15, 20, 25]
      }
    },
    // Link settings
    linkPrefix: 'ref',
    codeLength: 8,
    baseUrl: process.env.STORE_URL || 'https://store.example.com',
    // Expiry - FLEXIBLE
    // ENV: REFERRAL_CODE_EXPIRY_DAYS=365 (options: 90, 180, 365, 730)
    // ENV: REFERRAL_REWARD_EXPIRY_DAYS=30 (options: 14, 30, 60, 90)
    codeExpiryDays: parseInt(process.env.REFERRAL_CODE_EXPIRY_DAYS) || 365,
    rewardExpiryDays: parseInt(process.env.REFERRAL_REWARD_EXPIRY_DAYS) || 30,
    expiryOptions: {
      codeExpiry: [90, 180, 365, 730],
      rewardExpiry: [14, 30, 60, 90]
    }
  },

  // Agentic Reflection Loop - FLEXIBLE (Session 165sexies)
  // ENV: REFERRAL_AGENTIC_QUALITY_THRESHOLD=8 (options: 6, 7, 8, 9)
  agenticQualityThreshold: parseInt(process.env.REFERRAL_AGENTIC_QUALITY_THRESHOLD) || 8,
  agenticQualityOptions: [6, 7, 8, 9],

  // Timeouts
  httpTimeout: 15000,

  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000
  }
};

// ============================================================================
// IN-MEMORY STORE (Replace with database in production)
// ============================================================================

const referralStore = {
  codes: new Map(),      // code -> { customerId, created, referrals: [] }
  customers: new Map(),  // customerId -> { code, totalReferrals, rewards: [] }
  pending: new Map()     // pendingId -> { referrerCode, refereeEmail, created }
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
// HITL (Human In The Loop) - Email Preview Mode (Session 165ter)
// ============================================================================

function ensurePendingDir() {
  const dir = path.resolve(CONFIG.hitl.pendingDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function generatePendingId() {
  return `ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function queuePendingEmail(customer, emailData, eventType) {
  const dir = ensurePendingDir();
  const id = generatePendingId();
  const pendingFile = path.join(dir, `${id}.json`);

  const pending = {
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
    type: eventType,
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName
    },
    email: {
      subject: emailData.subject,
      preview: emailData.preview,
      body: emailData.body,
      provider: emailData.provider
    }
  };

  fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));
  log(`📋 Email queued for approval: ${id} (${eventType})`);

  // Notify via Slack if configured
  if (CONFIG.hitl.slackWebhook) {
    notifySlackPending(pending).catch(e => log(`Slack notification failed: ${e.message}`, 'warn'));
  }

  return pending;
}

function listPendingEmails() {
  const dir = ensurePendingDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  return files.map(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    return JSON.parse(content);
  }).filter(p => p.status === 'pending');
}

async function approvePendingEmail(pendingId) {
  const dir = ensurePendingDir();
  const pendingFile = path.join(dir, `${pendingId}.json`);

  if (!fs.existsSync(pendingFile)) {
    throw new Error(`Pending email not found: ${pendingId}`);
  }

  const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));

  if (pending.status !== 'pending') {
    throw new Error(`Email already ${pending.status}`);
  }

  // Actually send the email
  const customer = pending.customer;
  const emailData = pending.email;
  const result = await sendEmailDirect(customer, emailData, pending.type);

  // Update status
  pending.status = 'approved';
  pending.approvedAt = new Date().toISOString();
  pending.sendResult = result;
  fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));

  log(`✅ Email approved and sent: ${pendingId}`);
  return { status: 'approved', sendResult: result };
}

function rejectPendingEmail(pendingId, reason = 'Rejected by operator') {
  const dir = ensurePendingDir();
  const pendingFile = path.join(dir, `${pendingId}.json`);

  if (!fs.existsSync(pendingFile)) {
    throw new Error(`Pending email not found: ${pendingId}`);
  }

  const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));

  if (pending.status !== 'pending') {
    throw new Error(`Email already ${pending.status}`);
  }

  pending.status = 'rejected';
  pending.rejectedAt = new Date().toISOString();
  pending.rejectionReason = reason;
  fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2));

  log(`❌ Email rejected: ${pendingId} - ${reason}`);
  return { status: 'rejected', reason };
}

async function notifySlackPending(pending) {
  if (!CONFIG.hitl.slackWebhook) return;

  const message = {
    text: `🔔 *Referral Email Pending Approval*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New referral email requires approval*\n\n` +
            `• *ID:* \`${pending.id}\`\n` +
            `• *Type:* ${pending.type}\n` +
            `• *To:* ${pending.customer.email}\n` +
            `• *Subject:* ${pending.email.subject}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Commands:*\n\`node referral-program-automation.cjs --approve=${pending.id}\`\n` +
            `\`node referral-program-automation.cjs --reject=${pending.id}\``
        }
      }
    ]
  };

  await httpRequest(CONFIG.hitl.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, message);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`[${timestamp}] [Referral] ${prefix} ${message}`);
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

function generateReferralCode(customerId) {
  const hash = crypto.createHash('sha256')
    .update(customerId + Date.now().toString())
    .digest('hex')
    .substring(0, CONFIG.referral.codeLength)
    .toUpperCase();

  return `${CONFIG.referral.linkPrefix.toUpperCase()}${hash}`;
}

function generateReferralLink(code) {
  return `${CONFIG.referral.baseUrl}?ref=${code}`;
}

function getCurrentTier(referralCount) {
  const tiers = CONFIG.referral.rewards.referrer;

  if (referralCount >= tiers.tier4.minReferrals) return { tier: 'tier4', ...tiers.tier4 };
  if (referralCount >= tiers.tier3.minReferrals) return { tier: 'tier3', ...tiers.tier3 };
  if (referralCount >= tiers.tier2.minReferrals) return { tier: 'tier2', ...tiers.tier2 };
  if (referralCount >= tiers.tier1.minReferrals) return { tier: 'tier1', ...tiers.tier1 };

  return null;
}

function getNextTier(referralCount) {
  const tiers = CONFIG.referral.rewards.referrer;

  if (referralCount < tiers.tier1.minReferrals) {
    return { needed: tiers.tier1.minReferrals - referralCount, nextTier: tiers.tier1 };
  }
  if (referralCount < tiers.tier2.minReferrals) {
    return { needed: tiers.tier2.minReferrals - referralCount, nextTier: tiers.tier2 };
  }
  if (referralCount < tiers.tier3.minReferrals) {
    return { needed: tiers.tier3.minReferrals - referralCount, nextTier: tiers.tier3 };
  }
  if (referralCount < tiers.tier4.minReferrals) {
    return { needed: tiers.tier4.minReferrals - referralCount, nextTier: tiers.tier4 };
  }

  return null; // Max tier reached
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
    provider: 'Claude Opus 4.5',
    model: CONFIG.ai.claude.model
  };
}

async function critiqueReferralEmail(emailData, type) {
  const prompt = `Act as a Senior Copywriter. Critique this referral email (${type}).
Subject: ${emailData.subject}
Body: ${emailData.body}

Criteria:
1. Persuasion: Does it motivate sharing?
2. Clarity: Are the rewards clear?
3. Tone: Is it exciting but professional?
4. Formatting: Is the HTML clean?

Output JSON: { "score": <0-10>, "feedback": "concise critique", "issues": ["list"] }`;

  const systemPrompt = "You are a strict copy editor focused on conversion optimization.";

  // Use fastest reasoning model (Grok)
  try {
    const result = await generateWithGrok(prompt, systemPrompt);
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return safeJsonParse(jsonMatch[0], { score: 5, feedback: "Parse error", issues: [] });
  } catch (e) {
    // Fallback to minimal pass
    return { score: 7, feedback: "Critique skipped (API error)", issues: [] };
  }
  return { score: 5, feedback: "Critique failed", issues: [] };
}

async function refineReferralEmail(emailData, critique, type) {
  const prompt = `Improve this email based on the critique.
Original Subject: ${emailData.subject}
Critique: ${critique.feedback} (Score: ${critique.score}/10)
Issues: ${critique.issues.join(', ')}

Task: Rewrite to handle all issues and maximize conversion.
Output JSON: { "subject", "preview", "body", "socialShare" }`;

  const systemPrompt = "You are a world-class copywriter. Improve this email.";

  // Use best creative model (Claude or OpenAI)
  try {
    const result = await generateWithClaude(prompt, systemPrompt); // Claude is best for writing
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const refined = safeJsonParse(jsonMatch[0]);
      if (refined?.subject && refined?.body) return { ...refined, provider: result.provider + ' (Refined)' };
    }
  } catch (e) {
    // Fallback
  }
  return emailData; // Return original if refinement fails
}

async function generateReferralEmail(customer, type, data) {
  const systemPrompt = `You are an expert email copywriter for referral programs.
Write engaging, shareable emails that motivate customers to refer friends.
The email should be in ${customer.language || 'French'}.
Format: Return JSON with { subject, preview, body, socialShare } fields.
socialShare should include tweet and linkedin text.`;

  const prompts = {
    welcome: `Write a welcome email for ${customer.firstName} who just joined our referral program.
Their unique referral link is: ${data.referralLink}
They get ${CONFIG.referral.rewards.referee.firstPurchase.discount} for friends who buy.
Make it exciting and easy to share!`,

    success: `Write a congratulations email for ${customer.firstName}.
Their friend ${data.refereeName} just made a purchase using their referral!
They now have ${data.totalReferrals} successful referrals.
Current tier: ${data.currentTier?.tier || 'starting'}
Current reward: ${data.currentTier?.discount || 'none yet'}
Next tier needs: ${data.nextTier?.needed || 0} more referrals for ${data.nextTier?.nextTier?.discount || 'max tier reached'}`,

    reminder: `Write a friendly reminder email for ${customer.firstName}.
They have a referral link they haven't shared in a while: ${data.referralLink}
Referral count so far: ${data.totalReferrals}
Motivate them to share and earn rewards!`,

    tierUp: `Write an exciting tier upgrade email for ${customer.firstName}!
They just reached ${data.newTier?.tier || 'VIP'} status!
New reward: ${data.newTier?.discount || '25%'}
${data.newTier?.bonus ? 'Bonus: ' + data.newTier.bonus : ''}
Celebrate their achievement!`
  };

  const prompt = prompts[type];
  const providers = [
    generateWithGrok,
    generateWithOpenAI,
    generateWithGemini,
    generateWithClaude
  ];

  let draftEmail = null;

  // 1. DRAFT
  for (const provider of providers) {
    try {
      const result = await provider(prompt, systemPrompt);
      log(`Draft generated with ${result.provider}`);

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const emailData = safeJsonParse(jsonMatch[0]);
        if (emailData?.subject && emailData?.body) {
          draftEmail = { ...emailData, provider: result.provider };
          break;
        }
      }
    } catch (error) {
      log(`Provider failed: ${error.message}`, 'warn');
    }
  }

  if (!draftEmail) {
    log('All AI providers failed for draft, using template', 'warn');
    return getTemplateEmail(customer, type, data);
  }

  // 2. AGENTIC REFLECTION LOOP
  if (CONFIG.agenticMode) {
    log('🤖 Entering Agentic Reflection Loop...');
    const critique = await critiqueReferralEmail(draftEmail, type);
    log(`📊 Critique Score: ${critique.score}/10. Feedback: ${critique.feedback}`);

    if (critique.score < CONFIG.agenticQualityThreshold) {
      log(`🔧 Refining email (score ${critique.score} < threshold ${CONFIG.agenticQualityThreshold})...`);
      const refinedEmail = await refineReferralEmail(draftEmail, critique, type);
      return refinedEmail;
    }
  }

  return draftEmail;
}

function getTemplateEmail(customer, type, data) {
  const templates = {
    welcome: {
      subject: `🎁 ${customer.firstName}, start earning with referrals!`,
      preview: 'Share your link, earn rewards',
      body: `<h1>Welcome to our Referral Program!</h1>
<p>Hi ${customer.firstName}!</p>
<p>Your unique referral link: <strong>${data.referralLink}</strong></p>
<p>Share it with friends and you'll both earn rewards!</p>
<ul>
  <li>Your friends get ${CONFIG.referral.rewards.referee.firstPurchase.discount} off</li>
  <li>You earn rewards for every successful referral</li>
</ul>
<p>Start sharing today! 🚀</p>`,
      socialShare: {
        tweet: `I love shopping here! Get ${CONFIG.referral.rewards.referee.firstPurchase.discount} off with my link`,
        linkedin: `Great shopping experience with awesome products!`
      }
    },
    success: {
      subject: `🎉 ${customer.firstName}, your referral was successful!`,
      preview: `${data.refereeName} just purchased!`,
      body: `<h1>Congratulations!</h1>
<p>${data.refereeName} just made a purchase using your referral link!</p>
<p>Total referrals: <strong>${data.totalReferrals}</strong></p>
<p>Keep sharing to unlock more rewards! 🎁</p>`,
      socialShare: {}
    },
    reminder: {
      subject: `🔄 ${customer.firstName}, don't forget your referral rewards!`,
      preview: 'Share and earn',
      body: `<h1>Hi ${customer.firstName}!</h1>
<p>Your referral link is waiting: <strong>${data.referralLink}</strong></p>
<p>Share it today and start earning! 💰</p>`,
      socialShare: {}
    },
    tierUp: {
      subject: `🏆 ${customer.firstName}, you leveled up!`,
      preview: `New tier: ${data.newTier?.tier || 'VIP'}`,
      body: `<h1>Congratulations!</h1>
<p>You've reached <strong>${data.newTier?.tier || 'VIP'}</strong> status!</p>
<p>New reward: <strong>${data.newTier?.discount || '25%'}</strong></p>
${data.newTier?.bonus ? `<p>Bonus: <strong>${data.newTier.bonus}</strong></p>` : ''}
<p>Keep sharing! 🚀</p>`,
      socialShare: {}
    }
  };

  return { ...templates[type], provider: 'Template' };
}

// ============================================================================
// EMAIL PROVIDERS
// ============================================================================

async function sendViaKlaviyo(customer, emailData, eventType) {
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
            attributes: { name: `Referral ${eventType}` }
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
          socialShare: emailData.socialShare,
          provider: emailData.provider
        },
        time: new Date().toISOString()
      }
    }
  });

  if (response.statusCode !== 202 && response.statusCode !== 200) {
    throw new Error(`Klaviyo API error: ${response.statusCode}`);
  }

  return { provider: 'Klaviyo', status: 'sent', eventId: `klaviyo_${Date.now()}` };
}

async function sendViaOmnisend(customer, emailData, eventType) {
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
    eventName: `referral_${eventType}`,
    eventVersion: 'v1',
    eventID: `ref_${customer.email}_${Date.now()}`,
    fields: {
      subject: emailData.subject,
      preview: emailData.preview,
      body: emailData.body,
      firstName: customer.firstName
    }
  });

  if (response.statusCode !== 200) {
    throw new Error(`Omnisend API error: ${response.statusCode}`);
  }

  return { provider: 'Omnisend', status: 'sent', eventId: `omnisend_${Date.now()}` };
}

// Direct send (bypasses HITL - used after approval)
async function sendEmailDirect(customer, emailData, eventType) {
  const providers = [
    { name: 'Klaviyo', fn: (c, e) => sendViaKlaviyo(c, e, eventType) },
    { name: 'Omnisend', fn: (c, e) => sendViaOmnisend(c, e, eventType) }
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

// HITL-aware send (queues for approval unless auto-approve conditions met)
async function sendEmail(customer, emailData, eventType) {
  // Check if HITL preview mode is enabled
  if (CONFIG.hitl.previewMode) {
    // Auto-approve welcome emails if configured
    if (eventType === 'welcome' && CONFIG.hitl.autoApproveWelcome) {
      log(`🚀 Auto-approving welcome email (REFERRAL_AUTO_APPROVE_WELCOME=true)`);
      return sendEmailDirect(customer, emailData, eventType);
    }

    // Queue for approval
    const pending = queuePendingEmail(customer, emailData, eventType);
    return {
      provider: 'HITL Queued',
      status: 'pending_approval',
      pendingId: pending.id,
      message: `Email queued for approval. Use --approve=${pending.id} to send.`
    };
  }

  // Preview mode disabled - send directly
  return sendEmailDirect(customer, emailData, eventType);
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

async function generateReferralCodeForCustomer(customer) {
  // Check if customer already has a code
  if (referralStore.customers.has(customer.id)) {
    const existing = referralStore.customers.get(customer.id);
    return {
      status: 'exists',
      code: existing.code,
      link: generateReferralLink(existing.code),
      totalReferrals: existing.totalReferrals
    };
  }

  // Generate new code
  const code = generateReferralCode(customer.id);
  const link = generateReferralLink(code);

  // Store
  referralStore.codes.set(code, {
    customerId: customer.id,
    created: new Date().toISOString(),
    referrals: []
  });

  referralStore.customers.set(customer.id, {
    code,
    totalReferrals: 0,
    rewards: []
  });

  // Send welcome email
  const emailData = await generateReferralEmail(customer, 'welcome', { referralLink: link });
  const sendResult = await sendEmail(customer, emailData, 'welcome');

  return {
    status: 'created',
    code,
    link,
    emailProvider: sendResult.provider,
    aiProvider: emailData.provider
  };
}

async function processReferral(referralCode, referee) {
  const codeData = referralStore.codes.get(referralCode);
  if (!codeData) {
    return { status: 'invalid_code', error: 'Referral code not found' };
  }

  // Check if referee already used a referral
  const alreadyReferred = Array.from(referralStore.codes.values())
    .some(c => c.referrals.some(r => r.email === referee.email));

  if (alreadyReferred) {
    return { status: 'already_referred', error: 'Customer already used a referral' };
  }

  // Record the referral
  codeData.referrals.push({
    email: referee.email,
    name: referee.firstName,
    date: new Date().toISOString()
  });

  // Update referrer stats
  const referrerData = referralStore.customers.get(codeData.customerId);
  referrerData.totalReferrals++;

  // Check tier upgrade
  const prevTier = getCurrentTier(referrerData.totalReferrals - 1);
  const newTier = getCurrentTier(referrerData.totalReferrals);
  const tierUpgrade = newTier && (!prevTier || prevTier.tier !== newTier.tier);

  // Resolve referrer details from provided context or database
  const referrer = referee.referrerContext || {
    id: codeData.customerId,
    email: referee.referrerEmail, // Expecting email to be passed in referee context
    firstName: referee.referrerName || 'Ambassadeur',
    language: referee.referrerLanguage || 'French'
  };

  if (!referrer.email) {
    log(`Referrer email missing for customer ${codeData.customerId}`, 'error');
    return { status: 'missing_referrer_email', error: 'Could not contact promoter' };
  }

  // Send success email to referrer
  const emailData = await generateReferralEmail(referrer, 'success', {
    refereeName: referee.firstName,
    totalReferrals: referrerData.totalReferrals,
    currentTier: newTier,
    nextTier: getNextTier(referrerData.totalReferrals)
  });

  const sendResult = await sendEmail(referrer, emailData, 'success');

  // If tier upgrade, send additional email
  if (tierUpgrade) {
    const tierEmail = await generateReferralEmail(referrer, 'tierUp', { newTier });
    await sendEmail(referrer, tierEmail, 'tierUp');
  }

  return {
    status: 'success',
    referrerStats: {
      totalReferrals: referrerData.totalReferrals,
      currentTier: newTier,
      tierUpgrade
    },
    refereeReward: CONFIG.referral.rewards.referee.firstPurchase,
    emailProvider: sendResult.provider,
    aiProvider: emailData.provider
  };
}

function getLeaderboard(limit = 10) {
  const leaders = Array.from(referralStore.customers.entries())
    .map(([id, data]) => ({
      customerId: id,
      totalReferrals: data.totalReferrals,
      tier: getCurrentTier(data.totalReferrals)?.tier || 'none',
      code: data.code
    }))
    .sort((a, b) => b.totalReferrals - a.totalReferrals)
    .slice(0, limit);

  return {
    leaderboard: leaders,
    totalParticipants: referralStore.customers.size,
    totalReferrals: Array.from(referralStore.customers.values())
      .reduce((sum, c) => sum + c.totalReferrals, 0)
  };
}

function getStats() {
  const totalCodes = referralStore.codes.size;
  const totalReferrals = Array.from(referralStore.customers.values())
    .reduce((sum, c) => sum + c.totalReferrals, 0);

  const tierDistribution = { tier1: 0, tier2: 0, tier3: 0, tier4: 0, none: 0 };
  for (const [, data] of referralStore.customers) {
    const tier = getCurrentTier(data.totalReferrals);
    tierDistribution[tier?.tier || 'none']++;
  }

  return {
    totalCodes,
    totalParticipants: referralStore.customers.size,
    totalReferrals,
    averageReferrals: totalCodes > 0 ? (totalReferrals / totalCodes).toFixed(2) : 0,
    tierDistribution,
    conversionRate: totalCodes > 0 ? ((totalReferrals / totalCodes) * 100).toFixed(1) + '%' : '0%'
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

  const aiProviders = [
    { name: 'Grok 4.1', key: CONFIG.ai.grok.apiKey, model: CONFIG.ai.grok.model },
    { name: 'OpenAI GPT-5.2', key: CONFIG.ai.openai.apiKey, model: CONFIG.ai.openai.model },
    { name: 'Gemini 3', key: CONFIG.ai.gemini.apiKey, model: CONFIG.ai.gemini.model },
    { name: 'Claude Opus 4.5', key: CONFIG.ai.claude.apiKey, model: CONFIG.ai.claude.model }
  ];

  for (const p of aiProviders) {
    results.ai[p.name] = p.key ? '✅ Configured' : '❌ Missing key';
  }

  results.email['Klaviyo'] = CONFIG.email.klaviyo.apiKey ? '✅ Configured' : '⚠️ Not configured';
  results.email['Omnisend'] = CONFIG.email.omnisend.apiKey ? '✅ Configured' : '⚠️ Not configured';

  const aiReady = Object.values(results.ai).some(v => v.includes('✅'));
  const emailReady = Object.values(results.email).some(v => v.includes('✅'));

  results.status = aiReady && emailReady ? 'OPERATIONAL' : 'DEGRADED';

  // Reward configuration (Session 165sexies - Full Flexibility)
  results.rewardTiers = {
    tier1: CONFIG.referral.rewards.referrer.tier1,
    tier2: CONFIG.referral.rewards.referrer.tier2,
    tier3: CONFIG.referral.rewards.referrer.tier3,
    tier4: CONFIG.referral.rewards.referrer.tier4,
    options: CONFIG.referral.rewards.options
  };
  results.refereeReward = CONFIG.referral.rewards.referee.firstPurchase;
  results.refereeOptions = CONFIG.referral.rewards.options.refereeDiscountOptions;

  // Expiry settings
  results.expiry = {
    codeExpiryDays: CONFIG.referral.codeExpiryDays,
    rewardExpiryDays: CONFIG.referral.rewardExpiryDays,
    options: CONFIG.referral.expiryOptions
  };

  // Agentic settings
  results.agentic = {
    qualityThreshold: CONFIG.agenticQualityThreshold,
    options: CONFIG.agenticQualityOptions
  };

  // HITL status (Session 165ter)
  const pendingEmails = listPendingEmails();
  results.hitl = {
    enabled: CONFIG.hitl.previewMode,
    autoApproveWelcome: CONFIG.hitl.autoApproveWelcome,
    pendingApprovals: pendingEmails.length,
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

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

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

      } else if (url.pathname === '/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          if (body.length > 1024 * 50) return;
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = safeJsonParse(body);
            if (!data?.customer?.id) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing customer id' }));
              return;
            }

            const result = await generateReferralCodeForCustomer(data.customer);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result, null, 2));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });

      } else if (url.pathname === '/process' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          if (body.length > 1024 * 50) return;
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = safeJsonParse(body);
            if (!data?.code || !data?.referee?.email) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing code or referee email' }));
              return;
            }

            const result = await processReferral(data.code, data.referee);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result, null, 2));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });

      } else if (url.pathname === '/leaderboard') {
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const leaderboard = getLeaderboard(limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(leaderboard, null, 2));

      } else if (url.pathname === '/stats') {
        const stats = getStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats, null, 2));

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
    log(`Referral Program server running on port ${port}`);
    log(`Endpoints: /health, /generate (POST), /process (POST), /leaderboard, /stats`);
  });

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

  if (args.includes('--health') || args.includes('-h')) {
    const health = await healthCheck();
    console.log('\n📊 Referral Program - Health Check\n');
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  // HITL Commands (Session 165ter)
  if (args.includes('--list-pending')) {
    const pending = listPendingEmails();
    console.log('\n📋 Pending Referral Emails (HITL)\n');
    if (pending.length === 0) {
      console.log('No pending emails.');
    } else {
      pending.forEach(p => {
        console.log(`  ${p.id}`);
        console.log(`    Type: ${p.type}`);
        console.log(`    To: ${p.customer.email}`);
        console.log(`    Subject: ${p.email.subject}`);
        console.log(`    Created: ${p.createdAt}`);
        console.log('');
      });
      console.log(`Total: ${pending.length} pending`);
    }
    return;
  }

  const approveArg = args.find(a => a.startsWith('--approve='));
  if (approveArg) {
    const pendingId = approveArg.split('=')[1];
    console.log(`\n✅ Approving referral email: ${pendingId}\n`);
    try {
      const result = await approvePendingEmail(pendingId);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    return;
  }

  const rejectArg = args.find(a => a.startsWith('--reject='));
  if (rejectArg) {
    const pendingId = rejectArg.split('=')[1];
    const reasonIndex = args.indexOf('--reason');
    const reason = reasonIndex !== -1 ? args[reasonIndex + 1] : 'Rejected by operator';
    console.log(`\n❌ Rejecting referral email: ${pendingId}\n`);
    try {
      const result = rejectPendingEmail(pendingId, reason);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    return;
  }

  if (args.includes('--generate')) {
    const idIndex = args.indexOf('--customer-id');
    const customerId = idIndex !== -1 ? args[idIndex + 1] : 'test_' + Date.now();

    console.log(`\n🎁 Generating referral code for ${customerId}\n`);

    const customer = {
      id: customerId,
      email: `${customerId}@test.com`,
      firstName: 'Test',
      lastName: 'User',
      language: 'French'
    };

    const result = await generateReferralCodeForCustomer(customer);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  if (args.includes('--process-referral')) {
    const codeIndex = args.indexOf('--code');
    const code = codeIndex !== -1 ? args[codeIndex + 1] : null;
    const emailIndex = args.indexOf('--new-customer');
    const email = emailIndex !== -1 ? args[emailIndex + 1] : 'new@test.com';

    if (!code) {
      console.log('❌ Missing --code parameter');
      return;
    }

    console.log(`\n🔄 Processing referral ${code} for ${email}\n`);

    const referee = {
      email,
      firstName: 'New',
      lastName: 'Customer'
    };

    const result = await processReferral(code, referee);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  if (args.includes('--leaderboard')) {
    const leaderboard = getLeaderboard();
    console.log('\n🏆 Referral Leaderboard\n');
    console.log(JSON.stringify(leaderboard, null, 2));
    return;
  }

  if (args.includes('--stats')) {
    const stats = getStats();
    console.log('\n📈 Referral Program Stats\n');
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  if (args.includes('--server')) {
    const portIndex = args.indexOf('--port');
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : CONFIG.port;
    startServer(port);
    return;
  }

  console.log(`
Referral Program Automation v${CONFIG.version}

Usage:
  --health                              Run health check
  --generate --customer-id=X            Generate referral code
  --process-referral --code=X --new-customer=Y  Process a referral
  --leaderboard                         Show top referrers
  --stats                               Show program statistics
  --server --port=3016                  Start HTTP server

HITL Commands (Email Preview Mode):
  --list-pending                        List pending email approvals
  --approve=<id>                        Approve and send email
  --reject=<id> [--reason "text"]       Reject email

Environment:
  REFERRAL_PREVIEW_MODE=true            Enable email preview (default: true)
  REFERRAL_AUTO_APPROVE_WELCOME=true    Auto-approve welcome emails
  REFERRAL_SLACK_WEBHOOK=<url>          Notify Slack on pending emails

Benchmark: +16% CLV, -80% acquisition cost
  `);
}

main().catch(error => {
  log(error.message, 'error');
  process.exit(1);
});

module.exports = {
  generateReferralCodeForCustomer,
  processReferral,
  getLeaderboard,
  getStats,
  healthCheck
};
