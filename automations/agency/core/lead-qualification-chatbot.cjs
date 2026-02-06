#!/usr/bin/env node
/**
 * Lead Qualification Chatbot - Conversational BANT Qualification
 * 3A Automation - Session 129
 *
 * Conversational AI chatbot for qualifying leads using BANT methodology:
 * - Budget: What's their budget range?
 * - Authority: Are they the decision maker?
 * - Need: What problems are they trying to solve?
 * - Timeline: When do they want to implement?
 *
 * Fallback chain: Grok 4.1 → OpenAI GPT-5.2 → Gemini 3 → Claude Opus 4.6 → Rule-based
 *
 * Benchmark: +138% qualified leads, +70% conversion (vs static forms)
 *
 * Usage:
 *   node lead-qualification-chatbot.cjs --health
 *   node lead-qualification-chatbot.cjs --test="Je cherche une solution e-commerce"
 *   node lead-qualification-chatbot.cjs --qualify --session=abc123
 *   node lead-qualification-chatbot.cjs --server --port=3011
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Import security utilities
const {
  RateLimiter,
  setSecurityHeaders
} = require('../../lib/security-utils.cjs');

// Security constants
const MAX_BODY_SIZE = 512 * 1024; // 512KB limit
const CORS_WHITELIST = [
  'https://3a-automation.com',
  'https://www.3a-automation.com',
  'https://dashboard.3a-automation.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../../../.env');
    const env = fs.readFileSync(envPath, 'utf8');
    const vars = {};
    env.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) vars[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
    });
    return vars;
  } catch (e) {
    return process.env;
  }
}

const ENV = loadEnv();
const VERSION = '1.1.0';

// ============================================================================
// HITL CONFIGURATION (Human In The Loop) - Session 165quater flexibility
// ============================================================================
// User configurable thresholds via ENV variables:
//   HITL_HOT_LEAD_THRESHOLD: 60 | 70 | 80 | 90 | custom (default: 70)
//
// Lower threshold = more leads require approval (safer but slower)
// Higher threshold = fewer leads require approval (faster but riskier)
//
// Recommended:
//   60 = Conservative (review most promising leads)
//   70 = Balanced (default - review hot leads only)
//   80 = Aggressive (minimal review)
//   90 = Very aggressive (almost no review)

const HITL_CONFIG = {
  enabled: ENV.HITL_CHATBOT_ENABLED !== 'false',
  hotLeadThreshold: parseInt(ENV.HITL_HOT_LEAD_THRESHOLD) || 70,  // 60 | 70 | 80 | 90 ou valeur custom
  hotLeadThresholdOptions: [60, 70, 80, 90],  // Recommended options for UI
  slackWebhook: ENV.HITL_SLACK_WEBHOOK || ENV.SLACK_WEBHOOK_URL,
  notifyOnPending: ENV.HITL_NOTIFY_ON_PENDING !== 'false'
};

const DATA_DIR = ENV.CHATBOT_DATA_DIR || path.join(__dirname, '../../../data/chatbot');
const HITL_PENDING_DIR = path.join(DATA_DIR, 'hitl-pending');
const HITL_PENDING_FILE = path.join(HITL_PENDING_DIR, 'pending-leads.json');

// Ensure directories exist
function ensureHitlDir() {
  if (!fs.existsSync(HITL_PENDING_DIR)) {
    fs.mkdirSync(HITL_PENDING_DIR, { recursive: true });
  }
}
ensureHitlDir();

// HITL Functions
function loadPendingLeads() {
  try {
    if (fs.existsSync(HITL_PENDING_FILE)) {
      return JSON.parse(fs.readFileSync(HITL_PENDING_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn(`⚠️ Could not load HITL pending leads: ${error.message}`);
  }
  return [];
}

function savePendingLeads(leads) {
  try {
    const tempPath = `${HITL_PENDING_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(leads, null, 2));
    fs.renameSync(tempPath, HITL_PENDING_FILE);
  } catch (error) {
    console.error(`❌ Failed to save HITL pending leads: ${error.message}`);
  }
}

function queueLeadForApproval(session, reason) {
  const pending = loadPendingLeads();
  const pendingLead = {
    id: `hitl_lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId: session.sessionId,
    contact: session.contact,
    score: session.totalScore,
    status: getLeadStatus(session.totalScore),
    bant: session.bant,
    reason,
    queuedAt: new Date().toISOString(),
    approvalStatus: 'pending'
  };

  pending.push(pendingLead);
  savePendingLeads(pending);

  console.log(`🔒 Hot lead (${session.contact.email || 'N/A'}) queued for HITL approval`);

  // Slack notification
  if (HITL_CONFIG.slackWebhook && HITL_CONFIG.notifyOnPending) {
    sendHitlLeadNotification(pendingLead).catch(e => console.error(`❌ Slack notification failed: ${e.message}`));
  }

  return pendingLead;
}

async function sendHitlLeadNotification(pendingLead) {
  if (!HITL_CONFIG.slackWebhook) return;

  const message = {
    text: `🔒 HITL Approval Required - Hot Lead`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔥 HITL: Hot Lead Pending Review', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Email:* ${pendingLead.contact.email || 'N/A'}` },
          { type: 'mrkdwn', text: `*Score:* ${pendingLead.score}/100` },
          { type: 'mrkdwn', text: `*Status:* ${pendingLead.status.toUpperCase()}` },
          { type: 'mrkdwn', text: `*Budget:* ${pendingLead.bant.budget.data || 'N/A'}` }
        ]
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`node lead-qualification-chatbot.cjs --approve=${pendingLead.id}\`\`\`` }
      }
    ]
  };

  const response = await fetch(HITL_CONFIG.slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}

async function approveLead(hitlId) {
  const pending = loadPendingLeads();
  const index = pending.findIndex(l => l.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL lead ${hitlId} not found`);
    return { success: false, error: 'Lead not found' };
  }

  const lead = pending[index];
  lead.approvalStatus = 'approved';
  lead.approvedAt = new Date().toISOString();

  // Get session if still exists
  const session = sessions.get(lead.sessionId);

  pending.splice(index, 1);
  savePendingLeads(pending);

  console.log(`✅ HITL lead (${lead.contact.email || 'N/A'}) approved, syncing to Klaviyo...`);

  // Sync to Klaviyo
  if (session) {
    const result = await syncToKlaviyoInternal(session);
    return { success: true, lead, result };
  } else {
    // Session expired, create minimal session for sync
    const minimalSession = {
      sessionId: lead.sessionId,
      contact: lead.contact,
      totalScore: lead.score,
      bant: lead.bant
    };
    const result = await syncToKlaviyoInternal(minimalSession);
    return { success: true, lead, result };
  }
}

function rejectLead(hitlId, reason = 'Rejected by operator') {
  const pending = loadPendingLeads();
  const index = pending.findIndex(l => l.id === hitlId);

  if (index === -1) {
    console.log(`❌ HITL lead ${hitlId} not found`);
    return { success: false, error: 'Lead not found' };
  }

  const lead = pending[index];
  lead.approvalStatus = 'rejected';
  lead.rejectedAt = new Date().toISOString();
  lead.rejectionReason = reason;

  pending.splice(index, 1);
  savePendingLeads(pending);

  console.log(`❌ HITL lead (${lead.contact.email || 'N/A'}) rejected: ${reason}`);

  return { success: true, lead };
}

function listPendingLeads() {
  const pending = loadPendingLeads();
  console.log(`\n🔒 Pending HITL Leads (${pending.length}):\n`);

  if (pending.length === 0) {
    console.log('  No pending leads');
    return pending;
  }

  pending.forEach(l => {
    console.log(`  • ${l.id}`);
    console.log(`    Email: ${l.contact.email || 'N/A'} | Score: ${l.score}/100`);
    console.log(`    Status: ${l.status.toUpperCase()}`);
    console.log(`    Budget: ${l.bant.budget.data || 'N/A'}`);
    console.log(`    Queued: ${l.queuedAt}`);
    console.log();
  });

  return pending;
}

// AI PROVIDERS - Frontier Models (Jan 2026)
const PROVIDERS = {
  grok: {
    name: 'Grok 4.1 Fast Reasoning',
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-4-1-fast-reasoning',
    apiKey: ENV.XAI_API_KEY,
    enabled: !!ENV.XAI_API_KEY,
  },
  openai: {
    name: 'OpenAI GPT-5.2',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-5.2',
    apiKey: ENV.OPENAI_API_KEY,
    enabled: !!ENV.OPENAI_API_KEY,
  },
  gemini: {
    name: 'Gemini 3 Flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    apiKey: ENV.GEMINI_API_KEY,
    enabled: !!ENV.GEMINI_API_KEY,
  },
  anthropic: {
    name: 'Claude Opus 4.6',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-opus-4-6',
    apiKey: ENV.ANTHROPIC_API_KEY,
    enabled: !!ENV.ANTHROPIC_API_KEY,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BANT QUALIFICATION CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const BANT = {
  // Questions to ask (in order of priority)
  questions: {
    need: {
      priority: 1,
      examples: [
        "Quel est votre principal défi en ce moment ?",
        "Qu'est-ce qui vous amène aujourd'hui ?",
        "Quel problème cherchez-vous à résoudre ?"
      ],
      keywords: {
        high: ['urgent', 'critique', 'perte', 'problème majeur', 'bloqué'],
        medium: ['améliorer', 'optimiser', 'croissance', 'automatiser'],
        low: ['explorer', 'curieux', 'information', 'apprendre']
      },
      weight: 30
    },
    budget: {
      priority: 2,
      examples: [
        "Avez-vous un budget défini pour ce projet ?",
        "Dans quelle fourchette de budget vous situez-vous ?",
        "Quel investissement envisagez-vous ?"
      ],
      tiers: {
        high: { min: 1000, score: 30, label: 'Growth+' },
        medium: { min: 500, score: 20, label: 'Essentials' },
        low: { min: 300, score: 10, label: 'Quick Win' },
        minimal: { min: 0, score: 5, label: 'Nurture' }
      },
      weight: 30
    },
    authority: {
      priority: 3,
      examples: [
        "Êtes-vous la personne qui prend la décision finale ?",
        "Qui d'autre est impliqué dans cette décision ?",
        "Comment se passe le processus de décision chez vous ?"
      ],
      patterns: {
        yes: ['je décide', "c'est moi", 'mon entreprise', 'fondateur', 'ceo', 'directeur', 'gérant'],
        partial: ['équipe', 'nous décidons', 'avec mon associé', 'valider'],
        no: ['mon chef', 'supérieur', 'je transmets', 'demander permission']
      },
      weight: 20
    },
    timeline: {
      priority: 4,
      examples: [
        "Quand souhaitez-vous démarrer ce projet ?",
        "Y a-t-il une deadline particulière ?",
        "Quelle est votre urgence ?"
      ],
      tiers: {
        immediate: { keywords: ['urgent', 'asap', 'maintenant', 'cette semaine'], score: 20, days: 7 },
        short: { keywords: ['ce mois', 'bientôt', '2 semaines'], score: 15, days: 30 },
        medium: { keywords: ['prochain mois', 'trimestre', '1-3 mois'], score: 10, days: 90 },
        long: { keywords: ['plus tard', 'explorer', 'pas pressé'], score: 5, days: 180 }
      },
      weight: 20
    }
  },

  // Lead status thresholds
  thresholds: {
    hot: 75,    // Score >= 75: Immediate follow-up, book meeting
    warm: 50,   // Score 50-74: Schedule call within 48h
    cool: 25,   // Score 25-49: Add to nurture sequence
    cold: 0     // Score < 25: Long-term nurture, educational content
  },

  // Follow-up actions
  actions: {
    hot: {
      action: 'book_meeting',
      message: "Excellent ! Je vous propose de réserver un créneau pour un appel de 15 minutes afin de discuter de votre projet en détail.",
      cta: "Réserver maintenant"
    },
    warm: {
      action: 'schedule_call',
      message: "Merci pour ces informations ! Un de nos consultants va vous contacter dans les 48h pour approfondir votre besoin.",
      cta: "Recevoir un appel"
    },
    cool: {
      action: 'nurture_sequence',
      message: "Je vous envoie quelques ressources qui pourraient vous aider. Restez en contact !",
      cta: "Recevoir les ressources"
    },
    cold: {
      action: 'educational_content',
      message: "Je vous recommande de consulter notre guide gratuit sur l'automatisation. N'hésitez pas à revenir quand vous serez prêt.",
      cta: "Télécharger le guide"
    }
  },

  // Industry fit multipliers
  industryFit: {
    perfect: { keywords: ['e-commerce', 'shopify', 'boutique en ligne', 'klaviyo'], multiplier: 1.2 },
    good: { keywords: ['pme', 'b2b', 'saas', 'startup', 'agence'], multiplier: 1.1 },
    moderate: { keywords: ['entreprise', 'société', 'business'], multiplier: 1.0 },
    poor: { keywords: ['particulier', 'personnel', 'hobby'], multiplier: 0.7 }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// In-memory session store (use Redis in production)
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_SESSIONS = 1000;

function generateSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getOrCreateSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    // Create new session
    sessionId = sessionId || generateSessionId();
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messages: [],
      bant: {
        need: { score: 0, answered: false, data: null },
        budget: { score: 0, answered: false, data: null },
        authority: { score: 0, answered: false, data: null },
        timeline: { score: 0, answered: false, data: null }
      },
      totalScore: 0,
      status: 'in_progress',
      contact: {},
      industryMultiplier: 1.0
    });
  }

  const session = sessions.get(sessionId);
  session.lastActivity = new Date().toISOString();

  // Cleanup old sessions
  cleanupSessions();

  return session;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - new Date(session.lastActivity).getTime() > SESSION_TTL) {
      sessions.delete(id);
    }
  }
  // Also enforce max sessions
  if (sessions.size > MAX_SESSIONS) {
    const sorted = [...sessions.entries()].sort((a, b) =>
      new Date(a[1].lastActivity) - new Date(b[1].lastActivity)
    );
    for (let i = 0; i < sessions.size - MAX_SESSIONS; i++) {
      sessions.delete(sorted[i][0]);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 30000);

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });
    if (body) req.write(body);
    req.end();
  });
}

async function callGrok(messages, systemPrompt) {
  const provider = PROVIDERS.grok;
  if (!provider.enabled) throw new Error('Grok not configured');

  const url = new URL(provider.url);
  const response = await httpsRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    model: provider.model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 500,
    temperature: 0.7
  }));

  if (response.status !== 200) throw new Error(`Grok error: ${response.status}`);
  return response.data.choices?.[0]?.message?.content || '';
}

async function callOpenAI(messages, systemPrompt) {
  const provider = PROVIDERS.openai;
  if (!provider.enabled) throw new Error('OpenAI not configured');

  const url = new URL(provider.url);
  const response = await httpsRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    model: provider.model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 500,
    temperature: 0.7
  }));

  if (response.status !== 200) throw new Error(`OpenAI error: ${response.status}`);
  return response.data.choices?.[0]?.message?.content || '';
}

async function callGemini(messages, systemPrompt) {
  const provider = PROVIDERS.gemini;
  if (!provider.enabled) throw new Error('Gemini not configured');

  const url = `${provider.url}?key=${provider.apiKey}`;
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await httpsRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
  }));

  if (response.status !== 200) throw new Error(`Gemini error: ${response.status}`);
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callClaude(messages, systemPrompt) {
  const provider = PROVIDERS.anthropic;
  if (!provider.enabled) throw new Error('Claude not configured');

  const url = new URL(provider.url);
  const response = await httpsRequest(url, {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    model: provider.model,
    system: systemPrompt,
    messages,
    max_tokens: 500
  }));

  if (response.status !== 200) throw new Error(`Claude error: ${response.status}`);
  return response.data.content?.[0]?.text || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// QUALIFICATION LOGIC
// ─────────────────────────────────────────────────────────────────────────────

function analyzeMessage(message, session) {
  const text = message.toLowerCase();
  let updates = {};

  // Detect industry fit
  for (const [level, config] of Object.entries(BANT.industryFit)) {
    if (config.keywords.some(kw => text.includes(kw))) {
      session.industryMultiplier = Math.max(session.industryMultiplier, config.multiplier);
      break;
    }
  }

  // Analyze NEED
  if (!session.bant.need.answered) {
    for (const [level, keywords] of Object.entries(BANT.questions.need.keywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        session.bant.need.score = level === 'high' ? 30 : level === 'medium' ? 20 : 10;
        session.bant.need.answered = true;
        session.bant.need.data = { level, detected: text };
        updates.need = level;
        break;
      }
    }
  }

  // Analyze BUDGET
  if (!session.bant.budget.answered) {
    // Look for explicit numbers
    const budgetMatch = text.match(/(\d+)\s*(€|euros?|eur|k)/i);
    if (budgetMatch) {
      let amount = parseInt(budgetMatch[1]);
      if (budgetMatch[2].toLowerCase() === 'k') amount *= 1000;

      for (const [tier, config] of Object.entries(BANT.questions.budget.tiers)) {
        if (amount >= config.min) {
          session.bant.budget.score = config.score;
          session.bant.budget.answered = true;
          session.bant.budget.data = { amount, tier, label: config.label };
          updates.budget = tier;
          break;
        }
      }
    }
  }

  // Analyze AUTHORITY
  if (!session.bant.authority.answered) {
    for (const [level, patterns] of Object.entries(BANT.questions.authority.patterns)) {
      if (patterns.some(p => text.includes(p))) {
        session.bant.authority.score = level === 'yes' ? 20 : level === 'partial' ? 12 : 5;
        session.bant.authority.answered = true;
        session.bant.authority.data = { level };
        updates.authority = level;
        break;
      }
    }
  }

  // Analyze TIMELINE
  if (!session.bant.timeline.answered) {
    for (const [tier, config] of Object.entries(BANT.questions.timeline.tiers)) {
      if (config.keywords.some(kw => text.includes(kw))) {
        session.bant.timeline.score = config.score;
        session.bant.timeline.answered = true;
        session.bant.timeline.data = { tier, days: config.days };
        updates.timeline = tier;
        break;
      }
    }
  }

  // Extract contact info
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) session.contact.email = emailMatch[0];

  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?\d{6,})/);
  if (phoneMatch) session.contact.phone = phoneMatch[0];

  // Calculate total score
  const rawScore = session.bant.need.score +
                   session.bant.budget.score +
                   session.bant.authority.score +
                   session.bant.timeline.score;
  session.totalScore = Math.round(rawScore * session.industryMultiplier);

  return updates;
}

function getNextQuestion(session) {
  // Find unanswered BANT components in priority order
  const unanswered = Object.entries(BANT.questions)
    .filter(([key]) => !session.bant[key].answered)
    .sort((a, b) => a[1].priority - b[1].priority);

  if (unanswered.length === 0) return null;

  const [key, config] = unanswered[0];
  return {
    component: key,
    question: config.examples[Math.floor(Math.random() * config.examples.length)]
  };
}

function getLeadStatus(score) {
  if (score >= BANT.thresholds.hot) return 'hot';
  if (score >= BANT.thresholds.warm) return 'warm';
  if (score >= BANT.thresholds.cool) return 'cool';
  return 'cold';
}

function buildSystemPrompt(session) {
  const status = getLeadStatus(session.totalScore);
  const nextQ = getNextQuestion(session);

  return `Tu es l'assistant IA de 3A Automation, une agence spécialisée en automatisation pour e-commerce et PME B2B.

CONTEXTE DE LA CONVERSATION:
- Score actuel: ${session.totalScore}/100
- Statut: ${status.toUpperCase()}
- BANT: Besoin=${session.bant.need.answered ? '✓' : '?'}, Budget=${session.bant.budget.answered ? '✓' : '?'}, Autorité=${session.bant.authority.answered ? '✓' : '?'}, Timeline=${session.bant.timeline.answered ? '✓' : '?'}

OBJECTIF:
${nextQ ? `Obtenir l'information sur: ${nextQ.component.toUpperCase()}
Question suggérée: "${nextQ.question}"` : `Qualification complète ! Proposer l'action: ${BANT.actions[status].message}`}

RÈGLES:
1. Sois conversationnel et naturel, pas robotique
2. Pose UNE question à la fois
3. Reformule naturellement la question suggérée
4. Si le prospect donne des infos sur plusieurs aspects BANT, les noter
5. Ne mentionne JAMAIS le score ou le système de qualification
6. Pour les hot leads, propose de réserver un appel
7. Réponds en français sauf si le prospect parle anglais`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function chat(userMessage, sessionId = null) {
  const session = getOrCreateSession(sessionId);
  const fallbackOrder = ['grok', 'openai', 'gemini', 'anthropic'];
  let errors = [];
  let providerUsed = null;

  // Add user message to history
  session.messages.push({ role: 'user', content: userMessage });

  // Analyze message for BANT signals
  const updates = analyzeMessage(userMessage, session);

  // Build system prompt with context
  const systemPrompt = buildSystemPrompt(session);

  // Try each provider in order
  for (const providerName of fallbackOrder) {
    const provider = PROVIDERS[providerName];
    if (!provider.enabled) continue;

    try {
      let response;
      switch (providerName) {
        case 'grok':
          response = await callGrok(session.messages, systemPrompt);
          break;
        case 'openai':
          response = await callOpenAI(session.messages, systemPrompt);
          break;
        case 'gemini':
          response = await callGemini(session.messages, systemPrompt);
          break;
        case 'anthropic':
          response = await callClaude(session.messages, systemPrompt);
          break;
      }

      if (response) {
        session.messages.push({ role: 'assistant', content: response });
        providerUsed = providerName;

        // Check if qualification is complete
        const allAnswered = Object.values(session.bant).every(b => b.answered);
        if (allAnswered) {
          session.status = 'qualified';
        }

        return {
          success: true,
          sessionId: session.id,
          response,
          provider: provider.name,
          qualification: {
            score: session.totalScore,
            status: getLeadStatus(session.totalScore),
            bant: session.bant,
            complete: session.status === 'qualified',
            action: session.status === 'qualified' ? BANT.actions[getLeadStatus(session.totalScore)] : null
          },
          contact: session.contact
        };
      }
    } catch (err) {
      errors.push({ provider: providerName, error: err.message });
    }
  }

  // All providers failed - use rule-based response
  const status = getLeadStatus(session.totalScore);
  const nextQ = getNextQuestion(session);
  const fallbackResponse = nextQ
    ? nextQ.question
    : BANT.actions[status].message;

  session.messages.push({ role: 'assistant', content: fallbackResponse });

  return {
    success: true,
    sessionId: session.id,
    response: fallbackResponse,
    provider: 'rule-based',
    qualification: {
      score: session.totalScore,
      status,
      bant: session.bant,
      complete: session.status === 'qualified'
    },
    contact: session.contact,
    errors
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KLAVIYO INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

async function syncToKlaviyo(session) {
  if (!ENV.KLAVIYO_API_KEY) {
    return { success: false, error: 'Klaviyo not configured' };
  }

  if (!session.contact.email) {
    return { success: false, error: 'No email in session' };
  }

  // HITL Check: Hot leads require approval before CRM sync
  if (HITL_CONFIG.enabled && session.totalScore >= HITL_CONFIG.hotLeadThreshold) {
    const pendingLead = queueLeadForApproval(session, `Lead score ${session.totalScore} >= ${HITL_CONFIG.hotLeadThreshold} threshold`);
    return {
      status: 'pending_approval',
      hitlId: pendingLead.id,
      score: session.totalScore,
      email: session.contact.email,
      message: `Hot lead queued for HITL approval. Use --approve=${pendingLead.id} to sync.`
    };
  }

  return syncToKlaviyoInternal(session);
}

/**
 * Internal Klaviyo sync (bypasses HITL check)
 */
