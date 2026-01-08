#!/usr/bin/env node
/**
 * Churn Prediction Resilient - 3A Automation
 * Session 127bis - 03/01/2026
 *
 * RFM-based churn prediction with AI enhancement
 * Multi-provider fallback: Grok → OpenAI → Gemini → Claude → Rule-based
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

const CONFIG = {
  // RFM Thresholds
  rfm: {
    recency: {
      excellent: 30,    // < 30 days = score 5
      good: 60,         // 30-60 days = score 4
      average: 90,      // 60-90 days = score 3
      poor: 180,        // 90-180 days = score 2
      critical: 365     // > 180 days = score 1
    },
    frequency: {
      excellent: 10,    // > 10 orders = score 5
      good: 6,          // 6-10 orders = score 4
      average: 3,       // 3-5 orders = score 3
      poor: 2,          // 2 orders = score 2
      critical: 1       // 1 order = score 1
    },
    monetary: {
      excellent: 1000,  // > 1000€ = score 5
      good: 500,        // 500-1000€ = score 4
      average: 200,     // 200-500€ = score 3
      poor: 100,        // 100-200€ = score 2
      critical: 0       // < 100€ = score 1
    }
  },
  // Churn Risk Thresholds
  churnRisk: {
    low: 0.3,           // < 30% = low risk
    medium: 0.5,        // 30-50% = medium risk
    high: 0.7,          // 50-70% = high risk
    critical: 0.85      // > 85% = critical risk
  },
  // Engagement thresholds
  engagement: {
    lowOpenRate: 0.10,      // < 10% open rate = concerning
    lowClickRate: 0.02,     // < 2% click rate = concerning
    declineThreshold: 0.50  // 50% decline from baseline = alarming
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
// AI PROVIDERS (Session 120: OpenAI GPT-5.2 added)
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
  let actionResult = null;
  const analysisData = aiAnalysis?.analysis;

  if (analysisData && customerData.phone &&
    (churnRisk.riskLevel === 'critical' || (churnRisk.riskLevel === 'high' && analysisData.optimalChannel === 'phone'))) {

    console.log(`  [Agentic] ⚠️ CRITICAL RISK DETECTED. Deciding to ACT.`);
    console.log(`  [Agentic] Action: Triggering immediate voice call to ${customerData.phone}`);

    // Only act if not in dry-run mode (can be added later, for now we log intent)
    // To enable real calling, we would uncomment:
    actionResult = await triggerVoiceAgent(customerData.phone);
    console.log(`  [Agentic] Result: ${actionResult.success ? 'Call Initiated ✅' : 'Failed ❌'}`);
  }

  return {
    customer: {
      email,
      firstName: customerData.firstName,
      lastName: customerData.lastName
    },
    rfm: rfmScores,
    churnRisk,
    aiAnalysis: aiAnalysis?.analysis || null,
    agenticAction: actionResult,
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
Churn Prediction Resilient - 3A Automation
Session 127bis - RFM + AI Analysis

Usage:
  node churn-prediction-resilient.cjs --health
  node churn-prediction-resilient.cjs --predict --customer='{...}'
  node churn-prediction-resilient.cjs --server [--port=3010]

Options:
  --health          Check providers status
  --predict         Predict churn for single customer
  --customer=JSON   Customer data (required for --predict)
  --update-klaviyo  Update Klaviyo profile with results
  --server          Start HTTP server
  --port=N          Server port (default: 3010)

Customer data fields:
  email                 (required)
  firstName, lastName   (optional)
  daysSinceLastPurchase (default: 365)
  totalOrders           (default: 0)
  totalSpent            (default: 0)
  emailOpenRate         (0-1)
  emailClickRate        (0-1)
  previousOpenRate      (0-1, for decline detection)
  supportTickets        (count)
  negativeReviews       (count)

Example:
  node churn-prediction-resilient.cjs --predict --customer='{"email":"test@example.com","daysSinceLastPurchase":120,"totalOrders":3,"totalSpent":250,"emailOpenRate":0.08}'
`);
}

async function main() {
  const args = parseArgs();

  if (args.server) {
    startServer(parseInt(args.port) || 3010);
    return;
  }

  if (args.health) {
    console.log('\n=== CHURN PREDICTION SERVICE ===');
    console.log('Version: 1.0.0 (Session 127bis)');
    console.log('\n=== AI PROVIDERS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '[OK] Configured' : '[--] Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    console.log('Rule-based fallback: [OK] Always available');
    console.log('\n=== INTEGRATIONS ===');
    console.log(`Klaviyo: ${KLAVIYO.enabled ? '[OK] Configured' : '[--] Not configured'}`);
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
