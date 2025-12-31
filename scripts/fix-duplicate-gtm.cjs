#!/usr/bin/env node
/**
 * FIX: Supprime les blocs GTM inline dupliqués
 * Garde SEULEMENT la version lazy-loaded
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

// Files to fix (from audit results)
const FILES_TO_FIX = [
  'landing-page-hostinger/a-propos.html',
  'landing-page-hostinger/cas-clients.html',
  'landing-page-hostinger/contact.html',
  'landing-page-hostinger/en/about.html',
  'landing-page-hostinger/en/case-studies.html',
  'landing-page-hostinger/en/contact.html',
];

const stats = {
  filesProcessed: 0,
  filesFixed: 0,
  details: []
};

// Pattern to remove: The inline GTM block (lines like 143-148 in contact.html)
// This regex matches the standard Google inline GTM snippet
const INLINE_GTM_PATTERN = /\s*<!-- Google Tag Manager -->\s*\n\s*<script>\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];w\[l\]\.push\(\{'gtm\.start':\s*\n\s*new Date\(\)\.getTime\(\),event:'gtm\.js'\}\);var f=d\.getElementsByTagName\(s\)\[0\],\s*\n\s*j=d\.createElement\(s\),dl=l!='dataLayer'\?'&l='\+l:'';j\.async=true;j\.src=\s*\n\s*'https:\/\/www\.googletagmanager\.com\/gtm\.js\?id='\+i\+dl;f\.parentNode\.insertBefore\(j,f\);\s*\n\s*\}\)\(window,document,'script','dataLayer','GTM-[A-Z0-9]+'\);<\/script>\s*\n/g;

function fixFile(relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  stats.filesProcessed++;

  // Check if inline GTM exists
  const hasInlineGTM = INLINE_GTM_PATTERN.test(content);

  if (hasInlineGTM) {
    // Remove the inline GTM block
    content = content.replace(INLINE_GTM_PATTERN, '\n');

    // Also clean up any double newlines created
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      stats.filesFixed++;
      stats.details.push(relativePath);
      console.log(`✅ Fixed: ${relativePath}`);
    }
  } else {
    console.log(`ℹ️  No inline GTM pattern found (may need manual check): ${relativePath}`);
  }
}

// Main
console.log('🔧 Removing duplicate inline GTM scripts...\n');

FILES_TO_FIX.forEach(file => {
  fixFile(file);
});

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log('='.repeat(60));
console.log(`📁 Fichiers traités: ${stats.filesProcessed}`);
console.log(`✏️  Fichiers corrigés: ${stats.filesFixed}`);
console.log('='.repeat(60));

if (stats.filesFixed > 0) {
  console.log('\n📝 Fichiers modifiés:');
  stats.details.forEach(f => console.log(`   - ${f}`));
}

console.log('\n✅ Correction terminée. Relancez audit-duplicate-gtm.cjs pour vérifier.');
