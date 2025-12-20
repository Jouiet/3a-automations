#!/usr/bin/env node
/**
 * AUDIT FORENSIQUE COMPLET - 3A Automation Site
 * Vérification empirique de TOUTES les facettes du site
 * Date: 2025-12-20
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://3a-automation.com';
const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Results accumulator
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function log(status, category, message) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${message}`);
  results.details.push({ status, category, message });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function auditSEO() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  1. AUDIT SEO/AEO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // robots.txt
  try {
    const robots = await fetch(`${SITE_URL}/robots.txt`);
    if (robots.status === 200) {
      log('PASS', 'SEO', 'robots.txt exists and accessible');
      if (robots.data.includes('Sitemap:')) {
        log('PASS', 'SEO', 'robots.txt contains Sitemap reference');
      } else {
        log('FAIL', 'SEO', 'robots.txt missing Sitemap reference');
      }
      if (robots.data.includes('GPTBot')) {
        log('PASS', 'AEO', 'robots.txt includes AI crawler rules (GPTBot)');
      } else {
        log('WARN', 'AEO', 'robots.txt missing AI crawler rules');
      }
    } else {
      log('FAIL', 'SEO', `robots.txt returned ${robots.status}`);
    }
  } catch (e) {
    log('FAIL', 'SEO', `robots.txt fetch error: ${e.message}`);
  }

  // sitemap.xml
  try {
    const sitemap = await fetch(`${SITE_URL}/sitemap.xml`);
    if (sitemap.status === 200) {
      log('PASS', 'SEO', 'sitemap.xml exists and accessible');
      const urlCount = (sitemap.data.match(/<loc>/g) || []).length;
      if (urlCount >= 26) {
        log('PASS', 'SEO', `sitemap.xml contains ${urlCount} URLs (expected 26+)`);
      } else {
        log('FAIL', 'SEO', `sitemap.xml only has ${urlCount} URLs (expected 26+)`);
      }
      if (sitemap.data.includes('hreflang')) {
        log('PASS', 'SEO', 'sitemap.xml includes hreflang tags');
      } else {
        log('FAIL', 'SEO', 'sitemap.xml missing hreflang tags');
      }
    } else {
      log('FAIL', 'SEO', `sitemap.xml returned ${sitemap.status}`);
    }
  } catch (e) {
    log('FAIL', 'SEO', `sitemap.xml fetch error: ${e.message}`);
  }

  // llms.txt
  try {
    const llms = await fetch(`${SITE_URL}/llms.txt`);
    if (llms.status === 200) {
      log('PASS', 'AEO', 'llms.txt exists and accessible');
      if (llms.data.includes('3A Automation')) {
        log('PASS', 'AEO', 'llms.txt contains business information');
      }
      if (llms.data.includes('## Services')) {
        log('PASS', 'AEO', 'llms.txt has structured sections');
      }
    } else {
      log('WARN', 'AEO', `llms.txt returned ${llms.status} (optional but recommended)`);
    }
  } catch (e) {
    log('WARN', 'AEO', `llms.txt fetch error: ${e.message}`);
  }
}

async function auditPages() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  2. AUDIT PAGES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const pages = [
    { path: '/', name: 'Homepage FR' },
    { path: '/a-propos.html', name: 'About FR' },
    { path: '/pricing.html', name: 'Pricing FR' },
    { path: '/contact.html', name: 'Contact FR' },
    { path: '/automations.html', name: 'Automations FR' },
    { path: '/cas-clients.html', name: 'Case Studies FR' },
    { path: '/services/ecommerce.html', name: 'E-commerce FR' },
    { path: '/services/pme.html', name: 'PME FR' },
    { path: '/services/audit-gratuit.html', name: 'Audit FR' },
    { path: '/services/flywheel-360.html', name: 'Flywheel FR' },
    { path: '/en/', name: 'Homepage EN' },
    { path: '/en/about.html', name: 'About EN' },
    { path: '/en/pricing.html', name: 'Pricing EN' },
    { path: '/en/contact.html', name: 'Contact EN' },
    { path: '/en/automations.html', name: 'Automations EN' },
    { path: '/en/case-studies.html', name: 'Case Studies EN' },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${SITE_URL}${page.path}`);
      if (res.status === 200) {
        log('PASS', 'PAGES', `${page.name} (${page.path}) - HTTP 200`);

        // Check meta description
        if (res.data.includes('meta name="description"')) {
          log('PASS', 'META', `${page.name} has meta description`);
        } else {
          log('FAIL', 'META', `${page.name} MISSING meta description`);
        }

        // Check canonical
        if (res.data.includes('rel="canonical"')) {
          log('PASS', 'SEO', `${page.name} has canonical URL`);
        } else {
          log('FAIL', 'SEO', `${page.name} MISSING canonical URL`);
        }

        // Check hreflang
        if (res.data.includes('hreflang')) {
          log('PASS', 'i18n', `${page.name} has hreflang tags`);
        } else {
          log('FAIL', 'i18n', `${page.name} MISSING hreflang tags`);
        }

        // Check title
        const titleMatch = res.data.match(/<title>([^<]+)<\/title>/);
        if (titleMatch && titleMatch[1].length > 10) {
          log('PASS', 'SEO', `${page.name} has title: "${titleMatch[1].substring(0, 50)}..."`);
        } else {
          log('FAIL', 'SEO', `${page.name} has invalid/missing title`);
        }

        // Check Open Graph
        if (res.data.includes('og:title')) {
          log('PASS', 'SOCIAL', `${page.name} has Open Graph tags`);
        } else {
          log('WARN', 'SOCIAL', `${page.name} missing Open Graph tags`);
        }

      } else {
        log('FAIL', 'PAGES', `${page.name} (${page.path}) - HTTP ${res.status}`);
      }
    } catch (e) {
      log('FAIL', 'PAGES', `${page.name} fetch error: ${e.message}`);
    }
  }
}

async function auditSchema() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  3. AUDIT SCHEMA.ORG');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const pagesWithSchema = [
    { path: '/', expected: ['Organization'] },
    { path: '/services/audit-gratuit.html', expected: ['Service'] },
    { path: '/pricing.html', expected: ['Service', 'PriceSpecification'] },
    { path: '/a-propos.html', expected: ['Organization', 'Person'] },
  ];

  for (const page of pagesWithSchema) {
    try {
      const res = await fetch(`${SITE_URL}${page.path}`);
      if (res.status === 200) {
        const schemaMatches = res.data.match(/application\/ld\+json[^>]*>([^<]+)/g);
        if (schemaMatches && schemaMatches.length > 0) {
          log('PASS', 'SCHEMA', `${page.path} has Schema.org structured data`);

          for (const expected of page.expected) {
            if (res.data.includes(`"@type": "${expected}"`)) {
              log('PASS', 'SCHEMA', `${page.path} has @type: ${expected}`);
            } else if (res.data.includes(`"@type":"${expected}"`)) {
              log('PASS', 'SCHEMA', `${page.path} has @type: ${expected}`);
            } else {
              log('WARN', 'SCHEMA', `${page.path} missing expected @type: ${expected}`);
            }
          }
        } else {
          log('FAIL', 'SCHEMA', `${page.path} MISSING Schema.org structured data`);
        }
      }
    } catch (e) {
      log('FAIL', 'SCHEMA', `${page.path} fetch error: ${e.message}`);
    }
  }
}

async function auditPerformance() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  4. AUDIT PERFORMANCE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check CSS size
  const cssPath = path.join(SITE_DIR, 'styles.css');
  const cssMinPath = path.join(SITE_DIR, 'styles.min.css');

  if (fs.existsSync(cssPath)) {
    const cssSize = fs.statSync(cssPath).size;
    const cssSizeKB = (cssSize / 1024).toFixed(1);
    if (cssSize < 150000) {
      log('PASS', 'PERF', `CSS source size: ${cssSizeKB}KB (< 150KB)`);
    } else {
      log('WARN', 'PERF', `CSS source size: ${cssSizeKB}KB (> 150KB, consider optimization)`);
    }
  }

  if (fs.existsSync(cssMinPath)) {
    const cssMinSize = fs.statSync(cssMinPath).size;
    const cssMinSizeKB = (cssMinSize / 1024).toFixed(1);
    if (cssMinSize < 100000) {
      log('PASS', 'PERF', `CSS minified size: ${cssMinSizeKB}KB (< 100KB)`);
    } else {
      log('WARN', 'PERF', `CSS minified size: ${cssMinSizeKB}KB (> 100KB, consider splitting)`);
    }
  }

  // Check JS size
  const jsPath = path.join(SITE_DIR, 'script.js');
  if (fs.existsSync(jsPath)) {
    const jsSize = fs.statSync(jsPath).size;
    const jsSizeKB = (jsSize / 1024).toFixed(1);
    if (jsSize < 50000) {
      log('PASS', 'PERF', `JS size: ${jsSizeKB}KB (< 50KB)`);
    } else {
      log('WARN', 'PERF', `JS size: ${jsSizeKB}KB (> 50KB, consider lazy loading)`);
    }
  }

  // Check page load time
  const start = Date.now();
  try {
    await fetch(SITE_URL);
    const loadTime = Date.now() - start;
    if (loadTime < 500) {
      log('PASS', 'PERF', `Homepage load time: ${loadTime}ms (< 500ms)`);
    } else if (loadTime < 1000) {
      log('WARN', 'PERF', `Homepage load time: ${loadTime}ms (> 500ms)`);
    } else {
      log('FAIL', 'PERF', `Homepage load time: ${loadTime}ms (> 1000ms)`);
    }
  } catch (e) {
    log('FAIL', 'PERF', `Load time check failed: ${e.message}`);
  }
}

async function auditAutomations() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  5. AUDIT AUTOMATISATIONS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const automationsDir = '/Users/mac/Desktop/JO-AAA/automations';

  // Count scripts by category
  const categories = ['agency', 'clients', 'generic', 'legacy-client-specific', 'lib'];
  let totalScripts = 0;
  let genericScripts = 0;
  let hardcodedScripts = 0;

  for (const cat of categories) {
    const catDir = path.join(automationsDir, cat);
    if (fs.existsSync(catDir)) {
      const files = getAllFiles(catDir, '.cjs');
      totalScripts += files.length;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('process.env')) {
          genericScripts++;
        } else {
          hardcodedScripts++;
        }
      }
    }
  }

  log('PASS', 'AUTO', `Total automation scripts: ${totalScripts}`);
  log('PASS', 'AUTO', `Generic scripts (use process.env): ${genericScripts}`);

  if (hardcodedScripts > 0) {
    log('WARN', 'AUTO', `Potentially hardcoded scripts: ${hardcodedScripts}`);
  } else {
    log('PASS', 'AUTO', 'No hardcoded scripts detected');
  }

  // Check for required files
  const requiredFiles = [
    { file: 'INDEX.md', name: 'Automations Index' },
  ];

  for (const req of requiredFiles) {
    const filePath = path.join(automationsDir, req.file);
    if (fs.existsSync(filePath)) {
      log('PASS', 'AUTO', `${req.name} exists`);
    } else {
      log('FAIL', 'AUTO', `${req.name} MISSING`);
    }
  }
}

function getAllFiles(dir, ext) {
  let files = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, ext));
      } else if (item.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Ignore permission errors
  }
  return files;
}

async function auditConversion() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  6. AUDIT CONVERSION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const homepage = await fetch(SITE_URL);

    // Check for CTA buttons
    const ctaCount = (homepage.data.match(/class="[^"]*btn[^"]*"/g) || []).length;
    if (ctaCount >= 3) {
      log('PASS', 'CRO', `Homepage has ${ctaCount} CTA buttons`);
    } else {
      log('WARN', 'CRO', `Homepage only has ${ctaCount} CTA buttons (recommend 3+)`);
    }

    // Check for contact form
    if (homepage.data.includes('contact') || homepage.data.includes('Contact')) {
      log('PASS', 'CRO', 'Homepage references contact');
    }

    // Check for trust indicators
    if (homepage.data.includes('client') || homepage.data.includes('témoignage') || homepage.data.includes('cas')) {
      log('PASS', 'CRO', 'Homepage has trust indicators (clients/testimonials)');
    } else {
      log('WARN', 'CRO', 'Homepage missing visible trust indicators');
    }

    // Check for value proposition
    if (homepage.data.includes('Automation') && homepage.data.includes('PME')) {
      log('PASS', 'CRO', 'Homepage has clear value proposition');
    }

    // Check pricing page
    const pricing = await fetch(`${SITE_URL}/pricing.html`);
    if (pricing.data.includes('€') || pricing.data.includes('EUR')) {
      log('PASS', 'CRO', 'Pricing page has visible prices');
    } else {
      log('FAIL', 'CRO', 'Pricing page missing prices');
    }

  } catch (e) {
    log('FAIL', 'CRO', `Conversion audit error: ${e.message}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AUDIT FORENSIQUE COMPLET - 3A AUTOMATION');
  console.log('  Date: ' + new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════════════');

  await auditSEO();
  await auditPages();
  await auditSchema();
  await auditPerformance();
  await auditAutomations();
  await auditConversion();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RÉSUMÉ FINAL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const total = results.passed + results.failed + results.warnings;
  const passRate = ((results.passed / total) * 100).toFixed(1);

  console.log(`  ✅ PASSED:   ${results.passed}`);
  console.log(`  ❌ FAILED:   ${results.failed}`);
  console.log(`  ⚠️  WARNINGS: ${results.warnings}`);
  console.log(`  ──────────────────`);
  console.log(`  📊 TOTAL:    ${total} tests`);
  console.log(`  📈 PASS RATE: ${passRate}%`);
  console.log('');

  if (results.failed > 0) {
    console.log('  ❌ CORRECTIONS REQUISES:');
    for (const d of results.details.filter(x => x.status === 'FAIL')) {
      console.log(`     - [${d.category}] ${d.message}`);
    }
  }

  if (results.warnings > 0) {
    console.log('\n  ⚠️  AMÉLIORATIONS SUGGÉRÉES:');
    for (const d of results.details.filter(x => x.status === 'WARN')) {
      console.log(`     - [${d.category}] ${d.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
