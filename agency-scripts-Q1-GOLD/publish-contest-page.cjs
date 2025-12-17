#!/usr/bin/env node
/**
 * PUBLISH CONTEST PAGE
 * Changes page status from Draft to Published
 */

require('dotenv').config({ path: '.env.local' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';
const PAGE_ID = '117223784500';

async function publishPage() {
  console.log('📤 PUBLISHING CONTEST PAGE\n');
  console.log('─'.repeat(80));

  try {
    // Publish the page
    console.log('🔓 Changing status from Draft to Published...');
    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/pages/${PAGE_ID}.json`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          page: {
            id: PAGE_ID,
            published: true,
            published_at: new Date().toISOString(),
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to publish page: ${JSON.stringify(error, null, 2)}`);
    }

    const result = await response.json();

    console.log('\n✅ Contest page successfully published!\n');
    console.log('📄 Page Details:');
    console.log(`   Title: ${result.page.title}`);
    console.log(`   Handle: ${result.page.handle}`);
    console.log(`   ID: ${result.page.id}`);
    console.log(`   Status: ${result.page.published ? '🟢 PUBLISHED (LIVE)' : '🟡 Draft'}`);
    console.log(`   Public URL: https://www.hendersonshop.com/pages/${result.page.handle}`);
    console.log(`   Admin URL: https://${SHOPIFY_STORE}/admin/pages/${result.page.id}`);

    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Test the LIVE page: https://www.hendersonshop.com/pages/giveaway');
    console.log('   2. Submit a test entry to verify Google Sheets integration');
    console.log('   3. Share the Google Sheet with service account (CRITICAL!)');
    console.log('   4. Launch Facebook/Instagram ads campaign');

    console.log('\n─'.repeat(80));
    console.log('✅ PAGE PUBLICATION COMPLETE\n');

    return result.page;

  } catch (error) {
    console.error('\n❌ ERROR publishing page:');
    console.error(error.message);
    process.exit(1);
  }
}

// Execute
publishPage();
