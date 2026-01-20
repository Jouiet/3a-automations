#!/usr/bin/env node
/**
 * Resilient Blog Generator - Multi-Provider Fallback + Social Distribution
 * 3A Automation - Session 115
 *
 * FEATURES:
 *   - AI Generation: Anthropic → OpenAI → Grok → Gemini (fallback chain)
 *   - WordPress Publishing (optional)
 *   - Facebook Page Distribution (optional)
 *   - LinkedIn Distribution (optional)
 *   - X/Twitter Distribution (optional)
 *
 * Usage:
 *   node blog-generator-resilient.cjs --topic="Sujet" --language=fr
 *   node blog-generator-resilient.cjs --topic="Topic" --language=en --publish
 *   node blog-generator-resilient.cjs --topic="Topic" --publish --distribute
 *   node blog-generator-resilient.cjs --topic="Topic" --agentic
 *   node blog-generator-resilient.cjs --server --port=3003
 *   node blog-generator-resilient.cjs --health
 *
 * Version: 3.0.0 (Agentic Reflection Loop)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import security utilities
const {
  RateLimiter,
  setSecurityHeaders,
  retryWithExponentialBackoff
} = require('../../lib/security-utils.cjs');
const { logTelemetry } = require('../utils/telemetry.cjs');

// Security constants
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const REQUEST_TIMEOUT_MS = 120000; // 2 minutes for AI generation

// Import Marketing Science Core (Persuasion Psychology)
const MarketingScience = require('./marketing-science-core.cjs');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Load environment variables from .env file
 * P2 FIX: Improved regex to handle quotes and special characters
 * P3 UPGRADE: Agentic Reflection Loop
 */
