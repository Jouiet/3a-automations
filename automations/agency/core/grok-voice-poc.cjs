#!/usr/bin/env node
/**
 * 3A Automation - Grok Voice Agent POC (Node.js)
 * Version: 1.0
 * Created: 2025-12-19
 *
 * POC for xAI Grok Voice Agent API integration using WebSocket.
 * OpenAI Realtime API compatible.
 *
 * PRICING: $0.05/min (cheapest in market)
 * LATENCY: <1 second time-to-first-audio
 * LANGUAGES: 100+ with native accents
 *
 * Usage:
 *     node grok-voice-poc.cjs         # Show info
 *     node grok-voice-poc.cjs test    # Test API connection
 *     node grok-voice-poc.cjs chat    # Text chat mode
 *
 * Configuration:
 *     Set XAI_API_KEY in .env file
 *     Get key from: https://console.x.ai/api-keys
 *
 * For full voice integration:
 *     See Python version with LiveKit: grok-voice-poc.py
 */

const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Configuration
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';
const VOICE = process.env.GROK_VOICE || 'Sal';

// 3A Automation Voice System Prompt
const VOICE_SYSTEM_PROMPT = `Tu es l'assistant vocal IA de 3A Automation.

IDENTITE:
- Consultant solo en Automation, Analytics et AI
- Site: 3a-automation.com
- Langues: Francais, Anglais, Arabe

EXPERTISE:
- Email automation (Klaviyo)
- Analytics (GA4, dashboards)
- E-commerce (Shopify)
- Integrations API

OFFRE GRATUITE: Audit e-commerce complet

STYLE VOCAL:
- Reponses courtes et naturelles
- Maximum 2-3 phrases par reponse
- Ton professionnel mais accessible
- Pas de jargon technique excessif
- Propose toujours l'audit gratuit comme prochaine etape

SI QUESTION PRIX:
- Packs Setup: 390 a 1490 euros
- Retainers: 290 a 890 euros par mois
- Audit gratuit disponible pour commencer

NE PAS:
- Faire de promesses non verifiees
- Donner des estimations de temps
- S'engager sur des resultats specifiques`;

/**
 * Print POC information
 */
function printInfo() {
  console.log('\n' + '='.repeat(60));
  console.log('3A AUTOMATION - GROK VOICE AGENT POC');
  console.log('='.repeat(60));
  console.log('\nXAI GROK VOICE API FACTS:');
  console.log('-'.repeat(40));
  console.log('Pricing:    $0.05/minute (industry cheapest)');
  console.log('Latency:    <1 second time-to-first-audio');
  console.log('Languages:  100+ with native accents');
  console.log('Benchmark:  #1 Big Bench Audio');
  console.log('-'.repeat(40));
  console.log('\nAVAILABLE VOICES:');
  console.log('  - Sal (default)');
  console.log('  - Rex');
  console.log('  - Eve');
  console.log('  - Leo');
  console.log('  - Mika');
  console.log('  - Valentin');
  console.log('-'.repeat(40));
  console.log('\nFEATURES:');
  console.log('  - Full-duplex WebSocket (talk while AI speaks)');
  console.log('  - Barge-in support (interrupt naturally)');
  console.log('  - Auto language detection');
  console.log('  - Real-time tool calling');
  console.log('  - X and web search integration');
  console.log('='.repeat(60));
}

/**
 * Check API key configuration
 */
function checkApiKey() {
  if (!XAI_API_KEY) {
    console.log('\n' + '='.repeat(60));
    console.log('ERROR: XAI_API_KEY not configured');
    console.log('='.repeat(60));
    console.log('\nTo configure:');
    console.log('1. Go to https://console.x.ai/api-keys');
    console.log('2. Create a new API key');
    console.log('3. Add to .env: XAI_API_KEY=your_key_here');
    console.log('\nNote: Requires $5 minimum credit to activate');
    console.log('='.repeat(60));
    return false;
  }

  const masked = XAI_API_KEY.slice(0, 8) + '...' + XAI_API_KEY.slice(-4);
  console.log(`XAI_API_KEY: ${masked}`);
  return true;
}

/**
 * Call xAI Chat API
 */
async function chatCompletion(userMessage) {
  try {
    const response = await fetch(XAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: VOICE_SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 200  // Short responses for voice
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw new Error(`Chat error: ${error.message}`);
  }
}

/**
 * Test API connection
 */
async function testConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('GROK VOICE POC - API Test');
  console.log('='.repeat(60));
  console.log(`Voice: ${VOICE}`);
  console.log('-'.repeat(40));
  console.log('\nTesting xAI API connection...');

  try {
    const response = await chatCompletion('Bonjour, presente-toi brievement.');

    console.log('\n3A Voice Assistant:');
    console.log(response);
    console.log('\n' + '='.repeat(60));
    console.log('API CONNECTION: OK');
    console.log('Ready for voice integration!');
    console.log('='.repeat(60));
    return true;
  } catch (error) {
    console.log(`\nError: ${error.message}`);
    console.log('\n' + '='.repeat(60));
    console.log('API CONNECTION: FAILED');
    console.log('='.repeat(60));
    return false;
  }
}

/**
 * Interactive text chat (simulates voice)
 */
async function textChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n' + '='.repeat(60));
  console.log('GROK VOICE POC - Text Chat Mode');
  console.log('='.repeat(60));
  console.log(`Voice: ${VOICE}`);
  console.log('(Simulates voice responses in text)');
  console.log("Type 'quit' to exit");
  console.log('-'.repeat(60));

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  // Initial greeting
  try {
    const greeting = await chatCompletion('Salue-moi et propose ton aide.');
    console.log(`\n3A Voice: ${greeting}`);
  } catch (error) {
    console.log(`\nError: ${error.message}`);
  }

  while (true) {
    try {
      const input = (await question('\nYou: ')).trim();

      if (!input) continue;
      if (input.toLowerCase() === 'quit') {
        console.log('\nAu revoir!');
        rl.close();
        break;
      }

      console.log('\n(processing...)');
      const response = await chatCompletion(input);
      console.log(`\n3A Voice: ${response}`);

    } catch (error) {
      if (error.message === 'readline was closed') break;
      console.log(`\nError: ${error.message}`);
    }
  }
}

/**
 * Print usage
 */
function printUsage() {
  console.log('\nUSAGE:');
  console.log('-'.repeat(40));
  console.log('node grok-voice-poc.cjs         # Show this info');
  console.log('node grok-voice-poc.cjs test    # Test API connection');
  console.log('node grok-voice-poc.cjs chat    # Text chat mode');
  console.log('-'.repeat(40));
  console.log('\nFor full voice integration, use Python version:');
  console.log('python3 grok-voice-poc.py server');
  console.log('\nNEXT STEPS:');
  console.log('1. Run "test" to verify API connection');
  console.log('2. Run "chat" to test conversation flow');
  console.log('3. Use Python version for real voice');
  console.log('4. Deploy on VPS with LiveKit for production');
}

/**
 * Main entry point
 */
async function main() {
  printInfo();

  if (!checkApiKey()) {
    process.exit(1);
  }

  const mode = process.argv[2] || 'info';

  switch (mode) {
    case 'test':
      const success = await testConnection();
      process.exit(success ? 0 : 1);
      break;

    case 'chat':
      await textChat();
      break;

    default:
      printUsage();
  }
}

// Export for module use
module.exports = {
  chatCompletion,
  VOICE_SYSTEM_PROMPT
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
