// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node

/**
 * 🔬 ANALYSE FORENSIQUE COMPLÈTE - SYSTÈME FLYWHEEL MYDEALZ
 *
 * Extraction 100% factuelle via APIs:
 * - Shopify Admin API (store data, products, orders, customers, apps)
 * - Métadonnées système (workflows, automations, interconnexions)
 *
 * Approche: BOTTOM-UP data-driven (PAS de suppositions)
 *
 * Date: 2025-11-24
 * Exigence: RIGUEUR ABSOLUE + TRANSPARENCE TOTALE
 */

const https = require('https');
const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SHOPIFY_TOKEN = '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';
const SHOPIFY_STORE = '5dc028-dd.myshopify.com';
const API_VERSION = '2025-10';

// ============================================================================
// SHOPIFY API HELPER
// ============================================================================

function shopifyRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/${API_VERSION}${path}`,
      method,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, error: 'JSON parse failed' });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// GraphQL helper
function shopifyGraphQL(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/${API_VERSION}/graphql.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, error: 'JSON parse failed' });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

// ============================================================================
// DATA EXTRACTION MODULES
// ============================================================================

async function getStoreMetrics() {
  console.log('\n🏪 EXTRACTION: Store Metrics...\n');

  const [shop, products, orders, customers] = await Promise.all([
    shopifyRequest('/shop.json'),
    shopifyRequest('/products/count.json'),
    shopifyRequest('/orders/count.json'),
    shopifyRequest('/customers/count.json')
  ]);

  return {
    shop: shop.shop || {},
    productCount: products.count || 0,
    orderCount: orders.count || 0,
    customerCount: customers.count || 0
  };
}

async function getShopifyFlowWorkflows() {
  console.log('\n⚡ EXTRACTION: Shopify Flow Workflows...\n');

  // Shopify Flow uses GraphQL API
  const query = `{
    shopifyFunctions(first: 50) {
      edges {
        node {
          id
          app {
            title
          }
          apiType
          title
        }
      }
    }
  }`;

  const result = await shopifyGraphQL(query);
  return result.data?.shopifyFunctions?.edges || [];
}

async function getShopifyEmailCampaigns() {
  console.log('\n📧 EXTRACTION: Shopify Email Campaigns...\n');

  // Shopify Email automation activities
  const activities = await shopifyRequest('/marketing_events.json?limit=250');

  return {
    total: activities.marketing_events?.length || 0,
    campaigns: activities.marketing_events || []
  };
}

async function getInstalledApps() {
  console.log('\n📱 EXTRACTION: Installed Apps (via Metafield Definitions)...\n');

  // Apps install metafield definitions
  const query = `{
    metafieldDefinitions(first: 100, ownerType: PRODUCT) {
      edges {
        node {
          id
          name
          namespace
          key
          ownerType
        }
      }
    }
  }`;

  const result = await shopifyGraphQL(query);
  const definitions = result.data?.metafieldDefinitions?.edges || [];

  // Extract unique namespaces (app identifiers)
  const appNamespaces = [...new Set(definitions.map(d => d.node.namespace))];

  return {
    totalDefinitions: definitions.length,
    appNamespaces,
    definitions: definitions.map(d => d.node)
  };
}

async function getAutomationScripts() {
  console.log('\n🤖 EXTRACTION: Automation Scripts (ScriptTags)...\n');

  const scripts = await shopifyRequest('/script_tags.json');

  return {
    total: scripts.script_tags?.length || 0,
    scripts: scripts.script_tags || []
  };
}

async function getWebhooks() {
  console.log('\n🔔 EXTRACTION: Active Webhooks...\n');

  const webhooks = await shopifyRequest('/webhooks.json');

  return {
    total: webhooks.webhooks?.length || 0,
    webhooks: webhooks.webhooks || []
  };
}

async function getProductData() {
  console.log('\n📦 EXTRACTION: Product Catalog Data...\n');

  const products = await shopifyRequest('/products.json?limit=250&fields=id,title,status,product_type,tags,variants');

  const productTypes = {};
  const tagCounts = {};
  let totalVariants = 0;

  products.products?.forEach(p => {
    // Count product types
    productTypes[p.product_type] = (productTypes[p.product_type] || 0) + 1;

    // Count tags
    p.tags?.split(',').forEach(tag => {
      const cleanTag = tag.trim();
      tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
    });

    // Count variants
    totalVariants += p.variants?.length || 0;
  });

  return {
    total: products.products?.length || 0,
    active: products.products?.filter(p => p.status === 'active').length || 0,
    draft: products.products?.filter(p => p.status === 'draft').length || 0,
    totalVariants,
    productTypes,
    topTags: Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }))
  };
}

async function getCollections() {
  console.log('\n📚 EXTRACTION: Collections Data...\n');

  const [custom, smart] = await Promise.all([
    shopifyRequest('/custom_collections.json?limit=250'),
    shopifyRequest('/smart_collections.json?limit=250')
  ]);

  return {
    custom: {
      total: custom.custom_collections?.length || 0,
      collections: custom.custom_collections || []
    },
    smart: {
      total: smart.smart_collections?.length || 0,
      collections: smart.smart_collections || []
    },
    total: (custom.custom_collections?.length || 0) + (smart.smart_collections?.length || 0)
  };
}

async function getDiscountCodes() {
  console.log('\n💰 EXTRACTION: Discount Codes...\n');

  const priceRules = await shopifyRequest('/price_rules.json?limit=250');

  const discountCodes = [];
  for (const rule of (priceRules.price_rules || [])) {
    const codes = await shopifyRequest(`/price_rules/${rule.id}/discount_codes.json`);
    discountCodes.push(...(codes.discount_codes || []));
  }

  return {
    priceRules: priceRules.price_rules?.length || 0,
    discountCodes: discountCodes.length,
    codes: discountCodes
  };
}

async function getThemeData() {
  console.log('\n🎨 EXTRACTION: Theme Data...\n');

  const themes = await shopifyRequest('/themes.json');
  const mainTheme = themes.themes?.find(t => t.role === 'main');

  if (!mainTheme) {
    return { error: 'No main theme found' };
  }

  // Get theme assets count
  const assets = await shopifyRequest(`/themes/${mainTheme.id}/assets.json`);

  return {
    mainTheme: {
      id: mainTheme.id,
      name: mainTheme.name,
      role: mainTheme.role,
      createdAt: mainTheme.created_at,
      updatedAt: mainTheme.updated_at
    },
    totalAssets: assets.assets?.length || 0,
    assetTypes: {
      liquid: assets.assets?.filter(a => a.key.endsWith('.liquid')).length || 0,
      js: assets.assets?.filter(a => a.key.endsWith('.js')).length || 0,
      css: assets.assets?.filter(a => a.key.endsWith('.css')).length || 0
    }
  };
}

async function getShippingZones() {
  console.log('\n🚚 EXTRACTION: Shipping Configuration...\n');

  // Shipping zones via GraphQL
  const query = `{
    shop {
      shipsToCountries
    }
    deliveryProfiles(first: 10) {
      edges {
        node {
          id
          name
          default
          profileLocationGroups {
            locationGroupZones(first: 50) {
              edges {
                node {
                  zone {
                    countries {
                      code {
                        countryCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  const result = await shopifyGraphQL(query);

  return {
    shipsToCountries: result.data?.shop?.shipsToCountries || [],
    deliveryProfiles: result.data?.deliveryProfiles?.edges || []
  };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

async function runForensicAnalysis() {
  console.log('═'.repeat(80));
  console.log('🔬 ANALYSE FORENSIQUE COMPLÈTE - SYSTÈME FLYWHEEL MYDEALZ');
  console.log('═'.repeat(80));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🏪 Store: ${SHOPIFY_STORE}`);
  console.log(`📊 Approche: BOTTOM-UP data-driven (100% factuel)`);
  console.log('═'.repeat(80));

  const analysis = {
    metadata: {
      timestamp: new Date().toISOString(),
      store: SHOPIFY_STORE,
      apiVersion: API_VERSION,
      analysisType: 'FORENSIC_FLYWHEEL_COMPLETE'
    },
    data: {}
  };

  try {
    // Module 1: Store Metrics
    analysis.data.storeMetrics = await getStoreMetrics();

    // Module 2: Product Data
    analysis.data.products = await getProductData();

    // Module 3: Collections
    analysis.data.collections = await getCollections();

    // Module 4: Orders & Customers (detailed)
    const ordersRaw = await shopifyRequest('/orders.json?limit=250&status=any');
    analysis.data.orders = {
      total: analysis.data.storeMetrics.orderCount,
      recent: ordersRaw.orders?.length || 0,
      details: ordersRaw.orders || []
    };

    const customersRaw = await shopifyRequest('/customers.json?limit=250');
    analysis.data.customers = {
      total: analysis.data.storeMetrics.customerCount,
      recent: customersRaw.customers?.length || 0,
      details: customersRaw.customers || []
    };

    // Module 5: Automations
    analysis.data.automations = {
      shopifyFlow: await getShopifyFlowWorkflows(),
      shopifyEmail: await getShopifyEmailCampaigns(),
      scriptTags: await getAutomationScripts(),
      webhooks: await getWebhooks()
    };

    // Module 6: Apps & Integrations
    analysis.data.apps = await getInstalledApps();

    // Module 7: Theme
    analysis.data.theme = await getThemeData();

    // Module 8: Shipping
    analysis.data.shipping = await getShippingZones();

    // Module 9: Discounts
    analysis.data.discounts = await getDiscountCodes();

    // ========================================================================
    // SAVE RESULTS
    // ========================================================================

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/tmp/forensic_flywheel_analysis_${timestamp}.json`;

    fs.writeFileSync(filename, JSON.stringify(analysis, null, 2));

    console.log('\n' + '═'.repeat(80));
    console.log('✅ ANALYSE FORENSIQUE COMPLÈTE - TERMINÉE');
    console.log('═'.repeat(80));
    console.log(`📄 Rapport JSON: ${filename}`);
    console.log('═'.repeat(80));

    // ========================================================================
    // EXECUTIVE SUMMARY
    // ========================================================================

    console.log('\n📊 EXECUTIVE SUMMARY (100% FACTUEL)\n');
    console.log('─'.repeat(80));
    console.log(`🏪 STORE: ${analysis.data.storeMetrics.shop.name || 'N/A'}`);
    console.log(`📧 Email: ${analysis.data.storeMetrics.shop.email || 'N/A'}`);
    console.log(`💰 Currency: ${analysis.data.storeMetrics.shop.currency || 'N/A'}`);
    console.log(`🌍 Timezone: ${analysis.data.storeMetrics.shop.timezone || 'N/A'}`);
    console.log('─'.repeat(80));

    console.log('\n📦 CATALOG:');
    console.log(`   Products: ${analysis.data.products.total} (${analysis.data.products.active} active, ${analysis.data.products.draft} draft)`);
    console.log(`   Variants: ${analysis.data.products.totalVariants}`);
    console.log(`   Collections: ${analysis.data.collections.total} (${analysis.data.collections.custom.total} custom, ${analysis.data.collections.smart.total} smart)`);
    console.log(`   Product Types: ${Object.keys(analysis.data.products.productTypes).length}`);

    console.log('\n💼 BUSINESS:');
    console.log(`   Orders (all-time): ${analysis.data.orders.total}`);
    console.log(`   Customers: ${analysis.data.customers.total}`);
    console.log(`   Revenue: ${analysis.data.orders.details.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0).toFixed(2)} ${analysis.data.storeMetrics.shop.currency || 'USD'}`);

    console.log('\n🤖 AUTOMATIONS:');
    console.log(`   Shopify Flow: ${analysis.data.automations.shopifyFlow.length} workflows`);
    console.log(`   Shopify Email: ${analysis.data.automations.shopifyEmail.total} campaigns`);
    console.log(`   ScriptTags: ${analysis.data.automations.scriptTags.total}`);
    console.log(`   Webhooks: ${analysis.data.automations.webhooks.total}`);

    console.log('\n📱 APPS & INTEGRATIONS:');
    console.log(`   Metafield Definitions: ${analysis.data.apps.totalDefinitions}`);
    console.log(`   App Namespaces: ${analysis.data.apps.appNamespaces.length}`);
    console.log(`   Namespaces: ${analysis.data.apps.appNamespaces.join(', ')}`);

    console.log('\n🎨 THEME:');
    console.log(`   Active Theme: ${analysis.data.theme.mainTheme?.name || 'N/A'}`);
    console.log(`   Theme ID: ${analysis.data.theme.mainTheme?.id || 'N/A'}`);
    console.log(`   Total Assets: ${analysis.data.theme.totalAssets}`);
    console.log(`   Liquid Files: ${analysis.data.theme.assetTypes?.liquid || 0}`);

    console.log('\n🚚 SHIPPING:');
    console.log(`   Ships to Countries: ${analysis.data.shipping.shipsToCountries.length}`);
    console.log(`   Delivery Profiles: ${analysis.data.shipping.deliveryProfiles.length}`);

    console.log('\n💰 DISCOUNTS:');
    console.log(`   Price Rules: ${analysis.data.discounts.priceRules}`);
    console.log(`   Discount Codes: ${analysis.data.discounts.discountCodes}`);

    console.log('\n' + '═'.repeat(80));
    console.log(`✅ Rapport complet sauvegardé: ${filename}`);
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR during analysis:', error);
    process.exit(1);
  }
}

// ============================================================================
// RUN
// ============================================================================

runForensicAnalysis().catch(console.error);
