#!/usr/bin/env node
/**
 * test-klaviyo-connection.cjs
 * Test direct de la connexion Klaviyo API
 */

// Chercher .env à la racine du projet (3 niveaux au-dessus: klaviyo -> clients -> automations -> root)
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const https = require('https');

const apiKey = process.env.KLAVIYO_API_KEY;

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('          TEST CONNEXION KLAVIYO API                           ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'MANQUANT'}`);
console.log('');

if (!apiKey) {
  console.log('❌ KLAVIYO_API_KEY manquante dans .env');
  process.exit(1);
}

// Test: récupérer les listes (endpoint basique)
const options = {
  hostname: 'a.klaviyo.com',
  path: '/api/lists/',
  method: 'GET',
  headers: {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'revision': '2024-10-15',
    'Accept': 'application/json'
  }
};

console.log('Connexion en cours...');
console.log('');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => data += chunk);
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      const lists = response.data || [];
      
      console.log('✅ CONNEXION KLAVIYO RÉUSSIE!');
      console.log('');
      console.log(`   ${lists.length} liste(s) trouvée(s):`);
      
      lists.slice(0, 5).forEach((list, i) => {
        console.log(`   ${i+1}. ${list.attributes.name}`);
      });
      
      if (lists.length > 5) {
        console.log(`   ... et ${lists.length - 5} autres`);
      }
      console.log('');
    } else {
      console.log(`❌ ERREUR HTTP ${res.statusCode}`);
      try {
        const error = JSON.parse(data);
        console.log(`   └── ${error.errors?.[0]?.detail || data}`);
      } catch {
        console.log(`   └── ${data}`);
      }
    }
    console.log('═══════════════════════════════════════════════════════════════');
  });
});

req.on('error', (e) => {
  console.log(`❌ ERREUR CONNEXION: ${e.message}`);
  console.log('═══════════════════════════════════════════════════════════════');
});

req.end();
