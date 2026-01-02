#!/usr/bin/env node
/**
 * Voice Telephony Bridge - Native Script (remplace n8n workflow)
 *
 * Bridge Twilio PSTN ↔ Grok Voice Realtime WebSocket
 *
 * Date: 2026-01-01
 * Version: 1.0.0
 *
 * Architecture:
 *   Twilio Inbound Call → HTTP Webhook → Grok WebSocket Session → Audio Bridge
 *
 * Avantages vs n8n:
 *   - Direct WebSocket (pas d'overhead n8n)
 *   - Latence réduite (~50ms vs ~200ms)
 *   - Contrôle total du flux audio
 *   - Intégration native avec modules existants
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');

// Dependency check
let WebSocket;
try {
  WebSocket = require('ws');
} catch (e) {
  console.error('❌ Missing dependency: ws');
  console.error('   Run: npm install ws');
  process.exit(1);
}

// Optional: Twilio SDK for signature validation
let twilio;
try {
  twilio = require('twilio');
} catch (e) {
  console.warn('⚠️ twilio package not installed - signature validation disabled');
  console.warn('   Run: npm install twilio');
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  port: parseInt(process.env.VOICE_TELEPHONY_PORT || '3009'),

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  // Grok Voice
  grok: {
    apiKey: process.env.XAI_API_KEY,
    model: 'grok-4', // FRONTIER audio model (powered by Grok-4 family per xAI docs Jan 2026)
    voice: process.env.GROK_VOICE || 'Sal',
    realtimeUrl: 'wss://api.x.ai/v1/realtime'
  },

  // Google Apps Script (booking)
  booking: {
    scriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec'
  },

  // WhatsApp
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
  },

  // Security
  security: {
    maxBodySize: 1024 * 1024, // 1MB
    requestTimeout: 30000,
    maxActiveSessions: 50,
    sessionTimeout: 600000 // 10 minutes
  },

  // Rate limiting
  rateLimit: {
    windowMs: 60000,
    maxRequests: 30
  }
};

// ============================================
// ACTIVE SESSIONS MANAGEMENT
// ============================================

const activeSessions = new Map();
const rateLimitMap = new Map();

function generateSessionId() {
  return `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function cleanupSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    if (session.grokWs && session.grokWs.readyState === WebSocket.OPEN) {
      session.grokWs.close();
    }
    if (session.twilioWs && session.twilioWs.readyState === WebSocket.OPEN) {
      session.twilioWs.close();
    }
    activeSessions.delete(sessionId);
    console.log(`[Session] Cleaned up: ${sessionId}`);
  }
}

// Cleanup zombie sessions every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions) {
    if (now - session.createdAt > CONFIG.security.sessionTimeout) {
      console.log(`[Session] Timeout cleanup: ${sessionId}`);
      cleanupSession(sessionId);
    }
  }
}, 60000);

// ============================================
// RATE LIMITING
// ============================================

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - CONFIG.rateLimit.windowMs;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip).filter(t => t > windowStart);
  rateLimitMap.set(ip, requests);

  if (requests.length >= CONFIG.rateLimit.maxRequests) {
    return false;
  }

  requests.push(now);
  return true;
}

// Cleanup old rate limit entries every 5 minutes (FIX: memory leak)
setInterval(() => {
  const now = Date.now();
  const windowStart = now - CONFIG.rateLimit.windowMs;

  for (const [ip, timestamps] of rateLimitMap) {
    const recent = timestamps.filter(t => t > windowStart);
    if (recent.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recent);
    }
  }
}, 300000);

// ============================================
// TWILIO SIGNATURE VALIDATION
// ============================================

function validateTwilioSignature(req, body, rawBody) {
  // Skip validation if twilio SDK not installed or auth token not configured
  if (!twilio || !CONFIG.twilio.authToken) {
    console.warn('[Security] Twilio signature validation DISABLED');
    return true;
  }

  const signature = req.headers['x-twilio-signature'];
  if (!signature) {
    console.error('[Security] Missing X-Twilio-Signature header');
    return false;
  }

  // Reconstruct the URL
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const url = `${protocol}://${host}${req.url}`;

  try {
    const isValid = twilio.validateRequest(
      CONFIG.twilio.authToken,
      signature,
      url,
      body
    );

    if (!isValid) {
      console.error('[Security] Invalid Twilio signature');
    }

    return isValid;
  } catch (error) {
    console.error(`[Security] Signature validation error: ${error.message}`);
    return false;
  }
}

// ============================================
// SAFE JSON PARSING
// ============================================

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error(`[JSON] Parse error: ${e.message}`);
    return fallback;
  }
}

// ============================================
// GROK VOICE SESSION
// ============================================

async function createGrokSession(callInfo) {
  return new Promise((resolve, reject) => {
    const sessionId = generateSessionId();

    if (activeSessions.size >= CONFIG.security.maxActiveSessions) {
      reject(new Error('Maximum active sessions reached'));
      return;
    }

    console.log(`[Grok] Creating session for call ${callInfo.callSid}`);

    const ws = new WebSocket(CONFIG.grok.realtimeUrl, {
      headers: {
        'Authorization': `Bearer ${CONFIG.grok.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Grok WebSocket connection timeout'));
    }, 10000);

    ws.on('open', () => {
      clearTimeout(timeout);

      // SALES ASSISTANT CONFIG - Optimized for conversion (v2.0)
      // Based on Vapi lead qualification + Bland AI patterns + industry best practices
      const sessionConfig = {
        type: 'session.update',
        session: {
          model: CONFIG.grok.model,
          voice: CONFIG.grok.voice,
          modalities: ['audio', 'text'],
          input_audio_format: 'pcmu',
          output_audio_format: 'pcmu',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 700 // Slightly longer for natural pauses
          },
          instructions: `Tu es l'assistant commercial IA de 3A Automation, agence spécialisée en automatisation IA pour e-commerce et PME.

OBJECTIF PRINCIPAL: Qualifier le prospect avec BANT, traiter les objections, et closer un RDV découverte.

═══════════════════════════════════════════════════════════════
PHASE 1 - OUVERTURE & PERMISSION (15 sec max)
═══════════════════════════════════════════════════════════════
"Bonjour ! Je suis l'assistant IA de 3A Automation. Merci de nous appeler !
Avez-vous 2 minutes pour que je comprenne comment nous pouvons vous aider ?"

SI "non" ou "occupé":
→ "Je comprends parfaitement. Quand puis-je vous rappeler ? Demain matin ou après-midi ?"
→ Utilise schedule_callback avec le créneau proposé

SI "oui" ou acceptation:
→ Passer à Phase 2

═══════════════════════════════════════════════════════════════
PHASE 2 - QUALIFICATION BANT (60-90 sec)
═══════════════════════════════════════════════════════════════
Poser ces questions naturellement dans la conversation:

NEED (Besoin):
"Qu'est-ce qui vous amène à nous contacter aujourd'hui ?"
"Quel défi cherchez-vous à résoudre avec l'automatisation ?"

TIMELINE (Urgence):
"D'ici combien de temps souhaitez-vous mettre ça en place ?"
"C'est un projet prioritaire pour ce trimestre ?"

BUDGET (indirectement):
"Avez-vous déjà une idée du type d'investissement envisagé ?"
"C'est un projet avec un budget défini ou exploratoire ?"

AUTHORITY (Décisionnaire):
"Êtes-vous la personne qui valide ce type de projet ?"
"D'autres personnes participent à la décision ?"

→ Après les réponses, utilise qualify_lead pour scorer le prospect

═══════════════════════════════════════════════════════════════
PHASE 3 - PROPOSITION DE VALEUR (adaptatif)
═══════════════════════════════════════════════════════════════
Selon le besoin détecté:

SI e-commerce mentionné:
"Nos clients e-commerce récupèrent 15-30% de paniers abandonnés grâce à nos automatisations.
En moyenne, c'est 2000€ à 5000€ de revenus supplémentaires par mois."

SI PME/efficacité mentionné:
"Nous aidons les PME à économiser 10-20 heures par semaine sur les tâches répétitives.
Ça libère du temps pour ce qui compte vraiment: développer l'activité."

SI marketing/leads mentionné:
"Nos automatisations génèrent 3x plus de leads qualifiés et réduisent le coût d'acquisition de 40%."

SI général:
"En moyenne, nos clients voient un ROI de 300% en moins de 3 mois."

═══════════════════════════════════════════════════════════════
PHASE 4 - GESTION DES OBJECTIONS
═══════════════════════════════════════════════════════════════
Utilise handle_objection pour logger l'objection, puis réponds:

"C'est trop cher / On n'a pas le budget":
→ "Je comprends. La question est: combien vous coûte de NE PAS automatiser ?
   Nos clients récupèrent leur investissement en 2-3 mois. Voyons ensemble si ça fait sens pour vous."

"Je vais réfléchir / Plus tard":
→ "Bien sûr. Puis-je vous demander ce qui vous fait hésiter ?
   Si c'est une question de timing, on peut bloquer un créneau et confirmer plus tard."

"On travaille déjà avec quelqu'un":
→ "Parfait ! C'est bon signe que vous investissez dans l'automatisation.
   On propose un audit comparatif gratuit de 30 minutes. Ça vous permettra de voir si on peut apporter plus."

"Envoyez-moi un email d'abord":
→ "Avec plaisir. Pour vous envoyer quelque chose de vraiment pertinent,
   pouvez-vous me dire en une phrase votre plus gros défi actuel ?"

"Je n'ai pas le temps maintenant":
→ "Pas de souci. Demain 10h ou 14h, qu'est-ce qui vous arrange le mieux ?
   Ce sera un appel de 20 minutes maximum."

═══════════════════════════════════════════════════════════════
PHASE 5 - CLOSING
═══════════════════════════════════════════════════════════════
ASSUMPTIF (après qualification positive):
"Parfait [Nom], on est alignés. Pour cet appel découverte de 30 minutes,
vous préférez mardi 10h ou jeudi 14h ?"

URGENCE (si score BANT élevé):
"Cette semaine, il nous reste seulement 3 créneaux disponibles.
Voulez-vous qu'on en bloque un maintenant ?"

SUMMARY (récapituler avant demander):
"Donc, vous cherchez à [besoin], d'ici [timeline], pour [objectif].
C'est exactement ce qu'on fait. On fixe les 30 minutes ensemble ?"

→ Dès que nom, email, créneau obtenus: create_booking

═══════════════════════════════════════════════════════════════
PHASE 6 - RÉCUPÉRATION ABANDON
═══════════════════════════════════════════════════════════════
SI silence prolongé (>10 sec) ou hésitation:
"Vous êtes toujours là ? Pas de souci si vous devez y aller.
Puis-je vous rappeler ou vous envoyer un SMS avec le lien de réservation ?"

SI l'appel se termine sans RDV:
→ Utilise schedule_callback avec next_action = "send_sms_booking_link"
"Très bien. Je vous envoie le lien par SMS, vous pourrez réserver en 30 secondes quand ça vous arrange."

═══════════════════════════════════════════════════════════════
RÈGLES STRICTES
═══════════════════════════════════════════════════════════════
- Maximum 3 phrases par réponse (concision = efficacité)
- Toujours qualifier AVANT de proposer un RDV
- Ne JAMAIS laisser partir sans au moins: callback OU email OU SMS
- Ton: professionnel, chaleureux, pas pushy
- Parler en français, naturel
- Utiliser le prénom du client dès qu'obtenu
- Si question technique complexe: "Excellente question. Notre consultant technique pourra y répondre en détail lors du RDV."`,
          // FUNCTION TOOLS - Sales Assistant (v2.0)
          tools: [
            {
              type: 'function',
              name: 'qualify_lead',
              description: 'Évaluer le prospect selon BANT (Budget, Authority, Need, Timeline). Appeler après avoir collecté les infos de qualification.',
              parameters: {
                type: 'object',
                properties: {
                  need: {
                    type: 'string',
                    enum: ['high', 'medium', 'low', 'unknown'],
                    description: 'Niveau de besoin exprimé: high=urgent, medium=intéressé, low=curieux, unknown=pas clair'
                  },
                  timeline: {
                    type: 'string',
                    enum: ['immediate', 'this_quarter', 'this_year', 'exploring'],
                    description: 'Urgence du projet: immediate=ce mois, this_quarter=3 mois, this_year=6-12 mois, exploring=pas de timeline'
                  },
                  budget: {
                    type: 'string',
                    enum: ['defined', 'flexible', 'limited', 'unknown'],
                    description: 'Situation budget: defined=budget alloué, flexible=peut investir, limited=contraint, unknown=pas discuté'
                  },
                  authority: {
                    type: 'string',
                    enum: ['decision_maker', 'influencer', 'user', 'unknown'],
                    description: 'Pouvoir de décision: decision_maker=décide, influencer=recommande, user=utilisateur final'
                  },
                  industry: {
                    type: 'string',
                    description: 'Secteur d\'activité du prospect (ecommerce, pme, agence, saas, etc.)'
                  },
                  company_size: {
                    type: 'string',
                    enum: ['solo', 'small', 'medium', 'large'],
                    description: 'Taille: solo=1 personne, small=2-10, medium=11-50, large=50+'
                  }
                },
                required: ['need', 'timeline']
              }
            },
            {
              type: 'function',
              name: 'handle_objection',
              description: 'Logger une objection du prospect pour analytics et adapter la réponse',
              parameters: {
                type: 'object',
                properties: {
                  objection_type: {
                    type: 'string',
                    enum: ['price', 'timing', 'competitor', 'authority', 'need', 'trust', 'other'],
                    description: 'Type d\'objection: price=trop cher, timing=pas maintenant, competitor=travaille avec autre, authority=pas décisionnaire, need=pas convaincu du besoin, trust=veut plus d\'infos'
                  },
                  objection_text: {
                    type: 'string',
                    description: 'Verbatim de l\'objection du prospect'
                  },
                  resolved: {
                    type: 'boolean',
                    description: 'True si l\'objection a été traitée avec succès, false si le prospect reste bloqué'
                  }
                },
                required: ['objection_type', 'objection_text']
              }
            },
            {
              type: 'function',
              name: 'schedule_callback',
              description: 'Planifier un rappel ou une action de suivi quand le RDV n\'est pas possible maintenant',
              parameters: {
                type: 'object',
                properties: {
                  callback_time: {
                    type: 'string',
                    description: 'Moment du rappel souhaité (ex: "demain 10h", "lundi matin", "dans 1 semaine")'
                  },
                  next_action: {
                    type: 'string',
                    enum: ['call_back', 'send_email', 'send_sms_booking_link', 'send_info_pack'],
                    description: 'Action de suivi: call_back=rappeler, send_email=envoyer email, send_sms_booking_link=SMS avec lien RDV, send_info_pack=envoyer documentation'
                  },
                  notes: {
                    type: 'string',
                    description: 'Notes contextuelles pour le suivi (ex: "intéressé par automatisation email, rappeler après réunion équipe")'
                  }
                },
                required: ['next_action']
              }
            },
            {
              type: 'function',
              name: 'create_booking',
              description: 'Créer une réservation de RDV découverte quand le prospect est qualifié et a fourni ses coordonnées',
              parameters: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Nom complet du prospect'
                  },
                  email: {
                    type: 'string',
                    description: 'Adresse email professionnelle'
                  },
                  phone: {
                    type: 'string',
                    description: 'Numéro de téléphone'
                  },
                  slot: {
                    type: 'string',
                    description: 'Créneau choisi (ex: "Mardi 14h", "Jeudi 10h")'
                  },
                  meeting_type: {
                    type: 'string',
                    enum: ['discovery_call', 'demo', 'audit', 'consultation'],
                    description: 'Type de RDV: discovery_call=découverte 30min, demo=démonstration, audit=audit gratuit, consultation=conseil'
                  },
                  qualification_score: {
                    type: 'string',
                    enum: ['hot', 'warm', 'cold'],
                    description: 'Score de qualification: hot=BANT complet et urgent, warm=intéressé mais pas urgent, cold=exploratoire'
                  },
                  notes: {
                    type: 'string',
                    description: 'Contexte et besoins discutés pendant l\'appel'
                  }
                },
                required: ['name', 'email', 'slot']
              }
            },
            {
              type: 'function',
              name: 'track_conversion_event',
              description: 'Tracker les étapes du funnel pour analytics conversion',
              parameters: {
                type: 'object',
                properties: {
                  event: {
                    type: 'string',
                    enum: ['call_started', 'permission_granted', 'qualification_complete', 'objection_raised', 'objection_resolved', 'closing_attempted', 'booking_created', 'callback_scheduled', 'call_abandoned', 'call_completed'],
                    description: 'Événement du funnel de conversion'
                  },
                  stage: {
                    type: 'string',
                    enum: ['opening', 'qualification', 'value_prop', 'objection_handling', 'closing', 'follow_up'],
                    description: 'Phase actuelle de la conversation'
                  },
                  outcome: {
                    type: 'string',
                    enum: ['success', 'partial', 'failed', 'pending'],
                    description: 'Résultat de l\'étape'
                  }
                },
                required: ['event', 'stage']
              }
            }
          ]
        }
      };

      ws.send(JSON.stringify(sessionConfig));

      const session = {
        id: sessionId,
        callSid: callInfo.callSid,
        from: callInfo.from,
        grokWs: ws,
        twilioWs: null,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        // Booking data
        bookingData: {
          phone: callInfo.from,
          name: null,
          email: null,
          slot: null,
          meeting_type: 'discovery_call',
          qualification_score: 'cold',
          notes: ''
        },
        // BANT Qualification (v2.0)
        qualification: {
          need: 'unknown',
          timeline: 'exploring',
          budget: 'unknown',
          authority: 'unknown',
          industry: null,
          company_size: null,
          score: 0 // 0-100 calculated
        },
        // Conversion Analytics (v2.0)
        analytics: {
          funnel_stage: 'opening',
          events: [],
          objections: [],
          call_duration: 0,
          outcome: 'pending' // pending, booked, callback, abandoned, completed
        },
        // Callback scheduling (v2.0)
        callback: {
          scheduled: false,
          time: null,
          action: null,
          notes: null
        },
        audioBuffer: []
      };

      activeSessions.set(sessionId, session);

      console.log(`[Grok] Session created: ${sessionId}`);
      resolve(session);
    });

    ws.on('message', (data) => {
      const message = safeJsonParse(data.toString());
      if (!message) return;

      handleGrokMessage(sessionId, message);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`[Grok] WebSocket error: ${error.message}`);
      cleanupSession(sessionId);
    });

    ws.on('close', () => {
      console.log(`[Grok] WebSocket closed for session: ${sessionId}`);
    });
  });
}

function handleGrokMessage(sessionId, message) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  switch (message.type) {
    case 'session.created':
      console.log(`[Grok] Session confirmed: ${sessionId}`);
      break;

    case 'response.audio.delta':
      // Forward audio to Twilio
      if (session.twilioWs && session.twilioWs.readyState === WebSocket.OPEN) {
        const twilioMessage = {
          event: 'media',
          streamSid: session.streamSid,
          media: {
            payload: message.delta // base64 audio
          }
        };
        session.twilioWs.send(JSON.stringify(twilioMessage));
      }
      break;

    case 'response.text.delta':
      // Log transcription for debugging
      if (message.delta) {
        console.log(`[Grok] AI: ${message.delta}`);
      }
      break;

    case 'input_audio_buffer.speech_started':
      console.log(`[Grok] User speaking...`);
      break;

    case 'response.done':
      // Check if booking data was extracted
      if (message.response && message.response.output) {
        extractBookingData(session, message.response.output);
      }
      break;

    case 'conversation.item.completed':
      // Check for function calls (booking confirmation)
      if (message.item && message.item.type === 'function_call') {
        handleFunctionCall(session, message.item);
      }
      break;

    case 'error':
      console.error(`[Grok] Error: ${message.error?.message || 'Unknown error'}`);
      break;
  }
}

function extractBookingData(session, output) {
  // Simple extraction from conversation
  const text = typeof output === 'string' ? output : JSON.stringify(output);

  // Extract email pattern
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    session.bookingData.email = emailMatch[0];
  }

  // Extract name (basic heuristic)
  const nameMatch = text.match(/(?:je m'appelle|mon nom est|c'est)\s+(\w+)/i);
  if (nameMatch) {
    session.bookingData.name = nameMatch[1];
  }
}

// ============================================
// BANT SCORE CALCULATION
// ============================================

function calculateBANTScore(qualification) {
  let score = 0;

  // Need scoring (0-30 points)
  const needScores = { high: 30, medium: 20, low: 10, unknown: 0 };
  score += needScores[qualification.need] || 0;

  // Timeline scoring (0-30 points)
  const timelineScores = { immediate: 30, this_quarter: 20, this_year: 10, exploring: 0 };
  score += timelineScores[qualification.timeline] || 0;

  // Budget scoring (0-20 points)
  const budgetScores = { defined: 20, flexible: 15, limited: 5, unknown: 0 };
  score += budgetScores[qualification.budget] || 0;

  // Authority scoring (0-20 points)
  const authorityScores = { decision_maker: 20, influencer: 10, user: 5, unknown: 0 };
  score += authorityScores[qualification.authority] || 0;

  return score;
}

function getQualificationLabel(score) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

// ============================================
// FUNCTION CALL HANDLERS (v2.0 - Sales Optimized)
// ============================================

async function handleFunctionCall(session, item) {
  const args = safeJsonParse(item.arguments, {});
  session.lastActivityAt = Date.now();

  console.log(`[Function] ${item.name} called with:`, JSON.stringify(args).substring(0, 200));

  switch (item.name) {
    case 'qualify_lead':
      await handleQualifyLead(session, args);
      break;

    case 'handle_objection':
      await handleObjection(session, args);
      break;

    case 'schedule_callback':
      await handleScheduleCallback(session, args);
      break;

    case 'create_booking':
      await handleCreateBooking(session, args);
      break;

    case 'track_conversion_event':
      await handleTrackConversion(session, args);
      break;

    default:
      console.log(`[Function] Unknown function: ${item.name}`);
  }
}

async function handleQualifyLead(session, args) {
  // Update qualification data
  session.qualification = {
    ...session.qualification,
    need: args.need || session.qualification.need,
    timeline: args.timeline || session.qualification.timeline,
    budget: args.budget || session.qualification.budget,
    authority: args.authority || session.qualification.authority,
    industry: args.industry || session.qualification.industry,
    company_size: args.company_size || session.qualification.company_size
  };

  // Calculate BANT score
  session.qualification.score = calculateBANTScore(session.qualification);
  session.bookingData.qualification_score = getQualificationLabel(session.qualification.score);

  // Track event
  session.analytics.events.push({
    type: 'qualification_complete',
    timestamp: Date.now(),
    data: session.qualification
  });
  session.analytics.funnel_stage = 'value_prop';

  console.log(`[Qualify] Score: ${session.qualification.score}/100 (${session.bookingData.qualification_score})`);
  console.log(`[Qualify] BANT: N=${args.need}, T=${args.timeline}, B=${args.budget}, A=${args.authority}`);

  // Log to file for analytics
  logConversionEvent(session, 'lead_qualified', {
    score: session.qualification.score,
    label: session.bookingData.qualification_score,
    qualification: session.qualification
  });
}

async function handleObjection(session, args) {
  const objection = {
    type: args.objection_type,
    text: args.objection_text,
    resolved: args.resolved || false,
    timestamp: Date.now()
  };

  session.analytics.objections.push(objection);
  session.analytics.funnel_stage = 'objection_handling';

  // Track event
  session.analytics.events.push({
    type: args.resolved ? 'objection_resolved' : 'objection_raised',
    timestamp: Date.now(),
    data: objection
  });

  console.log(`[Objection] ${args.objection_type}: "${args.objection_text}" - ${args.resolved ? 'RESOLVED' : 'PENDING'}`);

  // Log for analytics
  logConversionEvent(session, 'objection', {
    type: args.objection_type,
    resolved: args.resolved,
    text: args.objection_text
  });
}

async function handleScheduleCallback(session, args) {
  session.callback = {
    scheduled: true,
    time: args.callback_time || 'unspecified',
    action: args.next_action,
    notes: args.notes || ''
  };

  session.analytics.outcome = 'callback';
  session.analytics.funnel_stage = 'follow_up';

  // Track event
  session.analytics.events.push({
    type: 'callback_scheduled',
    timestamp: Date.now(),
    data: session.callback
  });

  console.log(`[Callback] Scheduled: ${args.next_action} at ${args.callback_time || 'TBD'}`);

  // Execute follow-up action
  if (args.next_action === 'send_sms_booking_link') {
    await sendSMSBookingLink(session);
  } else if (args.next_action === 'send_email') {
    await sendFollowUpEmail(session);
  }

  // Log for analytics
  logConversionEvent(session, 'callback_scheduled', session.callback);
}

async function handleCreateBooking(session, args) {
  // Merge booking data
  session.bookingData = {
    ...session.bookingData,
    name: args.name || session.bookingData.name,
    email: args.email || session.bookingData.email,
    slot: args.slot || session.bookingData.slot,
    meeting_type: args.meeting_type || 'discovery_call',
    qualification_score: args.qualification_score || session.bookingData.qualification_score,
    notes: args.notes || session.bookingData.notes
  };

  session.analytics.outcome = 'booked';
  session.analytics.funnel_stage = 'closing';

  // Track event
  session.analytics.events.push({
    type: 'booking_created',
    timestamp: Date.now(),
    data: session.bookingData
  });

  console.log(`[Booking] Creating for ${session.bookingData.name} (${session.bookingData.qualification_score})`);

  // Create the actual booking
  await createBooking(session);

  // Log for analytics
  logConversionEvent(session, 'booking_created', {
    ...session.bookingData,
    qualification: session.qualification
  });
}

async function handleTrackConversion(session, args) {
  const event = {
    type: args.event,
    stage: args.stage,
    outcome: args.outcome || 'pending',
    timestamp: Date.now()
  };

  session.analytics.events.push(event);
  session.analytics.funnel_stage = args.stage;

  console.log(`[Analytics] ${args.event} at ${args.stage} - ${args.outcome || 'pending'}`);
}

// ============================================
// FOLLOW-UP ACTIONS
// ============================================

async function sendSMSBookingLink(session) {
  if (!CONFIG.whatsapp.accessToken || !CONFIG.whatsapp.phoneNumberId) {
    console.log('[SMS] WhatsApp credentials not configured, skipping SMS');
    return;
  }

  const bookingLink = 'https://3a-automation.com/reserver';
  const phone = session.bookingData.phone?.replace(/\D/g, '');

  if (!phone) {
    console.log('[SMS] No phone number available');
    return;
  }

  console.log(`[SMS] Sending booking link to ${phone}`);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${CONFIG.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.whatsapp.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: {
            body: `Bonjour ! Voici le lien pour réserver votre appel découverte avec 3A Automation: ${bookingLink}\n\nÀ très vite !`
          }
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    const result = await response.json();
    if (result.messages) {
      console.log('[SMS] Booking link sent successfully');
    } else {
      console.error('[SMS] Error:', JSON.stringify(result));
    }
  } catch (error) {
    console.error(`[SMS] Error: ${error.message}`);
  }
}

async function sendFollowUpEmail(session) {
  // TODO: Implement email sending via Klaviyo or SMTP
  console.log(`[Email] Follow-up email queued for ${session.bookingData.email || session.bookingData.phone}`);

  // Log the intent for manual follow-up
  logConversionEvent(session, 'email_follow_up_queued', {
    phone: session.bookingData.phone,
    notes: session.callback.notes
  });
}

// ============================================
// CONVERSION ANALYTICS LOGGING
// ============================================

function logConversionEvent(session, eventType, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    sessionId: session.id,
    callSid: session.callSid,
    phone: session.bookingData.phone,
    event: eventType,
    funnel_stage: session.analytics.funnel_stage,
    qualification_score: session.qualification.score,
    data: data
  };

  // Log to console in structured format
  console.log(`[CONVERSION] ${JSON.stringify(logEntry)}`);

  // In production, this would send to analytics service (Mixpanel, Amplitude, etc.)
  // For now, we append to a log file
  try {
    const fs = require('fs');
    const logFile = process.env.CONVERSION_LOG_FILE || '/tmp/voice-conversion-analytics.jsonl';
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    // Ignore file write errors in non-production
  }
}

// ============================================
// TWILIO WEBHOOKS
// ============================================

function generateTwiML(streamUrl) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Connexion à l'assistant vocal.</Say>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="codec" value="mulaw"/>
    </Stream>
  </Connect>
</Response>`;
}

async function handleInboundCall(req, res, body) {
  // FIX: Validate Twilio signature
  if (!validateTwilioSignature(req, body)) {
    console.error('[Security] Rejected request with invalid Twilio signature');
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden: Invalid signature');
    return;
  }

  const callInfo = {
    callSid: body.CallSid,
    from: body.From,
    to: body.To,
    direction: 'inbound',
    timestamp: new Date().toISOString()
  };

  console.log(`[Twilio] Inbound call from ${callInfo.from}`);

  try {
    const session = await createGrokSession(callInfo);

    // Generate stream URL
    const host = req.headers.host || `localhost:${CONFIG.port}`;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const streamUrl = `wss://${host}/stream/${session.id}`;

    // Respond with TwiML
    const twiml = generateTwiML(streamUrl);

    res.writeHead(200, {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache'
    });
    res.end(twiml);

  } catch (error) {
    console.error(`[Twilio] Error handling call: ${error.message}`);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Désolé, le service est temporairement indisponible. Veuillez réessayer plus tard.</Say>
  <Hangup/>
</Response>`;

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(errorTwiml);
  }
}

function handleTwilioStream(ws, sessionId) {
  const session = activeSessions.get(sessionId);

  if (!session) {
    console.error(`[Twilio] Session not found: ${sessionId}`);
    ws.close();
    return;
  }

  session.twilioWs = ws;
  console.log(`[Twilio] Stream connected for session: ${sessionId}`);

  // ============================================
  // ABANDONMENT DETECTION (P1 - +15% recovery)
  // ============================================
  const INACTIVITY_THRESHOLD = 15000; // 15 seconds silence = potential abandon
  const RECOVERY_THRESHOLD = 30000;   // 30 seconds = trigger recovery
  let lastAudioTime = Date.now();
  let inactivityWarned = false;

  const inactivityChecker = setInterval(() => {
    const silenceDuration = Date.now() - lastAudioTime;

    // Warn after 15 seconds of silence
    if (silenceDuration > INACTIVITY_THRESHOLD && !inactivityWarned) {
      inactivityWarned = true;
      console.log(`[Abandon] Inactivity detected: ${Math.round(silenceDuration/1000)}s for ${sessionId}`);

      // Track abandonment signal
      session.analytics.events.push({
        type: 'inactivity_detected',
        timestamp: new Date().toISOString(),
        silence_duration: silenceDuration
      });

      // Signal Grok to trigger recovery prompt
      if (session.grokWs && session.grokWs.readyState === WebSocket.OPEN) {
        session.grokWs.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: '[SYSTEM: User silent for 15+ seconds. Trigger recovery: Ask if they want a callback or SMS with booking link.]' }]
          }
        }));
        session.grokWs.send(JSON.stringify({ type: 'response.create' }));
      }
    }

    // Full abandonment after 30 seconds
    if (silenceDuration > RECOVERY_THRESHOLD) {
      console.log(`[Abandon] Full abandonment detected for ${sessionId}`);
      session.analytics.outcome = 'abandoned';
      session.analytics.funnel_stage = 'abandoned';

      // Log abandonment event
      logConversionEvent(session, 'call_abandoned', {
        silence_duration: silenceDuration,
        last_stage: session.analytics.funnel_stage,
        qualification_score: session.qualification.score
      });

      // Clear checker and finalize
      clearInterval(inactivityChecker);
      finalizeSession(sessionId, true); // true = abandoned
    }
  }, 5000); // Check every 5 seconds

  ws.on('message', (data) => {
    const message = safeJsonParse(data.toString());
    if (!message) return;

    switch (message.event) {
      case 'connected':
        console.log(`[Twilio] Media stream connected`);
        break;

      case 'start':
        session.streamSid = message.start?.streamSid;
        session.streamStartTime = Date.now(); // Track stream start for duration
        console.log(`[Twilio] Stream started: ${session.streamSid}`);

        // Track call started event
        logConversionEvent(session, 'call_started', {
          phone: session.bookingData.phone,
          callSid: session.callSid
        });
        break;

      case 'media':
        // Reset inactivity timer on audio
        lastAudioTime = Date.now();
        inactivityWarned = false;

        // Forward audio to Grok
        if (session.grokWs && session.grokWs.readyState === WebSocket.OPEN) {
          const grokMessage = {
            type: 'input_audio_buffer.append',
            audio: message.media.payload
          };
          session.grokWs.send(JSON.stringify(grokMessage));
        }
        break;

      case 'stop':
        console.log(`[Twilio] Stream stopped`);
        clearInterval(inactivityChecker);

        // Finalize session
        finalizeSession(sessionId, false);
        break;
    }
  });

  ws.on('close', () => {
    console.log(`[Twilio] Stream closed for session: ${sessionId}`);
    clearInterval(inactivityChecker);
  });

  ws.on('error', (error) => {
    console.error(`[Twilio] Stream error: ${error.message}`);
    clearInterval(inactivityChecker);
  });
}

// ============================================
// BOOKING & WHATSAPP
// ============================================

async function createBooking(session) {
  if (!session.bookingData.name || !session.bookingData.email) {
    console.log(`[Booking] Incomplete data, skipping`);
    return;
  }

  console.log(`[Booking] Creating booking for ${session.bookingData.name}`);

  try {
    const response = await fetch(CONFIG.booking.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createBooking',
        data: session.bookingData
      }),
      signal: AbortSignal.timeout(10000)
    });

    const result = await response.json();

    if (result.success) {
      console.log(`[Booking] Created successfully`);

      // Send WhatsApp confirmation
      await sendWhatsAppConfirmation(session.bookingData);
    }
  } catch (error) {
    console.error(`[Booking] Error: ${error.message}`);
  }
}

async function sendWhatsAppConfirmation(bookingData) {
  if (!CONFIG.whatsapp.accessToken || !CONFIG.whatsapp.phoneNumberId) {
    console.log(`[WhatsApp] Credentials not configured, skipping`);
    return;
  }

  console.log(`[WhatsApp] Sending confirmation to ${bookingData.phone}`);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${CONFIG.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.whatsapp.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: bookingData.phone.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: 'booking_confirmation',
            language: { code: 'fr' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: bookingData.name },
                  { type: 'text', text: bookingData.slot || 'À confirmer' }
                ]
              }
            ]
          }
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    const result = await response.json();

    if (result.messages) {
      console.log(`[WhatsApp] Confirmation sent`);
    } else {
      console.error(`[WhatsApp] Error: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error(`[WhatsApp] Error: ${error.message}`);
  }
}

async function finalizeSession(sessionId, wasAbandoned = false) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  // Prevent duplicate finalization
  if (session.finalized) return;
  session.finalized = true;

  console.log(`[Session] Finalizing ${sessionId} (abandoned: ${wasAbandoned})`);

  // ============================================
  // CALCULATE CALL ANALYTICS (P2)
  // ============================================
  const endTime = Date.now();
  const callDuration = session.streamStartTime
    ? Math.round((endTime - session.streamStartTime) / 1000)
    : 0;
  session.analytics.call_duration = callDuration;

  // Determine final outcome
  if (!wasAbandoned) {
    if (session.analytics.outcome === 'booked') {
      // Already set by create_booking function
    } else if (session.callback.scheduled) {
      session.analytics.outcome = 'callback';
    } else if (session.bookingData.name || session.bookingData.email) {
      // Some data collected but no booking
      session.analytics.outcome = 'partial';
    } else {
      session.analytics.outcome = 'completed';
    }
  }
  // If wasAbandoned, outcome already set to 'abandoned'

  // ============================================
  // HANDLE DIFFERENT OUTCOMES
  // ============================================

  if (session.analytics.outcome === 'booked') {
    // Success path: create booking + send WhatsApp
    if (session.bookingData.name && session.bookingData.email) {
      await createBooking(session);
    }
  }
  else if (session.analytics.outcome === 'callback') {
    // Callback scheduled - log for CRM follow-up
    console.log(`[Callback] Scheduled for ${session.callback.time} - ${session.bookingData.phone}`);
    // In production: create CRM task, calendar event, etc.
  }
  else if (session.analytics.outcome === 'abandoned' || session.analytics.outcome === 'partial') {
    // RECOVERY: Send SMS with booking link for abandoned/partial leads
    console.log(`[Recovery] Attempting SMS recovery for ${session.bookingData.phone}`);
    await sendRecoverySMS(session);
  }

  // ============================================
  // LOG FINAL CONVERSION ANALYTICS
  // ============================================
  const finalAnalytics = {
    session_id: sessionId,
    phone: session.bookingData.phone,
    call_sid: session.callSid,
    duration_seconds: callDuration,
    outcome: session.analytics.outcome,
    funnel_stage: session.analytics.funnel_stage,
    qualification: {
      score: session.qualification.score,
      label: session.bookingData.qualification_score,
      need: session.qualification.need,
      timeline: session.qualification.timeline,
      budget: session.qualification.budget,
      authority: session.qualification.authority
    },
    objections_count: session.analytics.objections.length,
    objections: session.analytics.objections.map(o => o.type),
    events_count: session.analytics.events.length,
    booking_created: session.analytics.outcome === 'booked',
    callback_scheduled: session.callback.scheduled
  };

  console.log(`[Analytics] Final: ${JSON.stringify(finalAnalytics)}`);
  logConversionEvent(session, 'call_completed', finalAnalytics);

  // ============================================
  // CONVERSION SUMMARY (for console visibility)
  // ============================================
  const outcomeEmoji = {
    'booked': '✅',
    'callback': '📞',
    'abandoned': '🚪',
    'partial': '📝',
    'completed': '💬'
  };

  console.log(`
╔════════════════════════════════════════════╗
║ CALL SUMMARY                               ║
╠════════════════════════════════════════════╣
║ ${outcomeEmoji[session.analytics.outcome] || '❓'} Outcome: ${session.analytics.outcome.toUpperCase().padEnd(12)} ║
║ ⏱️  Duration: ${String(callDuration).padStart(3)}s                       ║
║ 🎯 BANT Score: ${String(session.qualification.score).padStart(3)}/100 (${session.bookingData.qualification_score.padEnd(4)})     ║
║ 📊 Stage: ${session.analytics.funnel_stage.padEnd(20)} ║
║ ⚡ Objections: ${String(session.analytics.objections.length).padStart(2)}                        ║
╚════════════════════════════════════════════╝
`);

  // Cleanup after delay
  setTimeout(() => cleanupSession(sessionId), 5000);
}

// ============================================
// RECOVERY SMS FOR ABANDONED LEADS
// ============================================
async function sendRecoverySMS(session) {
  const phone = session.bookingData.phone;
  if (!phone) {
    console.log(`[Recovery] No phone number, skipping SMS`);
    return;
  }

  // Use WhatsApp if available, else log for manual follow-up
  if (CONFIG.whatsapp.accessToken && CONFIG.whatsapp.phoneNumberId) {
    try {
      const bookingLink = 'https://3a-automation.com/reserver';
      const message = session.bookingData.name
        ? `Bonjour ${session.bookingData.name}, nous avons été coupés! Réservez votre appel découverte ici: ${bookingLink}`
        : `Bonjour, réservez votre appel découverte 3A Automation: ${bookingLink}`;

      const response = await fetch(
        `https://graph.facebook.com/v22.0/${CONFIG.whatsapp.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.whatsapp.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.replace(/\D/g, ''),
            type: 'text',
            text: { body: message }
          }),
          signal: AbortSignal.timeout(10000)
        }
      );

      const result = await response.json();
      if (result.messages) {
        console.log(`[Recovery] SMS sent successfully to ${phone}`);
        logConversionEvent(session, 'recovery_sms_sent', { phone, message });
      } else {
        console.error(`[Recovery] SMS failed: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error(`[Recovery] SMS error: ${error.message}`);
    }
  } else {
    console.log(`[Recovery] WhatsApp not configured - manual follow-up required for ${phone}`);
    logConversionEvent(session, 'recovery_sms_pending', {
      phone,
      reason: 'whatsapp_not_configured',
      qualification_score: session.qualification.score
    });
  }
}

// ============================================
// HTTP SERVER
// ============================================

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > CONFIG.security.maxBodySize) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        resolve(safeJsonParse(body, {}));
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(body);
        const obj = {};
        for (const [key, value] of params) {
          obj[key] = value;
        }
        resolve(obj);
      } else {
        resolve({ raw: body });
      }
    });

    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
    return;
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Health check
    if (pathname === '/health' && req.method === 'GET') {
      const health = {
        status: 'ok',
        service: 'voice-telephony-bridge',
        version: '1.0.0',
        activeSessions: activeSessions.size,
        maxSessions: CONFIG.security.maxActiveSessions,
        twilio: !!CONFIG.twilio.accountSid,
        grok: !!CONFIG.grok.apiKey,
        whatsapp: !!CONFIG.whatsapp.accessToken,
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
      return;
    }

    // Twilio inbound call webhook
    if (pathname === '/voice/inbound' && req.method === 'POST') {
      const body = await parseBody(req);
      await handleInboundCall(req, res, body);
      return;
    }

    // Twilio status callback
    if (pathname === '/voice/status' && req.method === 'POST') {
      const body = await parseBody(req);
      console.log(`[Twilio] Call status: ${body.CallStatus} for ${body.CallSid}`);
      res.writeHead(200);
      res.end();
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error(`[HTTP] Error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// WebSocket server for Twilio media streams
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = url.pathname.match(/^\/stream\/(.+)$/);

  if (match) {
    const sessionId = match[1];
    handleTwilioStream(ws, sessionId);
  } else {
    console.error(`[WebSocket] Invalid path: ${url.pathname}`);
    ws.close();
  }
});

// ============================================
// CLI INTERFACE
// ============================================

function printUsage() {
  console.log(`
Voice Telephony Bridge - Native Script
======================================

Usage:
  node voice-telephony-bridge.cjs [options]

Options:
  --server          Start HTTP/WebSocket server (default)
  --port=PORT       Server port (default: 3009)
  --health          Check system health
  --test-grok       Test Grok connection
  --help            Show this help

Environment Variables:
  TWILIO_ACCOUNT_SID     Twilio Account SID
  TWILIO_AUTH_TOKEN      Twilio Auth Token
  TWILIO_PHONE_NUMBER    Twilio Phone Number
  XAI_API_KEY            xAI/Grok API Key
  GROK_VOICE             Grok voice (Sal, Rex, Eve, Leo, Mika, Valentin)
  WHATSAPP_ACCESS_TOKEN  WhatsApp Business API Token
  WHATSAPP_PHONE_NUMBER_ID  WhatsApp Phone Number ID

Twilio Webhook Configuration:
  Voice URL: https://your-domain.com/voice/inbound (POST)
  Status URL: https://your-domain.com/voice/status (POST)
`);
}

async function testGrokConnection() {
  console.log('[Test] Testing Grok connection...');

  if (!CONFIG.grok.apiKey) {
    console.error('❌ XAI_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${CONFIG.grok.apiKey}` },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      console.log('✅ Grok API connection OK');
      return true;
    } else {
      console.error(`❌ Grok API error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Grok connection failed: ${error.message}`);
    return false;
  }
}

async function checkHealth() {
  console.log('\n=== Voice Telephony Bridge - Health Check ===\n');

  // Twilio
  console.log('Twilio:');
  console.log(`  Account SID: ${CONFIG.twilio.accountSid ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Auth Token: ${CONFIG.twilio.authToken ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Phone: ${CONFIG.twilio.phoneNumber || 'Not set'}`);

  // Grok
  console.log('\nGrok Voice:');
  console.log(`  API Key: ${CONFIG.grok.apiKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Voice: ${CONFIG.grok.voice}`);
  if (CONFIG.grok.apiKey) {
    await testGrokConnection();
  }

  // WhatsApp
  console.log('\nWhatsApp:');
  console.log(`  Access Token: ${CONFIG.whatsapp.accessToken ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Phone Number ID: ${CONFIG.whatsapp.phoneNumberId ? '✅ Configured' : '❌ Missing'}`);

  // Summary
  console.log('\n=== Summary ===');
  const twilioReady = CONFIG.twilio.accountSid && CONFIG.twilio.authToken;
  const grokReady = !!CONFIG.grok.apiKey;

  if (twilioReady && grokReady) {
    console.log('✅ System ready for telephony');
  } else {
    console.log('⚠️ System NOT ready:');
    if (!twilioReady) console.log('  - Configure Twilio credentials');
    if (!grokReady) console.log('  - Configure XAI_API_KEY');
  }

  console.log('');
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    printUsage();
    return;
  }

  if (args.includes('--health')) {
    await checkHealth();
    return;
  }

  if (args.includes('--test-grok')) {
    await testGrokConnection();
    return;
  }

  // Parse port
  const portArg = args.find(a => a.startsWith('--port='));
  if (portArg) {
    CONFIG.port = parseInt(portArg.split('=')[1]);
  }

  // Start server
  server.listen(CONFIG.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Voice Telephony Bridge - Native Script               ║
║                      Version 1.0.0                           ║
╠══════════════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${CONFIG.port.toString().padEnd(25)}║
║  WebSocket:    ws://localhost:${CONFIG.port}/stream/{sessionId}       ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                  ║
║    POST /voice/inbound    Twilio inbound call webhook        ║
║    POST /voice/status     Twilio status callback             ║
║    GET  /health           Health check                       ║
║    WS   /stream/:id       Twilio media stream                ║
╠══════════════════════════════════════════════════════════════╣
║  Status:                                                     ║
║    Twilio:   ${(CONFIG.twilio.accountSid ? '✅ Ready' : '❌ Missing credentials').padEnd(43)}║
║    Grok:     ${(CONFIG.grok.apiKey ? '✅ Ready' : '❌ Missing XAI_API_KEY').padEnd(43)}║
║    WhatsApp: ${(CONFIG.whatsapp.accessToken ? '✅ Ready' : '⏳ Awaiting credentials').padEnd(43)}║
╚══════════════════════════════════════════════════════════════╝
`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down...');

    // Close all sessions
    for (const [sessionId] of activeSessions) {
      cleanupSession(sessionId);
    }

    wss.close();
    server.close(() => {
      console.log('[Server] Closed');
      process.exit(0);
    });

    // Force exit after 5s
    setTimeout(() => process.exit(1), 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(console.error);
