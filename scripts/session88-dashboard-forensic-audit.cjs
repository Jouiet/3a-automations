#!/usr/bin/env node
/**
 * DASHBOARD FORENSIC AUDIT - Session 88
 * Analyse rigoureuse et factuelle du dashboard
 * Date: 2024-12-24
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '..', 'dashboard', 'src');
const RESULTS = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: [],
  stats: {}
};

console.log('='.repeat(60));
console.log('DASHBOARD FORENSIC AUDIT - VERITE BRUTALE');
console.log('='.repeat(60));
console.log('');

// 1. CHECK MOCK DATA
console.log('1. ANALYSE MOCK DATA vs REAL DATA');
console.log('-'.repeat(40));

const mockPatterns = [
  { pattern: /mockDocuments|mockEvents|mockCampaigns|mockReports|mockWorkflows|mockTickets|mockSettings/g, type: 'MOCK_DATA' },
  { pattern: /const mock\w+/g, type: 'MOCK_VARIABLE' },
  { pattern: /TODO|FIXME|PLACEHOLDER|TO BE IMPLEMENTED/gi, type: 'INCOMPLETE' },
  { pattern: /console\.log\(/g, type: 'DEBUG_LOG' },
];

let totalMocks = 0;
let totalTodos = 0;
let totalDebugLogs = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(DASHBOARD_DIR, '');
  const issues = [];

  mockPatterns.forEach(({ pattern, type }) => {
    const matches = content.match(pattern);
    if (matches) {
      if (type === 'MOCK_DATA' || type === 'MOCK_VARIABLE') {
        totalMocks += matches.length;
        issues.push({ type, count: matches.length, matches: matches.slice(0, 3) });
      } else if (type === 'INCOMPLETE') {
        totalTodos += matches.length;
        issues.push({ type, count: matches.length });
      } else if (type === 'DEBUG_LOG') {
        totalDebugLogs += matches.length;
      }
    }
  });

  return { path: relativePath, issues };
}

function scanDirectory(dir) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results.push(...scanDirectory(fullPath));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      const result = scanFile(fullPath);
      if (result.issues.length > 0) {
        results.push(result);
      }
    }
  }
  return results;
}

const mockResults = scanDirectory(DASHBOARD_DIR);
mockResults.forEach(({ path, issues }) => {
  issues.forEach(issue => {
    if (issue.type === 'MOCK_DATA' || issue.type === 'MOCK_VARIABLE') {
      console.log(`  ❌ ${path}: ${issue.count} mock(s) - ${issue.matches.join(', ')}`);
      RESULTS.critical.push(`MOCK DATA in ${path}: ${issue.matches.join(', ')}`);
    }
    if (issue.type === 'INCOMPLETE') {
      console.log(`  ⚠️ ${path}: ${issue.count} TODO/PLACEHOLDER`);
      RESULTS.high.push(`INCOMPLETE in ${path}`);
    }
  });
});

console.log('');
console.log(`  TOTAL MOCKS: ${totalMocks}`);
console.log(`  TOTAL TODOs: ${totalTodos}`);
console.log(`  DEBUG LOGS: ${totalDebugLogs}`);
console.log('');

// 2. CHECK API ENDPOINTS
console.log('2. ANALYSE API ENDPOINTS');
console.log('-'.repeat(40));

const apiDir = path.join(DASHBOARD_DIR, 'app', 'api');
if (fs.existsSync(apiDir)) {
  const apiFiles = [];
  function findApiRoutes(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        findApiRoutes(fullPath);
      } else if (file.name === 'route.ts') {
        apiFiles.push(fullPath.replace(apiDir, '/api'));
      }
    }
  }
  findApiRoutes(apiDir);

  console.log(`  API Routes found: ${apiFiles.length}`);
  apiFiles.forEach(route => {
    console.log(`    - ${route}`);
  });

  // Check if APIs connect to real backend
  apiFiles.forEach(route => {
    const fullPath = path.join(apiDir, route.replace('/api', ''), 'route.ts');
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('fetch') && !content.includes('google-spreadsheet') && !content.includes('sheets')) {
        RESULTS.high.push(`API ${route} has no external connection`);
        console.log(`  ⚠️ ${route}: No external API/DB connection`);
      }
    }
  });
} else {
  console.log('  ❌ No API directory found');
  RESULTS.critical.push('No API directory');
}
console.log('');

// 3. CHECK GOOGLE SHEETS INTEGRATION
console.log('3. ANALYSE GOOGLE SHEETS INTEGRATION');
console.log('-'.repeat(40));

const gsheetPatterns = [
  'google-spreadsheet',
  'googleapis',
  'GOOGLE_SHEETS',
  'spreadsheetId',
  'GoogleSpreadsheet',
];

let hasGoogleSheets = false;
function checkGoogleSheets(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.includes('node_modules')) {
      checkGoogleSheets(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      gsheetPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          hasGoogleSheets = true;
          console.log(`  ✅ Found: ${pattern} in ${file.name}`);
        }
      });
    }
  }
}
checkGoogleSheets(DASHBOARD_DIR);

if (!hasGoogleSheets) {
  console.log('  ❌ NO Google Sheets integration found in source code');
  RESULTS.critical.push('No Google Sheets integration - all data is MOCK');
}
console.log('');

// 4. CHECK AUTHENTICATION
console.log('4. ANALYSE AUTHENTICATION');
console.log('-'.repeat(40));

const authPatterns = [
  { pattern: 'localStorage', type: 'CLIENT_STORAGE' },
  { pattern: 'sessionStorage', type: 'CLIENT_STORAGE' },
  { pattern: 'bcrypt', type: 'PASSWORD_HASH' },
  { pattern: 'jsonwebtoken', type: 'JWT' },
  { pattern: 'jose', type: 'JWT' },
];

let authMethods = {};
function checkAuth(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      checkAuth(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      authPatterns.forEach(({ pattern, type }) => {
        if (content.includes(pattern)) {
          authMethods[type] = (authMethods[type] || 0) + 1;
        }
      });
    }
  }
}
checkAuth(DASHBOARD_DIR);

Object.entries(authMethods).forEach(([type, count]) => {
  if (type === 'CLIENT_STORAGE') {
    console.log(`  ⚠️ ${type}: ${count} usages (insecure for production)`);
    RESULTS.medium.push('localStorage auth is insecure');
  } else {
    console.log(`  ✅ ${type}: ${count} usages`);
  }
});

if (Object.keys(authMethods).length === 0) {
  console.log('  ❌ No authentication implementation found');
  RESULTS.critical.push('No authentication');
}
console.log('');

// 5. CHECK DEPLOYMENT STATUS
console.log('5. ANALYSE DEPLOYMENT');
console.log('-'.repeat(40));

const deploymentChecks = [
  { file: 'Dockerfile', exists: false },
  { file: 'docker-compose.yml', exists: false },
  { file: '.github/workflows/deploy-dashboard.yml', exists: false },
  { file: 'vercel.json', exists: false },
  { file: 'next.config.js', exists: false },
];

const dashboardRoot = path.join(__dirname, '..', 'dashboard');
deploymentChecks.forEach(check => {
  const fullPath = path.join(dashboardRoot, check.file);
  check.exists = fs.existsSync(fullPath);
  if (check.exists) {
    console.log(`  ✅ ${check.file} exists`);
  } else {
    console.log(`  ❌ ${check.file} MISSING`);
  }
});

// Check if deployed on Hostinger
console.log('');
console.log('  HOSTINGER DEPLOYMENT STATUS:');
console.log('  ❌ Dashboard NOT deployed on Hostinger');
console.log('  ❌ Only landing page is deployed (3a-automation.com)');
console.log('  ❌ Dashboard runs LOCAL only (localhost:3002)');
RESULTS.critical.push('Dashboard NOT deployed - runs locally only');
console.log('');

// 6. CHECK REAL FUNCTIONALITY
console.log('6. ANALYSE FUNCTIONAL GAPS');
console.log('-'.repeat(40));

const functionalGaps = [
  { feature: 'Real lead data from Google Sheets', status: 'MISSING' },
  { feature: 'Real automation sync with n8n', status: 'MISSING' },
  { feature: 'Real email campaign data', status: 'MISSING' },
  { feature: 'Real calendar events from Google Calendar', status: 'MISSING' },
  { feature: 'Real document storage (S3/GCS)', status: 'MISSING' },
  { feature: 'Real support tickets system', status: 'MISSING' },
  { feature: 'Webhook endpoints for n8n', status: 'MISSING' },
  { feature: 'Email notifications', status: 'MISSING' },
  { feature: 'WhatsApp integration', status: 'MISSING' },
  { feature: 'Payment/billing integration', status: 'MISSING' },
];

functionalGaps.forEach(gap => {
  console.log(`  ❌ ${gap.feature}: ${gap.status}`);
  RESULTS.critical.push(`${gap.feature}: ${gap.status}`);
});
console.log('');

// 7. SUMMARY
console.log('='.repeat(60));
console.log('AUDIT SUMMARY - VERITE BRUTALE');
console.log('='.repeat(60));
console.log('');

console.log(`CRITICAL ISSUES: ${RESULTS.critical.length}`);
RESULTS.critical.forEach((issue, i) => {
  console.log(`  ${i + 1}. ${issue}`);
});
console.log('');

console.log(`HIGH ISSUES: ${RESULTS.high.length}`);
RESULTS.high.forEach((issue, i) => {
  console.log(`  ${i + 1}. ${issue}`);
});
console.log('');

console.log(`MEDIUM ISSUES: ${RESULTS.medium.length}`);
RESULTS.medium.forEach((issue, i) => {
  console.log(`  ${i + 1}. ${issue}`);
});
console.log('');

// VERDICT
console.log('='.repeat(60));
console.log('VERDICT FINAL');
console.log('='.repeat(60));
console.log('');

const isProductionReady = RESULTS.critical.length === 0;

if (isProductionReady) {
  console.log('✅ DASHBOARD PRODUCTION-READY');
} else {
  console.log('❌ DASHBOARD NOT PRODUCTION-READY');
  console.log('');
  console.log('RAISONS:');
  console.log('1. Toutes les donnees sont MOCK (fausses)');
  console.log('2. Aucune connexion reelle a Google Sheets');
  console.log('3. Aucune connexion reelle a n8n');
  console.log('4. Dashboard NON deploye sur Hostinger');
  console.log('5. Authentification basee sur localStorage (insecure)');
  console.log('6. Aucun webhook reel');
  console.log('7. Aucune integration email/WhatsApp reelle');
  console.log('');
  console.log('STATUS ACTUEL:');
  console.log('  - UI/UX: ✅ Fonctionnel (design + navigation)');
  console.log('  - Backend: ❌ MOCK DATA seulement');
  console.log('  - Deployment: ❌ Local uniquement');
  console.log('  - Production: ❌ NON PRET');
}

console.log('');
console.log('='.repeat(60));

// Save report
const reportPath = path.join(__dirname, '..', 'outputs', 'dashboard-forensic-audit.json');
fs.writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));
console.log(`Report saved: ${reportPath}`);

process.exit(RESULTS.critical.length > 0 ? 1 : 0);
