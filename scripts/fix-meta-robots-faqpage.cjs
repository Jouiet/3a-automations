#!/usr/bin/env node
/**
 * FIX META ROBOTS + FAQPage Schema - 3A Automation
 * Date: 2026-01-02
 * Adds meta robots and FAQPage schema to indexable pages
 */

const fs = require('fs');
const path = require('path');

const LANDING_PAGE_DIR = path.join(__dirname, '..', 'landing-page-hostinger');

// Pages missing meta robots (indexable)
const PAGES_NEED_ROBOTS = [
  'pricing.html',
  'booking.html',
  'automations.html',
  'services/pme.html',
  'services/voice-ai.html',
  'services/audit-gratuit.html',
  'services/ecommerce.html',
  'en/pricing.html',
  'en/booking.html',
  'en/automations.html',
  'en/services/smb.html',
  'en/services/voice-ai.html',
  'en/services/free-audit.html',
  'en/services/ecommerce.html'
];

// FAQPage data for pages
const FAQPAGE_DATA = {
  'booking.html': {
    lang: 'fr',
    questions: [
      { q: "Comment fonctionne la consultation gratuite ?", a: "La consultation dure 30 minutes et nous permet d'analyser vos besoins en automatisation et de proposer des solutions personnalisees." },
      { q: "Puis-je annuler mon rendez-vous ?", a: "Oui, vous pouvez annuler ou reporter votre rendez-vous jusqu'a 24h avant l'heure prevue." },
      { q: "Que se passe-t-il apres la consultation ?", a: "Nous vous envoyons un compte-rendu avec nos recommandations et un devis personnalise sous 48h." }
    ]
  },
  'en/booking.html': {
    lang: 'en',
    questions: [
      { q: "How does the free consultation work?", a: "The consultation lasts 30 minutes and allows us to analyze your automation needs and propose personalized solutions." },
      { q: "Can I cancel my appointment?", a: "Yes, you can cancel or reschedule your appointment up to 24 hours before the scheduled time." },
      { q: "What happens after the consultation?", a: "We send you a summary with our recommendations and a personalized quote within 48 hours." }
    ]
  },
  'pricing.html': {
    lang: 'fr',
    questions: [
      { q: "Quels sont vos tarifs ?", a: "Nos packs commencent a 390 EUR pour Quick Win, 790 EUR pour Essentials, et 1399 EUR pour Growth. Retainers a partir de 290 EUR/mois." },
      { q: "Proposez-vous des paiements mensuels ?", a: "Oui, nos retainers Maintenance (290 EUR/mois) et Optimization (490 EUR/mois) sont factures mensuellement." },
      { q: "Y a-t-il un engagement minimum ?", a: "Non, pas d'engagement minimum pour les packs setup. Les retainers annuels offrent 2 mois gratuits." }
    ]
  },
  'en/pricing.html': {
    lang: 'en',
    questions: [
      { q: "What are your pricing plans?", a: "Our packs start at 450 USD for Quick Win, 920 USD for Essentials, and 1690 USD for Growth. Retainers from 330 USD/month." },
      { q: "Do you offer monthly payments?", a: "Yes, our Maintenance (330 USD/month) and Optimization (550 USD/month) retainers are billed monthly." },
      { q: "Is there a minimum commitment?", a: "No minimum commitment for setup packs. Annual retainers offer 2 free months." }
    ]
  },
  'automations.html': {
    lang: 'fr',
    questions: [
      { q: "Combien d'automations proposez-vous ?", a: "Nous avons developpe plus de 99 automations couvrant l'e-commerce, le marketing, le CRM, la voix IA, et bien plus." },
      { q: "Quels outils integrez-vous ?", a: "Nous integrons Shopify, Klaviyo, Make, n8n, Zapier, OpenAI, et plus de 50 autres plateformes." },
      { q: "Pouvez-vous creer des automations sur mesure ?", a: "Oui, nous developpons des automations personnalisees adaptees a vos processus metier specifiques." }
    ]
  },
  'en/automations.html': {
    lang: 'en',
    questions: [
      { q: "How many automations do you offer?", a: "We have developed over 99 automations covering e-commerce, marketing, CRM, voice AI, and more." },
      { q: "What tools do you integrate with?", a: "We integrate with Shopify, Klaviyo, Make, n8n, Zapier, OpenAI, and 50+ other platforms." },
      { q: "Can you create custom automations?", a: "Yes, we develop personalized automations tailored to your specific business processes." }
    ]
  }
};

function generateFAQPageSchema(data) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.questions.map(q => ({
      "@type": "Question",
      "name": q.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.a
      }
    }))
  };
  return JSON.stringify(schema, null, 2);
}

function addMetaRobots(content) {
  // Check if already has robots
  if (content.includes('name="robots"')) {
    return { content, added: false };
  }

  // Find insertion point after meta description
  const descMatch = content.match(/<meta name="description"[^>]+>/);
  if (!descMatch) {
    return { content, added: false };
  }

  const insertPoint = content.indexOf(descMatch[0]) + descMatch[0].length;
  const robotsTag = '\n  <meta name="robots" content="index, follow">';

  return {
    content: content.slice(0, insertPoint) + robotsTag + content.slice(insertPoint),
    added: true
  };
}

function addFAQPage(content, data) {
  // Check if already has FAQPage
  if (content.includes('"FAQPage"')) {
    return { content, added: false };
  }

  const schema = generateFAQPageSchema(data);
  const scriptTag = `\n  <script type="application/ld+json">\n${schema}\n  </script>`;

  // Insert before </head>
  const insertPoint = content.indexOf('</head>');
  if (insertPoint === -1) {
    return { content, added: false };
  }

  return {
    content: content.slice(0, insertPoint) + scriptTag + '\n' + content.slice(insertPoint),
    added: true
  };
}

function main() {
  console.log('========================================');
  console.log('  FIX META ROBOTS + FAQPage');
  console.log('  Date:', new Date().toISOString());
  console.log('========================================\n');

  let robotsAdded = 0;
  let faqAdded = 0;
  let filesModified = new Set();

  for (const page of PAGES_NEED_ROBOTS) {
    const filePath = path.join(LANDING_PAGE_DIR, page);

    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] Not found: ${page}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Add meta robots
    const robotsResult = addMetaRobots(content);
    if (robotsResult.added) {
      content = robotsResult.content;
      robotsAdded++;
      modified = true;
      console.log(`[+ROBOTS] ${page}`);
    }

    // Add FAQPage if applicable
    if (FAQPAGE_DATA[page]) {
      const faqResult = addFAQPage(content, FAQPAGE_DATA[page]);
      if (faqResult.added) {
        content = faqResult.content;
        faqAdded++;
        modified = true;
        console.log(`[+FAQPAGE] ${page}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      filesModified.add(page);
    }
  }

  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================');
  console.log(`Meta robots added: ${robotsAdded}`);
  console.log(`FAQPage added: ${faqAdded}`);
  console.log(`Files modified: ${filesModified.size}`);

  return { robotsAdded, faqAdded, filesModified: filesModified.size };
}

main();
