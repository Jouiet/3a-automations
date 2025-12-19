/**
 * HENDERSON SHOP - APIFY INSTAGRAM PROFILE ENRICHMENT
 *
 * Chain Apify actors to enrich Instagram leads with emails:
 * 1. Instagram Hashtag Scraper (posts) → usernames
 * 2. Instagram Profile Scraper (profiles) → emails from bio
 * 3. Email Finder (if no email in bio) → verified emails
 *
 * NO EXTERNAL SERVICES - 100% Apify
 *
 * SETUP:
 * 1. Create Task for Instagram Profile Scraper
 * 2. Configure input: list of usernames from Google Sheets
 * 3. Run daily to enrich new leads
 * 4. Update Shopify customers with found emails
 *
 * COST:
 * - Profile Scraper: $2/1000 profiles
 * - 600 profiles/month = $1.20/month
 * - Apify basic plan: $49/month includes everything
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  APIFY_TOKEN: process.env.APIFY_TOKEN,
  SHOPIFY_STORE: process.env.SHOPIFY_STORE,
  SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,

  // Apify actors
  PROFILE_SCRAPER_ACTOR: 'apify~instagram-profile-scraper',
  EMAIL_FINDER_ACTOR: 'anchor~email-phone-extractor',
};

// ========================================
// APIFY API
// ========================================

/**
 * Run Apify actor with input
 */
async function runApifyActor(actorId, input) {
  const url = `https://api.apify.com/v2/acts/${actorId}/runs?token=${CONFIG.APIFY_TOKEN}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Wait for actor run to complete
 */
async function waitForRun(runId) {
  const url = `https://api.apify.com/v2/actor-runs/${runId}?token=${CONFIG.APIFY_TOKEN}`;

  while (true) {
    const response = await fetch(url);
    const data = await response.json();
    const status = data.data.status;

    if (status === 'SUCCEEDED') {
      return data.data.defaultDatasetId;
    } else if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Actor run ${status}`);
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

/**
 * Fetch dataset results
 */
async function fetchDataset(datasetId) {
  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${CONFIG.APIFY_TOKEN}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.status}`);
  }

  return response.json();
}

// ========================================
// SHOPIFY API
// ========================================

async function shopifyRequest(endpoint, method = 'GET', body = null) {
  const url = `https://${CONFIG.SHOPIFY_STORE}/admin/api/2025-10/${endpoint}`;

  const options = {
    method,
    headers: {
      'X-Shopify-Access-Token': CONFIG.SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get Instagram leads without emails
 */
async function getLeadsWithoutEmails(limit = 50) {
  console.log('\n📥 Fetching Instagram leads without emails...');

  // Search for customers with placeholder emails from the new B2C scraper
  const query = 'tag:instagram_lead AND email:*@instagram.placeholder';
  const data = await shopifyRequest(`customers/search.json?query=${encodeURIComponent(query)}&limit=${limit}`);

  console.log(`✅ Found ${data.customers.length} leads to enrich (Tag: instagram_lead)`);
  return data.customers;
}

/**
 * Update customer with enriched email
 */
async function updateCustomerEmail(customerId, email, source) {
  const customer = {
    customer: {
      id: customerId,
      email: email,
      tags: `email_enriched, email_source_${source}`,
    },
  };

  await shopifyRequest(`customers/${customerId}.json`, 'PUT', customer);
  console.log(`  ✅ Updated customer ${customerId} with email: ${email}`);
}

// ========================================
// MAIN WORKFLOW
// ========================================

async function main() {
  console.log('🚀 HENDERSON INSTAGRAM PROFILE ENRICHMENT - Starting...\n');

  // Validate credentials
  if (!CONFIG.APIFY_TOKEN || !CONFIG.SHOPIFY_STORE || !CONFIG.SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Missing credentials in .env.local');
    process.exit(1);
  }

  try {
    // Step 1: Get leads without emails
    const leads = await getLeadsWithoutEmails(50);

    if (leads.length === 0) {
      console.log('\n✅ No leads to enrich');
      return;
    }

    // Extract Instagram usernames
    const usernames = leads.map(customer => {
      // Extract username from email (format: username@instagram.placeholder)
      return customer.email.split('@')[0];
    });

    console.log(`\n📝 Enriching ${usernames.length} Instagram profiles...`);

    // Step 2: Run Instagram Profile Scraper
    console.log('\n🔄 Running Apify Instagram Profile Scraper...');

    const profileInput = {
      usernames: usernames,
      resultsLimit: usernames.length,
    };

    const run = await runApifyActor(CONFIG.PROFILE_SCRAPER_ACTOR, profileInput);
    console.log(`  ⏳ Run ID: ${run.id}`);

    const datasetId = await waitForRun(run.id);
    console.log(`  ✅ Run completed - Dataset: ${datasetId}`);

    // Step 3: Fetch profiles with emails
    const profiles = await fetchDataset(datasetId);
    console.log(`\n📊 Retrieved ${profiles.length} profiles`);

    // Step 4: Update Shopify customers
    const results = {
      total: leads.length,
      enriched: 0,
      no_email: 0,
    };

    for (const profile of profiles) {
      try {
        // Find matching customer
        const customer = leads.find(c => {
          const username = c.email.split('@')[0];
          return username === profile.username;
        });

        if (!customer) continue;

        // Check if email found in bio
        const email = profile.businessEmail || profile.publicEmail;

        if (email && email.includes('@') && !email.includes('instagram.placeholder')) {
          await updateCustomerEmail(customer.id, email, 'instagram_bio');
          results.enriched++;
        } else {
          console.log(`  ⚠️  No email in bio for @${profile.username}`);
          results.no_email++;
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error processing ${profile.username}: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENRICHMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total leads: ${results.total}`);
    console.log(`✅ Enriched with email: ${results.enriched}`);
    console.log(`⚠️  No email found: ${results.no_email}`);
    console.log(`Success rate: ${((results.enriched / results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');

    if (results.no_email > 0) {
      console.log('💡 TIP: For profiles without email in bio:');
      console.log('   - Use Apify Email Finder actor (prospeo/email-finder)');
      console.log('   - Or manual LinkedIn search');
      console.log('   - Or skip (focus on leads with emails)');
    }

    console.log('\n🎯 NEXT: Create Shopify Flow to welcome enriched leads');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
main();
