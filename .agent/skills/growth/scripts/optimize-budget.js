/**
 * Growth Director - Optimize Script
 * Wraps: `agency/core/ga4-budget-optimizer-agentic.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const propIdArg = args.find(a => a.startsWith('--property-id='));
const propertyId = propIdArg ? propIdArg.split('=')[1] : '342083329';

const scriptPath = path.join(__dirname, '../../../../automations/agency/core/ga4-budget-optimizer-agentic.cjs');

console.log(`[Growth] Running Optimization for ${propertyId}...`);
const proc = spawn('node', [scriptPath, '--property-id', propertyId, '--agentic'], { stdio: 'inherit' });

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Optimization failed with code ${code}`);
});
