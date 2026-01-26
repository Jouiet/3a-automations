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

const fs = require('fs');
const path = require('path');

// Portability Patch: Resilient .env loading
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '../../../.env'),
  path.join(process.cwd(), '.env')
];
let envFound = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`[Telemetry] Configuration loaded from: ${envPath}`);
    envFound = true;
    break;
  }
}
if (!envFound) {
  console.warn('[Telemetry] No .env file found in search paths. Using existing environment variables.');
}
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');

// Marketing Science Core
const MarketingScience = require('./marketing-science-core.cjs');
// Voice Persona Injector (The Director)
const { VoicePersonaInjector } = require('./voice-persona-injector.cjs');
// RAG Knowledge Base
const KNOWLEDGE_BASE = require('./knowledge_base.json');

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

// ============================================================================
// HITL CONFIGURATION (Human In The Loop)
// ============================================================================

const HITL_CONFIG = {
  enabled: process.env.HITL_VOICE_ENABLED !== 'false',
  approveHotBookings: process.env.HITL_APPROVE_HOT_BOOKINGS !== 'false',
  approveTransfers: process.env.HITL_APPROVE_TRANSFERS !== 'false',
  slackWebhook: process.env.HITL_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL,
  notifyOnPending: process.env.HITL_NOTIFY_ON_PENDING !== 'false'
};

const DATA_DIR = process.env.VOICE_DATA_DIR || path.join(__dirname, '../../../data/voice');
const HITL_PENDING_DIR = path.join(DATA_DIR, 'hitl-pending');
const HITL_PENDING_FILE = path.join(HITL_PENDING_DIR, 'pending-actions.json');

// Ensure directories exist
function ensureHitlDir() {
  if (!fs.existsSync(HITL_PENDING_DIR)) {
    fs.mkdirSync(HITL_PENDING_DIR, { recursive: true });
  }
}
ensureHitlDir();

// HITL Functions
function loadPendingActions() {
  try {
    if (fs.existsSync(HITL_PENDING_FILE)) {
      return JSON.parse(fs.readFileSync(HITL_PENDING_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn(`⚠️ Could not load HITL pending actions: ${error.message}`);
  }
  return [];
}

function savePendingActions(actions) {
  try {
    const tempPath = `${HITL_PENDING_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(actions, null, 2));
    fs.renameSync(tempPath, HITL_PENDING_FILE);
  } catch (error) {
    console.error(`❌ Failed to save HITL pending actions: ${error.message}`);
  }
}

function queueActionForApproval(actionType, session, args, reason) {
  const pending = loadPendingActions();
  const pendingAction = {
    id: `hitl_voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    actionType,
    sessionId: session.sessionId,
    callSid: session.callSid,
    bookingData: session.bookingData,
    args,
    reason,
    queuedAt: new Date().toISOString(),
    status: 'pending'
  };

  pending.push(pendingAction);
  savePendingActions(pending);

  console.log(`🔒 Voice action "${actionType}" queued for HITL approval`);

  // Slack notification
  if (HITL_CONFIG.slackWebhook && HITL_CONFIG.notifyOnPending) {
    sendHitlVoiceNotification(pendingAction).catch(e => console.error(`❌ Slack notification failed: ${e.message}`));
  }

  return pendingAction;
}

async function sendHitlVoiceNotification(pendingAction) {
  if (!HITL_CONFIG.slackWebhook) return;

  const message = {
    text: `🔒 HITL Approval Required - Voice Action`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🔒 HITL: ${pendingAction.actionType === 'transfer' ? 'Call Transfer' : 'Hot Booking'} Pending`, emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Action:* ${pendingAction.actionType}` },
          { type: 'mrkdwn', text: `*Call SID:* ${pendingAction.callSid || 'N/A'}` },
          { type: 'mrkdwn', text: `*Customer:* ${pendingAction.bookingData?.name || pendingAction.bookingData?.email || 'N/A'}` },
          { type: 'mrkdwn', text: `*Reason:* ${pendingAction.reason}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`node voice-telephony-bridge.cjs --approve=${pendingAction.id}\`\`\`` }
      }
    ]
  };

  await fetch(HITL_CONFIG.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
}

async function approveAction(hitlId) {
  const pending = loadPendingActions();
  const index = pending.findIndex(a => a.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL action ${hitlId} not found`);
    return { success: false, error: 'Action not found' };
  }

  const action = pending[index];
  action.status = 'approved';
  action.approvedAt = new Date().toISOString();

  pending.splice(index, 1);
  savePendingActions(pending);

  console.log(`✅ HITL action "${action.actionType}" approved`);

  // Execute the action
  const session = activeSessions.get(action.sessionId);
  if (!session) {
    return { success: true, action, warning: 'Session no longer active - action logged but not executed' };
  }

  if (action.actionType === 'transfer') {
    const result = await handleTransferCallInternal(session, action.args);
    return { success: true, action, result };
  } else if (action.actionType === 'booking') {
    const result = await handleCreateBookingInternal(session, action.args);
    return { success: true, action, result };
  }

  return { success: true, action };
}

function rejectAction(hitlId, reason = 'Rejected by operator') {
  const pending = loadPendingActions();
  const index = pending.findIndex(a => a.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL action ${hitlId} not found`);
    return { success: false, error: 'Action not found' };
  }

  const action = pending[index];
  action.status = 'rejected';
  action.rejectedAt = new Date().toISOString();
  action.rejectionReason = reason;

  pending.splice(index, 1);
  savePendingActions(pending);

  console.log(`❌ HITL action "${action.actionType}" rejected: ${reason}`);

  return { success: true, action };
}

function listPendingActions() {
  const pending = loadPendingActions();
  console.log(`\n🔒 Pending HITL Voice Actions (${pending.length}):\n`);

  if (pending.length === 0) {
    console.log('  No pending actions');
    return pending;
  }

  pending.forEach(a => {
    console.log(`  • ${a.id}`);
    console.log(`    Action: ${a.actionType}`);
    console.log(`    Customer: ${a.bookingData?.name || a.bookingData?.email || 'N/A'}`);
    console.log(`    Call SID: ${a.callSid || 'N/A'}`);
    console.log(`    Queued: ${a.queuedAt}`);
    console.log();
  });

  return pending;
}

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
          // PHASE 1: THE DIRECTOR - Dynamic Persona Injection
          // Default instruction placeholder (will be overridden by Injector)
          instructions: '',
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
            },
            {
              type: 'function',
              name: 'search_knowledge_base',
              description: 'Rechercher des informations spécifiques (Horaires, Politiques, Services) dans la base de connaissances du client.',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'La question ou le sujet recherché (ex: "return policy", "opening hours", "emergency")',
                  },
                  category: {
                    type: 'string',
                    description: 'Catégorie optionnelle pour affiner (shipping, returns, pricing, general)'
                  }
                },
                required: ['query']
              }
            },
            {
              type: 'function',
              name: 'send_payment_details',
              description: 'Envoyer les coordonnées bancaires (RIB/IBAN/Wise) ou un lien de paiement selon la configuration du client.',
              parameters: {
                type: 'object',
                properties: {
                  amount: {
                    type: 'number',
                    description: 'Montant à payer (ex: 50, 100)'
                  },
                  description: {
                    type: 'string',
                    description: 'Motif du paiement (ex: Acompte, Solde)'
                  },
                  method_override: {
                    type: 'string',
                    enum: ['BANK_TRANSFER', 'LINK', 'CASH'],
                    description: 'Forcer une méthode si besoin'
                  }
                },
                required: ['amount', 'description']
              }
            },
            {
              type: 'function',
              name: 'transfer_call',
              description: 'Transférer l\'appel à un agent humain (Urgence, Demande complexe, Handoff).',
              parameters: {
                type: 'object',
                properties: {
                  reason: {
                    type: 'string',
                    description: 'Raison du transfert (ex: "Client en colère", "Demande hors scope", "Urgence médicale")'
                  },
                  phone_number: {
                    type: 'string',
                    description: 'Numéro de destination optionnel (sinon utilise le numéro du client)'
                  }
                },
                required: ['reason']
              }
            }
          ]
        }
      };

      // Determine Persona based on Call Context
      const persona = VoicePersonaInjector.getPersona(
        callInfo.from,    // Caller ID
        callInfo.to,      // Called Number (maps to Vertical)
        callInfo.clientId // Multi-tenancy ID (optional)
      );

      console.log(`[The Director] Injecting Persona: ${persona.name} (${persona.id}) for Vertical: ${callInfo.to}`);

      // Inject Persona (Instructions + Voice)
      // This overwrites the default 'voice' and 'instructions' in sessionConfig
      const finalConfig = VoicePersonaInjector.inject(sessionConfig, persona);

      ws.send(JSON.stringify(finalConfig));

      const session = {
        id: sessionId,
        callSid: callInfo.callSid,
        from: callInfo.from,
        grokWs: ws,
        twilioWs: null,
        metadata: finalConfig.session_config?.metadata || finalConfig.metadata || {}, // Store injected persona metadata
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

    case 'search_knowledge_base':
      await handleSearchKnowledgeBase(session, args);
      break;

    case 'transfer_call':
      await handleTransferCall(session, args);
      break;

    case 'send_payment_details':
      await handleSendPaymentDetails(session, args);
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

  // HITL Check: Hot bookings require approval
  const isHotLead = session.bookingData.qualification_score === 'hot';
  if (HITL_CONFIG.enabled && HITL_CONFIG.approveHotBookings && isHotLead) {
    const pendingAction = queueActionForApproval('booking', session, args, 'Hot lead booking requires approval');
    return {
      status: 'pending_approval',
      hitlId: pendingAction.id,
      message: `Booking queued for HITL approval. Use --approve=${pendingAction.id} to proceed.`
    };
  }

  return handleCreateBookingInternal(session, args);
}

