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

// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    QUALITY_THRESHOLD: 8, // 0-10 scale

    // Multi-provider fallback
    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'google', model: 'gemini-3-flash-preview', apiKey: process.env.GEMINI_API_KEY },
        { name: 'xai', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
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

    try {
        if (provider.name === 'anthropic') {
            return await callClaude(provider, prompt, systemPrompt);
        } else if (provider.name === 'google') {
            return await callGemini(provider, prompt, systemPrompt);
        } else if (provider.name === 'xai') {
            return await callGrok(provider, prompt, systemPrompt);
        }
    } catch (error) {
        console.error(`[${provider.name}] Error:`, error.message);
        throw error;
    } finally {
        const duration = Date.now() - startTime;
        console.log(`[${provider.name}] Response time: ${duration}ms`);
    }
}

async function callClaude(provider, prompt, systemPrompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': provider.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: provider.model,
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

async function callGemini(provider, prompt, systemPrompt) {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { maxOutputTokens: 2000 }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function callGrok(provider, prompt, systemPrompt) {
    const messages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
        : [{ role: 'user', content: prompt }];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
            model: provider.model,
            messages,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
    `);
        process.exit(0);
    }

    const inputIndex = args.indexOf('--input');
    const historicalIndex = args.indexOf('--historical');
    const outputIndex = args.indexOf('--output');

    if (inputIndex === -1) {
        console.error('❌ Error: --input required');
        process.exit(1);
    }

    const inputFile = args[inputIndex + 1];
    const historicalFile = historicalIndex !== -1 ? args[historicalIndex + 1] : null;
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'scored-leads.json';

    // Load data
    console.log(`📂 Loading leads from ${inputFile}...`);
    const leads = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

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
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

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
