#!/usr/bin/env node
/**
 * CREATE CLIENT - Multi-Tenant Client Provisioning
 * 3A Automation - Session 180
 *
 * Usage:
 *   node scripts/create-client.cjs --name "Acme Corp" --vertical shopify --email contact@acme.com
 *   node scripts/create-client.cjs --help
 *   node scripts/create-client.cjs --list
 */

const fs = require('fs');
const path = require('path');

const CLIENTS_DIR = path.join(__dirname, '..', 'clients');
const TEMPLATE_DIR = path.join(CLIENTS_DIR, '_template');

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

// Generate tenant ID from name
function generateTenantId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

// Validate required fields
function validateInput(options) {
  const errors = [];

  if (!options.name) {
    errors.push('--name is required (e.g., --name "Acme Corp")');
  }

  if (!options.vertical) {
    errors.push('--vertical is required (shopify | b2b | agency)');
  } else if (!['shopify', 'b2b', 'agency'].includes(options.vertical)) {
    errors.push('--vertical must be one of: shopify, b2b, agency');
  }

  if (!options.email) {
    errors.push('--email is required (e.g., --email contact@acme.com)');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(options.email)) {
    errors.push('--email must be a valid email address');
  }

  return errors;
}

// Load template and create client config
function createClientConfig(options) {
  const templatePath = path.join(TEMPLATE_DIR, 'config.json');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const tenantId = options.id || generateTenantId(options.name);
  const now = new Date().toISOString();

  // Replace placeholders
  let config = template
    .replace(/\{\{TENANT_ID\}\}/g, tenantId)
    .replace(/\{\{CLIENT_NAME\}\}/g, options.name)
    .replace(/\{\{CREATED_AT\}\}/g, now)
    .replace(/\{\{CONTACT_NAME\}\}/g, options.contact || options.name)
    .replace(/\{\{CONTACT_EMAIL\}\}/g, options.email);

  // Parse and update vertical-specific defaults
  const configObj = JSON.parse(config);
  configObj.vertical = options.vertical;

  // Set vertical-specific defaults
  if (options.vertical === 'shopify') {
    configObj.features.voice_widget = true;
    configObj.features.email_automation = true;
    configObj.features.churn_prediction = true;
    configObj.integrations.shopify.enabled = true;
    configObj.integrations.klaviyo.enabled = true;
  } else if (options.vertical === 'b2b') {
    configObj.features.voice_telephony = true;
    configObj.integrations.hubspot.enabled = true;
  }

  // Set plan if provided
  if (options.plan) {
    configObj.plan = options.plan;
  }

  return { tenantId, config: configObj };
}

// Create client directory and files
function createClient(tenantId, config) {
  const clientDir = path.join(CLIENTS_DIR, tenantId);

  if (fs.existsSync(clientDir)) {
    throw new Error(`Client already exists: ${tenantId}`);
  }

  // Create directory
  fs.mkdirSync(clientDir, { recursive: true });

  // Write config
  const configPath = path.join(clientDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Create logs directory
  const logsDir = path.join(clientDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  // Create empty automation status file
  const statusPath = path.join(clientDir, 'automation-status.json');
  fs.writeFileSync(statusPath, JSON.stringify({
    tenant_id: tenantId,
    automations: {},
    last_run: null,
    created_at: new Date().toISOString()
  }, null, 2));

  return clientDir;
}

// List all clients
function listClients() {
  if (!fs.existsSync(CLIENTS_DIR)) {
    console.log('No clients directory found.');
    return [];
  }

  const entries = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true });
  const clients = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const configPath = path.join(CLIENTS_DIR, entry.name, 'config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          clients.push({
            tenant_id: entry.name,
            name: config.name,
            vertical: config.vertical,
            plan: config.plan,
            status: config.status,
            created_at: config.created_at
          });
        } catch (e) {
          console.error(`Error reading config for ${entry.name}: ${e.message}`);
        }
      }
    }
  }

  return clients;
}

// Show help
function showHelp() {
  console.log(`
CREATE CLIENT - 3A Automation Multi-Tenant Provisioning

USAGE:
  node scripts/create-client.cjs --name <name> --vertical <type> --email <email> [options]

REQUIRED:
  --name <string>       Company name (e.g., "Acme Corp")
  --vertical <type>     Client vertical: shopify | b2b | agency
  --email <string>      Primary contact email

OPTIONS:
  --id <string>         Custom tenant ID (auto-generated if not provided)
  --plan <string>       Service plan: quickwin | essentials | growth
  --contact <string>    Contact name (defaults to company name)
  --help                Show this help message
  --list                List all existing clients

EXAMPLES:
  # Create Shopify e-commerce client
  node scripts/create-client.cjs --name "Fashion Store" --vertical shopify --email contact@fashion.com

  # Create B2B client with custom plan
  node scripts/create-client.cjs --name "Tech Startup" --vertical b2b --email cto@startup.com --plan growth

  # List all clients
  node scripts/create-client.cjs --list
`);
}

// Main execution
function main() {
  const { flags, options } = parseArgs();

  // Handle help flag
  if (flags.includes('help')) {
    showHelp();
    process.exit(0);
  }

  // Handle list flag
  if (flags.includes('list')) {
    const clients = listClients();
    if (clients.length === 0) {
      console.log('No clients found.');
    } else {
      console.log('\nExisting Clients:');
      console.log('─'.repeat(80));
      console.log(
        'Tenant ID'.padEnd(25) +
        'Name'.padEnd(20) +
        'Vertical'.padEnd(12) +
        'Plan'.padEnd(12) +
        'Status'
      );
      console.log('─'.repeat(80));
      for (const client of clients) {
        console.log(
          (client.tenant_id || '').padEnd(25) +
          (client.name || '').slice(0, 18).padEnd(20) +
          (client.vertical || '').padEnd(12) +
          (client.plan || '').padEnd(12) +
          (client.status || '')
        );
      }
      console.log('─'.repeat(80));
      console.log(`Total: ${clients.length} client(s)\n`);
    }
    process.exit(0);
  }

  // Validate input
  const errors = validateInput(options);
  if (errors.length > 0) {
    console.error('\n❌ Validation errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\nRun with --help for usage information.\n');
    process.exit(1);
  }

  try {
    // Create client config
    const { tenantId, config } = createClientConfig(options);

    // Create client directory and files
    const clientDir = createClient(tenantId, config);

    console.log(`
✅ Client created successfully!

   Tenant ID:  ${tenantId}
   Name:       ${config.name}
   Vertical:   ${config.vertical}
   Plan:       ${config.plan}
   Status:     ${config.status}
   Directory:  ${clientDir}

Next steps:
   1. Configure OAuth integrations at /client/onboarding
   2. Or manually add credentials to Infisical project: ${tenantId}
   3. Enable automations in config.json

To view client config:
   cat ${path.join(clientDir, 'config.json')}
`);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
