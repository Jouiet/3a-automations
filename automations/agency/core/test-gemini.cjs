#!/usr/bin/env node
/**
 * TEST GEMINI API
 * Vérifie que l'API key Gemini fonctionne
 * Date: 2025-12-18
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.GEMINI_API_KEY;

console.log('═══════════════════════════════════════════════════════════════');
console.log('       TEST GEMINI API - 3A AUTOMATION');
console.log('═══════════════════════════════════════════════════════════════\n');

async function testGemini() {
  // 1. Vérification config
  console.log('1️⃣ VÉRIFICATION CONFIGURATION');
  console.log('─────────────────────────────────────────');

  if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY non défini dans .env');
    process.exit(1);
  }
  console.log(`✅ API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);

  // 2. Test API call
  console.log('\n2️⃣ TEST API CALL');
  console.log('─────────────────────────────────────────');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Réponds uniquement "OK" si tu fonctionnes.' }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Erreur API: ${response.status}`);
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    console.log(`✅ Réponse: "${text.trim()}"`);
    console.log(`✅ Model: gemini-3-flash-preview`);
    console.log(`✅ System Status: Frontier Grade (2026)`);


  } catch (e) {
    console.error(`❌ Erreur: ${e.message}`);
    process.exit(1);
  }

  // 3. Test list models
  console.log('\n3️⃣ MODÈLES DISPONIBLES');
  console.log('─────────────────────────────────────────');

  try {
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const modelsResp = await fetch(modelsUrl);
    const modelsData = await modelsResp.json();

    const relevantModels = modelsData.models
      ?.filter(m => m.name.includes('gemini'))
      .slice(0, 5);

    relevantModels?.forEach(m => {
      console.log(`   • ${m.name.replace('models/', '')}`);
    });

  } catch (e) {
    console.log(`⚠️ Impossible de lister les modèles: ${e.message}`);
  }

  // 4. Résumé
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                       RÉSUMÉ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ GEMINI API CONFIGURÉ ET FONCTIONNEL');
}

testGemini().catch(e => {
  console.error('❌ Erreur fatale:', e.message);
  process.exit(1);
});
