#!/usr/bin/env node
/**
 * ANALYSE FORENSIQUE - Chevauchement Orbital Ring-3
 * Calcule les positions exactes des icônes et détecte les chevauchements
 * Date: 2025-12-20
 */

// Configuration des breakpoints
const BREAKPOINTS = {
  desktop: { container: 400, ringPercent: 45, iconSize: 44 },
  '1200px': { container: 380, ringPercent: 45, iconSize: 42 },
  '1024px': { container: 340, ringPercent: 45, iconSize: 38 },
  '768px': { container: 300, ringPercent: 45, iconSize: 32 },
  '480px': { container: 250, ringPercent: 45, iconSize: 28 }
};

// Icônes ring-3 dans l'ordre HTML
const ICONS = [
  { name: 'GitHub', index: 0 },
  { name: 'Leonardo', index: 1 },
  { name: 'Kling', index: 2 },
  { name: 'Playwright', index: 3 },
  { name: 'DevTools', index: 4 },
  { name: 'WordPress', index: 5 },
  { name: 'Hostinger', index: 6 },
  { name: 'Apps Script', index: 7 }
];

// Positions CSS par breakpoint
// Les valeurs utilisent le système CSS avec top/left/right/bottom
const POSITIONS_BY_BREAKPOINT = {
  desktop: {
    0: { type: 'cardinal', top: -22, left: '50%' },           // GitHub - top center
    1: { type: 'diagonal', top: '5%', right: '-5%' },         // Leonardo - upper right
    2: { type: 'cardinal', top: '50%', right: -22 },          // Kling - right
    3: { type: 'diagonal', bottom: '5%', right: '-5%' },      // Playwright - lower right
    4: { type: 'cardinal', bottom: -22, left: '50%' },        // DevTools - bottom
    5: { type: 'diagonal', bottom: '5%', left: '-5%' },       // WordPress - lower left
    6: { type: 'cardinal', top: '50%', left: -22 },           // Hostinger - left
    7: { type: 'diagonal', top: '5%', left: '-5%' }           // Apps Script - upper left
  },
  '1200px': {
    0: { type: 'cardinal', top: -21, left: '50%' },           // GitHub
    1: { type: 'diagonal', top: '8%', right: '0%' },          // Leonardo - FIXED
    2: { type: 'cardinal', top: '50%', right: -21 },          // Kling
    3: { type: 'diagonal', bottom: '8%', right: '0%' },       // Playwright - FIXED
    4: { type: 'cardinal', bottom: -21, left: '50%' },        // DevTools
    5: { type: 'diagonal', bottom: '8%', left: '0%' },        // WordPress - FIXED
    6: { type: 'cardinal', top: '50%', left: -21 },           // Hostinger
    7: { type: 'diagonal', top: '8%', left: '0%' }            // Apps Script - FIXED
  },
  '1024px': {
    0: { type: 'cardinal', top: -19, left: '50%' },           // GitHub
    1: { type: 'diagonal', top: '10%', right: '2%' },         // Leonardo - FIXED
    2: { type: 'cardinal', top: '50%', right: -19 },          // Kling
    3: { type: 'diagonal', bottom: '10%', right: '2%' },      // Playwright - FIXED
    4: { type: 'cardinal', bottom: -19, left: '50%' },        // DevTools
    5: { type: 'diagonal', bottom: '10%', left: '2%' },       // WordPress - FIXED
    6: { type: 'cardinal', top: '50%', left: -19 },           // Hostinger
    7: { type: 'diagonal', top: '10%', left: '2%' }           // Apps Script - FIXED
  }
};

// Fonction pour convertir les positions CSS en coordonnées absolues
function getAbsolutePosition(pos, ringSize, iconSize, containerSize) {
  // Le ring est centré dans le container
  const ringOffset = (containerSize - ringSize) / 2;

  let x, y;

  if (pos.type === 'cardinal') {
    // Positions cardinales: sur les axes
    if (pos.top !== undefined) {
      if (typeof pos.top === 'number') {
        y = ringOffset + pos.top;
      } else if (pos.top === '50%') {
        y = containerSize / 2;
      }
    }
    if (pos.bottom !== undefined) {
      if (typeof pos.bottom === 'number') {
        y = containerSize - ringOffset + pos.bottom;
      } else if (pos.bottom === '50%') {
        y = containerSize / 2;
      }
    }
    if (pos.left !== undefined) {
      if (typeof pos.left === 'number') {
        x = ringOffset + pos.left;
      } else if (pos.left === '50%') {
        x = containerSize / 2;
      }
    }
    if (pos.right !== undefined) {
      if (typeof pos.right === 'number') {
        x = containerSize - ringOffset + pos.right;
      } else if (pos.right === '50%') {
        x = containerSize / 2;
      }
    }
  } else {
    // Positions diagonales: pourcentages du ring
    if (pos.top !== undefined && typeof pos.top === 'string') {
      const percent = parseFloat(pos.top) / 100;
      y = ringOffset + (ringSize * percent);
    }
    if (pos.bottom !== undefined && typeof pos.bottom === 'string') {
      const percent = parseFloat(pos.bottom) / 100;
      y = ringOffset + ringSize - (ringSize * percent);
    }
    if (pos.left !== undefined && typeof pos.left === 'string') {
      const percent = parseFloat(pos.left) / 100;
      x = ringOffset + (ringSize * percent);
    }
    if (pos.right !== undefined && typeof pos.right === 'string') {
      const percent = parseFloat(pos.right) / 100;
      x = ringOffset + ringSize - (ringSize * percent);
    }
  }

  // Centrer l'icône sur la position
  return {
    x: x - iconSize / 2,
    y: y - iconSize / 2,
    centerX: x,
    centerY: y
  };
}

