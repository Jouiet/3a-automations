#!/usr/bin/env node
/**
 * TenantScriptRunner - Multi-Tenant Script Execution Engine
 *
 * Executes automation scripts with tenant-isolated credentials:
 * - Loads credentials from vault (or fallback)
 * - Builds isolated execution context
 * - Supports both new (runWithContext) and legacy (process.env) scripts
 * - Tracks running scripts
 * - Comprehensive logging
 *
 * @module TenantScriptRunner
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const TenantContext = require('./TenantContext.cjs');
const TenantLogger = require('./TenantLogger.cjs');

class TenantScriptRunner {
  constructor() {
    this.runningScripts = new Map();
    this.scriptRegistry = new Map();
    this.logsDir = path.join(process.cwd(), '..', 'logs', 'script-runs');

    // Ensure logs directory
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    // Load script registry
    this._loadRegistry();
  }

  /**
   * Load script registry from automations-registry.json
   */
  _loadRegistry() {
    const registryPath = path.join(process.cwd(), '..', 'automations', 'automations-registry.json');

    if (fs.existsSync(registryPath)) {
      try {
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        for (const automation of registry.automations || []) {
          if (automation.script) {
            this.scriptRegistry.set(automation.script, automation);
          }
        }
      } catch (error) {
        console.warn('[TenantScriptRunner] Failed to load registry:', error.message);
      }
    }
  }

  /**
   * Get script metadata from registry
   */
  getScriptInfo(scriptName) {
    return this.scriptRegistry.get(scriptName) || null;
  }

  /**
   * Check if script supports multi-tenant
   */
  async isMultiTenantScript(scriptPath) {
    try {
      const script = require(scriptPath);
      return typeof script.runWithContext === 'function';
    } catch {
      return false;
    }
  }

  /**
   * Run a script for a specific tenant
   * @param {string} scriptName - Name of the script (e.g., 'shopify-sensor.cjs')
   * @param {string} tenantId - Tenant identifier
   * @param {Object} params - Script parameters
   * @returns {Promise<Object>} Execution result
   */
  async runScript(scriptName, tenantId, params = {}) {
    const runId = `${tenantId}-${scriptName.replace('.cjs', '')}-${Date.now()}`;
    const startTime = Date.now();

    // Initialize logger
    const logger = new TenantLogger(tenantId, {
      scriptName: scriptName.replace('.cjs', ''),
      runId,
    });

    logger.start(params);

    // Track running script
    this.runningScripts.set(runId, {
      tenantId,
      scriptName,
      startTime,
      status: 'running',
    });

    try {
      // Build tenant context
      const ctxBuilder = new TenantContext(tenantId, {
        scriptName: scriptName.replace('.cjs', ''),
        runId,
        params,
      });
      const context = await ctxBuilder.build();

      // Resolve script path
      const scriptPath = this._resolveScriptPath(scriptName);
      if (!scriptPath) {
        throw new Error(`Script not found: ${scriptName}`);
      }

      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(scriptPath)];

      // Load script
      const script = require(scriptPath);

      let result;

      // Check if script supports multi-tenant context
      if (typeof script.runWithContext === 'function') {
        // New pattern: pass context directly
        logger.debug('Using runWithContext pattern');
        result = await script.runWithContext(context);
      } else if (typeof script.run === 'function') {
        // Legacy pattern: inject into process.env temporarily
        logger.warn('Using legacy process.env pattern');
        result = await this._runLegacyScript(script, context, logger);
      } else {
        throw new Error(`Script ${scriptName} has no run or runWithContext function`);
      }

      // Complete
      const duration = Date.now() - startTime;
      logger.complete({ result, duration });

      // Update tracking
      this.runningScripts.set(runId, {
        tenantId,
        scriptName,
        startTime,
        endTime: Date.now(),
        status: 'completed',
        duration,
      });

      // Log run to file
      this._logRun(runId, tenantId, scriptName, 'success', duration, result);

      return {
        success: true,
        runId,
        duration,
        result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.fail(error);

      // Update tracking
      this.runningScripts.set(runId, {
        tenantId,
        scriptName,
        startTime,
        endTime: Date.now(),
        status: 'failed',
        duration,
        error: error.message,
      });

      // Log run to file
      this._logRun(runId, tenantId, scriptName, 'failed', duration, null, error.message);

      return {
        success: false,
        runId,
        duration,
        error: error.message,
      };
    } finally {
      // Clean up old tracking entries (keep last hour)
      this._cleanupTracking();
    }
  }

  /**
   * Run legacy script with process.env injection
   */
  async _runLegacyScript(script, context, logger) {
    // Save original env
    const originalEnv = { ...process.env };

    try {
      // Inject tenant secrets into process.env
      for (const [key, value] of Object.entries(context.secrets)) {
        if (value !== null && value !== undefined) {
          process.env[key] = value;
        }
      }

      // Run script
      const result = await script.run(context.params);
      return result;
    } finally {
      // Restore original env
      for (const key of Object.keys(context.secrets)) {
        if (originalEnv[key] !== undefined) {
          process.env[key] = originalEnv[key];
        } else {
          delete process.env[key];
        }
      }
    }
  }

  /**
   * Resolve script path
   */
  _resolveScriptPath(scriptName) {
    const basePaths = [
      path.join(process.cwd(), scriptName),
      path.join(process.cwd(), 'agency', 'core', scriptName),
      path.join(process.cwd(), '..', 'automations', 'agency', 'core', scriptName),
    ];

    for (const p of basePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return null;
  }

  /**
   * Log script run to file
   */
  _logRun(runId, tenantId, scriptName, status, duration, result, error) {
    const entry = {
      timestamp: new Date().toISOString(),
      runId,
      tenantId,
      scriptName,
      status,
      duration,
      result: result !== undefined ? result : undefined,
      error: error || undefined,
    };

    const logFile = path.join(
      this.logsDir,
      `${new Date().toISOString().split('T')[0]}.jsonl`
    );

    try {
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    } catch (e) {
      console.error('[TenantScriptRunner] Failed to log run:', e.message);
    }
  }

  /**
   * Clean up old tracking entries
   */
  _cleanupTracking() {
    const oneHourAgo = Date.now() - 3600000;

    for (const [runId, info] of this.runningScripts.entries()) {
      if (info.endTime && info.endTime < oneHourAgo) {
        this.runningScripts.delete(runId);
      }
    }
  }

  /**
   * Get running scripts for a tenant
   */
  getRunningScripts(tenantId = null) {
    const scripts = [];

    for (const [runId, info] of this.runningScripts.entries()) {
      if (tenantId && info.tenantId !== tenantId) continue;
      scripts.push({ runId, ...info });
    }

    return scripts;
  }

  /**
   * Get script run history
   */
  getRunHistory(options = {}) {
    const { tenantId, scriptName, limit = 100, status } = options;
    const logFile = path.join(
      this.logsDir,
      `${new Date().toISOString().split('T')[0]}.jsonl`
    );

    if (!fs.existsSync(logFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(logFile, 'utf8');
      let entries = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(e => e !== null);

      // Apply filters
      if (tenantId) {
        entries = entries.filter(e => e.tenantId === tenantId);
      }
      if (scriptName) {
        entries = entries.filter(e => e.scriptName === scriptName);
      }
      if (status) {
        entries = entries.filter(e => e.status === status);
      }

      return entries.slice(-limit);
    } catch {
      return [];
    }
  }

  /**
   * Run multiple scripts for a tenant
   */
  async runBatch(tenantId, scripts) {
    const results = [];

    for (const { scriptName, params } of scripts) {
      const result = await this.runScript(scriptName, tenantId, params);
      results.push({ scriptName, ...result });

      // Stop on failure if configured
      if (!result.success && params?.stopOnError) {
        break;
      }
    }

    return results;
  }

  /**
   * Health check
   */
  async health() {
    const tenants = TenantContext.listTenants();
    const running = this.getRunningScripts();
    const recentHistory = this.getRunHistory({ limit: 10 });

    const recentFailures = recentHistory.filter(r => r.status === 'failed').length;

    return {
      status: recentFailures > 5 ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      tenants: tenants.length,
      runningScripts: running.length,
      registeredScripts: this.scriptRegistry.size,
      recentRuns: recentHistory.length,
      recentFailures,
    };
  }
}

// Singleton instance
let runnerInstance = null;

function getScriptRunner() {
  if (!runnerInstance) {
    runnerInstance = new TenantScriptRunner();
  }
  return runnerInstance;
}

module.exports = { TenantScriptRunner, getScriptRunner };

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
TenantScriptRunner - Multi-Tenant Script Execution Engine

Usage:
  node TenantScriptRunner.cjs --run <script> --tenant <id> [--params <json>]
  node TenantScriptRunner.cjs --running [--tenant <id>]
  node TenantScriptRunner.cjs --history [--tenant <id>] [--limit <n>]
  node TenantScriptRunner.cjs --health

Options:
  --run <script>    Script to run (e.g., shopify-sensor.cjs)
  --tenant <id>     Tenant ID
  --params <json>   JSON parameters for script
  --running         Show running scripts
  --history         Show run history
  --limit <n>       Limit history results (default: 100)
  --health          Health check
`);
    process.exit(0);
  }

  const runner = getScriptRunner();

  (async () => {
    try {
      if (args.includes('--health')) {
        const health = await runner.health();
        console.log(JSON.stringify(health, null, 2));
        process.exit(health.status === 'healthy' ? 0 : 1);
      }

      if (args.includes('--running')) {
        const tenantIdx = args.indexOf('--tenant');
        const tenantId = tenantIdx !== -1 ? args[tenantIdx + 1] : null;
        const running = runner.getRunningScripts(tenantId);
        console.log(JSON.stringify(running, null, 2));
        process.exit(0);
      }

      if (args.includes('--history')) {
        const tenantIdx = args.indexOf('--tenant');
        const tenantId = tenantIdx !== -1 ? args[tenantIdx + 1] : null;
        const limitIdx = args.indexOf('--limit');
        const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 100;
        const history = runner.getRunHistory({ tenantId, limit });
        console.log(JSON.stringify(history, null, 2));
        process.exit(0);
      }

      if (args.includes('--run')) {
        const runIdx = args.indexOf('--run');
        const scriptName = args[runIdx + 1];

        const tenantIdx = args.indexOf('--tenant');
        const tenantId = tenantIdx !== -1 ? args[tenantIdx + 1] : null;

        if (!scriptName || !tenantId) {
          console.error('Error: --run requires --tenant');
          process.exit(1);
        }

        const paramsIdx = args.indexOf('--params');
        let params = {};
        if (paramsIdx !== -1) {
          try {
            params = JSON.parse(args[paramsIdx + 1]);
          } catch {
            console.error('Error: Invalid JSON params');
            process.exit(1);
          }
        }

        console.log(`Running ${scriptName} for tenant ${tenantId}...`);
        const result = await runner.runScript(scriptName, tenantId, params);
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
