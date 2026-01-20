/**
 * SystemAdmin Skill (The Engineer)
 * Capability: "system_health_check", "audit_infrastructure"
 * Wraps: `uptime-monitor.cjs`, `system-audit-agentic.cjs`
 * STRICT: NO MOCKS. REAL EXECUTION.
 */

const { spawn } = require('child_process');
const path = require('path');

class SystemAdminSkill {
    constructor() {
        this.scripts = {
            "health_check": path.join(__dirname, '../uptime-monitor.cjs'),
            "audit": path.join(__dirname, '../system-audit-agentic.cjs')
        };
    }

    async execute(taskType) {
        console.log(`[SystemAdmin] Executing REAL script for ${taskType}...`);

        const scriptPath = this.scripts[taskType];
        if (!scriptPath) {
            return { status: "error", message: `Unknown task: ${taskType}` };
        }

        // EXECUTION REELLE (NO MOCK)
        return new Promise((resolve) => {
            const proc = spawn('node', [scriptPath]);
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => stdout += data.toString());
            proc.stderr.on('data', (data) => stderr += data.toString());

            proc.on('close', (code) => {
                if (code !== 0) {
                    resolve({ status: "error", code, error: stderr.trim() });
                } else {
                    try {
                        const metrics = JSON.parse(stdout.trim());
                        resolve({ status: "success", metrics });
                    } catch (e) {
                        resolve({ status: "error", message: "Invalid JSON output from script", raw: stdout });
                    }
                }
            });
        });
    }
}

module.exports = new SystemAdminSkill();
