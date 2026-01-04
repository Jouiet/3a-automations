#!/usr/bin/env node
/**
 * Fix Heading Hierarchy Issues
 * Session 134 - 04/01/2026
 *
 * Issues identified:
 * 1. academie.html: Guides section uses h4 after h2 (should be h3)
 * 2. investisseurs.html: Documents section uses h4 after h2 (should be h3)
 * 3. academie/cours/*.html: h3 appears before h2 (add section h2)
 */

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..', 'landing-page-hostinger');

let totalFixed = 0;
const fixes = [];

// Fix 1: academie.html - Change h4.guide-title to h3.guide-title
function fixAcademie() {
  const filePath = path.join(basePath, 'academie.html');
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Change h4.guide-title to h3.guide-title
  content = content.replace(/<h4 class="guide-title">/g, '<h3 class="guide-title">');
  content = content.replace(/<\/h4>(\s*<p class="guide-desc">)/g, '</h3>$1');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    const count = (original.match(/<h4 class="guide-title">/g) || []).length;
    fixes.push(`academie.html: Fixed ${count} h4→h3 guide titles`);
    totalFixed += count;
  }
}

// Fix 2: investisseurs.html - Change h4 (Documents) to h3
function fixInvestisseurs() {
  const filePath = path.join(basePath, 'investisseurs.html');
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix the Documents section h4 to h3
  content = content.replace(
    /<h4 style="color: #4FBAF1; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><svg width="18" height="18"/g,
    '<h3 style="color: #4FBAF1; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><svg width="18" height="18"'
  );

  // Find and fix the closing tag for this specific h4→h3 change
  content = content.replace(
    /Documents Disponibles sur Demande<\/h4>/g,
    'Documents Disponibles sur Demande</h3>'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    fixes.push('investisseurs.html: Fixed h4→h3 Documents section');
    totalFixed += 1;
  }
}

// Fix 3: academie/cours/*.html - Add section h2 before step h3s
function fixCoursPages() {
  const coursDir = path.join(basePath, 'academie', 'cours');
  const files = fs.readdirSync(coursDir).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const filePath = path.join(coursDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Add h2 section title before first h3 if missing
    // Check if there's h3 before any h2 in the main content
    const h1Match = content.match(/<h1[^>]*>([^<]*)<\/h1>/);
    if (h1Match) {
      // Find position after h1's container
      const h1Pos = content.indexOf(h1Match[0]);
      const afterH1 = content.slice(h1Pos + h1Match[0].length);

      // Find first h3 and first h2 after h1
      const firstH3Match = afterH1.match(/<h3[^>]*>/);
      const firstH2Match = afterH1.match(/<h2[^>]*>/);

      if (firstH3Match && firstH2Match) {
        const h3Pos = afterH1.indexOf(firstH3Match[0]);
        const h2Pos = afterH1.indexOf(firstH2Match[0]);

        // If h3 comes before h2, we need to add an h2 section title
        if (h3Pos < h2Pos) {
          // Find the tab-content or lesson-card that contains the first h3
          const tabContentMatch = afterH1.match(/<div class="(tab-content|lesson-card)[^"]*"[^>]*>/);
          if (tabContentMatch) {
            const tabContentPos = afterH1.indexOf(tabContentMatch[0]);
            // Insert h2 after the tab-content div opening
            const insertPos = h1Pos + h1Match[0].length + tabContentPos + tabContentMatch[0].length;

            // Determine appropriate section title based on file name
            let sectionTitle = 'Instructions';
            if (file.includes('demarrer')) sectionTitle = 'Configuration Initiale';
            else if (file.includes('leads')) sectionTitle = 'Génération de Leads';
            else if (file.includes('email')) sectionTitle = 'Email Marketing';
            else if (file.includes('analytics')) sectionTitle = 'Analytics & Reporting';
            else if (file.includes('ecommerce')) sectionTitle = 'E-commerce Optimisation';
            else if (file.includes('contenu')) sectionTitle = 'Création de Contenu';

            const h2Insert = `\n            <h2 class="lesson-section-title">${sectionTitle}</h2>`;
            content = content.slice(0, insertPos) + h2Insert + content.slice(insertPos);
          }
        }
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      fixes.push(`academie/cours/${file}: Added missing h2 section`);
      totalFixed += 1;
    }
  });
}

// Fix 4: Check and fix blog pages ARIA and headings
function fixBlogPages() {
  const blogDir = path.join(basePath, 'blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const filePath = path.join(blogDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Add role="main" to main content if missing
    if (!content.includes('role="main"') && content.includes('<main')) {
      content = content.replace(/<main([^>]*)>/g, '<main$1 role="main">');
    }

    // Add role="navigation" to nav if missing
    if (!content.includes('role="navigation"') && content.includes('<nav')) {
      content = content.replace(/<nav([^>]*)>/g, '<nav$1 role="navigation">');
    }

    // Add role="article" to article if missing
    if (!content.includes('role="article"') && content.includes('<article')) {
      content = content.replace(/<article([^>]*)>/g, '<article$1 role="article">');
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      fixes.push(`blog/${file}: Added ARIA landmarks`);
      totalFixed += 1;
    }
  });
}

// Fix 5: Add skip links to service pages
function fixServicePages() {
  const servicesDir = path.join(basePath, 'services');
  if (!fs.existsSync(servicesDir)) return;

  const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Add skip link if missing
    if (!content.includes('skip-link') && !content.includes('#main-content')) {
      content = content.replace(
        /<body([^>]*)>/g,
        `<body$1>\n  <a href="#main-content" class="skip-link">Passer au contenu principal</a>`
      );

      // Add id="main-content" to main or first section if missing
      if (!content.includes('id="main-content"')) {
        if (content.includes('<main')) {
          content = content.replace(/<main([^>]*)>/g, '<main$1 id="main-content">');
        } else {
          content = content.replace(/<section class="hero/g, '<section id="main-content" class="hero');
        }
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      fixes.push(`services/${file}: Added skip link`);
      totalFixed += 1;
    }
  });
}

// Run all fixes
console.log('🔧 Fixing heading hierarchy issues...\n');

try {
  fixAcademie();
  fixInvestisseurs();
  fixCoursPages();
  fixBlogPages();
  fixServicePages();

  console.log('✅ Fixes applied:');
  fixes.forEach(fix => console.log(`   - ${fix}`));
  console.log(`\n📊 Total fixes: ${totalFixed}`);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
