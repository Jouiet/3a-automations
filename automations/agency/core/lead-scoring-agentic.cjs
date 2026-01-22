#!/usr/bin/env node
/**
 * Lead Scoring - Agentic (Level 3)
 * 
 * Transforms lead scoring from manual/reactive to agentic with AI critique loop
 * 
 * ARCHITECTURE:
 * - Draft: Generate lead score (0-100) based on engagement metrics
 * - Critique: AI validates scoring logic against historical conversion data
 * - Refine: Adjust weights if accuracy <80%
 * 
 * USAGE:
 *   node lead-scoring-agentic.cjs --input leads.json
 *   node lead-scoring-agentic.cjs --input leads.json --agentic
 *   node lead-scoring-agentic.cjs --help
 * 
 * @version 1.0.0
 * @date 2026-01-08
 */

const fs = require('fs');
const path = require('path');
const { logTelemetry } = require('../utils/telemetry.cjs');
const llmGateway = require('./gateways/llm-global-gateway.cjs');

// Portability Patch: Resilient .env loading
const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '../../../.env'),
    path.join(process.cwd(), '.env')
];
let envFound = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log(`[Telemetry] Configuration loaded from: ${envPath}`);
        envFound = true;
        break;
    }
}
if (!envFound) {
    console.warn('[Telemetry] No .env file found in search paths. Using existing environment variables.');
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    FORCE_MODE: process.argv.includes('--force'), // Bypass GPM pressure
    QUALITY_THRESHOLD: 8, // 0-10 scale
    GPM_PATH: path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json'),

    // Multi-provider fallback
    AI_PROVIDERS: [
        { name: 'claude', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'gemini', model: 'gemini-3-flash-preview', apiKey: process.env.GEMINI_API_KEY },
        { name: 'grok', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
    ],

    // Scoring weights (initial)
    WEIGHTS: {
        email_opens: 0.15,
        email_clicks: 0.20,
        website_visits: 0.15,
        form_submissions: 0.25,
        demo_requests: 0.25
    },

    // Historical conversion data for validation
    HISTORICAL_ACCURACY_TARGET: 0.80 // 80%
};

// ============================================================================
// AI PROVIDER CLIENTS
// ============================================================================

async function callAI(provider, prompt, systemPrompt = '') {
    const startTime = Date.now();
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    try {
        // Use the centralized Gateway
        return await llmGateway.generate(provider.name, fullPrompt);
    } catch (error) {
        console.error(`[${provider.name}] Error:`, error.message);
        throw error;
    } finally {
        const duration = Date.now() - startTime;
        console.log(`[${provider.name}] Response time: ${duration}ms`);
    }
}

// ============================================================================
// LEAD SCORING LOGIC
// ============================================================================

function calculateLeadScore(lead, weights = CONFIG.WEIGHTS) {
    const score =
        (lead.email_opens || 0) * weights.email_opens +
        (lead.email_clicks || 0) * weights.email_clicks +
        (lead.website_visits || 0) * weights.website_visits +
        (lead.form_submissions || 0) * weights.form_submissions +
        (lead.demo_requests || 0) * weights.demo_requests;

    return Math.min(100, Math.round(score));
}

function scoreLeads(leads, weights = CONFIG.WEIGHTS) {
    return leads.map(lead => ({
        ...lead,
        score: calculateLeadScore(lead, weights),
        scoring_weights: weights,
        scored_at: new Date().toISOString()
    }));
}

// ============================================================================
// AGENTIC WORKFLOW
// ============================================================================

async function agenticLeadScoring(leads, historicalData = []) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        const pressure = (gpm.sectors.sales && gpm.sectors.sales.lead_scoring) ? gpm.sectors.sales.lead_scoring.pressure : 0;
        const threshold = gpm.thresholds.high || 70;

        if (pressure < threshold) {
            console.log(`[Equilibrium] Lead Scoring Pressure (${pressure}) below threshold (${threshold}). No AI reasoning required.`);
            return { scores: [], quality: null, refined: false, status: "EQUILIBRIUM" };
        }
        console.log(`[Sluice Gate Open] High Lead Scoring Pressure detected (${pressure}). Activating AI Scoring...`);
    }

    // STEP 1: DRAFT
    console.log('📝 DRAFT: Generating initial lead scores...');
    const draftScores = scoreLeads(leads, CONFIG.WEIGHTS);
    console.log(`✅ Scored ${draftScores.length} leads`);

    if (!CONFIG.AGENTIC_MODE) {
        console.log('⚠️  Agentic mode disabled. Returning draft scores.');
        return { scores: draftScores, quality: null, refined: false };
    }

    // STEP 2: CRITIQUE
    console.log('\n🔍 CRITIQUE: Validating scoring logic...');
    const critique = await critiqueScoring(draftScores, historicalData, CONFIG.WEIGHTS);

    console.log(`\n📊 Quality Score: ${critique.score}/10`);
    console.log(`📝 Feedback: ${critique.feedback}`);

    // STEP 3: REFINE (if needed)
    if (critique.score < CONFIG.QUALITY_THRESHOLD) {
        console.log(`\n🔧 REFINE: Score below threshold (${CONFIG.QUALITY_THRESHOLD}). Adjusting weights...`);
        const refinedWeights = await refineWeights(CONFIG.WEIGHTS, critique, historicalData);
        const refinedScores = scoreLeads(leads, refinedWeights);

        console.log('✅ Refined scores generated with adjusted weights');
        return { scores: refinedScores, quality: critique, refined: true, weights: refinedWeights };
    }

    console.log('\n✅ Quality acceptable. Using draft scores.');
    return { scores: draftScores, quality: critique, refined: false };
}

