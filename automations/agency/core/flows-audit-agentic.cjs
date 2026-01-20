#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const MarketingScience = require('./marketing-science-core.cjs');
const { logTelemetry } = require('../utils/telemetry.cjs');

/**
 * Flows Audit - Agentic (Level 3)
 * 
 * Audits Klaviyo/Shopify flows and generates AI-prioritized fix list with revenue impact
 * 
 * ARCHITECTURE:
 * - Draft: Scan flows, identify issues
 * - Critique: AI estimates revenue impact per issue (€/month)
 * - Refine: Re-prioritize if logic flawed
 * 
 * USAGE:
 *   node flows-audit-agentic.cjs --platform klaviyo --api-key XXX
 *   node flows-audit-agentic.cjs --platform shopify --shop myshop.myshopify.com --agentic
 *   node flows-audit-agentic.cjs --help
 * 
 * @version 1.0.0
 * @date 2026-01-08
 */

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

const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    FORCE_MODE: process.argv.includes('--force'), // Bypass GPM pressure
    QUALITY_THRESHOLD: 8,
    GPM_PATH: path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json'),

    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'google', model: 'gemini-3-flash-preview', apiKey: process.env.GEMINI_API_KEY },
        { name: 'xai', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
    ],

    // Issue severity weights for revenue impact
    SEVERITY_WEIGHTS: {
        critical: 1.0,    // Broken flows, no sends
        high: 0.7,        // Poor targeting, low engagement
        medium: 0.4,      // Suboptimal timing, missing personalization
        low: 0.2          // Minor improvements
    }
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
        agent: 'FlowsAuditor-L4',
        action,
        details,
        status: 'SUCCESS'
    });

    // Keep last 50 logs
    if (logs.length > 50) logs = logs.slice(0, 50);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

// ============================================================================
// PLATFORM CLIENTS
// ============================================================================

async function fetchKlaviyoFlows(apiKey) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'a.klaviyo.com',
            path: '/api/v2/flows',
            method: 'GET',
            headers: {
                'Authorization': `Klaviyo-API-Key ${apiKey}`,
                'Accept': 'application/json'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Klaviyo API error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

async function fetchShopifyFlows(shop, accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: shop,
            path: '/admin/api/2024-01/flows.json',
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Shopify API error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// ============================================================================
// AUDIT LOGIC
// ============================================================================

function auditFlow(flow, platform) {
    const issues = [];

    // Check if flow is active
    if (!flow.status || flow.status !== 'live') {
        issues.push({
            type: 'critical',
            flow_id: flow.id,
            flow_name: flow.name,
            issue: 'Flow is not live',
            recommendation: 'Activate flow to start sending',
            estimated_impact_eur: 500 // Base estimate
        });
    }

    // Check send frequency
    if (platform === 'klaviyo' && flow.trigger_type === 'metric') {
        if (!flow.trigger_filters || flow.trigger_filters.length === 0) {
            issues.push({
                type: 'high',
                flow_id: flow.id,
                flow_name: flow.name,
                issue: 'No trigger filters - may send to wrong audience',
                recommendation: 'Add segmentation filters',
                estimated_impact_eur: 300
            });
        }
    }

    // Check email content
    if (flow.messages && flow.messages.length > 0) {
        flow.messages.forEach((msg, idx) => {
            if (!msg.subject || msg.subject.length < 10) {
                issues.push({
                    type: 'medium',
                    flow_id: flow.id,
                    flow_name: flow.name,
                    message_index: idx,
                    issue: 'Subject line too short or missing',
                    recommendation: 'Write compelling subject (30-50 chars)',
                    estimated_impact_eur: 150
                });
            }

            if (!msg.preview_text) {
                issues.push({
                    type: 'low',
                    flow_id: flow.id,
                    flow_name: flow.name,
                    message_index: idx,
                    issue: 'Missing preview text',
                    recommendation: 'Add preview text for better open rates',
                    estimated_impact_eur: 50
                });
            }
        });
    }

    return issues;
}

function auditFlows(flows, platform) {
    const allIssues = [];

    flows.forEach(flow => {
        const issues = auditFlow(flow, platform);
        allIssues.push(...issues);
    });

    // Sort by severity
    return allIssues.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.type] - severityOrder[b.type];
    });
}

// ============================================================================
// AGENTIC WORKFLOW
// ============================================================================

