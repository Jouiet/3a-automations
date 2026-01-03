#!/usr/bin/env node
/**
 * Add FAQPage Schema.org to Service and Pricing Pages
 * Session 67 - 2025-12-23
 *
 * Adds FAQPage schema for better AI visibility and rich snippets
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = '/Users/mac/Desktop/JO-AAA/landing-page-hostinger';

// FAQ content for each page (FR)
const FAQ_CONTENT_FR = {
  'pricing.html': [
    {
      question: "Quels sont vos tarifs pour l'automatisation e-commerce ?",
      answer: "Nos packs démarrent à 390€ pour Quick Win, 790€ pour Essentials, et 1399€ pour Growth. Chaque pack inclut Voice AI Booking en bonus gratuit."
    },
    {
      question: "Y a-t-il des frais mensuels après le setup initial ?",
      answer: "Oui, nous proposons des retainers optionnels: Maintenance à 290€/mois et Optimization à 490€/mois. L'abonnement annuel offre 2 mois gratuits."
    },
    {
      question: "Proposez-vous un audit gratuit ?",
      answer: "Oui, nous offrons un audit e-commerce gratuit et complet. Réservez votre créneau via notre système Voice AI Booking ou par formulaire de contact."
    }
  ],
  'services/audit-gratuit.html': [
    {
      question: "Que comprend l'audit e-commerce gratuit ?",
      answer: "L'audit analyse votre boutique Shopify, vos flows email Klaviyo, votre tracking GA4, et identifie les opportunités d'automatisation avec ROI estimé."
    },
    {
      question: "Combien de temps dure l'audit ?",
      answer: "L'audit complet est livré sous 24-48h. Un rapport PDF détaillé vous est envoyé avec 3-5 quick wins actionnables immédiatement."
    },
    {
      question: "L'audit est-il vraiment gratuit sans engagement ?",
      answer: "Oui, 100% gratuit et sans engagement. C'est notre façon de démontrer notre valeur avant toute collaboration."
    }
  ],
  'services/ecommerce.html': [
    {
      question: "Quelles plateformes e-commerce supportez-vous ?",
      answer: "Nous supportons TOUTES les plateformes e-commerce: Shopify, WooCommerce, Magento, PrestaShop, BigCommerce, etc. Intégrations Klaviyo, GA4, Meta Ads, TikTok Ads. 88 automatisations prêtes à l'emploi."
    },
    {
      question: "Comment fonctionne l'automatisation des emails ?",
      answer: "Nous créons des flows Klaviyo automatisés: welcome series, abandon panier, post-achat, réactivation. En moyenne +25% de revenus email."
    },
    {
      question: "Quel ROI puis-je espérer ?",
      answer: "Nos clients constatent en moyenne 3x ROI en 90 jours, +25% revenus email, et -40% temps admin grâce aux automatisations."
    }
  ],
  'services/flywheel-360.html': [
    {
      question: "Qu'est-ce que le Système Flywheel 360° ?",
      answer: "C'est notre méthodologie complète d'automatisation couvrant acquisition, conversion, rétention et advocacy. 70 workflows IA intégrés."
    },
    {
      question: "Comment le Flywheel améliore-t-il mes résultats ?",
      answer: "Le système crée un cycle vertueux où chaque client satisfait génère plus de leads. Automatisation de bout en bout pour croissance durable."
    },
    {
      question: "Combien de temps pour voir des résultats ?",
      answer: "Les premiers quick wins sont visibles sous 2 semaines. L'impact complet du Flywheel se manifeste généralement en 60-90 jours."
    }
  ],
  'services/pme.html': [
    {
      question: "Vos services sont-ils adaptés aux PME ?",
      answer: "Oui, nous ciblons spécifiquement les PME avec CA de 10k-500k€/mois. Nos packs sont calibrés pour maximiser ROI avec budget limité."
    },
    {
      question: "Ai-je besoin de compétences techniques ?",
      answer: "Non, nous gérons tout. Vous recevez une documentation complète et un support pour utiliser vos nouvelles automatisations."
    },
    {
      question: "Puis-je commencer petit et évoluer ?",
      answer: "Absolument. Le pack Quick Win à 390€ est parfait pour démarrer. Vous pouvez évoluer vers Essentials ou Growth ensuite."
    }
  ]
};

// FAQ content for each page (EN)
const FAQ_CONTENT_EN = {
  'en/pricing.html': [
    {
      question: "What are your pricing plans for e-commerce automation?",
      answer: "Our packages start at $450 for Quick Win, $920 for Essentials, and $1,690 for Growth. Each includes Voice AI Booking as a free bonus."
    },
    {
      question: "Are there monthly fees after the initial setup?",
      answer: "Yes, we offer optional retainers: Maintenance at $330/month and Optimization at $550/month. Annual plans include 2 free months."
    },
    {
      question: "Do you offer a free audit?",
      answer: "Yes, we provide a free comprehensive e-commerce audit. Book your slot via Voice AI Booking or contact form."
    }
  ],
  'en/services/free-audit.html': [
    {
      question: "What does the free e-commerce audit include?",
      answer: "The audit analyzes your Shopify store, Klaviyo email flows, GA4 tracking, and identifies automation opportunities with estimated ROI."
    },
    {
      question: "How long does the audit take?",
      answer: "The complete audit is delivered within 24-48 hours. You receive a detailed PDF report with 3-5 actionable quick wins."
    },
    {
      question: "Is the audit truly free with no strings attached?",
      answer: "Yes, 100% free with no commitment. It's our way of demonstrating value before any collaboration."
    }
  ],
  'en/services/ecommerce.html': [
    {
      question: "Which e-commerce platforms do you support?",
      answer: "We specialize in Shopify with Klaviyo, GA4, Meta Ads, and TikTok Ads integration. 70 ready-to-use automations."
    },
    {
      question: "How does email automation work?",
      answer: "We create automated Klaviyo flows: welcome series, cart abandonment, post-purchase, win-back. Average +25% email revenue."
    },
    {
      question: "What ROI can I expect?",
      answer: "Our clients see on average 3x ROI in 90 days, +25% email revenue, and -40% admin time thanks to automations."
    }
  ],
  'en/services/flywheel-360.html': [
    {
      question: "What is the Flywheel 360° System?",
      answer: "It's our complete automation methodology covering acquisition, conversion, retention and advocacy. 70 AI-powered workflows."
    },
    {
      question: "How does the Flywheel improve my results?",
      answer: "The system creates a virtuous cycle where each satisfied customer generates more leads. End-to-end automation for sustainable growth."
    },
    {
      question: "How long before I see results?",
      answer: "First quick wins are visible within 2 weeks. Full Flywheel impact typically manifests in 60-90 days."
    }
  ],
  'en/services/smb.html': [
    {
      question: "Are your services suitable for SMBs?",
      answer: "Yes, we specifically target SMBs with $10k-$500k/month revenue. Our packages maximize ROI within limited budgets."
    },
    {
      question: "Do I need technical skills?",
      answer: "No, we handle everything. You receive complete documentation and support to use your new automations."
    },
    {
      question: "Can I start small and scale up?",
      answer: "Absolutely. The Quick Win package at $450 is perfect to start. You can upgrade to Essentials or Growth later."
    }
  ]
};

function generateFAQSchema(faqs, lang = 'fr') {
  const faqPageSchema = {
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

  return `<script type="application/ld+json">
${JSON.stringify(faqPageSchema, null, 2)}
</script>`;
}

function addFAQSchemaToFile(filePath, faqs, lang) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if FAQPage schema already exists
    if (content.includes('"@type": "FAQPage"') || content.includes('"@type":"FAQPage"')) {
      return { status: 'skipped', reason: 'FAQPage schema already exists' };
    }

    const schemaHTML = generateFAQSchema(faqs, lang);

    // Insert before </head>
    if (content.includes('</head>')) {
      content = content.replace(
        '</head>',
        `    ${schemaHTML}\n</head>`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      return { status: 'added', faqs: faqs.length };
    }

    return { status: 'error', reason: 'No </head> tag found' };
  } catch (err) {
    return { status: 'error', reason: err.message };
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('    ADD FAQPage SCHEMA - Session 67');
console.log('═══════════════════════════════════════════════════════════════\n');

let stats = { added: 0, skipped: 0, errors: 0 };

// Process FR pages
console.log('📝 Adding FAQPage schema to FR pages...\n');
for (const [page, faqs] of Object.entries(FAQ_CONTENT_FR)) {
  const filePath = path.join(LANDING_DIR, page);
  if (fs.existsSync(filePath)) {
    const result = addFAQSchemaToFile(filePath, faqs, 'fr');
    if (result.status === 'added') {
      console.log(`  ✅ ${page}: ${result.faqs} FAQs added`);
      stats.added++;
    } else if (result.status === 'skipped') {
      console.log(`  ⏭️  ${page}: ${result.reason}`);
      stats.skipped++;
    } else {
      console.log(`  ❌ ${page}: ${result.reason}`);
      stats.errors++;
    }
  } else {
    console.log(`  ❌ ${page}: File not found`);
    stats.errors++;
  }
}

// Process EN pages
console.log('\n📝 Adding FAQPage schema to EN pages...\n');
for (const [page, faqs] of Object.entries(FAQ_CONTENT_EN)) {
  const filePath = path.join(LANDING_DIR, page);
  if (fs.existsSync(filePath)) {
    const result = addFAQSchemaToFile(filePath, faqs, 'en');
    if (result.status === 'added') {
      console.log(`  ✅ ${page}: ${result.faqs} FAQs added`);
      stats.added++;
    } else if (result.status === 'skipped') {
      console.log(`  ⏭️  ${page}: ${result.reason}`);
      stats.skipped++;
    } else {
      console.log(`  ❌ ${page}: ${result.reason}`);
      stats.errors++;
    }
  } else {
    console.log(`  ❌ ${page}: File not found`);
    stats.errors++;
  }
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                        SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  FAQPage schemas added:  ${stats.added}`);
console.log(`  Skipped (existing):     ${stats.skipped}`);
console.log(`  Errors:                 ${stats.errors}`);
console.log('\n✅ FAQPage schema addition complete!');
console.log('═══════════════════════════════════════════════════════════════\n');
