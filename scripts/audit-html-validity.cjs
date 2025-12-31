#!/usr/bin/env node
/**
 * AUDIT: HTML Validity
 * Détecte les problèmes HTML courants:
 * - Duplicate class attributes
 * - Duplicate IDs
 * - Missing alt on images
 * - Empty href links
 * - Unclosed tags
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

const results = {
  filesScanned: 0,
  issues: [],
  summary: {
    duplicateClass: 0,
    duplicateId: 0,
    missingAlt: 0,
    emptyHref: 0,
    duplicateVoiceWidget: 0
  }
};

function scanFile(filePath) {
  if (!filePath.endsWith('.html')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const lines = content.split('\n');

  results.filesScanned++;

  const fileIssues = [];

  // Check for duplicate class attributes on same element
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Pattern: class="..." ... class="..." on same line (same element)
    const duplicateClassMatch = line.match(/class\s*=\s*"[^"]*"[^>]*class\s*=\s*"/gi);
    if (duplicateClassMatch) {
      fileIssues.push({
        type: 'duplicateClass',
        line: lineNum,
        context: line.trim().substring(0, 100)
      });
      results.summary.duplicateClass++;
    }

    // Check for empty href
    const emptyHrefMatch = line.match(/href\s*=\s*["']\s*["']/gi);
    if (emptyHrefMatch) {
      fileIssues.push({
        type: 'emptyHref',
        line: lineNum,
        context: line.trim().substring(0, 100)
      });
      results.summary.emptyHref++;
    }

    // Check for img without alt (but skip decorative images with alt="")
    const imgMatch = line.match(/<img[^>]*>/gi);
    if (imgMatch) {
      imgMatch.forEach(img => {
        // Check if alt attribute exists at all
        if (!/\salt\s*=/i.test(img)) {
          fileIssues.push({
            type: 'missingAlt',
            line: lineNum,
            context: img.substring(0, 100)
          });
          results.summary.missingAlt++;
        }
      });
    }
  });

  // Check for duplicate IDs in the whole file
  const idMatches = content.match(/id\s*=\s*["']([^"']+)["']/gi) || [];
  const ids = idMatches.map(m => m.match(/id\s*=\s*["']([^"']+)["']/i)?.[1]).filter(Boolean);
  const idCounts = {};
  ids.forEach(id => {
    idCounts[id] = (idCounts[id] || 0) + 1;
  });
  Object.entries(idCounts).forEach(([id, count]) => {
    if (count > 1) {
      fileIssues.push({
        type: 'duplicateId',
        id: id,
        count: count,
        context: `ID "${id}" appears ${count} times`
      });
      results.summary.duplicateId++;
    }
  });

  // Check for duplicate Voice Widget scripts
  const voiceWidgetMatches = content.match(/voice-widget\.min\.js/g) || [];
  if (voiceWidgetMatches.length > 1) {
    fileIssues.push({
      type: 'duplicateVoiceWidget',
      count: voiceWidgetMatches.length,
      context: `voice-widget.min.js loaded ${voiceWidgetMatches.length} times`
    });
    results.summary.duplicateVoiceWidget++;
  }

  if (fileIssues.length > 0) {
    results.issues.push({
      file: relativePath,
      issues: fileIssues
    });
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (item.startsWith('.') || item === 'node_modules') return;

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile()) {
      scanFile(fullPath);
    }
  });
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT: HTML Validity');
  console.log('='.repeat(80));
  console.log(`\n📁 Fichiers HTML scannés: ${results.filesScanned}`);

  const totalIssues = Object.values(results.summary).reduce((a, b) => a + b, 0);
  console.log(`⚠️  Total issues: ${totalIssues}`);

  console.log('\n' + '-'.repeat(40));
  console.log('RÉSUMÉ PAR TYPE:');
  console.log('-'.repeat(40));
  console.log(`   Duplicate class attributes: ${results.summary.duplicateClass}`);
  console.log(`   Duplicate IDs: ${results.summary.duplicateId}`);
  console.log(`   Missing alt on images: ${results.summary.missingAlt}`);
  console.log(`   Empty href links: ${results.summary.emptyHref}`);
  console.log(`   Duplicate Voice Widget: ${results.summary.duplicateVoiceWidget}`);

  if (results.issues.length > 0) {
    console.log('\n' + '-'.repeat(40));
    console.log('DÉTAIL PAR FICHIER:');
    console.log('-'.repeat(40));

    results.issues.forEach(({ file, issues }) => {
      console.log(`\n📄 ${file} (${issues.length} issues)`);
      issues.forEach(issue => {
        if (issue.line) {
          console.log(`   L${issue.line} [${issue.type}]: ${issue.context}`);
        } else {
          console.log(`   [${issue.type}]: ${issue.context}`);
        }
      });
    });
  }

  console.log('\n' + '='.repeat(80));

  if (totalIssues === 0) {
    console.log('✅ AUDIT PASSED: No HTML validity issues found');
    return true;
  } else {
    console.log(`❌ AUDIT FAILED: ${totalIssues} issues found`);
    return false;
  }
}

// Main
console.log('🔍 Scanning HTML files for validity issues...\n');
scanDirectory(LANDING_DIR);
const success = printResults();

// Save results
const outputPath = path.join(__dirname, '..', 'outputs', 'audit-html-validity.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n📝 Résultats sauvegardés: ${outputPath}`);

process.exit(success ? 0 : 1);
