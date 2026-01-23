#!/usr/bin/env node
/**
 * AUTO CSS VERSION BUMPER
 * Automatically increments CSS version in all HTML files when styles.css changes
 *
 * @version 1.0.0
 * @date 2026-01-23
 * @session 142
 *
 * PROBLÈME RÉSOLU:
 * - CSS changes not visible due to browser caching
 * - Manual version bumping error-prone and often forgotten
 *
 * Usage:
 *   node scripts/bump-css-version.cjs [--check] [--dry-run]
 *
 * Git hook integration:
 *   Add to .git/hooks/pre-commit or use husky
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
const CSS_FILE = path.join(SITE_DIR, 'styles.css');

// ════════════════════════════════════════════════════════════════════════════
// ARGUMENTS
// ════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const DRY_RUN = args.includes('--dry-run');

// ════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════════

function findHtmlFiles(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...findHtmlFiles(fullPath));
      } else if (item.isFile() && item.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Skip
  }
  return files;
}

function getCurrentVersion(htmlFiles) {
  // Get version from first HTML file
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/styles\.css\?v=(\d+\.\d+)/);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return 1.0;
}

function isCssModified() {
  try {
    // Check if styles.css is in the staged files
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return staged.includes('styles.css');
  } catch (e) {
    // Git not available, check file modification
    return true;
  }
}

function getVersionsInFiles(htmlFiles) {
  const versions = new Map();
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/styles\.css\?v=(\d+\.\d+)/);
    if (match) {
      const version = match[1];
      if (!versions.has(version)) {
        versions.set(version, []);
      }
      versions.get(version).push(path.relative(SITE_DIR, file));
    }
  }
  return versions;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

console.log('════════════════════════════════════════════════════════════════');
console.log('  CSS VERSION BUMPER');
console.log('════════════════════════════════════════════════════════════════');

const htmlFiles = findHtmlFiles(SITE_DIR);
console.log(`\n📂 Found ${htmlFiles.length} HTML files`);

// Check version consistency
const versions = getVersionsInFiles(htmlFiles);
console.log(`\n📊 Version distribution:`);
for (const [version, files] of versions.entries()) {
  console.log(`  v=${version}: ${files.length} files`);
}

if (versions.size > 1) {
  console.log('\n⚠️  WARNING: Multiple CSS versions detected!');
  for (const [version, files] of versions.entries()) {
    console.log(`\n  v=${version}:`);
    files.slice(0, 5).forEach(f => console.log(`    - ${f}`));
    if (files.length > 5) console.log(`    ... and ${files.length - 5} more`);
  }
}

if (CHECK_ONLY) {
  if (versions.size > 1) {
    console.log('\n❌ CHECK FAILED: Version inconsistency detected');
    process.exit(1);
  }
  console.log('\n✅ CHECK PASSED: All files have consistent CSS version');
  process.exit(0);
}

// Bump version
const currentVersion = getCurrentVersion(htmlFiles);
const newVersion = (currentVersion + 1).toFixed(1);

console.log(`\n🔄 Bumping version: v=${currentVersion} → v=${newVersion}`);

if (DRY_RUN) {
  console.log('\n🔍 DRY RUN - No changes will be made');
  console.log(`Would update ${htmlFiles.length} files`);
  process.exit(0);
}

// Update all HTML files
let updated = 0;
const versionPattern = /styles\.css\?v=\d+\.\d+/g;
const newVersionString = `styles.css?v=${newVersion}`;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;

  content = content.replace(versionPattern, newVersionString);

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updated++;
  }
}

console.log(`\n✅ Updated ${updated} files to v=${newVersion}`);

// Also update minified CSS if it exists
const cssMinPath = path.join(SITE_DIR, 'styles.min.css');
if (fs.existsSync(cssMinPath)) {
  // Re-minify CSS
  try {
    const cssContent = fs.readFileSync(CSS_FILE, 'utf8');
    // Simple minification (remove comments, extra whitespace)
    const minified = cssContent
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
    fs.writeFileSync(cssMinPath, minified, 'utf8');
    console.log('✅ Re-minified styles.min.css');
  } catch (e) {
    console.log('⚠️  Could not minify CSS:', e.message);
  }
}

console.log('\n════════════════════════════════════════════════════════════════');
console.log('  DONE - Remember to commit the version changes!');
console.log('════════════════════════════════════════════════════════════════');
