#!/usr/bin/env node
/**
 * FIX: Corriger les liens "../en/" qui créent des doubles "/en/en/"
 * Solution: Remplacer "../en/" par "/en/" (chemins absolus)
 *
 * Date: 2025-12-23
 */

const fs = require('fs');
const path = require('path');

const EN_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger/en';

// Find all HTML files recursively
function findHtmlFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findHtmlFiles(fullPath));
        } else if (entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Fix file
function fixFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Count occurrences before fix
    const matches = content.match(/\.\.\/en\//g);
    const count = matches ? matches.length : 0;

    if (count === 0) {
        return { file: filePath, fixed: 0, skipped: true };
    }

    // Replace ../en/ with /en/
    const fixed = content.replace(/\.\.\/en\//g, '/en/');

    // Verify the fix
    const remaining = fixed.match(/\.\.\/en\//g);
    if (remaining && remaining.length > 0) {
        console.error(`Warning: ${remaining.length} occurrences still remain in ${filePath}`);
    }

    // Write fixed content
    fs.writeFileSync(filePath, fixed, 'utf8');

    return { file: filePath, fixed: count, skipped: false };
}

// Main
function main() {
    console.log('═'.repeat(60));
    console.log('  FIX: Corriger les liens "../en/" → "/en/"');
    console.log('═'.repeat(60));
    console.log();

    const files = findHtmlFiles(EN_DIR);
    console.log(`Fichiers trouvés: ${files.length}\n`);

    let totalFixed = 0;
    const results = [];

    for (const file of files) {
        const result = fixFile(file);
        results.push(result);

        const relativePath = file.replace('/Users/mac/Desktop/JO-AAA/landing-page-hostinger/', '');

        if (result.skipped) {
            console.log(`  ⏭️  ${relativePath} (aucun ../en/)`);
        } else {
            console.log(`  ✅ ${relativePath} (${result.fixed} corrections)`);
            totalFixed += result.fixed;
        }
    }

    console.log();
    console.log('═'.repeat(60));
    console.log(`  RÉSULTAT: ${totalFixed} liens corrigés dans ${files.length} fichiers`);
    console.log('═'.repeat(60));

    // Verify
    console.log('\n--- VÉRIFICATION POST-FIX ---\n');

    let remainingTotal = 0;
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const matches = content.match(/\.\.\/en\//g);
        if (matches && matches.length > 0) {
            const relativePath = file.replace('/Users/mac/Desktop/JO-AAA/landing-page-hostinger/', '');
            console.log(`  ❌ ${relativePath}: ${matches.length} restants`);
            remainingTotal += matches.length;
        }
    }

    if (remainingTotal === 0) {
        console.log('  ✅ TOUS LES LIENS CORRIGÉS - 0 occurrences de "../en/" restantes\n');
        process.exit(0);
    } else {
        console.log(`\n  ❌ ${remainingTotal} occurrences restantes\n`);
        process.exit(1);
    }
}

main();
