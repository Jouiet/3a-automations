#!/usr/bin/env node
/**
 * VÉRIFICATION EXHAUSTIVE DE TOUTES LES PAGES DU SITE
 * Date: 2025-12-23
 *
 * Tests:
 * 1. HTTP Status (200 OK)
 * 2. Header présent
 * 3. Footer présent
 * 4. Main content présent
 * 5. Title non vide
 * 6. Meta description
 * 7. hreflang tags
 * 8. Broken internal links
 * 9. Images avec alt
 * 10. CSS/JS chargés
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://3a-automation.com';

// TOUTES les pages du site (28 total)
const ALL_PAGES = [
    // FR (14 pages)
    '/',
    '/a-propos.html',
    '/automations.html',
    '/cas-clients.html',
    '/contact.html',
    '/pricing.html',
    '/booking.html',
    '/services/pme.html',
    '/services/ecommerce.html',
    '/services/audit-gratuit.html',
    '/services/flywheel-360.html',
    '/legal/mentions-legales.html',
    '/legal/politique-confidentialite.html',
    '/404.html',
    // EN (14 pages)
    '/en/',
    '/en/about.html',
    '/en/automations.html',
    '/en/case-studies.html',
    '/en/contact.html',
    '/en/pricing.html',
    '/en/booking.html',
    '/en/services/smb.html',
    '/en/services/ecommerce.html',
    '/en/services/free-audit.html',
    '/en/services/flywheel-360.html',
    '/en/legal/terms.html',
    '/en/legal/privacy.html',
    '/en/404.html'
];

// Fetch page content
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            timeout: 15000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
                status: res.statusCode,
                headers: res.headers,
                body: data,
                url: url
            }));
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Extract all internal links from HTML
function extractInternalLinks(html, baseUrl) {
    const linkRegex = /href=["']([^"']+)["']/gi;
    const links = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        if (href.startsWith('/') && !href.startsWith('//')) {
            links.push(href);
        } else if (href.startsWith(baseUrl)) {
            links.push(href.replace(baseUrl, ''));
        }
    }
    return [...new Set(links)];
}

// Check page for issues
function analyzePage(html, path) {
    const issues = [];
    const warnings = [];

    // 1. Header check
    if (!html.includes('<header') && !html.includes('class="header')) {
        issues.push('Missing <header>');
    }

    // 2. Footer check
    if (!html.includes('<footer') && !html.includes('class="footer')) {
        issues.push('Missing <footer>');
    }

    // 3. Main content check
    if (!html.includes('<main') && !html.includes('class="main') && !html.includes('class="content')) {
        warnings.push('No <main> or .content section');
    }

    // 4. Title check
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (!titleMatch || titleMatch[1].trim() === '') {
        issues.push('Empty or missing <title>');
    }

    // 5. Meta description
    if (!html.includes('meta name="description"') && !html.includes("meta name='description'")) {
        warnings.push('Missing meta description');
    }

    // 6. hreflang check (for non-404 pages)
    if (!path.includes('404')) {
        if (!html.includes('hreflang')) {
            issues.push('Missing hreflang tags');
        }
    }

    // 7. Empty body check
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
        const bodyContent = bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                         .replace(/<[^>]+>/g, '')
                                         .trim();
        if (bodyContent.length < 100) {
            issues.push(`Body content too short (${bodyContent.length} chars)`);
        }
    }

    // 8. CSS check
    if (!html.includes('.css') && !html.includes('<style')) {
        issues.push('No CSS loaded');
    }

    // 9. Images without alt
    const imgRegex = /<img[^>]+>/gi;
    const images = html.match(imgRegex) || [];
    const imagesWithoutAlt = images.filter(img => !img.includes('alt=') || img.includes('alt=""'));
    if (imagesWithoutAlt.length > 0) {
        warnings.push(`${imagesWithoutAlt.length} images without alt text`);
    }

    // 10. Placeholder text detection
    const placeholders = [
        'Lorem ipsum', 'TODO', 'FIXME', 'placeholder',
        '[À COMPLÉTER]', '[TO DO]', 'XXX', '{{', '}}'
    ];
    for (const ph of placeholders) {
        if (html.toLowerCase().includes(ph.toLowerCase())) {
            issues.push(`Placeholder found: "${ph}"`);
        }
    }

    // 11. Check for broken asset references
    const brokenAssets = [];
    const assetRegex = /(src|href)=["']([^"']+\.(js|css|png|jpg|jpeg|gif|svg|webp))["']/gi;
    let assetMatch;
    while ((assetMatch = assetRegex.exec(html)) !== null) {
        const assetPath = assetMatch[2];
        // Check for common broken patterns
        if (assetPath.includes('undefined') || assetPath.includes('null')) {
            brokenAssets.push(assetPath);
        }
    }
    if (brokenAssets.length > 0) {
        issues.push(`Broken assets: ${brokenAssets.join(', ')}`);
    }

    return { issues, warnings };
}

// Main verification
async function verifyAllPages() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  VÉRIFICATION EXHAUSTIVE - TOUTES LES PAGES (28 total)       ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Base URL: ${BASE_URL.padEnd(48)} ║`);
    console.log(`║  Date: ${new Date().toISOString().padEnd(52)} ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        pages: [],
        brokenLinks: new Set()
    };

    // All internal links found
    const allInternalLinks = new Set();

    for (const path of ALL_PAGES) {
        const url = BASE_URL + path;
        process.stdout.write(`Testing: ${path.padEnd(45)} `);

        try {
            const response = await fetchPage(url);

            // Check HTTP status
            if (response.status !== 200) {
                console.log(`❌ HTTP ${response.status}`);
                results.failed++;
                results.pages.push({
                    path,
                    status: 'FAIL',
                    httpCode: response.status,
                    issues: [`HTTP ${response.status}`],
                    warnings: []
                });
                continue;
            }

            // Analyze page content
            const analysis = analyzePage(response.body, path);

            // Extract internal links for broken link check
            const links = extractInternalLinks(response.body, BASE_URL);
            links.forEach(link => allInternalLinks.add(link));

            // Determine result
            if (analysis.issues.length > 0) {
                console.log(`❌ ${analysis.issues.length} issue(s)`);
                results.failed++;
                results.pages.push({
                    path,
                    status: 'FAIL',
                    httpCode: 200,
                    issues: analysis.issues,
                    warnings: analysis.warnings
                });
            } else if (analysis.warnings.length > 0) {
                console.log(`⚠️  ${analysis.warnings.length} warning(s)`);
                results.warnings++;
                results.pages.push({
                    path,
                    status: 'WARN',
                    httpCode: 200,
                    issues: [],
                    warnings: analysis.warnings
                });
            } else {
                console.log('✅ OK');
                results.passed++;
                results.pages.push({
                    path,
                    status: 'PASS',
                    httpCode: 200,
                    issues: [],
                    warnings: []
                });
            }

        } catch (error) {
            console.log(`❌ ${error.message}`);
            results.failed++;
            results.pages.push({
                path,
                status: 'ERROR',
                issues: [error.message],
                warnings: []
            });
        }
    }

    // Check for broken internal links
    console.log('\n--- Vérification des liens internes ---\n');

    const validPaths = new Set(ALL_PAGES.map(p => p.replace(/\/$/, '/index.html')));
    validPaths.add('/index.html');
    validPaths.add('/en/index.html');

    // Normalize paths for comparison
    const normalizedValid = new Set();
    ALL_PAGES.forEach(p => {
        normalizedValid.add(p);
        normalizedValid.add(p.replace('.html', ''));
        if (p.endsWith('/')) {
            normalizedValid.add(p + 'index.html');
        }
    });

    for (const link of allInternalLinks) {
        // Skip anchors, mailto, tel, javascript
        if (link.startsWith('#') || link.startsWith('mailto:') ||
            link.startsWith('tel:') || link.startsWith('javascript:')) {
            continue;
        }

        // Normalize link
        let normalizedLink = link.split('#')[0].split('?')[0];

        // Check if link is valid
        const isValid = normalizedValid.has(normalizedLink) ||
                       normalizedValid.has(normalizedLink + '.html') ||
                       normalizedValid.has(normalizedLink.replace(/\/$/, ''));

        if (!isValid) {
            // Verify with HTTP request
            try {
                const testUrl = BASE_URL + normalizedLink;
                const response = await fetchPage(testUrl);
                if (response.status === 404) {
                    results.brokenLinks.add(normalizedLink);
                    console.log(`❌ Broken link: ${normalizedLink}`);
                }
            } catch (e) {
                results.brokenLinks.add(normalizedLink);
                console.log(`❌ Broken link: ${normalizedLink} (${e.message})`);
            }
        }
    }

    // Print detailed report
    console.log('\n' + '═'.repeat(66));
    console.log('                      RAPPORT DÉTAILLÉ');
    console.log('═'.repeat(66));

    // Failed pages
    const failedPages = results.pages.filter(p => p.status === 'FAIL' || p.status === 'ERROR');
    if (failedPages.length > 0) {
        console.log('\n❌ PAGES AVEC ERREURS:\n');
        for (const page of failedPages) {
            console.log(`  ${page.path}`);
            for (const issue of page.issues) {
                console.log(`    └─ ${issue}`);
            }
        }
    }

    // Warning pages
    const warnPages = results.pages.filter(p => p.status === 'WARN');
    if (warnPages.length > 0) {
        console.log('\n⚠️  PAGES AVEC AVERTISSEMENTS:\n');
        for (const page of warnPages) {
            console.log(`  ${page.path}`);
            for (const warn of page.warnings) {
                console.log(`    └─ ${warn}`);
            }
        }
    }

    // Broken links
    if (results.brokenLinks.size > 0) {
        console.log('\n🔗 LIENS CASSÉS:\n');
        for (const link of results.brokenLinks) {
            console.log(`  └─ ${link}`);
        }
    }

    // Summary
    console.log('\n' + '═'.repeat(66));
    console.log('                        RÉSUMÉ FINAL');
    console.log('═'.repeat(66));

    const total = ALL_PAGES.length;
    const successRate = ((results.passed / total) * 100).toFixed(1);

    console.log(`
    Total pages testées:    ${total}
    ✅ Passées:              ${results.passed}
    ⚠️  Avertissements:       ${results.warnings}
    ❌ Échecs:               ${results.failed}
    🔗 Liens cassés:         ${results.brokenLinks.size}

    Taux de succès:         ${successRate}%
    `);

    if (results.failed === 0 && results.brokenLinks.size === 0) {
        console.log('🎉 TOUTES LES PAGES SONT OK!\n');
        process.exit(0);
    } else {
        console.log('⚠️  DES CORRECTIONS SONT NÉCESSAIRES\n');
        process.exit(1);
    }
}

// Run
verifyAllPages().catch(err => {
    console.error('Script error:', err);
    process.exit(1);
});
