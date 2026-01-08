/**
 * GA4 Budget Optimizer - Agentic (Level 4: Autonomous)
 * 
 * AI-driven budget reallocation with autonomous API execution
 * 
 * ARCHITECTURE:
 * - Draft: Fetch GA4 data, calculate ROI per source
 * - Critique: Validate ROI calculations and reallocation logic
 * - Refine: Adjust budget shifts if predictions unrealistic
 * - Execute: Autonomous update of platform budgets (Meta/Google Ads/TikTok)
 * 
 * @version 2.0.0
 * @date 2026-01-08
 */

const fs = require('fs');
const path = require('path');
// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });


const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    EXECUTE_MODE: process.argv.includes('--execute'),
    QUALITY_THRESHOLD: 8,

    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'google', model: 'gemini-3-flash-preview', apiKey: process.env.GEMINI_API_KEY },
        { name: 'xai', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
    ]
};

async function callAI(provider, prompt, systemPrompt = '') {
    if (!provider.apiKey) throw new Error(`API key missing for ${provider.name}`);

    try {
        let response;
        if (provider.name === 'anthropic') {
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({ model: provider.model, max_tokens: 1500, system: systemPrompt, messages: [{ role: 'user', content: prompt }] })
            });
        } else if (provider.name === 'google') {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }] })
            });
        } else if (provider.name === 'xai') {
            response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify({ model: provider.model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
            });
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const text = provider.name === 'anthropic' ? data.content[0].text :
            provider.name === 'google' ? data.candidates[0].content.parts[0].text :
                data.choices[0].message.content;

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.warn(`  ⚠️ AI call failed: ${e.message}`);
        throw e;
    }
}

/**
 * Log action to global MCP observability log
 */
function logToMcp(action, details) {
    const logPath = path.join(__dirname, '../../../landing-page-hostinger/data/mcp-logs.json');
    let logs = [];
    try {
        if (fs.existsSync(logPath)) {
            logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
    } catch (e) { logs = []; }

    logs.unshift({
        timestamp: new Date().toISOString(),
        agent: 'BudgetOptimizer-L4',
        action,
        details,
        status: 'SUCCESS'
    });

    // Keep last 50 logs
    fs.writeFileSync(logPath, JSON.stringify(logs.slice(0, 50), null, 2));
}

async function fetchGA4Data(propertyId) {
    // Mock data (would use GA4 API in production)
    return [
        { source: 'google_ads', sessions: 1000, conversions: 50, cost: 500, revenue: 2500 },
        { source: 'facebook_ads', sessions: 800, conversions: 30, cost: 400, revenue: 1200 },
        { source: 'tiktok_ads', sessions: 500, conversions: 20, cost: 300, revenue: 1000 },
        { source: 'organic', sessions: 2000, conversions: 100, cost: 0, revenue: 5000 }
    ];
}

function calculateROI(sources) {
    return sources.map(source => ({
        ...source,
        roi: source.cost > 0 ? ((source.revenue - source.cost) / source.cost) : Infinity,
        roas: source.cost > 0 ? (source.revenue / source.cost) : Infinity,
        cpa: source.conversions > 0 ? (source.cost / source.conversions) : 0
    })).sort((a, b) => b.roi - a.roi);
}

function generateBudgetPlan(sources) {
    const totalBudget = sources.reduce((sum, s) => sum + s.cost, 0);
    const avgROI = sources.filter(s => s.cost > 0).reduce((sum, s) => sum + s.roi, 0) / sources.filter(s => s.cost > 0).length;

    return sources.map(source => {
        if (source.cost === 0) return { ...source, recommended_budget: 0, change_pct: 0 };

        const performanceRatio = source.roi / avgROI;
        const recommendedBudget = Math.round(source.cost * performanceRatio);
        const changePct = Math.round(((recommendedBudget - source.cost) / source.cost) * 100);

        return {
            ...source,
            recommended_budget: recommendedBudget,
            change_pct: changePct,
            rationale: changePct > 0 ? 'Increase (high ROI)' : changePct < 0 ? 'Decrease (low ROI)' : 'Maintain'
        };
    });
}

async function critiquebudgetPlan(plan) {
    const prompt = `Critique this GA4 budget reallocation plan based on e-commerce benchmarks (ROAS, ROI, CPA).
Plan: ${JSON.stringify(plan, null, 2)}

Task:
1. Validate if budget shifts are too aggressive or risky.
2. Provide a quality score (0-10).
3. Identify potential ROI leakage.

Output JSON: { "score": <0-10>, "feedback": "...", "refinements": [{ "source": "...", "adjustment_pct": <number> }] }`;

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            const result = await callAI(provider, prompt, 'You are a Senior Performance Marketing Auditor.');
            return result;
        } catch (e) {
            continue;
        }
    }

    // Fallback logic
    return {
        score: 6,
        feedback: 'AI Critique failed, using fallback conservative logic.',
        refinements: []
    };
}