async function critiqueScoring(scoredLeads, historicalData, weights) {
    const prompt = `You are a lead scoring expert. Critique the following lead scoring logic.

CURRENT WEIGHTS:
${JSON.stringify(weights, null, 2)}

SAMPLE SCORED LEADS (first 5):
${JSON.stringify(scoredLeads.slice(0, 5), null, 2)}

${historicalData.length > 0 ? `HISTORICAL CONVERSION DATA:
${JSON.stringify(historicalData.slice(0, 10), null, 2)}` : 'No historical data available.'}

TASK:
1. Analyze if the weights make sense for predicting conversions
2. Check if high-scoring leads align with historical converters
3. Identify any obvious flaws in the scoring logic
4. Rate the quality of this scoring system (0-10)

RESPONSE FORMAT (JSON):
{
  "score": <0-10>,
  "feedback": "<concise critique>",
  "suggested_adjustments": {
    "email_opens": <0.0-1.0>,
    "email_clicks": <0.0-1.0>,
    "website_visits": <0.0-1.0>,
    "form_submissions": <0.0-1.0>,
    "demo_requests": <0.0-1.0>
  }
}`;

    const systemPrompt = 'You are a data scientist specializing in lead scoring and conversion optimization. Provide factual, data-driven critiques.';

    // Try providers with fallback
    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            console.log(`  Trying ${provider.name}...`);
            const response = await callAI(provider, prompt, systemPrompt);

            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const critique = JSON.parse(jsonMatch[0]);
            critique.provider = provider.name;
            return critique;

        } catch (error) {
            console.error(`  ❌ ${provider.name} failed:`, error.message);
            continue;
        }
    }

    throw new Error('All AI providers failed');
}

