/**
 * APIFY SCHEDULERS VERIFICATION
 * Gap #2 from HENDERSON_COMMERCIAL_REALITY_BRUTAL_ANALYSIS.md
 * Verify if scheduled actors are configured for daily lead scraping
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.apify.com',
      path: `/v2${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          console.log(`⚠️  ${path} - Status ${res.statusCode}`);
          resolve(null);
        }
      });
    }).on('error', reject).end();
  });
}

async function verifyApifySchedulers() {
  console.log('\n============================================================');
  console.log('APIFY SCHEDULERS VERIFICATION');
  console.log('Date:', new Date().toISOString());
  console.log('============================================================\n');

  const results = {
    timestamp: new Date().toISOString(),
    schedulers: [],
    total_count: 0,
    active_count: 0,
    actors_configured: [],
    expected_actors: [
      'Instagram Profile Scraper',
      'TikTok Profile Scraper',
      'Email Extractor'
    ],
    status: 'UNKNOWN'
  };

  // Check 1: List all schedulers
  console.log('[1/3] Checking scheduled tasks...');
  try {
    const schedulers = await makeRequest('/schedules?limit=100');

    if (schedulers && schedulers.data) {
      results.schedulers = schedulers.data.items || [];
      results.total_count = schedulers.data.total;

      console.log(`   📊 Total schedulers found: ${results.total_count}`);

      if (results.total_count > 0) {
        results.schedulers.forEach(scheduler => {
          const isActive = scheduler.isEnabled;
          const actorId = scheduler.actorId;
          const name = scheduler.name || 'Unnamed';
          const cronExpression = scheduler.cronExpression;

          console.log(`\n   📋 Scheduler: ${name}`);
          console.log(`      - Actor ID: ${actorId}`);
          console.log(`      - Status: ${isActive ? '✅ ACTIVE' : '⚠️  PAUSED'}`);
          console.log(`      - Schedule: ${cronExpression || 'N/A'}`);

          if (isActive) {
            results.active_count++;
          }
        });
      } else {
        console.log('   ⚠️  NO SCHEDULERS CONFIGURED');
      }
    } else {
      console.log('   ❌ Could not retrieve schedulers');
    }
  } catch (error) {
    console.log('   ❌ Error checking schedulers:', error.message);
  }

  // Check 2: List recent actor runs
  console.log('\n[2/3] Checking recent actor runs...');
  try {
    const runs = await makeRequest('/actor-runs?limit=10&status=SUCCEEDED');

    if (runs && runs.data && runs.data.items) {
      console.log(`   📊 Recent successful runs: ${runs.data.items.length}`);

      runs.data.items.forEach(run => {
        const actorId = run.actorId;
        const startedAt = new Date(run.startedAt).toLocaleString();
        const finishedAt = new Date(run.finishedAt).toLocaleString();

        console.log(`      - Actor: ${actorId}`);
        console.log(`        Started: ${startedAt}`);
        console.log(`        Status: ${run.status}`);
      });
    }
  } catch (error) {
    console.log('   ❌ Error checking runs:', error.message);
  }

  // Check 3: User info
  console.log('\n[3/3] Checking Apify account...');
  try {
    const user = await makeRequest('/user');

    if (user && user.data) {
      console.log(`   👤 User: ${user.data.username || 'N/A'}`);
      console.log(`   💳 Plan: ${user.data.plan || 'N/A'}`);
    }
  } catch (error) {
    console.log('   ❌ Error checking user:', error.message);
  }

  // Determine status
  console.log('\n============================================================');
  console.log('VERIFICATION RESULTS');
  console.log('============================================================\n');

  if (results.total_count === 0) {
    results.status = 'NOT_CONFIGURED';
    console.log('❌ APIFY SCHEDULERS: NOT CONFIGURED');
    console.log('\n📊 Summary:');
    console.log('   - Total schedulers: 0');
    console.log('   - Expected: 3-4 daily schedulers for lead scraping');
    console.log('   - Impact: 0 leads/day vs 20-30 expected');

    console.log('\n⚠️  CONFIGURATION REQUIRED:');
    console.log('   1. Go to: https://console.apify.com/schedules');
    console.log('   2. Create schedulers for:');
    console.log('      - Instagram Profile Scraper (daily 8AM)');
    console.log('      - TikTok Profile Scraper (daily 9AM)');
    console.log('   3. Set cron expression: "0 8 * * *" for 8AM daily');
    console.log('   4. Configure input parameters for each actor');
    console.log('   5. Enable schedulers');

  } else if (results.active_count === 0) {
    results.status = 'CONFIGURED_BUT_PAUSED';
    console.log('⚠️  APIFY SCHEDULERS: CONFIGURED BUT ALL PAUSED');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total schedulers: ${results.total_count}`);
    console.log(`   - Active: ${results.active_count}`);
    console.log(`   - Action: Enable schedulers to start daily scraping`);

  } else {
    results.status = 'ACTIVE';
    console.log('✅ APIFY SCHEDULERS: ACTIVE');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total schedulers: ${results.total_count}`);
    console.log(`   - Active: ${results.active_count}`);
    console.log(`   - Status: Running daily`);
  }

  console.log('\n============================================================\n');

  // Save results
  const fs = require('fs');
  fs.writeFileSync(
    'verification-results-apify-schedulers.json',
    JSON.stringify(results, null, 2)
  );
  console.log('📁 Results saved: verification-results-apify-schedulers.json\n');

  return results;
}

verifyApifySchedulers().catch(console.error);
