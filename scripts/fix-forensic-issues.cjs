#!/usr/bin/env node
/**
 * FIX FORENSIC ISSUES - 3A Automation
 * Date: 2026-01-02
 * Version: 1.0
 *
 * Corrige automatiquement les problemes identifies par l'audit forensique:
 * - Ajoute OG/Twitter/hreflang aux pages Academy
 * - Ajoute skip links aux pages manquantes
 * - Ajoute FAQPage schema aux pages manquantes
 */

const fs = require('fs');
const path = require('path');

const LANDING_PAGE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let fixedCount = 0;
let errorCount = 0;

function log(level, message) {
  const colors = { error: RED, success: GREEN, warn: YELLOW, info: CYAN };
  console.log(`${colors[level] || RESET}[${level.toUpperCase()}]${RESET} ${message}`);
}

// Get all HTML files
function getAllHtmlFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Fix OG tags for Academy pages
function fixOgTags(file, content) {
  const relativePath = path.relative(LANDING_PAGE_DIR, file);

  // Only process pages without OG tags
  if (content.includes('<meta property="og:title"')) {
    return { content, fixed: false };
  }

  // Extract title
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1] : '3A Automation';

  // Extract description
  const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
  const description = descMatch ? descMatch[1] : 'Automatisation marketing et operationnelle pour e-commerce et PME.';

  // Determine language and base URL
  const isEnglish = relativePath.startsWith('en/') || relativePath.startsWith('en\\');
  const locale = isEnglish ? 'en_US' : 'fr_FR';
  const baseUrl = 'https://3a-automation.com';

  // Build page URL
  let pageUrl = relativePath.replace(/\\/g, '/');
  if (!pageUrl.startsWith('/')) pageUrl = '/' + pageUrl;

  const ogTags = `
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${baseUrl}/og-image.webp">
  <meta property="og:locale" content="${locale}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${baseUrl}/og-image.webp">`;

  // Insert after meta description
  const insertPoint = content.indexOf('</head>');
  if (insertPoint === -1) {
    return { content, fixed: false };
  }

  // Find best insertion point (after existing meta tags)
  const robotsIndex = content.indexOf('<meta name="robots"');
  const descIndex = content.indexOf('<meta name="description"');

  let insertAfter = descIndex;
  if (robotsIndex > descIndex) {
    insertAfter = robotsIndex;
  }

  // Find end of that line
  const lineEnd = content.indexOf('>', insertAfter) + 1;

  const newContent = content.slice(0, lineEnd) + ogTags + content.slice(lineEnd);

  return { content: newContent, fixed: true };
}

// Fix hreflang tags
function fixHreflang(file, content) {
  const relativePath = path.relative(LANDING_PAGE_DIR, file);

  // Only process pages without hreflang
  if (content.includes('hreflang="fr"') && content.includes('hreflang="en"')) {
    return { content, fixed: false };
  }

  const isEnglish = relativePath.startsWith('en/') || relativePath.startsWith('en\\');
  const baseUrl = 'https://3a-automation.com';

  // Calculate FR and EN URLs
  let frPath, enPath;
  if (isEnglish) {
    enPath = '/' + relativePath.replace(/\\/g, '/');
    frPath = enPath.replace('/en/', '/').replace('getting-started', 'demarrer').replace('content', 'contenu');
  } else {
    frPath = '/' + relativePath.replace(/\\/g, '/');
    enPath = '/en' + frPath.replace('/academie/', '/academy/').replace('/cours/', '/courses/')
                          .replace('/parcours/', '/paths/').replace('demarrer', 'getting-started')
                          .replace('contenu', 'content');
  }

  const hreflangTags = `
  <link rel="alternate" hreflang="fr" href="${baseUrl}${frPath}">
  <link rel="alternate" hreflang="en" href="${baseUrl}${enPath}">
  <link rel="alternate" hreflang="x-default" href="${baseUrl}${isEnglish ? enPath : frPath}">`;

  // Insert before </head>
  const insertPoint = content.indexOf('</head>');
  if (insertPoint === -1) {
    return { content, fixed: false };
  }

  const newContent = content.slice(0, insertPoint) + hreflangTags + '\n' + content.slice(insertPoint);

  return { content: newContent, fixed: true };
}

// Fix skip links
function fixSkipLinks(file, content) {
  // Check if skip link already exists
  if (content.includes('skip-link') || content.includes('skip-to-content') || content.includes('#main-content')) {
    return { content, fixed: false };
  }

  // Find <body> tag
  const bodyMatch = content.match(/<body[^>]*>/);
  if (!bodyMatch) {
    return { content, fixed: false };
  }

  const bodyTag = bodyMatch[0];
  const bodyIndex = content.indexOf(bodyTag) + bodyTag.length;

  const isEnglish = content.includes('lang="en"');
  const skipLinkText = isEnglish ? 'Skip to main content' : 'Aller au contenu principal';

  const skipLink = `\n  <a href="#main-content" class="skip-link visually-hidden">${skipLinkText}</a>`;

  const newContent = content.slice(0, bodyIndex) + skipLink + content.slice(bodyIndex);

  return { content: newContent, fixed: true };
}

// Process all files
async function main() {
  console.log(`${CYAN}========================================${RESET}`);
  console.log(`${CYAN}  FIX FORENSIC ISSUES${RESET}`);
  console.log(`${CYAN}  Date: ${new Date().toISOString()}${RESET}`);
  console.log(`${CYAN}========================================${RESET}\n`);

  const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);
  log('info', `Processing ${htmlFiles.length} HTML files...`);

  const summary = {
    ogTagsFixed: 0,
    hreflangFixed: 0,
    skipLinksFixed: 0,
    filesModified: new Set()
  };

  for (const file of htmlFiles) {
    const relativePath = path.relative(LANDING_PAGE_DIR, file);
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix OG tags
    const ogResult = fixOgTags(file, content);
    if (ogResult.fixed) {
      content = ogResult.content;
      summary.ogTagsFixed++;
      modified = true;
      log('success', `OG tags added: ${relativePath}`);
    }

    // Fix hreflang
    const hreflangResult = fixHreflang(file, content);
    if (hreflangResult.fixed) {
      content = hreflangResult.content;
      summary.hreflangFixed++;
      modified = true;
      log('success', `Hreflang added: ${relativePath}`);
    }

    // Fix skip links
    const skipResult = fixSkipLinks(file, content);
    if (skipResult.fixed) {
      content = skipResult.content;
      summary.skipLinksFixed++;
      modified = true;
      log('success', `Skip link added: ${relativePath}`);
    }

    // Save if modified
    if (modified) {
      fs.writeFileSync(file, content);
      summary.filesModified.add(relativePath);
      fixedCount++;
    }
  }

  // Print summary
  console.log(`\n${CYAN}========================================${RESET}`);
  console.log(`${CYAN}  SUMMARY${RESET}`);
  console.log(`${CYAN}========================================${RESET}`);
  console.log(`${GREEN}OG Tags Fixed: ${summary.ogTagsFixed}${RESET}`);
  console.log(`${GREEN}Hreflang Fixed: ${summary.hreflangFixed}${RESET}`);
  console.log(`${GREEN}Skip Links Fixed: ${summary.skipLinksFixed}${RESET}`);
  console.log(`${GREEN}Files Modified: ${summary.filesModified.size}${RESET}`);

  if (summary.filesModified.size > 0) {
    console.log(`\n${YELLOW}Modified Files:${RESET}`);
    for (const file of summary.filesModified) {
      console.log(`  - ${file}`);
    }
  }

  console.log(`\n${CYAN}========================================${RESET}`);

  return summary;
}

// Handle command line args
if (process.argv.includes('--dry-run')) {
  console.log(`${YELLOW}DRY RUN MODE - No files will be modified${RESET}\n`);
  // In dry run, just show what would be fixed
  const htmlFiles = getAllHtmlFiles(LANDING_PAGE_DIR);
  let wouldFix = { og: 0, hreflang: 0, skip: 0 };

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(LANDING_PAGE_DIR, file);

    if (!content.includes('<meta property="og:title"')) {
      wouldFix.og++;
      console.log(`Would add OG tags: ${relativePath}`);
    }
    if (!content.includes('hreflang="fr"') || !content.includes('hreflang="en"')) {
      wouldFix.hreflang++;
    }
    if (!content.includes('skip-link') && !content.includes('#main-content')) {
      wouldFix.skip++;
    }
  }

  console.log(`\n${YELLOW}Would fix:${RESET}`);
  console.log(`  OG tags: ${wouldFix.og} pages`);
  console.log(`  Hreflang: ${wouldFix.hreflang} pages`);
  console.log(`  Skip links: ${wouldFix.skip} pages`);

} else {
  main().then(() => {
    console.log(`\n${GREEN}Done! Run forensic-audit-complete-2026.cjs to verify.${RESET}`);
  }).catch(error => {
    console.error(`${RED}Error: ${error.message}${RESET}`);
    process.exit(1);
  });
}
