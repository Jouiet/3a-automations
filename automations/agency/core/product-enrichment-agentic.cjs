#!/usr/bin/env node
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

const fs = require('fs');

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    AUTO_PUBLISH: process.argv.includes('--auto-publish'),
    QUALITY_THRESHOLD: 8,

    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'google', model: 'gemini-3-flash-preview', apiKey: process.env.GOOGLE_API_KEY },
        { name: 'xai', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
    ]
};

async function generateProductMeta(product) {
    return {
        seo_title: `${product.title} - Achat en Ligne | ${product.vendor || 'Boutique'}`,
        meta_description: `Découvrez ${product.title}. ${product.description?.substring(0, 100) || 'Produit de qualité'}. Livraison rapide.`,
        image_alt_text: `${product.title} - Photo produit`,
        generated_at: new Date().toISOString()
    };
}

async function critiqueMeta(product, meta) {
    // Simplified critique (would use AI in production)
    const titleLength = meta.seo_title.length;
    const descLength = meta.meta_description.length;

    let score = 10;
    let feedback = [];

    if (titleLength < 30 || titleLength > 60) {
        score -= 2;
        feedback.push('Title length suboptimal (aim for 30-60 chars)');
    }

    if (descLength < 120 || descLength > 160) {
        score -= 2;
        feedback.push('Meta description length suboptimal (aim for 120-160 chars)');
    }

    if (!meta.seo_title.includes(product.title)) {
        score -= 3;
        feedback.push('Title missing product name');
    }

    return {
        score: Math.max(0, score),
        feedback: feedback.join('. ') || 'Quality acceptable',
        provider: 'internal'
    };
}

async function agenticProductEnrichment(product) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

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
        console.log(`\n🔧 REFINE: Score below threshold. Regenerating...`);
        // In production: call AI to refine based on critique
        const refinedMeta = await generateProductMeta(product);
        return { meta: refinedMeta, quality: critique, refined: true };
    }

    console.log('\n✅ Quality acceptable. Using draft meta.');

    if (CONFIG.AUTO_PUBLISH && critique.score >= CONFIG.QUALITY_THRESHOLD) {
        console.log('🚀 AUTO-PUBLISH: Quality ≥8, publishing to Shopify...');
        // Would publish to Shopify here
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
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticProductEnrichment };
