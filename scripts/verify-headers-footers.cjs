#!/usr/bin/env node
/**
 * VÉRIFICATION EXHAUSTIVE HEADERS/FOOTERS
 * Vérifie que TOUTES les pages ont des headers/footers standardisés
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// Required header elements
const HEADER_CHECKS = {
    'logo': [/class="logo"/, /class="logo-icon"/],
    'nav': [/class="nav"/, /class="nav-links"/, /class="header-nav"/, /<nav/],
    'lang-switcher': [/class="lang-switcher"/, /lang-switch/, /FR<\/a>/, /EN<\/a>/],
    'cta-button': [/class="btn-nav"/, /btn-primary/, /btn-cyber/]
};

// Required footer elements
const FOOTER_CHECKS = {
    'footer-tag': [/<footer/, /class="footer/],
    'footer-links': [/class="footer-links/, /class="footer-col/],
    'email-contact': [/contact@3a-automation\.com/],
    'legal-links': [/mentions-legales|terms/, /politique-confidentialite|privacy/],
    'copyright': [/3A Automation|©/]
};

// Find all HTML files
function findHtmlFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
            files.push(...findHtmlFiles(fullPath));
        } else if (entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Check a file against patterns
function checkFile(filePath, checks) {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = {};

    for (const [name, patterns] of Object.entries(checks)) {
        const found = patterns.some(pattern => pattern.test(content));
        results[name] = found;
    }

    return results;
}

// Main
function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   VÉRIFICATION HEADERS/FOOTERS - TOUTES LES PAGES (28)     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const files = findHtmlFiles(SITE_DIR);
    console.log(`Fichiers HTML trouvés: ${files.length}\n`);

    let headerIssues = 0;
    let footerIssues = 0;
    const issues = [];

    for (const file of files) {
        const relativePath = file.replace(SITE_DIR + '/', '');
        const headerResults = checkFile(file, HEADER_CHECKS);
        const footerResults = checkFile(file, FOOTER_CHECKS);

        const headerMissing = Object.entries(headerResults).filter(([k, v]) => !v).map(([k]) => k);
        const footerMissing = Object.entries(footerResults).filter(([k, v]) => !v).map(([k]) => k);

        if (headerMissing.length === 0 && footerMissing.length === 0) {
            console.log(`✅ ${relativePath}`);
        } else {
            console.log(`❌ ${relativePath}`);
            if (headerMissing.length > 0) {
                console.log(`   Header manquant: ${headerMissing.join(', ')}`);
                headerIssues++;
            }
            if (footerMissing.length > 0) {
                console.log(`   Footer manquant: ${footerMissing.join(', ')}`);
                footerIssues++;
            }
            issues.push({ file: relativePath, headerMissing, footerMissing });
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`RÉSULTAT: ${files.length - issues.length}/${files.length} pages OK`);
    console.log(`Header issues: ${headerIssues} | Footer issues: ${footerIssues}`);
    console.log('═'.repeat(60));

    if (issues.length === 0) {
        console.log('\n🎉 TOUS LES HEADERS/FOOTERS SONT STANDARDISÉS!\n');
        process.exit(0);
    } else {
        console.log('\n⚠️ CORRECTIONS NÉCESSAIRES:\n');
        issues.forEach(issue => {
            console.log(`  ${issue.file}:`);
            if (issue.headerMissing.length > 0) {
                console.log(`    └─ Header: ${issue.headerMissing.join(', ')}`);
            }
            if (issue.footerMissing.length > 0) {
                console.log(`    └─ Footer: ${issue.footerMissing.join(', ')}`);
            }
        });
        console.log();

        // Output JSON for automated fixing
        fs.writeFileSync(
            '/Users/mac/Desktop/JO-AAA/outputs/header-footer-issues.json',
            JSON.stringify(issues, null, 2)
        );
        console.log('Issues saved to: outputs/header-footer-issues.json\n');

        process.exit(1);
    }
}

main();
