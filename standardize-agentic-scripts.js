const fs = require('fs');
const path = require('path');

const CORE_DIR = path.join(__dirname, 'automations', 'agency', 'core');

const SCRIPTS = [
    'flows-audit-agentic.cjs',
    'product-enrichment-agentic.cjs',
    'ga4-budget-optimizer-agentic.cjs',
    'store-audit-agentic.cjs',
    'churn-prediction-enhanced-agentic.cjs',
    'sourcing-google-maps-agentic.cjs',
    'sourcing-linkedin-agentic.cjs',
    'system-audit-agentic.cjs'
];

const DOTENV_INJECTION = `// Load environment variables from project root\nrequire('dotenv').config({ path: path.join(__dirname, '../../../.env') });\n`;

const PROVIDERS_UPDATE = `    AI_PROVIDERS: [
        { name: 'anthropic', model: 'claude-sonnet-4.5', apiKey: process.env.ANTHROPIC_API_KEY },
        { name: 'google', model: 'gemini-3-flash-preview', apiKey: process.env.GEMINI_API_KEY },
        { name: 'xai', model: 'grok-4-1-fast-reasoning', apiKey: process.env.XAI_API_KEY }
    ]`;

SCRIPTS.forEach(scriptName => {
    const filePath = path.join(CORE_DIR, scriptName);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Missing: ${scriptName}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Inject dotenv if missing
    if (!content.includes('require(\'dotenv\')')) {
        // Find best place to inject (after 'const path = require('path');')
        if (content.includes('const path = require(\'path\');')) {
            content = content.replace('const path = require(\'path\');', 'const path = require(\'path\');\n' + DOTENV_INJECTION);
        } else if (content.includes('const fs = require(\'fs\');')) {
            content = content.replace('const fs = require(\'fs\');', 'const fs = require(\'fs\');\nconst path = require(\'path\');\n' + DOTENV_INJECTION);
        } else {
            content = "const path = require('path');\n" + DOTENV_INJECTION + content;
        }
    }

    // 2. Update Providers
    const providersRegex = /AI_PROVIDERS:\s*\[[\s\S]*?\]/;
    if (providersRegex.test(content)) {
        content = content.replace(providersRegex, PROVIDERS_UPDATE);
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Standardized: ${scriptName}`);
});
