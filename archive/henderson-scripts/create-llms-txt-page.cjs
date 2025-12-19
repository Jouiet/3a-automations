#!/usr/bin/env node
/**
 * P1.2: Create /llms.txt Shopify Page
 * Creates a Shopify page that uses the page.llms.txt.liquid template
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-10';

console.log('🔧 P1.2: CREATE LLMS.TXT PAGE');
console.log('═'.repeat(70));

async function createPage() {
  return new Promise((resolve) => {
    const pageData = {
      page: {
        title: 'LLMs.txt',
        body_html: '<p>AI-friendly documentation for language models.</p>',
        template_suffix: 'llms.txt',
        published: true,
        author: 'Henderson Shop'
      }
    };

    const data = JSON.stringify(pageData);

    const options = {
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/pages.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    console.log(`\n📄 Creating Shopify page...`);
    console.log(`   Title: "LLMs.txt"`);
    console.log(`   Template: page.llms.txt.liquid`);
    console.log(`   Status: Published`);

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(responseData);
          const page = result.page;
          console.log(`\n✅ SUCCESS!`);
          console.log(`   Page ID: ${page.id}`);
          console.log(`   Handle: ${page.handle}`);
          console.log(`   URL: https://www.hendersonshop.com/pages/${page.handle}`);
          resolve({ success: true, page });
        } else if (res.statusCode === 422) {
          const error = JSON.parse(responseData);
          console.log(`\n⚠️  Page may already exist`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, JSON.stringify(error, null, 2));
          resolve({ success: false, status: res.statusCode, error });
        } else {
          console.log(`\n❌ FAILED (HTTP ${res.statusCode})`);
          console.log(`   Response: ${responseData.substring(0, 500)}`);
          resolve({ success: false, status: res.statusCode, error: responseData });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`\n❌ Request error: ${e.message}`);
      resolve({ success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

async function verifyPage(handle) {
  console.log(`\n🔍 Verifying page accessibility...`);

  return new Promise((resolve) => {
    const options = {
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/pages.json?handle=${handle}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(responseData);
          if (result.pages && result.pages.length > 0) {
            const page = result.pages[0];
            console.log(`   ✅ Page found`);
            console.log(`   ID: ${page.id}`);
            console.log(`   Handle: ${page.handle}`);
            console.log(`   Template: page.${page.template_suffix}.liquid`);
            console.log(`   Published: ${page.published_at ? 'Yes' : 'No'}`);
            resolve({ success: true, page });
          } else {
            console.log(`   ❌ Page not found`);
            resolve({ success: false });
          }
        } else {
          console.log(`   ❌ Error: HTTP ${res.statusCode}`);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Error: ${e.message}`);
      resolve({ success: false });
    });

    req.end();
  });
}

async function main() {
  console.log(`\n📊 Step 1: Create page\n`);
  console.log('─'.repeat(70));

  const createResult = await createPage();

  console.log(`\n📊 Step 2: Verify page\n`);
  console.log('─'.repeat(70));

  const handle = createResult.success ? createResult.page.handle : 'llms-txt';
  const verifyResult = await verifyPage(handle);

  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESULTS');
  console.log('═'.repeat(70));

  if (verifyResult.success) {
    console.log(`✅ Page created and verified!`);
    console.log(`\nNext steps:`);
    console.log(`1. Test URL: https://www.hendersonshop.com/pages/${verifyResult.page.handle}`);
    console.log(`2. Optional: Create redirect from /llms.txt to /pages/${verifyResult.page.handle}`);
    console.log(`3. Verify with: curl https://www.hendersonshop.com/pages/${verifyResult.page.handle}`);
    console.log(`\n🎉 P1.2: COMPLETE!\n`);
  } else {
    console.log(`⚠️  Page creation may have failed or page already exists`);
    console.log(`\nManual verification required:`);
    console.log(`1. Check Shopify Admin > Content > Pages`);
    console.log(`2. Look for page titled "LLMs.txt"`);
    console.log(`3. Verify template is set to "page.llms.txt.liquid"\n`);
  }
}

main().catch(console.error);
