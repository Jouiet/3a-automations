#!/usr/bin/env node
/**
 * UNIFIED EMAIL AUTOMATION - 3A Automation
 *
 * Combines Email Outreach + Welcome Series via Klaviyo HTTP API
 * Works standalone (no n8n $env limitations)
 *
 * MODES:
 * 1. CLI: node email-automation-unified.cjs --mode=welcome --email=test@example.com
 * 2. HTTP Server: node email-automation-unified.cjs --server --port=3001
 * 3. Single lead JSON: node email-automation-unified.cjs --json='{"email":"..."}'
 *
 * DOUBLE USAGE:
 * - 3A-Automation: Direct integration
 * - Agency Clients: Configure via client .env file
 *
 * Created: 2025-12-28 | Session 109
 * Based on: sync-google-forms-to-klaviyo.cjs (528 lines, TESTED OK)
 * Version: 1.0.0
 */

const path = require('path');
const http = require('http');

// Load environment - support client-specific .env
const envPath = process.env.CLIENT_ENV_PATH || path.join(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });

// Import B2B email templates (shared module for PME/B2B alignment)
const {
  EMAIL_TEMPLATES,
  WELCOME_TEMPLATES,
  detectSegment,
  personalizeEmail,
  getSegmentDisplayName,
  generateOutreachSeries,
} = require('./templates/b2b-email-templates.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Klaviyo
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY,
  KLAVIYO_LIST_ID: process.env.KLAVIYO_LIST_ID,
  KLAVIYO_WELCOME_LIST_ID: process.env.KLAVIYO_WELCOME_LIST_ID || process.env.KLAVIYO_LIST_ID,

  // Dashboard logging (Google Apps Script)
  DASHBOARD_API_URL: process.env.DASHBOARD_API_URL ||
    'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec',

  // Server
  PORT: parseInt(process.env.EMAIL_AUTOMATION_PORT || '3001'),

  // Rate limiting
  RATE_LIMIT_DELAY: 500,

  // Brand
  BRAND_NAME: process.env.BRAND_NAME || '3A Automation',
  BRAND_URL: process.env.BRAND_URL || 'https://3a-automation.com',
  CONSULTANT_NAME: process.env.CONSULTANT_NAME || 'Jouiet',
};

// ============================================================================
// KLAVIYO API FUNCTIONS
// ============================================================================

/**
 * Make Klaviyo API request
 */
async function klaviyoRequest(endpoint, method = 'GET', body = null) {
  const url = `https://a.klaviyo.com/api/${endpoint}`;

  const options = {
    method,
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
      'Accept': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();

    // Handle duplicate profile (409)
    if (response.status === 409) {
      const errorData = JSON.parse(errorText);
      return {
        duplicate: true,
        existingId: errorData.errors?.[0]?.meta?.duplicate_profile_id
      };
    }

    throw new Error(`Klaviyo API ${response.status}: ${errorText}`);
  }

  // Handle 204 No Content or empty body
  if (response.status === 204) {
    return { success: true };
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return { success: true };
  }

  return JSON.parse(text);
}

/**
 * Create or update Klaviyo profile
 */
async function upsertProfile(lead) {
  const profileData = {
    data: {
      type: 'profile',
      attributes: {
        email: lead.email,
        first_name: lead.firstName || lead.first_name || lead.name?.split(' ')[0] || '',
        last_name: lead.lastName || lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
        phone_number: lead.phone || null,
        organization: lead.company || null,
        title: lead.jobTitle || lead.title || null,
        properties: {
          source: lead.source || 'website',
          automation_type: lead.automationType || 'general',
          sequence_started: new Date().toISOString(),
        }
      }
    }
  };

  // Clean null values
  const props = profileData.data.attributes.properties;
  Object.keys(props).forEach(k => props[k] === null && delete props[k]);

  const result = await klaviyoRequest('profiles/', 'POST', profileData);

  if (result.duplicate && result.existingId) {
    console.log(`  ℹ️  Profile exists, updating: ${lead.email}`);
    return { id: result.existingId, updated: true };
  }

  return result.data;
}

