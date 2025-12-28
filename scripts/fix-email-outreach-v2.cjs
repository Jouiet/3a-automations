#!/usr/bin/env node
/**
 * Fix Email Outreach Workflow - Remove Respond nodes for lastNode mode
 * Session 106 - 2025-12-28
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = process.env.N8N_API_KEY;
const baseUrl = 'https://n8n.srv1168256.hstgr.cloud';

async function main() {
  // Load local workflow
  const workflowPath = path.join(__dirname, '..', 'automations/agency/n8n-workflows/email-outreach-sequence.json');
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  // Modify webhook to use lastNode mode
  const webhookNode = workflow.nodes.find(n => n.type.includes('webhook'));
  webhookNode.parameters.responseMode = 'lastNode';

  // Remove Respond to Webhook nodes
  const filteredNodes = workflow.nodes.filter(n => {
    return n.type !== 'n8n-nodes-base.respondToWebhook';
  });

  // Build clean connections (without respond nodes)
  const cleanConnections = {
    'Webhook - New Lead': {
      main: [[{ node: 'Has Email?', type: 'main', index: 0 }]]
    },
    'Has Email?': {
      main: [
        [{ node: 'Generate Personalized Emails', type: 'main', index: 0 }],
        [] // No output for false branch (no email)
      ]
    },
    'Generate Personalized Emails': {
      main: [[{ node: 'Trigger Klaviyo Flow (HTTP)', type: 'main', index: 0 }]]
    },
    'Trigger Klaviyo Flow (HTTP)': {
      main: [[{ node: 'Log Outreach (Dashboard API)', type: 'main', index: 0 }]]
    }
    // Log Outreach is the last node - no connections from it
  };

  console.log('Cleaned workflow:');
  console.log('  Nodes:', filteredNodes.map(n => n.name).join(', '));
  console.log('  Connections:', Object.keys(cleanConnections).join(' → '));

  // Delete existing Email Outreach workflow
  const listResp = await fetch(baseUrl + '/api/v1/workflows', {
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  const list = await listResp.json();
  const existing = list.data?.find(w => w.name.includes('Email Outreach'));

  if (existing) {
    await fetch(baseUrl + '/api/v1/workflows/' + existing.id, {
      method: 'DELETE',
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    console.log('Deleted old workflow:', existing.id);
  }

  // Create clean version
  const createResp = await fetch(baseUrl + '/api/v1/workflows', {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: workflow.name,
      nodes: filteredNodes,
      connections: cleanConnections,
      settings: { executionOrder: 'v1' }
    })
  });
  const created = await createResp.json();

  if (created.id) {
    console.log('Created new workflow:', created.id);

    // Activate
    await fetch(baseUrl + '/api/v1/workflows/' + created.id + '/activate', {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    console.log('Activated');

    return created.id;
  } else {
    console.error('Create failed:', JSON.stringify(created).substring(0, 300));
  }
}

main().then(id => {
  if (id) console.log('\n✅ New workflow ID:', id);
}).catch(e => console.error('Error:', e.message));
