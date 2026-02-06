#!/usr/bin/env node
/**
 * Churn Prediction Resilient - 3A Automation
 * Session 127bis - 03/01/2026
 *
 * RFM-based churn prediction with AI enhancement
 * Multi-provider fallback: Claude → Grok → Gemini (CRITICAL task - Session 168duodecies)
 * Strategy: Cost of error > Cost of API for financial decisions
 *
 * Benchmark: -25% churn rate (industry standard)
 *
 * Churn Signals:
 * - Days since last purchase > 90
 * - Purchase frequency decline > 50%
 * - Email engagement decline (open rate < 10%)
 * - Support ticket patterns
 */

require('dotenv').config();

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// HITL CONFIG - Session 157 + Session 165sexies (Full Flexibility)
// High-value customers require human approval before intervention
// ─────────────────────────────────────────────────────────────────────────────
const HITL_CONFIG = {
  // LTV threshold for human approval - FLEXIBLE (Session 165sexies)
  // ENV: CHURN_LTV_THRESHOLD=300 (options: 250, 300, 400, 500, 750, 1000)
  ltvThresholdForApproval: parseFloat(process.env.CHURN_LTV_THRESHOLD) || 300,
  ltvThresholdOptions: [250, 300, 400, 500, 750, 1000],  // Recommended options for UI
  // Directory for pending interventions
  pendingDir: path.join(__dirname, '../../../outputs/churn-interventions/pending'),
  approvedDir: path.join(__dirname, '../../../outputs/churn-interventions/approved'),
  // Slack notification
  slackWebhook: process.env.SLACK_WEBHOOK_URL || null,
  // If true, high-LTV customers ALWAYS need approval
  requireApprovalForHighLTV: process.env.CHURN_REQUIRE_APPROVAL !== 'false',  // Default: true
};

