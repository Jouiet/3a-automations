#!/usr/bin/env node
/**
 * Check Klaviyo Flows
 * Session 120
 */
require('dotenv').config();

const key = process.env.KLAVIYO_API_KEY;
if (!key) {
  console.log('[ERROR] KLAVIYO_API_KEY not found');
  process.exit(1);
}

fetch('https://a.klaviyo.com/api/flows', {
  headers: {
    'Authorization': 'Klaviyo-API-Key ' + key,
    'revision': '2024-10-15'
  }
})
.then(r => r.json())
.then(d => {
  console.log('[OK] Klaviyo API accessible');
  console.log('Flows count:', d.data?.length || 0);
  if (d.data && d.data.length > 0) {
    console.log('\nFlows:');
    d.data.forEach(f => console.log(' -', f.attributes?.name || f.id));
  } else {
    console.log('\n[INFO] No flows created yet');
    console.log('Create flows via Klaviyo UI: https://www.klaviyo.com/flows');
  }
})
.catch(e => console.log('[ERROR]', e.message));
