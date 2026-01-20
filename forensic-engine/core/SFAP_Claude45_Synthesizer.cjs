#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

// API Configuration
const PROVIDERS = {
    geminiFlash: {
        name: 'Gemini 3 Flash',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
        envKey: 'GEMINI_API_KEY',
        active: false
    },
    geminiPro: {
        name: 'Gemini 3 Pro',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent',
        envKey: 'GEMINI_API_KEY',
        active: false
    },
    claude: {
        name: 'Claude 4.5 Sonnet',
        url: 'https://api.anthropic.com/v1/messages',
        envKey: 'ANTHROPIC_API_KEY',
        active: false
    },
    grok: {
        name: 'Grok 4.1',
        url: 'https://api.x.ai/v1/chat/completions',
        envKey: 'XAI_API_KEY',
        active: false
    }
};

// Check available providers
function initProviders() {
    const envPath = path.resolve(__dirname, '../../.env');
    require('dotenv').config({ path: envPath });
    console.log(`🔧 Loading .env from: ${envPath}`);

    Object.keys(PROVIDERS).forEach(key => {
        const envKey = PROVIDERS[key].envKey;
        if (process.env[envKey]) {
            PROVIDERS[key].active = true;
            console.log(`✅ [PROVIDER] ${PROVIDERS[key].name}: ACTIVE`);
        } else {
            console.log(`⚠️ [PROVIDER] ${PROVIDERS[key].name}: MISSING KEY (${envKey})`);
        }
    });
}

// Load and Summarize Registry (119 Workflows)
function getRegistrySummary() {
    const registryPath = path.resolve(__dirname, '../../automations/automations-registry.json');
    if (!fs.existsSync(registryPath)) return "REGISTRY_NOT_FOUND";

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const summary = registry.automations.map(a => ({
        id: a.id,
        name: a.name_en,
        usage: a.benefit_en,
        level: a.agentic_level || a.agenticLevel || 1
    }));
    return JSON.stringify(summary, null, 1);
}

// Load Top 30 Archetype Matrix
function getArchetypeMatrix() {
    const matrixPath = path.resolve(__dirname, 'OMNI_ARCHETYPE_MATRIX.md');
    if (!fs.existsSync(matrixPath)) return "MATRIX_NOT_FOUND";
    return fs.readFileSync(matrixPath, 'utf8');
}

// Build forensic synthesis prompt
function buildPrompt(domain, rawData) {
    const registrySummary = getRegistrySummary();
    const archetypeMatrix = getArchetypeMatrix();

    // Detect Archetype Class for logic pivot
    const rawStr = JSON.stringify(rawData).toLowerCase();
    const isEcommerce = rawStr.includes('shopify') || rawStr.includes('cart') || rawStr.includes('checkout');

    // Attempt granular matching
    let specificArchetype = "General SME";
    if (rawStr.includes('law') || rawStr.includes('avocat') || rawStr.includes('notary')) specificArchetype = "Legal & Notary";
    else if (rawStr.includes('clinic') || rawStr.includes('dentist') || rawStr.includes('medical')) specificArchetype = "Private Clinics & Specialists";
    else if (rawStr.includes('consulting') || rawStr.includes('conseil')) specificArchetype = "Consulting & Strategy";
    else if (rawStr.includes('hotel') || rawStr.includes('airbnb')) specificArchetype = "Boutique Hotels & AirBnB Management";
    else if (isEcommerce) specificArchetype = "Specialized E-commerce";

    return `
# IDENTITY: 3A Automation Strategic Lead (Consultant Mode)
# FRAMEWORK: Global Pressure Matrix (GPM) & Ultra-Think Protocol v4.0 (Global Top 30)
# OBJECTIVE: Produce an exhaustive, brutally honest forensic audit for ${domain}.

## 0. THE TARGET ARCHETYPE:
Detected as: ${specificArchetype}
Refer to the OMNI-SECTOR MATRIX below for specific DNA reasoning.

## 1. THE BODY (YOUR ARSENAL - 119 VERIFIED WORKFLOWS):
${registrySummary}

## 2. THE OMNI-SECTOR MATRIX (TOP 30 GLOBAL CLASSES):
${archetypeMatrix}

## 3. THE CORTEX (YOUR TEAM - 10 HARDENED L4 AGENTS):
- **Strategic Synthesizer**: Pattern recognition across disparate audit layers.
- **SecOps Hardener**: Forensic security & protocol alignment.
- **AEO Orchestrator**: Optimization for the "Answer Engine" era (Perplexity/ChatGPT).
- **Pixel Forensic**: Deep tracking attribution (Transactions OR Leads).
- **Content Strategist**: Maps inventory/SEO gaps to automated growth loops.
- **GA4 Budget Optimizer**: Financial efficiency & ad-spend reallocation logic.
- **Predictive Churn Bot**: Data-driven retention (LTV OR Client Lifecycle).
- **DOE Dispatcher**: High-logic execution & multi-tool orchestration.
- **Critique Agent**: Cold-blooded internal review for logic errors or "bullshit".
- **Refinement Loop**: Iterative precision until "Zero-Bugs" executive status.

## 3. THE TRINITY (OFFERINGS):
- **"The Architect" (3A Packs)**: Holistic Systems (390€, 790€, 1,399€).
- **"The Director" (CinematicAds)**: AI Video Ads (From $150).
- **"The Closer" (Voice AI)**: 24/7 Phone/Web Sales Autonomy (Setup + Usage).

## 4. THE PRESSURE MATRIX (ARCHETYPE-SPECIFIC REASONING):
${isEcommerce ? `
### E-COMMERCE PIVOT:
1. **Acquisition**: Ad spend "blindness" due to Pixel/SST gaps.
2. **Conversion**: Friction in Checkout/Cart. Static Product Pages.
3. **Retention**: Churn in repeat buyers. RFM automation.
4. **Advocacy**: Review capture & VIP tiers.
` : `
### B2B/SME PIVOT:
1. **Acquisition**: Lead Decay. High CPA per qualified inquiry.
2. **Conversion**: SDR Inefficiency. Delay in lead response (>5 min). Static forms.
3. **Retention**: Client Lifecycle leakage. No automated nurturing or follow-up.
4. **Advocacy**: Referral automation & Case Study loops.
`}

## 5. STRICT NON-NEGOTIABLE REQUIREMENTS:
- **BRUTAL HONESTY**: If the audit data is "Clean", say so. Do not invent problems.
- **IDENTIFY GAPS**: If an issue exists but NO registry workflow solves it, explicitly state: "NO 3A AUTOMATION EXISTS FOR THIS GAP."
- **VOCABULARY SYNC**: Use terms appropriate for ${specificArchetype}. (e.g., Don't mention "Carts" for a Law Firm).
- **PRICING JUSTIFICATION**: 
    - E-com: Use "Attribution Recovery" benchmarks ($15k-$25k).
    - B2B: Use "Lead Survival Rate" & "SDR Hours Saved" benchmarks.
- **BOTTOM-UP MAPPING**: Link every finding to a SPECIFIC Workflow ID.

## AUDIT DATA:
${JSON.stringify(rawData, null, 2)}

# FINAL REPORT FORMAT:
- ## 🔭 I. Forensic Executive Summary (The Cold Truth)
- ## 🛠️ II. The Global Pressure Matrix (Deficiency Analysis)
- ## 🛰️ III. Strategic Remediation Roadmap (Registry Mapped)
- ## 🧠 IV. Assigned Cortex Team (Human-Agent Collaboration)
- ## ⚖️ V. Strategic Recommendation (Architect/Director/Closer)
- ## 📝 VI. Factual Accountability Matrix (Proven vs. Unproven)
`;
}

