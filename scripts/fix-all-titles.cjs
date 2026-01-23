#!/usr/bin/env node
/**
 * FIX ALL TITLES - Automated Title Standardization
 *
 * This script finds and fixes ALL h1 and h2 tags that are missing
 * standardized classes according to the design system.
 *
 * @version 1.0.0
 * @date 2026-01-23
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Files/paths to SKIP (content pages where bare titles are acceptable)
const SKIP_PATHS = [
  '/blog/',
  '/legal/',
  '/academie/cours/',
  '/academy/courses/',
  '/academie/guides',
  '/academy/guides'
];

// Stats
let stats = {
  filesScanned: 0,
  h1Fixed: 0,
  h2Fixed: 0,
  errors: []
};

function findFiles(dir, extension) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...findFiles(fullPath, extension));
      } else if (item.isFile() && item.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

function shouldSkip(filePath) {
  const relPath = path.relative(SITE_DIR, filePath);
  return SKIP_PATHS.some(skip => relPath.includes(skip.replace(/^\//, '')));
}

function fixTitles(filePath) {
  const relPath = path.relative(SITE_DIR, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX H1 TAGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Pattern: <h1>text</h1> or <h1>text<span>...</span></h1> without class
  // Should become: <h1 class="hero-title-ultra">...</h1>

  const h1BarePattern = /<h1>([^]*?)<\/h1>/g;
  let h1Match;
  while ((h1Match = h1BarePattern.exec(content)) !== null) {
    const fullMatch = h1Match[0];
    const innerContent = h1Match[1];

    // Check context - is it in a hero section?
    const start = Math.max(0, h1Match.index - 500);
    const context = content.substring(start, h1Match.index);

    let newClass = 'page-title-ultra'; // Default

    if (context.includes('hero') || context.includes('Hero')) {
      newClass = 'hero-title-ultra';
    }

    const replacement = `<h1 class="${newClass}">${innerContent}</h1>`;
    content = content.replace(fullMatch, replacement);
    modified = true;
    stats.h1Fixed++;
    console.log(`  [H1] ${relPath}: Added class="${newClass}"`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX H2 TAGS IN SPECIFIC CONTEXTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Pattern: <h2>text</h2> without class
  const h2BarePattern = /<h2>([^<]+)<\/h2>/g;
  let h2Match;

  // We need to be careful not to mess up already processed content
  // So we'll collect all replacements first
  const h2Replacements = [];

  while ((h2Match = h2BarePattern.exec(content)) !== null) {
    const fullMatch = h2Match[0];
    const text = h2Match[1].trim();

    // Check context (500 chars before)
    const start = Math.max(0, h2Match.index - 500);
    const context = content.substring(start, h2Match.index);

    // Determine appropriate class based on context
    let newClass = null;

    // Section contexts that need section-title-ultra
    if (context.includes('category-header') ||
        context.includes('cta-section') ||
        context.includes('cta-content') ||
        context.includes('faq-section') ||
        context.includes('faq-category') ||
        context.includes('faq-cta') ||
        context.includes('flywheel-cta') ||
        context.includes('class="cta"') ||
        context.includes('section-header')) {
      newClass = 'section-title-ultra';
    }
    // Card/box contexts - use card-title
    else if (context.includes('card') ||
             context.includes('contact-info') ||
             context.includes('pricing-card') ||
             context.includes('accordion')) {
      newClass = 'card-title';
    }
    // Vision/mission boxes
    else if (context.includes('vision') ||
             context.includes('mission') ||
             context.includes('values')) {
      newClass = 'box-title';
    }

    if (newClass) {
      h2Replacements.push({
        original: fullMatch,
        replacement: `<h2 class="${newClass}">${text}</h2>`,
        text: text.substring(0, 30),
        class: newClass
      });
    }
  }

  // Apply replacements
  for (const r of h2Replacements) {
    if (content.includes(r.original)) {
      content = content.replace(r.original, r.replacement);
      modified = true;
      stats.h2Fixed++;
      console.log(`  [H2] ${relPath}: "${r.text}..." → class="${r.class}"`);
    }
  }

  // Save if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return modified;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('═'.repeat(70));
console.log('  FIX ALL TITLES - Automated Title Standardization');
console.log('═'.repeat(70));
console.log('');

const htmlFiles = findFiles(SITE_DIR, '.html');
console.log(`Found ${htmlFiles.length} HTML files\n`);

for (const file of htmlFiles) {
  if (shouldSkip(file)) {
    continue;
  }

  stats.filesScanned++;
  fixTitles(file);
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════════════════════

console.log('');
console.log('═'.repeat(70));
console.log('  RESULTS');
console.log('═'.repeat(70));
console.log(`  Files scanned: ${stats.filesScanned}`);
console.log(`  H1 tags fixed: ${stats.h1Fixed}`);
console.log(`  H2 tags fixed: ${stats.h2Fixed}`);
console.log(`  Total fixed:   ${stats.h1Fixed + stats.h2Fixed}`);
console.log('═'.repeat(70));

if (stats.h1Fixed + stats.h2Fixed > 0) {
  console.log('\n✅ Titles fixed. Run validation to verify.');
} else {
  console.log('\n✅ No bare titles found that need fixing.');
}
