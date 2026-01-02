#!/usr/bin/env node
/**
 * Fix n8n References - Replace obsolete n8n mentions with Node.js/Scripts
 *
 * CONTEXT: All n8n workflows have been replaced by native Node.js scripts
 * in automations/agency/core/. This script updates the website to reflect
 * the current architecture.
 *
 * Date: 2026-01-02
 */

const fs = require('fs');
const path = require('path');

const LANDING_PAGE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Replacement patterns - comprehensive list
const REPLACEMENTS = [
  // Meta descriptions - remove n8n from tool list
  { pattern: /Shopify, Klaviyo, n8n, GA4/g, replacement: 'Shopify, Klaviyo, GA4' },
  { pattern: /Shopify, Klaviyo, GA4, n8n/g, replacement: 'Shopify, Klaviyo, GA4' },
  { pattern: /GA4, n8n\./g, replacement: 'GA4.' },
  { pattern: /, n8n\./g, replacement: '.' },

  // Schema.org and FAQPage - complex patterns
  { pattern: /GA4, Google Tag Manager, Meta Ads, TikTok Ads, n8n, Apify/g, replacement: 'GA4, Google Tag Manager, Meta Ads, TikTok Ads, Apify' },
  { pattern: /Klaviyo, n8n and/gi, replacement: 'Klaviyo and' },
  { pattern: /Klaviyo, n8n et/gi, replacement: 'Klaviyo et' },
  { pattern: /, n8n and AI/gi, replacement: ' and AI' },
  { pattern: /, n8n et les/gi, replacement: ' et les' },
  { pattern: /Shopify, Klaviyo, n8n,/g, replacement: 'Shopify, Klaviyo,' },
  { pattern: /Shopify, Klaviyo, n8n et/g, replacement: 'Shopify, Klaviyo et' },
  { pattern: /Klaviyo, Shopify, n8n,/g, replacement: 'Klaviyo, Shopify,' },

  // n8n for complex workflows
  { pattern: /et n8n pour les workflows complexes/g, replacement: 'et Node.js pour les workflows complexes' },
  { pattern: /and n8n for complex workflows/g, replacement: 'and Node.js for complex workflows' },

  // Tech badges - remove n8n badge
  { pattern: /<span class="tech-badge">n8n<\/span>\s*/g, replacement: '' },
  { pattern: /<span class="tech-badge">n8n Partner<\/span>\s*/g, replacement: '' },

  // Tech icon in animated display
  { pattern: /<div class="tech-icon"[^>]*><span>n8n<\/span><\/div>\s*/g, replacement: '' },

  // Tech pills with n8n logo
  { pattern: /<span class="tech-pill automation"><img src="[^"]*n8n\.svg"[^>]*>n8n<\/span>\s*/g, replacement: '' },

  // Partner names
  { pattern: /<span class="partner-name">n8n<\/span>/g, replacement: '' },

  // Integrateurs n8n
  { pattern: /Intégrateurs n8n: expertise AI/gi, replacement: 'ESN: expertise AI' },
  { pattern: /n8n integrators: AI expertise/gi, replacement: 'Tech partners: AI expertise' },
  { pattern: /intégrateurs n8n,/gi, replacement: 'intégrateurs,' },
  { pattern: /integrateurs n8n,/gi, replacement: 'integrateurs,' },
  { pattern: /n8n integrators,/gi, replacement: 'integrators,' },
  { pattern: /, intégrateurs n8n/gi, replacement: '' },

  // Blog footer/author bio
  { pattern: /Klaviyo, Shopify, GA4, n8n\./g, replacement: 'Klaviyo, Shopify, GA4.' },
  { pattern: /Klaviyo, Shopify, Grok Voice, n8n\./g, replacement: 'Klaviyo, Shopify, Grok Voice.' },

  // Automations page
  { pattern: /Shopify, Klaviyo, n8n, Apify/g, replacement: 'Shopify, Klaviyo, Apify' },

  // n8n standalone in stack div
  { pattern: /<div style="font-weight: 600;">n8n<\/div>/g, replacement: '' },
  { pattern: /<span>n8n<\/span>/g, replacement: '' },

  // Workflows n8n
  { pattern: /Workflows n8n/gi, replacement: 'Workflows Node.js' },
  { pattern: /n8n workflows/gi, replacement: 'Node.js scripts' },

  // Table cells with n8n
  { pattern: /<td style="padding:1rem 0.5rem"><strong>n8n<\/strong><\/td>/g, replacement: '<td style="padding:1rem 0.5rem"><strong>Node.js</strong></td>' },

  // og:description in blog index
  { pattern: /Klaviyo, Shopify, GA4, n8n\./g, replacement: 'Klaviyo, Shopify, GA4.' }
];

