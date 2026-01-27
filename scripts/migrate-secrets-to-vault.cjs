#!/usr/bin/env node
/**
 * migrate-secrets-to-vault.cjs - Migrate Environment Variables to Infisical Vault
 *
 * Version: 1.0
 * Created: 2026-01-28 | Session 180+
 *
 * Usage:
 *   node scripts/migrate-secrets-to-vault.cjs --dry-run              # Preview migration
 *   node scripts/migrate-secrets-to-vault.cjs --tenant agency        # Migrate agency secrets
 *   node scripts/migrate-secrets-to-vault.cjs --from-file .env       # Migrate from .env file
 *   node scripts/migrate-secrets-to-vault.cjs --list                 # List credentials to migrate
 *
 * Features:
 *   - Reads from process.env or .env file
 *   - Categorizes secrets by service
 *   - Dry-run mode for preview
 *   - Progress reporting
 *   - Audit logging
 */

const fs = require('fs');
const path = require('path');

// Load dotenv for .env file parsing
let dotenv;
try {
  dotenv = require('dotenv');
} catch {
  // dotenv not installed, will use manual parsing
}

// Load vault after potential env changes
let vault;
function loadVault() {
  if (!vault) {
    vault = require('../automations/agency/core/SecretVault.cjs');
  }
  return vault;
}

// === CREDENTIAL CATEGORIES ===

const CREDENTIAL_CATEGORIES = {
  shopify: {
    name: 'Shopify',
    keys: ['SHOPIFY_STORE', 'SHOPIFY_ACCESS_TOKEN', 'SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'SHOPIFY_WEBHOOK_SECRET'],
    priority: 'P0',
    required: ['SHOPIFY_STORE', 'SHOPIFY_ACCESS_TOKEN']
  },
  klaviyo: {
    name: 'Klaviyo',
    keys: ['KLAVIYO_API_KEY', 'KLAVIYO_PRIVATE_KEY', 'KLAVIYO_PUBLIC_KEY'],
    priority: 'P0',
    required: ['KLAVIYO_API_KEY']
  },
  google: {
    name: 'Google',
    keys: [
      'GOOGLE_APPLICATION_CREDENTIALS',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REFRESH_TOKEN',
      'GA4_PROPERTY_ID',
      'GSC_SITE_URL'
    ],
    priority: 'P0',
    required: ['GA4_PROPERTY_ID']
  },
  hubspot: {
    name: 'HubSpot',
    keys: ['HUBSPOT_API_KEY', 'HUBSPOT_CLIENT_ID', 'HUBSPOT_CLIENT_SECRET', 'HUBSPOT_REFRESH_TOKEN'],
    priority: 'P1',
    required: ['HUBSPOT_API_KEY']
  },
  meta: {
    name: 'Meta (Facebook)',
    keys: ['META_ACCESS_TOKEN', 'META_APP_ID', 'META_APP_SECRET', 'META_PIXEL_ID'],
    priority: 'P1',
    required: ['META_ACCESS_TOKEN']
  },
  tiktok: {
    name: 'TikTok',
    keys: ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_ADVERTISER_ID', 'TIKTOK_APP_ID', 'TIKTOK_APP_SECRET'],
    priority: 'P2',
    required: ['TIKTOK_ACCESS_TOKEN']
  },
  whatsapp: {
    name: 'WhatsApp',
    keys: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'],
    priority: 'P2',
    required: ['WHATSAPP_ACCESS_TOKEN']
  },
  stripe: {
    name: 'Stripe',
    keys: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    priority: 'P1',
    required: ['STRIPE_SECRET_KEY']
  },
  ai_providers: {
    name: 'AI Providers',
    keys: [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'XAI_API_KEY',
      'GEMINI_API_KEY',
      'GOOGLE_AI_API_KEY'
    ],
    priority: 'P0',
    required: ['OPENAI_API_KEY']
  },
  elevenlabs: {
    name: 'ElevenLabs',
    keys: ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'],
    priority: 'P1',
    required: ['ELEVENLABS_API_KEY']
  },
  telnyx: {
    name: 'Telnyx',
    keys: ['TELNYX_API_KEY', 'TELNYX_PUBLIC_KEY', 'TELNYX_SIP_CONNECTION_ID'],
    priority: 'P1',
    required: ['TELNYX_API_KEY']
  },
  apify: {
    name: 'Apify',
    keys: ['APIFY_TOKEN', 'APIFY_API_TOKEN'],
    priority: 'P2',
    required: ['APIFY_TOKEN']
  },
  suppliers: {
    name: 'Suppliers',
    keys: ['CJ_API_KEY', 'BIGBUY_API_KEY', 'BIGBUY_API_SECRET'],
    priority: 'P3',
    required: []
  },
  google_ads: {
    name: 'Google Ads',
    keys: [
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_CUSTOMER_ID',
      'GOOGLE_ADS_REFRESH_TOKEN'
    ],
    priority: 'P2',
    required: ['GOOGLE_ADS_DEVELOPER_TOKEN']
  },
  wordpress: {
    name: 'WordPress',
    keys: ['WP_SITE_URL', 'WP_APP_PASSWORD', 'WP_USERNAME'],
    priority: 'P2',
    required: ['WP_SITE_URL']
  },
  infisical: {
    name: 'Infisical (Skip)',
    keys: ['INFISICAL_URL', 'INFISICAL_CLIENT_ID', 'INFISICAL_CLIENT_SECRET', 'INFISICAL_ORG_ID'],
    priority: 'SKIP',
    required: [],
    skip: true
  }
};

// === FUNCTIONS ===

function parseEnvFile(filePath) {
  const envVars = {};

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return envVars;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      let value = match[2];
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envVars[match[1]] = value;
    }
  }

  return envVars;
}

