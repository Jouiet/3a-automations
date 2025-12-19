#!/usr/bin/env node
/**
 * TEST GOOGLE SHEETS ACCESS
 * Vérifie que le Service Account peut accéder au spreadsheet
 * Date: 2025-12-18
 */

const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SA_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

console.log('═══════════════════════════════════════════════════════════════');
console.log('       TEST GOOGLE SHEETS - 3A AUTOMATION');
console.log('═══════════════════════════════════════════════════════════════\n');

async function testGoogleSheets() {
  // 1. Vérification config
  console.log('1️⃣ VÉRIFICATION CONFIGURATION');
  console.log('─────────────────────────────────────────');

  if (!SA_PATH) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS non défini');
    process.exit(1);
  }
  console.log(`✅ Service Account: ${SA_PATH}`);

  if (!SPREADSHEET_ID) {
    console.error('❌ GOOGLE_SHEETS_ID non défini');
    process.exit(1);
  }
  console.log(`✅ Spreadsheet ID: ${SPREADSHEET_ID}`);

  // 2. Authentification
  console.log('\n2️⃣ AUTHENTIFICATION GOOGLE');
  console.log('─────────────────────────────────────────');

  let auth;
  try {
    auth = new google.auth.GoogleAuth({
      keyFile: SA_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    console.log('✅ Auth client créé');
  } catch (e) {
    console.error(`❌ Erreur auth: ${e.message}`);
    process.exit(1);
  }

  // 3. Test accès spreadsheet
  console.log('\n3️⃣ TEST ACCÈS SPREADSHEET');
  console.log('─────────────────────────────────────────');

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const spreadsheet = response.data;
    console.log(`✅ Titre: ${spreadsheet.properties.title}`);
    console.log(`✅ Locale: ${spreadsheet.properties.locale}`);
    console.log(`✅ Timezone: ${spreadsheet.properties.timeZone}`);
    console.log(`✅ Sheets: ${spreadsheet.sheets.length}`);

    spreadsheet.sheets.forEach((sheet, i) => {
      console.log(`   ${i + 1}. ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} rows)`);
    });

  } catch (e) {
    if (e.code === 403) {
      console.error('❌ ACCÈS REFUSÉ - Le spreadsheet n\'est pas partagé avec le Service Account');
      console.error(`\n📋 SOLUTION: Partager le spreadsheet avec:`);
      console.error(`   id-a-automation-service@a-automation-agency.iam.gserviceaccount.com`);
      console.error(`   Permission: Éditeur`);
    } else if (e.code === 404) {
      console.error('❌ SPREADSHEET NON TROUVÉ - Vérifiez l\'ID');
    } else {
      console.error(`❌ Erreur: ${e.message}`);
    }
    process.exit(1);
  }

  // 4. Test écriture (optionnel)
  console.log('\n4️⃣ TEST ÉCRITURE');
  console.log('─────────────────────────────────────────');

  try {
    const testValue = `Test 3A Automation - ${new Date().toISOString()}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[testValue]],
      },
    });
    console.log(`✅ Écriture réussie: "${testValue}"`);
  } catch (e) {
    console.error(`⚠️ Écriture échouée: ${e.message}`);
    console.error('   (Le SA a peut-être seulement accès en lecture)');
  }

  // 5. Résumé
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                       RÉSUMÉ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ GOOGLE SHEETS CONFIGURÉ ET FONCTIONNEL');
  console.log(`📊 URL: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

testGoogleSheets().catch(e => {
  console.error('❌ Erreur fatale:', e.message);
  process.exit(1);
});
