// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * Script pour trouver l'URL du store Shopify à partir du token Admin API
 *
 * PROBLÈME: Le token Admin API seul ne permet PAS de retrouver l'URL du store
 * SOLUTION: Il faut chercher dans l'historique de création du token
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('DIAGNOSTIC: Connexion GitHub <-> Shopify');
console.log('='.repeat(60));
console.log('');

// Charger le .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('CREDENTIALS ACTUELS:');
console.log('- Admin API Token: PRESENT (' + envContent.match(/SHOPIFY_ADMIN_API_TOKEN=(.+)/)?.[1]?.substring(0, 15) + '...)');
console.log('- API Key: PRESENT');
console.log('- API Secret: PRESENT');
console.log('- Store URL: ' + (envContent.match(/SHOPIFY_STORE_URL=(.+)/)?.[1] || 'MANQUANT ❌'));
console.log('');

console.log('PROBLEME IDENTIFIE:');
console.log('='.repeat(60));
console.log('');
console.log('Le token Admin API a ete cree depuis un store Shopify specifique.');
console.log('');
console.log('POUR TROUVER L\'URL DU STORE:');
console.log('');
console.log('1. Connectez-vous au Shopify Admin ou vous avez cree le token');
console.log('2. L\'URL dans votre navigateur sera: https://XXXX.myshopify.com/admin');
console.log('3. XXXX.myshopify.com est votre SHOPIFY_STORE_URL');
console.log('');
console.log('OU BIEN:');
console.log('');
console.log('Allez dans: Apps > Develop apps > [Votre App] > API credentials');
console.log('L\'URL de la page contient votre store: admin.shopify.com/store/XXXX');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('QUESTION: Quelle est l\'URL de votre store Shopify?');
console.log('Format attendu: mon-store.myshopify.com');
console.log('');
