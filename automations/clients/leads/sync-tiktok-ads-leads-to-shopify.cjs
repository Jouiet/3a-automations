/**
 * HENDERSON SHOP - TIKTOK ADS LEAD SYNC AUTOMATION
 *
 * Syncs TikTok Lead Generation ads leads to Shopify customers
 *
 * Process:
 * 1. Fetch leads from TikTok Marketing API
 * 2. Filter and qualify leads
 * 3. Create Shopify customers
 * 4. Tag with source and campaign info
 * 5. Trigger Shopify Flow for welcome email
 *
 * USAGE:
 * node scripts/sync-tiktok-ads-leads-to-shopify.cjs [--since=2025-11-20]
 *
 * SETUP:
 * 1. Create TikTok Developer App: https://developers.tiktok.com
 * 2. Get Marketing API access (Business account required)
 * 3. Get Access Token with lead.list permission
 * 4. Get Advertiser ID from TikTok Ads Manager
 * 5. Add credentials to .env.local
 *
 * Documentation: https://business-api.tiktok.com/portal/docs?id=1739566885879809
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

  // TikTok Ads
  TIKTOK_ACCESS_TOKEN: process.env.TIKTOK_ACCESS_TOKEN,
  TIKTOK_ADVERTISER_ID: process.env.TIKTOK_ADVERTISER_ID,

  // Processing options
  BATCH_SIZE: 50,
  RATE_LIMIT_DELAY: 1000,
};

// ========================================
// TIKTOK API
// ========================================

/**
 * Fetch leads from TikTok Marketing API
 */
async function fetchTikTokLeads(since = null) {
  if (!CONFIG.TIKTOK_ACCESS_TOKEN || !CONFIG.TIKTOK_ADVERTISER_ID) {
    throw new Error('TikTok credentials not configured in .env.local');
  }

  console.log('\n📥 Fetching TikTok Lead Generation ads...');

  // Calculate time range
  const endTime = Math.floor(Date.now() / 1000); // Current timestamp
  const startTime = since
    ? Math.floor(new Date(since).getTime() / 1000)
    : endTime - (30 * 24 * 60 * 60); // 30 days ago

  const url = 'https://business-api.tiktok.com/open_api/v1.3/leads/list/';

  const params = new URLSearchParams({
    advertiser_id: CONFIG.TIKTOK_ADVERTISER_ID,
    start_date: startTime.toString(),
    end_date: endTime.toString(),
    page_size: '100',
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'Access-Token': CONFIG.TIKTOK_ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`);
  }

  const leads = data.data ? data.data.list : [];

  console.log(`✅ Fetched ${leads.length} leads from TikTok`);
  return leads;
}

/**
 * Parse TikTok lead data into structured format
 */
function parseTikTokLead(lead) {
  const parsed = {
    tiktok_lead_id: lead.lead_id,
    created_at: new Date(lead.create_time * 1000).toISOString(),
    campaign_id: lead.campaign_id,
    ad_group_id: lead.adgroup_id,
    ad_id: lead.ad_id,
  };

  // Parse form fields
  if (lead.form_list) {
    lead.form_list.forEach(field => {
      const fieldName = field.field_name.toLowerCase();

      if (fieldName === 'email' || fieldName === 'email address') {
        parsed.email = field.field_value;
      } else if (fieldName === 'full name' || fieldName === 'name') {
        const nameParts = field.field_value.split(' ');
        parsed.first_name = nameParts[0];
        parsed.last_name = nameParts.slice(1).join(' ') || '';
      } else if (fieldName === 'first name') {
        parsed.first_name = field.field_value;
      } else if (fieldName === 'last name') {
        parsed.last_name = field.field_value;
      } else if (fieldName === 'phone number' || fieldName === 'phone') {
        parsed.phone = field.field_value;
      } else if (fieldName === 'location' || fieldName === 'city') {
        parsed.location = field.field_value;
      } else if (fieldName === 'riding style' || fieldName === 'persona') {
        parsed.persona = field.field_value;
      }
    });
  }

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
 * Create Shopify customer from TikTok lead
 */
async function createShopifyCustomer(lead) {
  // Check for duplicate
  const existing = await customerExists(lead.email);

  if (existing) {
    console.log(`  ⚠️  Customer already exists: ${lead.email}`);

    // Update tags to include TikTok lead info
    const existingTags = existing.tags ? existing.tags.split(', ') : [];
    const newTags = [
      ...existingTags,
      'tiktok_ads_lead',
      'source_tiktok_ads',
      `campaign_${lead.campaign_id}`,
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
    'tiktok_ads_lead',
    'source_tiktok_ads',
    `campaign_${lead.campaign_id}`,
    lead.persona ? `persona_${lead.persona.toLowerCase().replace(/\s+/g, '_')}` : '',
    new Date().toISOString().split('T')[0],
  ].filter(Boolean);

  const customer = {
    customer: {
      first_name: lead.first_name,
      last_name: lead.last_name || '',
      email: lead.email,
      phone: lead.phone || '',
      tags: tags.join(', '),
      note: `TikTok Lead Generation Ad\nCampaign ID: ${lead.campaign_id}\nAd ID: ${lead.ad_id}\nSubmitted: ${lead.created_at}\nTikTok Lead ID: ${lead.tiktok_lead_id}`,
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
  console.log('🚀 HENDERSON TIKTOK ADS LEAD SYNC - Starting...\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const sinceArg = args.find(arg => arg.startsWith('--since='));
  const since = sinceArg ? sinceArg.split('=')[1] : null;

  // Validate credentials
  if (!CONFIG.SHOPIFY_STORE || !CONFIG.SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Missing Shopify credentials in .env.local');
    process.exit(1);
  }

  if (!CONFIG.TIKTOK_ACCESS_TOKEN || !CONFIG.TIKTOK_ADVERTISER_ID) {
    console.error('❌ Missing TikTok credentials in .env.local');
    console.error('\nSETUP REQUIRED:');
    console.error('1. Create TikTok Developer App: https://developers.tiktok.com');
    console.error('2. Apply for Marketing API access (Business account)');
    console.error('3. Get Access Token with lead.list permission');
    console.error('4. Get Advertiser ID from TikTok Ads Manager');
    console.error('5. Add to .env.local:');
    console.error('   TIKTOK_ACCESS_TOKEN=your_access_token');
    console.error('   TIKTOK_ADVERTISER_ID=your_advertiser_id');
    process.exit(1);
  }

  try {
    // Fetch TikTok leads
    const leads = await fetchTikTokLeads(since);

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
        console.log(`\n👤 Processing: ${lead.lead_id}`);

        const parsed = parseTikTokLead(lead);
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
    console.log('📊 TIKTOK ADS LEAD SYNC SUMMARY');
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
    console.log('4. Set up TikTok webhook for real-time sync (optional)');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
main();
