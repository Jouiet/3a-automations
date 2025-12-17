#!/usr/bin/env node
/**
 * P1.1: Test deploy ONE collection to confirm it works
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-10';

console.log('🔧 P1.1: TEST DEPLOY SINGLE COLLECTION');
console.log('═'.repeat(70));

const COLLECTION = {
  handle: 'helmets',
  descriptionHtml: `<div class="collection-hero-content">
  <h2>Premium Motorcycle Helmets - Safety-Tested Protection</h2>

  <p>Your safety is our priority. Every helmet at Henderson Shop meets or exceeds <strong>DOT (Department of Transportation)</strong>, <strong>ECE 22.06</strong>, or <strong>SNELL</strong> safety standards. Whether you're commuting daily, touring cross-country, or hitting the track, we have the perfect helmet for your riding style.</p>

  <div class="helmet-features">
    <h3>Why Buy Helmets from Henderson Shop?</h3>
    <ul>
      <li>✅ <strong>100% DOT/ECE Certified:</strong> Every helmet tested for impact protection</li>
      <li>✅ <strong>Styles for Every Rider:</strong> Full-face, modular, open-face, half helmets</li>
      <li>✅ <strong>Size Guidance:</strong> <a href="/pages/helmet-sizing-guide">Free sizing guide</a> to find your perfect fit</li>
      <li>✅ <strong>30-Day Returns:</strong> No questions asked money-back guarantee</li>
      <li>✅ <strong>Free Shipping:</strong> On orders $150+ (7-15 business days)</li>
    </ul>
  </div>

  <div class="helmet-types">
    <h3>Choose Your Helmet Style</h3>
    <ul>
      <li><strong>Full-Face Helmets:</strong> Maximum protection for sport & touring riders</li>
      <li><strong>Modular Helmets:</strong> Flip-up convenience with full-face safety</li>
      <li><strong>Open-Face Helmets:</strong> Classic style for cruiser & urban riders</li>
      <li><strong>Half Helmets:</strong> Lightweight protection for casual rides</li>
    </ul>
  </div>

  <p><a href="/pages/helmet-safety-standards" class="button">Learn About Helmet Safety Standards →</a></p>
</div>`
};

async function fetchCollection(handle) {
  console.log(`\n1. Fetching collection: ${handle}...`);

  // Try smart collections
  const smartCollection = await fetchByType(handle, 'smart_collections');
  if (smartCollection) {
    console.log(`   ✅ Found in smart_collections`);
    console.log(`   ID: ${smartCollection.id}`);
    console.log(`   Title: ${smartCollection.title}`);
    return { ...smartCollection, type: 'smart' };
  }

  console.log(`   ⚠️  Not found in smart_collections, trying custom...`);

  // Try custom collections
  const customCollection = await fetchByType(handle, 'custom_collections');
  if (customCollection) {
    console.log(`   ✅ Found in custom_collections`);
    console.log(`   ID: ${customCollection.id}`);
    console.log(`   Title: ${customCollection.title}`);
    return { ...customCollection, type: 'custom' };
  }

  console.log(`   ❌ Not found`);
  return null;
}

async function fetchByType(handle, collectionType) {
  return new Promise((resolve) => {
    const options = {
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/${collectionType}.json?limit=250`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(responseData);
          const collections = result[collectionType];
          const collection = collections.find(c => c.handle === handle);
          resolve(collection || null);
        } else {
          console.log(`   API Error: ${res.statusCode}`);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   Request error: ${e.message}`);
      resolve(null);
    });

    req.end();
  });
}

async function updateCollection(collectionId, html, type) {
  console.log(`\n2. Updating collection...`);
  console.log(`   ID: ${collectionId}`);
  console.log(`   Type: ${type}`);
  console.log(`   HTML length: ${html.length} chars`);

  return new Promise((resolve) => {
    const endpoint = type === 'smart' ? 'smart_collections' : 'custom_collections';
    const key = type === 'smart' ? 'smart_collection' : 'custom_collection';

    const data = JSON.stringify({
      [key]: {
        id: collectionId,
        body_html: html
      }
    });

    const options = {
      hostname: SHOP,
      path: `/admin/api/${API_VERSION}/${endpoint}/${collectionId}.json`,
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ SUCCESS (HTTP ${res.statusCode})`);
          resolve({ success: true });
        } else {
          console.log(`   ❌ FAILED (HTTP ${res.statusCode})`);
          console.log(`   Response: ${responseData.substring(0, 500)}`);
          resolve({ success: false, status: res.statusCode, error: responseData });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Request error: ${e.message}`);
      resolve({ success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`\n📊 Testing single collection deployment\n`);
  console.log('─'.repeat(70));

  // Step 1: Fetch
  const collection = await fetchCollection(COLLECTION.handle);

  if (!collection) {
    console.log(`\n❌ Collection not found: ${COLLECTION.handle}\n`);
    process.exit(1);
  }

  // Delay before update
  console.log(`\n⏳ Waiting 1 second before update...`);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Update
  const result = await updateCollection(collection.id, COLLECTION.descriptionHtml, collection.type);

  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESULT');
  console.log('═'.repeat(70));

  if (result.success) {
    console.log(`✅ Successfully updated collection: ${COLLECTION.handle}`);
    console.log(`\n✅ Single collection deployment works!\n`);
  } else {
    console.log(`❌ Failed to update collection: ${COLLECTION.handle}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.error}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
