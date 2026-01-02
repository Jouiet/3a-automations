#!/usr/bin/env node
/**
 * Resilient Voice API - Multi-Provider Fallback
 * 3A Automation - Session 115
 *
 * Provides AI responses for the voice widget with automatic failover
 * Fallback chain: Grok → Gemini → Claude → Local patterns
 *
 * Usage:
 *   node voice-api-resilient.cjs --server --port=3004
 *   node voice-api-resilient.cjs --test="Bonjour, quels sont vos services ?"
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Import security utilities
const {
  RateLimiter,
  setSecurityHeaders
} = require('../../lib/security-utils.cjs');

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

// TEXT GENERATION PROVIDERS - Verified December 2025
// Purpose: Generate TEXT responses for voice assistant (NOT audio generation)
// Audio is handled by browser Web Speech API (free, built-in)
const PROVIDERS = {
  grok: {
    name: 'Grok 3 Mini',
    // grok-3-mini: fast, cost-effective text generation (Dec 2025)
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-mini',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
  },
  gemini: {
    name: 'Gemini 3 Flash',
    // gemini-3-flash-preview: latest frontier model (Jan 2026)
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
  },
  anthropic: {
    name: 'Claude Sonnet 4',
    // claude-sonnet-4: high-quality text generation (Dec 2025)
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT - 3A Automation Voice Assistant
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant vocal de 3A Automation, une agence spécialisée en automatisation marketing.

IDENTITÉ:
- Nom: 3A Automation (Automation, Analytics, AI)
- Site: https://3a-automation.com
- Contact: contact@3a-automation.com
- Marchés: E-commerce, PME B2B, Services

SERVICES PRINCIPAUX:
- Automatisation email marketing (Klaviyo, flows, séquences)
- Génération de leads (LinkedIn, Google Maps, qualification)
- Analytics et dashboards (GA4, reporting automatisé)
- Vidéos marketing IA (avatars, lip-sync, produits)
- Assistant vocal IA pour sites web

OFFRES:
- Packs one-time: Quick Win (390€), Essentials (790€), Growth (1399€)
- Retainers mensuels: Maintenance (290€/mois), Optimization (490€/mois)
- Audit gratuit disponible

STYLE DE RÉPONSE:
- Réponses courtes (2-3 phrases max)
- Ton professionnel mais accessible
- Pas de jargon technique
- Toujours proposer une action concrète (audit, RDV, formulaire)
- Utiliser le vouvoiement

OBJECTIF:
- Qualifier le prospect rapidement (secteur, besoin, budget)
- Répondre aux questions sur les services
- Proposer l'audit gratuit ou un rendez-vous si intérêt détecté

RÈGLES STRICTES:
- Ne JAMAIS inventer d'informations (prix, délais non mentionnés)
- Rediriger vers contact@3a-automation.com pour les demandes complexes
- Toujours mentionner l'audit gratuit comme première étape
- Si la question est hors sujet, ramener poliment vers les services 3A`;

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
      timeout: 30000, // 30 seconds for voice responses
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
// PROVIDER API CALLS
// ─────────────────────────────────────────────────────────────────────────────
async function callGrok(userMessage, conversationHistory = []) {
  if (!PROVIDERS.grok.enabled) {
    throw new Error('Grok API key not configured');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const body = JSON.stringify({
    model: PROVIDERS.grok.model,
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  const response = await httpRequest(PROVIDERS.grok.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDERS.grok.apiKey}`,
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'Grok voice response');
  if (!parsed.success) throw new Error(`Grok JSON parse failed: ${parsed.error}`);
  return parsed.data.choices[0].message.content;
}

async function callGemini(userMessage, conversationHistory = []) {
  if (!PROVIDERS.gemini.enabled) {
    throw new Error('Gemini API key not configured');
  }

  // Build conversation for Gemini
  const parts = [
    { text: `SYSTEM: ${SYSTEM_PROMPT}\n\n` }
  ];

  for (const msg of conversationHistory) {
    parts.push({ text: `${msg.role.toUpperCase()}: ${msg.content}\n` });
  }
  parts.push({ text: `USER: ${userMessage}` });

  const url = `${PROVIDERS.gemini.url}?key=${PROVIDERS.gemini.apiKey}`;
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
    }
  });

  const response = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, body);

  const parsed = safeJsonParse(response.data, 'Gemini voice response');
  if (!parsed.success) throw new Error(`Gemini JSON parse failed: ${parsed.error}`);
  return parsed.data.candidates[0].content.parts[0].text;
}

async function callAnthropic(userMessage, conversationHistory = []) {
  if (!PROVIDERS.anthropic.enabled) {
    throw new Error('Anthropic API key not configured');
  }

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const body = JSON.stringify({
    model: PROVIDERS.anthropic.model,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages,
  });

  const response = await httpRequest(PROVIDERS.anthropic.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': PROVIDERS.anthropic.apiKey,
      'anthropic-version': '2024-01-01',
    }
  }, body);

  const parsed = safeJsonParse(response.data, 'Anthropic voice response');
  if (!parsed.success) throw new Error(`Anthropic JSON parse failed: ${parsed.error}`);
  return parsed.data.content[0].text;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL FALLBACK RESPONSES
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_RESPONSES = {
  salutations: {
    patterns: ['bonjour', 'salut', 'hello', 'hi', 'bonsoir'],
    response: `Bonjour ! Je suis l'assistant 3A Automation. Comment puis-je vous aider aujourd'hui ? Je peux vous parler de nos services d'automatisation marketing ou vous proposer un audit gratuit.`
  },
  services: {
    patterns: ['service', 'quoi', 'faites', 'proposez', 'offre'],
    response: `3A Automation propose : automatisation email (Klaviyo), génération de leads, analytics et dashboards, vidéos marketing IA. Quel domaine vous intéresse le plus ?`
  },
  prix: {
    patterns: ['prix', 'tarif', 'combien', 'coût', 'budget'],
    response: `Nos packs démarrent à 390€ (Quick Win). L'audit est gratuit et vous permet de voir le potentiel pour votre activité. Voulez-vous qu'on en discute ?`
  },
  audit: {
    patterns: ['audit', 'gratuit', 'diagnostic'],
    response: `L'audit est 100% gratuit ! Remplissez le formulaire sur /contact.html et je vous envoie un rapport personnalisé sous 24-48h avec 3 recommandations prioritaires.`
  },
  rdv: {
    patterns: ['rdv', 'rendez-vous', 'appel', 'discuter', 'parler'],
    response: `Je peux vous aider à réserver un créneau ! Rendez-vous sur /booking.html ou dites-moi votre disponibilité.`
  },
  fallback: {
    response: `Je comprends votre question. Pour mieux vous aider, pouvez-vous me dire votre secteur d'activité ? Ou si vous préférez, demandez directement l'audit gratuit sur /contact.html`
  }
};

function getLocalResponse(userMessage) {
  const lower = userMessage.toLowerCase();

  for (const [key, data] of Object.entries(LOCAL_RESPONSES)) {
    if (key === 'fallback') continue;
    if (data.patterns.some(p => lower.includes(p))) {
      return { response: data.response, source: 'local', pattern: key };
    }
  }

  return { response: LOCAL_RESPONSES.fallback.response, source: 'local', pattern: 'fallback' };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESILIENT RESPONSE WITH FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
async function getResilisentResponse(userMessage, conversationHistory = []) {
  const errors = [];
  const providerOrder = ['grok', 'gemini', 'anthropic'];

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      let response;
      switch (providerKey) {
        case 'grok': response = await callGrok(userMessage, conversationHistory); break;
        case 'gemini': response = await callGemini(userMessage, conversationHistory); break;
        case 'anthropic': response = await callAnthropic(userMessage, conversationHistory); break;
      }

      return {
        success: true,
        response,
        provider: provider.name,
        fallbacksUsed: errors.length,
        errors,
      };
    } catch (err) {
      errors.push({ provider: provider.name, error: err.message });
      console.log(`[Voice API] ${provider.name} failed:`, err.message);
    }
  }

  // All AI providers failed - use local fallback
  console.log('[Voice API] All providers failed, using local fallback');
  const localResult = getLocalResponse(userMessage);

  return {
    success: true, // Still successful because we have a response
    response: localResult.response,
    provider: 'local',
    fallbacksUsed: errors.length,
    errors,
    localPattern: localResult.pattern,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────
function startServer(port = 3004) {
  // P1 FIX: Rate limiter (60 req/min per IP for voice responses)
  const rateLimiter = new RateLimiter(60, 60000);

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
      res.end(JSON.stringify({ error: 'Too many requests. Max 60/min.' }));
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const status = {
        healthy: true,
        providers: {},
      };
      for (const [key, provider] of Object.entries(PROVIDERS)) {
        status.providers[key] = {
          name: provider.name,
          configured: provider.enabled,
        };
      }
      status.localFallback = true;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    // Main respond endpoint
    if ((req.url === '/respond' || req.url === '/') && req.method === 'POST') {
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
          const bodyParsed = safeJsonParse(body, '/respond request body');
          if (!bodyParsed.success) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid JSON: ${bodyParsed.error}` }));
            return;
          }
          const { message, history = [] } = bodyParsed.data;

          if (!message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Message is required' }));
            return;
          }

          console.log(`[Voice API] Processing: "${message.substring(0, 50)}..."`);
          const result = await getResilisentResponse(message, history);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[Voice API] Error:', err.message);
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
    console.log(`\n🎙️  Voice API Server running on http://localhost:${port}`);
    console.log('\nEndpoints:');
    console.log('  POST /respond  - Get AI response with fallback');
    console.log('  GET  /health   - Provider status');
    console.log('\nProviders (fallback order):');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅' : '❌';
      console.log(`  ${status} ${provider.name}`);
    }
    console.log('  ✅ Local fallback (always available)');
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
    startServer(parseInt(args.port) || 3004);
    return;
  }

  if (args.test) {
    console.log(`\n🎙️  Testing voice response: "${args.test}"\n`);
    const result = await getResilisentResponse(args.test);
    console.log('Provider:', result.provider);
    console.log('Fallbacks used:', result.fallbacksUsed);
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors.map(e => `${e.provider}: ${e.error}`).join(', '));
    }
    console.log('\nResponse:');
    console.log(result.response);
    return;
  }

  if (args.health) {
    console.log('\n=== PROVIDER STATUS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅ Configured' : '❌ Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    console.log('Local fallback: ✅ Always available');
    return;
  }

  console.log(`
🎙️  Resilient Voice API - 3A Automation

Usage:
  node voice-api-resilient.cjs --server [--port=3004]
  node voice-api-resilient.cjs --test="Your message"
  node voice-api-resilient.cjs --health

Fallback chain:
  Grok → Gemini → Claude → Local patterns
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
