/**
 * MarketAnalyst Skill (The Visionary)
 * Capability: "analyze_trends", "fetch_market_signals"
 * Wraps: `trends-discovery-rss.cjs`
 * STRICT: NO MOCKS. REAL EXECUTION.
 */

const { spawn } = require('child_process');
const path = require('path');

class MarketAnalystSkill {

    async analyze(sector) {
        console.log(`[MarketAnalyst] Fetching REAL Google Trends for sector: ${sector}...`);
        const scriptPath = path.join(__dirname, '../trends-discovery-rss.cjs');

        // EXECUTION REELLE (NO MOCK)
        return new Promise((resolve) => {
            // Mapping sector to Geo for demo or using US default
            // In a full implementation, 'sector' could map to specific keywords or categories
            const proc = spawn('node', [scriptPath, 'US']);
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => stdout += data.toString());
            proc.stderr.on('data', (data) => stderr += data.toString());

            proc.on('close', (code) => {
                try {
                    const data = JSON.parse(stdout.trim());
                    resolve({
                        status: "success",
                        sector: sector,
                        data: data.trends,
                        source: data.source
                    });
                } catch (e) {
                    resolve({ status: "error", message: "Parse Error", raw: stdout, err: stderr });
                }
            });
        });
    }
}

module.exports = new MarketAnalystSkill();
