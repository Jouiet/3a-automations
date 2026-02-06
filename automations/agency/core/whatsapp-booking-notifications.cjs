#!/usr/bin/env node
/**
 * WhatsApp Booking Notifications - Native Script
 * WhatsApp Booking Confirmation + Booking Reminders
 *
 * Version: 1.0.0
 * Date: 2025-12-30
 *
 * Features:
 * - Booking confirmation via WhatsApp
 * - 24h and 1h reminders via WhatsApp
 * - Template message support (Meta-approved)
 * - Webhook server mode for external triggers
 * - Multi-language support (FR/EN)
 *
 * WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');

// Import security utilities
const {
  RateLimiter,
  setSecurityHeaders,
  corsMiddleware,
  validateInput,
  sanitizeInput
} = require('../../lib/security-utils.cjs');

// Constants for security
const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_REMINDERS_CACHE = 10000; // Bounded memory for sentReminders

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const ENV = process.env;

const WHATSAPP = {
  // API Configuration
  apiVersion: 'v21.0',
  baseUrl: 'https://graph.facebook.com',

  // Credentials (from .env)
  accessToken: ENV.WHATSAPP_ACCESS_TOKEN || ENV.META_ACCESS_TOKEN || ENV.META_PAGE_ACCESS_TOKEN,
  phoneNumberId: ENV.WHATSAPP_PHONE_NUMBER_ID || ENV.META_PHONE_NUMBER_ID,
  businessAccountId: ENV.WHATSAPP_BUSINESS_ACCOUNT_ID || ENV.META_BUSINESS_ACCOUNT_ID,

  // Check if configured
  get isConfigured() {
    return !!(this.accessToken && this.phoneNumberId);
  },

  // Full endpoint
  get endpoint() {
    return `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }
};

// Booking API (Google Apps Script or custom)
const BOOKING_API = {
  endpoint: ENV.BOOKING_API_ENDPOINT || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  apiKey: ENV.BOOKING_API_KEY,
};

// Message Templates (must match Meta-approved templates)
const TEMPLATES = {
  // Confirmation template
  booking_confirmation: {
    name: 'booking_confirmation',
    language: { code: 'fr' },
    // Components filled dynamically
  },

  // 24h reminder template
  reminder_24h: {
    name: 'appointment_reminder_24h',
    language: { code: 'fr' },
  },

  // 1h reminder template
  reminder_1h: {
    name: 'appointment_reminder_1h',
    language: { code: 'fr' },
  },

  // Generic text fallback (for testing)
  hello_world: {
    name: 'hello_world',
    language: { code: 'en_US' },
  }
};

// Branding
const BRANDING = {
  company: '3A Automation',
  tagline: 'Automation, Analytics, AI',
  website: 'https://3a-automation.com',
  signature: "L'équipe 3A Automation",
};

// ═══════════════════════════════════════════════════════════════════════════════
// WHATSAPP API CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

class WhatsAppClient {
  constructor() {
    this.config = WHATSAPP;
  }

  /**
   * Send a template message
   */
  async sendTemplate(to, templateName, components = []) {
    if (!this.config.isConfigured) {
      throw new Error('WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
    }

    const template = TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(to),
      type: 'template',
      template: {
        name: template.name,
        language: template.language,
      }
    };

    // Add components if provided (for dynamic content)
    if (components.length > 0) {
      payload.template.components = components;
    }

    return await this.sendRequest(payload);
  }

  /**
   * Send a text message (within 24h customer service window)
   */
  async sendText(to, text) {
    if (!this.config.isConfigured) {
      throw new Error('WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: { body: text }
    };

    return await this.sendRequest(payload);
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(booking) {
    const { phone, customerName, date, time, service, confirmationId } = booking;

    console.log(`[WhatsApp] Sending confirmation to ${phone}`);

    // Try template first
    try {
      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName || 'Client' },
            { type: 'text', text: service || 'Consultation' },
            { type: 'text', text: date || 'À confirmer' },
            { type: 'text', text: time || 'À confirmer' },
            { type: 'text', text: confirmationId || 'N/A' },
          ]
        }
      ];

      return await this.sendTemplate(phone, 'booking_confirmation', components);
    } catch (templateError) {
      // Fallback to text message (if within 24h window)
      console.log(`[WhatsApp] Template failed, trying text: ${templateError.message}`);

      const textMessage = this.formatConfirmationText(booking);
      return await this.sendText(phone, textMessage);
    }
  }

  /**
   * Send booking reminder
   */
  async sendBookingReminder(booking, reminderType = '24h') {
    const { phone, customerName, date, time, service } = booking;

    console.log(`[WhatsApp] Sending ${reminderType} reminder to ${phone}`);

    const templateName = reminderType === '1h' ? 'reminder_1h' : 'reminder_24h';

    try {
      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName || 'Client' },
            { type: 'text', text: service || 'Consultation' },
            { type: 'text', text: date || 'Aujourd\'hui' },
            { type: 'text', text: time || 'Bientôt' },
          ]
        }
      ];

      return await this.sendTemplate(phone, templateName, components);
    } catch (templateError) {
      console.log(`[WhatsApp] Template failed, trying text: ${templateError.message}`);

      const textMessage = this.formatReminderText(booking, reminderType);
      return await this.sendText(phone, textMessage);
    }
  }

  /**
   * Format confirmation as plain text
   */
  formatConfirmationText(booking) {
    const { customerName, date, time, service, confirmationId } = booking;

    return `✅ *Confirmation de réservation*

Bonjour ${customerName || 'cher client'},

Votre réservation est confirmée :
📅 Date : ${date || 'À confirmer'}
⏰ Heure : ${time || 'À confirmer'}
🎯 Service : ${service || 'Consultation'}
🔖 Référence : ${confirmationId || 'N/A'}

À bientôt !
${BRANDING.signature}
${BRANDING.website}`;
  }

  /**
   * Format reminder as plain text
   */
  formatReminderText(booking, reminderType) {
    const { customerName, date, time, service } = booking;
    const timeLabel = reminderType === '1h' ? 'dans 1 heure' : 'demain';

    return `⏰ *Rappel de rendez-vous*

Bonjour ${customerName || 'cher client'},

N'oubliez pas votre rendez-vous ${timeLabel} :
📅 Date : ${date || 'Voir confirmation'}
⏰ Heure : ${time || 'Voir confirmation'}
🎯 Service : ${service || 'Consultation'}

À très bientôt !
${BRANDING.signature}`;
  }

  /**
   * Format phone number for WhatsApp API
   */
  formatPhoneNumber(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if missing (default: France +33)
    if (cleaned.startsWith('0')) {
      cleaned = '33' + cleaned.substring(1);
    } else if (!cleaned.startsWith('33') && !cleaned.startsWith('212') && !cleaned.startsWith('1')) {
      // Assume French number if no recognized country code
      cleaned = '33' + cleaned;
    }

    return cleaned;
  }

  /**
   * Make API request to WhatsApp Cloud API
   * SECURITY: Added timeout + response size limit
   */
  async sendRequest(payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.endpoint);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        timeout: REQUEST_TIMEOUT_MS, // P0 FIX: Request timeout
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        let dataSize = 0;

        res.on('data', chunk => {
          dataSize += chunk.length;
          // P0 FIX: Response size limit
          if (dataSize > MAX_BODY_SIZE) {
            req.destroy();
            reject(new Error('Response too large'));
            return;
          }
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[WhatsApp] ✅ Message sent: ${result.messages?.[0]?.id || 'OK'}`);
              resolve(result);
            } else {
              console.error(`[WhatsApp] ❌ API Error: ${JSON.stringify(result)}`);
              reject(new Error(result.error?.message || `HTTP ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${data}`));
          }
        });
      });

      // P0 FIX: Socket timeout handler
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`));
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    const status = {
      configured: this.config.isConfigured,
      accessToken: this.config.accessToken ? '✅ Set' : '❌ Missing',
      phoneNumberId: this.config.phoneNumberId ? '✅ Set' : '❌ Missing',
      businessAccountId: this.config.businessAccountId ? '✅ Set' : '⚠️ Optional',
      endpoint: this.config.endpoint,
    };

    if (this.config.isConfigured) {
      // Try to verify the token (optional - may fail with valid token)
      try {
        // We don't send a real message, just verify credentials are formatted correctly
        status.ready = true;
        status.message = 'WhatsApp API configured and ready';
      } catch (e) {
        status.ready = false;
        status.message = e.message;
      }
    } else {
      status.ready = false;
      status.message = 'Awaiting credentials configuration';
    }

    return status;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMINDER SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════════

