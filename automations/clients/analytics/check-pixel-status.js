#!/usr/bin/env node
/**
 * Check Facebook & TikTok Pixel Configuration Status
 */

require('dotenv').config({ path: '.env' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';
const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

async function shopifyRequest(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }

  return response.json();
}

async function main() {
  console.log('🔍 Checking Pixel Configuration Status...\n');

  try {
    // Check shop metafields for Infinite Pixels app data
    const metafieldsData = await shopifyRequest('/metafields.json');

    const infinitePixelMetafield = metafieldsData.metafields.find(
      m => m.namespace === 'InfinitefbtiktokApp' || m.key.includes('InfinitefbtiktokDbData')
    );

    if (infinitePixelMetafield) {
      console.log('✅ Infinite Pixels App Detected');
      console.log('📦 Metafield Namespace:', infinitePixelMetafield.namespace);
      console.log('🔑 Metafield Key:', infinitePixelMetafield.key);

      try {
        const pixelData = JSON.parse(infinitePixelMetafield.value);
        console.log('\n📊 Pixel Configuration:');
        console.log('  Facebook Pixel:', pixelData.fbPixel || 'NOT CONFIGURED');
        console.log('  TikTok Pixel:', pixelData.tiktokPixel || 'NOT CONFIGURED');

        if (pixelData.fbPixel) {
          console.log('\n✅ Facebook Pixel: ACTIVE');
        } else {
          console.log('\n❌ Facebook Pixel: MISSING');
        }

        if (pixelData.tiktokPixel) {
          console.log('✅ TikTok Pixel: ACTIVE');
        } else {
          console.log('❌ TikTok Pixel: MISSING - $15k-25k/year revenue opportunity');
        }
      } catch (e) {
        console.log('\n⚠️  Could not parse metafield value');
      }
    } else {
      console.log('❌ Infinite Pixels App: NOT DETECTED in metafields');
    }

    // Check for native Facebook & Instagram app
    console.log('\n🔍 Checking Native Facebook & Instagram App...');

    try {
      const shopData = await shopifyRequest('/shop.json');
      console.log('✅ Shop data retrieved');

      // Note: Pixel configuration is typically in app settings, not shop API
      console.log('\nℹ️  Native app pixel config requires UI access or specific app API');

    } catch (e) {
      console.log('⚠️  Could not retrieve shop data');
    }

    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATION');
    console.log('='.repeat(70));
    console.log('If TikTok Pixel is missing:');
    console.log('1. Get TikTok Pixel ID from TikTok Ads Manager');
    console.log('   URL: https://ads.tiktok.com/i18n/events_manager');
    console.log('2. Configure in Infinite Pixels app or native TikTok integration');
    console.log('3. Expected format: Starts with "C..." (e.g., CXXXXXXXXXXXXXXXXX)');
    console.log('4. Revenue impact: $15k-25k/year from retargeting');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

main();
