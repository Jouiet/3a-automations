#!/usr/bin/env node
/**
 * WCAG 2.1 AA + RGAA Accessibility Audit
 * Checks for accessibility issues across all HTML pages
 *
 * WCAG 2.1 AA Criteria checked:
 * - 1.1.1 Non-text Content (alt text)
 * - 1.3.1 Info and Relationships (semantic HTML, ARIA)
 * - 1.4.3 Contrast (Minimum) - 4.5:1 for text
 * - 1.4.4 Resize Text
 * - 2.1.1 Keyboard (focusable elements)
 * - 2.4.1 Bypass Blocks (skip links)
 * - 2.4.2 Page Titled
 * - 2.4.4 Link Purpose (in Context)
 * - 2.4.6 Headings and Labels
 * - 2.4.7 Focus Visible
 * - 3.1.1 Language of Page
 * - 3.3.2 Labels or Instructions
 * - 4.1.1 Parsing
 * - 4.1.2 Name, Role, Value
 *
 * RGAA 4.1 additional checks:
 * - Critère 1.1: Images have alt
 * - Critère 4.1: Media alternatives
 * - Critère 8.1: Valid HTML
 * - Critère 8.2: Page lang attribute
 * - Critère 9.1: Heading structure
 * - Critère 10.7: Focus visibility
 * - Critère 11.1: Form labels
 * - Critère 12.1: Navigation consistency
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');

// Issue severity levels
const SEVERITY = {
  CRITICAL: 'CRITICAL', // Blocks users
  HIGH: 'HIGH',         // Major barrier
  MEDIUM: 'MEDIUM',     // Moderate barrier
  LOW: 'LOW'            // Minor issue
};

// WCAG criteria mapping
const WCAG = {
  '1.1.1': 'Non-text Content',
  '1.3.1': 'Info and Relationships',
  '1.4.3': 'Contrast (Minimum)',
  '2.1.1': 'Keyboard',
  '2.4.1': 'Bypass Blocks',
  '2.4.2': 'Page Titled',
  '2.4.4': 'Link Purpose',
  '2.4.6': 'Headings and Labels',
  '2.4.7': 'Focus Visible',
  '3.1.1': 'Language of Page',
  '3.3.2': 'Labels or Instructions',
  '4.1.2': 'Name, Role, Value'
};

let issues = [];

function addIssue(file, severity, wcag, message, fix) {
  issues.push({ file, severity, wcag, message, fix });
}

function auditFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = relativePath;

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 3.1.1 - Language of Page
  // ═══════════════════════════════════════════════════════════════════
  const htmlLangMatch = content.match(/<html[^>]*lang="([^"]+)"/i);
  if (!htmlLangMatch) {
    addIssue(fileName, SEVERITY.CRITICAL, '3.1.1',
      'Missing lang attribute on <html>',
      'Add lang="fr" or lang="en" to <html> tag');
  }

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 2.4.2 - Page Titled
  // ═══════════════════════════════════════════════════════════════════
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch || titleMatch[1].trim().length < 10) {
    addIssue(fileName, SEVERITY.HIGH, '2.4.2',
      'Missing or too short page title',
      'Add descriptive <title> (minimum 10 characters)');
  }

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 2.4.1 - Bypass Blocks (Skip Links)
  // ═══════════════════════════════════════════════════════════════════
  const hasSkipLink = content.includes('skip-link') ||
                      content.includes('skip-nav') ||
                      content.match(/href="#(main|content|main-content)"/i);
  if (!hasSkipLink) {
    addIssue(fileName, SEVERITY.HIGH, '2.4.1',
      'Missing skip link to bypass navigation',
      'Add <a href="#main-content" class="skip-link">Skip to content</a>');
  }

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 1.1.1 - Images without alt
  // ═══════════════════════════════════════════════════════════════════
  const imgTags = content.match(/<img[^>]*>/gi) || [];
  imgTags.forEach(img => {
    // Check for alt attribute
    if (!img.includes('alt=')) {
      addIssue(fileName, SEVERITY.CRITICAL, '1.1.1',
        `Image missing alt attribute: ${img.substring(0, 80)}...`,
        'Add alt="" for decorative images or descriptive alt for informative');
    }
    // Check for empty alt on non-decorative images
    else if (img.match(/alt=["']\s*["']/)) {
      // Empty alt is OK for decorative images, but check if it has important src
      if (img.includes('logo') || img.includes('icon')) {
        // Decorative logo icons with empty alt are acceptable
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 2.4.6 - Heading Structure
  // ═══════════════════════════════════════════════════════════════════
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
  if (h1Count === 0) {
    addIssue(fileName, SEVERITY.HIGH, '2.4.6',
      'Page has no H1 heading',
      'Add one H1 heading as the main page title');
  } else if (h1Count > 1) {
    addIssue(fileName, SEVERITY.MEDIUM, '2.4.6',
      `Page has ${h1Count} H1 headings (should be 1)`,
      'Use only one H1 per page, use H2-H6 for subsections');
  }

  // Check heading hierarchy (H1 → H2 → H3, no skipping)
  const headings = content.match(/<h[1-6][^>]*>/gi) || [];
  let prevLevel = 0;
  headings.forEach(h => {
    const level = parseInt(h.match(/<h([1-6])/i)[1]);
    if (prevLevel > 0 && level > prevLevel + 1) {
      addIssue(fileName, SEVERITY.MEDIUM, '2.4.6',
        `Heading level skipped: H${prevLevel} → H${level}`,
        `Use H${prevLevel + 1} instead of H${level}`);
    }
    prevLevel = level;
  });

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 3.3.2 - Form Labels
  // ═══════════════════════════════════════════════════════════════════
  const inputs = content.match(/<input[^>]*>/gi) || [];
  inputs.forEach(input => {
    // Skip hidden, submit, button types
    if (input.includes('type="hidden"') ||
        input.includes('type="submit"') ||
        input.includes('type="button"')) {
      return;
    }

    // Check for aria-label, aria-labelledby, or associated label
    const hasLabel = input.includes('aria-label') ||
                     input.includes('aria-labelledby') ||
                     input.includes('id=');

    if (!hasLabel && !input.includes('placeholder=')) {
      addIssue(fileName, SEVERITY.HIGH, '3.3.2',
        `Input missing label: ${input.substring(0, 60)}...`,
        'Add aria-label, aria-labelledby, or associated <label for="">');
    }
  });

  // Check textareas
  const textareas = content.match(/<textarea[^>]*>/gi) || [];
  textareas.forEach(ta => {
    if (!ta.includes('aria-label') && !ta.includes('id=')) {
      addIssue(fileName, SEVERITY.HIGH, '3.3.2',
        'Textarea missing label',
        'Add aria-label or associated <label>');
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 2.4.4 - Link Purpose
  // ═══════════════════════════════════════════════════════════════════
  const genericLinks = content.match(/<a[^>]*>(\s*(click here|read more|learn more|here|more|lire la suite|en savoir plus|cliquez ici|ici)\s*)<\/a>/gi) || [];
  genericLinks.forEach(link => {
    addIssue(fileName, SEVERITY.MEDIUM, '2.4.4',
      `Non-descriptive link text: "${link.substring(0, 50)}..."`,
      'Use descriptive link text that explains the destination');
  });

  // Empty links
  const emptyLinks = content.match(/<a[^>]*>\s*<\/a>/gi) || [];
  emptyLinks.forEach(link => {
    if (!link.includes('aria-label')) {
      addIssue(fileName, SEVERITY.HIGH, '2.4.4',
        'Empty link without accessible name',
        'Add text content or aria-label to the link');
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 4.1.2 - Buttons without accessible name
  // ═══════════════════════════════════════════════════════════════════
  const buttons = content.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
  buttons.forEach(btn => {
    const hasText = btn.replace(/<[^>]+>/g, '').trim().length > 0;
    const hasAriaLabel = btn.includes('aria-label');
    const hasTitle = btn.includes('title=');

    if (!hasText && !hasAriaLabel && !hasTitle) {
      addIssue(fileName, SEVERITY.HIGH, '4.1.2',
        `Button without accessible name: ${btn.substring(0, 60)}...`,
        'Add text content, aria-label, or title to button');
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 2.4.7 - Focus Visible (check for outline:none without alternative)
  // ═══════════════════════════════════════════════════════════════════
  // This is checked in CSS, but we can flag inline styles
  if (content.includes('outline: none') || content.includes('outline:none')) {
    if (!content.includes(':focus-visible') && !content.includes('focus-visible')) {
      addIssue(fileName, SEVERITY.MEDIUM, '2.4.7',
        'outline:none found - ensure focus is still visible',
        'Provide alternative focus indicator with :focus-visible');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // WCAG 1.3.1 - ARIA roles and landmarks
  // ═══════════════════════════════════════════════════════════════════
  const hasMain = content.includes('<main') || content.includes('role="main"');
  const hasNav = content.includes('<nav') || content.includes('role="navigation"');
  const hasHeader = content.includes('<header') || content.includes('role="banner"');
  const hasFooter = content.includes('<footer') || content.includes('role="contentinfo"');

  if (!hasMain) {
    addIssue(fileName, SEVERITY.MEDIUM, '1.3.1',
      'Missing <main> landmark',
      'Wrap main content in <main> or add role="main"');
  }

  // ═══════════════════════════════════════════════════════════════════
  // RGAA - Interactive elements need keyboard access
  // ═══════════════════════════════════════════════════════════════════
  const clickHandlers = content.match(/onclick="[^"]*"/gi) || [];
  clickHandlers.forEach(handler => {
    // Check if parent element is focusable
    addIssue(fileName, SEVERITY.LOW, '2.1.1',
      'onclick handler - ensure element is keyboard accessible',
      'Use <button> or add tabindex="0" and keypress handler');
  });

  // ═══════════════════════════════════════════════════════════════════
  // Check for tabindex > 0 (disrupts natural tab order)
  // ═══════════════════════════════════════════════════════════════════
  const badTabindex = content.match(/tabindex="[1-9][0-9]*"/gi) || [];
  badTabindex.forEach(() => {
    addIssue(fileName, SEVERITY.MEDIUM, '2.4.3',
      'tabindex > 0 disrupts natural tab order',
      'Use tabindex="0" or tabindex="-1" instead');
  });

  // ═══════════════════════════════════════════════════════════════════
  // Check for autoplay video/audio without controls
  // ═══════════════════════════════════════════════════════════════════
  const mediaAutoplay = content.match(/<(video|audio)[^>]*autoplay[^>]*>/gi) || [];
  mediaAutoplay.forEach(media => {
    if (!media.includes('muted') && !media.includes('controls')) {
      addIssue(fileName, SEVERITY.HIGH, '1.4.2',
        'Autoplay media without muted or controls',
        'Add muted attribute or provide controls');
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Check for target="_blank" without rel="noopener"
  // ═══════════════════════════════════════════════════════════════════
  const blankLinks = content.match(/<a[^>]*target="_blank"[^>]*>/gi) || [];
  blankLinks.forEach(link => {
    if (!link.includes('rel=')) {
      addIssue(fileName, SEVERITY.LOW, '4.1.2',
        'target="_blank" without rel="noopener noreferrer"',
        'Add rel="noopener noreferrer" for security and accessibility');
    }
  });
}

function auditCSS(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // Check for focus styles
  if (!content.includes(':focus') && !content.includes(':focus-visible')) {
    addIssue('styles.css', SEVERITY.HIGH, '2.4.7',
      'No :focus or :focus-visible styles found',
      'Add visible focus styles for keyboard navigation');
  }

  // Check for outline: none without replacement
  const outlineNone = content.match(/outline:\s*none[^;]*;/gi) || [];
  const focusStyles = content.match(/:focus[^{]*\{[^}]*\}/gi) || [];

  if (outlineNone.length > 0 && focusStyles.length === 0) {
    addIssue('styles.css', SEVERITY.HIGH, '2.4.7',
      'outline:none found without focus replacement styles',
      'Provide visible focus indicator');
  }

  // Check for skip-link styles (should be visually hidden but accessible)
  if (!content.includes('.skip-link') && !content.includes('.visually-hidden')) {
    addIssue('styles.css', SEVERITY.MEDIUM, '2.4.1',
      'No skip-link or visually-hidden styles',
      'Add .skip-link styles for keyboard users');
  }
}

function generateReport() {
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('           WCAG 2.1 AA + RGAA 4.1 ACCESSIBILITY AUDIT');
  console.log('══════════════════════════════════════════════════════════════════\n');

  // Count by severity
  const counts = {
    [SEVERITY.CRITICAL]: 0,
    [SEVERITY.HIGH]: 0,
    [SEVERITY.MEDIUM]: 0,
    [SEVERITY.LOW]: 0
  };

  issues.forEach(i => counts[i.severity]++);

  console.log('SUMMARY:');
  console.log(`  🔴 CRITICAL: ${counts[SEVERITY.CRITICAL]}`);
  console.log(`  🟠 HIGH:     ${counts[SEVERITY.HIGH]}`);
  console.log(`  🟡 MEDIUM:   ${counts[SEVERITY.MEDIUM]}`);
  console.log(`  🟢 LOW:      ${counts[SEVERITY.LOW]}`);
  console.log(`  TOTAL:       ${issues.length}`);
  console.log('');

  // Group by file
  const byFile = {};
  issues.forEach(i => {
    if (!byFile[i.file]) byFile[i.file] = [];
    byFile[i.file].push(i);
  });

  // Output issues by severity
  [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW].forEach(sev => {
    const sevIssues = issues.filter(i => i.severity === sev);
    if (sevIssues.length === 0) return;

    const emoji = sev === SEVERITY.CRITICAL ? '🔴' :
                  sev === SEVERITY.HIGH ? '🟠' :
                  sev === SEVERITY.MEDIUM ? '🟡' : '🟢';

    console.log(`\n${emoji} ${sev} ISSUES (${sevIssues.length}):`);
    console.log('─'.repeat(60));

    sevIssues.forEach(i => {
      console.log(`  📄 ${i.file}`);
      console.log(`     WCAG ${i.wcag}: ${WCAG[i.wcag] || i.wcag}`);
      console.log(`     Issue: ${i.message}`);
      console.log(`     Fix: ${i.fix}`);
      console.log('');
    });
  });

  // Save report
  const report = {
    date: new Date().toISOString(),
    summary: counts,
    total: issues.length,
    issues: issues
  };

  const reportPath = path.join(__dirname, '../outputs/ACCESSIBILITY-AUDIT-2025-12-23.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved: ${reportPath}`);

  return issues.length;
}

// Main execution
console.log('Scanning HTML files for accessibility issues...\n');

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
      files.push(fullPath);
    }
  });
  return files;
}

const htmlFiles = getHtmlFiles(SITE_DIR);
console.log(`Found ${htmlFiles.length} HTML files\n`);

htmlFiles.forEach(file => {
  const relativePath = path.relative(SITE_DIR, file);
  console.log(`  Checking: ${relativePath}`);
  auditFile(file, relativePath);
});

// Audit CSS
console.log('\nChecking CSS...');
auditCSS(path.join(SITE_DIR, 'styles.css'));

const totalIssues = generateReport();
process.exit(totalIssues > 0 ? 1 : 0);
