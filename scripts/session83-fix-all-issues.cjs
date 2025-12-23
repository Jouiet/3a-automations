#!/usr/bin/env node
/**
 * SESSION 83 - FIX ALL CRITICAL AND HIGH ISSUES
 * Fixes automation count, duplicate scripts, Schema.org
 * Date: 2025-12-23
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');
const CORRECT_COUNT = 77;

let totalFixes = 0;
const fixLog = [];

function log(message) {
  console.log(message);
  fixLog.push(message);
}

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

// ========================================================================
// FIX 1: AUTOMATION COUNT IN ALL PAGES
// ========================================================================

function fixAutomationCounts(html, file) {
  let modified = html;
  let fixes = 0;

  // Fix patterns: 72, 74, 75, 90, 150 → 77
  const incorrectCounts = [72, 74, 75, 90, 150, 67];

  for (const wrongCount of incorrectCounts) {
    // Pattern 1: "XX automatisations" / "XX automations" / "XX workflows"
    const patterns = [
      new RegExp(`(\\b)${wrongCount}(\\s*(?:automatisations?|automations?|workflows?))`, 'gi'),
      new RegExp(`(>)${wrongCount}(<\\/span>)`, 'gi'),
      new RegExp(`("numberOfItems":\\s*)${wrongCount}(\\s*[,}])`, 'gi'),
      new RegExp(`(content=["'][^"']*\\b)${wrongCount}(\\b[^"']*["'])`, 'gi'),
      new RegExp(`(description":\\s*"[^"]*\\b)${wrongCount}(\\b)`, 'gi')
    ];

    for (const pattern of patterns) {
      const before = modified;
      modified = modified.replace(pattern, `$1${CORRECT_COUNT}$2`);
      if (modified !== before) {
        fixes++;
      }
    }
  }

  if (fixes > 0) {
    const relativePath = file.replace(SITE_DIR, '');
    log(`  ✅ ${relativePath}: Fixed ${fixes} automation count(s)`);
    totalFixes += fixes;
  }

  return modified;
}

// ========================================================================
// FIX 2: DUPLICATE GA4 SCRIPTS
// ========================================================================

function fixDuplicateGA4(html, file) {
  let modified = html;
  let fixes = 0;

  // Remove standalone GA4 script that conflicts with lazy-loaded version
  // Keep the lazy-loaded version, remove the sync version
  const syncGA4Pattern = /\s*<!-- Google Analytics 4 -->\s*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-87F6FDJG45"><\/script>\s*<script>\s*window\.dataLayer = window\.dataLayer \|\| \[\];\s*function gtag\(\)\{dataLayer\.push\(arguments\);\}\s*gtag\('js', new Date\(\)\);\s*gtag\('config', 'G-87F6FDJG45', \{ 'anonymize_ip': true \}\);\s*<\/script>/gi;

  const before = modified;
  modified = modified.replace(syncGA4Pattern, '');

  if (modified !== before) {
    const relativePath = file.replace(SITE_DIR, '');
    log(`  ✅ ${relativePath}: Removed duplicate GA4 script`);
    fixes++;
    totalFixes++;
  }

  return modified;
}

// ========================================================================
// FIX 3: SCHEMA.ORG INCORRECT COUNTS
// ========================================================================

function fixSchemaOrg(html, file) {
  let modified = html;
  let fixes = 0;

  // Find and fix Schema.org JSON-LD blocks
  const schemaRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;

  modified = modified.replace(schemaRegex, (match, jsonContent) => {
    let fixedJson = jsonContent;

    // Fix incorrect counts in description fields
    const incorrectCounts = [72, 74, 75, 90, 150, 67];
    for (const wrongCount of incorrectCounts) {
      const descPattern = new RegExp(`(["']description["']\\s*:\\s*["'][^"']*\\b)${wrongCount}(\\b)`, 'gi');
      fixedJson = fixedJson.replace(descPattern, `$1${CORRECT_COUNT}$2`);

      // Also fix numberOfItems if present
      const itemsPattern = new RegExp(`(["']numberOfItems["']\\s*:\\s*)${wrongCount}`, 'gi');
      fixedJson = fixedJson.replace(itemsPattern, `$1${CORRECT_COUNT}`);
    }

    if (fixedJson !== jsonContent) {
      fixes++;
      return `<script type="application/ld+json">${fixedJson}</script>`;
    }
    return match;
  });

  if (fixes > 0) {
    const relativePath = file.replace(SITE_DIR, '');
    log(`  ✅ ${relativePath}: Fixed ${fixes} Schema.org issue(s)`);
    totalFixes += fixes;
  }

  return modified;
}

// ========================================================================
// FIX 4: META DESCRIPTIONS TOO SHORT (pad with value proposition)
// ========================================================================

function fixShortMetaDescriptions(html, file) {
  let modified = html;
  let fixes = 0;

  const isEnglish = file.includes('/en/');

  // Fix specific short meta descriptions
  const shortDescFixes = {
    '/404.html': isEnglish
      ? 'Page not found. Return to our homepage and explore our 77 automation solutions for e-commerce and SMBs. Free audit available.'
      : 'Page introuvable. Retournez à l\'accueil et découvrez nos 77 automatisations pour e-commerce et PME. Audit gratuit disponible.',
    '/contact.html': 'Contactez 3A Automation pour vos projets d\'automatisation e-commerce et PME. Réponse sous 24h. 77 automatisations prêtes à déployer.',
    '/en/contact.html': 'Contact 3A Automation for your e-commerce and SMB automation projects. Response within 24h. 77 ready-to-deploy automations.',
    '/index.html': 'Automatisation marketing et opérationnelle pour e-commerce et PME. 77 workflows testés. Shopify, Klaviyo, n8n. Audit gratuit disponible.',
    '/services/flywheel-360.html': 'Système Flywheel 360° complet: Acquisition → Conversion → Rétention → Advocacy. 77 automatisations intégrées pour maximiser votre croissance.',
    '/en/404.html': 'Page not found. Return to homepage to explore our 77 ready-to-deploy automation solutions for e-commerce and SMBs.'
  };

  const relativePath = file.replace(SITE_DIR, '');

  if (shortDescFixes[relativePath]) {
    const newDesc = shortDescFixes[relativePath];
    const metaPattern = /<meta\s+name=["']description["']\s+content=["'][^"']*["']/i;
    const match = html.match(metaPattern);

    if (match && match[0].length < 150) {
      modified = modified.replace(metaPattern, `<meta name="description" content="${newDesc}"`);
      log(`  ✅ ${relativePath}: Updated short meta description`);
      fixes++;
      totalFixes++;
    }
  }

  return modified;
}

// ========================================================================
// FIX 5: ADD MISSING TWITTER:IMAGE
// ========================================================================

function fixMissingTwitterImage(html, file) {
  let modified = html;
  let fixes = 0;

  // Check if twitter:image is missing
  if (!html.includes('twitter:image') && html.includes('twitter:card')) {
    // Add twitter:image after twitter:description
    const twitterDescPattern = /(<meta\s+name=["']twitter:description["'][^>]*>)/i;
    const twitterImageTag = `\n    <meta name="twitter:image" content="https://3a-automation.com/og-image.webp">`;

    if (twitterDescPattern.test(html)) {
      modified = modified.replace(twitterDescPattern, `$1${twitterImageTag}`);
      const relativePath = file.replace(SITE_DIR, '');
      log(`  ✅ ${relativePath}: Added missing twitter:image`);
      fixes++;
      totalFixes++;
    }
  }

  return modified;
}

// ========================================================================
// MAIN EXECUTION
// ========================================================================

function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('   SESSION 83 - FIX ALL CRITICAL AND HIGH ISSUES');
  console.log('   Target Count: ' + CORRECT_COUNT + ' automations');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const htmlFiles = getAllHtmlFiles(SITE_DIR);
  log(`📁 Processing ${htmlFiles.length} HTML files...\n`);

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf-8');
    const originalHtml = html;

    // Apply all fixes
    html = fixAutomationCounts(html, file);
    html = fixDuplicateGA4(html, file);
    html = fixSchemaOrg(html, file);
    html = fixShortMetaDescriptions(html, file);
    html = fixMissingTwitterImage(html, file);

    // Save if modified
    if (html !== originalHtml) {
      fs.writeFileSync(file, html);
    }
  }

  // Fix llms.txt
  fixLlmsTxt();

  console.log('\n───────────────────────────────────────────────────────────────────────');
  console.log(`✅ TOTAL FIXES APPLIED: ${totalFixes}`);
  console.log('───────────────────────────────────────────────────────────────────────\n');

  // Save fix log
  const logPath = path.join(__dirname, '../outputs/session83-fix-log.json');
  fs.writeFileSync(logPath, JSON.stringify({
    date: new Date().toISOString(),
    totalFixes,
    correctCount: CORRECT_COUNT,
    fixes: fixLog
  }, null, 2));
  console.log(`📄 Fix log saved to: outputs/session83-fix-log.json\n`);
}

function fixLlmsTxt() {
  const llmsPath = path.join(SITE_DIR, 'llms.txt');
  if (!fs.existsSync(llmsPath)) return;

  let content = fs.readFileSync(llmsPath, 'utf-8');
  const original = content;

  // Fix incorrect counts in llms.txt
  const incorrectCounts = [72, 74, 75, 90, 150, 67];
  for (const wrongCount of incorrectCounts) {
    const pattern = new RegExp(`\\b${wrongCount}\\b(?=\\s*(?:automatisations?|automations?|workflows?))`, 'gi');
    content = content.replace(pattern, CORRECT_COUNT.toString());
  }

  // Also fix standalone number references that look like automation counts
  content = content.replace(/\b150 automations\b/gi, `${CORRECT_COUNT} automations`);
  content = content.replace(/\b150 automatisations\b/gi, `${CORRECT_COUNT} automatisations`);

  if (content !== original) {
    fs.writeFileSync(llmsPath, content);
    log(`  ✅ llms.txt: Fixed automation count`);
    totalFixes++;
  }
}

main();
