#!/usr/bin/env node
/**
 * Audit AI Scripts for Fallback Pattern
 * Identifies scripts that need multi-provider resilience
 */

const fs = require('fs');
const path = require('path');

function findScripts(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.includes('node_modules')) {
        files.push(...findScripts(fullPath));
      } else if (item.name.endsWith('.cjs') || item.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

const aiPatterns = [
  { name: 'Anthropic', pattern: /api\.anthropic\.com/g },
  { name: 'Grok/xAI', pattern: /api\.x\.ai/g },
  { name: 'Gemini', pattern: /generativelanguage\.googleapis\.com/g },
  { name: 'OpenAI', pattern: /api\.openai\.com/g },
  { name: 'ElevenLabs', pattern: /api\.elevenlabs\.io/g },
  { name: 'fal.ai', pattern: /fal\.run|queue\.fal\.run/g },
  { name: 'Replicate', pattern: /api\.replicate\.com/g },
];

const scripts = findScripts('/Users/mac/Desktop/JO-AAA/automations');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║         AI SCRIPTS FALLBACK AUDIT - 3A Automation                ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');

const results = [];
for (const file of scripts) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const providers = aiPatterns.filter(p => p.pattern.test(content)).map(p => p.name);

    // Reset regex lastIndex
    aiPatterns.forEach(p => p.pattern.lastIndex = 0);

    if (providers.length === 0) continue;

    const hasFallback = /fallback|Fallback|providers\s*=\s*\[|for\s*\(\s*const\s+provider\s+of/.test(content);
    const isTest = file.includes('test') || file.includes('poc') || file.includes('forensic');

    results.push({
      file: file.replace('/Users/mac/Desktop/JO-AAA/', ''),
      providers,
      hasFallback,
      isTest,
      needsFix: providers.length === 1 && !hasFallback && !isTest
    });
  } catch (e) {}
}

// Sort: needs fix first, then by provider count
results.sort((a, b) => {
  if (a.needsFix !== b.needsFix) return b.needsFix - a.needsFix;
  return b.providers.length - a.providers.length;
});

console.log('');
console.log('❌ SCRIPTS REQUIRING FALLBACK:');
console.log('─'.repeat(66));
const needsFix = results.filter(r => r.needsFix);
if (needsFix.length === 0) {
  console.log('   None found! All production scripts have fallback.');
} else {
  needsFix.forEach(r => {
    console.log(`   ${r.file}`);
    console.log(`   └─ Provider: ${r.providers.join(', ')}`);
  });
}

console.log('');
console.log('✅ SCRIPTS WITH FALLBACK:');
console.log('─'.repeat(66));
results.filter(r => r.hasFallback && !r.isTest).forEach(r => {
  console.log(`   ${r.file}`);
  console.log(`   └─ Providers: ${r.providers.join(' → ')}`);
});

console.log('');
console.log('⚠️  SINGLE PROVIDER (Test/POC - OK):');
console.log('─'.repeat(66));
results.filter(r => r.isTest).forEach(r => {
  console.log(`   ${r.file}`);
  console.log(`   └─ Provider: ${r.providers.join(', ')}`);
});

console.log('');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║ RÉSUMÉ                                                           ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Total scripts AI:        ${String(results.length).padEnd(40)}║`);
console.log(`║  Avec fallback:           ${String(results.filter(r => r.hasFallback).length).padEnd(40)}║`);
console.log(`║  Test/POC (OK sans):      ${String(results.filter(r => r.isTest).length).padEnd(40)}║`);
console.log(`║  À CORRIGER:              ${String(needsFix.length).padEnd(40)}║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

// Also check n8n workflows
console.log('\n');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  AUTRES SYSTÈMES NÉCESSITANT FALLBACK');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');
console.log('📱 VOICE WIDGET (landing-page-hostinger/voice-assistant/):');
console.log('   └─ Utilise Grok seul → BESOIN FALLBACK');
console.log('');
console.log('🔧 n8n WORKFLOWS:');
console.log('   └─ Product Photos (Gemini seul) → BESOIN FALLBACK');
console.log('');
console.log('🎙️ GROK VOICE TELEPHONY:');
console.log('   └─ Grok Voice seul → Fallback vers ElevenLabs?');
