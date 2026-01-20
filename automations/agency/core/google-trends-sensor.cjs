const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

chromium.use(stealth);

// Configuration
const KEYWORDS = ['marketing automation', 'ai automation agency', 'shopify automation', 'meta ads automation'];
const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

async function getTrendsPressure() {
    console.log('🚀 Launching High-Rigor Stealth Sensor for Google Trends...');

    // Use headful mode if needed for debugging, but headless is default for production
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        // We intercept the network responses to find the internal widget data
        let trendData = null;

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('trends/api/widgetdata/multiline')) {
                try {
                    const text = await response.text();
                    // Google prefixes some JSON with )]}'
                    const json = JSON.parse(text.replace(")]}'", ""));
                    trendData = json.default.timelineData;
                } catch (e) {
                    // Ignore parsing errors for non-matching JSON
                }
            }
        });

        // Navigate to the Explore page
        const encodedKeywords = encodeURIComponent(KEYWORDS.join(','));
        const exploreUrl = `https://trends.google.com/trends/explore?date=now%207-d&geo=FR&q=${encodedKeywords}&hl=en`;

        console.log(`🔗 Navigating with operational delays...`);
        await page.waitForTimeout(Math.floor(Math.random() * 2000) + 500);

        await page.goto(exploreUrl, { waitUntil: 'domcontentloaded' });

        console.log('⏳ Waiting for Google Data stream...');
        let retries = 0;
        while (!trendData && retries < 15) {
            await page.waitForTimeout(1000);
            retries++;
        }

        if (!trendData || trendData.length === 0) {
            throw new Error('Detection Block or UI change: No trendData intercepted.');
        }

        // Processing the intercepted data
        const latestPoint = trendData[trendData.length - 1];
        const values = latestPoint.value;
        const avgInterest = values.reduce((a, b) => a + b, 0) / values.length;

        // Pressure Logic: High Interest (100) = Low Pressure (0). Inverse relationship.
        const pressure = Math.max(0, Math.min(100, 100 - avgInterest));

        console.log(`✅ Extraction Success! Avg Interest: ${avgInterest.toFixed(2)} | Current Pressure: ${pressure.toFixed(2)}`);

        await browser.close();

        return {
            pressure: Math.round(pressure),
            interest: avgInterest.toFixed(2),
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Stealth Sensor Failure:', error.message);
        await browser.close();
        return null;
    }
}

async function updateGPM(trendsData) {
    if (!trendsData) return;

    try {
        const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

        if (!gpm.sectors.marketing) gpm.sectors.marketing = {};
        if (!gpm.sectors.marketing.market_demand) {
            gpm.sectors.marketing.market_demand = {
                label: "Market Demand",
                pressure: 50,
                trend: "STABLE",
                last_check: ""
            };
        }

        const prevPressure = gpm.sectors.marketing.market_demand.pressure;
        gpm.sectors.marketing.market_demand.pressure = trendsData.pressure;
        gpm.sectors.marketing.market_demand.last_check = trendsData.timestamp;

        if (trendsData.pressure > prevPressure) {
            gpm.sectors.marketing.market_demand.trend = "UP";
        } else if (trendsData.pressure < prevPressure) {
            gpm.sectors.marketing.market_demand.trend = "DOWN";
        } else {
            gpm.sectors.marketing.market_demand.trend = "STABLE";
        }

        gpm.sectors.marketing.market_demand.sensor_data = {
            method: "Stealth Browser (Token Interception)",
            keywords: KEYWORDS,
            avg_interest_7d: trendsData.interest
        };

        fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
        console.log('🚀 GPM Synchronized via Stealth Sensor.');
    } catch (error) {
        console.error('❌ Failed to synchronize GPM:', error.message);
    }
}

async function main() {
    const data = await getTrendsPressure();
    if (data) {
        await updateGPM(data);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getTrendsPressure };
