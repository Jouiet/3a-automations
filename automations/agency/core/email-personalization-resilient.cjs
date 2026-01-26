#!/usr/bin/env node
/**
 * Resilient Email Personalization - Multi-Provider Fallback
 * 3A Automation - Session 127bis
 *
 * AI-powered email personalization with automatic failover
 * Fallback chain: Grok → OpenAI → Gemini → Claude → Static templates
 *
 * NEW Session 127bis:
 * - 3-Email Abandoned Cart Series (+69% orders vs single email - Klaviyo)
 *   Email 1: 1h after abandon (reminder)
 *   Email 2: 24h after (social proof)
 *   Email 3: 72h after (discount)
 *
 * Usage:
 *   node email-personalization-resilient.cjs --personalize --lead='{"email":"...","company":"..."}'
 *   node email-personalization-resilient.cjs --subject --context='{"topic":"...","segment":"..."}'
 *   node email-personalization-resilient.cjs --abandoned-cart-series --cart='{"email":"...","firstName":"...","products":[...]}'
 *   node email-personalization-resilient.cjs --server --port=3006
 *   node email-personalization-resilient.cjs --health
 *
 * @version 1.1.0
 * @date 2026-01-03
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import security utilities
const {
  RateLimiter,
  setSecurityHeaders
} = require('../../lib/security-utils.cjs');

// ─────────────────────────────────────────────────────────────────────────────
// HITL CONFIG - Session 157
// Preview mode: Review AI-generated emails before sending to customers
// ─────────────────────────────────────────────────────────────────────────────
const HITL_CONFIG = {
  previewDir: path.join(__dirname, '../../../outputs/email-previews'),
  approvedDir: path.join(__dirname, '../../../outputs/email-approved'),
  // Enable preview mode by default (safer)
  previewModeDefault: true,
  // Slack notification for new previews
  slackWebhook: process.env.SLACK_WEBHOOK_URL || null,
  // Admin email for preview notifications
  adminEmail: process.env.HITL_ADMIN_EMAIL || null,
};

// Import Marketing Science Core
const MarketingScience = require('./marketing-science-core.cjs');

// Security constants
const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit
const CORS_WHITELIST = [
  'https://3a-automation.com',
  'https://www.3a-automation.com',
  'https://dashboard.3a-automation.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../../../.env');
    const env = fs.readFileSync(envPath, 'utf8');
    const vars = {};
    env.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match) vars[match[1]] = match[2].trim();
    });
    return vars;
  } catch (e) {
    return process.env;
  }
}

const ENV = loadEnv();

// TEXT GENERATION PROVIDERS - Session 168terdecies: VOLUME TASK (Gemini first)
// Purpose: Generate personalized email content
// Strategy: Email generation = high volume → optimize cost, quality fallback
// Fallback order: Gemini → Grok → Claude → Static templates
const PROVIDERS = {
  gemini: {
    name: 'Gemini 3 Flash',
    // gemini-3-flash-preview: latest frontier model (Jan 2026)
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
  },
  grok: {
    name: 'Grok 4.1 Fast Reasoning',
    // grok-4-1-fast-reasoning: FRONTIER model with reasoning (Jan 2026)
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-4-1-fast-reasoning',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
  },
  anthropic: {
    name: 'Claude Opus 4.5',
    // claude-opus-4-5: best quality for fallback (Nov 2025)
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-opus-4-5-20251101',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY,
  },
};

const BRAND = {
  name: '3A Automation',
  tagline: 'Automation, Analytics, AI',
  url: 'https://3a-automation.com',
  signature: "L'équipe 3A Automation"
};

// ─────────────────────────────────────────────────────────────────────────────
// ABANDONED CART EMAIL SERIES CONFIGURATION (Session 127bis + 165sexies Flexibility)
// Benchmark: +69% orders vs single email (Klaviyo 2025)
// All timing delays are now configurable via ENV variables
// ─────────────────────────────────────────────────────────────────────────────
const ABANDONED_CART_CONFIG = {
  // Timing delays after cart abandonment - FULLY CONFIGURABLE (Session 165sexies)
  // All values in hours for easier configuration
  delays: {
    // Email 1: Quick reminder (default: 1 hour)
    // ENV: CART_EMAIL1_HOURS=1 (options: 0.5, 1, 2, 4)
    email1: (parseFloat(ENV.CART_EMAIL1_HOURS) || 1) * 60 * 60 * 1000,
    // Email 2: Social proof (default: 24 hours)
    // ENV: CART_EMAIL2_HOURS=24 (options: 12, 24, 36, 48)
    email2: (parseFloat(ENV.CART_EMAIL2_HOURS) || 24) * 60 * 60 * 1000,
    // Email 3: Final discount (default: 72 hours)
    // ENV: CART_EMAIL3_HOURS=72 (options: 48, 72, 96, 120, 168)
    email3: (parseFloat(ENV.CART_EMAIL3_HOURS) || 72) * 60 * 60 * 1000
  },
  // Delay options for UI/configuration (in hours)
  delayOptions: {
    email1: [0.5, 1, 2, 4],          // 30min, 1h, 2h, 4h
    email2: [12, 24, 36, 48],         // 12h, 24h, 36h, 48h
    email3: [48, 72, 96, 120, 168]    // 48h, 72h, 96h, 120h, 168h (1 week)
  },
  // Discount for email 3 - CONFIGURABLE (Session 165sexies)
  // ENV: CART_EMAIL3_DISCOUNT=10 (options: 5, 10, 15, 20)
  email3Discount: parseInt(ENV.CART_EMAIL3_DISCOUNT) || 10,
  email3DiscountOptions: [5, 10, 15, 20],
  // Industry benchmarks (Klaviyo 2025)
  benchmarks: {
    openRate: 0.45,           // 45% open rate
    clickRate: 0.21,          // 21% click rate
    conversionRate: 0.10,     // 10% recovery rate per email
    totalRecovery: 0.30       // 30% with full series
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SAFE JSON PARSING (P2 FIX - Session 117)
// ─────────────────────────────────────────────────────────────────────────────
function safeJsonParse(str, context = 'unknown') {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (err) {
    console.error(`[JSON Parse Error] Context: ${context}, Error: ${err.message}`);
    return { success: false, error: err.message, raw: str?.substring(0, 200) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP REQUEST HELPER
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
      timeout: 30000,
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

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
const PERSONALIZATION_PROMPT = `Tu es un expert en copywriting email B2B pour ${BRAND.name}.

RÈGLES STRICTES:
- Langue: Français professionnel
- Ton: Professionnel mais accessible, pas de jargon excessif
- Vouvoiement obligatoire
- Pas de claims exagérés
- Signature: "${BRAND.signature}"
- Tagline: "${BRAND.tagline}"
- URL: ${BRAND.url}

FORMAT DE RÉPONSE (JSON uniquement, pas de markdown):
{
  "subject": "Objet personnalisé (max 60 caractères)",
  "preheader": "Texte de prévisualisation (max 100 caractères)",
  "greeting": "Salutation personnalisée",
  "intro": "Introduction personnalisée (1-2 phrases)",
  "body": "Corps du message adapté au segment",
  "cta": "Appel à l'action personnalisé",
  "signature": "Signature avec ${BRAND.signature}"
}`;

const SUBJECT_PROMPT = `Tu es un expert en objets d'email pour ${BRAND.name}.

RÈGLES:
- Max 60 caractères
- Pas de spam words (gratuit, urgent, etc.)
- Personnalisé au segment
- Taux d'ouverture visé: >40%

FORMAT: Retourne UNIQUEMENT l'objet, sans guillemets ni explication.`;

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER API CALLS
// ─────────────────────────────────────────────────────────────────────────────
async function callGrok(systemPrompt, userPrompt) {
  if (!PROVIDERS.grok.enabled) {
    throw new Error('Grok API key not configured');
  }

  const body = JSON.stringify({
    model: PROVIDERS.grok.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const response = await httpRequest(PROVIDERS.grok.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDERS.grok.apiKey}`,
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'Grok email response');
  if (!parsed.success) throw new Error(`Grok JSON parse failed: ${parsed.error}`);
  return parsed.data.choices[0].message.content;
}

async function callOpenAI(systemPrompt, userPrompt) {
  if (!PROVIDERS.openai.enabled) {
    throw new Error('OpenAI API key not configured');
  }

  const body = JSON.stringify({
    model: PROVIDERS.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const response = await httpRequest(PROVIDERS.openai.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDERS.openai.apiKey}`,
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'OpenAI email response');
  if (!parsed.success) throw new Error(`OpenAI JSON parse failed: ${parsed.error}`);
  return parsed.data.choices[0].message.content;
}

async function callGemini(systemPrompt, userPrompt) {
  if (!PROVIDERS.gemini.enabled) {
    throw new Error('Gemini API key not configured');
  }

  const url = `${PROVIDERS.gemini.url}?key=${PROVIDERS.gemini.apiKey}`;
  const body = JSON.stringify({
    contents: [{
      parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
    }],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    }
  });

  const response = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, body);

  const parsed = safeJsonParse(response.data, 'Gemini email response');
  if (!parsed.success) throw new Error(`Gemini JSON parse failed: ${parsed.error}`);
  return parsed.data.candidates[0].content.parts[0].text;
}

async function callAnthropic(systemPrompt, userPrompt) {
  if (!PROVIDERS.anthropic.enabled) {
    throw new Error('Anthropic API key not configured');
  }

  const body = JSON.stringify({
    model: PROVIDERS.anthropic.model,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const response = await httpRequest(PROVIDERS.anthropic.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': PROVIDERS.anthropic.apiKey,
      'anthropic-version': '2024-01-01',
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'Anthropic email response');
  if (!parsed.success) throw new Error(`Anthropic JSON parse failed: ${parsed.error}`);
  return parsed.data.content[0].text;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FALLBACK TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const STATIC_TEMPLATES = {
  decision_maker: {
    subject: "ROI automatisation pour {company}",
    preheader: "Découvrez votre potentiel d'optimisation",
    greeting: "Bonjour {firstName},",
    intro: "En tant que décideur chez {company}, vous cherchez à optimiser vos processus.",
    body: "Nos solutions d'automatisation permettent aux entreprises comme la vôtre de gagner jusqu'à 20h/semaine sur les tâches répétitives.",
    cta: "Demandez votre audit gratuit",
    signature: BRAND.signature
  },
  marketing: {
    subject: "Automatisez vos campagnes {company}",
    preheader: "Gagnez 10h/semaine sur votre marketing",
    greeting: "Bonjour {firstName},",
    intro: "En tant que responsable marketing, vous savez que le temps est précieux.",
    body: "Nos automatisations Klaviyo et LinkedIn permettent de multiplier vos leads qualifiés tout en réduisant le temps passé sur les tâches répétitives.",
    cta: "Voir nos cas clients marketing",
    signature: BRAND.signature
  },
  sales: {
    subject: "Plus de leads qualifiés pour {company}",
    preheader: "Automatisez votre prospection B2B",
    greeting: "Bonjour {firstName},",
    intro: "Votre équipe commerciale perd du temps sur la prospection manuelle ?",
    body: "Nos pipelines automatisés génèrent des leads qualifiés depuis LinkedIn et Google Maps, directement intégrés à votre CRM.",
    cta: "Découvrez notre méthode",
    signature: BRAND.signature
  },
  tech: {
    subject: "APIs et automatisations pour {company}",
    preheader: "Intégrations sur-mesure et robustes",
    greeting: "Bonjour {firstName},",
    intro: "En tant que professionnel technique, vous appréciez les solutions bien architecturées.",
    body: "Nos scripts CommonJS avec fallback multi-provider garantissent une résilience maximale. Stack: Node.js, Klaviyo, n8n, APIs REST.",
    cta: "Voir notre stack technique",
    signature: BRAND.signature
  },
  hr: {
    subject: "Automatisez le recrutement {company}",
    preheader: "Gagnez du temps sur les candidatures",
    greeting: "Bonjour {firstName},",
    intro: "Le traitement des candidatures peut être chronophage.",
    body: "Nos automatisations permettent de trier, qualifier et répondre automatiquement aux candidatures, tout en gardant une touche humaine.",
    cta: "Demandez une démo RH",
    signature: BRAND.signature
  },
  other: {
    subject: "Automatisation pour {company}",
    preheader: "Découvrez nos solutions sur-mesure",
    greeting: "Bonjour {firstName},",
    intro: "Chaque entreprise a des besoins uniques en automatisation.",
    body: "Que ce soit pour le marketing, les ventes, ou les opérations, nous créons des solutions adaptées à votre contexte.",
    cta: "Discutons de votre projet",
    signature: BRAND.signature
  }
};

function getStaticTemplate(segment, leadData) {
  const template = STATIC_TEMPLATES[segment] || STATIC_TEMPLATES.other;
  const filled = {};

  for (const [key, value] of Object.entries(template)) {
    filled[key] = value
      .replace(/{firstName}/g, leadData.firstName || 'là')
      .replace(/{company}/g, leadData.company || 'votre entreprise')
      .replace(/{email}/g, leadData.email || '');
  }

  return filled;
}

// ─────────────────────────────────────────────────────────────────────────────
// ABANDONED CART EMAIL TEMPLATES (Session 127bis)
// 3-email series: reminder (1h), social proof (24h), discount (72h)
// ─────────────────────────────────────────────────────────────────────────────
const ABANDONED_CART_TEMPLATES = {
  email1_reminder: {
    subject: "Vous avez oublié quelque chose, {firstName} 🛒",
    preheader: "Votre panier vous attend - finalisez votre commande",
    greeting: "Bonjour {firstName},",
    intro: "Nous avons remarqué que vous avez laissé des articles dans votre panier.",
    body: "Bonne nouvelle : vos articles sont toujours disponibles ! Finalisez votre commande maintenant avant qu'ils ne s'épuisent.",
    productList: "{productList}",
    cartTotal: "{cartTotal}",
    cta: "Finaliser ma commande",
    ctaUrl: "{cartUrl}",
    signature: BRAND.signature
  },
  email2_socialproof: {
    subject: "{firstName}, vos articles sont très demandés ⭐",
    preheader: "Nos clients adorent ces produits - ne les manquez pas",
    greeting: "Bonjour {firstName},",
    intro: "Votre panier est toujours là, mais ces articles partent vite !",
    body: "Ces produits sont parmi nos best-sellers avec d'excellents avis clients. Plus de {reviewCount}+ clients satisfaits. Ne passez pas à côté.",
    productList: "{productList}",
    testimonial: "« {testimonialText} » - {testimonialAuthor}",
    cta: "Voir mon panier",
    ctaUrl: "{cartUrl}",
    signature: BRAND.signature
  },
  email3_discount: {
    subject: "Dernière chance : {discountPercent}% de réduction sur votre panier 🎁",
    preheader: "Code exclusif pour finaliser votre commande aujourd'hui",
    greeting: "Bonjour {firstName},",
    intro: "Nous ne voulons vraiment pas que vous passiez à côté de vos articles préférés.",
    body: "En tant que remerciement spécial, voici une réduction exclusive de {discountPercent}% sur votre panier. Cette offre expire dans 24h.",
    productList: "{productList}",
    discountCode: "{discountCode}",
    originalTotal: "{originalTotal}",
    discountedTotal: "{discountedTotal}",
    cta: "Utiliser mon code -{discountPercent}%",
    ctaUrl: "{cartUrl}?discount={discountCode}",
    urgency: "⏰ Offre valable 24h uniquement",
    signature: BRAND.signature
  }
};

const ABANDONED_CART_PROMPT = `Tu es un expert en email marketing e-commerce spécialisé dans la récupération de paniers abandonnés.

CONTEXTE:
- Marque: ${BRAND.name}
- Objectif: Récupérer un panier abandonné avec une série de 3 emails
- Benchmark: +69% de commandes vs 1 seul email (Klaviyo 2025)

SÉRIE DE 3 EMAILS:
1. Email 1 (1h après): Rappel simple et bienveillant, pas de pression
2. Email 2 (24h après): Social proof, avis clients, popularité des produits
3. Email 3 (72h après): Offre de réduction exclusive, urgence

RÈGLES STRICTES:
- Langue: Français
- Ton: Bienveillant mais incitatif
- Tutoiement OU vouvoiement selon le contexte client
- Personnalisation avec le prénom
- Mentionner les produits du panier
- Pas de spam words (GRATUIT, URGENT en majuscules, etc.)
- CTA clair et unique par email

FORMAT DE RÉPONSE (JSON array de 3 emails):
[
  {
    "emailNumber": 1,
    "timing": "1h après abandon",
    "subject": "...",
    "preheader": "...",
    "greeting": "...",
    "intro": "...",
    "body": "...",
    "cta": "...",
    "signature": "${BRAND.signature}"
  },
  { "emailNumber": 2, ... },
  { "emailNumber": 3, ... }
]`;

function getAbandonedCartStaticSeries(cartData) {
  const firstName = cartData.firstName || 'là';
  const cartUrl = cartData.cartUrl || 'https://shop.example.com/cart';
  const discountPercent = cartData.discountPercent || 10;
  const discountCode = cartData.discountCode || 'COMEBACK10';

  // Format product list
  const products = cartData.products || [];
  const productList = products.length > 0
    ? products.map(p => `• ${p.name} - ${p.price}€`).join('\n')
    : '• Vos articles sélectionnés';

  const cartTotal = cartData.cartTotal || products.reduce((sum, p) => sum + (p.price || 0), 0);
  const originalTotal = `${cartTotal.toFixed(2)}€`;
  const discountedTotal = `${(cartTotal * (1 - discountPercent / 100)).toFixed(2)}€`;
  const reviewCount = cartData.reviewCount || 500;
  const testimonialText = cartData.testimonialText || "Livraison rapide et produits de qualité !";
  const testimonialAuthor = cartData.testimonialAuthor || "Marie L.";

  const fillTemplate = (template) => {
    const filled = {};
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string') {
        filled[key] = value
          .replace(/{firstName}/g, firstName)
          .replace(/{productList}/g, productList)
          .replace(/{cartTotal}/g, originalTotal)
          .replace(/{cartUrl}/g, cartUrl)
          .replace(/{discountPercent}/g, discountPercent)
          .replace(/{discountCode}/g, discountCode)
          .replace(/{originalTotal}/g, originalTotal)
          .replace(/{discountedTotal}/g, discountedTotal)
          .replace(/{reviewCount}/g, reviewCount)
          .replace(/{testimonialText}/g, testimonialText)
          .replace(/{testimonialAuthor}/g, testimonialAuthor);
      } else {
        filled[key] = value;
      }
    }
    return filled;
  };

  return [
    {
      emailNumber: 1,
      timing: '1h après abandon',
      sendDelay: ABANDONED_CART_CONFIG.delays.email1,
      ...fillTemplate(ABANDONED_CART_TEMPLATES.email1_reminder)
    },
    {
      emailNumber: 2,
      timing: '24h après abandon',
      sendDelay: ABANDONED_CART_CONFIG.delays.email2,
      ...fillTemplate(ABANDONED_CART_TEMPLATES.email2_socialproof)
    },
    {
      emailNumber: 3,
      timing: '72h après abandon',
      sendDelay: ABANDONED_CART_CONFIG.delays.email3,
      ...fillTemplate(ABANDONED_CART_TEMPLATES.email3_discount)
    }
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// RESILIENT PERSONALIZATION
// ─────────────────────────────────────────────────────────────────────────────
async function personalizeEmail(leadData, segment = 'other') {
  const errors = [];
  // Fallback order: Grok → OpenAI → Gemini → Anthropic → Static
  const providerOrder = ['grok', 'openai', 'gemini', 'anthropic'];

  const userPrompt = `Personnalise un email pour:
- Prénom: ${leadData.firstName || 'Non spécifié'}
- Nom: ${leadData.lastName || 'Non spécifié'}
- Email: ${leadData.email}
- Entreprise: ${leadData.company || 'Non spécifiée'}
- Poste: ${leadData.jobTitle || 'Non spécifié'}
- Segment: ${segment}
- Industrie: ${leadData.industry || 'Non spécifiée'}

Contexte: Email de prospection B2B initial.`;

  // INJECT STORYBRAND (SB7)
  // We want the customer to be the Hero, not us.
  const optimizedPrompt = MarketingScience.inject('SB7', userPrompt);

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      let response;
      switch (providerKey) {
        case 'grok': response = await callGrok(PERSONALIZATION_PROMPT, optimizedPrompt); break;
        case 'openai': response = await callOpenAI(PERSONALIZATION_PROMPT, optimizedPrompt); break;
        case 'gemini': response = await callGemini(PERSONALIZATION_PROMPT, optimizedPrompt); break;
        case 'anthropic': response = await callAnthropic(PERSONALIZATION_PROMPT, optimizedPrompt); break;
      }

      // Parse JSON from response (with robust extraction)
      let jsonContent = response;
      const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonContent = fenceMatch[1].trim();

      const jsonStart = jsonContent.indexOf('{');
      const jsonEnd = jsonContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }

      const emailParsed = safeJsonParse(jsonContent, 'AI email content');
      if (!emailParsed.success) throw new Error(`Email content JSON parse failed: ${emailParsed.error}`);
      const personalized = emailParsed.data;

      return {
        success: true,
        email: personalized,
        provider: provider.name,
        fallbacksUsed: errors.length,
        errors,
        aiGenerated: true
      };
    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`[Email] ${provider.name} failed:`, err.message);
    }
  }

  // All AI providers failed - use static template
  console.log('[Email] All providers failed, using static template');
  const staticEmail = getStaticTemplate(segment, leadData);

  return {
    success: true,
    email: staticEmail,
    provider: 'static',
    fallbacksUsed: errors.length,
    errors,
    aiGenerated: false
  };
}

async function generateSubjectLine(context) {
  const errors = [];
  // Fallback order: Grok → OpenAI → Gemini → Anthropic → Static
  const providerOrder = ['grok', 'openai', 'gemini', 'anthropic'];

  const userPrompt = `Génère un objet d'email pour:
- Topic: ${context.topic || 'automatisation'}
- Segment: ${context.segment || 'B2B'}
- Entreprise cible: ${context.company || 'PME'}
- Objectif: ${context.objective || 'prospection'}`;

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      let response;
      switch (providerKey) {
        case 'grok': response = await callGrok(SUBJECT_PROMPT, userPrompt); break;
        case 'openai': response = await callOpenAI(SUBJECT_PROMPT, userPrompt); break;
        case 'gemini': response = await callGemini(SUBJECT_PROMPT, userPrompt); break;
        case 'anthropic': response = await callAnthropic(SUBJECT_PROMPT, userPrompt); break;
      }

      // Clean response
      const subject = response.trim().replace(/^["']|["']$/g, '').substring(0, 60);

      return {
        success: true,
        subject,
        provider: provider.name,
        fallbacksUsed: errors.length,
        errors
      };
    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`[Subject] ${provider.name} failed:`, err.message);
    }
  }

  // Fallback to static subject
  const staticSubject = `Automatisation ${context.segment || 'B2B'} - ${BRAND.name}`;

  return {
    success: true,
    subject: staticSubject,
    provider: 'static',
    fallbacksUsed: errors.length,
    errors
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HITL: EMAIL PREVIEW SYSTEM (Session 157)
// Review AI-generated emails before sending to prevent hallucination risks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure HITL directories exist
 */
