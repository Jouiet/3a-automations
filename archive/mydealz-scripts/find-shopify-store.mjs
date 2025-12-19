// © 2025 MyDealz. All rights reserved.
// See LICENSE file for details.

#!/usr/bin/env node
/**
 * Script pour utiliser chrome-devtools-mcp afin de trouver l'URL du store Shopify
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('');
console.log('='.repeat(70));
console.log('RECHERCHE DU STORE SHOPIFY - Utilisation de chrome-devtools-mcp');
console.log('='.repeat(70));
console.log('');

console.log('ETAPE 1: Verification que chrome-devtools-mcp est disponible...');
console.log('');

try {
  // Vérifier que chrome-devtools-mcp est installé
  const { stdout } = await execAsync('claude mcp list');

  if (stdout.includes('chrome-devtools')) {
    console.log('✅ chrome-devtools-mcp est installe et connecte');
    console.log('');
  } else {
    console.log('❌ chrome-devtools-mcp n\'est pas disponible');
    process.exit(1);
  }
} catch (error) {
  console.error('Erreur lors de la verification:', error.message);
  process.exit(1);
}

console.log('ETAPE 2: Instructions pour trouver votre store URL');
console.log('');
console.log('METHODE 1: Via l\'Admin API Token');
console.log('-'.repeat(70));
console.log('1. Le token "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"');
console.log('   a ete cree depuis un store Shopify specifique');
console.log('');
console.log('2. Connectez-vous a l\'endroit ou vous avez cree ce token');
console.log('');
console.log('3. L\'URL dans votre navigateur sera:');
console.log('   https://admin.shopify.com/store/XXXXX');
console.log('   OU');
console.log('   https://VOTRE-STORE.myshopify.com/admin');
console.log('');

console.log('METHODE 2: Via l\'API Key');
console.log('-'.repeat(70));
console.log('1. L\'API Key "70e0ce1d73aa7b2c91e5b3e058352d94"');
console.log('   a ete cree depuis: Apps > Develop apps > [Votre App]');
console.log('');
console.log('2. Allez dans cette section de votre admin Shopify');
console.log('');
console.log('3. L\'URL de cette page contient votre store');
console.log('');

console.log('='.repeat(70));
console.log('');
console.log('ACTION REQUISE:');
console.log('');
console.log('Veuillez fournir l\'URL de votre store au format:');
console.log('  XXXXX.myshopify.com');
console.log('');
console.log('Une fois obtenue, je pourrai:');
console.log('  ✓ Connecter GitHub au store Shopify');
console.log('  ✓ Uploader le theme MyDealz');
console.log('  ✓ Configurer les metafields');
console.log('  ✓ Tester le theme');
console.log('');
console.log('='.repeat(70));
console.log('');
