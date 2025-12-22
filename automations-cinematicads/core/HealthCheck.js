// automations/core/HealthCheck.js
// VERSION 2.0 - Updated December 2025
// Replaced Firecrawl with Playwright (free, with Puppeteer fallback)
const GoogleSheetsClient = require('./GoogleSheetsClient');
const PlaywrightClient = require('./PlaywrightClient');
const AssetFactory = require('../gateway/AssetFactory');
const AnalyticsBridge = require('./AnalyticsBridge');
const Logger = require('./Logger');
const chalk = require('chalk');

async function runHealthCheck() {
    const logger = new Logger('HealthCheck');
    console.log(chalk.bold.cyan('\n=== CINEMATICADS SYSTEM HEALTH CHECK v2.0 ===\n'));

    const results = {
        env: { status: 'OK' },
        google_sheets: { status: 'PENDING' },
        browser: { status: 'PENDING' },
        vertex_ai: { status: 'PENDING' },
        xai_grok: { status: 'PENDING' },
        analytics_bridge: { status: 'PENDING' },
        agentic_loop: { status: 'PENDING' }
    };

    // 1. Check Env Vars (FIRECRAWL_API_KEY no longer required)
    const required = ['GOOGLE_SHEETS_ID', 'GOOGLE_PROJECT_ID'];
    const optional = ['XAI_API_KEY']; // Grok optional
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        results.env.status = `FAIL (Missing: ${missing.join(', ')})`;
    }

    // 2. Google Sheets
    try {
        const sheets = new GoogleSheetsClient();
        const connected = await sheets.checkConnection();
        results.google_sheets.status = connected ? 'OK' : 'FAIL';
    } catch (e) {
        results.google_sheets.status = 'ERROR';
    }

    // 3. Browser (Playwright/Puppeteer)
    try {
        const browser = new PlaywrightClient();
        results.browser.status = `OK (${browser.browserType})`;
    } catch (e) {
        results.browser.status = 'FAIL (install playwright or puppeteer)';
    }

    // 4. Vertex AI
    try {
        const factory = new AssetFactory(process.env.GOOGLE_PROJECT_ID);
        results.vertex_ai.status = process.env.GOOGLE_PROJECT_ID ? 'OK' : 'FAIL';
    } catch (e) {
        results.vertex_ai.status = 'ERROR';
    }

    // 5. xAI Grok (optional dual-provider)
    try {
        if (process.env.XAI_API_KEY) {
            results.xai_grok.status = 'OK (dual-provider enabled)';
        } else {
            results.xai_grok.status = 'SKIP (XAI_API_KEY not set)';
        }
    } catch (e) {
        results.xai_grok.status = 'ERROR';
    }

    // 6. Analytics Bridge
    try {
        const bridge = new AnalyticsBridge();
        results.analytics_bridge.status = 'OK';
    } catch (e) {
        results.analytics_bridge.status = 'ERROR';
    }

    // 7. Agentic Loop
    try {
        const factory = new AssetFactory(process.env.GOOGLE_PROJECT_ID);
        results.agentic_loop.status = factory.reviewAsset ? 'OK' : 'FAIL';
    } catch (e) {
        results.agentic_loop.status = 'ERROR';
    }

    console.log(chalk.bold('--- FINAL REPORT ---'));
    Object.keys(results).forEach(key => {
        const res = results[key];
        const color = res.status.startsWith('OK') || res.status.startsWith('SKIP') ? chalk.green : chalk.red;
        console.log(`${key.toUpperCase().padEnd(20)}: ${color(res.status)}`);
    });
    console.log(chalk.bold.cyan('\n=========================================\n'));
}

if (require.main === module) {
    runHealthCheck();
}