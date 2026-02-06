const fs = require('fs');
const path = require('path');
const { logTelemetry } = require('../utils/telemetry.cjs');
const MarketingScience = require('./marketing-science-core.cjs');
// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });


const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    FORCE_MODE: process.argv.includes('--force'), // Bypass GPM pressure
    QUALITY_THRESHOLD: 8,
    GPM_PATH: path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json'),

    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-opus-4-6', apiKey: process.env.ANTHROPIC_API_KEY },
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
        agent: 'StoreAuditor-L4',
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

async function auditStore(shop) {
    const issues = [];
    const url = shop.startsWith('http') ? shop : `https://${shop}`;

    console.log(`📡 Connecting to ${url}...`);
    const start = Date.now();
    let html = '';
    let response;

    try {
        response = await fetch(url);
        html = await response.text();
    } catch (e) {
        console.error(`❌ Connection failed: ${e.message}`);
        // Return a critical connection issue effectively
        return [{
            category: 'connection',
            severity: 'critical',
            issue: 'Store unreachable',
            recommendation: 'Check domain DNS and Shopify status',
            estimated_cvr_lift: 1.0
        }];
    }
    const ttfb = Date.now() - start;

    // 1. PERFORMANCE (TTFB)
    if (ttfb > 1200) {
        issues.push({
            category: 'speed',
            severity: 'high',
            issue: `Slow Server Response (TTFB: ${ttfb}ms)`,
            recommendation: 'Optimize Liquid code or remove heavy apps',
            estimated_cvr_lift: 0.15
        });
    }

    // 2. TRUST BADGES
    const trustKeywords = /ssl|secure|payment|visa|mastercard|paypal|stripe|guarantee/i;
    if (!trustKeywords.test(html)) {
        issues.push({
            category: 'checkout',
            severity: 'critical',
            issue: 'Missing trust badges/icons',
            recommendation: 'Add payment icons and SSL seal to footer/cart',
            estimated_cvr_lift: 0.08
        });
    }

    // 3. REVIEWS
    const reviewApps = /judge\.me|loox|yotpo|stamped\.io|trustpilot|reviews-widget/i;
    if (!reviewApps.test(html)) {
        issues.push({
            category: 'product_pages',
            severity: 'high',
            issue: 'No visual review widget detected',
            recommendation: 'Install Judge.me or Loox for social proof',
            estimated_cvr_lift: 0.12
        });
    }

    // 4. SEO (Meta Description)
    const metaDescRegex = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i;
    const match = html.match(metaDescRegex);
    if (!match || match[1].length < 50) {
        issues.push({
            category: 'seo',
            severity: 'medium',
            issue: 'Meta description missing or too short',
            recommendation: 'Add compelling meta description for CTR',
            estimated_cvr_lift: 0.03
        });
    }

    // Sort by impact
    return issues.sort((a, b) => b.estimated_cvr_lift - a.estimated_cvr_lift);
}

async function critiqueAudit(issues) {
    const basePrompt = `Critique these Shopify store issues and their estimated CVR (Conversion Rate) lifts:
${JSON.stringify(issues, null, 2)}

Task:
1. Validate if lift estimates (e.g., 8% for trust badges) are realistic based on e-commerce benchmarks.
2. Provide a quality score (0-10).
3. Suggest adjusted estimates if the current ones are over/under-estimated.

Output JSON: { "score": <0-10>, "feedback": "...", "adjusted_estimates": [{ "issue": "...", "new_lift": <number> }] }`;

    const prompt = MarketingScience.inject('UVP', basePrompt);

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            console.log(`  Trying ${provider.name}...`);
            const critique = await callAI(provider, prompt, 'You are a Conversion Rate Optimization (CRO) analyst.');
            critique.provider = provider.name;
            return critique;
        } catch (e) {
            continue;
        }
    }
    throw new Error('All AI providers failed');
}

async function agenticStoreAudit(shop) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        // Store Audit falls under System Integrity in this system
        const pressure = (gpm.sectors.system && gpm.sectors.system.audit) ? gpm.sectors.system.audit.pressure : 0;
        const threshold = gpm.thresholds.high || 70;

        if (pressure < threshold) {
            console.log(`[Equilibrium] Store Pressure (${pressure}) below threshold (${threshold}). No AI reasoning required.`);
            return { issues: [], quality: null, refined: false, status: "EQUILIBRIUM" };
        }
        console.log(`[Sluice Gate Open] High Store Pressure detected (${pressure}). Activating AI Audit...`);
    }

    console.log('📝 DRAFT: Auditing store...');
    const draftIssues = await auditStore(shop);
    console.log(`✅ Found ${draftIssues.length} issues`);

    if (!CONFIG.AGENTIC_MODE) {
        console.log('⚠️  Agentic mode disabled. Returning draft audit.');
        return { issues: draftIssues, quality: null, refined: false };
    }

    console.log('\n🔍 CRITIQUE: Validating impact predictions...');
    const critique = await critiqueAudit(draftIssues);

    console.log(`\n📊 Quality Score: ${critique.score}/10`);
    console.log(`📝 Feedback: ${critique.feedback}`);

    if (critique.score < CONFIG.QUALITY_THRESHOLD) {
        console.log(`\n🔧 REFINE: Adjusting impact estimates based on AI feedback...`);
        const refinedIssues = draftIssues.map(issue => {
            const adjustment = critique.adjusted_estimates?.find(a => a.issue === issue.issue);
            return {
                ...issue,
                estimated_cvr_lift: adjustment ? adjustment.new_lift : issue.estimated_cvr_lift
            };
        }).sort((a, b) => b.estimated_cvr_lift - a.estimated_cvr_lift);

        return { issues: refinedIssues, quality: critique, refined: true };
    }

    console.log('\n✅ Quality acceptable. Using draft audit.');
    return { issues: draftIssues, quality: critique, refined: false };
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
Store Audit - Agentic (Level 3)

USAGE:
  node store-audit-agentic.cjs --shop <shop.myshopify.com> --token <token> [--agentic]

OPTIONS:
  --shop <shop>      Shopify shop domain (required)
  --token <token>    Shopify access token (required)
  --agentic          Enable agentic mode (Draft→Critique→Refine)
  --output <file>    Output PDF file (default: store-audit.pdf)
  --help             Show this help
    `);
        process.exit(0);
    }

    const shopIndex = args.indexOf('--shop');
    if (shopIndex === -1) {
        console.error('❌ Error: --shop required');
        process.exit(1);
    }

    const shop = args[shopIndex + 1];
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'store-audit.json';

    const startTime = Date.now();
    const result = await agenticStoreAudit(shop);
    const duration = Date.now() - startTime;

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    console.log(`\n✅ COMPLETE`);
    console.log(`   Issues found: ${result.issues.length}`);
    console.log(`   Quality: ${result.quality ? result.quality.score + '/10' : 'N/A'}`);
    console.log(`   Refined: ${result.refined ? 'Yes' : 'No'}`);
    console.log(`   Total CVR lift potential: ${(result.issues.reduce((sum, i) => sum + i.estimated_cvr_lift, 0) * 100).toFixed(1)}%`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Output: ${outputFile}`);

    logToMcp('AUDIT_STORE', { shop, issues: result.issues.length, total_lift: (result.issues.reduce((sum, i) => sum + i.estimated_cvr_lift, 0) * 100).toFixed(1) + '%' });
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticStoreAudit };
