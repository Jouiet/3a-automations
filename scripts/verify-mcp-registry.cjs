/**
 * 3A Global MCP Registry Verification Script
 * Standard: Forensic Integrity Pass
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.resolve(__dirname, '../automations/automations-registry.json');
const AUTOMATIONS_DIR = path.resolve(__dirname, '../automations');

console.log('--- MCP REGISTRY FORENSIC AUDIT ---');

if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('❌ Registry file missing!');
    process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
const tools = registry.automations;

console.log(`Checking ${tools.length} registered tools...`);

let missingCount = 0;
let validCount = 0;
const missingScripts = [];

tools.forEach(tool => {
    if (tool.script) {
        const scriptPath = path.join(AUTOMATIONS_DIR, tool.script);
        if (fs.existsSync(scriptPath)) {
            validCount++;
        } else {
            missingCount++;
            missingScripts.push({ id: tool.id, path: tool.script });
        }
    } else {
        // Some tools might be platform-specific (Klaviyo Flow) and not have a script
        validCount++;
    }
});

console.log('\n--- RESULTS ---');
console.log(`✅ Valid/Available: ${validCount}`);
console.log(`❌ Missing on Disk : ${missingCount}`);

if (missingCount > 0) {
    console.log('\nMissing Scripts Detail:');
    missingScripts.forEach(m => console.log(` - [${m.id}]: ${m.path}`));
}

if (missingCount === 0) {
    console.log('\n🏁 FORENSIC INTEGRITY VERIFIED: 100% SUCCESS');
} else {
    console.log('\n⚠️ INTEGRITY GAP DETECTED');
}
