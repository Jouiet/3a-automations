const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'automations/automations-registry.json');
const OUTPUT_PATH = path.join(__dirname, 'automations/automations-registry.json'); // Direct update

// DOE Level Rules
const AGENTIC_RULES = [
    {
        level: 4,
        criteria: 'Highly Autonomous / Voice AI / Self-Reflecting',
        keywords: ['voice', 'closer', 'autonomous', 'self-correcting', 'multi-step reflection', 'interactive'],
        categories: ['voice-ai', 'ai-avatar']
    },
    {
        level: 3,
        criteria: 'Reasoning-based / LLM integration / Generative',
        keywords: ['llm', 'generator', 'ai', 'claude', 'gemini', 'grok', 'gpt', 'analyst', 'reasoning', 'optimization'],
        categories: ['content', 'seo', 'analytics']
    },
    {
        level: 2,
        criteria: 'Conditional / Logical Flows / Reactive',
        keywords: ['if', 'then', 'trigger', 'recovery', 'segmentation', 'personalization', 'filter'],
        categories: ['email', 'retention', 'whatsapp']
    },
    {
        level: 1,
        criteria: 'Deterministic / Sync / Basic automation',
        keywords: ['sync', 'export', 'import', 'copy', 'upload', 'fetch'],
        categories: ['lead-gen', 'shopify', 'dropshipping']
    }
];

function determineAgenticLevel(automation) {
    const text = (automation.id + ' ' + (automation.name_en || '') + ' ' + (automation.semantic_description || '')).toLowerCase();
    const category = automation.category;

    // High priority check: Voice AI is always level 4
    if (category === 'voice-ai' || text.includes('voice')) return 4;

    // Level 3 check: LLM/AI keywords
    if (text.includes('generator') || text.includes('analyst') || text.includes('ai') || text.includes('claude') || text.includes('gemini') || text.includes('grok')) {
        return 3;
    }

    // Level 2 check: Logical/Reactive
    if (text.includes('recovery') || text.includes('personalization') || text.includes('automation') || category === 'email') {
        return 2;
    }

    // Default Level 1
    return 1;
}

function runAudit() {
    console.log('--- Starting Forensic Agentic Audit v2 ---');

    if (!fs.existsSync(REGISTRY_PATH)) {
        console.error(`Registry not found at ${REGISTRY_PATH}`);
        process.exit(1);
    }

    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    let updatedCount = 0;
    let levelStats = { 1: 0, 2: 0, 3: 0, 4: 0 };

    registry.automations = registry.automations.map(auto => {
        const level = determineAgenticLevel(auto);
        const capabilities = [];

        // Assign capabilities based on level
        if (level >= 1) capabilities.push('Data Interoperability');
        if (level >= 2) capabilities.push('Conditional Execution');
        if (level >= 3) capabilities.push('LLM Reasoning');
        if (level >= 4) capabilities.push('Interactive Autonomy');

        updatedCount++;
        levelStats[level]++;

        return {
            ...auto,
            agentic_level: level,
            capabilities: capabilities
        };
    });

    registry.lastAudit = new Date().toISOString();
    registry.auditSummary = {
        totalScanned: updatedCount,
        levelDistribution: levelStats
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(registry, null, 2));

    console.log(`Audit Complete!`);
    console.log(`- Total Scanned: ${updatedCount}`);
    console.log(`- Level 1: ${levelStats[1]}`);
    console.log(`- Level 2: ${levelStats[2]}`);
    console.log(`- Level 3: ${levelStats[3]}`);
    console.log(`- Level 4: ${levelStats[4]}`);
    console.log(`- Registry updated at: ${OUTPUT_PATH}`);
}

runAudit();
