// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node

/**
 * REGISTER LOYALTY WEBHOOKS
 *
 * Registers webhook subscriptions in Shopify for loyalty system:
 * 1. orders/create → Award points after purchase
 * 2. customers/create → Award signup bonus
 *
 * Usage: node scripts/register_loyalty_webhooks.cjs <webhook_server_url>
 * Example: node scripts/register_loyalty_webhooks.cjs https://your-server.railway.app
 */

require('dotenv').config();

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

const GRAPHQL_ENDPOINT = `https://${SHOPIFY_STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

// ============================================
// WEBHOOK CONFIGURATIONS
// ============================================

const WEBHOOKS = [
  {
    topic: 'ORDERS_CREATE',
    endpoint: '/webhooks/orders-create',
    description: 'Award loyalty points when order is created',
  },
  {
    topic: 'CUSTOMERS_CREATE',
    endpoint: '/webhooks/customers-create',
    description: 'Award signup bonus when customer account is created',
  },
];

// ============================================
// GRAPHQL MUTATIONS
// ============================================

const CREATE_WEBHOOK = `
  mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        topic
        endpoint {
          __typename
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const LIST_WEBHOOKS = `
  query ListWebhooks {
    webhookSubscriptions(first: 100) {
      edges {
        node {
          id
          topic
          endpoint {
            __typename
            ... on WebhookHttpEndpoint {
              callbackUrl
            }
          }
        }
      }
    }
  }
`;

const DELETE_WEBHOOK = `
  mutation DeleteWebhook($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }
`;

// ============================================
// API FUNCTIONS
// ============================================

async function shopifyGraphQL(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_API_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:', JSON.stringify(data.errors, null, 2));
      throw new Error('GraphQL query failed');
    }

    return data.data;
  } catch (error) {
    console.error('❌ API Call Failed:', error.message);
    throw error;
  }
}

async function listWebhooks() {
  const data = await shopifyGraphQL(LIST_WEBHOOKS);
  return data.webhookSubscriptions.edges;
}

async function createWebhook(topic, callbackUrl) {
  const webhookSubscription = {
    callbackUrl: callbackUrl,
    format: 'JSON',
  };

  const data = await shopifyGraphQL(CREATE_WEBHOOK, { topic, webhookSubscription });
  return data.webhookSubscriptionCreate;
}

async function deleteWebhook(id) {
  const data = await shopifyGraphQL(DELETE_WEBHOOK, { id });
  return data.webhookSubscriptionDelete;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║    REGISTER LOYALTY WEBHOOKS              ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log('Usage: node scripts/register_loyalty_webhooks.cjs <webhook_server_url>\n');
    console.log('Example:');
    console.log('  node scripts/register_loyalty_webhooks.cjs https://mydealz-loyalty.railway.app\n');
    console.log('Actions:');
    console.log('  --list    List existing webhooks');
    console.log('  --delete  Delete loyalty webhooks\n');
    process.exit(1);
  }

  const action = args[0];

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║    LOYALTY WEBHOOKS MANAGEMENT            ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    // List webhooks
    if (action === '--list') {
      console.log('📋 Listing existing webhooks...\n');
      const webhooks = await listWebhooks();

      if (webhooks.length === 0) {
        console.log('❌ No webhooks found\n');
      } else {
        webhooks.forEach(({ node }) => {
          console.log(`Topic: ${node.topic}`);
          if (node.endpoint.__typename === 'WebhookHttpEndpoint') {
            console.log(`URL: ${node.endpoint.callbackUrl}`);
          }
          console.log(`ID: ${node.id}\n`);
        });
      }
      process.exit(0);
    }

    // Delete webhooks
    if (action === '--delete') {
      console.log('🗑️  Finding loyalty webhooks to delete...\n');
      const webhooks = await listWebhooks();

      const loyaltyWebhooks = webhooks.filter(({ node }) =>
        ['ORDERS_CREATE', 'CUSTOMERS_CREATE'].includes(node.topic)
      );

      if (loyaltyWebhooks.length === 0) {
        console.log('❌ No loyalty webhooks found to delete\n');
        process.exit(0);
      }

      for (const { node } of loyaltyWebhooks) {
        console.log(`Deleting: ${node.topic}`);
        await deleteWebhook(node.id);
        console.log('✅ Deleted\n');
      }

      console.log('✅ All loyalty webhooks deleted\n');
      process.exit(0);
    }

    // Register webhooks
    const serverUrl = action;

    // Validate URL
    if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      console.error('❌ Error: Server URL must start with http:// or https://');
      process.exit(1);
    }

    console.log(`Server URL: ${serverUrl}\n`);

    // Check existing webhooks
    console.log('🔍 Checking existing webhooks...\n');
    const existingWebhooks = await listWebhooks();

    let registeredCount = 0;
    let skippedCount = 0;

    for (const webhook of WEBHOOKS) {
      const callbackUrl = serverUrl + webhook.endpoint;

      console.log(`Topic: ${webhook.topic}`);
      console.log(`Endpoint: ${callbackUrl}`);
      console.log(`Description: ${webhook.description}`);

      // Check if already exists
      const existing = existingWebhooks.find(
        ({ node }) =>
          node.topic === webhook.topic &&
          node.endpoint.__typename === 'WebhookHttpEndpoint' &&
          node.endpoint.callbackUrl === callbackUrl
      );

      if (existing) {
        console.log('⚠️  Already registered (skipping)\n');
        skippedCount++;
        continue;
      }

      // Create webhook
      const result = await createWebhook(webhook.topic, callbackUrl);

      if (result.userErrors && result.userErrors.length > 0) {
        console.error('❌ Error:', result.userErrors[0].message, '\n');
      } else {
        console.log('✅ Registered successfully');
        console.log(`   ID: ${result.webhookSubscription.id}\n`);
        registeredCount++;
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Registered: ${registeredCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log(`📋 Total: ${WEBHOOKS.length}`);
    console.log('═══════════════════════════════════════════\n');

    if (registeredCount > 0) {
      console.log('✅ Webhooks registered successfully!\n');
      console.log('Next steps:');
      console.log('1. Ensure webhook server is running');
      console.log('2. Test with a real order or customer creation');
      console.log('3. Monitor server logs for incoming webhooks\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

main();