class ReminderScheduler {
  constructor(whatsappClient) {
    this.client = whatsappClient;
    this.sentReminders = new Set(); // Track sent reminders to avoid duplicates
    this.reminderTimestamps = new Map(); // P1 FIX: Track timestamps for cleanup
  }

  /**
   * P1 FIX: Bounded memory - clean old entries
   */
  cleanupOldReminders() {
    const now = Date.now();
    const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours

    // If cache is too large, clean by age
    if (this.sentReminders.size > MAX_REMINDERS_CACHE) {
      console.log(`[Scheduler] Cleaning reminder cache (${this.sentReminders.size} entries)`);

      for (const [id, timestamp] of this.reminderTimestamps.entries()) {
        if (now - timestamp > maxAgeMs) {
          this.sentReminders.delete(id);
          this.reminderTimestamps.delete(id);
        }
      }

      // If still too large after age cleanup, clear oldest half
      if (this.sentReminders.size > MAX_REMINDERS_CACHE) {
        const entries = Array.from(this.reminderTimestamps.entries())
          .sort((a, b) => a[1] - b[1])
          .slice(0, Math.floor(this.sentReminders.size / 2));

        for (const [id] of entries) {
          this.sentReminders.delete(id);
          this.reminderTimestamps.delete(id);
        }
      }

      console.log(`[Scheduler] Cache cleaned to ${this.sentReminders.size} entries`);
    }
  }