function ensureHITLDirs() {
  if (!fs.existsSync(HITL_CONFIG.previewDir)) {
    fs.mkdirSync(HITL_CONFIG.previewDir, { recursive: true });
  }
  if (!fs.existsSync(HITL_CONFIG.approvedDir)) {
    fs.mkdirSync(HITL_CONFIG.approvedDir, { recursive: true });
  }
}

/**
 * Generate unique preview ID
 */
function generatePreviewId() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `email-preview-${timestamp}-${random}`;
}

/**
 * Save email series for preview/approval
 */
function saveEmailPreview(emails, metadata) {
  ensureHITLDirs();

  const previewId = generatePreviewId();
  const preview = {
    id: previewId,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    type: metadata.type || 'personalization',
    recipient: {
      email: metadata.recipientEmail,
      firstName: metadata.firstName,
    },
    emails: emails.map((e, i) => ({
      sequence: i + 1,
      subject: e.subject,
      bodyPreview: e.body?.substring(0, 500) || e.content?.substring(0, 500) || '',
      fullBody: e.body || e.content,
      sendDelay: e.sendDelay || 0,
    })),
    metadata,
    aiGenerated: metadata.aiGenerated,
    provider: metadata.provider,
    approveCmd: `node email-personalization-resilient.cjs --approve-preview=${previewId}`,
    rejectCmd: `node email-personalization-resilient.cjs --reject-preview=${previewId}`,
  };

  const previewPath = path.join(HITL_CONFIG.previewDir, `${previewId}.json`);
  fs.writeFileSync(previewPath, JSON.stringify(preview, null, 2));

  console.log(`\n  [HITL] ⏸️  Email series saved for review`);
  console.log(`    Preview ID: ${previewId}`);
  console.log(`    Recipient: ${metadata.recipientEmail}`);
  console.log(`    Emails: ${emails.length}`);
  console.log(`\n    📋 NEXT STEPS:`);
  console.log(`       Review: node email-personalization-resilient.cjs --view-preview=${previewId}`);
  console.log(`       Approve: node email-personalization-resilient.cjs --approve-preview=${previewId}`);
  console.log(`       Reject:  node email-personalization-resilient.cjs --reject-preview=${previewId}`);

  return { id: previewId, path: previewPath, status: 'pending_review' };
}

/**
 * List pending email previews
 */
function listEmailPreviews() {
  ensureHITLDirs();
  const previews = [];
  const files = fs.readdirSync(HITL_CONFIG.previewDir);

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(HITL_CONFIG.previewDir, file), 'utf8'));
        previews.push({
          id: data.id,
          recipient: data.recipient.email,
          type: data.type,
          emailCount: data.emails?.length || 0,
          provider: data.provider,
          createdAt: data.createdAt,
          status: data.status,
        });
      } catch (e) {
        console.warn(`[WARN] Could not parse preview: ${file}`);
      }
    }
  }

  return previews;
}

/**
 * Get preview by ID
 */
function getEmailPreview(previewId) {
  const previewPath = path.join(HITL_CONFIG.previewDir, `${previewId}.json`);
  if (fs.existsSync(previewPath)) {
    return JSON.parse(fs.readFileSync(previewPath, 'utf8'));
  }
  return null;
}

/**
 * Approve email preview
 */
function approveEmailPreview(previewId) {
  const preview = getEmailPreview(previewId);
  if (!preview) {
    return { success: false, error: `Preview not found: ${previewId}` };
  }

  preview.status = 'approved';
  preview.approvedAt = new Date().toISOString();

  // Move to approved folder
  const approvedPath = path.join(HITL_CONFIG.approvedDir, `${previewId}.json`);
  fs.writeFileSync(approvedPath, JSON.stringify(preview, null, 2));

  // Remove from pending
  const previewPath = path.join(HITL_CONFIG.previewDir, `${previewId}.json`);
  fs.unlinkSync(previewPath);

  console.log(`  [HITL] ✅ Email preview approved: ${previewId}`);
  console.log(`    Ready to send to: ${preview.recipient.email}`);

  return { success: true, preview, approvedPath };
}

