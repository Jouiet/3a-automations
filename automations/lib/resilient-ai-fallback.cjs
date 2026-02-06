#!/usr/bin/env node
/**
 * Resilient AI Fallback - Multi-Provider Chain Template
 * 3A Automation - Étagère Technologique (Technology Shelf)
 *
 * TRANSFER TARGETS: Alpha Medical, MyDealz, Future Subsidiaries
 *
 * FRONTIER MODELS (Feb 2026):
 *   - Claude: claude-sonnet-4-5-20250929 / claude-opus-4-6
 *   - Grok: grok-4-1-fast-reasoning
 *   - OpenAI: gpt-5.2
 *   - Gemini: gemini-3-flash-preview
 *
 * FALLBACK CHAIN: anthropic → grok → openai → gemini
 *
 * Usage:
 *   const { callWithFallback, initProviders } = require('./resilient-ai-fallback.cjs');
 *   const result = await callWithFallback(prompt, { maxTokens: 1024 });
 *
 * Version: 1.0.0 (Session 144 - Technology Shelf)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 30000; // 30 seconds per provider
const MAX_RETRIES = 2;    // Retries per provider before moving to next

/**
 * Load environment variables from multiple .env paths
 */
function loadEnv() {
  const searchPaths = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../.env'),
  ];

  let vars = { ...process.env };

  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          if (!line || line.startsWith('#')) return;
          const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*)["']?$/);
          if (match) {
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            vars[match[1]] = value;
          }
        });
        break;
      } catch (e) {
        // Continue to next path
      }
    }
  }

  return vars;
}

const ENV = loadEnv();

