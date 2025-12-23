#!/usr/bin/env node
/**
 * VÉRIFICATION FINALE - TOUTES LES PAGES (28)
 * Tests: HTTP 200, Header, Footer, Content
 */

const https = require('https');

const BASE_URL = 'https://3a-automation.com';

const ALL_PAGES = [
    // FR (14)
    { path: '/', name: 'Home FR' },
    { path: '/a-propos.html', name: 'About FR' },
    { path: '/automations.html', name: 'Automations FR' },
    { path: '/cas-clients.html', name: 'Case Studies FR' },
    { path: '/contact.html', name: 'Contact FR' },
    { path: '/pricing.html', name: 'Pricing FR' },
    { path: '/booking.html', name: 'Booking FR' },
    { path: '/services/pme.html', name: 'SMB FR' },
    { path: '/services/ecommerce.html', name: 'E-commerce FR' },
    { path: '/services/audit-gratuit.html', name: 'Free Audit FR' },
    { path: '/services/flywheel-360.html', name: 'Flywheel FR' },
    { path: '/legal/mentions-legales.html', name: 'Terms FR' },
    { path: '/legal/politique-confidentialite.html', name: 'Privacy FR' },
    { path: '/404.html', name: '404 FR' },
    // EN (14)
    { path: '/en/', name: 'Home EN' },
    { path: '/en/about.html', name: 'About EN' },
    { path: '/en/automations.html', name: 'Automations EN' },
    { path: '/en/case-studies.html', name: 'Case Studies EN' },
    { path: '/en/contact.html', name: 'Contact EN' },
    { path: '/en/pricing.html', name: 'Pricing EN' },
    { path: '/en/booking.html', name: 'Booking EN' },
    { path: '/en/services/smb.html', name: 'SMB EN' },
    { path: '/en/services/ecommerce.html', name: 'E-commerce EN' },
    { path: '/en/services/free-audit.html', name: 'Free Audit EN' },
    { path: '/en/services/flywheel-360.html', name: 'Flywheel EN' },
    { path: '/en/legal/terms.html', name: 'Terms EN' },
    { path: '/en/legal/privacy.html', name: 'Privacy EN' },
    { path: '/en/404.html', name: '404 EN' }
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

async function verifyPage(page) {
    const url = BASE_URL + page.path;
    const result = { ...page, status: 'FAIL', issues: [] };

    try {
        const response = await fetchPage(url);

        if (response.status !== 200) {
            result.issues.push(`HTTP ${response.status}`);
            return result;
        }

        // Check for essential elements
        if (!response.body.includes('<header') && !response.body.includes('class="header')) {
            result.issues.push('No header');
        }
        if (!response.body.includes('<footer') && !response.body.includes('class="footer')) {
            result.issues.push('No footer');
        }

        // Check for minimal content (not empty page)
        const bodyContent = response.body
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, '').trim();

        if (bodyContent.length < 200) {
            result.issues.push(`Content too short (${bodyContent.length} chars)`);
        }

        // Check for broken ../en/ links (should be none after fix)
        if (response.body.includes('href="../en/')) {
            result.issues.push('Still has ../en/ links!');
        }

        if (result.issues.length === 0) {
            result.status = 'PASS';
        }

    } catch (error) {
        result.issues.push(error.message);
    }

    return result;
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     VÉRIFICATION FINALE - TOUTES LES PAGES (28)              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const page of ALL_PAGES) {
        process.stdout.write(`${page.name.padEnd(20)} `);
        const result = await verifyPage(page);

        if (result.status === 'PASS') {
            console.log('✅ OK');
            passed++;
        } else {
            console.log(`❌ ${result.issues.join(', ')}`);
            failed++;
            failures.push(result);
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`  RÉSULTAT: ${passed}/${ALL_PAGES.length} pages OK (${((passed/ALL_PAGES.length)*100).toFixed(1)}%)`);
    console.log('═'.repeat(60));

    if (failed > 0) {
        console.log('\n❌ ÉCHECS:');
        for (const f of failures) {
            console.log(`  ${f.path}: ${f.issues.join(', ')}`);
        }
        console.log();
        process.exit(1);
    } else {
        console.log('\n🎉 100% DES PAGES SONT OK!\n');
        process.exit(0);
    }
}

main();
