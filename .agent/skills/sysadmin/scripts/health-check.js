/**
 * SystemAdmin - Health Check Script
 * Wraps: `uptime-monitor.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../../../automations/uptime-monitor.cjs');

console.log(`[SystemAdmin] Monitoring Uptime...`);
const proc = spawn('node', [scriptPath], { stdio: 'inherit' });

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Health check failed with code ${code}`);
});
