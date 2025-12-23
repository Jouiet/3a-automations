#!/usr/bin/env node
/**
 * TEST GEMINI API - CinematicAds Prompts
 * Date: 2025-12-23
 * Version: 1.0
 *
 * Tests Gemini 2.0 Flash with CinematicAds system prompts
 */

require('dotenv').config();

const CONFIG = {
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta'
};

if (!CONFIG.apiKey) {
  console.error('❌ GEMINI_API_KEY non défini dans .env');
  process.exit(1);
}

const prompts = require('../automations-cinematicads/config/prompts.js');

async function testGemini() {
  console.log('🧪 TEST GEMINI API - CinematicAds Prompts\n');
  console.log('=' .repeat(60));

  const testPrompt = `You are a marketing automation expert for 3A Automation.
Analyze this e-commerce automation scenario and provide a brief recommendation:

Scenario: A Shopify store selling skincare products wants to:
1. Recover abandoned carts
2. Send post-purchase upsells
3. Create customer segments based on purchase history

Provide a 3-step automation recommendation in JSON format.`;

  console.log('\n📤 Sending test prompt...');
  console.log('   Model:', CONFIG.model);

  try {
    const response = await fetch(
      `${CONFIG.endpoint}/models/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: testPrompt }]
          }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('❌ API Error:', data.error.message);
      return { success: false, error: data.error.message };
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (content) {
      console.log('\n✅ GEMINI RESPONSE RECEIVED');
      console.log('=' .repeat(60));
      console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
      console.log('\n📊 Response Stats:');
      console.log('   - Characters:', content.length);
      console.log('   - Model:', CONFIG.model);
      console.log('   - Status: SUCCESS');

      return { success: true, content };
    } else {
      console.error('❌ No content in response');
      return { success: false, error: 'No content' };
    }

  } catch (error) {
    console.error('❌ Fetch Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testImagenPrompt() {
  console.log('\n\n🎨 TEST IMAGEN 4 PROMPT GENERATION\n');
  console.log('=' .repeat(60));

  const imagenPrompt = prompts.IMAGE_FUSION_PROMPT(
    'Luxury Face Serum with gold cap',
    'held by a woman in a minimalist bathroom with natural morning light',
    '9:16'
  );

  console.log('Generated Imagen 4 Prompt:');
  console.log('-'.repeat(60));
  console.log(imagenPrompt);
  console.log('-'.repeat(60));
  console.log('✅ Word count:', imagenPrompt.split(/\s+/).length);

  return { success: true, prompt: imagenPrompt };
}

async function testVeoPrompt() {
  console.log('\n\n🎬 TEST VEO 3 PROMPT GENERATION\n');
  console.log('=' .repeat(60));

  const veoPrompt = prompts.VIDEO_GENERATION_PROMPT(
    'Premium Wireless Headphones',
    'Sony product advertisement aesthetic',
    10
  );

  console.log('Generated Veo 3 Prompt:');
  console.log('-'.repeat(60));
  console.log(veoPrompt);
  console.log('-'.repeat(60));

  const wordCount = veoPrompt.split(/\s+/).length;
  console.log('✅ Word count:', wordCount);
  console.log(wordCount >= 100 && wordCount <= 200
    ? '✅ Within optimal range (100-200 words)'
    : '⚠️ Outside optimal range');

  return { success: true, prompt: veoPrompt, wordCount };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CINEMATICADS PROMPTS TEST - GEMINI 2.0 FLASH          ║');
  console.log('║     Date: 2025-12-23 | Version: 1.0                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results = {
    gemini: await testGemini(),
    imagen: await testImagenPrompt(),
    veo: await testVeoPrompt()
  };

  console.log('\n\n📋 FINAL RESULTS');
  console.log('=' .repeat(60));
  console.log('Gemini API:', results.gemini.success ? '✅ PASS' : '❌ FAIL');
  console.log('Imagen Prompt:', results.imagen.success ? '✅ PASS' : '❌ FAIL');
  console.log('Veo Prompt:', results.veo.success ? '✅ PASS' : '❌ FAIL');

  const allPassed = results.gemini.success && results.imagen.success && results.veo.success;
  console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'));

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
