#!/usr/bin/env node
/**
 * RSS Trends Discovery Receptor (Sensor)
 * 
 * Role: Daily/Real-time conversation harvester.
 * Strategy: Quad-Receptor Pillar #4 (Discovery).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const xml2js = require('xml2js');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

function fetchRSS(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                xml2js.parseString(data, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }).on('error', (err) => reject(err));
    });
}

function updateGPM(discoveredTrends) {
    if (!fs.existsSync(GPM_PATH)) return;
    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    if (!gpm.sectors.marketing.market_demand.sensor_data) {
        gpm.sectors.marketing.market_demand.sensor_data = {};
    }

    gpm.sectors.marketing.market_demand.sensor_data.discovered_trends = discoveredTrends;
    gpm.sectors.marketing.market_demand.last_check = new Date().toISOString();

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Discovery: Harvested ${discoveredTrends.length} real-time trends via RSS.`);
}

async function main() {
    try {
        const geo = process.env.GEO_LOCALE || 'FR';
        const url = `https://trends.google.com/trending/rss?geo=${geo}`;

        console.log(`🚀 Harvesting Trends via RSS: ${url}`);
        const rss = await fetchRSS(url);

        const items = rss.rss.channel[0].item;
        const trends = items.slice(0, 10).map(item => ({
            title: item.title[0],
            traffic: item['ht:approx_traffic'] ? item['ht:approx_traffic'][0] : 'N/A',
            link: item.link[0],
            pubDate: item.pubDate[0]
        }));

        updateGPM(trends);
    } catch (e) {
        console.error("RSS Trends Discovery Failure:", e.message);
    }
}

if (require.main === module) {
    main();
}
