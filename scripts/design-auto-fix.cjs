#!/usr/bin/env node
/**
 * DESIGN AUTO-FIX - Automated Design System Enforcement
 *
 * @version 1.0.0
 * @date 2026-01-23
 * @session 142ter
 *
 * Ce script CORRIGE automatiquement les problèmes de design, pas juste les détecte.
 *
 * PROBLÈMES CORRIGÉS AUTOMATIQUEMENT:
 * 1. CSS version inconsistency → Auto-bump
 * 2. Missing category-icon CSS → Auto-generate
 * 3. Missing gradient on title classes → Validate
 * 4. SVG hardcoded colors → Auto-replace with currentColor
 * 5. Bare H1/H2 tags → Auto-add classes
 *
 * Usage:
 *   node scripts/design-auto-fix.cjs           # Auto-fix all issues
 *   node scripts/design-auto-fix.cjs --check   # Check only, exit 1 if issues
 *   node scripts/design-auto-fix.cjs --ci      # CI mode, exit 1 on unfixable
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
const CSS_FILE = path.join(SITE_DIR, 'styles.css');

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const CI_MODE = args.includes('--ci');

let fixedCount = 0;
let errorCount = 0;

console.log('═'.repeat(70));
console.log('  DESIGN AUTO-FIX');
console.log('  Mode:', CHECK_ONLY ? 'CHECK ONLY' : 'AUTO-FIX');
console.log('═'.repeat(70));

// ════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════════

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

function isCSSStaged() {
  try {
    const staged = execSync('git diff --cached --name-only 2>/dev/null', { encoding: 'utf8' });
    return staged.includes('styles.css');
  } catch (e) {
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FIX 1: CSS VERSION CONSISTENCY
// ════════════════════════════════════════════════════════════════════════════

function fixCSSVersion() {
  console.log('\n🔄 [1/4] Checking CSS Version Consistency...');

  const htmlFiles = findFiles(SITE_DIR, '.html');
  const versions = new Map();
  const filesWithoutVersion = [];

  // Collect all versions
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/styles\.css\?v=(\d+\.?\d*)/);
    if (match) {
      const version = match[1];
      if (!versions.has(version)) versions.set(version, []);
      versions.get(version).push(file);
    } else if (content.includes('styles.css')) {
      filesWithoutVersion.push(file);
    }
  }

  // Check if CSS was modified (staged or working)
  const cssModified = isCSSStaged();

  if (versions.size === 1 && filesWithoutVersion.length === 0 && !cssModified) {
    const [version] = versions.keys();
    console.log(`  ✅ All ${htmlFiles.length} files use v=${version}`);
    return;
  }

  if (CHECK_ONLY) {
    if (versions.size > 1) {
      console.log(`  ❌ Multiple versions: ${[...versions.keys()].join(', ')}`);
      errorCount++;
    }
    if (filesWithoutVersion.length > 0) {
      console.log(`  ❌ ${filesWithoutVersion.length} files without version parameter`);
      errorCount++;
    }
    if (cssModified) {
      console.log(`  ⚠️  styles.css modified - version bump needed`);
      errorCount++;
    }
    return;
  }

  // AUTO-FIX: Determine new version
  let currentMax = 0;
  for (const v of versions.keys()) {
    const num = parseFloat(v);
    if (num > currentMax) currentMax = num;
  }

  // Bump if CSS modified or inconsistency
  const needsBump = cssModified || versions.size > 1;
  const newVersion = needsBump ? (currentMax + 1).toFixed(1) : currentMax.toFixed(1);

  // Update all HTML files
  const versionPatterns = [
    /styles\.css\?v=\d+\.?\d*/g,
    /styles\.css(?=["'])/g  // styles.css without version
  ];

  let updated = 0;
  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Replace existing versions
    content = content.replace(/styles\.css\?v=\d+\.?\d*/g, `styles.css?v=${newVersion}`);
    // Add version to unversioned (multiple path patterns)
    content = content.replace(/href="styles\.css"/g, `href="styles.css?v=${newVersion}"`);
    content = content.replace(/href="\.\.\/styles\.css"/g, `href="../styles.css?v=${newVersion}"`);
    content = content.replace(/href="\.\.\/\.\.\/styles\.css"/g, `href="../../styles.css?v=${newVersion}"`);
    content = content.replace(/href="\.\.\/\.\.\/\.\.\/styles\.css"/g, `href="../../../styles.css?v=${newVersion}"`);

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      updated++;
    }
  }

  if (updated > 0) {
    console.log(`  🔧 FIXED: Updated ${updated} files to v=${newVersion}`);
    fixedCount++;

    // Re-minify CSS
    const minPath = path.join(SITE_DIR, 'styles.min.css');
    if (fs.existsSync(CSS_FILE)) {
      const cssContent = fs.readFileSync(CSS_FILE, 'utf8');
      const minified = cssContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
      fs.writeFileSync(minPath, minified, 'utf8');
      console.log(`  🔧 Re-minified styles.min.css`);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FIX 2: CATEGORY ICON CSS
// ════════════════════════════════════════════════════════════════════════════

function fixCategoryIcons() {
  console.log('\n🎯 [2/4] Checking Category Icon CSS...');

  const htmlFiles = findFiles(SITE_DIR, '.html');
  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  // Find all used category-icon classes
  const usedClasses = new Set();
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.matchAll(/class="category-icon\s+([a-zA-Zéèà]+)"/g);
    for (const match of matches) {
      usedClasses.add(match[1]);
    }
  }

  // Check which have CSS
  const missingCSS = [];
  for (const className of usedClasses) {
    const pattern = new RegExp(`\\.category-icon\\.${className}\\s*[,{]`);
    if (!pattern.test(cssContent)) {
      missingCSS.push(className);
    }
  }

  if (missingCSS.length === 0) {
    console.log(`  ✅ All ${usedClasses.size} category-icon classes have CSS`);
    return;
  }

  if (CHECK_ONLY) {
    console.log(`  ❌ Missing CSS for: ${missingCSS.join(', ')}`);
    errorCount++;
    return;
  }

  // AUTO-FIX: Generate CSS for missing classes
  // Color palette for auto-generation (rotating)
  const colorPalette = [
    { color: 'var(--primary)', bg: 'rgba(79, 186, 241, 0.2)' },
    { color: 'var(--accent)', bg: 'rgba(16, 185, 129, 0.2)' },
    { color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.2)' },
    { color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.2)' },
  ];

  let newCSS = '\n/* AUTO-GENERATED: Missing category-icon styles */\n';
  missingCSS.forEach((className, i) => {
    const palette = colorPalette[i % colorPalette.length];
    newCSS += `.category-icon.${className} {\n`;
    newCSS += `  background: linear-gradient(135deg, ${palette.bg} 0%, ${palette.bg.replace('0.2', '0.1')} 100%);\n`;
    newCSS += `  color: ${palette.color};\n`;
    newCSS += `}\n\n`;
  });

  // Insert before "/* Category headers" comment
  let updatedCSS = cssContent.replace(
    '/* Category headers use section-title-ultra',
    newCSS + '/* Category headers use section-title-ultra'
  );

  fs.writeFileSync(CSS_FILE, updatedCSS, 'utf8');
  console.log(`  🔧 FIXED: Generated CSS for: ${missingCSS.join(', ')}`);
  fixedCount++;
}

// ════════════════════════════════════════════════════════════════════════════
// FIX 3: TITLE GRADIENT CLASSES
// ════════════════════════════════════════════════════════════════════════════

function fixTitleGradients() {
  console.log('\n✨ [3/4] Checking Title Gradient Definitions...');

  const cssContent = fs.readFileSync(CSS_FILE, 'utf8');

  // Check if .section-title-ultra has gradient
  const sectionTitleMatch = cssContent.match(/\.section-title-ultra\s*\{([^}]+)\}/);
  if (!sectionTitleMatch) {
    console.log(`  ❌ .section-title-ultra not found`);
    errorCount++;
    return;
  }

  const hasGradient = sectionTitleMatch[1].includes('-webkit-background-clip') ||
                      sectionTitleMatch[1].includes('background-clip');

  if (hasGradient) {
    console.log(`  ✅ .section-title-ultra has gradient effect`);
  } else {
    console.log(`  ❌ .section-title-ultra missing gradient`);
    errorCount++;

    if (!CHECK_ONLY) {
      // This would be complex to auto-fix properly, so we warn
      console.log(`  ⚠️  Manual fix needed: Add gradient to .section-title-ultra`);
    }
  }

  // Check .hero-title .highlight
  const highlightPattern = /\.hero-title\s+\.highlight|h1\s+\.highlight/;
  if (highlightPattern.test(cssContent)) {
    console.log(`  ✅ .hero-title .highlight has CSS definition`);
  } else {
    console.log(`  ❌ .hero-title .highlight missing`);
    errorCount++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FIX 4: SVG CURRENTCOLOR
// ════════════════════════════════════════════════════════════════════════════

function fixSVGColors() {
  console.log('\n🎨 [4/4] Checking SVG Color Consistency...');

  const htmlFiles = findFiles(SITE_DIR, '.html');
  const allowedHardcoded = ['#EF4444', '#EA4B71', '#E4405F', '#95BF47', '#25F4EE', '#25D366'];

  let hardcodedCount = 0;
  let fixedFiles = 0;

  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Find hardcoded stroke colors
    const matches = [...content.matchAll(/stroke="#([A-Fa-f0-9]{6})"/g)];
    for (const match of matches) {
      const color = `#${match[1]}`;
      if (!allowedHardcoded.includes(color.toUpperCase())) {
        hardcodedCount++;
        if (!CHECK_ONLY) {
          content = content.replace(match[0], 'stroke="currentColor"');
        }
      }
    }

    if (content !== original && !CHECK_ONLY) {
      fs.writeFileSync(file, content, 'utf8');
      fixedFiles++;
    }
  }

  if (hardcodedCount === 0) {
    console.log(`  ✅ All SVG icons use currentColor or allowed brand colors`);
  } else if (CHECK_ONLY) {
    console.log(`  ❌ ${hardcodedCount} hardcoded colors found`);
    errorCount++;
  } else {
    console.log(`  🔧 FIXED: Replaced ${hardcodedCount} hardcoded colors in ${fixedFiles} files`);
    fixedCount++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FIX 5: BARE TITLE TAGS (H1/H2 without classes)
// ════════════════════════════════════════════════════════════════════════════

function fixBareTitles() {
  console.log('\n📝 [5/5] Checking Bare Title Tags...');

  const htmlFiles = findFiles(SITE_DIR, '.html');

  // Paths to skip (content pages where bare titles are acceptable)
  const skipPaths = ['/blog/', '/legal/', '/academie/cours/', '/academy/courses/', '/academie/guides', '/academy/guides'];

  let h1Fixed = 0;
  let h2Fixed = 0;

  for (const file of htmlFiles) {
    const relPath = path.relative(SITE_DIR, file);

    // Skip content pages
    if (skipPaths.some(skip => relPath.includes(skip.replace(/^\//, '')))) continue;

    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Fix bare H1 tags: <h1>text</h1> → <h1 class="hero-title-ultra">text</h1>
    const h1BarePattern = /<h1>([^]*?)<\/h1>/g;
    let h1Match;
    while ((h1Match = h1BarePattern.exec(original)) !== null) {
      const fullMatch = h1Match[0];
      const innerContent = h1Match[1];

      // Check context for hero section
      const start = Math.max(0, h1Match.index - 500);
      const context = original.substring(start, h1Match.index);
      const newClass = (context.includes('hero') || context.includes('Hero')) ? 'hero-title-ultra' : 'page-title-ultra';

      content = content.replace(fullMatch, `<h1 class="${newClass}">${innerContent}</h1>`);
      h1Fixed++;
    }

    // Fix bare H2 tags in section contexts
    const h2BarePattern = /<h2>([^<]+)<\/h2>/g;
    let h2Match;
    while ((h2Match = h2BarePattern.exec(original)) !== null) {
      const fullMatch = h2Match[0];
      const text = h2Match[1].trim();

      const start = Math.max(0, h2Match.index - 500);
      const context = original.substring(start, h2Match.index);

      let newClass = null;
      if (context.includes('category-header') || context.includes('cta-section') ||
          context.includes('cta-content') || context.includes('faq-section') ||
          context.includes('section-header')) {
        newClass = 'section-title-ultra';
      } else if (context.includes('card') || context.includes('accordion')) {
        newClass = 'card-title';
      }

      if (newClass) {
        content = content.replace(fullMatch, `<h2 class="${newClass}">${text}</h2>`);
        h2Fixed++;
      }
    }

    if (content !== original && !CHECK_ONLY) {
      fs.writeFileSync(file, content, 'utf8');
    }
  }

  const total = h1Fixed + h2Fixed;
  if (total === 0) {
    console.log(`  ✅ No bare title tags found`);
  } else if (CHECK_ONLY) {
    console.log(`  ❌ ${total} bare titles found (${h1Fixed} H1, ${h2Fixed} H2)`);
    errorCount++;
  } else {
    console.log(`  🔧 FIXED: ${total} bare titles (${h1Fixed} H1, ${h2Fixed} H2)`);
    fixedCount++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

fixCSSVersion();
fixCategoryIcons();
fixTitleGradients();
fixSVGColors();
fixBareTitles();

// Final report
console.log('\n' + '═'.repeat(70));
console.log('  RESULTS');
console.log('═'.repeat(70));

if (CHECK_ONLY) {
  if (errorCount === 0) {
    console.log('\n✅ ALL CHECKS PASSED');
    process.exit(0);
  } else {
    console.log(`\n❌ ${errorCount} ISSUES FOUND - Run without --check to auto-fix`);
    process.exit(1);
  }
} else {
  if (fixedCount > 0) {
    console.log(`\n🔧 AUTO-FIXED ${fixedCount} issues`);
    console.log('   Remember to commit these changes!');
  }
  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} issues require manual intervention`);
  }
  if (fixedCount === 0 && errorCount === 0) {
    console.log('\n✅ NO ISSUES FOUND');
  }
  process.exit(errorCount > 0 ? 1 : 0);
}
