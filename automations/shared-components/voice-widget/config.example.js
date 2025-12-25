/**
 * Voice Widget - Generic Configuration Template
 * Version: 1.0.0
 *
 * Copy this file to config.js and customize for your brand.
 *
 * Usage:
 *   1. Copy config.example.js to config.js
 *   2. Customize BRAND, COLORS, PROMPTS for your brand
 *   3. Include config.js before voice-widget-generic.js
 */

const VOICE_WIDGET_CONFIG = {
  // === BRAND IDENTITY ===
  BRAND: {
    name: 'Your Brand',           // Display name
    url: 'yourbrand.com',         // Website URL
    email: 'contact@yourbrand.com',
    languages: ['fr', 'en'],      // Supported languages
  },

  // === UI COLORS ===
  COLORS: {
    primary: '#4FBAF1',           // Main brand color
    primaryDark: '#2B6685',       // Darker variant
    accent: '#10B981',            // Success/accent color
    darkBg: '#191E35',            // Dark background
    text: '#FFFFFF',              // Light text
    textSecondary: '#94A3B8',     // Secondary text
  },

  // === UI TEXT (French) ===
  TEXT_FR: {
    welcomeMessage: 'Bonjour ! Je suis l\'assistant de Your Brand. Comment puis-je vous aider ?',
    welcomeMessageTextOnly: 'Bonjour ! Posez votre question par écrit.',
    placeholder: 'Posez votre question...',
    buttonTitle: 'Assistant vocal',
    errorMessage: 'Erreur de connexion',
  },

  // === UI TEXT (English) ===
  TEXT_EN: {
    welcomeMessage: 'Hello! I\'m the Your Brand assistant. How can I help you?',
    welcomeMessageTextOnly: 'Hello! Type your question below.',
    placeholder: 'Ask your question...',
    buttonTitle: 'Voice assistant',
    errorMessage: 'Connection error',
  },

  // === WIDGET SETTINGS ===
  SETTINGS: {
    position: 'bottom-right',     // bottom-right, bottom-left
    apiEndpoint: '/api/voice',    // Backend API endpoint
    enableVoice: true,            // Enable speech recognition
    enableTTS: true,              // Enable text-to-speech
    autoOpen: false,              // Auto-open on page load
    debugMode: false,             // Enable console logging
  },

  // === SYSTEM PROMPT (French) ===
  PROMPT_FR: `Tu es l'assistant vocal de [BRAND_NAME].

IDENTITE:
- [Describe your business]
- Site: [BRAND_URL]
- Langues: Francais, Anglais

SERVICES:
- [List your main services]

STYLE:
- Reponses courtes (2-3 phrases max)
- Ton professionnel mais accessible
- Pas de jargon technique

OBJECTIF:
- Qualifier le prospect
- Proposer une action (RDV, demo, etc.)`,

  // === SYSTEM PROMPT (English) ===
  PROMPT_EN: `You are the voice assistant for [BRAND_NAME].

IDENTITY:
- [Describe your business]
- Website: [BRAND_URL]
- Languages: French, English

SERVICES:
- [List your main services]

STYLE:
- Short responses (2-3 sentences max)
- Professional but approachable tone
- Avoid technical jargon

OBJECTIVE:
- Qualify the prospect
- Suggest an action (meeting, demo, etc.)`,

  // === KNOWLEDGE BASE ===
  KNOWLEDGE: {
    totalAutomations: 0,          // Number of automations
    categories: [],               // Category list
    pricing: {},                  // Pricing info
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

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VOICE_WIDGET_CONFIG;
}
