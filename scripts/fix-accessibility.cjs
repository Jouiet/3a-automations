#!/usr/bin/env node
/**
 * Fix WCAG 2.1 AA + RGAA Accessibility Issues
 *
 * Fixes:
 * 1. Add <main> landmark to all pages
 * 2. Fix heading hierarchy (H4 in footer → remove/change)
 * 3. Add visually-hidden CSS class for skip links
 * 4. Add focus-visible styles
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');

let fixedCount = 0;

function getHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules') {
        getHtmlFiles(fullPath, files);
      }
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  });
  return files;
}

function fixHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(SITE_DIR, filePath);
  let modified = false;

  // ═══════════════════════════════════════════════════════════════════
  // FIX 1: Add <main> landmark if missing
  // ═══════════════════════════════════════════════════════════════════
  if (!content.includes('<main') && !content.includes('role="main"')) {
    // Find the first section after header and wrap content until footer
    // Strategy: Add id="main-content" to first section after header

    // Look for common patterns:
    // - <section class="hero
    // - <section class="service-hero
    // - <section class="page-hero

    const patterns = [
      /(<section\s+class="hero[^"]*")/i,
      /(<section\s+class="service-hero[^"]*")/i,
      /(<section\s+class="page-hero[^"]*")/i,
      /(<section\s+class="booking[^"]*")/i,
      /(<section\s+class="contact[^"]*")/i,
      /(<section\s+class="legal[^"]*")/i,
      /(<section\s+class="pricing[^"]*")/i,
      /(<section\s+class="automations[^"]*")/i,
      /(<section\s+class="about[^"]*")/i,
      /(<section\s+class="case[^"]*")/i,
      /(<section\s+class="error[^"]*")/i
    ];

    let firstSectionFound = false;
    for (const pattern of patterns) {
      if (content.match(pattern) && !firstSectionFound) {
        // Add role="main" to first matching section
        content = content.replace(pattern, '<main role="main">\n  $1');
        firstSectionFound = true;
        break;
      }
    }

    // Close main before footer
    if (firstSectionFound) {
      content = content.replace(/(\s*<footer)/, '\n  </main>\n$1');
      console.log(`  ✅ Added <main> landmark: ${relativePath}`);
      modified = true;
      fixedCount++;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // FIX 2: Change H4 in footer to appropriate level or remove heading semantic
  // ═══════════════════════════════════════════════════════════════════
  // Footer H4s should be changed - they're not proper heading hierarchy
  // Change footer <h4> to <div class="footer-heading"> styled appropriately

  const footerH4Pattern = /<footer[\s\S]*?<\/footer>/gi;
  const footerMatch = content.match(footerH4Pattern);

  if (footerMatch) {
    footerMatch.forEach(footer => {
      if (footer.includes('<h4')) {
        const newFooter = footer.replace(/<h4([^>]*)>/g, '<div class="footer-heading"$1>').replace(/<\/h4>/g, '</div>');
        content = content.replace(footer, newFooter);
        console.log(`  ✅ Fixed H4 in footer: ${relativePath}`);
        modified = true;
        fixedCount++;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // FIX 3: Fix H3 after H1 (skip H2) - in some pages
  // ═══════════════════════════════════════════════════════════════════
  // For pages that have trust-bar or similar with H3 right after hero H1
  // We should check context - often these are sectional headings

  // Actually, let's verify skip-link has id="main-content" target
  if (!content.includes('id="main-content"') && content.includes('skip-link')) {
    // Find the main content section and add the id
    if (content.includes('<main role="main"')) {
      content = content.replace('<main role="main">', '<main role="main" id="main-content">');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
  }

  return modified;
}

function addCSSAccessibility() {
  const cssPath = path.join(SITE_DIR, 'styles.css');
  let css = fs.readFileSync(cssPath, 'utf8');

  const accessibilityCSS = `

/* ═══════════════════════════════════════════════════════════════════════════
   ACCESSIBILITY - WCAG 2.1 AA Compliance
   ═══════════════════════════════════════════════════════════════════════════ */

/* Skip Link - WCAG 2.4.1 Bypass Blocks */
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary);
  color: var(--secondary);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  z-index: 10000;
  text-decoration: none;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 1rem;
  outline: 3px solid var(--text-light);
  outline-offset: 2px;
}

/* Visually Hidden - Screen Reader Only */
.visually-hidden,
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.visually-hidden:focus,
.visually-hidden:active,
.sr-only:focus,
.sr-only:active {
  position: static !important;
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  overflow: visible !important;
  clip: auto !important;
  white-space: normal !important;
}

/* Focus Visible - WCAG 2.4.7 */
:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

/* Remove outline for mouse users, keep for keyboard */
:focus:not(:focus-visible) {
  outline: none;
}

/* High Contrast Focus for dark backgrounds */
.header :focus-visible,
.footer-ultra :focus-visible,
[class*="dark"] :focus-visible {
  outline-color: var(--text-light);
}

/* Footer Heading - Replaces H4 for accessibility */
.footer-heading {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-light);
  margin-bottom: 1rem;
}

/* Reduced Motion - WCAG 2.3.3 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  :root {
    --primary: #00BFFF;
    --text-secondary: #CCCCCC;
    --border-dark: rgba(255, 255, 255, 0.5);
  }

  .btn {
    border: 2px solid currentColor;
  }
}
`;

  // Check if accessibility CSS already exists
  if (!css.includes('ACCESSIBILITY - WCAG')) {
    css += accessibilityCSS;
    fs.writeFileSync(cssPath, css);
    console.log('\n✅ Added accessibility CSS to styles.css');
    fixedCount++;

    // Re-minify CSS
    console.log('Re-minifying CSS...');
    require('child_process').execSync('npx --yes clean-css-cli styles.css -o styles.min.css', {
      cwd: SITE_DIR,
      stdio: 'pipe'
    });
    console.log('✅ CSS re-minified');
  }
}

// Main execution
console.log('═══════════════════════════════════════════════════════════════════');
console.log('           FIXING WCAG 2.1 AA ACCESSIBILITY ISSUES');
console.log('═══════════════════════════════════════════════════════════════════\n');

const htmlFiles = getHtmlFiles(SITE_DIR);
console.log(`Processing ${htmlFiles.length} HTML files...\n`);

htmlFiles.forEach(file => {
  fixHtmlFile(file);
});

// Add CSS accessibility features
addCSSAccessibility();

console.log(`\n═══════════════════════════════════════════════════════════════════`);
console.log(`                    FIXES APPLIED: ${fixedCount}`);
console.log(`═══════════════════════════════════════════════════════════════════\n`);
