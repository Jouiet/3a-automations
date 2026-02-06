#!/usr/bin/env node
/**
 * SYSTEM HEALTH CHECK - 3A Automation
 * Monitoring centralisé de tous les composants système
 *
 * Usage:
 *   node scripts/system-health-check.cjs           # Full check
 *   node scripts/system-health-check.cjs --quick   # Quick check (APIs only)
 *   node scripts/system-health-check.cjs --json    # JSON output only
 *
 * @author 3A Automation
 * @date 2025-12-29
 * @version 1.0.0
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const QUICK_MODE = process.argv.includes('--quick');
const JSON_MODE = process.argv.includes('--json');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  klaviyo: {
    apiKey: process.env.KLAVIYO_API_KEY
  },
  xai: {
    apiKey: process.env.XAI_API_KEY
  },
  apify: {
    token: process.env.APIFY_TOKEN
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    repo: 'Jouiet/3a-automations'
  },
  hostinger: {
    token: process.env.HOSTINGER_API_TOKEN,
    vpsId: 1168256
  },
  shopify: {
    store: process.env.SHOPIFY_STORE_DOMAIN,
    token: process.env.SHOPIFY_ACCESS_TOKEN,
    version: process.env.SHOPIFY_API_VERSION || '2024-01'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function httpRequest(options) {
  return new Promise((resolve) => {
    const protocol = options.protocol === 'http:' ? http : https;
    const reqOptions = {
      hostname: options.hostname,
      port: options.port || 443,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: json
          });
        } catch {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ ok: false, status: 0, error: e.message });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: 'Timeout 15s' });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

async function checkKlaviyo() {
  if (!CONFIG.klaviyo.apiKey) return { ok: false, reason: 'KLAVIYO_API_KEY missing' };

  const result = await httpRequest({
    hostname: 'a.klaviyo.com',
    path: '/api/lists/',
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.klaviyo.apiKey}`,
      'revision': '2024-10-15'
    }
  });

  if (!result.ok) return { ok: false, reason: result.error || `HTTP ${result.status}` };

  const lists = result.data?.data || [];
  return {
    ok: true,
    totalLists: lists.length,
    lists: lists.map(l => ({ id: l.id, name: l.attributes?.name }))
  };
}

async function checkXai() {
  if (!CONFIG.xai.apiKey) return { ok: false, reason: 'XAI_API_KEY missing' };

  const result = await httpRequest({
    hostname: 'api.x.ai',
    path: '/v1/models',
    headers: { 'Authorization': `Bearer ${CONFIG.xai.apiKey}` }
  });

  if (!result.ok) return { ok: false, reason: result.error || `HTTP ${result.status}` };

  const models = result.data?.data || [];
  return {
    ok: true,
    totalModels: models.length,
    models: models.map(m => m.id).slice(0, 5)
  };
}

async function checkApify() {
  if (!CONFIG.apify.token) return { ok: false, reason: 'APIFY_TOKEN missing' };

  const result = await httpRequest({
    hostname: 'api.apify.com',
    path: '/v2/users/me',
    headers: { 'Authorization': `Bearer ${CONFIG.apify.token}` }
  });

  if (!result.ok) return { ok: false, reason: result.error || `HTTP ${result.status}` };

  return {
    ok: true,
    username: result.data?.username,
    plan: result.data?.plan
  };
}

async function checkGemini() {
  if (!CONFIG.gemini.apiKey) return { ok: false, reason: 'GEMINI_API_KEY missing' };

  const result = await httpRequest({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${CONFIG.gemini.apiKey}`,
    headers: {}
  });

  if (!result.ok) return { ok: false, reason: result.error || `HTTP ${result.status}` };

  const models = result.data?.models || [];
  return {
    ok: true,
    totalModels: models.length,
    models: models.slice(0, 5).map(m => m.name?.split('/').pop())
  };
}

async function checkGitHub() {
  if (!CONFIG.github.token) return { ok: false, reason: 'GITHUB_TOKEN missing' };

  const result = await httpRequest({
    hostname: 'api.github.com',
    path: `/repos/${CONFIG.github.repo}`,
    headers: {
      'Authorization': `Bearer ${CONFIG.github.token}`,
      'User-Agent': '3A-Automation'
    }
  });

  if (!result.ok) return { ok: false, reason: result.error || `HTTP ${result.status}` };

  return {
    ok: true,
    repo: result.data?.full_name,
    lastPush: result.data?.pushed_at,
    stars: result.data?.stargazers_count
  };
}

async function checkHostinger() {
  if (!CONFIG.hostinger.token) return { ok: false, reason: 'HOSTINGER_API_TOKEN missing' };

  const result = await httpRequest({
    hostname: 'developers.hostinger.com',
    path: `/api/vps/v1/virtual-machines/${CONFIG.hostinger.vpsId}`,
    headers: { 'Authorization': `Bearer ${CONFIG.hostinger.token}` }
  });

  if (!result.ok) return { ok: false, reason: result.error || `HTTP ${result.status}` };

  return {
    ok: true,
    hostname: result.data?.hostname,
    state: result.data?.state,
    ip: result.data?.ipv4?.[0]?.address
  };
}

async function checkShopify() {
  if (!CONFIG.shopify.store || !CONFIG.shopify.token) {
    return { ok: false, reason: 'SHOPIFY credentials missing' };
  }

  const result = await httpRequest({
    hostname: CONFIG.shopify.store,
    path: `/admin/api/${CONFIG.shopify.version}/shop.json`,
    headers: { 'X-Shopify-Access-Token': CONFIG.shopify.token }
  });

  if (!result.ok) return { ok: false, reason: result.error || `HTTP ${result.status}` };

  return {
    ok: true,
    name: result.data?.shop?.name,
    plan: result.data?.shop?.plan_name,
    currency: result.data?.shop?.currency
  };
}

async function checkBookingAPI() {
  // Google Apps Script uses redirects - we need to follow them
  return new Promise((resolve) => {
    const url = 'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec?action=availability';

    const followRedirect = (currentUrl, depth = 0) => {
      if (depth > 5) {
        resolve({ ok: false, reason: 'Too many redirects' });
        return;
      }

      const urlObj = new URL(currentUrl);
      const req = https.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          followRedirect(res.headers.location, depth + 1);
          return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const slots = json.slots || [];
            resolve({
              ok: true,
              totalSlots: slots.length,
              nextAvailable: slots[0]?.datetime
            });
          } catch {
            resolve({ ok: false, reason: 'Invalid JSON response' });
          }
        });
      });

      req.on('error', (e) => resolve({ ok: false, reason: e.message }));
      req.setTimeout(15000, () => {
        req.destroy();
        resolve({ ok: false, reason: 'Timeout 15s' });
      });
      req.end();
    };

    followRedirect(url);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE SYSTEM CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

function checkScripts() {
  const automationsDir = path.join(__dirname, '..', 'automations');

  const countFiles = (dir, ext) => {
    let count = 0;
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.')) {
          count += countFiles(fullPath, ext);
        } else if (item.isFile() && item.name.endsWith(ext)) {
          count++;
        }
      }
    } catch { /* ignore */ }
    return count;
  };

  const cjsCount = countFiles(automationsDir, '.cjs');
  const jsCount = countFiles(automationsDir, '.js');
  const jsonCount = countFiles(automationsDir, '.json');

  return {
    ok: true,
    scripts: {
      cjs: cjsCount,
      js: jsCount,
      json: jsonCount,
      total: cjsCount + jsCount
    }
  };
}

function checkRegistry() {
  const registryPath = path.join(__dirname, '..', 'automations', 'automations-registry.json');

  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    return {
      ok: true,
      version: registry.version,
      totalAutomations: registry.automations?.length || 0,
      categories: [...new Set((registry.automations || []).map(a => a.category))]
    };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

function checkWebsite() {
  const siteDir = path.join(__dirname, '..', 'landing-page-hostinger');

  const countHtml = (dir) => {
    let count = 0;
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.')) {
          count += countHtml(fullPath);
        } else if (item.isFile() && item.name.endsWith('.html')) {
          count++;
        }
      }
    } catch { /* ignore */ }
    return count;
  };

  const frPages = countHtml(siteDir);
  const enDir = path.join(siteDir, 'en');
  const enPages = fs.existsSync(enDir) ? countHtml(enDir) : 0;

  return {
    ok: true,
    pages: {
      fr: frPages - enPages,
      en: enPages,
      total: frPages
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  const results = {
    timestamp,
    version: '1.0.0',
    apis: {},
    system: {},
    summary: { ok: 0, fail: 0, total: 0 }
  };

  // API Checks
  const apiChecks = [
    { name: 'klaviyo', fn: checkKlaviyo },
    { name: 'shopify', fn: checkShopify },
    { name: 'xai', fn: checkXai },
    { name: 'apify', fn: checkApify },
    { name: 'gemini', fn: checkGemini },
    { name: 'github', fn: checkGitHub },
    { name: 'hostinger', fn: checkHostinger },
    { name: 'booking', fn: checkBookingAPI }
  ];

  if (!JSON_MODE) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║          SYSTEM HEALTH CHECK - 3A Automation                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📅 ${timestamp}`);
    console.log('');
    console.log('──────────────────────────────────────────────────────────────────────────');
    console.log('                           API STATUS');
    console.log('──────────────────────────────────────────────────────────────────────────');
  }

  for (const check of apiChecks) {
    if (!JSON_MODE) process.stdout.write(`  ${check.name.padEnd(12)} `);

    try {
      const result = await check.fn();
      results.apis[check.name] = result;
      results.summary.total++;

      if (result.ok) {
        results.summary.ok++;
        if (!JSON_MODE) {
          let detail = '';
          if (result.totalWorkflows !== undefined) detail = `${result.active}/${result.totalWorkflows} active`;
          else if (result.totalLists !== undefined) detail = `${result.totalLists} lists`;
          else if (result.plan && result.currency) detail = `${result.plan} - ${result.currency}`;
          else if (result.totalModels !== undefined) detail = `${result.totalModels} models`;
          else if (result.totalSlots !== undefined) detail = `${result.totalSlots} slots`;
          else if (result.state) detail = result.state;
          console.log(`✅ OK ${detail ? `(${detail})` : ''}`);
        }
      } else {
        results.summary.fail++;
        if (!JSON_MODE) console.log(`❌ FAIL - ${result.reason}`);
      }
    } catch (e) {
      results.apis[check.name] = { ok: false, reason: e.message };
      results.summary.fail++;
      results.summary.total++;
      if (!JSON_MODE) console.log(`❌ ERROR - ${e.message}`);
    }
  }

  // System Checks (skip in quick mode)
  if (!QUICK_MODE) {
    if (!JSON_MODE) {
      console.log('');
      console.log('──────────────────────────────────────────────────────────────────────────');
      console.log('                         SYSTEM STATUS');
      console.log('──────────────────────────────────────────────────────────────────────────');
    }

    results.system.scripts = checkScripts();
    results.system.registry = checkRegistry();
    results.system.website = checkWebsite();

    if (!JSON_MODE) {
      const s = results.system.scripts;
      console.log(`  Scripts      ${s.ok ? '✅' : '❌'} ${s.scripts?.total || 0} total (${s.scripts?.cjs || 0} .cjs, ${s.scripts?.js || 0} .js)`);

      const r = results.system.registry;
      console.log(`  Registry     ${r.ok ? '✅' : '❌'} v${r.version || '?'} - ${r.totalAutomations || 0} automations`);

      const w = results.system.website;
      console.log(`  Website      ${w.ok ? '✅' : '❌'} ${w.pages?.total || 0} pages (${w.pages?.fr || 0} FR, ${w.pages?.en || 0} EN)`);
    }
  }

  // Summary
  const duration = Date.now() - startTime;
  const score = Math.round((results.summary.ok / results.summary.total) * 100);

  results.summary.score = score;
  results.summary.duration = duration;

  if (!JSON_MODE) {
    console.log('');
    console.log('══════════════════════════════════════════════════════════════════════════');
    console.log(`  SCORE: ${score}% (${results.summary.ok}/${results.summary.total} OK) | Duration: ${duration}ms`);
    console.log('══════════════════════════════════════════════════════════════════════════');
    console.log('');
  }

  // Save results
  const outputDir = path.join(__dirname, '..', 'outputs');
  const outputPath = path.join(outputDir, 'system-health.json');

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  if (JSON_MODE) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`📁 Results saved: ${outputPath}`);
  }

  // Exit with appropriate code
  process.exit(score >= 70 ? 0 : 1);
}

main().catch(e => {
  console.error('❌ Health check failed:', e.message);
  process.exit(1);
});
