#!/usr/bin/env node
/**
 * 3A Automation - Booking System Setup
 * Configures n8n workflow and Google Calendar integration
 *
 * @version 1.0.0
 * @date 2025-12-20
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const N8N_URL = process.env.N8N_URL || 'https://n8n.srv1168256.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function checkN8nStatus() {
  console.log('1. Checking n8n server status...');
  try {
    const response = await fetch(N8N_URL);
    if (response.ok) {
      console.log('   ✅ n8n server is running');
      return true;
    }
  } catch (error) {
    console.log('   ❌ n8n server not reachable:', error.message);
  }
  return false;
}

async function importWorkflow() {
  console.log('\n2. Importing booking workflow...');

  if (!N8N_API_KEY) {
    console.log('   ⚠️  N8N_API_KEY not set in .env');
    console.log('   Manual import required:');
    console.log(`   1. Open ${N8N_URL}`);
    console.log('   2. Go to Workflows > Import from File');
    console.log('   3. Select: automations/agency/core/n8n-booking-workflow.json');
    return false;
  }

  const workflowPath = path.join(__dirname, 'n8n-booking-workflow.json');
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  try {
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflow)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Workflow imported successfully');
      console.log(`   ID: ${result.id}`);
      return result.id;
    } else {
      const error = await response.text();
      console.log('   ❌ Import failed:', error);
    }
  } catch (error) {
    console.log('   ❌ Import error:', error.message);
  }
  return false;
}

function checkGoogleCredentials() {
  console.log('\n3. Checking Google Calendar credentials...');

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credPath) {
    console.log('   ❌ GOOGLE_APPLICATION_CREDENTIALS not set');
    return false;
  }

  if (!fs.existsSync(credPath)) {
    console.log(`   ❌ Credentials file not found: ${credPath}`);
    return false;
  }

  try {
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    console.log('   ✅ Service account found');
    console.log(`   Email: ${creds.client_email}`);
    console.log(`   Project: ${creds.project_id}`);
    return true;
  } catch (error) {
    console.log('   ❌ Invalid credentials file:', error.message);
    return false;
  }
}

function printWebhookUrls() {
  console.log('\n4. Webhook URLs:');
  console.log(`   Book meeting:    ${N8N_URL}/webhook/booking`);
  console.log(`   Get availability: ${N8N_URL}/webhook/availability`);
}

function printNextSteps() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('NEXT STEPS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('1. Configure Google Calendar in n8n:');
  console.log(`   - Open ${N8N_URL}`);
  console.log('   - Go to Credentials > Add Credential');
  console.log('   - Select "Google Calendar OAuth2 API"');
  console.log('   - Follow OAuth flow to connect your Google account\n');

  console.log('2. Activate the workflow:');
  console.log('   - Open the "3A Automation - Booking System" workflow');
  console.log('   - Click "Active" toggle in top right\n');

  console.log('3. Test the booking:');
  console.log(`   - Visit https://3a-automation.com/booking.html`);
  console.log('   - Select a date and time');
  console.log('   - Fill in test details');
  console.log('   - Submit and verify calendar event is created\n');

  console.log('4. Share your calendar with service account (optional):');
  console.log('   - Go to Google Calendar > Settings');
  console.log('   - Find your calendar > Share with specific people');
  console.log('   - Add: id-a-automation-service@a-automation-agency.iam.gserviceaccount.com');
  console.log('   - Permission: "Make changes to events"\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       3A AUTOMATION - BOOKING SYSTEM SETUP');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const n8nOk = await checkN8nStatus();
  const workflowId = await importWorkflow();
  const googleOk = checkGoogleCredentials();
  printWebhookUrls();
  printNextSteps();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY:');
  console.log(`   n8n Server:       ${n8nOk ? '✅' : '❌'}`);
  console.log(`   Workflow Import:  ${workflowId ? '✅' : '⚠️ Manual'}`);
  console.log(`   Google Creds:     ${googleOk ? '✅' : '❌'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
