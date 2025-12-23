#!/usr/bin/env node
/**
 * Fix Heading Hierarchy - WCAG 2.4.6
 *
 * Pages with H1 → H3 skipping need H3 changed to H2 for main sections
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');

// Pages that have H1 → H3 skipping with sections that should be H2
const PAGES_TO_FIX = {
  'a-propos.html': [
    'Notre Mission',
    'Notre Vision',
    'Nos Valeurs'
  ],
  'en/about.html': [
    'Our Mission',
    'Our Vision',
    'Our Values'
  ],
  'cas-clients.html': [
    'Notre Méthode',
    'Notre Approche',
    'Sécurité'
  ],
  'en/case-studies.html': [
    'Our Method',
    'Our Approach',
    'Security'
  ],
  'contact.html': [
    'Informations',
    'Horaires'
  ],
  'en/contact.html': [
    'Information',
    'Hours'
  ],
  'legal/politique-confidentialite.html': [
    'Données collectées',
    'Utilisation',
    'Cookies',
    'Vos droits',
    'Contact'
  ],
  'booking.html': [],
  'en/booking.html': []
};

let fixedCount = 0;

function fixPage(relativePath) {
  const filePath = path.join(SITE_DIR, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ File not found: ${relativePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Strategy 1: For known pages, convert specific H3s to H2s
  const sectionsToFix = PAGES_TO_FIX[relativePath];
  if (sectionsToFix && sectionsToFix.length > 0) {
    sectionsToFix.forEach(sectionTitle => {
      const h3Pattern = new RegExp(`<h3([^>]*)>${sectionTitle}</h3>`, 'gi');
      if (content.match(h3Pattern)) {
        content = content.replace(h3Pattern, `<h2$1>${sectionTitle}</h2>`);
        console.log(`  ✅ Changed H3 "${sectionTitle}" → H2: ${relativePath}`);
        modified = true;
        fixedCount++;
      }
    });
  }

  // Strategy 2: Generic fix - if first heading after H1 is H3, change to H2
  // This handles pillar sections like "Automation", "Analytics", "AI"

  // Find all h3s that are section headings (short text, likely titles)
  const h3Matches = content.match(/<h3[^>]*>([^<]{1,50})<\/h3>/gi) || [];

  // Check if page has no H2s before first H3 (after H1)
  const h1Index = content.indexOf('<h1');
  const firstH2Index = content.indexOf('<h2');
  const firstH3Index = content.indexOf('<h3');

  if (h1Index >= 0 && firstH3Index > h1Index) {
    if (firstH2Index < 0 || firstH2Index > firstH3Index) {
      // No H2 between H1 and first H3 - need to promote some H3s

      // Common pillar/feature H3s that should be H2s
      const pillarH3s = [
        'Automation',
        'Analytics',
        'AI',
        'Pilier',
        'Pillar'
      ];

      pillarH3s.forEach(pillar => {
        const pattern = new RegExp(`<h3([^>]*)>(${pillar}[^<]*)</h3>`, 'gi');
        if (content.match(pattern)) {
          content = content.replace(pattern, '<h2$1>$2</h2>');
          console.log(`  ✅ Promoted pillar H3 "${pillar}" → H2: ${relativePath}`);
          modified = true;
          fixedCount++;
        }
      });
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
  }

  return modified;
}

// Main
console.log('═══════════════════════════════════════════════════════════════════');
console.log('           FIXING HEADING HIERARCHY (WCAG 2.4.6)');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Get all HTML files
function getHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules') {
        getHtmlFiles(fullPath, files);
      }
    } else if (item.endsWith('.html')) {
      files.push(path.relative(SITE_DIR, fullPath));
    }
  });
  return files;
}

const allFiles = getHtmlFiles(SITE_DIR);
allFiles.forEach(file => {
  fixPage(file);
});

console.log(`\n═══════════════════════════════════════════════════════════════════`);
console.log(`                    FIXES APPLIED: ${fixedCount}`);
console.log(`═══════════════════════════════════════════════════════════════════\n`);
