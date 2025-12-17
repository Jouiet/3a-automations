#!/usr/bin/env node

/**
 * APIFY FACEBOOK GROUPS SCRAPER - TEST RUN
 *
 * Purpose: Test lead generation from motorcycle groups (Daily Commuters priority)
 * Target: LA/SF/Seattle/NYC motorcycle groups
 * Budget: Small test run (~$2-5)
 *
 * VERIFICATION REQUIRED:
 * 1. Execute script
 * 2. Check dataset results
 * 3. Verify lead quality (emails, location, recent posts)
 * 4. Document findings before scaling
 */

const APIFY_TOKEN = 'apify_api_CjGBvorJEO5VIu5MEqTMkhepvLpQxY1c0Rx0';
const ACTOR_ID = 'apify/facebook-groups-scraper';

// TEST CONFIGURATION - Small scale first
const testConfig = {
  // Target Groups (Public motorcycle groups in Tier 1 markets)
  startUrls: [
    // Los Angeles
    { url: 'https://www.facebook.com/groups/losangelesriders' },
    { url: 'https://www.facebook.com/groups/lamotorcycle' },

    // San Francisco / Bay Area
    { url: 'https://www.facebook.com/groups/bayareamotorcycle' },

    // Seattle
    { url: 'https://www.facebook.com/groups/seattleriders' },

    // NYC
    { url: 'https://www.facebook.com/groups/nycmotorcyclists' }
  ],

  // Search for BUYERS (people asking for recommendations)
  searchTerms: [
    'recommend helmet',
    'buy jacket',
    'looking for gloves',
    'need gear',
    'what helmet',
    'best motorcycle jacket'
  ],

  // Time filter - only recent posts (active buyers)
  postsFromLastDays: 30,

  // Limit for test run (small sample)
  maxPosts: 50, // Total across all groups

  // Extract contact info if available
  extractEmails: true,
  extractPhoneNumbers: false,

  // Proxy configuration (required for Facebook)
  proxy: {
    useApifyProxy: true,
    apifyProxyGroups: ['RESIDENTIAL']
  }
};

async function runApifyTest() {
  console.log('🎯 APIFY FACEBOOK GROUPS TEST - Henderson Shop Lead Gen\n');
  console.log('📋 Configuration:');
  console.log(`   - Target Groups: ${testConfig.startUrls.length}`);
  console.log(`   - Search Terms: ${testConfig.searchTerms.length}`);
  console.log(`   - Max Posts: ${testConfig.maxPosts}`);
  console.log(`   - Time Range: Last ${testConfig.postsFromLastDays} days\n`);

  try {
    // Start actor run
    console.log('🚀 Starting Apify actor...');

    const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfig)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error: ${response.status} - ${errorText}`);
    }

    const run = await response.json();
    const runId = run.data.id;
    const defaultDatasetId = run.data.defaultDatasetId;

    console.log(`✅ Run started successfully!`);
    console.log(`   - Run ID: ${runId}`);
    console.log(`   - Dataset ID: ${defaultDatasetId}`);
    console.log(`   - Status: ${run.data.status}\n`);

    console.log('⏳ Waiting for actor to complete...');
    console.log('   (This may take 5-15 minutes depending on group size)\n');

    // Poll for completion
    let status = run.data.status;
    let attempts = 0;
    const maxAttempts = 60; // 30 minutes max (30s intervals)

    while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'ABORTED' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;

      console.log(`   [${new Date().toLocaleTimeString()}] Status: ${status} (${attempts}/${maxAttempts})`);
    }

    if (status === 'SUCCEEDED') {
      console.log('\n✅ ACTOR COMPLETED SUCCESSFULLY!\n');

      // Fetch results
      console.log('📊 Fetching results...');
      const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${APIFY_TOKEN}`);
      const results = await datasetResponse.json();

      console.log(`\n📈 RESULTS SUMMARY:`);
      console.log(`   - Total leads collected: ${results.length}`);

      // Analyze results
      const leadsWithEmails = results.filter(r => r.email && r.email.length > 0);
      const leadsWithLocation = results.filter(r => r.location);
      const recentPosts = results.filter(r => {
        if (!r.timestamp) return false;
        const postDate = new Date(r.timestamp);
        const daysSince = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });

      console.log(`   - Leads with emails: ${leadsWithEmails.length} (${Math.round(leadsWithEmails.length/results.length*100)}%)`);
      console.log(`   - Leads with location: ${leadsWithLocation.length} (${Math.round(leadsWithLocation.length/results.length*100)}%)`);
      console.log(`   - Recent posts (30d): ${recentPosts.length} (${Math.round(recentPosts.length/results.length*100)}%)`);

      // Save results locally for verification
      const fs = require('fs');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `apify-facebook-test-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify(results, null, 2));

      console.log(`\n💾 Results saved: ${filename}`);
      console.log(`\n🔍 VERIFICATION REQUIRED:`);
      console.log(`   1. Review ${filename} for lead quality`);
      console.log(`   2. Check email validity`);
      console.log(`   3. Verify buyer intent (post content)`);
      console.log(`   4. Assess geographic distribution`);
      console.log(`\n💰 Cost: Check Apify dashboard for actual usage`);

    } else {
      console.log(`\n❌ ACTOR FAILED: ${status}`);
      console.log(`   Check Apify dashboard for details: https://console.apify.com/actors/runs/${runId}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute test
runApifyTest().catch(console.error);
