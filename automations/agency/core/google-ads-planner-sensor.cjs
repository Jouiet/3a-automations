/**
 * 3A AUTOMATION - Google Ads Planner Sensor (Institutional)
 * 
 * METHODOLOGY: Institutional API (Whitelisted)
 * DATA: Absolute Search Volume & Opportunity Index
 * RIGOR: 100% Verified / No Scraping
 */

const { GoogleAdsApi } = require('google-ads-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const KEYWORDS = ['marketing automation', 'ai automation agency', 'shopify automation', 'meta ads automation'];
const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

async function getAdsMetrics() {
    console.log('🏛️ Initializing Institutional Sensor: Google Ads Planner...');

    const client = new GoogleAdsApi({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });

    const customer = client.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });

    if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
        console.warn('⚠️ Google Ads Credentials missing. Sensor in PASSIVE mode.');
        return { pressure: 50, avg_volume: 0, status: 'BLOCKED_CREDENTIALS' };
    }

    try {
        // High-rigor fetching of historical metrics
        const results = await customer.keywordPlanIdeas.generateKeywordIdeas({
            keyword_seed: {
                keywords: KEYWORDS,
            },
            geo_target_constants: ['geoTargetConstants/2250'], // France
            language: 'languageConstants/1002', // French
        });

        const avgVolume = results.reduce((acc, curr) => acc + (curr.keyword_idea_metrics?.avg_monthly_searches || 0), 0) / results.length;

        // Pressure mapping: 0-100 based on volume targets (50k/mo = 0 pressure)
        const pressure = Math.max(0, Math.min(100, 100 - (avgVolume / 500)));

        return {
            pressure: Math.round(pressure),
            avg_volume: Math.round(avgVolume),
            status: 'ACTIVE'
        };
    } catch (error) {
        console.error('❌ Institutional API Error:', error.message);
        return { pressure: 50, avg_volume: 0, status: 'ERROR', error: error.message };
    }
}

async function updateGPM(adsData) {
    if (!fs.existsSync(GPM_PATH)) {
        console.error('❌ GPM Error: pressure-matrix.json not found');
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    if (!gpm.sectors.marketing.market_demand) {
        gpm.sectors.marketing.market_demand = {
            label: "Market Demand",
            pressure: 50,
            trend: "stable",
            last_check: ""
        };
    }

    const prevPressure = gpm.sectors.marketing.market_demand.pressure;
    gpm.sectors.marketing.market_demand.pressure = adsData.pressure;
    gpm.sectors.marketing.market_demand.last_check = new Date().toISOString();
    gpm.sectors.marketing.market_demand.trend = adsData.pressure > prevPressure ? "rising" : "falling";

    // Add sensor sub-data
    gpm.sectors.marketing.market_demand.ads_volume = adsData.avg_volume;
    gpm.sectors.marketing.market_demand.api_status = adsData.status;

    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`✅ GPM Updated: Market Demand Pressure = ${adsData.pressure}`);
}

async function main() {
    const data = await getAdsMetrics();
    await updateGPM(data);
}

if (require.main === module) {
    main();
}

module.exports = { getAdsMetrics };
