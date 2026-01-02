/**
 * 3A Automation - Knowledge Base pour Assistant IA
 * Version: 2.0
 *
 * Base de connaissances enrichie avec:
 * - Contexte conversationnel
 * - Réponses multi-industries
 * - Qualification des leads
 * - Suggestions proactives
 */

const KNOWLEDGE_BASE = {

  // === IDENTITÉ ===
  identity: {
    name: '3A Automation',
    meaning: 'Automation, Analytics, AI',
    expertise: ['Email Marketing Klaviyo', 'E-commerce Shopify', 'Analytics GA4', 'Automatisations Node.js'],
    target: 'PME et e-commerce (€10k-500k/mois CA)',
    differentiator: 'Agence spécialisée automation - relation directe avec experts, prix justes'
  },

  // === TARIFICATION COMPLÈTE ===
  pricing: {
    setup: {
      quickWin: {
        price: '390€',
        time: '3-4h',
        includes: ['Audit express', '1 flow optimisé', 'Documentation PDF'],
        ideal: 'Tester notre approche'
      },
      essentials: {
        price: '790€',
        time: '7-9h',
        includes: ['Audit complet', '3 flows automatisés', 'A/B tests', 'Support 30 jours'],
        ideal: 'Démarrer sérieusement'
      },
      growth: {
        price: '1399€',
        time: '14-18h',
        includes: ['5 flows complets', 'Segmentation RFM', 'Dashboard personnalisé', 'Support 60 jours'],
        ideal: 'Transformation complète'
      }
    },
    abonnement: {
      maintenance: { price: '290€/mois', hours: '3h', includes: ['Monitoring', 'Fixes', 'Rapport mensuel'] },
      optimization: { price: '490€/mois', hours: '5h', includes: ['+ A/B tests', 'Optimisation continue', 'Support prioritaire'] }
    },
    free: {
      audit: {
        description: 'Audit e-commerce complet GRATUIT',
        deliverable: 'Rapport PDF avec 3 quick wins',
        delay: '24-48h après formulaire'
      }
    }
  },

  // === SERVICES PAR INDUSTRIE ===
  industries: {
    ecommerce: {
      keywords: ['e-commerce', 'ecommerce', 'boutique', 'shopify', 'woocommerce', 'vente en ligne'],
      services: [
        'Abandon de panier automatisé (récupère 5-15% des ventes perdues)',
        'Welcome series (nouveaux clients)',
        'Post-purchase flows (fidélisation)',
        'Back-in-stock alerts',
        'Segmentation RFM automatique',
        'Dashboard performance temps réel'
      ],
      roi: 'ROI moyen: 36-42€ pour 1€ investi en email marketing (Litmus 2025)'
    },
    b2b: {
      keywords: ['b2b', 'btob', 'entreprise', 'professionnel', 'corporate', 'industrie', 'services'],
      services: [
        'Lead scoring automatique',
        'Nurturing sequences (éduquer les prospects)',
        'CRM sync (HubSpot, Pipedrive, Salesforce)',
        'Qualification automatique',
        'Alertes commerciales',
        'Reporting pipeline'
      ],
      roi: 'Réduction 60% du temps de qualification leads'
    },
    btp: {
      keywords: ['btp', 'construction', 'batiment', 'chantier', 'artisan', 'renovation'],
      services: [
        'Capture leads chantiers (Google Maps, annuaires)',
        'Relances automatiques devis',
        'Suivi clients post-travaux',
        'Demandes d\'avis automatisées',
        'Alertes nouveaux appels d\'offres'
      ],
      specifique: 'Spécialisé dans la capture de leads BTP via scraping Google Maps et annuaires professionnels'
    },
    saas: {
      keywords: ['saas', 'software', 'application', 'startup', 'tech', 'digital'],
      services: [
        'Onboarding automatisé',
        'Churn prevention (users à risque)',
        'Feature adoption emails',
        'NPS automatique',
        'Upsell/cross-sell triggers'
      ]
    },
    retail: {
      keywords: ['retail', 'magasin', 'point de vente', 'commerce', 'boutique physique'],
      services: [
        'Drive-to-store emails',
        'Programme fidélité automatisé',
        'Anniversaires clients',
        'Promotions géolocalisées',
        'Réactivation clients dormants'
      ]
    },
    services: {
      keywords: ['service', 'prestataire', 'consultant', 'agence', 'freelance', 'cabinet'],
      services: [
        'Automatisation prospection',
        'Nurturing leads longs',
        'Rappels rendez-vous',
        'Facturation automatique',
        'Demandes de témoignages'
      ]
    }
  },

  // === PROCESSUS ===
  process: {
    steps: [
      { num: 1, name: 'Formulaire Diagnostic', duration: '5-10 min', description: 'Vous remplissez un court formulaire sur votre activité' },
      { num: 2, name: 'Rapport PDF', duration: '24-48h', description: 'Nous vous envoyons un rapport avec 3 recommandations prioritaires' },
      { num: 3, name: 'Proposition', duration: 'Google Docs', description: 'Proposition détaillée avec prix et planning' },
      { num: 4, name: 'Livraison', duration: 'Selon pack', description: 'Implémentation + documentation + support' }
    ],
    noCall: 'Tout se fait par écrit - pas d\'appels obligatoires (sauf si vous préférez)',
    guarantee: 'Satisfait ou on itère jusqu\'à ce que ça marche'
  },

  // === AUTOMATISATIONS DISPONIBLES ===
  automations: {
    total: 78,
    categories: {
      leadGen: ['Sync Meta/Google/TikTok Leads', 'LinkedIn scraping', 'Google Maps sourcing', 'Lead scoring', 'Geo-Segmentation'],
      email: ['Welcome series', 'Abandon panier', 'Post-achat', 'Winback', 'Browse abandonment', 'VIP Tiers'],
      shopify: ['Enrichissement produits', 'Google Shopping', 'Collections', 'Webhooks Loyalty', 'Audit Store'],
      analytics: ['Dashboard Looker', 'Rapport GA4', 'Alertes Stock', 'Pixels vérification', 'Projections'],
      seo: ['Alt text auto', 'Meta tags', 'Schema.org', 'Sitemap images', 'llms.txt AEO'],
      content: ['Vidéo Promo Produit', 'Cart Recovery Video', 'Feed Google Shopping', 'Article Blog Auto'],
      whatsapp: ['WhatsApp Booking Confirmation', 'WhatsApp Reminders'],
      voiceAI: ['Assistant Vocal IA Web (24/7)', 'Assistant Telephonique IA']
    },
    voiceAIProduct: {
      description: 'Assistant vocal IA deployable pour vos clients',
      features: ['Reconnaissance vocale', 'Reponses instantanees', 'Prise RDV auto', 'Qualification leads', 'Disponible 24/7'],
      included: 'Setup inclus dans tous les packs clients'
    }
  },

  // === FAQ ENRICHIE ===
  faq: {
    delai: 'Les packs Setup sont livrés en 1-3 semaines selon complexité. L\'audit gratuit est envoyé sous 24-48h.',
    garantie: 'Si les automatisations ne fonctionnent pas comme prévu, nous corrigeons jusqu\'à satisfaction. Pas de limite de révisions.',
    outils: 'Nous travaillons principalement avec Klaviyo, Shopify, GA4, Google Sheets. Nous nous adaptons à vos outils existants.',
    difference: 'Équipe spécialisée = pas de commercial, pas de junior, vous travaillez directement avec les experts. Prix justes, transparents.',
    engagement: 'Les packs Setup sont one-time, pas d\'engagement. Les abonnements sont au mois, résiliables à tout moment.',
    taille: 'Nous travaillons avec des PME de €10k à €500k/mois de CA. En dessous, l\'audit gratuit peut déjà beaucoup aider.',
    secteur: 'Nous travaillons tous secteurs: e-commerce, B2B, SaaS, services, BTP, retail... L\'automation s\'adapte.',
    resultats: 'Exemples: +15% récupération paniers abandonnés, 36-42:1 ROI email (Litmus 2025), -60% temps qualification leads.'
  },

  // === OBJECTIONS COURANTES ===
  objections: {
    tropCher: 'Les prix peuvent sembler élevés mais le ROI est rapide. L\'email marketing génère en moyenne 36-42€ pour 1€ investi. Commencez par l\'audit gratuit pour voir le potentiel.',
    pasTech: 'Vous n\'avez rien à faire de technique. Nous gérons tout et nous vous livrons une documentation claire. Vous gardez le contrôle sans les maux de tête.',
    pasTemps: 'Justement ! L\'objectif est de vous faire gagner du temps. Les automatisations tournent 24/7 sans vous.',
    dejaTeste: 'Beaucoup ont essayé seuls ou avec des outils basiques. La différence c\'est l\'expertise et la stratégie derrière les outils.',
    pasUrgent: 'Chaque jour sans automatisation = opportunités perdues. Paniers abandonnés, leads non relancés, clients qui partent...'
  }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KNOWLEDGE_BASE;
}
