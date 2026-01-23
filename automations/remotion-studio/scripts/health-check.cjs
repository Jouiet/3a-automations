#!/usr/bin/env node
/**
 * Remotion Studio Health Check
 * Verifies all dependencies and configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🎬 Remotion Studio Health Check\n');
console.log('=' .repeat(60));

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
console.log(`\n📦 Node.js: ${nodeVersion} ${majorVersion >= 18 ? '✅' : '❌ (need >= 18)'}`);

// Check required files
const requiredFiles = [
  'package.json',
  'remotion.config.ts',
  'src/index.ts',
  'src/Root.tsx',
];

console.log('\n📁 Required Files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check environment variables
console.log('\n🔑 Environment Variables:');
const envVars = [
  'FAL_API_KEY',
  'REPLICATE_API_TOKEN',
  'ELEVENLABS_API_KEY',
  'DEEPGRAM_API_KEY',
];

// Try to load .env from project root
const envPath = path.join(__dirname, '../../../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '⚠️  NOT SET';
  console.log(`   ${status} - ${varName}`);
});

// Check compositions
console.log('\n🎞️  Compositions:');
const compositionsDir = path.join(__dirname, '../src/compositions');
if (fs.existsSync(compositionsDir)) {
  const compositions = fs.readdirSync(compositionsDir).filter(f => f.endsWith('.tsx'));
  compositions.forEach(comp => {
    console.log(`   ✅ ${comp.replace('.tsx', '')}`);
  });
} else {
  console.log('   ❌ No compositions directory found');
}

// Check components
console.log('\n🧩 Components:');
const componentsDir = path.join(__dirname, '../src/components');
if (fs.existsSync(componentsDir)) {
  const components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
  console.log(`   ✅ ${components.length} components available`);
} else {
  console.log('   ❌ No components directory found');
}

// Check if node_modules exists
const nodeModulesExists = fs.existsSync(path.join(__dirname, '../node_modules'));
console.log(`\n📦 Dependencies: ${nodeModulesExists ? '✅ Installed' : '❌ Run: npm install'}`);

// Summary
console.log('\n' + '=' .repeat(60));
console.log('\n📋 Quick Start Commands:');
console.log('   npm install          # Install dependencies');
console.log('   npm run dev          # Launch Remotion Studio');
console.log('   npm run render:promo # Render promo video');
console.log('   npm run render:ad    # Render ad video\n');

// Check for missing critical items
const criticalMissing = !fs.existsSync(path.join(__dirname, '../package.json'));
if (criticalMissing) {
  console.log('❌ CRITICAL: package.json missing. Run setup first.');
  process.exit(1);
}

console.log('✅ Health check complete\n');