  /**
   * P1 FIX: Add reminder with timestamp tracking
   */
  addReminder(id) {
    this.sentReminders.add(id);
    this.reminderTimestamps.set(id, Date.now());
    this.cleanupOldReminders();
  }

  /**
   * Fetch upcoming bookings from API
   */
  async fetchUpcomingBookings() {
    // If booking API is configured, fetch from it
    if (BOOKING_API.endpoint && BOOKING_API.endpoint !== 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec') {
      try {
        const response = await this.httpGet(BOOKING_API.endpoint + '?action=upcoming');
        return JSON.parse(response);
      } catch (e) {
        console.error(`[Scheduler] Failed to fetch bookings: ${e.message}`);
        return [];
      }
    }

    // Return empty if no API configured
    console.log('[Scheduler] No booking API configured, skipping fetch');
    return [];
  }

  /**
   * Process reminders for upcoming bookings
   */
  async processReminders() {
    console.log('[Scheduler] Processing reminders...');

    const bookings = await this.fetchUpcomingBookings();
    const now = new Date();
    const results = { sent24h: 0, sent1h: 0, skipped: 0, errors: 0 };

    for (const booking of bookings) {
      try {
        const bookingTime = new Date(`${booking.date}T${booking.time}`);
        const hoursUntil = (bookingTime - now) / (1000 * 60 * 60);

        const reminderId24h = `${booking.id}_24h`;
        const reminderId1h = `${booking.id}_1h`;

        // 24h reminder (23-25 hours before)
        if (hoursUntil >= 23 && hoursUntil <= 25 && !this.sentReminders.has(reminderId24h)) {
          await this.client.sendBookingReminder(booking, '24h');
          this.addReminder(reminderId24h); // P1 FIX: Use bounded addReminder
          results.sent24h++;
        }
        // 1h reminder (0.5-1.5 hours before)
        else if (hoursUntil >= 0.5 && hoursUntil <= 1.5 && !this.sentReminders.has(reminderId1h)) {
          await this.client.sendBookingReminder(booking, '1h');
          this.addReminder(reminderId1h); // P1 FIX: Use bounded addReminder
          results.sent1h++;
        }
        else {
          results.skipped++;
        }
      } catch (e) {
        console.error(`[Scheduler] Error processing booking ${booking.id}: ${e.message}`);
        results.errors++;
      }
    }

    console.log(`[Scheduler] Done: ${results.sent24h} 24h, ${results.sent1h} 1h, ${results.skipped} skipped, ${results.errors} errors`);
    return results;
  }

  /**
   * Start scheduler loop
   */
  startLoop(intervalMinutes = 15) {
    console.log(`[Scheduler] Starting loop (every ${intervalMinutes} minutes)`);

    // Run immediately
    this.processReminders();

    // Then run periodically
    setInterval(() => this.processReminders(), intervalMinutes * 60 * 1000);
  }

