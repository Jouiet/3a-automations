#!/usr/bin/env node
/**
 * FORENSIC ORBITAL TEST - Complete verification
 * Validates all breakpoints and positioning
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '../landing-page-hostinger/styles.css');
const css = fs.readFileSync(CSS_PATH, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   ORBITAL FORENSIC TEST - Complete Verification');
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

function extractMediaQuery(css, width) {
  const regex = new RegExp(`@media\\s*\\(max-width:\\s*${width}px\\)\\s*\\{([\\s\\S]*?)(?=\\n\\/\\*|@media|$)`);
  const match = css.match(regex);
  return match ? match[1] : '';
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE CSS TESTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('─────────────────────────────────────────────────────────────────');
console.log('1. BASE CSS (Desktop)');
console.log('─────────────────────────────────────────────────────────────────\n');

test('hero-visual: 500px height', css.includes('.hero-visual {') && css.includes('height: 500px'));
test('tech-orbital: 400px', css.includes('.tech-orbital {') && css.includes('width: 400px'));
test('orbital-center: 100px', css.includes('.orbital-center {') && css.includes('width: 100px'));
test('tech-icon base: 52px', css.includes('.tech-icon {') && css.includes('width: 52px'));
test('ring-1 position: top: -26px', css.includes('.ring-1 .tech-icon:nth-child(1) { top: -26px'));
test('ring-3 icon: 44px', css.includes('.ring-3 .tech-icon { width: 44px'));

// ═══════════════════════════════════════════════════════════════════════════
// 1200px LAPTOP TESTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─────────────────────────────────────────────────────────────────');
console.log('2. LAPTOP (1200px)');
console.log('─────────────────────────────────────────────────────────────────\n');

const laptop = extractMediaQuery(css, 1200);

test('1200px: hero-visual 450px', laptop.includes('height: 450px'));
test('1200px: tech-orbital 380px', laptop.includes('width: 380px'));
test('1200px: orbital margin 35px', laptop.includes('margin: 35px auto'));
test('1200px: ring-1 icons 50px', laptop.includes('.ring-1 .tech-icon') && laptop.includes('width: 50px'));
test('1200px: ring-1 position top: -25px', laptop.includes('.ring-1 .tech-icon:nth-child(1) { top: -25px'));
test('1200px: ring-2 position top: -24px', laptop.includes('.ring-2 .tech-icon:nth-child(1) { top: -24px'));
test('1200px: ring-3 position top: -21px', laptop.includes('.ring-3 .tech-icon:nth-child(1) { top: -21px'));

// ═══════════════════════════════════════════════════════════════════════════
// 1024px TABLET TESTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─────────────────────────────────────────────────────────────────');
console.log('3. TABLET (1024px)');
console.log('─────────────────────────────────────────────────────────────────\n');

const tablet = extractMediaQuery(css, 1024);

test('1024px: hero-visual 390px', tablet.includes('height: 390px'));
test('1024px: tech-orbital 340px', tablet.includes('width: 340px'));
test('1024px: orbital margin 25px', tablet.includes('margin: 25px auto'));
test('1024px: ring-1 icons 48px', tablet.includes('.ring-1 .tech-icon') && tablet.includes('width: 48px'));
test('1024px: ring-1 position top: -24px', tablet.includes('.ring-1 .tech-icon:nth-child(1) { top: -24px'));
test('1024px: ring-2 position top: -22px', tablet.includes('.ring-2 .tech-icon:nth-child(1) { top: -22px'));
test('1024px: ring-3 position top: -19px', tablet.includes('.ring-3 .tech-icon:nth-child(1) { top: -19px'));
const tabletHasOverflowRule = /\.hero-visual\s*\{[^}]*overflow:\s*hidden/i.test(tablet);
test('1024px: NO overflow:hidden', !tabletHasOverflowRule);

// ═══════════════════════════════════════════════════════════════════════════
// 768px MOBILE TESTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─────────────────────────────────────────────────────────────────');
console.log('4. MOBILE (768px)');
console.log('─────────────────────────────────────────────────────────────────\n');

const mobile = extractMediaQuery(css, 768);

test('768px: hero-visual 350px', mobile.includes('height: 350px'));
test('768px: tech-orbital 300px', mobile.includes('width: 300px'));
// Check that there's no actual overflow:hidden rule (comments don't count)
const mobileHasOverflowRule = /\.hero-visual\s*\{[^}]*overflow:\s*hidden/i.test(mobile);
test('768px: NO overflow:hidden rule', !mobileHasOverflowRule);
test('768px: ring-1 icons 44px', mobile.includes('.ring-1 .tech-icon') && mobile.includes('width: 44px'));
test('768px: ring-1 position top: -22px', mobile.includes('.ring-1 .tech-icon:nth-child(1) { top: -22px'));
test('768px: ring-2 icons 40px', mobile.includes('.ring-2 .tech-icon') && mobile.includes('width: 40px'));
test('768px: ring-2 position top: -20px', mobile.includes('.ring-2 .tech-icon:nth-child(1) { top: -20px'));
test('768px: ring-3 visible (display: block)', mobile.includes('.ring-3') && mobile.includes('display: block'));
test('768px: ring-3 icons 32px', mobile.includes('.ring-3 .tech-icon') && mobile.includes('width: 32px'));
test('768px: ring-3 position top: -16px', mobile.includes('.ring-3 .tech-icon:nth-child(1) { top: -16px'));
test('768px: ring-1 animation 50s', mobile.includes('.ring-1') && mobile.includes('animation-duration: 50s'));
test('768px: ring-2 animation 40s', mobile.includes('.ring-2') && mobile.includes('animation-duration: 40s'));
test('768px: ring-3 animation 30s', mobile.includes('.ring-3') && mobile.includes('animation-duration: 30s'));
test('768px: ring-3 icon animation synced (30s)', mobile.includes('.ring-3 .tech-icon') && mobile.includes('animation-duration: 30s'));

// ═══════════════════════════════════════════════════════════════════════════
// 480px SMALL MOBILE TESTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─────────────────────────────────────────────────────────────────');
console.log('5. SMALL MOBILE (480px)');
console.log('─────────────────────────────────────────────────────────────────\n');

const smallMobile = extractMediaQuery(css, 480);

test('480px: hero-visual 290px', smallMobile.includes('height: 290px'));
test('480px: tech-orbital 250px', smallMobile.includes('width: 250px'));
const smallMobileHasOverflowRule = /\.hero-visual\s*\{[^}]*overflow:\s*hidden/i.test(smallMobile);
test('480px: NO overflow:hidden', !smallMobileHasOverflowRule);
test('480px: ring-1 icons 38px', smallMobile.includes('.ring-1 .tech-icon') && smallMobile.includes('width: 38px'));
test('480px: ring-1 position top: -19px', smallMobile.includes('.ring-1 .tech-icon:nth-child(1) { top: -19px'));
test('480px: ring-2 icons 34px', smallMobile.includes('.ring-2 .tech-icon') && smallMobile.includes('width: 34px'));
test('480px: ring-3 icons 28px', smallMobile.includes('.ring-3 .tech-icon') && smallMobile.includes('width: 28px'));
test('480px: ring-3 position top: -14px', smallMobile.includes('.ring-3 .tech-icon:nth-child(1) { top: -14px'));

// ═══════════════════════════════════════════════════════════════════════════
// OVERFLOW MARGIN CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n─────────────────────────────────────────────────────────────────');
console.log('6. OVERFLOW MARGIN VERIFICATION');
console.log('─────────────────────────────────────────────────────────────────\n');

const breakpoints = [
  { name: 'Desktop', container: 500, orbital: 400, iconMax: 52 },
  { name: '1200px', container: 450, orbital: 380, iconMax: 50 },
  { name: '1024px', container: 390, orbital: 340, iconMax: 48 },
  { name: '768px', container: 350, orbital: 300, iconMax: 44 },
  { name: '480px', container: 290, orbital: 250, iconMax: 38 },
];

breakpoints.forEach(bp => {
  const margin = (bp.container - bp.orbital) / 2;
  const overflow = bp.iconMax / 2;
  const ok = margin >= overflow;
  test(
    `${bp.name}: margin ${margin}px >= overflow ${overflow}px`,
    ok,
    ok ? '' : `PROBLEM: Need ${overflow}px but only have ${margin}px!`
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('   RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

const total = passed + failed;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} (${percentage}%)`);
console.log(`Failed: ${failed}/${total}`);

console.log('\n═══════════════════════════════════════════════════════════════');

if (percentage === 100) {
  console.log('✅ ALL TESTS PASSED - Orbital forensic fix verified');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review needed');
  process.exit(1);
}
