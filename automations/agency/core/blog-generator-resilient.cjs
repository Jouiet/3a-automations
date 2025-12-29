#!/usr/bin/env node
/**
 * Resilient Blog Generator - Multi-Provider Fallback
 * 3A Automation - Session 115
 *
 * Fallback chain: Anthropic → Grok → Gemini
 * If all fail, returns structured error for alerting
 *
 * Usage:
 *   node blog-generator-resilient.cjs --topic="Sujet" --language=fr
 *   node blog-generator-resilient.cjs --topic="Topic" --language=en --publish
 *   node blog-generator-resilient.cjs --server --port=3003
 */

const https = require('https');
const http = require('http');
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

const PROVIDERS = {
  anthropic: {
    name: 'Anthropic Claude',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY,
  },
  grok: {
    name: 'xAI Grok',
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-mini',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
  },
  gemini: {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
  },
};

const WORDPRESS = {
  url: ENV.WP_SITE_URL || ENV.WORDPRESS_URL || 'https://wp.3a-automation.com',
  user: ENV.WP_USER || ENV.WORDPRESS_USER || 'admin',
  appPassword: ENV.WP_APP_PASSWORD || ENV.WORDPRESS_APP_PASSWORD,
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt(topic, language, keywords = '') {
  const lang = language === 'fr' ? 'French' : 'English';
  return `Write a comprehensive blog article about: ${topic}

Language: ${lang}
Target Keywords: ${keywords || topic}

Requirements:
- 1500-2000 words
- Include H2 and H3 headings with proper HTML tags
- Include actionable tips with concrete examples
- Include statistics and data (cite sources when possible)
- SEO optimized for the target keywords
- Professional but accessible tone
- Focus on 2025-2026 trends and future outlook
- Include a strong CTA at the end mentioning 3A Automation

Brand context:
- Company: 3A Automation (Automation, Analytics, AI)
- Website: https://3a-automation.com
- Services: E-commerce automation, Marketing automation, AI integration

Output format: Valid JSON only, no markdown fences, no explanations:
{
  "title": "Article Title",
  "excerpt": "150 character summary for social media",
  "content": "Full HTML article content with proper tags",
  "hashtags": ["relevant", "hashtags"],
  "category": "automation|ecommerce|ai|marketing"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
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
      timeout: 120000, // 2 minutes for AI generation
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

async function callAnthropic(prompt) {
  if (!PROVIDERS.anthropic.enabled) {
    throw new Error('Anthropic API key not configured');
  }

  const body = JSON.stringify({
    model: PROVIDERS.anthropic.model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
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

async function callGrok(prompt) {
  if (!PROVIDERS.grok.enabled) {
    throw new Error('Grok API key not configured');
  }

  const body = JSON.stringify({
    model: PROVIDERS.grok.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
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

async function callGemini(prompt) {
  if (!PROVIDERS.gemini.enabled) {
    throw new Error('Gemini API key not configured');
  }

  const url = `${PROVIDERS.gemini.url}?key=${PROVIDERS.gemini.apiKey}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 4096,
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

// ─────────────────────────────────────────────────────────────────────────────
// RESILIENT GENERATION WITH FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
async function generateWithFallback(topic, language, keywords) {
  const prompt = buildPrompt(topic, language, keywords);
  const errors = [];
  const providerOrder = ['anthropic', 'grok', 'gemini'];

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    console.log(`🔄 Trying ${provider.name}...`);

    try {
      let rawContent;
      switch (providerKey) {
        case 'anthropic': rawContent = await callAnthropic(prompt); break;
        case 'grok': rawContent = await callGrok(prompt); break;
        case 'gemini': rawContent = await callGemini(prompt); break;
      }

      // Parse JSON from response (handle markdown fences)
      let jsonContent = rawContent;
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }

      // Try to find JSON object
      const jsonStart = jsonContent.indexOf('{');
      const jsonEnd = jsonContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }

      const article = JSON.parse(jsonContent);

      console.log(`✅ Success with ${provider.name}`);
      return {
        success: true,
        provider: provider.name,
        article,
        errors,
      };
    } catch (err) {
      console.error(`❌ ${provider.name} failed:`, err.message);
      errors.push({ provider: provider.name, error: err.message });
    }
  }

  // All providers failed
  return {
    success: false,
    provider: null,
    article: null,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WORDPRESS PUBLISHING
// ─────────────────────────────────────────────────────────────────────────────
async function publishToWordPress(article, language) {
  if (!WORDPRESS.appPassword) {
    throw new Error('WordPress App Password not configured');
  }

  const auth = Buffer.from(`${WORDPRESS.user}:${WORDPRESS.appPassword}`).toString('base64');

  // Map category to WordPress category ID (adjust as needed)
  const categoryMap = {
    'automation': 2,
    'ecommerce': 3,
    'ai': 4,
    'marketing': 2,
  };

  const postData = {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt,
    status: 'publish',
    categories: [categoryMap[article.category] || 2],
  };

  const response = await httpRequest(`${WORDPRESS.url}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    }
  }, JSON.stringify(postData));

  const post = JSON.parse(response.data);
  return {
    id: post.id,
    url: post.link,
    title: post.title.rendered,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER MODE
// ─────────────────────────────────────────────────────────────────────────────
function startServer(port = 3003) {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && (req.url === '/generate' || req.url === '/')) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { topic, language = 'fr', keywords = '', publish = false } = JSON.parse(body);

          if (!topic) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Topic is required' }));
            return;
          }

          console.log(`\n📝 Generating article: "${topic}" (${language})`);
          const result = await generateWithFallback(topic, language, keywords);

          if (!result.success) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'All AI providers failed',
              details: result.errors,
            }));
            return;
          }

          let wpResult = null;
          if (publish) {
            try {
              wpResult = await publishToWordPress(result.article, language);
              console.log(`📤 Published to WordPress: ${wpResult.url}`);
            } catch (wpErr) {
              console.error('WordPress publish failed:', wpErr.message);
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            provider: result.provider,
            article: result.article,
            wordpress: wpResult,
            fallbacksUsed: result.errors.length,
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else if (req.url === '/health') {
      // Health check showing provider status
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
      status.wordpress = {
        url: WORDPRESS.url,
        configured: !!WORDPRESS.appPassword,
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`\n🚀 Blog Generator Server running on http://localhost:${port}`);
    console.log('\nEndpoints:');
    console.log('  POST /generate  - Generate article with fallback');
    console.log('  GET  /health    - Provider status');
    console.log('\nProviders status:');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅' : '❌';
      console.log(`  ${status} ${provider.name}`);
    }
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

  // Server mode
  if (args.server) {
    startServer(parseInt(args.port) || 3003);
    return;
  }

  // Health check
  if (args.health) {
    console.log('\n=== PROVIDER STATUS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '✅ Configured' : '❌ Not configured';
      console.log(`${provider.name}: ${status}`);
    }
    console.log(`\nWordPress: ${WORDPRESS.appPassword ? '✅ Configured' : '❌ Not configured'}`);
    return;
  }

  // Generate article
  if (args.topic) {
    console.log(`\n📝 Generating article: "${args.topic}"`);
    console.log(`Language: ${args.language || 'fr'}`);
    console.log('─'.repeat(50));

    const result = await generateWithFallback(
      args.topic,
      args.language || 'fr',
      args.keywords || ''
    );

    if (!result.success) {
      console.error('\n❌ All providers failed:');
      result.errors.forEach(e => console.error(`  - ${e.provider}: ${e.error}`));
      process.exit(1);
    }

    console.log('\n✅ Article generated successfully!');
    console.log(`Provider used: ${result.provider}`);
    console.log(`Title: ${result.article.title}`);
    console.log(`Excerpt: ${result.article.excerpt}`);

    // Publish if requested
    if (args.publish) {
      try {
        const wpResult = await publishToWordPress(result.article, args.language || 'fr');
        console.log(`\n📤 Published to WordPress!`);
        console.log(`URL: ${wpResult.url}`);
      } catch (err) {
        console.error(`\n❌ WordPress publish failed: ${err.message}`);
      }
    }

    // Save to file
    const outputPath = path.join(__dirname, '../../../outputs', `blog-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n📁 Saved to: ${outputPath}`);
    return;
  }

  // Help
  console.log(`
📝 Resilient Blog Generator - 3A Automation

Usage:
  node blog-generator-resilient.cjs --topic="Your topic" [options]

Options:
  --topic      Article topic (required for generation)
  --language   Language: fr or en (default: fr)
  --keywords   SEO keywords (comma-separated)
  --publish    Publish to WordPress after generation
  --server     Run as HTTP server
  --port       Server port (default: 3003)
  --health     Show provider status

Fallback chain:
  Anthropic Claude → xAI Grok → Google Gemini

Examples:
  node blog-generator-resilient.cjs --topic="E-commerce automation 2026" --language=fr
  node blog-generator-resilient.cjs --topic="AI marketing" --publish
  node blog-generator-resilient.cjs --server --port=3003
  node blog-generator-resilient.cjs --health
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
