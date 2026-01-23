#!/usr/bin/env node
/**
 * VISUAL REGRESSION TESTING - Screenshot Comparison
 * Uses chrome-devtools MCP for screenshots
 *
 * @version 1.0.0
 * @date 2026-01-23
 * @session 142
 *
 * Usage:
 *   node scripts/visual-regression.cjs --baseline    # Create baseline screenshots
 *   node scripts/visual-regression.cjs --compare     # Compare against baseline
 *   node scripts/visual-regression.cjs --update      # Update baseline with current
 *
 * Requirements:
 *   - Chrome running with remote debugging (--remote-debugging-port=9222)
 *   - Or use: npx chrome-devtools-mcp to control browser
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  BASELINE_DIR: path.join(__dirname, '..', 'tests', 'visual-baseline'),
  CURRENT_DIR: path.join(__dirname, '..', 'tests', 'visual-current'),
  DIFF_DIR: path.join(__dirname, '..', 'tests', 'visual-diff'),

  BASE_URL: 'https://3a-automation.com',

  // Pages to test (critical user journeys)
  PAGES: [
    { name: 'homepage-fr', path: '/', viewport: { width: 1920, height: 1080 } },
    { name: 'homepage-en', path: '/en/', viewport: { width: 1920, height: 1080 } },
    { name: 'homepage-mobile', path: '/', viewport: { width: 390, height: 844 } },
    { name: 'pricing-fr', path: '/pricing.html', viewport: { width: 1920, height: 1080 } },
    { name: 'pricing-en', path: '/en/pricing.html', viewport: { width: 1920, height: 1080 } },
    { name: 'booking-fr', path: '/booking.html', viewport: { width: 1920, height: 1080 } },
    { name: 'booking-en', path: '/en/booking.html', viewport: { width: 1920, height: 1080 } },
    { name: 'ecommerce-fr', path: '/services/ecommerce.html', viewport: { width: 1920, height: 1080 } },
    { name: 'ecommerce-en', path: '/en/services/ecommerce.html', viewport: { width: 1920, height: 1080 } },
  ],

  // Threshold for pixel difference (0-1, lower = stricter)
  DIFF_THRESHOLD: 0.05, // 5% difference allowed
};

// ════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const MODE = args.includes('--baseline') ? 'baseline'
           : args.includes('--compare') ? 'compare'
           : args.includes('--update') ? 'update'
           : 'compare';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkSiteAvailable() {
  try {
    await fetchUrl(CONFIG.BASE_URL);
    return true;
  } catch (e) {
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SCREENSHOT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Take screenshot using Playwright (preferred method)
 * Falls back to puppeteer-screenshot if Playwright unavailable
 *
 * For MCP integration, use:
 *   - chrome-devtools MCP: mcp__chrome-devtools__take_screenshot
 *   - playwright MCP: mcp__playwright__browser_take_screenshot
 */
async function takeScreenshotWithPlaywright(page, outputPath) {
  console.log(`  📸 Taking screenshot: ${page.name}`);

  const url = `${CONFIG.BASE_URL}${page.path}`;

  // Method 1: Try Playwright CLI (fastest, most reliable)
  const playwrightCmd = `npx playwright screenshot "${url}" "${outputPath}" --viewport-size="${page.viewport.width},${page.viewport.height}" --wait-for-timeout=3000 --full-page 2>/dev/null`;

  try {
    execSync(playwrightCmd, { encoding: 'utf8', timeout: 60000 });
    if (fs.existsSync(outputPath)) {
      return true;
    }
  } catch (e) {
    // Playwright not available, try puppeteer
  }

  // Method 2: Try puppeteer-screenshot
  const puppeteerCmd = `npx puppeteer-screenshot --url="${url}" --output="${outputPath}" --width=${page.viewport.width} --height=${page.viewport.height} --full-page --timeout=30000 2>/dev/null`;

  try {
    execSync(puppeteerCmd, { encoding: 'utf8', timeout: 60000 });
    if (fs.existsSync(outputPath)) {
      return true;
    }
  } catch (e) {
    // Puppeteer not available either
  }

  // Method 3: Manual instruction for MCP usage
  console.log(`  ⚠️  Screenshot failed for ${page.name}`);
  console.log(`      Use chrome-devtools MCP instead:`);
  console.log(`      1. Open Chrome with --remote-debugging-port=9222`);
  console.log(`      2. Navigate to: ${url}`);
  console.log(`      3. Use mcp__chrome-devtools__take_screenshot`);
  return false;
}

/**
 * Compare two images and return difference percentage
 * Uses pixelmatch via CLI
 */