// ─────────────────────────────────────────────────────────────────────────────
// FRONTIER AI PROVIDERS (Jan 2026)
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDERS = {
  anthropic: {
    name: 'Claude Opus 4.6',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-opus-4-6',
    fallbackModel: 'claude-sonnet-4-20250514',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY,
    formatRequest: (prompt, options) => ({
      model: options.model || PROVIDERS.anthropic.model,
      max_tokens: options.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    formatHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
    extractResponse: (data) => data.content?.[0]?.text || '',
  },

  grok: {
    name: 'Grok 4.1 Fast Reasoning',
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-4-1-fast-reasoning',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
    formatRequest: (prompt, options) => ({
      model: options.model || PROVIDERS.grok.model,
      max_tokens: options.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    formatHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    extractResponse: (data) => data.choices?.[0]?.message?.content || '',
  },

  openai: {
    name: 'GPT-5.2',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-5.2',
    fallbackModel: 'gpt-4o',
    apiKey: ENV.OPENAI_API_KEY,
    enabled: !!ENV.OPENAI_API_KEY,
    formatRequest: (prompt, options) => ({
      model: options.model || PROVIDERS.openai.model,
      max_tokens: options.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
    formatHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    extractResponse: (data) => data.choices?.[0]?.message?.content || '',
  },

  gemini: {
    name: 'Gemini 3 Flash Preview',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    model: 'gemini-3-flash-preview',
    fallbackModel: 'gemini-2.0-flash',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
    formatRequest: (prompt, options) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4096,
      },
    }),
    formatHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
    }),
    // Gemini uses query param for API key
    getUrl: (baseUrl, apiKey) => `${baseUrl}?key=${apiKey}`,
    extractResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || '',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HTTP REQUEST UTILITY
// ─────────────────────────────────────────────────────────────────────────────

function httpRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'POST',
        headers: options.headers,
        timeout: options.timeout || TIMEOUT_MS,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ status: res.statusCode, data: parsed });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || data.slice(0, 200)}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${data.slice(0, 200)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RETRY WITH EXPONENTIAL BACKOFF
// ─────────────────────────────────────────────────────────────────────────────

async function retryWithBackoff(fn, maxRetries = MAX_RETRIES, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL SINGLE PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

async function callProvider(providerKey, prompt, options = {}) {
  const provider = PROVIDERS[providerKey];
  if (!provider || !provider.enabled) {
    throw new Error(`Provider ${providerKey} not configured or disabled`);
  }

  const url = provider.getUrl
    ? provider.getUrl(provider.url, provider.apiKey)
    : provider.url;

  const headers = provider.formatHeaders(provider.apiKey);
  const body = provider.formatRequest(prompt, options);

  const response = await httpRequest(url, {
    method: 'POST',
    headers,
    body,
    timeout: options.timeout || TIMEOUT_MS,
  });

  return provider.extractResponse(response.data);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FALLBACK FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call AI with automatic fallback chain
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Options (maxTokens, timeout, preferredOrder)
 * @returns {Promise<{text: string, provider: string, latency: number}>}
 */
async function callWithFallback(prompt, options = {}) {
  const order = options.preferredOrder || ['anthropic', 'grok', 'openai', 'gemini'];
  const enabledProviders = order.filter((key) => PROVIDERS[key]?.enabled);

  if (enabledProviders.length === 0) {
    throw new Error('No AI providers configured. Set ANTHROPIC_API_KEY, XAI_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY');
  }

  const errors = [];
  for (const providerKey of enabledProviders) {
    const startTime = Date.now();
    try {
      const text = await retryWithBackoff(
        () => callProvider(providerKey, prompt, options),
        options.maxRetries || MAX_RETRIES
      );

      const latency = Date.now() - startTime;
      console.log(`[Resilient AI] ✅ ${PROVIDERS[providerKey].name} responded in ${latency}ms`);

      return {
        text,
        provider: providerKey,
        providerName: PROVIDERS[providerKey].name,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.warn(`[Resilient AI] ⚠️ ${PROVIDERS[providerKey].name} failed after ${latency}ms: ${error.message}`);
      errors.push({ provider: providerKey, error: error.message, latency });
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed:\n${errors.map((e) => `  - ${e.provider}: ${e.error}`).join('\n')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get status of all providers
 */
function getProvidersStatus() {
  return Object.entries(PROVIDERS).map(([key, provider]) => ({
    key,
    name: provider.name,
    model: provider.model,
    enabled: provider.enabled,
  }));
}

/**
 * Health check - test all enabled providers
 */
async function healthCheck() {
  const testPrompt = 'Respond with exactly: OK';
  const results = [];

  for (const [key, provider] of Object.entries(PROVIDERS)) {
    if (!provider.enabled) {
      results.push({ provider: key, status: 'disabled', enabled: false });
      continue;
    }

    const startTime = Date.now();
    try {
      await callProvider(key, testPrompt, { maxTokens: 10, timeout: 10000 });
      results.push({
        provider: key,
        status: 'ok',
        enabled: true,
        latency: Date.now() - startTime,
      });
    } catch (error) {
      results.push({
        provider: key,
        status: 'error',
        enabled: true,
        error: error.message,
        latency: Date.now() - startTime,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--health')) {
    console.log('\n[Resilient AI Fallback] Health Check\n');
    const results = await healthCheck();
    console.table(results);
    const okCount = results.filter((r) => r.status === 'ok').length;
    const total = results.filter((r) => r.enabled).length;
    console.log(`\n✅ ${okCount}/${total} providers operational`);
    process.exit(okCount > 0 ? 0 : 1);
  }

  if (args.includes('--status')) {
    console.log('\n[Resilient AI Fallback] Provider Status\n');
    console.table(getProvidersStatus());
    process.exit(0);
  }

  if (args.includes('--test')) {
    console.log('\n[Resilient AI Fallback] Test Call\n');
    try {
      const result = await callWithFallback('What is 2+2? Reply with just the number.', {
        maxTokens: 10,
      });
      console.log(`Provider: ${result.providerName}`);
      console.log(`Latency: ${result.latency}ms`);
      console.log(`Response: ${result.text.trim()}`);
      process.exit(0);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  // Default: show usage
  console.log(`
Resilient AI Fallback - Multi-Provider Chain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage:
  node resilient-ai-fallback.cjs --health   # Test all providers
  node resilient-ai-fallback.cjs --status   # Show provider config
  node resilient-ai-fallback.cjs --test     # Make a test call

Programmatic Usage:
  const { callWithFallback, healthCheck } = require('./resilient-ai-fallback.cjs');
  const result = await callWithFallback('Your prompt here', { maxTokens: 1024 });

Providers (Fallback Order):
  1. Anthropic Claude Opus 4.6
  2. Grok 4.1 Fast Reasoning
  3. OpenAI GPT-5.2
  4. Google Gemini 3 Flash

Environment Variables:
  ANTHROPIC_API_KEY   - For Claude
  XAI_API_KEY         - For Grok
  OPENAI_API_KEY      - For GPT
  GEMINI_API_KEY      - For Gemini
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  callWithFallback,
  callProvider,
  healthCheck,
  getProvidersStatus,
  PROVIDERS,
};

// Run if executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error(`❌ Fatal: ${err.message}`);
    process.exit(1);
  });
}
