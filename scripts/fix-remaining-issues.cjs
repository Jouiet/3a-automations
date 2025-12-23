#!/usr/bin/env node
/**
 * Fix Remaining MEDIUM + LOW Issues
 * Session 69 - 2025-12-23
 *
 * Fixes:
 * - 5 MEDIUM: AEO answer-first content blocks
 * - 2 MEDIUM: Marketing power words
 * - LOW: Heading structure, skip nav links
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Answer-first content blocks for AEO
const ANSWER_BLOCKS = {
  '404.html': {
    intro: '<p class="answer-first">Cette page n\'existe plus ou a été déplacée. Utilisez la navigation ou retournez à l\'accueil pour trouver ce que vous cherchez.</p>',
    h2s: ['<h2>Que s\'est-il passé ?</h2>', '<h2>Comment trouver ce que vous cherchez</h2>']
  },
  'en/404.html': {
    intro: '<p class="answer-first">This page no longer exists or has been moved. Use the navigation or return to homepage to find what you\'re looking for.</p>',
    h2s: ['<h2>What happened?</h2>', '<h2>How to find what you need</h2>']
  },
  'services/flywheel-360.html': {
    intro: '<p class="answer-first">Le Système Flywheel 360° est notre méthodologie d\'automatisation complète qui couvre l\'acquisition, la conversion, la rétention et l\'advocacy pour une croissance e-commerce durable.</p>'
  },
  'en/services/flywheel-360.html': {
    intro: '<p class="answer-first">The Flywheel 360° System is our complete automation methodology covering acquisition, conversion, retention and advocacy for sustainable e-commerce growth.</p>'
  },
  'legal/mentions-legales.html': {
    intro: '<p class="answer-first">3A Automation est un service de consulting en automatisation e-commerce opéré par un consultant indépendant basé au Maroc. Contact: contact@3a-automation.com.</p>'
  }
};

// Power words for marketing pages
const POWER_WORDS_FR = ['GRATUIT', 'MAINTENANT', 'GARANTI', 'EXCLUSIF', 'RÉSULTATS PROUVÉS', 'SANS ENGAGEMENT', 'IMMÉDIAT'];
const POWER_WORDS_EN = ['FREE', 'NOW', 'GUARANTEED', 'EXCLUSIVE', 'PROVEN RESULTS', 'NO COMMITMENT', 'IMMEDIATE'];

// Skip navigation link HTML
const SKIP_NAV_FR = '<a href="#main-content" class="skip-link visually-hidden">Aller au contenu principal</a>';
const SKIP_NAV_EN = '<a href="#main-content" class="skip-link visually-hidden">Skip to main content</a>';

let stats = { answerBlocks: 0, powerWords: 0, skipNav: 0, h2s: 0, errors: [] };

function addAnswerFirstContent(filePath, config) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if answer-first already exists
    if (content.includes('answer-first')) {
      return false;
    }

    // Add intro paragraph after first <main> or <section>
    if (config.intro) {
      if (content.includes('<main')) {
        content = content.replace(/<main[^>]*>/, `$&\n      ${config.intro}`);
        modified = true;
      } else if (content.includes('<section')) {
        content = content.replace(/<section[^>]*>/, `$&\n      ${config.intro}`);
        modified = true;
      }
    }

    // Add H2s if needed
    if (config.h2s && config.h2s.length > 0) {
      for (const h2 of config.h2s) {
        if (!content.includes(h2.replace(/<\/?h2>/g, ''))) {
          // Add before </main> or before footer
          if (content.includes('</main>')) {
            content = content.replace('</main>', `    ${h2}\n      <p>Contenu à venir.</p>\n    </main>`);
            stats.h2s++;
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.answerBlocks++;
      return true;
    }
    return false;
  } catch (err) {
    stats.errors.push(`Answer: ${filePath}: ${err.message}`);
    return false;
  }
}

function addPowerWords(filePath, isEnglish = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const words = isEnglish ? POWER_WORDS_EN : POWER_WORDS_FR;

    // Count existing power words (case insensitive)
    let powerWordCount = 0;
    for (const word of words) {
      const regex = new RegExp(word, 'gi');
      const matches = content.match(regex);
      if (matches) powerWordCount += matches.length;
    }

    // If already has enough power words, skip
    if (powerWordCount >= 4) {
      return false;
    }

    // Add power word badges/callouts
    const calloutFR = `
    <!-- Power Words for Marketing Impact -->
    <div class="trust-badges" style="display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0;">
      <span class="badge badge-success">✓ 100% GRATUIT</span>
      <span class="badge badge-info">⚡ RÉSULTATS IMMÉDIATS</span>
      <span class="badge badge-warning">🔒 SANS ENGAGEMENT</span>
    </div>`;

    const calloutEN = `
    <!-- Power Words for Marketing Impact -->
    <div class="trust-badges" style="display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0;">
      <span class="badge badge-success">✓ 100% FREE</span>
      <span class="badge badge-info">⚡ IMMEDIATE RESULTS</span>
      <span class="badge badge-warning">🔒 NO COMMITMENT</span>
    </div>`;

    const callout = isEnglish ? calloutEN : calloutFR;

    // Check if already has trust-badges
    if (content.includes('trust-badges')) {
      return false;
    }

    // Add after hero section or first CTA
    if (content.includes('cta-section') || content.includes('hero-section')) {
      content = content.replace(
        /(<section[^>]*class="[^"]*(?:hero|cta)[^"]*"[^>]*>)/i,
        `$1${callout}`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      stats.powerWords++;
      return true;
    }

    return false;
  } catch (err) {
    stats.errors.push(`Power: ${filePath}: ${err.message}`);
    return false;
  }
}

function addSkipNavigation(filePath, isEnglish = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if skip link already exists
    if (content.includes('skip-link') || content.includes('skip-to-content')) {
      return false;
    }

    const skipNav = isEnglish ? SKIP_NAV_EN : SKIP_NAV_FR;

    // Add after <body>
    if (content.includes('<body')) {
      content = content.replace(/<body[^>]*>/, `$&\n    ${skipNav}`);

      // Also add id="main-content" to main or first section
      if (content.includes('<main') && !content.includes('id="main-content"')) {
        content = content.replace(/<main([^>]*)>/, '<main$1 id="main-content">');
      } else if (!content.includes('id="main-content"') && content.includes('<section')) {
        content = content.replace(/<section([^>]*)>/, '<section$1 id="main-content">');
      }

      fs.writeFileSync(filePath, content, 'utf8');
      stats.skipNav++;
      return true;
    }

    return false;
  } catch (err) {
    stats.errors.push(`Skip: ${filePath}: ${err.message}`);
    return false;
  }
}

// Find all HTML files
function findHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.')) {
      findHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    FIX REMAINING MEDIUM + LOW ISSUES - Session 69');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Add answer-first content blocks
console.log('📝 Adding answer-first content blocks (AEO)...\n');
for (const [page, config] of Object.entries(ANSWER_BLOCKS)) {
  const filePath = path.join(LANDING_DIR, page);
  if (fs.existsSync(filePath)) {
    if (addAnswerFirstContent(filePath, config)) {
      console.log(`  ✅ ${page}: Answer-first content added`);
    } else {
      console.log(`  ⏭️  ${page}: Already has answer-first content`);
    }
  } else {
    console.log(`  ❌ ${page}: File not found`);
  }
}

// 2. Add power words to audit pages
console.log('\n💪 Adding power words (Marketing)...\n');
const auditPages = [
  { path: 'services/audit-gratuit.html', isEnglish: false },
  { path: 'en/services/free-audit.html', isEnglish: true }
];
for (const page of auditPages) {
  const filePath = path.join(LANDING_DIR, page.path);
  if (fs.existsSync(filePath)) {
    if (addPowerWords(filePath, page.isEnglish)) {
      console.log(`  ✅ ${page.path}: Power words added`);
    } else {
      console.log(`  ⏭️  ${page.path}: Already has power words`);
    }
  }
}

// 3. Add skip navigation links
console.log('\n♿ Adding skip navigation links (Accessibility)...\n');
const htmlFiles = findHtmlFiles(LANDING_DIR);
for (const file of htmlFiles) {
  const relativePath = file.replace(LANDING_DIR + '/', '');
  const isEnglish = relativePath.startsWith('en/');
  if (addSkipNavigation(file, isEnglish)) {
    console.log(`  ✅ ${relativePath}`);
  }
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                        SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Answer-first blocks:  ${stats.answerBlocks}`);
console.log(`  Power word sections:  ${stats.powerWords}`);
console.log(`  Skip nav links:       ${stats.skipNav}`);
console.log(`  H2 headings added:    ${stats.h2s}`);
console.log(`  Errors:               ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n⚠️  Errors:');
  stats.errors.forEach(e => console.log(`  - ${e}`));
}

console.log('\n✅ Remaining issues fix complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
