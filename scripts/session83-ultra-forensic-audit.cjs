#!/usr/bin/env node
/**
 * SESSION 83 - ULTRA FORENSIC FRONTEND AUDIT
 * Comprehensive analysis of ALL frontend aspects
 * Date: 2025-12-23
 * Categories: 20+ audit categories
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');
const REGISTRY_PATH = path.join(__dirname, '../automations/automations-registry.json');

// Load registry for source of truth
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
const CORRECT_AUTOMATION_COUNT = registry.totalCount; // 77

// Results storage
const issues = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: []
};

// Stats
const stats = {
  pagesScanned: 0,
  totalIssues: 0,
  automationCountMismatches: 0,
  metaIssues: 0,
  schemaIssues: 0,
  hreflangIssues: 0,
  aeoIssues: 0,
  copyIssues: 0,
  ctaIssues: 0,
  imageIssues: 0,
  duplicateScripts: 0,
  brokenLinks: 0,
  accessibilityIssues: 0
};

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function getAllHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function addIssue(severity, category, file, description, fix) {
  const relativePath = file.replace(SITE_DIR, '');
  issues[severity].push({
    category,
    file: relativePath,
    description,
    fix
  });
  stats.totalIssues++;
}

function extractMetaContent(html, name) {
  // Use double-quote pattern (handles French apostrophes like l'accueil)
  const regex = new RegExp(`<meta\\s+(?:name|property)=["']${name}["']\\s+content="([^"]*)"`, 'i');
  const match = html.match(regex);
  if (match) return match[1];

  // Try single quotes
  const regexSingle = new RegExp(`<meta\\s+(?:name|property)=["']${name}["']\\s+content='([^']*)'`, 'i');
  const matchSingle = html.match(regexSingle);
  if (matchSingle) return matchSingle[1];

  // Try alternate order
  const regex2 = new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+(?:name|property)=["']${name}["']`, 'i');
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1] : null;
}

function extractNumbers(text) {
  return text.match(/\d+/g) || [];
}

// ========================================================================
// AUDIT CATEGORY 1: AUTOMATION COUNT CONSISTENCY
// ========================================================================

function auditAutomationCount(html, file) {
  const automationPatterns = [
    /(\d+)\s*(?:automatisations?|automations?|workflows?)/gi,
    /data-count=["'](\d+)["']/gi,
    /<span[^>]*>(\d+)<\/span>\s*<[^>]*>\s*(?:Automatisations?|Automations?)/gi
  ];

  for (const pattern of automationPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const count = parseInt(match[1]);
      if (count > 50 && count < 200 && count !== CORRECT_AUTOMATION_COUNT) {
        addIssue('critical', 'AUTOMATION_COUNT', file,
          `Incorrect automation count: ${count} (should be ${CORRECT_AUTOMATION_COUNT})`,
          `Replace ${count} with ${CORRECT_AUTOMATION_COUNT}`
        );
        stats.automationCountMismatches++;
      }
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 2: META DESCRIPTIONS
// ========================================================================

function auditMetaDescriptions(html, file) {
  const desc = extractMetaContent(html, 'description');

  if (!desc) {
    addIssue('high', 'META_DESCRIPTION', file, 'Missing meta description', 'Add meta description');
    stats.metaIssues++;
    return;
  }

  if (desc.length < 120) {
    addIssue('medium', 'META_DESCRIPTION', file,
      `Meta description too short: ${desc.length} chars (should be 120-160)`,
      'Expand description to 120-160 characters'
    );
    stats.metaIssues++;
  } else if (desc.length > 160) {
    addIssue('low', 'META_DESCRIPTION', file,
      `Meta description too long: ${desc.length} chars (should be 120-160)`,
      'Trim description to 120-160 characters'
    );
    stats.metaIssues++;
  }

  // Check for incorrect automation count in meta
  const numbers = extractNumbers(desc);
  for (const num of numbers) {
    const n = parseInt(num);
    if (n > 50 && n < 200 && n !== CORRECT_AUTOMATION_COUNT) {
      addIssue('critical', 'META_DESCRIPTION', file,
        `Incorrect count in meta description: ${n} (should be ${CORRECT_AUTOMATION_COUNT})`,
        `Update meta description to use ${CORRECT_AUTOMATION_COUNT}`
      );
      stats.automationCountMismatches++;
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 3: TITLE TAGS
// ========================================================================

function auditTitleTags(html, file) {
  const title = extractTitle(html);

  if (!title) {
    addIssue('critical', 'TITLE_TAG', file, 'Missing title tag', 'Add title tag');
    stats.metaIssues++;
    return;
  }

  if (title.length < 30) {
    addIssue('medium', 'TITLE_TAG', file,
      `Title too short: ${title.length} chars (should be 30-65)`,
      'Expand title to 30-65 characters'
    );
    stats.metaIssues++;
  } else if (title.length > 65) {
    addIssue('low', 'TITLE_TAG', file,
      `Title too long: ${title.length} chars (may be truncated in SERPs)`,
      'Consider trimming title to 60-65 characters'
    );
    stats.metaIssues++;
  }

  // Check for incorrect automation count in title
  const numbers = extractNumbers(title);
  for (const num of numbers) {
    const n = parseInt(num);
    if (n > 50 && n < 200 && n !== CORRECT_AUTOMATION_COUNT) {
      addIssue('critical', 'TITLE_TAG', file,
        `Incorrect count in title: ${n} (should be ${CORRECT_AUTOMATION_COUNT})`,
        `Update title to use ${CORRECT_AUTOMATION_COUNT}`
      );
      stats.automationCountMismatches++;
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 4: OPEN GRAPH TAGS
// ========================================================================

function auditOgTags(html, file) {
  const requiredOg = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];

  for (const tag of requiredOg) {
    const content = extractMetaContent(html, tag);
    if (!content) {
      addIssue('medium', 'OG_TAGS', file, `Missing ${tag}`, `Add ${tag} meta tag`);
      stats.metaIssues++;
    } else {
      // Check for incorrect automation count in OG
      if (tag === 'og:description') {
        const numbers = extractNumbers(content);
        for (const num of numbers) {
          const n = parseInt(num);
          if (n > 50 && n < 200 && n !== CORRECT_AUTOMATION_COUNT) {
            addIssue('critical', 'OG_TAGS', file,
              `Incorrect count in og:description: ${n} (should be ${CORRECT_AUTOMATION_COUNT})`,
              `Update og:description to use ${CORRECT_AUTOMATION_COUNT}`
            );
            stats.automationCountMismatches++;
          }
        }
      }
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 5: TWITTER CARD TAGS
// ========================================================================

function auditTwitterCards(html, file) {
  const requiredTwitter = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];

  for (const tag of requiredTwitter) {
    const content = extractMetaContent(html, tag);
    if (!content) {
      addIssue('low', 'TWITTER_CARDS', file, `Missing ${tag}`, `Add ${tag} meta tag`);
      stats.metaIssues++;
    } else {
      // Check for incorrect automation count
      if (tag === 'twitter:description') {
        const numbers = extractNumbers(content);
        for (const num of numbers) {
          const n = parseInt(num);
          if (n > 50 && n < 200 && n !== CORRECT_AUTOMATION_COUNT) {
            addIssue('critical', 'TWITTER_CARDS', file,
              `Incorrect count in twitter:description: ${n} (should be ${CORRECT_AUTOMATION_COUNT})`,
              `Update twitter:description to use ${CORRECT_AUTOMATION_COUNT}`
            );
            stats.automationCountMismatches++;
          }
        }
      }
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 6: SCHEMA.ORG MARKUP
// ========================================================================

function auditSchemaOrg(html, file) {
  const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);

  if (!schemaMatch) {
    addIssue('medium', 'SCHEMA_ORG', file, 'No Schema.org JSON-LD found', 'Add relevant Schema.org markup');
    stats.schemaIssues++;
    return;
  }

  for (const schema of schemaMatch) {
    try {
      const jsonStr = schema.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '');
      const schemaData = JSON.parse(jsonStr);

      // Only check for automation count directly adjacent to automation/workflow keywords
      const schemaStr = JSON.stringify(schemaData);
      const automationPatterns = [
        /(\d+)\s*(?:automatisations?|automations?|workflows?)/gi
      ];

      for (const pattern of automationPatterns) {
        let match;
        while ((match = pattern.exec(schemaStr)) !== null) {
          const n = parseInt(match[1]);
          if (n > 50 && n < 200 && n !== CORRECT_AUTOMATION_COUNT) {
            addIssue('high', 'SCHEMA_ORG', file,
              `Incorrect automation count in Schema.org: ${n} (should be ${CORRECT_AUTOMATION_COUNT})`,
              `Update Schema.org to use ${CORRECT_AUTOMATION_COUNT}`
            );
            stats.schemaIssues++;
          }
        }
      }

      // Check Organization schema
      if (schemaData['@type'] === 'Organization') {
        if (!schemaData.name) {
          addIssue('medium', 'SCHEMA_ORG', file, 'Organization schema missing name', 'Add organization name');
          stats.schemaIssues++;
        }
        if (!schemaData.url) {
          addIssue('medium', 'SCHEMA_ORG', file, 'Organization schema missing url', 'Add organization url');
          stats.schemaIssues++;
        }
      }

    } catch (e) {
      addIssue('critical', 'SCHEMA_ORG', file, `Invalid JSON-LD syntax: ${e.message}`, 'Fix JSON syntax');
      stats.schemaIssues++;
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 7: HREFLANG TAGS
// ========================================================================

function auditHreflang(html, file) {
  const hreflangFr = html.match(/hreflang=["']fr["']/i);
  const hreflangEn = html.match(/hreflang=["']en["']/i);
  const hreflangDefault = html.match(/hreflang=["']x-default["']/i);

  if (!hreflangFr) {
    addIssue('medium', 'HREFLANG', file, 'Missing hreflang="fr"', 'Add French hreflang tag');
    stats.hreflangIssues++;
  }
  if (!hreflangEn) {
    addIssue('medium', 'HREFLANG', file, 'Missing hreflang="en"', 'Add English hreflang tag');
    stats.hreflangIssues++;
  }
  if (!hreflangDefault) {
    addIssue('low', 'HREFLANG', file, 'Missing hreflang="x-default"', 'Add x-default hreflang tag');
    stats.hreflangIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 8: CANONICAL URL
// ========================================================================

function auditCanonical(html, file) {
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);

  if (!canonical) {
    addIssue('high', 'CANONICAL', file, 'Missing canonical URL', 'Add canonical link tag');
    stats.metaIssues++;
    return;
  }

  const url = canonical[1];
  if (!url.startsWith('https://3a-automation.com')) {
    addIssue('high', 'CANONICAL', file,
      `Incorrect canonical domain: ${url}`,
      'Use https://3a-automation.com as canonical domain'
    );
    stats.metaIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 9: DUPLICATE SCRIPTS
// ========================================================================

function auditDuplicateScripts(html, file) {
  // Check for duplicate GA4
  const ga4Matches = html.match(/G-87F6FDJG45/g);
  if (ga4Matches && ga4Matches.length > 2) {
    addIssue('medium', 'DUPLICATE_SCRIPTS', file,
      `GA4 ID appears ${ga4Matches.length} times (potential duplicate loading)`,
      'Remove duplicate GA4 script tags'
    );
    stats.duplicateScripts++;
  }

  // Check for duplicate GTM
  const gtmMatches = html.match(/GTM-WLVJQC3M/g);
  if (gtmMatches && gtmMatches.length > 4) {
    addIssue('medium', 'DUPLICATE_SCRIPTS', file,
      `GTM ID appears ${gtmMatches.length} times (potential duplicate loading)`,
      'Remove duplicate GTM script tags'
    );
    stats.duplicateScripts++;
  }

  // Check for duplicate gtag loading (sync + async)
  const gtagAsync = html.match(/googletagmanager\.com\/gtag\/js\?id=G-87F6FDJG45/g);
  if (gtagAsync && gtagAsync.length > 1) {
    addIssue('high', 'DUPLICATE_SCRIPTS', file,
      `GA4 script loaded ${gtagAsync.length} times (sync + lazy load conflict)`,
      'Remove duplicate GA4 script - keep only lazy-loaded version'
    );
    stats.duplicateScripts++;
  }
}

// ========================================================================
// AUDIT CATEGORY 10: CTA ANALYSIS
// ========================================================================

function auditCTAs(html, file) {
  // Check for primary CTAs
  const ctaPatterns = [
    /(?:audit|gratuit|free|contact|demander|book|rdv|réserver)/gi,
    /<a[^>]*class="[^"]*btn[^"]*"[^>]*>/gi
  ];

  const ctaCount = (html.match(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>/gi) || []).length;

  if (ctaCount < 2) {
    addIssue('medium', 'CTA', file,
      `Only ${ctaCount} CTA button(s) found - may limit conversion`,
      'Consider adding more strategic CTAs'
    );
    stats.ctaIssues++;
  }

  // Check for audit gratuit CTA (main conversion goal)
  const hasAuditCTA = /audit[-\s]?gratuit|free[-\s]?audit/i.test(html);
  if (!hasAuditCTA && !file.includes('legal') && !file.includes('404')) {
    addIssue('low', 'CTA', file,
      'No "Audit Gratuit" CTA found on this page',
      'Consider adding primary conversion CTA'
    );
    stats.ctaIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 11: IMAGE ALT TAGS
// ========================================================================

function auditImageAlts(html, file) {
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  let missingAlt = 0;
  let emptyAlt = 0;

  for (const img of imgTags) {
    if (!img.includes('alt=')) {
      missingAlt++;
    } else if (img.match(/alt=["']\s*["']/)) {
      emptyAlt++;
    }
  }

  if (missingAlt > 0) {
    addIssue('high', 'IMAGE_ALT', file,
      `${missingAlt} image(s) missing alt attribute`,
      'Add descriptive alt text to all images'
    );
    stats.imageIssues++;
  }

  if (emptyAlt > 0) {
    addIssue('medium', 'IMAGE_ALT', file,
      `${emptyAlt} image(s) have empty alt attribute`,
      'Add descriptive alt text (or use alt="" only for decorative images)'
    );
    stats.imageIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 12: HEADING HIERARCHY
// ========================================================================

function auditHeadingHierarchy(html, file) {
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;

  if (h1Count === 0) {
    addIssue('high', 'HEADINGS', file, 'No H1 tag found', 'Add a single H1 tag');
    stats.accessibilityIssues++;
  } else if (h1Count > 1) {
    addIssue('medium', 'HEADINGS', file,
      `${h1Count} H1 tags found (should have exactly 1)`,
      'Reduce to a single H1 tag'
    );
    stats.accessibilityIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 13: SKIP LINK ACCESSIBILITY
// ========================================================================

function auditSkipLink(html, file) {
  const hasSkipLink = html.includes('skip-link') || html.includes('Skip to');

  if (!hasSkipLink && !file.includes('404')) {
    addIssue('low', 'ACCESSIBILITY', file,
      'No skip link for accessibility',
      'Add skip-to-content link for keyboard users'
    );
    stats.accessibilityIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 14: LANG ATTRIBUTE
// ========================================================================

function auditLangAttribute(html, file) {
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);

  if (!langMatch) {
    addIssue('high', 'LANG_ATTRIBUTE', file, 'Missing lang attribute on html tag', 'Add lang="fr" or lang="en"');
    stats.accessibilityIssues++;
    return;
  }

  const lang = langMatch[1];
  const isEnglishFile = file.includes('/en/');

  if (isEnglishFile && lang !== 'en') {
    addIssue('high', 'LANG_ATTRIBUTE', file,
      `English page has lang="${lang}" (should be "en")`,
      'Change lang attribute to "en"'
    );
    stats.accessibilityIssues++;
  } else if (!isEnglishFile && lang !== 'fr') {
    addIssue('high', 'LANG_ATTRIBUTE', file,
      `French page has lang="${lang}" (should be "fr")`,
      'Change lang attribute to "fr"'
    );
    stats.accessibilityIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 15: VALUE PROPOSITION KEYWORDS
// ========================================================================

function auditValueProposition(html, file) {
  const frKeywords = ['automation', 'automatisation', 'e-commerce', 'pme', 'analytics', 'ai', 'ia', 'roi'];
  const enKeywords = ['automation', 'e-commerce', 'smb', 'analytics', 'ai', 'roi', 'shopify', 'klaviyo'];

  const isEnglish = file.includes('/en/');
  const keywords = isEnglish ? enKeywords : frKeywords;

  const htmlLower = html.toLowerCase();
  const foundKeywords = keywords.filter(k => htmlLower.includes(k.toLowerCase()));

  if (foundKeywords.length < 3 && !file.includes('legal') && !file.includes('404')) {
    addIssue('low', 'VALUE_PROPOSITION', file,
      `Only ${foundKeywords.length} value proposition keywords found`,
      'Consider reinforcing core value proposition messaging'
    );
    stats.copyIssues++;
  }
}

// ========================================================================
// AUDIT CATEGORY 16: MCP COUNT VERIFICATION
// ========================================================================

function auditMCPCount(html, file) {
  const mcpPatterns = /(\d+)\s*(?:MCPs?|MCPs?\s*(?:actifs?|active))/gi;
  let match;

  while ((match = mcpPatterns.exec(html)) !== null) {
    const count = parseInt(match[1]);
    // According to CLAUDE.md, some MCPs are placeholders - need to verify the "12" claim
    if (count === 12) {
      addIssue('info', 'MCP_COUNT', file,
        'Claims 12 MCPs active - verify this is accurate per CLAUDE.md',
        'Review MCP configuration to confirm functional count'
      );
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 17: CLIENT COUNT VERIFICATION
// ========================================================================

function auditClientCount(html, file) {
  const clientPatterns = /(\d+)\+?\s*(?:clients?|customers?)\s*(?:servis?|served)?/gi;
  let match;

  while ((match = clientPatterns.exec(html)) !== null) {
    const count = parseInt(match[1]);
    if (count > 40) {
      addIssue('info', 'CLIENT_COUNT', file,
        `Claims ${count}+ clients - verify this is factually accurate`,
        'Confirm client count is verifiable'
      );
    }
  }
}

// ========================================================================
// AUDIT CATEGORY 18: FORM VALIDATION
// ========================================================================

function auditForms(html, file) {
  const forms = html.match(/<form[^>]*>/gi) || [];

  for (const form of forms) {
    if (!form.includes('action=')) {
      addIssue('medium', 'FORMS', file, 'Form missing action attribute', 'Add action URL to form');
    }
  }

  // Check for honeypot or spam protection
  const hasHoneypot = html.includes('honeypot') || html.includes('hp-field') || html.includes('recaptcha');
  if (forms.length > 0 && !hasHoneypot) {
    addIssue('low', 'FORMS', file,
      'No spam protection detected on forms',
      'Consider adding honeypot field or reCAPTCHA'
    );
  }
}

// ========================================================================
// AUDIT CATEGORY 19: ROBOTS META TAG
// ========================================================================

function auditRobotsMeta(html, file) {
  const robotsMeta = extractMetaContent(html, 'robots');

  if (file.includes('404') || file.includes('legal')) {
    // These pages might have noindex
    return;
  }

  if (!robotsMeta) {
    addIssue('info', 'ROBOTS_META', file, 'No robots meta tag (defaults to index, follow)', 'Consider adding explicit robots meta');
  } else if (robotsMeta.includes('noindex')) {
    addIssue('high', 'ROBOTS_META', file, 'Page set to noindex - will not appear in search', 'Remove noindex unless intentional');
  }
}

// ========================================================================
// AUDIT CATEGORY 20: VIEWPORT META
// ========================================================================

function auditViewport(html, file) {
  const viewport = extractMetaContent(html, 'viewport');

  if (!viewport) {
    addIssue('high', 'VIEWPORT', file, 'Missing viewport meta tag', 'Add viewport meta for mobile responsiveness');
    return;
  }

  if (!viewport.includes('width=device-width')) {
    addIssue('medium', 'VIEWPORT', file, 'Viewport missing width=device-width', 'Update viewport meta tag');
  }
}

// ========================================================================
// MAIN AUDIT RUNNER
// ========================================================================

function runAudit() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('   SESSION 83 - ULTRA FORENSIC FRONTEND AUDIT');
  console.log('   Target: https://3a-automation.com');
  console.log('   Source of Truth: automations-registry.json → ' + CORRECT_AUTOMATION_COUNT + ' automations');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const htmlFiles = getAllHtmlFiles(SITE_DIR);
  console.log(`📁 Found ${htmlFiles.length} HTML files to audit\n`);

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf-8');
    stats.pagesScanned++;

    // Run all audit categories
    auditAutomationCount(html, file);
    auditMetaDescriptions(html, file);
    auditTitleTags(html, file);
    auditOgTags(html, file);
    auditTwitterCards(html, file);
    auditSchemaOrg(html, file);
    auditHreflang(html, file);
    auditCanonical(html, file);
    auditDuplicateScripts(html, file);
    auditCTAs(html, file);
    auditImageAlts(html, file);
    auditHeadingHierarchy(html, file);
    auditSkipLink(html, file);
    auditLangAttribute(html, file);
    auditValueProposition(html, file);
    auditMCPCount(html, file);
    auditClientCount(html, file);
    auditForms(html, file);
    auditRobotsMeta(html, file);
    auditViewport(html, file);
  }

  // Also audit special files
  auditRobotsTxt();
  auditLlmsTxt();
  auditSitemap();

  // Output results
  printResults();
  saveResults();
}

// ========================================================================
// SPECIAL FILE AUDITS
// ========================================================================

function auditRobotsTxt() {
  const robotsPath = path.join(SITE_DIR, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    addIssue('critical', 'ROBOTS_TXT', 'robots.txt', 'Missing robots.txt file', 'Create robots.txt');
    return;
  }

  const content = fs.readFileSync(robotsPath, 'utf-8');

  // Check for sitemap reference
  if (!content.includes('Sitemap:')) {
    addIssue('medium', 'ROBOTS_TXT', 'robots.txt', 'No sitemap reference in robots.txt', 'Add Sitemap: https://3a-automation.com/sitemap.xml');
  }

  // Check for AI crawler directives (AEO)
  const aiCrawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot'];
  const missingCrawlers = aiCrawlers.filter(c => !content.includes(c));

  if (missingCrawlers.length > 0) {
    addIssue('medium', 'ROBOTS_TXT', 'robots.txt',
      `Missing AI crawler directives: ${missingCrawlers.join(', ')}`,
      'Add explicit Allow directives for AI crawlers (AEO)'
    );
    stats.aeoIssues++;
  }

  // Check for llms.txt reference
  if (!content.toLowerCase().includes('llms.txt')) {
    addIssue('low', 'ROBOTS_TXT', 'robots.txt',
      'No reference to llms.txt in robots.txt',
      'Add comment referencing llms.txt for AI systems'
    );
    stats.aeoIssues++;
  }
}

function auditLlmsTxt() {
  const llmsPath = path.join(SITE_DIR, 'llms.txt');
  if (!fs.existsSync(llmsPath)) {
    addIssue('critical', 'LLMS_TXT', 'llms.txt', 'Missing llms.txt file for AEO', 'Create llms.txt per llmstxt.org spec');
    stats.aeoIssues++;
    return;
  }

  const content = fs.readFileSync(llmsPath, 'utf-8');

  // Check for automation count - only flag numbers near automation/workflow keywords
  const automationPatterns = /(\d+)\s*(?:automatisations?|automations?|workflows?)/gi;
  let match;
  let hasCorrectCount = false;
  while ((match = automationPatterns.exec(content)) !== null) {
    const n = parseInt(match[1]);
    if (n === CORRECT_AUTOMATION_COUNT) {
      hasCorrectCount = true;
    } else if (n > 50 && n < 200) {
      addIssue('critical', 'LLMS_TXT', 'llms.txt',
        `Incorrect automation count: ${n} (should be ${CORRECT_AUTOMATION_COUNT})`,
        `Update llms.txt to show ${CORRECT_AUTOMATION_COUNT} automations`
      );
      stats.automationCountMismatches++;
    }
  }

  // Check for required sections per llmstxt.org spec
  if (!content.includes('# ')) {
    addIssue('high', 'LLMS_TXT', 'llms.txt', 'Missing H1 heading (required by spec)', 'Add # ProjectName as first line');
    stats.aeoIssues++;
  }

  // Check for key pages
  const keyUrls = ['audit-gratuit', 'ecommerce', 'pricing', 'contact', 'automations'];
  const missingUrls = keyUrls.filter(u => !content.toLowerCase().includes(u));

  if (missingUrls.length > 0) {
    addIssue('medium', 'LLMS_TXT', 'llms.txt',
      `Missing key page references: ${missingUrls.join(', ')}`,
      'Add links to all key pages for AI discovery'
    );
    stats.aeoIssues++;
  }
}

function auditSitemap() {
  const sitemapPath = path.join(SITE_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    addIssue('critical', 'SITEMAP', 'sitemap.xml', 'Missing sitemap.xml', 'Create sitemap.xml');
    return;
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');

  // Count URLs
  const urlCount = (content.match(/<loc>/g) || []).length;

  if (urlCount < 20) {
    addIssue('medium', 'SITEMAP', 'sitemap.xml',
      `Only ${urlCount} URLs in sitemap (expected ~28)`,
      'Ensure all pages are included in sitemap'
    );
  }

  // Check for hreflang in sitemap
  if (!content.includes('xhtml:link')) {
    addIssue('medium', 'SITEMAP', 'sitemap.xml',
      'No hreflang links in sitemap',
      'Add xhtml:link hreflang tags for multilingual SEO'
    );
    stats.hreflangIssues++;
  }

  // Check for lastmod freshness
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (!content.includes(today) && !content.includes(yesterday)) {
    addIssue('low', 'SITEMAP', 'sitemap.xml',
      'Sitemap lastmod dates may be stale',
      'Consider updating lastmod dates for recently changed pages'
    );
  }
}

// ========================================================================
// OUTPUT
// ========================================================================

function printResults() {
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('   AUDIT RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  console.log(`📊 STATISTICS:`);
  console.log(`   Pages Scanned: ${stats.pagesScanned}`);
  console.log(`   Total Issues: ${stats.totalIssues}`);
  console.log(`   ├── Automation Count Mismatches: ${stats.automationCountMismatches}`);
  console.log(`   ├── Meta Issues: ${stats.metaIssues}`);
  console.log(`   ├── Schema Issues: ${stats.schemaIssues}`);
  console.log(`   ├── Hreflang Issues: ${stats.hreflangIssues}`);
  console.log(`   ├── AEO Issues: ${stats.aeoIssues}`);
  console.log(`   ├── Copy Issues: ${stats.copyIssues}`);
  console.log(`   ├── CTA Issues: ${stats.ctaIssues}`);
  console.log(`   ├── Image Issues: ${stats.imageIssues}`);
  console.log(`   ├── Duplicate Scripts: ${stats.duplicateScripts}`);
  console.log(`   └── Accessibility Issues: ${stats.accessibilityIssues}`);

  console.log('\n───────────────────────────────────────────────────────────────────────');
  console.log('   ISSUES BY SEVERITY');
  console.log('───────────────────────────────────────────────────────────────────────\n');

  const severities = ['critical', 'high', 'medium', 'low', 'info'];
  const emojis = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: 'ℹ️' };

  for (const severity of severities) {
    const issueList = issues[severity];
    console.log(`${emojis[severity]} ${severity.toUpperCase()}: ${issueList.length} issues`);

    if (issueList.length > 0) {
      // Group by category
      const byCategory = {};
      for (const issue of issueList) {
        if (!byCategory[issue.category]) byCategory[issue.category] = [];
        byCategory[issue.category].push(issue);
      }

      for (const [category, catIssues] of Object.entries(byCategory)) {
        console.log(`   └─ [${category}] ${catIssues.length} issue(s)`);
        for (const issue of catIssues.slice(0, 5)) { // Show first 5 per category
          console.log(`      • ${issue.file}: ${issue.description}`);
        }
        if (catIssues.length > 5) {
          console.log(`      ... and ${catIssues.length - 5} more`);
        }
      }
    }
    console.log('');
  }

  // Final status
  console.log('───────────────────────────────────────────────────────────────────────');
  if (issues.critical.length === 0 && issues.high.length === 0) {
    console.log('✅ AUDIT STATUS: PASSED (no critical or high severity issues)');
  } else if (issues.critical.length === 0) {
    console.log('⚠️ AUDIT STATUS: NEEDS ATTENTION (high severity issues found)');
  } else {
    console.log('❌ AUDIT STATUS: FAILED (critical issues require immediate fix)');
  }
  console.log('───────────────────────────────────────────────────────────────────────\n');
}

function saveResults() {
  const output = {
    date: new Date().toISOString(),
    correctAutomationCount: CORRECT_AUTOMATION_COUNT,
    stats,
    summary: {
      critical: issues.critical.length,
      high: issues.high.length,
      medium: issues.medium.length,
      low: issues.low.length,
      info: issues.info.length,
      total: stats.totalIssues
    },
    issues
  };

  const outputPath = path.join(__dirname, '../outputs/session83-forensic-audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`📄 Full report saved to: outputs/session83-forensic-audit.json\n`);
}

// Run the audit
runAudit();
