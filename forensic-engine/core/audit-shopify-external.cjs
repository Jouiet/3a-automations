#!/usr/bin/env node

/**
 * 🔬 AUDIT SHOPIFY STORE - JO-AAA
 *
 * Script d'audit réutilisable pour tout client Shopify.
 * Extraction 100% factuelle via APIs.
 *
 * Usage:
 *   node scripts/audit-shopify-store.cjs
 *   node scripts/audit-shopify-store.cjs --store mystore.myshopify.com --token shpat_xxx
 *
 * Configuration:
 *   Via .env:
 *     SHOPIFY_STORE_DOMAIN=mystore.myshopify.com
 *     SHOPIFY_ACCESS_TOKEN=shpat_xxx
 *
 *   Via arguments:
 *     --store, -s : Domaine Shopify
 *     --token, -t : Access token
 *     --output, -o : Dossier de sortie (défaut: ./outputs)
 *
 * Date: 2025-12-17
 * Version: 2.0 (Refactoré pour multi-client)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Charger .env depuis la racine du projet
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// ============================================================================
// PARSE ARGUMENTS
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    store: process.env.SHOPIFY_STORE_DOMAIN || '',
    token: process.env.SHOPIFY_ACCESS_TOKEN || '',
    output: process.env.OUTPUT_DIR || path.join(__dirname, '..', 'outputs'),
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--store':
      case '-s':
        config.store = args[++i];
        break;
      case '--token':
      case '-t':
        config.token = args[++i];
        break;
      case '--output':
      case '-o':
        config.output = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🔬 AUDIT SHOPIFY STORE - JO-AAA

Usage:
  node scripts/audit-shopify-store.cjs [options]

Options:
  --store, -s   Domaine Shopify (ex: mystore.myshopify.com)
  --token, -t   Access token Shopify (shpat_xxx)
  --output, -o  Dossier de sortie (défaut: ./outputs)
  --help, -h    Afficher cette aide

Configuration .env:
  SHOPIFY_STORE_DOMAIN=mystore.myshopify.com
  SHOPIFY_ACCESS_TOKEN=shpat_xxx

Exemples:
  node scripts/audit-shopify-store.cjs
  node scripts/audit-shopify-store.cjs --store demo.myshopify.com --token shpat_xxx
  `);
}

function validateConfig(config) {
  const errors = [];

  if (!config.store) {
    errors.push('SHOPIFY_STORE_DOMAIN non défini (utilisez --store ou .env)');
  }
  if (!config.token) {
    errors.push('SHOPIFY_ACCESS_TOKEN non défini (utilisez --token ou .env)');
  }

  if (errors.length > 0) {
    console.error('\n❌ ERREURS DE CONFIGURATION:\n');
    errors.forEach(e => console.error(`   • ${e}`));
    console.error('\nUtilisez --help pour plus d\'informations.\n');
    process.exit(1);
  }

  return true;
}

// ============================================================================
// SHOPIFY API HELPER
// ============================================================================

class ShopifyClient {
  constructor(store, token, apiVersion) {
    this.store = store;
    this.token = token;
    this.apiVersion = apiVersion;
  }

  request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.store,
        path: `/admin/api/${this.apiVersion}${path}`,
        method,
        headers: {
          'X-Shopify-Access-Token': this.token,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              resolve({ error: true, status: res.statusCode, data: parsed });
            } else {
              resolve(parsed);
            }
          } catch (e) {
            resolve({ error: true, raw: data, message: 'JSON parse failed' });
          }
        });
      });

      req.on('error', (e) => resolve({ error: true, message: e.message }));
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  graphql(query) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.store,
        path: `/admin/api/${this.apiVersion}/graphql.json`,
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': this.token,
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
            resolve({ error: true, raw: data });
          }
        });
      });

      req.on('error', (e) => resolve({ error: true, message: e.message }));
      req.write(JSON.stringify({ query }));
      req.end();
    });
  }
}

// ============================================================================
// DATA EXTRACTION MODULES
// ============================================================================

async function getStoreMetrics(client) {
  console.log('  📊 Store metrics...');
  const [shop, products, orders, customers] = await Promise.all([
    client.request('/shop.json'),
    client.request('/products/count.json'),
    client.request('/orders/count.json'),
    client.request('/customers/count.json')
  ]);

  return {
    shop: shop.shop || {},
    productCount: products.count || 0,
    orderCount: orders.count || 0,
    customerCount: customers.count || 0
  };
}

async function getProducts(client) {
  console.log('  📦 Products...');
  const products = await client.request('/products.json?limit=250&status=any');
  const productList = products.products || [];

  const productTypes = {};
  let totalVariants = 0;
  let active = 0;
  let draft = 0;
  let archived = 0;

  productList.forEach(p => {
    totalVariants += (p.variants || []).length;
    productTypes[p.product_type || 'Uncategorized'] = (productTypes[p.product_type || 'Uncategorized'] || 0) + 1;

    if (p.status === 'active') active++;
    else if (p.status === 'draft') draft++;
    else if (p.status === 'archived') archived++;
  });

  return {
    total: productList.length,
    active,
    draft,
    archived,
    totalVariants,
    productTypes
  };
}

async function getCollections(client) {
  console.log('  📁 Collections...');
  const [custom, smart] = await Promise.all([
    client.request('/custom_collections.json?limit=250'),
    client.request('/smart_collections.json?limit=250')
  ]);

  return {
    total: (custom.custom_collections?.length || 0) + (smart.smart_collections?.length || 0),
    custom: { total: custom.custom_collections?.length || 0 },
    smart: { total: smart.smart_collections?.length || 0 }
  };
}

async function getOrders(client) {
  console.log('  🛒 Orders...');
  const count = await client.request('/orders/count.json?status=any');
  const recent = await client.request('/orders.json?limit=50&status=any');

  const orders = recent.orders || [];
  let totalRevenue = 0;
  orders.forEach(o => {
    totalRevenue += parseFloat(o.total_price || 0);
  });

  return {
    total: count.count || 0,
    recentCount: orders.length,
    recentRevenue: totalRevenue.toFixed(2)
  };
}

async function getCustomers(client) {
  console.log('  👥 Customers...');
  const count = await client.request('/customers/count.json');

  return {
    total: count.count || 0
  };
}

async function getWebhooks(client) {
  console.log('  🔗 Webhooks...');
  const webhooks = await client.request('/webhooks.json');

  return {
    total: webhooks.webhooks?.length || 0,
    webhooks: (webhooks.webhooks || []).map(w => ({
      topic: w.topic,
      address: w.address,
      format: w.format
    }))
  };
}

async function getTheme(client) {
  console.log('  🎨 Theme...');
  const themes = await client.request('/themes.json');
  const mainTheme = (themes.themes || []).find(t => t.role === 'main');

  return {
    mainTheme: mainTheme ? {
      id: mainTheme.id,
      name: mainTheme.name,
      role: mainTheme.role
    } : null,
    totalThemes: themes.themes?.length || 0
  };
}

async function getShippingZones(client) {
  console.log('  🚚 Shipping...');
  const zones = await client.request('/shipping_zones.json');

  const countries = new Set();
  (zones.shipping_zones || []).forEach(zone => {
    (zone.countries || []).forEach(c => countries.add(c.name));
  });

  return {
    totalZones: zones.shipping_zones?.length || 0,
    countries: Array.from(countries)
  };
}

async function getDiscounts(client) {
  console.log('  💰 Discounts...');
  const priceRules = await client.request('/price_rules.json?limit=250');

  return {
    priceRules: priceRules.price_rules?.length || 0
  };
}

async function getMarketingEvents(client) {
  console.log('  📣 Marketing events...');
  const events = await client.request('/marketing_events.json?limit=50');

  return {
    total: events.marketing_events?.length || 0
  };
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

async function runAudit(config) {
  console.log('\n' + '═'.repeat(70));
  console.log('🔬 AUDIT SHOPIFY STORE - JO-AAA');
  console.log('═'.repeat(70));
  console.log(`\n📍 Store: ${config.store}`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('─'.repeat(70));

  const client = new ShopifyClient(config.store, config.token, config.apiVersion);

  const analysis = {
    metadata: {
      store: config.store,
      analyzedAt: new Date().toISOString(),
      apiVersion: config.apiVersion,
      scriptVersion: '2.0'
    },
    data: {}
  };

  console.log('\n📥 EXTRACTION DES DONNÉES:\n');

  try {
    // Test connection first
    console.log('  🔐 Testing connection...');
    const shopTest = await client.request('/shop.json');
    if (shopTest.error) {
      console.error('\n❌ ERREUR DE CONNEXION:');
      console.error('   Vérifiez votre token et domaine Shopify.');
      console.error(`   Détails: ${JSON.stringify(shopTest)}`);
      process.exit(1);
    }

    // Extract all data
    analysis.data.storeMetrics = await getStoreMetrics(client);
    analysis.data.products = await getProducts(client);
    analysis.data.collections = await getCollections(client);
    analysis.data.orders = await getOrders(client);
    analysis.data.customers = await getCustomers(client);
    analysis.data.webhooks = await getWebhooks(client);
    analysis.data.theme = await getTheme(client);
    analysis.data.shipping = await getShippingZones(client);
    analysis.data.discounts = await getDiscounts(client);
    analysis.data.marketing = await getMarketingEvents(client);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const storeName = config.store.replace('.myshopify.com', '');
    const filename = `audit_${storeName}_${timestamp}.json`;
    const filepath = path.join(config.output, filename);

    // Ensure output directory exists
    if (!fs.existsSync(config.output)) {
      fs.mkdirSync(config.output, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));

    // Print summary
    printSummary(analysis, filepath);

    return { success: true, filepath, analysis };

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    return { success: false, error: error.message };
  }
}

function printSummary(analysis, filepath) {
  const d = analysis.data;
  const shop = d.storeMetrics.shop;

  console.log('\n' + '═'.repeat(70));
  console.log('📊 RÉSUMÉ DE L\'AUDIT');
  console.log('═'.repeat(70));

  console.log(`\n🏪 BOUTIQUE: ${shop.name || 'N/A'}`);
  console.log(`   Email: ${shop.email || 'N/A'}`);
  console.log(`   Devise: ${shop.currency || 'N/A'}`);
  console.log(`   Timezone: ${shop.timezone || 'N/A'}`);
  console.log(`   Plan: ${shop.plan_name || 'N/A'}`);

  console.log(`\n📦 CATALOGUE:`);
  console.log(`   Produits: ${d.products.total} (${d.products.active} actifs, ${d.products.draft} brouillons)`);
  console.log(`   Variantes: ${d.products.totalVariants}`);
  console.log(`   Collections: ${d.collections.total}`);
  console.log(`   Types produits: ${Object.keys(d.products.productTypes).length}`);

  console.log(`\n💼 BUSINESS:`);
  console.log(`   Commandes (total): ${d.orders.total}`);
  console.log(`   Clients: ${d.customers.total}`);
  console.log(`   Revenue récent (50 dernières): ${d.orders.recentRevenue} ${shop.currency || 'USD'}`);

  console.log(`\n🔗 INTÉGRATIONS:`);
  console.log(`   Webhooks: ${d.webhooks.total}`);
  console.log(`   Events marketing: ${d.marketing.total}`);

  console.log(`\n🎨 THEME:`);
  console.log(`   Theme actif: ${d.theme.mainTheme?.name || 'N/A'}`);

  console.log(`\n🚚 SHIPPING:`);
  console.log(`   Zones: ${d.shipping.totalZones}`);
  console.log(`   Pays: ${d.shipping.countries.length}`);

  console.log(`\n💰 DISCOUNTS:`);
  console.log(`   Price rules: ${d.discounts.priceRules}`);

  // Quick wins identification
  console.log('\n' + '═'.repeat(70));
  console.log('💡 QUICK WINS POTENTIELS');
  console.log('═'.repeat(70));

  const quickWins = [];

  if (d.products.draft > 0) {
    quickWins.push(`${d.products.draft} produits en brouillon à publier ou supprimer`);
  }
  if (d.webhooks.total === 0) {
    quickWins.push('Aucun webhook configuré - opportunité d\'automation');
  }
  if (d.marketing.total === 0) {
    quickWins.push('Aucun event marketing - opportunité email/SMS');
  }
  if (d.discounts.priceRules === 0) {
    quickWins.push('Aucune promotion active - opportunité conversion');
  }

  if (quickWins.length > 0) {
    quickWins.forEach((win, i) => console.log(`   ${i + 1}. ${win}`));
  } else {
    console.log('   Aucun quick win évident détecté.');
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`✅ Rapport complet: ${filepath}`);
  console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// RUN
// ============================================================================

const config = parseArgs();
validateConfig(config);
runAudit(config).catch(console.error);