// ─────────────────────────────────────────────────────────────────────────────
// RFM THRESHOLDS CONFIG - Session 165sexies (Full Flexibility)
// All thresholds configurable via ENV variables with documented options
// ─────────────────────────────────────────────────────────────────────────────
const RFM_CONFIG = {
  // Recency thresholds (days since last purchase) - FLEXIBLE
  // ENV: RFM_RECENCY_EXCELLENT=30 (options: 14, 21, 30, 45, 60)
  recency: {
    excellent: parseInt(process.env.RFM_RECENCY_EXCELLENT) || 30,
    good: parseInt(process.env.RFM_RECENCY_GOOD) || 60,
    average: parseInt(process.env.RFM_RECENCY_AVERAGE) || 90,
    poor: parseInt(process.env.RFM_RECENCY_POOR) || 180,
    critical: parseInt(process.env.RFM_RECENCY_CRITICAL) || 365,
  },
  recencyOptions: {
    excellent: [14, 21, 30, 45, 60],
    good: [30, 45, 60, 90, 120],
    average: [60, 90, 120, 150, 180],
    poor: [90, 120, 180, 270, 365],
    critical: [180, 270, 365, 545, 730],
  },
  // Frequency thresholds (total orders) - FLEXIBLE
  // ENV: RFM_FREQUENCY_EXCELLENT=10 (options: 5, 8, 10, 15, 20)
  frequency: {
    excellent: parseInt(process.env.RFM_FREQUENCY_EXCELLENT) || 10,
    good: parseInt(process.env.RFM_FREQUENCY_GOOD) || 6,
    average: parseInt(process.env.RFM_FREQUENCY_AVERAGE) || 3,
    poor: parseInt(process.env.RFM_FREQUENCY_POOR) || 2,
    critical: parseInt(process.env.RFM_FREQUENCY_CRITICAL) || 1,
  },
  frequencyOptions: {
    excellent: [5, 8, 10, 15, 20],
    good: [3, 4, 6, 8, 10],
    average: [2, 3, 4, 5, 6],
    poor: [1, 2, 3],
    critical: [1],
  },
  // Monetary thresholds (total spent in €) - FLEXIBLE
  // ENV: RFM_MONETARY_EXCELLENT=1000 (options: 500, 750, 1000, 1500, 2000)
  monetary: {
    excellent: parseFloat(process.env.RFM_MONETARY_EXCELLENT) || 1000,
    good: parseFloat(process.env.RFM_MONETARY_GOOD) || 500,
    average: parseFloat(process.env.RFM_MONETARY_AVERAGE) || 200,
    poor: parseFloat(process.env.RFM_MONETARY_POOR) || 100,
    critical: parseFloat(process.env.RFM_MONETARY_CRITICAL) || 0,
  },
  monetaryOptions: {
    excellent: [500, 750, 1000, 1500, 2000, 3000],
    good: [250, 400, 500, 750, 1000],
    average: [100, 150, 200, 300, 400],
    poor: [50, 75, 100, 150, 200],
    critical: [0],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHURN RISK THRESHOLDS - Session 165sexies (Full Flexibility)
// ─────────────────────────────────────────────────────────────────────────────
const CHURN_RISK_CONFIG = {
  // Risk level thresholds (0-1 scale) - FLEXIBLE
  // ENV: CHURN_RISK_LOW=0.3 (options: 0.2, 0.25, 0.3, 0.35, 0.4)
  low: parseFloat(process.env.CHURN_RISK_LOW) || 0.3,
  medium: parseFloat(process.env.CHURN_RISK_MEDIUM) || 0.5,
  high: parseFloat(process.env.CHURN_RISK_HIGH) || 0.7,
  critical: parseFloat(process.env.CHURN_RISK_CRITICAL) || 0.85,
  // Options for UI/configuration
  options: {
    low: [0.2, 0.25, 0.3, 0.35, 0.4],
    medium: [0.4, 0.45, 0.5, 0.55, 0.6],
    high: [0.6, 0.65, 0.7, 0.75, 0.8],
    critical: [0.75, 0.8, 0.85, 0.9, 0.95],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ENGAGEMENT THRESHOLDS - Session 165sexies (Full Flexibility)
// ─────────────────────────────────────────────────────────────────────────────
const ENGAGEMENT_CONFIG = {
  // Low open rate threshold - FLEXIBLE
  // ENV: ENGAGEMENT_LOW_OPEN_RATE=0.10 (options: 0.05, 0.08, 0.10, 0.12, 0.15)
  lowOpenRate: parseFloat(process.env.ENGAGEMENT_LOW_OPEN_RATE) || 0.10,
  lowOpenRateOptions: [0.05, 0.08, 0.10, 0.12, 0.15],
  // Low click rate threshold - FLEXIBLE
  // ENV: ENGAGEMENT_LOW_CLICK_RATE=0.02 (options: 0.01, 0.015, 0.02, 0.025, 0.03)
  lowClickRate: parseFloat(process.env.ENGAGEMENT_LOW_CLICK_RATE) || 0.02,
  lowClickRateOptions: [0.01, 0.015, 0.02, 0.025, 0.03],
  // Decline threshold (% drop from baseline) - FLEXIBLE
  // ENV: ENGAGEMENT_DECLINE_THRESHOLD=0.50 (options: 0.3, 0.4, 0.5, 0.6, 0.7)
  declineThreshold: parseFloat(process.env.ENGAGEMENT_DECLINE_THRESHOLD) || 0.50,
  declineThresholdOptions: [0.3, 0.4, 0.5, 0.6, 0.7],
};

const CONFIG = {
  // RFM Thresholds - Now uses flexible RFM_CONFIG
  rfm: {
    recency: RFM_CONFIG.recency,
    frequency: RFM_CONFIG.frequency,
    monetary: RFM_CONFIG.monetary,
  },
  // Churn Risk Thresholds - Now uses flexible CHURN_RISK_CONFIG
  churnRisk: {
    low: CHURN_RISK_CONFIG.low,
    medium: CHURN_RISK_CONFIG.medium,
    high: CHURN_RISK_CONFIG.high,
    critical: CHURN_RISK_CONFIG.critical,
  },
  // Engagement thresholds - Now uses flexible ENGAGEMENT_CONFIG
  engagement: {
    lowOpenRate: ENGAGEMENT_CONFIG.lowOpenRate,
    lowClickRate: ENGAGEMENT_CONFIG.lowClickRate,
    declineThreshold: ENGAGEMENT_CONFIG.declineThreshold,
  },
  // AI request timeout
  timeout: 30000,
  // Benchmarks
  benchmarks: {
    churnReduction: 0.25,   // -25% churn with intervention
    atRiskConversion: 2.60, // +260% conversion for at-risk targeted campaigns
    retentionROI: 5         // 5x ROI on retention vs acquisition
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AI PROVIDERS - Session 168terdecies: CRITICAL TASK (Claude first)
// Strategy: Churn prediction = financial decision → cost of error > cost of API
// Fallback: Claude → Grok → Gemini
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDERS = {
  anthropic: {
    name: 'Claude Opus 4.6',
    // CRITICAL TASK: Use best model - cost of wrong churn prediction > API cost
    enabled: !!process.env.ANTHROPIC_API_KEY,
    model: 'claude-opus-4-6',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  grok: {
    name: 'Grok 4.1 Fast Reasoning',
    enabled: !!process.env.XAI_API_KEY,
    model: 'grok-4-1-fast-reasoning',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    apiKey: process.env.XAI_API_KEY
  },
  gemini: {
    name: 'Gemini 3 Flash',
    enabled: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3-flash-preview',
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    apiKey: process.env.GEMINI_API_KEY
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// KLAVIYO INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

const KLAVIYO = {
  enabled: !!process.env.KLAVIYO_API_KEY,
  apiKey: process.env.KLAVIYO_API_KEY,
  revision: '2024-10-15',
  baseUrl: 'https://a.klaviyo.com/api'
};

// ─────────────────────────────────────────────────────────────────────────────
// SAFE JSON PARSE
// ─────────────────────────────────────────────────────────────────────────────

function safeJsonParse(str, context = 'unknown') {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (err) {
    console.error(`[SafeJSON] Parse error in ${context}:`, err.message);
    return { success: false, error: err.message, data: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RFM SCORING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Recency score (1-5)
 * @param {number} daysSinceLastPurchase
 * @returns {number} Score 1-5
 */
function calculateRecencyScore(daysSinceLastPurchase) {
  const t = CONFIG.rfm.recency;
  if (daysSinceLastPurchase <= t.excellent) return 5;
  if (daysSinceLastPurchase <= t.good) return 4;
  if (daysSinceLastPurchase <= t.average) return 3;
  if (daysSinceLastPurchase <= t.poor) return 2;
  return 1;
}

/**
 * Calculate Frequency score (1-5)
 * @param {number} totalOrders
 * @returns {number} Score 1-5
 */
function calculateFrequencyScore(totalOrders) {
  const t = CONFIG.rfm.frequency;
  if (totalOrders >= t.excellent) return 5;
  if (totalOrders >= t.good) return 4;
  if (totalOrders >= t.average) return 3;
  if (totalOrders >= t.poor) return 2;
  return 1;
}

/**
 * Calculate Monetary score (1-5)
 * @param {number} totalSpent
 * @returns {number} Score 1-5
 */
function calculateMonetaryScore(totalSpent) {
  const t = CONFIG.rfm.monetary;
  if (totalSpent >= t.excellent) return 5;
  if (totalSpent >= t.good) return 4;
  if (totalSpent >= t.average) return 3;
  if (totalSpent >= t.poor) return 2;
  return 1;
}

/**
 * Calculate full RFM scores
 * @param {Object} customerData
 * @returns {Object} RFM scores and composite
 */
function calculateRFM(customerData) {
  const {
    daysSinceLastPurchase = 365,
    totalOrders = 0,
    totalSpent = 0
  } = customerData;

  const recency = calculateRecencyScore(daysSinceLastPurchase);
  const frequency = calculateFrequencyScore(totalOrders);
  const monetary = calculateMonetaryScore(totalSpent);

  // Weighted composite (Recency most important for churn)
  const composite = (recency * 0.5) + (frequency * 0.3) + (monetary * 0.2);

  return {
    recency,
    frequency,
    monetary,
    composite: Math.round(composite * 10) / 10,
    segment: getRFMSegment(recency, frequency, monetary)
  };
}

/**
 * Get RFM segment name
 */
function getRFMSegment(r, f, m) {
  // Champions: Best customers
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';

  // Loyal: Good frequency, decent spending
  if (f >= 4) return 'Loyal Customers';

  // Potential Loyalists: Recent, multiple orders
  if (r >= 4 && f >= 2) return 'Potential Loyalists';

  // New Customers: Very recent, first order
  if (r >= 4 && f === 1) return 'New Customers';

  // Promising: Recent, low frequency
  if (r >= 3 && f <= 2) return 'Promising';

  // Need Attention: Above average RFM, slipping
  if (r === 3 && f >= 3) return 'Need Attention';

  // About to Sleep: Below average recency
  if (r === 2) return 'About to Sleep';

  // At Risk: Spent big but haven't returned
  if (r <= 2 && f >= 3 && m >= 3) return 'At Risk';

  // Can't Lose Them: Made big purchases, long ago
  if (r === 1 && f >= 4 && m >= 4) return "Can't Lose Them";

  // Hibernating: Low everything, last chance
  if (r <= 2 && f <= 2) return 'Hibernating';

  // Lost: Very low everything
  if (r === 1 && f === 1) return 'Lost';

  return 'Other';
}

// ─────────────────────────────────────────────────────────────────────────────
// CHURN RISK CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate churn risk based on multiple signals
 * @param {Object} customerData
 * @returns {Object} Churn risk analysis
 */
function calculateChurnRisk(customerData) {
  const {
    daysSinceLastPurchase = 365,
    totalOrders = 0,
    totalSpent = 0,
    emailOpenRate = 0,
    emailClickRate = 0,
    previousOpenRate = 0,
    previousClickRate = 0,
    supportTickets = 0,
    negativeReviews = 0
  } = customerData;

  const signals = [];
  let riskScore = 0;

  // Signal 1: Recency (weight: 35%)
  if (daysSinceLastPurchase > 180) {
    riskScore += 0.35;
    signals.push({ signal: 'recency_critical', weight: 0.35, value: daysSinceLastPurchase });
  } else if (daysSinceLastPurchase > 90) {
    riskScore += 0.25;
    signals.push({ signal: 'recency_poor', weight: 0.25, value: daysSinceLastPurchase });
  } else if (daysSinceLastPurchase > 60) {
    riskScore += 0.15;
    signals.push({ signal: 'recency_declining', weight: 0.15, value: daysSinceLastPurchase });
  }

  // Signal 2: Email engagement decline (weight: 25%)
  if (emailOpenRate < CONFIG.engagement.lowOpenRate) {
    riskScore += 0.15;
    signals.push({ signal: 'low_open_rate', weight: 0.15, value: emailOpenRate });
  }
  if (previousOpenRate > 0 && emailOpenRate < previousOpenRate * (1 - CONFIG.engagement.declineThreshold)) {
    riskScore += 0.10;
    signals.push({ signal: 'open_rate_decline', weight: 0.10, value: `${Math.round((1 - emailOpenRate / previousOpenRate) * 100)}%` });
  }

  // Signal 3: Frequency decline (weight: 20%)
  if (totalOrders === 1 && daysSinceLastPurchase > 60) {
    riskScore += 0.20;
    signals.push({ signal: 'one_time_buyer_inactive', weight: 0.20, value: totalOrders });
  } else if (totalOrders <= 2 && daysSinceLastPurchase > 45) {
    riskScore += 0.10;
    signals.push({ signal: 'low_frequency', weight: 0.10, value: totalOrders });
  }

  // Signal 4: Support issues (weight: 15%)
  if (supportTickets >= 3) {
    riskScore += 0.15;
    signals.push({ signal: 'high_support_tickets', weight: 0.15, value: supportTickets });
  } else if (supportTickets >= 1) {
    riskScore += 0.05;
    signals.push({ signal: 'has_support_tickets', weight: 0.05, value: supportTickets });
  }

  // Signal 5: Negative reviews (weight: 5%)
  if (negativeReviews > 0) {
    riskScore += Math.min(0.05, negativeReviews * 0.02);
    signals.push({ signal: 'negative_reviews', weight: 0.05, value: negativeReviews });
  }

  // Determine risk level
  let riskLevel;
  if (riskScore >= CONFIG.churnRisk.critical) {
    riskLevel = 'critical';
  } else if (riskScore >= CONFIG.churnRisk.high) {
    riskLevel = 'high';
  } else if (riskScore >= CONFIG.churnRisk.medium) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return {
    riskScore: Math.round(riskScore * 100) / 100,
    riskLevel,
    signals,
    needsIntervention: riskScore >= CONFIG.churnRisk.medium
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI-ENHANCED ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

const CHURN_ANALYSIS_PROMPT = `Tu es un expert en retention client e-commerce. Analyse ce profil client et fournis des recommandations personnalisées pour prévenir le churn.

DONNÉES CLIENT:
{customerData}

RFM SCORES:
{rfmScores}

RISQUE DE CHURN:
{churnRisk}

Fournis une analyse JSON avec:
1. "summary": Résumé de la situation (2-3 phrases)
2. "primaryReason": Raison principale du risque de churn
3. "recommendations": Array de 3-5 actions concrètes à prendre
4. "urgency": "immediate" | "this_week" | "this_month"
5. "suggestedOffer": Offre personnalisée à proposer
6. "winbackProbability": Probabilité de reconversion (0-1)
7. "optimalChannel": "email" | "sms" | "phone" | "whatsapp"

Réponds UNIQUEMENT en JSON valide, sans markdown.`;

/**
 * Get AI-enhanced churn analysis
 */
async function getAIChurnAnalysis(customerData, rfmScores, churnRisk) {
  const prompt = CHURN_ANALYSIS_PROMPT
    .replace('{customerData}', JSON.stringify(customerData, null, 2))
    .replace('{rfmScores}', JSON.stringify(rfmScores, null, 2))
    .replace('{churnRisk}', JSON.stringify(churnRisk, null, 2));

  const providerOrder = ['grok', 'openai', 'gemini', 'anthropic'];
  const errors = [];

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) continue;

    try {
      console.log(`  [AI] Trying ${provider.name}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

      let response;
      let aiText;

      if (providerKey === 'gemini') {
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Gemini error: ${response.status}`);
        }

        const geminiResult = await response.json();
        aiText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

      } else if (providerKey === 'anthropic') {
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': provider.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: provider.model,
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Anthropic error: ${response.status}`);
        }

        const anthropicResult = await response.json();
        aiText = anthropicResult.content?.[0]?.text || '';

      } else {
        // Grok / OpenAI format
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`${provider.name} error: ${response.status}`);
        }

        const result = await response.json();
        aiText = result.choices?.[0]?.message?.content || '';
      }

      // Clean and parse JSON
      const cleaned = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = safeJsonParse(cleaned, `${provider.name} churn analysis`);

      if (parsed.success && parsed.data) {
        return {
          success: true,
          provider: provider.name,
          analysis: parsed.data,
          aiGenerated: true
        };
      }

      errors.push({ provider: provider.name, error: 'Invalid JSON response' });

    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`  [AI] ${provider.name} failed: ${err.message}`);
    }
  }

  // Fallback to rule-based analysis
  return {
    success: true,
    provider: 'Rule-based',
    analysis: getRuleBasedAnalysis(customerData, rfmScores, churnRisk),
    aiGenerated: false,
    errors
  };
}

/**
 * Rule-based fallback analysis
 */
function getRuleBasedAnalysis(customerData, rfmScores, churnRisk) {
  const recommendations = [];
  let urgency = 'this_month';
  let suggestedOffer = 'Livraison gratuite sur votre prochaine commande';
  let optimalChannel = 'email';

  // Build recommendations based on signals
  if (churnRisk.riskLevel === 'critical') {
    urgency = 'immediate';
    suggestedOffer = '20% de réduction + livraison gratuite';
    optimalChannel = 'phone';
    recommendations.push('Appel personnalisé du service client');
    recommendations.push('Offre VIP exclusive avec forte réduction');
  } else if (churnRisk.riskLevel === 'high') {
    urgency = 'this_week';
    suggestedOffer = '15% de réduction';
    optimalChannel = 'email';
    recommendations.push('Email de reconquête personnalisé');
    recommendations.push('Offre de réduction ciblée');
  }

  if (customerData.supportTickets > 0) {
    recommendations.push('Suivi proactif des problèmes rencontrés');
  }

  if (rfmScores.monetary >= 4) {
    recommendations.push('Invitation au programme VIP');
  }

  if (customerData.totalOrders === 1) {
    recommendations.push('Série de nurturing pour nouveaux clients');
  }

  if (recommendations.length < 3) {
    recommendations.push('Newsletter avec contenu de valeur');
    recommendations.push('Recommandations produits personnalisées');
  }

  return {
    summary: `Client ${rfmScores.segment} avec risque de churn ${churnRisk.riskLevel}. ${churnRisk.signals.length} signaux d'alerte détectés.`,
    primaryReason: churnRisk.signals[0]?.signal || 'inactivity',
    recommendations: recommendations.slice(0, 5),
    urgency,
    suggestedOffer,
    winbackProbability: Math.max(0.1, 1 - churnRisk.riskScore),
    optimalChannel
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HITL: INTERVENTION MANAGEMENT (Session 157)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure HITL directories exist
 */
function ensureHITLDirs() {
  if (!fs.existsSync(HITL_CONFIG.pendingDir)) {
    fs.mkdirSync(HITL_CONFIG.pendingDir, { recursive: true });
  }
  if (!fs.existsSync(HITL_CONFIG.approvedDir)) {
    fs.mkdirSync(HITL_CONFIG.approvedDir, { recursive: true });
  }
}

/**
 * Generate unique intervention ID
 */
function generateInterventionId() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `intervention-${timestamp}-${random}`;
}

/**
 * Save intervention for human approval (high-LTV customers)
 */
function saveInterventionForApproval(customer, prediction, proposedAction) {
  ensureHITLDirs();

  const interventionId = generateInterventionId();
  const intervention = {
    id: interventionId,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
    customer: {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      totalSpent: customer.totalSpent,
      ltv: customer.totalSpent || 0,
    },
    prediction: {
      riskLevel: prediction.churnRisk.riskLevel,
      riskScore: prediction.churnRisk.riskScore,
      rfmSegment: prediction.rfm.segment,
      signals: prediction.churnRisk.signals,
    },
    proposedAction: {
      type: proposedAction.type,
      channel: proposedAction.channel,
      suggestedOffer: proposedAction.suggestedOffer,
      urgency: proposedAction.urgency,
    },
    aiAnalysis: prediction.aiAnalysis,
    approveCmd: `node churn-prediction-resilient.cjs --approve-intervention=${interventionId}`,
    rejectCmd: `node churn-prediction-resilient.cjs --reject-intervention=${interventionId}`,
  };

  const interventionPath = path.join(HITL_CONFIG.pendingDir, `${interventionId}.json`);
  fs.writeFileSync(interventionPath, JSON.stringify(intervention, null, 2));

  console.log(`\n  [HITL] ⚠️  HIGH-VALUE CUSTOMER - Human approval required`);
  console.log(`    LTV: €${customer.totalSpent} (threshold: €${HITL_CONFIG.ltvThresholdForApproval})`);
  console.log(`    Intervention ID: ${interventionId}`);
  console.log(`    Proposed Action: ${proposedAction.type} via ${proposedAction.channel}`);
  console.log(`\n    📋 NEXT STEPS:`);
  console.log(`       Review: node churn-prediction-resilient.cjs --view-intervention=${interventionId}`);
  console.log(`       Approve: node churn-prediction-resilient.cjs --approve-intervention=${interventionId}`);
  console.log(`       Reject:  node churn-prediction-resilient.cjs --reject-intervention=${interventionId}`);

  return { id: interventionId, path: interventionPath, status: 'pending_approval' };
}

/**
 * List pending interventions
 */
function listPendingInterventions() {
  ensureHITLDirs();
  const interventions = [];
  const files = fs.readdirSync(HITL_CONFIG.pendingDir);

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(HITL_CONFIG.pendingDir, file), 'utf8'));
        interventions.push({
          id: data.id,
          customer: data.customer.email,
          ltv: data.customer.ltv,
          riskLevel: data.prediction.riskLevel,
          proposedAction: data.proposedAction.type,
          createdAt: data.createdAt,
          status: data.status,
        });
      } catch (e) {
        console.warn(`[WARN] Could not parse intervention: ${file}`);
      }
    }
  }

  return interventions;
}

/**
 * Get intervention by ID
 */
function getIntervention(interventionId) {
  const pendingPath = path.join(HITL_CONFIG.pendingDir, `${interventionId}.json`);
  if (fs.existsSync(pendingPath)) {
    return JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
  }
  return null;
}

/**
 * Approve intervention and execute
 */
async function approveIntervention(interventionId) {
  const intervention = getIntervention(interventionId);
  if (!intervention) {
    return { success: false, error: `Intervention not found: ${interventionId}` };
  }

  intervention.status = 'approved';
  intervention.approvedAt = new Date().toISOString();

  // Execute the approved action
  let actionResult = { success: false, error: 'No action taken' };
  if (intervention.proposedAction.channel === 'phone' && intervention.customer.phone) {
    console.log(`  [HITL] Executing approved voice call to ${intervention.customer.phone}`);
    actionResult = await triggerVoiceAgent(intervention.customer.phone);
  }

  intervention.actionResult = actionResult;

  // Move to approved folder
  const approvedPath = path.join(HITL_CONFIG.approvedDir, `${interventionId}.json`);
  fs.writeFileSync(approvedPath, JSON.stringify(intervention, null, 2));

  // Remove from pending
  const pendingPath = path.join(HITL_CONFIG.pendingDir, `${interventionId}.json`);
  fs.unlinkSync(pendingPath);

  console.log(`  [HITL] ✅ Intervention approved and executed: ${interventionId}`);
  return { success: true, intervention, actionResult };
}

/**
 * Reject intervention
 */
function rejectIntervention(interventionId, reason = '') {
  const intervention = getIntervention(interventionId);
  if (!intervention) {
    return { success: false, error: `Intervention not found: ${interventionId}` };
  }

  intervention.status = 'rejected';
  intervention.rejectedAt = new Date().toISOString();
  intervention.rejectionReason = reason;

  // Keep in pending folder with rejected status (audit trail)
  const pendingPath = path.join(HITL_CONFIG.pendingDir, `${interventionId}.json`);
  fs.writeFileSync(pendingPath, JSON.stringify(intervention, null, 2));

  console.log(`  [HITL] ❌ Intervention rejected: ${interventionId}`);
  return { success: true, intervention };
}

/**
 * Check if customer is high-LTV (requires approval)
 */
function isHighLTVCustomer(customerData) {
  const ltv = customerData.totalSpent || 0;
  return ltv >= HITL_CONFIG.ltvThresholdForApproval;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENTIC ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function triggerVoiceAgent(phone) {
  try {
    const response = await fetch('http://localhost:3009/voice/outbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return { success: true, callSid: result.callSid, status: result.status };
  } catch (error) {
    console.error(`  [Agentic] Action Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PREDICTION FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full churn prediction for a customer
 * @param {Object} customerData
 * @returns {Object} Complete churn prediction
 */
async function predictChurn(customerData) {
  const email = customerData.email || 'unknown';
  console.log(`\n[Churn] Analyzing customer: ${email}`);

  // Step 1: Calculate RFM
  const rfmScores = calculateRFM(customerData);
  console.log(`  [RFM] Segment: ${rfmScores.segment} (R:${rfmScores.recency} F:${rfmScores.frequency} M:${rfmScores.monetary})`);

  // Step 2: Calculate churn risk
  const churnRisk = calculateChurnRisk(customerData);
  console.log(`  [Risk] Level: ${churnRisk.riskLevel} (${Math.round(churnRisk.riskScore * 100)}%)`);

  // Step 3: Get AI analysis if risk is medium or higher
  let aiAnalysis = null;
  if (churnRisk.needsIntervention) {
    console.log('  [AI] Getting enhanced analysis...');
    aiAnalysis = await getAIChurnAnalysis(customerData, rfmScores, churnRisk);
  }

  // Step 4: ACT - Agentic autonomous action (Level 4 Agent)
  // HITL: High-LTV customers require human approval before intervention
  let actionResult = null;
  let hitlStatus = null;
  const analysisData = aiAnalysis?.analysis;

  const shouldAct = analysisData && customerData.phone &&
    (churnRisk.riskLevel === 'critical' || (churnRisk.riskLevel === 'high' && analysisData.optimalChannel === 'phone'));

  if (shouldAct) {
    const proposedAction = {
      type: 'voice_call',
      channel: 'phone',
      suggestedOffer: analysisData.suggestedOffer,
      urgency: analysisData.urgency,
    };

    // HITL CHECK: High-LTV customers require approval
    if (HITL_CONFIG.requireApprovalForHighLTV && isHighLTVCustomer(customerData)) {
      console.log(`  [Agentic] ⚠️ CRITICAL RISK DETECTED - HIGH-VALUE CUSTOMER`);
      console.log(`  [Agentic] LTV: €${customerData.totalSpent} exceeds threshold €${HITL_CONFIG.ltvThresholdForApproval}`);
      console.log(`  [Agentic] HITL: Saving intervention for human approval...`);

      hitlStatus = saveInterventionForApproval(customerData, { churnRisk, rfm: rfmScores, aiAnalysis: analysisData }, proposedAction);
      actionResult = { status: 'pending_approval', interventionId: hitlStatus.id };

    } else {
      // Low-LTV customers: Auto-execute (acceptable risk)
      console.log(`  [Agentic] ⚠️ CRITICAL RISK DETECTED. Deciding to ACT.`);
      console.log(`  [Agentic] LTV: €${customerData.totalSpent || 0} (below threshold - auto-approve)`);
      console.log(`  [Agentic] Action: Triggering immediate voice call to ${customerData.phone}`);

      actionResult = await triggerVoiceAgent(customerData.phone);
      console.log(`  [Agentic] Result: ${actionResult.success ? 'Call Initiated ✅' : 'Failed ❌'}`);
    }
  }

  return {
    customer: {
      email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      ltv: customerData.totalSpent || 0,
    },
    rfm: rfmScores,
    churnRisk,
    aiAnalysis: aiAnalysis?.analysis || null,
    agenticAction: actionResult,
    hitlStatus: hitlStatus || null,
    provider: aiAnalysis?.provider || 'N/A',
    aiGenerated: aiAnalysis?.aiGenerated || false,
    timestamp: new Date().toISOString(),
    benchmarks: CONFIG.benchmarks
  };
}

/**
 * Batch prediction for multiple customers
 * @param {Array} customers
 * @returns {Object} Batch results with summary
 */
async function predictChurnBatch(customers) {
  console.log(`\n[Batch] Processing ${customers.length} customers...`);

  const results = [];
  const summary = {
    total: customers.length,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    criticalRisk: 0,
    needsIntervention: 0
  };

  for (const customer of customers) {
    const prediction = await predictChurn(customer);
    results.push(prediction);

    // Update summary
    switch (prediction.churnRisk.riskLevel) {
      case 'low': summary.lowRisk++; break;
      case 'medium': summary.mediumRisk++; break;
      case 'high': summary.highRisk++; break;
      case 'critical': summary.criticalRisk++; break;
    }

    if (prediction.churnRisk.needsIntervention) {
      summary.needsIntervention++;
    }
  }

  return {
    results,
    summary,
    timestamp: new Date().toISOString()
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KLAVIYO INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update Klaviyo profile with churn data
 */
async function updateKlaviyoProfile(prediction) {
  if (!KLAVIYO.enabled) {
    console.log('  [Klaviyo] Not configured, skipping profile update');
    return { success: false, error: 'Klaviyo not configured' };
  }

  const profileData = {
    data: {
      type: 'profile',
      attributes: {
        email: prediction.customer.email,
        properties: {
          churn_risk_score: prediction.churnRisk.riskScore,
          churn_risk_level: prediction.churnRisk.riskLevel,
          rfm_segment: prediction.rfm.segment,
          rfm_recency: prediction.rfm.recency,
          rfm_frequency: prediction.rfm.frequency,
          rfm_monetary: prediction.rfm.monetary,
          rfm_composite: prediction.rfm.composite,
          needs_intervention: prediction.churnRisk.needsIntervention,
          churn_analysis_date: prediction.timestamp
        }
      }
    }
  };

  if (prediction.aiAnalysis) {
    profileData.data.attributes.properties.suggested_offer = prediction.aiAnalysis.suggestedOffer;
    profileData.data.attributes.properties.winback_probability = prediction.aiAnalysis.winbackProbability;
    profileData.data.attributes.properties.optimal_channel = prediction.aiAnalysis.optimalChannel;
  }

  try {
    const response = await fetch(`${KLAVIYO.baseUrl}/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${KLAVIYO.apiKey}`,
        'revision': KLAVIYO.revision
      },
      body: JSON.stringify(profileData)
    });

    if (response.ok || response.status === 409) {
      console.log(`  [Klaviyo] Profile updated: ${prediction.customer.email}`);
      return { success: true };
    }

    const error = await response.text();
    console.log(`  [Klaviyo] Error: ${response.status} - ${error}`);
    return { success: false, error };

  } catch (err) {
    console.log(`  [Klaviyo] Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────

const http = require('http');

function startServer(port = 3010) {
  const ALLOWED_ORIGINS = [
    'https://3a-automation.com',
    'https://dashboard.3a-automation.com',
    'http://localhost:3000'
  ];

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const providers = Object.entries(PROVIDERS)
        .map(([k, p]) => ({ name: p.name, enabled: p.enabled }));

      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        service: 'churn-prediction-resilient',
        version: '1.0.0',
        providers,
        klaviyo: KLAVIYO.enabled,
        benchmarks: CONFIG.benchmarks
      }));
      return;
    }

    // Single prediction
    if (req.url === '/predict' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        if (body.length > 100000) return; // 100KB limit
        body += chunk;
      });

      req.on('end', async () => {
        const parsed = safeJsonParse(body, 'POST /predict');
        if (!parsed.success) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        const customerData = parsed.data;
        if (!customerData.email) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'email required' }));
          return;
        }

        try {
          const prediction = await predictChurn(customerData);

          // Update Klaviyo if requested
          if (customerData.updateKlaviyo) {
            prediction.klaviyoUpdate = await updateKlaviyoProfile(prediction);
          }

          res.writeHead(200);
          res.end(JSON.stringify(prediction));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Batch prediction
    if (req.url === '/predict-batch' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        if (body.length > 1000000) return; // 1MB limit
        body += chunk;
      });

      req.on('end', async () => {
        const parsed = safeJsonParse(body, 'POST /predict-batch');
        if (!parsed.success) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        const { customers, updateKlaviyo } = parsed.data;
        if (!Array.isArray(customers) || customers.length === 0) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'customers array required' }));
          return;
        }

        try {
          const batchResults = await predictChurnBatch(customers);

          // Update Klaviyo for at-risk customers if requested
          if (updateKlaviyo) {
            for (const prediction of batchResults.results) {
              if (prediction.churnRisk.needsIntervention) {
                await updateKlaviyoProfile(prediction);
              }
            }
          }

          res.writeHead(200);
          res.end(JSON.stringify(batchResults));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    console.log(`\n[Churn] Server running on port ${port}`);
    console.log('Endpoints:');
    console.log('  GET  /health        - Service status');
    console.log('  POST /predict       - Single customer prediction');
    console.log('  POST /predict-batch - Batch prediction');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--([\w-]+)(?:=(.+))?$/);
    if (match) {
      args[match[1]] = match[2] || true;
    }
  });
  return args;
}

function printUsage() {
  console.log(`
Churn Prediction Resilient v2.0 - 3A Automation (HITL Edition)
Session 157 - RFM + AI Analysis + Human In The Loop

FEATURES:
  [+] RFM Scoring (Recency, Frequency, Monetary)
  [+] AI-Enhanced Analysis (Grok → OpenAI → Gemini → Claude → Rule-based)
  [+] HITL: High-LTV customers require human approval before voice calls
  [+] Klaviyo Profile Integration
  [+] Agentic Voice Outreach (with approval workflow)

Usage:
  node churn-prediction-resilient.cjs --health
  node churn-prediction-resilient.cjs --predict --customer='{...}'
  node churn-prediction-resilient.cjs --server [--port=3010]

HITL Commands (High-Value Customer Protection):
  --list-interventions           List pending interventions
  --view-intervention=ID         View intervention details
  --approve-intervention=ID      Approve and execute intervention
  --reject-intervention=ID       Reject intervention (add --reason="...")

Prediction Options:
  --health          Check providers and HITL status
  --predict         Predict churn for single customer
  --customer=JSON   Customer data (required for --predict)
  --update-klaviyo  Update Klaviyo profile with results
  --server          Start HTTP server
  --port=N          Server port (default: 3010)

Customer data fields:
  email                 (required)
  firstName, lastName   (optional)
  phone                 (for voice outreach)
  daysSinceLastPurchase (default: 365)
  totalOrders           (default: 0)
  totalSpent            (default: 0) ⚠️ LTV - triggers HITL if >= €${HITL_CONFIG.ltvThresholdForApproval}
  emailOpenRate         (0-1)
  emailClickRate        (0-1)
  previousOpenRate      (0-1, for decline detection)
  supportTickets        (count)
  negativeReviews       (count)

HITL Workflow:
  1. Predict: Customer with LTV >= €${HITL_CONFIG.ltvThresholdForApproval} triggers intervention review
  2. Review:  node churn-prediction-resilient.cjs --list-interventions
  3. Approve: node churn-prediction-resilient.cjs --approve-intervention=<id>
  4. Reject:  node churn-prediction-resilient.cjs --reject-intervention=<id> --reason="..."

Environment Variables:
  CHURN_LTV_THRESHOLD   LTV threshold for approval (default: €500)
  SLACK_WEBHOOK_URL     Slack notifications for pending interventions

Examples:
  # Predict for low-LTV customer (auto-action)
  node churn-prediction-resilient.cjs --predict --customer='{"email":"test@example.com","totalSpent":100,"daysSinceLastPurchase":120}'

  # Predict for high-LTV customer (requires approval)
  node churn-prediction-resilient.cjs --predict --customer='{"email":"vip@example.com","totalSpent":800,"phone":"+33612345678","daysSinceLastPurchase":90}'

  # Review and approve intervention
  node churn-prediction-resilient.cjs --list-interventions
  node churn-prediction-resilient.cjs --approve-intervention=intervention-xxxx
`);
}

async function main() {
  const args = parseArgs();

  if (args.server) {
    startServer(parseInt(args.port) || 3010);
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HITL COMMANDS (Session 157)
  // ─────────────────────────────────────────────────────────────────────────

  // List pending interventions
  if (args['list-interventions'] || args.listinterventions) {
    console.log('\n=== PENDING INTERVENTIONS ===\n');
    const interventions = listPendingInterventions();

    if (interventions.length === 0) {
      console.log('No pending interventions.');
      return;
    }

    interventions.forEach((i, idx) => {
      const statusIcon = i.status === 'pending_approval' ? '⏸️' : i.status === 'approved' ? '✅' : '❌';
      console.log(`${idx + 1}. ${statusIcon} [${i.id}]`);
      console.log(`   Customer: ${i.customer}`);
      console.log(`   LTV: €${i.ltv} | Risk: ${i.riskLevel.toUpperCase()}`);
      console.log(`   Action: ${i.proposedAction}`);
      console.log(`   Created: ${i.createdAt}`);
      console.log('');
    });

    console.log(`Total: ${interventions.length} pending intervention(s)`);
    console.log('\nCommands:');
    console.log('  --view-intervention=<id>     View full details');
    console.log('  --approve-intervention=<id>  Approve and execute');
    console.log('  --reject-intervention=<id>   Reject intervention');
    return;
  }

  // View intervention
  if (args['view-intervention'] || args.viewintervention) {
    const interventionId = args['view-intervention'] || args.viewintervention;
    const intervention = getIntervention(interventionId);

    if (!intervention) {
      console.error(`[ERROR] Intervention not found: ${interventionId}`);
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`INTERVENTION REVIEW: ${intervention.id}`);
    console.log('═'.repeat(60));
    console.log(`Status: ${intervention.status}`);
    console.log(`Created: ${intervention.createdAt}`);
    console.log('─'.repeat(60));
    console.log('\nCUSTOMER:');
    console.log(`  Email: ${intervention.customer.email}`);
    console.log(`  Name: ${intervention.customer.firstName} ${intervention.customer.lastName}`);
    console.log(`  Phone: ${intervention.customer.phone}`);
    console.log(`  LTV: €${intervention.customer.ltv}`);
    console.log('\nRISK ASSESSMENT:');
    console.log(`  Level: ${intervention.prediction.riskLevel.toUpperCase()}`);
    console.log(`  Score: ${Math.round(intervention.prediction.riskScore * 100)}%`);
    console.log(`  Segment: ${intervention.prediction.rfmSegment}`);
    console.log('\nPROPOSED ACTION:');
    console.log(`  Type: ${intervention.proposedAction.type}`);
    console.log(`  Channel: ${intervention.proposedAction.channel}`);
    console.log(`  Urgency: ${intervention.proposedAction.urgency}`);
    console.log(`  Suggested Offer: ${intervention.proposedAction.suggestedOffer}`);
    if (intervention.aiAnalysis) {
      console.log('\nAI RECOMMENDATIONS:');
      intervention.aiAnalysis.recommendations?.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r}`);
      });
    }
    console.log('\n' + '═'.repeat(60));
    console.log('\nACTIONS:');
    console.log(`  ✅ Approve: node churn-prediction-resilient.cjs --approve-intervention=${interventionId}`);
    console.log(`  ❌ Reject:  node churn-prediction-resilient.cjs --reject-intervention=${interventionId} --reason="..."`);
    return;
  }

  // Approve intervention
  if (args['approve-intervention'] || args.approveintervention) {
    const interventionId = args['approve-intervention'] || args.approveintervention;
    console.log(`\n[HITL] Approving intervention: ${interventionId}`);

    const result = await approveIntervention(interventionId);
    if (!result.success) {
      console.error(`[ERROR] ${result.error}`);
      process.exit(1);
    }

    console.log(`[HITL] ✅ Intervention approved and executed.`);
    if (result.actionResult) {
      console.log(`   Action result: ${result.actionResult.success ? 'Success' : 'Failed'}`);
    }
    return;
  }

  // Reject intervention
  if (args['reject-intervention'] || args.rejectintervention) {
    const interventionId = args['reject-intervention'] || args.rejectintervention;
    const reason = args.reason || '';
    console.log(`\n[HITL] Rejecting intervention: ${interventionId}`);

    const result = rejectIntervention(interventionId, reason);
    if (!result.success) {
      console.error(`[ERROR] ${result.error}`);
      process.exit(1);
    }

    console.log(`[HITL] ❌ Intervention rejected.`);
    if (reason) console.log(`   Reason: ${reason}`);
    return;
  }

  if (args.health) {
    console.log('\n=== CHURN PREDICTION SERVICE ===');
    console.log('Version: 3.0.0 (Session 165sexies - Full Flexibility Edition)');
    console.log('\n=== AI PROVIDERS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '[OK] Configured' : '[--] Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    console.log('Rule-based fallback: [OK] Always available');
    console.log('\n=== INTEGRATIONS ===');
    console.log(`Klaviyo: ${KLAVIYO.enabled ? '[OK] Configured' : '[--] Not configured'}`);
    console.log('\n=== HITL (Human In The Loop) ===');
    console.log(`LTV Threshold for Approval: €${HITL_CONFIG.ltvThresholdForApproval} (options: ${HITL_CONFIG.ltvThresholdOptions.join(', ')})`);
    console.log(`High-LTV Approval Required: ${HITL_CONFIG.requireApprovalForHighLTV ? '[ON] Yes' : '[OFF] No'}`);
    console.log(`Pending Directory: ${HITL_CONFIG.pendingDir}`);
    const pendingInterventions = listPendingInterventions();
    console.log(`Pending Interventions: ${pendingInterventions.length}`);
    console.log('\n=== RFM THRESHOLDS (Configurable) ===');
    console.log('Recency (days):');
    console.log(`  Excellent: ${CONFIG.rfm.recency.excellent} (options: ${RFM_CONFIG.recencyOptions.excellent.join(', ')})`);
    console.log(`  Good: ${CONFIG.rfm.recency.good} (options: ${RFM_CONFIG.recencyOptions.good.join(', ')})`);
    console.log(`  Average: ${CONFIG.rfm.recency.average} (options: ${RFM_CONFIG.recencyOptions.average.join(', ')})`);
    console.log('Frequency (orders):');
    console.log(`  Excellent: ${CONFIG.rfm.frequency.excellent} (options: ${RFM_CONFIG.frequencyOptions.excellent.join(', ')})`);
    console.log(`  Good: ${CONFIG.rfm.frequency.good} (options: ${RFM_CONFIG.frequencyOptions.good.join(', ')})`);
    console.log('Monetary (€):');
    console.log(`  Excellent: €${CONFIG.rfm.monetary.excellent} (options: ${RFM_CONFIG.monetaryOptions.excellent.join(', ')})`);
    console.log(`  Good: €${CONFIG.rfm.monetary.good} (options: ${RFM_CONFIG.monetaryOptions.good.join(', ')})`);
    console.log('\n=== CHURN RISK THRESHOLDS (Configurable) ===');
    console.log(`Low: ${CHURN_RISK_CONFIG.low} (options: ${CHURN_RISK_CONFIG.options.low.join(', ')})`);
    console.log(`Medium: ${CHURN_RISK_CONFIG.medium} (options: ${CHURN_RISK_CONFIG.options.medium.join(', ')})`);
    console.log(`High: ${CHURN_RISK_CONFIG.high} (options: ${CHURN_RISK_CONFIG.options.high.join(', ')})`);
    console.log(`Critical: ${CHURN_RISK_CONFIG.critical} (options: ${CHURN_RISK_CONFIG.options.critical.join(', ')})`);
    console.log('\n=== ENGAGEMENT THRESHOLDS (Configurable) ===');
    console.log(`Low Open Rate: ${ENGAGEMENT_CONFIG.lowOpenRate * 100}% (options: ${ENGAGEMENT_CONFIG.lowOpenRateOptions.map(v => v * 100 + '%').join(', ')})`);
    console.log(`Low Click Rate: ${ENGAGEMENT_CONFIG.lowClickRate * 100}% (options: ${ENGAGEMENT_CONFIG.lowClickRateOptions.map(v => v * 100 + '%').join(', ')})`);
    console.log(`Decline Threshold: ${ENGAGEMENT_CONFIG.declineThreshold * 100}% (options: ${ENGAGEMENT_CONFIG.declineThresholdOptions.map(v => v * 100 + '%').join(', ')})`);
    console.log('\n=== BENCHMARKS ===');
    console.log(`Churn reduction: -${CONFIG.benchmarks.churnReduction * 100}%`);
    console.log(`At-risk conversion: +${CONFIG.benchmarks.atRiskConversion * 100}%`);
    console.log(`Retention ROI: ${CONFIG.benchmarks.retentionROI}x vs acquisition`);
    return;
  }

  if (args.predict && args.customer) {
    const parsed = safeJsonParse(args.customer, 'CLI --customer');
    if (!parsed.success) {
      console.error('Error parsing customer JSON:', parsed.error);
      process.exit(1);
    }

    const customerData = parsed.data;
    if (!customerData.email) {
      console.error('Error: email is required');
      process.exit(1);
    }

    const prediction = await predictChurn(customerData);

    console.log('\n=== PREDICTION RESULTS ===');
    console.log('Customer:', prediction.customer.email);
    console.log('\n--- RFM Analysis ---');
    console.log('Segment:', prediction.rfm.segment);
    console.log(`Scores: R=${prediction.rfm.recency} F=${prediction.rfm.frequency} M=${prediction.rfm.monetary}`);
    console.log('Composite:', prediction.rfm.composite);

    console.log('\n--- Churn Risk ---');
    console.log('Level:', prediction.churnRisk.riskLevel.toUpperCase());
    console.log('Score:', `${Math.round(prediction.churnRisk.riskScore * 100)}%`);
    console.log('Signals:', prediction.churnRisk.signals.length);
    prediction.churnRisk.signals.forEach(s => {
      console.log(`  - ${s.signal}: ${s.value} (weight: ${Math.round(s.weight * 100)}%)`);
    });

    if (prediction.aiAnalysis) {
      console.log('\n--- AI Analysis ---');
      console.log('Provider:', prediction.provider);
      console.log('AI Generated:', prediction.aiGenerated);
      console.log('Summary:', prediction.aiAnalysis.summary);
      console.log('Primary Reason:', prediction.aiAnalysis.primaryReason);
      console.log('Urgency:', prediction.aiAnalysis.urgency);
      console.log('Suggested Offer:', prediction.aiAnalysis.suggestedOffer);
      console.log('Winback Probability:', `${Math.round(prediction.aiAnalysis.winbackProbability * 100)}%`);
      console.log('Optimal Channel:', prediction.aiAnalysis.optimalChannel);
      console.log('Recommendations:');
      prediction.aiAnalysis.recommendations.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r}`);
      });
    }

    if (args['update-klaviyo']) {
      console.log('\n--- Klaviyo Update ---');
      const result = await updateKlaviyoProfile(prediction);
      console.log('Result:', result.success ? 'Success' : `Failed: ${result.error}`);
    }

    return;
  }

  printUsage();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
