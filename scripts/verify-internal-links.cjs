#!/usr/bin/env node
/**
 * VÉRIFICATION DES LIENS INTERNES
 * S'assure qu'il n'y a plus de liens /en/en/ ou ../en/
 */

const https = require('https');

const BASE_URL = 'https://3a-automation.com';

const PAGES_TO_CHECK = [
    '/en/case-studies.html',
    '/en/services/ecommerce.html',
    '/en/services/smb.html',
    '/en/index.html',
    '/en/about.html',
    '/en/pricing.html'
];

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function extractLinks(html) {
    const linkRegex = /href="([^"]+)"/gi;
    const links = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        links.push(match[1]);
    }
    return links;
}

async function checkPage(path) {
    const url = BASE_URL + path;
    console.log(`\nChecking: ${path}`);

    try {
        const response = await fetchPage(url);
        const links = extractLinks(response.body);

        // Check for problematic patterns
        const badPatterns = [
            { pattern: '../en/', desc: 'Relative ../en/' },
            { pattern: '/en/en/', desc: 'Double /en/en/' },
            { pattern: 'href="en/', desc: 'Relative en/' }
        ];

        let issues = 0;

        for (const { pattern, desc } of badPatterns) {
            const found = links.filter(l => l.includes(pattern));
            if (found.length > 0) {
                console.log(`  ❌ ${desc}: ${found.length} occurrences`);
                found.slice(0, 3).forEach(l => console.log(`     └─ ${l}`));
                issues += found.length;
            }
        }

        if (issues === 0) {
            console.log('  ✅ Tous les liens sont corrects');
        }

        return issues;

    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return 1;
    }
}

async function main() {
    console.log('═'.repeat(60));
    console.log('  VÉRIFICATION DES LIENS INTERNES');
    console.log('═'.repeat(60));

    let totalIssues = 0;

    for (const page of PAGES_TO_CHECK) {
        totalIssues += await checkPage(page);
    }

    console.log('\n' + '═'.repeat(60));
    if (totalIssues === 0) {
        console.log('  ✅ TOUS LES LIENS SONT CORRECTS');
        process.exit(0);
    } else {
        console.log(`  ❌ ${totalIssues} PROBLÈMES TROUVÉS`);
        process.exit(1);
    }
}

main();
