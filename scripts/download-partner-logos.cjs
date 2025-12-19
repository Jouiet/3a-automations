#!/usr/bin/env node
/**
 * Download Partner Logos from Simple Icons CDN
 * Date: 2025-12-19
 * Version: 1.0
 *
 * Downloads SVG logos for all 24 partner integrations
 * Source: https://simpleicons.org via CDN
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Output directory
const LOGOS_DIR = path.join(__dirname, '../landing-page-hostinger/assets/logos');

// Mapping: Display Name → Simple Icons slug
// Reference: https://github.com/simple-icons/simple-icons/blob/develop/slugs.md
const LOGO_MAPPINGS = {
  // Ring 1 - Core Integrations
  'shopify': 'shopify',
  'klaviyo': 'klaviyo',
  'ga4': 'googleanalytics',
  'n8n': 'n8n',
  'gtm': 'googletagmanager',
  'dsers': null, // Not on Simple Icons - will create placeholder
  'flow': 'shopify', // Shopify Flow - use Shopify icon
  'gsc': 'googlesearchconsole',

  // Ring 2 - AI & Marketing
  'claude': 'anthropic',
  'grok': 'x', // xAI uses X branding
  'meta': 'meta',
  'tiktok': 'tiktok',
  'linkedin': 'linkedin',
  'gemini': 'googlegemini',
  'o1': 'openai',
  'googleads': 'googleads',

  // Ring 3 - Dev & Content
  'github': 'github',
  'leonardo': null, // Leonardo.ai - not on Simple Icons
  'kling': null, // Kling AI - not on Simple Icons
  'playwright': 'playwright',
  'devtools': 'googlechrome',
  'wordpress': 'wordpress',
  'hostinger': 'hostinger',
  'appsscript': 'google' // Google Apps Script - use Google icon
};

// Custom colors for each logo (hex without #)
const LOGO_COLORS = {
  'shopify': '7AB55C',
  'klaviyo': '22A875',
  'ga4': 'E37400',
  'n8n': 'EA4B71',
  'gtm': '246FDB',
  'gsc': '4285F4',
  'claude': 'D97757',
  'grok': 'FFFFFF',
  'meta': '0081FB',
  'tiktok': '000000',
  'linkedin': '0A66C2',
  'gemini': '8E75B2',
  'o1': '412991',
  'googleads': '4285F4',
  'github': '181717',
  'playwright': '2EAD33',
  'devtools': '4285F4',
  'wordpress': '21759B',
  'hostinger': '673DE6',
  'appsscript': '4285F4'
};

// Simple Icons CDN base URL
const SIMPLE_ICONS_CDN = 'https://cdn.simpleicons.org';

/**
 * Download a single logo from CDN
 */
async function downloadLogo(name, slug, color) {
  return new Promise((resolve, reject) => {
    if (!slug) {
      console.log(`⚠️  ${name}: No Simple Icons slug - will create placeholder`);
      resolve({ name, status: 'placeholder' });
      return;
    }

    const url = color
      ? `${SIMPLE_ICONS_CDN}/${slug}/${color}`
      : `${SIMPLE_ICONS_CDN}/${slug}`;

    const filePath = path.join(LOGOS_DIR, `${name}.svg`);

    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          handleResponse(res, name, filePath, resolve, reject);
        }).on('error', reject);
        return;
      }
      handleResponse(response, name, filePath, resolve, reject);
    }).on('error', reject);
  });
}

function handleResponse(response, name, filePath, resolve, reject) {
  if (response.statusCode !== 200) {
    console.log(`❌ ${name}: HTTP ${response.statusCode}`);
    resolve({ name, status: 'failed', code: response.statusCode });
    return;
  }

  let data = '';
  response.on('data', chunk => data += chunk);
  response.on('end', () => {
    // Add viewBox if missing and optimize
    let svg = data;

    // Ensure SVG has proper attributes
    if (!svg.includes('viewBox')) {
      svg = svg.replace('<svg', '<svg viewBox="0 0 24 24"');
    }

    fs.writeFileSync(filePath, svg);
    const size = Buffer.byteLength(svg, 'utf8');
    console.log(`✅ ${name}: ${(size / 1024).toFixed(2)} KB`);
    resolve({ name, status: 'success', size });
  });
  response.on('error', reject);
}

/**
 * Create placeholder SVG for logos not on Simple Icons
 */
function createPlaceholder(name, displayText) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <rect width="24" height="24" rx="4" fill="#1a1a2e"/>
  <text x="12" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#4FBAF1">${displayText.substring(0, 2).toUpperCase()}</text>
</svg>`;

  const filePath = path.join(LOGOS_DIR, `${name}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`🔧 ${name}: Placeholder created`);
  return { name, status: 'placeholder' };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Downloading Partner Logos from Simple Icons CDN\n');
  console.log(`📁 Output: ${LOGOS_DIR}\n`);

  // Ensure directory exists
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }

  const results = {
    success: [],
    failed: [],
    placeholder: []
  };

  // Download all logos
  for (const [name, slug] of Object.entries(LOGO_MAPPINGS)) {
    try {
      const color = LOGO_COLORS[name];
      const result = await downloadLogo(name, slug, color);

      if (result.status === 'success') {
        results.success.push(name);
      } else if (result.status === 'placeholder') {
        // Create placeholder for missing logos
        const displayNames = {
          'dsers': 'DS',
          'leonardo': 'LE',
          'kling': 'KL'
        };
        createPlaceholder(name, displayNames[name] || name.substring(0, 2));
        results.placeholder.push(name);
      } else {
        results.failed.push(name);
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      results.failed.push(name);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`🔧 Placeholder: ${results.placeholder.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log(`\nFailed logos: ${results.failed.join(', ')}`);
  }

  // Calculate total size
  const files = fs.readdirSync(LOGOS_DIR).filter(f => f.endsWith('.svg'));
  let totalSize = 0;
  files.forEach(f => {
    totalSize += fs.statSync(path.join(LOGOS_DIR, f)).size;
  });
  console.log(`\n📦 Total: ${files.length} logos, ${(totalSize / 1024).toFixed(2)} KB`);
}

main().catch(console.error);
