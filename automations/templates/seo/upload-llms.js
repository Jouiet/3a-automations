require('dotenv').config({ path: '.env' });
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
      body: JSON.stringify({ asset: { key, value } })
    }
  );

  if (!response.ok) throw new Error(`Failed: ${response.status}`);
  return response.json();
}

async function main() {
  console.log('🚀 Uploading llms.txt (198 products) to Shopify...');
  const content = fs.readFileSync('/tmp/llms-fixed.liquid', 'utf8');
  await updateAsset('templates/page.llms.liquid', content);
  console.log('✅ Upload complete - llms.txt now shows 198 products');
}

main().catch(console.error);
