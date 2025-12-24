#!/usr/bin/env node
/**
 * Add Dashboard Link to All Pages
 * Session 88 - 2024-12-24
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

const DASHBOARD_LINK_FR = `        <a href="https://dashboard.3a-automation.com" class="btn-nav btn-dashboard" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </a>`;

const DASHBOARD_LINK_EN = DASHBOARD_LINK_FR;

let stats = { updated: 0, skipped: 0, errors: 0 };

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const isEnglish = filePath.includes('/en/');

    // Skip if already has dashboard link
    if (content.includes('btn-dashboard') || content.includes('dashboard.3a-automation.com')) {
      console.log(`  ⏭️  ${path.basename(filePath)}: Already has dashboard link`);
      stats.skipped++;
      return;
    }

    // Find the nav and add dashboard link
    // Pattern for FR: before lang-switch "EN"
    // Pattern for EN: after contact btn

    if (isEnglish) {
      // English: Add after contact button
      const contactPattern = /<a href="\.\.#contact" class="btn-nav">\s*<span>Contact<\/span>\s*<svg[^>]*>[^<]*<path[^\/]*\/>\s*<\/svg>\s*<\/a>/s;
      if (content.match(contactPattern)) {
        content = content.replace(contactPattern, (match) => {
          return match + '\n' + DASHBOARD_LINK_EN;
        });
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ ${path.basename(filePath)}: Dashboard link added (EN)`);
        stats.updated++;
        return;
      }
    } else {
      // French: Add before lang-switch
      const langPattern = /<a href="\/en\/" class="lang-switch" title="Switch to English">EN<\/a>/;
      if (content.match(langPattern)) {
        content = content.replace(langPattern, DASHBOARD_LINK_FR + '\n' + '        <a href="/en/" class="lang-switch" title="Switch to English">EN</a>');
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ ${path.basename(filePath)}: Dashboard link added (FR)`);
        stats.updated++;
        return;
      }
    }

    console.log(`  ⚠️  ${path.basename(filePath)}: Could not find insertion point`);
    stats.skipped++;
  } catch (error) {
    console.log(`  ❌ ${path.basename(filePath)}: ${error.message}`);
    stats.errors++;
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Skip certain directories
      if (!['voice-assistant', 'legal', 'assets', 'css', 'js'].includes(file.name)) {
        scanDirectory(fullPath);
      }
    } else if (file.name.endsWith('.html') && file.name !== '404.html' && file.name !== '500.html') {
      processFile(fullPath);
    }
  }
}

console.log('='.repeat(50));
console.log('ADD DASHBOARD LINK TO ALL PAGES');
console.log('='.repeat(50));
console.log('');

// Process main pages
console.log('Processing French pages:');
scanDirectory(LANDING_DIR);

console.log('');
console.log('Processing English pages:');
scanDirectory(path.join(LANDING_DIR, 'en'));

console.log('');
console.log('='.repeat(50));
console.log('RESULTS');
console.log('='.repeat(50));
console.log(`Updated: ${stats.updated}`);
console.log(`Skipped: ${stats.skipped}`);
console.log(`Errors: ${stats.errors}`);