function loadEnv() {
  const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
  let envFound = false;
  let vars = { ...process.env };

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          if (!line || line.startsWith('#')) return;
          const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*)["']?$/);
          if (match) {
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            vars[match[1]] = value;
          }
        });
        console.log(`[Telemetry] Configuration loaded from: ${envPath}`);
        envFound = true;
        break;
      } catch (e) {
        console.warn(`[Telemetry] Failed to read ${envPath}: ${e.message}`);
      }
    }
  }

  if (!envFound) {
    console.warn('[Telemetry] No .env file found in search paths. Using process environment.');
  }
  return vars;
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
  openai: {
    name: 'OpenAI GPT-5.2',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-5.2',
    apiKey: ENV.OPENAI_API_KEY,
    enabled: !!ENV.OPENAI_API_KEY,
  },
  grok: {
    name: 'Grok 4.1 Fast Reasoning',
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-4-1-fast-reasoning',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
  },
  gemini: {
    name: 'Google Gemini 3',
    // gemini-3-flash-preview: latest frontier model (Jan 2026)
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
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
// SOCIAL DISTRIBUTION CONFIG - Facebook Graph API v22.0 + LinkedIn Posts API
// ─────────────────────────────────────────────────────────────────────────────
const FACEBOOK = {
  // Facebook Graph API v22.0 (Dec 2025)
  apiVersion: 'v22.0',
  baseUrl: 'https://graph.facebook.com',
  pageId: ENV.FACEBOOK_PAGE_ID || ENV.META_PAGE_ID,
  accessToken: ENV.FACEBOOK_ACCESS_TOKEN || ENV.META_PAGE_ACCESS_TOKEN || ENV.META_ACCESS_TOKEN,
  enabled: !!(ENV.FACEBOOK_PAGE_ID || ENV.META_PAGE_ID) && !!(ENV.FACEBOOK_ACCESS_TOKEN || ENV.META_PAGE_ACCESS_TOKEN),
};

const LINKEDIN = {
  // LinkedIn Posts API (Dec 2025)
  baseUrl: 'https://api.linkedin.com/rest/posts',
  apiVersion: '202501', // YYYYMM format
  accessToken: ENV.LINKEDIN_ACCESS_TOKEN,
  organizationId: ENV.LINKEDIN_ORGANIZATION_ID, // For company page posts
  personId: ENV.LINKEDIN_PERSON_ID, // For personal posts
  enabled: !!ENV.LINKEDIN_ACCESS_TOKEN && !!(ENV.LINKEDIN_ORGANIZATION_ID || ENV.LINKEDIN_PERSON_ID),
};

// ─────────────────────────────────────────────────────────────────────────────
// X/TWITTER DISTRIBUTION CONFIG - API v2 with OAuth 1.0a
// Docs: https://developer.x.com/en/docs/x-api/tweets/manage-tweets/api-reference/post-tweets
// Free tier: 17 tweets/24h, 500 posts/month
// ─────────────────────────────────────────────────────────────────────────────
const XTWITTER = {
  // X API v2 (Dec 2025)
  baseUrl: 'https://api.twitter.com/2/tweets',
  // OAuth 1.0a credentials (4 keys required)
  apiKey: ENV.X_API_KEY || ENV.TWITTER_API_KEY,
  apiSecret: ENV.X_API_SECRET || ENV.TWITTER_API_SECRET,
  accessToken: ENV.X_ACCESS_TOKEN || ENV.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: ENV.X_ACCESS_TOKEN_SECRET || ENV.TWITTER_ACCESS_TOKEN_SECRET,
  // Check if all 4 credentials are configured
  get enabled() {
    return !!(this.apiKey && this.apiSecret && this.accessToken && this.accessTokenSecret);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CINEMATIC ADS CONFIG - Internal Video Factory via Webhook
// ─────────────────────────────────────────────────────────────────────────────
const CINEMATIC_ADS = {
  webhookUrl: ENV.CINEMATIC_ADS_WEBHOOK_URL || 'https://n8n.3a-automation.com/webhook/cinematicads/blog/generate',
  enabled: true // Always enabled as internal microservice
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TEMPLATE - INJECTED VIA MARKETING SCIENCE CORE
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt(topic, language, keywords = '', framework = 'PAS') {
  const lang = language === 'fr' ? 'French' : 'English';

  // Base Context
  const baseContext = `Write a comprehensive blog article about: ${topic}

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

  // Inject Psychology Framework (PAS, AIDA, SB7, CIALDINI)
  return MarketingScience.inject(framework || 'PAS', baseContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// P0 FIX: Added proper timeout + response size limit
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
      timeout: REQUEST_TIMEOUT_MS, // P0 FIX: Configurable timeout
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      let dataSize = 0;

      res.on('data', chunk => {
        dataSize += chunk.length;
        // P0 FIX: Response size limit
        if (dataSize > MAX_BODY_SIZE * 5) { // 5MB for AI responses
          req.destroy();
          reject(new Error('Response too large'));
          return;
        }
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    // P0 FIX: Socket timeout handler
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`));
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

async function callOpenAI(prompt) {
  if (!PROVIDERS.openai.enabled) {
    throw new Error('OpenAI API key not configured');
  }

  const body = JSON.stringify({
    model: PROVIDERS.openai.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    temperature: 0.7,
  });

  const response = await httpRequest(PROVIDERS.openai.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PROVIDERS.openai.apiKey}`,
    }
  }, body);

  const result = JSON.parse(response.data);
  return result.choices[0].message.content;
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

  // P2 FIX: API key in header instead of query string where possible
  // Note: Gemini requires key in query, but we log a warning
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


// ─────────────────────────────────────────────────────────────────────────────
// AGENTIC REFLECTION LOOP (LEVEL 3/4)
// ─────────────────────────────────────────────────────────────────────────────

async function critiqueArticle(article, topic, language) {
  const lang = language === 'fr' ? 'French' : 'English';
  const prompt = `Act as a strict Editor-in-Chief. Critique the following blog article based on these criteria: 
1. SEO optimization (keywords usage)
2. Engagement & Tone (professional but accessible)
3. Formatting (H2/H3 usage)
4. Actionable Value (tips, examples)
5. Brand Alignment (mentioning 3A Automation)

Topic: ${topic}
Language: ${lang}

Article to Critique:
Title: ${article.title}
Excerpt: ${article.excerpt}
Content Sample (First 500 chars): ${article.content.substring(0, 500)}...

Output format: Valid JSON only:
{
  "score": number (0-10),
  "issues": ["list", "of", "critical", "issues"],
  "critique": "Overall summary of what needs to be fixed."

}`;

  console.log(`[Agentic] Critique Prompt (Length: ${prompt.length})`);

  // Use fallback chain for critique
  const result = await executeGenerationChain(prompt);

  if (result.success) {
    return result.article;
  }

  console.error(`[Critique Failed] All providers failed.`);
  return { score: 5, issues: ["Critique failed - Provider Error"], critique: "Critique process failed. Review logs or retry." };
}

async function refineArticle(article, critique, topic, language) {
  const lang = language === 'fr' ? 'French' : 'English';
  const prompt = `Act as a Senior Copywriter. Improve the following article based on the Editor's critique.

Topic: ${topic}
Language: ${lang}

Original Article: ${JSON.stringify(article)}

Editor's Critique:
Score: ${critique.score}/10
Issues: ${JSON.stringify(critique.issues)}
Feedback: ${critique.critique}

Task: Rewrite the article to address ALL issues and improve the score to 10/10. Keep the JSON format.

Output format: Valid JSON only:
{
  "title": "Improved Title",
  "excerpt": "Improved Excerpt",
  "content": "Improved Full HTML Content",
  "hashtags": ["improved", "hashtags"],
  "category": "automation|ecommerce|ai|marketing"

}`;

  // Use fallback chain for refinement
  const result = await executeGenerationChain(prompt);

  if (result.success) {
    return result.article;
  }

  console.error(`[Refine Failed] All providers failed.`);
  console.warn(`[Agentic] Refinement failed. Returning original draft.`);
  return article; // Return original if refinement fails
}

// Helper to extract JSON from AI response (De-markdown)
function extractJson(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) return text.substring(jsonStart, jsonEnd + 1);
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

async function generateWithFallback(topic, language, keywords, agenticMode = false, framework = '') {
  // 1. DRAFTING PHASE
  console.log(`[Drafting] Generating initial version...`);
  const prompt = buildPrompt(topic, language, keywords, framework);
  let result = await executeGenerationChain(prompt);

  if (!result.success || !agenticMode) {
    return result;
  }

  // 2. AGENTIC REFLECTION LOOP
  const MAX_RETRIES = 2;
  let currentArticle = result.article;
  let loopCount = 0;
  let score = 0;

  console.log(`[Agentic] Entered Reflection Loop (Target Score: 8/10)`);

  while (loopCount < MAX_RETRIES) {
    loopCount++;

    // Critique
    console.log(`[Agentic] Critiquing (Round ${loopCount})...`);
    const critique = await critiqueArticle(currentArticle, topic, language);
    score = critique.score;
    console.log(`[Agentic] Score: ${score}/10. Issues: ${critique.issues.length}`);

    if (score >= 8) {
      console.log(`[Agentic] Quality Threshold Met. Finalizing.`);
      break;
    }

    // Refine
    console.log(`[Agentic] Refining (Round ${loopCount})...`);
    const refined = await refineArticle(currentArticle, critique, topic, language);
    currentArticle = refined;
  }

  return {
    success: true,
    provider: result.provider + " + Agentic Loop",
    article: currentArticle,
    errors: result.errors
  };
}

async function executeGenerationChain(prompt) {
  const errors = [];
  const providerOrder = ['anthropic', 'openai', 'grok', 'gemini'];

  for (const providerKey of providerOrder) {
    const provider = PROVIDERS[providerKey];
    if (!provider.enabled) {
      errors.push({ provider: provider.name, error: 'Not configured' });
      continue;
    }

    console.log(`[Trying] ${provider.name}...`);

    try {
      let rawContent;
      switch (providerKey) {
        case 'anthropic': rawContent = await callAnthropic(prompt); break;
        case 'openai': rawContent = await callOpenAI(prompt); break;
        case 'grok': rawContent = await callGrok(prompt); break;
        case 'gemini': rawContent = await callGemini(prompt); break;
      }

      const article = JSON.parse(extractJson(rawContent));
      if (!article) throw new Error('Failed to parse JSON');

      console.log(`[OK] Success with ${provider.name}`);
      return { success: true, provider: provider.name, article, errors };
    } catch (err) {
      console.error(`[ERROR] ${provider.name} failed:`, err.message);
      errors.push({ provider: provider.name, error: err.message });
    }
  }

  return { success: false, provider: null, article: null, errors };
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
// FACEBOOK PAGE DISTRIBUTION - Graph API v22.0
// ─────────────────────────────────────────────────────────────────────────────
async function postToFacebook(article, articleUrl) {
  if (!FACEBOOK.enabled) {
    return { success: false, error: 'Facebook not configured (FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN required)' };
  }

  const hashtags = (article.hashtags || []).map(h => `#${h.replace('#', '')}`).join(' ');
  const message = `${article.excerpt}\n\n${hashtags}\n\n>> Lire l'article complet: ${articleUrl}`;

  const url = `${FACEBOOK.baseUrl}/${FACEBOOK.apiVersion}/${FACEBOOK.pageId}/feed`;

  try {
    const response = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, JSON.stringify({
      message: message,
      link: articleUrl,
      access_token: FACEBOOK.accessToken,
    }));

    const result = JSON.parse(response.data);
    console.log(`[OK] Facebook: Posted successfully (ID: ${result.id})`);
    return {
      success: true,
      postId: result.id,
      platform: 'facebook',
    };
  } catch (error) {
    console.error(`[ERROR] Facebook posting failed: ${error.message}`);
    return { success: false, error: error.message, platform: 'facebook' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKEDIN DISTRIBUTION - Posts API (Dec 2025)
// ─────────────────────────────────────────────────────────────────────────────
async function postToLinkedIn(article, articleUrl) {
  if (!LINKEDIN.enabled) {
    return { success: false, error: 'LinkedIn not configured (LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORGANIZATION_ID required)' };
  }

  // Determine author URN (organization or person)
  const authorUrn = LINKEDIN.organizationId
    ? `urn:li:organization:${LINKEDIN.organizationId}`
    : `urn:li:person:${LINKEDIN.personId}`;

  const hashtags = (article.hashtags || []).map(h => `#${h.replace('#', '')}`).join(' ');
  const commentary = `${article.excerpt}\n\n${hashtags}`;

  const postData = {
    author: authorUrn,
    commentary: commentary,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      article: {
        source: articleUrl,
        title: article.title,
        description: article.excerpt,
      }
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  try {
    const response = await httpRequest(LINKEDIN.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINKEDIN.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN.apiVersion,
      }
    }, JSON.stringify(postData));

    // LinkedIn returns 201 with post ID in x-restli-id header
    // For our httpRequest wrapper, we parse the response
    const result = JSON.parse(response.data || '{}');
    console.log(`[OK] LinkedIn: Posted successfully`);
    return {
      success: true,
      postId: result.id || 'created',
      platform: 'linkedin',
    };
  } catch (error) {
    console.error(`[ERROR] LinkedIn posting failed: ${error.message}`);
    return { success: false, error: error.message, platform: 'linkedin' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// X/TWITTER DISTRIBUTION - API v2 with OAuth 1.0a
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate OAuth 1.0a signature for X API
 * Based on: https://developer.x.com/en/docs/authentication/oauth-1-0a/creating-a-signature
 */
function generateOAuth1Signature(method, url, params, consumerSecret, tokenSecret) {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params).sort().map(key =>
    `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  ).join('&');

  // Create signature base string
  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const signature = crypto.createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  return signature;
}

/**
 * Generate OAuth 1.0a Authorization header for X API
 */
function generateOAuthHeader(method, url, body = {}) {
  const oauthParams = {
    oauth_consumer_key: XTWITTER.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: XTWITTER.accessToken,
    oauth_version: '1.0',
  };

  // For POST with JSON body, we don't include body params in signature (X API v2)
  const allParams = { ...oauthParams };

  // Generate signature
  const signature = generateOAuth1Signature(
    method,
    url,
    allParams,
    XTWITTER.apiSecret,
    XTWITTER.accessTokenSecret
  );

  oauthParams.oauth_signature = signature;

  // Build Authorization header
  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return authHeader;
}

/**
 * Post to X/Twitter using API v2
 */
async function postToX(article, articleUrl) {
  if (!XTWITTER.enabled) {
    return {
      success: false,
      error: 'X/Twitter not configured (need X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET)',
      platform: 'x',
    };
  }

  // Build tweet text (max 280 chars)
  const hashtags = (article.hashtags || []).slice(0, 3).map(h => `#${h.replace('#', '')}`).join(' ');
  const maxTextLength = 280 - hashtags.length - articleUrl.length - 10; // 10 for spacing/emojis
  let excerpt = article.excerpt || article.title;
  if (excerpt.length > maxTextLength) {
    excerpt = excerpt.substring(0, maxTextLength - 3) + '...';
  }

  const tweetText = `${excerpt}\n\n${hashtags}\n\n>> ${articleUrl}`;

  try {
    const authHeader = generateOAuthHeader('POST', XTWITTER.baseUrl);

    const response = await httpRequest(XTWITTER.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      }
    }, JSON.stringify({ text: tweetText }));

    const result = JSON.parse(response.data);

    if (result.data && result.data.id) {
      console.log(`[OK] X/Twitter: Posted successfully (ID: ${result.data.id})`);
      return {
        success: true,
        postId: result.data.id,
        tweetUrl: `https://x.com/i/status/${result.data.id}`,
        platform: 'x',
      };
    } else {
      throw new Error(`X API Error: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error(`[ERROR] X/Twitter posting failed: ${error.message}`);
    return { success: false, error: error.message, platform: 'x' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CINEMATIC ADS VIDEO GENERATION (INTERNAL FACTORY)
// ─────────────────────────────────────────────────────────────────────────────
async function triggerCinematicVideo(article, articleUrl) {
  if (!CINEMATIC_ADS.enabled) {
    return { success: false, error: 'CinematicAds disabled' };
  }

  console.log(`[CinematicAds] Triggering internal video factory...`);

  // Prepare payload for the Asset Factory
  const payload = {
    topic: article.title,
    language: 'en', // Video engine native is EN
    keywords: (article.hashtags || []).join(', '),
    brandTone: 'innovative',
    publishToFacebook: true,
    publishToLinkedIn: true,
    sourceUrl: articleUrl,
    excerpt: article.excerpt
  };

  try {
    const response = await httpRequest(CINEMATIC_ADS.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify(payload));

    console.log(`[OK] CinematicAds: Video production started.`);
    return {
      success: true,
      platform: 'cinematic_ads',
      status: 'production_started'
    };
  } catch (error) {
    console.error(`[ERROR] CinematicAds trigger failed: ${error.message}`);
    // Non-blocking error
    return { success: false, error: error.message, platform: 'cinematic_ads' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISTRIBUTE TO ALL CONFIGURED PLATFORMS
// ─────────────────────────────────────────────────────────────────────────────
async function distributeToSocial(article, articleUrl) {
  const results = {
    facebook: null,
    linkedin: null,
    x: null,
    successCount: 0,
    failCount: 0,
  };

  console.log('\n[Social] Distributing to platforms...');

  // Facebook
  if (FACEBOOK.enabled) {
    results.facebook = await postToFacebook(article, articleUrl);
    if (results.facebook.success) results.successCount++;
    else results.failCount++;
  } else {
    console.log('[WARN] Facebook: Not configured (skipped)');
  }

  // LinkedIn
  if (LINKEDIN.enabled) {
    results.linkedin = await postToLinkedIn(article, articleUrl);
    if (results.linkedin.success) results.successCount++;
    else results.failCount++;
  } else {
    console.log('[WARN] LinkedIn: Not configured (skipped)');
  }

  // X/Twitter
  if (XTWITTER.enabled) {
    results.x = await postToX(article, articleUrl);
    if (results.x.success) results.successCount++;
    else results.failCount++;
  } else {
    console.log('[WARN] X/Twitter: Not configured (skipped)');
  }

  console.log(`\n[Stats] Distribution: ${results.successCount} success, ${results.failCount} failed`);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER MODE
// P0/P1/P2/P3 FIX: Security hardening
// ─────────────────────────────────────────────────────────────────────────────
function startServer(port = 3003) {
  // P1 FIX: Rate limiter
  const rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 10 }); // 10 req/min (AI is expensive)

  // P3 FIX: Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const server = http.createServer(async (req, res) => {
    // P0 FIX: Security headers
    setSecurityHeaders(res);

    // P2 FIX: CORS with origin whitelist
    const allowedOrigins = [
      'https://3a-automation.com',
      'https://dashboard.3a-automation.com',
      'http://localhost:3000',
      'http://localhost:3003'
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // P1 FIX: Rate limiting
    const clientIP = req.socket.remoteAddress || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. AI generation is rate-limited.' }));
      return;
    }

    if (req.method === 'POST' && (req.url === '/generate' || req.url === '/')) {
      let body = '';
      let bodySize = 0;

      req.on('data', chunk => {
        bodySize += chunk.length;
        // P0 FIX: Body size limit
        if (bodySize > MAX_BODY_SIZE) {
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large' }));
          return;
        }
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { topic, language = 'fr', keywords = '', publish = false, distribute = false } = JSON.parse(body);

          if (!topic) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Topic is required' }));
            return;
          }

          console.log(`\n[Blog] Generating article: "${topic}" (${language})`);
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
          let articleUrl = null;

          if (publish) {
            try {
              wpResult = await publishToWordPress(result.article, language);
              console.log(`[Publish] WordPress: ${wpResult.url}`);
              articleUrl = wpResult.url;
            } catch (wpErr) {
              console.error('WordPress publish failed:', wpErr.message);
            }
          }

          // Social distribution
          let socialResult = null;
          if (distribute) {
            if (!articleUrl) {
              articleUrl = 'https://3a-automation.com/blog';
            }
            socialResult = await distributeToSocial(result.article, articleUrl);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            provider: result.provider,
            article: result.article,
            wordpress: wpResult,
            social: socialResult,
            fallbacksUsed: result.errors.length,
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else if (req.url === '/health') {
      // Health check showing all platform status
      const status = {
        healthy: true,
        providers: {},
        social: {},
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
      status.social.facebook = {
        configured: FACEBOOK.enabled,
        pageId: FACEBOOK.pageId || null,
      };
      status.social.linkedin = {
        configured: LINKEDIN.enabled,
        organizationId: LINKEDIN.organizationId || null,
      };
      status.social.x = {
        configured: XTWITTER.enabled,
        note: XTWITTER.enabled ? 'OAuth 1.0a ready' : 'Need 4 keys',
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`\n[Server] Blog Generator v2.0 running on http://localhost:${port}`);
    console.log('\nEndpoints:');
    console.log('  POST /generate  - Generate + publish + distribute');
    console.log('  GET  /health    - All provider/platform status');
    console.log('\n=== AI PROVIDERS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '[OK]' : '[--]';
      console.log(`  ${status} ${provider.name}`);
    }
    console.log('\n=== SOCIAL DISTRIBUTION ===');
    console.log(`  ${FACEBOOK.enabled ? '[OK]' : '[--]'} Facebook Page`);
    console.log(`  ${LINKEDIN.enabled ? '[OK]' : '[--]'} LinkedIn`);
    console.log(`  ${XTWITTER.enabled ? '[OK]' : '[--]'} X/Twitter`);
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
    console.log('\n=== AI PROVIDERS ===');
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const status = provider.enabled ? '[OK] Configured' : '[--] Not configured';
      console.log(`${provider.name}: ${status}`);
    }

    console.log('\n=== PUBLISHING ===');
    console.log(`WordPress: ${WORDPRESS.appPassword ? '[OK] Configured' : '[--] Not configured'}`);

    console.log('\n=== SOCIAL DISTRIBUTION ===');
    console.log(`Facebook: ${FACEBOOK.enabled ? '[OK] Configured' : '[--] Not configured (need FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN)'}`);
    console.log(`LinkedIn: ${LINKEDIN.enabled ? '[OK] Configured' : '[--] Not configured (need LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORGANIZATION_ID)'}`);
    console.log(`X/Twitter: ${XTWITTER.enabled ? '[OK] Configured (OAuth 1.0a)' : '[--] Not configured (need X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET)'}`);

    // Summary
    const aiCount = Object.values(PROVIDERS).filter(p => p.enabled).length;
    const socialCount = (FACEBOOK.enabled ? 1 : 0) + (LINKEDIN.enabled ? 1 : 0) + (XTWITTER.enabled ? 1 : 0);
    console.log(`\n=== SUMMARY ===`);
    console.log(`AI Providers: ${aiCount}/3 configured`);
    console.log(`Social Platforms: ${socialCount}/3 configured`);
    console.log(`WordPress: ${WORDPRESS.appPassword ? '[OK]' : '[--]'}`);
    return;
  }

  // Generate article
  const topic = args.topic || 'Automation trends 2026';
  const language = args.language || 'fr';
  const publish = !!args.publish;
  const distribute = !!args.distribute;
  const video = !!args.video || !!args.distribute; // Auto-generate video for distribution
  const agentic = !!args.agentic; // Enable reflection loop
  const framework = args.framework || 'PAS'; // Default to PAS for high conversion

  // Generate article
  if (topic) {
    console.log(`\n[Blog] Generating article: "${topic}"`);
    console.log(`Language: ${language}`);
    if (framework) console.log(`[Framework] ${framework} (Persuasion Mode Active)`);
    if (agentic) console.log(`[Mode] AGENTIC ENABLED (Reflection Loop Active)`);
    console.log('─'.repeat(50));

    const result = await generateWithFallback(
      topic,
      language,
      args.keywords || '',
      agentic,
      framework
    );

    if (!result.success) {
      console.error('\n[ERROR] All providers failed:');
      result.errors.forEach(e => console.error(`  - ${e.provider}: ${e.error}`));
      process.exit(1);
    }

    console.log('\n[OK] Article generated successfully!');
    console.log(`Provider used: ${result.provider}`);
    console.log(`Title: ${result.article.title}`);
    console.log(`Excerpt: ${result.article.excerpt}`);

    let articleUrl = null;

    // Publish if requested
    if (args.publish) {
      try {
        const wpResult = await publishToWordPress(result.article, args.language || 'fr');
        console.log(`\n[Publish] WordPress complete!`);
        console.log(`URL: ${wpResult.url}`);
        articleUrl = wpResult.url;
      } catch (err) {
        console.error(`\n[ERROR] WordPress publish failed: ${err.message}`);
        // Use fallback URL for social distribution
        articleUrl = `${WORDPRESS.url}/?p=draft-${Date.now()}`;
      }
    }

    // Distribute to social if requested
    if (args.distribute) {
      if (!articleUrl) {
        // If not published, use 3A main site as URL
        articleUrl = 'https://3a-automation.com/blog';
        console.log(`\n[WARN] No article URL (not published), using: ${articleUrl}`);
      }

      const socialResult = await distributeToSocial(result.article, articleUrl);
      result.social = socialResult;
    }

    // Generate Video Ad (CinematicAds)
    if (video) {
      if (!articleUrl) {
        articleUrl = 'https://3a-automation.com/blog';
      }
      const videoResult = await triggerCinematicVideo(result.article, articleUrl);
      result.video = videoResult;
      console.log(`[Video] CinematicAds Status: ${videoResult.status}`);
    }

    // Save to file
    const outputPath = path.join(__dirname, '../../../outputs', `blog-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n[Saved] ${outputPath}`);
    return;
  }

  // Help
  console.log(`
[Blog] Resilient Blog Generator v2.1 - 3A Automation

FEATURES:
  [+] AI Generation with multi-provider fallback
  [+] WordPress publishing
  [+] Facebook Page distribution
  [+] LinkedIn distribution
  [+] X/Twitter distribution
  [+] CinematicAds Video Generation (Auto-trigger with --distribute)


Usage:
  node blog-generator-resilient.cjs --topic="Your topic" [options]

Options:
  --topic       Article topic (required for generation)
  --language    Language: fr or en (default: fr)
  --keywords    SEO keywords (comma-separated)
  --framework   Marketing Framework: "PAS" or "AIDA" (default: none)
  --publish     Publish to WordPress after generation

  --distribute  Post to Facebook + LinkedIn + X after publishing
  --agentic     Enable AI Reflection Loop (Draft -> Critique -> Refine)
  --server      Run as HTTP server
  --port        Server port (default: 3003)
  --health      Show all provider/platform status

AI Fallback Chain:
  Anthropic Claude → xAI Grok → Google Gemini

Social Distribution (requires credentials):
  Facebook: FACEBOOK_PAGE_ID + FACEBOOK_ACCESS_TOKEN
  LinkedIn: LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORGANIZATION_ID
  X/Twitter: X_API_KEY + X_API_SECRET + X_ACCESS_TOKEN + X_ACCESS_TOKEN_SECRET
             (OAuth 1.0a - get from developer.x.com)

Examples:
  node blog-generator-resilient.cjs --health
  node blog-generator-resilient.cjs --topic="E-commerce 2026" --language=fr
  node blog-generator-resilient.cjs --topic="AI marketing" --publish
  node blog-generator-resilient.cjs --topic="Automation" --publish --distribute

  node blog-generator-resilient.cjs --topic="Agentic AI" --agentic
  node blog-generator-resilient.cjs --server --port=3003
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
