#!/usr/bin/env node
/**
 * KLAVIYO GEO-SEGMENTATION
 * Creates segments based on subscriber location for targeted campaigns
 *
 * Markets:
 * - Europe (FR, BE, CH, DE, etc.) → French content + EUR
 * - Maghreb (MA, DZ, TN) → French content + MAD
 * - International (US, UK, CA, etc.) → English content + USD
 *
 * Date: 2025-12-19
 * Version: 1.0
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const CONFIG = {
  apiKey: process.env.KLAVIYO_API_KEY,
  clientName: process.env.CLIENT_NAME || 'unknown',
  apiBase: 'https://a.klaviyo.com/api'
};

// Market definitions
const MARKETS = {
  europe: {
    name: 'Europe',
    countries: ['FR', 'BE', 'CH', 'LU', 'MC', 'DE', 'AT', 'IT', 'ES', 'PT', 'NL', 'IE', 'FI', 'GR', 'MT', 'CY', 'SK', 'SI', 'EE', 'LV', 'LT', 'HR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'SE', 'DK', 'NO'],
    language: 'fr',
    currency: 'EUR',
    segmentPrefix: 'Geo - Europe'
  },
  maghreb: {
    name: 'Maghreb',
    countries: ['MA', 'DZ', 'TN'],
    language: 'fr',
    currency: 'MAD',
    segmentPrefix: 'Geo - Maghreb'
  },
  international: {
    name: 'International',
    countries: ['US', 'GB', 'CA', 'AU', 'NZ', 'IN', 'SG', 'HK', 'PH'],
    language: 'en',
    currency: 'USD',
    segmentPrefix: 'Geo - International'
  },
  rest_of_world: {
    name: 'Rest of World',
    countries: [], // Catch-all for unspecified countries
    language: 'en',
    currency: 'USD',
    segmentPrefix: 'Geo - ROW'
  }
};

// Validation
if (!CONFIG.apiKey) {
  console.error('❌ KLAVIYO_API_KEY non défini');
  console.error('   Vérifiez le fichier .env du client:', '/Users/mac/Desktop/clients/' + CONFIG.clientName + '/.env');
  process.exit(1);
}

async function klaviyoRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'revision': '2024-10-15'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${CONFIG.apiBase}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Klaviyo API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function getExistingSegments() {
  console.log('📊 Récupération des segments existants...');
  const data = await klaviyoRequest('/segments');
  return data.data || [];
}

async function createSegment(marketKey, market) {
  const segmentName = `${market.segmentPrefix} - ${market.name}`;

  // Build country filter conditions
  const countryConditions = market.countries.map(country => ({
    type: 'profile-property',
    property: 'location.country',
    operator: 'equals',
    value: country
  }));

  // If no countries specified (rest_of_world), use NOT IN for all defined countries
  let definition;
  if (market.countries.length === 0) {
    const allDefinedCountries = Object.values(MARKETS)
      .filter(m => m.countries.length > 0)
      .flatMap(m => m.countries);

    definition = {
      and: [{
        type: 'profile-property',
        property: 'location.country',
        operator: 'is-not-null'
      }, {
        type: 'profile-property',
        property: 'location.country',
        operator: 'not-in-list',
        value: allDefinedCountries
      }]
    };
  } else {
    definition = {
      or: countryConditions
    };
  }

  const body = {
    data: {
      type: 'segment',
      attributes: {
        name: segmentName,
        definition: JSON.stringify(definition)
      }
    }
  };

  try {
    const result = await klaviyoRequest('/segments', 'POST', body);
    console.log(`✅ Segment créé: ${segmentName}`);
    return result.data;
  } catch (error) {
    if (error.message.includes('409') || error.message.includes('already exists')) {
      console.log(`⚠️ Segment existe déjà: ${segmentName}`);
      return null;
    }
    throw error;
  }
}

async function analyzeProfiles() {
  console.log('📊 Analyse de la distribution géographique...');

  const profiles = await klaviyoRequest('/profiles?page[size]=100');
  const distribution = {};

  for (const profile of (profiles.data || [])) {
    const country = profile.attributes?.location?.country || 'Unknown';
    distribution[country] = (distribution[country] || 0) + 1;
  }

  console.log('\n📍 Distribution par pays:');
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      const market = Object.entries(MARKETS).find(([k, m]) => m.countries.includes(country));
      const marketName = market ? market[1].name : 'ROW';
      console.log(`   ${country}: ${count} profiles (${marketName})`);
    });

  return distribution;
}

async function main() {
  console.log('🌍 KLAVIYO GEO-SEGMENTATION');
  console.log('===========================');
  console.log(`Client: ${CONFIG.clientName}`);
  console.log(`API Key: ${CONFIG.apiKey.substring(0, 8)}...`);
  console.log('');

  try {
    // Analyze current distribution
    await analyzeProfiles();
    console.log('');

    // Get existing segments
    const existingSegments = await getExistingSegments();
    const existingNames = existingSegments.map(s => s.attributes?.name || '');
    console.log(`📁 Segments existants: ${existingSegments.length}`);
    console.log('');

    // Create geo segments
    console.log('🔧 Création des segments géographiques...');
    const createdSegments = [];

    for (const [key, market] of Object.entries(MARKETS)) {
      const segmentName = `${market.segmentPrefix} - ${market.name}`;

      if (existingNames.some(name => name.includes(market.segmentPrefix))) {
        console.log(`⏭️ Skipping ${segmentName} (existe déjà)`);
        continue;
      }

      const segment = await createSegment(key, market);
      if (segment) {
        createdSegments.push({
          market: market.name,
          id: segment.id,
          language: market.language,
          currency: market.currency
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n');
    console.log('📊 RÉSUMÉ');
    console.log('=========');
    console.log(`Segments créés: ${createdSegments.length}`);

    if (createdSegments.length > 0) {
      console.log('\nSegments disponibles pour targeting:');
      createdSegments.forEach(s => {
        console.log(`   • ${s.market}: Lang=${s.language}, Currency=${s.currency}`);
      });
    }

    console.log('\n📧 PROCHAINES ÉTAPES:');
    console.log('1. Créer des flows/campaigns distincts par segment');
    console.log('2. Adapter le contenu par langue (FR/EN)');
    console.log('3. Adapter les prix par devise (EUR/MAD/USD)');
    console.log('4. Utiliser des templates conditionnels dans les emails');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
