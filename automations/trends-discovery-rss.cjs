/**
 * REAL MARKET TRENDS DISCOVERY
 * Usage: node trends-discovery-rss.cjs [geo]
 * Output: JSON
 */
const https = require('https');
const { promisify } = require('util');

const GEO = process.argv[2] || 'US';
const RSS_URL = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${GEO}`;

const fetchRSS = () => new Promise((resolve, reject) => {
    https.get(RSS_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
    });
});

(async () => {
    try {
        const xml = await fetchRSS();

        // Naive XML -> JSON parsing to avoid dependencies if possible, 
        // strictly extracting <item><title>...</title>...
        const items = [];
        const regex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = regex.exec(xml)) !== null) {
            const block = match[1];
            const titleMatch = /<title>(.*?)<\/title>/.exec(block);
            const trafficMatch = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/.exec(block);

            if (titleMatch) {
                items.push({
                    trend: titleMatch[1],
                    volume: trafficMatch ? trafficMatch[1] : "N/A"
                });
            }
            if (items.length >= 5) break;
        }

        console.log(JSON.stringify({
            source: "Google Trends Realtime",
            geo: GEO,
            trends: items
        }));
    } catch (e) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
    }
})();
