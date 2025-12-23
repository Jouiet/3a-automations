#!/usr/bin/env node
/**
 * FIX OG TAGS - Add missing Open Graph meta tags
 * Adds og:url, og:type, og:image for pages missing them
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';
const BASE_URL = 'https://3a-automation.com';
const OG_IMAGE = 'https://3a-automation.com/og-image.png';

const PAGES_CONFIG = {
    // Pages needing full OG tags
    '404.html': { type: 'website', titleSuffix: 'Page Non Trouvée' },
    'en/404.html': { type: 'website', titleSuffix: 'Page Not Found' },
    'booking.html': { type: 'website', titleSuffix: 'Réserver un Appel' },
    'en/booking.html': { type: 'website', titleSuffix: 'Book a Call' },
    'automations.html': { type: 'website', titleSuffix: 'Catalogue Automations' },
    'en/automations.html': { type: 'website', titleSuffix: 'Automation Catalog' },
    'pricing.html': { type: 'website', titleSuffix: 'Tarifs' },
    'en/pricing.html': { type: 'website', titleSuffix: 'Pricing' },
    'services/ecommerce.html': { type: 'website', titleSuffix: 'E-commerce Automation' },
    'en/services/ecommerce.html': { type: 'website', titleSuffix: 'E-commerce Automation' },
    'services/audit-gratuit.html': { type: 'website', titleSuffix: 'Audit Gratuit' },
    'en/services/free-audit.html': { type: 'website', titleSuffix: 'Free Audit' },
    'services/pme.html': { type: 'website', titleSuffix: 'PME Automation' },
    'en/services/smb.html': { type: 'website', titleSuffix: 'SMB Automation' },
    'services/flywheel-360.html': { type: 'website', titleSuffix: 'Système 360°' },
    'en/services/flywheel-360.html': { type: 'website', titleSuffix: '360° System' },
    'legal/mentions-legales.html': { type: 'website', titleSuffix: 'Mentions Légales' },
    'en/legal/terms.html': { type: 'website', titleSuffix: 'Terms' },
    'legal/politique-confidentialite.html': { type: 'website', titleSuffix: 'Confidentialité' },
    'en/legal/privacy.html': { type: 'website', titleSuffix: 'Privacy' },
    'contact.html': { type: 'website', titleSuffix: 'Contact' },
    'en/contact.html': { type: 'website', titleSuffix: 'Contact' }
};

let stats = { added: 0, skipped: 0 };

function getPageUrl(relativePath) {
    if (relativePath === 'index.html') return BASE_URL + '/';
    if (relativePath === 'en/index.html') return BASE_URL + '/en/';
    return BASE_URL + '/' + relativePath;
}

function addOgTags(content, relativePath, config) {
    const pageUrl = getPageUrl(relativePath);

    // Check what's missing
    const hasOgUrl = /property="og:url"/i.test(content);
    const hasOgType = /property="og:type"/i.test(content);
    const hasOgImage = /property="og:image"/i.test(content);
    const hasOgTitle = /property="og:title"/i.test(content);
    const hasOgDesc = /property="og:description"/i.test(content);
    const hasOgSiteName = /property="og:site_name"/i.test(content);

    let tagsToAdd = [];

    if (!hasOgUrl) {
        tagsToAdd.push(`<meta property="og:url" content="${pageUrl}">`);
    }
    if (!hasOgType) {
        tagsToAdd.push(`<meta property="og:type" content="${config.type}">`);
    }
    if (!hasOgImage) {
        tagsToAdd.push(`<meta property="og:image" content="${OG_IMAGE}">`);
    }
    if (!hasOgTitle) {
        tagsToAdd.push(`<meta property="og:title" content="3A Automation - ${config.titleSuffix}">`);
    }
    if (!hasOgSiteName) {
        tagsToAdd.push(`<meta property="og:site_name" content="3A Automation">`);
    }

    if (tagsToAdd.length === 0) {
        return content;
    }

    // Add after existing meta tags or before </head>
    const ogTagsStr = '\n    ' + tagsToAdd.join('\n    ');

    // Try to add after last meta tag
    const lastMetaMatch = content.match(/(<meta[^>]*>)(?![\s\S]*<meta)/i);
    if (lastMetaMatch) {
        const insertPos = content.lastIndexOf(lastMetaMatch[0]) + lastMetaMatch[0].length;
        return content.slice(0, insertPos) + ogTagsStr + content.slice(insertPos);
    }

    // Fallback: add before </head>
    return content.replace('</head>', ogTagsStr + '\n</head>');
}

function processFile(relativePath) {
    const filePath = path.join(SITE_DIR, relativePath);

    if (!fs.existsSync(filePath)) {
        return;
    }

    const config = PAGES_CONFIG[relativePath];
    if (!config) {
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const before = content;
    content = addOgTags(content, relativePath, config);

    if (content !== before) {
        fs.writeFileSync(filePath, content, 'utf8');
        stats.added++;
        console.log(`✅ Added OG tags: ${relativePath}`);
    } else {
        stats.skipped++;
        console.log(`⏭️  Complete: ${relativePath}`);
    }
}

function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║          FIX OG TAGS - ADD MISSING OPEN GRAPH                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    Object.keys(PAGES_CONFIG).forEach(page => processFile(page));

    console.log('\n' + '═'.repeat(50));
    console.log(`OG Tags added: ${stats.added} | Already complete: ${stats.skipped}`);
    console.log('═'.repeat(50));
}

main();
