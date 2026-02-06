#!/usr/bin/env node
/**
 * MASTER SCHEDULER - 3A Automation
 *
 * Orchestrates all scheduled automations based on their defined frequencies.
 * Run via cron on VPS: every 5 minutes
 * Crontab: "asterisk/5 asterisk asterisk asterisk asterisk node master-scheduler.cjs"
 *
 * The scheduler checks current time and runs appropriate scripts.
 *
 * Version: 1.0.0
 * Date: 2025-12-28
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BASE_DIR = path.resolve(__dirname, '..');
const AUTOMATIONS_DIR = path.join(BASE_DIR, 'automations');
const SCRIPTS_DIR = path.join(BASE_DIR, 'scripts');
const LOG_DIR = path.join(BASE_DIR, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const SCHEDULES = {
  // EVERY 5 MINUTES (runs every execution of this scheduler)
  'every-5-min': [],

  // HOURLY
  hourly: [
    { name: 'Meta Leads → Shopify', script: 'clients/leads/sync-meta-leads-to-shopify.cjs', type: 'automation' },
    { name: 'Google Ads → Shopify', script: 'clients/leads/sync-google-ads-leads-to-shopify.cjs', type: 'automation' },
    { name: 'TikTok Leads → Shopify', script: 'clients/leads/sync-tiktok-ads-leads-to-shopify.cjs', type: 'automation' },
  ],

  // EVERY 6 HOURS
  'every-6-hours': [
    // LinkedIn Scraper is handled by dedicated script
  ],

  // DAILY (run at 6:00 AM)
  daily: [
    { name: 'Geo-Segmentation', script: 'clients/klaviyo/geo-segment-profiles.cjs', type: 'automation' },
    { name: 'A/B Sender Rotation', script: 'clients/klaviyo/rotation_email.cjs', type: 'automation' },
  ],

  // WEEKLY (run on Mondays at 9:00 AM)
  weekly: [
    { name: 'Hiring Intelligence', script: 'generic/scrape-hiring-companies.cjs', type: 'automation' },
    { name: 'Image Sitemap', script: 'clients/seo/generate_image_sitemap.cjs', type: 'automation' },
    { name: 'Export → Facebook Audiences', script: 'clients/shopify/export-shopify-customers-facebook.cjs', type: 'automation' },
    { name: 'GA4 Source Report', script: 'clients/analytics/analyze-ga4-source.cjs', type: 'automation' },
    { name: 'BNPL Performance', script: 'clients/analytics/track-bnpl-performance.cjs', type: 'automation' },
    { name: 'Blog Article Generator', script: 'generate-blog-article.cjs', type: 'script',
      args: ['--topic', 'Automation Tip of the Week', '--category', 'Automation'] },
  ],

  // BATCH (run on Tuesdays at 3:00 AM)
  batch: [
    { name: 'Image Alt Text Correction', script: 'clients/seo/fix-missing-alt-text.cjs', type: 'automation' },
  ],

  // MONTHLY (run on 1st of month at 9:00 AM)
  monthly: [
    // Add monthly scripts here
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);

  // Also write to log file
  const logFile = path.join(LOG_DIR, `scheduler-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage + '\n');
}

function runScript(task) {
  const scriptPath = task.type === 'automation'
    ? path.join(AUTOMATIONS_DIR, task.script)
    : path.join(SCRIPTS_DIR, task.script);

  if (!fs.existsSync(scriptPath)) {
    log(`❌ SCRIPT NOT FOUND: ${scriptPath}`);
    return false;
  }

  try {
    log(`▶️  Running: ${task.name}`);
    const args = task.args || [];
    const result = execSync(`node "${scriptPath}" ${args.join(' ')}`, {
      cwd: BASE_DIR,
      timeout: 300000, // 5 minute timeout
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    log(`✅ Completed: ${task.name}`);
    return true;
  } catch (error) {
    log(`❌ Failed: ${task.name} - ${error.message}`);
    return false;
  }
}

function shouldRunSchedule(schedule) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
  const dayOfMonth = now.getDate();

  switch (schedule) {
    case 'every-5-min':
      return true; // Always run

    case 'hourly':
      return minute < 5; // Run in first 5 minutes of each hour

    case 'every-6-hours':
      return minute < 5 && [0, 6, 12, 18].includes(hour);

    case 'daily':
      return hour === 6 && minute < 5; // 6:00 AM

    case 'weekly':
      return dayOfWeek === 1 && hour === 9 && minute < 5; // Monday 9:00 AM

    case 'batch':
      return dayOfWeek === 2 && hour === 3 && minute < 5; // Tuesday 3:00 AM

    case 'monthly':
      return dayOfMonth === 1 && hour === 9 && minute < 5; // 1st of month 9:00 AM

    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const forceSchedule = args[0]; // e.g., --force hourly

  log('════════════════════════════════════════════════════════════════');
  log('  MASTER SCHEDULER - 3A Automation');
  log('════════════════════════════════════════════════════════════════');

  let tasksRun = 0;
  let tasksSuccess = 0;
  let tasksFailed = 0;

  for (const [schedule, tasks] of Object.entries(SCHEDULES)) {
    const shouldRun = forceSchedule === `--force`
      ? args[1] === schedule
      : shouldRunSchedule(schedule);

    if (shouldRun && tasks.length > 0) {
      log(`\n📅 Running ${schedule.toUpperCase()} schedule (${tasks.length} tasks):`);

      for (const task of tasks) {
        tasksRun++;
        const success = runScript(task);
        if (success) {
          tasksSuccess++;
        } else {
          tasksFailed++;
        }
      }
    }
  }

  log('\n════════════════════════════════════════════════════════════════');
  log(`  SUMMARY: ${tasksRun} run, ${tasksSuccess} success, ${tasksFailed} failed`);
  log('════════════════════════════════════════════════════════════════\n');

  if (tasksRun === 0) {
    log('No tasks scheduled for this time window.');
    log('Use --force <schedule> to run manually, e.g.: node master-scheduler.cjs --force hourly');
  }

  process.exit(tasksFailed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`FATAL ERROR: ${error.message}`);
  process.exit(1);
});
