// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

require('dotenv').config();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION;

/**
 * Cleanup Unused Metaobjects (bundle_proposal & bundle_aggregate)
 *
 * Ces metaobjects ont été créés initialement mais ne sont plus nécessaires
 * car le système utilise maintenant Google Sheets pour le stockage.
 *
 * Usage: node scripts/cleanup_unused_metaobjects.cjs
 */

const METAOBJECT_IDS = [
  'gid://shopify/MetaobjectDefinition/13081641157', // bundle_proposal
  'gid://shopify/MetaobjectDefinition/13081673925'  // bundle_aggregate
];

async function deleteMetaobjectDefinition(id) {
  const mutation = `mutation DeleteMetaobjectDefinition($id: ID!) {
    metaobjectDefinitionDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id }
      })
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error(`❌ Errors deleting ${id}:`, result.errors);
    return false;
  }

  if (result.data.metaobjectDefinitionDelete.userErrors.length > 0) {
    console.error(`❌ User errors deleting ${id}:`, result.data.metaobjectDefinitionDelete.userErrors);
    return false;
  }

  console.log(`✅ Deleted: ${result.data.metaobjectDefinitionDelete.deletedId}`);
  return true;
}

async function main() {
  console.log('🗑️  Cleaning up unused metaobject definitions...\n');
  console.log('Note: These metaobjects are no longer needed because the system');
  console.log('now uses Google Sheets for storage instead.\n');

  let success = 0;
  let failed = 0;

  for (const id of METAOBJECT_IDS) {
    const result = await deleteMetaobjectDefinition(id);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Deleted: ${success}`);
  console.log(`   Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n✅ Cleanup complete!');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
