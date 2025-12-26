#!/usr/bin/env node
/**
 * Generate Public Registry - Marketing-Safe Version
 *
 * Creates a public version of automations-registry.json that:
 * - Removes script paths (competitive intelligence)
 * - Removes internal types (implementation details)
 * - Keeps only marketing-relevant information
 *
 * Usage: node scripts/generate-public-registry.cjs
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '../automations/automations-registry.json');
const OUTPUT_PATH = path.join(__dirname, '../landing-page-hostinger/data/automations-catalog.json');

// Read source registry
const registry = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

// Create public version
const publicRegistry = {
  version: registry.version,
  lastUpdated: registry.lastUpdated,
  totalCount: registry.totalCount,
  description: "3A Automation - Catalog of marketing automation solutions",

  categories: {},
  automations: [],

  summary: {
    totalAutomations: registry.totalCount,
    categoriesCount: Object.keys(registry.categories).length,
    highlights: [
      "Email Marketing Flows",
      "Lead Generation & Scoring",
      "E-commerce Automation",
      "AI Video & Avatar",
      "WhatsApp Business",
      "Voice AI Telephony"
    ]
  }
};

// Clean categories - remove internal details
for (const [key, cat] of Object.entries(registry.categories)) {
  publicRegistry.categories[key] = {
    name_fr: cat.name_fr,
    name_en: cat.name_en,
    count: cat.count
  };

  // Keep external/partner info if present
  if (cat.external) {
    publicRegistry.categories[key].external = true;
    publicRegistry.categories[key].partner_url = cat.partner_url;
  }
}

// Clean automations - remove implementation details
for (const auto of registry.automations) {
  const cleanAuto = {
    id: auto.id,
    name_fr: auto.name_fr,
    name_en: auto.name_en,
    category: auto.category,
    frequency_fr: auto.frequency_fr,
    frequency_en: auto.frequency_en,
    benefit_fr: auto.benefit_fr,
    benefit_en: auto.benefit_en
  };

  // Keep external URL if present
  if (auto.external) {
    cleanAuto.external = true;
    cleanAuto.url = auto.url;
  }

  // Optionally keep description if present (marketing copy)
  if (auto.description_fr) {
    cleanAuto.description_fr = auto.description_fr;
    cleanAuto.description_en = auto.description_en;
  }

  publicRegistry.automations.push(cleanAuto);
}

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write public registry
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(publicRegistry, null, 2));

console.log('✅ Public registry generated:');
console.log(`   ${OUTPUT_PATH}`);
console.log(`   ${publicRegistry.totalCount} automations`);
console.log(`   ${Object.keys(publicRegistry.categories).length} categories`);
console.log('');
console.log('🔒 Removed from public version:');
console.log('   - Script paths');
console.log('   - Implementation types');
console.log('   - Internal stats');