function categorizeSecrets(envVars) {
  const categorized = {
    byCategory: {},
    uncategorized: {},
    stats: {
      total: 0,
      set: 0,
      empty: 0,
      byCategory: {}
    }
  };

  // Mark all keys
  const allCategorizedKeys = new Set();
  for (const cat of Object.values(CREDENTIAL_CATEGORIES)) {
    for (const key of cat.keys) {
      allCategorizedKeys.add(key);
    }
  }

  // Categorize
  for (const [catId, catDef] of Object.entries(CREDENTIAL_CATEGORIES)) {
    if (catDef.skip) continue;

    const catSecrets = {};
    let hasValue = false;

    for (const key of catDef.keys) {
      if (envVars[key] !== undefined) {
        catSecrets[key] = envVars[key];
        if (envVars[key]) hasValue = true;
      }
    }

    if (Object.keys(catSecrets).length > 0) {
      categorized.byCategory[catId] = {
        name: catDef.name,
        priority: catDef.priority,
        secrets: catSecrets,
        hasValue
      };
      categorized.stats.byCategory[catId] = {
        total: Object.keys(catSecrets).length,
        set: Object.values(catSecrets).filter(v => v).length
      };
    }
  }

  // Uncategorized
  for (const [key, value] of Object.entries(envVars)) {
    if (!allCategorizedKeys.has(key) && !key.startsWith('INFISICAL_')) {
      categorized.uncategorized[key] = value;
    }
  }

  // Stats
  for (const cat of Object.values(categorized.byCategory)) {
    categorized.stats.total += Object.keys(cat.secrets).length;
    categorized.stats.set += Object.values(cat.secrets).filter(v => v).length;
  }
  categorized.stats.empty = categorized.stats.total - categorized.stats.set;

  return categorized;
}

function printSecretsSummary(categorized) {
  console.log('\n=== Credentials Summary ===\n');

  const priorities = ['P0', 'P1', 'P2', 'P3'];

  for (const priority of priorities) {
    const cats = Object.entries(categorized.byCategory)
      .filter(([_, cat]) => cat.priority === priority);

    if (cats.length === 0) continue;

    console.log(`\x1b[36m--- ${priority} Priority ---\x1b[0m`);

    for (const [catId, cat] of cats) {
      const setCount = Object.values(cat.secrets).filter(v => v).length;
      const totalCount = Object.keys(cat.secrets).length;
      const status = setCount === totalCount ? '\x1b[32m✅\x1b[0m' :
                     setCount > 0 ? '\x1b[33m⚠️\x1b[0m' : '\x1b[31m❌\x1b[0m';

      console.log(`  ${status} ${cat.name}: ${setCount}/${totalCount} configured`);

      for (const [key, value] of Object.entries(cat.secrets)) {
        const valueStatus = value ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
        const masked = value ? `${'*'.repeat(Math.min(value.length, 8))}...` : '(empty)';
        console.log(`      ${valueStatus} ${key}: ${masked}`);
      }
    }
    console.log('');
  }

  // Uncategorized
  if (Object.keys(categorized.uncategorized).length > 0) {
    console.log('\x1b[90m--- Uncategorized ---\x1b[0m');
    for (const [key, value] of Object.entries(categorized.uncategorized)) {
      const masked = value ? `${'*'.repeat(Math.min(value.length, 8))}...` : '(empty)';
      console.log(`  ? ${key}: ${masked}`);
    }
    console.log('');
  }

  // Summary
  console.log('=== Statistics ===');
  console.log(`Total secrets: ${categorized.stats.total}`);
  console.log(`Configured: ${categorized.stats.set} (${Math.round(categorized.stats.set / categorized.stats.total * 100)}%)`);
  console.log(`Empty: ${categorized.stats.empty}`);
}

