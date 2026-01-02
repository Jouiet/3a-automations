#!/usr/bin/env node
/**
 * Fix Email Outreach Workflow on n8n
 * Session 105 - Fix responseMode configuration
 */

require('dotenv').config();
const fs = require('fs');

const CONFIG = {
  N8N_URL: 'https://n8n.srv1168256.hstgr.cloud',
  API_KEY: process.env.N8N_API_KEY
};

async function fixEmailOutreach() {
  console.log('🔧 Fixing Email Outreach Workflow\n');

  // Read local workflow
  const workflow = JSON.parse(fs.readFileSync(
    '/Users/mac/Desktop/JO-AAA/automations/agency/n8n-workflows/email-outreach-sequence.json',
    'utf8'
  ));

  // Get existing workflow
  const listRes = await fetch(CONFIG.N8N_URL + '/api/v1/workflows', {
    headers: { 'X-N8N-API-KEY': CONFIG.API_KEY }
  });
  const workflows = await listRes.json();
  const existing = workflows.data.find(function(w) { return w.name === workflow.name; });

  if (!existing) {
    console.log('❌ Workflow not found on n8n');
    return;
  }

  console.log('📋 Found workflow: ' + existing.id);
  console.log('   Active: ' + existing.active);

  // Prepare update payload - only allowed fields
  var updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  // Update using PUT
  var updateRes = await fetch(CONFIG.N8N_URL + '/api/v1/workflows/' + existing.id, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': CONFIG.API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!updateRes.ok) {
    var error = await updateRes.text();
    console.log('❌ Update failed: ' + error);
    return;
  }

  console.log('✅ Workflow updated successfully');

  // Activate if needed
  if (!existing.active) {
    var activateRes = await fetch(CONFIG.N8N_URL + '/api/v1/workflows/' + existing.id + '/activate', {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': CONFIG.API_KEY }
    });
    if (activateRes.ok) {
      console.log('   Activation: ✅');
    } else {
      console.log('   Activation: ❌');
    }
  }
}

fixEmailOutreach().catch(console.error);
