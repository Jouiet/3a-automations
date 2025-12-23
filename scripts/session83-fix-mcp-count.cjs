#!/usr/bin/env node
/**
 * SESSION 83 - FIX MCP COUNT (FACTUALITY)
 * Change "12 MCPs" to "9 MCPs" to reflect reality
 *
 * VERIFICATION:
 * - chrome-devtools: ✅ functional (npx)
 * - playwright: ✅ functional (npx)
 * - gemini: ✅ functional (API key present)
 * - github: ✅ functional (token present)
 * - hostinger: ✅ functional (token present)
 * - klaviyo: ✅ functional (API key present)
 * - google-analytics: ✅ functional (service account)
 * - google-sheets: ✅ functional (service account)
 * - apify: ✅ functional (token present)
 * - shopify: ❌ PLACEHOLDER
 * - n8n: ❌ PLACEHOLDER
 * - wordpress: ❓ needs config
 * - powerbi-remote: ❓ needs auth
 *
 * TOTAL FUNCTIONAL: 9
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');

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

let totalFixes = 0;

function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('   SESSION 83 - FIX MCP COUNT (FACTUALITY)');
  console.log('   Changing: 12 MCPs → 9 MCPs (verified functional)');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const htmlFiles = getAllHtmlFiles(SITE_DIR);
  console.log(`📁 Processing ${htmlFiles.length} HTML files...\n`);

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf-8');
    const original = html;

    // Replace French versions
    html = html.replace(/12\s*MCPs?\s*actifs/gi, '9 MCPs fonctionnels');
    html = html.replace(/>12<\/span>\s*<[^>]*>\s*MCPs/gi, '>9</span><span class="stat-label-ultra">MCPs');

    // Replace English versions
    html = html.replace(/12\s*(?:active\s*)?MCPs/gi, '9 Active MCPs');
    html = html.replace(/<strong>12<\/strong>\s*(?:active\s*)?MCPs/gi, '<strong>9</strong> Active MCPs');

    // Replace data-count attributes
    html = html.replace(/data-count="12"([^>]*>)12/g, 'data-count="9"$19');

    if (html !== original) {
      const relativePath = file.replace(SITE_DIR, '');
      console.log(`  ✅ ${relativePath}: Fixed MCP count`);
      fs.writeFileSync(file, html);
      totalFixes++;
    }
  }

  console.log('\n───────────────────────────────────────────────────────────────────────');
  console.log(`✅ FILES UPDATED: ${totalFixes}`);
  console.log('───────────────────────────────────────────────────────────────────────\n');
}

main();
