/**
 * Growth Skill (The Marketer)
 * Capability: "audit_marketing_budget", "optimize_spend"
 * Wraps: `ga4-budget-optimizer-agentic.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

class GrowthSkill {
    async optimize(propertyId = '342083329') {
        console.log(`[Growth] Running Budget Optimization Draft for ${propertyId}...`);
        const scriptPath = path.join(__dirname, '../agency/core/ga4-budget-optimizer-agentic.cjs');

        return new Promise((resolve) => {
            // Run in Agentic Mode (Draft Only) - No EXECUTE flag
            const proc = spawn('node', [scriptPath, '--property-id', propertyId, '--agentic']);
            let stdout = '';

            proc.stdout.on('data', d => stdout += d.toString());
            proc.on('close', code => {
                resolve({
                    status: 'success',
                    output: stdout,
                    plan_created: stdout.includes('Output: budget-plan.csv')
                });
            });
        });
    }
}
module.exports = new GrowthSkill();
