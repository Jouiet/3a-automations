#!/usr/bin/env node
/**
 * Resilient Blog Generator - Multi-Provider Fallback + Social Distribution
 * 3A Automation - Session 115
 *
 * FEATURES:
 *   - AI Generation: Gemini → Grok → Claude (VOLUME task - Session 168terdecies)
 *   - MULTILINGUAL: FR ↔ EN ↔ ES (3 languages, configurable per client)
 *   - 3A Automation: FR + EN (default) | Clients can enable ES
 *   - WordPress Publishing (optional)
 *   - Facebook Page Distribution (optional)
 *   - LinkedIn Distribution (optional)
 *   - X/Twitter Distribution (optional)
 *
 * Usage:
 *   node blog-generator-resilient.cjs --topic="Sujet" --language=fr
 *   node blog-generator-resilient.cjs --topic="Topic" --language=en --publish
 *   node blog-generator-resilient.cjs --topic="Topic" --multilingual    # FR↔EN↔ES
 *   node blog-generator-resilient.cjs --topic="Topic" --translate=en,es # Specific langs
 *   node blog-generator-resilient.cjs --topic="Topic" --publish --distribute
 *   node blog-generator-resilient.cjs --topic="Topic" --agentic
 *   node blog-generator-resilient.cjs --server --port=3003
 *   node blog-generator-resilient.cjs --health
 *
 * Version: 3.1.0 (Multilingual + Agentic)
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

// ─────────────────────────────────────────────────────────────────────────────
// MULTILINGUAL TRANSLATION CONFIG - Session 183bis
// Supported: FR ↔ EN ↔ ES (3 languages only)
// Configurable per client via BLOG_LANGUAGES env (default: fr,en for 3A)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_LANGUAGES = {
  fr: { name: 'French', native: 'Français', urlPrefix: '/blog/' },
  en: { name: 'English', native: 'English', urlPrefix: '/en/blog/' },
  es: { name: 'Spanish', native: 'Español', urlPrefix: '/es/blog/' },
};

// ENV: BLOG_LANGUAGES=fr,en (comma-separated)
// 3A Automation: fr,en (default)
// Other clients can add: fr,en,es
const enabledLangCodes = (process.env.BLOG_LANGUAGES || 'fr,en')
  .split(',')
  .map(l => l.trim().toLowerCase())
  .filter(l => ALL_LANGUAGES[l]); // Only allow valid codes

const TRANSLATION_CONFIG = {
  // All supported languages (FR, EN, ES only)
  allLanguages: ALL_LANGUAGES,
  // ENABLED languages for this client
  languages: Object.fromEntries(
    Object.entries(ALL_LANGUAGES).filter(([code]) => enabledLangCodes.includes(code))
  ),
  // Enabled language codes
  enabledCodes: enabledLangCodes,
  // Default source language (ENV: BLOG_SOURCE_LANGUAGE=fr)
  defaultSource: process.env.BLOG_SOURCE_LANGUAGE || 'fr',
  // Auto-translate to all enabled languages when --multilingual flag is used
  autoTranslateAll: true,
  // Output directory for translated articles
  outputDir: path.join(__dirname, '../../../landing-page-hostinger'),
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
// TOPIC DISCOVERY & RESEARCH ENGINE - Session 183bis
// Sources: Google Trends, News APIs, WebSearch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discover trending topics using AI + web search
 * @param {string} vertical - Business vertical (ecommerce, marketing, ai, automation)
 * @param {string} language - Target language
 */