/**
 * Reject email preview
 */
function rejectEmailPreview(previewId, reason = '') {
  const preview = getEmailPreview(previewId);
  if (!preview) {
    return { success: false, error: `Preview not found: ${previewId}` };
  }

  preview.status = 'rejected';
  preview.rejectedAt = new Date().toISOString();
  preview.rejectionReason = reason;

  // Keep in preview folder with rejected status (audit trail)
  const previewPath = path.join(HITL_CONFIG.previewDir, `${previewId}.json`);
  fs.writeFileSync(previewPath, JSON.stringify(preview, null, 2));

  console.log(`  [HITL] ❌ Email preview rejected: ${previewId}`);
  return { success: true, preview };
}

// ─────────────────────────────────────────────────────────────────────────────
// ABANDONED CART SERIES GENERATION (Session 127bis)
// +69% orders vs single email (Klaviyo benchmark)
// ─────────────────────────────────────────────────────────────────────────────
async function generateAbandonedCartSeries(cartData, previewMode = HITL_CONFIG.previewModeDefault) {
  const errors = [];
  // Fallback order: Grok → OpenAI → Gemini → Anthropic → Static
  const providerOrder = ['grok', 'openai', 'gemini', 'anthropic'];

  // Build context for AI
  const products = cartData.products || [];
  const productListText = products.length > 0
    ? products.map(p => `${p.name} (${p.price}€)`).join(', ')
    : 'Articles divers';

  const userPrompt = `Génère une série de 3 emails pour récupérer ce panier abandonné:

CLIENT:
- Prénom: ${cartData.firstName || 'Client'}
- Email: ${cartData.email}

PANIER:
- Produits: ${productListText}
- Total: ${cartData.cartTotal || 'Non spécifié'}€
- URL panier: ${cartData.cartUrl || 'https://shop.example.com/cart'}

REMISE (pour email 3):
- Code: ${cartData.discountCode || 'COMEBACK10'}
- Réduction: ${cartData.discountPercent || 10}%

AVIS CLIENTS (pour email 2):
- Nombre d'avis: ${cartData.reviewCount || 500}+
- Témoignage: "${cartData.testimonialText || 'Excellent service !'}" - ${cartData.testimonialAuthor || 'Client satisfait'}`;

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      let response;
      switch (providerKey) {
        case 'grok': response = await callGrok(ABANDONED_CART_PROMPT, userPrompt); break;
        case 'openai': response = await callOpenAI(ABANDONED_CART_PROMPT, userPrompt); break;
        case 'gemini': response = await callGemini(ABANDONED_CART_PROMPT, userPrompt); break;
        case 'anthropic': response = await callAnthropic(ABANDONED_CART_PROMPT, userPrompt); break;
      }

      // Parse JSON from response (with robust extraction)
      let jsonContent = response;
      const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonContent = fenceMatch[1].trim();

      const jsonStart = jsonContent.indexOf('[');
      const jsonEnd = jsonContent.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }

      const seriesParsed = safeJsonParse(jsonContent, 'Abandoned cart series');
      if (!seriesParsed.success) throw new Error(`Series JSON parse failed: ${seriesParsed.error}`);
      const emails = seriesParsed.data;

      // Validate we got 3 emails
      if (!Array.isArray(emails) || emails.length !== 3) {
        throw new Error(`Expected 3 emails, got ${Array.isArray(emails) ? emails.length : 'non-array'}`);
      }

      // Add timing delays
      emails[0].sendDelay = ABANDONED_CART_CONFIG.delays.email1;
      emails[1].sendDelay = ABANDONED_CART_CONFIG.delays.email2;
      emails[2].sendDelay = ABANDONED_CART_CONFIG.delays.email3;

      const result = {
        success: true,
        emails,
        provider: provider.name,
        fallbacksUsed: errors.length,
        errors,
        aiGenerated: true,
        benchmarks: ABANDONED_CART_CONFIG.benchmarks
      };

      // HITL: Save for preview if previewMode is enabled
      if (previewMode) {
        const previewInfo = saveEmailPreview(emails, {
          type: 'abandoned_cart_series',
          recipientEmail: cartData.email,
          firstName: cartData.firstName,
          provider: provider.name,
          aiGenerated: true,
          cartTotal: cartData.cartTotal,
          products: cartData.products,
        });
        result.hitl = previewInfo;
        result.status = 'pending_review';
        console.log(`\n  [HITL] ⚠️  PREVIEW MODE ACTIVE - Emails NOT sent`);
        console.log(`    Approve to send: ${previewInfo.approveCmd}`);
      }

      return result;
    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`[AbandonedCart] ${provider.name} failed:`, err.message);
    }
  }

  // All AI providers failed - use static templates
  console.log('[AbandonedCart] All providers failed, using static templates');
  const staticEmails = getAbandonedCartStaticSeries(cartData);

  const result = {
    success: true,
    emails: staticEmails,
    provider: 'static',
    fallbacksUsed: errors.length,
    errors,
    aiGenerated: false,
    benchmarks: ABANDONED_CART_CONFIG.benchmarks
  };

  // HITL: Save for preview if previewMode is enabled (even for static templates)
  if (previewMode) {
    const previewInfo = saveEmailPreview(staticEmails, {
      type: 'abandoned_cart_series',
      recipientEmail: cartData.email,
      firstName: cartData.firstName,
      provider: 'static',
      aiGenerated: false,
      cartTotal: cartData.cartTotal,
      products: cartData.products,
    });
    result.hitl = previewInfo;
    result.status = 'pending_review';
    console.log(`\n  [HITL] ⚠️  PREVIEW MODE ACTIVE - Emails NOT sent`);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────
function startServer(port = 3006) {
  // P1 FIX: Rate limiter (30 req/min per IP)
  const rateLimiter = new RateLimiter(30, 60000);

  const server = http.createServer(async (req, res) => {
    // P1 FIX: CORS whitelist (no wildcard fallback)
    const origin = req.headers.origin;
    if (origin && CORS_WHITELIST.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', 'https://3a-automation.com');
    } else {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origin not allowed' }));
      return;
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    setSecurityHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // P1 FIX: Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!rateLimiter.tryAcquire(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. Max 30/min.' }));
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const pendingPreviews = listEmailPreviews();
      const status = {
        healthy: true,
        version: '2.0.0 (Session 157 - HITL Edition)',
        providers: {},
        staticFallback: true,
        hitl: {
          previewModeDefault: HITL_CONFIG.previewModeDefault,
          previewDir: HITL_CONFIG.previewDir,
          pendingPreviews: pendingPreviews.length,
          slackNotifications: !!HITL_CONFIG.slackWebhook,
        }
      };
      for (const [key, provider] of Object.entries(PROVIDERS)) {
        status.providers[key] = { name: provider.name, configured: provider.enabled };
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    // Personalize endpoint
    if (req.url === '/personalize' && req.method === 'POST') {
      let body = '';
      let bodySize = 0;
      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large. Max 1MB.' }));
          return;
        }
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const bodyParsed = safeJsonParse(body, '/personalize request body');
          if (!bodyParsed.success) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid JSON: ${bodyParsed.error}` }));
            return;
          }
          const { lead, segment } = bodyParsed.data;

          if (!lead || !lead.email) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Lead with email is required' }));
            return;
          }

          console.log(`[Email] Personalizing for: ${lead.email}`);
          const result = await personalizeEmail(lead, segment);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[Email] Error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Abandoned Cart Series endpoint (Session 127bis)
    if (req.url === '/abandoned-cart-series' && req.method === 'POST') {
      let body = '';
      let bodySize = 0;
      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large. Max 1MB.' }));
          return;
        }
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const bodyParsed = safeJsonParse(body, '/abandoned-cart-series request body');
          if (!bodyParsed.success) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid JSON: ${bodyParsed.error}` }));
            return;
          }
          const cartData = bodyParsed.data;

          if (!cartData.email) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Cart data with email is required' }));
            return;
          }

          // HITL: previewMode can be set in request body (default: true for safety)
          const previewMode = cartData.previewMode !== false; // Default true unless explicitly false
          console.log(`[AbandonedCart] Generating 3-email series for: ${cartData.email}`);
          console.log(`[AbandonedCart] Preview mode: ${previewMode ? 'ON (review before send)' : 'OFF (direct send)'}`);
          const result = await generateAbandonedCartSeries(cartData, previewMode);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[AbandonedCart] Error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Subject endpoint
    if (req.url === '/subject' && req.method === 'POST') {
      let body = '';
      let bodySize = 0;
      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large. Max 1MB.' }));
          return;
        }
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const bodyParsed = safeJsonParse(body, '/subject request body');
          if (!bodyParsed.success) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid JSON: ${bodyParsed.error}` }));
            return;
          }
          const context = bodyParsed.data;

          console.log(`[Subject] Generating for segment: ${context.segment || 'default'}`);
          const result = await generateSubjectLine(context);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[Subject] Error:', err.message);
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
    console.log(`\n[Server] Email Personalization API running on http://localhost:${port}`);
    console.log('\nEndpoints:');
    console.log('  POST /personalize          - Personalize email for lead');
    console.log('  POST /subject              - Generate subject line');
    console.log('  POST /abandoned-cart-series - Generate 3-email cart recovery series');
    console.log('  GET  /health               - Provider status');
    console.log('\nProviders (fallback order):');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '[OK]' : '[--]';
      console.log(`  ${status} ${provider.name}`);
    }
    console.log('  [OK] Static templates (always available)');
    console.log('\n[Session 127bis] 3-Email Abandoned Cart Series (+69% orders - Klaviyo)');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    // [\w-]+ to support hyphenated args like --abandoned-cart-series
    const match = arg.match(/^--([\w-]+)(?:=(.+))?$/);
    if (match) {
      args[match[1]] = match[2] || true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();

  if (args.server) {
    startServer(parseInt(args.port) || 3006);
    return;
  }

  if (args.health) {
    console.log('\n=== EMAIL PERSONALIZATION SERVICE ===');
    console.log('Version: 1.3.0 (Session 165sexies - Full Flexibility Edition)');

    console.log('\n=== PROVIDER STATUS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '[OK] Configured' : '[--] Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    console.log('Static fallback: [OK] Always available');

    // HITL Status
    console.log('\n=== HITL STATUS ===');
    console.log(`Preview Mode Default: ${HITL_CONFIG.previewModeDefault ? '[ON] Safe' : '[OFF] Auto-send'}`);
    console.log(`Slack Webhook: ${HITL_CONFIG.slackWebhook ? '[OK] Configured' : '[--] Not configured'}`);
    const pendingPreviews = listEmailPreviews();
    console.log(`Pending Previews: ${pendingPreviews.length}`);

    // Abandoned Cart Configuration (Session 165sexies)
    console.log('\n=== ABANDONED CART SERIES (Configurable) ===');
    console.log(`Email 1 (Reminder): ${ABANDONED_CART_CONFIG.delays.email1 / (1000 * 60 * 60)}h (options: ${ABANDONED_CART_CONFIG.delayOptions.email1.join(', ')}h)`);
    console.log(`Email 2 (Social Proof): ${ABANDONED_CART_CONFIG.delays.email2 / (1000 * 60 * 60)}h (options: ${ABANDONED_CART_CONFIG.delayOptions.email2.join(', ')}h)`);
    console.log(`Email 3 (Discount): ${ABANDONED_CART_CONFIG.delays.email3 / (1000 * 60 * 60)}h (options: ${ABANDONED_CART_CONFIG.delayOptions.email3.join(', ')}h)`);
    console.log(`Email 3 Discount: ${ABANDONED_CART_CONFIG.email3Discount}% (options: ${ABANDONED_CART_CONFIG.email3DiscountOptions.join(', ')}%)`);
    console.log('\nBenchmarks (Klaviyo 2025):');
    console.log(`  Open Rate: ${ABANDONED_CART_CONFIG.benchmarks.openRate * 100}%`);
    console.log(`  Click Rate: ${ABANDONED_CART_CONFIG.benchmarks.clickRate * 100}%`);
    console.log(`  Total Recovery: ${ABANDONED_CART_CONFIG.benchmarks.totalRecovery * 100}%`);

    console.log('\n✅ Email Personalization HITL: OPERATIONAL');
    return;
  }

  // HITL CLI Commands - Session 157
  if (args['list-previews'] || args.listpreviews) {
    const previews = listEmailPreviews();
    console.log('\n=== PENDING EMAIL PREVIEWS ===');
    if (previews.length === 0) {
      console.log('No pending previews.');
    } else {
      previews.forEach((p, i) => {
        console.log(`\n[${i + 1}] ID: ${p.id}`);
        console.log(`    Type: ${p.metadata?.type || 'unknown'}`);
        console.log(`    Emails: ${p.emailCount}`);
        console.log(`    Created: ${p.createdAt}`);
      });
    }
    return;
  }

  if (args['view-preview'] || args.viewpreview) {
    const previewId = args['view-preview'] || args.viewpreview;
    const preview = getEmailPreview(previewId);
    if (!preview) {
      console.error(`❌ Preview not found: ${previewId}`);
      process.exit(1);
    }
    console.log('\n=== EMAIL PREVIEW ===');
    console.log(`ID: ${preview.id}`);
    console.log(`Type: ${preview.metadata?.type || 'unknown'}`);
    console.log(`Created: ${preview.createdAt}`);
    console.log(`\n--- Emails ---`);
    preview.emails.forEach((email, i) => {
      console.log(`\n[Email ${i + 1}]`);
      console.log(`Subject: ${email.subject}`);
      console.log(`CTA: ${email.cta}`);
      console.log(`Timing: ${email.timing || 'immediate'}`);
      if (email.body) console.log(`Body preview: ${email.body.substring(0, 200)}...`);
    });
    return;
  }

  if (args['approve-preview'] || args.approvepreview) {
    const previewId = args['approve-preview'] || args.approvepreview;
    const result = approveEmailPreview(previewId);
    if (result.success) {
      console.log(`✅ Preview approved: ${previewId}`);
      console.log(`   Moved to: ${result.approvedPath}`);
      console.log(`   Ready for sending.`);
    } else {
      console.error(`❌ Failed to approve: ${result.error}`);
      process.exit(1);
    }
    return;
  }

  if (args['reject-preview'] || args.rejectpreview) {
    const previewId = args['reject-preview'] || args.rejectpreview;
    const reason = args.reason || 'Rejected by operator';
    const result = rejectEmailPreview(previewId, reason);
    if (result.success) {
      console.log(`✅ Preview rejected: ${previewId}`);
      console.log(`   Reason: ${reason}`);
    } else {
      console.error(`❌ Failed to reject: ${result.error}`);
      process.exit(1);
    }
    return;
  }

  if (args.personalize && args.lead) {
    const leadParsed = safeJsonParse(args.lead, 'CLI --lead argument');
    if (!leadParsed.success) {
      console.error('Error parsing lead JSON:', leadParsed.error);
      process.exit(1);
    }
    const lead = leadParsed.data;
    console.log(`\n[Email] Personalizing for: ${lead.email}\n`);
    try {

      const result = await personalizeEmail(lead, args.segment || 'other');

      console.log('Provider:', result.provider);
      console.log('AI Generated:', result.aiGenerated);
      console.log('Fallbacks used:', result.fallbacksUsed);
      console.log('\nPersonalized Email:');
      console.log(JSON.stringify(result.email, null, 2));
    } catch (err) {
      console.error('Error personalizing email:', err.message);
    }
    return;
  }

  if (args.subject && args.context) {
    const contextParsed = safeJsonParse(args.context, 'CLI --context argument');
    if (!contextParsed.success) {
      console.error('Error parsing context JSON:', contextParsed.error);
      process.exit(1);
    }
    const context = contextParsed.data;
    console.log(`\n[Subject] Generating subject line\n`);
    try {

      const result = await generateSubjectLine(context);

      console.log('Provider:', result.provider);
      console.log('Subject:', result.subject);
    } catch (err) {
      console.error('Error generating subject:', err.message);
    }
    return;
  }

  // Session 127bis: 3-Email Abandoned Cart Series
  if (args['abandoned-cart-series'] && args.cart) {
    const cartParsed = safeJsonParse(args.cart, 'CLI --cart argument');
    if (!cartParsed.success) {
      console.error('Error parsing cart JSON:', cartParsed.error);
      process.exit(1);
    }
    const cartData = cartParsed.data;
    console.log(`\n[AbandonedCart] Generating 3-email series for: ${cartData.email}\n`);
    try {
      const result = await generateAbandonedCartSeries(cartData);

      console.log('Provider:', result.provider);
      console.log('AI Generated:', result.aiGenerated);
      console.log('Fallbacks used:', result.fallbacksUsed);
      console.log('Benchmarks:', JSON.stringify(result.benchmarks, null, 2));
      console.log('\n3-Email Series:');
      result.emails.forEach((email, i) => {
        console.log(`\n--- Email ${i + 1} (${email.timing}) ---`);
        console.log(`Subject: ${email.subject}`);
        console.log(`CTA: ${email.cta}`);
        console.log(`Send delay: ${email.sendDelay / (1000 * 60 * 60)}h`);
      });
    } catch (err) {
      console.error('Error generating abandoned cart series:', err.message);
    }
    return;
  }

  console.log(`
[Email] Resilient Email Personalization - 3A Automation v1.2.0

Usage:
  node email-personalization-resilient.cjs --server [--port=3006]
  node email-personalization-resilient.cjs --personalize --lead='{"email":"...","company":"..."}'
  node email-personalization-resilient.cjs --subject --context='{"topic":"...","segment":"..."}'
  node email-personalization-resilient.cjs --abandoned-cart-series --cart='{"email":"...","firstName":"...","products":[...]}'
  node email-personalization-resilient.cjs --health

HITL Commands (Session 157):
  node email-personalization-resilient.cjs --list-previews
  node email-personalization-resilient.cjs --view-preview=<preview-id>
  node email-personalization-resilient.cjs --approve-preview=<preview-id>
  node email-personalization-resilient.cjs --reject-preview=<preview-id> [--reason="..."]

Fallback chain:
  Grok → OpenAI → Gemini → Claude → Static templates

Session 127bis Features:
  - 3-Email Abandoned Cart Series (+69% orders vs single email - Klaviyo)
    Email 1: 1h after abandon (reminder)
    Email 2: 24h after (social proof)
    Email 3: 72h after (discount)

Session 157 Features:
  - HITL Preview Mode: AI-generated emails are saved for review before sending
  - Default: previewMode=true (safer - requires approval)
  - Use --force-send to bypass preview (not recommended for production)
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