async function handleCreateBookingInternal(session, args) {
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

async function handleSearchKnowledgeBase(session, args) {
  // Use knowledge_base_id from metadata (injected by VoicePersonaInjector), fallback to persona_id or 'agency_v2'
  const kbId = session.metadata?.knowledge_base_id || session.metadata?.persona_id || 'agency_v2';
  const query = args.query.toLowerCase();

  console.log(`[RAG] Searching KB for ${kbId}: "${query}"`);

  // Simple In-Memory RAG
  const kbData = KNOWLEDGE_BASE[kbId];

  if (!kbData) {
    console.log(`[RAG] No KB found for ID: ${kbId}`);
    return { found: false, result: "Je n'ai pas accès à cette information spécifique pour le moment." };
  }

  // Keyword search simulation (Naive logic -> Semantic ID ideally)
  // In production: Use vector database (Pinecone/Weaviate)
  let bestMatch = null;
  let maxScore = 0;

  for (const [key, value] of Object.entries(kbData)) {
    let score = 0;
    const keyWords = key.split('_');
    keyWords.forEach(kw => {
      // Improved match: check both ways for partials (e.g., service vs services)
      if (query.includes(kw) || kw.includes(query)) score += 3;
    });

    // Check value content
    if (value.toLowerCase().includes(query)) score += 2;

    // Direct match tweaks
    if (query.includes('hour') || query.includes('horaire')) score += 5;
    if (query.includes('return') || query.includes('retour')) score += 5;
    if (query.includes('pay') || query.includes('paiement')) score += 5;
    if (query.includes('ship') || query.includes('livraison')) score += 5;
    if (query.includes('emergency') || query.includes('urgence')) score += 5;

    if (score > maxScore) {
      maxScore = score;
      bestMatch = value;
    }
  }

  // Fallback to searching all values if no key match
  if (!bestMatch) {
    const allText = Object.values(kbData).join(' ').toLowerCase();
    if (allText.includes(query)) {
      // Return the specific entry containing the text
      for (const value of Object.values(kbData)) {
        if (value.toLowerCase().includes(query)) {
          bestMatch = value;
          break;
        }
      }
    }
  }

  if (bestMatch) {
    console.log(`[RAG] Found answer: "${bestMatch.substring(0, 50)}..."`);
    // Send info back to Grok (via Function Result or System Injection)
    // For Grok Realtime, we essentially "feed" this back.
    // NOTE: In current WebSocket API, the function return value is automatically sent back as "function_response".
    return { found: true, result: bestMatch };
  } else {
    console.log(`[RAG] No answer found.`);
    return { found: false, result: "Désolé, je ne trouve pas cette information dans mes documents." };
  }
}

async function handleTransferCall(session, args) {
  console.log(`[Handoff] Transfer requested. Reason: ${args.reason}`);

  // HITL Check: Call transfers require approval
  if (HITL_CONFIG.enabled && HITL_CONFIG.approveTransfers) {
    const pendingAction = queueActionForApproval('transfer', session, args, `Call transfer requested: ${args.reason}`);
    return {
      status: 'pending_approval',
      hitlId: pendingAction.id,
      message: `Transfer queued for HITL approval. Use --approve=${pendingAction.id} to proceed.`
    };
  }

  return handleTransferCallInternal(session, args);
}

async function handleTransferCallInternal(session, args) {
  if (!twilio) {
    console.error('[Handoff] Twilio SDK not available');
    return { success: false, error: "twilio_not_configured" };
  }

  // Instantiate Client
  const client = twilio(CONFIG.twilio.accountSid, CONFIG.twilio.authToken);
  const callSid = session.callSid;

  // Determine target phone
  // 1. Explicit arg
  // 2. Business Info from Metadata (Injected by Director)
  // 3. Fallback to Agency Default (defined in env or config)
  let targetPhone = args.phone_number || session.metadata?.business_info?.phone || CONFIG.twilio.phoneNumber;

  if (!targetPhone) {
    console.error('[Handoff] No target phone number available');
    return { success: false, error: "no_target_phone" };
  }

  console.log(`[Handoff] Executing transfer for Call ${callSid} to ${targetPhone}`);

  // TwiML to execute the transfer
  const twiml = `
<Response>
  <Say language="fr-FR">Je vous transfère vers un conseiller humain. Veuillez patienter un instant.</Say>
  <Dial>${targetPhone}</Dial>
</Response>`;

  try {
    // Update the live call with new TwiML
    await client.calls(callSid).update({ twiml: twiml });

    // Log conversion event
    logConversionEvent(session, 'call_transfer', {
      reason: args.reason,
      target: targetPhone
    });

    return { success: true, status: "transfer_initiated" };
  } catch (error) {
    console.error(`[Handoff] Twilio Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// FOLLOW-UP & MESSAGING ACTIONS
// ============================================

async function sendGenericSMS(to, body) {
  if (!CONFIG.whatsapp.accessToken || !CONFIG.whatsapp.phoneNumberId) {
    console.log('[SMS] WhatsApp credentials not configured, skipping SMS');
    return false;
  }

  console.log(`[SMS] Sending to ${to}: "${body.substring(0, 50)}..."`);

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
          to: to,
          type: 'text',
          text: { body }
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    const result = await response.json();
    if (result.messages) {
      console.log('[SMS] Message sent successfully');
      return true;
    } else {
      console.error('[SMS] Error:', JSON.stringify(result));
      return false;
    }
  } catch (error) {
    console.error(`[SMS] Error: ${error.message}`);
    return false;
  }
}

async function sendSMSBookingLink(session) {
  const bookingLink = 'https://3a-automation.com/reserver';
  const phone = session.bookingData.phone?.replace(/\D/g, '');

  if (!phone) {
    console.log('[SMS] No phone number available for booking link');
    return;
  }

  const body = `Bonjour ! Voici le lien pour réserver votre appel découverte avec 3A Automation: ${bookingLink}\n\nÀ très vite !`;
  await sendGenericSMS(phone, body);
}

async function handleSendPaymentDetails(session, args) {
  const amount = args.amount;
  const description = args.description;
  const config = session.metadata?.payment_config;

  if (!config) {
    console.error('[Payment] No payment config found in session metadata');
    return { success: false, error: "no_payment_config" };
  }

  const method = args.method_override || config.method;
  const details = config.details;
  const currency = config.currency || 'EUR';

  console.log(`[Payment] Sending ${amount} ${currency} via ${method} for ${description}`);

  let message = "";
  if (method === 'BANK_TRANSFER') {
    message = `Voici les coordonnées pour le règlement de ${amount}${currency} (${description}):\n\n${details}\n\nMerci de nous envoyer une preuve de virement.`;
  } else if (method === 'LINK') {
    message = `Voici votre lien de paiement de ${amount}${currency} (${description}): ${details}`;
  } else {
    message = `Pour le règlement de ${amount}${currency} (${description}), les modalités sont: ${details}`;
  }

  try {
    const phone = session.bookingData.phone?.replace(/\D/g, '');
    if (!phone) throw new Error("No phone number available");

    const sent = await sendGenericSMS(phone, message);

    if (sent) {
      logConversionEvent(session, 'payment_details_sent', {
        amount,
        currency,
        method,
        description
      });
      return { success: true, message: "Les détails ont été envoyés par SMS." };
    } else {
      return { success: false, error: "sms_failed" };
    }
  } catch (error) {
    console.error(`[Payment] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function sendFollowUpEmail(session) {
  // Action: Log email follow-up request for external processing
  console.log(`[Email] Follow-up email requested for ${session.bookingData.email || session.bookingData.phone} (Handled by CRM Pipeline)`);

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

// ============================================
// OUTBOUND CALL HANDLERS (Agentic "Act")
// ============================================

async function handleOutboundTrigger(req, res, body) {
  if (!CONFIG.twilio.accountSid || !CONFIG.twilio.authToken || !CONFIG.twilio.phoneNumber) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Twilio credentials not configured' }));
    return;
  }

  // Basic validation
  if (!body.phone) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Phone number required' }));
    return;
  }

  if (!twilio) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Twilio SDK not installed' }));
    return;
  }

  const client = twilio(CONFIG.twilio.accountSid, CONFIG.twilio.authToken);
  const host = req.headers.host || `localhost:${CONFIG.port}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const callbackUrl = `${protocol}://${host}/voice/outbound-twiml`;

  console.log(`[Outbound] Triggering call to ${body.phone}...`);

  try {
    const call = await client.calls.create({
      url: callbackUrl,
      to: body.phone,
      from: CONFIG.twilio.phoneNumber,
      statusCallback: `${protocol}://${host}/voice/status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    console.log(`[Outbound] Call initiated: ${call.sid}`);

    // Create pre-session to track this outbound call
    // Note: The actual websocket session will be created when TwiML connects
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      callSid: call.sid,
      status: call.status
    }));

  } catch (error) {
    console.error(`[Outbound] Failed to initiate call: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleOutboundTwiML(req, res, body) {
  const callSid = body.CallSid;
  const to = body.To;

  console.log(`[Outbound] Connecting call ${callSid} to Grok Stream`);

  // Create session for outbound call
  const callInfo = {
    callSid: callSid,
    from: to, // For outbound, "from" is the person we called (the user)
    to: body.From, // Our number
    direction: 'outbound',
    timestamp: new Date().toISOString()
  };

  try {
    const session = await createGrokSession(callInfo);

    // Generate stream URL
    const host = req.headers.host || `localhost:${CONFIG.port}`;
    const streamUrl = `wss://${host}/stream/${session.id}`;

    // TwiML for outbound: Say hello, then connect stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Bonjour, ici 3A Automation. Je vous passe mon collègue IA.</Say>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="codec" value="mulaw"/>
    </Stream>
  </Connect>
</Response>`;

    res.writeHead(200, {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache'
    });
    res.end(twiml);

  } catch (error) {
    console.error(`[Outbound] Error generating TwiML: ${error.message}`);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Une erreur est survenue lors de la connexion.</Say>
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
      console.log(`[Abandon] Inactivity detected: ${Math.round(silenceDuration / 1000)}s for ${sessionId}`);

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

    // Outbound call trigger (Agentic Action)
    if (pathname === '/voice/outbound' && req.method === 'POST') {
      const body = await parseBody(req);
      await handleOutboundTrigger(req, res, body);
      return;
    }

    // Outbound TwiML handler
    if (pathname === '/voice/outbound-twiml' && req.method === 'POST') {
      const body = await parseBody(req); // To get CallSid if needed
      await handleOutboundTwiML(req, res, body);
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
  --list-pending    List HITL pending voice actions
  --approve=ID      Approve HITL pending action
  --reject=ID       Reject HITL pending action
  --help            Show this help

HITL (Human In The Loop):
  Hot bookings and call transfers require approval.
  ENV: HITL_APPROVE_HOT_BOOKINGS (default: true)
  ENV: HITL_APPROVE_TRANSFERS (default: true)
  ENV: HITL_SLACK_WEBHOOK (Slack notifications)
  ENV: HITL_VOICE_ENABLED (default: true)

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

  // HITL Commands
  if (args.includes('--list-pending')) {
    listPendingActions();
    return;
  }

  const approveArg = args.find(a => a.startsWith('--approve='));
  if (approveArg) {
    const hitlId = approveArg.split('=')[1];
    const result = await approveAction(hitlId);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const rejectArg = args.find(a => a.startsWith('--reject='));
  if (rejectArg) {
    const hitlId = rejectArg.split('=')[1];
    const reasonArg = args.find(a => a.startsWith('--reason='));
    const reason = reasonArg ? reasonArg.split('=')[1] : 'Rejected by operator';
    const result = rejectAction(hitlId, reason);
    console.log(JSON.stringify(result, null, 2));
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

// Module Exports for Verification/External Integration
if (typeof module !== 'undefined') {
  module.exports = {
    handleSearchKnowledgeBase,
    handleTransferCall,
    handleTransferCallInternal,
    handleSendPaymentDetails,
    handleQualifyLead,
    handleObjection,
    handleScheduleCallback,
    handleCreateBooking,
    handleCreateBookingInternal,
    handleTrackConversion,
    // HITL
    listPendingActions,
    approveAction,
    rejectAction,
    HITL_CONFIG
  };
}
