require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = '147139985460';

async function updateAsset(key, value) {
  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2025-10/themes/${THEME_ID}/assets.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asset: { key, value }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🚀 Uploading fixed schema to Shopify...');

  const fixed = fs.readFileSync('/tmp/brand-story-video-fixed.liquid', 'utf8');

  await updateAsset('sections/brand-story-video.liquid', fixed);

  console.log('✅ Upload complete');
  console.log('🔗 Verify: https://www.hendersonshop.com/');
}

main().catch(console.error);
