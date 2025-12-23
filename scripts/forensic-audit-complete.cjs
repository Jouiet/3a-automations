#!/usr/bin/env node
/**
 * FORENSIC AUDIT COMPLETE - 3A Automation
 * Vérification exhaustive de tous les problèmes du site
 *
 * Date: 2025-12-22
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');
const ISSUES = [];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

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

function addIssue(category, severity, file, line, description, fix) {
  ISSUES.push({ category, severity, file: file.replace(SITE_DIR, ''), line, description, fix });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function auditBrokenLinks(htmlFiles) {
  console.log('\n🔗 Auditing broken links...');
  let count = 0;

  for (const file of htmlFiles) {
    const content = readFile(file);
    if (!content) continue;

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Check for double-slash links (should be single slash)
      // Exclude: dns-prefetch, preconnect, schema.org (all valid uses of //)
      if (!line.includes('dns-prefetch') && !line.includes('preconnect')) {
        const doubleSlashMatches = line.match(/href="\/\/[^"]+"/g);
        if (doubleSlashMatches) {
          doubleSlashMatches.forEach(match => {
            if (!match.includes('http') && !match.includes('schema.org')) {
              addIssue('LINKS', 'CRITICAL', file, idx + 1,
                `Double slash in href: ${match}`,
                match.replace('"//', '"/')
              );
              count++;
            }
          });
        }
      }

      // Check for src with double slash
      const srcDoubleSlash = line.match(/src="\/\/[^"]+"/g);
      if (srcDoubleSlash) {
        srcDoubleSlash.forEach(match => {
          if (!match.includes('http') && !match.includes('googletagmanager')) {
            addIssue('LINKS', 'CRITICAL', file, idx + 1,
              `Double slash in src: ${match}`,
              match.replace('"//', '"/')
            );
            count++;
          }
        });
      }
    });
  }

  console.log(`   Found ${count} broken link issues`);
  return count;
}

function auditInconsistentPrices(htmlFiles, jsFiles) {
  console.log('\n💰 Auditing price inconsistencies...');
  let count = 0;

  // Official prices from CLAUDE.md
  const officialPrices = {
    'Quick Win': { EUR: 390, USD: 450, MAD: 3990 },
    'Essentials': { EUR: 790, USD: 920, MAD: 7990 },
    'Growth': { EUR: 1399, USD: 1690, MAD: 14990 },
    'Maintenance': { EUR: 290, USD: 330, MAD: 2900 },
    'Optimization': { EUR: 490, USD: 550, MAD: 5200 }
  };

  // Check voice-widget.js for price mentions
  const voiceWidget = readFile(path.join(SITE_DIR, 'voice-assistant/voice-widget.js'));
  if (voiceWidget) {
    const lines = voiceWidget.split('\n');
    lines.forEach((line, idx) => {
      // Check for 1490€ (should be 1399€)
      if (line.includes('1490')) {
        addIssue('PRICES', 'HIGH', '/voice-assistant/voice-widget.js', idx + 1,
          'Wrong price: 1490€ should be 1399€',
          line.replace('1490', '1399')
        );
        count++;
      }
      // Check for 890€ (wrong retainer price)
      if (line.includes('890') && line.toLowerCase().includes('retainer')) {
        addIssue('PRICES', 'HIGH', '/voice-assistant/voice-widget.js', idx + 1,
          'Wrong retainer price: 890€ should be 490€',
          line.replace('890', '490')
        );
        count++;
      }
    });
  }

  // Check voice-widget-en.js similarly
  const voiceWidgetEN = readFile(path.join(SITE_DIR, 'voice-assistant/voice-widget-en.js'));
  if (voiceWidgetEN) {
    const lines = voiceWidgetEN.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('1490')) {
        addIssue('PRICES', 'HIGH', '/voice-assistant/voice-widget-en.js', idx + 1,
          'Wrong price: 1490€ should be 1399€',
          line.replace('1490', '1399')
        );
        count++;
      }
    });
  }

  console.log(`   Found ${count} price inconsistency issues`);
  return count;
}

function auditAutomationCounts(allFiles) {
  console.log('\n📊 Auditing automation count claims...');
  let count = 0;

  // Official count from CLAUDE.md: 66
  const officialCount = 66;
  const wrongCounts = ['50', '56', '60', '45'];

  for (const file of allFiles) {
    const content = readFile(file);
    if (!content) continue;

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Check for wrong automation counts near keywords
      if (line.toLowerCase().includes('automati')) {
        for (const wrongCount of wrongCounts) {
          const regex = new RegExp(`\\b${wrongCount}\\s*(automati|scripts)`, 'i');
          if (regex.test(line)) {
            addIssue('CONTENT', 'MEDIUM', file, idx + 1,
              `Wrong automation count: ${wrongCount} should be ${officialCount}`,
              line.replace(new RegExp(`\\b${wrongCount}\\b`), String(officialCount))
            );
            count++;
          }
        }
      }
    });
  }

  console.log(`   Found ${count} automation count issues`);
  return count;
}

function auditMissingAltText(htmlFiles) {
  console.log('\n🖼️ Auditing missing alt text...');
  let count = 0;

  for (const file of htmlFiles) {
    const content = readFile(file);
    if (!content) continue;

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Find img tags
      const imgMatches = line.match(/<img[^>]+>/g);
      if (imgMatches) {
        imgMatches.forEach(img => {
          // Check if alt is empty or missing (except for decorative images with alt="")
          if (!img.includes('alt=')) {
            addIssue('SEO', 'MEDIUM', file, idx + 1,
              `Missing alt attribute: ${img.substring(0, 50)}...`,
              'Add descriptive alt text'
            );
            count++;
          }
        });
      }
    });
  }

  console.log(`   Found ${count} alt text issues`);
  return count;
}

function auditNavigation(htmlFiles) {
  console.log('\n🧭 Auditing navigation consistency...');
  let count = 0;

  // Expected nav structure
  const expectedNavItems = [
    'E-commerce', 'PME', 'Automations', 'Tarifs', 'RDV', 'Contact'
  ];
  const expectedNavItemsEN = [
    'E-commerce', 'SMB', 'Automations', 'Pricing', 'Booking', 'Contact'
  ];

  for (const file of htmlFiles) {
    const content = readFile(file);
    if (!content) continue;

    const isEnglish = file.includes('/en/');
    const expected = isEnglish ? expectedNavItemsEN : expectedNavItems;

    // Check for navigation element
    if (!content.includes('id="nav-menu"')) {
      addIssue('NAV', 'HIGH', file, 0,
        'Missing nav-menu element',
        'Add <nav class="nav" id="nav-menu">'
      );
      count++;
    }
  }

  console.log(`   Found ${count} navigation issues`);
  return count;
}

function auditCSSIssues(cssFiles) {
  console.log('\n🎨 Auditing CSS issues...');
  let count = 0;

  for (const file of cssFiles) {
    const content = readFile(file);
    if (!content) continue;

    const lines = content.split('\n');

    // Track z-index values to find conflicts
    const zIndexes = [];
    lines.forEach((line, idx) => {
      const zMatch = line.match(/z-index:\s*(\d+)/);
      if (zMatch) {
        zIndexes.push({ value: parseInt(zMatch[1]), line: idx + 1 });
      }
    });

    // Check for extremely high z-index
    zIndexes.filter(z => z.value > 99999).forEach(z => {
      addIssue('CSS', 'LOW', file, z.line,
        `Extremely high z-index: ${z.value}`,
        'Consider using more reasonable z-index values'
      );
      count++;
    });

    // Check for !important overuse
    const importantCount = (content.match(/!important/g) || []).length;
    if (importantCount > 20) {
      addIssue('CSS', 'LOW', file, 0,
        `Excessive !important usage: ${importantCount} instances`,
        'Reduce !important usage for better maintainability'
      );
      count++;
    }
  }

  console.log(`   Found ${count} CSS issues`);
  return count;
}

function auditMobileResponsiveness(cssFiles) {
  console.log('\n📱 Auditing mobile responsiveness...');
  let count = 0;

  for (const file of cssFiles) {
    const content = readFile(file);
    if (!content) continue;

    // Check for required breakpoints
    const breakpoints = ['768px', '480px', '1024px'];
    const missingBreakpoints = breakpoints.filter(bp => !content.includes(`@media`) || !content.includes(bp));

    if (missingBreakpoints.length > 0 && file.includes('styles.css')) {
      // Only report on main CSS file
      // This is informational
    }

    // Check for fixed widths that could cause overflow
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.match(/width:\s*\d{4,}px/) && !line.includes('max-width')) {
        addIssue('RESPONSIVE', 'MEDIUM', file, idx + 1,
          `Fixed large width may cause overflow: ${line.trim()}`,
          'Consider using max-width or responsive units'
        );
        count++;
      }
    });
  }

  console.log(`   Found ${count} responsiveness issues`);
  return count;
}

function auditJavaScript(jsFiles) {
  console.log('\n⚡ Auditing JavaScript issues...');
  let count = 0;

  for (const file of jsFiles) {
    const content = readFile(file);
    if (!content) continue;

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Check for console.log in production code (except test files)
      if (line.includes('console.log') && !file.includes('test')) {
        // This is acceptable for debugging info
      }

      // Check for TODO comments
      if (line.includes('TODO')) {
        addIssue('JS', 'LOW', file, idx + 1,
          `TODO found: ${line.trim().substring(0, 60)}`,
          'Implement or remove TODO'
        );
        count++;
      }

      // Check for FIXME comments
      if (line.includes('FIXME')) {
        addIssue('JS', 'MEDIUM', file, idx + 1,
          `FIXME found: ${line.trim().substring(0, 60)}`,
          'Fix the noted issue'
        );
        count++;
      }
    });
  }

  console.log(`   Found ${count} JavaScript issues`);
  return count;
}

function auditSEO(htmlFiles) {
  console.log('\n🔍 Auditing SEO issues...');
  let count = 0;

  for (const file of htmlFiles) {
    const content = readFile(file);
    if (!content) continue;

    // Check for meta description
    if (!content.includes('name="description"')) {
      addIssue('SEO', 'HIGH', file, 0,
        'Missing meta description',
        'Add <meta name="description" content="...">'
      );
      count++;
    }

    // Check for canonical URL
    if (!content.includes('rel="canonical"')) {
      addIssue('SEO', 'MEDIUM', file, 0,
        'Missing canonical URL',
        'Add <link rel="canonical" href="...">'
      );
      count++;
    }

    // Check for hreflang tags (only for main pages, not 404)
    if (!content.includes('hreflang') && !file.includes('404')) {
      addIssue('SEO', 'MEDIUM', file, 0,
        'Missing hreflang tags',
        'Add hreflang tags for international SEO'
      );
      count++;
    }

    // Check for Open Graph
    if (!content.includes('og:title')) {
      addIssue('SEO', 'LOW', file, 0,
        'Missing Open Graph tags',
        'Add og:title, og:description, og:image'
      );
      count++;
    }

    // Check for multiple h1 tags
    const h1Count = (content.match(/<h1/g) || []).length;
    if (h1Count > 1) {
      addIssue('SEO', 'MEDIUM', file, 0,
        `Multiple H1 tags found: ${h1Count}`,
        'Use only one H1 per page'
      );
      count++;
    } else if (h1Count === 0) {
      addIssue('SEO', 'HIGH', file, 0,
        'Missing H1 tag',
        'Add an H1 tag to the page'
      );
      count++;
    }
  }

  console.log(`   Found ${count} SEO issues`);
  return count;
}

function auditMarketingCopy(htmlFiles) {
  console.log('\n📝 Auditing marketing copy...');
  let count = 0;

  // Weak phrases to identify
  const weakPhrases = [
    { pattern: /nous sommes/gi, suggestion: 'Focus on customer benefits instead of "we"' },
    { pattern: /notre équipe/gi, suggestion: 'Focus on results, not team description' },
    { pattern: /depuis \d+ ans/gi, suggestion: 'Consider showing results instead of years' },
    { pattern: /professionnel/gi, suggestion: 'Avoid generic terms, be specific' },
  ];

  for (const file of htmlFiles) {
    const content = readFile(file);
    if (!content) continue;

    // Check for empty meta descriptions
    const metaDescMatch = content.match(/<meta name="description" content="([^"]*)"/);
    if (metaDescMatch && metaDescMatch[1].length < 50) {
      addIssue('COPY', 'MEDIUM', file, 0,
        `Meta description too short: ${metaDescMatch[1].length} chars`,
        'Meta description should be 150-160 characters'
      );
      count++;
    }

    // Check for empty sections
    if (content.includes('<section') && content.includes('</section>')) {
      const emptySection = content.match(/<section[^>]*>\s*<\/section>/);
      if (emptySection) {
        addIssue('COPY', 'HIGH', file, 0,
          'Empty section found',
          'Add content or remove empty section'
        );
        count++;
      }
    }
  }

  console.log(`   Found ${count} marketing copy issues`);
  return count;
}

function auditHreflangConsistency(htmlFiles) {
  console.log('\n🌍 Auditing hreflang consistency...');
  let count = 0;

  const frPages = htmlFiles.filter(f => !f.includes('/en/'));
  const enPages = htmlFiles.filter(f => f.includes('/en/'));

  // Check that each FR page has corresponding EN page
  for (const frPage of frPages) {
    const relativePath = frPage.replace(SITE_DIR, '');
    let expectedEnPath;

    // Map FR paths to EN paths
    if (relativePath === '/index.html') {
      expectedEnPath = '/en/index.html';
    } else if (relativePath === '/a-propos.html') {
      expectedEnPath = '/en/about.html';
    } else if (relativePath === '/cas-clients.html') {
      expectedEnPath = '/en/case-studies.html';
    } else if (relativePath.includes('/services/pme.html')) {
      expectedEnPath = '/en/services/smb.html';
    } else if (relativePath.includes('/services/audit-gratuit.html')) {
      expectedEnPath = '/en/services/free-audit.html';
    } else if (relativePath.includes('/legal/mentions-legales.html')) {
      expectedEnPath = '/en/legal/terms.html';
    } else if (relativePath.includes('/legal/politique-confidentialite.html')) {
      expectedEnPath = '/en/legal/privacy.html';
    } else {
      // Default: add /en/ prefix
      expectedEnPath = '/en' + relativePath;
    }

    const fullEnPath = path.join(SITE_DIR, expectedEnPath);
    if (!fs.existsSync(fullEnPath)) {
      addIssue('I18N', 'MEDIUM', frPage, 0,
        `Missing English counterpart: ${expectedEnPath}`,
        `Create ${expectedEnPath}`
      );
      count++;
    }
  }

  console.log(`   Found ${count} hreflang issues`);
  return count;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('                    FORENSIC AUDIT COMPLETE - 3A Automation');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Site Directory: ${SITE_DIR}`);

// Find all files
const htmlFiles = findFiles(SITE_DIR, '.html');
const cssFiles = findFiles(SITE_DIR, '.css');
const jsFiles = findFiles(SITE_DIR, '.js');
const allFiles = [...htmlFiles, ...jsFiles];

console.log(`\n📁 Found: ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${jsFiles.length} JS files`);

// Run all audits
const totalIssues = [
  auditBrokenLinks(htmlFiles),
  auditInconsistentPrices(htmlFiles, jsFiles),
  auditAutomationCounts(allFiles),
  auditMissingAltText(htmlFiles),
  auditNavigation(htmlFiles),
  auditCSSIssues(cssFiles),
  auditMobileResponsiveness(cssFiles),
  auditJavaScript(jsFiles),
  auditSEO(htmlFiles),
  auditMarketingCopy(htmlFiles),
  auditHreflangConsistency(htmlFiles),
].reduce((a, b) => a + b, 0);

// ═══════════════════════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════');
console.log('                              AUDIT REPORT');
console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Group by severity
const critical = ISSUES.filter(i => i.severity === 'CRITICAL');
const high = ISSUES.filter(i => i.severity === 'HIGH');
const medium = ISSUES.filter(i => i.severity === 'MEDIUM');
const low = ISSUES.filter(i => i.severity === 'LOW');

console.log(`📊 SUMMARY:`);
console.log(`   🔴 CRITICAL: ${critical.length}`);
console.log(`   🟠 HIGH:     ${high.length}`);
console.log(`   🟡 MEDIUM:   ${medium.length}`);
console.log(`   🟢 LOW:      ${low.length}`);
console.log(`   ─────────────────`);
console.log(`   TOTAL:       ${ISSUES.length}\n`);

// Print issues by severity
function printIssues(issues, label, emoji) {
  if (issues.length === 0) return;
  console.log(`\n${emoji} ${label} (${issues.length}):`);
  console.log('─'.repeat(60));
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.category}] ${issue.file}:${issue.line}`);
    console.log(`   ${issue.description}`);
    if (issue.fix) {
      console.log(`   FIX: ${issue.fix.substring(0, 80)}`);
    }
    console.log();
  });
}

printIssues(critical, 'CRITICAL ISSUES', '🔴');
printIssues(high, 'HIGH PRIORITY', '🟠');
printIssues(medium, 'MEDIUM PRIORITY', '🟡');
printIssues(low, 'LOW PRIORITY', '🟢');

// Export to JSON
const reportPath = path.join(__dirname, '../outputs/forensic-audit-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  date: new Date().toISOString(),
  summary: {
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    total: ISSUES.length
  },
  issues: ISSUES
}, null, 2));

console.log(`\n📄 Report saved to: ${reportPath}`);
console.log('\n═══════════════════════════════════════════════════════════════════════════');

// Exit code based on critical issues
if (critical.length > 0) {
  console.log('❌ AUDIT FAILED - Critical issues found');
  process.exit(1);
} else if (high.length > 0) {
  console.log('⚠️  AUDIT PASSED WITH WARNINGS - High priority issues found');
  process.exit(0);
} else {
  console.log('✅ AUDIT PASSED');
  process.exit(0);
}
