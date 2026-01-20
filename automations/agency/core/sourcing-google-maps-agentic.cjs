#!/usr/bin/env node
const path = require('path');
const { logTelemetry } = require('../utils/telemetry.cjs');
const fs = require('fs');
const { ApifyClient } = require('apify-client');

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
    FORCE_MODE: process.argv.includes('--force'), // Bypass GPM pressure
    QUALITY_THRESHOLD: 8,
    GPM_PATH: path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json'),
    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
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
        agent: 'GMapsSourcing-L4',
        action,
        details,
        status: 'SUCCESS'
    });

    // Keep last 50 logs
    if (logs.length > 50) logs = logs.slice(0, 50);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

async function scrapeGoogleMaps(query, location, max = 20) {
    if (!process.env.APIFY_API_KEY) {
        console.warn('⚠️  APIFY_API_KEY missing. Cannot source real data.');
        throw new Error('APIFY_API_KEY required for Level 4 Real Sourcing');
    }

    const client = new ApifyClient({
        token: process.env.APIFY_API_KEY,
    });

    // Actor: compass/crawler-google-places
    console.log(`📡 Connecting to Apify (Actor: compass/crawler-google-places)...`);

    // Construct search string: "marketing agencies in Paris"
    const searchString = `${query} ${location}`;

    const input = {
        searchStringsArray: [searchString],
        maxCrawledPlacesPerSearch: max,
        language: "fr", // Default to FR per requirements
    };

    try {
        const run = await client.actor("compass/crawler-google-places").call(input);
        console.log(`   Actor run finished. Fetching dataset ${run.defaultDatasetId}...`);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return items.map(item => ({
            name: item.title,
            rating: item.totalScore,
            reviews: item.reviewsCount,
            address: item.address,
            phone: item.phone,
            website: item.website,
            category: item.categoryName,
            status: item.isClosed ? 'Closed' : 'Open'
        }));
    } catch (error) {
        console.error('❌ Apify Sourcing Failed:', error.message);
        throw error;
    }
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

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        const pressure = gpm.sectors.sales.lead_velocity.pressure;
        const threshold = gpm.thresholds.high;

        if (pressure < threshold) {
            console.log(`[Equilibrium] Sales Pressure (${pressure}) below threshold (${threshold}). No AI sourcing required.`);
            return { results: [], quality: { score: 10, feedback: "System in Equilibrium" }, refined: false, status: "EQUILIBRIUM" };
        }
        console.log(`[Sluice Gate Open] High Sales Pressure detected (${pressure}). Activating AI Lead Sourcing...`);
    }

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

    // Log to Telemetry & MCP Dashboard
    logTelemetry('GMapsSourcing-L4', 'Source Gmaps', { query, results: result.results.length }, 'SUCCESS');
    logToMcp('SOURCE_GMAPS', { query, found: result.results.length, quality: result.quality ? result.quality.score : 'N/A' });

    console.log(`   Duration: ${duration}ms`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticGoogleMapsSourcing };
