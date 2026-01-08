#!/usr/bin/env node
const path = require('path');
// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
/**
 * LinkedIn Sourcing - Agentic (Level 3)
 * 
 * AI filters profiles based on hiring signals
 * 
 * USAGE:
 *   node sourcing-linkedin-agentic.cjs --search "marketing manager" --max 50
 *   node sourcing-linkedin-agentic.cjs --search "marketing manager" --max 50 --agentic
 * 
 * @version 1.0.0
 * @date 2026-01-08
 */

const CONFIG = {
    AGENTIC_MODE: process.argv.includes('--agentic'),
    QUALITY_THRESHOLD: 7,
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

async function scrapeLinkedIn(search, max = 50) {
    // Mock profiles
    return Array.from({ length: Math.min(max, 30) }, (_, i) => ({
        name: `Profile ${i + 1}`,
        title: search,
        company: `Company ${i + 1}`,
        location: ['Paris', 'London', 'Berlin'][i % 3],
        recentPost: i % 3 === 0 ? 'Hiring for new role!' : null,
        profileUpdated: i % 5 === 0,
        connections: 500 + Math.floor(Math.random() * 1000)
    }));
}

function detectHiringSignals(profiles) {
    const scored = profiles.map(p => {
        let score = 0;
        let signals = [];

        if (p.recentPost && p.recentPost.toLowerCase().includes('hiring')) {
            score += 5;
            signals.push('Recent hiring post');
        }

        if (p.profileUpdated) {
            score += 3;
            signals.push('Profile recently updated');
        }

        if (p.connections > 1000) {
            score += 2;
            signals.push('High connection count');
        }

        return { ...p, hiringScore: score, signals };
    });

    return scored.sort((a, b) => b.hiringScore - a.hiringScore);
}

function assessQuality(profiles) {
    const withSignals = profiles.filter(p => p.hiringScore > 0).length;
    const avgScore = profiles.reduce((sum, p) => sum + p.hiringScore, 0) / profiles.length;

    let quality = 0;
    if (withSignals / profiles.length >= 0.3) quality += 5;
    else if (withSignals / profiles.length >= 0.15) quality += 3;
    else quality += 1;

    if (avgScore >= 5) quality += 5;
    else if (avgScore >= 3) quality += 3;
    else quality += 1;

    return {
        score: Math.min(10, quality),
        withSignals,
        avgScore: avgScore.toFixed(1),
        feedback: quality < 7 ? 'Low hiring signal density' : 'Good hiring signals detected'
    };
}

async function agenticLinkedInSourcing(search, max) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

    console.log('📝 DRAFT: Scraping LinkedIn profiles...');
    const draftProfiles = await scrapeLinkedIn(search, max);
    console.log(`✅ Found ${draftProfiles.length} profiles`);

    console.log('\n🔍 CRITIQUE: Detecting hiring signals using AI...');

    const prompt = `Filter these LinkedIn profiles to find the best sales leads based on "hiring signals" (e.g., "Hiring", new role, company growth).
Profiles: ${JSON.stringify(scoredProfiles, null, 2)}

Task:
1. Re-evaluate hiring scores (0-10).
2. Filter for high-signal profiles only.
3. Provide a quality assessment of the lead batch.

Output JSON: { "quality_score": <number>, "filtered_profiles": [...], "feedback": "..." }`;

    let aiResult = null;
    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            aiResult = await callAI(provider, prompt, 'You are a Senior Headhunter.');
            break;
        } catch (e) {
            continue;
        }
    }

    if (aiResult) {
        console.log(`\n📊 Quality Score: ${aiResult.quality_score}/10`);
        console.log(`📝 Feedback: ${aiResult.feedback}`);
        return { profiles: aiResult.filtered_profiles, quality: { score: aiResult.quality_score, feedback: aiResult.feedback }, filtered: true };
    }

    // Fallback if AI fails
    const quality = assessQuality(scoredProfiles);
    console.log(`\n📊 Quality Score: ${quality.score}/10 (Fallback)`);
    if (quality.score < CONFIG.QUALITY_THRESHOLD) {
        return { profiles: scoredProfiles.filter(p => p.hiringScore >= 5), quality, filtered: true };
    }
    return { profiles: scoredProfiles.slice(0, Math.ceil(scoredProfiles.length / 2)), quality, filtered: true };
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
LinkedIn Sourcing - Agentic (Level 3)

USAGE:
  node sourcing-linkedin-agentic.cjs --search <query> [--max <number>] [--agentic]

OPTIONS:
  --search <query>     Search query (required)
  --max <number>       Max profiles (default: 50)
  --agentic            Enable agentic mode
  --help               Show this help
    `);
        process.exit(0);
    }

    const searchIndex = args.indexOf('--search');
    const maxIndex = args.indexOf('--max');

    if (searchIndex === -1) {
        console.error('❌ Error: --search required');
        process.exit(1);
    }

    const search = args[searchIndex + 1];
    const max = maxIndex !== -1 ? parseInt(args[maxIndex + 1]) : 50;

    const startTime = Date.now();
    const result = await agenticLinkedInSourcing(search, max);
    const duration = Date.now() - startTime;

    console.log(`\n✅ COMPLETE`);
    console.log(`   Profiles: ${result.profiles.length}`);
    console.log(`   Quality: ${result.quality ? result.quality.score + '/10' : 'N/A'}`);
    console.log(`   Filtered: ${result.filtered ? 'Yes' : 'No'}`);
    console.log(`   Duration: ${duration}ms`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    });
}

module.exports = { agenticLinkedInSourcing };
