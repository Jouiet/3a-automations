#!/usr/bin/env node
const path = require('path');
// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
/**
 * Google Maps Sourcing - Agentic (Level 3)
 * 
 * AI decides query refinement based on result quality
 * 
 * USAGE:
 *   node sourcing-google-maps-agentic.cjs --query "restaurants Paris" --location "Paris, France"
 *   node sourcing-google-maps-agentic.cjs --query "restaurants Paris" --location "Paris, France" --agentic
 * 
 * @version 1.0.0
 * @date 2026-01-08
 */

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    QUALITY_THRESHOLD: 8,
    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'google', model: 'gemini-3-flash-preview', apiKey: process.env.GEMINI_API_KEY },
        { name: 'xai', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
    ]
};

async function scrapeGoogleMaps(query, location, max = 20) {
    // Mock results (would use Apify in production)
    return Array.from({ length: Math.min(max, 15) }, (_, i) => ({
        name: `Business ${i + 1}`,
        address: `${i + 1} Rue Example, ${location}`,
        phone: `+33 1 23 45 67 ${String(i).padStart(2, '0')}`,
        rating: (3 + Math.random() * 2).toFixed(1),
        reviews: Math.floor(Math.random() * 500),
        category: query.split(' ')[0]
    }));
}

function assessQuality(results) {
    const avgRating = results.reduce((sum, r) => sum + parseFloat(r.rating), 0) / results.length;
    const avgReviews = results.reduce((sum, r) => sum + r.reviews, 0) / results.length;
    const hasPhone = results.filter(r => r.phone).length / results.length;

    let score = 0;
    if (avgRating >= 4.0) score += 3;
    else if (avgRating >= 3.5) score += 2;
    else score += 1;

    if (avgReviews >= 100) score += 3;
    else if (avgReviews >= 50) score += 2;
    else score += 1;

    if (hasPhone >= 0.8) score += 4;
    else if (hasPhone >= 0.5) score += 2;

    return {
        score: Math.min(10, score),
        avgRating,
        avgReviews,
        hasPhone: (hasPhone * 100).toFixed(0) + '%',
        feedback: score < 6 ? 'Low quality results - consider refining query' : 'Good quality results'
    };
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

async function refineQuery(originalQuery, quality) {
    console.log(`\n🔧 REFINE: Quality score ${quality.score}/10 - generating better query...`);

    const prompt = `Refine this Google Maps search query to find higher quality leads.
Original Query: "${originalQuery}"
Current Quality Feedback: "${quality.feedback}"
Avg Rating: ${quality.avgRating}
Avg Reviews: ${quality.avgReviews}

Task: Suggest ONE refined search query that will likely yield businesses with better ratings and more reviews.
Output JSON: { "refined_query": "..." }`;

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            const result = await callAI(provider, prompt, 'You are a lead generation strategist.');
            return result.refined_query;
        } catch (e) {
            continue;
        }
    }
    return `${originalQuery} highly rated`; // Fallback
}

async function agenticGoogleMapsSourcing(query, location, max) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

    console.log('📝 DRAFT: Scraping Google Maps...');
    const draftResults = await scrapeGoogleMaps(query, location, max);
    console.log(`✅ Found ${draftResults.length} businesses`);

    if (!CONFIG.AGENTIC_MODE) {
        console.log('⚠️  Agentic mode disabled. Returning draft results.');
        return { results: draftResults, quality: null, refined: false };
    }

    console.log('\n🔍 CRITIQUE: Assessing result quality...');
    const quality = assessQuality(draftResults);

    console.log(`\n📊 Quality Score: ${quality.score}/10`);
    console.log(`📝 Feedback: ${quality.feedback}`);
    console.log(`   Avg Rating: ${quality.avgRating.toFixed(1)}/5`);
    console.log(`   Avg Reviews: ${Math.round(quality.avgReviews)}`);
    console.log(`   Has Phone: ${quality.hasPhone}`);

    if (quality.score < CONFIG.QUALITY_THRESHOLD) {
        const refinedQuery = await refineQuery(query, quality);
        console.log(`\n🔧 REFINE: New query: "${refinedQuery}"`);
        const refinedResults = await scrapeGoogleMaps(refinedQuery, location, max);
        return { results: refinedResults, quality, refined: true, refinedQuery };
    }

    console.log('\n✅ Quality acceptable. Using draft results.');
    return { results: draftResults, quality, refined: false };
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
Google Maps Sourcing - Agentic (Level 3)

USAGE:
  node sourcing-google-maps-agentic.cjs --query <query> --location <location> [--agentic] [--max <number>]

OPTIONS:
  --query <query>      Search query (required)
  --location <loc>     Location (required)
  --max <number>       Max results (default: 20)
  --agentic            Enable agentic mode
  --help               Show this help
    `);
        process.exit(0);
    }

    const queryIndex = args.indexOf('--query');
    const locationIndex = args.indexOf('--location');
    const maxIndex = args.indexOf('--max');

    if (queryIndex === -1 || locationIndex === -1) {
        console.error('❌ Error: --query and --location required');
        process.exit(1);
    }

    const query = args[queryIndex + 1];
    const location = args[locationIndex + 1];
    const max = maxIndex !== -1 ? parseInt(args[maxIndex + 1]) : 20;

    const startTime = Date.now();
    const result = await agenticGoogleMapsSourcing(query, location, max);
    const duration = Date.now() - startTime;

    console.log(`\n✅ COMPLETE`);
    console.log(`   Results: ${result.results.length}`);
    console.log(`   Quality: ${result.quality ? result.quality.score + '/10' : 'N/A'}`);
    console.log(`   Refined: ${result.refined ? 'Yes' : 'No'}`);
    console.log(`   Duration: ${duration}ms`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticGoogleMapsSourcing };
