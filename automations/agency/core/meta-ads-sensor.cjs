#!/usr/bin/env node
/**
 * Meta Ads Receptor (Sensor)
 * 
 * Role: Non-agentic data fetcher. Updates GPM pressure based on Meta Ads Performance.
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

    gpm.sectors.marketing.meta_ads = {
        pressure: pressure,
        trend: (gpm.sectors.marketing.meta_ads && pressure > gpm.sectors.marketing.meta_ads.pressure) ? "UP" : "DOWN",
        last_check: new Date().toISOString(),
        sensor_data: stats
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: Meta Ads Pressure is ${pressure}`);
}

async function main() {
    try {
        const token = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
        const adAccountId = process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID;

        if (!token || !adAccountId || adAccountId === 'act_') {
            console.warn("⚠️ Meta Ads credentials missing/incomplete. Reporting CRITICAL GAP.");
            updateGPM(95, { error: "DISCONNECTED", message: "Meta API credentials missing in .env" });
            return;
        }

        // --- REAL META API EXECUTION (No Mocks) ---
        const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights`;
        const params = new URLSearchParams({
            access_token: token,
            date_preset: 'last_7d',
            fields: 'spend,impressions,clicks,conversions,cpc,ctr',
            level: 'account'
        });

        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(`Meta API Error: ${data.error.message}`);
        }

        const insights = data.data?.[0] || { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
        const spend = parseFloat(insights.spend || 0);

        // Pressure mapping: High spend + Low conversion = High Pressure
        let pressure = 50;
        if (spend > 100 && (insights.conversions || 0) === 0) pressure = 85;
        else if (spend > 0 && insights.conversions > 0) pressure = 30;

        updateGPM(pressure, {
            status: "CONNECTED",
            spend,
            conversions: insights.conversions || 0,
            ctr: insights.ctr || 0,
            last_sync: new Date().toISOString()
        });

    } catch (e) {
        console.error("Meta Ads Sensor Failure:", e.message);
    }
}

main();
