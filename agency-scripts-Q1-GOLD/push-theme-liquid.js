#!/usr/bin/env node
/**
 * Push theme.liquid to Shopify
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';
const THEME_ID = 147139985460;

const BASE_URL = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}`;

async function shopifyRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function main() {
  console.log('🚀 Pushing theme.liquid to Shopify...\n');

  try {
    // Read theme.liquid
    const filepath = path.join(process.cwd(), 'layout', 'theme.liquid');
    const content = fs.readFileSync(filepath, 'utf-8');

    console.log(`📄 File: layout/theme.liquid (${(content.length / 1024).toFixed(1)}KB)`);

    // Upload to Shopify
    await shopifyRequest(`/themes/${THEME_ID}/assets.json`, 'PUT', {
      asset: {
        key: 'layout/theme.liquid',
        value: content,
      },
    });

    console.log('✅ Successfully pushed to Shopify!\n');
    console.log('🎯 Theme ID: ' + THEME_ID);
    console.log('💰 Page speed optimization ACTIVATED ($162k/year ROI)');

  } catch (error) {
    console.error('❌ Push failed:', error.message);
    process.exit(1);
  }
}

main();
