#!/usr/bin/env node
/**
 * GSC Situational Receptor (Sensor)
 * 
 * Role: Non-agentic data fetcher. Updates GPM pressure based on SEO opportunities.
 * Purpose: Decouples "Observation" from "Orchestration".
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

// Helper: Get date in YYYY-MM-DD format
function getDateString(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

async function fetchGSCData(siteUrl) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS missing');
    }

    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    // GSC API requires YYYY-MM-DD format, data available with 3-day delay
    const startDate = getDateString(30);  // 30 days ago
    const endDate = getDateString(3);     // 3 days ago (GSC data delay)

    const res = await searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
            startDate: startDate,
            endDate: endDate,
            dimensions: ['query'],
            rowLimit: 10
        }
    });

    return res.data.rows || [];
}

function calculatePressure(rows) {
    if (!rows || rows.length === 0) return 0;

    // High Pressure = High impressions but low CTR/Position (The "Gap")
    const topGap = rows.map(r => ({
        query: r.keys[0],
        score: r.impressions * (1 - r.ctr) / r.position
    })).sort((a, b) => b.score - a.score)[0];

    // Normalize to 0-100
    return Math.min(100, Math.round(topGap.score / 10));
}

function updateGPM(pressure, topQuery) {
    if (!fs.existsSync(GPM_PATH)) return;

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    gpm.sectors.seo.gsc_gaps = {
        pressure: pressure,
        trend: pressure > gpm.sectors.seo.gsc_gaps.pressure ? "UP" : "DOWN",
        last_check: new Date().toISOString(),
        sensor_data: { top_gap_potential: pressure, target_query: topQuery }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: SEO Pressure is ${pressure} (Topic: ${topQuery})`);
}

async function main() {
    const siteUrl = process.env.GSC_SITE_URL || 'https://3a-automation.com';
    try {
        const rows = await fetchGSCData(siteUrl);
        const pressure = calculatePressure(rows);
        const topQuery = rows.length > 0 ? rows[0].keys[0] : 'N/A';
        updateGPM(pressure, topQuery);
    } catch (e) {
        console.error(`❌ Sensor Failure: ${e.message}`);
        if (e.message.includes('not been used') || e.message.includes('disabled')) {
            console.error("💡 Action Required: Enable Search Console API in Cloud Console.");
        }
    }
}

main();
