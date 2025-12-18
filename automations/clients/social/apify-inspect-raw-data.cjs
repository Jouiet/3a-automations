#!/usr/bin/env node
/**
 * APIFY INSPECT RAW DATA
 * Purpose: Fetch and inspect data from an Apify dataset
 * Usage: APIFY_DATASET_ID=xxx node apify-inspect-raw-data.cjs
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const https = require('https');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const datasetId = process.env.APIFY_DATASET_ID;

if (!APIFY_TOKEN) {
  console.error('❌ ERROR: APIFY_TOKEN not set in .env');
  process.exit(1);
}

if (!datasetId) {
  console.error('❌ ERROR: APIFY_DATASET_ID not set in .env or environment');
  console.error('   Usage: APIFY_DATASET_ID=xxx node apify-inspect-raw-data.cjs');
  process.exit(1);
}

console.log('=== FETCHING APIFY DATASET DATA ===');
console.log('Dataset ID:', datasetId);
console.log('Fetching first 3 items to inspect structure...');
console.log('');

const options = {
  hostname: 'api.apify.com',
  path: `/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=3`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const items = JSON.parse(data);

      console.log('✅ Raw data fetched successfully');
      console.log('Total items in response:', items.length);
      console.log('');

      if (items.length === 0) {
        console.log('⚠️  Dataset is empty. Scraper may still be running or failed.');
        return;
      }

      console.log('=== RAW LEAD DATA STRUCTURE ===');
      console.log('');

      items.forEach((item, index) => {
        console.log(`--- LEAD #${index + 1} ---`);
        console.log('Available fields:', Object.keys(item).join(', '));
        console.log('');
        console.log('Full data:');
        console.log(JSON.stringify(item, null, 2));
        console.log('');
        console.log('---');
        console.log('');
      });

      console.log('=== ANALYSIS ===');
      console.log('Field names to check:');
      const firstItem = items[0] || {};
      Object.keys(firstItem).forEach(key => {
        const value = firstItem[key];
        const type = typeof value;
        const preview = type === 'string' ? `"${value.substring(0, 50)}..."` : JSON.stringify(value);
        console.log(`- ${key}: (${type}) ${preview}`);
      });

    } else {
      console.log('❌ Failed to fetch raw data');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e));
req.end();
