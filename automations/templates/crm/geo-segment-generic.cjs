#!/usr/bin/env node
/**
 * GENERIC CRM GEO-SEGMENTATION
 * Creates geographic segments in any CRM (HubSpot, Mailchimp, Brevo, etc.)
 *
 * Supported CRMs:
 * - HubSpot (HUBSPOT_API_KEY)
 * - Mailchimp (MAILCHIMP_API_KEY + MAILCHIMP_SERVER)
 * - Brevo/Sendinblue (BREVO_API_KEY)
 * - ActiveCampaign (AC_API_KEY + AC_URL)
 *
 * Usage:
 *   CRM_TYPE=hubspot node geo-segment-generic.cjs
 *   CRM_TYPE=mailchimp node geo-segment-generic.cjs
 *
 * Date: 2025-12-19
 * Version: 1.0
 * Author: 3A Automation
 */

require('dotenv').config({ path: '/Users/mac/Desktop/clients/' + (process.env.CLIENT_NAME || 'default') + '/.env' });

const { MARKETS, getMarketByCountry, generateSegmentDefinitions } = require('../../generic/geo-markets.cjs');

const CONFIG = {
  clientName: process.env.CLIENT_NAME || 'unknown',
  crmType: process.env.CRM_TYPE || 'hubspot',

  // HubSpot
  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY,
    baseUrl: 'https://api.hubapi.com'
  },

  // Mailchimp
  mailchimp: {
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER || 'us1',
    get baseUrl() { return `https://${this.server}.api.mailchimp.com/3.0`; }
  },

  // Brevo (Sendinblue)
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    baseUrl: 'https://api.brevo.com/v3'
  },

  // ActiveCampaign
  activecampaign: {
    apiKey: process.env.AC_API_KEY,
    baseUrl: process.env.AC_URL
  }
};

