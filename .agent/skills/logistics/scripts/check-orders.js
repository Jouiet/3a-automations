/**
 * Logistics Manager - Check Orders Script
 * Wraps: `agency/core/dropshipping-order-flow.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../../../automations/agency/core/dropshipping-order-flow.cjs');

// Run with short timeout just to verify "check" status, as actual script handles a server
console.log(`[Logistics] Checking Order Flow...`);
const proc = spawn('node', [scriptPath], {
    stdio: 'inherit',
    env: { ...process.env, DROPSHIP_PORT: '3199' } // Avoid port conflict
});

// Auto-kill after 5s as it's a server script
setTimeout(() => {
    proc.kill();
    console.log('[Logistics] Check complete (Process terminated).');
}, 5000);
