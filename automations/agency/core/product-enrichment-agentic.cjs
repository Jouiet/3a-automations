#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { logTelemetry } = require('../utils/telemetry.cjs');
const MarketingScience = require('./marketing-science-core.cjs');

/**
 * Product Enrichment - Agentic (Level 3)
 * 
 * SEO-optimized product meta generation with AI quality scoring
 * 
 * ARCHITECTURE:
 * - Draft: Generate SEO meta (title, description, alt text)
 * - Critique: Score keyword density, readability, uniqueness (0-10)
 * - Refine: Rewrite if score <8
 * 
 * USAGE:
 *   node product-enrichment-agentic.cjs --product product.json
 *   node product-enrichment-agentic.cjs --product product.json --agentic --auto-publish
 *   node product-enrichment-agentic.cjs --help
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


const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    AUTO_PUBLISH: process.argv.includes('--auto-publish'),
    FORCE_MODE: process.argv.includes('--force'), // Bypass GPM pressure
    QUALITY_THRESHOLD: 8,
    GPM_PATH: path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json'),

    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-opus-4-5-20251101', apiKey: process.env.ANTHROPIC_API_KEY },
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
        agent: 'ProductEnrichment-L4',
        action,
        details,
        status: 'SUCCESS'
    });

    // Keep last 50 logs
    if (logs.length > 50) logs = logs.slice(0, 50);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

/**
 * AI PROVIDER ORCHESTRATOR
 */
async function callAI(prompt, systemPrompt = 'You are an SEO expert.') {
    for (const provider of CONFIG.AI_PROVIDERS) {
        if (!provider.apiKey) continue;
        try {
            console.log(`  [AI] Trying ${provider.name}...`);
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
            console.warn(`  ⚠️ ${provider.name} failed: ${e.message}`);
        }
    }
    throw new Error('All AI providers failed');
}

async function generateProductMeta(product) {
    const basePrompt = `Generate SEO meta-data for this product:
${JSON.stringify(product, null, 2)}

Requirements:
- Optimized for Moroccan/INTL markets
- Languages: FR (default) or EN
- Output JSON: { "seo_title": "...", "meta_description": "...", "image_alt_text": "..." }`;

    const prompt = MarketingScience.inject('PAS', basePrompt);

    return await callAI(prompt, 'You are a senior E-commerce SEO specialist.');
}

async function publishToShopify(productId, meta) {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shop || !token) {
        throw new Error('Real Shopify Credentials Required (SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN)');
    }

    const url = `https://${shop}/admin/api/2024-01/products/${productId}.json`;
    console.log(`📡 Publishing enrichment for Product ${productId} to ${shop}...`);

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product: {
                id: productId,
                title: meta.seo_title,
                body_html: meta.meta_description // Or update meta-fields if used
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Shopify API Error: ${response.status} ${response.statusText}`);
    }

    logToMcp('SHOPIFY_PUBLISH', { product_id: productId, status: 'SUCCESS' });
    return true;
}

async function critiqueMeta(product, meta) {
    const prompt = `Critique these SEO meta-tags for the product: ${product.title}
META: ${JSON.stringify(meta, null, 2)}

Criteria:
- Title length (30-60 chars)
- Description length (120-160 chars)
- Keyword density & Persuasiveness

Output JSON: { "score": 0-10, "feedback": "...", "provider": "AI" }`;

    return await callAI(prompt, 'You are a strict SEO Content Auditor.');
}

async function agenticProductEnrichment(product) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        const pressure = (gpm.sectors.seo && gpm.sectors.seo.product_enrichment) ? gpm.sectors.seo.product_enrichment.pressure : 0;
        const threshold = gpm.thresholds.high || 70;

        if (pressure < threshold) {
            console.log(`[Equilibrium] Product Pressure (${pressure}) below threshold (${threshold}). No AI reasoning required.`);
            return { meta: {}, quality: null, refined: false, status: "EQUILIBRIUM" };
        }
        console.log(`[Sluice Gate Open] High Product Pressure detected (${pressure}). Activating AI Enrichment...`);
    }

    console.log('📝 DRAFT: Generating SEO meta...');
    const draftMeta = await generateProductMeta(product);
    console.log(`✅ Generated meta for: ${product.title}`);

    if (!CONFIG.AGENTIC_MODE) {
        console.log('⚠️  Agentic mode disabled. Returning draft meta.');
        return { meta: draftMeta, quality: null, refined: false };
    }

    console.log('\n🔍 CRITIQUE: Scoring SEO quality...');
    const critique = await critiqueMeta(product, draftMeta);

    console.log(`\n📊 Quality Score: ${critique.score}/10`);
    console.log(`📝 Feedback: ${critique.feedback}`);

    if (critique.score < CONFIG.QUALITY_THRESHOLD) {
        console.log(`\n🔧 REFINE: Score below threshold. Regenerating with feedback...`);
        const refinedPrompt = `Improve these search meta-tags based on this feedback: "${critique.feedback}"
Original Meta: ${JSON.stringify(draftMeta)}
Product: ${product.title}

Output JSON: { "seo_title": "...", "meta_description": "...", "image_alt_text": "..." }`;

        const refinedMeta = await callAI(refinedPrompt, 'You are an SEO Revision Specialist.');
        return { meta: refinedMeta, quality: critique, refined: true };
    }

    console.log('\n✅ Quality acceptable. Using draft meta.');

    if (CONFIG.AUTO_PUBLISH && critique.score >= CONFIG.QUALITY_THRESHOLD) {
        console.log('🚀 AUTO-PUBLISH: Quality ≥8, publishing to Shopify...');
        await publishToShopify(product.id, result.meta);
    }

    return { meta: draftMeta, quality: critique, refined: false };
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
Product Enrichment - Agentic (Level 3)

USAGE:
  node product-enrichment-agentic.cjs --product <file.json> [--agentic] [--auto-publish]

OPTIONS:
  --product <file>   Input JSON file with product data (required)
  --agentic          Enable agentic mode (Draft→Critique→Refine)
  --auto-publish     Auto-publish if quality ≥8/10
  --output <file>    Output file (default: enriched-product.json)
  --help             Show this help
    `);
        process.exit(0);
    }

    const productIndex = args.indexOf('--product');
    if (productIndex === -1) {
        console.error('❌ Error: --product required');
        process.exit(1);
    }

    const productFile = args[productIndex + 1];
    const outputIndex = args.indexOf('--output');
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : 'enriched-product.json';

    console.log(`📂 Loading product from ${productFile}...`);
    const product = JSON.parse(fs.readFileSync(productFile, 'utf8'));

    const startTime = Date.now();
    const result = await agenticProductEnrichment(product);
    const duration = Date.now() - startTime;

    const output = { ...product, ...result.meta, enrichment_result: result };
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

    console.log(`\n✅ COMPLETE`);
    console.log(`   Product: ${product.title}`);
    console.log(`   Quality: ${result.quality ? result.quality.score + '/10' : 'N/A'}`);
    console.log(`   Refined: ${result.refined ? 'Yes' : 'No'}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Output: ${outputFile}`);

    logToMcp('ENRICH_PRODUCT', { product: product.title, quality: result.quality ? result.quality.score : 'N/A' });
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticProductEnrichment };
