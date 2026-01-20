/**
 * Content Director - Plan Script
 * Wraps: `agency/core/content-strategist-agentic.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, '../../../../automations/agency/core/content-strategist-agentic.cjs');

console.log(`[ContentDirector] Executing Gap Analysis...`);
const proc = spawn('node', [scriptPath, '--agentic'], { stdio: 'inherit' });

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Analysis failed with code ${code}`);
});
