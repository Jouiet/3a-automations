/**
 * Security - Scan Script
 * Wraps: `agency/core/forensic-api-test.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../../../automations/agency/core/forensic-api-test.cjs');

console.log(`[Security] Starting Forensic Audit...`);
const proc = spawn('node', [scriptPath], {
    stdio: 'inherit',
    env: { ...process.env, OUTPUT_DIR: '/tmp/scan_results' }
});

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Audit failed with code ${code}`);
});
