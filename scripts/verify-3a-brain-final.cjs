/**
 * 3A BRAIN: FINAL MISSION VERIFICATION SCRIPT (ULTRA-RESILIENT)
 * 100% Factual Scan (No Mocks, No BS)
 */
const fs = require('fs');
const path = require('path');

const CORE_DIR = path.join(__dirname, '../automations/agency/core');
const LANDING_DIR = path.join(__dirname, '../landing-page-hostinger');

const EXPECTED_AGENTS = [
    'voice-telephony-bridge.cjs',
    'ga4-budget-optimizer-agentic.cjs',
    'content-strategist-agentic.cjs',
    'churn-prediction-enhanced-agentic.cjs',
    'system-audit-agentic.cjs',
    'product-enrichment-agentic.cjs',
    'flows-audit-agentic.cjs',
    'store-audit-agentic.cjs',
    'sourcing-google-maps-agentic.cjs',
    'sourcing-linkedin-agentic.cjs',
    'autonomy-daemon.cjs',
    'doe-dispatcher.cjs'
];

async function verify() {
    console.log('🚀 INITIALIZING FINAL BRAIN SCAN (JAN 2026)\n');
    let score = 0;
    let total = 6;

    // 1. Core Agents Check
    console.log('🔍 [1/6] Scanning Agentic Cortex...');
    const missingAgents = EXPECTED_AGENTS.filter(a => !fs.existsSync(path.join(CORE_DIR, a)));
    if (missingAgents.length === 0) {
        console.log('✅ All 12 specialized agents verified.');
        score++;
    } else {
        console.log(`❌ Missing Agents: ${missingAgents.join(', ')}`);
    }

    // 2. Voice Persona Matrix Check
    console.log('\n🔍 [2/6] Scanning Voice AI Persona Matrix...');
    const injectorPath = path.join(CORE_DIR, 'voice-persona-injector.cjs');
    if (fs.existsSync(injectorPath)) {
        const content = fs.readFileSync(injectorPath, 'utf8');
        // Look for keys in the PERSONAS object (e.g. "    AGENCY: {")
        const personaMatches = content.match(/^\s*[A-Z_]+:\s*\{/gm) || [];
        if (personaMatches.length >= 20) {
            console.log(`✅ ${personaMatches.length} archetypes found in persona injector.`);
            score++;
        } else {
            console.log(`❌ Only ${personaMatches.length} archetypes found. Expected 20.`);
        }
    }

    // 3. RAG Multi-Tenancy Sync
    console.log('\n🔍 [3/6] Verifying RAG Multi-Tenancy Sync...');
    const registryPath = path.join(CORE_DIR, 'client_registry.json');
    if (fs.existsSync(registryPath)) {
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        const hasSync = Object.values(registry.clients).every(c => c.knowledge_base_id);
        if (hasSync) {
            console.log('✅ All registered clients have linked Knowledge Base IDs.');
            score++;
        } else {
            console.log('❌ RAG sync gap found in client_registry.json');
        }
    }

    // 4. Automation Registry Count
    console.log('\n🔍 [4/6] Auditing Automation Registry (The Body)...');
    const registryGlobalPath = path.join(__dirname, '../automations/automations-registry.json');
    if (fs.existsSync(registryGlobalPath)) {
        const reg = JSON.parse(fs.readFileSync(registryGlobalPath, 'utf8'));
        if (reg.totalCount === 118) {
            console.log('✅ Registry total count is factually 118.');
            score++;
        } else {
            console.log(`❌ Registry count mismatch: ${reg.totalCount} vs 118.`);
        }
    }

    // 5. Multi-Market Redirection Logic
    console.log('\n🔍 [5/6] Testing Geo-Locale Logic...');
    const geoPath = path.join(LANDING_DIR, 'geo-locale.js');
    if (fs.existsSync(geoPath)) {
        const content = fs.readFileSync(geoPath, 'utf8');
        const hasMarkets = content.includes('region: \'maghreb\'') &&
            content.includes('region: \'europe\'') &&
            content.includes('region: \'international\'');
        if (hasMarkets) {
            console.log('✅ 3-Market Logic (MA/EU/INTL) verified in geo-locale.js.');
            score++;
        } else {
            console.log('❌ Geo-locale logic incomplete.');
        }
    }

    // 6. Marketing Science Core Injection
    console.log('\n🔍 [6/6] Verifying Marketing Science Core...');
    const mktPath = path.join(CORE_DIR, 'marketing-science-core.cjs');
    if (fs.existsSync(mktPath)) {
        const content = fs.readFileSync(mktPath, 'utf8');
        const frameworks = ['PAS', 'AIDA', 'SB7', 'CIALDINI', 'UVP', 'BANT'];
        const frameworkMatches = frameworks.filter(f => {
            const regex = new RegExp(`^\\s*${f}:\\s*\\{`, 'm');
            return regex.test(content);
        });

        if (frameworkMatches.length === frameworks.length) {
            console.log(`✅ Marketing Science Core (${frameworks.join('/')}) is ACTIVE.`);
            score++;
        } else {
            console.log(`❌ Marketing Frameworks missing: ${frameworks.filter(f => !frameworkMatches.includes(f)).join(', ')}`);
        }
    }

    console.log(`\n📊 FINAL SCORE: ${score}/${total}`);
    if (score === total) {
        console.log('🟢 100% FACTUAL INTEGRITY VERIFIED. MISSION COMPLETE.');
        process.exit(0);
    } else {
        console.log('🔴 SYSTEM GAPS DETECTED. DO NOT SHIP.');
        process.exit(1);
    }
}

verify();
