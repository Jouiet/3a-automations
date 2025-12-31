#!/usr/bin/env node
/**
 * Replace footer trust badge emojis with modern SVG icons
 * Session 118 - 31/12/2025
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// SVG replacements
const LOCK_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`;
const SHIELD_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

function findHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, blog, academy directories
      if (!['node_modules', 'blog', 'academy', 'voice-assistant'].includes(file)) {
        results = results.concat(findHtmlFiles(filePath));
      }
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  }

  return results;
}

function replaceEmojis(content) {
  let modified = content;
  let changes = 0;
  const originalContent = content;

  // Replace French RGPD lock emoji (with or without title attribute)
  modified = modified.replace(
    /<span class="trust-badge"[^>]*>🔒\s*RGPD<\/span>/g,
    `<span class="trust-badge">${LOCK_SVG}RGPD</span>`
  );

  // Replace English GDPR lock emoji (with or without title attribute)
  modified = modified.replace(
    /<span class="trust-badge"[^>]*>🔒\s*GDPR<\/span>/g,
    `<span class="trust-badge">${LOCK_SVG}GDPR</span>`
  );

  // Replace SSL shield emoji (with or without title attribute)
  modified = modified.replace(
    /<span class="trust-badge"[^>]*>🛡️\s*SSL<\/span>/g,
    `<span class="trust-badge">${SHIELD_SVG}SSL</span>`
  );

  if (modified !== originalContent) {
    changes = 1;
  }

  return { content: modified, changes };
}

function main() {
  console.log('🔍 Scanning for HTML files...');

  const htmlFiles = findHtmlFiles(LANDING_DIR);
  console.log(`📁 Found ${htmlFiles.length} HTML files`);

  let totalModified = 0;
  let totalChanges = 0;

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file has emojis to replace
    if (content.includes('🔒') || content.includes('🛡️')) {
      const { content: newContent, changes } = replaceEmojis(content);

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        const relativePath = path.relative(LANDING_DIR, filePath);
        console.log(`✅ Modified: ${relativePath}`);
        totalModified++;
        totalChanges += changes;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files modified: ${totalModified}`);
  console.log(`   Total emoji replacements: ${totalChanges}`);
}

main();
