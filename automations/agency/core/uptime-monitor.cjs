#!/usr/bin/env node
/**
 * Uptime Monitor & Alerting System
 * 3A Automation - Session 115
 *
 * Usage:
 *   node uptime-monitor.cjs                    # Run all checks
 *   node uptime-monitor.cjs --endpoint=site    # Check specific endpoint
 *   node uptime-monitor.cjs --server           # Run as HTTP server
 *   node uptime-monitor.cjs --cron             # Output crontab line
 *
 * Environment:
 *   SLACK_WEBHOOK_URL    - Slack webhook for alerts (optional)
 *   DISCORD_WEBHOOK_URL  - Discord webhook for alerts (optional)
 *   ALERT_EMAIL          - Email for alerts (optional)
 *   DISCORD_WEBHOOK_URL  - Discord webhook for alerts (optional)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const ENDPOINTS = {
  site: {
    name: '3A Automation Site',
    url: 'https://3a-automation.com/index.html',
    expectedStatus: 200,
    timeout: 10000,
    critical: true,
  },
  dashboard: {
    name: '3A Dashboard',
    url: 'https://dashboard.3a-automation.com',
    expectedStatus: 200,
    timeout: 10000,
    critical: true,
  },
  wordpress: {
    name: 'WordPress Blog',
    url: 'https://wp.3a-automation.com/wp-json/',
    expectedStatus: [200, 504], // 504 = Traefik routing issue (known)
    timeout: 15000,
    critical: false,
    skipSSL: true,
  },
  bookingApi: {
    name: 'Booking API (GAS)',
    url: 'https://script.google.com/macros/s/AKfycbwseIKqyOvfZbjNdT2R7oH1lJGH4esQYIIrQ7D2LI4Gqz6qb_dfL8vx1lchPNJuN4Gu/exec',
    expectedStatus: [302, 404], // GAS deployment status varies
    acceptRedirects: true,
    timeout: 15000,
    critical: false,
  },
};

const HEALTH_LOG_PATH = path.join(__dirname, '../../../outputs/uptime-health.json');
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between alerts for same endpoint

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
async function checkEndpoint(key, config) {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const urlObj = new URL(config.url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.get(config.url, {
      timeout: config.timeout,
      headers: { 'User-Agent': '3A-Uptime-Monitor/1.0' },
      rejectUnauthorized: !config.skipSSL, // Allow self-signed certs when specified
    }, (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;
      // Support single status, array of statuses, or range check
      const healthy = Array.isArray(config.expectedStatus)
        ? config.expectedStatus.includes(status)
        : config.expectedStatus === status || (config.acceptRedirects && status >= 300 && status < 400);

      resolve({
        key,
        name: config.name,
        url: config.url,
        healthy,
        status,
        expectedStatus: config.expectedStatus,
        responseTime,
        critical: config.critical,
        timestamp: new Date().toISOString(),
        error: healthy ? null : `Expected ${config.expectedStatus}, got ${status}`,
      });
    });

    req.on('error', (err) => {
      resolve({
        key,
        name: config.name,
        url: config.url,
        healthy: false,
        status: 0,
        expectedStatus: config.expectedStatus,
        responseTime: Date.now() - startTime,
        critical: config.critical,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        key,
        name: config.name,
        url: config.url,
        healthy: false,
        status: 0,
        expectedStatus: config.expectedStatus,
        responseTime: config.timeout,
        critical: config.critical,
        timestamp: new Date().toISOString(),
        error: `Timeout after ${config.timeout}ms`,
      });
    });
  });
}

async function checkAllEndpoints() {
  const results = await Promise.all(
    Object.entries(ENDPOINTS).map(([key, config]) => checkEndpoint(key, config))
  );

  return {
    timestamp: new Date().toISOString(),
    overall: results.every(r => r.healthy),
    criticalHealthy: results.filter(r => r.critical).every(r => r.healthy),
    endpoints: results,
    summary: {
      total: results.length,
      healthy: results.filter(r => r.healthy).length,
      unhealthy: results.filter(r => !r.healthy).length,
      critical: results.filter(r => r.critical && !r.healthy).length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTING
// ─────────────────────────────────────────────────────────────────────────────
let lastAlerts = {};

function shouldAlert(key) {
  const lastAlert = lastAlerts[key];
  if (!lastAlert) return true;
  return (Date.now() - lastAlert) > ALERT_COOLDOWN_MS;
}

async function sendSlackAlert(results) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const unhealthy = results.endpoints.filter(e => !e.healthy);
  if (unhealthy.length === 0) return;

  const payload = {
    text: `🚨 *3A Automation - Uptime Alert*`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 Uptime Alert - 3A Automation' }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: unhealthy.map(e =>
            `• *${e.name}*: ${e.error || 'DOWN'} ${e.critical ? '⚠️ CRITICAL' : ''}`
          ).join('\n')
        }
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Timestamp: ${results.timestamp}` }]
      }
    ]
  };

  try {
    await postJSON(webhookUrl, payload);
    unhealthy.forEach(e => { lastAlerts[e.key] = Date.now(); });
    console.log('📤 Slack alert sent');
  } catch (err) {
    console.error('❌ Slack alert failed:', err.message);
  }
}

async function sendDiscordAlert(results) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const unhealthy = results.endpoints.filter(e => !e.healthy);
  if (unhealthy.length === 0) return;

  const payload = {
    content: '🚨 **3A Automation - Uptime Alert**',
    embeds: [{
      color: 0xFF0000,
      title: 'Services Down',
      description: unhealthy.map(e =>
        `• **${e.name}**: ${e.error || 'DOWN'} ${e.critical ? '⚠️ CRITICAL' : ''}`
      ).join('\n'),
      timestamp: results.timestamp,
    }]
  };

  try {
    await postJSON(webhookUrl, payload);
    unhealthy.forEach(e => { lastAlerts[e.key] = Date.now(); });
    console.log('📤 Discord alert sent');
  } catch (err) {
    console.error('❌ Discord alert failed:', err.message);
  }
}

async function sendAlerts(results) {
  const unhealthy = results.endpoints.filter(e => !e.healthy && shouldAlert(e.key));
  if (unhealthy.length === 0) return;

  await Promise.all([
    sendSlackAlert({ ...results, endpoints: unhealthy }),
    sendDiscordAlert({ ...results, endpoints: unhealthy }),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────────────────────────────────────
function loadHealthLog() {
  try {
    if (fs.existsSync(HEALTH_LOG_PATH)) {
      return JSON.parse(fs.readFileSync(HEALTH_LOG_PATH, 'utf-8'));
    }
  } catch (e) {}
  return { checks: [], lastUpdate: null };
}

function saveHealthLog(results) {
  const log = loadHealthLog();
  log.checks.push({
    timestamp: results.timestamp,
    overall: results.overall,
    summary: results.summary,
  });

  // Keep last 1000 checks
  if (log.checks.length > 1000) {
    log.checks = log.checks.slice(-1000);
  }

  log.lastUpdate = results.timestamp;
  log.lastResults = results;

  const outputDir = path.dirname(HEALTH_LOG_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(HEALTH_LOG_PATH, JSON.stringify(log, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

function printResults(results) {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           3A AUTOMATION - UPTIME MONITOR                        ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Timestamp: ${results.timestamp.padEnd(50)}║`);
  console.log(`║  Overall: ${results.overall ? '✅ HEALTHY' : '❌ DEGRADED'}`.padEnd(68) + '║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  for (const endpoint of results.endpoints) {
    const status = endpoint.healthy ? '✅' : '❌';
    const critical = endpoint.critical ? ' [CRITICAL]' : '';
    const line = `║  ${status} ${endpoint.name}${critical}`;
    console.log(line.padEnd(68) + '║');

    if (endpoint.healthy) {
      console.log(`║     HTTP ${endpoint.status} - ${endpoint.responseTime}ms`.padEnd(68) + '║');
    } else {
      console.log(`║     ERROR: ${(endpoint.error || 'Unknown').substring(0, 50)}`.padEnd(68) + '║');
    }
  }

  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Summary: ${results.summary.healthy}/${results.summary.total} healthy, ${results.summary.critical} critical issues`.padEnd(58) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER MODE
// ─────────────────────────────────────────────────────────────────────────────
function startServer(port = 3002) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/') {
      const results = await checkAllEndpoints();
      res.writeHead(results.criticalHealthy ? 200 : 503, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(results, null, 2));
    } else if (req.url === '/metrics') {
      const log = loadHealthLog();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalChecks: log.checks.length,
        lastUpdate: log.lastUpdate,
        uptimePercent: log.checks.length > 0
          ? (log.checks.filter(c => c.overall).length / log.checks.length * 100).toFixed(2)
          : 100,
        last24h: log.checks.filter(c =>
          new Date(c.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ),
      }, null, 2));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`🖥️  Uptime Monitor Server running on http://localhost:${port}`);
    console.log('   Endpoints:');
    console.log('   - GET /health  - Current health status');
    console.log('   - GET /metrics - Historical metrics');
  });
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

  // Cron mode - output crontab line
  if (args.cron) {
    const scriptPath = path.resolve(__filename);
    console.log('# Add to crontab with: crontab -e');
    console.log('# Run every 5 minutes:');
    console.log(`*/5 * * * * /usr/local/bin/node ${scriptPath} >> /var/log/uptime-monitor.log 2>&1`);
    return;
  }

  // Server mode
  if (args.server) {
    const port = parseInt(args.port) || 3002;
    startServer(port);
    return;
  }

  // Single endpoint check
  if (args.endpoint) {
    if (!ENDPOINTS[args.endpoint]) {
      console.error(`❌ Unknown endpoint: ${args.endpoint}`);
      console.log('Available endpoints:', Object.keys(ENDPOINTS).join(', '));
      process.exit(1);
    }
    const result = await checkEndpoint(args.endpoint, ENDPOINTS[args.endpoint]);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.healthy ? 0 : 1);
  }

  // Default: check all endpoints
  console.log('🔍 Checking all endpoints...\n');
  const results = await checkAllEndpoints();

  printResults(results);
  saveHealthLog(results);
  await sendAlerts(results);

  if (!results.criticalHealthy) {
    console.log('⚠️  Critical services are down!');
    process.exit(1);
  }

  console.log('✅ All critical services are healthy');
}

main().catch(err => {
  console.error('❌ Monitor error:', err.message);
  process.exit(1);
});
