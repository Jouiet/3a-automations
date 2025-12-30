#!/usr/bin/env node
/**
 * Resilient Email Personalization - Multi-Provider Fallback
 * 3A Automation - Session 115
 *
 * AI-powered email personalization with automatic failover
 * Fallback chain: Grok → Gemini → Claude → Static templates
 *
 * Usage:
 *   node email-personalization-resilient.cjs --personalize --lead='{"email":"...","company":"..."}'
 *   node email-personalization-resilient.cjs --subject --context='{"topic":"...","segment":"..."}'
 *   node email-personalization-resilient.cjs --server --port=3006
 *   node email-personalization-resilient.cjs --health
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

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
// Purpose: Generate personalized email content
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
    name: 'Gemini 2.5 Flash',
    // gemini-2.5-flash: best price/performance for text (Dec 2025)
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
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

const BRAND = {
  name: '3A Automation',
  tagline: 'Automation, Analytics, AI',
  url: 'https://3a-automation.com',
  signature: "L'équipe 3A Automation"
};

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

  const result = JSON.parse(response.data);
  return result.choices[0].message.content;
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

  const result = JSON.parse(response.data);
  return result.candidates[0].content.parts[0].text;
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

  const result = JSON.parse(response.data);
  return result.content[0].text;
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
// RESILIENT PERSONALIZATION
// ─────────────────────────────────────────────────────────────────────────────
async function personalizeEmail(leadData, segment = 'other') {
  const errors = [];
  const providerOrder = ['grok', 'gemini', 'anthropic'];

  const userPrompt = `Personnalise un email pour:
- Prénom: ${leadData.firstName || 'Non spécifié'}
- Nom: ${leadData.lastName || 'Non spécifié'}
- Email: ${leadData.email}
- Entreprise: ${leadData.company || 'Non spécifiée'}
- Poste: ${leadData.jobTitle || 'Non spécifié'}
- Segment: ${segment}
- Industrie: ${leadData.industry || 'Non spécifiée'}

Contexte: Email de prospection B2B initial.`;

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    try {
      let response;
      switch (providerKey) {
        case 'grok': response = await callGrok(PERSONALIZATION_PROMPT, userPrompt); break;
        case 'gemini': response = await callGemini(PERSONALIZATION_PROMPT, userPrompt); break;
        case 'anthropic': response = await callAnthropic(PERSONALIZATION_PROMPT, userPrompt); break;
      }

      // Parse JSON from response
      let jsonContent = response;
      const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonContent = fenceMatch[1].trim();

      const jsonStart = jsonContent.indexOf('{');
      const jsonEnd = jsonContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }

      const personalized = JSON.parse(jsonContent);

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
  const providerOrder = ['grok', 'gemini', 'anthropic'];

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
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────
function startServer(port = 3006) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const status = {
        healthy: true,
        providers: {},
        staticFallback: true
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
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { lead, segment } = JSON.parse(body);

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

    // Subject endpoint
    if (req.url === '/subject' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const context = JSON.parse(body);

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
    console.log(`\n📧 Email Personalization API running on http://localhost:${port}`);
    console.log('\nEndpoints:');
    console.log('  POST /personalize - Personalize email for lead');
    console.log('  POST /subject     - Generate subject line');
    console.log('  GET  /health      - Provider status');
    console.log('\nProviders (fallback order):');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅' : '❌';
      console.log(`  ${status} ${provider.name}`);
    }
    console.log('  ✅ Static templates (always available)');
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
    startServer(parseInt(args.port) || 3006);
    return;
  }

  if (args.health) {
    console.log('\n=== PROVIDER STATUS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅ Configured' : '❌ Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    console.log('Static fallback: ✅ Always available');
    return;
  }

  if (args.personalize && args.lead) {
    try {
      const lead = JSON.parse(args.lead);
      console.log(`\n📧 Personalizing email for: ${lead.email}\n`);

      const result = await personalizeEmail(lead, args.segment || 'other');

      console.log('Provider:', result.provider);
      console.log('AI Generated:', result.aiGenerated);
      console.log('Fallbacks used:', result.fallbacksUsed);
      console.log('\nPersonalized Email:');
      console.log(JSON.stringify(result.email, null, 2));
    } catch (err) {
      console.error('Error parsing lead JSON:', err.message);
    }
    return;
  }

  if (args.subject && args.context) {
    try {
      const context = JSON.parse(args.context);
      console.log(`\n📝 Generating subject line\n`);

      const result = await generateSubjectLine(context);

      console.log('Provider:', result.provider);
      console.log('Subject:', result.subject);
    } catch (err) {
      console.error('Error parsing context JSON:', err.message);
    }
    return;
  }

  console.log(`
📧 Resilient Email Personalization - 3A Automation

Usage:
  node email-personalization-resilient.cjs --server [--port=3006]
  node email-personalization-resilient.cjs --personalize --lead='{"email":"...","company":"..."}'
  node email-personalization-resilient.cjs --subject --context='{"topic":"...","segment":"..."}'
  node email-personalization-resilient.cjs --health

Fallback chain:
  Grok → Gemini → Claude → Static templates
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
