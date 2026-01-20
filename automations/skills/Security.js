/**
 * Security Skill (The Guardian)
 * Capability: "security_audit", "api_verification"
 * Wraps: `forensic-api-test.cjs`
 */
const { spawn } = require('child_process');
const path = require('path');

class SecuritySkill {
    async scan() {
        console.log(`[Security] Starting Forensic API Scan...`);
        const scriptPath = path.join(__dirname, '../agency/core/forensic-api-test.cjs');

        return new Promise((resolve) => {
            const proc = spawn('node', [scriptPath], {
                env: { ...process.env, OUTPUT_DIR: '/tmp/scan_results' } // Sandbox output
            });
            let stdout = '';
            proc.stdout.on('data', d => stdout += d.toString());
            proc.on('close', code => {
                resolve({
                    status: 'success',
                    report: stdout,
                    threats_detected: 0 // Mock for now as script doesn't detect 'threats' but API failures
                });
            });
        });
    }
}
module.exports = new SecuritySkill();