/**
 * Add profile to Klaviyo list
 */
async function addToList(profileId, listId) {
  if (!listId) return false;

  await klaviyoRequest(`lists/${listId}/relationships/profiles/`, 'POST', {
    data: [{ type: 'profile', id: profileId }]
  });

  return true;
}

/**
 * Create Klaviyo event (triggers flows)
 */
async function createEvent(email, eventName, properties = {}) {
  const eventData = {
    data: {
      type: 'event',
      attributes: {
        profile: { data: { type: 'profile', attributes: { email } } },
        metric: { data: { type: 'metric', attributes: { name: eventName } } },
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          brand: CONFIG.BRAND_NAME,
        },
        time: new Date().toISOString(),
      }
    }
  };

  return klaviyoRequest('events/', 'POST', eventData);
}

// ============================================================================
// EMAIL SEQUENCES
// ============================================================================

/**
 * Welcome Series - 5 emails over 14 days
 */
function generateWelcomeSeries(firstName) {
  const name = firstName || 'there';

  return {
    email1: {
      delay: 0,
      subject: `Bienvenue chez ${CONFIG.BRAND_NAME}, ${name}!`,
      preheader: 'Votre parcours automation commence maintenant',
    },
    email2: {
      delay: 2,
      subject: `Comment nos clients gagnent 10h/semaine`,
      preheader: 'Cas concrets et resultats verifies',
    },
    email3: {
      delay: 4,
      subject: `Les 3 automatisations les plus demandees`,
      preheader: 'Quick wins a deployer en moins d\'une semaine',
    },
    email4: {
      delay: 7,
      subject: `Guide: Automatisation E-commerce 2026`,
      preheader: 'Tendances et strategies qui fonctionnent',
    },
    email5: {
      delay: 14,
      subject: `[Exclusif] 10% sur votre premier pack automation`,
      preheader: 'Offre reservee aux nouveaux abonnes',
    },
  };
}

/**
 * Outreach Series - NOW USES SEGMENT-SPECIFIC TEMPLATES
 * Imported from: ./templates/b2b-email-templates.cjs
 *
 * The generateOutreachSeries(segment) function is imported and returns:
 * - email1: First contact (segment-specific from EMAIL_TEMPLATES)
 * - email2: Follow-up with value
 * - email3: Final outreach with audit offer
 *
 * All emails have full body with branding (L'équipe 3A Automation, tagline, URL)
 */
// Note: generateOutreachSeries is now imported from b2b-email-templates.cjs

// ============================================================================
// PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process Welcome Series subscriber
 */
