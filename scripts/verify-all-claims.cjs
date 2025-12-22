#!/usr/bin/env node
/**
 * VÉRIFICATION FACTUELLE DE TOUTES LES CLAIMS
 * Audit exhaustif des statistiques affichées sur le site
 * Date: 2025-12-20
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  VÉRIFICATION FACTUELLE - TOUTES LES CLAIMS DU SITE');
console.log('  Date: ' + new Date().toISOString());
console.log('═══════════════════════════════════════════════════════════════\n');

const AUTOMATIONS_DIR = '/Users/mac/Desktop/JO-AAA/automations';
const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

function countFiles(dir, ext) {
  let count = 0;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        count += countFiles(fullPath, ext);
      } else if (item.endsWith(ext)) {
        count++;
      }
    }
  } catch (e) {}
  return count;
}

// 1. AUTOMATISATIONS
console.log('1. AUTOMATISATIONS');
console.log('─'.repeat(60));
const automationCount = countFiles(AUTOMATIONS_DIR, '.cjs');
const claim1 = 56;
const status1 = automationCount >= claim1 ? '✅' : '❌';
console.log(`   Claim:   ${claim1}`);
console.log(`   Réalité: ${automationCount}`);
console.log(`   Status:  ${status1} ${automationCount >= claim1 ? 'OK' : 'FAUX - Écart de ' + (claim1 - automationCount)}`);
console.log('');

// 2. MCPs ACTIFS
console.log('2. MCPs ACTIFS');
console.log('─'.repeat(60));
let mcpCount = 0;
try {
  const mcpConfig = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/claude-code/mcp.json', 'utf-8'));
  mcpCount = Object.keys(mcpConfig.mcpServers || {}).length;
} catch (e) {}
const claim2 = 12;
const status2 = mcpCount >= claim2 ? '✅' : '❌';
console.log(`   Claim:   ${claim2}`);
console.log(`   Réalité: ${mcpCount}`);
console.log(`   Status:  ${status2} ${mcpCount >= claim2 ? 'OK' : 'FAUX'}`);
console.log('');

// 3. APIs
console.log('3. APIs');
console.log('─'.repeat(60));
let apiCount = 0;
try {
  const envContent = fs.readFileSync('/Users/mac/Desktop/JO-AAA/.env', 'utf-8');
  const apiMatches = envContent.match(/API_KEY|TOKEN|SECRET/gi) || [];
  apiCount = apiMatches.length;
} catch (e) {}
const claim3 = 10;
const status3 = apiCount >= claim3 ? '✅' : '⚠️';
console.log(`   Claim:   ${claim3}+`);
console.log(`   Réalité: ${apiCount} credentials dans .env`);
console.log(`   Note:    Seulement 3/7 testées fonctionnelles (per CLAUDE.md)`);
console.log(`   Status:  ${status3} Partiellement vrai mais trompeur`);
console.log('');

// 4. CLIENTS SERVIS
console.log('4. CLIENTS SERVIS');
console.log('─'.repeat(60));
const clientsActifs = 0;  // Tous en pause
const clientsTotal = 3;   // Alpha Medical, Henderson, MyDealz
const claim4 = 42;
const status4 = '❌❌';
console.log(`   Claim:   ${claim4}+`);
console.log(`   Réalité: ${clientsTotal} clients (TOUS EN PAUSE)`);
console.log(`   Status:  ${status4} GRAVEMENT FAUX - Écart de ${claim4 - clientsTotal} clients fictifs`);
console.log(`   Impact:  Mensonge de ${((claim4 / clientsTotal) * 100).toFixed(0)}%`);
console.log('');

// 5. PAGES
console.log('5. PAGES DU SITE');
console.log('─'.repeat(60));
const htmlFiles = fs.readdirSync(SITE_DIR, { recursive: true })
  .filter(f => f.endsWith('.html')).length;
console.log(`   Total: ${htmlFiles} pages HTML`);
console.log(`   Status: ✅`);
console.log('');

// SUMMARY
console.log('═══════════════════════════════════════════════════════════════');
console.log('  RÉSUMÉ FACTUALITÉ');
console.log('═══════════════════════════════════════════════════════════════\n');

const issues = [];
if (automationCount < claim1) issues.push(`Automatisations: ${claim1} → ${automationCount}`);
if (mcpCount < claim2) issues.push(`MCPs: ${claim2} → ${mcpCount}`);
if (clientsTotal < claim4) issues.push(`Clients: ${claim4}+ → ${clientsTotal} (EN PAUSE)`);

if (issues.length > 0) {
  console.log('  ❌ CLAIMS FAUSSES À CORRIGER:');
  for (const issue of issues) {
    console.log(`     • ${issue}`);
  }
  console.log('');
  console.log('  ⚠️  RISQUE: Ces fausses claims peuvent:');
  console.log('     • Nuire à la crédibilité');
  console.log('     • Constituer de la publicité mensongère');
  console.log('     • Décevoir les prospects');
  console.log('');
} else {
  console.log('  ✅ TOUTES LES CLAIMS SONT VÉRIDIQUES');
}

console.log('═══════════════════════════════════════════════════════════════\n');

// Exit with error if issues found
process.exit(issues.length > 0 ? 1 : 0);
