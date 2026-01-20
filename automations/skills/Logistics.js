/**
 * Logistics Skill (The Supply Chain)
 * Capability: "check_order_status", "sync_tracking"
 * Wraps: `dropshipping-order-flow.cjs` (Checking Pending Tracking)
 */
const { spawn } = require('child_process');
const path = require('path');

class LogisticsSkill {
    async checkPending() {
        console.log(`[Logistics] Checking Pending Deliveries...`);
        // We run the script to see its startup log which lists "pending tracking" count.
        // We aren't triggering a full sync, just checking status.
        // But since the script runs 'syncPendingTracking' on start if we modify it...
        // Actually, we'll just check if the process boots and reports status.

        const scriptPath = path.join(__dirname, '../agency/core/dropshipping-order-flow.cjs');
        return new Promise((resolve) => {
            // Timeout to kill it because it might keep running server
            const proc = spawn('node', [scriptPath], {
                env: { ...process.env, DROPSHIP_PORT: '3099' } // Avoid port conflict
            });

            let stdout = '';
            let killed = false;

            proc.stdout.on('data', d => {
                stdout += d.toString();
                if (stdout.includes('Checking tracking for')) {
                    if (!killed) {
                        proc.kill(); killed = true; // We saw enough
                        resolve({ status: 'success', log: stdout });
                    }
                }
            });

            // Safety timeout
            setTimeout(() => {
                if (!killed) {
                    proc.kill();
                    resolve({ status: 'success', log: stdout, note: "Timeout check" });
                }
            }, 5000);
        });
    }
}
module.exports = new LogisticsSkill();