async function syncToKlaviyoInternal(session) {
  if (!ENV.KLAVIYO_API_KEY) {
    return { success: false, error: 'Klaviyo not configured' };
  }

  const status = getLeadStatus(session.totalScore);
  const listMap = {
    hot: ENV.KLAVIYO_HOT_LEADS_LIST || null,
    warm: ENV.KLAVIYO_WARM_LEADS_LIST || null,
    cool: ENV.KLAVIYO_NURTURE_LIST || null,
    cold: ENV.KLAVIYO_NEWSLETTER_LIST || null
  };

  try {
    // Create/update profile
    const profileResponse = await httpsRequest('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${ENV.KLAVIYO_API_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-02-15'
      }
    }, JSON.stringify({
      data: {
        type: 'profile',
        attributes: {
          email: session.contact.email,
          phone_number: session.contact.phone || null,
          properties: {
            lead_score: session.totalScore,
            lead_status: status,
            qualification_date: new Date().toISOString(),
            bant_need: session.bant.need.data,
            bant_budget: session.bant.budget.data,
            bant_authority: session.bant.authority.data,
            bant_timeline: session.bant.timeline.data,
            source: 'chatbot_qualification'
          }
        }
      }
    }));

    // Add to appropriate list if configured
    const listId = listMap[status];
    if (listId && profileResponse.data?.data?.id) {
      await httpsRequest(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${ENV.KLAVIYO_API_KEY}`,
          'Content-Type': 'application/json',
          'revision': '2024-02-15'
        }
      }, JSON.stringify({
        data: [{ type: 'profile', id: profileResponse.data.data.id }]
      }));
    }

    return { success: true, profileId: profileResponse.data?.data?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute

function startServer(port = 3011) {
  const server = http.createServer(async (req, res) => {
    setSecurityHeaders(res);

    // CORS
    const origin = req.headers.origin;
    if (CORS_WHITELIST.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const clientIp = req.socket.remoteAddress;
    if (!rateLimiter.isAllowed(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(healthCheck()));
    }

    if (req.method === 'POST' && req.url === '/chat') {
      let body = '';
      let bodySize = 0;

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const { message, sessionId } = JSON.parse(body);
          if (!message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Message required' }));
          }

          const result = await chat(message, sessionId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      return;
    }

    if (req.method === 'POST' && req.url === '/qualify') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { sessionId } = JSON.parse(body);
          if (!sessionId || !sessions.has(sessionId)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Session not found' }));
          }

          const session = sessions.get(sessionId);
          const status = getLeadStatus(session.totalScore);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            sessionId,
            qualification: {
              score: session.totalScore,
              status,
              bant: session.bant,
              action: BANT.actions[status]
            },
            contact: session.contact,
            messageCount: session.messages.length
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      return;
    }

    if (req.method === 'POST' && req.url === '/sync') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { sessionId } = JSON.parse(body);
          if (!sessionId || !sessions.has(sessionId)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Session not found' }));
          }

          const session = sessions.get(sessionId);
          const result = await syncToKlaviyo(session);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    console.log(`🤖 Lead Qualification Chatbot v${VERSION} running on port ${port}`);
    console.log(`📊 Endpoints: POST /chat, GET /health, POST /qualify, POST /sync`);
  });

  return server;
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

function healthCheck() {
  const enabledProviders = Object.entries(PROVIDERS)
    .filter(([_, p]) => p.enabled)
    .map(([name, p]) => `${p.name}`);

  return {
    timestamp: new Date().toISOString(),
    version: VERSION,
    status: enabledProviders.length > 0 ? 'OPERATIONAL' : 'DEGRADED',
    ai: {
      'Grok 4.1': PROVIDERS.grok.enabled ? '✅ Configured' : '⚠️ Not configured',
      'OpenAI GPT-5.2': PROVIDERS.openai.enabled ? '✅ Configured' : '⚠️ Not configured',
      'Gemini 3': PROVIDERS.gemini.enabled ? '✅ Configured' : '⚠️ Not configured',
      'Claude Opus 4.6': PROVIDERS.anthropic.enabled ? '✅ Configured' : '⚠️ Not configured',
    },
    crm: {
      'Klaviyo': ENV.KLAVIYO_API_KEY ? '✅ Configured' : '⚠️ Not configured'
    },
    bant: {
      components: ['need', 'budget', 'authority', 'timeline'],
      thresholds: BANT.thresholds
    },
    activeSessions: sessions.size,
    benchmark: {
      qualifiedLeadsIncrease: '+138%',
      conversionIncrease: '+70%',
      source: 'vs static forms'
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // HITL Commands
  if (args.includes('--list-pending')) {
    return listPendingLeads();
  }

  const approveArg = args.find(a => a.startsWith('--approve='));
  if (approveArg) {
    const hitlId = approveArg.split('=')[1];
    const result = await approveLead(hitlId);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const rejectArg = args.find(a => a.startsWith('--reject='));
  if (rejectArg) {
    const hitlId = rejectArg.split('=')[1];
    const reasonArg = args.find(a => a.startsWith('--reason='));
    const reason = reasonArg ? reasonArg.split('=')[1] : 'Rejected by operator';
    const result = rejectLead(hitlId, reason);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.includes('--health')) {
    console.log('\n📊 Lead Qualification Chatbot - Health Check\n');
    console.log(JSON.stringify(healthCheck(), null, 2));
    return;
  }

  if (args.includes('--server')) {
    const portArg = args.find(a => a.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1]) : 3011;
    startServer(port);
    return;
  }

  const testArg = args.find(a => a.startsWith('--test='));
  if (testArg) {
    const message = testArg.split('=').slice(1).join('=');
    console.log('\n🧪 Testing Lead Qualification Chatbot\n');
    console.log(`User: ${message}\n`);

    const result = await chat(message);
    console.log(`Assistant (${result.provider}): ${result.response}\n`);
    console.log('Qualification:', JSON.stringify(result.qualification, null, 2));

    if (result.errors?.length) {
      console.log('\nFallback errors:', result.errors);
    }
    return;
  }

  // Interactive mode
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🤖 Lead Qualification Chatbot v' + VERSION);
  console.log('Type your message or "quit" to exit\n');

  let currentSession = null;

  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'quit') {
        if (currentSession) {
          const session = sessions.get(currentSession);
          console.log('\n📊 Final Qualification:');
          console.log(JSON.stringify({
            score: session.totalScore,
            status: getLeadStatus(session.totalScore),
            bant: session.bant
          }, null, 2));
        }
        rl.close();
        return;
      }

      const result = await chat(input, currentSession);
      currentSession = result.sessionId;

      console.log(`\nAssistant: ${result.response}`);
      console.log(`(Score: ${result.qualification.score}, Status: ${result.qualification.status})\n`);

      ask();
    });
  };

  ask();
}

main().catch(console.error);
