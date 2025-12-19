#!/usr/bin/env node
/**
 * test-env.cjs
 * Tester que le fichier .env est correctement configuré
 *
 * Usage: node scripts/test-env.cjs
 */

const path = require('path');
const fs = require('fs');

// Charger .env depuis la racine du projet
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('          JO-AAA - TEST CONFIGURATION ENVIRONNEMENT           ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Variables critiques (bloquantes si absentes)
const criticalVars = [
  { name: 'GOOGLE_APPLICATION_CREDENTIALS', desc: 'Google Service Account' },
  { name: 'SHOPIFY_STORE_DOMAIN', desc: 'Domaine Shopify client actif' },
  { name: 'SHOPIFY_ACCESS_TOKEN', desc: 'Token Shopify' },
];

// Variables importantes (fonctionnalité réduite si absentes)
const importantVars = [
  { name: 'KLAVIYO_API_KEY', desc: 'Clé API Klaviyo' },
  { name: 'GA4_PROPERTY_ID', desc: 'Property ID Google Analytics' },
];

// Variables optionnelles
const optionalVars = [
  { name: 'META_ACCESS_TOKEN', desc: 'Token Meta/Facebook' },
  { name: 'APIFY_TOKEN', desc: 'Token Apify' },
  { name: 'N8N_HOST', desc: 'URL n8n' },
  { name: 'OPENAI_API_KEY', desc: 'Clé OpenAI' },
  { name: 'ANTHROPIC_API_KEY', desc: 'Clé Anthropic' },
  { name: 'GEMINI_API_KEY', desc: 'Clé Gemini' },
];

let criticalCount = 0;
let importantCount = 0;
let optionalCount = 0;

// Test variables critiques
console.log('🔴 VARIABLES CRITIQUES (bloquantes):');
console.log('───────────────────────────────────────────────────────────────');
criticalVars.forEach(v => {
  const value = process.env[v.name];
  if (value && value.trim() !== '') {
    console.log(`  ✅ ${v.name}`);
    console.log(`     └── ${v.desc}: ${value.substring(0, 30)}...`);
    criticalCount++;
  } else {
    console.log(`  ❌ ${v.name}`);
    console.log(`     └── ${v.desc}: NON CONFIGURÉ`);
  }
});
console.log('');

// Test variables importantes
console.log('🟡 VARIABLES IMPORTANTES (fonctionnalité réduite):');
console.log('───────────────────────────────────────────────────────────────');
importantVars.forEach(v => {
  const value = process.env[v.name];
  if (value && value.trim() !== '') {
    console.log(`  ✅ ${v.name}`);
    console.log(`     └── ${v.desc}: ${value.substring(0, 30)}...`);
    importantCount++;
  } else {
    console.log(`  ⚠️  ${v.name}`);
    console.log(`     └── ${v.desc}: non configuré`);
  }
});
console.log('');

// Test variables optionnelles
console.log('🟢 VARIABLES OPTIONNELLES:');
console.log('───────────────────────────────────────────────────────────────');
optionalVars.forEach(v => {
  const value = process.env[v.name];
  if (value && value.trim() !== '') {
    console.log(`  ✅ ${v.name}`);
    optionalCount++;
  } else {
    console.log(`  ○  ${v.name} (${v.desc})`);
  }
});
console.log('');

// Test Google Service Account
console.log('═══════════════════════════════════════════════════════════════');
console.log('          TEST GOOGLE SERVICE ACCOUNT                          ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

const googlePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (googlePath) {
  if (fs.existsSync(googlePath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(googlePath, 'utf8'));
      console.log('✅ Fichier Google Service Account TROUVÉ');
      console.log(`   └── Type: ${sa.type}`);
      console.log(`   └── Project: ${sa.project_id}`);
      console.log(`   └── Client Email: ${sa.client_email}`);
      console.log(`   └── Private Key: ${sa.private_key ? '✓ Présente' : '✗ Absente'}`);
    } catch (e) {
      console.log('❌ Fichier Google Service Account INVALIDE');
      console.log(`   └── Erreur: ${e.message}`);
    }
  } else {
    console.log('❌ Fichier Google Service Account NON TROUVÉ');
    console.log(`   └── Chemin attendu: ${googlePath}`);
    console.log('');
    console.log('   Pour créer le fichier:');
    console.log('   1. Aller sur https://console.cloud.google.com');
    console.log('   2. IAM & Admin → Service Accounts');
    console.log('   3. Créer compte → Télécharger JSON');
    console.log('   4. Copier le fichier vers le chemin ci-dessus');
  }
} else {
  console.log('❌ GOOGLE_APPLICATION_CREDENTIALS non défini dans .env');
}
console.log('');

// Test dossier outputs
console.log('═══════════════════════════════════════════════════════════════');
console.log('          TEST DOSSIERS                                        ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

const outputDir = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'outputs');
if (fs.existsSync(outputDir)) {
  console.log(`✅ Dossier outputs existe: ${outputDir}`);
} else {
  console.log(`⚠️  Dossier outputs n'existe pas: ${outputDir}`);
  console.log('   Création...');
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('   ✅ Créé avec succès');
  } catch (e) {
    console.log(`   ❌ Erreur: ${e.message}`);
  }
}
console.log('');

// Résumé
console.log('═══════════════════════════════════════════════════════════════');
console.log('          RÉSUMÉ                                               ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`  Variables critiques:   ${criticalCount}/${criticalVars.length}`);
console.log(`  Variables importantes: ${importantCount}/${importantVars.length}`);
console.log(`  Variables optionnelles: ${optionalCount}/${optionalVars.length}`);
console.log('');

if (criticalCount === criticalVars.length) {
  console.log('  ✅ CONFIGURATION MINIMALE OK - Prêt pour les scripts de base');
} else {
  console.log('  ❌ CONFIGURATION INCOMPLÈTE - Compléter les variables critiques');
}
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
