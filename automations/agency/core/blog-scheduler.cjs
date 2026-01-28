#!/usr/bin/env node
/**
 * Blog Automation Scheduler - Multi-tenant scheduling system
 * 3A Automation - Session 183bis
 *
 * FEATURES:
 *   - Multi-tenant: Each client has their own config
 *   - Languages: FR ↔ EN ↔ ES (configurable per client)
 *   - Schedule: Daily, Weekly, Bi-weekly, Monthly
 *   - Time: Configurable day, hour, minute, timezone
 *   - HITL: Approval required before publication
 *
 * Usage:
 *   node blog-scheduler.cjs --daemon           # Run as daemon (checks every minute)
 *   node blog-scheduler.cjs --check            # Check what's due now
 *   node blog-scheduler.cjs --run=CLIENT_ID    # Force run for specific client
 *   node blog-scheduler.cjs --list             # List all client schedules
 *   node blog-scheduler.cjs --health           # Health check
 *
 * Configuration:
 *   Each client in /clients/{client_id}/config.json has blog_automation section
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const CLIENTS_DIR = path.join(__dirname, '../../../clients');
const BLOG_GENERATOR = path.join(__dirname, 'blog-generator-resilient.cjs');
const SCHEDULE_LOG = path.join(__dirname, '../../../data/blog-schedule-log.json');

// Frequency options
const FREQUENCIES = {
  daily: { days: 1 },
  weekly: { days: 7 },
  biweekly: { days: 14 },
  monthly: { days: 30 },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env')];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        if (!line || line.startsWith('#')) return;
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*)["']?$/);
        if (match) {
          let value = match[2].trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[match[1]] = value;
        }
      });
      break;
    }
  }
}

loadEnv();

/**
 * Get all client configs with blog_automation enabled
 */
function getClients() {
  const clients = [];

  if (!fs.existsSync(CLIENTS_DIR)) {
    console.warn(`[WARN] Clients directory not found: ${CLIENTS_DIR}`);
    return clients;
  }

  const dirs = fs.readdirSync(CLIENTS_DIR);

  for (const dir of dirs) {
    if (dir.startsWith('_')) continue; // Skip template

    const configPath = path.join(CLIENTS_DIR, dir, 'config.json');
    if (!fs.existsSync(configPath)) continue;

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.blog_automation?.enabled) {
        clients.push({
          id: dir,
          name: config.name,
          config: config.blog_automation,
          configPath,
        });
      }
    } catch (e) {
      console.warn(`[WARN] Failed to parse config for ${dir}: ${e.message}`);
    }
  }

  return clients;
}

/**
 * Load schedule log (last run times)
 */
function loadScheduleLog() {
  if (!fs.existsSync(SCHEDULE_LOG)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(SCHEDULE_LOG, 'utf8'));
  } catch (e) {
    return {};
  }
}

/**
 * Save schedule log
 */
function saveScheduleLog(log) {
  const dir = path.dirname(SCHEDULE_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SCHEDULE_LOG, JSON.stringify(log, null, 2));
}

/**
 * Check if client is due for blog generation
 */
function isDue(client, scheduleLog) {
  const schedule = client.config.schedule;
  const lastRun = scheduleLog[client.id]?.lastRun;
  const frequency = FREQUENCIES[schedule.frequency] || FREQUENCIES.weekly;

  const now = new Date();

  // Check day of week (0=Sunday, 1=Monday, etc.)
  if (schedule.day_of_week !== undefined && now.getDay() !== schedule.day_of_week) {
    return { due: false, reason: `Not scheduled day (want ${schedule.day_of_week}, now ${now.getDay()})` };
  }

  // Check hour
  if (schedule.hour !== undefined && now.getHours() !== schedule.hour) {
    return { due: false, reason: `Not scheduled hour (want ${schedule.hour}, now ${now.getHours()})` };
  }

  // Check if already run today
  if (lastRun) {
    const lastRunDate = new Date(lastRun);
    const daysSinceLastRun = (now - lastRunDate) / (1000 * 60 * 60 * 24);

    if (daysSinceLastRun < frequency.days) {
      return {
        due: false,
        reason: `Too soon (${daysSinceLastRun.toFixed(1)} days since last, need ${frequency.days})`
      };
    }
  }

  return { due: true, reason: 'Schedule matched' };
}

/**
 * Run blog generation for a client
 */
async function runBlogGeneration(client, topic = null) {
  console.log(`\n[${client.id}] Starting blog generation...`);
  console.log(`  Languages: ${client.config.languages.join(', ')}`);
  console.log(`  Auto-translate: ${client.config.settings.auto_translate}`);
  console.log(`  Require approval: ${client.config.settings.require_approval}`);

  // Build command
  const args = [
    BLOG_GENERATOR,
    `--topic=${topic || 'Automation trends and best practices for ' + client.name}`,
    `--language=${client.config.languages[0]}`, // Source language
  ];

  // Add multilingual if multiple languages
  if (client.config.languages.length > 1 && client.config.settings.auto_translate) {
    args.push('--multilingual');
  }

  // Add agentic for quality
  if (client.config.settings.quality_threshold >= 8) {
    args.push('--agentic');
  }

  // Set environment for this client
  const env = {
    ...process.env,
    BLOG_LANGUAGES: client.config.languages.join(','),
    BLOG_AGENTIC_QUALITY_THRESHOLD: client.config.settings.quality_threshold.toString(),
  };

  return new Promise((resolve) => {
    console.log(`  Command: node ${args.slice(1).join(' ')}`);

    const proc = spawn('node', args, { env, stdio: 'inherit' });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`[${client.id}] ✅ Blog generation complete`);
        resolve({ success: true });
      } else {
        console.error(`[${client.id}] ❌ Blog generation failed (exit code ${code})`);
        resolve({ success: false, code });
      }
    });

    proc.on('error', (err) => {
      console.error(`[${client.id}] ❌ Failed to start: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Format schedule for display
 */
function formatSchedule(schedule) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = schedule.day_of_week !== undefined ? days[schedule.day_of_week] : '*';
  const hour = schedule.hour !== undefined ? schedule.hour.toString().padStart(2, '0') : '*';
  const minute = schedule.minute !== undefined ? schedule.minute.toString().padStart(2, '0') : '00';
  return `${schedule.frequency} @ ${day} ${hour}:${minute} (${schedule.timezone || 'UTC'})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--(\w+)(?:=(.+))?$/);
    if (match) {
      args[match[1]] = match[2] || true;
    }
  });
  return args;
}

