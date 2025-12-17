/**
 * Script to download the About template from Shopify
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'jqp1x4-7e.myshopify.com';
const SHOPIFY_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN ||
  process.env.SHOPIFY_ACCESS_TOKEN ||
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
  process.env.SHOPIFY_API_SECRET_KEY ||
  process.env.SHOPIFY_PASSWORD;

const THEME_ID = '147139985460';

async function downloadTemplate() {
  try {
    // Get the template asset
    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-10/themes/${THEME_ID}/assets.json?asset[key]=templates/page.about.json`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.asset) {
      console.log('Template found on Shopify:');
      console.log('Key:', data.asset.key);
      console.log('Size:', data.asset.size, 'bytes');
      console.log('Created:', data.asset.created_at);
      console.log('Updated:', data.asset.updated_at);
      console.log('\nContent:');
      console.log(data.asset.value || data.asset.attachment);
    } else {
      console.log('Template page.about.json not found on Shopify theme');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

downloadTemplate();
