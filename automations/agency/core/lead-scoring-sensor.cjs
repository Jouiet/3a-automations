#!/usr/bin/env node
/**
 * Lead Scoring Receptor (Sensor)
 * 
 * Role: Non-agentic data fetcher. Updates GPM pressure based on Lead Data Quality.
 */

const fs = require('fs');
const path = require('path');

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');
const SCORED_LEADS_PATH = path.join(__dirname, '../../../leads-scored.json');

function updateGPM(pressure, stats) {
    if (!fs.existsSync(GPM_PATH)) return;
    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    gpm.sectors.sales.lead_scoring = {
        pressure: pressure,
        trend: (gpm.sectors.sales.lead_scoring && pressure > gpm.sectors.sales.lead_scoring.pressure) ? "UP" : "DOWN",
        last_check: new Date().toISOString(),
        sensor_data: stats
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: Lead Scoring Pressure is ${pressure}`);
}

async function main() {
    try {
        if (!fs.existsSync(SCORED_LEADS_PATH)) {
            updateGPM(95, { error: "Scored leads file missing" });
            return;
        }

        const data = JSON.parse(fs.readFileSync(SCORED_LEADS_PATH, 'utf8'));
        const qualityScore = data.quality ? data.quality.score : 0;

        let pressure = 0;
        if (qualityScore < 4) pressure = 95; // Critical need for refinement
        else if (qualityScore < 7) pressure = 60; // Needs attention
        else pressure = 10; // Good quality

        // Check for stale data (last scored > 7 days ago)
        const lastScored = data.scores && data.scores.length > 0 ? new Date(data.scores[0].scored_at) : new Date(0);
        const daysStale = (new Date() - lastScored) / (1000 * 60 * 60 * 24);

        if (daysStale > 7) pressure = Math.max(pressure, 85);

        updateGPM(pressure, { quality_score: qualityScore, days_stale: Math.floor(daysStale) });
    } catch (e) {
        console.error("Lead Scoring Sensor Failure:", e.message);
    }
}

// Handle --health check
if (process.argv.includes('--health')) {
    const health = {
        status: fs.existsSync(SCORED_LEADS_PATH) ? 'ok' : 'warning',
        sensor: 'lead-scoring-sensor',
        version: '1.0.0',
        data_path: SCORED_LEADS_PATH,
        data_exists: fs.existsSync(SCORED_LEADS_PATH),
        gpm_path: GPM_PATH,
        gpm_exists: fs.existsSync(GPM_PATH),
        metrics: ['quality_score', 'days_stale'],
        timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(health, null, 2));
    process.exit(0);
} else {
    main();
}
