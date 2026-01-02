#!/usr/bin/env node
/**
 * TEST GOOGLE ANALYTICS 4 API ACCESS
 * Vérifie que le Service Account peut accéder à GA4
 * Date: 2025-12-18
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');
// Load .env from project root (3 levels up from agency/core/)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const SA_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('═══════════════════════════════════════════════════════════════');
console.log('       TEST GOOGLE ANALYTICS 4 - 3A AUTOMATION');
console.log('═══════════════════════════════════════════════════════════════\n');

async function testGA4() {
  // 1. Vérification config
  console.log('1️⃣ VÉRIFICATION CONFIGURATION');
  console.log('─────────────────────────────────────────');

  if (!PROPERTY_ID) {
    console.error('❌ GA4_PROPERTY_ID non défini dans .env');
    process.exit(1);
  }
  console.log(`✅ Property ID: ${PROPERTY_ID}`);

  if (!SA_PATH) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS non défini');
    process.exit(1);
  }
  console.log(`✅ Service Account: ${SA_PATH}`);

  // 2. Créer client GA4
  console.log('\n2️⃣ CONNEXION GA4 API');
  console.log('─────────────────────────────────────────');

  let client;
  try {
    client = new BetaAnalyticsDataClient({
      keyFilename: SA_PATH,
    });
    console.log('✅ Client GA4 créé');
  } catch (e) {
    console.error(`❌ Erreur création client: ${e.message}`);
    process.exit(1);
  }

  // 3. Test: Récupérer données des 7 derniers jours
  console.log('\n3️⃣ TEST REQUÊTE API (7 derniers jours)');
  console.log('─────────────────────────────────────────');

  try {
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
    });

    console.log('✅ Requête API réussie!\n');

    if (response.rows && response.rows.length > 0) {
      const row = response.rows[0];
      console.log('📊 MÉTRIQUES (7 derniers jours):');
      console.log(`   • Utilisateurs actifs: ${row.metricValues[0].value}`);
      console.log(`   • Sessions: ${row.metricValues[1].value}`);
      console.log(`   • Pages vues: ${row.metricValues[2].value}`);
    } else {
      console.log('📊 Aucune donnée (site nouveau ou pas de trafic)');
    }

  } catch (e) {
    if (e.code === 7) {
      console.error('❌ PERMISSION DENIED - Service Account n\'a pas accès');
      console.error('\n📋 SOLUTION:');
      console.error('   1. GA4 Admin → Property Access Management');
      console.error('   2. Ajouter: id-a-automation-service@a-automation-agency.iam.gserviceaccount.com');
      console.error('   3. Rôle: Lecteur');
    } else if (e.code === 5) {
      console.error('❌ NOT FOUND - Property ID invalide');
    } else {
      console.error(`❌ Erreur: ${e.message}`);
    }
    process.exit(1);
  }

  // 4. Résumé
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                       RÉSUMÉ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ GA4 API CONFIGURÉ ET FONCTIONNEL');
  console.log(`📊 Property: ${PROPERTY_ID}`);
  console.log(`🔗 Measurement ID: ${process.env.GA4_MEASUREMENT_ID || 'N/A'}`);
}

testGA4().catch(e => {
  console.error('❌ Erreur fatale:', e.message);
  process.exit(1);
});
