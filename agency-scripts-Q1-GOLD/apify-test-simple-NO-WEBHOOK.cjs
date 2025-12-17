#!/usr/bin/env node
/**
 * APIFY TEST SIMPLE - NO WEBHOOK (Manual verification after)
 *
 * Purpose: Test Instagram scraper without webhook (simpler, less fragile)
 * Flow: Apify scrapes → Dataset created → Manual webhook configuration in Apify Console
 *
 * Session 73 - Simplified approach for initial testing
 * Date: 2025-11-24
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Instagram scraper input (V2 - POST-based, lifestyle hashtags)
const ACTOR_INPUT = {
  hashtags: ['motorcyclelife'],
  resultsLimit: 5,
  searchLimit: 10,
  searchType: 'hashtag',
  addParentData: false
};

console.log('🚀 APIFY TEST - SIMPLE (NO WEBHOOK)');
console.log('=' .repeat(70));
console.log('');
console.log('📋 CONFIGURATION:');
console.log(`   Actor: apify/instagram-scraper`);
console.log(`   Hashtag: #${ACTOR_INPUT.hashtags[0]}`);
console.log(`   Results: ${ACTOR_INPUT.resultsLimit} posts`);
console.log('');
console.log('=' .repeat(70));
console.log('');

async function startApifyRun() {
  console.log('📤 STEP 1: Starting Apify Instagram scraper...');

  const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ACTOR_INPUT)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apify API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`   ✅ Run started!`);
  console.log(`   Run ID: ${data.data.id}`);
  console.log(`   Status: ${data.data.status}`);
  console.log(`   Monitor: https://console.apify.com/actors/runs/${data.data.id}`);
  console.log('');

  return data.data;
}

async function waitForCompletion(runId) {
  console.log('⏳ STEP 2: Waiting for completion (polling every 10s)...');
  console.log('');

  const maxWaitTime = 5 * 60 * 1000;
  const pollInterval = 10 * 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const url = `https://api.apify.com/v2/acts/apify~instagram-scraper/runs/${runId}?token=${APIFY_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    const run = data.data;

    console.log(`   [${new Date().toLocaleTimeString()}] Status: ${run.status}`);

    if (run.status === 'SUCCEEDED') {
      console.log('');
      console.log('   ✅ Scraper completed successfully!');
      console.log(`   Duration: ${Math.round((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000)}s`);
      console.log(`   Items: ${run.stats?.itemsCount || 'N/A'}`);
      console.log('');
      return run;
    }

    if (run.status === 'FAILED' || run.status === 'ABORTED') {
      throw new Error(`Run ${run.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout (5 min)');
}

async function fetchDataset(datasetId) {
  console.log('📥 STEP 3: Fetching scraped posts...');

  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
  const response = await fetch(url);
  const items = await response.json();

  console.log(`   ✅ Fetched ${items.length} posts`);
  console.log('');

  items.slice(0, 3).forEach((post, i) => {
    console.log(`   Post ${i + 1}: @${post.ownerUsername}`);
    console.log(`      Caption: ${(post.caption || '').substring(0, 50)}...`);
    console.log(`      Likes: ${post.likesCount || 0}`);
  });

  if (items.length > 3) console.log(`   ... +${items.length - 3} more`);
  console.log('');

  return items;
}

async function runTest() {
  try {
    const run = await startApifyRun();
    const completed = await waitForCompletion(run.id);
    const posts = await fetchDataset(completed.defaultDatasetId);

    console.log('=' .repeat(70));
    console.log('✅ TEST COMPLETED');
    console.log('=' .repeat(70));
    console.log('');
    console.log('📊 RESULTS:');
    console.log(`   Posts scraped: ${posts.length}`);
    console.log(`   Dataset ID: ${completed.defaultDatasetId}`);
    console.log('');
    console.log('🔧 NEXT: CONFIGURE WEBHOOK MANUALLY');
    console.log('');
    console.log('1. Go to: https://console.apify.com/actors/runs');
    console.log(`2. Find run: ${run.id}`);
    console.log('3. Click "Settings" → "Webhooks"');
    console.log('4. Add webhook:');
    console.log('   - Event: Actor run succeeded');
    console.log('   - URL: https://script.google.com/macros/s/AKfycbwbwD3FXNHXYkwf3_6-uRRYv5a3jSala33yr1nP9DOHb_EKz_vP6SmOUp6CDV2-BVHEjw/exec');
    console.log('');
    console.log('5. Test webhook by re-running actor (Apify will call Google Apps Script)');
    console.log('');
    console.log('6. Verify results:');
    console.log('   - Google Sheets: "Henderson Leads Database"');
    console.log('   - Shopify Customers: Filter tag "apify_lead"');
    console.log('');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  }
}

if (!APIFY_TOKEN) {
  console.error('❌ ERROR: APIFY_TOKEN not found');
  process.exit(1);
}

runTest();
