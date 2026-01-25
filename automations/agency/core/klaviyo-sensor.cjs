#!/usr/bin/env node
/**
 * Klaviyo Email Performance Sensor
 *
 * Role: Non-agentic data fetcher. Monitors email marketing health.
 * Metrics: List growth, Campaign performance, Flow activity
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

// Latest Klaviyo API revision (January 2026)
// Source: https://developers.klaviyo.com/en/reference/api_overview
const KLAVIYO_API_REVISION = '2026-01-15';

async function klaviyoRequest(endpoint, apiKey) {
    // Remove leading slash if present, ensure no double slashes
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const url = `https://a.klaviyo.com/api/${cleanEndpoint}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Klaviyo-API-Key ${apiKey}`,
            'revision': KLAVIYO_API_REVISION,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No error body');
        throw new Error(`Klaviyo API Error: ${response.status} - ${errorBody.substring(0, 200)}`);
    }
    return response.json();
}

async function getEmailMetrics(apiKey) {
    const metrics = {
        lists: { total: 0, totalProfiles: 0 },
        flows: { total: 0, active: 0 },
        campaigns: { recent: 0 }
    };

    try {
        // Get lists
        const listsData = await klaviyoRequest('lists', apiKey);
        metrics.lists.total = listsData.data?.length || 0;

        // Get flows
        const flowsData = await klaviyoRequest('flows', apiKey);
        metrics.flows.total = flowsData.data?.length || 0;
        metrics.flows.active = flowsData.data?.filter(f => f.attributes?.status === 'live').length || 0;

        // Get campaigns - requires channel filter (email or sms)
        // Using filter=equals(messages.channel,'email') for email campaigns
        try {
            const campaignsData = await klaviyoRequest('campaigns?filter=equals(messages.channel,"email")', apiKey);
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            metrics.campaigns.recent = (campaignsData.data || []).filter(c => {
                const createdAt = new Date(c.attributes?.created_at).getTime();
                return createdAt >= thirtyDaysAgo;
            }).length;
        } catch (campaignError) {
            // Campaigns API may have different permissions - continue without it
            console.log('⚠️ Campaigns fetch skipped (may need additional permissions)');
            metrics.campaigns.recent = 0;
        }

    } catch (e) {
        console.error(`Klaviyo API Error: ${e.message}`);
    }

    return metrics;
}

function calculatePressure(metrics) {
    let pressure = 0;

    // No active flows = high pressure
    if (metrics.flows.active === 0) pressure += 40;
    else if (metrics.flows.active < 3) pressure += 20;

    // No recent campaigns = medium pressure
    if (metrics.campaigns.recent === 0) pressure += 25;
    else if (metrics.campaigns.recent < 2) pressure += 10;

    // Few lists = setup incomplete
    if (metrics.lists.total < 2) pressure += 15;

    return Math.min(pressure, 100);
}

function updateGPM(pressure, metrics) {
    if (!fs.existsSync(GPM_PATH)) {
        console.log('GPM file not found, skipping update');
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    gpm.sectors = gpm.sectors || {};
    gpm.sectors.marketing = gpm.sectors.marketing || {};
    gpm.sectors.marketing.klaviyo = {
        pressure: pressure,
        trend: pressure > (gpm.sectors.marketing.klaviyo?.pressure || 0) ? 'UP' : 'DOWN',
        last_check: new Date().toISOString(),
        sensor_data: {
            lists_total: metrics.lists.total,
            flows_total: metrics.flows.total,
            flows_active: metrics.flows.active,
            campaigns_last_30d: metrics.campaigns.recent
        }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: Klaviyo Pressure is ${pressure}`);
    console.log(`   Lists: ${metrics.lists.total}, Flows: ${metrics.flows.active}/${metrics.flows.total} active`);
    console.log(`   Campaigns (30d): ${metrics.campaigns.recent}`);
}

async function healthCheck() {
    console.log('\n📧 Klaviyo Email Sensor - Health Check\n');
    console.log('═'.repeat(50));

    const apiKey = process.env.KLAVIYO_API_KEY || process.env.KLAVIYO_PRIVATE_API_KEY;
    console.log(`API Key: ${apiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`API Revision: ${KLAVIYO_API_REVISION}`);
    console.log(`GPM Path: ${GPM_PATH}`);
    console.log(`GPM Exists: ${fs.existsSync(GPM_PATH) ? '✅ Yes' : '❌ No'}`);

    if (apiKey) {
        try {
            console.log('\nTesting API connection...');
            const listsData = await klaviyoRequest('lists', apiKey);
            console.log(`✅ API Connection: SUCCESS (${listsData.data?.length || 0} lists)`);
        } catch (e) {
            console.log(`❌ API Connection: FAILED - ${e.message}`);
        }
    }

    console.log('\n✅ Klaviyo Sensor: OPERATIONAL');
}

async function main() {
    // Handle --health flag
    if (process.argv.includes('--health')) {
        await healthCheck();
        return;
    }

    const apiKey = process.env.KLAVIYO_API_KEY || process.env.KLAVIYO_PRIVATE_API_KEY;

    if (!apiKey) {
        console.log('⚠️ Klaviyo API key missing. Reporting CRITICAL GAP.');
        updateGPM(95, { lists: { total: 0 }, flows: { total: 0, active: 0 }, campaigns: { recent: 0 } });
        return;
    }

    try {
        console.log('📧 Fetching Klaviyo email metrics...');
        const metrics = await getEmailMetrics(apiKey);
        const pressure = calculatePressure(metrics);
        updateGPM(pressure, metrics);
    } catch (e) {
        console.error(`❌ Klaviyo Sensor Failure: ${e.message}`);
        updateGPM(80, { lists: { total: 0 }, flows: { total: 0, active: 0 }, campaigns: { recent: 0 } });
    }
}

main();
