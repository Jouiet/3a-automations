#!/usr/bin/env node
/**
 * P1.1: Deploy collection descriptions (OPTIMIZED - load all collections once)
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');

const SHOP = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-10';

console.log('🔧 P1.1: DEPLOY COLLECTION DESCRIPTIONS (OPTIMIZED)');
console.log('═'.repeat(70));

// Collection descriptions from COLLECTION_DESCRIPTIONS_SEO.md
const COLLECTIONS_DATA = require('../all-collections.json');

// Our 7 target descriptions
const TARGET_DESCRIPTIONS = {
  'helmets': `<div class="collection-hero-content">
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
</div>`,

  'jackets-pants': `<div class="collection-hero-content">
  <h2>Motorcycle Jackets - Protection Meets Style</h2>

  <p>Ride with confidence in <strong>CE-certified protective jackets</strong> designed for safety, comfort, and style. From premium leather to all-weather textile, our jackets feature impact-absorbing armor in shoulders, elbows, and back.</p>

  <div class="jacket-features">
    <h3>Why Choose Henderson Shop Jackets?</h3>
    <ul>
      <li>✅ <strong>CE-Certified Armor:</strong> Impact protection in critical zones (shoulders, elbows, back)</li>
      <li>✅ <strong>All-Season Options:</strong> Leather, textile, mesh, waterproof & heated jackets</li>
      <li>✅ <strong>Reflective Visibility:</strong> Enhanced night riding safety</li>
      <li>✅ <strong>Adjustable Fit:</strong> Waist, cuffs & collar adjustments for comfort</li>
      <li>✅ <strong>30-Day Returns:</strong> Risk-free purchase guarantee</li>
    </ul>
  </div>

  <div class="jacket-types">
    <h3>Shop by Riding Style</h3>
    <ul>
      <li><strong>Sport Jackets:</strong> Aerodynamic fit, CE Level 2 armor, aggressive styling</li>
      <li><strong>Touring Jackets:</strong> All-weather protection, multiple pockets, comfort padding</li>
      <li><strong>Cruiser Jackets:</strong> Classic leather, relaxed fit, timeless style</li>
      <li><strong>Adventure Jackets:</strong> Waterproof, ventilated, off-road ready</li>
    </ul>
  </div>

  <p><a href="/pages/jacket-sizing-guide" class="button">View Jacket Sizing Guide →</a></p>
</div>`,

  'gloves': `<div class="collection-hero-content">
  <h2>Motorcycle Gloves - Protect Your Hands, Control Your Ride</h2>

  <p>Your hands control everything - throttle, brakes, clutch. Protect them with <strong>CE-certified motorcycle gloves</strong> featuring knuckle armor, palm sliders, and reinforced stitching.</p>

  <div class="glove-features">
    <h3>Why Henderson Shop Gloves?</h3>
    <ul>
      <li>✅ <strong>CE Knuckle Protection:</strong> Impact-absorbing armor on critical zones</li>
      <li>✅ <strong>All-Season Range:</strong> Summer mesh, waterproof winter, heated gloves</li>
      <li>✅ <strong>Touchscreen Compatible:</strong> Use GPS & phone without removing gloves</li>
      <li>✅ <strong>Pre-Curved Fingers:</strong> Reduced hand fatigue on long rides</li>
      <li>✅ <strong>30-Day Returns:</strong> Perfect fit guaranteed</li>
    </ul>
  </div>

  <div class="glove-types">
    <h3>Choose Your Glove Type</h3>
    <ul>
      <li><strong>Sport Gloves:</strong> Carbon fiber knuckles, full gauntlet protection</li>
      <li><strong>Touring Gloves:</strong> Waterproof, insulated, all-weather comfort</li>
      <li><strong>Summer Gloves:</strong> Ventilated mesh, lightweight, breathable</li>
      <li><strong>Winter Gloves:</strong> Insulated, waterproof, heated options available</li>
    </ul>
  </div>

  <p><a href="/pages/glove-sizing-guide" class="button">Find Your Glove Size →</a></p>
</div>`,

  'boots': `<div class="collection-hero-content">
  <h2>Motorcycle Boots - Foundation of Safe Riding</h2>

  <p>Your feet control your bike and protect you in a crash. Invest in <strong>CE-certified motorcycle boots</strong> with ankle armor, shift pad protection, and non-slip soles.</p>

  <div class="boot-features">
    <h3>Why Henderson Shop Boots?</h3>
    <ul>
      <li>✅ <strong>CE Ankle & Shin Armor:</strong> Impact protection on vulnerable areas</li>
      <li>✅ <strong>Waterproof Options:</strong> Stay dry in rain, snow & mud</li>
      <li>✅ <strong>Reinforced Shift Pad:</strong> Prevents wear from gear changes</li>
      <li>✅ <strong>Oil-Resistant Soles:</strong> Superior grip on footpegs & pavement</li>
      <li>✅ <strong>30-Day Returns:</strong> Perfect fit or your money back</li>
    </ul>
  </div>

  <div class="boot-types">
    <h3>Shop by Riding Style</h3>
    <ul>
      <li><strong>Sport Boots:</strong> Full shin protection, aggressive grip, race-inspired</li>
      <li><strong>Touring Boots:</strong> Waterproof, comfortable for all-day rides</li>
      <li><strong>Cruiser Boots:</strong> Classic leather, casual style, moderate protection</li>
      <li><strong>Adventure Boots:</strong> Off-road ready, waterproof, high ankle support</li>
    </ul>
  </div>

  <p><a href="/pages/boot-sizing-guide" class="button">View Boot Sizing Guide →</a></p>
</div>`,

  'protection': `<div class="collection-hero-content">
  <h2>Protective Gear - Maximum Impact Protection</h2>

  <p>Layer up with <strong>CE-certified body armor</strong> for critical impact zones. Back protectors, chest guards, knee armor - comprehensive protection for serious riders.</p>

  <div class="armor-features">
    <h3>Why Henderson Shop Protective Gear?</h3>
    <ul>
      <li>✅ <strong>CE Level 1 & 2 Armor:</strong> Certified impact absorption</li>
      <li>✅ <strong>Modular System:</strong> Add protection where you need it most</li>
      <li>✅ <strong>Breathable Materials:</strong> Moisture-wicking, ventilated designs</li>
      <li>✅ <strong>Adjustable Straps:</strong> Secure fit over or under jacket</li>
      <li>✅ <strong>30-Day Returns:</strong> Risk-free purchase</li>
    </ul>
  </div>

  <div class="armor-types">
    <h3>Essential Protection Zones</h3>
    <ul>
      <li><strong>Back Protectors:</strong> Spine protection - most critical armor</li>
      <li><strong>Chest Protectors:</strong> Rib & sternum impact absorption</li>
      <li><strong>Knee Guards:</strong> Articulated protection for joint safety</li>
      <li><strong>Elbow Guards:</strong> Supplemental armor for high-risk zones</li>
    </ul>
  </div>

  <p><a href="/pages/armor-fit-guide" class="button">How to Choose Armor →</a></p>
</div>`,

  'accessories': `<div class="collection-hero-content">
  <h2>Motorcycle Accessories - Essential Riding Gear</h2>

  <p>Complete your setup with <strong>premium motorcycle accessories</strong>. Waterproof luggage, protective covers, maintenance tools, and riding essentials for every journey.</p>

  <div class="accessory-features">
    <h3>Why Henderson Shop Accessories?</h3>
    <ul>
      <li>✅ <strong>Waterproof Luggage:</strong> Secure storage for touring & commuting</li>
      <li>✅ <strong>Bike Protection:</strong> Weather-resistant covers & locks</li>
      <li>✅ <strong>Tool Kits:</strong> Emergency repair essentials</li>
      <li>✅ <strong>Visibility Gear:</strong> Reflective vests, helmet lights</li>
      <li>✅ <strong>30-Day Returns:</strong> Risk-free purchase</li>
    </ul>
  </div>

  <div class="accessory-categories">
    <h3>Shop by Category</h3>
    <ul>
      <li><strong>Luggage:</strong> Tank bags, saddlebags, tail bags, waterproof backpacks</li>
      <li><strong>Protection:</strong> Bike covers, disc locks, chain locks, alarms</li>
      <li><strong>Maintenance:</strong> Tool kits, tire repair, chain lube, cleaning supplies</li>
      <li><strong>Visibility:</strong> Reflective gear, helmet lights, vest, decals</li>
    </ul>
  </div>

  <p><a href="/pages/packing-guide" class="button">Motorcycle Packing Guide →</a></p>
</div>`,

  'bundles-and-kits': `<div class="collection-hero-content">
  <h2>Motorcycle Gear Bundles - Complete Rider Kits</h2>

  <p><strong>Save up to 35%</strong> with pre-configured rider bundles or build your own custom kit. Get matching helmet, jacket, gloves, and boots in one purchase - perfect for new riders or gear upgrades.</p>

  <div class="bundle-features">
    <h3>Why Buy Bundles?</h3>
    <ul>
      <li>✅ <strong>Save 35%:</strong> Automatic bundle discount vs individual items</li>
      <li>✅ <strong>Matching Style:</strong> Coordinated colors & designs</li>
      <li>✅ <strong>Complete Protection:</strong> Head-to-toe safety coverage</li>
      <li>✅ <strong>Custom Builder:</strong> <a href="/pages/bundle-builder">Build your own kit</a></li>
      <li>✅ <strong>30-Day Returns:</strong> Individual items returnable</li>
    </ul>
  </div>

  <div class="bundle-types">
    <h3>Pre-Configured Bundles</h3>
    <ul>
      <li><strong>Beginner Rider Kit:</strong> Essential safety gear for new motorcyclists</li>
      <li><strong>Commuter Bundle:</strong> All-weather protection for daily riders</li>
      <li><strong>Touring Package:</strong> Comfort + protection for long-distance travel</li>
      <li><strong>Sport Rider Kit:</strong> Performance gear for aggressive riding</li>
    </ul>
  </div>

  <p><a href="/pages/bundle-builder" class="button">Build Your Custom Bundle →</a></p>
</div>`
};

async function updateCollection(collectionId, html, type) {
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
        resolve({
          success: res.statusCode === 200,
          status: res.statusCode,
          error: res.statusCode === 200 ? null : responseData.substring(0, 500)
        });
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`\n📊 Loading collections from all-collections.json...\n`);

  const allCollections = [
    ...COLLECTIONS_DATA.smartCollections.map(c => ({ ...c, type: 'smart' })),
    ...COLLECTIONS_DATA.customCollections.map(c => ({ ...c, type: 'custom' }))
  ];

  console.log(`✅ Loaded ${allCollections.length} collections (no API calls needed)\n`);
  console.log('─'.repeat(70));

  const results = {
    timestamp: new Date().toISOString(),
    total: Object.keys(TARGET_DESCRIPTIONS).length,
    updated: 0,
    failed: 0,
    notFound: 0,
    details: []
  };

  for (const [handle, description] of Object.entries(TARGET_DESCRIPTIONS)) {
    const num = results.details.length + 1;
    console.log(`\n${num}. ${handle}:`);

    const collection = allCollections.find(c => c.handle === handle);

    if (!collection) {
      console.log(`   ❌ NOT FOUND`);
      results.notFound++;
      results.details.push({ handle, status: 'NOT_FOUND' });
      continue;
    }

    console.log(`   Found: ${collection.title} (${collection.type} collection)`);
    console.log(`   ID: ${collection.id}`);

    const result = await updateCollection(collection.id, description, collection.type);

    if (result.success) {
      console.log(`   ✅ UPDATED`);
      results.updated++;
      results.details.push({
        handle,
        title: collection.title,
        type: collection.type,
        status: 'SUCCESS'
      });
    } else {
      console.log(`   ❌ FAILED (HTTP ${result.status})`);
      results.failed++;
      results.details.push({
        handle,
        title: collection.title,
        type: collection.type,
        status: 'FAILED',
        error: result.error
      });
    }

    // Wait 2 seconds between updates
    if (num < Object.keys(TARGET_DESCRIPTIONS).length) {
      console.log(`   ⏳ Waiting 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESULTS');
  console.log('═'.repeat(70));
  console.log(`Total: ${results.total}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`❌ Not found: ${results.notFound}`);
  console.log(`Success rate: ${(results.updated/results.total*100).toFixed(1)}%`);

  fs.writeFileSync('deploy-collections-optimized-results.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Results: deploy-collections-optimized-results.json`);

  if (results.updated === results.total) {
    console.log(`\n🎉 P1.1: 100% COMPLETE!\n`);
  } else {
    console.log(`\n⚠️  P1.1: ${(results.updated/results.total*100).toFixed(1)}% complete\n`);
  }
}

main().catch(console.error);