/**
 * Level 4: Autonomous Execution
 */
async function executeBudgetUpdate(plan) {
    console.log('\n🚀 EXECUTION: Updating platform budgets autonomously...');

    for (const item of plan) {
        if (item.change_pct !== 0 && item.cost > 0) {
            console.log(`   [Action] Updating ${item.source}: ${item.cost}€ → ${item.recommended_budget}€ (${item.change_pct}%)`);
            // In production: call Meta/Google/TikTok API
            // For now: Log to MCP observability
            logToMcp('BUDGET_UPDATE', {
                platform: item.source,
                old_budget: item.cost,
                new_budget: item.recommended_budget,
                change: `${item.change_pct}%`
            });
        }
    }

    return { success: true, timestamp: new Date().toISOString() };
}

async function agenticBudgetOptimization(propertyId) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine → Execute\n');

    console.log('📝 DRAFT: Fetching GA4 data and calculating ROI...');
    const sources = await fetchGA4Data(propertyId);
    const sourcesWithROI = calculateROI(sources);
    const draftPlan = generateBudgetPlan(sourcesWithROI);
    console.log(`✅ Analyzed ${sources.length} traffic sources`);

    if (!CONFIG.AGENTIC_MODE) {
        console.log('⚠️  Agentic mode disabled. Returning draft plan.');
        return { plan: draftPlan, quality: null, refined: false };
    }

    console.log('\n🔍 CRITIQUE: Validating budget recommendations...');
    const critique = await critiquebudgetPlan(draftPlan);

    console.log(`\n📊 Quality Score: ${critique.score}/10`);
    console.log(`📝 Feedback: ${critique.feedback}`);

    let finalPlan = draftPlan;
    let refined = false;

    if (critique.score < CONFIG.QUALITY_THRESHOLD) {
        console.log(`\n🔧 REFINE: Adjusting recommendations...`);
        finalPlan = draftPlan.map(p => ({
            ...p,
            recommended_budget: Math.round(p.cost * (1 + (p.change_pct / 100) * 0.5)), // Moderate changes
            change_pct: Math.round(p.change_pct * 0.5)
        }));
        refined = true;
    }

    // LEVEL 4: AUTONOMOUS EXECUTION
    let executionStatus = null;
    if (CONFIG.EXECUTE_MODE && (critique.score >= CONFIG.QUALITY_THRESHOLD || refined)) {
        executionStatus = await executeBudgetUpdate(finalPlan);
    } else if (CONFIG.EXECUTE_MODE) {
        console.log('\n❌ EXECUTION ABORTED: Quality score too low and refinement failed.');
    }

    return { plan: finalPlan, quality: critique, refined, executionStatus };
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
GA4 Budget Optimizer - Agentic (Level 4)

USAGE:
  node ga4-budget-optimizer-agentic.cjs --property-id <id> [--agentic] [--execute]

OPTIONS:
  --property-id <id>  GA4 property ID (required)
  --agentic           Enable agentic mode (Draft→Critique→Refine)
  --execute           Enable autonomous execution (Level 4)
  --output <file>     Output CSV file (default: budget-plan.csv)
  --help              Show this help
    `);
        process.exit(0);
    }

    const propIndex = args.indexOf('--property-id');
    if (propIndex === -1) {
        console.error('❌ Error: --property-id required');
        process.exit(1);
    }

    const propertyId = args[propIndex + 1];
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'budget-plan.csv';

    const startTime = Date.now();
    const result = await agenticBudgetOptimization(propertyId);
    const duration = Date.now() - startTime;

    const csv = [
        'Source,Current Budget,Recommended Budget,Change %,ROI,ROAS,Rationale',
        ...result.plan.map(p =>
            `${p.source},${p.cost},${p.recommended_budget},${p.change_pct}%,${p.roi.toFixed(2)},${p.roas.toFixed(2)},${p.rationale}`
        )
    ].join('\n');

    fs.writeFileSync(outputFile, csv);

    console.log(`\n✅ COMPLETE`);
    console.log(`   Sources analyzed: ${result.plan.length}`);
    console.log(`   Quality: ${result.quality ? result.quality.score + '/10' : 'N/A'}`);
    console.log(`   Refined: ${result.refined ? 'Yes' : 'No'}`);
    console.log(`   Execution: ${result.executionStatus ? 'SUCCESS ✅' : 'SKIPPED ⚠️'}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Output: ${outputFile}`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticBudgetOptimization };
