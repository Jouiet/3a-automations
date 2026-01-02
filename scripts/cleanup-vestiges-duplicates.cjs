#!/usr/bin/env node
/**
 * CLEANUP VESTIGES & DUPLICATES
 * Date: 2026-01-01
 * Based on forensic audit results
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

console.log('🧹 CLEANUP VESTIGES & DUPLICATES\n');
console.log('=' .repeat(60));
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'EXECUTE'}`);
console.log('=' .repeat(60) + '\n');

const actions = [];

// ============================================
// 1. FILES TO DELETE (vestiges)
// ============================================
const FILES_TO_DELETE = [
  // Unused logo (exact duplicate of anthropic.svg, not referenced anywhere)
  'landing-page-hostinger/assets/logos/claude.svg',

  // Note: Python cache and voice-api folder will be deleted recursively in step 3
];

// ============================================
// 2. V2 CONSOLIDATION (rename v2 to v1, delete old v1)
// ============================================
const V2_CONSOLIDATIONS = [
  {
    v1: 'scripts/fix-gtm-lazy-load.cjs',
    v2: 'scripts/fix-gtm-lazy-load-v2.cjs',
    action: 'keep_v2_as_primary' // v2 is newer, delete v1, rename v2
  },
  {
    v1: 'automations/generic/forms/google-apps-script-form-handler.gs',
    v2: 'automations/generic/forms/google-apps-script-form-handler-v2.gs',
    action: 'keep_v2_as_primary'
  },
  {
    v1: 'automations/templates/klaviyo/audit-klaviyo-flows.cjs',
    v2: 'automations/templates/klaviyo/audit-klaviyo-flows-v2.cjs',
    action: 'keep_v1_delete_v2' // v1 is slightly larger/possibly more complete
  },
  {
    v1: 'dashboard/google-apps-script/dashboard-api.txt',
    v2: 'dashboard/google-apps-script/dashboard-api-v2.txt',
    action: 'keep_both_for_now' // Need to verify which is active
  },
];

// ============================================
// 3. DIRECTORIES TO CLEAN (recursive delete)
// ============================================
const DIRS_TO_DELETE = [
  'automations/agency/core/__pycache__',
  'automations/agency/core/voice-api', // Older version of voice-api-resilient + Docker config not used
];

// ============================================
// Execute
// ============================================

// Step 1: Delete vestige files
console.log('\n📁 STEP 1: Delete vestige files');
console.log('-' .repeat(40));

for (const file of FILES_TO_DELETE) {
  const fullPath = path.join(ROOT, file);
  if (fs.existsSync(fullPath)) {
    actions.push({ type: 'DELETE', path: file });
    console.log(`   🗑️  ${file}`);
    if (!DRY_RUN) {
      fs.unlinkSync(fullPath);
    }
  } else {
    console.log(`   ⏭️  ${file} (not found, skipping)`);
  }
}

// Step 2: V2 consolidations
console.log('\n📁 STEP 2: V2 Consolidations');
console.log('-' .repeat(40));

for (const { v1, v2, action } of V2_CONSOLIDATIONS) {
  const v1Path = path.join(ROOT, v1);
  const v2Path = path.join(ROOT, v2);

  const v1Exists = fs.existsSync(v1Path);
  const v2Exists = fs.existsSync(v2Path);

  console.log(`\n   ${path.basename(v2)}:`);

  if (action === 'keep_v2_as_primary') {
    if (v2Exists && v1Exists) {
      actions.push({ type: 'DELETE_V1', path: v1 });
      actions.push({ type: 'RENAME_V2_TO_V1', from: v2, to: v1 });
      console.log(`      🗑️  Delete ${v1}`);
      console.log(`      📝 Rename ${v2} → ${v1}`);
      if (!DRY_RUN) {
        fs.unlinkSync(v1Path);
        fs.renameSync(v2Path, v1Path);
      }
    } else if (v2Exists) {
      actions.push({ type: 'RENAME_V2_TO_V1', from: v2, to: v1 });
      console.log(`      📝 Rename ${v2} → ${v1}`);
      if (!DRY_RUN) {
        fs.renameSync(v2Path, v1Path);
      }
    }
  } else if (action === 'keep_v1_delete_v2') {
    if (v2Exists) {
      actions.push({ type: 'DELETE_V2', path: v2 });
      console.log(`      🗑️  Delete ${v2} (keeping ${v1})`);
      if (!DRY_RUN) {
        fs.unlinkSync(v2Path);
      }
    }
  } else if (action === 'keep_both_for_now') {
    console.log(`      ⏸️  Keep both (manual review needed)`);
  }
}

// Step 3: Delete vestige directories (recursive)
console.log('\n📁 STEP 3: Delete vestige directories (recursive)');
console.log('-' .repeat(40));

function deleteRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      deleteRecursive(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dirPath);
}

for (const dir of DIRS_TO_DELETE) {
  const fullPath = path.join(ROOT, dir);
  if (fs.existsSync(fullPath)) {
    try {
      const contents = fs.readdirSync(fullPath);
      actions.push({ type: 'RMDIR', path: dir, contents: contents.length });
      console.log(`   🗑️  ${dir} (${contents.length} files)`);
      if (!DRY_RUN) {
        deleteRecursive(fullPath);
      }
    } catch (e) {
      console.log(`   ❌ ${dir}: ${e.message}`);
    }
  } else {
    console.log(`   ⏭️  ${dir} (not found)`);
  }
}

// Step 4: Fix flow.svg title
console.log('\n📁 STEP 4: Fix SVG titles');
console.log('-' .repeat(40));

const flowSvgPath = path.join(ROOT, 'landing-page-hostinger/assets/logos/flow.svg');
if (fs.existsSync(flowSvgPath)) {
  let content = fs.readFileSync(flowSvgPath, 'utf8');
  if (content.includes('<title>Shopify</title>')) {
    actions.push({ type: 'FIX_SVG', path: 'landing-page-hostinger/assets/logos/flow.svg' });
    console.log('   📝 Fixing flow.svg title: Shopify → Shopify Flow');
    if (!DRY_RUN) {
      content = content.replace('<title>Shopify</title>', '<title>Shopify Flow</title>');
      fs.writeFileSync(flowSvgPath, content);
    }
  } else {
    console.log('   ✅ flow.svg title already correct');
  }
}

// Summary
console.log('\n\n' + '=' .repeat(60));
console.log('📋 SUMMARY');
console.log('=' .repeat(60));
console.log(`\n   Total actions: ${actions.length}`);
console.log(`   - DELETE: ${actions.filter(a => a.type.includes('DELETE')).length}`);
console.log(`   - RENAME: ${actions.filter(a => a.type.includes('RENAME')).length}`);
console.log(`   - FIX: ${actions.filter(a => a.type.includes('FIX')).length}`);
console.log(`   - RMDIR: ${actions.filter(a => a.type === 'RMDIR').length}`);

if (DRY_RUN) {
  console.log('\n\n⚠️  DRY RUN - No changes made');
  console.log('   Run without --dry-run to execute');
} else {
  console.log('\n\n✅ CLEANUP COMPLETE');
}

// Exit
process.exit(0);
