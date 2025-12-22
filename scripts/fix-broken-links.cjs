#!/usr/bin/env node
/**
 * FIX BROKEN LINKS - 3A Automation
 * Corrects all double-slash (//) links to single-slash (/)
 *
 * Date: 2025-12-22
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');

function findFiles(dir, ext) {
  const files = [];
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('           FIX BROKEN LINKS - 3A Automation');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Date: ${new Date().toISOString()}\n`);

const htmlFiles = findFiles(SITE_DIR, '.html');
console.log(`Found ${htmlFiles.length} HTML files to process\n`);

let totalFixes = 0;
const fixedFiles = [];

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  const originalContent = content;

  // Fix href="//path" to href="/path" (but not external URLs)
  // Pattern: href="//" not followed by http or a domain
  content = content.replace(/href="\/\/(?!http|www\.|[a-z]+\.[a-z])/g, 'href="/');

  // Fix src="//path" to src="/path" (but not CDN URLs)
  // Pattern: src="//" not followed by http, www., or common CDNs
  content = content.replace(/src="\/\/(?!http|www\.|googletagmanager|fonts\.|cdnjs\.|unpkg|jsdelivr)/g, 'src="/');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    const relPath = file.replace(SITE_DIR, '');
    const fixes = (content.match(/href="\//g) || []).length - (originalContent.match(/href="\//g) || []).length;
    console.log(`✅ Fixed: ${relPath}`);
    fixedFiles.push(relPath);
    totalFixes++;
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`✅ Fixed ${totalFixes} files`);
console.log('═══════════════════════════════════════════════════════════════');

// Verification: Count remaining double slashes
console.log('\n🔍 Verification - checking for remaining issues...');
let remainingIssues = 0;

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check for remaining double slash issues (excluding legitimate ones)
    const badPatterns = line.match(/(?:href|src)="\/\/(?!http|www\.|googletagmanager|fonts\.|cdnjs|unpkg|jsdelivr|schema\.org)/g);
    if (badPatterns) {
      console.log(`   ⚠️  Remaining issue: ${file.replace(SITE_DIR, '')}:${idx + 1}`);
      remainingIssues++;
    }
  });
}

if (remainingIssues === 0) {
  console.log('   ✅ All double-slash links fixed!\n');
} else {
  console.log(`   ⚠️  ${remainingIssues} issues remaining\n`);
}

process.exit(remainingIssues > 0 ? 1 : 0);
