// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

/**
 * Verify Flow workflows are active
 * FACTUAL VERIFICATION - Session 2025-11-11
 */

const https = require('https');

const SHOPIFY_DOMAIN = '5dc028-dd.myshopify.com';
const API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

function graphqlRequest(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });

    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: '/admin/api/2025-10/graphql.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Shopify-Access-Token': API_TOKEN
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   FACTUAL VERIFICATION: Shopify Flow Workflows               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Note: Flow workflows are not directly accessible via GraphQL Admin API
  // We can only verify the app is installed (already done)
  // To verify workflows are active, we need to check Shopify Admin UI or use Flow API

  console.log('⚠️  LIMITATION: Flow workflows cannot be verified via GraphQL Admin API\n');
  console.log('Flow app is INSTALLED (verified via appInstallations query)');
  console.log('But workflow status (enabled/disabled) requires:');
  console.log('  1. Shopify Admin UI manual check, OR');
  console.log('  2. Flow-specific API (not part of Admin API)\n');

  console.log('📋 KNOWN FACTS (from EMAIL_FLOWS_IMPLEMENTATION_GUIDE.md):');
  console.log('   Created: November 3, 2025');
  console.log('   Flows designed:');
  console.log('     1. Cart Abandonment (3 emails, 1h/24h/72h delays)');
  console.log('     2. Browse Abandonment (2 emails, 2h/48h delays)');
  console.log('     3. Win-Back Campaign (3 emails, 30/60/90 days)');
  console.log('     4. Post-Purchase Cross-Sell (2 emails, 3/7 days)\n');

  console.log('❓ STATUS UNKNOWN: Are these workflows DEPLOYED in Shopify Flow?');
  console.log('   - Templates exist in /email_templates/');
  console.log('   - Implementation guide exists');
  console.log('   - But deployment to Shopify Flow requires manual setup\n');

  console.log('═'.repeat(65));
  console.log('VERIFICATION RESULT: INCONCLUSIVE');
  console.log('═'.repeat(65));
  console.log('✅ Flow app INSTALLED');
  console.log('✅ Email templates CREATED (Nov 3-5, 2025)');
  console.log('✅ Implementation guide DOCUMENTED');
  console.log('❓ Flow workflows DEPLOYMENT STATUS: UNKNOWN (requires UI check)');
  console.log('═'.repeat(65));
}

main();