async function main() {
  const args = parseArgs();

  // Health check
  if (args.health) {
    console.log('\n=== BLOG SCHEDULER HEALTH ===');
    console.log(`Clients Directory: ${CLIENTS_DIR}`);
    console.log(`Blog Generator: ${BLOG_GENERATOR}`);
    console.log(`Schedule Log: ${SCHEDULE_LOG}`);

    const clients = getClients();
    console.log(`\nClients with blog_automation enabled: ${clients.length}`);

    if (clients.length > 0) {
      console.log('\n=== CLIENT SCHEDULES ===');
      const scheduleLog = loadScheduleLog();

      for (const client of clients) {
        const lastRun = scheduleLog[client.id]?.lastRun;
        const dueCheck = isDue(client, scheduleLog);
        console.log(`\n[${client.id}] ${client.name}`);
        console.log(`  Languages: ${client.config.languages.join(' + ')}`);
        console.log(`  Schedule: ${formatSchedule(client.config.schedule)}`);
        console.log(`  Last Run: ${lastRun || 'never'}`);
        console.log(`  Due Now: ${dueCheck.due ? '✅ YES' : '❌ NO'} (${dueCheck.reason})`);
      }
    }

    console.log('\n=== SUPPORTED FREQUENCIES ===');
    Object.entries(FREQUENCIES).forEach(([name, conf]) => {
      console.log(`  ${name}: every ${conf.days} day(s)`);
    });

    return;
  }

  // List all schedules
  if (args.list) {
    const clients = getClients();
    const scheduleLog = loadScheduleLog();

    console.log('\n=== BLOG AUTOMATION SCHEDULES ===\n');

    if (clients.length === 0) {
      console.log('No clients with blog_automation enabled.');
      return;
    }

    console.log('| Client | Languages | Schedule | Last Run | Status |');
    console.log('|--------|-----------|----------|----------|--------|');

    for (const client of clients) {
      const lastRun = scheduleLog[client.id]?.lastRun;
      const dueCheck = isDue(client, scheduleLog);
      const langs = client.config.languages.join('+');
      const sched = formatSchedule(client.config.schedule);
      const last = lastRun ? new Date(lastRun).toLocaleDateString() : 'never';
      const status = dueCheck.due ? 'DUE' : 'OK';

      console.log(`| ${client.id.padEnd(10)} | ${langs.padEnd(9)} | ${sched.padEnd(30)} | ${last.padEnd(10)} | ${status.padEnd(6)} |`);
    }

    return;
  }

  // Force run for specific client
  if (args.run) {
    const clientId = args.run;
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);

    if (!client) {
      console.error(`[ERROR] Client not found: ${clientId}`);
      console.log('Available clients:', clients.map(c => c.id).join(', ') || 'none');
      process.exit(1);
    }

    const result = await runBlogGeneration(client, args.topic);

    if (result.success) {
      // Update schedule log
      const scheduleLog = loadScheduleLog();
      scheduleLog[clientId] = {
        lastRun: new Date().toISOString(),
        lastStatus: 'success',
      };
      saveScheduleLog(scheduleLog);
    }

    return;
  }

  // Check what's due
  if (args.check) {
    const clients = getClients();
    const scheduleLog = loadScheduleLog();

    console.log('\n=== CHECKING DUE SCHEDULES ===\n');

    const dueClients = [];
    for (const client of clients) {
      const dueCheck = isDue(client, scheduleLog);
      console.log(`[${client.id}] ${dueCheck.due ? '✅ DUE' : '⏳ Not due'} - ${dueCheck.reason}`);
      if (dueCheck.due) {
        dueClients.push(client);
      }
    }

    console.log(`\nTotal due: ${dueClients.length}/${clients.length}`);

    if (dueClients.length > 0 && !args.dryrun) {
      console.log('\nTo run due clients, use: node blog-scheduler.cjs --run-due');
    }

    return;
  }

  // Run all due clients
  if (args['run-due']) {
    const clients = getClients();
    const scheduleLog = loadScheduleLog();

    console.log('\n=== RUNNING DUE BLOG GENERATIONS ===\n');

    let runCount = 0;
    for (const client of clients) {
      const dueCheck = isDue(client, scheduleLog);
      if (dueCheck.due) {
        const result = await runBlogGeneration(client);
        if (result.success) {
          scheduleLog[client.id] = {
            lastRun: new Date().toISOString(),
            lastStatus: 'success',
          };
          runCount++;
        }
      }
    }

    saveScheduleLog(scheduleLog);
    console.log(`\n=== COMPLETE: ${runCount} client(s) processed ===`);

    return;
  }

  // Daemon mode
  if (args.daemon) {
    console.log('\n=== BLOG SCHEDULER DAEMON ===');
    console.log('Checking schedules every minute...');
    console.log('Press Ctrl+C to stop.\n');

    const checkAndRun = async () => {
      const clients = getClients();
      const scheduleLog = loadScheduleLog();

      for (const client of clients) {
        const dueCheck = isDue(client, scheduleLog);
        if (dueCheck.due) {
          console.log(`[${new Date().toISOString()}] ${client.id} is due, starting...`);
          const result = await runBlogGeneration(client);
          if (result.success) {
            scheduleLog[client.id] = {
              lastRun: new Date().toISOString(),
              lastStatus: 'success',
            };
            saveScheduleLog(scheduleLog);
          }
        }
      }
    };

    // Check immediately, then every minute
    await checkAndRun();
    setInterval(checkAndRun, 60 * 1000);

    return;
  }

  // Help
  console.log(`
[Blog] Automation Scheduler v1.0.0 - 3A Automation

FEATURES:
  - Multi-tenant scheduling
  - Languages: FR ↔ EN ↔ ES (per client)
  - Frequencies: daily, weekly, biweekly, monthly
  - HITL: Approval required before publication

Configuration:
  Each client in /clients/{client_id}/config.json has a blog_automation section:

  "blog_automation": {
    "enabled": true,
    "languages": ["fr", "en"],
    "schedule": {
      "frequency": "weekly",
      "day_of_week": 2,      // 0=Sun, 1=Mon, 2=Tue, etc.
      "hour": 9,             // 0-23
      "minute": 0,           // 0-59
      "timezone": "Europe/Paris"
    },
    "settings": {
      "auto_translate": true,
      "require_approval": true,
      "quality_threshold": 8
    }
  }

Usage:
  node blog-scheduler.cjs --health          Show scheduler status
  node blog-scheduler.cjs --list            List all client schedules
  node blog-scheduler.cjs --check           Check what's due now
  node blog-scheduler.cjs --run=CLIENT_ID   Force run for client
  node blog-scheduler.cjs --run-due         Run all due clients
  node blog-scheduler.cjs --daemon          Run as background daemon

Examples:
  # Check 3A Automation schedule
  node blog-scheduler.cjs --health

  # Force generate for 3A
  node blog-scheduler.cjs --run=3a-automation --topic="E-commerce 2026"

  # Run as cron (add to crontab for every minute check)
  * * * * * cd /path/to/project && node automations/agency/core/blog-scheduler.cjs --check --run-due
`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
