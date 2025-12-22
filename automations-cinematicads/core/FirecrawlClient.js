// automations/core/FirecrawlClient.js
// ⚠️ DEPRECATED - Use PlaywrightClient.js instead
// Firecrawl = PAID service ($19/mo+)
// Playwright = FREE (via npm install playwright)
//
// Migration:
//   const FirecrawlClient = require('./FirecrawlClient');
//   ↓
//   const PlaywrightClient = require('./PlaywrightClient');
//
// API is compatible: scrape(url, options), map(url)
//
// Or use Claude Code native MCP:
//   - playwright-mcp: Browser automation, scraping
//   - chrome-devtools-mcp: DOM inspection, screenshots (fallback)

const PlaywrightClient = require('./PlaywrightClient');

/**
 * @deprecated Use PlaywrightClient instead
 * This wrapper provides backward compatibility
 */
class FirecrawlClient extends PlaywrightClient {
    constructor() {
        super();
        console.warn('⚠️ FirecrawlClient is DEPRECATED. Use PlaywrightClient instead.');
        console.warn('   Migration: require("./PlaywrightClient") instead of require("./FirecrawlClient")');
    }
}

module.exports = FirecrawlClient;
