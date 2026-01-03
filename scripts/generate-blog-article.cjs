#!/usr/bin/env node
/**
 * BLOG ARTICLE GENERATOR - 3A Automation
 * Generates SEO-optimized blog articles in FR + EN with full 3A template
 *
 * Usage:
 *   node scripts/generate-blog-article.cjs --topic "Automatisation IA 2026" --category "AI"
 *   node scripts/generate-blog-article.cjs --topic "Voice AI for SME" --category "Voice AI" --lang en
 *
 * Features:
 *   - Claude API for content generation
 *   - Full 3A template (header, footer, Schema.org, GTM/GA4)
 *   - FR + EN bilingual generation
 *   - Auto-update sitemap.xml
 *   - Auto-update blog index pages
 *   - Git commit + push (optional with --deploy)
 *
 * Version: 1.0.0
 * Date: 2025-12-27
 * Author: 3A Automation
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const https = require('https');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // LLM API Keys - Use first available
  xaiApiKey: process.env.XAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  // Models
  xaiModel: 'grok-3',
  claudeModel: 'claude-sonnet-4-20250514',
  // Paths
  baseDir: path.resolve(__dirname, '../landing-page-hostinger'),
  domain: 'https://3a-automation.com',
  author: '3A Automation',
  cacheVersion: '27.0'
};

// Detect which LLM is available
function detectLLM() {
  if (CONFIG.xaiApiKey) return { provider: 'xai', key: CONFIG.xaiApiKey, model: CONFIG.xaiModel };
  if (CONFIG.anthropicApiKey) return { provider: 'anthropic', key: CONFIG.anthropicApiKey, model: CONFIG.claudeModel };
  if (CONFIG.geminiApiKey) return { provider: 'gemini', key: CONFIG.geminiApiKey, model: 'gemini-2.0-flash' };
  return null;
}

const LLM = detectLLM();

// Category colors for badges
const CATEGORY_COLORS = {
  'E-commerce': { bg: 'rgba(79,186,241,0.15)', color: 'var(--primary)' },
  'AI': { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
  'Voice AI': { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
  'Marketing': { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  'Analytics': { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  'Automation': { bg: 'rgba(79,186,241,0.15)', color: 'var(--primary)' },
  'Guide': { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  'Tutorial': { bg: 'rgba(16,185,129,0.15)', color: '#10B981' }
};

// ═══════════════════════════════════════════════════════════════════════════
// LLM API (Supports xAI/Grok, Anthropic/Claude, Google/Gemini)
// ═══════════════════════════════════════════════════════════════════════════

async function callLLM(prompt, maxTokens = 8000) {
  if (!LLM) {
    throw new Error('No LLM API key found. Set XAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in .env');
  }

  return new Promise((resolve, reject) => {
    let options, data;

    if (LLM.provider === 'xai') {
      // xAI Grok API (OpenAI-compatible)
      data = JSON.stringify({
        model: LLM.model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      });
      options = {
        hostname: 'api.x.ai',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM.key}`
        }
      };
    } else if (LLM.provider === 'anthropic') {
      // Anthropic Claude API
      data = JSON.stringify({
        model: LLM.model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      });
      options = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': LLM.key,
          'anthropic-version': '2024-01-01'
        }
      };
    } else if (LLM.provider === 'gemini') {
      // Google Gemini API
      data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens }
      });
      options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/${LLM.model}:generateContent?key=${LLM.key}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          // Handle errors
          if (response.error) {
            reject(new Error(response.error.message || JSON.stringify(response.error)));
            return;
          }

          // Extract text based on provider
          let text;
          if (LLM.provider === 'xai') {
            text = response.choices?.[0]?.message?.content;
          } else if (LLM.provider === 'anthropic') {
            text = response.content?.[0]?.text;
          } else if (LLM.provider === 'gemini') {
            text = response.candidates?.[0]?.content?.parts?.[0]?.text;
          }

          if (!text) {
            reject(new Error(`Empty response from ${LLM.provider}: ${body.substring(0, 500)}`));
            return;
          }

          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse ${LLM.provider} response: ${e.message}\nBody: ${body.substring(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateArticleContent(topic, category, language) {
  const langConfig = {
    fr: {
      instructions: 'Ecris en francais. Pas d\'accents dans le HTML (utilise "e" au lieu de "é").',
      readTime: 'min de lecture',
      by: 'Par',
      backToBlog: 'Retour au blog',
      cta: {
        title: 'Pret a automatiser?',
        text: 'Demandez un audit gratuit. Rapport PDF avec 3 quick wins en 24-48h.',
        button: 'Demander l\'audit gratuit'
      }
    },
    en: {
      instructions: 'Write in English.',
      readTime: 'min read',
      by: 'By',
      backToBlog: 'Back to blog',
      cta: {
        title: 'Ready to automate?',
        text: 'Request a free audit. PDF report with 3 quick wins in 24-48h.',
        button: 'Request free audit'
      }
    }
  };

  const config = langConfig[language];

  const prompt = `You are an expert content writer for 3A Automation, a consulting agency specializing in e-commerce and marketing automation.

Write a comprehensive, SEO-optimized blog article about: "${topic}"

${config.instructions}

Category: ${category}
Target audience: SME owners and marketing managers

Requirements:
1. TITLE: Compelling, includes main keyword, max 60 characters
2. META_DESCRIPTION: 150-160 characters, actionable, includes keyword
3. EXCERPT: 120 characters for social media sharing
4. INTRO: Hook paragraph that states the problem and hints at the solution
5. CONTENT:
   - 1500-2000 words
   - Use H2 for main sections (3-5 sections)
   - Use H3 for subsections
   - Include bullet points and numbered lists
   - Include at least one data point or statistic (cite source)
   - Include one info box (highlighted tip or fact)
   - Include practical, actionable advice
   - End with a clear conclusion
6. KEYWORDS: 5 relevant SEO keywords
7. HASHTAGS: 5 social media hashtags
8. READ_TIME: Estimated reading time in minutes (number only)

Output ONLY valid JSON in this exact format:
{
  "title": "Article title",
  "meta_description": "SEO meta description 150-160 chars",
  "excerpt": "120 char excerpt for social",
  "intro": "Opening paragraph HTML",
  "content": "Full article content in HTML (use inline styles matching dark theme: color:var(--text-light), headings with color:var(--text-light) or var(--primary))",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "read_time": 8
}

IMPORTANT:
- Output ONLY the JSON, no markdown, no code blocks, no explanations
- Use proper HTML with inline styles for dark theme (background: var(--secondary), text: var(--text-light))
- For H2 use: style="font-size:1.75rem;margin:2.5rem 0 1rem;color:var(--text-light)"
- For H3 use: style="font-size:1.3rem;margin:2rem 0 1rem;color:var(--primary)"
- For lists use: style="margin:1.5rem 0;padding-left:1.5rem"
- For info box use: style="background:rgba(79,186,241,0.1);border-left:4px solid var(--primary);padding:1.5rem;border-radius:0 12px 12px 0;margin:2rem 0"`;

  console.log(`  Calling ${LLM.provider.toUpperCase()} API (${LLM.model}) for ${language.toUpperCase()} content...`);
  const response = await callLLM(prompt);

  // Parse JSON from response
  try {
    // Clean response - remove any markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleanResponse);
  } catch (e) {
    console.error('Failed to parse article JSON:', e.message);
    console.error('Response:', response.substring(0, 500));
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SLUG GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

function generateHTML(article, slug, category, language, altSlug) {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();

  const langConfig = {
    fr: {
      locale: 'fr_FR',
      home: 'Accueil',
      automations: 'Automatisations',
      pricing: 'Tarifs',
      blog: 'Blog',
      contact: 'Contact',
      langSwitch: 'EN',
      langSwitchTitle: 'English',
      backToBlog: 'Retour au blog',
      by: 'Par',
      readTime: 'min de lecture',
      ctaTitle: 'Pret a automatiser?',
      ctaText: 'Demandez un audit gratuit de vos automatisations actuelles. Rapport PDF avec 3 quick wins en 24-48h.',
      ctaButton: 'Demander l\'audit gratuit',
      footerText: 'Automation, Analytics & AI pour PME et E-commerce. 89 automatisations.',
      rights: 'Tous droits reserves.',
      basePath: '',
      blogPath: '/blog/',
      altBlogPath: '/en/blog/',
      contactPath: '/contact.html'
    },
    en: {
      locale: 'en_US',
      home: 'Home',
      automations: 'Automations',
      pricing: 'Pricing',
      blog: 'Blog',
      contact: 'Contact',
      langSwitch: 'FR',
      langSwitchTitle: 'Francais',
      backToBlog: 'Back to blog',
      by: 'By',
      readTime: 'min read',
      ctaTitle: 'Ready to automate?',
      ctaText: 'Request a free automation audit. PDF report with 3 quick wins in 24-48h.',
      ctaButton: 'Request free audit',
      footerText: 'Automation, Analytics & AI for SMEs and E-commerce. 89 automations.',
      rights: 'All rights reserved.',
      basePath: '/en',
      blogPath: '/en/blog/',
      altBlogPath: '/blog/',
      contactPath: '/en/contact.html'
    }
  };

  const cfg = langConfig[language];
  const altLang = language === 'fr' ? 'en' : 'fr';
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['Guide'];

  const frUrl = language === 'fr'
    ? `${CONFIG.domain}/blog/${slug}.html`
    : `${CONFIG.domain}/blog/${altSlug}.html`;
  const enUrl = language === 'en'
    ? `${CONFIG.domain}/en/blog/${slug}.html`
    : `${CONFIG.domain}/en/blog/${altSlug}.html`;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${article.meta_description}">
  <meta name="author" content="${CONFIG.author}">
  <meta name="robots" content="index, follow">
  <meta name="keywords" content="${article.keywords.join(', ')}">
  <title>${article.title} | ${CONFIG.author}</title>

  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="canonical" href="${CONFIG.domain}${cfg.blogPath}${slug}.html">
  <link rel="alternate" hreflang="fr" href="${frUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="x-default" href="${frUrl}">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${CONFIG.domain}${cfg.blogPath}${slug}.html">
  <meta property="og:title" content="${article.title}">
  <meta property="og:description" content="${article.meta_description}">
  <meta property="og:image" content="${CONFIG.domain}/og-image.webp">
  <meta property="og:locale" content="${cfg.locale}">
  <meta property="article:published_time" content="${today}">
  <meta property="article:author" content="${CONFIG.author}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${article.title}">
  <meta name="twitter:description" content="${article.meta_description}">
  <meta name="twitter:image" content="${CONFIG.domain}/og-image.webp">

  <!-- Critical CSS -->
  <style>*,::after,::before{box-sizing:border-box;margin:0;padding:0}:root{--primary:#4FBAF1;--primary-dark:#2B6685;--secondary:#191E35;--text-light:#E4F4FC;--text-secondary:#8BA3B9;--font-sans:'Inter',-apple-system,BlinkMacSystemFont,sans-serif}html{scroll-behavior:smooth}body{font-family:var(--font-sans);font-size:16px;line-height:1.6;color:var(--text-light);background:var(--secondary);-webkit-font-smoothing:antialiased}.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}.header{position:fixed;top:0;left:0;width:100%;z-index:1000;padding:1rem 0;background:rgba(25,30,53,.95);backdrop-filter:blur(10px)}.header-inner{display:flex;justify-content:space-between;align-items:center}.logo-link{display:flex;align-items:center;gap:.75rem;text-decoration:none}.logo-icon{width:40px;height:40px}.logo-icon img{width:100%;height:100%;object-fit:contain}.logo-text{font-weight:700;font-size:1.25rem;color:var(--primary)}.nav-links{display:flex;gap:2rem;list-style:none}.nav-links a{color:var(--text-light);text-decoration:none;font-size:.95rem}@media(max-width:768px){.nav{display:none}}</style>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"></noscript>
  <link rel="preload" href="/styles.min.css?v=${CONFIG.cacheVersion}" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/styles.min.css?v=${CONFIG.cacheVersion}"></noscript>

  <!-- Schema.org Article -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${article.title}",
    "description": "${article.meta_description}",
    "image": "${CONFIG.domain}/og-image.webp",
    "datePublished": "${today}",
    "dateModified": "${today}",
    "author": {
      "@type": "Organization",
      "name": "${CONFIG.author}",
      "url": "${CONFIG.domain}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${CONFIG.author}",
      "logo": {"@type": "ImageObject", "url": "${CONFIG.domain}/logo.webp"}
    },
    "mainEntityOfPage": {"@type": "WebPage", "@id": "${CONFIG.domain}${cfg.blogPath}${slug}.html"}
  }
  </script>

  <!-- GTM + GA4 -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    (function() {
      var loaded = false;
      function loadAnalytics() {
        if (loaded) return;
        loaded = true;
        var gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WLVJQC3M';
        document.head.appendChild(gtmScript);
        window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
        var ga4Script = document.createElement('script');
        ga4Script.async = true;
        ga4Script.src = 'https://www.googletagmanager.com/gtag/js?id=G-87F6FDJG45';
        ga4Script.onload = function() {
          gtag('js', new Date());
          gtag('config', 'G-87F6FDJG45', {'anonymize_ip': true});
        };
        document.head.appendChild(ga4Script);
      }
      setTimeout(loadAnalytics, 3000);
      ['mousemove','scroll','keydown','click','touchstart'].forEach(function(e){
        document.addEventListener(e, loadAnalytics, {once:true,passive:true});
      });
    })();
  </script>
</head>
<body>
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WLVJQC3M" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

  <!-- Header -->
  <header class="header">
    <div class="container">
      <div class="header-inner">
        <a href="${cfg.basePath}/" class="logo-link">
          <div class="logo-icon"><img src="/logo.webp" alt="3A" width="40" height="40"></div>
          <span class="logo-text">3A Automation</span>
        </a>
        <nav class="nav" id="nav-menu">
          <ul class="nav-links">
            <li><a href="${cfg.basePath}/">${cfg.home}</a></li>
            <li><a href="${cfg.basePath}/automations.html">${cfg.automations}</a></li>
            <li><a href="${cfg.basePath}/pricing.html">${cfg.pricing}</a></li>
            <li><a href="${cfg.blogPath}" class="active">${cfg.blog}</a></li>
            <li><a href="${cfg.contactPath}">${cfg.contact}</a></li>
            <li><a href="${cfg.altBlogPath}${altSlug}.html" class="lang-switch" title="${cfg.langSwitchTitle}">${cfg.langSwitch}</a></li>
          </ul>
        </nav>
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Article -->
  <article style="padding-top:100px;padding-bottom:4rem">
    <div class="container" style="max-width:800px">

      <!-- Breadcrumb -->
      <nav style="margin-bottom:2rem;font-size:0.9rem">
        <a href="${cfg.basePath}/" style="color:var(--text-secondary);text-decoration:none">${cfg.home}</a>
        <span style="color:var(--text-secondary);margin:0 0.5rem">/</span>
        <a href="${cfg.blogPath}" style="color:var(--text-secondary);text-decoration:none">${cfg.blog}</a>
        <span style="color:var(--text-secondary);margin:0 0.5rem">/</span>
        <span style="color:var(--primary)">${article.title.substring(0, 40)}${article.title.length > 40 ? '...' : ''}</span>
      </nav>

      <!-- Header -->
      <header style="margin-bottom:3rem">
        <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
          <span style="background:${categoryColor.bg};color:${categoryColor.color};padding:0.25rem 0.75rem;border-radius:20px;font-size:0.8rem">${category}</span>
          <span style="background:rgba(16,185,129,0.15);color:#10B981;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.8rem">Guide</span>
        </div>
        <h1 style="font-size:clamp(2rem,4vw,2.75rem);line-height:1.2;margin-bottom:1rem">${article.title}</h1>
        <p style="color:var(--text-secondary);font-size:1.1rem;margin-bottom:1.5rem">${article.excerpt}</p>
        <div style="display:flex;align-items:center;gap:1rem;color:var(--text-secondary);font-size:0.9rem;flex-wrap:wrap">
          <span>${cfg.by} ${CONFIG.author}</span>
          <span style="width:4px;height:4px;background:var(--text-secondary);border-radius:50%"></span>
          <time datetime="${today}">${new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          <span style="width:4px;height:4px;background:var(--text-secondary);border-radius:50%"></span>
          <span>${article.read_time} ${cfg.readTime}</span>
        </div>
      </header>

      <!-- Content -->
      <div class="article-content" style="font-size:1.05rem;line-height:1.8">

        <p style="font-size:1.2rem;color:var(--text-light);margin-bottom:2rem">${article.intro}</p>

        ${article.content}

        <!-- CTA Box -->
        <div style="background:linear-gradient(135deg,rgba(79,186,241,0.15) 0%,rgba(16,185,129,0.1) 100%);border:1px solid rgba(79,186,241,0.3);padding:2rem;border-radius:16px;margin:2.5rem 0;text-align:center">
          <h3 style="font-size:1.4rem;margin-bottom:0.75rem">${cfg.ctaTitle}</h3>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem">${cfg.ctaText}</p>
          <a href="${cfg.contactPath}" class="btn-primary-cyber" style="display:inline-flex;align-items:center;gap:0.5rem;padding:1rem 2rem;background:linear-gradient(135deg,var(--primary) 0%,var(--primary-dark) 100%);color:#fff;font-weight:600;border-radius:0.75rem;text-decoration:none">${cfg.ctaButton}</a>
        </div>

      </div>

      <!-- Author -->
      <div style="margin-top:3rem;padding:2rem;background:rgba(255,255,255,0.03);border-radius:16px;border:1px solid rgba(255,255,255,0.1);display:flex;gap:1.5rem;align-items:center">
        <div style="width:80px;height:80px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;flex-shrink:0">3A</div>
        <div>
          <h4 style="margin-bottom:0.25rem">${CONFIG.author}</h4>
          <p style="color:var(--text-secondary);font-size:0.95rem;margin:0">${cfg.footerText}</p>
        </div>
      </div>

      <!-- Navigation -->
      <div style="margin-top:2rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,0.1);text-align:center">
        <a href="${cfg.blogPath}" style="color:var(--primary);text-decoration:none;font-weight:600">&larr; ${cfg.backToBlog}</a>
      </div>

    </div>
  </article>

  <!-- Footer -->
  <footer class="footer" style="background:rgba(0,0,0,0.3);padding:3rem 0;border-top:1px solid rgba(255,255,255,0.1)">
    <div class="container">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:2rem">
        <div>
          <a href="${cfg.basePath}/" class="logo-link" style="margin-bottom:1rem;display:inline-flex">
            <div class="logo-icon"><img src="/logo.webp" alt="3A" width="32" height="32"></div>
            <span class="logo-text">3A Automation</span>
          </a>
          <p style="color:var(--text-secondary);font-size:0.9rem;max-width:300px">${cfg.footerText}</p>
        </div>
        <div>
          <h4 style="margin-bottom:1rem;font-size:0.95rem">Contact</h4>
          <p style="color:var(--text-secondary);font-size:0.9rem">contact@3a-automation.com</p>
        </div>
      </div>
      <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1);text-align:center">
        <p style="color:var(--text-secondary);font-size:0.85rem">&copy; ${year} ${CONFIG.author}. ${cfg.rights}</p>
      </div>
    </div>
  </footer>

  <script src="/script.min.js?v=10.0" defer></script>
  <script>
  (function(){
    var loaded = false;
    function loadVoiceWidget() {
      if (loaded) return;
      loaded = true;
      var s = document.createElement('script');
      s.src = '/voice-assistant/voice-widget${language === 'en' ? '-en' : ''}.min.js?v=20.1';
      s.defer = true;
      document.body.appendChild(s);
    }
    setTimeout(loadVoiceWidget, 10000);
    ['scroll','click','touchstart','keydown'].forEach(function(e) {
      window.addEventListener(e, loadVoiceWidget, {once:true, passive:true});
    });
  })();
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SITEMAP UPDATE
// ═══════════════════════════════════════════════════════════════════════════

function updateSitemap(slugFR, slugEN) {
  const sitemapPath = path.join(CONFIG.baseDir, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];

  // Check if URLs already exist (check <loc> specifically to avoid false positives from hreflang)
  if (sitemap.includes(`<loc>${CONFIG.domain}/blog/${slugFR}.html</loc>`)) {
    console.log('  Sitemap: FR article already exists, skipping');
  } else {
    // Add FR blog entry before </urlset>
    const frEntry = `
  <!-- Blog Article FR: ${slugFR} -->
  <url>
    <loc>${CONFIG.domain}/blog/${slugFR}.html</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${CONFIG.domain}/blog/${slugFR}.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="${CONFIG.domain}/en/blog/${slugEN}.html"/>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    sitemap = sitemap.replace('</urlset>', frEntry + '</urlset>');
    console.log('  Sitemap: Added FR article');
  }

  if (sitemap.includes(`<loc>${CONFIG.domain}/en/blog/${slugEN}.html</loc>`)) {
    console.log('  Sitemap: EN article already exists, skipping');
  } else {
    // Add EN blog entry
    const enEntry = `
  <!-- Blog Article EN: ${slugEN} -->
  <url>
    <loc>${CONFIG.domain}/en/blog/${slugEN}.html</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${CONFIG.domain}/blog/${slugFR}.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="${CONFIG.domain}/en/blog/${slugEN}.html"/>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    sitemap = sitemap.replace('</urlset>', enEntry + '</urlset>');
    console.log('  Sitemap: Added EN article');
  }

  fs.writeFileSync(sitemapPath, sitemap);
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOG INDEX UPDATE
// ═══════════════════════════════════════════════════════════════════════════

function updateBlogIndex(article, slug, category, language) {
  const indexPath = language === 'fr'
    ? path.join(CONFIG.baseDir, 'blog/index.html')
    : path.join(CONFIG.baseDir, 'en/blog/index.html');

  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['Guide'];

  // Check if article already exists
  if (indexHtml.includes(`${slug}.html`)) {
    console.log(`  Blog Index (${language.toUpperCase()}): Article already exists, skipping`);
    return;
  }

  // Create article card
  const articleCard = `
        <!-- Article: ${article.title} -->
        <article class="blog-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(79,186,241,0.3);border-radius:16px;overflow:hidden;transition:transform 0.3s,box-shadow 0.3s">
          <div style="padding:2rem">
            <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
              <span style="background:${categoryColor.bg};color:${categoryColor.color};padding:0.25rem 0.75rem;border-radius:20px;font-size:0.8rem">${category}</span>
              <span style="background:rgba(16,185,129,0.15);color:#10B981;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.8rem">${language === 'fr' ? 'Nouveau' : 'New'}</span>
            </div>
            <h2 style="font-size:1.25rem;margin-bottom:0.75rem;line-height:1.3">
              <a href="${slug}.html" style="color:var(--text-light);text-decoration:none">${article.title}</a>
            </h2>
            <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:1rem;line-height:1.5">${article.excerpt}</p>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <time datetime="${today}" style="color:var(--text-secondary);font-size:0.85rem">${today}</time>
              <a href="${slug}.html" style="color:var(--primary);font-weight:600;text-decoration:none;font-size:0.9rem">${language === 'fr' ? 'Lire' : 'Read'} &rarr;</a>
            </div>
          </div>
        </article>
`;

  // Insert after blog-grid opening
  const insertPoint = '<div class="blog-grid"';
  const insertAfter = indexHtml.indexOf('>', indexHtml.indexOf(insertPoint)) + 1;

  indexHtml = indexHtml.slice(0, insertAfter) + '\n' + articleCard + indexHtml.slice(insertAfter);

  // Update Schema.org blogPost array
  const schemaInsertPoint = '"blogPost": [';
  const schemaInsertAfter = indexHtml.indexOf(schemaInsertPoint) + schemaInsertPoint.length;

  const newSchemaEntry = `
      {
        "@type": "BlogPosting",
        "headline": "${article.title}",
        "url": "${CONFIG.domain}${language === 'fr' ? '/blog/' : '/en/blog/'}${slug}.html",
        "datePublished": "${today}",
        "author": {"@type": "Person", "name": "${CONFIG.author}"}
      },`;

  indexHtml = indexHtml.slice(0, schemaInsertAfter) + newSchemaEntry + indexHtml.slice(schemaInsertAfter);

  fs.writeFileSync(indexPath, indexHtml);
  console.log(`  Blog Index (${language.toUpperCase()}): Added article card`);
}

// ═══════════════════════════════════════════════════════════════════════════
// GIT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

function gitCommitAndPush(slugFR, slugEN) {
  const { execSync } = require('child_process');
  const rootDir = path.resolve(__dirname, '..');

  try {
    // Add all changes
    execSync('git add -A', { cwd: rootDir, stdio: 'pipe' });

    // Commit
    const commitMsg = `feat(blog): Add article ${slugFR} (FR+EN)

- Generated with Claude API
- FR: /blog/${slugFR}.html
- EN: /en/blog/${slugEN}.html
- Updated sitemap.xml
- Updated blog index pages

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`;

    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
      cwd: rootDir,
      stdio: 'pipe'
    });

    // Push
    execSync('git push origin main', { cwd: rootDir, stdio: 'pipe' });

    console.log('  Git: Committed and pushed to origin/main');
    return true;
  } catch (error) {
    console.error('  Git: Failed to commit/push:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  let topic = null;
  let category = 'Automation';
  let deploy = false;
  let frOnly = false;
  let enOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) {
      topic = args[++i];
    } else if (args[i] === '--category' && args[i + 1]) {
      category = args[++i];
    } else if (args[i] === '--deploy') {
      deploy = true;
    } else if (args[i] === '--fr-only') {
      frOnly = true;
    } else if (args[i] === '--en-only') {
      enOnly = true;
    } else if (args[i] === '--help') {
      console.log(`
Blog Article Generator - 3A Automation

Usage:
  node scripts/generate-blog-article.cjs --topic "Your Topic" [options]

Options:
  --topic <string>     Article topic (required)
  --category <string>  Category: E-commerce, AI, Voice AI, Marketing, Analytics, Automation (default: Automation)
  --deploy             Commit and push to git after generation
  --fr-only            Generate French version only
  --en-only            Generate English version only
  --help               Show this help

Examples:
  node scripts/generate-blog-article.cjs --topic "Automatisation IA pour PME 2026" --category "AI"
  node scripts/generate-blog-article.cjs --topic "Email Marketing Best Practices" --category "Marketing" --deploy
`);
      process.exit(0);
    }
  }

  // Validation
  if (!topic) {
    console.error('❌ Error: --topic is required');
    console.log('   Usage: node scripts/generate-blog-article.cjs --topic "Your Topic"');
    process.exit(1);
  }

  if (!LLM) {
    console.error('❌ Error: No LLM API key found');
    console.error('   Set XAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in .env');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  BLOG ARTICLE GENERATOR - 3A Automation');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`LLM: ${LLM.provider.toUpperCase()} (${LLM.model})`);
  console.log(`Topic: ${topic}`);
  console.log(`Category: ${category}`);
  console.log(`Deploy: ${deploy ? 'Yes' : 'No'}`);
  console.log('');

  try {
    let articleFR, articleEN, slugFR, slugEN;

    // Generate French article
    if (!enOnly) {
      console.log('📝 Generating French article...');
      articleFR = await generateArticleContent(topic, category, 'fr');
      slugFR = generateSlug(articleFR.title);
      console.log(`  Title: ${articleFR.title}`);
      console.log(`  Slug: ${slugFR}`);
      console.log(`  Read time: ${articleFR.read_time} min`);

      // Save FR HTML
      const frHtml = generateHTML(articleFR, slugFR, category, 'fr', slugFR); // altSlug will be updated after EN generation
      const frPath = path.join(CONFIG.baseDir, 'blog', `${slugFR}.html`);
      fs.writeFileSync(frPath, frHtml);
      console.log(`  Saved: ${frPath}`);
    }

    // Generate English article
    if (!frOnly) {
      console.log('\n📝 Generating English article...');
      articleEN = await generateArticleContent(topic, category, 'en');
      slugEN = generateSlug(articleEN.title);
      console.log(`  Title: ${articleEN.title}`);
      console.log(`  Slug: ${slugEN}`);
      console.log(`  Read time: ${articleEN.read_time} min`);

      // Save EN HTML
      const enHtml = generateHTML(articleEN, slugEN, category, 'en', slugFR || slugEN);
      const enPath = path.join(CONFIG.baseDir, 'en/blog', `${slugEN}.html`);
      fs.writeFileSync(enPath, enHtml);
      console.log(`  Saved: ${enPath}`);
    }

    // If we have both, update FR with correct EN slug
    if (!enOnly && !frOnly) {
      const frHtml = generateHTML(articleFR, slugFR, category, 'fr', slugEN);
      const frPath = path.join(CONFIG.baseDir, 'blog', `${slugFR}.html`);
      fs.writeFileSync(frPath, frHtml);
    }

    // Update sitemap
    if (!frOnly && !enOnly) {
      console.log('\n📋 Updating sitemap.xml...');
      updateSitemap(slugFR, slugEN);
    }

    // Update blog indexes
    if (!enOnly && articleFR) {
      console.log('\n📋 Updating blog index (FR)...');
      updateBlogIndex(articleFR, slugFR, category, 'fr');
    }
    if (!frOnly && articleEN) {
      console.log('\n📋 Updating blog index (EN)...');
      updateBlogIndex(articleEN, slugEN, category, 'en');
    }

    // Git deploy
    if (deploy) {
      console.log('\n🚀 Deploying to GitHub...');
      gitCommitAndPush(slugFR || slugEN, slugEN || slugFR);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ ARTICLE GENERATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    if (!enOnly) console.log(`  FR: ${CONFIG.domain}/blog/${slugFR}.html`);
    if (!frOnly) console.log(`  EN: ${CONFIG.domain}/en/blog/${slugEN}.html`);
    if (!deploy) {
      console.log('\n  To deploy, run: git add -A && git commit -m "feat(blog): Add article" && git push');
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