// Fonction pour calculer la distance entre deux icônes
function getDistance(pos1, pos2) {
  const dx = pos1.centerX - pos2.centerX;
  const dy = pos1.centerY - pos2.centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Fonction pour détecter le chevauchement
function detectOverlap(pos1, pos2, iconSize) {
  const distance = getDistance(pos1, pos2);
  const minDistance = iconSize; // Les centres doivent être au moins à iconSize de distance
  const overlap = minDistance - distance;
  return {
    distance: distance.toFixed(1),
    minRequired: iconSize,
    overlapping: overlap > 0,
    overlapAmount: overlap > 0 ? overlap.toFixed(1) : 0
  };
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  ANALYSE FORENSIQUE - Chevauchement Orbital Ring-3');
console.log('  Date: ' + new Date().toISOString());
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Analyser chaque breakpoint
for (const [breakpoint, config] of Object.entries(BREAKPOINTS)) {
  const ringSize = config.container * (config.ringPercent / 100);
  const iconSize = config.iconSize;

  console.log(`📐 BREAKPOINT: ${breakpoint}`);
  console.log(`   Container: ${config.container}px, Ring: ${ringSize.toFixed(1)}px, Icons: ${iconSize}px`);
  console.log('─'.repeat(60));

  // Calculer les positions absolues (utiliser positions du breakpoint ou desktop par défaut)
  const positions = POSITIONS_BY_BREAKPOINT[breakpoint] || POSITIONS_BY_BREAKPOINT.desktop;
  const absolutePositions = {};
  for (let i = 0; i < 8; i++) {
    absolutePositions[i] = getAbsolutePosition(positions[i], ringSize, iconSize, config.container);
  }

  // Afficher les positions
  console.log('   Positions (centre):');
  for (const icon of ICONS) {
    const pos = absolutePositions[icon.index];
    console.log(`   ${icon.index}: ${icon.name.padEnd(12)} → center: (${pos.centerX.toFixed(1)}, ${pos.centerY.toFixed(1)})`);
  }

  console.log('');
  console.log('   Paires à risque:');

  // Vérifier les paires adjacentes
  const pairs = [
    [2, 3, 'Kling', 'Playwright'],
    [5, 6, 'WordPress', 'Hostinger'],
    [1, 2, 'Leonardo', 'Kling'],
    [3, 4, 'Playwright', 'DevTools'],
    [4, 5, 'DevTools', 'WordPress'],
    [6, 7, 'Hostinger', 'Apps Script']
  ];

  let hasOverlap = false;
  for (const [i, j, name1, name2] of pairs) {
    const overlap = detectOverlap(absolutePositions[i], absolutePositions[j], iconSize);
    if (overlap.overlapping) {
      console.log(`   ❌ ${name1} ↔ ${name2}: OVERLAP ${overlap.overlapAmount}px (dist: ${overlap.distance}px, min: ${overlap.minRequired}px)`);
      hasOverlap = true;
    } else {
      console.log(`   ✅ ${name1} ↔ ${name2}: OK (dist: ${overlap.distance}px, min: ${overlap.minRequired}px)`);
    }
  }

  console.log('');
}

// Calcul des positions idéales pour 8 icônes sur un cercle
console.log('═══════════════════════════════════════════════════════════════');
console.log('  POSITIONS IDÉALES (8 icônes uniformément espacées)');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

for (const [breakpoint, config] of Object.entries(BREAKPOINTS)) {
  const ringSize = config.container * (config.ringPercent / 100);
  const iconSize = config.iconSize;
  const radius = ringSize / 2;
  const containerCenter = config.container / 2;

  console.log(`📐 ${breakpoint}: Ring ${ringSize.toFixed(1)}px, Rayon ${radius.toFixed(1)}px`);

  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 - 90) * Math.PI / 180; // -90° pour commencer en haut
    const x = containerCenter + radius * Math.cos(angle);
    const y = containerCenter + radius * Math.sin(angle);
    console.log(`   ${i}: angle ${i * 45}° → center: (${x.toFixed(1)}, ${y.toFixed(1)})`);
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  DIAGNOSTIC');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('PROBLÈME IDENTIFIÉ:');
console.log('Les positions diagonales (2, 4, 6, 8) utilisent des pourcentages');
console.log('qui ne correspondent pas à des angles de 45° sur le cercle.');
console.log('');
console.log('SOLUTION RECOMMANDÉE:');
console.log('Recalculer les positions diagonales pour respecter la géométrie');
console.log('circulaire avec un espacement de 45° entre chaque icône.');
console.log('');
