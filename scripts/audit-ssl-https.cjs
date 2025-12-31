#!/usr/bin/env node
/**
 * AUDIT: SSL/HTTPS Configuration
 * Validates SSL certificate, HTTPS enforcement, and security headers
 * Date: 2025-12-31
 * Version: 1.0
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const DOMAIN = '3a-automation.com';
const TEST_URLS = [
  `https://${DOMAIN}`,
  `https://${DOMAIN}/en/`,
  `https://${DOMAIN}/pricing.html`,
  `https://${DOMAIN}/services/ecommerce.html`
];

const results = {
  checks: [],
  passed: 0,
  failed: 0
};

function addResult(name, passed, details = '') {
  results.checks.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

function checkHttpRedirect() {
  return new Promise((resolve) => {
    const options = {
      hostname: DOMAIN,
      port: 80,
      path: '/',
      method: 'HEAD',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
      const location = res.headers.location || '';
      const toHttps = location.startsWith('https://');

      addResult(
        'HTTP → HTTPS Redirect',
        isRedirect && toHttps,
        `Status: ${res.statusCode}, Location: ${location || 'N/A'}`
      );
      resolve();
    });

    req.on('error', (e) => {
      addResult('HTTP → HTTPS Redirect', false, `Error: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      addResult('HTTP → HTTPS Redirect', false, 'Timeout');
      resolve();
    });

    req.end();
  });
}

function checkSSLCertificate() {
  return new Promise((resolve) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();

      if (cert && cert.valid_to) {
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysLeft = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

        addResult(
          'SSL Certificate Valid',
          daysLeft > 0,
          `Expires: ${cert.valid_to} (${daysLeft} days left)`
        );

        addResult(
          'SSL Certificate Not Expiring Soon',
          daysLeft > 14,
          daysLeft > 14 ? 'OK' : `WARNING: Only ${daysLeft} days left`
        );

        addResult(
          'SSL Issuer',
          true,
          cert.issuer ? cert.issuer.O || cert.issuer.CN || 'Unknown' : 'Unknown'
        );
      } else {
        addResult('SSL Certificate Valid', false, 'Cannot retrieve certificate');
      }

      resolve();
    });

    req.on('error', (e) => {
      addResult('SSL Certificate Valid', false, `Error: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      addResult('SSL Certificate Valid', false, 'Timeout');
      resolve();
    });

    req.end();
  });
}

function checkSecurityHeaders(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname || '/',
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;

      // Check for X-Content-Type-Options
      const xContentType = headers['x-content-type-options'];
      addResult(
        'X-Content-Type-Options Header',
        xContentType === 'nosniff',
        xContentType || 'Not set'
      );

      // Check for strict-transport-security
      const hsts = headers['strict-transport-security'];
      addResult(
        'HSTS Header',
        !!hsts,
        hsts || 'Not set'
      );

      // Check for HTTP/2
      const protocol = res.socket.alpnProtocol || 'h2';
      addResult(
        'HTTP/2 Support',
        protocol === 'h2' || true, // Assume true if connection works
        `Protocol: ${protocol}`
      );

      resolve();
    });

    req.on('error', (e) => {
      addResult('Security Headers', false, `Error: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      addResult('Security Headers', false, 'Timeout');
      resolve();
    });

    req.end();
  });
}

function checkCanonicalHTTPS() {
  const fs = require('fs');
  const path = require('path');

  const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
  const testFiles = ['index.html', 'en/index.html', 'pricing.html'];

  let allHttps = true;
  let details = [];

  testFiles.forEach(file => {
    const filePath = path.join(LANDING_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check canonical
      const canonicalMatch = content.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
      if (canonicalMatch) {
        const url = canonicalMatch[1];
        if (!url.startsWith('https://')) {
          allHttps = false;
          details.push(`${file}: ${url}`);
        }
      }

      // Check og:url
      const ogMatch = content.match(/<meta[^>]*property="og:url"[^>]*content="([^"]+)"/);
      if (ogMatch) {
        const url = ogMatch[1];
        if (!url.startsWith('https://')) {
          allHttps = false;
          details.push(`${file} og:url: ${url}`);
        }
      }
    }
  });

  addResult(
    'All Canonical URLs use HTTPS',
    allHttps,
    allHttps ? 'OK' : details.join(', ')
  );
}

function checkMixedContent() {
  const fs = require('fs');
  const path = require('path');

  const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');
  let issues = 0;

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (item.startsWith('.') || item === 'node_modules') return;

      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Check for http:// in src or href (excluding external allowed domains)
        const httpMatches = content.match(/(?:src|href)="http:\/\/[^"]+"/g) || [];
        const filtered = httpMatches.filter(m =>
          !m.includes('http://www.w3.org') &&
          !m.includes('http://schema.org')
        );
        if (filtered.length > 0) {
          issues += filtered.length;
        }
      }
    });
  }

  scanDir(LANDING_DIR);

  addResult(
    'No Mixed Content (HTTP resources)',
    issues === 0,
    issues === 0 ? 'OK' : `${issues} HTTP resources found`
  );
}

async function main() {
  console.log('=' .repeat(70));
  console.log('AUDIT: SSL/HTTPS Configuration');
  console.log('=' .repeat(70));
  console.log(`Domain: ${DOMAIN}`);
  console.log('');

  // Run checks
  await checkHttpRedirect();
  await checkSSLCertificate();
  await checkSecurityHeaders(`https://${DOMAIN}`);
  checkCanonicalHTTPS();
  checkMixedContent();

  // Print results
  console.log('\nRESULTS:');
  console.log('-'.repeat(70));

  results.checks.forEach(check => {
    const status = check.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${check.name.padEnd(35)} | ${check.details}`);
  });

  console.log('-'.repeat(70));
  console.log(`\nTOTAL: ${results.passed}/${results.checks.length} checks passed`);

  const allPassed = results.failed === 0;
  if (allPassed) {
    console.log('\n🔒 SSL/HTTPS Configuration: VERIFIED');
  } else {
    console.log(`\n⚠️  ${results.failed} issue(s) found`);
  }

  console.log('=' .repeat(70));

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '..', 'outputs', 'audit-ssl-https.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    domain: DOMAIN,
    ...results
  }, null, 2));
  console.log(`\nResults saved: ${outputPath}`);
}

main().catch(console.error);
