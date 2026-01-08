#!/usr/bin/env node
/**
 * EXPORT SHOPIFY CUSTOMERS FOR FACEBOOK CUSTOM AUDIENCES
 * Purpose: Export customer emails/phones for Facebook retargeting
 * Method: Shopify Admin API → CSV/JSON for Facebook import
 * Auto-sync: Can be scheduled via GitHub Actions
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const https = require('https');
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
if (!SHOPIFY_STORE) {
  console.error('❌ ERROR: SHOPIFY_STORE_DOMAIN not set in .env');
  process.exit(1);
}
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ ERROR: SHOPIFY_ACCESS_TOKEN not set in .env');
  process.exit(1);
}

console.log('================================================================================');
console.log('SHOPIFY CUSTOMERS EXPORT FOR FACEBOOK CUSTOM AUDIENCES');
console.log('================================================================================');
console.log(`Store: ${SHOPIFY_STORE}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================================\n');

/**
 * Fetch all customers from Shopify
 */
async function fetchAllCustomers() {
  const customers = [];
  let nextUrl = `/admin/api/2025-10/customers.json?limit=250`;

  while (nextUrl) {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: SHOPIFY_STORE,
        path: nextUrl,
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);

            // Get pagination link header
            const linkHeader = res.headers['link'];
            let next = null;

            if (linkHeader) {
              const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
              if (nextMatch) {
                const fullUrl = nextMatch[1];
                const urlObj = new URL(fullUrl);
                next = urlObj.pathname + urlObj.search;
              }
            }

            resolve({ customers: result.customers || [], next });
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    customers.push(...response.customers);
    nextUrl = response.next;

    console.log(`   Fetched ${customers.length} customers so far...`);
  }

  return customers;
}

/**
 * Filter and prepare customer data for Facebook
 */
function prepareCustomerData(customers) {
  const prepared = customers
    .filter(customer => {
      // Only customers with email or phone
      return customer.email || customer.phone;
    })
    .map(customer => {
      return {
        email: customer.email?.toLowerCase().trim() || '',
        phone: customer.phone?.replace(/\D/g, '') || '',  // Remove non-digits
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        city: customer.default_address?.city || '',
        state: customer.default_address?.province_code || '',
        country: customer.default_address?.country_code || '',
        zip: customer.default_address?.zip || '',
        // Meta fields
        total_spent: parseFloat(customer.total_spent || 0),
        orders_count: customer.orders_count || 0,
        created_at: customer.created_at,
      };
    });

  return prepared;
}

/**
 * Segment customers by value (for tiered audiences)
 */
function segmentCustomers(customers) {
  const all = customers;
  const buyers = customers.filter(c => c.orders_count > 0);
  const vip = customers.filter(c => c.total_spent >= 200);  // VIP = $200+
  const recent = customers.filter(c => {
    const created = new Date(c.created_at);
    const days90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return created > days90;
  });

  return { all, buyers, vip, recent };
}

/**
 * Export to CSV (Facebook-compatible format)
 */
function exportToCSV(customers, filename) {
  const header = 'email,phone,fn,ln,ct,st,country,zip\n';

  const rows = customers.map(c => {
    return [
      c.email,
      c.phone,
      c.first_name,
      c.last_name,
      c.city,
      c.state,
      c.country,
      c.zip
    ].map(field => `"${field}"`).join(',');
  });

  const csv = header + rows.join('\n');

  fs.writeFileSync(filename, csv);
  console.log(`✅ CSV exported: ${filename}`);
  console.log(`   Rows: ${customers.length}\n`);
}

/**
 * Export to JSON (for Python script)
 */
function exportToJSON(customers, filename) {
  const data = {
    timestamp: new Date().toISOString(),
    total: customers.length,
    customers: customers.map(c => ({
      email: c.email,
      phone: c.phone,
      first_name: c.first_name,
      last_name: c.last_name,
      total_spent: c.total_spent,
      orders_count: c.orders_count,
    }))
  };

  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`✅ JSON exported: ${filename}`);
  console.log(`   Records: ${customers.length}\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('1. FETCHING SHOPIFY CUSTOMERS');
    console.log('─'.repeat(80));

    const customers = await fetchAllCustomers();

    console.log(`\n✅ Total customers fetched: ${customers.length}\n`);

    console.log('2. PREPARING DATA FOR FACEBOOK');
    console.log('─'.repeat(80));

    const prepared = prepareCustomerData(customers);
    console.log(`✅ Prepared customers: ${prepared.length}`);
    console.log(`   With email: ${prepared.filter(c => c.email).length}`);
    console.log(`   With phone: ${prepared.filter(c => c.phone).length}\n`);

    console.log('3. SEGMENTING CUSTOMERS');
    console.log('─'.repeat(80));

    const segments = segmentCustomers(prepared);
    console.log(`✅ All customers: ${segments.all.length}`);
    console.log(`✅ Buyers (orders > 0): ${segments.buyers.length}`);
    console.log(`✅ VIP (spent >= $200): ${segments.vip.length}`);
    console.log(`✅ Recent (last 90 days): ${segments.recent.length}\n`);

    console.log('4. EXPORTING FILES');
    console.log('─'.repeat(80));

    // Export all segments
    exportToCSV(segments.all, '/tmp/facebook-audience-all.csv');
    exportToCSV(segments.buyers, '/tmp/facebook-audience-buyers.csv');
    exportToCSV(segments.vip, '/tmp/facebook-audience-vip.csv');
    exportToCSV(segments.recent, '/tmp/facebook-audience-recent.csv');

    // Export JSON for Python automation
    exportToJSON(segments.all, '/tmp/facebook-audience-all.json');
    exportToJSON(segments.vip, '/tmp/facebook-audience-vip.json');

    console.log('================================================================================');
    console.log('EXPORT COMPLETE');
    console.log('================================================================================\n');

    console.log('NEXT STEPS:');
    console.log('1. Use CSV files to manually upload to Facebook Ads Manager');
    console.log('   → Ads Manager → Audiences → Create Audience → Customer List');
    console.log('');
    console.log('2. Use JSON files with Python automation script:');
    console.log('   → python3 scripts/facebook-ads-automation.py');
    console.log('');
    console.log('RECOMMENDED AUDIENCES TO CREATE:');
    console.log('  ✅ All Customers - For general retargeting');
    console.log('  ✅ Buyers Only - Exclude window shoppers');
    console.log('  ✅ VIP Customers - Create 1% Lookalike (highest quality)');
    console.log('  ✅ Recent Customers - Upsell/cross-sell campaigns\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
