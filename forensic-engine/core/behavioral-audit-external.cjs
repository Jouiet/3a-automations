#!/usr/bin/env node
/**
 * BEHAVIORAL FORENSIC PROBE - 3A Automation
 * Role: Detects conversational AI and chatbot vestiges in public DOM.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const args = process.argv.slice(2);
const TARGET_URL = args[0] || 'https://3a-automation.com';

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

async function auditBehavioral() {
  console.log(`\n🤖 BEHAVIORAL FORENSIC - Target: ${TARGET_URL}`);

  try {
    const html = await fetchUrl(TARGET_URL);

    const bots = [
      { name: 'Intercom', pattern: /intercom/i },
      { name: 'Crisp', pattern: /crisp/i },
      { name: 'Zendesk', pattern: /zendesk/i },
      { name: 'HubSpot', pattern: /hubspot/i },
      { name: 'Shopify Inbox', pattern: /shopify-chat/i },
      { name: 'LiveChat', pattern: /livechatinc/i },
      { name: 'Klaviyo SMS/Form', pattern: /klaviyo/i }
    ];

    console.log(`🔍 Scanning for Conversational AI widgets...`);
    let found = [];
    for (const bot of bots) {
      if (bot.pattern.test(html)) {
        found.push(bot.name);
      }
    }

    if (found.length > 0) {
      console.log(`✅ DETECTED: ${found.join(', ')}`);
    } else {
      console.log(`ℹ️  No known chatbot widgets detected in public DOM.`);
    }

    console.log(`\n✅ Behavioral Audit Complete`);
  } catch (e) {
    console.error(`❌ Behavioral Probe Failed: ${e.message}`);
  }
}

auditBehavioral();
