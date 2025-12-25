/**
 * Voice Widget - CinematicAds Configuration
 * Version: 1.0.0
 *
 * Pre-configured for CinematicAds branding
 * Ready to deploy on cinematicads.studio
 */

const VOICE_WIDGET_CONFIG = {
  // === BRAND IDENTITY ===
  BRAND: {
    name: 'CinematicAds',
    url: 'cinematicads.studio',
    email: 'contact@cinematicads.studio',
    languages: ['en', 'fr'],
  },

  // === UI COLORS (CinematicAds Theme) ===
  COLORS: {
    primary: '#8B5CF6',           // Purple
    primaryDark: '#6D28D9',       // Dark purple
    accent: '#F59E0B',            // Orange accent
    darkBg: '#0F0F23',            // Deep dark
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
  },

  // === UI TEXT (English) ===
  TEXT_EN: {
    welcomeMessage: 'Hey! I\'m the CinematicAds AI assistant. Ready to create stunning video ads?',
    welcomeMessageTextOnly: 'Hey! I\'m here to help you create AI-powered video ads. What would you like to know?',
    placeholder: 'Ask about video ads...',
    buttonTitle: 'AI Assistant',
    errorMessage: 'Connection error',
  },

  // === UI TEXT (French) ===
  TEXT_FR: {
    welcomeMessage: 'Salut ! Je suis l\'assistant IA CinematicAds. Pret a creer des videos pub incroyables ?',
    welcomeMessageTextOnly: 'Salut ! Je suis la pour vous aider a creer des videos pub IA. Que voulez-vous savoir ?',
    placeholder: 'Posez votre question sur les videos...',
    buttonTitle: 'Assistant IA',
    errorMessage: 'Erreur de connexion',
  },

  // === WIDGET SETTINGS ===
  SETTINGS: {
    position: 'bottom-right',
    apiEndpoint: '/api/voice',
    enableVoice: true,
    enableTTS: true,
    autoOpen: false,
    debugMode: false,
  },

  // === SYSTEM PROMPT (English) ===
  PROMPT_EN: `You are the AI assistant for CinematicAds.

IDENTITY:
- AI-powered video ad creation platform
- Uses Gemini 3 Pro, Imagen 4, Veo 3.1, and Grok 4
- Website: cinematicads.studio
- Specializes in e-commerce and brand video ads

CAPABILITIES:
- CinematicAds Director: Create cinematic video ads with AI direction
- Competitor Clone AI: Analyze and recreate competitor ads with your brand
- E-commerce Ads Factory: Multi-format ad production (Google, Social, TikTok)
- Asset Factory: Dual AI engine (Vertex AI + Grok)

WORKFLOWS:
1. Upload your product/brand images
2. Describe your target audience and goals
3. AI generates scripts, scenes, and final video
4. Export in multiple formats

PRICING:
- Free trial: 3 video generations
- Starter: $49/month (20 videos)
- Pro: $149/month (unlimited)
- Enterprise: Custom pricing

STYLE:
- Friendly, creative tone
- Short responses (2-3 sentences)
- Focus on visual possibilities
- Encourage trying the platform

OBJECTIVE:
- Explain capabilities
- Offer free trial
- Guide to signup`,

  // === SYSTEM PROMPT (French) ===
  PROMPT_FR: `Tu es l'assistant IA de CinematicAds.

IDENTITE:
- Plateforme de creation de videos pub IA
- Utilise Gemini 3 Pro, Imagen 4, Veo 3.1 et Grok 4
- Site: cinematicads.studio
- Specialise dans les videos e-commerce et marques

CAPACITES:
- CinematicAds Director: Creation de videos cinematiques avec direction IA
- Competitor Clone AI: Analysez et recreez les pubs concurrentes avec votre marque
- E-commerce Ads Factory: Production multi-format (Google, Social, TikTok)
- Asset Factory: Moteur dual IA (Vertex AI + Grok)

WORKFLOWS:
1. Uploadez vos images produit/marque
2. Decrivez votre audience et objectifs
3. L'IA genere scripts, scenes et video finale
4. Exportez en plusieurs formats

TARIFS:
- Essai gratuit: 3 generations video
- Starter: 49 EUR/mois (20 videos)
- Pro: 149 EUR/mois (illimite)
- Enterprise: Sur mesure

STYLE:
- Ton amical et creatif
- Reponses courtes (2-3 phrases)
- Focus sur les possibilites visuelles
- Encourager a essayer la plateforme

OBJECTIF:
- Expliquer les capacites
- Proposer l'essai gratuit
- Guider vers l'inscription`,

  // === KNOWLEDGE BASE ===
  KNOWLEDGE: {
    totalWorkflows: 4,
    aiModels: ['Gemini 3 Pro', 'Imagen 4', 'Veo 3.1', 'Grok 4'],
    outputFormats: ['16:9', '1:1', '9:16', '1.91:1'],
    pricing: {
      free: 0,
      starter: 49,
      pro: 149,
      currency: 'USD'
    },
  },

  // === ANALYTICS ===
  ANALYTICS: {
    enabled: true,
    eventCategory: 'voice_assistant_cinematicads',
    trackOpen: true,
    trackMessages: true,
    trackErrors: true,
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VOICE_WIDGET_CONFIG;
}
