#!/usr/bin/env node
/**
 * TikTok Ads Receptor (Sensor)
 * 
 * Role: Non-agentic data fetcher. Updates GPM pressure based on TikTok Ads Performance.
 * API: TikTok for Business API v1.3+ (Node.js SDK / Graph API)
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

function updateGPM(pressure, stats) {
    if (!fs.existsSync(GPM_PATH)) return;
    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    gpm.sectors.marketing.tiktok_ads = {
        pressure: pressure,
        trend: (gpm.sectors.marketing.tiktok_ads && pressure > gpm.sectors.marketing.tiktok_ads.pressure) ? "UP" : "DOWN",
        last_check: new Date().toISOString(),
        sensor_data: stats
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: TikTok Ads Pressure is ${pressure}`);
}

async function main() {
    try {
        const token = process.env.TIKTOK_ACCESS_TOKEN;
        const advertiserId = process.env.TIKTOK_ADVERTISER_ID;

        if (!token || !advertiserId) {
            console.warn("⚠️ TikTok Ads credentials missing. Reporting CRITICAL GAP.");
            updateGPM(95, { error: "DISCONNECTED", message: "TikTok API credentials missing in .env" });
            return;
        }

        // --- REAL TIKTOK API EXECUTION (No Mocks) ---
        // ROLE: Fetch campaign insights (spend, conversions, impressions)
        const url = 'https://business-api.tiktok.com/open_api/v1.3/reporting/get/';
        const params = new URLSearchParams({
            advertiser_id: advertiserId,
            report_type: 'BASIC',
            data_level: 'AUCTION_CAMPAIGN',
            dimensions: JSON.stringify(['campaign_id']),
            metrics: JSON.stringify(['spend', 'conversions', 'impressions', 'ctr']),
            start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0]
        });

        const response = await fetch(`${url}?${params.toString()}`, {
            headers: { 'Access-Token': token }
        });
        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`TikTok API Error: ${data.message} (Code: ${data.code})`);
        }

        const list = data.data?.list || [];
        const totalSpend = list.reduce((acc, curr) => acc + parseFloat(curr.metrics?.spend || 0), 0);
        const totalConversions = list.reduce((acc, curr) => acc + parseInt(curr.metrics?.conversions || 0), 0);

        // Pressure mapping: High Spend + Low Conversions = High Pressure on Agency
        let pressure = 50;
        if (totalSpend > 50 && totalConversions === 0) pressure = 90;
        else if (totalSpend > 0 && totalConversions > 0) pressure = 25;

        updateGPM(pressure, {
            status: "CONNECTED",
            total_spend: totalSpend,
            total_conversions: totalConversions,
            ad_count: list.length,
            last_sync: new Date().toISOString()
        });

    } catch (e) {
        console.error("TikTok Ads Sensor Failure:", e.message);
        // Do not update GPM on transient errors to avoid noise, unless persistent
    }
}

main();
