#!/usr/bin/env node
/**
 * Fix footer automation count: 66 → 70
 * Also fixes malformed HTML attributes
 * Date: 2025-12-23
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Find all HTML files
const htmlFiles = glob.sync('**/*.html', { cwd: SITE_DIR });

let totalFixed = 0;
let filesModified = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(SITE_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  let fixes = [];

  // Fix 1: Update automation count 66 → 70
  if (content.includes('72 Automations')) {
    content = content.replace(/72 Automations/g, '72 Automations');
    fixes.push('66→72 Automations (EN)');
  }
  if (content.includes('72 automatisations')) {
    content = content.replace(/72 automatisations/g, '72 automatisations');
    fixes.push('66→72 automatisations (FR)');
  }

  // Fix 2: Malformed image attributes (/ loading="lazy" → loading="lazy" /)
  const malformedPattern = /\/ loading="lazy">/g;
  if (malformedPattern.test(content)) {
    content = content.replace(malformedPattern, ' loading="lazy">');
    fixes.push('Fixed malformed loading attribute');
  }

  // Fix 3: Double spaces in attributes
  content = content.replace(/width="40"  height="40"/g, 'width="40" height="40"');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    filesModified++;
    totalFixed += fixes.length;
    console.log(`✅ ${file}: ${fixes.join(', ')}`);
  }
});

console.log(`\n═══════════════════════════════════════════════════`);
console.log(`Total: ${filesModified} files modified, ${totalFixed} fixes applied`);