// REST OF THE FILE (API CALLS) ...
async function callGrok(prompt) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('XAI_API_KEY not configured');
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'grok-4-1-fast-reasoning',
            messages: [{ role: 'system', content: 'You are an Automation Strategic Consultant for 3A Automation.' }, { role: 'user', content: prompt }],
            temperature: 0.2, // Lower temp for more precision
            max_tokens: 4000
        })
    });
    if (!response.ok) throw new Error(`Grok API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
}

async function callClaude(prompt) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
            model: 'claude-sonnet-4.5',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
        })
    });
    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const data = await response.json();
    return data.content[0].text;
}

async function callGemini(prompt, modelUrl) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    const url = `${modelUrl}?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 }
        })
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function synthesize(reportPath) {
    console.log(`🧠 [SFAP v3.3] Initiating Multi-Provider Cognitive Synthesis`);
    console.log(`📄 Source: ${reportPath}`);
    initProviders();
    if (!fs.existsSync(reportPath)) {
        console.error('❌ FATAL: Master JSON not found');
        return null;
    }
    const rawData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const domain = new URL(rawData.metadata.target).hostname;
    const prompt = buildPrompt(domain, rawData);

    const providers = [
        { name: 'Gemini 3 Flash', url: PROVIDERS.geminiFlash.url, fn: (p) => callGemini(p, PROVIDERS.geminiFlash.url), active: PROVIDERS.geminiFlash.active },
        { name: 'Gemini 3 Pro', url: PROVIDERS.geminiPro.url, fn: (p) => callGemini(p, PROVIDERS.geminiPro.url), active: PROVIDERS.geminiPro.active },
        { name: 'Claude 4.5', fn: callClaude, active: PROVIDERS.claude.active },
        { name: 'Grok 4.1', fn: callGrok, active: PROVIDERS.grok.active }
    ];

    for (const provider of providers) {
        if (!provider.active) continue;
        try {
            console.log(`🔄 [TRYING] ${provider.name}...`);
            const result = await provider.fn(prompt);
            console.log(`✅ [SUCCESS] ${provider.name} generated cognitive synthesis`);
            const outputPath = path.join(path.dirname(reportPath), 'COGNITIVE_SYNTHESIS.md');
            fs.writeFileSync(outputPath, result);
            return result;
        } catch (err) {
            console.error(`❌ [FAILED] ${provider.name}: ${err.message}`);
        }
    }
    return null;
}

if (require.main === module) {
    const reportPath = process.argv[2];
    if (!reportPath) {
        console.log('Usage: node SFAP_Claude45_Synthesizer.cjs <path-to-master-report.json>');
        process.exit(1);
    }
    synthesize(reportPath).catch(console.error);
}

module.exports = { synthesize, buildPrompt };
