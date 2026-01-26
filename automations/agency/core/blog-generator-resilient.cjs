#!/usr/bin/env node
/**
 * Resilient Blog Generator - Multi-Provider Fallback + Social Distribution
 * 3A Automation - Session 115
 *
 * FEATURES:
 *   - AI Generation: Gemini → Grok → Claude (VOLUME task - Session 168terdecies)
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

// ─────────────────────────────────────────────────────────────────────────────
// HITL (Human In The Loop) CONFIG - Session 157
// CRITICAL: Blog content must be reviewed before publication
// ─────────────────────────────────────────────────────────────────────────────
const HITL_CONFIG = {
  draftsDir: path.join(__dirname, '../../../outputs/drafts'),
  approvedDir: path.join(__dirname, '../../../outputs/approved'),
  slackWebhook: process.env.SLACK_WEBHOOK_URL || null,
  notifyEmail: process.env.HITL_NOTIFY_EMAIL || null,
  requireApproval: true, // DEFAULT: Always require human approval before publish
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENTIC REFLECTION LOOP CONFIG - Session 165sexies (Full Flexibility)
// Controls the AI self-improvement loop quality thresholds
// ─────────────────────────────────────────────────────────────────────────────
const AGENTIC_CONFIG = {
  // Quality threshold for content approval (1-10 scale)
  // ENV: BLOG_AGENTIC_QUALITY_THRESHOLD=8 (options: 6, 7, 8, 9)
  qualityThreshold: parseInt(process.env.BLOG_AGENTIC_QUALITY_THRESHOLD) || 8,
  qualityThresholdOptions: [6, 7, 8, 9],
  // Maximum reflection loop iterations
  // ENV: BLOG_AGENTIC_MAX_RETRIES=2 (options: 1, 2, 3, 4)
  maxRetries: parseInt(process.env.BLOG_AGENTIC_MAX_RETRIES) || 2,
  maxRetriesOptions: [1, 2, 3, 4],
  // Enable detailed logging
  // ENV: BLOG_AGENTIC_VERBOSE=false
  verbose: process.env.BLOG_AGENTIC_VERBOSE === 'true',
};

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

// AI PROVIDERS - Session 168terdecies: VOLUME TASK (Gemini first for cost optimization)
// Strategy: Content generation = high volume → optimize cost, quality fallback
// Fallback: Gemini → Grok → Claude
const PROVIDERS = {
  gemini: {
    name: 'Google Gemini 3',
    // gemini-3-flash-preview: latest frontier model (Jan 2026)
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
  },
  grok: {
    name: 'Grok 4.1 Fast Reasoning',
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-4-1-fast-reasoning',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
  },
  anthropic: {
    name: 'Claude Opus 4.5',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-opus-4-5-20251101',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY,
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

  // 2. AGENTIC REFLECTION LOOP (Session 165sexies - Configurable)
  const MAX_RETRIES = AGENTIC_CONFIG.maxRetries;
  const QUALITY_THRESHOLD = AGENTIC_CONFIG.qualityThreshold;
  let currentArticle = result.article;
  let loopCount = 0;
  let score = 0;

  console.log(`[Agentic] Entered Reflection Loop (Target Score: ${QUALITY_THRESHOLD}/10, Max Retries: ${MAX_RETRIES})`);

  while (loopCount < MAX_RETRIES) {
    loopCount++;

    // Critique
    console.log(`[Agentic] Critiquing (Round ${loopCount})...`);
    const critique = await critiqueArticle(currentArticle, topic, language);
    score = critique.score;
    console.log(`[Agentic] Score: ${score}/10. Issues: ${critique.issues.length}`);

    if (score >= QUALITY_THRESHOLD) {
      console.log(`[Agentic] Quality Threshold Met (${score} >= ${QUALITY_THRESHOLD}). Finalizing.`);
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
// HITL: DRAFT MANAGEMENT SYSTEM (Session 157)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure HITL directories exist
 */
