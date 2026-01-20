const fs = require('fs');
const path = require('path');

const sitemapPath = '/Users/mac/Documents/JO-AAA/landing-page-hostinger/sitemap.xml';
const transparencyPath = '/Users/mac/Documents/JO-AAA/landing-page-hostinger/agentic-transparency.js';
const statusPath = '/Users/mac/Documents/JO-AAA/landing-page-hostinger/data/agentic-status.json';

let errors = 0;

function verifySitemap() {
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    if (content.includes('2026-12-')) {
        console.error('FAIL: Sitemap still contains future dates (2026-12).');
        errors++;
    } else {
        console.log('PASS: Sitemap dates verified.');
    }
}

function verifyCounts() {
    const content = fs.readFileSync(statusPath, 'utf-8');
    if (content.includes('"total_automations": 119')) {
        console.error('FAIL: agentic-status.json still has 119 automations.');
        errors++;
    } else if (content.includes('"total_automations": 118')) {
        console.log('PASS: agentic-status.json count verified (118).');
    } else {
        console.warn('WARN: Could not find strict automation total in status JSON.');
    }
}

function verifyTransparency() {
    const content = fs.readFileSync(transparencyPath, 'utf-8');
    if (content.includes("googleAdsStatusEl.textContent = 'DISCONNECTED'")) {
        console.error('FAIL: Transparency script still hardcodes DISCONNECTED.');
        errors++;
    } else {
        console.log('PASS: Transparency script hardcoding removed/updated.');
    }
}

console.log('--- STARTING VERIFICATION PHASE A ---');
verifySitemap();
verifyCounts();
verifyTransparency();

if (errors === 0) {
    console.log('--- ALL CHECKS PASSED: SUCCESS ---');
    process.exit(0);
} else {
    console.error(`--- FAILED: ${errors} ERRORS FOUND ---`);
    process.exit(1);
}
