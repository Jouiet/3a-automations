/**
 * Voice Widget Configuration Template
 *
 * Copy this file and rename to: config-[your-project].js
 * Then customize all values for your brand.
 *
 * @version 1.0.0
 * @created 2025-12-25
 * @author 3A Automation
 */

const VOICE_WIDGET_CONFIG = {
  // ═══════════════════════════════════════════════════════════════════
  // BRAND SETTINGS - Required
  // ═══════════════════════════════════════════════════════════════════
  BRAND: {
    name: 'Your Brand Name',           // Display name
    url: 'https://yourbrand.com',      // Website URL
    email: 'contact@yourbrand.com',    // Contact email
    phone: '+1 234 567 8900',          // Phone number (optional)
    logo: '/assets/logo.webp',         // Logo path (optional)
  },

  // ═══════════════════════════════════════════════════════════════════
  // THEME COLORS - Customize to match your brand
  // ═══════════════════════════════════════════════════════════════════
  COLORS: {
    primary: '#4FBAF1',       // Main accent color
    secondary: '#1E3A5F',     // Secondary color
    background: '#0F1629',    // Widget background
    text: '#FFFFFF',          // Primary text
    textMuted: '#94A3B8',     // Secondary text
    success: '#10B981',       // Success state
    error: '#EF4444',         // Error state
    warning: '#F59E0B',       // Warning state
  },

  // ═══════════════════════════════════════════════════════════════════
  // FRENCH TEXT - UI Labels
  // ═══════════════════════════════════════════════════════════════════
  TEXT_FR: {
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
    listeningMessage: 'Je vous ecoute...',
    processingMessage: 'Un instant...',
    errorMessage: 'Desolez, une erreur est survenue.',
    placeholderText: 'Posez votre question...',
    sendButton: 'Envoyer',
    micButton: 'Parler',
    closeButton: 'Fermer',
    minimizeButton: 'Reduire',
  },

  // ═══════════════════════════════════════════════════════════════════
  // ENGLISH TEXT - UI Labels
  // ═══════════════════════════════════════════════════════════════════
  TEXT_EN: {
    welcomeMessage: 'Hello! How can I help you?',
    listeningMessage: 'Listening...',
    processingMessage: 'One moment...',
    errorMessage: 'Sorry, an error occurred.',
    placeholderText: 'Ask your question...',
    sendButton: 'Send',
    micButton: 'Speak',
    closeButton: 'Close',
    minimizeButton: 'Minimize',
  },

  // ═══════════════════════════════════════════════════════════════════
  // WIDGET SETTINGS
  // ═══════════════════════════════════════════════════════════════════
  SETTINGS: {
    position: 'bottom-right',           // bottom-right, bottom-left, top-right, top-left
    defaultLanguage: 'fr',              // fr, en
    autoGreet: true,                    // Show welcome message on load
    enableVoice: true,                  // Enable voice input
    enableText: true,                   // Enable text input
    enableSpeechSynthesis: true,        // Read responses aloud
    speechRate: 1.0,                    // Speech speed (0.5 - 2.0)
    speechVoice: null,                  // null = auto-detect, or specify voice name
    animationsEnabled: true,            // Enable UI animations
    persistConversation: false,         // Keep history in localStorage
    maxMessages: 50,                    // Max messages to keep in memory
    apiEndpoint: '/api/voice',          // Backend API endpoint
    apiTimeout: 30000,                  // API timeout in ms
  },

  // ═══════════════════════════════════════════════════════════════════
  // AI SYSTEM PROMPT - French
  // ═══════════════════════════════════════════════════════════════════
  PROMPT_FR: `Tu es l'assistant vocal de [BRAND_NAME].

CONTEXTE:
- Tu representes [BRAND_NAME], specialise dans [YOUR_SPECIALTY]
- Site web: [BRAND_URL]
- Services: [LIST_YOUR_SERVICES]

TON ROLE:
- Repondre aux questions sur les services
- Guider les visiteurs vers les bonnes ressources
- Prendre des rendez-vous si demande
- Etre professionnel mais accessible

REGLES:
- Reponses courtes (2-3 phrases max)
- Toujours en francais sauf si l'utilisateur parle anglais
- Proposer un rdv si interet manifeste
- Ne jamais inventer de prix ou details non fournis

SERVICES DISPONIBLES:
1. [Service 1] - [Description courte]
2. [Service 2] - [Description courte]
3. [Service 3] - [Description courte]

CONTACT:
- Email: [EMAIL]
- Telephone: [PHONE]
- Rendez-vous: [BOOKING_URL]`,

  // ═══════════════════════════════════════════════════════════════════
  // AI SYSTEM PROMPT - English
  // ═══════════════════════════════════════════════════════════════════
  PROMPT_EN: `You are the voice assistant for [BRAND_NAME].

CONTEXT:
- You represent [BRAND_NAME], specialized in [YOUR_SPECIALTY]
- Website: [BRAND_URL]
- Services: [LIST_YOUR_SERVICES]

YOUR ROLE:
- Answer questions about services
- Guide visitors to the right resources
- Schedule appointments if requested
- Be professional but approachable

RULES:
- Keep responses short (2-3 sentences max)
- Always in English unless the user speaks French
- Offer to schedule a meeting if interest is shown
- Never invent prices or details not provided

AVAILABLE SERVICES:
1. [Service 1] - [Short description]
2. [Service 2] - [Short description]
3. [Service 3] - [Short description]

CONTACT:
- Email: [EMAIL]
- Phone: [PHONE]
- Booking: [BOOKING_URL]`,

  // ═══════════════════════════════════════════════════════════════════
  // VOICE RECOGNITION KEYWORDS (for quick actions)
  // ═══════════════════════════════════════════════════════════════════
  KEYWORDS: {
    fr: {
      booking: ['rendez-vous', 'rdv', 'reserver', 'booking', 'appel'],
      pricing: ['prix', 'tarif', 'cout', 'combien', 'devis'],
      contact: ['contact', 'email', 'telephone', 'appeler'],
      help: ['aide', 'comment', 'expliquer', 'question'],
    },
    en: {
      booking: ['appointment', 'schedule', 'book', 'call', 'meeting'],
      pricing: ['price', 'cost', 'pricing', 'quote', 'how much'],
      contact: ['contact', 'email', 'phone', 'call'],
      help: ['help', 'how', 'explain', 'question'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUICK RESPONSES (for common questions)
  // ═══════════════════════════════════════════════════════════════════
  QUICK_RESPONSES: {
    fr: {
      booking: 'Je peux vous proposer un rendez-vous. Visitez [BOOKING_URL] ou dites-moi vos disponibilites.',
      pricing: 'Nos tarifs dependent de vos besoins specifiques. Souhaitez-vous un devis personnalise ?',
      contact: 'Vous pouvez nous joindre a [EMAIL] ou au [PHONE]. Preferez-vous etre rappele ?',
    },
    en: {
      booking: 'I can schedule an appointment for you. Visit [BOOKING_URL] or tell me your availability.',
      pricing: 'Our pricing depends on your specific needs. Would you like a personalized quote?',
      contact: 'You can reach us at [EMAIL] or [PHONE]. Would you prefer a callback?',
    },
  },
};

// Export for use in voice widget
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VOICE_WIDGET_CONFIG;
}
if (typeof window !== 'undefined') {
  window.VOICE_WIDGET_CONFIG = VOICE_WIDGET_CONFIG;
}
