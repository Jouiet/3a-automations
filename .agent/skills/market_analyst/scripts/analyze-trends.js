/**
 * Market Analyst - Analyze Trends Script
 * Wraps: `trends-discovery-rss.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const geoArg = args.find(a => a.startsWith('--geo='));
const geo = geoArg ? geoArg.split('=')[1] : 'US';

const scriptPath = path.join(__dirname, '../../../../automations/trends-discovery-rss.cjs');

console.log(`[MarketAnalyst] Analyzing Trends for ${geo}...`);
const proc = spawn('node', [scriptPath, geo], { stdio: 'inherit' });

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Analysis failed with code ${code}`);
});
