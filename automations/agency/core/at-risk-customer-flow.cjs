#!/usr/bin/env node
/**
 * At-Risk Customer Flow - 3A Automation
 * Session 127bis Phase 2 - 03/01/2026
 *
 * Trigger: Customer churn score > 70% (from churn-prediction-resilient.cjs)
 *
 * Actions:
 * - Personal email from founder
 * - Special VIP discount
 * - VIP call offer
 *
 * Benchmark: +260% conversion for at-risk customers
 *
 * Usage:
 *   node at-risk-customer-flow.cjs --health
 *   node at-risk-customer-flow.cjs --process --customer='{"email":"test@example.com","churnScore":0.75}'
 *   node at-risk-customer-flow.cjs --server --port=3011
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const CONFIG = {
  // Risk thresholds
  thresholds: {
    atRisk: 0.70,       // Churn score >= 70% = at-risk
    critical: 0.85,     // Churn score >= 85% = critical
    vipCallEligible: 0.80  // Offer VIP call above 80%
  },
  // HITL Configuration (Session 165bis + 165quater flexibility)
  // User configurable thresholds via ENV variables:
  //   AT_RISK_LTV_THRESHOLD: 250 | 300 | 400 | 500 | custom (default: 300)
  //   AT_RISK_DISCOUNT_THRESHOLD: 10 | 15 | 20 | custom (default: 15)
  hitl: {
    enabled: process.env.AT_RISK_HITL_ENABLED !== 'false',  // Default: enabled
    ltvThreshold: parseInt(process.env.AT_RISK_LTV_THRESHOLD || '300', 10),  // €250, €300, €400, €500 ou valeur custom
    discountThreshold: parseInt(process.env.AT_RISK_DISCOUNT_THRESHOLD || '15', 10),  // 10%, 15%, 20% ou valeur custom
    ltvOptions: [250, 300, 400, 500],  // Recommended options
    discountOptions: [10, 15, 20],  // Recommended options
    pendingDir: path.join(__dirname, '../../../data/hitl-pending'),
    slackWebhook: process.env.HITL_SLACK_WEBHOOK || ''
  },
  // Intervention strategy
  intervention: {
    email1: {
      delay: 0,          // Immediate
      type: 'founder_personal',
      discount: 15,      // 15% discount
      discountCode: 'COMEBACK15'
    },
    email2: {
      delay: 3 * 24 * 60 * 60 * 1000,  // 3 days
      type: 'value_reminder',
      discount: 20,      // 20% discount
      discountCode: 'MISSYOU20'
    },
    email3: {
      delay: 7 * 24 * 60 * 60 * 1000,  // 7 days
      type: 'last_chance',
      discount: 25,      // 25% discount
      discountCode: 'LASTCHANCE25'
    }
  },
  // VIP call offer
  vipCall: {
    enabled: true,
    bookingUrl: 'https://3a-automation.com/booking.html',
    callDuration: 15  // minutes
  },
  // Founder info
  founder: {
    name: 'L\'équipe 3A',
    title: 'CEO & Fondateur',
    email: 'contact@3a-automation.com',
    signature: '3A Automation - Automation, Analytics, AI'
  },
  // Benchmarks
  benchmarks: {
    conversionIncrease: 2.60,  // +260% conversion
    retentionRate: 0.35,       // 35% retention with intervention
    revenueRecovery: 0.25      // 25% revenue recovery
  },
  // Rate limiting
  maxProcessPerMinute: 30,
  maxBodySize: 1024 * 1024  // 1MB
};

// ─────────────────────────────────────────────────────────────────────────────
// AI PROVIDERS - Frontier Models (Jan 2026)
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
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    apiKey: process.env.GEMINI_API_KEY
  },
  anthropic: {
    name: 'Claude Opus 4.5',
    enabled: !!process.env.ANTHROPIC_API_KEY,
    model: 'claude-opus-4-5-20251101',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL PROVIDERS
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_PROVIDERS = {
  klaviyo: {
    name: 'Klaviyo',
    enabled: !!process.env.KLAVIYO_API_KEY,
    apiKey: process.env.KLAVIYO_API_KEY,
    revision: '2024-10-15',
    baseUrl: 'https://a.klaviyo.com/api'
  },
  omnisend: {
    name: 'Omnisend',
    enabled: !!process.env.OMNISEND_API_KEY,
    apiKey: process.env.OMNISEND_API_KEY,
    baseUrl: 'https://api.omnisend.com/v3'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE (bounded)
// ─────────────────────────────────────────────────────────────────────────────

const processedCustomers = new Map();
const MAX_STORED = 10000;

function recordProcessed(email, intervention) {
  if (processedCustomers.size >= MAX_STORED) {
    const firstKey = processedCustomers.keys().next().value;
    processedCustomers.delete(firstKey);
  }
  processedCustomers.set(email, {
    timestamp: Date.now(),
    intervention,
    stage: 1
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HITL (Human In The Loop) - Session 165bis
// ─────────────────────────────────────────────────────────────────────────────

const pendingInterventions = new Map();  // In-memory pending approvals

function requiresHitlApproval(customer, discount) {
  if (!CONFIG.hitl.enabled) return false;

  const customerLtv = customer.totalSpent || 0;

  // High-value customers require approval
  if (customerLtv >= CONFIG.hitl.ltvThreshold) {
    console.log(`[HITL] LTV €${customerLtv} >= €${CONFIG.hitl.ltvThreshold} - requires approval`);
    return true;
  }

  // Large discounts require approval
  if (discount >= CONFIG.hitl.discountThreshold) {
    console.log(`[HITL] Discount ${discount}% >= ${CONFIG.hitl.discountThreshold}% - requires approval`);
    return true;
  }

  return false;
}

function savePendingIntervention(customer, emailContent, emailType) {
  const id = `atrisk_${Date.now()}_${customer.email.replace(/[@.]/g, '_')}`;

  const pending = {
    id,
    type: 'at-risk-intervention',
    createdAt: new Date().toISOString(),
    customer: {
      email: customer.email,
      name: customer.name,
      churnScore: customer.churnScore,
      totalSpent: customer.totalSpent,
      orderCount: customer.orderCount
    },
    intervention: {
      emailType,
      discount: CONFIG.intervention[emailType].discount,
      discountCode: CONFIG.intervention[emailType].discountCode
    },
    emailContent: {
      subject: emailContent.subject,
      preview: emailContent.preview,
      bodyPreview: emailContent.body?.substring(0, 500) + '...'
    },
    status: 'pending'
  };

  pendingInterventions.set(id, pending);

  // Also save to disk for persistence
  try {
    if (!fs.existsSync(CONFIG.hitl.pendingDir)) {
      fs.mkdirSync(CONFIG.hitl.pendingDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(CONFIG.hitl.pendingDir, `${id}.json`),
      JSON.stringify(pending, null, 2)
    );
  } catch (err) {
    console.error('[HITL] Failed to save pending intervention:', err.message);
  }

  // Notify via Slack if configured
  if (CONFIG.hitl.slackWebhook) {
    notifySlack(pending).catch(err => console.error('[HITL] Slack notification failed:', err.message));
  }

  return id;
}

async function notifySlack(pending) {
  if (!CONFIG.hitl.slackWebhook) return;

  const message = {
    text: `🚨 HITL Approval Required: At-Risk Intervention`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*At-Risk Customer Intervention Pending Approval*\n\n*Customer:* ${pending.customer.email}\n*LTV:* €${pending.customer.totalSpent || 0}\n*Churn Score:* ${(pending.customer.churnScore * 100).toFixed(0)}%\n*Discount:* ${pending.intervention.discount}% (${pending.intervention.discountCode})`
        }
      },
      {
        type: 'actions',
        elements: [
          { type: 'button', text: { type: 'plain_text', text: '✅ Approve' }, style: 'primary', value: pending.id },
          { type: 'button', text: { type: 'plain_text', text: '❌ Reject' }, style: 'danger', value: pending.id }
        ]
      }
    ]
  };

  await httpRequest(CONFIG.hitl.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify(message));
}

function listPendingInterventions() {
  // Load from disk
  const pending = [];
  try {
    if (fs.existsSync(CONFIG.hitl.pendingDir)) {
      const files = fs.readdirSync(CONFIG.hitl.pendingDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(CONFIG.hitl.pendingDir, file), 'utf8'));
        if (data.status === 'pending') {
          pending.push(data);
        }
      }
    }
  } catch (err) {
    console.error('[HITL] Failed to list pending:', err.message);
  }
  return pending;
}

async function approveIntervention(id) {
  const filePath = path.join(CONFIG.hitl.pendingDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Intervention ${id} not found`);
  }

  const pending = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (pending.status !== 'pending') {
    throw new Error(`Intervention ${id} already ${pending.status}`);
  }

  // Execute the intervention
  const result = await executeApprovedIntervention(pending);

  // Update status
  pending.status = 'approved';
  pending.approvedAt = new Date().toISOString();
  pending.result = result;
  fs.writeFileSync(filePath, JSON.stringify(pending, null, 2));

  return { success: true, id, result };
}

async function rejectIntervention(id, reason = '') {
  const filePath = path.join(CONFIG.hitl.pendingDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Intervention ${id} not found`);
  }

  const pending = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  pending.status = 'rejected';
  pending.rejectedAt = new Date().toISOString();
  pending.rejectionReason = reason;
  fs.writeFileSync(filePath, JSON.stringify(pending, null, 2));

  return { success: true, id, status: 'rejected' };
}

async function executeApprovedIntervention(pending) {
  // Send the email that was previously held
  const customer = pending.customer;
  const emailContent = {
    ...pending.emailContent,
    discountCode: pending.intervention.discountCode,
    discount: pending.intervention.discount
  };

  const sendResult = await sendEmailResilient(customer, emailContent);
  recordProcessed(customer.email, pending.intervention);

  return sendResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HELPER
// ─────────────────────────────────────────────────────────────────────────────

function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: options.headers || {},
      timeout: 30000
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(body);
    req.end();
  });
}

function safeJsonParse(str, context = 'unknown') {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (err) {
    console.error(`[JSON Parse Error] ${context}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI EMAIL GENERATION
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_SYSTEM_PROMPT = `Tu es un expert en rétention client pour 3A Automation.
Tu dois écrire des emails personnalisés pour reconquérir des clients à risque de churn.

RÈGLES:
- Ton empathique et personnel (comme si le fondateur écrivait directement)
- Mentionner la valeur que le client a déjà reçue
- Proposer une offre exclusive (code promo)
- Créer un sentiment d'urgence sans être agressif
- Court et impactant (150-200 mots max)
- Utiliser le vouvoiement
- Ne jamais mentionner le "score de churn" au client

FORMAT DE SORTIE (JSON):
{
  "subject": "Ligne d'objet percutante",
  "preview": "Texte de prévisualisation (40 chars)",
  "body": "Corps de l'email en HTML simple",
  "cta": "Texte du bouton d'action"
}`;

async function generateEmailWithAI(customer, emailType, provider) {
  const prompt = `Génère un email de type "${emailType}" pour ce client à risque:

Client: ${customer.name || 'Client'}
Email: ${customer.email}
Dernière commande: il y a ${customer.daysSinceLastPurchase || 'plusieurs'} jours
Valeur totale: ${customer.totalSpent || 'N/A'}€
Commandes: ${customer.orderCount || 'N/A'}
Score de risque: ${(customer.churnScore * 100).toFixed(0)}%

Code promo: ${CONFIG.intervention[emailType]?.discountCode || 'COMEBACK15'}
Réduction: ${CONFIG.intervention[emailType]?.discount || 15}%
${customer.churnScore >= CONFIG.thresholds.vipCallEligible ? 'Proposer un appel VIP de 15 minutes.' : ''}

Contexte: 3A Automation est une agence d'automatisation AI pour e-commerce et PME.`;

  let response;

  try {
    switch (provider) {
      case 'grok':
        response = await callGrok(prompt);
        break;
      case 'openai':
        response = await callOpenAI(prompt);
        break;
      case 'gemini':
        response = await callGemini(prompt);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt);
        break;
    }

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse(jsonMatch[0], 'AI email response');
      if (parsed.success) {
        return { success: true, email: parsed.data, provider };
      }
    }

    throw new Error('Could not parse JSON from AI response');
  } catch (err) {
    throw new Error(`${provider} failed: ${err.message}`);
  }
}

async function callGrok(prompt) {
  const body = JSON.stringify({
    model: PROVIDERS.grok.model,
    messages: [
      { role: 'system', content: EMAIL_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });

  const response = await httpRequest(PROVIDERS.grok.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDERS.grok.apiKey}`
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'Grok response');
  if (!parsed.success) throw new Error('Grok JSON parse failed');
  return parsed.data.choices[0].message.content;
}

async function callOpenAI(prompt) {
  const body = JSON.stringify({
    model: PROVIDERS.openai.model,
    messages: [
      { role: 'system', content: EMAIL_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });

  const response = await httpRequest(PROVIDERS.openai.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDERS.openai.apiKey}`
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'OpenAI response');
  if (!parsed.success) throw new Error('OpenAI JSON parse failed');
  return parsed.data.choices[0].message.content;
}

async function callGemini(prompt) {
  const url = `${PROVIDERS.gemini.endpoint}?key=${PROVIDERS.gemini.apiKey}`;
  const body = JSON.stringify({
    contents: [{
      parts: [{ text: `${EMAIL_SYSTEM_PROMPT}\n\n${prompt}` }]
    }],
    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
  });

  const response = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, body);

  const parsed = safeJsonParse(response.data, 'Gemini response');
  if (!parsed.success) throw new Error('Gemini JSON parse failed');
  return parsed.data.candidates[0].content.parts[0].text;
}

async function callAnthropic(prompt) {
  const body = JSON.stringify({
    model: PROVIDERS.anthropic.model,
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  });

  const response = await httpRequest(PROVIDERS.anthropic.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': PROVIDERS.anthropic.apiKey,
      'anthropic-version': '2024-01-01'
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'Anthropic response');
  if (!parsed.success) throw new Error('Anthropic JSON parse failed');
  return parsed.data.content[0].text;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESILIENT EMAIL GENERATION (with fallback)
// ─────────────────────────────────────────────────────────────────────────────

async function generateEmailResilient(customer, emailType) {
  const errors = [];
  const providerOrder = ['grok', 'openai', 'gemini', 'anthropic'];

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      console.log(`[At-Risk] Trying ${provider.name} for email generation...`);
      const result = await generateEmailWithAI(customer, emailType, providerKey);
      console.log(`[At-Risk] ✅ Email generated with ${provider.name}`);
      return { ...result, errors };
    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`[At-Risk] ${provider.name} failed:`, err.message);
    }
  }

  // All AI failed - use template
  console.log('[At-Risk] All AI providers failed, using template');
  return {
    success: true,
    email: getTemplateEmail(customer, emailType),
    provider: 'template',
    errors
  };
}

function getTemplateEmail(customer, emailType) {
  const name = customer.name || 'Cher client';
  const discount = CONFIG.intervention[emailType]?.discount || 15;
  const code = CONFIG.intervention[emailType]?.discountCode || 'COMEBACK15';

  const templates = {
    email1: {
      subject: `${name}, vous nous manquez chez 3A Automation`,
      preview: 'Une offre exclusive vous attend...',
      body: `
        <p>Bonjour ${name},</p>
        <p>Je me permets de vous écrire personnellement car nous avons remarqué que nous n'avons pas eu de vos nouvelles depuis un moment.</p>
        <p>Chez 3A Automation, chaque client compte. C'est pourquoi je vous propose une offre exclusive de <strong>${discount}% de réduction</strong> avec le code <strong>${code}</strong>.</p>
        ${customer.churnScore >= CONFIG.thresholds.vipCallEligible ? `<p>Je vous propose également un appel VIP de 15 minutes pour discuter de vos besoins : <a href="${CONFIG.vipCall.bookingUrl}">Réserver mon appel</a></p>` : ''}
        <p>Cette offre est valable 7 jours.</p>
        <p>Bien cordialement,<br>${CONFIG.founder.name}<br>${CONFIG.founder.title}</p>
      `,
      cta: 'Profiter de mon offre'
    },
    email2: {
      subject: `N'oubliez pas votre ${discount}% de réduction, ${name}`,
      preview: 'Votre offre expire bientôt...',
      body: `
        <p>Bonjour ${name},</p>
        <p>Je voulais m'assurer que vous aviez bien vu mon message précédent.</p>
        <p>Votre réduction de <strong>${discount}%</strong> avec le code <strong>${code}</strong> est toujours disponible.</p>
        <p>Nos automatisations peuvent vous faire gagner des heures chaque semaine. Pourquoi ne pas en profiter ?</p>
        <p>À très bientôt,<br>${CONFIG.founder.name}</p>
      `,
      cta: 'Utiliser ma réduction'
    },
    email3: {
      subject: `Dernière chance : ${discount}% de réduction expire demain`,
      preview: 'Ne manquez pas cette opportunité...',
      body: `
        <p>Bonjour ${name},</p>
        <p>C'est la dernière fois que je vous envoie cette offre exclusive.</p>
        <p>Votre code <strong>${code}</strong> pour <strong>${discount}%</strong> de réduction expire demain.</p>
        <p>Si vous n'êtes pas intéressé, je comprends. Mais si vous avez des questions, n'hésitez pas à me répondre directement.</p>
        <p>Merci pour votre confiance passée,<br>${CONFIG.founder.name}</p>
      `,
      cta: 'Dernière chance'
    }
  };

  return templates[emailType] || templates.email1;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SENDING (Klaviyo/Omnisend)
// ─────────────────────────────────────────────────────────────────────────────

async function sendViaKlaviyo(customer, emailContent) {
  if (!EMAIL_PROVIDERS.klaviyo.enabled) {
    throw new Error('Klaviyo not configured');
  }

  // Create event for at-risk campaign trigger
  const eventData = {
    data: {
      type: 'event',
      attributes: {
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: customer.email,
              properties: {
                at_risk_score: customer.churnScore,
                at_risk_discount_code: emailContent.discountCode,
                at_risk_subject: emailContent.subject,
                at_risk_campaign_type: 'at_risk_winback'
              }
            }
          }
        },
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: 'At-Risk Customer Triggered'
            }
          }
        },
        properties: {
          email_subject: emailContent.subject,
          email_preview: emailContent.preview,
          discount_code: emailContent.discountCode,
          discount_percent: emailContent.discount,
          churn_score: customer.churnScore
        },
        time: new Date().toISOString()
      }
    }
  };

  const response = await httpRequest(`${EMAIL_PROVIDERS.klaviyo.baseUrl}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${EMAIL_PROVIDERS.klaviyo.apiKey}`,
      'Content-Type': 'application/json',
      'revision': EMAIL_PROVIDERS.klaviyo.revision
    }
  }, JSON.stringify(eventData));

  return { success: true, provider: 'Klaviyo', response: response.status };
}

async function sendViaOmnisend(customer, emailContent) {
  if (!EMAIL_PROVIDERS.omnisend.enabled) {
    throw new Error('Omnisend not configured');
  }

  // Create event for at-risk automation trigger
  const eventData = {
    email: customer.email,
    eventName: 'At-Risk Customer Triggered',
    eventID: `atrisk_${customer.email}_${Date.now()}`,
    fields: {
      churnScore: customer.churnScore,
      discountCode: emailContent.discountCode,
      discountPercent: emailContent.discount,
      emailSubject: emailContent.subject
    }
  };

  const response = await httpRequest(`${EMAIL_PROVIDERS.omnisend.baseUrl}/events`, {
    method: 'POST',
    headers: {
      'X-API-KEY': EMAIL_PROVIDERS.omnisend.apiKey,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify(eventData));

  return { success: true, provider: 'Omnisend', response: response.status };
}

async function sendEmailResilient(customer, emailContent) {
  const errors = [];

  // Try Klaviyo first
  if (EMAIL_PROVIDERS.klaviyo.enabled) {
    try {
      const result = await sendViaKlaviyo(customer, emailContent);
      console.log(`[At-Risk] ✅ Event sent via Klaviyo`);
      return { ...result, errors };
    } catch (err) {
      errors.push({ provider: 'Klaviyo', error: err.message });
      console.log('[At-Risk] Klaviyo failed:', err.message);
    }
  }

  // Fallback to Omnisend
  if (EMAIL_PROVIDERS.omnisend.enabled) {
    try {
      const result = await sendViaOmnisend(customer, emailContent);
      console.log(`[At-Risk] ✅ Event sent via Omnisend`);
      return { ...result, errors };
    } catch (err) {
      errors.push({ provider: 'Omnisend', error: err.message });
      console.log('[At-Risk] Omnisend failed:', err.message);
    }
  }

  return {
    success: false,
    provider: 'none',
    errors,
    message: 'No email provider available'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROCESSING
// ─────────────────────────────────────────────────────────────────────────────

async function processAtRiskCustomer(customer) {
  console.log(`\n[At-Risk] Processing customer: ${customer.email}`);
  console.log(`[At-Risk] Churn score: ${(customer.churnScore * 100).toFixed(0)}%`);

  // Validate input
  if (!customer.email || !customer.churnScore) {
    return { success: false, error: 'Missing email or churnScore' };
  }

  // Check threshold
  if (customer.churnScore < CONFIG.thresholds.atRisk) {
    return {
      success: false,
      error: `Churn score ${(customer.churnScore * 100).toFixed(0)}% below threshold ${(CONFIG.thresholds.atRisk * 100).toFixed(0)}%`,
      skipped: true
    };
  }

  // Check if already processed recently (24h)
  const existing = processedCustomers.get(customer.email);
  if (existing && (Date.now() - existing.timestamp) < 24 * 60 * 60 * 1000) {
    return {
      success: false,
      error: 'Customer already processed in last 24 hours',
      skipped: true
    };
  }

  // Determine intervention type based on score
  const riskLevel = customer.churnScore >= CONFIG.thresholds.critical ? 'critical' : 'high';
  const emailType = 'email1'; // Start with first email

  // Generate personalized email
  const emailResult = await generateEmailResilient(customer, emailType);
  if (!emailResult.success) {
    return { success: false, error: 'Email generation failed', errors: emailResult.errors };
  }

  // Add discount info to email content
  const emailContent = {
    ...emailResult.email,
    discountCode: CONFIG.intervention[emailType].discountCode,
    discount: CONFIG.intervention[emailType].discount
  };

  // HITL Check (Session 165bis) - Only for high-risk scenarios
  const discountPercent = CONFIG.intervention[emailType].discount;
  if (requiresHitlApproval(customer, discountPercent)) {
    const pendingId = savePendingIntervention(customer, emailContent, emailType);
    console.log(`[HITL] Intervention queued for approval: ${pendingId}`);
    return {
      success: true,
      hitlRequired: true,
      pendingId,
      customer: customer.email,
      riskLevel,
      churnScore: customer.churnScore,
      reason: customer.totalSpent >= CONFIG.hitl.ltvThreshold
        ? `LTV €${customer.totalSpent} >= €${CONFIG.hitl.ltvThreshold}`
        : `Discount ${discountPercent}% >= ${CONFIG.hitl.discountThreshold}%`,
      emailGenerated: {
        provider: emailResult.provider,
        subject: emailContent.subject
      },
      discount: {
        code: emailContent.discountCode,
        percent: emailContent.discount
      },
      message: 'Intervention pending human approval. Use --approve=<id> to send.'
    };
  }

  // Send via email provider (no HITL required)
  const sendResult = await sendEmailResilient(customer, emailContent);

  // Record processing
  recordProcessed(customer.email, {
    emailType,
    riskLevel,
    churnScore: customer.churnScore,
    aiProvider: emailResult.provider,
    emailProvider: sendResult.provider
  });

  return {
    success: sendResult.success,
    hitlRequired: false,
    customer: customer.email,
    riskLevel,
    churnScore: customer.churnScore,
    emailGenerated: {
      provider: emailResult.provider,
      subject: emailContent.subject
    },
    emailSent: sendResult.success ? sendResult.provider : 'failed',
    discount: {
      code: emailContent.discountCode,
      percent: emailContent.discount
    },
    vipCallOffered: customer.churnScore >= CONFIG.thresholds.vipCallEligible,
    errors: [...(emailResult.errors || []), ...(sendResult.errors || [])]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────

function startServer(port = 3011) {
  const requestCounts = new Map();

  const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://3a-automation.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${clientIp}_${minute}`;
    const count = (requestCounts.get(key) || 0) + 1;
    requestCounts.set(key, count);

    if (count > CONFIG.maxProcessPerMinute) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Rate limit exceeded. Max ${CONFIG.maxProcessPerMinute}/min.` }));
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const status = {
        healthy: true,
        aiProviders: {},
        emailProviders: {},
        thresholds: CONFIG.thresholds,
        processedCustomers: processedCustomers.size
      };

      for (const [key, provider] of Object.entries(PROVIDERS)) {
        status.aiProviders[key] = { name: provider.name, configured: provider.enabled };
      }
      for (const [key, provider] of Object.entries(EMAIL_PROVIDERS)) {
        status.emailProviders[key] = { name: provider.name, configured: provider.enabled };
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    // Process at-risk customer
    if (req.url === '/process' && req.method === 'POST') {
      let body = '';
      let bodySize = 0;

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > CONFIG.maxBodySize) {
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request too large' }));
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const parsed = safeJsonParse(body, '/process body');
          if (!parsed.success) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid JSON: ${parsed.error}` }));
            return;
          }

          const result = await processAtRiskCustomer(parsed.data);

          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[At-Risk] Error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Webhook for churn-prediction integration
    if (req.url === '/webhook/churn-alert' && req.method === 'POST') {
      let body = '';

      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const parsed = safeJsonParse(body, '/webhook body');
          if (!parsed.success) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }

          const { customers } = parsed.data;
          if (!Array.isArray(customers)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'customers array required' }));
            return;
          }

          // Filter at-risk customers
          const atRisk = customers.filter(c => c.churnScore >= CONFIG.thresholds.atRisk);
          const results = [];

          for (const customer of atRisk.slice(0, 10)) { // Process max 10 per webhook
            const result = await processAtRiskCustomer(customer);
            results.push(result);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            processed: results.filter(r => r.success).length,
            skipped: results.filter(r => r.skipped).length,
            failed: results.filter(r => !r.success && !r.skipped).length,
            results
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    console.log(`\n[Server] At-Risk Customer Flow running on http://localhost:${port}`);
    console.log('\nEndpoints:');
    console.log('  POST /process                - Process single at-risk customer');
    console.log('  POST /webhook/churn-alert    - Batch process from churn-prediction');
    console.log('  GET  /health                 - Status check');
    console.log('\nAI Providers:');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      console.log(`  ${provider.enabled ? '✅' : '⚠️'} ${provider.name}`);
    }
    console.log('\nEmail Providers:');
    for (const [key, provider] of Object.entries(EMAIL_PROVIDERS)) {
      console.log(`  ${provider.enabled ? '✅' : '⚠️'} ${provider.name}`);
    }
    console.log(`\nThresholds: At-Risk ≥${CONFIG.thresholds.atRisk * 100}%, Critical ≥${CONFIG.thresholds.critical * 100}%`);
    console.log(`Benchmark: +${(CONFIG.benchmarks.conversionIncrease * 100 - 100).toFixed(0)}% conversion for at-risk customers`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--(\w+)(?:=(.+))?$/);
    if (match) {
      args[match[1]] = match[2] || true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();

  if (args.server) {
    startServer(parseInt(args.port) || 3011);
    return;
  }

  // HITL CLI Commands (Session 165bis)
  if (args['list-pending']) {
    console.log('\n=== PENDING INTERVENTIONS (HITL) ===\n');
    const pending = listPendingInterventions();
    if (pending.length === 0) {
      console.log('No pending interventions.');
    } else {
      for (const p of pending) {
        console.log(`ID: ${p.id}`);
        console.log(`  Customer: ${p.customer.email}`);
        console.log(`  LTV: €${p.customer.totalSpent || 0}`);
        console.log(`  Churn Score: ${(p.customer.churnScore * 100).toFixed(0)}%`);
        console.log(`  Discount: ${p.intervention.discount}% (${p.intervention.discountCode})`);
        console.log(`  Created: ${p.createdAt}`);
        console.log('');
      }
    }
    console.log(`Total: ${pending.length} pending`);
    return;
  }

  if (args.approve) {
    console.log(`\n[HITL] Approving intervention: ${args.approve}`);
    try {
      const result = await approveIntervention(args.approve);
      console.log('✅ Intervention approved and sent');
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`❌ Approval failed: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  if (args.reject) {
    console.log(`\n[HITL] Rejecting intervention: ${args.reject}`);
    try {
      const result = await rejectIntervention(args.reject, args.reason || '');
      console.log('✅ Intervention rejected');
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`❌ Rejection failed: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  if (args.process) {
    const customerData = safeJsonParse(args.customer || '{}', 'CLI customer');
    if (!customerData.success || !customerData.data.email) {
      console.error('Usage: --process --customer=\'{"email":"test@example.com","churnScore":0.75}\'');
      process.exit(1);
    }

    const result = await processAtRiskCustomer(customerData.data);
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.health) {
    console.log('\n=== AT-RISK CUSTOMER FLOW ===\n');

    console.log('AI Providers:');
    let aiCount = 0;
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      if (provider.enabled) aiCount++;
      console.log(`  ${provider.enabled ? '✅' : '⚠️'} ${provider.name}`);
    }

    console.log('\nEmail Providers:');
    let emailCount = 0;
    for (const [key, provider] of Object.entries(EMAIL_PROVIDERS)) {
      if (provider.enabled) emailCount++;
      console.log(`  ${provider.enabled ? '✅' : '⚠️'} ${provider.name}`);
    }

    console.log(`\nThresholds:`);
    console.log(`  At-Risk: ≥${CONFIG.thresholds.atRisk * 100}%`);
    console.log(`  Critical: ≥${CONFIG.thresholds.critical * 100}%`);
    console.log(`  VIP Call: ≥${CONFIG.thresholds.vipCallEligible * 100}%`);

    console.log(`\nHITL (Human In The Loop):`);
    console.log(`  ${CONFIG.hitl.enabled ? '✅ Enabled' : '⚠️ Disabled'}`);
    console.log(`  LTV Threshold: €${CONFIG.hitl.ltvThreshold}`);
    console.log(`  Discount Threshold: ${CONFIG.hitl.discountThreshold}%`);
    const pendingCount = listPendingInterventions().length;
    console.log(`  Pending Approvals: ${pendingCount}`);

    console.log(`\nOverall: ${aiCount >= 2 && emailCount >= 1 ? '✅ OPERATIONAL' : '⚠️ Limited'}`);
    console.log(`Benchmark: +260% conversion for at-risk customers`);
    return;
  }

  if (args.test) {
    console.log('\n=== TEST AT-RISK FLOW ===\n');

    const testCustomer = {
      email: 'test@example.com',
      name: 'Jean Test',
      churnScore: 0.82,
      daysSinceLastPurchase: 95,
      totalSpent: 450,
      orderCount: 3
    };

    console.log('Test customer:', JSON.stringify(testCustomer, null, 2));
    console.log('\nGenerating personalized email...\n');

    const result = await processAtRiskCustomer(testCustomer);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  console.log(`
[At-Risk] At-Risk Customer Flow - 3A Automation

Usage:
  node at-risk-customer-flow.cjs --server [--port=3011]
  node at-risk-customer-flow.cjs --process --customer='{"email":"x","churnScore":0.75}'
  node at-risk-customer-flow.cjs --test
  node at-risk-customer-flow.cjs --health

HITL Commands (Human In The Loop):
  node at-risk-customer-flow.cjs --list-pending              List pending approvals
  node at-risk-customer-flow.cjs --approve=<id>              Approve and send intervention
  node at-risk-customer-flow.cjs --reject=<id> [--reason=X]  Reject intervention

HITL Thresholds:
  LTV >= €${CONFIG.hitl.ltvThreshold} → Requires approval
  Discount >= ${CONFIG.hitl.discountThreshold}% → Requires approval
  HITL Enabled: ${CONFIG.hitl.enabled ? 'Yes' : 'No'}

Integration:
  Triggered by churn-prediction-resilient.cjs when churnScore >= 70%

Benchmark:
  +260% conversion for at-risk customers with personalized intervention
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
