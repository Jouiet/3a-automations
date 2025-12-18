#!/usr/bin/env node
/**
 * VALIDATE ALL AUTOMATIONS
 * Purpose: Batch validation of all 41 generic automations
 * Method: Check syntax, required env vars, and structure
 *
 * Usage: node automations/generic/validate-all-automations.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUTOMATIONS_DIR = path.join(__dirname, '..');
const RESULTS = {
  total: 0,
  valid: 0,
  syntaxErrors: [],
  missingEnv: [],
  warnings: []
};

console.log('================================================================================');
console.log('AUTOMATION VALIDATION - 3A AUTOMATION');
console.log('================================================================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================================\n');

/**
 * Find all automation files
 */
function findAutomations(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'legacy-client-specific') {
      files.push(...findAutomations(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.cjs') || entry.name.endsWith('.js'))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check syntax of a file
 */
function checkSyntax(filePath) {
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Extract required environment variables from file
 */
function extractEnvVars(content) {
  const envVars = new Set();

  // Match process.env.VAR_NAME patterns
  const matches = content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
  for (const match of matches) {
    envVars.add(match[1]);
  }

  return Array.from(envVars);
}

/**
 * Check for hardcoded credentials
 */
function checkHardcoding(content) {
  const issues = [];

  // Check for hardcoded Shopify domains
  if (/['"][a-z0-9-]+\.myshopify\.com['"]/.test(content) && !/REPLACE|process\.env/.test(content)) {
    issues.push('Hardcoded Shopify domain detected');
  }

  // Check for hardcoded API tokens
  if (/shpat_[a-zA-Z0-9]+/.test(content) && !/REPLACE|process\.env/.test(content)) {
    issues.push('Hardcoded Shopify token detected');
  }

  if (/pk_[a-zA-Z0-9]+/.test(content) && !/REPLACE|process\.env/.test(content)) {
    issues.push('Hardcoded Klaviyo key detected');
  }

  if (/apify_api_[a-zA-Z0-9]+/.test(content) && !/REPLACE|process\.env/.test(content)) {
    issues.push('Hardcoded Apify token detected');
  }

  return issues;
}

/**
 * Validate a single automation
 */
function validateAutomation(filePath) {
  const relativePath = path.relative(AUTOMATIONS_DIR, filePath);
  const result = {
    file: relativePath,
    syntax: false,
    envVars: [],
    hardcoding: [],
    valid: false
  };

  // Check syntax
  const syntaxCheck = checkSyntax(filePath);
  result.syntax = syntaxCheck.valid;
  if (!syntaxCheck.valid) {
    result.syntaxError = syntaxCheck.error;
  }

  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract env vars
  result.envVars = extractEnvVars(content);

  // Check hardcoding
  result.hardcoding = checkHardcoding(content);

  // Overall validation
  result.valid = result.syntax && result.hardcoding.length === 0;

  return result;
}

// Main execution
const automations = findAutomations(AUTOMATIONS_DIR);
RESULTS.total = automations.length;

console.log(`Found ${automations.length} automations to validate\n`);

const byCategory = {};

for (const filePath of automations) {
  const result = validateAutomation(filePath);
  const category = path.dirname(result.file).split('/')[0] || 'root';

  if (!byCategory[category]) {
    byCategory[category] = { valid: 0, invalid: 0, files: [] };
  }

  if (result.valid) {
    RESULTS.valid++;
    byCategory[category].valid++;
    console.log(`✅ ${result.file}`);
  } else {
    byCategory[category].invalid++;
    console.log(`❌ ${result.file}`);

    if (!result.syntax) {
      RESULTS.syntaxErrors.push({ file: result.file, error: result.syntaxError });
      console.log(`   └── Syntax error`);
    }

    if (result.hardcoding.length > 0) {
      for (const issue of result.hardcoding) {
        console.log(`   └── ${issue}`);
      }
    }
  }

  if (result.envVars.length > 0) {
    byCategory[category].files.push({ file: result.file, envVars: result.envVars });
  }
}

console.log('\n================================================================================');
console.log('VALIDATION SUMMARY');
console.log('================================================================================\n');

console.log('BY CATEGORY:');
for (const [category, stats] of Object.entries(byCategory)) {
  const total = stats.valid + stats.invalid;
  const icon = stats.invalid === 0 ? '✅' : '⚠️';
  console.log(`${icon} ${category}: ${stats.valid}/${total} valid`);
}

console.log('\n--------------------------------------------------------------------------------');
console.log(`TOTAL: ${RESULTS.valid}/${RESULTS.total} automations valid (${Math.round(RESULTS.valid/RESULTS.total*100)}%)`);
console.log('--------------------------------------------------------------------------------');

if (RESULTS.syntaxErrors.length > 0) {
  console.log('\n❌ SYNTAX ERRORS:');
  for (const err of RESULTS.syntaxErrors) {
    console.log(`   ${err.file}`);
  }
}

console.log('\n================================================================================');
console.log('REQUIRED ENVIRONMENT VARIABLES (per category):');
console.log('================================================================================\n');

const allEnvVars = new Set();
for (const [category, stats] of Object.entries(byCategory)) {
  const categoryEnvVars = new Set();
  for (const file of stats.files) {
    for (const envVar of file.envVars) {
      categoryEnvVars.add(envVar);
      allEnvVars.add(envVar);
    }
  }
  if (categoryEnvVars.size > 0) {
    console.log(`${category}:`);
    for (const envVar of categoryEnvVars) {
      console.log(`  - ${envVar}`);
    }
    console.log('');
  }
}

console.log('--------------------------------------------------------------------------------');
console.log('ALL UNIQUE ENV VARS:');
console.log('--------------------------------------------------------------------------------');
for (const envVar of Array.from(allEnvVars).sort()) {
  console.log(`  ${envVar}`);
}

console.log('\n================================================================================');
console.log('VALIDATION COMPLETE');
console.log('================================================================================');

// Exit with appropriate code
process.exit(RESULTS.valid === RESULTS.total ? 0 : 1);
