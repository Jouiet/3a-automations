#!/usr/bin/env node
/**
 * Check Klaviyo Lists
 * Session 120
 */
require('dotenv').config();

const key = process.env.KLAVIYO_API_KEY;
if (!key) {
  console.log('[ERROR] KLAVIYO_API_KEY not found');
  process.exit(1);
}

fetch('https://a.klaviyo.com/api/lists', {
  headers: {
    'Authorization': 'Klaviyo-API-Key ' + key,
    'revision': '2024-10-15'
  }
})
.then(r => r.json())
.then(d => {
  console.log('[OK] Klaviyo API accessible');
  console.log('Lists count:', d.data?.length || 0);
  if (d.data && d.data.length > 0) {
    console.log('\nLists:');
    d.data.forEach(l => console.log(' -', l.attributes?.name || l.id));
  }
})
.catch(e => console.log('[ERROR]', e.message));