async function discoverTopics(vertical = 'automation', language = 'fr') {
  // DYNAMIC DATE - Never use hardcoded dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentYear = today.getFullYear();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });

  // Calculate date range (last 30 days for freshness)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  console.log(`[TopicDiscovery] Searching trends for ${vertical} (${language})...`);
  console.log(`[TopicDiscovery] Date range: ${thirtyDaysAgoStr} → ${todayStr}`);

  const searchQueries = {
    automation: `automation trends ${currentMonth} ${currentYear} business`,
    ecommerce: `ecommerce trends ${currentMonth} ${currentYear} shopify`,
    marketing: `marketing automation trends ${currentMonth} ${currentYear}`,
    ai: `AI business automation ${currentMonth} ${currentYear} trends`,
  };

  const query = searchQueries[vertical] || searchQueries.automation;

  // Use Grok for web-grounded research (has web access)
  const researchPrompt = `TODAY'S DATE: ${todayStr}
CRITICAL: Only search for information from the LAST 30 DAYS (${thirtyDaysAgoStr} to ${todayStr}).
Do NOT use information older than 30 days - it's obsolete.

You have access to current web information. Research the LATEST trends in ${vertical}.

Search for: "${query}"
Date filter: ONLY results from ${thirtyDaysAgoStr} to ${todayStr}

Return 5 specific, timely blog topic ideas based on CURRENT trends and news from the last 30 days.
Each topic should be:
1. Specific and actionable (not generic)
2. Based on RECENT events (last 30 days maximum)
3. Relevant for business decision-makers
4. Include the date/timeframe of the source

REJECT any information from before ${thirtyDaysAgoStr}.

Output format: JSON only
{
  "topics": [
    {
      "title": "Specific topic title",
      "angle": "Unique angle or hook",
      "keywords": ["keyword1", "keyword2"],
      "source_hint": "What recent event/data supports this",
      "source_date": "YYYY-MM-DD (must be within last 30 days)"
    }
  ],
  "research_date": "${todayStr}",
  "date_range": {
    "from": "${thirtyDaysAgoStr}",
    "to": "${todayStr}"
  }
}`;

  try {
    const result = await callGrok(researchPrompt);
    const topics = JSON.parse(extractJson(result));
    console.log(`[TopicDiscovery] Found ${topics.topics?.length || 0} topics`);
    return topics;
  } catch (e) {
    console.error(`[TopicDiscovery] Failed: ${e.message}`);
    return { topics: [], error: e.message };
  }
}

/**
 * Research a topic with real sources before writing
 * @param {string} topic - Topic to research
 * @param {string} language - Target language
 */
async function researchTopic(topic, language = 'fr') {
  // DYNAMIC DATE - Critical for freshness
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentYear = today.getFullYear();

  // Data freshness windows
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

  // For statistics, allow up to 12 months
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  console.log(`[Research] Gathering sources for: "${topic}"...`);
  console.log(`[Research] Date: ${todayStr} | Stats window: ${oneYearAgoStr} → ${todayStr}`);

  const researchPrompt = `TODAY'S DATE: ${todayStr}

CRITICAL FRESHNESS REQUIREMENTS:
- News and trends: ONLY from last 90 days (${ninetyDaysAgoStr} to ${todayStr})
- Statistics: ONLY from last 12 months (${oneYearAgoStr} to ${todayStr})
- Case studies: Prefer from ${currentYear} or ${currentYear - 1}
- REJECT all data older than these windows - it's OBSOLETE

You have access to current web information. Research this topic thoroughly:

Topic: "${topic}"

Find and verify (ONLY RECENT DATA):
1. Recent statistics and data from ${oneYearAgoStr} to ${todayStr} (with sources and publication date)
2. Expert opinions or quotes from ${currentYear}
3. Case studies from ${currentYear - 1} or ${currentYear}
4. Current trends from last 90 days
5. Competitor content from this quarter

CRITICAL RULES:
- Only include VERIFIED information with sources
- Do NOT make up statistics or quotes
- ALWAYS include the publication date of each source
- REJECT data older than specified windows
- Mark confidence as LOW (0.3-0.5) if data is older than preferred

Output format: JSON only
{
  "statistics": [
    {"stat": "85% of companies...", "source": "Gartner", "publication_date": "YYYY-MM-DD", "verified": true}
  ],
  "expert_quotes": [
    {"quote": "...", "author": "Name", "title": "CEO of X", "source": "Forbes", "date": "YYYY-MM-DD"}
  ],
  "case_studies": [
    {"company": "Company X", "result": "Achieved Y", "source": "url or publication", "year": ${currentYear}}
  ],
  "trends": [
    {"trend": "Description", "evidence": "Based on...", "observed_date": "YYYY-MM-DD"}
  ],
  "key_points": ["Point 1", "Point 2"],
  "sources_consulted": [
    {"url": "source1.com", "access_date": "${todayStr}", "publication_date": "YYYY-MM-DD"}
  ],
  "research_date": "${todayStr}",
  "data_freshness": {
    "stats_from": "${oneYearAgoStr}",
    "trends_from": "${ninetyDaysAgoStr}"
  },
  "confidence_score": 0.85
}`;

  try {
    const result = await callGrok(researchPrompt);
    const research = JSON.parse(extractJson(result));
    console.log(`[Research] Found ${research.statistics?.length || 0} stats, ${research.case_studies?.length || 0} cases`);
    console.log(`[Research] Confidence: ${(research.confidence_score * 100).toFixed(0)}%`);
    return research;
  } catch (e) {
    console.error(`[Research] Failed: ${e.message}`);
    return { statistics: [], expert_quotes: [], case_studies: [], error: e.message };
  }
}