async function refineWeights(currentWeights, critique, historicalData) {
    const prompt = `Based on this critique, suggest improved weights for lead scoring.

CURRENT WEIGHTS:
${JSON.stringify(currentWeights, null, 2)}

CRITIQUE:
${critique.feedback}

SUGGESTED ADJUSTMENTS:
${JSON.stringify(critique.suggested_adjustments, null, 2)}

TASK:
Provide refined weights that address the critique. Weights must sum to 1.0.

RESPONSE FORMAT (JSON):
{
  "email_opens": <0.0-1.0>,
  "email_clicks": <0.0-1.0>,
  "website_visits": <0.0-1.0>,
  "form_submissions": <0.0-1.0>,
  "demo_requests": <0.0-1.0>
}`;

    const systemPrompt = 'You are a lead scoring optimization expert. Provide weights that maximize conversion prediction accuracy.';

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            const response = await callAI(provider, prompt, systemPrompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) continue;

            const weights = JSON.parse(jsonMatch[0]);

            // Validate weights sum to ~1.0
            const sum = Object.values(weights).reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 1.0) > 0.05) {
                console.warn(`  ⚠️  Weights sum to ${sum}, normalizing...`);
                Object.keys(weights).forEach(key => weights[key] /= sum);
            }

            return weights;

        } catch (error) {
            console.error(`  ❌ ${provider.name} failed:`, error.message);
            continue;
        }
    }

    // Fallback: use suggested adjustments from critique
    console.warn('  ⚠️  Using critique suggestions as fallback');
    return critique.suggested_adjustments;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
Lead Scoring - Agentic (Level 3)

USAGE:
  node lead-scoring-agentic.cjs --input <file.json> [--agentic] [--historical <file.json>]

OPTIONS:
  --input <file>       Input JSON file with leads (required)
  --historical <file>  Historical conversion data for validation (optional)
  --agentic            Enable agentic mode (Draft→Critique→Refine)
  --output <file>      Output file (default: scored-leads.json)
  --help               Show this help

EXAMPLE:
  node lead-scoring-agentic.cjs --input leads.json --agentic --historical conversions.json
  node lead-scoring-agentic.cjs --sqlite --agentic (Uses production database)
    `);
        process.exit(0);
    }

    const sqliteMode = args.includes('--sqlite');
    const inputIndex = args.indexOf('--input');
    const historicalIndex = args.indexOf('--historical');
    const outputIndex = args.indexOf('--output');

    if (inputIndex === -1 && !sqliteMode) {
        console.error('❌ Error: --input or --sqlite required');
        process.exit(1);
    }

    let leads = [];

    if (sqliteMode) {
        // Load from DB
        const leadsManager = require('./leads-manager.cjs');
        console.log(`📂 Loading leads from SQLite Database...`);
        const dbLeads = leadsManager.getAllLeads();
        // Normalize for scoring
        leads = dbLeads.map(l => ({ ...l, tags: l.tags || [] }));
        console.log(`✅ Loaded ${leads.length} leads from DB.`);
    } else {
        const inputFile = args[inputIndex + 1];
        console.log(`📂 Loading leads from ${inputFile}...`);
        try {
            const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
            leads = Array.isArray(raw) ? raw : (raw.leads || []);
        } catch (e) {
            console.error('Failed to read input file:', e.message);
            process.exit(1);
        }
    }

    const historicalFile = historicalIndex !== -1 ? args[historicalIndex + 1] : null;
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'scored-leads.json';

    let historicalData = [];
    if (historicalFile) {
        console.log(`📂 Loading historical data from ${historicalFile}...`);
        historicalData = JSON.parse(fs.readFileSync(historicalFile, 'utf8'));
    }

    // Run scoring
    const startTime = Date.now();
    const result = await agenticLeadScoring(leads, historicalData);
    const duration = Date.now() - startTime;

    // Save results
    if (sqliteMode) {
        console.log('💾 Saving scores back to SQLite Database...');
        const leadsManager = require('./leads-manager.cjs');
        for (const lead of result.scores) {
            leadsManager.updateScore(lead.id, lead.score, result.weights);
        }
    } else {
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    }

    logTelemetry('LeadScorer-L4', 'Score Leads', { count: result.scores.length, quality: result.quality ? result.quality.score : 0 }, 'SUCCESS');
    console.log(`\n✅ COMPLETE`);
    console.log(`   Leads scored: ${result.scores.length}`);
    console.log(`   Quality: ${result.quality ? result.quality.score + '/10' : 'N/A'}`);
    console.log(`   Refined: ${result.refined ? 'Yes' : 'No'}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Output: ${outputFile}`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticLeadScoring, calculateLeadScore, scoreLeads };
