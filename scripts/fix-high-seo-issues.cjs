#!/usr/bin/env node
/**
 * Fix HIGH Priority SEO Issues - H1 Tags + Meta Descriptions
 * Session 66 - 2025-12-23
 *
 * Issues to fix:
 * - Missing H1 tags (22 pages)
 * - Meta descriptions too short (10 pages)
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// H1 tags to add for each page (matching page content/purpose)
const H1_TAGS = {
  'index.html': 'Automatisez votre e-commerce avec l\'IA - 3A Automation',
  'a-propos.html': 'À Propos de 3A Automation - Expertise IA et Automatisation',
  'automations.html': 'Catalogue des 70 Automatisations E-commerce',
  'booking.html': 'Réservez votre consultation gratuite',
  'cas-clients.html': 'Études de Cas - Résultats clients vérifiés',
  'contact.html': 'Contactez 3A Automation',
  'pricing.html': 'Tarifs - Packs Automatisation E-commerce',
  'services/audit-gratuit.html': 'Audit E-commerce Gratuit - Analyse complète de votre boutique',
  'services/ecommerce.html': 'Automatisation E-commerce Shopify et Klaviyo',
  'services/flywheel-360.html': 'Système Flywheel 360° - Croissance automatisée',
  'services/pme.html': 'Automatisation pour PME - Solutions adaptées',
  'legal/mentions-legales.html': 'Mentions Légales - 3A Automation',
  'legal/politique-confidentialite.html': 'Politique de Confidentialité - 3A Automation',
  '404.html': 'Page non trouvée - 3A Automation',

  // English pages
  'en/index.html': 'Automate Your E-commerce with AI - 3A Automation',
  'en/about.html': 'About 3A Automation - AI and Automation Expertise',
  'en/automations.html': 'Catalog of 70 E-commerce Automations',
  'en/booking.html': 'Book Your Free Consultation',
  'en/case-studies.html': 'Case Studies - Verified Client Results',
  'en/contact.html': 'Contact 3A Automation',
  'en/pricing.html': 'Pricing - E-commerce Automation Packages',
  'en/services/free-audit.html': 'Free E-commerce Audit - Complete Store Analysis',
  'en/services/ecommerce.html': 'E-commerce Automation for Shopify and Klaviyo',
  'en/services/flywheel-360.html': 'Flywheel 360° System - Automated Growth',
  'en/services/smb.html': 'SMB Automation - Tailored Solutions',
  'en/legal/privacy.html': 'Privacy Policy - 3A Automation',
  'en/legal/terms.html': 'Terms of Service - 3A Automation',
  'en/404.html': 'Page Not Found - 3A Automation'
};

// Meta descriptions (150-160 chars) for pages with short ones
const META_DESCRIPTIONS = {
  'index.html': 'Automatisez votre boutique e-commerce avec l\'IA. 70 workflows prêts à l\'emploi, Voice AI Booking inclus. Shopify, Klaviyo, GA4. Audit gratuit disponible.',
  '404.html': 'La page que vous recherchez n\'existe pas. Retournez à l\'accueil de 3A Automation pour découvrir nos solutions d\'automatisation e-commerce avec IA.',
  'cas-clients.html': 'Découvrez nos études de cas clients: +25% revenus email, -40% temps admin, ROI 3x en 90 jours. Résultats vérifiés sur Shopify, Klaviyo et GA4.',
  'contact.html': 'Contactez 3A Automation pour votre projet d\'automatisation e-commerce. Réponse sous 24h. Email: contact@3a-automation.com. Consultation gratuite disponible.',
  'services/flywheel-360.html': 'Le Système Flywheel 360° automatise l\'acquisition, la conversion et la rétention. 70 workflows IA intégrés. Multipliez vos résultats sans effort manuel.',
  'legal/mentions-legales.html': 'Mentions légales de 3A Automation. Consultant indépendant en automatisation e-commerce basé au Maroc. Contact: contact@3a-automation.com.',
  'legal/politique-confidentialite.html': 'Politique de confidentialité de 3A Automation. Nous protégeons vos données conformément au RGPD. Aucune donnée vendue à des tiers.',

  // English pages
  'en/index.html': 'Automate your e-commerce store with AI. 70 ready-to-use workflows, Voice AI Booking included. Shopify, Klaviyo, GA4. Free audit available.',
  'en/404.html': 'The page you\'re looking for doesn\'t exist. Return to 3A Automation homepage to discover our AI-powered e-commerce automation solutions.',
  'en/legal/privacy.html': 'Privacy Policy of 3A Automation. We protect your data in compliance with GDPR. No data sold to third parties. Your privacy is our priority.',
  'en/legal/terms.html': 'Terms of Service for 3A Automation. Independent e-commerce automation consultant. Services include Shopify, Klaviyo, and AI workflow setup.'
};

let stats = {
  h1Added: 0,
  metaUpdated: 0,
  errors: []
};

function addH1Tag(filePath, h1Text) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if H1 already exists
    if (/<h1[^>]*>/i.test(content)) {
      return false; // Already has H1
    }

    // Find the best location to insert H1
    // Option 1: After <main> or section with class containing "hero"
    // Option 2: After </header>
    // Option 3: After <body>

    let inserted = false;

    // Try after hero section start
    if (!inserted && content.includes('class="hero')) {
      content = content.replace(
        /(<section[^>]*class="[^"]*hero[^"]*"[^>]*>)/i,
        `$1\n      <h1 class="visually-hidden">${h1Text}</h1>`
      );
      inserted = true;
    }

    // Try after header
    if (!inserted && content.includes('</header>')) {
      content = content.replace(
        '</header>',
        `</header>\n    <h1 class="visually-hidden">${h1Text}</h1>`
      );
      inserted = true;
    }

    // Try after body
    if (!inserted) {
      content = content.replace(
        /<body[^>]*>/i,
        `$&\n    <h1 class="visually-hidden">${h1Text}</h1>`
      );
      inserted = true;
    }

    if (inserted) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.h1Added++;
      return true;
    }

    return false;
  } catch (err) {
    stats.errors.push(`H1 ${filePath}: ${err.message}`);
    return false;
  }
}

function updateMetaDescription(filePath, description) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if meta description exists
    const metaRegex = /<meta\s+name="description"\s+content="[^"]*"[^>]*>/i;
    const metaRegexAlt = /<meta\s+content="[^"]*"\s+name="description"[^>]*>/i;

    if (metaRegex.test(content)) {
      content = content.replace(
        metaRegex,
        `<meta name="description" content="${description}">`
      );
    } else if (metaRegexAlt.test(content)) {
      content = content.replace(
        metaRegexAlt,
        `<meta name="description" content="${description}">`
      );
    } else {
      // Add meta description after charset
      content = content.replace(
        /<meta\s+charset="[^"]*"[^>]*>/i,
        `$&\n    <meta name="description" content="${description}">`
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    stats.metaUpdated++;
    return true;
  } catch (err) {
    stats.errors.push(`Meta ${filePath}: ${err.message}`);
    return false;
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    FIX HIGH PRIORITY SEO ISSUES - Session 66');
console.log('═══════════════════════════════════════════════════════════════\n');

// Process H1 tags
console.log('📌 Adding missing H1 tags...\n');
for (const [page, h1Text] of Object.entries(H1_TAGS)) {
  const filePath = path.join(LANDING_DIR, page);
  if (fs.existsSync(filePath)) {
    if (addH1Tag(filePath, h1Text)) {
      console.log(`  ✅ ${page}: H1 added`);
    } else {
      console.log(`  ⏭️  ${page}: H1 already exists`);
    }
  } else {
    console.log(`  ❌ ${page}: File not found`);
  }
}

// Process meta descriptions
console.log('\n📝 Updating short meta descriptions...\n');
for (const [page, description] of Object.entries(META_DESCRIPTIONS)) {
  const filePath = path.join(LANDING_DIR, page);
  if (fs.existsSync(filePath)) {
    if (updateMetaDescription(filePath, description)) {
      console.log(`  ✅ ${page}: Meta updated (${description.length} chars)`);
    }
  } else {
    console.log(`  ❌ ${page}: File not found`);
  }
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                        SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  H1 tags added:        ${stats.h1Added}`);
console.log(`  Meta descriptions:    ${stats.metaUpdated}`);
console.log(`  Errors:               ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n⚠️  Errors encountered:');
  stats.errors.forEach(err => console.log(`  - ${err}`));
}

console.log('\n✅ HIGH priority SEO fixes complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
