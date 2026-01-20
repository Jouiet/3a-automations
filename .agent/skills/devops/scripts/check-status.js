/**
 * DevOps - Check Status Script
 * Wraps: `agency/core/check-env-status.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../../../automations/agency/core/check-env-status.cjs');

console.log(`[DevOps] Checking Environment Status...`);
const proc = spawn('node', [scriptPath], { stdio: 'inherit' });

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Check failed with code ${code}`);
});
