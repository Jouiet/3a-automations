#!/usr/bin/env node
/**
 * VERIFY: HubSpot Installation Status
 * Purpose: Check if HubSpot app is installed or removed
 * Method: Check metafields namespace "hubspot" via Admin API
 * Context: Session 98+ - Resolving Dec 3 vs Dec 5 inconsistency
 */

require('dotenv').config({ path: '.env' });
const https = require('https');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
if (!SHOPIFY_STORE) {
  console.error('❌ ERROR: SHOPIFY_STORE_DOMAIN not set in .env');
  process.exit(1);
}
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ ERROR: SHOPIFY_ACCESS_TOKEN not set in .env');
  process.exit(1);
}

console.log('================================================================================');
console.log('HUBSPOT INSTALLATION STATUS - FACTUAL VERIFICATION');
console.log('================================================================================');
console.log(`Store: ${SHOPIFY_STORE}`);
console.log(`API Version: 2025-10`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================================\n');

/**
 * Check for HubSpot metafields (indicates app installation)
 */
async function checkHubSpotMetafields() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: '/admin/api/2025-10/metafields.json?namespace=hubspot&limit=50',
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Main verification
 */
async function main() {
  try {
    console.log('1. CHECKING HUBSPOT METAFIELDS:\n');

    const metafieldsResponse = await checkHubSpotMetafields();
    const metafields = metafieldsResponse.metafields || [];

    console.log(`   Total HubSpot metafields found: ${metafields.length}\n`);

    if (metafields.length > 0) {
      console.log('   Metafields details:');
      metafields.forEach((field, index) => {
        console.log(`   ${index + 1}. Key: ${field.key}`);
        console.log(`      Namespace: ${field.namespace}`);
        console.log(`      Owner: ${field.owner_resource || 'shop'}`);
        console.log(`      Created: ${field.created_at}`);
        console.log(`      Updated: ${field.updated_at}\n`);
      });
    }

    console.log('================================================================================');
    console.log('VERDICT - HUBSPOT STATUS');
    console.log('================================================================================\n');

    if (metafields.length > 0) {
      console.log('✅ HUBSPOT IS INSTALLED');
      console.log(`   Evidence: ${metafields.length} metafield(s) in "hubspot" namespace`);
      console.log('   Conclusion: App is active (metafields persist after installation)\n');
      console.log('⚠️  INCONSISTENCY DETECTED:');
      console.log('   Document says "HubSpot removed Dec 5" but metafields still exist');
      console.log('   Possible scenarios:');
      console.log('   1. App was re-installed after Dec 5');
      console.log('   2. Documentation error (app never removed)');
      console.log('   3. Metafields not cleaned up after uninstall\n');
    } else {
      console.log('❌ HUBSPOT NOT INSTALLED (or fully removed)');
      console.log('   Evidence: 0 metafields in "hubspot" namespace');
      console.log('   Conclusion: App removed OR never configured\n');
    }

    console.log('================================================================================');
    console.log('RECOMMENDATION');
    console.log('================================================================================\n');

    if (metafields.length > 0) {
      console.log('1. Verify HubSpot app in Shopify Admin: Apps section');
      console.log('2. Check HubSpot portal 147315888 for active connections');
      console.log('3. Update documentation with current factual state\n');
    } else {
      console.log('1. Update documentation: Confirm HubSpot removed Dec 5 (verified)');
      console.log('2. Complementarity matrix: Flow (8) + Email (22) only (no HubSpot)\n');
    }

    console.log('================================================================================\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
