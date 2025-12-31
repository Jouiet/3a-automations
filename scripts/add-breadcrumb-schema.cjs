#!/usr/bin/env node
/**
 * ADD: BreadcrumbList Schema to pages missing it
 * Adds structured data for SEO
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Pages that need breadcrumbs (from audit)
const PAGES_CONFIG = {
  // Blog FR
  'blog/assistant-vocal-ia-pme-2026.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Blog', url: 'https://3a-automation.com/blog/' },
      { name: 'Assistant Vocal IA PME 2026', url: 'https://3a-automation.com/blog/assistant-vocal-ia-pme-2026.html' }
    ]
  },
  'blog/automatisation-ecommerce-2026.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Blog', url: 'https://3a-automation.com/blog/' },
      { name: 'Automatisation E-commerce 2026', url: 'https://3a-automation.com/blog/automatisation-ecommerce-2026.html' }
    ]
  },
  'blog/comment-automatiser-votre-service-client-avec-l-ia.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Blog', url: 'https://3a-automation.com/blog/' },
      { name: 'Automatiser Service Client IA', url: 'https://3a-automation.com/blog/comment-automatiser-votre-service-client-avec-l-ia.html' }
    ]
  },
  'blog/marketing-automation-pour-startups-2026-guide-complet.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Blog', url: 'https://3a-automation.com/blog/' },
      { name: 'Marketing Automation Startups 2026', url: 'https://3a-automation.com/blog/marketing-automation-pour-startups-2026-guide-complet.html' }
    ]
  },
  'blog/index.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Blog', url: 'https://3a-automation.com/blog/' }
    ]
  },
  // Blog EN
  'en/blog/ecommerce-automation-2026.html': {
    lang: 'en',
    breadcrumb: [
      { name: 'Home', url: 'https://3a-automation.com/en/' },
      { name: 'Blog', url: 'https://3a-automation.com/en/blog/' },
      { name: 'E-commerce Automation 2026', url: 'https://3a-automation.com/en/blog/ecommerce-automation-2026.html' }
    ]
  },
  'en/blog/how-to-automate-customer-service-with-ai-effectively.html': {
    lang: 'en',
    breadcrumb: [
      { name: 'Home', url: 'https://3a-automation.com/en/' },
      { name: 'Blog', url: 'https://3a-automation.com/en/blog/' },
      { name: 'Automate Customer Service with AI', url: 'https://3a-automation.com/en/blog/how-to-automate-customer-service-with-ai-effectively.html' }
    ]
  },
  'en/blog/voice-ai-assistant-sme-2026.html': {
    lang: 'en',
    breadcrumb: [
      { name: 'Home', url: 'https://3a-automation.com/en/' },
      { name: 'Blog', url: 'https://3a-automation.com/en/blog/' },
      { name: 'Voice AI Assistant SME 2026', url: 'https://3a-automation.com/en/blog/voice-ai-assistant-sme-2026.html' }
    ]
  },
  'en/blog/index.html': {
    lang: 'en',
    breadcrumb: [
      { name: 'Home', url: 'https://3a-automation.com/en/' },
      { name: 'Blog', url: 'https://3a-automation.com/en/blog/' }
    ]
  },
  // Legal FR
  'legal/mentions-legales.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Mentions Légales', url: 'https://3a-automation.com/legal/mentions-legales.html' }
    ]
  },
  'legal/politique-confidentialite.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Politique de Confidentialité', url: 'https://3a-automation.com/legal/politique-confidentialite.html' }
    ]
  },
  // Legal EN
  'en/legal/privacy.html': {
    lang: 'en',
    breadcrumb: [
      { name: 'Home', url: 'https://3a-automation.com/en/' },
      { name: 'Privacy Policy', url: 'https://3a-automation.com/en/legal/privacy.html' }
    ]
  },
  'en/legal/terms.html': {
    lang: 'en',
    breadcrumb: [
      { name: 'Home', url: 'https://3a-automation.com/en/' },
      { name: 'Terms of Service', url: 'https://3a-automation.com/en/legal/terms.html' }
    ]
  },
  // Services - Flywheel
  'services/flywheel-360.html': {
    lang: 'fr',
    breadcrumb: [
      { name: 'Accueil', url: 'https://3a-automation.com/' },
      { name: 'Services', url: 'https://3a-automation.com/services/ecommerce.html' },
      { name: 'Flywheel 360', url: 'https://3a-automation.com/services/flywheel-360.html' }
    ]
  },
  'en/services/flywheel-360.html': {
    lang: 'en',
    breadcrumb: [
      { name: 'Home', url: 'https://3a-automation.com/en/' },
      { name: 'Services', url: 'https://3a-automation.com/en/services/ecommerce.html' },
      { name: 'Flywheel 360', url: 'https://3a-automation.com/en/services/flywheel-360.html' }
    ]
  }
};

function generateBreadcrumbSchema(items) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
  return JSON.stringify(schema, null, 2);
}

function addBreadcrumbToFile(relativePath, config) {
  const filePath = path.join(BASE_DIR, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already has breadcrumb
  if (/"@type"\s*:\s*"BreadcrumbList"/i.test(content)) {
    console.log(`ℹ️  Already has BreadcrumbList: ${relativePath}`);
    return false;
  }

  // Generate schema
  const schema = generateBreadcrumbSchema(config.breadcrumb);

  // Find the best insertion point (after last </script> in head or before </head>)
  const insertPoint = content.lastIndexOf('</head>');

  if (insertPoint === -1) {
    console.log(`⚠️  No </head> found: ${relativePath}`);
    return false;
  }

  // Insert the schema script
  const schemaScript = `
  <!-- BreadcrumbList Schema for SEO -->
  <script type="application/ld+json">
${schema.split('\n').map(l => '  ' + l).join('\n')}
  </script>
`;

  content = content.slice(0, insertPoint) + schemaScript + content.slice(insertPoint);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Added BreadcrumbList: ${relativePath}`);
  return true;
}

// Main
console.log('🔧 Adding BreadcrumbList schema to pages...\n');

let added = 0;
let skipped = 0;

Object.entries(PAGES_CONFIG).forEach(([relativePath, config]) => {
  const result = addBreadcrumbToFile(relativePath, config);
  if (result) {
    added++;
  } else {
    skipped++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log('='.repeat(60));
console.log(`✅ BreadcrumbList ajouté: ${added} pages`);
console.log(`ℹ️  Ignoré (déjà présent ou erreur): ${skipped} pages`);
console.log('='.repeat(60));