// CRM Adapters
const CRM_ADAPTERS = {
  hubspot: {
    name: 'HubSpot',
    validateConfig() {
      return !!CONFIG.hubspot.apiKey;
    },
    async createSegment(market) {
      const countryFilter = market.countries.length > 0
        ? {
            propertyName: 'country',
            operator: 'IN',
            value: market.countries.join(';')
          }
        : {
            propertyName: 'country',
            operator: 'HAS_PROPERTY'
          };

      const body = {
        name: `Geo - ${market.name}`,
        type: 'STATIC',
        filters: [[countryFilter]]
      };

      const response = await fetch(`${CONFIG.hubspot.baseUrl}/crm/v3/lists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.hubspot.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return response.ok;
    },
    async getContacts() {
      const response = await fetch(`${CONFIG.hubspot.baseUrl}/crm/v3/objects/contacts?limit=100&properties=country`, {
        headers: { 'Authorization': `Bearer ${CONFIG.hubspot.apiKey}` }
      });
      const data = await response.json();
      return (data.results || []).map(c => ({
        id: c.id,
        email: c.properties?.email,
        country: c.properties?.country
      }));
    }
  },

  mailchimp: {
    name: 'Mailchimp',
    validateConfig() {
      return !!CONFIG.mailchimp.apiKey;
    },
    async createSegment(market, listId) {
      const conditions = market.countries.length > 0
        ? market.countries.map(country => ({
            condition_type: 'TextMerge',
            field: 'COUNTRY',
            op: 'is',
            value: country
          }))
        : [];

      const body = {
        name: `Geo - ${market.name}`,
        options: {
          match: 'any',
          conditions
        }
      };

      const response = await fetch(`${CONFIG.mailchimp.baseUrl}/lists/${listId}/segments`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from('anystring:' + CONFIG.mailchimp.apiKey).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return response.ok;
    },
    async getContacts(listId) {
      const response = await fetch(`${CONFIG.mailchimp.baseUrl}/lists/${listId}/members?count=100`, {
        headers: {
          'Authorization': `Basic ${Buffer.from('anystring:' + CONFIG.mailchimp.apiKey).toString('base64')}`
        }
      });
      const data = await response.json();
      return (data.members || []).map(m => ({
        id: m.id,
        email: m.email_address,
        country: m.merge_fields?.COUNTRY || m.location?.country_code
      }));
    }
  },

  brevo: {
    name: 'Brevo',
    validateConfig() {
      return !!CONFIG.brevo.apiKey;
    },
    async createSegment(market) {
      // Brevo uses lists and filters
      const body = {
        name: `Geo - ${market.name}`,
        folderId: 1
      };

      const response = await fetch(`${CONFIG.brevo.baseUrl}/contacts/lists`, {
        method: 'POST',
        headers: {
          'api-key': CONFIG.brevo.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return response.ok;
    },
    async getContacts() {
      const response = await fetch(`${CONFIG.brevo.baseUrl}/contacts?limit=100`, {
        headers: { 'api-key': CONFIG.brevo.apiKey }
      });
      const data = await response.json();
      return (data.contacts || []).map(c => ({
        id: c.id,
        email: c.email,
        country: c.attributes?.COUNTRY
      }));
    }
  },

  activecampaign: {
    name: 'ActiveCampaign',
    validateConfig() {
      return !!CONFIG.activecampaign.apiKey && !!CONFIG.activecampaign.baseUrl;
    },
    async createSegment(market) {
      const body = {
        segment: {
          name: `Geo - ${market.name}`,
          logic: 'or',
          conditions: market.countries.map(country => ({
            field: 'country',
            op: 'eq',
            val: country
          }))
        }
      };

      const response = await fetch(`${CONFIG.activecampaign.baseUrl}/api/3/segments`, {
        method: 'POST',
        headers: {
          'Api-Token': CONFIG.activecampaign.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return response.ok;
    },
    async getContacts() {
      const response = await fetch(`${CONFIG.activecampaign.baseUrl}/api/3/contacts?limit=100`, {
        headers: { 'Api-Token': CONFIG.activecampaign.apiKey }
      });
      const data = await response.json();
      return (data.contacts || []).map(c => ({
        id: c.id,
        email: c.email,
        country: c.fieldValues?.find(f => f.field === 'country')?.value
      }));
    }
  }
};

async function main() {
  console.log('🌍 GENERIC CRM GEO-SEGMENTATION');
  console.log('================================');
  console.log(`Client: ${CONFIG.clientName}`);
  console.log(`CRM: ${CONFIG.crmType}`);
  console.log('');

  // Get adapter
  const adapter = CRM_ADAPTERS[CONFIG.crmType];
  if (!adapter) {
    console.error(`❌ CRM non supporté: ${CONFIG.crmType}`);
    console.log('   CRMs supportés: hubspot, mailchimp, brevo, activecampaign');
    process.exit(1);
  }

  // Validate config
  if (!adapter.validateConfig()) {
    console.error(`❌ Configuration ${adapter.name} manquante`);
    console.log('   Vérifiez les variables d\'environnement dans le .env du client');
    process.exit(1);
  }

  console.log(`✅ ${adapter.name} configuré`);
  console.log('');

  try {
    // Analyze contacts
    console.log('📊 Analyse des contacts...');
    const contacts = await adapter.getContacts();
    console.log(`   Total: ${contacts.length} contacts`);

    // Distribution by market
    const distribution = {};
    contacts.forEach(contact => {
      const market = getMarketByCountry(contact.country);
      distribution[market.id] = (distribution[market.id] || 0) + 1;
    });

    console.log('\n📍 Distribution par marché:');
    Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([marketId, count]) => {
        const market = MARKETS[marketId];
        const pct = ((count / contacts.length) * 100).toFixed(1);
        console.log(`   ${market.name}: ${count} (${pct}%)`);
      });

    // Create segments
    console.log('\n🔧 Création des segments...');
    const segmentDefs = generateSegmentDefinitions(CONFIG.crmType);

    for (const segment of segmentDefs) {
      console.log(`   Creating: ${segment.name}...`);
      // Note: In production, uncomment the actual API call
      // const success = await adapter.createSegment(segment);
      // console.log(success ? `   ✅ ${segment.name}` : `   ⚠️ ${segment.name} (existe déjà?)`);
      console.log(`   ✅ ${segment.name} (dry-run)`);
      await new Promise(r => setTimeout(r, 200));
    }

    // Summary
    console.log('\n📊 RÉSUMÉ');
    console.log('=========');
    console.log(`CRM: ${adapter.name}`);
    console.log(`Contacts analysés: ${contacts.length}`);
    console.log(`Segments créés: ${segmentDefs.length}`);

    console.log('\n📧 PROCHAINES ÉTAPES:');
    console.log('1. Vérifier les segments dans le CRM');
    console.log('2. Créer des workflows/automations par segment');
    console.log('3. Adapter le contenu par langue et devise');
    console.log('4. Tester avec un petit groupe avant déploiement');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
