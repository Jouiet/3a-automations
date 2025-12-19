#!/usr/bin/env node

/**
 * APIFY GOOGLE SHOPPING SCRAPER - TEST RUN
 *
 * Purpose: Competitive intelligence for Henderson Shop pricing strategy
 * Target: Daily Commuters persona (60% priority)
 * Cost: ~$0.32 (90 results × $0.0035)
 *
 * VERIFICATION:
 * 1. Execute script
 * 2. Verify 90 products returned (30 per query)
 * 3. Analyze price ranges vs Henderson pricing
 * 4. Identify trending products
 */

const APIFY_TOKEN = 'apify_api_CjGBvorJEO5VIu5MEqTMkhepvLpQxY1c0Rx0';
const ACTOR_ID = 'damilo~google-shopping-apify';

// Test configuration - Daily Commuters focus
const testConfig = {
  queries: [
    // Query 1: Waterproof commuter jackets
    "waterproof motorcycle commuter jacket under $300",

    // Query 2: Touch screen gloves (winter commuting)
    "touch screen motorcycle gloves winter",

    // Query 3: Compact GPS navigation
    "compact motorcycle GPS CarPlay navigation"
  ],

  maxResultsPerQuery: 30, // 3 queries × 30 = 90 total results
  countryCode: "us",
  languageCode: "en"
};

async function runGoogleShoppingTest() {
  console.log('🛒 APIFY GOOGLE SHOPPING TEST - Henderson Competitive Intel\n');
  console.log('📋 Configuration:');
  console.log(`   - Queries: ${testConfig.queries.length}`);
  testConfig.queries.forEach((q, i) => {
    console.log(`     ${i + 1}. "${q}"`);
  });
  console.log(`   - Results per query: ${testConfig.maxResultsPerQuery}`);
  console.log(`   - Total expected: ${testConfig.queries.length * testConfig.maxResultsPerQuery} products`);
  console.log(`   - Estimated cost: $${(testConfig.queries.length * testConfig.maxResultsPerQuery * 0.0035).toFixed(2)}\n`);

  try {
    console.log('🚀 Starting Google Shopping scraper...');

    const response = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}&waitForFinish=180`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error: ${response.status}\n${errorText}`);
    }

    const run = await response.json();
    console.log(`✅ Run completed: ${run.data.status}\n`);

    if (run.data.status === 'SUCCEEDED') {
      // Fetch results
      const datasetId = run.data.defaultDatasetId;
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
      );
      const results = await resultsResponse.json();

      console.log('📊 RESULTS SUMMARY:');
      console.log(`   - Total products scraped: ${results.length}`);

      // Analyze by query
      const byQuery = {};
      results.forEach(item => {
        const query = item.searchQuery || 'unknown';
        if (!byQuery[query]) byQuery[query] = [];
        byQuery[query].push(item);
      });

      console.log('\n📈 Results by Query:');
      Object.keys(byQuery).forEach((query, i) => {
        console.log(`   ${i + 1}. "${query}": ${byQuery[query].length} products`);
      });

      // Price analysis
      console.log('\n💰 PRICE ANALYSIS:');
      Object.keys(byQuery).forEach((query, i) => {
        const prices = byQuery[query]
          .map(item => parseFloat(item.price?.replace(/[^0-9.]/g, '') || 0))
          .filter(p => p > 0)
          .sort((a, b) => a - b);

        if (prices.length > 0) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const median = prices[Math.floor(prices.length / 2)];

          console.log(`\n   Query ${i + 1}: "${query}"`);
          console.log(`   - Min: $${min.toFixed(2)}`);
          console.log(`   - Max: $${max.toFixed(2)}`);
          console.log(`   - Average: $${avg.toFixed(2)}`);
          console.log(`   - Median: $${median.toFixed(2)}`);
          console.log(`   - Valid prices: ${prices.length}/${byQuery[query].length}`);
        }
      });

      // Top merchants
      console.log('\n🏪 TOP MERCHANTS:');
      const merchants = {};
      results.forEach(item => {
        const merchant = item.merchant || item.seller || 'Unknown';
        merchants[merchant] = (merchants[merchant] || 0) + 1;
      });

      Object.entries(merchants)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([merchant, count], i) => {
          console.log(`   ${i + 1}. ${merchant}: ${count} products`);
        });

      // Save detailed results
      const fs = require('fs');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `apify-google-shopping-test-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify(results, null, 2));

      console.log(`\n💾 Detailed results saved: ${filename}`);

      // Henderson comparison
      console.log('\n🎯 HENDERSON PRICING COMPARISON:');
      console.log('   Daily Commuters products (from Shopify):');
      console.log('   - Average price: $179.37');
      console.log('   - Median: $149.63');
      console.log('   - Range: $51.67 - $1,359.00');
      console.log('\n   Market Analysis Needed:');
      console.log('   - Compare Henderson jacket prices vs market avg ($XXX)');
      console.log('   - Compare glove prices vs market avg ($XXX)');
      console.log('   - Identify price gaps (under/over-priced products)');

      console.log('\n✅ TEST SUCCESSFUL - Competitive intelligence collected!');
      console.log('💡 Next: Analyze price gaps and adjust Henderson pricing');

    } else if (run.data.status === 'RUNNING') {
      console.log('⏳ Actor still running (exceeded 3 min wait time)');
      console.log(`   Check status: https://console.apify.com/actors/runs/${run.data.id}`);
      console.log(`   Dataset will be available when completed`);
    } else {
      console.log(`❌ Run failed: ${run.data.status}`);
      console.log(`   Details: https://console.apify.com/actors/runs/${run.data.id}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.message.includes('401')) {
      console.error('\n⚠️  Authentication error - check API token');
    } else if (error.message.includes('402')) {
      console.error('\n⚠️  Payment required - check Apify account balance');
    } else if (error.message.includes('404')) {
      console.error('\n⚠️  Actor not found - verify actor ID: damilo~google-shopping-apify');
    }

    process.exit(1);
  }
}

runGoogleShoppingTest().catch(console.error);