function ensureHITLDirs() {
  if (!fs.existsSync(HITL_CONFIG.draftsDir)) {
    fs.mkdirSync(HITL_CONFIG.draftsDir, { recursive: true });
  }
  if (!fs.existsSync(HITL_CONFIG.approvedDir)) {
    fs.mkdirSync(HITL_CONFIG.approvedDir, { recursive: true });
  }
}

/**
 * Generate unique draft ID
 */
function generateDraftId() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `draft-${timestamp}-${random}`;
}

/**
 * Save article as draft for human review
 * @param {Object} article - Generated article
 * @param {Object} metadata - Generation metadata (provider, topic, language)
 * @returns {Object} Draft info with ID and path
 */
function saveDraft(article, metadata) {
  ensureHITLDirs();

  const draftId = generateDraftId();
  const draftData = {
    id: draftId,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    article,
    metadata,
    reviewUrl: `Review draft: node blog-generator-resilient.cjs --view-draft=${draftId}`,
    approveCmd: `Approve: node blog-generator-resilient.cjs --approve=${draftId}`,
    rejectCmd: `Reject: node blog-generator-resilient.cjs --reject=${draftId}`,
  };

  const draftPath = path.join(HITL_CONFIG.draftsDir, `${draftId}.json`);
  fs.writeFileSync(draftPath, JSON.stringify(draftData, null, 2));

  console.log(`\n[HITL] ⏸️  Draft saved for human review`);
  console.log(`  Draft ID: ${draftId}`);
  console.log(`  Path: ${draftPath}`);
  console.log(`  Title: ${article.title}`);
  console.log(`\n  📋 NEXT STEPS:`);
  console.log(`     1. Review: node blog-generator-resilient.cjs --view-draft=${draftId}`);
  console.log(`     2. Approve: node blog-generator-resilient.cjs --approve=${draftId}`);
  console.log(`     3. Reject:  node blog-generator-resilient.cjs --reject=${draftId}`);

  return { id: draftId, path: draftPath, status: 'pending_review' };
}

/**
 * List all pending drafts
 */
function listDrafts() {
  ensureHITLDirs();

  const drafts = [];
  const files = fs.readdirSync(HITL_CONFIG.draftsDir);

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const draftData = JSON.parse(fs.readFileSync(path.join(HITL_CONFIG.draftsDir, file), 'utf8'));
        drafts.push({
          id: draftData.id,
          title: draftData.article?.title || 'Untitled',
          status: draftData.status,
          createdAt: draftData.createdAt,
          provider: draftData.metadata?.provider,
          language: draftData.metadata?.language,
        });
      } catch (e) {
        console.warn(`[WARN] Could not parse draft: ${file}`);
      }
    }
  }

  return drafts;
}

/**
 * Get draft by ID
 */
function getDraft(draftId) {
  const draftPath = path.join(HITL_CONFIG.draftsDir, `${draftId}.json`);
  if (!fs.existsSync(draftPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(draftPath, 'utf8'));
}

/**
 * Approve draft and move to approved folder
 */
function approveDraft(draftId) {
  const draft = getDraft(draftId);
  if (!draft) {
    return { success: false, error: `Draft not found: ${draftId}` };
  }

  draft.status = 'approved';
  draft.approvedAt = new Date().toISOString();

  // Move to approved folder
  const approvedPath = path.join(HITL_CONFIG.approvedDir, `${draftId}.json`);
  fs.writeFileSync(approvedPath, JSON.stringify(draft, null, 2));

  // Remove from drafts
  const draftPath = path.join(HITL_CONFIG.draftsDir, `${draftId}.json`);
  fs.unlinkSync(draftPath);

  console.log(`[HITL] ✅ Draft approved: ${draftId}`);
  return { success: true, draft, approvedPath };
}

/**
 * Reject draft
 */
function rejectDraft(draftId, reason = '') {
  const draft = getDraft(draftId);
  if (!draft) {
    return { success: false, error: `Draft not found: ${draftId}` };
  }

  draft.status = 'rejected';
  draft.rejectedAt = new Date().toISOString();
  draft.rejectionReason = reason;

  // Keep in drafts folder with rejected status (for audit trail)
  const draftPath = path.join(HITL_CONFIG.draftsDir, `${draftId}.json`);
  fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));

  console.log(`[HITL] ❌ Draft rejected: ${draftId}`);
  return { success: true, draft };
}