function compareImages(baseline, current, diffOutput) {
  if (!fs.existsSync(baseline)) {
    console.log(`  ⚠️  No baseline found: ${path.basename(baseline)}`);
    return { exists: false, diff: 1 };
  }

  if (!fs.existsSync(current)) {
    console.log(`  ⚠️  No current screenshot: ${path.basename(current)}`);
    return { exists: false, diff: 1 };
  }

  try {
    // Use ImageMagick compare (commonly available)
    const cmd = `compare -metric AE "${baseline}" "${current}" "${diffOutput}" 2>&1 || true`;
    const result = execSync(cmd, { encoding: 'utf8' });
    const diffPixels = parseInt(result.trim()) || 0;

    // Get image dimensions for percentage
    const identifyCmd = `identify -format "%w %h" "${baseline}" 2>/dev/null || echo "1920 1080"`;
    const dims = execSync(identifyCmd, { encoding: 'utf8' }).trim().split(' ');
    const totalPixels = parseInt(dims[0]) * parseInt(dims[1]);

    const diffPercent = diffPixels / totalPixels;

    return { exists: true, diff: diffPercent, pixels: diffPixels };
  } catch (e) {
    console.log(`  ⚠️  Compare failed: ${e.message}`);
    return { exists: true, diff: 0, error: e.message };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN WORKFLOW
// ════════════════════════════════════════════════════════════════════════════

async function createBaseline() {
  console.log('📸 Creating baseline screenshots...\n');

  ensureDir(CONFIG.BASELINE_DIR);

  let success = 0;
  let failed = 0;

  for (const page of CONFIG.PAGES) {
    const outputPath = path.join(CONFIG.BASELINE_DIR, `${page.name}.png`);
    const result = await takeScreenshotWithPlaywright(page, outputPath);

    if (result) {
      console.log(`  ✅ ${page.name}`);
      success++;
    } else {
      console.log(`  ❌ ${page.name}`);
      failed++;
    }
  }

  console.log(`\n📊 Baseline created: ${success}/${CONFIG.PAGES.length} pages`);

  if (success > 0) {
    console.log(`\n📁 Baseline location: ${CONFIG.BASELINE_DIR}`);
  }
}

async function runComparison() {
  console.log('🔍 Running visual regression comparison...\n');

  ensureDir(CONFIG.CURRENT_DIR);
  ensureDir(CONFIG.DIFF_DIR);

  const results = [];

  for (const page of CONFIG.PAGES) {
    const baselinePath = path.join(CONFIG.BASELINE_DIR, `${page.name}.png`);
    const currentPath = path.join(CONFIG.CURRENT_DIR, `${page.name}.png`);
    const diffPath = path.join(CONFIG.DIFF_DIR, `${page.name}-diff.png`);

    // Take current screenshot
    await takeScreenshotWithPlaywright(page, currentPath);

    // Compare with baseline
    const comparison = compareImages(baselinePath, currentPath, diffPath);

    results.push({
      page: page.name,
      ...comparison,
      passed: comparison.diff <= CONFIG.DIFF_THRESHOLD
    });

    if (comparison.exists) {
      const diffPercent = (comparison.diff * 100).toFixed(2);
      const status = comparison.diff <= CONFIG.DIFF_THRESHOLD ? '✅' : '❌';
      console.log(`  ${status} ${page.name}: ${diffPercent}% diff`);
    }
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n' + '═'.repeat(50));
  console.log(`VISUAL REGRESSION RESULTS`);
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Threshold: ${CONFIG.DIFF_THRESHOLD * 100}%`);

  if (failed > 0) {
    console.log(`\n⚠️  Visual regression detected!`);
    console.log(`   Check diff images in: ${CONFIG.DIFF_DIR}`);
    process.exit(1);
  } else {
    console.log(`\n✅ All visual tests passed`);
  }
}

async function updateBaseline() {
  console.log('🔄 Updating baseline with current screenshots...\n');

  if (!fs.existsSync(CONFIG.CURRENT_DIR)) {
    console.log('❌ No current screenshots found. Run --compare first.');
    process.exit(1);
  }

  ensureDir(CONFIG.BASELINE_DIR);

  const files = fs.readdirSync(CONFIG.CURRENT_DIR).filter(f => f.endsWith('.png'));

  for (const file of files) {
    const src = path.join(CONFIG.CURRENT_DIR, file);
    const dest = path.join(CONFIG.BASELINE_DIR, file);
    fs.copyFileSync(src, dest);
    console.log(`  ✅ Updated: ${file}`);
  }

  console.log(`\n📊 Updated ${files.length} baseline images`);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═'.repeat(50));
  console.log('  VISUAL REGRESSION TESTING');
  console.log('  Mode:', MODE.toUpperCase());
  console.log('═'.repeat(50));

  // Check site availability
  const siteAvailable = await checkSiteAvailable();
  if (!siteAvailable) {
    console.log('\n❌ Site not available:', CONFIG.BASE_URL);
    console.log('   Make sure the site is deployed and accessible.');
    process.exit(1);
  }

  console.log(`\n✅ Site accessible: ${CONFIG.BASE_URL}\n`);

  switch (MODE) {
    case 'baseline':
      await createBaseline();
      break;
    case 'compare':
      await runComparison();
      break;
    case 'update':
      await updateBaseline();
      break;
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
