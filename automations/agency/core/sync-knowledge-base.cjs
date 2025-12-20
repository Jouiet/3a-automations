#!/usr/bin/env node
/**
 * 3A Automation - Knowledge Base Auto-Sync
 * @version 3.1.0
 * @date 2025-12-21
 *
 * Auto-discovers NEW automations and updates:
 * 1. automations-registry.json (source of truth)
 * 2. knowledge-base/data/catalog.json
 * 3. voice-assistant/knowledge.json
 *
 * IMPORTANT: Compares by SCRIPT PATH to avoid duplicates
 *
 * Run after adding new automations:
 * node automations/agency/core/sync-knowledge-base.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const AUTOMATIONS_DIR = path.join(ROOT, 'automations');
const REGISTRY_PATH = path.join(ROOT, 'automations/automations-registry.json');
const CATALOG_PATH = path.join(ROOT, 'knowledge-base/data/catalog.json');
const VOICE_KB_PATH = path.join(ROOT, 'landing-page-hostinger/voice-assistant/knowledge.json');

// Files to EXCLUDE (internal tools, not marketing automations)
const EXCLUDED_PREFIXES = ['test-', 'check-', 'validate-', 'sync-', 'env-', 'forensic-'];
const EXCLUDED_DIRS = ['node_modules', 'legacy', 'test', 'tests', '.git', 'lib'];
const EXCLUDED_FILES = ['env-loader.cjs', 'validate-automations-registry.cjs'];

// Category detection based on path/filename
function detectCategory(filename, relPath) {
  const lower = filename.toLowerCase();
  const dir = relPath.toLowerCase();

  if (dir.includes('lead') || lower.includes('lead') || lower.includes('scrape')) return 'lead-gen';
  if (dir.includes('seo') || lower.includes('seo') || lower.includes('alt-text') || lower.includes('sitemap')) return 'seo';
  if (dir.includes('klaviyo') || dir.includes('email') || lower.includes('email')) return 'email';
  if (dir.includes('shopify') || lower.includes('shopify')) return 'shopify';
  if (dir.includes('analytics') || lower.includes('ga4') || lower.includes('pixel')) return 'analytics';
  if (dir.includes('video') || lower.includes('video') || lower.includes('promo')) return 'content';
  if (lower.includes('voice') || lower.includes('booking') || lower.includes('grok')) return 'lead-gen';
  if (dir.includes('social') || lower.includes('apify') || lower.includes('hubspot')) return 'lead-gen';
  if (dir.includes('crm') || lower.includes('crm')) return 'lead-gen';
  if (dir.includes('geo') || lower.includes('geo')) return 'lead-gen';

  return 'content'; // Default
}

// Generate automation ID from filename
function generateId(filename) {
  return filename
    .replace(/\.(cjs|js|mjs)$/, '')
    .replace(/[_]/g, '-')
    .toLowerCase();
}

// Generate display name from filename
function generateName(filename) {
  return filename
    .replace(/\.(cjs|js|mjs)$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Check if file should be excluded
function isExcluded(filename, relPath) {
  if (EXCLUDED_FILES.includes(filename)) return true;

  for (const prefix of EXCLUDED_PREFIXES) {
    if (filename.toLowerCase().startsWith(prefix)) return true;
  }

  for (const dir of EXCLUDED_DIRS) {
    if (relPath.includes(dir)) return true;
  }

  return false;
}

// Normalize path for comparison
function normalizePath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/').toLowerCase();
}

// Scan automations directory
function scanAutomations() {
  const found = [];

  const scanDir = (dir, relPath = '') => {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const itemRelPath = path.join(relPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!EXCLUDED_DIRS.includes(item)) {
          scanDir(fullPath, itemRelPath);
        }
      } else if (item.endsWith('.cjs') || item.endsWith('.js')) {
        if (!isExcluded(item, relPath)) {
          found.push({
            filename: item,
            relPath: itemRelPath,
            category: detectCategory(item, relPath)
          });
        }
      }
    }
  };

  scanDir(AUTOMATIONS_DIR);
  return found;
}

function main() {
  console.log('🔍 Auto-discovering automations...');

  // Read existing registry
  let registry = { automations: [], categories: {} };
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    } catch (e) {
      console.error('⚠️ Could not read registry, starting fresh');
    }
  }

  // Get existing script paths (normalized for comparison)
  const existingPaths = new Set();
  for (const auto of registry.automations) {
    if (auto.script) {
      existingPaths.add(normalizePath(auto.script));
    }
  }

  // Also track existing IDs to avoid conflicts
  const existingIds = new Set(registry.automations.map(a => a.id));

  // Scan for new automations
  const scanned = scanAutomations();
  let newCount = 0;

  for (const file of scanned) {
    const normalizedPath = normalizePath(file.relPath);

    // Skip if script path already exists in registry
    if (existingPaths.has(normalizedPath)) {
      continue;
    }

    // Generate unique ID
    let id = generateId(file.filename);
    let counter = 1;
    while (existingIds.has(id)) {
      id = generateId(file.filename) + '-' + counter;
      counter++;
    }

    console.log(`  ✅ NEW: ${file.relPath}`);

    registry.automations.push({
      id: id,
      name_fr: generateName(file.filename),
      name_en: generateName(file.filename),
      category: file.category,
      type: 'script',
      script: file.relPath,
      frequency_fr: 'Sur demande',
      frequency_en: 'On demand',
      benefit_fr: 'Automatisation efficace',
      benefit_en: 'Efficient automation'
    });

    existingIds.add(id);
    existingPaths.add(normalizedPath);
    newCount++;
  }

  // Update totalCount
  registry.totalCount = registry.automations.length;

  // Update category counts
  const catCounts = {};
  for (const auto of registry.automations) {
    catCounts[auto.category] = (catCounts[auto.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts)) {
    if (registry.categories[cat]) {
      registry.categories[cat].count = count;
    }
  }

  // Update stats
  registry.stats = registry.stats || {};
  registry.stats.withScript = registry.automations.filter(a => a.script).length;
  registry.stats.withoutScript = registry.automations.filter(a => !a.script).length;

  // Save registry
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  console.log(`\n📦 Registry: ${registry.totalCount} automations (${newCount} new discovered)`);

  // Generate voice knowledge
  const grouped = {};
  for (const auto of registry.automations) {
    const catInfo = registry.categories[auto.category];
    const catName = catInfo ? catInfo.name_fr : 'Général';
    if (!grouped[catName]) grouped[catName] = [];
    grouped[catName].push(auto.name_fr);
  }

  const voiceKB = {
    version: new Date().toISOString().split('T')[0],
    generated: new Date().toISOString(),
    totalAutomations: registry.totalCount,
    categories: Object.keys(grouped).length,
    summary: `3A Automation dispose de ${registry.totalCount} automatisations dans ${Object.keys(grouped).length} catégories.`,
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

  // Ensure directories exist
  const voiceDir = path.dirname(VOICE_KB_PATH);
  if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true });
  const catalogDir = path.dirname(CATALOG_PATH);
  if (!fs.existsSync(catalogDir)) fs.mkdirSync(catalogDir, { recursive: true });

  fs.writeFileSync(VOICE_KB_PATH, JSON.stringify(voiceKB, null, 2));
  console.log(`✅ Updated ${VOICE_KB_PATH}`);

  // Update catalog
  const catalog = {
    version: new Date().toISOString().split('T')[0],
    generated: new Date().toISOString(),
    count: registry.totalCount,
    categories: registry.categories,
    automations: registry.automations
  };
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  console.log(`✅ Updated ${CATALOG_PATH}`);

  // Summary
  console.log('\n📊 By category:');
  for (const [cat, items] of Object.entries(grouped)) {
    console.log(`  ${cat}: ${items.length}`);
  }
  console.log(`\n🎯 Total: ${registry.totalCount} marketing automations`);
}

main();
