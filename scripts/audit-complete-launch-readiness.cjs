#!/usr/bin/env node
/**
 * AUDIT COMPLET - LAUNCH READINESS
 * Vérification factuelle et exhaustive
 * Date: 2025-12-27
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE_DIR = path.join(__dirname, '../landing-page-hostinger');
const DASHBOARD_DIR = path.join(__dirname, '../dashboard');

const results = {
  timestamp: new Date().toISOString(),
  website: { pages: [], issues: [], score: 0 },
  dashboard: { pages: [], apis: [], mocks: [], issues: [], score: 0 },
  integrations: { verified: [], failed: [], pending: [] },
  seo: { issues: [] },
  accessibility: { issues: [] },
  security: { issues: [] },
  summary: { ready: false, blockers: [], warnings: [] }
};

// ============================================
// 1. WEBSITE AUDIT
// ============================================
console.log('\n' + '='.repeat(60));
console.log('1. AUDIT WEBSITE - LANDING PAGE');
console.log('='.repeat(60));

// Get all HTML files
function getAllHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getAllHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

const htmlFiles = getAllHtmlFiles(SITE_DIR);
console.log(`\n📄 Pages HTML trouvées: ${htmlFiles.length}`);

// Audit each HTML file
for (const file of htmlFiles) {
  const relativePath = path.relative(SITE_DIR, file);
  const content = fs.readFileSync(file, 'utf8');
  const page = {
    path: relativePath,
    issues: [],
    warnings: []
  };

  // Check for required elements
  if (!content.includes('<title>')) page.issues.push('Missing <title>');
  if (!content.includes('meta name="description"')) page.issues.push('Missing meta description');
  if (!content.includes('rel="canonical"')) page.issues.push('Missing canonical URL');
  if (!content.includes('og:title')) page.warnings.push('Missing OG tags');
  if (!content.includes('hreflang')) page.warnings.push('Missing hreflang');

  // Check for forbidden content
  if (/prestashop/i.test(content)) page.issues.push('FORBIDDEN: PrestaShop mention');
  // Only flag actual mock data patterns, not HTML placeholder attributes
  if (/const\s+mock[A-Z]|MOCK_DATA|TODO:|FIXME:/i.test(content)) page.issues.push('Contains mock/TODO/FIXME');

  // Check automation counts
  const match77 = content.match(/77\s*(automations?|automatisations?)/gi);
  const match78 = content.match(/78\s*(automations?|automatisations?)/gi);
  if (match78) page.warnings.push('Outdated: 89 automations (should be 77)');

  // Check for broken internal links (ignore external/protocol-relative URLs)
  const internalLinks = content.match(/href=["']\/[^"']+["']/g) || [];
  for (const link of internalLinks) {
    const href = link.match(/href=["']([^"']+)["']/)[1];
    // Skip anchors, external URLs, and protocol-relative URLs
    if (href.includes('#')) continue;
    if (href.startsWith('//')) continue; // Protocol-relative external URL
    if (href.includes('?v=')) continue; // Query string versioned assets
    const targetPath = path.join(SITE_DIR, href);
    if (!fs.existsSync(targetPath) && !fs.existsSync(targetPath + '.html')) {
      page.issues.push(`Broken link: ${href}`);
    }
  }

  results.website.pages.push(page);

  if (page.issues.length > 0) {
    console.log(`\n❌ ${relativePath}:`);
    page.issues.forEach(i => console.log(`   - ${i}`));
  }
}

const websiteIssues = results.website.pages.reduce((sum, p) => sum + p.issues.length, 0);
const websiteWarnings = results.website.pages.reduce((sum, p) => sum + p.warnings.length, 0);
console.log(`\n📊 Website: ${htmlFiles.length} pages, ${websiteIssues} issues, ${websiteWarnings} warnings`);

// ============================================
// 2. DASHBOARD AUDIT
// ============================================
console.log('\n' + '='.repeat(60));
console.log('2. AUDIT DASHBOARD - NEXT.JS APP');
console.log('='.repeat(60));

// Find all page.tsx files
function findDashboardPages(dir, pages = []) {
  if (!fs.existsSync(dir)) return pages;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findDashboardPages(fullPath, pages);
    } else if (item === 'page.tsx') {
      pages.push(fullPath);
    }
  }
  return pages;
}

// Find all API routes
function findApiRoutes(dir, routes = []) {
  if (!fs.existsSync(dir)) return routes;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findApiRoutes(fullPath, routes);
    } else if (item === 'route.ts') {
      routes.push(fullPath);
    }
  }
  return routes;
}

const dashboardPages = findDashboardPages(path.join(DASHBOARD_DIR, 'src/app'));
const apiRoutes = findApiRoutes(path.join(DASHBOARD_DIR, 'src/app/api'));

console.log(`\n📄 Dashboard Pages: ${dashboardPages.length}`);
console.log(`📡 API Routes: ${apiRoutes.length}`);

// Check for MOCK data in dashboard
// NOTE: Don't flag HTML placeholder="..." - those are valid form inputs
console.log('\n🔍 Recherche de MOCK data...');
const mockPatterns = [
  /const\s+mock[A-Z]/gi,           // const mockUsers, mockData
  /Mock[A-Z][a-z]+\s*:\s*\[/g,     // MockTickets: [
  /MOCK_DATA/g,                     // MOCK_DATA constant
  /fake[A-Z]\w+\s*=/gi,            // fakeUsers =
  /stub[A-Z]\w+\s*=/gi,            // stubData =
  /dummy[A-Z]\w+\s*=/gi,           // dummyItems =
  /\/\/\s*TODO:/gi,                 // // TODO: comments
  /\/\/\s*FIXME:/gi,                // // FIXME: comments
];

let totalMocks = 0;
for (const page of dashboardPages) {
  const content = fs.readFileSync(page, 'utf8');
  const relativePath = path.relative(DASHBOARD_DIR, page);
  const foundMocks = [];

  for (const pattern of mockPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      foundMocks.push(...matches.slice(0, 3)); // Limit to 3 examples per pattern
    }
  }

  if (foundMocks.length > 0) {
    console.log(`\n❌ MOCK FOUND: ${relativePath}`);
    foundMocks.forEach(m => console.log(`   - "${m.substring(0, 50)}..."`));
    results.dashboard.mocks.push({ file: relativePath, matches: foundMocks });
    totalMocks += foundMocks.length;
  }
}

// Also check API routes for hardcoded data
for (const route of apiRoutes) {
  const content = fs.readFileSync(route, 'utf8');
  const relativePath = path.relative(DASHBOARD_DIR, route);

  // Check if API returns hardcoded data instead of fetching
  if (content.includes('return NextResponse.json([') && !content.includes('fetch(')) {
    console.log(`\n⚠️ HARDCODED API: ${relativePath}`);
    results.dashboard.issues.push(`Hardcoded data in API: ${relativePath}`);
  }
}

console.log(`\n📊 Dashboard: ${totalMocks} mock patterns found`);

// ============================================
// 3. API INTEGRATIONS AUDIT
// ============================================
console.log('\n' + '='.repeat(60));
console.log('3. AUDIT INTEGRATIONS API');
console.log('='.repeat(60));

// Load .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const requiredEnvVars = [
  { name: 'KLAVIYO_API_KEY', critical: true },
  { name: 'GOOGLE_APPLICATION_CREDENTIALS', critical: true },
  { name: 'GOOGLE_CALENDAR_ID', critical: false },
  { name: 'N8N_API_KEY', critical: true },
  { name: 'N8N_HOST', critical: true },
  { name: 'HOSTINGER_API_TOKEN', critical: false },
  { name: 'GITHUB_TOKEN', critical: false },
  { name: 'GEMINI_API_KEY', critical: false },
  { name: 'XAI_API_KEY', critical: false },
  { name: 'APIFY_TOKEN', critical: false }
];

console.log('\n📋 Variables d\'environnement:');
for (const v of requiredEnvVars) {
  const hasVar = envContent.includes(`${v.name}=`) && !envContent.includes(`${v.name}=\n`) && !envContent.includes(`${v.name}=""`);
  const status = hasVar ? '✅' : (v.critical ? '❌ MISSING' : '⚠️ OPTIONAL');
  console.log(`   ${status} ${v.name}`);

  if (!hasVar && v.critical) {
    results.integrations.failed.push(v.name);
    results.summary.blockers.push(`Missing critical env var: ${v.name}`);
  } else if (hasVar) {
    results.integrations.verified.push(v.name);
  } else {
    results.integrations.pending.push(v.name);
  }
}

// ============================================
// 4. SEO AUDIT
// ============================================
console.log('\n' + '='.repeat(60));
console.log('4. AUDIT SEO');
console.log('='.repeat(60));

// Check sitemap.xml
const sitemapPath = path.join(SITE_DIR, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  console.log(`\n✅ sitemap.xml: ${urlCount} URLs`);

  // Verify all URLs in sitemap exist as files
  const sitemapUrls = sitemap.match(/<loc>([^<]+)<\/loc>/g) || [];
  for (const loc of sitemapUrls) {
    const url = loc.replace('<loc>', '').replace('</loc>', '');
    const urlPath = url.replace('https://3a-automation.com', '').replace(/\/$/, '') || '/index';
    const filePath = path.join(SITE_DIR, urlPath.endsWith('.html') ? urlPath : urlPath + '.html');
    if (!fs.existsSync(filePath) && !fs.existsSync(filePath.replace('.html', '/index.html'))) {
      console.log(`   ❌ Sitemap URL not found: ${urlPath}`);
      results.seo.issues.push(`Sitemap URL 404: ${urlPath}`);
    }
  }
} else {
  console.log('\n❌ sitemap.xml MISSING');
  results.seo.issues.push('sitemap.xml missing');
}

// Check robots.txt
const robotsPath = path.join(SITE_DIR, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  console.log('✅ robots.txt present');
} else {
  console.log('❌ robots.txt MISSING');
  results.seo.issues.push('robots.txt missing');
}

// Check llms.txt
const llmsPath = path.join(SITE_DIR, 'llms.txt');
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, 'utf8');
  if (/77\s*automations/i.test(llms)) {
    console.log('✅ llms.txt (77 automations)');
  } else {
    console.log('⚠️ llms.txt automation count mismatch');
  }
} else {
  console.log('⚠️ llms.txt MISSING');
}

// ============================================
// 5. SECURITY AUDIT
// ============================================
console.log('\n' + '='.repeat(60));
console.log('5. AUDIT SÉCURITÉ');
console.log('='.repeat(60));

// Check for exposed credentials
// NOTE: Ignore bcrypt hashes (password: "$2a$..." or "$2b$...") - those are intentional
const allFiles = [...htmlFiles, ...dashboardPages, ...apiRoutes];
const credentialPatterns = [
  /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /secret\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /token\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub token
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI
  /xai-[a-zA-Z0-9]{40,}/g, // xAI
  /pk_[a-zA-Z0-9]{30,}/g // Klaviyo
];

console.log('\n🔐 Recherche de credentials exposés...');
let credentialsFound = 0;
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of credentialPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      // Exclude false positives: process.env references and bcrypt hashes
      const realMatches = matches.filter(m =>
        !m.includes('process.env') &&
        !m.includes('$2a$') &&
        !m.includes('$2b$')
      );
      if (realMatches.length > 0) {
        console.log(`   ❌ CREDENTIAL in ${path.basename(file)}: ${realMatches[0].substring(0, 30)}...`);
        results.security.issues.push(`Exposed credential in ${path.basename(file)}`);
        credentialsFound++;
      }
    }
  }
}

if (credentialsFound === 0) {
  console.log('   ✅ Aucun credential exposé');
}

// ============================================
// 6. BUILD VERIFICATION
// ============================================
console.log('\n' + '='.repeat(60));
console.log('6. VÉRIFICATION BUILD');
console.log('='.repeat(60));

// Check if dashboard builds
console.log('\n🔨 Vérification build dashboard...');
try {
  const buildOutput = execSync('cd ' + DASHBOARD_DIR + ' && npm run build 2>&1', {
    encoding: 'utf8',
    timeout: 120000
  });

  // Only flag actual build failures, not warnings
  if (buildOutput.includes('Failed to compile') || buildOutput.includes('Build failed')) {
    console.log('❌ Build errors detected');
    results.dashboard.issues.push('Build errors');
  } else if (buildOutput.includes('Generating static pages')) {
    console.log('✅ Dashboard build SUCCESS');
  } else {
    console.log('⚠️ Build completed with warnings');
  }
} catch (err) {
  console.log('❌ Dashboard build FAILED');
  results.dashboard.issues.push('Build failed: ' + err.message.substring(0, 100));
  results.summary.blockers.push('Dashboard build fails');
}

// ============================================
// 7. FINAL SUMMARY
// ============================================
console.log('\n' + '='.repeat(60));
console.log('RÉSUMÉ FINAL - LAUNCH READINESS');
console.log('='.repeat(60));

// Calculate scores
const websiteScore = Math.max(0, 100 - (websiteIssues * 10) - (websiteWarnings * 2));
const dashboardScore = Math.max(0, 100 - (totalMocks * 20) - (results.dashboard.issues.length * 10));
const integrationScore = (results.integrations.verified.length / requiredEnvVars.filter(v => v.critical).length) * 100;
const seoScore = Math.max(0, 100 - (results.seo.issues.length * 20));
const securityScore = results.security.issues.length === 0 ? 100 : 0;

const overallScore = Math.round((websiteScore + dashboardScore + integrationScore + seoScore + securityScore) / 5);

console.log(`
┌─────────────────────────────────────────────────────────┐
│                    SCORES PAR CATÉGORIE                  │
├─────────────────────────────────────────────────────────┤
│  Website (${htmlFiles.length} pages)          ${websiteScore.toString().padStart(3)}%  ${websiteScore >= 80 ? '✅' : websiteScore >= 50 ? '⚠️' : '❌'}
│  Dashboard                        ${dashboardScore.toString().padStart(3)}%  ${dashboardScore >= 80 ? '✅' : dashboardScore >= 50 ? '⚠️' : '❌'}
│  Integrations API                 ${Math.round(integrationScore).toString().padStart(3)}%  ${integrationScore >= 80 ? '✅' : integrationScore >= 50 ? '⚠️' : '❌'}
│  SEO                              ${seoScore.toString().padStart(3)}%  ${seoScore >= 80 ? '✅' : seoScore >= 50 ? '⚠️' : '❌'}
│  Sécurité                         ${securityScore.toString().padStart(3)}%  ${securityScore >= 80 ? '✅' : '❌'}
├─────────────────────────────────────────────────────────┤
│  SCORE GLOBAL                     ${overallScore.toString().padStart(3)}%  ${overallScore >= 80 ? '✅ READY' : overallScore >= 60 ? '⚠️ ALMOST' : '❌ NOT READY'}
└─────────────────────────────────────────────────────────┘
`);

// List blockers
if (results.summary.blockers.length > 0) {
  console.log('\n🚫 BLOCKERS (à corriger AVANT lancement):');
  results.summary.blockers.forEach((b, i) => console.log(`   ${i + 1}. ${b}`));
}

if (totalMocks > 0) {
  console.log('\n⚠️ MOCK DATA RESTANT:');
  results.dashboard.mocks.forEach(m => {
    console.log(`   - ${m.file}`);
  });
}

// Final verdict
const isReady = overallScore >= 80 && results.summary.blockers.length === 0 && totalMocks === 0;
results.summary.ready = isReady;

console.log(`
${'='.repeat(60)}
VERDICT: ${isReady ? '✅ PRÊT POUR LANCEMENT' : '❌ PAS PRÊT - CORRECTIONS REQUISES'}
${'='.repeat(60)}
`);

// Save results to JSON
const outputPath = path.join(__dirname, '../outputs/launch-readiness-audit-' + new Date().toISOString().split('T')[0] + '.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n📁 Résultats sauvegardés: ${outputPath}`);

// Exit with appropriate code
process.exit(isReady ? 0 : 1);
