#!/usr/bin/env node
/**
 * test-shopify-connection.cjs
 * Test direct de la connexion Shopify API
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const https = require('https');

const store = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('          TEST CONNEXION SHOPIFY API                           ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`Store: ${store}`);
console.log(`API Version: ${apiVersion}`);
console.log(`Token: ${token ? token.substring(0, 10) + '...' : 'MANQUANT'}`);
console.log('');

if (!store || !token) {
  console.log('❌ Credentials manquantes dans .env');
  process.exit(1);
}

// Test simple: récupérer infos boutique
const options = {
  hostname: store,
  path: `/admin/api/${apiVersion}/shop.json`,
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json'
  }
};

console.log('Connexion en cours...');
console.log('');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => data += chunk);
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const shop = JSON.parse(data).shop;
      console.log('✅ CONNEXION SHOPIFY RÉUSSIE!');
      console.log('');
      console.log('   Infos boutique:');
      console.log(`   └── Nom: ${shop.name}`);
      console.log(`   └── Email: ${shop.email}`);
      console.log(`   └── Domaine: ${shop.domain}`);
      console.log(`   └── Plan: ${shop.plan_name}`);
      console.log(`   └── Devise: ${shop.currency}`);
      console.log(`   └── Timezone: ${shop.timezone}`);
      console.log('');
    } else {
      console.log(`❌ ERREUR HTTP ${res.statusCode}`);
      console.log(`   └── ${data}`);
    }
    console.log('═══════════════════════════════════════════════════════════════');
  });
});

req.on('error', (e) => {
  console.log(`❌ ERREUR CONNEXION: ${e.message}`);
  console.log('═══════════════════════════════════════════════════════════════');
});

req.end();
