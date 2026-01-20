#!/usr/bin/env node
/**
 * Apify Google Trends Receptor (Sensor)
 * 
 * Role: Real-time pulse extractor. Replaces Stealth v2.0.
 * Strategy: Trinity Pillar #2 (Pulse).
 */

const fs = require('fs');
const path = require('path');
const { ApifyClient } = require('apify-client');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');
const APIFY_TOKEN = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;

async function fetchApifyTrends(queries = ['automation agent', 'ai agency france']) {
    if (!APIFY_TOKEN) {
        throw new Error('APIFY_TOKEN missing in .env');
    }

    const client = new ApifyClient({
        token: APIFY_TOKEN,
    });

    console.log(`🚀 Starting Apify Trends Scraper for: ${queries.join(', ')}`);

    // Trinity Optimization: Batch queries to minimize credits (1000 queries ~ $0.80)
    const input = {
        "searchTerms": queries,
        "timeRange": "now 7-d",
        "geo": "FR",
        "category": "0",
        "maxItems": 10
    };

    // Run the actor
    const run = await client.actor("apify/google-trends-scraper").call(input);

    // Fetch results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return items;
}

function calculatePressure(items) {
    if (!items || items.length === 0) return 50;

    // Average the relative interest scores (0-100)
    let totalInterest = 0;
    let count = 0;

    items.forEach(item => {
        if (item.value !== undefined) {
            totalInterest += parseInt(item.value);
            count++;
        }
    });

    const avg = count > 0 ? Math.round(totalInterest / count) : 50;
    return avg; // Google Trends already uses 0-100 scale, which aligns with GPM pressure.
}

function updateGPM(pressure, items) {
    if (!fs.existsSync(GPM_PATH)) return;
    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    const currentPressure = gpm.sectors.marketing.market_demand.pressure;

    // Preserve existing ads_volume if present
    const adsVolume = gpm.sectors.marketing.market_demand.ads_volume || 0;

    gpm.sectors.marketing.market_demand = {
        label: "Market Demand",
        pressure: pressure,
        trend: pressure > currentPressure ? "rising" : "falling",
        last_check: new Date().toISOString(),
        ads_volume: adsVolume,
        api_status: "ACTIVE",
        sensor_data: {
            source: "APIFY_TRENDS",
            sample_size: items.length,
            representative_value: pressure
        }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: Market Demand (Trends Pulse) is ${pressure}`);
}

async function main() {
    try {
        const items = await fetchApifyTrends();
        const pressure = calculatePressure(items);
        updateGPM(pressure, items);
    } catch (e) {
        console.error("Apify Trends Sensor Failure:", e.message);
        // Fallback or maintain state
    }
}

if (require.main === module) {
    main();
}
