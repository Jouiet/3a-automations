#!/usr/bin/env node
/**
 * Autonomy Daemon - The "Heartbeat" of Level 5
 * 
 * Role: Monitors Reality vs Desire (Goals). Triggers Cortex when gaps exist.
 * 
 * Usage:
 *   node autonomy-daemon.cjs --dry-run   (Simulate decision loop)
 *   node autonomy-daemon.cjs --live      (Execute decisions - DANGER)
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const DOEOrchestrator = require('./doe-dispatcher.cjs');

// Colors
const c = {
    cyan: (txt) => `\x1b[36m${txt}\x1b[0m`,
    green: (txt) => `\x1b[32m${txt}\x1b[0m`,
    yellow: (txt) => `\x1b[33m${txt}\x1b[0m`,
    red: (txt) => `\x1b[31m${txt}\x1b[0m`,
    gray: (txt) => `\x1b[90m${txt}\x1b[0m`,
    magenta: (txt) => `\x1b[35m${txt}\x1b[0m`
};

class AutonomyDaemon {
    constructor() {
        this.goalsPath = path.join(__dirname, 'strategic_goals.json');
        this.logsPath = path.join(__dirname, '../../../landing-page-hostinger/data/mcp-logs.json');
        this.matrixPath = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');
        this.orchestrator = new DOEOrchestrator();
    }

    loadGoals() {
        if (!fs.existsSync(this.goalsPath)) {
            throw new Error("Missing strategic_goals.json");
        }
        return JSON.parse(fs.readFileSync(this.goalsPath, 'utf8')).goals;
    }

    /**
     * Infer measurement from system logs and Global Pressure Matrix (GPM)
     */
    measureReality(metric) {
        let logs = [];
        let matrix = {};

        try {
            if (fs.existsSync(this.logsPath)) {
                logs = JSON.parse(fs.readFileSync(this.logsPath, 'utf8'));
            }
            if (fs.existsSync(this.matrixPath)) {
                matrix = JSON.parse(fs.readFileSync(this.matrixPath, 'utf8'));
            }
        } catch (e) { console.warn("Could not read system state files"); }

        // 1. Metric: active_leads_24h (From Logs)
        if (metric === 'active_leads_24h') {
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return logs.filter(l => {
                const logTime = new Date(l.timestamp).getTime();
                return logTime > oneDayAgo && (l.action.toLowerCase().includes('source') || l.agent.includes('Maps'));
            }).length;
        }

        // 2. Metric: global_roas (From GPM / Reality check)
        if (metric === 'global_roas') {
            if (matrix.metrics && matrix.metrics.global_roas) {
                return parseFloat(matrix.metrics.global_roas);
            }
            const googleAds = matrix.sectors?.marketing?.google_ads;
            if (googleAds && googleAds.sensor_data && googleAds.sensor_data.roas) {
                return parseFloat(googleAds.sensor_data.roas);
            }
            // Fallback if sensor data missing but pressure exists
            const pressure = googleAds?.pressure || 50;
            return (100 - pressure) / 10;
        }

        // 3. Metric: acquisition_pressure (Direct from GPM)
        if (metric === 'acquisition_pressure') {
            return matrix.market_pressure?.acquisition || 0;
        }

        // 4. Metric: retention_pressure (Direct from GPM)
        if (metric === 'retention_pressure') {
            return matrix.sectors?.retention?.pressure || matrix.market_pressure?.retention || 0;
        }

        // 5. Metric: lead_velocity (Derived from Lead Scoring Sensor)
        if (metric === 'lead_velocity') {
            const leadScoring = matrix.sectors?.marketing?.lead_scoring;
            return leadScoring?.sensor_data?.velocity || 0;
        }

        return 0;
    }

    async run(mode = 'dry-run') {
        const INTERVAL = 60000 * 5; // 5 minute heartbeat

        while (true) {
            console.log(c.magenta(`\n🧠 AUTONOMY DAEMON HEARTBEAT [Mode: ${mode.toUpperCase()}] [${new Date().toISOString()}]`));

            try {
                const goals = this.loadGoals();

                for (const goal of goals) {
                    console.log(c.cyan(`\n[GOAL]: ${goal.description} (Target: ${goal.target_metric} ${goal.operator} ${goal.target_value})`));

                    const currentVal = this.measureReality(goal.target_metric);
                    console.log(`   Current Reality: ${currentVal}`);

                    let gapDetected = false;

                    if (goal.operator === 'gte' && currentVal < goal.target_value) gapDetected = true;
                    if (goal.operator === 'lte' && currentVal > goal.target_value) gapDetected = true;

                    if (gapDetected) {
                        console.log(c.yellow(`   ⚠️  GAP DETECTED! (${currentVal} vs ${goal.target_value})`));
                        console.log(c.green(`   ⚡ ACTIVATING CORTEX: "${goal.associated_directive}"`));

                        if (mode === 'live') {
                            await this.triggerCortex(goal.associated_directive);
                        } else {
                            console.log(c.gray(`   [Safe Mode] Would trigger DOE Dispatcher now.`));
                            await this.triggerCortex(goal.associated_directive, true);
                        }
                    } else {
                        console.log(c.green(`   ✅ Goal Satisfied.`));
                    }
                }
            } catch (e) {
                console.error(c.red(`[DAEMON HEARTBEAT ERROR]: ${e.message}`));
            }

            console.log(c.gray(`\n💤 Sleeping for ${INTERVAL / 60000} mins...`));
            await new Promise(r => setTimeout(r, INTERVAL));
        }
    }

    async triggerCortex(directive, planOnly = false) {
        try {
            console.log(c.gray(`   ...Dispatching to DOE Orchestrator...`));
            const plan = await this.orchestrator.plan(directive);
            const crit = await this.orchestrator.critique(plan, directive);

            if (crit.valid) {
                if (!planOnly) {
                    this.orchestrator.execute(plan);
                    console.log(c.green(`   ✅ EXECUTION COMPLETE`));
                } else {
                    console.log(c.green(`   ✅ PLAN VALIDATED (Simulated Execution)`));
                    console.log(c.gray(`      -> Tool: ${plan.toolName}`));
                    console.log(c.gray(`      -> Script: ${plan.script}`));
                }
            } else {
                console.error(c.red(`   ❌ CORTEX REJECTED PLAN: ${crit.issues.join(', ')}`));
            }

        } catch (e) {
            console.error(c.red(`   ❌ DAEMON ERROR: ${e.message}`));
        }
    }
}

// Global Error Handlers
process.on('uncaughtException', (err) => {
    console.error(`\x1b[31m[DAEMON CRITICAL] Uncaught Exception: ${err.message}\x1b[0m`);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m[DAEMON CRITICAL] Unhandled Rejection at:\x1b[0m', promise, '\x1b[31mreason:\x1b[0m', reason);
});

// Main
if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args.includes('--live') ? 'live' : 'dry-run';

    const daemon = new AutonomyDaemon();
    daemon.run(mode);
}