async function callAI(provider, prompt, systemPrompt = '') {
    if (!provider.apiKey) throw new Error(`API key missing for ${provider.name}`);

    try {
        let response;
        if (provider.name === 'anthropic') {
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({ model: provider.model, max_tokens: 1000, system: systemPrompt, messages: [{ role: 'user', content: prompt }] })
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
        return provider.name === 'anthropic' ? data.content[0].text :
            provider.name === 'google' ? data.candidates[0].content.parts[0].text :
                data.choices[0].message.content;
    } catch (e) {
        console.warn(`  ⚠️ AI call failed: ${e.message}`);
        throw e;
    }
}

async function critiqueAudit(issues) {
    const basePrompt = `You are a marketing automation expert. Review this flow audit and critique the revenue impact estimates.

AUDIT ISSUES:
${JSON.stringify(issues.slice(0, 10), null, 2)}

TASK:
1. Validate if revenue impact estimates are realistic
2. Check if prioritization makes sense (critical > high > medium > low)
3. Suggest better impact estimates if needed
4. Rate audit quality (0-10)

RESPONSE FORMAT (JSON):
{
  "score": <0-10>,
  "feedback": "<concise critique>",
  "adjusted_estimates": [
    { "flow_id": "<id>", "issue": "<issue>", "new_impact_eur": <number> }
  ]
}`;

    const prompt = MarketingScience.inject('AIDA', basePrompt);

    const systemPrompt = 'You are a Klaviyo/Shopify expert with 10+ years experience. Provide data-driven revenue estimates.';

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            console.log(`  Trying ${provider.name}...`);
            const response = await callAI(provider, prompt, systemPrompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) continue;

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

async function refineAudit(issues, critique) {
    // Apply adjusted estimates from critique
    const adjustedIssues = issues.map(issue => {
        const adjustment = critique.adjusted_estimates.find(
            adj => adj.flow_id === issue.flow_id && adj.issue === issue.issue
        );

        if (adjustment) {
            return { ...issue, estimated_impact_eur: adjustment.new_impact_eur };
        }
        return issue;
    });

    // Re-sort by impact
    return adjustedIssues.sort((a, b) => b.estimated_impact_eur - a.estimated_impact_eur);
}

async function agenticFlowsAudit(flows, platform) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        const pressure = (gpm.sectors.system && gpm.sectors.system.flows) ? gpm.sectors.system.flows.pressure : 0;
        const threshold = gpm.thresholds.high || 70;

        if (pressure < threshold) {
            console.log(`[Equilibrium] Flows Pressure (${pressure}) below threshold (${threshold}). No AI reasoning required.`);
            return { issues: [], quality: null, refined: false, status: "EQUILIBRIUM" };
        }
        console.log(`[Sluice Gate Open] High Flows Pressure detected (${pressure}). Activating AI Audit...`);
    }

    // STEP 1: DRAFT
    console.log('📝 DRAFT: Auditing flows...');
    const draftIssues = auditFlows(flows, platform);
    console.log(`✅ Found ${draftIssues.length} issues`);

    if (!CONFIG.AGENTIC_MODE) {
        console.log('⚠️  Agentic mode disabled. Returning draft audit.');
        return { issues: draftIssues, quality: null, refined: false };
    }

    // STEP 2: CRITIQUE
    console.log('\n🔍 CRITIQUE: Validating revenue estimates...');
    const critique = await critiqueAudit(draftIssues);

    console.log(`\n📊 Quality Score: ${critique.score}/10`);
    console.log(`📝 Feedback: ${critique.feedback}`);

    // STEP 3: REFINE
    if (critique.score < CONFIG.QUALITY_THRESHOLD) {
        console.log(`\n🔧 REFINE: Adjusting impact estimates...`);
        const refinedIssues = await refineAudit(draftIssues, critique);
        return { issues: refinedIssues, quality: critique, refined: true };
    }

    console.log('\n✅ Quality acceptable. Using draft audit.');
    return { issues: draftIssues, quality: critique, refined: false };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
Flows Audit - Agentic (Level 3)

USAGE:
  node flows-audit-agentic.cjs --platform <klaviyo|shopify> [--agentic]

KLAVIYO:
  --platform klaviyo --api-key <key>

SHOPIFY:
  --platform shopify --shop <shop.myshopify.com> --access-token <token>

OPTIONS:
  --agentic     Enable agentic mode (Draft→Critique→Refine)
  --output      Output CSV file (default: flows-audit.csv)
  --help        Show this help
    `);
        process.exit(0);
    }

    const platformIndex = args.indexOf('--platform');
    if (platformIndex === -1) {
        console.error('❌ Error: --platform required (klaviyo or shopify)');
        process.exit(1);
    }

    const platform = args[platformIndex + 1];
    let flows;

    if (platform === 'klaviyo') {
        const apiKeyIndex = args.indexOf('--api-key');
        if (apiKeyIndex === -1) {
            console.error('❌ Error: --api-key required for Klaviyo');
            process.exit(1);
        }
        const apiKey = args[apiKeyIndex + 1];
        console.log('📂 Fetching Klaviyo flows...');
        flows = await fetchKlaviyoFlows(apiKey);
    } else if (platform === 'shopify') {
        const shopIndex = args.indexOf('--shop');
        const tokenIndex = args.indexOf('--access-token');
        if (shopIndex === -1 || tokenIndex === -1) {
            console.error('❌ Error: --shop and --access-token required for Shopify');
            process.exit(1);
        }
        const shop = args[shopIndex + 1];
        const token = args[tokenIndex + 1];
        console.log('📂 Fetching Shopify flows...');
        flows = await fetchShopifyFlows(shop, token);
    } else {
        console.error('❌ Error: platform must be klaviyo or shopify');
        process.exit(1);
    }

    const startTime = Date.now();
    const result = await agenticFlowsAudit(flows, platform);
    const duration = Date.now() - startTime;

    // Generate CSV
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'flows-audit.csv';

    const csv = [
        'Priority,Flow ID,Flow Name,Issue Type,Issue,Recommendation,Est. Impact (EUR/month)',
        ...result.issues.map((issue, idx) =>
            `${idx + 1},${issue.flow_id},"${issue.flow_name}",${issue.type},"${issue.issue}","${issue.recommendation}",${issue.estimated_impact_eur}`
        )
    ].join('\n');

    fs.writeFileSync(outputFile, csv);

    console.log(`\n✅ COMPLETE`);
    console.log(`   Issues found: ${result.issues.length}`);
    console.log(`   Quality: ${result.quality ? result.quality.score + '/10' : 'N/A'}`);
    console.log(`   Refined: ${result.refined ? 'Yes' : 'No'}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Output: ${outputFile}`);

    logToMcp('AUDIT_FLOWS', { platform, issues: result.issues.length, potential_impact: (result.issues.reduce((sum, i) => sum + (i.estimated_impact_eur || 0), 0)) + ' EUR' });
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticFlowsAudit, auditFlows };
