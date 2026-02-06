#!/usr/bin/env node
/**
 * FORENSIC API TEST - Verification empirique de toutes les APIs
 * Date: 2025-12-18
 * Version: 1.0
 */

require('dotenv').config();

const RESULTS = {
  timestamp: new Date().toISOString(),
  tests: []
};

async function testShopify() {
  const start = Date.now();
  const test = {
    name: 'Shopify API',
    status: 'unknown',
    details: {}
  };

  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!domain || !token) {
      test.status = 'MISSING_CREDENTIALS';
      test.details = { domain: !!domain, token: !!token };
      return test;
    }

    const url = `https://${domain}/admin/api/2024-01/shop.json`;
    const response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token }
    });

    test.details.httpStatus = response.status;
    test.details.latency = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      test.status = 'OK';
      test.details.storeName = data.shop?.name;
      test.details.domain = data.shop?.domain;
      test.details.plan = data.shop?.plan_name;
      test.details.email = data.shop?.email;
    } else {
      test.status = 'FAILED';
      test.details.error = await response.text();
    }
  } catch (err) {
    test.status = 'ERROR';
    test.details.error = err.message;
  }

  return test;
}

async function testKlaviyo() {
  const start = Date.now();
  const test = {
    name: 'Klaviyo API',
    status: 'unknown',
    details: {}
  };

  try {
    const apiKey = process.env.KLAVIYO_API_KEY;

    if (!apiKey) {
      test.status = 'MISSING_CREDENTIALS';
      return test;
    }

    // Test lists endpoint
    const url = 'https://a.klaviyo.com/api/lists/';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': '2024-02-15',
        'accept': 'application/json'
      }
    });

    test.details.httpStatus = response.status;
    test.details.latency = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      test.status = 'OK';
      test.details.listCount = data.data?.length || 0;
      test.details.lists = data.data?.map(l => l.attributes?.name) || [];
    } else {
      test.status = 'FAILED';
      const errorText = await response.text();
      test.details.error = errorText.substring(0, 200);
    }
  } catch (err) {
    test.status = 'ERROR';
    test.details.error = err.message;
  }

  return test;
}

async function testXAI() {
  const start = Date.now();
  const test = {
    name: 'xAI/Grok API',
    status: 'unknown',
    details: {}
  };

  try {
    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      test.status = 'MISSING_CREDENTIALS';
      return test;
    }

    // Test models endpoint
    const url = 'https://api.x.ai/v1/models';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json'
      }
    });

    test.details.httpStatus = response.status;
    test.details.latency = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      test.status = 'OK';
      test.details.modelCount = data.data?.length || 0;
      test.details.models = data.data?.map(m => m.id) || [];
    } else {
      test.status = 'FAILED';
      const errorData = await response.json().catch(() => ({}));
      test.details.error = errorData.error?.message || response.statusText;
    }
  } catch (err) {
    test.status = 'ERROR';
    test.details.error = err.message;
  }

  return test;
}

async function testGoogleServiceAccount() {
  const test = {
    name: 'Google Service Account',
    status: 'unknown',
    details: {}
  };

  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!filePath) {
    test.status = 'MISSING_PATH';
    return test;
  }

  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      test.status = 'OK';
      test.details.projectId = content.project_id;
      test.details.clientEmail = content.client_email;
    } else {
      test.status = 'FILE_MISSING';
      test.details.path = filePath;
    }
  } catch (err) {
    test.status = 'ERROR';
    test.details.error = err.message;
  }

  return test;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('    FORENSIC API TEST - Verification Empirique');
  console.log('    Date:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Run all tests
  const tests = await Promise.all([
    testShopify(),
    testKlaviyo(),
    testXAI(),
    testGoogleServiceAccount()
  ]);

  RESULTS.tests = tests;

  // Display results
  let okCount = 0;
  let failCount = 0;

  for (const test of tests) {
    const icon = test.status === 'OK' ? '✅' :
                 test.status === 'FAILED' || test.status === 'ERROR' ? '❌' :
                 '⚠️';

    console.log(`${icon} ${test.name}: ${test.status}`);

    if (test.details.latency) {
      console.log(`   └── Latency: ${test.details.latency}ms`);
    }

    if (test.status === 'OK') {
      okCount++;
      if (test.details.storeName) console.log(`   └── Store: ${test.details.storeName}`);
      if (test.details.listCount !== undefined) console.log(`   └── Lists: ${test.details.listCount}`);
      if (test.details.workflowCount !== undefined) console.log(`   └── Workflows: ${test.details.workflowCount}`);
      if (test.details.modelCount !== undefined) console.log(`   └── Models: ${test.details.modelCount}`);
      if (test.details.projectId) console.log(`   └── Project: ${test.details.projectId}`);
    } else {
      failCount++;
      if (test.details.error) console.log(`   └── Error: ${test.details.error}`);
      if (test.details.path) console.log(`   └── Missing: ${test.details.path}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`SUMMARY: ${okCount}/${tests.length} APIs functional`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Save results
  const fs = require('fs');
  const outputPath = process.env.OUTPUT_DIR || './outputs';
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const fileName = `forensic-api-test-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(`${outputPath}/${fileName}`, JSON.stringify(RESULTS, null, 2));
  console.log(`\nResults saved to: ${outputPath}/${fileName}`);

  return RESULTS;
}

main().catch(console.error);