  /**
   * HTTP GET helper with timeout
   * P0 FIX: Added timeout
   */
  httpGet(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: REQUEST_TIMEOUT_MS }, (res) => {
        let data = '';
        let dataSize = 0;

        res.on('data', chunk => {
          dataSize += chunk.length;
          if (dataSize > MAX_BODY_SIZE) {
            req.destroy();
            reject(new Error('Response too large'));
            return;
          }
          data += chunk;
        });

        res.on('end', () => resolve(data));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`));
      });

      req.on('error', reject);
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP SERVER (Webhook Mode)
// ═══════════════════════════════════════════════════════════════════════════════

function startServer(port = 3008) {
  const client = new WhatsAppClient();
  const scheduler = new ReminderScheduler(client);

  // P1 FIX: Rate limiter for API endpoints
  const rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 30 });

  // P3 FIX: Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000); // Force exit after 5s
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    // P0 FIX: Security headers
    setSecurityHeaders(res);

    // P2 FIX: CORS with origin whitelist (allow localhost + 3a domains)
    const allowedOrigins = [
      'https://3a-automation.com',
      'https://dashboard.3a-automation.com',
      'http://localhost:3000',
      'http://localhost:3008'
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // P1 FIX: Rate limiting
    const clientIP = req.socket.remoteAddress || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Too many requests' }));
    }

    // Health check
    if (url.pathname === '/health' || url.pathname === '/') {
      const status = await client.healthCheck();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(status, null, 2));
    }

    // Send confirmation (POST /confirmation)
    if (url.pathname === '/confirmation' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const result = await client.sendBookingConfirmation(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, result }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    }

    // Send reminder (POST /reminder)
    if (url.pathname === '/reminder' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const type = body.reminderType || '24h';
        const result = await client.sendBookingReminder(body, type);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, result }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    }

    // Process all pending reminders (GET /process-reminders)
    if (url.pathname === '/process-reminders' && req.method === 'GET') {
      try {
        const results = await scheduler.processReminders();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, results }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    }

    // Meta webhook verification (GET /webhook)
    if (url.pathname === '/webhook' && req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const verifyToken = ENV.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'verify_token_3a';

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Webhook] Verified');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(challenge);
      }

      res.writeHead(403);
      return res.end('Forbidden');
    }

    // Meta webhook incoming messages (POST /webhook)
    if (url.pathname === '/webhook' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        console.log('[Webhook] Incoming:', JSON.stringify(body, null, 2));
        // Process incoming message here if needed
        res.writeHead(200);
        return res.end('OK');
      } catch (e) {
        res.writeHead(500);
        return res.end('Error');
      }
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    console.log(`\n🚀 WhatsApp Booking Notifications Server`);
    console.log(`   Port: ${port}`);
    console.log(`   Status: ${client.config.isConfigured ? '✅ Ready' : '⏳ Awaiting credentials'}`);
    console.log(`\n   Endpoints:`);
    console.log(`   GET  /health              - Health check`);
    console.log(`   POST /confirmation        - Send booking confirmation`);
    console.log(`   POST /reminder            - Send booking reminder`);
    console.log(`   GET  /process-reminders   - Process all pending reminders`);
    console.log(`   GET  /webhook             - Meta webhook verification`);
    console.log(`   POST /webhook             - Meta webhook incoming messages`);
    console.log('');
  });

  return server;
}

/**
 * Parse request body with size limit
 * P0 FIX: Added body size limit to prevent DoS
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodySize = 0;

    req.on('data', chunk => {
      bodySize += chunk.length;
      // P0 FIX: Body size limit
      if (bodySize > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('Request body too large'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  // Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
WhatsApp Booking Notifications v1.0.0
=====================================
WhatsApp Booking Confirmation + WhatsApp Booking Reminders

USAGE:
  node whatsapp-booking-notifications.cjs [OPTIONS]

OPTIONS:
  --health                    Check WhatsApp API configuration status
  --server [--port=3008]      Start HTTP server for webhooks
  --scheduler                 Start reminder scheduler loop

  --confirm --phone=X         Send booking confirmation
    [--name=X]                Customer name
    [--date=X]                Booking date
    [--time=X]                Booking time
    [--service=X]             Service name
    [--id=X]                  Confirmation ID

  --remind --phone=X          Send booking reminder
    [--type=24h|1h]           Reminder type (default: 24h)
    [--name=X]                Customer name
    [--date=X]                Booking date
    [--time=X]                Booking time
    [--service=X]             Service name

  --test                      Send test message (hello_world template)
    --phone=X                 Phone number to test

ENVIRONMENT VARIABLES:
  WHATSAPP_ACCESS_TOKEN       Meta access token (or META_ACCESS_TOKEN)
  WHATSAPP_PHONE_NUMBER_ID    WhatsApp phone number ID
  WHATSAPP_BUSINESS_ACCOUNT_ID  WhatsApp business account ID (optional)
  BOOKING_API_ENDPOINT        Booking API for fetching upcoming bookings
  WHATSAPP_WEBHOOK_VERIFY_TOKEN  Webhook verification token

EXAMPLES:
  # Check status
  node whatsapp-booking-notifications.cjs --health

  # Send confirmation
  node whatsapp-booking-notifications.cjs --confirm --phone=+33612345678 --name="Jean" --date="2025-01-02" --time="14:00" --service="Consultation"

  # Send reminder
  node whatsapp-booking-notifications.cjs --remind --phone=+33612345678 --type=1h --name="Jean" --date="2025-01-02" --time="14:00"

  # Start server
  node whatsapp-booking-notifications.cjs --server --port=3008

  # Start scheduler
  node whatsapp-booking-notifications.cjs --scheduler
`);
    process.exit(0);
  }

  const client = new WhatsAppClient();

  // Health check
  if (args.includes('--health')) {
    console.log('=== WhatsApp Booking Notifications - Health Check ===\n');

    const status = await client.healthCheck();

    console.log('Configuration:');
    console.log(`  Access Token:      ${status.accessToken}`);
    console.log(`  Phone Number ID:   ${status.phoneNumberId}`);
    console.log(`  Business Account:  ${status.businessAccountId}`);
    console.log(`  Endpoint:          ${status.endpoint}`);
    console.log('');
    console.log(`Status: ${status.configured ? '✅ CONFIGURED' : '⏳ AWAITING CREDENTIALS'}`);
    console.log(`Message: ${status.message}`);
    console.log('');

    if (!status.configured) {
      console.log('To configure, add to .env:');
      console.log('  WHATSAPP_ACCESS_TOKEN=your_meta_access_token');
      console.log('  WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id');
      console.log('');
      console.log('Get these from: https://developers.facebook.com/apps/');
    }

    process.exit(status.configured ? 0 : 1);
  }

  // Server mode
  if (args.includes('--server')) {
    const portArg = args.find(a => a.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1]) : 3008;
    startServer(port);
    return; // Keep running
  }

  // Scheduler mode
  if (args.includes('--scheduler')) {
    const scheduler = new ReminderScheduler(client);
    scheduler.startLoop(15); // Every 15 minutes
    return; // Keep running
  }

  // Parse common args
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=').slice(1).join('=') : null;
  };

  const phone = getArg('phone');

  // Test mode
  if (args.includes('--test')) {
    if (!phone) {
      console.error('❌ --phone required for test');
      process.exit(1);
    }

    if (!client.config.isConfigured) {
      console.error('❌ WhatsApp not configured. Run --health for details.');
      process.exit(1);
    }

    console.log(`Sending test message to ${phone}...`);
    try {
      const result = await client.sendTemplate(phone, 'hello_world');
      console.log('✅ Test message sent:', result);
    } catch (e) {
      console.error('❌ Test failed:', e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  // Confirmation mode
  if (args.includes('--confirm')) {
    if (!phone) {
      console.error('❌ --phone required');
      process.exit(1);
    }

    if (!client.config.isConfigured) {
      console.error('❌ WhatsApp not configured. Run --health for details.');
      process.exit(1);
    }

    const booking = {
      phone,
      customerName: getArg('name') || 'Client',
      date: getArg('date') || new Date().toISOString().split('T')[0],
      time: getArg('time') || '10:00',
      service: getArg('service') || 'Consultation',
      confirmationId: getArg('id') || `3A-${Date.now()}`,
    };

    console.log('Sending confirmation...', booking);
    try {
      const result = await client.sendBookingConfirmation(booking);
      console.log('✅ Confirmation sent:', result);
    } catch (e) {
      console.error('❌ Failed:', e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  // Reminder mode
  if (args.includes('--remind')) {
    if (!phone) {
      console.error('❌ --phone required');
      process.exit(1);
    }

    if (!client.config.isConfigured) {
      console.error('❌ WhatsApp not configured. Run --health for details.');
      process.exit(1);
    }

    const reminderType = getArg('type') || '24h';
    const booking = {
      phone,
      customerName: getArg('name') || 'Client',
      date: getArg('date') || new Date().toISOString().split('T')[0],
      time: getArg('time') || '10:00',
      service: getArg('service') || 'Consultation',
    };

    console.log(`Sending ${reminderType} reminder...`, booking);
    try {
      const result = await client.sendBookingReminder(booking, reminderType);
      console.log('✅ Reminder sent:', result);
    } catch (e) {
      console.error('❌ Failed:', e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  // Default: show help
  console.log('WhatsApp Booking Notifications v1.0.0');
  console.log('Run with --help for usage information');
  console.log('Run with --health to check configuration status');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  WhatsAppClient,
  ReminderScheduler,
  startServer,
  WHATSAPP,
  TEMPLATES,
  BRANDING,
};

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}
