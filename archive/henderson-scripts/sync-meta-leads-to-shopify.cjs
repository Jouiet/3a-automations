/**
 * HENDERSON SHOP - META ADS LEAD SYNC AUTOMATION
 *
 * Syncs Meta Lead Ads (Facebook/Instagram) leads to Shopify customers
 *
 * Process:
 * 1. Fetch leads from Meta Lead Ads API
 * 2. Filter and qualify leads
 * 3. Create Shopify customers
 * 4. Tag with source and campaign info
 * 5. Trigger Shopify Flow for welcome email
 *
 * USAGE:
 * node scripts/sync-meta-leads-to-shopify.cjs [--since=2025-11-20]
 *
 * SETUP:
 * 1. Create Meta App: https://developers.facebook.com
 * 2. Add app to Meta Business Manager
 * 3. Get Page Access Token with leads_retrieval permission
 * 4. Get Lead Form ID from Ads Manager
 * 5. Add credentials to .env.local
 *
 * Documentation: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/
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

  // Meta (Facebook/Instagram)
  META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN,
  META_PAGE_ID: process.env.META_PAGE_ID,
  META_LEAD_FORM_ID: process.env.META_LEAD_FORM_ID,

  // Processing options
  BATCH_SIZE: 50,
  RATE_LIMIT_DELAY: 1000,
};

// ========================================
// META API
// ========================================

/**
 * Fetch leads from Meta Lead Ads API
 */
async function fetchMetaLeads(since = null) {
  if (!CONFIG.META_PAGE_ACCESS_TOKEN || !CONFIG.META_LEAD_FORM_ID) {
    throw new Error('Meta credentials not configured in .env.local');
  }

  console.log('\n📥 Fetching Meta Lead Ads...');

  let url = `https://graph.facebook.com/v18.0/${CONFIG.META_LEAD_FORM_ID}/leads`;
  url += `?access_token=${CONFIG.META_PAGE_ACCESS_TOKEN}`;
  url += `&fields=id,created_time,field_data,ad_id,ad_name,form_id,form_name`;

  if (since) {
    const sinceTimestamp = Math.floor(new Date(since).getTime() / 1000);
    url += `&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${sinceTimestamp}}]`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  console.log(`✅ Fetched ${data.data.length} leads from Meta`);
  return data.data;
}

/**
 * Parse Meta lead data into structured format
 */
function parseMetaLead(lead) {
  const parsed = {
    meta_lead_id: lead.id,
    created_at: lead.created_time,
    ad_id: lead.ad_id,
    ad_name: lead.ad_name,
    form_name: lead.form_name,
  };

  // Parse field_data (custom form fields)
  lead.field_data.forEach(field => {
    const name = field.name.toLowerCase();

    if (name === 'email') {
      parsed.email = field.values[0];
    } else if (name === 'full_name' || name === 'name') {
      const nameParts = field.values[0].split(' ');
      parsed.first_name = nameParts[0];
      parsed.last_name = nameParts.slice(1).join(' ') || '';
    } else if (name === 'first_name') {
      parsed.first_name = field.values[0];
    } else if (name === 'last_name') {
      parsed.last_name = field.values[0];
    } else if (name === 'phone_number' || name === 'phone') {
      parsed.phone = field.values[0];
    } else if (name === 'riding_style' || name === 'persona') {
      parsed.persona = field.values[0];
    } else if (name === 'location' || name === 'city') {
      parsed.location = field.values[0];
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
 * Create Shopify customer from Meta lead
 */
async function createShopifyCustomer(lead) {
  // Check for duplicate
  const existing = await customerExists(lead.email);

  if (existing) {
    console.log(`  ⚠️  Customer already exists: ${lead.email}`);

    // Update tags to include Meta lead info
    const existingTags = existing.tags ? existing.tags.split(', ') : [];
    const newTags = [
      ...existingTags,
      'meta_lead',
      'source_meta_ads',
      `ad_${lead.ad_id}`,
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
    'meta_lead',
    'source_meta_ads',
    `ad_${lead.ad_id}`,
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
      note: `Meta Lead Ad\nAd: ${lead.ad_name}\nForm: ${lead.form_name}\nSubmitted: ${lead.created_at}\nMeta Lead ID: ${lead.meta_lead_id}`,
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
  console.log('🚀 HENDERSON META LEAD SYNC - Starting...\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const sinceArg = args.find(arg => arg.startsWith('--since='));
  const since = sinceArg ? sinceArg.split('=')[1] : null;

  // Validate credentials
  if (!CONFIG.SHOPIFY_STORE || !CONFIG.SHOPIFY_ACCESS_TOKEN) {
    console.error('❌ Missing Shopify credentials in .env.local');
    process.exit(1);
  }

  if (!CONFIG.META_PAGE_ACCESS_TOKEN || !CONFIG.META_LEAD_FORM_ID) {
    console.error('❌ Missing Meta credentials in .env.local');
    console.error('\nSETUP REQUIRED:');
    console.error('1. Create Meta App: https://developers.facebook.com/apps');
    console.error('2. Add app to Business Manager');
    console.error('3. Get Page Access Token with leads_retrieval permission');
    console.error('4. Get Lead Form ID from Ads Manager');
    console.error('5. Add to .env.local:');
    console.error('   META_PAGE_ACCESS_TOKEN=your_token');
    console.error('   META_PAGE_ID=your_page_id');
    console.error('   META_LEAD_FORM_ID=your_form_id');
    process.exit(1);
  }

  try {
    // Fetch Meta leads
    const leads = await fetchMetaLeads(since);

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

        const parsed = parseMetaLead(lead);
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
    console.log('📊 META LEAD SYNC SUMMARY');
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
    console.log('4. Set up Meta webhook for real-time sync (optional)');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
main();
