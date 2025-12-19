#!/usr/bin/env node
/**
 * Henderson Shop - Verify Apify Schedulers Status
 * Session 102+ - Manual Task Verification
 *
 * Purpose: Check if 3 Apify schedulers are ENABLED or PAUSED
 * Critical: 0 leads/day if paused, 20-30 leads/day if enabled
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN not found in .env.local');
  console.log('');
  console.log('Manual check required:');
  console.log('1. Go to: https://console.apify.com/schedules');
  console.log('2. Check status of 3 schedulers:');
  console.log('   - pre-launch-morning---google-maps-emails');
  console.log('   - pre-launch-afternoon---g-maps-emails');
  console.log('   - pre-launch-evening---google-maps-emails');
  console.log('3. If PAUSED: Click "Enable" on each');
  console.log('');
  console.log('Expected impact: 600-900 leads/month (20-30/day)');
  process.exit(1);
}

async function fetchSchedulers() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.apify.com',
      path: `/v2/schedules?token=${APIFY_TOKEN}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API Error: ${res.statusCode} ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 Henderson Shop - Apify Schedulers Verification');
  console.log('═'.repeat(70));
  console.log('');

  try {
    console.log('📊 Fetching schedulers from Apify...');
    const response = await fetchSchedulers();
    const schedulers = response.data.items;

    console.log(`✅ Found ${schedulers.length} schedulers\n`);

    const results = {
      total: schedulers.length,
      enabled: 0,
      paused: 0,
      henderson: [],
      other: []
    };

    schedulers.forEach(s => {
      const isHenderson = s.name.includes('pre-launch') || s.name.includes('google-maps');

      if (s.isEnabled) {
        results.enabled++;
      } else {
        results.paused++;
      }

      const schedulerInfo = {
        name: s.name,
        id: s.id,
        status: s.isEnabled ? 'ENABLED' : 'PAUSED',
        cron: s.cronExpression,
        nextRun: s.nextRun
      };

      if (isHenderson) {
        results.henderson.push(schedulerInfo);
      } else {
        results.other.push(schedulerInfo);
      }
    });

    // Report Henderson schedulers
    console.log('🎯 HENDERSON PRE-LAUNCH SCHEDULERS:');
    console.log('═'.repeat(70));

    if (results.henderson.length === 0) {
      console.log('❌ NO HENDERSON SCHEDULERS FOUND');
      console.log('');
      console.log('Expected 3 schedulers:');
      console.log('  - pre-launch-morning---google-maps-emails');
      console.log('  - pre-launch-afternoon---g-maps-emails');
      console.log('  - pre-launch-evening---google-maps-emails');
    } else {
      results.henderson.forEach((s, i) => {
        const icon = s.status === 'ENABLED' ? '✅' : '❌';
        console.log(`\n${i + 1}. ${icon} ${s.name}`);
        console.log(`   Status: ${s.status}`);
        console.log(`   Cron: ${s.cron}`);
        if (s.nextRun) {
          console.log(`   Next run: ${new Date(s.nextRun).toISOString()}`);
        }
      });
    }

    // Summary
    console.log('\n═'.repeat(70));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(70));
    console.log(`Total schedulers: ${results.total}`);
    console.log(`✅ Enabled: ${results.enabled}`);
    console.log(`❌ Paused: ${results.paused}`);
    console.log(`🎯 Henderson schedulers: ${results.henderson.length}`);

    const hendersonEnabled = results.henderson.filter(s => s.status === 'ENABLED').length;
    const hendersonPaused = results.henderson.filter(s => s.status === 'PAUSED').length;

    console.log(`   └─ Enabled: ${hendersonEnabled}`);
    console.log(`   └─ Paused: ${hendersonPaused}`);

    // Lead generation impact
    console.log('\n📈 LEAD GENERATION IMPACT:');
    if (hendersonEnabled === 0) {
      console.log('❌ CRITICAL: 0 leads/day (all schedulers paused)');
      console.log('   Expected: 20-30 leads/day (600-900/month)');
      console.log('   Loss: ~$15,000-25,000/year in lost opportunities');
    } else if (hendersonEnabled < 3) {
      console.log(`⚠️  PARTIAL: ~${hendersonEnabled * 10} leads/day (${hendersonEnabled}/3 enabled)`);
      console.log(`   Expected: 20-30 leads/day with all 3 enabled`);
    } else {
      console.log('✅ OPTIMAL: 20-30 leads/day (all schedulers enabled)');
      console.log('   Expected: 600-900 leads/month');
    }

    // Action required
    if (hendersonPaused > 0) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log('═'.repeat(70));
      console.log('1. Go to: https://console.apify.com/schedules');
      console.log('2. Enable paused schedulers:');
      results.henderson.filter(s => s.status === 'PAUSED').forEach(s => {
        console.log(`   - ${s.name}`);
      });
      console.log('3. Verify schedulers run successfully');
      console.log('4. Check Google Sheets for new leads');
    }

    // Save results
    const fs = require('fs');
    fs.writeFileSync('verify-apify-schedulers-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Full results saved to: verify-apify-schedulers-results.json');

    process.exit(hendersonPaused > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.log('');
    console.log('Manual check required:');
    console.log('https://console.apify.com/schedules');
    process.exit(1);
  }
}

main();
