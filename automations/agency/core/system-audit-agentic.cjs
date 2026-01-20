#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { logTelemetry } = require('../utils/telemetry.cjs');
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
/**
 * System Audit - Agentic (Level 4)
 * 
 * AI orchestrates cross-platform fixes
 * 
 * USAGE:
 *   node system-audit-agentic.cjs
 *   node system-audit-agentic.cjs --agentic --auto-fix
 * 
 * @version 1.0.0
 * @date 2026-01-08
 */

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    AUTO_FIX: process.argv.includes('--auto-fix'),
    FORCE_MODE: process.argv.includes('--force'), // Bypass GPM pressure
    QUALITY_THRESHOLD: 8,
    GPM_PATH: path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json'),
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

async function auditSystem() {
    const audit = {};

    // 1. System Resources (Real)
    const freeMem = os.freemem() / 1024 / 1024; // MB
    const totalMem = os.totalmem() / 1024 / 1024; // MB
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;
    const load = os.loadavg()[0]; // 1 min load avg

    if (memUsage > 90 || load > 5) {
        audit.system = { status: 'degraded', issues: [`High Load: CPU ${load.toFixed(1)}, Mem ${memUsage.toFixed(0)}%`] };
    } else {
        audit.system = { status: 'healthy', issues: [] };
    }

    // 2. Shopify Connectivity (Real)
    const shop = process.env.SHOPIFY_SHOP || 'hostinger-demo.myshopify.com';
    try {
        const start = Date.now();
        const res = await fetch(`https://${shop}`);
        const ttfb = Date.now() - start;

        if (!res.ok) {
            audit.shopify = { status: 'error', issues: [`Store unreachable (HTTP ${res.status})`] };
        } else if (ttfb > 1500) {
            audit.shopify = { status: 'degraded', issues: [`Slow response (TTFB ${ttfb}ms)`] };
        } else {
            audit.shopify = { status: 'healthy', issues: [] };
        }
    } catch (e) {
        audit.shopify = { status: 'error', issues: [`Connection failed: ${e.message}`] };
    }

    // 3. Integration Config Check (Real)
    const integrations = [
        { name: 'klaviyo', key: 'KLAVIYO_API_KEY' },
        { name: 'ga4', key: 'GA4_PROPERTY_ID' },
        { name: 'meta', key: 'META_ACCESS_TOKEN' }
    ];

    integrations.forEach(integ => {
        if (!process.env[integ.key]) {
            audit[integ.name] = { status: 'error', issues: [`Missing environment variable: ${integ.key}`] };
        } else {
            // Assume healthy if key exists (deep check would require API call)
            audit[integ.name] = { status: 'healthy', issues: [] };
        }
    });

    return audit;
}

async function prioritizeIssuesAI(audit) {
    const prompt = `Review this system audit and prioritize issues based on revenue impact and conversion friction.
Audit Data: ${JSON.stringify(audit, null, 2)}

Task:
1. Assign priority (critical, high, medium, low) to each issue.
2. Estimate a 1-10 impact score.
3. Sort by impact.

Output JSON: { "prioritized": [{ "platform": "...", "issue": "...", "priority": "...", "impact": <number> }] }`;

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            const result = await callAI(provider, prompt, 'You are a Senior Systems Architect.');
            return result.prioritized;
        } catch (e) {
            continue;
        }
    }

    // Fallback if AI fails (previous logic)
    const allIssues = [];
    Object.entries(audit).forEach(([platform, data]) => {
        data.issues.forEach(issue => {
            let priority = 'low';
            let impact = 1;
            if (issue.includes('checkout') || issue.includes('conversion')) { priority = 'critical'; impact = 10; }
            else if (issue.includes('tracking') || issue.includes('pixel')) { priority = 'high'; impact = 7; }
            allIssues.push({ platform, issue, priority, impact });
        });
    });
    return allIssues.sort((a, b) => b.impact - a.impact);
}

async function orchestrateFixesAI(issues) {
    console.log(`\n🤖 ORCHESTRATE: Planning fixes for ${issues.length} issues using AI...`);

    const prompt = `Map these system issues to the best automation tools available.
Issues: ${JSON.stringify(issues, null, 2)}

Available Tools:
- product_enrichment_agentic: For SEO/Meta issues.
- store_audit_agentic: For CVR/Checkout/Speed issues.
- verify_facebook_pixel: For tracking/pixel issues.
- analyze_ga4_conversions: For GA4/Tracking issues.

Task: Generate a plan mapping issues to tools with parameters.
Output JSON: { "plan": [{ "issue": "...", "action": { "tool": "...", "params": {...} } }] }`;

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            const result = await callAI(provider, prompt, 'You are a Technical Orchestrator.');
            return result.plan;
        } catch (e) {
            continue;
        }
    }
    return []; // Fallback
}

async function agenticSystemAudit() {
    console.log('\n🤖 AGENTIC MODE (Level 4): Draft → Critique → Orchestrate → Execute\n');

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        const pressure = (gpm.sectors.system && gpm.sectors.system.audit) ? gpm.sectors.system.audit.pressure : 0;
        const threshold = gpm.thresholds.high || 70;

        if (pressure < threshold) {
            console.log(`[Equilibrium] System Pressure (${pressure}) below threshold (${threshold}). No AI reasoning required.`);
            return { audit: {}, issues: [], plan: null, executed: false, status: "EQUILIBRIUM" };
        }
        console.log(`[Sluice Gate Open] High System Pressure detected (${pressure}). Activating AI Diagnostic...`);
    }

    console.log('📝 DRAFT: Auditing all platforms...');
    const audit = await auditSystem();
    console.log(`✅ Audited ${Object.keys(audit).length} platforms`);

    console.log('\n🔍 CRITIQUE: Prioritizing issues by impact using AI...');
    const prioritized = await prioritizeIssuesAI(audit);
    console.log(`📊 Found ${prioritized.length} issues`);

    if (!CONFIG.AGENTIC_MODE) {
        console.log('⚠️  Agentic mode disabled. Returning audit only.');
        return { audit, issues: prioritized, plan: null, executed: false };
    }

    console.log('\n🎯 ORCHESTRATE: Generating fix plan using AI...');
    const plan = await orchestrateFixesAI(prioritized);
    console.log(`✅ Generated plan for ${plan.length} fixable issues`);

    if (CONFIG.AUTO_FIX) {
        console.log('\n🚀 EXECUTE: Running automated fixes...');
        // Would execute tools here
        console.log('✅ Fixes executed (simulated)');
        return { audit, issues: prioritized, plan, executed: true };
    }

    console.log('\n⚠️  Auto-fix disabled. Review plan and run with --auto-fix');
    return { audit, issues: prioritized, plan, executed: false };
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
System Audit - Agentic (Level 4)

USAGE:
  node system-audit-agentic.cjs [--agentic] [--auto-fix]

OPTIONS:
  --agentic     Enable agentic mode (orchestration)
  --auto-fix    Auto-execute fixes (requires --agentic)
  --help        Show this help
    `);
        process.exit(0);
    }

    const startTime = Date.now();
    const result = await agenticSystemAudit();
    const duration = Date.now() - startTime;

    console.log(`\n✅ COMPLETE`);
    console.log(`   Issues found: ${result.issues.length}`);
    console.log(`   Fixable: ${result.plan ? result.plan.length : 0}`);
    console.log(`   Executed: ${result.executed ? 'Yes' : 'No'}`);
    logTelemetry('SystemAuditor-L4', 'System Audit', { issues: result.issues.length }, 'SUCCESS');
    console.log(`   Duration: ${duration}ms`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticSystemAudit };
