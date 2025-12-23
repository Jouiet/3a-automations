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
    expertise: ['Email Marketing Klaviyo', 'E-commerce Shopify', 'Analytics GA4', 'Workflows n8n'],
    target: 'PME et e-commerce (€10k-500k/mois CA)',
    differentiator: 'Consultant solo expert, pas d\'agence - relation directe, prix justes'
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
    retainer: {
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
      keywords: ['e-commerce', 'ecommerce', 'boutique', 'shopify', 'woocommerce', 'prestashop', 'magento', 'vente en ligne'],
      services: [
        'Abandon de panier automatisé (récupère 5-15% des ventes perdues)',
        'Welcome series (nouveaux clients)',
        'Post-purchase flows (fidélisation)',
        'Back-in-stock alerts',
        'Segmentation RFM automatique',
        'Dashboard performance temps réel'
      ],
      roi: 'ROI moyen: 42€ pour 1€ investi en email marketing'
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
      { num: 2, name: 'Rapport PDF', duration: '24-48h', description: 'Je vous envoie un rapport avec 3 recommandations prioritaires' },
      { num: 3, name: 'Proposition', duration: 'Google Docs', description: 'Proposition détaillée avec prix et planning' },
      { num: 4, name: 'Livraison', duration: 'Selon pack', description: 'Implémentation + documentation + support' }
    ],
    noCall: 'Tout se fait par écrit - pas d\'appels obligatoires (sauf si vous préférez)',
    guarantee: 'Satisfait ou on itère jusqu\'à ce que ça marche'
  },

  // === AUTOMATISATIONS DISPONIBLES ===
  automations: {
    total: 72,
    categories: {
      email: ['Welcome series', 'Abandon panier', 'Post-achat', 'Winback', 'Browse abandonment', 'Anniversaire'],
      leads: ['Capture Google Maps', 'LinkedIn scraping', 'Qualification auto', 'Lead scoring', 'Nurturing'],
      analytics: ['Dashboard GA4', 'Alertes anomalies', 'Rapports automatiques', 'Attribution'],
      seo: ['Alt text auto', 'Meta descriptions', 'Audit technique', 'Sitemap'],
      shopify: ['Inventory sync', 'Order webhooks', 'Customer sync', 'Product feeds']
    }
  },

  // === FAQ ENRICHIE ===
  faq: {
    delai: 'Les packs Setup sont livrés en 1-3 semaines selon complexité. L\'audit gratuit est envoyé sous 24-48h.',
    garantie: 'Si les automatisations ne fonctionnent pas comme prévu, je corrige jusqu\'à satisfaction. Pas de limite de révisions.',
    outils: 'Je travaille principalement avec Klaviyo, Shopify, GA4, n8n, Google Sheets. Je m\'adapte à vos outils existants.',
    difference: 'Consultant solo = pas de commercial, pas de junior, vous travaillez directement avec l\'expert. Prix justes, pas de marge agence.',
    engagement: 'Les packs Setup sont one-time, pas d\'engagement. Les retainers sont au mois, résiliables à tout moment.',
    taille: 'Je travaille avec des PME de €10k à €500k/mois de CA. En dessous, l\'audit gratuit peut déjà beaucoup aider.',
    secteur: 'Je travaille tous secteurs: e-commerce, B2B, SaaS, services, BTP, retail... L\'automation s\'adapte.',
    resultats: 'Exemples: +15% récupération paniers abandonnés, 42:1 ROI email, -60% temps qualification leads.'
  },

  // === OBJECTIONS COURANTES ===
  objections: {
    tropCher: 'Les prix peuvent sembler élevés mais le ROI est rapide. L\'email marketing génère en moyenne 42€ pour 1€ investi. Commencez par l\'audit gratuit pour voir le potentiel.',
    pasTech: 'Vous n\'avez rien à faire de technique. Je gère tout et je vous livre une documentation claire. Vous gardez le contrôle sans les maux de tête.',
    pasTemps: 'Justement ! L\'objectif est de vous faire gagner du temps. Les automatisations tournent 24/7 sans vous.',
    dejaTeste: 'Beaucoup ont essayé seuls ou avec des outils basiques. La différence c\'est l\'expertise et la stratégie derrière les outils.',
    pasUrgent: 'Chaque jour sans automatisation = opportunités perdues. Paniers abandonnés, leads non relancés, clients qui partent...'
  }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KNOWLEDGE_BASE;
}
