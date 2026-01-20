/**
 * 3A Automation - Hybrid Decoupling Forensic Audit
 * Principle: Factual Verification (No Blind Trust)
 * Framework: DOE (Directive Orchestration Execution)
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const c = {
    cyan: (txt) => `\x1b[36m${txt}\x1b[0m`,
    green: (txt) => `\x1b[32m${txt}\x1b[0m`,
    yellow: (txt) => `\x1b[33m${txt}\x1b[0m`,
    red: (txt) => `\x1b[31m${txt}\x1b[0m`,
    gray: (txt) => `\x1b[90m${txt}\x1b[0m`,
    white: (txt) => `\x1b[37m${txt}\x1b[0m`
};

const PATHS = {
    GOALS: path.join(__dirname, '../automations/agency/core/strategic_goals.json'),
    GPM: path.join(__dirname, '../landing-page-hostinger/data/pressure-matrix.json'),
    REGISTRY: path.join(__dirname, '../automations/automations-registry.json'),
    DAEMON: path.join(__dirname, '../automations/agency/core/autonomy-daemon.cjs'),
    DISPATCHER: path.join(__dirname, '../automations/agency/core/doe-dispatcher.cjs')
};

class ForensicAudit {
    constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            status: 'INCOMPLETE',
            findings: [],
            errors: 0
        };
    }

    logFinding(category, message, severity = 'INFO') {
        const color = severity === 'ERROR' ? c.red : (severity === 'WARNING' ? c.yellow : c.green);
        console.log(`${color(`[${severity}]`)} ${category}: ${message}`);
        this.report.findings.push({ category, message, severity });
        if (severity === 'ERROR') this.report.errors++;
    }

    async run() {
        console.log(c.cyan('\n--- 3A HYBRID DECOUPLING FORENSIC AUDIT STARTING ---\n'));

        this.checkFileExistence();
        this.checkGoalMetricAlignment();
        this.checkGPMIntegrity();
        this.checkToolRegistryCoverage();
        this.checkDaemonLogicMismatch();

        this.report.status = this.report.errors === 0 ? '100% SUCCESS' : 'FAILED';

        console.log(c.cyan('\n--- AUDIT SUMMARY ---'));
        console.log(`Status: ${this.report.status === '100% SUCCESS' ? c.green(this.report.status) : c.red(this.report.status)}`);
        console.log(`Total Errors: ${this.report.errors}`);

        if (this.report.errors > 0) {
            console.log(c.red('\n!!! RIGOROUS VERIFICATION FAILED. CORRECTION REQUIRED !!!'));
        } else {
            console.log(c.green('\n✅ SYSTEM FACTUALLY RIGOROUS.'));
        }
    }

    checkFileExistence() {
        for (const [key, filePath] of Object.entries(PATHS)) {
            if (!fs.existsSync(filePath)) {
                this.logFinding('FILE_SYSTEM', `Missing critical file: ${key} (${filePath})`, 'ERROR');
            } else {
                this.logFinding('FILE_SYSTEM', `File verified: ${key}`, 'INFO');
            }
        }
    }

    checkGoalMetricAlignment() {
        if (!fs.existsSync(PATHS.GOALS)) return;
        const goals = JSON.parse(fs.readFileSync(PATHS.GOALS, 'utf8')).goals;
        const gpm = JSON.parse(fs.readFileSync(PATHS.GPM, 'utf8'));

        const gpmMetrics = [];
        // Flatten GPM sectors to find metrics
        Object.keys(gpm.sectors).forEach(sector => {
            Object.keys(gpm.sectors[sector]).forEach(metric => {
                gpmMetrics.push(metric);
            });
        });

        // Add top-level metrics
        if (gpm.metrics) {
            Object.keys(gpm.metrics).forEach(m => gpmMetrics.push(m));
        }

        goals.forEach(goal => {
            // Some metrics are calculated from logs (active_leads_24h), others from GPM
            const isLogMetric = goal.target_metric === 'active_leads_24h';
            const isInGPM = gpmMetrics.includes(goal.target_metric);

            if (!isLogMetric && !isInGPM) {
                this.logFinding('GOAL_ALIGNMENT', `Metric '${goal.target_metric}' for GOAL '${goal.id}' is NOT found in GPM.`, 'ERROR');
            } else {
                this.logFinding('GOAL_ALIGNMENT', `Metric verified for GOAL '${goal.id}': ${goal.target_metric}`, 'INFO');
            }
        });
    }

    checkGPMIntegrity() {
        if (!fs.existsSync(PATHS.GPM)) return;
        const gpm = JSON.parse(fs.readFileSync(PATHS.GPM, 'utf8'));
        const now = new Date();

        Object.keys(gpm.sectors).forEach(sector => {
            Object.keys(gpm.sectors[sector]).forEach(metricName => {
                const metric = gpm.sectors[sector][metricName];

                // Telemetry Check: Is it fresh? (Warn if > 24h)
                const lastCheck = new Date(metric.last_check || 0);
                const hoursOld = (now - lastCheck) / (1000 * 60 * 60);

                if (hoursOld > 24) {
                    this.logFinding('GPM_TELEMETRY', `Sector '${sector}' Metric '${metricName}' is STALE (${Math.floor(hoursOld)}h old). Sensor might be inactive.`, 'WARNING');
                } else if (!metric.last_check) {
                    this.logFinding('GPM_TELEMETRY', `Sector '${sector}' Metric '${metricName}' has NO last_check.`, 'ERROR');
                } else {
                    this.logFinding('GPM_TELEMETRY', `Sector '${sector}' Metric '${metricName}' is active and fresh.`, 'INFO');
                }
            });
        });
    }

    checkToolRegistryCoverage() {
        if (!fs.existsSync(PATHS.REGISTRY)) return;
        const registry = JSON.parse(fs.readFileSync(PATHS.REGISTRY, 'utf8'));
        const tools = registry.automations || [];

        this.logFinding('REGISTRY_COVERAGE', `${tools.length} tools found in registry.`, 'INFO');

        // Factual check: B2B Leads directive mapping
        const hasB2B = tools.some(t =>
            (t.name_en && t.name_en.toLowerCase().includes('lead')) ||
            (t.semantic_description && t.semantic_description.toLowerCase().includes('lead')) ||
            (t.id && t.id.toLowerCase().includes('lead'))
        );

        if (!hasB2B) {
            this.logFinding('REGISTRY_COVERAGE', `Missing tool coverage for 'B2B Leads' directive.`, 'ERROR');
        } else {
            this.logFinding('REGISTRY_COVERAGE', `Tool coverage for 'B2B Leads' verified.`, 'INFO');
        }
    }

    checkDaemonLogicMismatch() {
        if (!fs.existsSync(PATHS.DAEMON)) return;
        const content = fs.readFileSync(PATHS.DAEMON, 'utf8');

        // Factual check: Does it use efficiency_pressure which is missing from GPM?
        if (content.includes('matrix.efficiency_pressure') && !fs.readFileSync(PATHS.GPM, 'utf8').includes('efficiency_pressure')) {
            this.logFinding('LOGIC_VERIFICATION', `autonomy-daemon.cjs refers to 'efficiency_pressure' but this key does not exist in GPM!`, 'ERROR');
        }
    }
}

const audit = new ForensicAudit();
audit.run();
