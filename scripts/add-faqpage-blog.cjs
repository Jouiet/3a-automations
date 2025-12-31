#!/usr/bin/env node
/**
 * ADD FAQPage Schema to Blog Articles
 * Session 117bis - 31/12/2025
 * Adds contextual FAQ schema to blog articles for AEO
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'landing-page-hostinger', 'blog');
const EN_BLOG_DIR = path.join(__dirname, '..', 'landing-page-hostinger', 'en', 'blog');

// FAQ content for each blog article (FR)
const BLOG_FAQS = {
  'automatisation-ecommerce-2026.html': [
    {
      question: "Quel est le ROI moyen de l'email marketing automatisé pour l'e-commerce?",
      answer: "L'email marketing automatisé génère un ROI moyen de 42:1 selon DMA 2024. Pour chaque 1€ investi, vous récupérez 42€ en revenus."
    },
    {
      question: "Combien de paniers abandonnés peut-on récupérer avec l'automatisation?",
      answer: "Une séquence d'abandon de panier bien configurée (3 emails sur 72h) permet de récupérer entre 5% et 15% des paniers abandonnés."
    },
    {
      question: "Quels outils utiliser pour automatiser son e-commerce en 2026?",
      answer: "Le stack recommandé comprend Klaviyo pour l'email/SMS automation (ROI 42:1), Shopify Flow pour les workflows e-commerce, GA4+GTM pour l'analytics, et n8n pour les workflows complexes."
    }
  ],
  'assistant-vocal-ia-pme-2026.html': [
    {
      question: "Qu'est-ce qu'un assistant vocal IA pour PME?",
      answer: "Un assistant vocal IA est un widget intégré à votre site web qui permet aux visiteurs de poser des questions oralement 24/7 et obtenir des réponses instantanées, qualifier les leads et prendre des rendez-vous automatiquement."
    },
    {
      question: "Combien coûte un assistant vocal IA pour une PME?",
      answer: "Le coût varie selon l'utilisation. La version basique utilise le Web Speech API gratuit du navigateur. La version premium avec voix naturelle coûte environ 0.05€/minute de conversation."
    },
    {
      question: "Quels sont les avantages d'un assistant vocal pour une PME?",
      answer: "Les principaux avantages sont: disponibilité 24/7, qualification automatique des leads, prise de rendez-vous intégrée, réduction des appels entrants, et amélioration de l'expérience client."
    }
  ],
  'comment-automatiser-votre-service-client-avec-l-ia.html': [
    {
      question: "Comment l'IA peut-elle automatiser le service client?",
      answer: "L'IA peut automatiser le service client via des chatbots intelligents, des assistants vocaux, la classification automatique des tickets, les réponses suggérées, et l'analyse de sentiment pour prioriser les demandes urgentes."
    },
    {
      question: "Quel pourcentage des demandes peut être traité automatiquement?",
      answer: "En moyenne, 60-80% des demandes de premier niveau peuvent être traitées automatiquement par l'IA, permettant aux agents humains de se concentrer sur les cas complexes."
    },
    {
      question: "L'IA va-t-elle remplacer les agents du service client?",
      answer: "Non, l'IA augmente les capacités des agents plutôt que de les remplacer. Elle gère les demandes répétitives et fournit des suggestions, permettant aux agents de traiter plus de cas complexes avec une meilleure qualité."
    }
  ],
  'marketing-automation-pour-startups-2026-guide-complet.html': [
    {
      question: "Pourquoi les startups ont-elles besoin du marketing automation?",
      answer: "Les startups ont des ressources limitées et doivent scaler rapidement. Le marketing automation permet de gérer plus de leads avec moins de ressources, personnaliser les communications à grande échelle, et mesurer précisément le ROI de chaque action."
    },
    {
      question: "Par où commencer le marketing automation pour une startup?",
      answer: "Commencez par 3 automations essentielles: une séquence de bienvenue pour les nouveaux inscrits, un lead scoring basique, et un suivi post-demo automatisé. Ces 3 éléments suffisent pour démarrer efficacement."
    },
    {
      question: "Quel budget prévoir pour le marketing automation d'une startup?",
      answer: "Pour démarrer, comptez entre 50-200€/mois pour les outils (Klaviyo, HubSpot Starter, ou alternatives gratuites) et 1-2 jours de configuration initiale. Le ROI est généralement atteint en 2-3 mois."
    }
  ]
};

// FAQ content for EN blog articles
const EN_BLOG_FAQS = {
  'ecommerce-automation-2026.html': [
    {
      question: "What is the average ROI of automated email marketing for e-commerce?",
      answer: "Automated email marketing generates an average ROI of 42:1 according to DMA 2024. For every $1 invested, you recover $42 in revenue."
    },
    {
      question: "How many abandoned carts can be recovered with automation?",
      answer: "A well-configured cart abandonment sequence (3 emails over 72h) can recover between 5% and 15% of abandoned carts."
    },
    {
      question: "What tools should you use to automate your e-commerce in 2026?",
      answer: "The recommended stack includes Klaviyo for email/SMS automation (42:1 ROI), Shopify Flow for e-commerce workflows, GA4+GTM for analytics, and n8n for complex workflows."
    }
  ],
  'voice-ai-assistant-sme-2026.html': [
    {
      question: "What is a Voice AI assistant for small businesses?",
      answer: "A Voice AI assistant is a widget integrated into your website that allows visitors to ask questions verbally 24/7, get instant answers, qualify leads, and book appointments automatically."
    },
    {
      question: "How much does a Voice AI assistant cost for a small business?",
      answer: "Cost varies by usage. The basic version uses the browser's free Web Speech API. The premium version with natural voice costs approximately $0.05/minute of conversation."
    },
    {
      question: "What are the benefits of a voice assistant for SMEs?",
      answer: "Key benefits include: 24/7 availability, automatic lead qualification, integrated appointment booking, reduced incoming calls, and improved customer experience."
    }
  ],
  'how-to-automate-customer-service-with-ai-effectively.html': [
    {
      question: "How can AI automate customer service?",
      answer: "AI can automate customer service through intelligent chatbots, voice assistants, automatic ticket classification, suggested responses, and sentiment analysis to prioritize urgent requests."
    },
    {
      question: "What percentage of requests can be handled automatically?",
      answer: "On average, 60-80% of first-level requests can be handled automatically by AI, allowing human agents to focus on complex cases."
    },
    {
      question: "Will AI replace customer service agents?",
      answer: "No, AI augments agent capabilities rather than replacing them. It handles repetitive requests and provides suggestions, allowing agents to handle more complex cases with better quality."
    }
  ]
};

function generateFAQSchema(faqs, url) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

function addFAQToArticle(filePath, faqs) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ File not found: ${path.basename(filePath)}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  // Check if FAQPage already exists
  if (content.includes('"@type": "FAQPage"') || content.includes('"@type":"FAQPage"')) {
    console.log(`  ⏭️ FAQPage already exists: ${fileName}`);
    return false;
  }

  // Find the closing </head> tag
  const headCloseIndex = content.indexOf('</head>');
  if (headCloseIndex === -1) {
    console.log(`  ❌ No </head> found: ${fileName}`);
    return false;
  }

  // Determine base URL
  const isEN = filePath.includes('/en/');
  const baseUrl = isEN
    ? `https://3a-automation.com/en/blog/${fileName}`
    : `https://3a-automation.com/blog/${fileName}`;

  // Generate schema
  const faqSchema = generateFAQSchema(faqs, baseUrl);
  const schemaScript = `
  <!-- FAQPage Schema for AEO - Session 117bis -->
  <script type="application/ld+json">
  ${JSON.stringify(faqSchema, null, 2)}
  </script>
`;

  // Insert before </head>
  content = content.slice(0, headCloseIndex) + schemaScript + content.slice(headCloseIndex);

  fs.writeFileSync(filePath, content);
  console.log(`  ✅ FAQPage added: ${fileName} (${faqs.length} Q&A)`);
  return true;
}

function main() {
  console.log('=' .repeat(60));
  console.log('ADD FAQPage Schema to Blog Articles');
  console.log('Session 117bis - 31/12/2025');
  console.log('=' .repeat(60));

  let addedCount = 0;
  let skippedCount = 0;

  // Process FR blog articles
  console.log('\n📝 Processing FR blog articles...');
  for (const [fileName, faqs] of Object.entries(BLOG_FAQS)) {
    const filePath = path.join(BLOG_DIR, fileName);
    if (addFAQToArticle(filePath, faqs)) {
      addedCount++;
    } else {
      skippedCount++;
    }
  }

  // Process EN blog articles
  console.log('\n📝 Processing EN blog articles...');
  for (const [fileName, faqs] of Object.entries(EN_BLOG_FAQS)) {
    const filePath = path.join(EN_BLOG_DIR, fileName);
    if (addFAQToArticle(filePath, faqs)) {
      addedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`SUMMARY: ${addedCount} FAQPage schemas added, ${skippedCount} skipped`);
  console.log('=' .repeat(60));

  return addedCount;
}

main();
