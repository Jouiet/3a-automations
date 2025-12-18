#!/usr/bin/env node
/**
 * AUDIT: Klaviyo Email Flows (Empirical Verification)
 * Purpose: Verify Klaviyo integration and active email flows
 * Method: Klaviyo API v2024-10-15
 * User note: "Klaviyo API is working!"
 */

require('dotenv').config({ path: '.env' });
const https = require('https');
const fs = require('fs');

// Klaviyo API credentials (check .env)
const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY || process.env.KLAVIYO_PRIVATE_KEY;

console.log('================================================================================');
console.log('KLAVIYO EMAIL FLOWS AUDIT - EMPIRICAL VERIFICATION');
console.log('================================================================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`API Key: ${KLAVIYO_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log('================================================================================\n');

if (!KLAVIYO_API_KEY) {
  console.log('⚠️  KLAVIYO_API_KEY not found in .env\n');
  console.log('To enable Klaviyo API verification:');
  console.log('1. Get API key from: https://www.klaviyo.com/account#api-keys-tab');
  console.log('2. Add to .env: KLAVIYO_API_KEY=pk_...');
  console.log('3. Re-run this script\n');
  console.log('Note: Klaviyo was found installed via Shopify Admin API');
  console.log('      This script will verify email flows once API key is configured\n');
  process.exit(0);
}

/**
 * Execute Klaviyo API request
 */
async function klaviyoRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'a.klaviyo.com',
      path: `/api/${endpoint}`,
      method,
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        'Accept': 'application/json',
        'revision': '2024-10-15'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Klaviyo API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Main audit
 */
async function main() {
  try {
    console.log('1. KLAVIYO ACCOUNT INFO:');
    console.log('─'.repeat(80) + '\n');

    // Get account info
    const account = await klaviyoRequest('accounts');
    const accountData = account.data[0]?.attributes || {};

    console.log(`   Account Name: ${accountData.test_account ? '🧪 TEST ACCOUNT' : accountData.contact_information?.default_sender_name || 'N/A'}`);
    console.log(`   Email: ${accountData.contact_information?.default_sender_email || 'N/A'}`);
    console.log(`   Timezone: ${accountData.timezone || 'N/A'}`);
    console.log(`   Currency: ${accountData.currency || 'N/A'}\n`);

    console.log('2. KLAVIYO FLOWS (AUTOMATIONS):');
    console.log('─'.repeat(80) + '\n');

    // Get flows
    const flows = await klaviyoRequest('flows');
    const flowsList = flows.data || [];

    console.log(`   Total flows: ${flowsList.length}\n`);

    if (flowsList.length === 0) {
      console.log('   ℹ️  No flows found in Klaviyo account\n');
    } else {
      flowsList.forEach((flow, index) => {
        const attrs = flow.attributes;
        console.log(`   ${index + 1}. ${attrs.name}`);
        console.log(`      ID: ${flow.id}`);
        console.log(`      Status: ${attrs.status}`);
        console.log(`      Trigger Type: ${attrs.trigger_type || 'N/A'}`);
        console.log(`      Created: ${attrs.created ? new Date(attrs.created).toLocaleDateString() : 'N/A'}`);
        console.log(`      Updated: ${attrs.updated ? new Date(attrs.updated).toLocaleDateString() : 'N/A'}`);
        console.log('');
      });
    }

    console.log('3. KLAVIYO LISTS:');
    console.log('─'.repeat(80) + '\n');

    // Get lists
    const lists = await klaviyoRequest('lists');
    const listsList = lists.data || [];

    console.log(`   Total lists: ${listsList.length}\n`);

    listsList.forEach((list, index) => {
      const attrs = list.attributes;
      console.log(`   ${index + 1}. ${attrs.name}`);
      console.log(`      ID: ${list.id}`);
      console.log(`      Profile count: ${attrs.profile_count || 0}`);
      console.log(`      Created: ${attrs.created ? new Date(attrs.created).toLocaleDateString() : 'N/A'}`);
      console.log('');
    });

    console.log('4. KLAVIYO SEGMENTS:');
    console.log('─'.repeat(80) + '\n');

    // Get segments
    const segments = await klaviyoRequest('segments');
    const segmentsList = segments.data || [];

    console.log(`   Total segments: ${segmentsList.length}\n`);

    segmentsList.forEach((segment, index) => {
      const attrs = segment.attributes;
      console.log(`   ${index + 1}. ${attrs.name}`);
      console.log(`      ID: ${segment.id}`);
      console.log(`      Profile count: ${attrs.profile_count || 0}`);
      console.log(`      Created: ${attrs.created ? new Date(attrs.created).toLocaleDateString() : 'N/A'}`);
      console.log('');
    });

    // Summary
    console.log('================================================================================');
    console.log('KLAVIYO INTEGRATION SUMMARY');
    console.log('================================================================================\n');

    console.log(`✅ Klaviyo API: WORKING`);
    console.log(`   Account: ${accountData.test_account ? '🧪 TEST' : '✅ PRODUCTION'}`);
    console.log(`   Flows: ${flowsList.length}`);
    console.log(`   Lists: ${listsList.length}`);
    console.log(`   Segments: ${segmentsList.length}\n`);

    console.log('INTEGRATION STATUS:');
    console.log('   - Klaviyo app installed: ✅ (verified via Shopify Admin API)');
    console.log('   - Klaviyo API accessible: ✅');
    console.log('   - Email flows configured: ' + (flowsList.length > 0 ? '✅' : '⏳ Not yet')+ '\n');

    if (flowsList.length === 0) {
      console.log('NEXT STEPS:');
      console.log('1. Configure email flows in Klaviyo dashboard');
      console.log('2. Integrate with Shopify events (abandoned cart, post-purchase, etc.)');
      console.log('3. Re-run this script to verify flows\n');
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      account: {
        name: accountData.contact_information?.default_sender_name,
        email: accountData.contact_information?.default_sender_email,
        timezone: accountData.timezone,
        currency: accountData.currency,
        test_account: accountData.test_account
      },
      flows: flowsList.map(f => ({
        id: f.id,
        name: f.attributes.name,
        status: f.attributes.status,
        trigger_type: f.attributes.trigger_type,
        created: f.attributes.created,
        updated: f.attributes.updated
      })),
      lists: listsList.map(l => ({
        id: l.id,
        name: l.attributes.name,
        profile_count: l.attributes.profile_count,
        created: l.attributes.created
      })),
      segments: segmentsList.map(s => ({
        id: s.id,
        name: s.attributes.name,
        profile_count: s.attributes.profile_count,
        created: s.attributes.created
      })),
      summary: {
        api_working: true,
        total_flows: flowsList.length,
        total_lists: listsList.length,
        total_segments: segmentsList.length
      }
    };

    const reportPath = '/tmp/klaviyo-audit.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📁 Report saved:', reportPath + '\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify KLAVIYO_API_KEY in .env');
    console.error('2. Check API key permissions in Klaviyo dashboard');
    console.error('3. Ensure Klaviyo app is properly connected to Shopify\n');
    process.exit(1);
  }
}

main();
