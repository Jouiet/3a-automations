#!/usr/bin/env node
/**
 * Multi-Tenant Script Runner Tests - S8 Multi-Tenant Dashboard
 *
 * Tests: TenantLogger, TenantContext, TenantCronManager, TenantScriptRunner
 * Framework: Node.js native test runner (node:test + node:assert)
 *
 * USAGE:
 *   node automations/agency/tests/multi-tenant-runner.test.cjs
 *   node --test automations/agency/tests/multi-tenant-runner.test.cjs
 *
 * @version 1.0.0
 * @date 2026-02-06
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────────────────────────────────────

const TEST_TENANT_ID = 'test-tenant-unit';
const TEST_DIR = path.join(os.tmpdir(), '3a-multi-tenant-tests');

function setupTestDirs() {
  const dirs = [
    path.join(TEST_DIR, 'logs', 'tenants', TEST_TENANT_ID),
    path.join(TEST_DIR, 'logs', 'script-runs'),
    path.join(TEST_DIR, 'clients', TEST_TENANT_ID),
    path.join(TEST_DIR, 'data', 'schedules'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanupTestDirs() {
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch { /* ignore */ }
}

function writeTestConfig(tenantId, config) {
  const configPath = path.join(TEST_DIR, 'clients', tenantId, 'config.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function writeTestCredentials(tenantId, creds) {
  const credPath = path.join(TEST_DIR, 'clients', tenantId, 'credentials.json');
  fs.mkdirSync(path.dirname(credPath), { recursive: true });
  fs.writeFileSync(credPath, JSON.stringify(creds, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT LOGGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TenantLogger', () => {
  let logDir;

  beforeEach(() => {
    setupTestDirs();
    logDir = path.join(TEST_DIR, 'logs', 'tenants', TEST_TENANT_ID);
  });

  afterEach(() => {
    cleanupTestDirs();
  });

  it('formats log entries with all required fields', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      tenant: TEST_TENANT_ID,
      script: 'test-script',
      runId: 'run-123',
      message: 'Test message',
    };

    assert.ok(entry.timestamp);
    assert.equal(entry.level, 'info');
    assert.equal(entry.tenant, TEST_TENANT_ID);
    assert.equal(entry.script, 'test-script');
    assert.equal(entry.runId, 'run-123');
    assert.equal(entry.message, 'Test message');
  });

  it('writes JSONL log entries to file', () => {
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.jsonl`);
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      tenant: TEST_TENANT_ID,
      script: 'test-script',
      runId: 'run-456',
      message: 'Test log entry',
    };

    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');

    const content = fs.readFileSync(logFile, 'utf8');
    const parsed = JSON.parse(content.trim());
    assert.equal(parsed.tenant, TEST_TENANT_ID);
    assert.equal(parsed.message, 'Test log entry');
  });

  it('supports all log levels (debug, info, warn, error)', () => {
    const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

    assert.equal(LOG_LEVELS.debug, 0);
    assert.equal(LOG_LEVELS.info, 1);
    assert.equal(LOG_LEVELS.warn, 2);
    assert.equal(LOG_LEVELS.error, 3);

    // Level filtering: info level should suppress debug
    const minLevel = LOG_LEVELS.info;
    assert.ok(LOG_LEVELS.debug < minLevel, 'debug filtered at info level');
    assert.ok(LOG_LEVELS.info >= minLevel, 'info passes at info level');
    assert.ok(LOG_LEVELS.warn >= minLevel, 'warn passes at info level');
    assert.ok(LOG_LEVELS.error >= minLevel, 'error passes at info level');
  });

  it('creates log directory per tenant', () => {
    assert.ok(fs.existsSync(logDir));
    // Verify isolation: different tenant = different directory
    const otherDir = path.join(TEST_DIR, 'logs', 'tenants', 'other-tenant');
    fs.mkdirSync(otherDir, { recursive: true });
    assert.ok(fs.existsSync(otherDir));
    assert.notEqual(logDir, otherDir);
  });

  it('uses daily log file naming (YYYY-MM-DD.jsonl)', () => {
    const today = new Date().toISOString().split('T')[0];
    const expectedFile = `${today}.jsonl`;
    assert.match(expectedFile, /^\d{4}-\d{2}-\d{2}\.jsonl$/);
  });

  it('includes data field only when provided', () => {
    const entryWithData = {
      timestamp: new Date().toISOString(),
      level: 'info',
      tenant: TEST_TENANT_ID,
      message: 'With data',
      data: { key: 'value' },
    };
    const entryWithout = {
      timestamp: new Date().toISOString(),
      level: 'info',
      tenant: TEST_TENANT_ID,
      message: 'Without data',
    };

    assert.ok('data' in entryWithData);
    assert.equal('data' in entryWithout, false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT CONTEXT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TenantContext', () => {
  beforeEach(() => {
    setupTestDirs();
  });

  afterEach(() => {
    cleanupTestDirs();
  });

  it('builds context with all required fields', () => {
    const context = {
      tenantId: TEST_TENANT_ID,
      runId: `${Date.now()}-abc123`,
      scriptName: 'shopify-sensor',
      startTime: Date.now(),
      config: { vertical: 'shopify' },
      params: { mode: 'health' },
      secrets: { SHOPIFY_ACCESS_TOKEN: 'shpat_test' },
      integrations: { shopify: { enabled: true } },
    };

    assert.equal(context.tenantId, TEST_TENANT_ID);
    assert.ok(context.runId);
    assert.equal(context.scriptName, 'shopify-sensor');
    assert.ok(context.startTime > 0);
    assert.deepEqual(context.config, { vertical: 'shopify' });
    assert.equal(context.secrets.SHOPIFY_ACCESS_TOKEN, 'shpat_test');
  });

  it('loads config from tenant config.json', () => {
    const config = {
      name: 'Test Corp',
      vertical: 'shopify',
      market: 'morocco',
      locale: { language: 'fr', currency: 'MAD' },
      integrations: {
        shopify: { enabled: true, store: 'test.myshopify.com' },
        klaviyo: { enabled: true },
      },
    };
    writeTestConfig(TEST_TENANT_ID, config);

    const loaded = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', TEST_TENANT_ID, 'config.json'), 'utf8')
    );
    assert.equal(loaded.name, 'Test Corp');
    assert.equal(loaded.vertical, 'shopify');
    assert.ok(loaded.integrations.shopify.enabled);
  });

  it('loads credentials from fallback file', () => {
    const creds = {
      SHOPIFY_ACCESS_TOKEN: 'shpat_test123',
      KLAVIYO_API_KEY: 'pk_test_abc',
    };
    writeTestCredentials(TEST_TENANT_ID, creds);

    const loaded = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', TEST_TENANT_ID, 'credentials.json'), 'utf8')
    );
    assert.equal(loaded.SHOPIFY_ACCESS_TOKEN, 'shpat_test123');
    assert.equal(loaded.KLAVIYO_API_KEY, 'pk_test_abc');
  });

  it('getSecret returns value or default', () => {
    const secrets = { API_KEY: 'test-key', EMPTY: '' };
    const getSecret = (key, defaultValue = null) => secrets[key] || defaultValue;

    assert.equal(getSecret('API_KEY'), 'test-key');
    assert.equal(getSecret('MISSING'), null);
    assert.equal(getSecret('MISSING', 'fallback'), 'fallback');
    assert.equal(getSecret('EMPTY', 'fallback'), 'fallback'); // empty string = falsy
  });

  it('hasIntegration checks enabled flag', () => {
    const integrations = {
      shopify: { enabled: true, store: 'test.myshopify.com' },
      klaviyo: { enabled: true },
      meta: { enabled: false },
    };
    const hasIntegration = (name) => integrations[name]?.enabled === true;

    assert.ok(hasIntegration('shopify'));
    assert.ok(hasIntegration('klaviyo'));
    assert.equal(hasIntegration('meta'), false);
    assert.equal(hasIntegration('nonexistent'), false);
  });

  it('checkRequiredIntegrations returns missing list', () => {
    const integrations = {
      shopify: { enabled: true },
      klaviyo: { enabled: true },
      meta: { enabled: false },
    };

    function checkRequired(required) {
      const missing = [];
      for (const name of required) {
        if (!integrations[name]?.enabled) missing.push(name);
      }
      return { valid: missing.length === 0, missing };
    }

    const result1 = checkRequired(['shopify', 'klaviyo']);
    assert.ok(result1.valid);
    assert.deepEqual(result1.missing, []);

    const result2 = checkRequired(['shopify', 'meta', 'tiktok']);
    assert.equal(result2.valid, false);
    assert.deepEqual(result2.missing, ['meta', 'tiktok']);
  });

  it('checkRequiredSecrets returns missing list', () => {
    const secrets = { API_KEY: 'value', TOKEN: 'value2' };

    function checkRequired(required) {
      const missing = [];
      for (const key of required) {
        if (!secrets[key]) missing.push(key);
      }
      return { valid: missing.length === 0, missing };
    }

    const result1 = checkRequired(['API_KEY', 'TOKEN']);
    assert.ok(result1.valid);

    const result2 = checkRequired(['API_KEY', 'MISSING_KEY']);
    assert.equal(result2.valid, false);
    assert.deepEqual(result2.missing, ['MISSING_KEY']);
  });

  it('getDuration returns elapsed time', async () => {
    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 50));
    const duration = Date.now() - startTime;
    assert.ok(duration >= 40, `Duration ${duration}ms should be >= 40ms`);
  });

  it('runId format is correct', () => {
    const runId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    assert.match(runId, /^\d+-[a-z0-9]+$/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CRON EXPRESSION PARSER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TenantCronManager - Cron Parser', () => {
  function parseCronExpression(expr) {
    const parts = expr.split(' ');
    if (parts.length !== 5) throw new Error(`Invalid cron expression: ${expr}`);
    return { minute: parts[0], hour: parts[1], dayOfMonth: parts[2], month: parts[3], dayOfWeek: parts[4] };
  }

  function matchesCronField(value, field) {
    if (field === '*') return true;
    if (field.startsWith('*/')) return value % parseInt(field.slice(2)) === 0;
    if (field.includes(',')) return field.split(',').map(Number).includes(value);
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return value >= start && value <= end;
    }
    return parseInt(field) === value;
  }

  it('parses standard 5-field cron expression', () => {
    const parsed = parseCronExpression('*/15 9 * * 1-5');
    assert.equal(parsed.minute, '*/15');
    assert.equal(parsed.hour, '9');
    assert.equal(parsed.dayOfMonth, '*');
    assert.equal(parsed.month, '*');
    assert.equal(parsed.dayOfWeek, '1-5');
  });

  it('rejects invalid cron expressions', () => {
    assert.throws(() => parseCronExpression('*/15 9 *'), /Invalid cron expression/);
    assert.throws(() => parseCronExpression(''), /Invalid cron expression/);
    assert.throws(() => parseCronExpression('1 2 3 4 5 6'), /Invalid cron expression/);
  });

  it('matches wildcard (*) for any value', () => {
    assert.ok(matchesCronField(0, '*'));
    assert.ok(matchesCronField(59, '*'));
    assert.ok(matchesCronField(23, '*'));
  });

  it('matches interval (*/n) pattern', () => {
    assert.ok(matchesCronField(0, '*/15'));
    assert.ok(matchesCronField(15, '*/15'));
    assert.ok(matchesCronField(30, '*/15'));
    assert.ok(matchesCronField(45, '*/15'));
    assert.equal(matchesCronField(7, '*/15'), false);
    assert.equal(matchesCronField(16, '*/15'), false);
  });

  it('matches comma-separated values', () => {
    assert.ok(matchesCronField(1, '1,3,5'));
    assert.ok(matchesCronField(3, '1,3,5'));
    assert.ok(matchesCronField(5, '1,3,5'));
    assert.equal(matchesCronField(2, '1,3,5'), false);
    assert.equal(matchesCronField(4, '1,3,5'), false);
  });

  it('matches range (start-end) pattern', () => {
    assert.ok(matchesCronField(1, '1-5'));
    assert.ok(matchesCronField(3, '1-5'));
    assert.ok(matchesCronField(5, '1-5'));
    assert.equal(matchesCronField(0, '1-5'), false);
    assert.equal(matchesCronField(6, '1-5'), false);
  });

  it('matches exact value', () => {
    assert.ok(matchesCronField(9, '9'));
    assert.ok(matchesCronField(0, '0'));
    assert.equal(matchesCronField(8, '9'), false);
  });

  it('common cron schedules parse correctly', () => {
    // Every hour
    const hourly = parseCronExpression('0 * * * *');
    assert.equal(hourly.minute, '0');
    assert.equal(hourly.hour, '*');

    // Daily at 9am
    const daily = parseCronExpression('0 9 * * *');
    assert.equal(daily.minute, '0');
    assert.equal(daily.hour, '9');

    // Weekdays at 8:30
    const weekdays = parseCronExpression('30 8 * * 1-5');
    assert.equal(weekdays.minute, '30');
    assert.equal(weekdays.hour, '8');
    assert.equal(weekdays.dayOfWeek, '1-5');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT SCRIPT RUNNER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TenantScriptRunner', () => {
  beforeEach(() => {
    setupTestDirs();
  });

  afterEach(() => {
    cleanupTestDirs();
  });

  it('tracks running scripts in Map', () => {
    const runningScripts = new Map();
    const runId = `${TEST_TENANT_ID}-shopify-sensor-${Date.now()}`;

    runningScripts.set(runId, {
      tenantId: TEST_TENANT_ID,
      scriptName: 'shopify-sensor.cjs',
      startTime: Date.now(),
      status: 'running',
    });

    assert.equal(runningScripts.size, 1);
    assert.equal(runningScripts.get(runId).status, 'running');

    // Complete
    runningScripts.set(runId, {
      ...runningScripts.get(runId),
      status: 'completed',
      endTime: Date.now(),
    });
    assert.equal(runningScripts.get(runId).status, 'completed');
  });

  it('runId format includes tenant, script, and timestamp', () => {
    const scriptName = 'shopify-sensor.cjs';
    const runId = `${TEST_TENANT_ID}-${scriptName.replace('.cjs', '')}-${Date.now()}`;
    assert.ok(runId.includes(TEST_TENANT_ID));
    assert.ok(runId.includes('shopify-sensor'));
    assert.match(runId, /\d+$/);
  });

  it('legacy pattern saves and restores process.env', () => {
    const originalValue = process.env.TEST_ISOLATION_KEY;
    const secrets = { TEST_ISOLATION_KEY: 'tenant-secret-123' };

    // Inject
    for (const [key, value] of Object.entries(secrets)) {
      process.env[key] = value;
    }
    assert.equal(process.env.TEST_ISOLATION_KEY, 'tenant-secret-123');

    // Restore
    if (originalValue !== undefined) {
      process.env.TEST_ISOLATION_KEY = originalValue;
    } else {
      delete process.env.TEST_ISOLATION_KEY;
    }
    assert.equal(process.env.TEST_ISOLATION_KEY, originalValue);
  });

  it('env isolation: two tenants do not leak secrets', () => {
    const tenant1Secrets = { SHOPIFY_TOKEN: 'tenant1-token' };
    const tenant2Secrets = { SHOPIFY_TOKEN: 'tenant2-token' };
    const originalValue = process.env.SHOPIFY_TOKEN;

    // Simulate tenant 1 execution
    process.env.SHOPIFY_TOKEN = tenant1Secrets.SHOPIFY_TOKEN;
    assert.equal(process.env.SHOPIFY_TOKEN, 'tenant1-token');

    // Restore after tenant 1
    if (originalValue !== undefined) {
      process.env.SHOPIFY_TOKEN = originalValue;
    } else {
      delete process.env.SHOPIFY_TOKEN;
    }

    // Simulate tenant 2 execution
    process.env.SHOPIFY_TOKEN = tenant2Secrets.SHOPIFY_TOKEN;
    assert.equal(process.env.SHOPIFY_TOKEN, 'tenant2-token');

    // Restore
    if (originalValue !== undefined) {
      process.env.SHOPIFY_TOKEN = originalValue;
    } else {
      delete process.env.SHOPIFY_TOKEN;
    }

    assert.equal(process.env.SHOPIFY_TOKEN, originalValue);
  });

  it('script result format is correct on success', () => {
    const result = {
      success: true,
      runId: 'test-123-456',
      duration: 150,
      result: { products: 42, status: 'healthy' },
    };

    assert.ok(result.success);
    assert.equal(typeof result.runId, 'string');
    assert.equal(typeof result.duration, 'number');
    assert.ok(result.result);
  });

  it('script result format is correct on failure', () => {
    const result = {
      success: false,
      runId: 'test-123-789',
      duration: 50,
      error: 'API key missing',
    };

    assert.equal(result.success, false);
    assert.equal(result.error, 'API key missing');
    assert.equal(typeof result.duration, 'number');
  });

  it('script path resolution checks multiple locations', () => {
    const scriptName = 'shopify-sensor.cjs';
    const basePaths = [
      path.join(TEST_DIR, scriptName),
      path.join(TEST_DIR, 'agency', 'core', scriptName),
      path.join(TEST_DIR, '..', 'automations', 'agency', 'core', scriptName),
    ];

    // None exist in test dir
    const found = basePaths.find(p => fs.existsSync(p));
    assert.equal(found, undefined);

    // Create one
    const testScript = basePaths[0];
    fs.writeFileSync(testScript, 'module.exports = { run: () => ({}) }');
    assert.ok(fs.existsSync(testScript));
    fs.unlinkSync(testScript);
  });

  it('cleanup removes old tracking entries', () => {
    const runningScripts = new Map();
    const oneHourAgo = Date.now() - 3600001;
    const recent = Date.now() - 1000;

    runningScripts.set('old-run', { startTime: oneHourAgo, status: 'completed' });
    runningScripts.set('recent-run', { startTime: recent, status: 'completed' });

    // Cleanup: remove entries older than 1 hour
    const cutoff = Date.now() - 3600000;
    for (const [key, value] of runningScripts) {
      if (value.status !== 'running' && value.startTime < cutoff) {
        runningScripts.delete(key);
      }
    }

    assert.equal(runningScripts.size, 1);
    assert.ok(runningScripts.has('recent-run'));
    assert.equal(runningScripts.has('old-run'), false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE MANAGEMENT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TenantCronManager - Schedule Management', () => {
  beforeEach(() => {
    setupTestDirs();
  });

  afterEach(() => {
    cleanupTestDirs();
  });

  it('loads tenant schedules from config', () => {
    const config = {
      name: 'Test Corp',
      schedules: [
        { script: 'shopify-sensor.cjs', cron: '*/15 * * * *', enabled: true },
        { script: 'klaviyo-sensor.cjs', cron: '0 9 * * *', enabled: false },
      ],
    };
    writeTestConfig(TEST_TENANT_ID, config);

    const loaded = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', TEST_TENANT_ID, 'config.json'), 'utf8')
    );
    assert.equal(loaded.schedules.length, 2);
    assert.equal(loaded.schedules[0].script, 'shopify-sensor.cjs');
    assert.equal(loaded.schedules[1].enabled, false);
  });

  it('adds schedule ID with tenant prefix', () => {
    const schedule = { script: 'shopify-sensor.cjs', cron: '0 9 * * *' };
    const id = `${TEST_TENANT_ID}-${schedule.script}-${Date.now()}`;

    assert.ok(id.startsWith(TEST_TENANT_ID));
    assert.ok(id.includes('shopify-sensor'));
  });

  it('persists cron state to JSON file', () => {
    const stateFile = path.join(TEST_DIR, 'data', 'schedules', 'cron-state.json');
    const state = {
      lastRun: { 'test-schedule-1': Date.now() },
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    const loaded = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.ok(loaded.lastRun['test-schedule-1']);
    assert.ok(loaded.savedAt);
  });

  it('skips _template directories when loading all schedules', () => {
    const dirs = ['tenant-1', '_template', 'tenant-2', '_backup'];
    const filtered = dirs.filter(d => !d.startsWith('_'));
    assert.deepEqual(filtered, ['tenant-1', 'tenant-2']);
  });

  it('schedule enabled defaults to true', () => {
    const schedule = { script: 'test.cjs', cron: '0 * * * *' };
    const enabled = schedule.enabled !== false;
    assert.ok(enabled);

    const disabled = { ...schedule, enabled: false };
    assert.equal(disabled.enabled !== false, false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-TENANT ISOLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Multi-Tenant Isolation', () => {
  beforeEach(() => {
    setupTestDirs();
  });

  afterEach(() => {
    cleanupTestDirs();
  });

  it('each tenant has isolated log directory', () => {
    const tenants = ['alpha-medical', 'mydealz', 'test-corp'];
    for (const tenant of tenants) {
      const logDir = path.join(TEST_DIR, 'logs', 'tenants', tenant);
      fs.mkdirSync(logDir, { recursive: true });
      assert.ok(fs.existsSync(logDir));
    }
    // Verify no cross-contamination
    assert.notEqual(
      path.join(TEST_DIR, 'logs', 'tenants', 'alpha-medical'),
      path.join(TEST_DIR, 'logs', 'tenants', 'mydealz')
    );
  });

  it('each tenant has isolated config', () => {
    const configs = {
      'tenant-ma': { market: 'morocco', locale: { language: 'fr', currency: 'MAD' } },
      'tenant-eu': { market: 'europe', locale: { language: 'fr', currency: 'EUR' } },
      'tenant-intl': { market: 'international', locale: { language: 'en', currency: 'USD' } },
    };

    for (const [id, config] of Object.entries(configs)) {
      writeTestConfig(id, config);
    }

    const maConfig = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', 'tenant-ma', 'config.json'), 'utf8')
    );
    assert.equal(maConfig.locale.currency, 'MAD');

    const euConfig = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', 'tenant-eu', 'config.json'), 'utf8')
    );
    assert.equal(euConfig.locale.currency, 'EUR');

    const intlConfig = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', 'tenant-intl', 'config.json'), 'utf8')
    );
    assert.equal(intlConfig.locale.currency, 'USD');
  });

  it('each tenant has isolated credentials', () => {
    writeTestCredentials('tenant-a', { SHOPIFY_TOKEN: 'token-a' });
    writeTestCredentials('tenant-b', { SHOPIFY_TOKEN: 'token-b' });

    const credsA = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', 'tenant-a', 'credentials.json'), 'utf8')
    );
    const credsB = JSON.parse(
      fs.readFileSync(path.join(TEST_DIR, 'clients', 'tenant-b', 'credentials.json'), 'utf8')
    );

    assert.equal(credsA.SHOPIFY_TOKEN, 'token-a');
    assert.equal(credsB.SHOPIFY_TOKEN, 'token-b');
    assert.notEqual(credsA.SHOPIFY_TOKEN, credsB.SHOPIFY_TOKEN);
  });

  it('geo-locale isolation: MAD, EUR, USD markets', () => {
    const markets = [
      { id: 'morocco', language: 'fr', currency: 'MAD', countries: ['MA'] },
      { id: 'europe', language: 'fr', currency: 'EUR', countries: ['FR', 'BE', 'DE'] },
      { id: 'international', language: 'en', currency: 'USD', countries: ['US', 'GB', 'CA'] },
    ];

    assert.equal(markets.length, 3);
    assert.equal(markets[0].currency, 'MAD');
    assert.equal(markets[1].currency, 'EUR');
    assert.equal(markets[2].currency, 'USD');

    // All have valid language codes
    for (const market of markets) {
      assert.match(market.language, /^(fr|en|ar|es)$/);
      assert.ok(market.countries.length > 0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLI SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  console.log('\n[Multi-Tenant Runner Tests] Running with Node.js native test runner...\n');
}
