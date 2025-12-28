#!/usr/bin/env node
/**
 * Deploy n8n Workflows to VPS
 * @version 1.0.0
 * @date 2025-12-23
 *
 * Prerequisites:
 * 1. Generate API key at: https://n8n.srv1168256.hstgr.cloud/settings/api
 * 2. Add to .env: N8N_API_KEY=your-api-key
 * 3. Run: node scripts/deploy-n8n-workflows.cjs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CONFIG = {
  N8N_URL: 'https://n8n.srv1168256.hstgr.cloud',
  API_KEY: process.env.N8N_API_KEY,
  WORKFLOWS_DIR: path.join(__dirname, '..', 'automations', 'agency', 'n8n-workflows')
};

async function deployWorkflows() {
  console.log('🚀 n8n Workflow Deployment\n');

  // Validate API key
  if (!CONFIG.API_KEY) {
    console.error('❌ N8N_API_KEY not set in .env');
    console.log('\n📋 Setup instructions:');
    console.log('1. Go to: https://n8n.srv1168256.hstgr.cloud/settings/api');
    console.log('2. Create new API key');
    console.log('3. Add to .env: N8N_API_KEY=your-key');
    console.log('4. Re-run this script');
    process.exit(1);
  }

  // Get workflow files
  const workflowFiles = fs.readdirSync(CONFIG.WORKFLOWS_DIR)
    .filter(f => f.endsWith('.json'));

  console.log(`📁 Found ${workflowFiles.length} workflows:\n`);
  workflowFiles.forEach(f => console.log(`   - ${f}`));
  console.log('');

  const results = [];

  for (const file of workflowFiles) {
    const filePath = path.join(CONFIG.WORKFLOWS_DIR, file);
    const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    try {
      // Check if workflow exists
      const checkResponse = await fetch(`${CONFIG.N8N_URL}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': CONFIG.API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!checkResponse.ok) {
        throw new Error(`API error: ${checkResponse.status}`);
      }

      const existingWorkflows = await checkResponse.json();
      const existing = existingWorkflows.data?.find(w => w.name === workflow.name);

      let response;
      if (existing) {
        // Update existing workflow using PUT
        // n8n API requires PUT for updates, not PATCH
        const updatePayload = {
          ...workflow,
          id: existing.id,
          active: existing.active  // Preserve active state
        };
        delete updatePayload.meta;  // Remove meta field that causes issues

        response = await fetch(`${CONFIG.N8N_URL}/api/v1/workflows/${existing.id}`, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': CONFIG.API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
      } else {
        // Create new workflow
        const createPayload = { ...workflow };
        delete createPayload.meta;  // Remove meta field that causes issues

        response = await fetch(`${CONFIG.N8N_URL}/api/v1/workflows`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': CONFIG.API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        });
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Deploy failed: ${error}`);
      }

      const result = await response.json();
      console.log(`✅ ${file} - ${existing ? 'Updated' : 'Created'} (ID: ${result.id || result.data?.id})`);
      results.push({ file, status: 'success', action: existing ? 'updated' : 'created' });

    } catch (error) {
      console.error(`❌ ${file} - ${error.message}`);
      results.push({ file, status: 'failed', error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 DEPLOYMENT SUMMARY\n');
  const success = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log(`   📁 Total:   ${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️ Some workflows failed. Check errors above.');
    process.exit(1);
  }

  console.log('\n✅ All workflows deployed successfully!');
  console.log(`\n🔗 Manage at: ${CONFIG.N8N_URL}/workflows`);
}

deployWorkflows().catch(console.error);
