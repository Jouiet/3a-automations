// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SHOP = process.env.SHOPIFY_STORE_URL;
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2025-10';

const COLLECTION_ID = 'gid://shopify/Collection/328764227781'; // Business & Professional Bags
const PRODUCT_IDS = [
  '8452871258309', '8452871585989', '8452871618757', '8452871684293',
  '8452871815365', '8452871848133', '8452873879749', '8452871782597',
  '8452872011973', '8452871749829', '8452872044741', '8452872372421'
];

async function addProductsToCollection() {
  console.log('Adding products to collection...\n');
  console.log(`Collection ID: ${COLLECTION_ID}`);
  console.log(`Products to add: ${PRODUCT_IDS.length}\n`);

  const productGids = PRODUCT_IDS.map(id => `gid://shopify/Product/${id}`);

  let addedCount = 0;
  const errors = [];

  for (const [index, productGid] of productGids.entries()) {
    console.log(`[${index + 1}/${productGids.length}] Adding ${productGid}...`);

    const mutation = `
      mutation {
        collectionAddProducts(
          id: "${COLLECTION_ID}"
          productIds: ["${productGid}"]
        ) {
          collection {
            id
            productsCount {
              count
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: mutation })
    });

    const result = await response.json();

    if (result.errors) {
      console.log(`   ❌ GraphQL error`);
      errors.push({ productGid, error: result.errors });
    } else if (result.data?.collectionAddProducts?.userErrors?.length > 0) {
      console.log(`   ❌ User error`);
      errors.push({ productGid, error: result.data.collectionAddProducts.userErrors });
    } else if (result.data?.collectionAddProducts) {
      console.log(`   ✅ Added (total: ${result.data.collectionAddProducts.collection.productsCount.count})`);
      addedCount++;
    } else {
      console.log(`   ⚠️  Unexpected response`);
      errors.push({ productGid, error: 'Unexpected response' });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ Added ${addedCount}/${PRODUCT_IDS.length} products`);
  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    console.error('\nError details:', JSON.stringify(errors, null, 2));
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

addProductsToCollection().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