// Files to process
const HTML_PATTERNS = [
  'index.html',
  'en/index.html',
  'pricing.html',
  'en/pricing.html',
  'contact.html',
  'en/contact.html',
  'booking.html',
  'en/booking.html',
  'automations.html',
  'en/automations.html',
  'a-propos.html',
  'en/about.html',
  'cas-clients.html',
  'en/case-studies.html',
  'investisseurs.html',
  'en/investors.html',
  '404.html',
  'en/404.html',
  'services/ecommerce.html',
  'services/pme.html',
  'services/voice-ai.html',
  'services/flywheel-360.html',
  'services/audit-gratuit.html',
  'en/services/ecommerce.html',
  'en/services/smb.html',
  'en/services/voice-ai.html',
  'en/services/flywheel-360.html',
  'en/services/free-audit.html',
  'legal/mentions-legales.html',
  'legal/politique-confidentialite.html',
  'en/legal/terms.html',
  'en/legal/privacy.html',
  'blog/index.html',
  'en/blog/index.html',
  'blog/automatisation-ecommerce-2026.html',
  'blog/assistant-vocal-ia-pme-2026.html',
  'en/blog/ecommerce-automation-2026.html',
  'en/blog/voice-ai-assistant-sme-2026.html'
];

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0,
  errors: []
};

function processFile(filePath) {
  const fullPath = path.join(LANDING_PAGE_DIR, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`  [SKIP] ${filePath} - not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;

  for (const { pattern, replacement } of REPLACEMENTS) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      fileReplacements += matches.length;
    }
  }

  stats.filesProcessed++;

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    stats.filesModified++;
    stats.totalReplacements += fileReplacements;
    console.log(`  [FIXED] ${filePath} - ${fileReplacements} replacements`);
  } else {
    console.log(`  [OK] ${filePath} - no n8n refs found`);
  }
}

function processLlmsTxt() {
  const filePath = path.join(LANDING_PAGE_DIR, 'llms.txt');
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace n8n in stack
  if (content.includes('n8n')) {
    content = content.replace(/Stack: Shopify, Klaviyo, GA4, n8n,/g, 'Stack: Shopify, Klaviyo, GA4,');
    content = content.replace(/integrateurs n8n,/gi, 'integrateurs,');
    content = content.replace(/n8n integrators,/gi, 'integrators,');
    fs.writeFileSync(filePath, content, 'utf8');
    modified = true;
    console.log('  [FIXED] llms.txt');
    stats.filesModified++;
    stats.totalReplacements += 2;
  } else {
    console.log('  [OK] llms.txt - no n8n refs');
  }
  stats.filesProcessed++;
}

function processKnowledgeBase() {
  const filePath = path.join(LANDING_PAGE_DIR, 'voice-assistant', 'knowledge-base.js');
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('n8n')) {
    content = content.replace(/'Workflows n8n'/g, "'Automatisations Node.js'");
    content = content.replace(/Klaviyo, Shopify, GA4, n8n,/g, 'Klaviyo, Shopify, GA4,');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  [FIXED] knowledge-base.js');
    stats.filesModified++;
    stats.totalReplacements += 2;
  } else {
    console.log('  [OK] knowledge-base.js - no n8n refs');
  }
  stats.filesProcessed++;
}

function processAutomationsCatalog() {
  const filePath = path.join(LANDING_PAGE_DIR, 'data', 'automations-catalog.json');

  if (!fs.existsSync(filePath)) {
    console.log('  [SKIP] automations-catalog.json - not found');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('n8n')) {
    content = content.replace(/"n8n"/g, '"Node.js"');
    content = content.replace(/n8n workflow/gi, 'Node.js script');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  [FIXED] automations-catalog.json');
    stats.filesModified++;
    stats.totalReplacements += 3;
  } else {
    console.log('  [OK] automations-catalog.json - no n8n refs');
  }
  stats.filesProcessed++;
}

console.log('=== N8N Reference Cleanup ===\n');
console.log('Processing HTML files...');

for (const file of HTML_PATTERNS) {
  processFile(file);
}

console.log('\nProcessing data files...');
processLlmsTxt();
processKnowledgeBase();
processAutomationsCatalog();

console.log('\n=== Summary ===');
console.log(`Files processed: ${stats.filesProcessed}`);
console.log(`Files modified: ${stats.filesModified}`);
console.log(`Total replacements: ${stats.totalReplacements}`);

if (stats.errors.length > 0) {
  console.log('\nErrors:');
  stats.errors.forEach(e => console.log(`  - ${e}`));
}

// Verification
console.log('\n=== Verification ===');
const { execSync } = require('child_process');
try {
  const remaining = execSync(
    `grep -r "n8n" --include="*.html" "${LANDING_PAGE_DIR}" 2>/dev/null | grep -v "n8n.svg" | wc -l`,
    { encoding: 'utf8' }
  ).trim();

  console.log(`Remaining n8n refs in HTML (excluding logo): ${remaining}`);

  if (parseInt(remaining) === 0) {
    console.log('\n✅ SUCCESS: All n8n references removed from HTML');
  } else {
    console.log('\n⚠️  WARNING: Some n8n references remain - manual review needed');
  }
} catch (e) {
  console.log('Verification error:', e.message);
}

process.exit(stats.errors.length > 0 ? 1 : 0);
