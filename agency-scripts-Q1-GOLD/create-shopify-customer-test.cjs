#!/usr/bin/env node
/**
 * CREATE SHOPIFY CUSTOMER - TEST
 * Test creating a customer via Shopify Admin API
 */

const https = require('https');

const SHOPIFY_STORE = 'jqp1x4-7e.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = '[SHOPIFY_TOKEN_REDACTED]';

// Customer data
const customerData = {
  customer: {
    email: 'test+henderson1@gmail.com',
    first_name: 'Test',
    last_name: 'User Henderson 1',
    // phone: '5551234567',  // Optional - skip if causing issues
    tags: 'Contest PRE-LAUNCH, Sport Rider, Score_A, PRE-LAUNCH-2025',
    note: 'Lead collected: 03/12/2025 21:19:20\nMotorcycle: Sport Bike\nSource: Contest entry',
    email_marketing_consent: {
      state: 'subscribed',
      opt_in_level: 'confirmed_opt_in',
      consent_updated_at: new Date().toISOString()
    }
  }
};

const options = {
  hostname: SHOPIFY_STORE,
  path: '/admin/api/2025-10/customers.json',
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
};

console.log('Creating Shopify customer...');
console.log('Email:', customerData.customer.email);
console.log('');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => data += chunk);

  res.on('end', () => {
    if (res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('✅ Customer created successfully!');
      console.log('');
      console.log('ID:', result.customer.id);
      console.log('Email:', result.customer.email);
      console.log('Name:', result.customer.first_name, result.customer.last_name);
      console.log('Tags:', result.customer.tags);
      console.log('Created:', result.customer.created_at);
    } else {
      console.log('❌ Error creating customer');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(JSON.stringify(customerData));
req.end();
