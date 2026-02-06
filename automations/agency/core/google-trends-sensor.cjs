#!/usr/bin/env node
/**
 * Market Trends Sensor (AI-Powered)
 *
 * Role: Non-agentic data fetcher. Analyzes market trends using AI.
 * Method: Uses Grok/OpenAI/Gemini to assess market demand for target keywords.
 * Fallback: Multi-AI resilient (Grok → OpenAI → Gemini → Anthropic)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

// Configuration
const KEYWORDS = ['marketing automation', 'ai automation agency', 'shopify automation', 'e-commerce automation'];
const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

// AI Providers with fallback chain
const PROVIDERS = {
    grok: {
        name: 'Grok',
        url: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-4-1-fast-reasoning',
        apiKey: process.env.XAI_API_KEY,
        enabled: !!process.env.XAI_API_KEY
    },
    openai: {
        name: 'OpenAI',
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-5.2',
        apiKey: process.env.OPENAI_API_KEY,
        enabled: !!process.env.OPENAI_API_KEY
    },
    gemini: {
        name: 'Gemini',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`,
        apiKey: process.env.GEMINI_API_KEY,
        enabled: !!process.env.GEMINI_API_KEY
    },
    anthropic: {
        name: 'Anthropic',
        url: 'https://api.anthropic.com/v1/messages',
        model: 'claude-opus-4-6',
        apiKey: process.env.ANTHROPIC_API_KEY,
        enabled: !!process.env.ANTHROPIC_API_KEY
    }
};

function httpRequest(url, options) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'POST',
            headers: options.headers || {}
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function analyzeWithGrok(keywords) {
    const prompt = `Analyze market trends for these keywords: ${keywords.join(', ')}

Based on your knowledge of current market conditions (January 2026), provide:
1. Overall market demand score (0-100 where 100 = very high demand)
2. Trend direction (rising, stable, declining)
3. Brief assessment (1-2 sentences)

Respond in JSON format only:
{"demand_score": <number>, "trend": "<rising|stable|declining>", "assessment": "<string>"}`;

    const response = await httpRequest(PROVIDERS.grok.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PROVIDERS.grok.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: PROVIDERS.grok.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200
        })
    });

    if (response.status !== 200) throw new Error(`Grok API Error: ${response.status}`);
    const content = response.data.choices?.[0]?.message?.content || '';
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
}

async function analyzeWithOpenAI(keywords) {
    const prompt = `Analyze market trends for: ${keywords.join(', ')}. Return JSON only: {"demand_score": <0-100>, "trend": "<rising|stable|declining>", "assessment": "<brief>"}`;

    const response = await httpRequest(PROVIDERS.openai.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PROVIDERS.openai.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: PROVIDERS.openai.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200
        })
    });

    if (response.status !== 200) throw new Error(`OpenAI API Error: ${response.status}`);
    const content = response.data.choices?.[0]?.message?.content || '';
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
}

async function analyzeWithGemini(keywords) {
    const prompt = `Analyze market trends for: ${keywords.join(', ')}. Return JSON only: {"demand_score": <0-100>, "trend": "<rising|stable|declining>", "assessment": "<brief>"}`;

    const url = `${PROVIDERS.gemini.url}?key=${PROVIDERS.gemini.apiKey}`;
    const response = await httpRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 200 }
        })
    });

    if (response.status !== 200) throw new Error(`Gemini API Error: ${response.status}`);
    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
}

async function analyzeWithAnthropic(keywords) {
    const prompt = `Analyze market trends for: ${keywords.join(', ')}. Return JSON only: {"demand_score": <0-100>, "trend": "<rising|stable|declining>", "assessment": "<brief>"}`;

    const response = await httpRequest(PROVIDERS.anthropic.url, {
        method: 'POST',
        headers: {
            'x-api-key': PROVIDERS.anthropic.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: PROVIDERS.anthropic.model,
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (response.status !== 200) throw new Error(`Anthropic API Error: ${response.status}`);
    const content = response.data.content?.[0]?.text || '';
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
}

async function getTrendsPressure() {
    console.log('🚀 AI Market Trends Sensor - Analyzing keywords...');
    console.log(`   Keywords: ${KEYWORDS.join(', ')}`);

    const analyzers = [
        { name: 'Grok', fn: analyzeWithGrok, enabled: PROVIDERS.grok.enabled },
        { name: 'OpenAI', fn: analyzeWithOpenAI, enabled: PROVIDERS.openai.enabled },
        { name: 'Gemini', fn: analyzeWithGemini, enabled: PROVIDERS.gemini.enabled },
        { name: 'Anthropic', fn: analyzeWithAnthropic, enabled: PROVIDERS.anthropic.enabled }
    ];

    for (const analyzer of analyzers) {
        if (!analyzer.enabled) continue;

        try {
            console.log(`   Trying ${analyzer.name}...`);
            const result = await analyzer.fn(KEYWORDS);

            // Convert demand to pressure (inverse: high demand = low pressure)
            const pressure = Math.max(0, Math.min(100, 100 - result.demand_score));

            return {
                pressure: Math.round(pressure),
                demand_score: result.demand_score,
                trend: result.trend,
                assessment: result.assessment,
                provider: analyzer.name,
                timestamp: new Date().toISOString()
            };
        } catch (e) {
            console.log(`   ${analyzer.name} failed: ${e.message}`);
        }
    }

    throw new Error('All AI providers failed');
}

function updateGPM(trendsData) {
    if (!trendsData) return;

    try {
        if (!fs.existsSync(GPM_PATH)) {
            console.log('GPM file not found, skipping update');
            return;
        }

        const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

        gpm.sectors = gpm.sectors || {};
        gpm.sectors.marketing = gpm.sectors.marketing || {};
        gpm.sectors.marketing.market_demand = {
            label: 'Market Demand',
            pressure: trendsData.pressure,
            trend: trendsData.trend === 'rising' ? 'DOWN' : trendsData.trend === 'declining' ? 'UP' : 'STABLE',
            last_check: trendsData.timestamp,
            sensor_data: {
                method: `AI Analysis (${trendsData.provider})`,
                keywords: KEYWORDS,
                demand_score: trendsData.demand_score,
                market_trend: trendsData.trend,
                assessment: trendsData.assessment
            }
        };

        gpm.last_updated = new Date().toISOString();
        fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
        console.log(`📡 GPM Updated: Market Demand Pressure is ${trendsData.pressure}`);
        console.log(`   Demand Score: ${trendsData.demand_score}/100, Trend: ${trendsData.trend}`);
        console.log(`   Assessment: ${trendsData.assessment}`);
    } catch (error) {
        console.error('❌ Failed to update GPM:', error.message);
    }
}

async function main() {
    // Handle --health check - REAL API TEST (added Session 168quaterdecies)
    if (process.argv.includes('--health')) {
        const enabledProviders = Object.entries(PROVIDERS)
            .filter(([_, p]) => p.enabled)
            .map(([key, p]) => ({ key, name: p.name }));

        const health = {
            status: 'checking',
            sensor: 'google-trends-sensor',
            version: '1.1.0',
            ai_providers: {
                enabled: enabledProviders.map(p => p.name),
                total_available: Object.keys(PROVIDERS).length,
                grok: PROVIDERS.grok.enabled,
                openai: PROVIDERS.openai.enabled,
                gemini: PROVIDERS.gemini.enabled,
                anthropic: PROVIDERS.anthropic.enabled
            },
            keywords: KEYWORDS,
            gpm_path: GPM_PATH,
            gpm_exists: fs.existsSync(GPM_PATH),
            timestamp: new Date().toISOString()
        };

        if (enabledProviders.length === 0) {
            health.status = 'error';
            health.error = 'No AI providers configured (need XAI_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY)';
        } else {
            try {
                const data = await getTrendsPressure();
                health.status = 'ok';
                health.api_test = 'passed';
                health.provider_used = data.provider;
                health.demand_score = data.demand_score;
            } catch (e) {
                health.status = 'error';
                health.api_test = 'failed';
                health.error = e.message.split('\n')[0];
            }
        }

        console.log(JSON.stringify(health, null, 2));
        process.exit(health.status === 'ok' ? 0 : 1);
        return;
    }

    try {
        const data = await getTrendsPressure();
        updateGPM(data);
    } catch (e) {
        console.error(`❌ Market Trends Sensor Failure: ${e.message}`);
        // Update GPM with fallback pressure
        updateGPM({
            pressure: 50,
            demand_score: 50,
            trend: 'stable',
            assessment: 'Unable to analyze - using neutral baseline',
            provider: 'fallback',
            timestamp: new Date().toISOString()
        });
    }
}

if (require.main === module) {
    main();
}

module.exports = { getTrendsPressure };
