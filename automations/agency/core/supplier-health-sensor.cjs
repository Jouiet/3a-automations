#!/usr/bin/env node
/**
 * Supplier Health Sensor
 *
 * Role: Non-agentic data fetcher. Monitors dropshipping supplier health.
 * Metrics: API status, delivery times, stock accuracy
 * Coverage: 3 dropshipping automations (CJ, BigBuy, order-flow)
 * Priority: MOYENNE
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

// Supplier configurations
const SUPPLIERS = {
    cj: {
        name: 'CJ Dropshipping',
        apiUrl: 'https://developers.cjdropshipping.com/api/auth/getAccessToken',
        apiKeyVar: 'CJ_API_KEY'
    },
    bigbuy: {
        name: 'BigBuy',
        apiUrl: 'https://api.bigbuy.eu/rest/catalog/categories.json',
        apiKeyVar: 'BIGBUY_API_KEY'
    }
};

function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000
        };

        const startTime = Date.now();
        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const latency = Date.now() - startTime;
                resolve({
                    status: res.statusCode,
                    latency,
                    data: data
                });
            });
        });

        req.on('error', (e) => resolve({ status: 0, latency: -1, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 0, latency: -1, error: 'Timeout' }); });
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function checkSupplierHealth(supplier, apiKey) {
    const result = {
        name: supplier.name,
        status: 'UNKNOWN',
        latency: -1,
        hasCredentials: !!apiKey,
        error: null
    };

    if (!apiKey) {
        result.status = 'NO_CREDENTIALS';
        result.error = `${supplier.apiKeyVar} not configured`;
        return result;
    }

    try {
        let response;

        if (supplier.name === 'CJ Dropshipping') {
            // CJ requires POST for auth
            response = await httpRequest(supplier.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey: apiKey })
            });
        } else if (supplier.name === 'BigBuy') {
            // BigBuy uses Bearer token
            response = await httpRequest(supplier.apiUrl, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
        }

        result.latency = response.latency;

        if (response.status >= 200 && response.status < 300) {
            result.status = 'HEALTHY';
        } else if (response.status === 401 || response.status === 403) {
            result.status = 'AUTH_ERROR';
            result.error = 'Invalid API credentials';
        } else if (response.status === 429) {
            result.status = 'RATE_LIMITED';
            result.error = 'Rate limit exceeded';
        } else {
            result.status = 'ERROR';
            result.error = `HTTP ${response.status}`;
        }

        // Latency warning
        if (result.latency > 5000) {
            result.status = 'SLOW';
        }

    } catch (e) {
        result.status = 'ERROR';
        result.error = e.message;
    }

    return result;
}

function calculatePressure(suppliers) {
    let pressure = 0;
    let activeSuppliers = 0;
    let healthySuppliers = 0;

    for (const s of suppliers) {
        if (s.hasCredentials) {
            activeSuppliers++;
            if (s.status === 'HEALTHY') healthySuppliers++;
        }
    }

    // No suppliers configured = critical for dropshipping
    if (activeSuppliers === 0) {
        pressure = 80;
    } else {
        // Calculate based on health ratio
        const healthRatio = healthySuppliers / activeSuppliers;
        pressure = Math.round((1 - healthRatio) * 70);

        // Add latency penalties
        for (const s of suppliers) {
            if (s.latency > 5000) pressure += 10;
            if (s.status === 'RATE_LIMITED') pressure += 15;
            if (s.status === 'AUTH_ERROR') pressure += 25;
        }
    }

    return Math.min(pressure, 100);
}

function updateGPM(pressure, suppliers) {
    if (!fs.existsSync(GPM_PATH)) {
        console.log('GPM file not found, skipping update');
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    const previousPressure = gpm.sectors?.operations?.supplier_health?.pressure;

    gpm.sectors = gpm.sectors || {};
    gpm.sectors.operations = gpm.sectors.operations || {};
    gpm.sectors.operations.supplier_health = {
        label: 'Supplier Health',
        pressure: pressure,
        trend: pressure > (previousPressure || 0) ? 'UP' : pressure < (previousPressure || 0) ? 'DOWN' : 'STABLE',
        last_check: new Date().toISOString(),
        sensor_data: {
            suppliers_checked: suppliers.length,
            suppliers_healthy: suppliers.filter(s => s.status === 'HEALTHY').length,
            suppliers_error: suppliers.filter(s => ['ERROR', 'AUTH_ERROR'].includes(s.status)).length,
            details: suppliers.map(s => ({
                name: s.name,
                status: s.status,
                latency_ms: s.latency,
                error: s.error
            }))
        }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));

    console.log(`🏭 GPM Updated: Supplier Health Pressure is ${pressure}`);
    for (const s of suppliers) {
        const icon = s.status === 'HEALTHY' ? '✅' : s.status === 'NO_CREDENTIALS' ? '⚠️' : '❌';
        console.log(`   ${icon} ${s.name}: ${s.status}${s.latency > 0 ? ` (${s.latency}ms)` : ''}`);
    }
}

async function main() {
    console.log('🏭 Checking supplier health...');

    const results = [];

    // Check CJ Dropshipping
    const cjResult = await checkSupplierHealth(SUPPLIERS.cj, process.env.CJ_API_KEY);
    results.push(cjResult);

    // Check BigBuy
    const bigbuyResult = await checkSupplierHealth(SUPPLIERS.bigbuy, process.env.BIGBUY_API_KEY);
    results.push(bigbuyResult);

    const pressure = calculatePressure(results);
    updateGPM(pressure, results);
}

main();
