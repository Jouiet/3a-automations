const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../automations/automations-registry.json');
const CATALOG_PATH = path.join(__dirname, '../docs/mcp-catalog.md');

function generateCatalog() {
    if (!fs.existsSync(REGISTRY_PATH)) {
        console.error('Registry not found');
        return;
    }

    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    const automations = registry.automations;

    let md = '# 3A Global MCP: Tool Catalog\n\n';
    md += 'This catalog lists all **' + automations.length + '** proprietary tools exposed via the 3A Global MCP Router. Each tool is designed for high-performance agentic orchestration.\n\n';

    const categories = Object.keys(registry.categories);

    categories.forEach(catId => {
        const cat = registry.categories[catId];
        const catAutomations = automations.filter(a => a.category === catId);

        if (catAutomations.length === 0) return;

        md += `## ${cat.name_en} (${catAutomations.length} Tools)\n\n`;
        md += '| Tool ID | Name | Type | Level | Semantic Description |\n';
        md += '| :--- | :--- | :--- | :---: | :--- |\n';

        catAutomations.forEach(a => {
            const description = a.semantic_description || a.name_en;
            md += `| \`${a.id}\` | ${a.name_en} | ${a.type} | ${a.agentic_level || 1} | ${description} |\n`;
        });
        md += '\n';
    });

    if (!fs.existsSync(path.dirname(CATALOG_PATH))) fs.mkdirSync(path.dirname(CATALOG_PATH), { recursive: true });
    fs.writeFileSync(CATALOG_PATH, md);
    console.log(`Generated MCP Catalog: ${automations.length} tools.`);
}

generateCatalog();
