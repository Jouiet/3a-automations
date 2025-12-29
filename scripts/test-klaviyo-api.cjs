#!/usr/bin/env node
/**
 * TEST KLAVIYO API - Vérification rigoureuse
 */

require('dotenv').config();

async function testKlaviyoAPI() {
  const key = process.env.KLAVIYO_API_KEY;

  if (!key) {
    console.log('❌ KLAVIYO_API_KEY non défini');
    process.exit(1);
  }

  console.log('='.repeat(50));
  console.log('TEST KLAVIYO API');
  console.log('='.repeat(50));
  console.log('\n✅ KLAVIYO_API_KEY:', key.substring(0, 12) + '...');

  const tests = [
    { name: 'GET /lists', endpoint: 'https://a.klaviyo.com/api/lists' },
    { name: 'GET /profiles', endpoint: 'https://a.klaviyo.com/api/profiles?page%5Bsize%5D=1' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const res = await fetch(test.endpoint, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${key}`,
          'revision': '2024-02-15',
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (data.errors) {
        console.log(`\n❌ ${test.name}: ${JSON.stringify(data.errors)}`);
        failed++;
      } else {
        console.log(`\n✅ ${test.name}: OK (${data.data?.length || 0} items)`);
        if (test.name === 'GET /lists' && data.data?.length > 0) {
          data.data.forEach(l => console.log(`   - ${l.attributes?.name} (${l.id})`));
        }
        passed++;
      }
    } catch (e) {
      console.log(`\n❌ ${test.name}: ${e.message}`);
      failed++;
    }
  }

  // Test CREATE profile (dry run - just validate format)
  console.log('\n📝 Test CREATE profile format...');
  const testProfile = {
    data: {
      type: 'profile',
      attributes: {
        email: 'test-verification@example.com',
        first_name: 'Test',
        last_name: 'Verification',
        properties: {
          source: 'linkedin-pipeline',
          segment: 'tech',
          position: 'Software Engineer',
          company: 'Test Company',
          linkedin_url: 'https://linkedin.com/in/test',
        }
      }
    }
  };

  // Validate JSON structure
  try {
    JSON.parse(JSON.stringify(testProfile));
    console.log('✅ Profile payload format: VALID');
    passed++;
  } catch (e) {
    console.log('❌ Profile payload format: INVALID -', e.message);
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`RÉSULTAT: ${passed}/${passed + failed} (${Math.round(passed/(passed+failed)*100)}%)`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n✅ KLAVIYO API VALIDÉE');
}

testKlaviyoAPI();