async function migrateToVault(tenantId, categorized, options = {}) {
  const v = loadVault();
  const results = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  console.log(`\n=== Migrating to Vault: ${tenantId} ===\n`);

  // Create project if needed
  if (!options.dryRun) {
    try {
      await v.createProject(tenantId, tenantId);
      console.log(`✅ Project created/verified: ${tenantId}`);
    } catch (error) {
      console.log(`⚠️ Project creation: ${error.message}`);
    }
  }

  // Migrate by category
  for (const [catId, cat] of Object.entries(categorized.byCategory)) {
    console.log(`\n--- ${cat.name} (${cat.priority}) ---`);

    for (const [key, value] of Object.entries(cat.secrets)) {
      if (!value) {
        console.log(`  ⏭️ ${key}: skipped (empty)`);
        results.skipped++;
        continue;
      }

      if (options.dryRun) {
        console.log(`  🔍 ${key}: would migrate`);
        results.migrated++;
      } else {
        try {
          await v.setSecret(tenantId, key, value);
          console.log(`  ✅ ${key}: migrated`);
          results.migrated++;
        } catch (error) {
          console.log(`  ❌ ${key}: failed - ${error.message}`);
          results.failed++;
          results.errors.push({ key, error: error.message });
        }
      }
    }
  }

  // Summary
  console.log('\n=== Migration Results ===');
  console.log(`Migrated: ${results.migrated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);

  if (options.dryRun) {
    console.log('\n⚠️ DRY RUN - No changes made');
  }

  return results;
}

async function verifyMigration(tenantId) {
  const v = loadVault();

  console.log(`\n=== Verifying Migration: ${tenantId} ===\n`);

  const secrets = await v.getAllSecrets(tenantId);

  if (secrets.length === 0) {
    console.log('❌ No secrets found in vault');
    return false;
  }

  console.log(`Found ${secrets.length} secrets:\n`);

  for (const secret of secrets) {
    const masked = secret.value ? `${'*'.repeat(Math.min(secret.value.length, 8))}...` : '(empty)';
    console.log(`  ✅ ${secret.key}: ${masked}`);
  }

  return true;
}

// === CLI ===

async function main() {
  const args = process.argv.slice(2);

  // Load .env if exists
  const envPath = path.join(process.cwd(), '.env');
  if (dotenv && fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  // Parse arguments
  let command = '--help';
  let tenantId = 'agency';
  let envFile = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--tenant' && args[i + 1]) {
      tenantId = args[++i];
      command = '--migrate';
    } else if (arg === '--from-file' && args[i + 1]) {
      envFile = args[++i];
      command = '--migrate';
    } else if (arg === '--list') {
      command = '--list';
    } else if (arg === '--verify') {
      command = '--verify';
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        tenantId = args[++i];
      }
    } else if (arg === '--help' || arg === '-h') {
      command = '--help';
    }
  }

  // Execute command
  switch (command) {
    case '--list': {
      const envVars = envFile ? parseEnvFile(envFile) : process.env;
      const categorized = categorizeSecrets(envVars);
      printSecretsSummary(categorized);
      break;
    }

    case '--migrate': {
      const envVars = envFile ? parseEnvFile(envFile) : process.env;
      const categorized = categorizeSecrets(envVars);

      if (dryRun) {
        printSecretsSummary(categorized);
      }

      await migrateToVault(tenantId, categorized, { dryRun });
      break;
    }

    case '--verify': {
      await verifyMigration(tenantId);
      break;
    }

    default:
      console.log(`
migrate-secrets-to-vault.cjs - Migrate Environment Variables to Infisical

Usage:
  node scripts/migrate-secrets-to-vault.cjs [options]

Options:
  --list                    List all credentials and their status
  --tenant <id>             Migrate to specific tenant project (default: agency)
  --from-file <path>        Read from .env file instead of process.env
  --dry-run                 Preview migration without making changes
  --verify <tenant>         Verify secrets in vault for tenant
  --help, -h                Show this help

Examples:
  # List current credentials status
  node scripts/migrate-secrets-to-vault.cjs --list

  # Preview migration for agency
  node scripts/migrate-secrets-to-vault.cjs --tenant agency --dry-run

  # Migrate from .env file
  node scripts/migrate-secrets-to-vault.cjs --tenant agency --from-file .env

  # Verify migration
  node scripts/migrate-secrets-to-vault.cjs --verify agency

Environment Variables Required for Vault:
  INFISICAL_URL             Infisical server URL
  INFISICAL_CLIENT_ID       Machine Identity Client ID
  INFISICAL_CLIENT_SECRET   Machine Identity Client Secret
  INFISICAL_ORG_ID          Organization ID
`);
  }
}

main().catch(console.error);
