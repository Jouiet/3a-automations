const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';

/**
 * SYNC REMAINING PRODUCTS TO TIKTOK SHOP
 *
 * Current status: 188/198 products synced (94.9%)
 * Action: Publish 10 remaining products to TikTok channel
 */

async function shopifyGraphQL(query, variables = {}) {
  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    }
  );

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

async function syncRemainingProducts() {
  console.log('📤 SYNC REMAINING PRODUCTS TO TIKTOK\n');
  console.log('='.repeat(80));

  const TIKTOK_PUBLICATION_ID = 'gid://shopify/Publication/172441600052';

  // Step 1: Get all store products
  console.log('\n📦 STEP 1: Fetching all store products\n');

  const allProductsQuery = `query($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          status
          publishedAt
        }
      }
    }
  }`;

  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const data = await shopifyGraphQL(allProductsQuery, { cursor });
    const products = data.products.edges;
    allProducts = allProducts.concat(products);
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
    console.log(`   Fetched ${products.length} products (total: ${allProducts.length})...`);
  }

  console.log(`\n✅ Total products in store: ${allProducts.length}`);

  // Step 2: Get products published to TikTok
  console.log('\n📊 STEP 2: Checking TikTok published products\n');

  const tiktokProductsQuery = `query($publicationId: ID!, $cursor: String) {
    publication(id: $publicationId) {
      products(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
          }
        }
      }
    }
  }`;

  let tiktokProducts = [];
  hasNextPage = true;
  cursor = null;

  while (hasNextPage) {
    const data = await shopifyGraphQL(tiktokProductsQuery, {
      publicationId: TIKTOK_PUBLICATION_ID,
      cursor
    });
    const products = data.publication.products.edges;
    tiktokProducts = tiktokProducts.concat(products.map(e => e.node.id));
    hasNextPage = data.publication.products.pageInfo.hasNextPage;
    cursor = data.publication.products.pageInfo.endCursor;
  }

  console.log(`✅ Products in TikTok channel: ${tiktokProducts.length}`);

  // Step 3: Find products not published to TikTok
  const tiktokSet = new Set(tiktokProducts);
  const unpublished = allProducts.filter(({ node }) => !tiktokSet.has(node.id));

  console.log(`\n🔍 Found ${unpublished.length} product(s) NOT published to TikTok\n`);

  if (unpublished.length === 0) {
    console.log('✅ ALL PRODUCTS ALREADY PUBLISHED TO TIKTOK!\n');
    return;
  }

  // Show unpublished products
  console.log('Products to publish:');
  unpublished.forEach(({ node }, i) => {
    console.log(`   ${i + 1}. ${node.title} (${node.status})`);
  });

  // Step 4: Publish products to TikTok
  console.log('\n📤 STEP 3: Publishing products to TikTok channel\n');

  const publishMutation = `mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        ... on Product {
          id
          title
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

  let published = 0;
  let errors = 0;

  for (let i = 0; i < unpublished.length; i++) {
    const product = unpublished[i].node;

    try {
      console.log(`   [${i + 1}/${unpublished.length}] Publishing: ${product.title}`);

      const result = await shopifyGraphQL(publishMutation, {
        id: product.id,
        input: [{ publicationId: TIKTOK_PUBLICATION_ID }]
      });

      if (result.publishablePublish.userErrors.length > 0) {
        console.log(`      ❌ Error: ${result.publishablePublish.userErrors[0].message}`);
        errors++;
      } else {
        console.log(`      ✅ Published successfully`);
        published++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`      ❌ Failed: ${error.message}`);
      errors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 PUBLICATION SUMMARY\n');
  console.log(`✅ Successfully published: ${published}/${unpublished.length}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`\n📈 TikTok Shop status: ${tiktokProducts.length + published}/${allProducts.length} products (${((tiktokProducts.length + published) / allProducts.length * 100).toFixed(1)}%)\n`);

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    totalProducts: allProducts.length,
    alreadyPublished: tiktokProducts.length,
    newlyPublished: published,
    errors: errors,
    finalCount: tiktokProducts.length + published,
    percentage: ((tiktokProducts.length + published) / allProducts.length * 100).toFixed(1)
  };

  const fs = require('fs');
  fs.writeFileSync(
    'tiktok-product-publication-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('💾 Report saved to: tiktok-product-publication-report.json\n');
}

syncRemainingProducts().catch(error => {
  console.error('❌ ERROR:', error.message);
  process.exit(1);
});
