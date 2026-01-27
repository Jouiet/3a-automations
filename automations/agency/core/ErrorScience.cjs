/**
 * ErrorScience.cjs - Self-Healing Feedback Loop
 * 3A Automation - Session 177/178 (SOTA Optimization)
 *
 * SOTA Features (Session 178):
 * - Confidence Scoring: Statistical significance for rules
 * - Trend Detection: Sliding window analysis (7-day, 24h)
 * - Pattern Recognition: Enhanced failure categorization
 * - Rule Decay: Auto-expire stale rules
 *
 * Analyzes conversion failures (abandonment, low qualification) from logs
 * and generates "Refinement Instructions" for the Cognitive Engine.
 *
 * Source: Self-Healing ML Systems 2025, Uber/Netflix Engineering Blogs
 */

const fs = require('fs');
const path = require('path');

// SOTA: Confidence thresholds
const CONFIDENCE_CONFIG = {
    minSampleSize: 5,         // Minimum events to generate rule
    highConfidence: 10,       // High confidence threshold
    ruleTTLDays: 7,          // Rules expire after 7 days without reinforcement
    trendWindowHours: 24,    // Short-term trend window
    baselineWindowDays: 7    // Long-term baseline window
};

class ErrorScience {
    constructor(options = {}) {
        this.logDir = options.logDir || process.env.ANALYTICS_LOG_DIR || '/tmp';
        this.logFile = path.join(this.logDir, 'marketing_events.jsonl');
        this.learnedRulesFile = path.join(this.logDir, 'learned_rules.json');
        this.metricsFile = path.join(this.logDir, 'error_metrics.json');
    }

    /**
     * SOTA: Analyze recent logs with trend detection
     */
    async analyzeFailures() {
        if (!fs.existsSync(this.logFile)) {
            return { success: false, error: 'No logs found' };
        }

        const lines = fs.readFileSync(this.logFile, 'utf8').split('\n').filter(l => l.trim());
        const events = lines.map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(Boolean);

        const now = Date.now();
        const trendCutoff = now - (CONFIDENCE_CONFIG.trendWindowHours * 60 * 60 * 1000);
        const baselineCutoff = now - (CONFIDENCE_CONFIG.baselineWindowDays * 24 * 60 * 60 * 1000);

        const failures = {
            voice: [],
            seo: [],
            ops: [],
            ads: []
        };

        // SOTA: Separate recent vs baseline for trend analysis
        const recentFailures = { voice: [], seo: [], ops: [], ads: [] };
        const baselineFailures = { voice: [], seo: [], ops: [], ads: [] };

        events.forEach(ev => {
            const sector = (ev.sector || 'GENERAL').toLowerCase();
            const eventTime = ev.timestamp ? new Date(ev.timestamp).getTime() : now;
            const isRecent = eventTime >= trendCutoff;
            const isBaseline = eventTime >= baselineCutoff && eventTime < trendCutoff;

            let isFailure = false;
            let failureType = null;

            // SEO Failures (e.g., GSC Pressure > 70)
            if (sector === 'seo' && ev.pressure > 70) {
                isFailure = true;
                failureType = 'seo';
            }
            // Ops Failures (e.g., Shopify Errors)
            else if (sector === 'operations' && (ev.status === 'error' || ev.pressure > 80)) {
                isFailure = true;
                failureType = 'ops';
            }
            // Voice Failures
            else if (sector === 'voice' && (ev.event === 'call_abandoned' || (ev.event === 'call_completed' && ev.qualification_score < 30))) {
                isFailure = true;
                failureType = 'voice';
            }
            // Ads Failures (new)
            else if (sector === 'ads' && (ev.status === 'error' || ev.cpa > ev.target_cpa * 1.5)) {
                isFailure = true;
                failureType = 'ads';
            }

            if (isFailure && failureType) {
                failures[failureType].push(ev);
                if (isRecent) recentFailures[failureType].push(ev);
                if (isBaseline) baselineFailures[failureType].push(ev);
            }
        });

        // SOTA: Calculate trends (recent vs baseline)
        const trends = this._calculateTrends(recentFailures, baselineFailures);

        console.log(`[ErrorScience] Diagnostic: SEO(${failures.seo.length}) Ops(${failures.ops.length}) Voice(${failures.voice.length}) Ads(${failures.ads.length})`);
        console.log(`[ErrorScience] Trends: ${JSON.stringify(trends)}`);

        this._generateRefinedInstructions(failures, trends);
        this._saveMetrics(failures, trends);

        return { failures, trends, timestamp: new Date().toISOString() };
    }

