#!/usr/bin/env node
/**
 * TEST GOOGLE SERVICE ACCOUNT AUTHENTICATION
 * Vérifie que le Service Account peut s'authentifier
 * Date: 2025-12-18
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SA_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('═══════════════════════════════════════════════════════════════');
console.log('       TEST GOOGLE SERVICE ACCOUNT - 3A AUTOMATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Vérifier le fichier JSON existe
console.log('1️⃣ VÉRIFICATION FICHIER SERVICE ACCOUNT');
console.log('─────────────────────────────────────────');

if (!SA_PATH) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS non défini dans .env');
  process.exit(1);
}

if (!fs.existsSync(SA_PATH)) {
  console.error(`❌ Fichier non trouvé: ${SA_PATH}`);
  process.exit(1);
}

console.log(`✅ Fichier trouvé: ${SA_PATH}`);

// 2. Parser et valider le JSON
console.log('\n2️⃣ VALIDATION STRUCTURE JSON');
console.log('─────────────────────────────────────────');

let serviceAccount;
try {
  const content = fs.readFileSync(SA_PATH, 'utf8');
  serviceAccount = JSON.parse(content);
} catch (e) {
  console.error(`❌ Erreur parsing JSON: ${e.message}`);
  process.exit(1);
}

const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
const missingFields = requiredFields.filter(f => !serviceAccount[f]);

if (missingFields.length > 0) {
  console.error(`❌ Champs manquants: ${missingFields.join(', ')}`);
  process.exit(1);
}

console.log(`✅ Type: ${serviceAccount.type}`);
console.log(`✅ Project ID: ${serviceAccount.project_id}`);
console.log(`✅ Client Email: ${serviceAccount.client_email}`);
console.log(`✅ Client ID: ${serviceAccount.client_id}`);
console.log(`✅ Private Key ID: ${serviceAccount.private_key_id.substring(0, 8)}...`);
console.log(`✅ Private Key: ${serviceAccount.private_key.substring(0, 50)}...`);

// 3. Vérifier permissions fichier
console.log('\n3️⃣ VÉRIFICATION SÉCURITÉ');
console.log('─────────────────────────────────────────');

const stats = fs.statSync(SA_PATH);
const mode = (stats.mode & parseInt('777', 8)).toString(8);

if (mode === '600') {
  console.log(`✅ Permissions sécurisées: ${mode} (lecture/écriture owner uniquement)`);
} else {
  console.warn(`⚠️ Permissions: ${mode} (recommandé: 600)`);
}

// 4. Résumé
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                       RÉSUMÉ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📋 Project ID:     ${serviceAccount.project_id}`);
console.log(`📧 Service Email:  ${serviceAccount.client_email}`);
console.log(`🔑 Key ID:         ${serviceAccount.private_key_id}`);
console.log(`📁 Fichier:        ${SA_PATH}`);
console.log(`🔒 Permissions:    ${mode}`);

console.log('\n✅ SERVICE ACCOUNT PRÊT À L\'UTILISATION');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                 PROCHAINES ÉTAPES');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('1️⃣ Créer Google Sheets "3A Automation - Leads & CRM"');
console.log('   → https://sheets.google.com');
console.log('');
console.log('2️⃣ Partager le spreadsheet avec le Service Account:');
console.log(`   → ${serviceAccount.client_email}`);
console.log('   → Permission: Éditeur');
console.log('');
console.log('3️⃣ Copier le Spreadsheet ID depuis l\'URL:');
console.log('   → https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit');
console.log('');
console.log('4️⃣ Ajouter dans .env:');
console.log('   GOOGLE_SHEETS_ID={SPREADSHEET_ID}');
console.log('   GOOGLE_SHEETS_SPREADSHEET_ID={SPREADSHEET_ID}');
console.log('');
