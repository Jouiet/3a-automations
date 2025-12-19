/**
 * MYDEALZ APIFY CONNECTION TEST
 *
 * Test Apify API connection and available actors
 *
 * Usage: node test-connection.js
 */

const { ApifyClient } = require('apify-client');

async function testConnection() {
  console.log('='.repeat(60));
  console.log('APIFY CONNECTION TEST');
  console.log('='.repeat(60));

  // Check for API token
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error('\n[ERROR] APIFY_API_TOKEN not set');
    console.log('\nTo fix:');
    console.log('  export APIFY_API_TOKEN=your_token_here');
    console.log('  Or add to .env file');
    process.exit(1);
  }

  console.log('\n[OK] APIFY_API_TOKEN found');

  // Initialize client
  const client = new ApifyClient({ token });

  try {
    // Test: Get user info
    console.log('\n[Test] Fetching user info...');
    const user = await client.user().get();
    console.log(`  User: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Plan: ${user.plan?.name || 'Free'}`);

    // Test: List available actors
    console.log('\n[Test] Checking LinkedIn actors...');
    const linkedInActors = [
      'harvestapi/linkedin-profile-search',
      'supreme_coder/linkedin-profile-scraper',
      'bebity/linkedin-premium-actor'
    ];

    for (const actorId of linkedInActors) {
      try {
        const actor = await client.actor(actorId).get();
        console.log(`  [OK] ${actorId}`);
        console.log(`       Title: ${actor.title}`);
        console.log(`       Stats: ${actor.stats?.totalRuns || 0} runs`);
      } catch (error) {
        console.log(`  [WARN] ${actorId} - ${error.message}`);
      }
    }

    // Test: Check account balance/usage
    console.log('\n[Test] Checking account status...');
    console.log(`  Monthly usage: ${user.usageLimit?.monthlyUsage || 'N/A'}`);
    console.log(`  Usage limit: ${user.usageLimit?.limit || 'N/A'}`);

    console.log('\n' + '='.repeat(60));
    console.log('CONNECTION TEST PASSED');
    console.log('='.repeat(60));

    return true;

  } catch (error) {
    console.error('\n[ERROR] Connection failed:', error.message);
    console.log('\nPossible causes:');
    console.log('  1. Invalid API token');
    console.log('  2. Network issues');
    console.log('  3. Apify service down');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { testConnection };
