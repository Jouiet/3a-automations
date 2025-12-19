/**
 * ENABLE APIFY SCHEDULERS
 * Automates Step 1 of the Manual Chasm Checklist
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Schedulers to enable (B2C Only)
const TARGET_SCHEDULERS = [
    'Instagram Profile Scraper',
    'TikTok Profile Scraper',
    // 'B2B Scrapers' EXCLUDED
];

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.apify.com',
            path: `/v2${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${APIFY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data || '{}'));
                } else {
                    console.log(`⚠️  ${path} - Status ${res.statusCode}`);
                    resolve(null);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function enableSchedulers() {
    console.log('\n============================================================');
    console.log('ENABLE APIFY SCHEDULERS (B2C ONLY)');
    console.log('============================================================\n');

    try {
        // 1. Get all schedules
        console.log('📥 Fetching schedules...');
        const response = await makeRequest('/schedules');

        if (!response || !response.data || !response.data.items) {
            console.error('❌ Failed to fetch schedules');
            return;
        }

        const schedulers = response.data.items;
        let enabledCount = 0;

        // 2. Filter and Enable
        for (const scheduler of schedulers) {
            const name = scheduler.name || '';

            // Check if this is a target scheduler
            const isTarget = TARGET_SCHEDULERS.some(target => name.includes(target));

            if (isTarget) {
                if (scheduler.isEnabled) {
                    console.log(`✅ [ALREADY ON] ${name}`);
                } else {
                    console.log(`⏳ Enabling: ${name}...`);
                    // Enable via API
                    const update = await makeRequest(`/schedules/${scheduler.id}`, 'PUT', { isEnabled: true });
                    if (update) {
                        console.log(`   ✅ ENABLED!`);
                        enabledCount++;
                    } else {
                        console.error(`   ❌ Failed to enable`);
                    }
                }
            } else {
                console.log(`Skipping: ${name} (Not B2C Target)`);
            }
        }

        console.log(`\n🎉 SUMMARY: Enabled ${enabledCount} schedulers.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

enableSchedulers();
