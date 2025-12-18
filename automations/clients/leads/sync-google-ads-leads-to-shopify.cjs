/**
 * HENDERSON SHOP - GOOGLE ADS LEAD SYNC AUTOMATION
 *
 * Syncs Google Ads Lead Form Extensions leads to Shopify customers
 *
 * Process:
 * 1. Fetch leads from Google Ads API
 * 2. Filter and qualify leads
 * 3. Create Shopify customers
 * 4. Tag with source and campaign info
 * 5. Trigger Shopify Flow for welcome email
 *
 * USAGE:
 * node scripts/sync-google-ads-leads-to-shopify.cjs [--since=2025-11-20]
 *
 * SETUP:
 * 1. Enable Google Ads API: https://ads.google.com/aw/apicenter
 * 2. Create OAuth2 credentials
 * 3. Get Developer Token
 * 4. Get Customer ID (244-792-8423)
 * 5. Add credentials to .env.local
 *
 * Documentation: https://developers.google.com/google-ads/api/docs/start
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Shopify
  SHOPIFY_STORE: process.env.SHOPIFY_STORE,
  SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,

  // Google Ads
  GOOGLE_ADS_CUSTOMER_ID: process.env.GOOGLE_ADS_CUSTOMER_ID || '2447928423', // Henderson: 244-792-8423
  GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID,
  GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET,
  GOOGLE_ADS_REFRESH_TOKEN: process.env.GOOGLE_ADS_REFRESH_TOKEN,

  // Processing options
  BATCH_SIZE: 50,
  RATE_LIMIT_DELAY: 1000,
};

// ========================================
// GOOGLE ADS API
// ========================================

/**
 * Get OAuth2 access token
 */
