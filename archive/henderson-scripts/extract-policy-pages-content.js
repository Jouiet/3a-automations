require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';

async function extractPolicies() {
  console.log('═'.repeat(80));
  console.log('EXTRACTING POLICY PAGES CONTENT');
  console.log('═'.repeat(80));
  console.log();

  try {
    // Get all pages
    const pagesResponse = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/pages.json`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!pagesResponse.ok) {
      throw new Error(`Pages API failed: ${pagesResponse.status}`);
    }

    const pagesData = await pagesResponse.json();

    const policyHandles = ['refund-policy', 'privacy-policy', 'terms-of-service', 'shipping-policy'];
    const policies = {};

    for (const handle of policyHandles) {
      const page = pagesData.pages.find(p => p.handle === handle);

      if (page) {
        console.log(`✅ Found: ${page.title}`);

        // Strip HTML tags for plain text version
        const plainText = page.body_html
          .replace(/<style[^>]*>.*?<\/style>/gi, '')
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        policies[handle] = {
          title: page.title,
          html: page.body_html,
          plain: plainText,
        };
      } else {
        console.log(`❌ Not found: ${handle}`);
      }
    }

    console.log();
    console.log('═'.repeat(80));
    console.log('EXTRACTED POLICIES');
    console.log('═'.repeat(80));
    console.log();

    // Save to file
    const outputPath = '/tmp/henderson-shop-policies.json';
    fs.writeFileSync(outputPath, JSON.stringify(policies, null, 2));
    console.log(`✅ Saved to: ${outputPath}`);
    console.log();

    // Print each policy
    for (const [handle, data] of Object.entries(policies)) {
      console.log('═'.repeat(80));
      console.log(`${data.title.toUpperCase()}`);
      console.log('═'.repeat(80));
      console.log();
      console.log(data.plain);
      console.log();
      console.log();
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

extractPolicies();
