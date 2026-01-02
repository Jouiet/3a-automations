#!/usr/bin/env node
/**
 * AUDIT FORENSIC - Détection systèmes simulés, vestiges, doublons
 * Date: 2026-01-01
 * Approche: Bottom-up factuelle
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const EXCLUDE_DIRS = ['node_modules', '.git', 'outputs', 'logs', '.next', 'dist', '.nuxt'];
const EXCLUDE_FILES = ['.DS_Store', 'package-lock.json', 'yarn.lock'];

// Patterns problématiques à détecter
const PROBLEMATIC_PATTERNS = {
  'TODO': /\bTODO\b/gi,
  'FIXME': /\bFIXME\b/gi,
  'PLACEHOLDER': /\bPLACEHOLDER\b/g,  // Case-sensitive to exclude HTML placeholder= attributes
  'MOCK': /\bMOCK\b/gi,
  'FAKE': /\bFAKE\b/gi,
  'STUB': /\bSTUB\b/gi,
  'DUMMY': /\bDUMMY\b/gi,
  'TO_BE_IMPLEMENTED': /TO.?BE.?IMPLEMENTED/gi,
  'NOT_IMPLEMENTED': /NOT.?IMPLEMENTED/gi,
  'HARDCODED': /\bHARDCODED\b/gi,
  'TEMP': /\bTEMP\b(?!late|orary)/gi,  // Exclude template/temporary
  'XXX': /\bXXX\b/g,
  'HACK': /\bHACK\b/gi,
  'DEPRECATED': /\bDEPRECATED\b/gi,
  'OBSOLETE': /\bOBSOLETE\b/gi,
  'LEGACY': /\bLEGACY\b/gi,
  'OLD': /\bOLD_/gi,  // OLD_ prefix
  'BACKUP': /\.bak$|\.backup$|\.old$|_backup\./i,
  'CONSOLE_LOG_DEBUG': /console\.log\s*\(\s*['"`]debug/gi,
  'LOREM_IPSUM': /lorem\s+ipsum/gi,
  'TEST_DATA': /test@test\.com|example@example\.com|john\.doe@/gi,
  'HARDCODED_KEYS': /['"]sk_live_|['"]pk_live_|['"]xai-[a-zA-Z0-9]{20,}/g,
  'SIMULATED': /\bSIMULATE[DS]?\b/gi,
  'SAMPLE': /\bSAMPLE_DATA\b/gi,
};

// Patterns de fichiers similaires (potentiellement dupliqués)
const DUPLICATE_SUSPECTS = {
  'resilient_variants': /-resilient\.cjs$|\.resilient\.cjs$/i,
  'backup_files': /\.bak$|\.backup$|\.old$|_backup\.|_old\./i,
  'versioned_files': /-v[0-9]+\.[a-z]+$|_v[0-9]+\.[a-z]+$/i,
  'test_variants': /\.test\.|_test\.|\.spec\.|_spec\./i,
  'poc_files': /-poc\.|_poc\./i,
};

// Résultats
const results = {
  problematicPatterns: [],
  duplicateFiles: [],
  parallelArchitectures: [],
  suspiciousFiles: [],
  fileHashes: new Map(),
  functionSignatures: new Map(),
  stats: {
    totalFiles: 0,
    scannedFiles: 0,
    issuesFound: 0,
  }
};

// Fonctions utilitaires
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

function extractFunctionSignatures(content, filePath) {
  const signatures = [];

  // JavaScript/CJS functions
  const funcPatterns = [
    /async\s+function\s+(\w+)\s*\([^)]*\)/g,
    /function\s+(\w+)\s*\([^)]*\)/g,
    /const\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>/g,
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
    /(\w+)\s*:\s*async\s*function\s*\([^)]*\)/g,
    /(\w+)\s*:\s*function\s*\([^)]*\)/g,
  ];

  for (const pattern of funcPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      signatures.push({
        name: match[1],
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }

  return signatures;
}

function scanFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Skip binary files
  if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.tar', '.gz'].includes(ext)) {
    return;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return;
  }

  results.stats.scannedFiles++;

  // 1. Check for problematic patterns
  for (const [patternName, regex] of Object.entries(PROBLEMATIC_PATTERNS)) {
    const matches = content.match(regex);
    if (matches) {
      // Get line numbers
      const lines = content.split('\n');
      const occurrences = [];

      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          occurrences.push({
            line: idx + 1,
            content: line.trim().substring(0, 100),
          });
        }
        // Reset regex lastIndex
        regex.lastIndex = 0;
      });

      if (occurrences.length > 0) {
        results.problematicPatterns.push({
          file: relativePath,
          pattern: patternName,
          count: matches.length,
          occurrences: occurrences.slice(0, 5), // Limit to 5
        });
        results.stats.issuesFound += matches.length;
      }
    }
    regex.lastIndex = 0; // Reset
  }

  // 2. Check for duplicate file suspects
  for (const [suspectType, pattern] of Object.entries(DUPLICATE_SUSPECTS)) {
    if (pattern.test(relativePath)) {
      results.suspiciousFiles.push({
        file: relativePath,
        type: suspectType,
      });
    }
  }

  // 3. Compute file hash for exact duplicate detection
  const hash = getFileHash(filePath);
  if (hash) {
    if (results.fileHashes.has(hash)) {
      results.duplicateFiles.push({
        file1: results.fileHashes.get(hash),
        file2: relativePath,
        type: 'EXACT_DUPLICATE',
      });
    } else {
      results.fileHashes.set(hash, relativePath);
    }
  }

  // 4. Extract function signatures for duplicate function detection
  if (['.js', '.cjs', '.mjs', '.ts'].includes(ext)) {
    const signatures = extractFunctionSignatures(content, relativePath);
    for (const sig of signatures) {
      const key = sig.name;
      if (results.functionSignatures.has(key)) {
        const existing = results.functionSignatures.get(key);
        // Only flag if in different files
        if (existing.file !== relativePath) {
          results.parallelArchitectures.push({
            functionName: key,
            locations: [
              { file: existing.file, line: existing.line },
              { file: relativePath, line: sig.line },
            ],
            type: 'DUPLICATE_FUNCTION_NAME',
          });
        }
      } else {
        results.functionSignatures.set(key, sig);
      }
    }
  }
}

function scanDirectory(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      if (!EXCLUDE_FILES.includes(entry.name)) {
        results.stats.totalFiles++;
        scanFile(fullPath);
      }
    }
  }
}

// Detect parallel architectures (multiple implementations of same feature)
function detectParallelArchitectures() {
  const featurePatterns = {
    'voice_widget': /voice[-_]?widget/i,
    'blog_generator': /blog[-_]?(generator|automation)/i,
    'email_automation': /email[-_]?(automation|personalization)/i,
    'whatsapp': /whatsapp[-_]?(booking|notification|automation)/i,
    'product_photos': /product[-_]?photos/i,
    'newsletter': /newsletter[-_]?automation/i,
    'uptime_monitor': /uptime[-_]?monitor/i,
    'lead_gen': /lead[-_]?(gen|generation)/i,
  };

  const featureFiles = {};

  // Scan all .cjs and .js files
  function findFeatureFiles(dirPath) {
    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
        findFeatureFiles(fullPath);
      } else if (entry.isFile() && ['.cjs', '.js'].includes(path.extname(entry.name))) {
        const relativePath = path.relative(ROOT_DIR, fullPath);

        for (const [feature, pattern] of Object.entries(featurePatterns)) {
          if (pattern.test(entry.name)) {
            if (!featureFiles[feature]) {
              featureFiles[feature] = [];
            }
            featureFiles[feature].push(relativePath);
          }
        }
      }
    }
  }

  findFeatureFiles(ROOT_DIR);

  // Check for multiple implementations
  for (const [feature, files] of Object.entries(featureFiles)) {
    if (files.length > 1) {
      results.parallelArchitectures.push({
        feature: feature,
        files: files,
        type: 'MULTIPLE_IMPLEMENTATIONS',
        count: files.length,
      });
    }
  }
}

// Detect n8n vs script redundancy
function detectN8nScriptRedundancy() {
  const n8nWorkflowsPath = path.join(ROOT_DIR, '.claude/rules/07-n8n-workflows.md');
  const scriptsPath = path.join(ROOT_DIR, 'automations/agency/core');

  if (!fs.existsSync(n8nWorkflowsPath) || !fs.existsSync(scriptsPath)) {
    return;
  }

  const n8nContent = fs.readFileSync(n8nWorkflowsPath, 'utf8');
  const scripts = fs.readdirSync(scriptsPath).filter(f => f.endsWith('.cjs'));

  // Check for documented n8n workflows that might overlap with scripts
  const n8nPatterns = [
    { name: 'blog', regex: /blog.*generator/i },
    { name: 'product_photos', regex: /product.*photos/i },
    { name: 'whatsapp', regex: /whatsapp/i },
    { name: 'voice', regex: /voice.*telephony|grok.*voice/i },
  ];

  for (const pattern of n8nPatterns) {
    const hasN8n = pattern.regex.test(n8nContent);
    const hasScript = scripts.some(s => pattern.regex.test(s));

    if (hasN8n && hasScript) {
      results.parallelArchitectures.push({
        feature: pattern.name,
        type: 'N8N_SCRIPT_REDUNDANCY',
        note: 'Both n8n workflow and native script exist for this feature',
      });
    }
  }
}

// Main execution
console.log('🔍 AUDIT FORENSIC - Architecture Analysis\n');
console.log('=' .repeat(60));
console.log(`Root: ${ROOT_DIR}`);
console.log(`Date: ${new Date().toISOString()}`);
console.log('=' .repeat(60) + '\n');

// Run scans
console.log('📁 Scanning files...');
scanDirectory(ROOT_DIR);

console.log('🏗️  Detecting parallel architectures...');
detectParallelArchitectures();

console.log('🔄 Checking n8n/script redundancy...');
detectN8nScriptRedundancy();

// Generate report
console.log('\n' + '=' .repeat(60));
console.log('📊 AUDIT RESULTS');
console.log('=' .repeat(60));

// Stats
console.log('\n📈 STATISTICS:');
console.log(`   Total files: ${results.stats.totalFiles}`);
console.log(`   Scanned files: ${results.stats.scannedFiles}`);
console.log(`   Issues found: ${results.stats.issuesFound}`);

// Problematic patterns
if (results.problematicPatterns.length > 0) {
  console.log('\n\n⚠️  PROBLEMATIC PATTERNS DETECTED:');
  console.log('-' .repeat(60));

  // Group by pattern type
  const grouped = {};
  for (const item of results.problematicPatterns) {
    if (!grouped[item.pattern]) {
      grouped[item.pattern] = [];
    }
    grouped[item.pattern].push(item);
  }

  for (const [pattern, items] of Object.entries(grouped)) {
    console.log(`\n   🔴 ${pattern} (${items.length} files, ${items.reduce((a, b) => a + b.count, 0)} occurrences):`);
    for (const item of items.slice(0, 10)) {
      console.log(`      - ${item.file} (${item.count}x)`);
      for (const occ of item.occurrences.slice(0, 2)) {
        console.log(`        L${occ.line}: ${occ.content.substring(0, 80)}...`);
      }
    }
    if (items.length > 10) {
      console.log(`      ... and ${items.length - 10} more files`);
    }
  }
}

// Exact duplicates
if (results.duplicateFiles.length > 0) {
  console.log('\n\n🔁 EXACT DUPLICATE FILES:');
  console.log('-' .repeat(60));
  for (const dup of results.duplicateFiles) {
    console.log(`   ${dup.file1}`);
    console.log(`   ↔ ${dup.file2}`);
    console.log('');
  }
}

// Suspicious files
if (results.suspiciousFiles.length > 0) {
  console.log('\n\n🕵️  SUSPICIOUS FILES (potential vestiges):');
  console.log('-' .repeat(60));

  const byType = {};
  for (const item of results.suspiciousFiles) {
    if (!byType[item.type]) {
      byType[item.type] = [];
    }
    byType[item.type].push(item.file);
  }

  for (const [type, files] of Object.entries(byType)) {
    console.log(`\n   📁 ${type} (${files.length}):`);
    for (const f of files.slice(0, 10)) {
      console.log(`      - ${f}`);
    }
    if (files.length > 10) {
      console.log(`      ... and ${files.length - 10} more`);
    }
  }
}

// Parallel architectures
if (results.parallelArchitectures.length > 0) {
  console.log('\n\n🏗️  PARALLEL ARCHITECTURES DETECTED:');
  console.log('-' .repeat(60));

  const multipleImpl = results.parallelArchitectures.filter(a => a.type === 'MULTIPLE_IMPLEMENTATIONS');
  const n8nRedundancy = results.parallelArchitectures.filter(a => a.type === 'N8N_SCRIPT_REDUNDANCY');
  const dupFunctions = results.parallelArchitectures.filter(a => a.type === 'DUPLICATE_FUNCTION_NAME');

  if (multipleImpl.length > 0) {
    console.log('\n   🔀 MULTIPLE IMPLEMENTATIONS OF SAME FEATURE:');
    for (const item of multipleImpl) {
      console.log(`      Feature: ${item.feature} (${item.count} implementations)`);
      for (const f of item.files) {
        console.log(`        - ${f}`);
      }
    }
  }

  if (n8nRedundancy.length > 0) {
    console.log('\n   ⚡ N8N + SCRIPT REDUNDANCY:');
    for (const item of n8nRedundancy) {
      console.log(`      Feature: ${item.feature}`);
      console.log(`      Note: ${item.note}`);
    }
  }

  if (dupFunctions.length > 0 && dupFunctions.length < 50) {
    console.log('\n   📝 DUPLICATE FUNCTION NAMES (potential conflicts):');
    for (const item of dupFunctions.slice(0, 20)) {
      console.log(`      Function: ${item.functionName}`);
      for (const loc of item.locations) {
        console.log(`        - ${loc.file}:${loc.line}`);
      }
    }
    if (dupFunctions.length > 20) {
      console.log(`      ... and ${dupFunctions.length - 20} more`);
    }
  }
}

// Summary
console.log('\n\n' + '=' .repeat(60));
console.log('📋 SUMMARY');
console.log('=' .repeat(60));

const criticalCount = results.problematicPatterns.filter(p =>
  ['TODO', 'PLACEHOLDER', 'MOCK', 'FAKE', 'STUB', 'NOT_IMPLEMENTED', 'TO_BE_IMPLEMENTED'].includes(p.pattern)
).length;

const warningCount = results.problematicPatterns.filter(p =>
  ['DEPRECATED', 'OBSOLETE', 'LEGACY', 'OLD', 'HACK'].includes(p.pattern)
).length;

console.log(`\n   🔴 CRITICAL (simulated/incomplete): ${criticalCount} files`);
console.log(`   🟡 WARNING (vestiges/legacy): ${warningCount} files`);
console.log(`   🔁 Exact duplicates: ${results.duplicateFiles.length} pairs`);
console.log(`   🕵️  Suspicious files: ${results.suspiciousFiles.length} files`);
console.log(`   🏗️  Parallel architectures: ${results.parallelArchitectures.filter(a => a.type === 'MULTIPLE_IMPLEMENTATIONS').length} features`);
console.log(`   ⚡ N8n/Script redundancy: ${results.parallelArchitectures.filter(a => a.type === 'N8N_SCRIPT_REDUNDANCY').length} features`);

// Exit code
const hasIssues = criticalCount > 0 || results.duplicateFiles.length > 0 ||
  results.parallelArchitectures.filter(a => a.type === 'MULTIPLE_IMPLEMENTATIONS').length > 0;

if (hasIssues) {
  console.log('\n\n❌ ISSUES DETECTED - Review required');

  // Save detailed report
  const reportPath = path.join(ROOT_DIR, 'outputs/audit-architecture-forensic.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const reportData = {
    timestamp: new Date().toISOString(),
    stats: results.stats,
    problematicPatterns: results.problematicPatterns,
    duplicateFiles: results.duplicateFiles,
    suspiciousFiles: results.suspiciousFiles,
    parallelArchitectures: results.parallelArchitectures.filter(a =>
      a.type !== 'DUPLICATE_FUNCTION_NAME' || a.locations.length > 1
    ),
  };

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);

  process.exit(1);
} else {
  console.log('\n\n✅ NO CRITICAL ISSUES DETECTED');
  process.exit(0);
}