/**
 * Fact-check generated content
 * @param {Object} article - Generated article
 */
async function factCheckArticle(article) {
  // DYNAMIC DATE for freshness validation
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentYear = today.getFullYear();

  console.log(`[FactCheck] Verifying claims in article (date: ${todayStr})...`);

  const factCheckPrompt = `You are a fact-checker. TODAY'S DATE: ${todayStr}

Analyze this article for accuracy AND FRESHNESS:

Article Title: ${article.title}
Content (first 2000 chars): ${article.content.substring(0, 2000)}

Check for:
1. Statistical claims - Are they accurate, sourced, AND recent (from ${currentYear - 1} or ${currentYear})?
2. Dates and timelines - Are they correct? Flag anything referring to years before ${currentYear - 1} as OUTDATED
3. Company/product claims - Are they verifiable AND current?
4. Expert quotes - Are they attributed correctly AND from recent statements?
5. General factual claims - Are they accurate AND not obsolete?

FRESHNESS RULES:
- Statistics older than 12 months: FLAG as "potentially outdated"
- News/events older than 6 months: FLAG as "stale information"
- Technology claims older than 12 months: FLAG as "may be outdated"
- Any reference to "2023" or earlier without context: FLAG as "requires update"

For each claim found, verify if possible AND check freshness.

Output format: JSON only
{
  "claims_found": 5,
  "verified_claims": 3,
  "unverified_claims": 2,
  "outdated_claims": 1,
  "issues": [
    {"claim": "The claim text", "issue": "Cannot verify source", "severity": "medium", "type": "unverified"},
    {"claim": "In 2023, companies...", "issue": "Outdated reference, needs ${currentYear} data", "severity": "high", "type": "outdated"}
  ],
  "freshness_issues": [
    {"claim": "Statistics from old report", "suggestion": "Find ${currentYear} data"}
  ],
  "suggestions": ["Add source for X", "Update Y with ${currentYear} data"],
  "overall_score": 0.75,
  "freshness_score": 0.80,
  "safe_to_publish": true,
  "needs_update": false,
  "check_date": "${todayStr}"
}`;

  try {
    const result = await callGrok(factCheckPrompt);
    const factCheck = JSON.parse(extractJson(result));
    console.log(`[FactCheck] Score: ${(factCheck.overall_score * 100).toFixed(0)}% | Claims: ${factCheck.verified_claims}/${factCheck.claims_found} verified`);

    if (factCheck.issues?.length > 0) {
      console.log(`[FactCheck] Issues found:`);
      factCheck.issues.forEach(i => console.log(`  - ${i.severity.toUpperCase()}: ${i.claim.substring(0, 50)}...`));
    }

    return factCheck;
  } catch (e) {
    console.error(`[FactCheck] Failed: ${e.message}`);
    return { overall_score: 0.5, safe_to_publish: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TEMPLATE - NOW WITH RESEARCH INJECTION
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(topic, language, keywords = '', framework = 'PAS', research = null) {
  const langMap = { fr: 'French', en: 'English', es: 'Spanish' };
  const lang = langMap[language] || 'English';

  // Build research context if available
  let researchContext = '';
  if (research && !research.error) {
    researchContext = `

VERIFIED RESEARCH DATA (USE THESE - DO NOT INVENT):
${research.statistics?.length > 0 ? `
Statistics:
${research.statistics.map(s => `- ${s.stat} (Source: ${s.source})`).join('\n')}` : ''}
${research.expert_quotes?.length > 0 ? `
Expert Quotes:
${research.expert_quotes.map(q => `- "${q.quote}" - ${q.author}, ${q.title}`).join('\n')}` : ''}
${research.case_studies?.length > 0 ? `
Case Studies:
${research.case_studies.map(c => `- ${c.company}: ${c.result}`).join('\n')}` : ''}
${research.trends?.length > 0 ? `
Current Trends:
${research.trends.map(t => `- ${t.trend}`).join('\n')}` : ''}

CRITICAL: Only use the statistics and quotes provided above. Do NOT invent data.
If you need additional data, clearly mark it as "industry estimate" or "general consensus".
`;
  }

  // Base Context
  const baseContext = `Write a comprehensive blog article about: ${topic}

Language: ${lang}
Target Keywords: ${keywords || topic}
${researchContext}
Requirements:
- 1500-2000 words
- Include H2 and H3 headings with proper HTML tags
- Include actionable tips with concrete examples
- ONLY use statistics from the research data provided above
- Always cite sources for data claims
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
  "category": "automation|ecommerce|ai|marketing",
  "sources_used": ["source1", "source2"]
}`;

  // Inject Psychology Framework (PAS, AIDA, SB7, CIALDINI)
  return MarketingScience.inject(framework || 'PAS', baseContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATION FUNCTIONS - Session 183bis
// Auto-translate articles FR↔EN↔ES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build translation prompt for AI
 * @param {Object} article - Source article {title, excerpt, content, hashtags, category}
 * @param {string} sourceLang - Source language code (fr, en, es)
 * @param {string} targetLang - Target language code (fr, en, es)
 */
function buildTranslationPrompt(article, sourceLang, targetLang) {
  const langNames = { fr: 'French', en: 'English', es: 'Spanish' };
  const srcName = langNames[sourceLang] || sourceLang;
  const tgtName = langNames[targetLang] || targetLang;

  return `You are a professional translator specializing in marketing and technology content.

TASK: Translate the following blog article from ${srcName} to ${tgtName}.

CRITICAL REQUIREMENTS:
1. Preserve ALL HTML tags exactly as they are (<h2>, <h3>, <p>, <ul>, <li>, etc.)
2. Translate naturally - not word-for-word. Adapt idioms and expressions.
3. Keep brand names unchanged: "3A Automation", "Shopify", "Klaviyo", etc.
4. Preserve technical terms that are commonly used in ${tgtName}
5. Maintain the same professional but accessible tone
6. Keep URLs unchanged
7. Translate hashtags to ${tgtName} equivalents

SOURCE ARTICLE (${srcName}):
Title: ${article.title}
Excerpt: ${article.excerpt}
Content: ${article.content}
Hashtags: ${JSON.stringify(article.hashtags)}
Category: ${article.category}

OUTPUT FORMAT: Valid JSON only, no markdown fences:
{
  "title": "Translated title in ${tgtName}",
  "excerpt": "Translated excerpt in ${tgtName}",
  "content": "Translated HTML content in ${tgtName}",
  "hashtags": ["translated", "hashtags", "in", "${targetLang}"],
  "category": "${article.category}"
}`;
}

/**
 * Translate article to target language using AI fallback chain
 * @param {Object} article - Source article
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 */
async function translateArticle(article, sourceLang, targetLang) {
  console.log(`[Translation] ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}...`);

  const prompt = buildTranslationPrompt(article, sourceLang, targetLang);
  const result = await executeGenerationChain(prompt);

  if (result.success) {
    console.log(`[Translation] ✅ ${targetLang.toUpperCase()} complete (via ${result.provider})`);
    return {
      success: true,
      language: targetLang,
      article: result.article,
      provider: result.provider,
    };
  }

  console.error(`[Translation] ❌ ${targetLang.toUpperCase()} failed`);
  return {
    success: false,
    language: targetLang,
    errors: result.errors,
  };
}

/**
 * Generate article in all languages (multilingual mode)
 * @param {string} topic - Article topic
 * @param {string} sourceLang - Source language to generate in
 * @param {string} keywords - SEO keywords
 * @param {boolean} agentic - Enable agentic mode
 * @param {string} framework - Marketing framework
 * @param {Array} targetLanguages - Languages to translate to (default: all)
 */
async function generateMultilingual(topic, sourceLang, keywords, agentic, framework, targetLanguages = null, options = {}) {
  const { enableResearch = false, enableFactCheck = false } = options;

  // Use only ENABLED languages (configured via BLOG_LANGUAGES env)
  const enabledLangs = TRANSLATION_CONFIG.enabledCodes;
  const targets = targetLanguages
    ? targetLanguages.filter(l => enabledLangs.includes(l)) // Filter to enabled only
    : enabledLangs.filter(l => l !== sourceLang);

  // Warn if trying to translate to non-enabled language
  if (targetLanguages) {
    const disabled = targetLanguages.filter(l => !enabledLangs.includes(l));
    if (disabled.length > 0) {
      console.log(`[WARN] Languages not enabled for this client: ${disabled.join(', ')} (set BLOG_LANGUAGES env)`);
    }
  }

  console.log(`\n[Multilingual] Source: ${sourceLang.toUpperCase()}, Targets: ${targets.map(l => l.toUpperCase()).join(', ')}`);
  if (enableResearch) console.log(`[Multilingual] Research: ENABLED`);
  if (enableFactCheck) console.log(`[Multilingual] Fact-Check: ENABLED`);
  console.log('─'.repeat(60));

  // Step 1: Generate source article (research only on source, not translations)
  console.log(`\n[Step 1/2] Generating source article (${sourceLang.toUpperCase()})...`);
  const sourceResult = await generateWithFallback(topic, sourceLang, keywords, agentic, framework, { enableResearch, enableFactCheck });

  if (!sourceResult.success) {
    return {
      success: false,
      source: sourceResult,
      translations: {},
    };
  }

  // Step 2: Translate to all target languages
  console.log(`\n[Step 2/2] Translating to ${targets.length} language(s)...`);
  const translations = {};

  for (const targetLang of targets) {
    const translation = await translateArticle(sourceResult.article, sourceLang, targetLang);
    translations[targetLang] = translation;
  }

  // Summary
  const successCount = Object.values(translations).filter(t => t.success).length;
  console.log(`\n[Multilingual] ✅ Complete: ${successCount + 1}/${targets.length + 1} languages`);

  return {
    success: true,
    source: {
      language: sourceLang,
      article: sourceResult.article,
      provider: sourceResult.provider,
    },
    translations,
    summary: {
      total: targets.length + 1,
      success: successCount + 1,
      failed: targets.length - successCount,
    },
  };
}

/**
 * Generate filename from title (URL-friendly slug)
 */
function slugify(title, lang) {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
  return `${slug}.html`;
}

/**
 * Save translated articles to filesystem
 */
function saveMultilingualArticles(result, topic) {
  const saved = [];
  const outputBase = TRANSLATION_CONFIG.outputDir;

  // Save source
  const sourceLang = result.source.language;
  const sourceSlug = slugify(result.source.article.title, sourceLang);
  const sourcePath = path.join(outputBase, TRANSLATION_CONFIG.languages[sourceLang].urlPrefix, sourceSlug);

  // Note: Actual HTML template generation would go here
  // For now, we save the JSON data
  const jsonDir = path.join(__dirname, '../../../outputs/multilingual');
  if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });

  const timestamp = Date.now();
  const outputPath = path.join(jsonDir, `blog-multilingual-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`\n[Saved] Multilingual data: ${outputPath}`);

  return {
    jsonPath: outputPath,
    articles: {
      [sourceLang]: { slug: sourceSlug, title: result.source.article.title },
      ...Object.fromEntries(
        Object.entries(result.translations)
          .filter(([_, t]) => t.success)
          .map(([lang, t]) => [lang, { slug: slugify(t.article.title, lang), title: t.article.title }])
      ),
    },
  };
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

async function generateWithFallback(topic, language, keywords, agenticMode = false, framework = '', options = {}) {
  const { enableResearch = false, enableFactCheck = false } = options;

  // 0. RESEARCH PHASE (if enabled)
  let research = null;
  if (enableResearch) {
    console.log(`\n[Pipeline] Phase 0: RESEARCH (date-aware)`);
    research = await researchTopic(topic, language);
    if (research.error) {
      console.warn(`[Research] Failed but continuing: ${research.error}`);
    } else {
      console.log(`[Research] Data gathered: ${research.statistics?.length || 0} stats, ${research.case_studies?.length || 0} cases`);
      console.log(`[Research] Freshness: ${research.data_freshness?.stats_from} → ${research.research_date}`);
    }
  }

  // 1. DRAFTING PHASE
  console.log(`\n[Pipeline] Phase 1: DRAFTING`);
  const prompt = buildPrompt(topic, language, keywords, framework, research);
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

  // 3. FACT-CHECK PHASE (if enabled)
  if (enableFactCheck) {
    console.log(`\n[Pipeline] Phase 3: FACT-CHECK (freshness validation)`);
    const factCheck = await factCheckArticle(currentArticle);

    if (!factCheck.safe_to_publish) {
      console.warn(`[FactCheck] ⚠️  Article flagged as unsafe to publish`);
      console.warn(`[FactCheck] Issues: ${factCheck.issues?.length || 0}`);
      console.warn(`[FactCheck] Outdated claims: ${factCheck.outdated_claims || 0}`);
    }

    if (factCheck.needs_update) {
      console.warn(`[FactCheck] ⚠️  Article contains outdated information`);
      factCheck.freshness_issues?.forEach(fi => {
        console.warn(`  - ${fi.claim}: ${fi.suggestion}`);
      });
    }

    return {
      success: true,
      provider: result.provider + " + Agentic Loop + FactCheck",
      article: currentArticle,
      factCheck: factCheck,
      research: research,
      errors: result.errors
    };
  }

  return {
    success: true,
    provider: result.provider + " + Agentic Loop",
    article: currentArticle,
    research: research,
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

    // Multilingual (Session 183bis)
    console.log('\n=== MULTILINGUAL TRANSLATION (FR ↔ EN ↔ ES) ===');
    console.log(`ENABLED: ${Object.entries(TRANSLATION_CONFIG.languages).map(([code, l]) => `${code.toUpperCase()} (${l.native})`).join(', ')}`);
    const notEnabled = Object.keys(ALL_LANGUAGES).filter(c => !TRANSLATION_CONFIG.enabledCodes.includes(c));
    if (notEnabled.length > 0) {
      console.log(`NOT ENABLED: ${notEnabled.map(c => c.toUpperCase()).join(', ')} (add to BLOG_LANGUAGES to enable)`);
    }
    console.log(`Default Source: ${TRANSLATION_CONFIG.defaultSource.toUpperCase()}`);
    console.log(`ENV Config: BLOG_LANGUAGES=${TRANSLATION_CONFIG.enabledCodes.join(',')}`);
    console.log(`Usage: --multilingual (all enabled) or --translate=en (specific)`);

    // Research & Fact-Check (Session 183bis)
    console.log('\n=== RESEARCH & FACT-CHECK (Date-Aware) ===');
    console.log(`Topic Discovery: --discover --vertical=automation (finds fresh topics)`);
    console.log(`Research Mode: --research (gathers verified sources from last 90 days)`);
    console.log(`Fact-Check Mode: --fact-check (validates freshness & accuracy)`);
    console.log(`Full Pipeline: --topic="..." --research --fact-check --agentic`);
    console.log(`Date Filtering: Auto (stats=12mo, trends=90d, news=30d)`);

    // Summary
    const aiCount = Object.values(PROVIDERS).filter(p => p.enabled).length;
    const socialCount = (FACEBOOK.enabled ? 1 : 0) + (LINKEDIN.enabled ? 1 : 0) + (XTWITTER.enabled ? 1 : 0);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Version: 3.2.0 (Session 183bis - Research & Fact-Check Edition)`);
    console.log(`AI Providers: ${aiCount}/4 configured`);
    console.log(`Social Platforms: ${socialCount}/3 configured`);
    console.log(`WordPress: ${WORDPRESS.appPassword ? '[OK]' : '[--]'}`);
    console.log(`HITL Mode: ${HITL_CONFIG.requireApproval ? 'ENABLED (Safe)' : 'DISABLED (Risky)'}`);
    console.log(`Research Pipeline: ENABLED (date-aware)`);
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
  const multilingual = !!args.multilingual; // Generate in all languages (FR↔EN↔ES)
  const translateTo = args.translate ? args.translate.split(',').map(l => l.trim().toLowerCase()) : null;
  const enableResearch = !!args.research; // Enable date-aware research (NEW)
  const enableFactCheck = !!args['fact-check'] || !!args.factcheck; // Enable fact-checking (NEW)
  const discoverMode = !!args.discover; // Topic discovery mode (NEW)

  // ─────────────────────────────────────────────────────────────────────────
  // TOPIC DISCOVERY MODE (NEW - Session 183bis)
  // ─────────────────────────────────────────────────────────────────────────
  if (discoverMode) {
    const vertical = args.vertical || 'automation';
    console.log(`\n[TopicDiscovery] Finding fresh topics for: ${vertical}`);
    console.log(`[TopicDiscovery] Date: ${new Date().toISOString().split('T')[0]}`);
    console.log('─'.repeat(60));

    const topics = await discoverTopics(vertical, language);

    if (topics.error) {
      console.error(`[ERROR] Discovery failed: ${topics.error}`);
      process.exit(1);
    }

    console.log('\n=== DISCOVERED TOPICS (Last 30 days) ===\n');
    topics.topics?.forEach((t, i) => {
      console.log(`${i + 1}. ${t.title}`);
      console.log(`   Angle: ${t.angle}`);
      console.log(`   Keywords: ${t.keywords?.join(', ')}`);
      console.log(`   Source: ${t.source_hint}`);
      if (t.source_date) console.log(`   Date: ${t.source_date}`);
      console.log('');
    });

    console.log(`Research Date: ${topics.research_date}`);
    if (topics.date_range) {
      console.log(`Date Range: ${topics.date_range.from} → ${topics.date_range.to}`);
    }
    console.log('\nUsage: node blog-generator-resilient.cjs --topic="<topic>" --research --fact-check --agentic');
    return;
  }

  // Generate article
  if (topic) {
    console.log(`\n[Blog] Generating article: "${topic}"`);
    console.log(`Source Language: ${language.toUpperCase()}`);
    console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
    if (enableResearch) console.log(`[Mode] RESEARCH ENABLED (date-aware sources)`);
    if (enableFactCheck) console.log(`[Mode] FACT-CHECK ENABLED (freshness validation)`);
    if (multilingual) console.log(`[Mode] MULTILINGUAL (FR↔EN↔ES auto-translation)`);
    else if (translateTo) console.log(`[Mode] TRANSLATE to: ${translateTo.map(l => l.toUpperCase()).join(', ')}`);
    if (framework) console.log(`[Framework] ${framework} (Persuasion Mode Active)`);
    if (agentic) console.log(`[Mode] AGENTIC ENABLED (Reflection Loop Active)`);
    console.log('─'.repeat(60));

    let result;

    // ─────────────────────────────────────────────────────────────────────────
    // MULTILINGUAL MODE: Generate in source + auto-translate to all languages
    // ─────────────────────────────────────────────────────────────────────────
    if (multilingual || translateTo) {
      const targets = translateTo || Object.keys(TRANSLATION_CONFIG.languages).filter(l => l !== language);
      result = await generateMultilingual(topic, language, args.keywords || '', agentic, framework, targets, { enableResearch, enableFactCheck });

      if (result.success) {
        // Save multilingual results
        const saved = saveMultilingualArticles(result, topic);

        console.log('\n' + '═'.repeat(60));
        console.log('MULTILINGUAL GENERATION COMPLETE');
        console.log('═'.repeat(60));
        console.log(`\nSource (${result.source.language.toUpperCase()}): ${result.source.article.title}`);

        for (const [lang, trans] of Object.entries(result.translations)) {
          if (trans.success) {
            console.log(`${lang.toUpperCase()}: ${trans.article.title}`);
          } else {
            console.log(`${lang.toUpperCase()}: ❌ FAILED`);
          }
        }

        console.log(`\nSummary: ${result.summary.success}/${result.summary.total} languages`);
        console.log(`Output: ${saved.jsonPath}`);

        // Convert to standard result format for HITL
        result = {
          success: true,
          provider: result.source.provider + ' (multilingual)',
          article: result.source.article,
          multilingual: result,
          errors: [],
        };
      }
    } else {
      // ─────────────────────────────────────────────────────────────────────────
      // SINGLE LANGUAGE MODE (original behavior)
      // Session 183bis: Added research + fact-check options
      // ─────────────────────────────────────────────────────────────────────────
      result = await generateWithFallback(
        topic,
        language,
        args.keywords || '',
        agentic,
        framework,
        { enableResearch, enableFactCheck }
      );

      // Display research & fact-check results if available
      if (result.research && !result.research.error) {
        console.log(`\n[Research] ${result.research.statistics?.length || 0} stats, ${result.research.case_studies?.length || 0} cases`);
        console.log(`[Research] Confidence: ${((result.research.confidence_score || 0) * 100).toFixed(0)}%`);
      }
      if (result.factCheck) {
        console.log(`\n[FactCheck] Score: ${((result.factCheck.overall_score || 0) * 100).toFixed(0)}%`);
        console.log(`[FactCheck] Freshness: ${((result.factCheck.freshness_score || 0) * 100).toFixed(0)}%`);
        if (!result.factCheck.safe_to_publish) {
          console.warn(`[FactCheck] ⚠️  NOT SAFE TO PUBLISH - Review required`);
        }
        if (result.factCheck.needs_update) {
          console.warn(`[FactCheck] ⚠️  Contains outdated information`);
        }
      }
    }

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
  [+] MULTILINGUAL: Auto-translate FR↔EN↔ES (Session 183bis)
  [+] HITL (Human In The Loop) - Draft review before publication
  [+] WordPress publishing (after approval)
  [+] Social distribution (Facebook, LinkedIn, X/Twitter)
  [+] CinematicAds Video Generation
  [+] Agentic Reflection Loop (Draft → Critique → Refine)

Usage:
  node blog-generator-resilient.cjs --topic="Your topic" [options]

MULTILINGUAL WORKFLOW (Configurable per Client):
  # Generate in French + auto-translate to all ENABLED languages
  # Default for 3A: FR + EN (set via BLOG_LANGUAGES=fr,en)
  node blog-generator-resilient.cjs --topic="E-commerce 2026" --multilingual

  # Generate in English + translate to French
  node blog-generator-resilient.cjs --topic="AI Automation" --language=en --translate=fr

  # Single language (original behavior)
  node blog-generator-resilient.cjs --topic="Your topic" --language=fr

  # Configure languages for other clients (via ENV):
  BLOG_LANGUAGES=fr,en,es node blog-generator-resilient.cjs --topic="Topic" --multilingual

HITL WORKFLOW (RECOMMENDED):
  1. Generate:  node blog-generator-resilient.cjs --topic="Your topic" --multilingual
     → Generates FR + EN + ES, saves draft for human review

  2. Review:    node blog-generator-resilient.cjs --list-drafts
                node blog-generator-resilient.cjs --view-draft=<id>

  3. Approve:   node blog-generator-resilient.cjs --approve=<id> --publish --distribute
     → Publishes approved article

  4. Reject:    node blog-generator-resilient.cjs --reject=<id> --reason="Not aligned"

Generation Options:
  --topic         Article topic (required)
  --language      Source language: fr, en, or es (default: fr)
  --multilingual  Generate in ALL languages (FR↔EN↔ES) automatically
  --translate=X   Translate to specific languages (comma-separated: en,es)
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
