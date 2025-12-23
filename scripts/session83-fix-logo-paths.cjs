#!/usr/bin/env node
/**
 * SESSION 83 - FIX LOGO PATHS
 * Normalize all logo paths to absolute /logo.webp
 * Date: 2025-12-23
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
  console.log('   SESSION 83 - FIX LOGO PATHS');
  console.log('   Normalizing: ../logo.webp, ../../logo.webp → /logo.webp');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const htmlFiles = getAllHtmlFiles(SITE_DIR);
  console.log(`📁 Processing ${htmlFiles.length} HTML files...\n`);

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf-8');
    const original = html;

    // Fix relative paths to absolute
    html = html.replace(/src="\.\.\/\.\.\/logo\.webp"/g, 'src="/logo.webp"');
    html = html.replace(/src="\.\.\/logo\.webp"/g, 'src="/logo.webp"');

    if (html !== original) {
      const relativePath = file.replace(SITE_DIR, '');
      const count = (original.match(/src="\.\..*logo\.webp"/g) || []).length;
      console.log(`  ✅ ${relativePath}: Fixed ${count} logo path(s)`);
      fs.writeFileSync(file, html);
      totalFixes += count;
    }
  }

  console.log('\n───────────────────────────────────────────────────────────────────────');
  console.log(`✅ TOTAL LOGO PATHS FIXED: ${totalFixes}`);
  console.log('───────────────────────────────────────────────────────────────────────\n');
}

main();