    /**
     * SOTA: Calculate trend direction from recent vs baseline
     */
    _calculateTrends(recent, baseline) {
        const trends = {};
        const sectors = ['voice', 'seo', 'ops', 'ads'];

        for (const sector of sectors) {
            const recentCount = recent[sector].length;
            const baselineCount = baseline[sector].length;

            // Normalize by time window
            const recentRate = recentCount / CONFIDENCE_CONFIG.trendWindowHours;
            const baselineRate = baselineCount / (CONFIDENCE_CONFIG.baselineWindowDays * 24 - CONFIDENCE_CONFIG.trendWindowHours);

            if (baselineRate === 0) {
                trends[sector] = recentCount > 0 ? 'EMERGING' : 'STABLE';
            } else {
                const ratio = recentRate / baselineRate;
                if (ratio > 1.5) trends[sector] = 'INCREASING';
                else if (ratio > 1.1) trends[sector] = 'SLIGHT_INCREASE';
                else if (ratio < 0.5) trends[sector] = 'DECREASING';
                else if (ratio < 0.9) trends[sector] = 'SLIGHT_DECREASE';
                else trends[sector] = 'STABLE';
            }
        }

        return trends;
    }

    /**
     * SOTA: Save metrics for monitoring
     */
    _saveMetrics(failures, trends) {
        const metrics = {
            timestamp: new Date().toISOString(),
            failure_counts: {
                voice: failures.voice.length,
                seo: failures.seo.length,
                ops: failures.ops.length,
                ads: failures.ads.length
            },
            trends,
            total_failures: Object.values(failures).reduce((sum, arr) => sum + arr.length, 0)
        };

        try {
            fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
        } catch (e) {
            console.error(`[ErrorScience] Failed to save metrics: ${e.message}`);
        }
    }

    /**
     * SOTA: Generates instructions with confidence scoring and TTL
     */
    _generateRefinedInstructions(failures, trends = {}) {
        let currentRules = [];
        if (fs.existsSync(this.learnedRulesFile)) {
            try {
                currentRules = JSON.parse(fs.readFileSync(this.learnedRulesFile, 'utf8'));
            } catch (e) {
                currentRules = [];
            }
        }

        const now = new Date();
        const newRules = [];

        // SOTA: Calculate confidence based on sample size
        const calculateConfidence = (count) => {
            if (count < CONFIDENCE_CONFIG.minSampleSize) return 0;
            if (count >= CONFIDENCE_CONFIG.highConfidence) return 1.0;
            return 0.5 + (count - CONFIDENCE_CONFIG.minSampleSize) / (CONFIDENCE_CONFIG.highConfidence - CONFIDENCE_CONFIG.minSampleSize) * 0.5;
        };

        // 1. Voice Healing
        if (failures.voice.length >= CONFIDENCE_CONFIG.minSampleSize) {
            const confidence = calculateConfidence(failures.voice.length);
            const trend = trends.voice || 'STABLE';
            const urgency = trend === 'INCREASING' ? 'URGENT: ' : '';

            newRules.push({
                id: 'rule_voice_abandon',
                instruction: `${urgency}SELF-HEAL (VOICE): High abandonment (n=${failures.voice.length}). Shorten initial monologue. Use pattern interrupts. Apply empathy hooks.`,
                weight: confidence,
                confidence,
                trend,
                sector: 'voice',
                sample_size: failures.voice.length,
                created_at: now.toISOString(),
                expires_at: new Date(now.getTime() + CONFIDENCE_CONFIG.ruleTTLDays * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // 2. SEO Healing
        if (failures.seo.length >= CONFIDENCE_CONFIG.minSampleSize) {
            const confidence = calculateConfidence(failures.seo.length);
            const trend = trends.seo || 'STABLE';

            newRules.push({
                id: 'rule_seo_gap',
                instruction: `SELF-HEAL (SEO): High Topic Pressure (n=${failures.seo.length}). Prioritize content with high CTR potential. Focus on ${trend === 'INCREASING' ? 'immediate gaps' : 'long-tail opportunities'}.`,
                weight: confidence,
                confidence,
                trend,
                sector: 'seo',
                sample_size: failures.seo.length,
                created_at: now.toISOString(),
                expires_at: new Date(now.getTime() + CONFIDENCE_CONFIG.ruleTTLDays * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // 3. Ops Healing
        if (failures.ops.length >= CONFIDENCE_CONFIG.minSampleSize) {
            const confidence = calculateConfidence(failures.ops.length);
            const trend = trends.ops || 'STABLE';

            newRules.push({
                id: 'rule_ops_integrity',
                instruction: `SELF-HEAL (OPS): Shopify/Supplier pressure detected (n=${failures.ops.length}). Verify credential health. ${trend === 'INCREASING' ? 'ESCALATE: Check API quotas.' : 'Monitor closely.'}`,
                weight: confidence,
                confidence,
                trend,
                sector: 'operations',
                sample_size: failures.ops.length,
                created_at: now.toISOString(),
                expires_at: new Date(now.getTime() + CONFIDENCE_CONFIG.ruleTTLDays * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // 4. Ads Healing (new)
        if (failures.ads && failures.ads.length >= CONFIDENCE_CONFIG.minSampleSize) {
            const confidence = calculateConfidence(failures.ads.length);
            const trend = trends.ads || 'STABLE';

            newRules.push({
                id: 'rule_ads_cpa',
                instruction: `SELF-HEAL (ADS): CPA exceeding targets (n=${failures.ads.length}). Review audience targeting. ${trend === 'INCREASING' ? 'PAUSE underperforming campaigns.' : 'Optimize creatives.'}`,
                weight: confidence,
                confidence,
                trend,
                sector: 'ads',
                sample_size: failures.ads.length,
                created_at: now.toISOString(),
                expires_at: new Date(now.getTime() + CONFIDENCE_CONFIG.ruleTTLDays * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // SOTA: Merge rules with TTL cleanup
        const merged = currentRules.filter(r => {
            // Remove expired rules
            if (r.expires_at && new Date(r.expires_at) < now) {
                console.log(`[ErrorScience] Rule expired: ${r.id}`);
                return false;
            }
            return true;
        });

        // Update or add new rules
        newRules.forEach(nr => {
            const existingIdx = merged.findIndex(r => r.id === nr.id);
            if (existingIdx !== -1) {
                // Reinforce existing rule (extend TTL, update confidence)
                merged[existingIdx] = {
                    ...merged[existingIdx],
                    ...nr,
                    reinforced_count: (merged[existingIdx].reinforced_count || 0) + 1
                };
            } else if (nr.confidence >= 0.5) {
                // Only add rules with sufficient confidence
                merged.push(nr);
            }
        });

        fs.writeFileSync(this.learnedRulesFile, JSON.stringify(merged, null, 2));
        console.log(`[ErrorScience] Rules updated: ${merged.length} active rules`);
    }

    /**
     * SOTA: Get active learned rules filtered by sector and confidence
     * @param {string} sector - Sector to filter by
     * @param {number} minConfidence - Minimum confidence threshold (0-1)
     */
    getLearnedInstructions(sector = 'voice', minConfidence = 0.5) {
        if (!fs.existsSync(this.learnedRulesFile)) return "";

        try {
            const rules = JSON.parse(fs.readFileSync(this.learnedRulesFile, 'utf8'));
            const now = new Date();

            return rules
                .filter(r => {
                    // Filter by sector
                    if (r.sector && r.sector !== sector.toLowerCase()) return false;
                    // Filter by confidence
                    if ((r.confidence || 0) < minConfidence) return false;
                    // Filter expired rules
                    if (r.expires_at && new Date(r.expires_at) < now) return false;
                    return true;
                })
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)) // Highest confidence first
                .map(r => {
                    const prefix = r.trend === 'INCREASING' ? '⚠️ ' : '';
                    return `${prefix}${r.instruction} (confidence: ${Math.round((r.confidence || 0) * 100)}%)`;
                })
                .join('\n');
        } catch (e) {
            console.error(`[ErrorScience] Failed to read rules: ${e.message}`);
            return "";
        }
    }

    /**
     * SOTA: Get full rule details for monitoring dashboards
     */
    getRulesStatus() {
        if (!fs.existsSync(this.learnedRulesFile)) {
            return { rules: [], count: 0 };
        }

        try {
            const rules = JSON.parse(fs.readFileSync(this.learnedRulesFile, 'utf8'));
            const now = new Date();

            const activeRules = rules.filter(r => {
                if (r.expires_at && new Date(r.expires_at) < now) return false;
                return true;
            });

            return {
                rules: activeRules,
                count: activeRules.length,
                by_sector: {
                    voice: activeRules.filter(r => r.sector === 'voice').length,
                    seo: activeRules.filter(r => r.sector === 'seo').length,
                    ops: activeRules.filter(r => r.sector === 'operations').length,
                    ads: activeRules.filter(r => r.sector === 'ads').length
                },
                avg_confidence: activeRules.length > 0
                    ? activeRules.reduce((sum, r) => sum + (r.confidence || 0), 0) / activeRules.length
                    : 0
            };
        } catch (e) {
            return { rules: [], count: 0, error: e.message };
        }
    }
}

const instance = new ErrorScience();
module.exports = instance;
