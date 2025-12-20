#!/usr/bin/env node
/**
 * VALIDATE AUTOMATIONS REGISTRY
 * Vérifie que le catalogue HTML correspond au registry JSON
 * Date: 2025-12-20
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

// Paths
const REGISTRY_PATH = path.join(__dirname, 'automations-registry.json');
const FR_CATALOG = path.join(__dirname, '../landing-page-hostinger/automations.html');
const EN_CATALOG = path.join(__dirname, '../landing-page-hostinger/en/automations.html');

// Load registry
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

// Count automation cards in HTML
function countCards(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const matches = html.match(/<div class="automation-card/g);
  return matches ? matches.length : 0;
}

// Extract card names from HTML
function extractCardNames(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const regex = /<div class="automation-card[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g;
  const names = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    names.push(match[1].trim());
  }
  return names;
}

// Verify scripts exist
function verifyScripts() {
  const missing = [];
  for (const auto of registry.automations) {
    if (auto.script) {
      const scriptPath = path.join(__dirname, auto.script);
      if (!fs.existsSync(scriptPath)) {
        missing.push({ id: auto.id, script: auto.script });
      }
    }
  }
  return missing;
}

// Main validation
console.log('=== VALIDATION AUTOMATIONS REGISTRY ===\n');

// 1. Count check
const registryCount = registry.automations.length;
const frCount = countCards(FR_CATALOG);
const enCount = countCards(EN_CATALOG);

console.log('📊 COUNTS:');
console.log(`   Registry: ${registryCount}`);
console.log(`   FR HTML:  ${frCount} ${frCount === registryCount ? '✅' : '❌'}`);
console.log(`   EN HTML:  ${enCount} ${enCount === registryCount ? '✅' : '❌'}`);

// 2. Category counts
console.log('\n📁 CATEGORIES:');
for (const [catId, cat] of Object.entries(registry.categories)) {
  const catAutomations = registry.automations.filter(a => a.category === catId);
  const match = catAutomations.length === cat.count;
  console.log(`   ${cat.name_en}: ${catAutomations.length}/${cat.count} ${match ? '✅' : '❌'}`);
}

// 3. Script verification
const missingScripts = verifyScripts();
console.log('\n📜 SCRIPTS:');
if (missingScripts.length === 0) {
  console.log('   All scripts exist ✅');
} else {
  console.log(`   Missing scripts: ${missingScripts.length} ❌`);
  missingScripts.forEach(m => console.log(`   - ${m.id}: ${m.script}`));
}

// 4. Type distribution
console.log('\n🔧 TYPE DISTRIBUTION:');
const typeCount = {};
registry.automations.forEach(a => {
  typeCount[a.type] = (typeCount[a.type] || 0) + 1;
});
Object.entries(typeCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

// 5. Final status
const allGood = frCount === registryCount && enCount === registryCount && missingScripts.length === 0;
console.log('\n' + (allGood ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'));

process.exit(allGood ? 0 : 1);
