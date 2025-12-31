#!/usr/bin/env node
/**
 * Add Investor Link to Footer
 * Session 118 - 31/12/2025
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Patterns to add investor link
const FR_PATTERN = /<li><a href="mailto:contact@3a-automation\.com">contact@3a-automation\.com<\/a><\/li>/;
const FR_REPLACEMENT = `<li><a href="mailto:contact@3a-automation.com">contact@3a-automation.com</a></li>
            <li><a href="/investisseurs.html">💼 Investisseurs</a></li>`;

const EN_PATTERN = /<li><a href="mailto:contact@3a-automation\.com">contact@3a-automation\.com<\/a><\/li>/;
const EN_REPLACEMENT = `<li><a href="mailto:contact@3a-automation.com">contact@3a-automation.com</a></li>
            <li><a href="/en/investors.html">💼 Investors</a></li>`;

function findHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'academy' && item !== 'academie') {
      findHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(LANDING_DIR, filePath);
  
  // Skip investor pages themselves
  if (filePath.includes('investisseurs.html') || filePath.includes('investors.html')) {
    return { file: relativePath, status: 'skip-investor-page' };
  }
  
  // Check if already has investor link
  if (content.includes('investisseurs.html') || content.includes('investors.html')) {
    return { file: relativePath, status: 'already-done' };
  }
  
  // Determine if FR or EN
  const isEN = filePath.includes('/en/');
  
  if (isEN) {
    if (EN_PATTERN.test(content)) {
      content = content.replace(EN_PATTERN, EN_REPLACEMENT);
      fs.writeFileSync(filePath, content, 'utf8');
      return { file: relativePath, status: 'updated-en' };
    }
  } else {
    if (FR_PATTERN.test(content)) {
      content = content.replace(FR_PATTERN, FR_REPLACEMENT);
      fs.writeFileSync(filePath, content, 'utf8');
      return { file: relativePath, status: 'updated-fr' };
    }
  }
  
  return { file: relativePath, status: 'no-match' };
}

console.log('🔧 Adding investor link to footer...\n');

const htmlFiles = findHtmlFiles(LANDING_DIR);
console.log(`Found ${htmlFiles.length} HTML files\n`);

let updated = 0, skipped = 0, noMatch = 0;

for (const file of htmlFiles) {
  const result = processFile(file);
  
  switch (result.status) {
    case 'updated-fr':
    case 'updated-en':
      console.log(`✅ ${result.file}`);
      updated++;
      break;
    case 'already-done':
    case 'skip-investor-page':
      skipped++;
      break;
    case 'no-match':
      console.log(`⚠️  ${result.file} (no match)`);
      noMatch++;
      break;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updated}`);
console.log(`   Skipped: ${skipped}`);
console.log(`   No match: ${noMatch}`);
