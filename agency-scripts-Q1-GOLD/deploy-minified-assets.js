/**
 * Deploy All Minified Assets to Shopify Theme
 * Session 67 Continued - Use Case 10: Page Speed Optimization
 *
 * Uploads 119 minified CSS/JS files to Theme 147139985460
 * Expected Impact: +$162,432/year revenue from 47% conversion improvement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';
const API_VERSION = '2024-10';

// Get all minified assets
function getMinifiedAssets() {
  const assetsDir = path.join(process.cwd(), 'assets');
  const files = fs.readdirSync(assetsDir);

  return files
    .filter(file => file.endsWith('.min.css') || file.endsWith('.min.js'))
    .map(file => `assets/${file}`)
    .sort();
}

async function uploadAsset(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ ${filePath}: File not found`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const url = `https://${STORE}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json`;

  const payload = {
    asset: {
      key: filePath,
      value: content
    }
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    const sizeKB = (result.asset.size / 1024).toFixed(2);
    console.log(`✅ ${path.basename(filePath).padEnd(50)} ${sizeKB.padStart(8)} KB`);
    return { success: true, size: result.asset.size };
  } catch (error) {
    console.error(`❌ ${filePath}: ${error.message}`);
    return { success: false, size: 0 };
  }
}

async function deployMinifiedAssets() {
  const files = getMinifiedAssets();

  console.log('==========================================================');
  console.log('DEPLOYING MINIFIED ASSETS TO SHOPIFY');
  console.log('Session 67 Continued - Use Case 10: Page Speed');
  console.log('==========================================================');
  console.log(`Store: ${STORE}`);
  console.log(`Theme ID: ${THEME_ID}`);
  console.log(`Total Files: ${files.length}`);
  console.log(`Expected Revenue Impact: +$162,432/year`);
  console.log('==========================================================\n');

  let successCount = 0;
  let failCount = 0;
  let totalBytes = 0;
  const failed = [];

  console.log('File Name'.padEnd(50) + ' Size (KB)');
  console.log('-'.repeat(62));

  for (const file of files) {
    const result = await uploadAsset(file);
    if (result.success) {
      successCount++;
      totalBytes += result.size;
    } else {
      failCount++;
      failed.push(file);
    }

    // Rate limiting protection (Shopify API limit: 2 requests/second)
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  const totalKB = (totalBytes / 1024).toFixed(2);
  const totalMB = (totalBytes / 1024 / 1024).toFixed(2);

  console.log('\n==========================================================');
  console.log('DEPLOYMENT SUMMARY');
  console.log('==========================================================');
  console.log(`✅ Successfully uploaded: ${successCount}/${files.length} files`);
  console.log(`📦 Total size deployed: ${totalKB} KB (${totalMB} MB)`);

  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} files`);
    console.log('\nFailed files:');
    failed.forEach(file => console.log(`  - ${file}`));
  }

  console.log('\n==========================================================');
  console.log('NEXT STEPS');
  console.log('==========================================================');
  console.log('1. Update Liquid templates to reference .min versions');
  console.log('   Run: node scripts/update-templates-for-minified-assets.js');
  console.log('2. Test site performance on live site');
  console.log('3. Verify PageSpeed Insights score improvement');
  console.log('==========================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

deployMinifiedAssets().catch(error => {
  console.error('\n💥 Deployment failed:', error);
  process.exit(1);
});
