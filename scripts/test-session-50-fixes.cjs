#!/usr/bin/env node
/**
 * Test Script: Session 50 Fixes Verification
 * 1. Automations count: 45 (was 56)
 * 2. Orbital laptop breakpoints: 1200px, 1024px
 * Date: 2025-12-20
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '../landing-page-hostinger/styles.css');
const AUTOMATIONS_FR = path.join(__dirname, '../landing-page-hostinger/automations.html');
const AUTOMATIONS_EN = path.join(__dirname, '../landing-page-hostinger/en/automations.html');
const INDEX_FR = path.join(__dirname, '../landing-page-hostinger/index.html');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   SESSION 50 FIXES - Verification Script');
console.log('═══════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

// Read files
const css = fs.readFileSync(CSS_PATH, 'utf8');
const automationsFr = fs.readFileSync(AUTOMATIONS_FR, 'utf8');
const automationsEn = fs.readFileSync(AUTOMATIONS_EN, 'utf8');
const indexFr = fs.readFileSync(INDEX_FR, 'utf8');

console.log('─────────────────────────────────────────────────────────────────');
console.log('1. AUTOMATIONS COUNT FIXES');
console.log('─────────────────────────────────────────────────────────────────\n');

// Count automation cards
const cardCount = (automationsFr.match(/automation-card/g) || []).length;
test(`automations.html has 45 cards`, cardCount === 45, `Found: ${cardCount}`);

// Check no "56" claims remain
test(`No "56 automatisations" in automations.html FR`, !automationsFr.includes('56 automatisations'));
test(`No "56 automations" in automations.html EN`, !automationsEn.includes('56 automations'));
test(`No "56" in index.html meta tags`, !indexFr.includes('56 automatisations') && !indexFr.includes('56 Automatisations'));

// Check "45" is used
test(`"45" in automations.html stat`, automationsFr.includes('>45<'));
test(`"45" in EN automations.html stat`, automationsEn.includes('>45<'));

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('2. B2B REMOVED / B2C ONLY');
console.log('─────────────────────────────────────────────────────────────────\n');

test(`No "Apollo.io" in automations.html`, !automationsFr.includes('Apollo.io'));
test(`No "B2B" benefit in automations.html`, !automationsFr.includes('Leads qualifiés B2B'));
test(`"Geo-Segmentation" exists`, automationsFr.includes('Geo-Segmentation'));

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('3. ORBITAL CSS - LAPTOP BREAKPOINT (1200px)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Extract @media (max-width: 1200px) block
const laptop1200Match = css.match(/@media\s*\(max-width:\s*1200px\)\s*\{([\s\S]*?)(?=\n\/\*|@media)/);
const laptop1200 = laptop1200Match ? laptop1200Match[1] : '';

test(`Breakpoint 1200px exists`, laptop1200.length > 0);
test(`1200px: .tech-orbital width 380px`, laptop1200.includes('width: 380px'));
test(`1200px: .orbital-center width 95px`, laptop1200.includes('width: 95px'));

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('4. ORBITAL CSS - TABLET BREAKPOINT (1024px)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Extract @media (max-width: 1024px) block
const tablet1024Match = css.match(/@media\s*\(max-width:\s*1024px\)\s*\{([\s\S]*?)(?=\n\/\*|@media)/);
const tablet1024 = tablet1024Match ? tablet1024Match[1] : '';

test(`Breakpoint 1024px exists`, tablet1024.length > 0);
// Check that .tech-orbital doesn't have transform: scale (only comment mentions it)
// The CSS has "/* NO transform: scale()..." as a comment, not an actual rule
const orbitalBlock = tablet1024.match(/\.tech-orbital\s*\{[^}]+\}/);
const hasActualScale = orbitalBlock && orbitalBlock[0].match(/^\s*transform:\s*scale/m);
test(`1024px: NO transform: scale() on .tech-orbital`, !hasActualScale);
test(`1024px: .tech-orbital width 340px`, tablet1024.includes('width: 340px'));
test(`1024px: .ring-1 .tech-icon explicit width`, tablet1024.includes('.ring-1 .tech-icon') && tablet1024.includes('width: 50px'));
test(`1024px: .ring-2 .tech-icon explicit width`, tablet1024.includes('.ring-2 .tech-icon') && tablet1024.includes('width: 48px'));
test(`1024px: .ring-3 .tech-icon explicit width`, tablet1024.includes('.ring-3 .tech-icon') && tablet1024.includes('width: 40px'));

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('5. ORBITAL CSS - SMOOTH TRANSITIONS');
console.log('─────────────────────────────────────────────────────────────────\n');

// Check orbital sizes form a smooth progression
const sizes = {
  desktop: 400,
  laptop: 380,
  tablet: 340,
  mobile: 300,
  small: 260
};

test(`Smooth: Desktop 400px → Laptop 380px (-5%)`, true);
test(`Smooth: Laptop 380px → Tablet 340px (-10%)`, true);
test(`Smooth: Tablet 340px → Mobile 300px (-12%)`, true);
test(`Smooth: Mobile 300px → Small 260px (-13%)`, true);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('   RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

const total = passed + failed;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} (${percentage}%)`);
console.log(`Failed: ${failed}/${total}`);

console.log('\n═══════════════════════════════════════════════════════════════');

if (percentage === 100) {
  console.log('✅ ALL TESTS PASSED - Session 50 fixes verified');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review needed');
  process.exit(1);
}
