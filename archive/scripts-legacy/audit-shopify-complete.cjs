#!/usr/bin/env node
/**
 * audit-shopify-complete.cjs
 * Audit complet d'une boutique Shopify - Version production
 * 
 * Usage: node scripts/audit-shopify-complete.cjs
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const https = require('https');
const fs = require('fs');
const path = require('path');

const store = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';
const outputDir = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'outputs');

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('       AUDIT SHOPIFY COMPLET - 3A Automation                   ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

if (!store || !token) {
  console.error('❌ SHOPIFY_STORE_DOMAIN et SHOPIFY_ACCESS_TOKEN requis dans .env');
  process.exit(1);
}

// Helper pour requêtes Shopify
function shopifyRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: store,
      path: `/admin/api/${apiVersion}${endpoint}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runAudit() {
  const auditData = {
    timestamp: new Date().toISOString(),
    store: store,
    sections: {}
  };

  console.log(`📊 Audit de: ${store}`);
  console.log('');

  try {
    // 1. Info boutique
    console.log('1/6 - Récupération infos boutique...');
    const shopData = await shopifyRequest('/shop.json');
    auditData.sections.shop = shopData.shop;
    console.log(`   ✅ ${shopData.shop.name} (${shopData.shop.plan_name})`);

    // 2. Produits
    console.log('2/6 - Analyse produits...');
    const productsData = await shopifyRequest('/products.json?limit=250');
    const products = productsData.products;
    
    const productStats = {
      total: products.length,
      published: products.filter(p => p.status === 'active').length,
      draft: products.filter(p => p.status === 'draft').length,
      withImages: products.filter(p => p.images && p.images.length > 0).length,
      withoutImages: products.filter(p => !p.images || p.images.length === 0).length,
      avgPrice: 0,
      priceRange: { min: 0, max: 0 }
    };
    
    const prices = products.flatMap(p => p.variants.map(v => parseFloat(v.price)));
    if (prices.length > 0) {
      productStats.avgPrice = (prices.reduce((a,b) => a+b, 0) / prices.length).toFixed(2);
      productStats.priceRange.min = Math.min(...prices).toFixed(2);
      productStats.priceRange.max = Math.max(...prices).toFixed(2);
    }
    
    // SEO Analysis
    const seoIssues = {
      missingAltText: 0,
      missingDescription: 0,
      shortTitle: 0
    };
    
    products.forEach(p => {
      if (!p.body_html || p.body_html.length < 50) seoIssues.missingDescription++;
      if (p.title.length < 10) seoIssues.shortTitle++;
      p.images.forEach(img => {
        if (!img.alt || img.alt.length < 5) seoIssues.missingAltText++;
      });
    });
    
    productStats.seoIssues = seoIssues;
    auditData.sections.products = productStats;
    console.log(`   ✅ ${products.length} produits (${productStats.published} actifs)`);

    // 3. Orders (derniers 30 jours)
    console.log('3/6 - Analyse commandes...');
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString();
    const ordersData = await shopifyRequest(`/orders.json?status=any&created_at_min=${thirtyDaysAgo}&limit=250`);
    const orders = ordersData.orders;
    
    const orderStats = {
      last30Days: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0).toFixed(2),
      avgOrderValue: 0,
      fulfillmentRate: 0,
      byStatus: {}
    };
    
    if (orders.length > 0) {
      orderStats.avgOrderValue = (orderStats.totalRevenue / orders.length).toFixed(2);
      const fulfilled = orders.filter(o => o.fulfillment_status === 'fulfilled').length;
      orderStats.fulfillmentRate = ((fulfilled / orders.length) * 100).toFixed(1);
    }
    
    orders.forEach(o => {
      const status = o.financial_status || 'unknown';
      orderStats.byStatus[status] = (orderStats.byStatus[status] || 0) + 1;
    });
    
    auditData.sections.orders = orderStats;
    console.log(`   ✅ ${orders.length} commandes ($${orderStats.totalRevenue})`);

    // 4. Clients
    console.log('4/6 - Analyse clients...');
    const customersData = await shopifyRequest('/customers.json?limit=250');
    const customers = customersData.customers;
    
    const customerStats = {
      total: customers.length,
      acceptsMarketing: customers.filter(c => c.accepts_marketing).length,
      withOrders: customers.filter(c => c.orders_count > 0).length,
      returningCustomers: customers.filter(c => c.orders_count > 1).length
    };
    
    auditData.sections.customers = customerStats;
    console.log(`   ✅ ${customers.length} clients (${customerStats.acceptsMarketing} marketing opt-in)`);

    // 5. Collections
    console.log('5/6 - Analyse collections...');
    const collectionsData = await shopifyRequest('/custom_collections.json?limit=250');
    const smartCollectionsData = await shopifyRequest('/smart_collections.json?limit=250');
    
    const collectionStats = {
      custom: collectionsData.custom_collections.length,
      smart: smartCollectionsData.smart_collections.length,
      total: collectionsData.custom_collections.length + smartCollectionsData.smart_collections.length
    };
    
    auditData.sections.collections = collectionStats;
    console.log(`   ✅ ${collectionStats.total} collections`);

    // 6. Inventory
    console.log('6/6 - Analyse inventaire...');
    const locationsData = await shopifyRequest('/locations.json');
    
    const inventoryStats = {
      locations: locationsData.locations.length,
      lowStock: 0,
      outOfStock: 0
    };
    
    // Compter produits en rupture
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.inventory_quantity === 0) inventoryStats.outOfStock++;
        else if (v.inventory_quantity < 5) inventoryStats.lowStock++;
      });
    });
    
    auditData.sections.inventory = inventoryStats;
    console.log(`   ✅ ${inventoryStats.outOfStock} variants en rupture`);

    // Générer rapport
    console.log('');
    console.log('📝 Génération du rapport...');
    
    // Générer recommandations
    const recommendations = [];
    
    if (seoIssues.missingAltText > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'SEO',
        issue: `${seoIssues.missingAltText} images sans alt text`,
        action: 'Ajouter alt text descriptif pour améliorer SEO images',
        impact: '+15-25% trafic organique images'
      });
    }
    
    if (seoIssues.missingDescription > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'SEO',
        issue: `${seoIssues.missingDescription} produits sans description complète`,
        action: 'Rédiger descriptions de 100+ mots avec mots-clés',
        impact: '+10-20% conversion'
      });
    }
    
    if (customerStats.acceptsMarketing / customerStats.total < 0.5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'EMAIL',
        issue: `Seulement ${((customerStats.acceptsMarketing / customerStats.total) * 100).toFixed(0)}% opt-in email`,
        action: 'Ajouter popup newsletter avec incentive (10% discount)',
        impact: '+20-40% liste email'
      });
    }
    
    if (inventoryStats.outOfStock > 5) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'INVENTORY',
        issue: `${inventoryStats.outOfStock} variants en rupture`,
        action: 'Configurer alertes stock bas et back-in-stock emails',
        impact: 'Récupérer ventes perdues'
      });
    }
    
    auditData.recommendations = recommendations;

    // Sauvegarder JSON
    const jsonFilename = `audit-${store.replace('.myshopify.com', '')}-${new Date().toISOString().split('T')[0]}.json`;
    const jsonPath = path.join(outputDir, jsonFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(auditData, null, 2));
    console.log(`   ✅ JSON: ${jsonPath}`);

    // Générer rapport Markdown
    const mdReport = generateMarkdownReport(auditData);
    const mdFilename = `audit-${store.replace('.myshopify.com', '')}-${new Date().toISOString().split('T')[0]}.md`;
    const mdPath = path.join(outputDir, mdFilename);
    fs.writeFileSync(mdPath, mdReport);
    console.log(`   ✅ Markdown: ${mdPath}`);

    // Afficher résumé
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                      RÉSUMÉ AUDIT                             ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`   Boutique: ${auditData.sections.shop.name}`);
    console.log(`   Produits: ${productStats.total} (${productStats.published} actifs)`);
    console.log(`   Commandes 30j: ${orderStats.last30Days} ($${orderStats.totalRevenue})`);
    console.log(`   AOV: $${orderStats.avgOrderValue}`);
    console.log(`   Clients: ${customerStats.total} (${customerStats.acceptsMarketing} opt-in)`);
    console.log('');
    console.log(`   🔴 Recommandations HIGH: ${recommendations.filter(r => r.priority === 'HIGH').length}`);
    console.log(`   🟡 Recommandations MEDIUM: ${recommendations.filter(r => r.priority === 'MEDIUM').length}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ AUDIT TERMINÉ AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

function generateMarkdownReport(data) {
  const shop = data.sections.shop;
  const products = data.sections.products;
  const orders = data.sections.orders;
  const customers = data.sections.customers;
  const recommendations = data.recommendations;

  return `# Audit E-commerce - ${shop.name}
## Généré par 3A Automation
### Date: ${new Date(data.timestamp).toLocaleDateString('fr-FR')}

---

## 1. Résumé Exécutif

| Métrique | Valeur |
|----------|--------|
| Boutique | ${shop.name} |
| Plan | ${shop.plan_name} |
| Devise | ${shop.currency} |
| Produits actifs | ${products.published} |
| Commandes (30j) | ${orders.last30Days} |
| Revenue (30j) | $${orders.totalRevenue} |
| AOV | $${orders.avgOrderValue} |

---

## 2. Analyse Produits

- **Total produits:** ${products.total}
- **Actifs:** ${products.published}
- **Brouillons:** ${products.draft}
- **Avec images:** ${products.withImages}
- **Sans images:** ${products.withoutImages}
- **Prix moyen:** $${products.avgPrice}
- **Range prix:** $${products.priceRange.min} - $${products.priceRange.max}

### Issues SEO
- Images sans alt text: ${products.seoIssues.missingAltText}
- Descriptions manquantes: ${products.seoIssues.missingDescription}
- Titres courts: ${products.seoIssues.shortTitle}

---

## 3. Analyse Commandes (30 derniers jours)

- **Nombre de commandes:** ${orders.last30Days}
- **Revenue total:** $${orders.totalRevenue}
- **Panier moyen (AOV):** $${orders.avgOrderValue}
- **Taux de fulfillment:** ${orders.fulfillmentRate}%

### Par statut
${Object.entries(orders.byStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

---

## 4. Analyse Clients

- **Total clients:** ${customers.total}
- **Opt-in marketing:** ${customers.acceptsMarketing} (${((customers.acceptsMarketing/customers.total)*100).toFixed(0)}%)
- **Clients avec commandes:** ${customers.withOrders}
- **Clients récurrents:** ${customers.returningCustomers}

---

## 5. Recommandations

${recommendations.map((r, i) => `
### ${i+1}. [${r.priority}] ${r.category}
- **Problème:** ${r.issue}
- **Action:** ${r.action}
- **Impact estimé:** ${r.impact}
`).join('\n')}

---

## 6. Prochaines Étapes

1. Corriger les issues SEO prioritaires (alt text, descriptions)
2. Mettre en place flows email Klaviyo (Welcome, Cart Abandonment)
3. Configurer alertes stock et back-in-stock
4. Optimiser taux opt-in email

---

*Rapport généré automatiquement par 3A Automation*
*Contact: contact@3a-automation.com*
`;
}

runAudit();
