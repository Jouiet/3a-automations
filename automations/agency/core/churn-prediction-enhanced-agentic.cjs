#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { logTelemetry } = require('../utils/telemetry.cjs');

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
 * Churn Prediction - Enhanced Agentic (Level 3)
 * 
 * AI risk scoring with personalized retention strategies
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
        agent: 'ChurnPredictor-L4',
        action,
        details,
        status: 'SUCCESS'
    });

    // Keep last 50 logs
    if (logs.length > 50) logs = logs.slice(0, 50);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

async function fetchShopifyOrders(shop, token) {
    if (!shop || !token) {
        throw new Error('Shopify Shop and Access Token required for Real Churn Prediction');
    }
    const url = `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250&fields=email,created_at,total_price,customer`;
    console.log(`📡 Fetching Real Orders from ${shop}...`);

    const response = await fetch(url, {
        headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Shopify API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders;
}

function calculateRealRFM(orders) {
    const customerMap = {};
    const now = new Date();

    orders.forEach(order => {
        if (!order.email) return;

        if (!customerMap[order.email]) {
            customerMap[order.email] = {
                id: order.customer ? order.customer.id : order.email,
                email: order.email,
                name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Unknown',
                orders: [],
                totalSpent: 0
            };
        }

        const orderDate = new Date(order.created_at);
        customerMap[order.email].orders.push(orderDate);
        customerMap[order.email].totalSpent += parseFloat(order.total_price);
    });

    return Object.values(customerMap).map(c => {
        // Sort orders desc
        c.orders.sort((a, b) => b - a);
        const lastOrder = c.orders[0];
        const daysSinceLast = Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24));

        return {
            id: c.id,
            email: c.email,
            name: c.name,
            recency: daysSinceLast,
            frequency: c.orders.length,
            monetary: c.totalSpent,
            // Simple RFM Score (1-5 scale per dimension)
            rfmScore: calculateScore(daysSinceLast, c.orders.length, c.totalSpent)
        };
    });
}

function calculateScore(r, f, m) {
    let score = 0;
    // Recency (Lower is better)
    if (r < 30) score += 5;
    else if (r < 60) score += 4;
    else if (r < 90) score += 3;
    else score += 1;

    // Frequency (Higher is better)
    if (f > 10) score += 5;
    else if (f > 5) score += 3;
    else score += 1;

    // Monetary (assuming EUR)
    if (m > 1000) score += 5;
    else if (m > 500) score += 3;
    else score += 1;

    return Math.floor(score / 3); // Average 1-5
}

function assessChurnRisk(customers) {
    return customers.map(c => {
        let risk = 'low';
        let score = 0;

        if (c.recency > 90) score += 4;
        else if (c.recency > 60) score += 2;

        if (c.frequency < 5) score += 3;
        else if (c.frequency < 10) score += 1;

        if (c.monetary < 500) score += 3;

        if (score >= 7) risk = 'high';
        else if (score >= 4) risk = 'medium';

        return { ...c, churnRisk: risk, churnScore: score };
    });
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

async function generateRetentionStrategy(customer) {
    const prompt = `Generate a personalized retention strategy for this high-risk customer:
${JSON.stringify(customer, null, 2)}

Task:
1. Craft a high-conversion offer or message to prevent churn.
2. Select the best communication channel (email, SMS, phone).

Output JSON: { "customer": "${customer.email}", "risk": "${customer.churnRisk}", "score": ${customer.churnScore}, "strategy": "...", "channel": "..." }`;

    for (const provider of CONFIG.AI_PROVIDERS) {
        try {
            return await callAI(provider, prompt, 'You are a Customer Retention Specialist.');
        } catch (e) {
            continue;
        }
    }

    // Fallback if AI fails
    return {
        customer: customer.email,
        risk: customer.churnRisk,
        score: customer.churnScore,
        strategy: 'Urgent: Loyalty discount offer 20%',
        channel: 'email'
    };
}

async function agenticChurnPrediction(customers) {
    console.log('\n🤖 AGENTIC MODE: Draft → Critique → Refine\n');

    // SITUATIONAL PRESSURE CHECK (Hybrid Decoupling Year 1)
    if (!CONFIG.FORCE_MODE && fs.existsSync(CONFIG.GPM_PATH)) {
        const gpm = JSON.parse(fs.readFileSync(CONFIG.GPM_PATH, 'utf8'));
        // Fallback to low pressure if sector doesn't exist yet
        const pressure = (gpm.sectors.marketing && gpm.sectors.marketing.retention) ? gpm.sectors.marketing.retention.pressure : 0;
        const threshold = gpm.thresholds.high || 70;

        if (pressure < threshold) {
            console.log(`[Equilibrium] Retention Pressure (${pressure}) below threshold (${threshold}). No AI reasoning required.`);
            return { customers: [], strategies: null, status: "EQUILIBRIUM" };
        }
        console.log(`[Sluice Gate Open] High Retention Pressure detected (${pressure}). Activating AI Reasoning...`);
    }

    console.log('📝 DRAFT: Calculating RFM scores from Real Data...');
    // In agentic mode, input 'customers' is already processed with RFM if coming from main()
    // But if we want to be robust, we verify.
    // For this refactor, we assume main() passed pre-calculated RFM customers OR we re-calculate if raw.
    // To simplify: main() calculates Real RFM, Agent passes it through.

    const withRFM = customers; // Pass-through as logic moved to Data Ingestion phase

    console.log('🔍 CRITIQUE: Assessing churn risk...');
    const withRisk = assessChurnRisk(withRFM);

    const highRisk = withRisk.filter(c => c.churnRisk === 'high');
    console.log(`\n📊 High risk customers: ${highRisk.length}/${customers.length}`);

    if (!CONFIG.AGENTIC_MODE) {
        return { customers: withRisk, strategies: null };
    }

    console.log('\n🔧 REFINE: Generating personalized retention strategies...');
    const strategies = await Promise.all(highRisk.map(generateRetentionStrategy));

    return { customers: withRisk, strategies };
}

async function main() {
    const args = process.argv.slice(2);
    const shop = process.env.SHOPIFY_SHOP;

    // Check for explicit token or env
    // Simple heuristic: if we have env vars, use them. Else require args? 
    // To fit existing pattern, we try env first.

    if (!process.env.SHOPIFY_ACCESS_TOKEN) {
        console.warn('⚠️  SHOPIFY_ACCESS_TOKEN missing. Cannot fetch real orders.');
        if (!args.includes('--force-mock')) { // Hidden flag for testing only
            throw new Error('Real Shopify Credentials Required for Level 4 Churn Prediction');
        }
    }

    // Fetch Real Data
    let customers = [];
    try {
        const orders = await fetchShopifyOrders(process.env.SHOPIFY_SHOP, process.env.SHOPIFY_ACCESS_TOKEN);
        customers = calculateRealRFM(orders);
    } catch (e) {
        console.error('❌ Data Fetch Failed:', e.message);
        throw e;
    }

    const result = await agenticChurnPrediction(customers);

    console.log(`\n✅ COMPLETE`);
    console.log(`   Customers analyzed: ${result.customers.length}`);
    console.log(`   Strategies generated: ${result.strategies ? result.strategies.length : 0}`);
    logTelemetry('ChurnPredictor-L4', 'Predict Churn', { customers: result.customers.length, strategies: result.strategies ? result.strategies.length : 0 }, 'SUCCESS');
    logToMcp('PREDICT_CHURN', { customers: result.customers.length, strategies_generated: result.strategies ? result.strategies.length : 0 });
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { agenticChurnPrediction };
