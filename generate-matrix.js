const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'automations', 'automations-registry.json');
const OUTPUT_PATH = path.join(__dirname, 'tools-scoring-matrix.csv');

if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(' Registry not found');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
const automations = data.automations || [];

const headers = 'ID,Name,Type,Current Level (DOE),Agentic Potential (0-10),Business Impact (ROI),Complexity to Agentize,Upgrade Path';
const rows = automations.map(tool => {
    // Factual extraction
    const level = tool.agentic_level || 1;
    const potential = tool.type === 'script' ? 9 : tool.type === 'ai-process' ? 10 : (level >= 3 ? 10 : 3);
    const impact = (tool.id.includes('lead') || tool.id.includes('audit') || tool.id.includes('voice') || tool.id.includes('predict') || tool.id.includes('scoring')) ? 'HIGH' : 'MEDIUM';
    const complexity = tool.type === 'script' ? 'Low (add reflection)' : 'Medium (platform limits)';
    const upgradePath = level >= 3 ? 'MAINTAIN / OPTIMIZE' : 'UPGRADE TO LEVEL 3';

    return `${tool.id},"${tool.name_fr || tool.name_en}",${tool.type},Level ${level},${potential},${impact},${complexity},${upgradePath}`;
});

fs.writeFileSync(OUTPUT_PATH, [headers, ...rows].join('\n'));
console.log(`✅ CSV Matrix generated: ${OUTPUT_PATH}`);
console.log(`✅ Total Tools Processed: ${automations.length}`);
