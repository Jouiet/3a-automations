const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'automations', 'automations-registry.json');

const data = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

const UPGRADES = {
    'lead-scoring': 3,
    'flows-audit': 3,
    'product-enrichment': 3,
    'ga4-source-report': 3,
    'store-audit': 3,
    'churn-prediction-enhanced': 4,
    'sourcing-google-maps': 3,
    'sourcing-linkedin': 3,
    'system-audit': 4
};

data.automations.forEach(tool => {
    if (UPGRADES[tool.id]) {
        tool.agentic_level = UPGRADES[tool.id];
        console.log(`✅ Upgraded ${tool.id} to Level ${tool.agentic_level}`);
    }
});

fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
console.log('✅ Registry updated with DOE Levels.');
