#!/usr/bin/env node
/**
 * BigQuery Trends Receptor (Sensor)
 * 
 * Role: Contextual demand analyzer. 
 * Strategy: Trinity Pillar #3 (Context).
 */

const fs = require('fs');
const path = require('path');
const { BigQuery } = require('@google-cloud/bigquery');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'a-automation-agency';

async function fetchBigQueryTrends() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS missing');
    }

    const bq = new BigQuery({
        projectId: PROJECT_ID,
    });

    // Query for top rising terms in France in the last 24h (approx)
    const query = `
        SELECT term, score
        FROM \`bigquery-public-data.google_trends.international_top_rising_terms\`
        WHERE country_code = 'FR'
        AND refresh_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
        ORDER BY score DESC
        LIMIT 5
    `;

    const [rows] = await bq.query(query);
    return rows;
}

function updateGPM(topTerms) {
    if (!fs.existsSync(GPM_PATH)) return;
    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    // We don't necessarily update "pressure" directly from context, 
    // but we enrich the sensor_data for the Cortex to see.
    if (!gpm.sectors.marketing.market_demand.sensor_data) {
        gpm.sectors.marketing.market_demand.sensor_data = {};
    }

    gpm.sectors.marketing.market_demand.sensor_data.rising_context = topTerms.map(r => r.term);
    gpm.sectors.marketing.market_demand.last_check = new Date().toISOString();

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Enriched: Market Context updated with ${topTerms.length} rising terms.`);
}

async function main() {
    try {
        const rows = await fetchBigQueryTrends();
        updateGPM(rows);
    } catch (e) {
        console.error("BigQuery Trends Sensor Failure:", e.message);
    }
}

if (require.main === module) {
    main();
}
