#!/usr/bin/env node
/**
 * ADD: FAQPage Schema to missing pages
 * Date: 2025-12-31
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// FAQPage content for each page
const PAGES_FAQ = {
  'a-propos.html': {
    lang: 'fr',
    faqs: [
      {
        q: "Qui est derrière 3A Automation ?",
        a: "3A Automation (AAA - AI Automation Agency) est une agence d'automatisation AI avec plus de 10 ans d'expérience dans l'e-commerce (B2C) et les PME (B2B). Notre expertise couvre TOUTES les plateformes e-commerce et CRM, avec intégrations AI avancées."
      },
      {
        q: "Quelle est la mission de 3A Automation ?",
        a: "Notre mission est de rendre l'automatisation accessible aux PME et e-commerces. Nous proposons 89 automatisations testées et éprouvées, avec un accompagnement humain personnalisé."
      },
      {
        q: "Travaillez-vous avec des entreprises internationales ?",
        a: "Oui, nous accompagnons des clients au Maghreb, en Europe et à l'international. Nos services sont disponibles en français et en anglais."
      },
      {
        q: "Comment garantissez-vous la qualité ?",
        a: "Chaque automatisation est testée sur des projets réels avant d'être proposée. Nous offrons un support continu et des optimisations mensuelles avec nos plans de maintenance."
      }
    ]
  },
  'en/about.html': {
    lang: 'en',
    faqs: [
      {
        q: "Who is behind 3A Automation?",
        a: "3A Automation (AAA - AI Automation Agency) is an AI automation agency with over 10 years of experience in e-commerce (B2C) and SMEs (B2B). Our expertise covers ALL e-commerce and CRM platforms, with advanced AI integrations."
      },
      {
        q: "What is 3A Automation's mission?",
        a: "Our mission is to make automation accessible to SMEs and e-commerce businesses. We offer 88 tested and proven automations, with personalized human support."
      },
      {
        q: "Do you work with international companies?",
        a: "Yes, we support clients in North Africa, Europe and internationally. Our services are available in French and English."
      },
      {
        q: "How do you ensure quality?",
        a: "Each automation is tested on real projects before being offered. We provide ongoing support and monthly optimizations with our maintenance plans."
      }
    ]
  },
  'automations.html': {
    lang: 'fr',
    faqs: [
      {
        q: "Combien d'automatisations proposez-vous ?",
        a: "Notre catalogue contient 89 automatisations testées, couvrant le lead generation, l'email marketing, l'e-commerce Shopify, et la voix IA."
      },
      {
        q: "Puis-je personnaliser les automatisations ?",
        a: "Oui, toutes nos automatisations sont personnalisables selon vos besoins spécifiques. Nous adaptons chaque workflow à votre contexte métier."
      },
      {
        q: "Quelles plateformes sont supportées ?",
        a: "Nous supportons Shopify, Klaviyo, n8n, Apify, ainsi que les APIs AI comme Grok, Gemini et Claude. Notre stack est extensible à d'autres plateformes."
      },
      {
        q: "Quel est le délai de mise en place ?",
        a: "Les automatisations Quick Win sont opérationnelles en 1-2 jours. Les projets plus complexes prennent 1-3 semaines selon le scope."
      }
    ]
  },
  'en/automations.html': {
    lang: 'en',
    faqs: [
      {
        q: "How many automations do you offer?",
        a: "Our catalog contains 86 tested automations, covering lead generation, email marketing, Shopify e-commerce, and Voice AI."
      },
      {
        q: "Can I customize the automations?",
        a: "Yes, all our automations are customizable to your specific needs. We adapt each workflow to your business context."
      },
      {
        q: "Which platforms are supported?",
        a: "We support Shopify, Klaviyo, n8n, Apify, as well as AI APIs like Grok, Gemini and Claude. Our stack is extensible to other platforms."
      },
      {
        q: "What is the implementation timeline?",
        a: "Quick Win automations are operational in 1-2 days. More complex projects take 1-3 weeks depending on scope."
      }
    ]
  }
};

function generateFAQSchema(faqs) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };
  return JSON.stringify(schema, null, 2);
}

function addFAQToFile(relativePath, config) {
  const filePath = path.join(BASE_DIR, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already has FAQPage
  if (/"@type"\s*:\s*"FAQPage"/i.test(content)) {
    console.log(`ℹ️  Already has FAQPage: ${relativePath}`);
    return false;
  }

  // Generate schema
  const schema = generateFAQSchema(config.faqs);

  // Find the best insertion point (before </head>)
  const insertPoint = content.lastIndexOf('</head>');

  if (insertPoint === -1) {
    console.log(`⚠️  No </head> found: ${relativePath}`);
    return false;
  }

  // Insert the schema script
  const schemaScript = `
  <!-- FAQPage Schema for AEO -->
  <script type="application/ld+json">
${schema.split('\n').map(l => '  ' + l).join('\n')}
  </script>
`;

  content = content.slice(0, insertPoint) + schemaScript + content.slice(insertPoint);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Added FAQPage: ${relativePath}`);
  return true;
}

// Main
console.log('🔧 Adding FAQPage schema to missing pages...\n');

let added = 0;

Object.entries(PAGES_FAQ).forEach(([relativePath, config]) => {
  const result = addFAQToFile(relativePath, config);
  if (result) added++;
});

console.log('\n' + '='.repeat(60));
console.log(`✅ FAQPage ajouté à ${added} pages`);
console.log('='.repeat(60));
