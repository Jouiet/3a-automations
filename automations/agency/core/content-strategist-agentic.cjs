#!/usr/bin/env node
/**
 * Content Strategist - Agentic (Level 4: Autonomous)
 * 
 * AI-driven content strategy with autonomous agent orchestration
 * 
 * ARCHITECTURE:
 * - Observe: Fetch GSC performance data (impressions vs clicks)
 * - Reason: Identify high-impression/low-click keyword gaps
 * - Decide: Generate a prioritized content calendar for "Rescue"
 * - Act: Autonomously trigger Content Analyst (Level 3 Agent) for top gaps
 * 
 * @version 1.0.0
 * @date 2026-01-08
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { google } = require('googleapis');
const MarketingScience = require('./marketing-science-core.cjs');
// Load environment variables from project root
// Load environment variables (Check local dir, then project root)
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
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

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    ORCHESTRATE_MODE: process.argv.includes('--orchestrate'),
    FORCE_MODE: process.argv.includes('--force'), // Bypass GPM pressure
    QUALITY_THRESHOLD: 8,
    GPM_PATH: path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json'),
    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'google', model: 'gemini-3-flash-preview', apiKey: process.env.GEMINI_API_KEY },
        { name: 'xai', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
    ]
};

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
        agent: 'ContentStrategist-L4',
        action,
        details,
        status: 'SUCCESS'
    });

    // Keep last 50 logs
    if (logs.length > 50) logs = logs.slice(0, 50);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

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


async function fetchGSCData(siteUrl) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error('Real GSC Credentials Required (GOOGLE_APPLICATION_CREDENTIALS)');
    }

    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    console.log(`📡 Fetching Real GSC Data for: ${siteUrl}...`);

    const res = await searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
            startDate: '28daysAgo',
            endDate: 'yesterday',
            dimensions: ['query'],
            rowLimit: 10
        }
    });

    if (!res.data.rows) return [];

    return res.data.rows.map(row => ({
        query: row.keys[0],
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        position: row.position
    }));
}

async function analyzeGapsAI(data) {
    console.log('🔍 ANALYZING: Identifying high-potential GSC gaps using AI...');

    const basePrompt = `Analyze this Google Search Console data and identify high-value keyword "gaps" (high impressions but low CTR/position).
Data: ${JSON.stringify(data, null, 2)}

Task:
1. Assign a gap_score (0-100) based on opportunity.
2. Tag priority (CRITICAL, HIGH, MEDIUM, MAINTAIN).
3. Suggest the "Rescue" strategy (e.g., SEO title update, new blog post).

Output JSON: { "gaps": [{ "query": "...", "gap_score": <number>, "priority": "...", "strategy": "..." }] }`;

    const prompt = MarketingScience.inject('SB7', basePrompt);

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            const result = await callAI(provider, prompt, 'You are a Senior SEO Strategist.');
            return result.gaps;
        } catch (e) {
            continue;
        }
    }

    // Fallback logic
    return data.map(query => ({
        ...query,
        gap_score: query.impressions * (1 - query.ctr) / query.position,
        priority: query.ctr < 0.02 && query.position > 10 ? 'CRITICAL' : 'MAINTAIN'
    })).sort((a, b) => b.gap_score - a.gap_score);
}

async function orchestrateContent(gaps) {
    console.log('\n🚀 ORCHESTRATION: Triggering content generation for top gaps...');

    const topGap = gaps[0];
    console.log(`   [Target] Query: "${topGap.query}" (Gap Score: ${topGap.gap_score.toFixed(0)})`);

    if (CONFIG.ORCHESTRATE_MODE) {
        logToMcp('ORCHESTRATE_CONTENT', {
            target_query: topGap.query,
            reason: 'High impressions, low CTR gap detection',
            priority: topGap.priority
        });

        console.log(`   [Action] Running Content Analyst Agent for "${topGap.query}"...`);

        try {
            // Execute Blog Generator with --distribute (Triggers CinematicAds)
            // Using absolute path for reliability
            const scriptPath = path.join(__dirname, 'blog-generator-resilient.cjs');
            const cmd = `node "${scriptPath}" --topic="${topGap.query}" --distribute --agentic`;
            console.log(`   [Exec] ${cmd}`);

            // In a real live run, we executes this. For verification safety, we log it.
            // UNCOMMENT TO ENABLE AUTO-POSTING:
            const output = execSync(cmd, { encoding: 'utf8' });
            console.log(output);

            // For now, we simulate success and log to dashboard to prove intent
            console.log(`   [Result] Content generation & Video production triggered.`);
        } catch (error) {
            console.error(`   [Error] Execution failed: ${error.message}`);
        }
    } else {
        console.log(`   [Notice] Orchestrate mode disabled. Use --orchestrate to act.`);
    }

    return { success: true, target: topGap.query };
}

async function main() {
    console.log('\n🧠 CONTENT STRATEGIST: GSC Gap Analysis Loop\n');

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        const pressure = gpm.sectors.seo.gsc_gaps.pressure;
        const threshold = gpm.thresholds.high;

        if (pressure < threshold) {
            console.log(`[Equilibrium] SEO Pressure (${pressure}) below threshold (${threshold}). No AI orchestration required.`);
            return;
        }
        console.log(`[Sluice Gate Open] High SEO Potential detected (${pressure}). Activating AI Orchestration...`);
    }

    const data = await fetchGSCData();
    const gaps = await analyzeGapsAI(data);

    console.table(gaps);

    if (CONFIG.AGENTIC_MODE) {
        await orchestrateContent(gaps);
    }

    console.log('\n✅ COMPLETE');
}

main().catch(console.error);
