#!/usr/bin/env node
/**
 * TenantCronManager - Per-Tenant Scheduled Task Management
 *
 * Manages scheduled automation executions:
 * - Cron schedules per tenant
 * - Priority queue
 * - Concurrency limits
 * - Schedule persistence
 *
 * @module TenantCronManager
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { getScriptRunner } = require('./TenantScriptRunner.cjs');
const TenantLogger = require('./TenantLogger.cjs');

// Cron expression parser (simple implementation)
function parseCronExpression(expr) {
  const parts = expr.split(' ');
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: ${expr}`);
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

function matchesCronField(value, field) {
  if (field === '*') return true;

  // Handle */n pattern
  if (field.startsWith('*/')) {
    const interval = parseInt(field.slice(2));
    return value % interval === 0;
  }

  // Handle comma-separated values
  if (field.includes(',')) {
    return field.split(',').map(Number).includes(value);
  }

  // Handle range
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number);
    return value >= start && value <= end;
  }

  // Single value
  return parseInt(field) === value;
}

function shouldRunNow(cron) {
  const now = new Date();
  const parsed = parseCronExpression(cron);

  return (
    matchesCronField(now.getMinutes(), parsed.minute) &&
    matchesCronField(now.getHours(), parsed.hour) &&
    matchesCronField(now.getDate(), parsed.dayOfMonth) &&
    matchesCronField(now.getMonth() + 1, parsed.month) &&
    matchesCronField(now.getDay(), parsed.dayOfWeek)
  );
}

class TenantCronManager {
  constructor() {
    this.schedules = new Map(); // tenantId -> schedules[]
    this.lastRun = new Map(); // scheduleId -> timestamp
    this.running = false;
    this.runner = getScriptRunner();

    this.schedulesDir = path.join(process.cwd(), '..', 'data', 'schedules');
    this.stateFile = path.join(this.schedulesDir, 'cron-state.json');

    // Ensure directory
    if (!fs.existsSync(this.schedulesDir)) {
      fs.mkdirSync(this.schedulesDir, { recursive: true });
    }

    // Load state
    this._loadState();
  }

  /**
   * Load persisted state
   */
  _loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        for (const [key, value] of Object.entries(state.lastRun || {})) {
          this.lastRun.set(key, value);
        }
      } catch (error) {
        console.warn('[CronManager] Failed to load state:', error.message);
      }
    }
  }

  /**
   * Save state to disk
   */
  _saveState() {
    const state = {
      lastRun: Object.fromEntries(this.lastRun),
      savedAt: new Date().toISOString(),
    };

    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn('[CronManager] Failed to save state:', error.message);
    }
  }

  /**
   * Load schedules for a tenant
   */
  loadTenantSchedules(tenantId) {
    const clientDir = path.join(process.cwd(), '..', 'clients', tenantId);
    const configPath = path.join(clientDir, 'config.json');

    if (!fs.existsSync(configPath)) {
      return [];
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const schedules = config.schedules || [];

      // Add tenant ID to each schedule
      return schedules.map((s, idx) => ({
        ...s,
        id: `${tenantId}-${s.script || 'unknown'}-${idx}`,
        tenantId,
        enabled: s.enabled !== false,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Load all tenant schedules
   */
  loadAllSchedules() {
    const clientsDir = path.join(process.cwd(), '..', 'clients');

    if (!fs.existsSync(clientsDir)) {
      return;
    }

    const dirs = fs.readdirSync(clientsDir, { withFileTypes: true });

    for (const dir of dirs) {
      if (!dir.isDirectory() || dir.name.startsWith('_')) continue;

      const tenantId = dir.name;
      const schedules = this.loadTenantSchedules(tenantId);
      this.schedules.set(tenantId, schedules);
    }

    console.log(
      `[CronManager] Loaded schedules for ${this.schedules.size} tenants`
    );
  }

  /**
   * Add a schedule for a tenant
   */
  addSchedule(tenantId, schedule) {
    const schedules = this.schedules.get(tenantId) || [];
    const id = `${tenantId}-${schedule.script}-${Date.now()}`;

    schedules.push({
      ...schedule,
      id,
      tenantId,
      enabled: schedule.enabled !== false,
      createdAt: new Date().toISOString(),
    });

    this.schedules.set(tenantId, schedules);

    // Persist to config
    this._persistSchedules(tenantId);

    return id;
  }

  /**
   * Remove a schedule
   */
  removeSchedule(tenantId, scheduleId) {
    const schedules = this.schedules.get(tenantId) || [];
    const filtered = schedules.filter(s => s.id !== scheduleId);
    this.schedules.set(tenantId, filtered);

    // Persist
    this._persistSchedules(tenantId);

    return true;
  }

  /**
   * Enable/disable a schedule
   */
  setScheduleEnabled(tenantId, scheduleId, enabled) {
    const schedules = this.schedules.get(tenantId) || [];
    const schedule = schedules.find(s => s.id === scheduleId);

    if (schedule) {
      schedule.enabled = enabled;
      this._persistSchedules(tenantId);
      return true;
    }

    return false;
  }

  /**
   * Persist schedules to tenant config
   */
  _persistSchedules(tenantId) {
    const clientDir = path.join(process.cwd(), '..', 'clients', tenantId);
    const configPath = path.join(clientDir, 'config.json');

    if (!fs.existsSync(configPath)) {
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const schedules = this.schedules.get(tenantId) || [];

      // Convert to config format (remove runtime fields)
      config.schedules = schedules.map(s => ({
        script: s.script,
        cron: s.cron,
        params: s.params,
        enabled: s.enabled,
        name: s.name,
      }));

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(`[CronManager] Failed to persist schedules:`, error.message);
    }
  }

  /**
   * Get schedules for a tenant
   */
  getSchedules(tenantId) {
    return this.schedules.get(tenantId) || [];
  }

  /**
   * Get all due schedules
   */
  getDueSchedules() {
    const due = [];
    const now = Date.now();

    for (const [tenantId, schedules] of this.schedules) {
      for (const schedule of schedules) {
        if (!schedule.enabled) continue;
        if (!schedule.cron) continue;

        // Check if due
        if (!shouldRunNow(schedule.cron)) continue;

        // Check if already run this minute
        const lastRun = this.lastRun.get(schedule.id) || 0;
        const minuteStart = Math.floor(now / 60000) * 60000;

        if (lastRun >= minuteStart) continue;

        due.push(schedule);
      }
    }

    return due;
  }

  /**
   * Execute due schedules
   */
  async executeDue() {
    const due = this.getDueSchedules();

    if (due.length === 0) {
      return { executed: 0, results: [] };
    }

    const results = [];

    for (const schedule of due) {
      console.log(
        `[CronManager] Running: ${schedule.script} for ${schedule.tenantId}`
      );

      // Mark as run
      this.lastRun.set(schedule.id, Date.now());

      try {
        const result = await this.runner.runScript(
          schedule.script,
          schedule.tenantId,
          schedule.params || {}
        );

        results.push({
          scheduleId: schedule.id,
          ...result,
        });
      } catch (error) {
        results.push({
          scheduleId: schedule.id,
          success: false,
          error: error.message,
        });
      }
    }

    // Save state
    this._saveState();

    return {
      executed: due.length,
      results,
    };
  }

  /**
   * Start the cron loop
   */
  start(intervalMs = 60000) {
    if (this.running) {
      console.warn('[CronManager] Already running');
      return;
    }

    this.running = true;
    this.loadAllSchedules();

    console.log('[CronManager] Started');

    // Check every minute
    this.intervalId = setInterval(async () => {
      try {
        const result = await this.executeDue();
        if (result.executed > 0) {
          console.log(
            `[CronManager] Executed ${result.executed} schedules`
          );
        }
      } catch (error) {
        console.error('[CronManager] Execution error:', error.message);
      }
    }, intervalMs);

    // Initial check
    this.executeDue().catch(console.error);
  }

  /**
   * Stop the cron loop
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    this._saveState();
    console.log('[CronManager] Stopped');
  }

  /**
   * Health check
   */
  health() {
    let totalSchedules = 0;
    let enabledSchedules = 0;

    for (const schedules of this.schedules.values()) {
      totalSchedules += schedules.length;
      enabledSchedules += schedules.filter(s => s.enabled).length;
    }

    return {
      status: this.running ? 'running' : 'stopped',
      timestamp: new Date().toISOString(),
      tenants: this.schedules.size,
      totalSchedules,
      enabledSchedules,
      lastStateUpdate: fs.existsSync(this.stateFile)
        ? fs.statSync(this.stateFile).mtime.toISOString()
        : null,
    };
  }
}

// Singleton
let managerInstance = null;

function getCronManager() {
  if (!managerInstance) {
    managerInstance = new TenantCronManager();
  }
  return managerInstance;
}

module.exports = { TenantCronManager, getCronManager };

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
TenantCronManager - Per-Tenant Scheduled Task Management

Usage:
  node TenantCronManager.cjs --start             Start cron daemon
  node TenantCronManager.cjs --health            Health check
  node TenantCronManager.cjs --list [--tenant]   List schedules
  node TenantCronManager.cjs --due               Show due schedules
  node TenantCronManager.cjs --run-due           Execute due schedules once

Options:
  --tenant <id>    Filter by tenant
  --start          Start daemon mode
  --health         Show health status
`);
    process.exit(0);
  }

  const manager = getCronManager();

  if (args.includes('--health')) {
    const health = manager.health();
    console.log(JSON.stringify(health, null, 2));
    process.exit(0);
  }

  if (args.includes('--list')) {
    manager.loadAllSchedules();

    const tenantIdx = args.indexOf('--tenant');
    const tenantId = tenantIdx !== -1 ? args[tenantIdx + 1] : null;

    if (tenantId) {
      const schedules = manager.getSchedules(tenantId);
      console.log(JSON.stringify(schedules, null, 2));
    } else {
      const all = {};
      for (const [tid, schedules] of manager.schedules) {
        all[tid] = schedules;
      }
      console.log(JSON.stringify(all, null, 2));
    }
    process.exit(0);
  }

  if (args.includes('--due')) {
    manager.loadAllSchedules();
    const due = manager.getDueSchedules();
    console.log(JSON.stringify(due, null, 2));
    process.exit(0);
  }

  if (args.includes('--run-due')) {
    manager.loadAllSchedules();
    manager.executeDue()
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
  } else if (args.includes('--start')) {
    manager.start();

    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('\n[CronManager] Shutting down...');
      manager.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      manager.stop();
      process.exit(0);
    });
  }
}