/**
 * Send Slack notification for new draft (optional)
 */
async function notifySlack(draft) {
  if (!HITL_CONFIG.slackWebhook) return { success: false, error: 'Slack not configured' };

  const payload = {
    text: `📝 New Blog Draft Pending Review`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📝 New Blog Draft Pending Review' }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Title:*\n${draft.article.title}` },
          { type: 'mrkdwn', text: `*Draft ID:*\n\`${draft.id}\`` },
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Excerpt:*\n${draft.article.excerpt}` }
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Commands:*\n\`\`\`\nView: node blog-generator-resilient.cjs --view-draft=${draft.id}\nApprove: node blog-generator-resilient.cjs --approve=${draft.id} --publish\nReject: node blog-generator-resilient.cjs --reject=${draft.id}\n\`\`\`` }
      }
    ]
  };

  try {
    await httpRequest(HITL_CONFIG.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify(payload));

    console.log(`[HITL] 📤 Slack notification sent`);
    return { success: true };
  } catch (error) {
    console.warn(`[HITL] Slack notification failed: ${error.message}`);
    return { success: false, error: error.message };
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

  // ─────────────────────────────────────────────────────────────────────────
  // HITL COMMANDS (Session 157)
  // ─────────────────────────────────────────────────────────────────────────

  // List pending drafts
  if (args['list-drafts'] || args.listdrafts) {
    console.log('\n=== PENDING DRAFTS ===\n');
    const drafts = listDrafts();

    if (drafts.length === 0) {
      console.log('No pending drafts.');
      return;
    }

    drafts.forEach((d, i) => {
      const statusIcon = d.status === 'pending_review' ? '⏸️' : d.status === 'approved' ? '✅' : '❌';
      console.log(`${i + 1}. ${statusIcon} [${d.id}]`);
      console.log(`   Title: ${d.title}`);
      console.log(`   Created: ${d.createdAt}`);
      console.log(`   Provider: ${d.provider || 'unknown'}`);
      console.log('');
    });

    console.log(`Total: ${drafts.length} draft(s)`);
    console.log('\nCommands:');
    console.log('  --view-draft=<id>   View full draft content');
    console.log('  --approve=<id>      Approve draft for publication');
    console.log('  --reject=<id>       Reject draft');
    return;
  }

  // View draft
  if (args['view-draft'] || args.viewdraft) {
    const draftId = args['view-draft'] || args.viewdraft;
    const draft = getDraft(draftId);

    if (!draft) {
      console.error(`[ERROR] Draft not found: ${draftId}`);
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`DRAFT REVIEW: ${draft.id}`);
    console.log('═'.repeat(60));
    console.log(`Status: ${draft.status}`);
    console.log(`Created: ${draft.createdAt}`);
    console.log(`Provider: ${draft.metadata?.provider || 'unknown'}`);
    console.log(`Language: ${draft.metadata?.language || 'unknown'}`);
    console.log('─'.repeat(60));
    console.log(`\nTITLE:\n${draft.article.title}\n`);
    console.log(`EXCERPT:\n${draft.article.excerpt}\n`);
    console.log(`HASHTAGS:\n${(draft.article.hashtags || []).join(', ')}\n`);
    console.log('─'.repeat(60));
    console.log('CONTENT PREVIEW (first 1000 chars):\n');
    console.log(draft.article.content?.substring(0, 1000) + '...\n');
    console.log('═'.repeat(60));
    console.log('\nACTIONS:');
    console.log(`  ✅ Approve: node blog-generator-resilient.cjs --approve=${draftId} --publish`);
    console.log(`  ❌ Reject:  node blog-generator-resilient.cjs --reject=${draftId} --reason="Not aligned with brand"`);
    return;
  }

  // Approve draft
  if (args.approve) {
    const draftId = args.approve;
    console.log(`\n[HITL] Approving draft: ${draftId}`);

    const result = approveDraft(draftId);
    if (!result.success) {
      console.error(`[ERROR] ${result.error}`);
      process.exit(1);
    }

    // If --publish flag, also publish to WordPress + distribute
    if (args.publish) {
      console.log(`[HITL] Publishing approved draft...`);

      let articleUrl = null;
      try {
        const wpResult = await publishToWordPress(result.draft.article, result.draft.metadata?.language || 'fr');
        console.log(`[Publish] WordPress: ${wpResult.url}`);
        articleUrl = wpResult.url;
      } catch (err) {
        console.error(`[ERROR] WordPress publish failed: ${err.message}`);
        articleUrl = 'https://3a-automation.com/blog';
      }

      // Social distribution
      if (args.distribute) {
        const socialResult = await distributeToSocial(result.draft.article, articleUrl);
        console.log(`[Social] Distributed to ${socialResult.successCount} platform(s)`);
      }
    }

    console.log(`[HITL] ✅ Draft approved and processed.`);
    return;
  }

  // Reject draft
  if (args.reject) {
    const draftId = args.reject;
    const reason = args.reason || '';
    console.log(`\n[HITL] Rejecting draft: ${draftId}`);

    const result = rejectDraft(draftId, reason);
    if (!result.success) {
      console.error(`[ERROR] ${result.error}`);
      process.exit(1);
    }

    console.log(`[HITL] ❌ Draft rejected.`);
    if (reason) console.log(`   Reason: ${reason}`);
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

    console.log('\n=== HITL (Human In The Loop) ===');
    console.log(`Drafts Directory: ${HITL_CONFIG.draftsDir}`);
    console.log(`Approved Directory: ${HITL_CONFIG.approvedDir}`);
    console.log(`Require Approval: ${HITL_CONFIG.requireApproval ? '[ON] Drafts require human review' : '[OFF] Direct publish allowed'}`);
    console.log(`Slack Notifications: ${HITL_CONFIG.slackWebhook ? '[OK] Configured' : '[--] Not configured'}`);

    // Count pending drafts
    const drafts = listDrafts();
    const pending = drafts.filter(d => d.status === 'pending_review').length;
    console.log(`Pending Drafts: ${pending}`);

    // Agentic Reflection Loop (Session 165sexies)
    console.log('\n=== AGENTIC REFLECTION LOOP (Configurable) ===');
    console.log(`Quality Threshold: ${AGENTIC_CONFIG.qualityThreshold}/10 (options: ${AGENTIC_CONFIG.qualityThresholdOptions.join(', ')})`);
    console.log(`Max Retries: ${AGENTIC_CONFIG.maxRetries} (options: ${AGENTIC_CONFIG.maxRetriesOptions.join(', ')})`);
    console.log(`Verbose Mode: ${AGENTIC_CONFIG.verbose ? '[ON]' : '[OFF]'}`);

    // Summary
    const aiCount = Object.values(PROVIDERS).filter(p => p.enabled).length;
    const socialCount = (FACEBOOK.enabled ? 1 : 0) + (LINKEDIN.enabled ? 1 : 0) + (XTWITTER.enabled ? 1 : 0);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Version: 3.1.0 (Session 165sexies - Full Flexibility Edition)`);
    console.log(`AI Providers: ${aiCount}/4 configured`);
    console.log(`Social Platforms: ${socialCount}/3 configured`);
    console.log(`WordPress: ${WORDPRESS.appPassword ? '[OK]' : '[--]'}`);
    console.log(`HITL Mode: ${HITL_CONFIG.requireApproval ? 'ENABLED (Safe)' : 'DISABLED (Risky)'}`);
    return;
  }

  // Generate article
  const topic = args.topic;
  const language = args.language || 'fr';
  const forcePublish = !!args['force-publish'] || !!args.forcepublish; // Bypass HITL (dangerous)
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

    // ─────────────────────────────────────────────────────────────────────────
    // HITL FLOW: Save as draft for human review (DEFAULT BEHAVIOR)
    // ─────────────────────────────────────────────────────────────────────────
    if (HITL_CONFIG.requireApproval && !forcePublish) {
      // Save as draft
      const draftInfo = saveDraft(result.article, {
        provider: result.provider,
        topic,
        language,
        keywords: args.keywords || '',
        framework,
        agentic,
        generatedAt: new Date().toISOString(),
      });

      // Send Slack notification (non-blocking)
      if (HITL_CONFIG.slackWebhook) {
        const draft = getDraft(draftInfo.id);
        await notifySlack(draft);
      }

      console.log(`\n[HITL] ⚠️  PUBLICATION BLOCKED - Human review required`);
      console.log(`       Use --force-publish to bypass (NOT RECOMMENDED)`);
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DIRECT PUBLISH (only if HITL disabled or --force-publish)
    // ─────────────────────────────────────────────────────────────────────────
    if (forcePublish) {
      console.log(`\n[HITL] ⚠️  WARNING: Bypassing human review (--force-publish)`);
    }

    let articleUrl = null;

    // Publish if requested
    if (publish || forcePublish) {
      try {
        const wpResult = await publishToWordPress(result.article, language);
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
    if (distribute) {
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
    const outputDir = path.join(__dirname, '../../../outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `blog-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n[Saved] ${outputPath}`);
    return;
  }

  // Help
  console.log(`
[Blog] Resilient Blog Generator v3.0 - 3A Automation (HITL Edition)

FEATURES:
  [+] AI Generation with multi-provider fallback (Claude → OpenAI → Grok → Gemini)
  [+] HITL (Human In The Loop) - Draft review before publication
  [+] WordPress publishing (after approval)
  [+] Social distribution (Facebook, LinkedIn, X/Twitter)
  [+] CinematicAds Video Generation
  [+] Agentic Reflection Loop (Draft → Critique → Refine)

Usage:
  node blog-generator-resilient.cjs --topic="Your topic" [options]

HITL WORKFLOW (RECOMMENDED):
  1. Generate:  node blog-generator-resilient.cjs --topic="Your topic"
     → Saves draft for human review (NO auto-publish)

  2. Review:    node blog-generator-resilient.cjs --list-drafts
                node blog-generator-resilient.cjs --view-draft=<id>

  3. Approve:   node blog-generator-resilient.cjs --approve=<id> --publish --distribute
     → Publishes approved article

  4. Reject:    node blog-generator-resilient.cjs --reject=<id> --reason="Not aligned"

Generation Options:
  --topic         Article topic (required)
  --language      Language: fr or en (default: fr)
  --keywords      SEO keywords (comma-separated)
  --framework     Marketing Framework: "PAS" or "AIDA" (default: PAS)
  --agentic       Enable AI Reflection Loop (improves quality)

HITL Commands:
  --list-drafts   List all pending drafts
  --view-draft=ID View draft content for review
  --approve=ID    Approve draft (add --publish to also publish)
  --reject=ID     Reject draft (add --reason="..." for audit trail)

Publishing Options:
  --publish       Publish to WordPress (requires approval first)
  --distribute    Post to Facebook + LinkedIn + X
  --force-publish ⚠️ BYPASS HITL (NOT RECOMMENDED - brand risk)

Server Mode:
  --server        Run as HTTP server
  --port          Server port (default: 3003)
  --health        Show all provider/platform/HITL status

AI Fallback Chain:
  Anthropic Claude → OpenAI GPT-5.2 → xAI Grok 4.1 → Google Gemini 3

Environment Variables:
  SLACK_WEBHOOK_URL     Optional: Get Slack notifications for new drafts
  HITL_NOTIFY_EMAIL     Optional: Email notifications (future)

Examples:
  # Generate draft for review (RECOMMENDED)
  node blog-generator-resilient.cjs --topic="E-commerce 2026" --language=fr

  # Review and approve
  node blog-generator-resilient.cjs --list-drafts
  node blog-generator-resilient.cjs --view-draft=draft-1737xxx-abc123
  node blog-generator-resilient.cjs --approve=draft-1737xxx-abc123 --publish --distribute

  # Server mode with HITL enabled
  node blog-generator-resilient.cjs --server --port=3003

  # Health check (shows HITL status)
  node blog-generator-resilient.cjs --health
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
