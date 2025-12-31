#!/usr/bin/env node
/**
 * ADD: Academy link to footer in Ressources section
 * Adds link with CTA to encourage signup
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// French pages pattern
const FR_PATTERN = {
  find: /<li><a href="\/contact\.html">Contact<\/a><\/li>/g,
  replace: `<li><a href="/contact.html">Contact</a></li>
            <li><a href="/academie.html" class="academy-link">📚 Académie <span class="badge-new">Clients</span></a></li>`
};

// English pages pattern
const EN_PATTERN = {
  find: /<li><a href="\/en\/contact\.html">Contact<\/a><\/li>/g,
  replace: `<li><a href="/en/contact.html">Contact</a></li>
            <li><a href="/en/academy.html" class="academy-link">📚 Academy <span class="badge-new">Clients</span></a></li>`
};

// Alternative patterns for different footer structures
const FR_ALT_PATTERN = {
  find: /<li><a href="\/a-propos\.html">À propos<\/a><\/li>\s*<li><a href="\/contact\.html">Contact<\/a><\/li>/g,
  replace: `<li><a href="/a-propos.html">À propos</a></li>
            <li><a href="/contact.html">Contact</a></li>
            <li><a href="/academie.html" class="academy-link">📚 Académie <span class="badge-new">Clients</span></a></li>`
};

const EN_ALT_PATTERN = {
  find: /<li><a href="\/en\/about\.html">About<\/a><\/li>\s*<li><a href="\/en\/contact\.html">Contact<\/a><\/li>/g,
  replace: `<li><a href="/en/about.html">About</a></li>
            <li><a href="/en/contact.html">Contact</a></li>
            <li><a href="/en/academy.html" class="academy-link">📚 Academy <span class="badge-new">Clients</span></a></li>`
};

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  alreadyHasLink: 0
};

function processFile(filePath) {
  if (!filePath.endsWith('.html')) return;
  if (filePath.includes('/academie') || filePath.includes('/academy')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  stats.filesProcessed++;

  // Check if already has academy link
  if (content.includes('/academie.html') || content.includes('/academy.html')) {
    stats.alreadyHasLink++;
    return;
  }

  // Try French patterns first
  if (relativePath.includes('/en/')) {
    // English pages
    if (EN_ALT_PATTERN.find.test(content)) {
      content = content.replace(EN_ALT_PATTERN.find, EN_ALT_PATTERN.replace);
    } else if (EN_PATTERN.find.test(content)) {
      content = content.replace(EN_PATTERN.find, EN_PATTERN.replace);
    }
  } else {
    // French pages
    if (FR_ALT_PATTERN.find.test(content)) {
      content = content.replace(FR_ALT_PATTERN.find, FR_ALT_PATTERN.replace);
    } else if (FR_PATTERN.find.test(content)) {
      content = content.replace(FR_PATTERN.find, FR_PATTERN.replace);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesModified++;
    console.log(`✅ Added Academy link: ${relativePath}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (item.startsWith('.') || item === 'node_modules') return;

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

// Main
console.log('🔧 Adding Academy link to footer...\n');
processDirectory(LANDING_DIR);

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log('='.repeat(60));
console.log(`📁 Fichiers traités: ${stats.filesProcessed}`);
console.log(`✅ Liens ajoutés: ${stats.filesModified}`);
console.log(`ℹ️  Déjà présent: ${stats.alreadyHasLink}`);
console.log('='.repeat(60));
