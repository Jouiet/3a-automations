/**
 * ErrorScience.cjs - Self-Healing Feedback Loop
 * 3A Automation - Session 177 (Agent Ops Transformation)
 *
 * Analyzes conversion failures (abandonment, low qualification) from logs
 * and generates "Refinement Instructions" for the Cognitive Engine.
 */

const fs = require('fs');
const path = require('path');

class ErrorScience {
    constructor(options = {}) {
        this.logDir = options.logDir || process.env.ANALYTICS_LOG_DIR || '/tmp';
        this.logFile = path.join(this.logDir, 'marketing_events.jsonl');
        this.learnedRulesFile = path.join(this.logDir, 'learned_rules.json');
    }

    /**
     * Analyze recent logs to identify patterns of failure across all sectors
     */
    async analyzeFailures() {
        if (!fs.existsSync(this.logFile)) {
            return { success: false, error: 'No logs found' };
        }

        const lines = fs.readFileSync(this.logFile, 'utf8').split('\n').filter(l => l.trim());
        const events = lines.map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(Boolean);

        const failures = {
            voice: [],
            seo: [],
            ops: [],
            ads: []
        };

        events.forEach(ev => {
            const sector = (ev.sector || 'GENERAL').toLowerCase();

            // SEO Failures (e.g., GSC Pressure > 70)
            if (sector === 'seo' && ev.pressure > 70) {
                failures.seo.push(ev);
            }
            // Ops Failures (e.g., Shopify Errors)
            else if (sector === 'operations' && (ev.status === 'error' || ev.pressure > 80)) {
                failures.ops.push(ev);
            }
            // Voice Failures (previous logic)
            else if (sector === 'voice' && (ev.event === 'call_abandoned' || (ev.event === 'call_completed' && ev.qualification_score < 30))) {
                failures.voice.push(ev);
            }
        });

        console.log(`[ErrorScience] Diagnostic: SEO(${failures.seo.length}) Ops(${failures.ops.length}) Voice(${failures.voice.length})`);

        this._generateRefinedInstructions(failures);
        return failures;
    }

    /**
     * Generates persistent instructions derived from holistic failures
     */
    _generateRefinedInstructions(failures) {
        let currentRules = [];
        if (fs.existsSync(this.learnedRulesFile)) {
            currentRules = JSON.parse(fs.readFileSync(this.learnedRulesFile, 'utf8'));
        }

        const newRules = [];

        // 1. Voice Healing
        if (failures.voice.length > 2) {
            newRules.push({
                id: 'rule_voice_abandon',
                instruction: "SOTA SELF-HEAL (VOICE): High abandonment. Shorten initial monologue. Use pattern interrupts.",
                weight: 1.0,
                sector: 'voice'
            });
        }

        // 2. SEO Healing
        if (failures.seo.length > 0) {
            newRules.push({
                id: 'rule_seo_gap',
                instruction: "SOTA SELF-HEAL (SEO): High Topic Pressure. Prioritize content with high CTR potential in next generation cycle.",
                weight: 1.0,
                sector: 'seo'
            });
        }

        // 3. Ops Healing
        if (failures.ops.length > 0) {
            newRules.push({
                id: 'rule_ops_integrity',
                instruction: "SOTA SELF-HEAL (OPS): Shopify/Supplier pressure detected. Verify credential health before proceeding with automated fulfilment.",
                weight: 1.0,
                sector: 'operations'
            });
        }

        // Sync rules
        const merged = [...currentRules];
        newRules.forEach(nr => {
            const existingIdx = merged.findIndex(r => r.id === nr.id);
            if (existingIdx !== -1) merged[existingIdx] = nr;
            else merged.push(nr);
        });

        fs.writeFileSync(this.learnedRulesFile, JSON.stringify(merged, null, 2));
    }

    /**
     * Get active learned rules to inject into prompts, filtered by sector
     */
    getLearnedInstructions(sector = 'voice') {
        if (!fs.existsSync(this.learnedRulesFile)) return "";
        const rules = JSON.parse(fs.readFileSync(this.learnedRulesFile, 'utf8'));
        return rules
            .filter(r => !r.sector || r.sector === sector.toLowerCase())
            .map(r => r.instruction)
            .join('\n');
    }
}

const instance = new ErrorScience();
module.exports = instance;
