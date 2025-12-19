#!/usr/bin/env node
/**
 * CHECK ENV STATUS
 * Lists all env vars and their status (configured/empty)
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const content = fs.readFileSync(envPath, 'utf8');

const configured = [];
const empty = [];

content.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.includes('=')) return;
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();

  if (value && value !== 'act_' && !value.includes('REPLACE')) {
    configured.push(key);
  } else if (key && key.match(/^[A-Z]/)) {
    empty.push(key);
  }
});

console.log('=== VARIABLES CONFIGURÉES (' + configured.length + ') ===');
configured.forEach(v => console.log('✅ ' + v));

console.log('\n=== VARIABLES VIDES (' + empty.length + ') ===');
empty.forEach(v => console.log('❌ ' + v));

console.log('\n=== RÉSUMÉ ===');
console.log('Configurées: ' + configured.length);
console.log('Vides: ' + empty.length);
console.log('Taux: ' + Math.round(configured.length / (configured.length + empty.length) * 100) + '%');
