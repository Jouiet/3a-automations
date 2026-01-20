/**
 * Content Director - Produce Script
 * Wraps: `agency/core/blog-generator-resilient.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const topicArg = args.find(a => a.startsWith('--topic='));

if (!topicArg) {
    console.error("Error: --topic parameter required.");
    process.exit(1);
}

const scriptPath = path.join(__dirname, '../../../../automations/agency/core/blog-generator-resilient.cjs');

console.log(`[ContentDirector] Producing Content...`);
const proc = spawn('node', [scriptPath, topicArg, '--agentic'], { stdio: 'inherit' });

proc.on('close', (code) => {
    if (code !== 0) console.error(`[Error] Production failed with code ${code}`);
});
