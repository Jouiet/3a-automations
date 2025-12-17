require('dotenv').config({ path: '.env.local' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function getPage(handle) {
  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2025-10/pages.json?handle=${handle}`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) throw new Error(`Failed: ${response.status}`);
  const data = await response.json();
  return data.pages[0];
}

async function updatePage(pageId, updates) {
  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2025-10/pages/${pageId}.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page: updates })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed: ${response.status} - ${error}`);
  }
  return response.json();
}

async function main() {
  console.log('═'.repeat(80));
  console.log('CONFIGURE SITEMAP PAGE TO USE XML TEMPLATE');
  console.log('═'.repeat(80));
  console.log();

  console.log('⏳ Fetching page...');
  const page = await getPage('sitemap-videos');

  console.log(`✅ Found page: "${page.title}"`);
  console.log(`   ID: ${page.id}`);
  console.log(`   Current template suffix: "${page.template_suffix || '(none)'}"`);
  console.log();

  if (page.template_suffix === 'sitemap-videos.xml') {
    console.log('✅ Page already configured correctly!');
    console.log();
  } else {
    console.log('🔧 Updating template suffix to "sitemap-videos.xml"...');
    await updatePage(page.id, {
      template_suffix: 'sitemap-videos.xml'
    });
    console.log('✅ Page updated!');
    console.log();
  }

  console.log('⏳ Waiting 10 seconds for Shopify cache...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('🔍 Testing output...');
  const testUrl = 'https://www.hendersonshop.com/pages/sitemap-videos.xml';
  const response = await fetch(testUrl);
  const text = await response.text();

  console.log(`Status: ${response.status}`);
  console.log(`Content-Type: ${response.headers.get('content-type')}`);
  console.log(`Size: ${text.length} bytes`);
  console.log();

  if (text.includes('<urlset') && text.includes('video:video')) {
    console.log('✅✅✅ SUCCESS! Video sitemap XML is valid!');
    console.log();
    console.log('First 500 characters:');
    console.log(text.substring(0, 500));
    console.log();
  } else if (text.includes('<page>') && text.includes('<handle>sitemap-videos</handle>')) {
    console.log('❌ Still showing Shopify page metadata XML');
    console.log('   Template may not be assigned correctly');
    console.log();
    console.log('MANUAL FIX REQUIRED:');
    console.log('1. Go to: https://admin.shopify.com/store/jqp1x4-7e/pages');
    console.log('2. Click on "Video Sitemap" page');
    console.log('3. In the right sidebar, find "Template"');
    console.log('4. Select: page.sitemap-videos.xml');
    console.log('5. Save');
    console.log();
  } else {
    console.log('⚠️  Unexpected output:');
    console.log(text.substring(0, 500));
    console.log();
  }

  console.log('═'.repeat(80));
  console.log('NEXT STEPS');
  console.log('═'.repeat(80));
  console.log();
  console.log('Once XML is valid:');
  console.log('1. Visit https://search.google.com/search-console');
  console.log('2. Select hendersonshop.com property');
  console.log('3. Go to Sitemaps');
  console.log('4. Add new sitemap: https://www.hendersonshop.com/pages/sitemap-videos.xml');
  console.log('5. Submit and monitor indexing status');
  console.log();
}

main().catch(console.error);
