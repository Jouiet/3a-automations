// automations/tools/scrape-url.js
// VERSION 2.0 - Updated December 2025
// Uses PlaywrightClient (free) with Puppeteer fallback instead of Firecrawl (paid)
const PlaywrightClient = require('../core/PlaywrightClient');
const chalk = require('chalk');

// CLI Wrapper for N8N
// Usage: node automations/tools/scrape-url.js --url="https://..."

const args = process.argv.slice(2);
const getArg = (key) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : null;
};

async function main() {
    const url = getArg('url');

    if (!url) {
        console.error(JSON.stringify({ success: false, error: 'Missing --url parameter' }));
        process.exit(1);
    }

    const scraper = new PlaywrightClient();

    try {
        console.error(chalk.blue(`[TOOL] Scraping ${url}...`)); // stderr for logs
        const data = await scraper.scrape(url);
        
        // Output purely JSON to stdout for N8N parsing
        console.log(JSON.stringify({ success: true, data: data }));

    } catch (error) {
        console.error(chalk.red(`[TOOL] Failed:`), error.message);
        console.log(JSON.stringify({ success: false, error: error.message }));
        process.exit(1);
    }
}

main();
