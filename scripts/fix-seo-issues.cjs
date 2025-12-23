#!/usr/bin/env node
/**
 * FIX SEO ISSUES - Automated corrections
 * Based on forensic-frontend-complete.cjs audit
 * Fixes: Titles, Meta descriptions, H1 tags, Schema.org
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// SEO Fixes Configuration
const SEO_FIXES = {
    // French Pages
    'a-propos.html': {
        title: 'Consultant Automation E-commerce & PME | 3A Automation',
        meta: 'Découvrez 3A Automation: consultant automation, analytics et AI pour PME e-commerce. Expertise Shopify, Klaviyo, GA4. Approche transparente, résultats mesurables.',
        h1: 'Consultant Automation, Analytics & AI'
    },
    'cas-clients.html': {
        title: 'Cas Clients E-commerce - Résultats Mesurés | 3A Automation',
        meta: 'Découvrez les succès de nos clients PME e-commerce: +72% conversion leads, -67% temps booking, ROI 42:1. Automations testées en production, accès sécurisé.',
        h1: 'Cas Clients & Résultats'
    },
    'contact.html': {
        title: 'Contactez l\'Expert Automation - Réponse 24-48h | 3A',
        meta: 'Besoin d\'automatisation? Contactez notre expert automation. Réponse garantie en 24-48h. Formulaire diagnostic gratuit. Spécialiste Shopify, CRM, Email marketing.',
        h1: 'Contactez-nous'
    },
    'pricing.html': {
        title: 'Tarifs Transparents - Packs Setup 390€ à 1399€ | 3A',
        meta: 'Pricing transparent: Packs Quick Win (390€), Essentials (790€), Growth (1399€) + Retainers mensuels. Voice AI et booking inclus. Pas de frais cachés.',
        h1: 'Tarifs & Packs'
    },
    'automations.html': {
        title: 'Catalogue 72 Automations E-commerce & Marketing | 3A',
        meta: 'Explorez notre catalogue de 72 automations: Shopify, Klaviyo, GA4, CRM. Scripts testés en production. Lead gen, email flows, analytics automatisés.',
        h1: 'Catalogue Automations'
    },
    'booking.html': {
        title: 'Réserver un Appel - Consultation Gratuite | 3A Automation',
        meta: 'Réservez votre consultation gratuite de 30 minutes avec un expert automation. Créneaux disponibles 7j/7. Audit de vos besoins en automatisation.',
        h1: 'Réserver un Appel'
    },
    '404.html': {
        title: 'Page Non Trouvée - 3A Automation',
        meta: 'La page que vous recherchez n\'existe plus ou a été déplacée. Explorez nos services automation, analytics et AI pour PME e-commerce.',
        h1: 'Page Non Trouvée'
    },
    'services/pme.html': {
        title: 'Automation PME & B2B - Lead Generation | 3A Automation',
        meta: 'Services automation pour PME et B2B: génération de leads, CRM automation, reporting automatisé. Solutions adaptées aux entreprises €10k-500k CA mensuel.',
        h1: 'Automation PME & B2B'
    },
    'services/ecommerce.html': {
        title: 'Automation E-commerce Shopify & Klaviyo | 3A Automation',
        meta: 'Services automation e-commerce: Shopify flows, Klaviyo email marketing, synchronisation multi-canaux. +72% conversion, ROI 42:1 prouvé sur nos clients.',
        h1: 'Automation E-commerce'
    },
    'services/audit-gratuit.html': {
        title: 'Audit E-commerce Gratuit - Rapport 48h | 3A Automation',
        meta: 'Audit gratuit de votre e-commerce: SEO, email marketing, conversion. Rapport détaillé en 48h avec 3 quick wins actionnables. Sans engagement.',
        h1: 'Audit E-commerce Gratuit'
    },
    'services/flywheel-360.html': {
        title: 'Système 360° - Automation Complète | 3A Automation',
        meta: 'Le système 360° 3A: acquisition, conversion, rétention automatisés. Analytics intégré, flows email, lead scoring. Solution complète pour scaling.',
        h1: 'Système 360°'
    },
    // English Pages
    'en/about.html': {
        title: 'Automation Expert - E-commerce & SMB Growth | 3A',
        meta: 'Meet 3A Automation: automation, analytics & AI consultant for e-commerce SMBs. Shopify, Klaviyo, GA4 expertise. Transparent process, measurable results.',
        h1: 'Automation, Analytics & AI Consultant'
    },
    'en/case-studies.html': {
        title: 'Case Studies - E-commerce ROI 42:1 | 3A Automation',
        meta: 'See real SMB & e-commerce wins: +72% lead conversion, -67% booking time, 42:1 email ROI. Production-tested automations, secure integrations.',
        h1: 'Case Studies & Results'
    },
    'en/contact.html': {
        title: 'Contact Automation Expert - Response 24-48h | 3A',
        meta: 'Need automation? Contact our expert now. Guaranteed response within 24-48h. Free diagnostic form. Specialist in Shopify, CRM, email automation.',
        h1: 'Contact Us'
    },
    'en/pricing.html': {
        title: 'Pricing Plans - Setup $450 to $1,690 | 3A Automation',
        meta: 'Transparent pricing: Quick Win ($450), Essentials ($920), Growth ($1,690) + monthly retainers. Voice AI & booking included. No hidden fees.',
        h1: 'Pricing & Plans'
    },
    'en/automations.html': {
        title: '66 E-commerce & Marketing Automations | 3A Automation',
        meta: 'Explore our catalog of 72 automations: Shopify, Klaviyo, GA4, CRM. Production-tested scripts. Lead gen, email flows, automated analytics.',
        h1: 'Automation Catalog'
    },
    'en/booking.html': {
        title: 'Book a Call - Free Consultation | 3A Automation',
        meta: 'Book your free 30-minute consultation with an automation expert. Available slots 7 days a week. Get your automation needs assessed.',
        h1: 'Book a Call'
    },
    'en/404.html': {
        title: 'Page Not Found - 3A Automation',
        meta: 'The page you are looking for does not exist or has been moved. Explore our automation, analytics and AI services for e-commerce SMBs.',
        h1: 'Page Not Found'
    },
    'en/services/smb.html': {
        title: 'SMB & B2B Automation - Lead Generation | 3A Automation',
        meta: 'Automation services for SMBs and B2B: lead generation, CRM automation, automated reporting. Solutions for businesses €10k-500k monthly revenue.',
        h1: 'SMB & B2B Automation'
    },
    'en/services/ecommerce.html': {
        title: 'E-commerce Automation Shopify & Klaviyo | 3A Automation',
        meta: 'E-commerce automation services: Shopify flows, Klaviyo email marketing, multi-channel sync. +72% conversion, proven 42:1 ROI on client projects.',
        h1: 'E-commerce Automation'
    },
    'en/services/free-audit.html': {
        title: 'Free E-commerce Audit - 48h Report | 3A Automation',
        meta: 'Free audit of your e-commerce: SEO, email marketing, conversion analysis. Detailed report in 48h with 3 actionable quick wins. No commitment.',
        h1: 'Free E-commerce Audit'
    },
    'en/services/flywheel-360.html': {
        title: '360° System - Complete Automation | 3A Automation',
        meta: 'The 3A 360° system: acquisition, conversion, retention automated. Integrated analytics, email flows, lead scoring. Complete scaling solution.',
        h1: '360° System'
    },
    'en/index.html': {
        title: 'Automation, Analytics & AI for E-commerce SMBs | 3A',
        meta: 'Transform your SMB with automation. 66 production-tested scripts for Shopify, Klaviyo, GA4. +72% conversion, 42:1 ROI. Start with free audit.',
        h1: null // Already has H1
    },
    'index.html': {
        title: 'Automation, Analytics & AI pour E-commerce PME | 3A',
        meta: 'Transformez votre PME avec l\'automation. 66 scripts testés en production pour Shopify, Klaviyo, GA4. +72% conversion, ROI 42:1. Audit gratuit.',
        h1: null // Already has H1
    }
};

// Schema.org templates for missing pages
const SCHEMA_TEMPLATES = {
    '404': (lang) => ({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": lang === 'fr' ? "Page Non Trouvée" : "Page Not Found",
        "description": lang === 'fr'
            ? "La page que vous recherchez n'existe plus ou a été déplacée."
            : "The page you're looking for doesn't exist or has been moved.",
        "url": `https://3a-automation.com${lang === 'fr' ? '' : '/en'}/404.html`,
        "isPartOf": {
            "@type": "WebSite",
            "name": "3A Automation",
            "url": "https://3a-automation.com"
        }
    }),
    'booking': (lang) => ({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": lang === 'fr' ? "Réservation Consultation" : "Consultation Booking",
        "description": lang === 'fr'
            ? "Réservez votre consultation gratuite de 30 minutes avec 3A Automation"
            : "Book your free 30-minute consultation with 3A Automation",
        "url": `https://3a-automation.com${lang === 'fr' ? '' : '/en'}/booking.html`,
        "provider": {
            "@type": "Organization",
            "name": "3A Automation",
            "url": "https://3a-automation.com"
        },
        "offers": {
            "@type": "Offer",
            "name": lang === 'fr' ? "Consultation Gratuite" : "Free Consultation",
            "price": "0",
            "priceCurrency": "EUR"
        },
        "areaServed": ["MA", "AE", "FR", "US"]
    }),
    'audit': (lang) => ({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": lang === 'fr' ? "Audit E-commerce Gratuit" : "Free E-commerce Audit",
        "description": lang === 'fr'
            ? "Analyse complète SEO, email marketing, conversion. Rapport détaillé en 48h."
            : "Complete SEO, email marketing, conversion analysis. Detailed report in 48h.",
        "url": `https://3a-automation.com${lang === 'fr' ? '/services/audit-gratuit.html' : '/en/services/free-audit.html'}`,
        "provider": {
            "@type": "Organization",
            "name": "3A Automation",
            "url": "https://3a-automation.com"
        },
        "offers": {
            "@type": "Offer",
            "name": lang === 'fr' ? "Audit Gratuit" : "Free Audit",
            "price": "0",
            "priceCurrency": "EUR",
            "description": lang === 'fr'
                ? "Formulaire diagnostic + Rapport PDF + 3 quick wins"
                : "Diagnostic form + PDF report + 3 quick wins"
        },
        "areaServed": ["MA", "AE", "FR", "US"],
        "serviceType": "Business Audit"
    }),
    'pme': (lang) => ({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": lang === 'fr' ? "Automation PME & B2B" : "SMB & B2B Automation",
        "description": lang === 'fr'
            ? "Services automation pour PME: lead generation, CRM automation, reporting automatisé."
            : "Automation services for SMBs: lead generation, CRM automation, automated reporting.",
        "url": `https://3a-automation.com${lang === 'fr' ? '/services/pme.html' : '/en/services/smb.html'}`,
        "provider": {
            "@type": "Organization",
            "name": "3A Automation",
            "url": "https://3a-automation.com"
        },
        "offers": {
            "@type": "Offer",
            "priceRange": "€300-€1000"
        },
        "areaServed": ["MA", "AE", "FR", "US"],
        "serviceType": "B2B Lead Generation & CRM Automation"
    })
};

let stats = {
    titlesFixed: 0,
    metasFixed: 0,
    h1sAdded: 0,
    schemasAdded: 0,
    errors: []
};

function fixTitle(content, newTitle) {
    const titleRegex = /<title>[^<]*<\/title>/i;
    if (titleRegex.test(content)) {
        return content.replace(titleRegex, `<title>${newTitle}</title>`);
    }
    return content;
}

function fixMeta(content, newMeta) {
    const metaRegex = /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i;
    const newMetaTag = `<meta name="description" content="${newMeta}">`;
    if (metaRegex.test(content)) {
        return content.replace(metaRegex, newMetaTag);
    }
    return content;
}

function addH1(content, h1Text) {
    // Check if H1 already exists
    if (/<h1[^>]*>/i.test(content)) {
        // H1 exists, check if it has hero-title class
        if (!/<h1[^>]*class="[^"]*hero-title[^"]*"[^>]*>/i.test(content)) {
            // Add class to existing H1
            content = content.replace(/<h1([^>]*)>/i, '<h1$1 class="hero-title">');
        }
        return content;
    }

    // No H1 exists, add one after hero section starts or after main
    const heroMatch = content.match(/<section[^>]*class="[^"]*hero[^"]*"[^>]*>/i);
    if (heroMatch) {
        const insertPos = content.indexOf(heroMatch[0]) + heroMatch[0].length;
        const h1Tag = `\n                <h1 class="hero-title">${h1Text}</h1>`;
        return content.slice(0, insertPos) + h1Tag + content.slice(insertPos);
    }

    // Fallback: add after <main>
    const mainMatch = content.match(/<main[^>]*>/i);
    if (mainMatch) {
        const insertPos = content.indexOf(mainMatch[0]) + mainMatch[0].length;
        const h1Tag = `\n        <h1 class="hero-title">${h1Text}</h1>`;
        return content.slice(0, insertPos) + h1Tag + content.slice(insertPos);
    }

    return content;
}

function addSchema(content, schemaObj) {
    // Check if schema already exists
    if (/application\/ld\+json/i.test(content)) {
        return content;
    }

    const schemaTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(schemaObj, null, 2).replace(/\n/g, '\n    ')}\n    </script>`;

    // Add before </head>
    return content.replace('</head>', schemaTag + '\n</head>');
}

function processFile(relativePath) {
    const filePath = path.join(SITE_DIR, relativePath);

    if (!fs.existsSync(filePath)) {
        stats.errors.push(`File not found: ${relativePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    const fixes = SEO_FIXES[relativePath];
    if (fixes) {
        // Fix title
        if (fixes.title) {
            const before = content;
            content = fixTitle(content, fixes.title);
            if (content !== before) {
                stats.titlesFixed++;
                modified = true;
            }
        }

        // Fix meta
        if (fixes.meta) {
            const before = content;
            content = fixMeta(content, fixes.meta);
            if (content !== before) {
                stats.metasFixed++;
                modified = true;
            }
        }

        // Add H1
        if (fixes.h1) {
            const before = content;
            content = addH1(content, fixes.h1);
            if (content !== before) {
                stats.h1sAdded++;
                modified = true;
            }
        }
    }

    // Add Schema.org for specific pages
    const lang = relativePath.startsWith('en/') ? 'en' : 'fr';
    let schemaType = null;

    if (relativePath.includes('404.html')) schemaType = '404';
    else if (relativePath.includes('booking.html')) schemaType = 'booking';
    else if (relativePath.includes('audit-gratuit.html') || relativePath.includes('free-audit.html')) schemaType = 'audit';
    else if (relativePath.includes('pme.html') || relativePath.includes('smb.html')) schemaType = 'pme';

    if (schemaType && SCHEMA_TEMPLATES[schemaType]) {
        const before = content;
        content = addSchema(content, SCHEMA_TEMPLATES[schemaType](lang));
        if (content !== before) {
            stats.schemasAdded++;
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${relativePath}`);
    } else {
        console.log(`⏭️  Skipped: ${relativePath} (no changes needed)`);
    }
}

function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║        FIX SEO ISSUES - AUTOMATED CORRECTIONS                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const pagesToFix = Object.keys(SEO_FIXES);
    console.log(`Processing ${pagesToFix.length} pages...\n`);

    for (const page of pagesToFix) {
        processFile(page);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('RÉSUMÉ:');
    console.log(`  Titles fixed:    ${stats.titlesFixed}`);
    console.log(`  Meta fixed:      ${stats.metasFixed}`);
    console.log(`  H1 tags added:   ${stats.h1sAdded}`);
    console.log(`  Schema added:    ${stats.schemasAdded}`);
    console.log('═'.repeat(60));

    if (stats.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        stats.errors.forEach(e => console.log(`  - ${e}`));
    }

    console.log('\n✅ SEO fixes completed!');
}

main();
