#!/usr/bin/env node

/**
 * APIFY CONNECTION VERIFICATION
 *
 * Verify API token and list available actors before running expensive tests
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
  console.error('❌ ERROR: APIFY_TOKEN not set in .env');
  process.exit(1);
}

async function verifyApifyConnection() {
  console.log('🔐 Verifying Apify API connection...\n');

  try {
    // Test 1: Check if token is valid by listing actors
    console.log('Test 1: Listing available actors...');
    const actorsResponse = await fetch(`https://api.apify.com/v2/acts?token=${APIFY_TOKEN}&my=true&limit=5`);

    if (!actorsResponse.ok) {
      throw new Error(`API Error: ${actorsResponse.status} - ${await actorsResponse.text()}`);
    }

    const actorsData = await actorsResponse.json();
    console.log('✅ Token is valid!\n');

    // Test 2: Search for Facebook scraper actors
    console.log('Test 2: Searching for Facebook scraper actors...');
    const searchResponse = await fetch(`https://api.apify.com/v2/store?token=${APIFY_TOKEN}&search=facebook%20groups&limit=10`);

    if (!searchResponse.ok) {
      throw new Error(`Search Error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log(`Found ${searchData.total || searchData.count || 'some'} Facebook-related actors\n`);

    console.log('📋 Top Facebook Group scrapers:');
    const items = searchData.items || searchData.data?.items || [];
    if (items.length > 0) {
      items
        .filter(item => item.title?.toLowerCase().includes('facebook') || item.name?.toLowerCase().includes('facebook'))
        .slice(0, 5)
        .forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.title || item.name}`);
          console.log(`      - ID: ${item.username || item.userId}/${item.name}`);
          console.log(`      - Price: ${item.pricingModel || 'N/A'}`);
          console.log(`      - Runs: ${item.stats?.totalRuns || 0}\n`);
        });
    } else {
      console.log('   (No items returned - API format may have changed)');
    }

    // Test 3: Check account limits
    console.log('Test 3: Checking account limits...');
    const limitsResponse = await fetch(`https://api.apify.com/v2/user/limits?token=${APIFY_TOKEN}`);

    if (limitsResponse.ok) {
      const limitsData = await limitsResponse.json();
      console.log('✅ Account limits retrieved');
      console.log(`   Monthly limit: $${limitsData.data?.monthlyLimitUsd || 'Unknown'}\n`);
    }

    console.log('🎯 CONNECTION VERIFIED - Ready for test runs!');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyApifyConnection().catch(console.error);
