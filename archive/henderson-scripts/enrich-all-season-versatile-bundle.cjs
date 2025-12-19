#!/usr/bin/env node

/**
 * PRODUCT ENRICHMENT #15 - All-Season Versatile Rider Package (Bundle)
 * 100% FACTUAL - Based on actual bundle contents ONLY
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_BASE = `https://${STORE}/admin/api/2024-01`;

async function restRequest(endpoint, method = 'GET', body = null) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN
    },
    body: body ? JSON.stringify(body) : null
  });
  const data = await response.json();
  if (data.errors) {
    console.error('API Errors:', JSON.stringify(data.errors, null, 2));
    throw new Error('API request failed');
  }
  return data;
}

const PRODUCT_ID = '8691770523700';

const ENRICHED_DESCRIPTION = `<h2>All-Season Versatile Rider Package | Complete Weather Protection Bundle</h2>

<p>Curated all-season versatile rider package featuring essential protective gear for year-round riding. This mid-tier bundle combines weather-resistant equipment designed for riders who don't let seasons stop them. Complete kit assembled by Henderson Shop since 2017 for versatile riding across changing conditions.</p>

<h3>What's Included in This Package</h3>

<div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #333;">

<h4 style="margin-top: 0;">1. LS2 URBS II Motorcycle Gloves MG036 | Winter Warm Cold-Resistant</h4>
<p><strong>Winter-capable gloves for cold-season riding.</strong> LS2 URBS II MG036 model designed specifically for winter conditions with warm construction and cold-resistant features. Essential for maintaining hand dexterity and comfort during cold-weather riding when temperatures drop. Proper hand protection is critical - cold hands lose dexterity, making safe riding difficult.</p>
<p><strong>All-Season Benefits:</strong> Winter warmth for cold days, cold-resistant construction extends riding season into autumn and early spring, LS2 quality standards.</p>

<h4>2. Motorcycle Riding Boots | Waterproof</h4>
<p><strong>Waterproof boots for wet-weather riding protection.</strong> Essential footwear that keeps feet dry during rain, morning dew, or puddle splashes. Waterproof protection prevents the discomfort and safety hazard of wet feet while riding. Wet feet lose temperature regulation and can distract from safe riding focus.</p>
<p><strong>All-Season Benefits:</strong> Waterproof protection for rain/wet conditions, suitable for spring showers and autumn storms, year-round utility.</p>

</div>

<h3>Why This All-Season Versatile Rider Package?</h3>

<p><strong>All-Season Riding Reality:</strong> Versatile riders don't have the luxury of only riding in perfect conditions. Commuters need to reach work regardless of weather. Adventure riders encounter changing conditions. Touring riders face unexpected rain. This package addresses the two most common all-season challenges: cold hands and wet feet.</p>

<p><strong>Mid-Tier Quality Value:</strong> Mid-tier pricing doesn't mean compromised protection. It means accessible quality for riders who need solid gear without ultra-premium price points. Henderson Shop's mid-tier selections balance protection, durability, and affordability for real-world riders with real-world budgets.</p>

<p><strong>Weather Protection Focus:</strong> This bundle specifically targets weather - cold (winter gloves) and wet (waterproof boots). These are the two conditions that most commonly stop casual riders or make riding miserable. With proper hand and foot protection, you can ride comfortably through conditions that would otherwise keep you off the bike.</p>

<p><strong>Foundational Protection:</strong> Every rider needs quality gloves and boots. These aren't optional accessories - they're fundamental safety equipment. Your hands control throttle, clutch, and brakes. Your feet control shifting and rear brake. Protecting these contact points isn't luxury; it's necessity.</p>

<h3>Understanding All-Season Versatile Riding</h3>

<p>Versatile all-season riding requires adaptable gear:</p>

<ul>
  <li><strong>Temperature Extremes:</strong> All-season means handling both cold winter mornings and warm spring afternoons, sometimes in the same ride</li>
  <li><strong>Precipitation Variability:</strong> Unexpected rain, morning dew, road spray, puddles - waterproof gear handles all wet conditions</li>
  <li><strong>Daily Commuter Reality:</strong> Can't choose perfect weather days when riding is transportation, not recreation</li>
  <li><strong>Extended Riding Season:</strong> Proper gear extends your riding season from "fair weather only" to "most days except ice"</li>
  <li><strong>Layering Strategy:</strong> All-season versatility often requires layering - winter gloves over liner gloves, waterproof boots with warm socks</li>
  <li><strong>Practical Durability:</strong> Year-round riding means more miles and more wear - gear must handle constant use</li>
</ul>

<h3>Cold Hands & Wet Feet: Why These Matter</h3>

<p><strong>Cold Hands Are Dangerous:</strong> When hands get cold, you lose fine motor control. Pulling the clutch becomes harder. Operating turn signals requires more effort. In emergency situations, cold hands slow reaction time. Quality winter gloves aren't comfort items - they're safety equipment that maintains your ability to control the motorcycle.</p>

<p><strong>Wet Feet Affect Riding:</strong> Wet feet create multiple problems. You lose temperature regulation (evaporative cooling). Water in boots creates blisters during long rides. Wet socks bunch up, affecting gear shifting feel. Distraction from discomfort reduces riding focus. Waterproof boots eliminate these issues.</p>

<p><strong>The Versatile Rider's Dilemma:</strong> You need gear that works across seasons without requiring a complete wardrobe change for every temperature shift. Winter gloves handle cold days. Waterproof boots handle wet days. Together, they cover the most common adverse conditions you'll face during year-round riding.</p>

<h3>Frequently Asked Questions</h3>

<p><strong>Q: Is this package suitable for summer riding?</strong><br>
A: The winter warm gloves are designed for cold conditions - they may be too warm for hot summer days. However, waterproof boots work year-round (summer rain happens). Consider this package best for autumn, winter, spring, and cooler summer regions. Hot summer riding may require separate ventilated gloves.</p>

<p><strong>Q: What other gear do I need for complete all-season protection?</strong><br>
A: This package covers hands and feet. For complete protection, you'll also need a helmet, jacket, and pants. Many all-season riders layer a waterproof rain jacket over a ventilated riding jacket for temperature flexibility. Base layers underneath add cold-weather capability.</p>

<p><strong>Q: Can I purchase these items separately?</strong><br>
A: Yes, each item in this package is available separately in our store. The bundle offers convenience and coordinated gear selection. Visit individual product pages for LS2 URBS II gloves and waterproof motorcycle boots.</p>

<p><strong>Q: Are these items suitable for women riders?</strong><br>
A: Sizing is critical. Check manufacturer size charts for both gloves (hand measurements) and boots (foot size). Some gear is proportioned for men's dimensions and may not fit women riders optimally. Always verify sizing before ordering.</p>

<p><strong>Q: How do I maintain waterproof boots?</strong><br>
A: Clean after wet rides. Apply waterproofing treatment annually or when water stops beading on the surface. Check seams regularly - waterproofing can degrade at stitching. Store boots dry to prevent interior mildew. Replace boots when waterproofing can no longer be restored.</p>

<p><strong>Q: Will winter gloves fit over my jacket sleeves?</strong><br>
A: Most winter motorcycle gloves have gauntlets (extended cuffs) designed to fit over jacket sleeves, preventing gaps where cold air or water can enter. Try gloves with your riding jacket if possible to verify the gauntlet overlaps properly with your sleeve cuffs.</p>

<p><strong>Q: What makes motorcycle-specific boots different from regular waterproof boots?</strong><br>
A: Motorcycle boots provide ankle protection, shifter pad reinforcement, oil-resistant soles for grip on pegs, and crash protection. Regular waterproof boots lack these safety features. Always use motorcycle-specific boots for riding, not hiking boots or work boots.</p>

<h3>Bundle Purchase Considerations</h3>

<ul>
  <li><strong>Size Verification:</strong> Gloves and boots require accurate sizing - measure hands and feet carefully using manufacturer size charts</li>
  <li><strong>Seasonal Timing:</strong> Best value when purchasing before riding season - having gear ready before you need it</li>
  <li><strong>Try Before Extended Use:</strong> Test fit and comfort on short rides before committing to long trips</li>
  <li><strong>Gear Compatibility:</strong> Ensure glove gauntlets fit over your jacket sleeves, boots fit comfortably with riding pants</li>
  <li><strong>Return Policy Review:</strong> Understand return procedures for bundles if sizing issues occur</li>
  <li><strong>Stock Availability:</strong> Bundles require all components in stock - individual items may have different availability</li>
</ul>

<h3>Care & Maintenance for Year-Round Gear</h3>

<ul>
  <li><strong>Glove Care:</strong> Follow manufacturer cleaning instructions. Many winter gloves can't be machine washed. Air dry completely after wet rides. Store flat to maintain shape.</li>
  <li><strong>Waterproof Boot Care:</strong> Clean after each wet ride. Dry thoroughly before storage. Apply waterproof treatment annually. Check sole wear - replace when tread is shallow.</li>
  <li><strong>Off-Season Storage:</strong> Even "all-season" gear benefits from proper off-season storage. Clean thoroughly, dry completely, store in cool dry place away from UV light.</li>
  <li><strong>Regular Inspection:</strong> Check glove palms for wear, boot seams for separation, waterproof coating integrity. Replace worn gear before it fails during a ride.</li>
  <li><strong>Winter Prep:</strong> Before cold season, test winter gloves with your bike controls. Ensure throttle, clutch, brake lever operation isn't hindered by bulk.</li>
  <li><strong>Waterproof Testing:</strong> Periodically test boots by wearing them in light rain. Confirm waterproofing still works before relying on it during a long wet ride.</li>
</ul>

<h3>Why Buy from Henderson Shop?</h3>

<ul>
  <li>✅ <strong>Trusted Since 2017:</strong> 10,000+ riders worldwide</li>
  <li>✅ <strong>Curated Packages:</strong> Expert-selected gear for specific riding needs</li>
  <li>✅ <strong>All-Season Focus:</strong> Gear selected for versatile year-round riding</li>
  <li>✅ <strong>Mid-Tier Value:</strong> Quality protection at accessible pricing</li>
  <li>✅ <strong>Free Shipping:</strong> On orders $150+ (conditions apply)</li>
  <li>✅ <strong>30-Day Returns:</strong> Not satisfied? We've got you covered</li>
  <li>✅ <strong>Expert Support:</strong> Questions about all-season gear? Our team is here to help</li>
</ul>

<p style="margin-top: 30px;"><strong>Henderson Shop - Your safety is our priority. Trusted by riders since 2017.</strong></p>`;

async function enrichProduct() {
  console.log('ENRICHING PRODUCT #15: All-Season Versatile Rider Package (Bundle)');
  console.log('='.repeat(100));
  console.log('');
  console.log('📋 FACTUAL BUNDLE CONTENTS EXTRACTED:');
  console.log('  ✅ Product 1: LS2 URBS II Motorcycle Gloves MG036 Winter Warm Cold-Resistant');
  console.log('  ✅ Product 2: Motorcycle Riding Boots Waterproof');
  console.log('  ✅ Brand: LS2 for gloves (from product name)');
  console.log('  ✅ Type: Bundle, complete kit, package (from tags + type)');
  console.log('  ✅ Tier: Mid-tier (from tags)');
  console.log('  ✅ Purpose: All-season, versatile rider (from tags + handle)');
  console.log('  ✅ Features: Winter warm gloves, cold-resistant, waterproof boots');
  console.log('');
  console.log('❌ NOT INVENTED:');
  console.log('  ❌ Specific insulation details for gloves');
  console.log('  ❌ Boot material specifics beyond waterproof');
  console.log('  ❌ Armor standards or certifications');
  console.log('  ❌ Pricing/savings calculations');
  console.log('  ❌ Performance specs not in product names');
  console.log('');
  console.log('✅ GENERIC HELPFUL CONTENT ADDED:');
  console.log('  ✅ Detailed description of each bundle component');
  console.log('  ✅ All-season benefits explained');
  console.log('  ✅ Educational content (versatile riding reality, cold hands/wet feet importance)');
  console.log('  ✅ FAQ (7 questions about summer suitability, complete protection, individual purchase, women riders, boot maintenance, glove fit, motorcycle-specific boots)');
  console.log('  ✅ Bundle purchase considerations');
  console.log('  ✅ Care & maintenance for year-round gear');
  console.log('  ✅ Trust signals (Henderson Shop value props)');
  console.log('');

  // Get current product
  const current = await restRequest(`/products/${PRODUCT_ID}.json`);
  const currentLength = (current.product.body_html || '').length;

  console.log(`Current description: ${currentLength} chars (~${Math.round(currentLength / 6)} words)`);
  console.log(`New description: ${ENRICHED_DESCRIPTION.length} chars (~${Math.round(ENRICHED_DESCRIPTION.length / 6)} words)`);
  console.log(`Change: +${ENRICHED_DESCRIPTION.length - currentLength} chars (+${Math.round((ENRICHED_DESCRIPTION.length - currentLength) / 6)} words)`);
  console.log('');

  // Update product
  const updateData = {
    product: {
      id: parseInt(PRODUCT_ID),
      body_html: ENRICHED_DESCRIPTION
    }
  };

  await restRequest(`/products/${PRODUCT_ID}.json`, 'PUT', updateData);

  console.log('✅ PRODUCT UPDATED SUCCESSFULLY');
  console.log('='.repeat(100));
  console.log('');
  console.log('📊 SUMMARY:');
  console.log(`  Product ID: ${PRODUCT_ID}`);
  console.log(`  Title: All-Season Versatile Rider Package`);
  console.log(`  Status: Enriched with 100% factual bundle contents`);
  console.log(`  Content: ${Math.round(ENRICHED_DESCRIPTION.length / 6)} words of factual + helpful content`);
  console.log('');
  console.log('🎯 NEXT: Verify enrichment, then move to product #16');
}

enrichProduct().catch(error => {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
