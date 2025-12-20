#!/usr/bin/env node
/**
 * 3A Automation - Knowledge Base Auto-Sync
 * @version 4.0.0
 * @date 2025-12-21
 *
 * Auto-discovers CLIENT-FACING automations only.
 * Internal tools, tests, POCs are excluded.
 *
 * SEGMENTATION:
 * - agency/core/: ONLY booking files (whitelist)
 * - clients/*: All EXCEPT test/verify/check files
 * - generic/: All EXCEPT test/validate/module files
 * - lib/: EXCLUDED entirely
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const AUTOMATIONS_DIR = path.join(ROOT, 'automations');
const REGISTRY_PATH = path.join(ROOT, 'automations/automations-registry.json');
const CATALOG_PATH = path.join(ROOT, 'knowledge-base/data/catalog.json');
const VOICE_KB_PATH = path.join(ROOT, 'landing-page-hostinger/voice-assistant/knowledge.json');

// ============================================
// SEGMENTATION RULES
// ============================================

// agency/core/ - WHITELIST approach (only these are client-facing)
const AGENCY_CORE_WHITELIST = [
  'google-apps-script-booking.js',
  'google-calendar-booking.cjs'
];

// Prefixes that indicate INTERNAL tools
const EXCLUDED_PREFIXES = [
  'test-',
  'check-',
  'validate-',
  'forensic-',
  'env-'
  // NOTE: sync- removed because sync-*-leads-to-* are client automations
];

// Suffixes that indicate INTERNAL tools
const EXCLUDED_SUFFIXES = [
  '-test',
  '-poc',
  '-connection'  // connection tests
];

// Patterns that indicate INTERNAL tools
const EXCLUDED_CONTAINS = [
  'verify-',
  'inspect-'
];

// Specific files to EXCLUDE
const EXCLUDED_FILES = [
  'env-loader.cjs',
  'validate-automations-registry.cjs',
  'geo-markets.cjs',  // Module, not standalone
  'grok-client.cjs',  // API client library
  'prompt-feedback-tracker.cjs',  // Internal tool
  'sync-knowledge-base.cjs'  // This script itself
];

// Directories to EXCLUDE entirely
const EXCLUDED_DIRS = ['node_modules', 'legacy', 'test', 'tests', '.git', 'lib'];

// ============================================
// DETECTION LOGIC
// ============================================

function isClientFacing(filename, relPath) {
  const lower = filename.toLowerCase();
  const dir = relPath.split('/')[0];  // First directory level

  // 1. agency/core/ - WHITELIST only
  if (relPath.startsWith('agency/core/')) {
    return AGENCY_CORE_WHITELIST.includes(filename);
  }

  // 2. lib/ - EXCLUDE entirely
  if (dir === 'lib') {
    return false;
  }

  // 3. Root level files - EXCLUDE
  if (!relPath.includes('/')) {
    return false;
  }

  // 4. Check excluded files
  if (EXCLUDED_FILES.includes(filename)) {
    return false;
  }

  // 5. Check excluded prefixes
  for (const prefix of EXCLUDED_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return false;
    }
  }

  // 6. Check excluded suffixes
  const nameWithoutExt = lower.replace(/\.(cjs|js|mjs)$/, '');
  for (const suffix of EXCLUDED_SUFFIXES) {
    if (nameWithoutExt.endsWith(suffix)) {
      return false;
    }
  }

  // 7. Check excluded patterns
  for (const pattern of EXCLUDED_CONTAINS) {
    if (lower.includes(pattern)) {
      return false;
    }
  }

  // 8. clients/* and generic/* - INCLUDE if passed all checks
  return true;
}

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
  if (dir.includes('crm') || lower.includes('crm') || lower.includes('geo-segment')) return 'lead-gen';

  return 'content';
}

function generateId(filename) {
  return filename
    .replace(/\.(cjs|js|mjs)$/, '')
    .replace(/[_]/g, '-')
    .toLowerCase();
}

function generateName(filename) {
  return filename
    .replace(/\.(cjs|js|mjs)$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function normalizePath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/').toLowerCase();
}

function scanAutomations() {
  const found = [];
  const excluded = [];

  const scanDir = (dir, relPath = '') => {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const itemRelPath = relPath ? path.join(relPath, item) : item;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!EXCLUDED_DIRS.includes(item)) {
          scanDir(fullPath, itemRelPath);
        }
      } else if (item.endsWith('.cjs') || item.endsWith('.js')) {
        if (isClientFacing(item, itemRelPath)) {
          found.push({
            filename: item,
            relPath: itemRelPath,
            category: detectCategory(item, itemRelPath)
          });
        } else {
          excluded.push(itemRelPath);
        }
      }
    }
  };

  scanDir(AUTOMATIONS_DIR);
  return { found, excluded };
}

function main() {
  console.log('🔍 Scanning for CLIENT-FACING automations only...\n');

  // Read existing registry
  let registry = { automations: [], categories: {} };
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    } catch (e) {
      console.error('⚠️ Could not read registry');
      process.exit(1);
    }
  }

  // Get existing script paths
  const existingPaths = new Set();
  for (const auto of registry.automations) {
    if (auto.script) {
      existingPaths.add(normalizePath(auto.script));
    }
  }
  const existingIds = new Set(registry.automations.map(a => a.id));

  // Scan
  const { found, excluded } = scanAutomations();

  console.log(`📊 SEGMENTATION RESULTS:`);
  console.log(`   ✅ Client-facing scripts: ${found.length}`);
  console.log(`   ❌ Internal tools excluded: ${excluded.length}\n`);

  // Show what was excluded
  if (excluded.length > 0) {
    console.log(`🚫 EXCLUDED (internal tools):`);
    excluded.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  // Find NEW automations
  let newCount = 0;
  for (const file of found) {
    const normalizedPath = normalizePath(file.relPath);

    if (existingPaths.has(normalizedPath)) {
      continue;
    }

    let id = generateId(file.filename);
    let counter = 1;
    while (existingIds.has(id)) {
      id = generateId(file.filename) + '-' + counter;
      counter++;
    }

    console.log(`   ✅ NEW: ${file.relPath}`);

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

  // Update counts
  registry.totalCount = registry.automations.length;

  const catCounts = {};
  for (const auto of registry.automations) {
    catCounts[auto.category] = (catCounts[auto.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts)) {
    if (registry.categories[cat]) {
      registry.categories[cat].count = count;
    }
  }

  registry.stats = registry.stats || {};
  registry.stats.withScript = registry.automations.filter(a => a.script).length;
  registry.stats.withoutScript = registry.automations.filter(a => !a.script).length;

  // Save
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  console.log(`\n📦 Registry: ${registry.totalCount} automations (${newCount} new)`);

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

  const voiceDir = path.dirname(VOICE_KB_PATH);
  if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true });
  fs.writeFileSync(VOICE_KB_PATH, JSON.stringify(voiceKB, null, 2));

  const catalogDir = path.dirname(CATALOG_PATH);
  if (!fs.existsSync(catalogDir)) fs.mkdirSync(catalogDir, { recursive: true });
  const catalog = {
    version: new Date().toISOString().split('T')[0],
    generated: new Date().toISOString(),
    count: registry.totalCount,
    categories: registry.categories,
    automations: registry.automations
  };
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

  console.log(`✅ Updated knowledge.json + catalog.json`);

  console.log('\n📊 BY CATEGORY:');
  for (const [cat, items] of Object.entries(grouped)) {
    console.log(`   ${cat}: ${items.length}`);
  }
  console.log(`\n🎯 TOTAL: ${registry.totalCount} client-facing automations`);
}

main();
