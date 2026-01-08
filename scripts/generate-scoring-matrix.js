const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../automations/automations-registry.json');
const OUTPUT_MD = path.join(__dirname, '../docs/scoring-matrix.md');
const OUTPUT_JSON = path.join(__dirname, '../data/scoring-matrix.json');

function calculatePotential(automation) {
    let score = 0;
    const typeWeights = {
        'script': 5,
        'ai-process': 8,
        'klaviyo-flow': 3,
        'shopify-flow': 3,
        'multi-tool': 10,
        'manual-process': 2
    };

    score += typeWeights[automation.type] || 1;

    // Level adjustment
    if (automation.agentic_level >= 3) score += 10;
    if (automation.agentic_level === 2) score += 5;

    // Capability weight
    if (automation.capabilities && automation.capabilities.length > 0) {
        score += automation.capabilities.length * 2;
    }

    // Complexity based on description/benefit length (heuristic)
    if (automation.semantic_description) score += 5;

    return score;
}

function generateMatrix() {
    if (!fs.existsSync(REGISTRY_PATH)) {
        console.error('Registry not found at', REGISTRY_PATH);
        return;
    }

    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    const automations = registry.automations;

    const scored = automations.map(a => ({
        id: a.id,
        name: a.name_en,
        category: a.category,
        type: a.type,
        current_level: a.agentic_level || 1,
        potential_score: calculatePotential(a),
        upgrade_path: a.agentic_level < 3 ? 'Add Reflection Loop' : 'Full Autonomy Orchestration'
    }));

    // Sort by potential score
    scored.sort((a, b) => b.potential_score - a.potential_score);

    // Write JSON
    if (!fs.existsSync(path.dirname(OUTPUT_JSON))) fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(scored, null, 2));

    // Write MD
    let md = '# 3A Automation: Agentic Scoring Matrix\n\n';
    md += 'Generated on: ' + new Date().toISOString() + '\n\n';
    md += '| ID | Name | Current Level | Potential | Upgrade Path |\n';
    md += '| :--- | :--- | :---: | :---: | :--- |\n';

    scored.forEach(s => {
        md += `| \`${s.id}\` | ${s.name} | ${s.current_level} | **${s.potential_score}** | ${s.upgrade_path} |\n`;
    });

    if (!fs.existsSync(path.dirname(OUTPUT_MD))) fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
    fs.writeFileSync(OUTPUT_MD, md);

    console.log(`Generated matrix: ${scored.length} items scored.`);
}

generateMatrix();
