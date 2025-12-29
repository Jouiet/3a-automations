#!/usr/bin/env node
/**
 * SETUP KLAVIYO LISTS - Create segment-specific lists for lead pipelines
 * Session 114 - Making pipelines operational
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;

if (!KLAVIYO_API_KEY) {
  console.error('❌ KLAVIYO_API_KEY not set');
  process.exit(1);
}

// Lists to create
const LISTS_TO_CREATE = [
  // LinkedIn segments
  { name: 'LinkedIn - Decision Makers', description: 'CEOs, Directors, VPs, Founders from LinkedIn scraping' },
  { name: 'LinkedIn - Marketing', description: 'Marketing professionals from LinkedIn scraping' },
  { name: 'LinkedIn - Sales', description: 'Sales professionals from LinkedIn scraping' },
  { name: 'LinkedIn - Tech', description: 'Tech/Engineering professionals from LinkedIn scraping' },
  { name: 'LinkedIn - HR', description: 'HR/Recruiting professionals from LinkedIn scraping' },
  { name: 'LinkedIn - Other', description: 'Other professionals from LinkedIn scraping' },
  // Google Maps segments
  { name: 'Google Maps - Decision Makers', description: 'Service professionals from Google Maps' },
  { name: 'Google Maps - Marketing', description: 'Marketing agencies from Google Maps' },
  { name: 'Google Maps - Sales', description: 'Commercial services from Google Maps' },
  { name: 'Google Maps - Tech', description: 'Tech services from Google Maps' },
  { name: 'Google Maps - HR', description: 'HR services from Google Maps' },
  { name: 'Google Maps - Local Business', description: 'Local businesses from Google Maps' },
  // General
  { name: 'Newsletter Subscribers', description: 'Newsletter bi-monthly subscribers' },
  { name: 'Welcome Series', description: 'New contacts for welcome email sequence' },
  { name: 'B2B Outreach', description: 'B2B prospects for outreach campaigns' },
];

async function klaviyoRequest(endpoint, method = 'GET', body = null) {
  const url = `https://a.klaviyo.com/api/${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
      'Accept': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();
  
  if (!response.ok) {
    throw new Error(`Klaviyo ${response.status}: ${text}`);
  }
  
  return text ? JSON.parse(text) : { success: true };
}

async function getExistingLists() {
  const result = await klaviyoRequest('lists');
  return result.data || [];
}

async function createList(name, description) {
  const body = {
    data: {
      type: 'list',
      attributes: {
        name: name,
        // description is not supported in API, we'll use name only
      }
    }
  };

  const result = await klaviyoRequest('lists', 'POST', body);
  return result.data;
}

async function main() {
  console.log('================================================================================');
  console.log('KLAVIYO LIST SETUP - Creating segment-specific lists');
  console.log('================================================================================');
  console.log('');

  // Get existing lists
  console.log('📋 Fetching existing lists...');
  const existingLists = await getExistingLists();
  const existingNames = existingLists.map(l => l.attributes?.name);
  console.log(`   Found ${existingLists.length} existing lists`);
  existingLists.forEach(l => console.log(`   - ${l.attributes?.name} (${l.id})`));
  console.log('');

  // Create missing lists
  const created = [];
  const skipped = [];
  const failed = [];

  for (const list of LISTS_TO_CREATE) {
    if (existingNames.includes(list.name)) {
      console.log(`⏭️  Skipping "${list.name}" (already exists)`);
      skipped.push(list.name);
      continue;
    }

    try {
      console.log(`➕ Creating "${list.name}"...`);
      const result = await createList(list.name, list.description);
      console.log(`   ✅ Created: ${result.id}`);
      created.push({ name: list.name, id: result.id });
      
      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failed.push({ name: list.name, error: error.message });
    }
  }

  console.log('');
  console.log('================================================================================');
  console.log('SUMMARY');
  console.log('================================================================================');
  console.log(`✅ Created: ${created.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (created.length > 0) {
    console.log('');
    console.log('NEW LIST IDs (add to .env):');
    created.forEach(l => {
      const envName = l.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      console.log(`KLAVIYO_${envName}_ID=${l.id}`);
    });
  }

  // Fetch final state
  console.log('');
  console.log('📊 Final list state:');
  const finalLists = await getExistingLists();
  finalLists.forEach(l => console.log(`   - ${l.attributes?.name} (${l.id})`));
}

main().catch(error => {
  console.error('❌ Fatal:', error.message);
  process.exit(1);
});
