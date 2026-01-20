#!/usr/bin/env node
/**
 * Test Script: Orbital Mobile UX Verification
 * Verifies CSS rules for mobile orbital animation
 * Date: 2025-12-20
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '../landing-page-hostinger/styles.css');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   ORBITAL MOBILE UX - Verification Script');
console.log('═══════════════════════════════════════════════════════════════\n');

// Read CSS file
let css;
try {
  css = fs.readFileSync(CSS_PATH, 'utf8');
} catch (err) {
  console.error('❌ Cannot read CSS file:', err.message);
  process.exit(1);
}

const tests = [];
let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
  tests.push({ name, passed: condition, details });
}

// Extract ALL @media (max-width: 768px) blocks
const mobile768Regex = /@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)(?=\n\/\*|@media|$)/g;
let mobile768 = '';
let match768;
while ((match768 = mobile768Regex.exec(css)) !== null) {
  mobile768 += match768[1] + '\n';
}

// Extract ALL @media (max-width: 480px) blocks
const mobile480Regex = /@media\s*\(max-width:\s*480px\)\s*\{([\s\S]*?)(?=\n\/\*|@media|$)/g;
let mobile480 = '';
let match480;
while ((match480 = mobile480Regex.exec(css)) !== null) {
  mobile480 += match480[1] + '\n';
}

// Extract prefers-reduced-motion block
const reducedMotionMatch = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
const reducedMotion = reducedMotionMatch ? reducedMotionMatch[1] : '';

console.log('─────────────────────────────────────────────────────────────────');
console.log('1. TOUCH TARGETS (min 48px - comfortable touch)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Test 1: Touch targets in 768px - upgraded to 48px
test(
  'Mobile 768px: min-height 48px for .tech-icon',
  mobile768.includes('min-height: 48px') || mobile768.includes('min-height:48px'),
  'Comfortable touch target (48px)'
);

test(
  'Mobile 768px: min-width 48px for .tech-icon',
  mobile768.includes('min-width: 48px') || mobile768.includes('min-width:48px'),
  'Touch target width (48px)'
);

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('2. TEXT READABILITY (0.85rem / 14px for clear visibility)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Test 2: Text readability - larger text
test(
  'Mobile 768px: font-size 0.85rem for .tech-icon span',
  mobile768.includes('font-size: 0.85rem') || mobile768.includes('font-size:0.85rem'),
  'Clearly readable size is 14px (0.85rem)'
);

// Check NO 0.5rem in mobile768 for tech-icon
test(
  'Mobile 768px: NO font-size 0.5rem (too small)',
  !mobile768.includes('font-size: 0.5rem'),
  '0.5rem (8px) is below WCAG minimum'
);

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('3. RING-3 HIDDEN (overlap prevention)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Test 3: Ring-3 hidden
test(
  'Mobile 768px: .ring-3 display: none',
  mobile768.includes('.ring-3') && mobile768.includes('display: none'),
  'Ring-3 causes overlap on mobile - should be hidden'
);

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('4. BREAKPOINT 480px (small mobile - 320px viewport)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Test 4: 480px breakpoint for orbital
test(
  'Mobile 480px: .tech-orbital defined',
  mobile480.includes('.tech-orbital'),
  'Must have orbital rules for small screens'
);

test(
  'Mobile 480px: orbital width 260px',
  mobile480.includes('width: 260px') || mobile480.includes('width:260px'),
  'Viewport 320px - 32px padding = 288px available, 260px fits'
);

test(
  'Mobile 480px: .hero-visual max-width defined',
  mobile480.includes('.hero-visual') && (mobile480.includes('max-width: 260px') || mobile480.includes('max-width:260px')),
  'Prevents overflow on small screens'
);

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('5. PREFERS-REDUCED-MOTION (accessibility)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Test 5: Reduced motion
test(
  'Reduced motion: .orbital-ring animation: none',
  reducedMotion.includes('.orbital-ring') || reducedMotion.includes('.ring-1'),
  'Must disable orbital animation'
);

test(
  'Reduced motion: .tech-icon animation: none',
  reducedMotion.includes('.tech-icon'),
  'Must disable counter-rotation'
);

test(
  'Reduced motion: .center-pulse animation: none',
  reducedMotion.includes('.center-pulse'),
  'Must disable pulse animation'
);

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('6. ANIMATION PERFORMANCE (slower on mobile)');
console.log('─────────────────────────────────────────────────────────────────\n');

// Test 6: Slower animation on mobile
test(
  'Mobile 768px: animation-duration increased for .ring-1',
  mobile768.includes('animation-duration: 45s') || mobile768.includes('animation-duration:45s'),
  'Slower rotation reduces distraction (30s -> 45s)'
);

test(
  'Mobile 768px: animation-duration increased for .ring-2',
  mobile768.includes('animation-duration: 35s') || mobile768.includes('animation-duration:35s'),
  'Slower rotation reduces distraction (20s -> 35s)'
);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('   RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

const total = passed + failed;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} (${percentage}%)`);
console.log(`Failed: ${failed}/${total}`);

if (failed > 0) {
  console.log('\n⚠️  FAILED TESTS:');
  tests.filter(t => !t.passed).forEach(t => {
    console.log(`   - ${t.name}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════════');

if (percentage === 100) {
  console.log('✅ ALL TESTS PASSED - Orbital Mobile UX is optimized');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review CSS modifications');
  process.exit(1);
}