async function processWelcome(lead) {
  console.log(`\n📧 Processing WELCOME: ${lead.email}`);

  try {
    // 1. Upsert profile
    const profile = await upsertProfile({
      ...lead,
      automationType: 'welcome_series',
      source: lead.source || 'website_subscribe',
    });

    const profileId = profile.id;
    console.log(`  ✅ Profile: ${profileId}`);

    // 2. Add to welcome list
    if (CONFIG.KLAVIYO_WELCOME_LIST_ID) {
      await addToList(profileId, CONFIG.KLAVIYO_WELCOME_LIST_ID);
      console.log(`  ✅ Added to list`);
    }

    // 3. Create event to trigger Klaviyo flow
    const series = generateWelcomeSeries(lead.firstName);
    await createEvent(lead.email, 'welcome_series_started', {
      first_name: lead.firstName || '',
      source: lead.source || 'website',
      email1_subject: series.email1.subject,
      series_length: 5,
    });
    console.log(`  ✅ Event created: welcome_series_started`);

    // 4. Log to dashboard
    await logToDashboard('welcome_series', lead);
    console.log(`  ✅ Logged to dashboard`);

    return { success: true, profileId, type: 'welcome' };

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Process Outreach lead (with B2B segmentation)
 */
async function processOutreach(lead) {
  // B2B Segmentation - detect persona from job title
  const segment = detectSegment(lead);
  const segmentDisplay = getSegmentDisplayName(segment);

  // Get segment-specific email templates
  const template = EMAIL_TEMPLATES[segment] || EMAIL_TEMPLATES.other;
  const emailContent = personalizeEmail(template, lead);
  const series = generateOutreachSeries(segment);
  const personalizedSeries = {
    email1: { ...series.email1, ...personalizeEmail(series.email1, lead) },
    email2: { ...series.email2, ...personalizeEmail(series.email2, lead) },
    email3: { ...series.email3, ...personalizeEmail(series.email3, lead) },
  };

  console.log(`\n📧 Processing OUTREACH: ${lead.email} (segment: ${segmentDisplay})`);

  try {
    // 1. Upsert profile with segment and personalized email content
    const profile = await upsertProfile({
      ...lead,
      automationType: 'outreach_sequence',
      source: lead.source || 'linkedin_scrape',
      segment: segment,
      segment_display: segmentDisplay,
      email_subject: emailContent.subject,
      email_body: emailContent.body,
    });

    const profileId = profile.id;
    console.log(`  ✅ Profile: ${profileId}`);

    // 2. Add to outreach list
    if (CONFIG.KLAVIYO_LIST_ID) {
      await addToList(profileId, CONFIG.KLAVIYO_LIST_ID);
      console.log(`  ✅ Added to list`);
    }

    // 3. Create segment-specific event to trigger Klaviyo flow
    const eventName = `outreach_${segment}_started`;
    await createEvent(lead.email, eventName, {
      first_name: lead.firstName || '',
      company: lead.company || '',
      lead_score: lead.leadScore || 50,
      segment: segment,
      segment_display: segmentDisplay,
      email1_subject: personalizedSeries.email1.subject,
      email1_body: personalizedSeries.email1.body,
      email2_subject: personalizedSeries.email2.subject,
      email3_subject: personalizedSeries.email3.subject,
      series_length: 3,
    });
    console.log(`  ✅ Event created: ${eventName}`);

    // 4. Log to dashboard
    await logToDashboard('outreach', lead);
    console.log(`  ✅ Logged to dashboard`);

    return { success: true, profileId, type: 'outreach', segment };

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Log to Dashboard API (Google Apps Script)
 */
async function logToDashboard(action, data) {
  try {
    const response = await fetch(CONFIG.DASHBOARD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: `log_${action}`,
        data: {
          email: data.email,
          name: data.firstName || data.name || '',
          company: data.company || '',
          timestamp: new Date().toISOString(),
          source: 'email-automation-unified',
        }
      }),
      redirect: 'follow',
    });

    return response.ok;
  } catch (error) {
    console.warn(`  ⚠️  Dashboard log failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// HTTP SERVER MODE
// ============================================================================

/**
 * Start HTTP server for webhook endpoints
 */
function startServer(port) {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // Parse body
    let body = '';
    req.on('data', chunk => body += chunk);

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        let result;

        // Route by path
        if (req.url === '/webhook/subscribe/new' || req.url === '/welcome') {
          result = await processWelcome(data);
        } else if (req.url === '/webhook/leads/new' || req.url === '/outreach') {
          result = await processOutreach(data);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  });

  server.listen(port, () => {
    console.log('================================================================================');
    console.log('EMAIL AUTOMATION UNIFIED - HTTP SERVER');
    console.log('================================================================================');
    console.log(`Port: ${port}`);
    console.log(`Klaviyo API: ${CONFIG.KLAVIYO_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`Brand: ${CONFIG.BRAND_NAME}`);
    console.log('');
    console.log('ENDPOINTS:');
    console.log(`  POST http://localhost:${port}/welcome         - Welcome series`);
    console.log(`  POST http://localhost:${port}/outreach        - Outreach sequence`);
    console.log(`  POST http://localhost:${port}/webhook/subscribe/new  - n8n compatible`);
    console.log(`  POST http://localhost:${port}/webhook/leads/new      - n8n compatible`);
    console.log('================================================================================\n');
  });

  return server;
}

// ============================================================================
// CLI MODE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const serverMode = args.includes('--server');
  const helpMode = args.includes('--help') || args.includes('-h');
  const modeArg = args.find(a => a.startsWith('--mode='));
  const emailArg = args.find(a => a.startsWith('--email='));
  const jsonArg = args.find(a => a.startsWith('--json='));
  const portArg = args.find(a => a.startsWith('--port='));

  // Help
  if (helpMode) {
    console.log(`
UNIFIED EMAIL AUTOMATION - ${CONFIG.BRAND_NAME}

USAGE:
  # Server mode (HTTP webhooks)
  node email-automation-unified.cjs --server [--port=3001]

  # CLI mode - Welcome series
  node email-automation-unified.cjs --mode=welcome --email=test@example.com

  # CLI mode - Outreach
  node email-automation-unified.cjs --mode=outreach --email=lead@company.com

  # JSON input
  node email-automation-unified.cjs --mode=welcome --json='{"email":"...","firstName":"..."}'

OPTIONS:
  --server         Start HTTP server for webhooks
  --port=PORT      Server port (default: 3001)
  --mode=MODE      welcome | outreach
  --email=EMAIL    Lead email address
  --json=DATA      Full lead data as JSON
  --help, -h       Show this help

ENVIRONMENT VARIABLES:
  KLAVIYO_API_KEY           Required. Klaviyo private API key
  KLAVIYO_LIST_ID           Optional. Default list for outreach
  KLAVIYO_WELCOME_LIST_ID   Optional. List for welcome subscribers
  DASHBOARD_API_URL         Optional. Google Apps Script URL
  BRAND_NAME                Optional. Your brand name
  BRAND_URL                 Optional. Your website URL
  CLIENT_ENV_PATH           Optional. Path to client-specific .env

DOUBLE USAGE (Agency):
  1. Copy this script to client project
  2. Create client .env with their KLAVIYO_API_KEY
  3. Set CLIENT_ENV_PATH=/path/to/client/.env
  4. Run script - uses client credentials
    `);
    process.exit(0);
  }

  // Validate config
  if (!CONFIG.KLAVIYO_API_KEY) {
    console.error('❌ ERROR: KLAVIYO_API_KEY not set');
    console.error('   Set it in .env or via CLIENT_ENV_PATH');
    process.exit(1);
  }

  // Server mode
  if (serverMode) {
    const port = portArg ? parseInt(portArg.split('=')[1]) : CONFIG.PORT;
    startServer(port);
    return;
  }

  // CLI mode
  const mode = modeArg ? modeArg.split('=')[1] : 'welcome';
  let lead = {};

  if (jsonArg) {
    lead = JSON.parse(jsonArg.split('=').slice(1).join('='));
  } else if (emailArg) {
    lead.email = emailArg.split('=')[1];
  } else {
    console.error('❌ ERROR: Provide --email or --json');
    process.exit(1);
  }

  if (!lead.email) {
    console.error('❌ ERROR: Email is required');
    process.exit(1);
  }

  console.log('================================================================================');
  console.log(`EMAIL AUTOMATION UNIFIED - ${mode.toUpperCase()} MODE`);
  console.log('================================================================================');
  console.log(`Klaviyo API: ✅ SET (${CONFIG.KLAVIYO_API_KEY.substring(0, 10)}...)`);
  console.log(`Brand: ${CONFIG.BRAND_NAME}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================');

  let result;
  if (mode === 'outreach') {
    result = await processOutreach(lead);
  } else {
    result = await processWelcome(lead);
  }

  console.log('\n================================================================================');
  console.log('RESULT');
  console.log('================================================================================');
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

// Export for module usage
module.exports = {
  processWelcome,
  processOutreach,
  upsertProfile,
  addToList,
  createEvent,
  startServer,
  CONFIG,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
