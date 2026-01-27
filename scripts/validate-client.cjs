#!/usr/bin/env node
/**
 * VALIDATE CLIENT - Multi-Tenant Client Configuration Validator
 * 3A Automation - Session 180
 *
 * Usage:
 *   node scripts/validate-client.cjs --tenant test-corp
 *   node scripts/validate-client.cjs --all
 */

const fs = require('fs');
const path = require('path');

const CLIENTS_DIR = path.join(__dirname, '..', 'clients');

// Required fields in config.json
const REQUIRED_FIELDS = [
  'tenant_id',
  'name',
  'vertical',
  'plan',
  'status',
  'created_at',
  'features',
  'integrations',
  'contacts',
  'voice_config',
  'billing'
];

// Valid values
const VALID_VERTICALS = ['shopify', 'b2b', 'agency'];
const VALID_PLANS = ['quickwin', 'essentials', 'growth'];
const VALID_STATUSES = ['onboarding', 'active', 'suspended', 'churned'];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { flags: [], options: {} };

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        parsed.options[key] = args[i + 1];
        i++;
      } else {
        parsed.flags.push(key);
      }
    }
  }

  return parsed;
}

// Validate a single client config
function validateClient(tenantId) {
  const configPath = path.join(CLIENTS_DIR, tenantId, 'config.json');
  const errors = [];
  const warnings = [];

  // Check directory exists
  if (!fs.existsSync(path.join(CLIENTS_DIR, tenantId))) {
    return { valid: false, errors: [`Client directory not found: ${tenantId}`], warnings: [] };
  }

  // Check config.json exists
  if (!fs.existsSync(configPath)) {
    return { valid: false, errors: [`config.json not found for ${tenantId}`], warnings: [] };
  }

  // Parse config
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    return { valid: false, errors: [`Invalid JSON in config.json: ${e.message}`], warnings: [] };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate tenant_id matches directory
  if (config.tenant_id !== tenantId) {
    errors.push(`tenant_id mismatch: config says '${config.tenant_id}', directory is '${tenantId}'`);
  }

  // Validate vertical
  if (config.vertical && !VALID_VERTICALS.includes(config.vertical)) {
    errors.push(`Invalid vertical: '${config.vertical}'. Must be one of: ${VALID_VERTICALS.join(', ')}`);
  }

  // Validate plan
  if (config.plan && !VALID_PLANS.includes(config.plan)) {
    errors.push(`Invalid plan: '${config.plan}'. Must be one of: ${VALID_PLANS.join(', ')}`);
  }

  // Validate status
  if (config.status && !VALID_STATUSES.includes(config.status)) {
    errors.push(`Invalid status: '${config.status}'. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Validate created_at is valid date
  if (config.created_at && isNaN(Date.parse(config.created_at))) {
    errors.push(`Invalid created_at: '${config.created_at}'. Must be ISO 8601 format.`);
  }

  // Validate contacts
  if (config.contacts) {
    if (!config.contacts.primary) {
      errors.push('Missing contacts.primary');
    } else {
      if (!config.contacts.primary.email) {
        errors.push('Missing contacts.primary.email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contacts.primary.email)) {
        errors.push(`Invalid email format: ${config.contacts.primary.email}`);
      }
    }
  }

  // Validate features are booleans
  if (config.features) {
    for (const [key, value] of Object.entries(config.features)) {
      if (typeof value !== 'boolean') {
        warnings.push(`features.${key} should be boolean, got ${typeof value}`);
      }
    }
  }

  // Check for integrations without credentials (warnings)
  if (config.integrations) {
    for (const [integration, settings] of Object.entries(config.integrations)) {
      if (settings && settings.enabled && !settings.connected_at) {
        warnings.push(`${integration} is enabled but not connected (no connected_at)`);
      }
    }
  }

  // Check logs directory exists
  const logsDir = path.join(CLIENTS_DIR, tenantId, 'logs');
  if (!fs.existsSync(logsDir)) {
    warnings.push('logs directory not found');
  }

  // Check automation-status.json exists
  const statusPath = path.join(CLIENTS_DIR, tenantId, 'automation-status.json');
  if (!fs.existsSync(statusPath)) {
    warnings.push('automation-status.json not found');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config: errors.length === 0 ? config : null
  };
}

// Get all client tenant IDs
function getAllTenantIds() {
  if (!fs.existsSync(CLIENTS_DIR)) {
    return [];
  }

  return fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
    .map(entry => entry.name);
}

// Main execution
function main() {
  const { flags, options } = parseArgs();

  if (flags.includes('help')) {
    console.log(`
VALIDATE CLIENT - 3A Automation Configuration Validator

USAGE:
  node scripts/validate-client.cjs --tenant <tenant_id>
  node scripts/validate-client.cjs --all

OPTIONS:
  --tenant <id>    Validate a specific client
  --all            Validate all clients
  --help           Show this help message
`);
    process.exit(0);
  }

  let tenants = [];

  if (flags.includes('all')) {
    tenants = getAllTenantIds();
    if (tenants.length === 0) {
      console.log('No clients found.');
      process.exit(0);
    }
  } else if (options.tenant) {
    tenants = [options.tenant];
  } else {
    console.error('Error: Must specify --tenant <id> or --all');
    process.exit(1);
  }

  let allValid = true;
  const results = [];

  for (const tenantId of tenants) {
    const result = validateClient(tenantId);
    results.push({ tenantId, ...result });

    if (!result.valid) {
      allValid = false;
    }
  }

  // Display results
  console.log('\nValidation Results');
  console.log('═'.repeat(60));

  for (const result of results) {
    const status = result.valid ? '✅' : '❌';
    console.log(`\n${status} ${result.tenantId}`);

    if (result.errors.length > 0) {
      console.log('   Errors:');
      result.errors.forEach(e => console.log(`     ❌ ${e}`));
    }

    if (result.warnings.length > 0) {
      console.log('   Warnings:');
      result.warnings.forEach(w => console.log(`     ⚠️  ${w}`));
    }

    if (result.valid && result.warnings.length === 0) {
      console.log('   All checks passed');
    }
  }

  console.log('\n' + '═'.repeat(60));
  const validCount = results.filter(r => r.valid).length;
  console.log(`Total: ${validCount}/${results.length} valid\n`);

  process.exit(allValid ? 0 : 1);
}

main();
