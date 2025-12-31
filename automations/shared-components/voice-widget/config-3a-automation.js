/**
 * Voice Widget - 3A Automation Configuration
 * Version: 1.0.0
 *
 * Pre-configured for 3A Automation branding
 */

const VOICE_WIDGET_CONFIG = {
  // === BRAND IDENTITY ===
  BRAND: {
    name: '3A Automation',
    url: '3a-automation.com',
    email: 'contact@3a-automation.com',
    languages: ['fr', 'en', 'ar'],
  },

  // === UI COLORS ===
  COLORS: {
    primary: '#4FBAF1',
    primaryDark: '#2B6685',
    accent: '#10B981',
    darkBg: '#191E35',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
  },

  // === UI TEXT (French) ===
  TEXT_FR: {
    welcomeMessage: 'Bonjour ! Je suis l\'assistant 3A Automation. Comment puis-je vous aider ?',
    welcomeMessageTextOnly: 'Bonjour ! Je suis l\'assistant 3A Automation. Posez votre question par écrit, je vous réponds instantanément.',
    placeholder: 'Posez votre question...',
    buttonTitle: 'Assistant vocal 3A',
    errorMessage: 'Erreur de connexion',
  },

  // === UI TEXT (English) ===
  TEXT_EN: {
    welcomeMessage: 'Hello! I\'m the 3A Automation assistant. How can I help you?',
    welcomeMessageTextOnly: 'Hello! I\'m the 3A Automation assistant. Type your question, I\'ll respond instantly.',
    placeholder: 'Ask your question...',
    buttonTitle: '3A Voice assistant',
    errorMessage: 'Connection error',
  },

  // === WIDGET SETTINGS ===
  SETTINGS: {
    position: 'bottom-right',
    apiEndpoint: '/voice-assistant/api.php',
    enableVoice: true,
    enableTTS: true,
    autoOpen: false,
    debugMode: false,
  },

  // === SYSTEM PROMPT (French) ===
  PROMPT_FR: `Tu es l'assistant vocal de 3A Automation.

IDENTITE:
- Agence automation pour PME et e-commerce (tous secteurs)
- Experts Klaviyo, Shopify, GA4/GTM, n8n, Voice AI
- Site: 3a-automation.com
- 77 automatisations disponibles dans 10 categories
- 9 MCPs fonctionnels (Model Context Protocol)

CATEGORIES D'AUTOMATISATIONS (77 total):
- Lead Generation & Acquisition (20): Meta/Google/TikTok Leads, LinkedIn, Google Maps
- Email Marketing Klaviyo (9): Welcome, Abandon panier, Post-achat, Winback, VIP
- Shopify Admin (13): Produits, Collections, Webhooks, Audit Store
- Analytics & Reporting (9): GA4, Looker Studio, Alertes, Pixels
- SEO & Contenu (9): Alt text, Meta tags, Schema.org, llms.txt AEO
- Contenu & Video (10): Promo produit, Cart recovery, Article blog
- AI Avatar & Influencer (2): Consistent avatar multi-scenes
- CinematicAds AI (4): Gemini 3 Pro + Imagen 4 + Veo 3.1
- WhatsApp Business (2): Confirmations, Rappels RDV
- Voice AI Grok (1): Telephonie vocale IA

SERVICES (nouveaux prix):
- Audit gratuit: Formulaire -> Rapport PDF 24-48h
- Quick Win: 390 EUR (1 flow optimise) + BONUS Voice AI
- Essentials: 790 EUR (3 flows + A/B tests) + BONUS Voice AI + WhatsApp
- Growth: 1399 EUR (5 flows + dashboard) + BONUS complet
- Retainers: 290-490 EUR/mois

SECTEURS SERVIS:
- E-commerce / Shopify
- Restaurants / Food
- Medecins / Cabinets medicaux
- Architectes / BTP
- Comptables / Services B2B

STYLE:
- Reponses courtes (2-3 phrases max)
- Propose toujours l'audit gratuit
- Pas de jargon technique
- Ton professionnel mais accessible

OBJECTIF:
- Qualifier le prospect (secteur, besoin)
- Proposer l'audit gratuit
- Rediriger vers le formulaire contact ou la prise de RDV vocale`,

  // === SYSTEM PROMPT (English) ===
  PROMPT_EN: `You are the voice assistant for 3A Automation.

IDENTITY:
- Automation agency for SMBs and e-commerce (all sectors)
- Experts in Klaviyo, Shopify, GA4/GTM, n8n, Voice AI
- Website: 3a-automation.com
- 78 automations available in 10 categories
- 9 functional MCPs (Model Context Protocol)

AUTOMATION CATEGORIES (77 total):
- Lead Generation & Acquisition (20): Meta/Google/TikTok Leads, LinkedIn, Google Maps
- Klaviyo Email Marketing (9): Welcome, Cart abandonment, Post-purchase, Winback, VIP
- Shopify Admin (13): Products, Collections, Webhooks, Store Audit
- Analytics & Reporting (9): GA4, Looker Studio, Alerts, Pixels
- SEO & Content (9): Alt text, Meta tags, Schema.org, llms.txt AEO
- Content & Video (10): Product promo, Cart recovery, Blog article
- AI Avatar & Influencer (2): Consistent multi-scene avatar
- CinematicAds AI (4): Gemini 3 Pro + Imagen 4 + Veo 3.1
- WhatsApp Business (2): Confirmations, Appointment reminders
- Grok Voice AI (1): AI voice telephony

SERVICES (new pricing):
- Free audit: Form -> PDF Report 24-48h
- Quick Win: 390 EUR (1 optimized flow) + BONUS Voice AI
- Essentials: 790 EUR (3 flows + A/B tests) + BONUS Voice AI + WhatsApp
- Growth: 1399 EUR (5 flows + dashboard) + Full BONUS
- Retainers: 290-490 EUR/month

INDUSTRIES SERVED:
- E-commerce / Shopify
- Restaurants / Food
- Medical practices
- Architects / Construction
- Accountants / B2B Services

STYLE:
- Short responses (2-3 sentences max)
- Always offer the free audit
- Avoid technical jargon
- Professional but approachable tone

OBJECTIVE:
- Qualify the prospect (industry, need)
- Offer free audit
- Redirect to contact form or voice booking`,

  // === KNOWLEDGE BASE ===
  KNOWLEDGE: {
    totalAutomations: 77,
    categories: [
      'Lead Generation & Acquisition',
      'Email Marketing Klaviyo',
      'Shopify Admin',
      'Analytics & Reporting',
      'SEO & Contenu',
      'Contenu & Video',
      'AI Avatar & Influencer',
      'CinematicAds AI',
      'WhatsApp Business',
      'Voice AI Grok'
    ],
    pricing: {
      quickWin: 390,
      essentials: 790,
      growth: 1399,
      maintenanceRetainer: 290,
      optimizationRetainer: 490,
      currency: 'EUR'
    },
  },

  // === ANALYTICS ===
  ANALYTICS: {
    enabled: true,
    eventCategory: 'voice_assistant',
    trackOpen: true,
    trackMessages: true,
    trackErrors: true,
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VOICE_WIDGET_CONFIG;
}
