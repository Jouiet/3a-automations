#!/usr/bin/env node
/**
 * GA4 Situational Receptor (Sensor)
 * 
 * Role: Non-agentic data fetcher. Updates GPM pressure based on marketing ROI.
 * Purpose: Decouples "Observation" from "Reasoning" to save tokens.
 */

const fs = require('fs');
const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

async function fetchGA4Data(propertyId) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS missing');
    }

    const analyticsDataClient = new BetaAnalyticsDataClient();
    const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
            { name: 'advertiserAdCost' }
        ],
    });

    return response.rows.map(row => ({
        source: row.dimensionValues[0].value,
        revenue: parseFloat(row.metricValues[2].value),
        cost: parseFloat(row.metricValues[3] ? row.metricValues[3].value : 0)
    }));
}

function updateGPM(sensorData) {
    if (!fs.existsSync(GPM_PATH)) {
        console.error("GPM Matrix not found at", GPM_PATH);
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    // 1. Marketing Logic (Google Ads)
    const googleAds = sensorData.find(s => s.source.toLowerCase().includes('google'));
    let globalRoas = 0;

    if (googleAds && googleAds.cost > 0) {
        const roas = googleAds.revenue / googleAds.cost;
        globalRoas = roas;
        let pressure = 0;

        if (roas > 5) pressure = 95; // Critical opportunity
        else if (roas > 4) pressure = 75; // High opportunity
        else if (roas < 2) pressure = 10; // Low/Negative pressure
        else pressure = 50; // Neutral

        gpm.sectors.marketing.google_ads = {
            pressure: pressure,
            trend: (gpm.sectors.marketing.google_ads && pressure > gpm.sectors.marketing.google_ads.pressure) ? "UP" : "DOWN",
            last_check: new Date().toISOString(),
            sensor_data: { roas: roas.toFixed(2), cost: googleAds.cost, revenue: googleAds.revenue }
        };
    }

    // 2. Global Metrics Alignment (For Goal Protection)
    if (!gpm.metrics) gpm.metrics = {};
    gpm.metrics.global_roas = globalRoas.toFixed(2);
    gpm.metrics.total_revenue_7d = sensorData.reduce((acc, s) => acc + s.revenue, 0).toFixed(2);

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: Marketing Pressure is ${gpm.sectors.marketing.google_ads.pressure}, Global ROAS: ${globalRoas.toFixed(2)}`);
}

async function main() {
    // Handle --health check
    if (process.argv.includes('--health')) {
        const propertyId = process.env.GA4_PROPERTY_ID || '467652758';
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const health = {
            status: credentials ? 'ok' : 'error',
            sensor: 'ga4-sensor',
            version: '1.0.0',
            credentials: {
                GA4_PROPERTY_ID: propertyId ? 'set' : 'missing',
                GOOGLE_APPLICATION_CREDENTIALS: credentials ? 'set' : 'missing'
            },
            property_id: propertyId,
            gpm_path: GPM_PATH,
            gpm_exists: fs.existsSync(GPM_PATH),
            metrics: ['sessions', 'conversions', 'totalRevenue', 'advertiserAdCost'],
            timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(health, null, 2));
        process.exit(health.status === 'ok' ? 0 : 1);
    }

    const propertyId = process.env.GA4_PROPERTY_ID || '467652758';
    try {
        const data = await fetchGA4Data(propertyId);
        updateGPM(data);
    } catch (e) {
        console.error("Sensor Failure:", e.message);
        // Fallback: report system pressure mismatch if needed
    }
}

main();
