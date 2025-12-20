#!/usr/bin/env node
/**
 * 3A Automation - Knowledge Base Auto-Sync
 * @version 1.0.0
 * @date 2025-12-20
 *
 * Scans automations directory and updates:
 * 1. knowledge-base/data/catalog.json
 * 2. Voice widget knowledge (via JSON file)
 *
 * Run after adding new automations:
 * node automations/agency/core/sync-knowledge-base.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const AUTOMATIONS_DIR = path.join(ROOT, 'automations');
const CATALOG_PATH = path.join(ROOT, 'knowledge-base/data/catalog.json');
const VOICE_KB_PATH = path.join(ROOT, 'landing-page-hostinger/voice-assistant/knowledge.json');

// Category mappings
const CATEGORIES = {
  'lead': { id: 'lead_generation', name: 'Lead Generation & Acquisition' },
  'seo': { id: 'seo_content', name: 'SEO & Content' },
  'email': { id: 'email_sms', name: 'Email/SMS Marketing' },
  'klaviyo': { id: 'email_sms', name: 'Email/SMS Marketing' },
  'analytics': { id: 'analytics', name: 'Analytics & Reporting' },
  'ecommerce': { id: 'ecommerce', name: 'E-commerce Automation' },
  'shopify': { id: 'ecommerce', name: 'E-commerce Automation' },
  'crm': { id: 'crm', name: 'CRM & Customer Data' },
  'voice': { id: 'ai_voice', name: 'Voice AI & Booking' },
  'booking': { id: 'ai_voice', name: 'Voice AI & Booking' },
  'geo': { id: 'localization', name: 'Geo-Targeting & i18n' }
};

function detectCategory(filename, filepath) {
  const lower = filename.toLowerCase();
  const dir = filepath.toLowerCase();

  for (const [keyword, cat] of Object.entries(CATEGORIES)) {
    if (lower.includes(keyword) || dir.includes(keyword)) {
      return cat;
    }
  }
  return { id: 'general', name: 'General Automation' };
}

function extractMetadata(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').slice(0, 30);

    let name = path.basename(filepath, path.extname(filepath));
    let description = '';
    let version = '1.0.0';

    for (const line of lines) {
      if (line.includes('@description') || line.includes('* Description:')) {
        description = line.replace(/.*(@description|Description:)\s*/i, '').trim();
      }
      if (line.includes('@version')) {
        version = line.replace(/.*@version\s*/i, '').trim();
      }
      // Extract from comment header
      if (line.match(/^\s*\*\s+[A-Z]/) && !description) {
        const match = line.match(/^\s*\*\s+(.+)/);
        if (match && match[1].length > 10 && match[1].length < 100) {
          description = match[1];
        }
      }
    }

    // Format name from filename
    name = name
      .replace(/[-_]/g, ' ')
      .replace(/\.cjs|\.js|\.mjs/g, '')
      .replace(/\b\w/g, c => c.toUpperCase());

    return { name, description, version };
  } catch (err) {
    return { name: path.basename(filepath), description: '', version: '1.0.0' };
  }
}

function scanAutomations() {
  const automations = [];
  let id = 1;

  const scanDir = (dir, relPath = '') => {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, legacy, test
        if (['node_modules', 'legacy', 'test', 'tests', '.git'].includes(item)) continue;
        scanDir(fullPath, path.join(relPath, item));
      } else if (item.endsWith('.cjs') || item.endsWith('.js') || item.endsWith('.mjs')) {
        // Skip test files
        if (item.includes('.test.') || item.includes('.spec.')) continue;

        const category = detectCategory(item, relPath);
        const meta = extractMetadata(fullPath);

        automations.push({
          id: `auto-${id++}`,
          name: meta.name,
          description: meta.description,
          category: category.id,
          categoryName: category.name,
          version: meta.version,
          path: path.join(relPath, item)
        });
      }
    }
  };

  scanDir(AUTOMATIONS_DIR);
  return automations;
}

function groupByCategory(automations) {
  const groups = {};
  for (const auto of automations) {
    if (!groups[auto.categoryName]) {
      groups[auto.categoryName] = [];
    }
    groups[auto.categoryName].push(auto.name);
  }
  return groups;
}

function generateVoiceKnowledge(automations) {
  const grouped = groupByCategory(automations);

  return {
    version: new Date().toISOString().split('T')[0],
    generated: new Date().toISOString(),
    totalAutomations: automations.length,
    categories: Object.keys(grouped).length,
    summary: `3A Automation dispose de ${automations.length} automatisations dans ${Object.keys(grouped).length} catégories.`,
    automationsByCategory: grouped,
    packs: {
      quickWin: { price: '390€', automations: '1 flow optimisé', bonus: 'Voice AI + Booking' },
      essentials: { price: '790€', automations: '3 flows + A/B tests', bonus: 'Voice AI + Booking + WhatsApp' },
      growth: { price: '1490€', automations: '5 flows + dashboard', bonus: 'Voice AI + Booking + WhatsApp + Rappels' }
    },
    retainers: {
      maintenance: { price: '290€/mois', hours: '3h' },
      optimization: { price: '490€/mois', hours: '5h' },
      growth: { price: '890€/mois', hours: '10h' }
    }
  };
}

function main() {
  console.log('🔍 Scanning automations directory...');

  const automations = scanAutomations();
  console.log(`📦 Found ${automations.length} automations`);

  // Update catalog.json
  let catalog = {};
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    } catch (e) {
      catalog = {};
    }
  }

  catalog.version = new Date().toISOString().split('T')[0];
  catalog.generated = new Date().toISOString();
  catalog.automations = automations;
  catalog.count = automations.length;

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  console.log(`✅ Updated ${CATALOG_PATH}`);

  // Generate voice knowledge
  const voiceKB = generateVoiceKnowledge(automations);

  // Ensure directory exists
  const voiceDir = path.dirname(VOICE_KB_PATH);
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
  }

  fs.writeFileSync(VOICE_KB_PATH, JSON.stringify(voiceKB, null, 2));
  console.log(`✅ Updated ${VOICE_KB_PATH}`);

  // Summary
  console.log('\n📊 Summary:');
  const grouped = groupByCategory(automations);
  for (const [cat, items] of Object.entries(grouped)) {
    console.log(`  ${cat}: ${items.length} automations`);
  }
  console.log(`\n🎯 Total: ${automations.length} automations`);
}

main();
