/**
 * SystemAdmin - Audit Script
 * Wraps: `system-audit-agentic.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../../../automations/system-audit-agentic.cjs');

console.log(`[SystemAdmin] Auditing Infrastructure...`);
const proc = spawn('node', [scriptPath], { stdio: 'inherit' });

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Audit failed with code ${code}`);
});
