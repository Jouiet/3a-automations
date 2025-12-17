// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * Test de connexion à l'API Shopify Admin
 * Vérifie que les credentials fonctionnent
 */

import https from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger le .env
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');

const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) {
    config[match[1]] = match[2];
  }
});

console.log('='.repeat(70));
console.log('TEST DE CONNEXION - Shopify Admin API');
console.log('='.repeat(70));
console.log('');
console.log('Configuration:');
console.log('  Store URL:', config.SHOPIFY_STORE_URL);
console.log('  API Version:', config.SHOPIFY_API_VERSION);
console.log('  Admin Token:', config.SHOPIFY_ADMIN_API_TOKEN?.substring(0, 15) + '...');
console.log('');
console.log('Test en cours...');
console.log('');

const options = {
  hostname: config.SHOPIFY_STORE_URL,
  path: `/admin/api/${config.SHOPIFY_API_VERSION}/shop.json`,
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': config.SHOPIFY_ADMIN_API_TOKEN,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('');

    if (res.statusCode === 200) {
      const shop = JSON.parse(data).shop;
      console.log('✅ CONNEXION REUSSIE!');
      console.log('');
      console.log('Informations du store:');
      console.log('  Nom:', shop.name);
      console.log('  Email:', shop.email);
      console.log('  Domaine:', shop.domain);
      console.log('  Domaine principal:', shop.myshopify_domain);
      console.log('  Plan:', shop.plan_name);
      console.log('  Pays:', shop.country_name);
      console.log('  Devise:', shop.currency);
      console.log('  Timezone:', shop.timezone);
      console.log('');
      console.log('✅ Les credentials API sont VALIDES et FONCTIONNELS');
      console.log('');
    } else {
      console.log('❌ ERREUR DE CONNEXION');
      console.log('');
      console.log('Reponse:', data);
      console.log('');
      console.log('Verifiez que:');
      console.log('  1. Le token Admin API est correct');
      console.log('  2. L\'URL du store est correcte');
      console.log('  3. L\'app a les permissions necessaires');
    }

    console.log('='.repeat(70));
  });
});

req.on('error', (error) => {
  console.log('❌ ERREUR DE CONNEXION');
  console.log('');
  console.log('Erreur:', error.message);
  console.log('');
  console.log('Verifiez:');
  console.log('  1. Votre connexion Internet');
  console.log('  2. L\'URL du store: ' + config.SHOPIFY_STORE_URL);
  console.log('');
  console.log('='.repeat(70));
});

req.end();
