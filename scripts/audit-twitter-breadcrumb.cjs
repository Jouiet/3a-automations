#!/usr/bin/env node
/**
 * AUDIT: Twitter Cards + Breadcrumb Schema
 * Vérifie que TOUS les fichiers HTML ont:
 * - Twitter card meta tags complets
 * - BreadcrumbList schema (où applicable)
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Required Twitter meta tags
const TWITTER_REQUIRED = [
  { name: 'twitter:card', pattern: /<meta\s+(?:name|property)="twitter:card"/i },
  { name: 'twitter:title', pattern: /<meta\s+(?:name|property)="twitter:title"/i },
  { name: 'twitter:description', pattern: /<meta\s+(?:name|property)="twitter:description"/i },
  { name: 'twitter:image', pattern: /<meta\s+(?:name|property)="twitter:image"/i },
];

// Breadcrumb pattern
const BREADCRUMB_PATTERN = /"@type"\s*:\s*"BreadcrumbList"/i;

// Pages that SHOULD have breadcrumbs (not homepage)
const BREADCRUMB_REQUIRED_PATHS = [
  '/services/',
  '/blog/',
  '/legal/',
  '/en/services/',
  '/en/blog/',
  '/en/legal/',
];

const results = {
  filesScanned: 0,
  twitterIssues: [],
  breadcrumbIssues: [],
  details: {}
};

function scanFile(filePath) {
  if (!filePath.endsWith('.html')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  results.filesScanned++;

  // Skip academie (noindex pages) - these are client-only pages
  if (relativePath.includes('/academie') || relativePath.includes('/academy') ||
      relativePath.includes('academie.html') || relativePath.includes('academy.html')) {
    return;
  }

  const fileIssues = {
    twitter: [],
    breadcrumb: null
  };

  // Check Twitter meta tags
  TWITTER_REQUIRED.forEach(({ name, pattern }) => {
    if (!pattern.test(content)) {
      fileIssues.twitter.push(name);
    }
  });

  if (fileIssues.twitter.length > 0) {
    results.twitterIssues.push({
      file: relativePath,
      missing: fileIssues.twitter
    });
  }

  // Check breadcrumb (for applicable pages)
  const needsBreadcrumb = BREADCRUMB_REQUIRED_PATHS.some(p => relativePath.includes(p));

  if (needsBreadcrumb) {
    const hasBreadcrumb = BREADCRUMB_PATTERN.test(content);
    if (!hasBreadcrumb) {
      results.breadcrumbIssues.push({
        file: relativePath,
        issue: 'Missing BreadcrumbList schema'
      });
    }
  }

  if (fileIssues.twitter.length > 0 || (needsBreadcrumb && !BREADCRUMB_PATTERN.test(content))) {
    results.details[relativePath] = fileIssues;
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return;
  }

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
  console.log('📊 AUDIT: Twitter Cards + BreadcrumbList Schema');
  console.log('='.repeat(80));
  console.log(`\n📁 Fichiers HTML scannés: ${results.filesScanned}`);

  // Twitter Cards Results
  console.log('\n' + '-'.repeat(40));
  console.log('🐦 TWITTER CARDS:');
  console.log('-'.repeat(40));

  if (results.twitterIssues.length === 0) {
    console.log('✅ Tous les fichiers ont les Twitter cards complets');
  } else {
    console.log(`❌ ${results.twitterIssues.length} fichiers avec Twitter cards manquants:\n`);
    results.twitterIssues.forEach(issue => {
      console.log(`   📄 ${issue.file}`);
      console.log(`      Missing: ${issue.missing.join(', ')}`);
    });
  }

  // Breadcrumb Results
  console.log('\n' + '-'.repeat(40));
  console.log('🍞 BREADCRUMBLIST SCHEMA:');
  console.log('-'.repeat(40));

  if (results.breadcrumbIssues.length === 0) {
    console.log('✅ Toutes les pages requises ont BreadcrumbList');
  } else {
    console.log(`❌ ${results.breadcrumbIssues.length} pages sans BreadcrumbList:\n`);
    results.breadcrumbIssues.forEach(issue => {
      console.log(`   📄 ${issue.file}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // Summary
  const totalIssues = results.twitterIssues.length + results.breadcrumbIssues.length;
  if (totalIssues === 0) {
    console.log('✅ AUDIT PASSED: Twitter Cards + Breadcrumb OK');
    return true;
  } else {
    console.log(`❌ AUDIT FAILED: ${totalIssues} issues found`);
    return false;
  }
}

// Main
console.log('🔍 Scanning for Twitter Cards and BreadcrumbList...\n');
scanDirectory(LANDING_DIR);
const success = printResults();

// Save results
const outputPath = path.join(__dirname, '..', 'outputs', 'audit-twitter-breadcrumb.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n📝 Résultats sauvegardés: ${outputPath}`);

process.exit(success ? 0 : 1);
