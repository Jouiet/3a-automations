import { NextRequest, NextResponse } from 'next/server';

// PRIVATE - System prompt NOT exposed to client
const SYSTEM_PROMPT = `Tu es l'assistant vocal de 3A Automation.

IDENTITÉ:
- Consultant automation pour PME et e-commerce (tous secteurs)
- Expert en automatisation marketing et opérationnelle
- Site: 3a-automation.com
- Large catalogue d'automatisations disponibles

SERVICES:
- Audit gratuit: Formulaire → Rapport PDF 24-48h
- Packs forfaitaires adaptés à chaque besoin
- Retainers mensuels disponibles

SECTEURS SERVIS:
- E-commerce / Boutiques en ligne
- Restaurants / Food
- Professions libérales
- Services B2B

STYLE:
- Réponses courtes (2-3 phrases max)
- Propose toujours l'audit gratuit
- Pas de jargon technique
- Ton professionnel mais accessible

OBJECTIF:
- Qualifier le prospect (secteur, besoin)
- Proposer l'audit gratuit
- Rediriger vers le formulaire contact ou booking`;

// Simple keyword-based response system (no external AI API needed)
const RESPONSES: Record<string, string> = {
  // Greetings
  'bonjour': 'Bonjour ! Je suis l\'assistant 3A Automation. Comment puis-je vous aider aujourd\'hui ?',
  'salut': 'Salut ! Comment puis-je vous aider avec votre projet d\'automatisation ?',
  'hello': 'Hello! How can I help you with your automation project?',
  'hi': 'Hi! How can I assist you today?',

  // Pricing
  'prix': 'Nous proposons des packs forfaitaires adaptés à vos besoins. Commencez par notre audit gratuit pour recevoir une recommandation personnalisée.',
  'tarif': 'Nos tarifs sont forfaitaires, sans surprise. L\'audit gratuit vous permet d\'obtenir un devis précis adapté à votre situation.',
  'combien': 'Les tarifs dépendent de vos besoins spécifiques. Notre audit gratuit vous donnera une estimation précise.',
  'price': 'We offer fixed-price packages tailored to your needs. Start with our free audit for a personalized quote.',
  'cost': 'Pricing depends on your specific needs. Our free audit will give you an accurate estimate.',

  // Services
  'automatisation': 'Nous automatisons vos processus marketing et opérationnels : emails, leads, analytics, et plus. Voulez-vous un audit gratuit ?',
  'automation': 'We automate your marketing and operational processes: emails, leads, analytics, and more. Would you like a free audit?',
  'email': 'L\'automatisation email est notre spécialité : séquences de bienvenue, paniers abandonnés, fidélisation. Intéressé par un audit ?',
  'shopify': 'Nous sommes experts Shopify : automatisation produits, collections, inventaire, et optimisation boutique.',
  'ecommerce': 'L\'e-commerce est notre cœur de métier. Nous automatisons tout le parcours client de l\'acquisition à la fidélisation.',

  // Audit
  'audit': 'Notre audit gratuit analyse votre situation et identifie les opportunités d\'automatisation. Résultat sous 24-48h. Intéressé ?',
  'gratuit': 'Oui, l\'audit est 100% gratuit et sans engagement. Il vous donne un rapport PDF avec des recommandations concrètes.',
  'free': 'Yes, the audit is 100% free with no obligation. You\'ll receive a PDF report with concrete recommendations.',

  // Contact
  'contact': 'Vous pouvez nous contacter via le formulaire sur 3a-automation.com ou réserver directement un appel.',
  'rdv': 'Vous pouvez réserver un créneau directement sur notre page booking. Préférez-vous un appel ou l\'audit gratuit d\'abord ?',
  'appel': 'Réservez votre appel sur 3a-automation.com/booking. Je vous recommande l\'audit gratuit au préalable.',
  'booking': 'You can book a call directly on our booking page. I recommend starting with the free audit.',

  // Sectors
  'restaurant': 'Nous aidons les restaurants avec les réservations automatisées, les rappels clients et le marketing local.',
  'médecin': 'Pour les cabinets médicaux, nous automatisons les rappels de rendez-vous, confirmations et suivi patients.',
  'b2b': 'En B2B, nous automatisons la génération de leads, le nurturing et le suivi commercial.',

  // Default
  'default': 'Je peux vous aider avec l\'automatisation de vos processus. Souhaitez-vous un audit gratuit pour identifier vos opportunités ?'
};

function findResponse(message: string): string {
  const lowerMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const [keyword, response] of Object.entries(RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  return RESPONSES['default'];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, language = 'fr' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = findResponse(message);

    return NextResponse.json({
      success: true,
      response,
      language,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow CORS for the widget
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