async function getGoogleAdsAccessToken() {
  const url = 'https://oauth2.googleapis.com/token';

  const body = new URLSearchParams({
    client_id: CONFIG.GOOGLE_ADS_CLIENT_ID,
    client_secret: CONFIG.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: CONFIG.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const response = await fetch(url, {
    method: 'POST',
    body: body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch leads from Google Ads API
 */
async function fetchGoogleAdsLeads(since = null) {
  if (!CONFIG.GOOGLE_ADS_DEVELOPER_TOKEN) {
    throw new Error('Google Ads credentials not configured in .env.local');
  }

  console.log('\n📥 Fetching Google Ads Lead Form Extensions...');

  const accessToken = await getGoogleAdsAccessToken();

  // GAQL query to fetch lead form submissions
  const query = `
    SELECT
      lead_form_submission_data.id,
      lead_form_submission_data.resource_name,
      lead_form_submission_data.asset,
      lead_form_submission_data.campaign,
      lead_form_submission_data.ad_group,
      lead_form_submission_data.ad_group_ad,
      lead_form_submission_data.gclid,
      lead_form_submission_data.submission_date_time,
      lead_form_submission_data.lead_form_submission_fields
    FROM lead_form_submission_data
    WHERE lead_form_submission_data.submission_date_time >= '${since || '2025-11-01'}'
    ORDER BY lead_form_submission_data.submission_date_time DESC
    LIMIT 1000
  `;

  const url = `https://googleads.googleapis.com/v15/customers/${CONFIG.GOOGLE_ADS_CUSTOMER_ID}/googleAds:searchStream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': CONFIG.GOOGLE_ADS_DEVELOPER_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Ads API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const leads = [];

  // Parse response (stream format)
  if (data.results) {
    data.results.forEach(result => {
      leads.push(result.leadFormSubmissionData);
    });
  }

  console.log(`✅ Fetched ${leads.length} leads from Google Ads`);
  return leads;
}

/**
 * Parse Google Ads lead data into structured format
 */
function parseGoogleAdsLead(lead) {
  const parsed = {
    google_lead_id: lead.id,
    gclid: lead.gclid,
    created_at: lead.submissionDateTime,
    campaign: lead.campaign,
    ad_group: lead.adGroup,
  };

  // Parse lead form fields
  lead.leadFormSubmissionFields.forEach(field => {
    const fieldType = field.fieldType.toLowerCase();

    if (fieldType === 'email') {
      parsed.email = field.fieldValue;
    } else if (fieldType === 'full_name' || fieldType === 'first_name') {
      if (field.fieldValue.includes(' ')) {
        const nameParts = field.fieldValue.split(' ');
        parsed.first_name = nameParts[0];
        parsed.last_name = nameParts.slice(1).join(' ') || '';
      } else {
        parsed.first_name = field.fieldValue;
      }
    } else if (fieldType === 'last_name') {
      parsed.last_name = field.fieldValue;
    } else if (fieldType === 'phone_number' || fieldType === 'phone') {
      parsed.phone = field.fieldValue;
    } else if (fieldType === 'city' || fieldType === 'location') {
      parsed.location = field.fieldValue;
    }
  });

  // Validation
  if (!parsed.email) {
    throw new Error('Lead missing email');
  }

  if (!parsed.first_name) {
    parsed.first_name = parsed.email.split('@')[0]; // Fallback to email prefix
  }

  return parsed;
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
 * Check if customer already exists by email
 */
async function customerExists(email) {
  try {
    const data = await shopifyRequest(`customers/search.json?query=email:${email}`);
    return data.customers.length > 0 ? data.customers[0] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Create Shopify customer from Google Ads lead
 */
async function createShopifyCustomer(lead) {
  // Check for duplicate
  const existing = await customerExists(lead.email);

  if (existing) {
    console.log(`  ⚠️  Customer already exists: ${lead.email}`);

    // Update tags to include Google Ads lead info
    const existingTags = existing.tags ? existing.tags.split(', ') : [];
    const newTags = [
      ...existingTags,
      'google_ads_lead',
      'source_google_ads',
      `gclid_${lead.gclid}`,
      new Date().toISOString().split('T')[0],
    ].filter((tag, index, self) => self.indexOf(tag) === index); // Dedupe

    await shopifyRequest(`customers/${existing.id}.json`, 'PUT', {
      customer: {
        id: existing.id,
        tags: newTags.join(', '),
      },
    });

    return existing.id;
  }

  // Create new customer
  const tags = [
    'google_ads_lead',
    'source_google_ads',
    `gclid_${lead.gclid}`,
    new Date().toISOString().split('T')[0],
  ].filter(Boolean);

  const customer = {
    customer: {
      first_name: lead.first_name,
      last_name: lead.last_name || '',
      email: lead.email,
      phone: lead.phone || '',
      tags: tags.join(', '),
      note: `Google Ads Lead Form\nGCLID: ${lead.gclid}\nCampaign: ${lead.campaign}\nSubmitted: ${lead.created_at}\nGoogle Lead ID: ${lead.google_lead_id}`,
      email_marketing_consent: {
        state: 'subscribed',
        opt_in_level: 'single_opt_in',
        consent_updated_at: new Date().toISOString(),
      },
    },
  };

  const data = await shopifyRequest('customers.json', 'POST', customer);

  console.log(`  ✅ Created customer: ${lead.email} (ID: ${data.customer.id})`);
  return data.customer.id;
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log('🚀 HENDERSON GOOGLE ADS LEAD SYNC - Starting...\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const sinceArg = args.find(arg => arg.startsWith('--since='));
  const since = sinceArg ? sinceArg.split('=')[1] : null;

  // Validate credentials
  if (!CONFIG.SHOPIFY_STORE || !CONFIG.SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Missing Shopify credentials in .env.local');
    process.exit(1);
  }

  if (!CONFIG.GOOGLE_ADS_DEVELOPER_TOKEN || !CONFIG.GOOGLE_ADS_REFRESH_TOKEN) {
    console.error('❌ Missing Google Ads credentials in .env.local');
    console.error('\nSETUP REQUIRED:');
    console.error('1. Enable Google Ads API: https://ads.google.com/aw/apicenter');
    console.error('2. Create OAuth2 credentials: https://console.cloud.google.com');
    console.error('3. Get Developer Token: https://ads.google.com/aw/apicenter');
    console.error('4. Complete OAuth flow to get refresh token');
    console.error('5. Add to .env.local:');
    console.error('   GOOGLE_ADS_CUSTOMER_ID=2447928423');
    console.error('   GOOGLE_ADS_DEVELOPER_TOKEN=your_dev_token');
    console.error('   GOOGLE_ADS_CLIENT_ID=your_client_id');
    console.error('   GOOGLE_ADS_CLIENT_SECRET=your_client_secret');
    console.error('   GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token');
    process.exit(1);
  }

  try {
    // Fetch Google Ads leads
    const leads = await fetchGoogleAdsLeads(since);

    if (leads.length === 0) {
      console.log('\n✅ No new leads to sync');
      return;
    }

    // Process leads
    const results = {
      total: leads.length,
      created: 0,
      updated: 0,
      failed: 0,
    };

    for (const lead of leads) {
      try {
        console.log(`\n👤 Processing: ${lead.id}`);

        const parsed = parseGoogleAdsLead(lead);
        const customerId = await createShopifyCustomer(parsed);

        if (customerId) {
          results.created++;
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.failed++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 GOOGLE ADS LEAD SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total leads fetched: ${results.total}`);
    console.log(`✅ Successfully synced: ${results.created}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success rate: ${((results.created / results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');

    console.log('🎯 NEXT STEPS:');
    console.log('1. Verify customers in Shopify Admin');
    console.log('2. Check Shopify Flow triggered welcome emails');
    console.log('3. Schedule this script to run hourly via cron');
    console.log('4. Link GCLID to GA4 for attribution tracking');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
main();
