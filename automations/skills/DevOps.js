/**
 * DevOps Skill (The Architect)
 * Capability: "environment_check", "infrastructure_status"
 * Wraps: `check-env-status.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

class DevOpsSkill {
    async execute(task) {
        console.log(`[DevOps] Executing ${task}...`);
        const scriptPath = path.join(__dirname, '../agency/core/check-env-status.cjs');

        return new Promise((resolve) => {
            const proc = spawn('node', [scriptPath]);
            let stdout = '';
            proc.stdout.on('data', d => stdout += d.toString());
            proc.on('close', code => {
                // Parse the output or return raw log
                resolve({
                    status: 'success',
                    code,
                    log: stdout,
                    summary: stdout.split('=== RÉSUMÉ ===')[1]?.trim() || "No Summary"
                });
            });
        });
    }
}
module.exports = new DevOpsSkill();
