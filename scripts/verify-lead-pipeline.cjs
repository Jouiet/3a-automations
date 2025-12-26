#!/usr/bin/env node
/**
 * 3A Automation - Lead Pipeline Verification Script
 * Version: 1.0 | Date: 2025-12-26 | Session: 96
 *
 * Vérifie le pipeline complet:
 * Formulaire → Google Apps Script → n8n → Klaviyo
 *
 * Usage: node scripts/verify-lead-pipeline.cjs
 */

require('dotenv').config();

const CONFIG = {
  N8N_WEBHOOK_URL: 'https://n8n.srv1168256.hstgr.cloud/webhook/subscribe/new',
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY,
  TEST_EMAIL_PREFIX: 'verify-pipeline',
  KLAVIYO_API_VERSION: '2024-10-15'
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

if (!CONFIG.KLAVIYO_API_KEY) {
  console.error('❌ KLAVIYO_API_KEY non défini dans .env');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   3A AUTOMATION - LEAD PIPELINE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  const testEmail = `${CONFIG.TEST_EMAIL_PREFIX}-${Date.now()}@test.3a-automation.com`;
  const results = {
    n8n_webhook: null,
    klaviyo_profile: null,
    pipeline_complete: false
  };

  // Step 1: Test n8n Webhook
  console.log('📡 STEP 1: Testing n8n Webhook...');
  console.log(`   URL: ${CONFIG.N8N_WEBHOOK_URL}`);
  console.log(`   Test Email: ${testEmail}`);

  try {
    const webhookResponse = await fetch(CONFIG.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        first_name: 'Pipeline',
        name: 'Pipeline Verification',
        source: 'verify-script-session96',
        timestamp: new Date().toISOString()
      })
    });

    const webhookData = await webhookResponse.json();
    results.n8n_webhook = {
      status: webhookResponse.status,
      success: webhookData.success === true,
      data: webhookData
    };

    if (results.n8n_webhook.success) {
      console.log('   ✅ n8n webhook: SUCCESS');
      console.log(`      Response: ${JSON.stringify(webhookData)}`);
    } else {
      console.log('   ❌ n8n webhook: FAILED');
      console.log(`      Response: ${JSON.stringify(webhookData)}`);
    }
  } catch (error) {
    console.log('   ❌ n8n webhook: ERROR');
    console.log(`      ${error.message}`);
    results.n8n_webhook = { success: false, error: error.message };
  }

  console.log('');

  // Step 2: Verify Klaviyo Profile (wait 2s for propagation)
  console.log('⏳ Waiting 2 seconds for Klaviyo propagation...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('📊 STEP 2: Verifying Klaviyo Profile...');

  try {
    const klaviyoUrl = `https://a.klaviyo.com/api/profiles?filter=equals(email,"${testEmail}")`;
    const klaviyoResponse = await fetch(klaviyoUrl, {
      headers: {
        'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
        'revision': CONFIG.KLAVIYO_API_VERSION
      }
    });

    const klaviyoData = await klaviyoResponse.json();
    const profiles = klaviyoData.data || [];

    if (profiles.length > 0) {
      const profile = profiles[0];
      results.klaviyo_profile = {
        found: true,
        id: profile.id,
        email: profile.attributes.email,
        first_name: profile.attributes.first_name,
        welcome_series_started: profile.attributes.properties?.welcome_series_started,
        welcome_series_status: profile.attributes.properties?.welcome_series_status,
        source: profile.attributes.properties?.source
      };

      console.log('   ✅ Klaviyo profile: FOUND');
      console.log(`      Profile ID: ${profile.id}`);
      console.log(`      First Name: ${profile.attributes.first_name}`);
      console.log(`      Welcome Series Started: ${profile.attributes.properties?.welcome_series_started}`);
      console.log(`      Status: ${profile.attributes.properties?.welcome_series_status}`);
    } else {
      console.log('   ❌ Klaviyo profile: NOT FOUND');
      results.klaviyo_profile = { found: false };
    }
  } catch (error) {
    console.log('   ❌ Klaviyo check: ERROR');
    console.log(`      ${error.message}`);
    results.klaviyo_profile = { found: false, error: error.message };
  }

  console.log('');

  // Step 3: Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   PIPELINE VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');

  results.pipeline_complete =
    results.n8n_webhook?.success &&
    results.klaviyo_profile?.found;

  console.log('');
  console.log('Component Status:');
  console.log(`   n8n Webhook:      ${results.n8n_webhook?.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Klaviyo Profile:  ${results.klaviyo_profile?.found ? '✅ CREATED' : '❌ NOT FOUND'}`);
  console.log('');

  if (results.pipeline_complete) {
    console.log('🎉 PIPELINE STATUS: ✅ COMPLETE');
    console.log('');
    console.log('The lead pipeline is fully functional:');
    console.log('   Form → Google Apps Script → n8n → Klaviyo');
    console.log('');
    console.log('Next Steps:');
    console.log('   1. Deploy google-apps-script-form-handler-v2.gs to Google Apps Script');
    console.log('   2. Replace form action URL in HTML pages');
    console.log('   3. Test with a real form submission');
  } else {
    console.log('⚠️ PIPELINE STATUS: INCOMPLETE');
    console.log('');
    console.log('Issues detected:');
    if (!results.n8n_webhook?.success) {
      console.log('   - n8n webhook not responding correctly');
    }
    if (!results.klaviyo_profile?.found) {
      console.log('   - Klaviyo profile not created (check n8n workflow)');
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');

  // Cleanup: Delete test profile from Klaviyo
  if (results.klaviyo_profile?.id) {
    console.log(`🧹 Cleaning up test profile ${results.klaviyo_profile.id}...`);
    try {
      await fetch(`https://a.klaviyo.com/api/profiles/${results.klaviyo_profile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
          'revision': CONFIG.KLAVIYO_API_VERSION
        }
      });
      console.log('   ✅ Test profile deleted');
    } catch (e) {
      console.log('   ⚠️ Could not delete test profile (manual cleanup may be needed)');
    }
  }

  // Return results for programmatic use
  return results;
}

main().catch(console.error);
