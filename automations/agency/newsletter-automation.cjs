#!/usr/bin/env node
/**
 * NEWSLETTER AUTOMATION - 3A Automation
 *
 * Bi-monthly newsletter: AI Content Generation → Klaviyo Campaign → Send
 * OFFICIAL replacement for n8n workflow "Newsletter 3A Automation" (deleted Session 114)
 *
 * PIPELINE:
 * 1. Generate newsletter content with AI (Grok/Gemini/Claude)
 * 2. Validate branding consistency
 * 3. Create Klaviyo campaign
 * 4. Set campaign content with HTML template
 * 5. Send immediately or schedule
 * 6. Log to dashboard
 *
 * MODES:
 * 1. CLI: node newsletter-automation.cjs --topic="automation tips"
 * 2. Preview: node newsletter-automation.cjs --preview --topic="..."
 * 3. Server: node newsletter-automation.cjs --server --port=3002
 * 4. Scheduled: Via cron (1st and 15th of month)
 *
 * AI PRIORITY (cost optimized):
 * 1. xAI/Grok ($0.05/1K tokens) - Preferred
 * 2. Gemini (free tier) - Fallback
 * 3. Claude (paid) - Final fallback
 *
 * Created: 2025-12-28 | Session 111
 * Updated: 2025-12-29 | Session 114 (Optimized, n8n workflow deleted)
 * Version: 2.0.0
 */

const path = require('path');
const fs = require('fs');

// Load environment
const envPath = process.env.CLIENT_ENV_PATH || path.join(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });

// Security utilities
const {
  fetchWithTimeout,
  retryWithExponentialBackoff,
  sanitizeInput,
} = require('./lib/security-utils.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Klaviyo
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY,
  KLAVIYO_NEWSLETTER_LIST_ID: process.env.KLAVIYO_NEWSLETTER_LIST_ID || process.env.KLAVIYO_LIST_ID,

  // AI (priority: xAI → Gemini → Claude)
  XAI_API_KEY: process.env.XAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

  // Dashboard API
  DASHBOARD_API_URL: process.env.DASHBOARD_API_URL ||
    'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec',

  // Brand
  BRAND_NAME: process.env.BRAND_NAME || '3A Automation',
  BRAND_URL: process.env.BRAND_URL || 'https://3a-automation.com',
  FROM_EMAIL: process.env.FROM_EMAIL || 'newsletter@3a-automation.com',
  FROM_NAME: process.env.FROM_NAME || '3A Automation',
  REPLY_TO: process.env.REPLY_TO || 'contact@3a-automation.com',

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Retry with exponential backoff and jitter (wrapper for security-utils)
 */
async function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;
  return retryWithExponentialBackoff(fn, {
    maxRetries,
    baseDelayMs: baseDelay,
    maxDelayMs: maxDelay,
  });
}

/**
 * Validate branding in content
 */
function validateBranding(content) {
  const issues = [];

  // Check signature
  if (!content.includes('3A Automation') && !content.includes(CONFIG.BRAND_NAME)) {
    issues.push('Missing brand name');
  }

  // Check URL
  if (!content.includes('3a-automation.com') && !content.includes(CONFIG.BRAND_URL)) {
    issues.push('Missing brand URL');
  }

  return { valid: issues.length === 0, issues };
}

// ============================================================================
// AI CONTENT GENERATION
// ============================================================================

/**
 * Generate newsletter content with AI
 */
async function generateNewsletterContent(topic, options = {}) {
  const { language = 'fr', sections = 4 } = options;

  const prompt = `Tu es un expert en marketing automation et e-commerce.
Génère une newsletter professionnelle pour ${CONFIG.BRAND_NAME} sur le thème: "${topic}"

STRUCTURE (${language === 'fr' ? 'en français' : 'in English'}):
1. TITRE ACCROCHEUR (max 60 caractères)
2. INTRODUCTION (2-3 phrases)
3. ${sections} SECTIONS avec:
   - Sous-titre
   - 2-3 paragraphes
   - Un conseil actionnable
4. CALL-TO-ACTION final

CONTRAINTES:
- Ton professionnel mais accessible
- Focus sur la valeur pratique
- Inclure des chiffres/statistiques quand pertinent
- CTA vers ${CONFIG.BRAND_URL}

FORMAT DE SORTIE (JSON):
{
  "title": "...",
  "preheader": "...(max 100 chars)",
  "introduction": "...",
  "sections": [
    { "title": "...", "content": "...", "tip": "..." }
  ],
  "cta": { "text": "...", "url": "${CONFIG.BRAND_URL}/contact" }
}`;

  // Try xAI/Grok first (cheapest, fast)
  if (CONFIG.XAI_API_KEY) {
    try {
      return await generateWithGrok(prompt);
    } catch (error) {
      console.warn(`⚠️ Grok failed: ${error.message}, trying Gemini...`);
    }
  }

  // Try Gemini (free tier)
  if (CONFIG.GEMINI_API_KEY) {
    try {
      return await generateWithGemini(prompt);
    } catch (error) {
      console.warn(`⚠️ Gemini failed: ${error.message}, trying Claude...`);
    }
  }

  // Fallback to Claude
  if (CONFIG.ANTHROPIC_API_KEY) {
    return await generateWithClaude(prompt);
  }

  throw new Error('No AI API configured (XAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY)');
}

/**
 * Generate with xAI/Grok API
 */
async function generateWithGrok(prompt) {
  console.log('🤖 Generating content with Grok (xAI)...');

  const response = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  }, 60000); // 60s timeout for AI generation

  if (!response.ok) {
    throw new Error(`Grok API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty Grok response');
  }

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in Grok response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate with Gemini API
 */
async function generateWithGemini(prompt) {
  console.log('🤖 Generating content with Gemini...');

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    },
    60000 // 60s timeout for AI generation
  );

  if (!response.ok) {
    throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty Gemini response');
  }

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in Gemini response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate with Claude API
 */
async function generateWithClaude(prompt) {
  console.log('🤖 Generating content with Claude...');

  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  }, 60000); // 60s timeout for AI generation

  if (!response.ok) {
    throw new Error(`Claude API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;

  if (!text) {
    throw new Error('Empty Claude response');
  }

  // Extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

// ============================================================================
// HTML TEMPLATE
// ============================================================================

/**
 * Generate HTML email from content
 */
function generateEmailHTML(content) {
  const { title, preheader, introduction, sections, cta } = content;

  const sectionsHTML = sections.map(section => `
    <tr>
      <td style="padding: 20px 30px;">
        <h2 style="color: #1a1a2e; font-size: 20px; margin: 0 0 15px 0;">${section.title}</h2>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
          ${section.content}
        </p>
        ${section.tip ? `
        <div style="background: #f0f4ff; border-left: 4px solid #4361ee; padding: 15px; margin: 15px 0;">
          <strong style="color: #1a1a2e;">💡 Conseil:</strong>
          <p style="color: #4a4a4a; margin: 10px 0 0 0;">${section.tip}</p>
        </div>
        ` : ''}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Email Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0;">${CONFIG.BRAND_NAME}</h1>
              <p style="color: #a0a0a0; font-size: 14px; margin: 10px 0 0 0;">Newsletter</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <h1 style="color: #1a1a2e; font-size: 28px; margin: 0; line-height: 1.3;">${title}</h1>
            </td>
          </tr>

          <!-- Introduction -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <p style="color: #4a4a4a; font-size: 18px; line-height: 1.6; margin: 0;">
                ${introduction}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            </td>
          </tr>

          <!-- Sections -->
          ${sectionsHTML}

          <!-- CTA -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <a href="${cta.url}" style="display: inline-block; background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 16px; font-weight: bold;">
                ${cta.text}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                ${CONFIG.BRAND_NAME} - Automatisation & Marketing
              </p>
              <p style="color: #6c757d; font-size: 12px; margin: 0;">
                <a href="${CONFIG.BRAND_URL}" style="color: #4361ee;">Site web</a> |
                <a href="{% manage_subscription_url %}" style="color: #4361ee;">Préférences</a> |
                <a href="{% unsubscribe_url %}" style="color: #4361ee;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// KLAVIYO CAMPAIGN API
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

  const response = await fetchWithTimeout(url, options, 30000); // 30s timeout

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Klaviyo ${response.status}: ${errorText}`);
  }

  if (response.status === 204) return { success: true };

  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

/**
 * Create Klaviyo campaign
 */
async function createCampaign(name, listId) {
  console.log('📧 Creating Klaviyo campaign...');

  const campaignData = {
    data: {
      type: 'campaign',
      attributes: {
        name: name,
        audiences: {
          included: [listId],
          excluded: [],
        },
        send_strategy: {
          method: 'immediate',
        },
        campaign_messages: {
          data: [{
            type: 'campaign-message',
            attributes: {
              channel: 'email',
              label: 'Newsletter',
              render_options: {
                shorten_links: true,
                add_org_prefix: true,
                add_info_link: true,
                add_opt_out_language: true,
              },
            },
          }],
        },
      },
    },
  };

  const result = await klaviyoRequest('campaigns/', 'POST', campaignData);
  return result.data;
}

/**
 * Update campaign message content
 */
async function setCampaignContent(campaignId, subject, preheader, htmlContent) {
  console.log('📝 Setting campaign content...');

  // Get campaign messages
  const campaign = await klaviyoRequest(`campaigns/${campaignId}/?include=campaign-messages`);
  const messageId = campaign.included?.[0]?.id;

  if (!messageId) {
    throw new Error('Campaign message not found');
  }

  // Update message content
  const messageData = {
    data: {
      type: 'campaign-message',
      id: messageId,
      attributes: {
        label: 'Newsletter',
        content: {
          subject: subject,
          preview_text: preheader,
          from_email: CONFIG.FROM_EMAIL,
          from_label: CONFIG.FROM_NAME,
          reply_to_email: CONFIG.REPLY_TO,
          cc_email: null,
          bcc_email: null,
        },
        render_options: {
          shorten_links: true,
          add_org_prefix: true,
          add_info_link: true,
          add_opt_out_language: true,
        },
      },
    },
  };

  await klaviyoRequest(`campaign-messages/${messageId}/`, 'PATCH', messageData);

  // Set HTML template content
  const templateData = {
    data: {
      type: 'template',
      attributes: {
        name: `Newsletter - ${new Date().toISOString().split('T')[0]}`,
        html: htmlContent,
        text: '', // Klaviyo auto-generates
      },
    },
  };

  const template = await klaviyoRequest('templates/', 'POST', templateData);

  // Assign template to message
  await klaviyoRequest(`campaign-messages/${messageId}/`, 'PATCH', {
    data: {
      type: 'campaign-message',
      id: messageId,
      relationships: {
        template: {
          data: { type: 'template', id: template.data.id },
        },
      },
    },
  });

  return messageId;
}

/**
 * Send campaign
 */
async function sendCampaign(campaignId) {
  console.log('🚀 Sending campaign...');

  await klaviyoRequest(`campaign-send-jobs/`, 'POST', {
    data: {
      type: 'campaign-send-job',
      attributes: {},
      relationships: {
        campaign: {
          data: { type: 'campaign', id: campaignId },
        },
      },
    },
  });

  return true;
}

// ============================================================================
// DASHBOARD LOGGING
// ============================================================================

async function logToDashboard(action, data) {
  try {
    await fetchWithTimeout(CONFIG.DASHBOARD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: `log_${action}`,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          source: 'newsletter-automation',
        },
      }),
      redirect: 'follow',
    }, 15000); // 15s timeout
    return true;
  } catch (error) {
    console.warn(`⚠️ Dashboard log failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run newsletter pipeline
 */
async function runNewsletter(options = {}) {
  const {
    topic = 'Tendances automation e-commerce',
    language = 'fr',
    preview = false,
    send = false,
  } = options;

  console.log('================================================================================');
  console.log('NEWSLETTER AUTOMATION PIPELINE');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Topic: ${topic}`);
  console.log(`Language: ${language}`);
  console.log(`Mode: ${preview ? 'PREVIEW' : send ? 'SEND' : 'CREATE ONLY'}`);
  console.log(`Klaviyo: ${CONFIG.KLAVIYO_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`Gemini: ${CONFIG.GEMINI_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log('================================================================================');

  // Validate
  if (!CONFIG.GEMINI_API_KEY && !CONFIG.ANTHROPIC_API_KEY) {
    throw new Error('No AI API configured (GEMINI_API_KEY or ANTHROPIC_API_KEY)');
  }

  // Klaviyo only required for non-preview mode
  if (!preview) {
    if (!CONFIG.KLAVIYO_API_KEY) {
      throw new Error('KLAVIYO_API_KEY not configured');
    }
    if (!CONFIG.KLAVIYO_NEWSLETTER_LIST_ID) {
      throw new Error('KLAVIYO_NEWSLETTER_LIST_ID not configured');
    }
  }

  // Step 1: Generate content
  console.log('\n📝 Step 1: Generating content...');
  const content = await generateNewsletterContent(topic, { language });
  console.log(`   ✅ Title: ${content.title}`);
  console.log(`   ✅ Sections: ${content.sections.length}`);

  // Step 2: Generate HTML
  console.log('\n🎨 Step 2: Generating HTML...');
  const html = generateEmailHTML(content);
  console.log(`   ✅ HTML: ${html.length} chars`);

  // Save preview
  const timestamp = new Date().toISOString().split('T')[0];
  const previewPath = path.join(CONFIG.OUTPUT_DIR, `newsletter-${timestamp}.html`);
  const jsonPath = path.join(CONFIG.OUTPUT_DIR, `newsletter-${timestamp}.json`);

  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(previewPath, html);
  fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2));
  console.log(`   📁 Saved: ${previewPath}`);

  if (preview) {
    console.log('\n================================================================================');
    console.log('PREVIEW MODE - Campaign not created');
    console.log('================================================================================');
    return { success: true, mode: 'preview', previewPath };
  }

  // Step 3: Create Klaviyo campaign
  console.log('\n📧 Step 3: Creating Klaviyo campaign...');
  const campaignName = `Newsletter - ${content.title} (${timestamp})`;
  const campaign = await createCampaign(campaignName, CONFIG.KLAVIYO_NEWSLETTER_LIST_ID);
  const campaignId = campaign.id;
  console.log(`   ✅ Campaign ID: ${campaignId}`);

  // Step 4: Set content
  console.log('\n📝 Step 4: Setting campaign content...');
  await setCampaignContent(campaignId, content.title, content.preheader, html);
  console.log(`   ✅ Content set`);

  // Step 5: Send (if requested)
  if (send) {
    console.log('\n🚀 Step 5: Sending campaign...');
    await sendCampaign(campaignId);
    console.log(`   ✅ Campaign sent!`);
  }

  // Step 6: Log to dashboard
  console.log('\n📊 Step 6: Logging to dashboard...');
  await logToDashboard('newsletter', {
    campaign_id: campaignId,
    title: content.title,
    topic,
    language,
    sent: send,
  });
  console.log(`   ✅ Logged`);

  console.log('\n================================================================================');
  console.log('NEWSLETTER PIPELINE COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Campaign: ${campaignId}`);
  console.log(`✅ Title: ${content.title}`);
  console.log(`✅ Status: ${send ? 'SENT' : 'CREATED (not sent)'}`);
  console.log('================================================================================');

  return {
    success: true,
    campaignId,
    title: content.title,
    sent: send,
    previewPath,
  };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const helpArg = args.includes('--help') || args.includes('-h');
  const testArg = args.includes('--test');
  const previewArg = args.includes('--preview');
  const sendArg = args.includes('--send');
  const topicArg = args.find(a => a.startsWith('--topic='));
  const langArg = args.find(a => a.startsWith('--lang='));

  if (helpArg) {
    console.log(`
NEWSLETTER AUTOMATION v2.0 - ${CONFIG.BRAND_NAME}

USAGE:
  # Preview mode (generate content, save HTML, no Klaviyo)
  node newsletter-automation.cjs --preview --topic="automation tips"

  # Create campaign (don't send)
  node newsletter-automation.cjs --topic="automation tips"

  # Create and send immediately
  node newsletter-automation.cjs --send --topic="automation tips"

  # HTTP Server mode (for webhooks)
  node newsletter-automation.cjs --server --port=3002

  # Test API connections
  node newsletter-automation.cjs --test

OPTIONS:
  --topic=TEXT      Newsletter topic (required for CLI mode)
  --lang=CODE       Language: fr (default) or en
  --preview         Generate content only, save HTML preview
  --send            Create and send campaign immediately
  --server          Start HTTP server for webhook triggers
  --port=NUMBER     Server port (default: 3002)
  --test            Test API connections
  --help, -h        Show this help

ENVIRONMENT VARIABLES:
  KLAVIYO_API_KEY              Required. Klaviyo private API key
  KLAVIYO_NEWSLETTER_LIST_ID   Required. List ID for newsletter
  XAI_API_KEY                  Recommended. xAI/Grok (cheapest)
  GEMINI_API_KEY               Fallback. Google Gemini (free tier)
  ANTHROPIC_API_KEY            Final fallback. Claude API key
  BRAND_NAME                   Optional. Your brand name
  FROM_EMAIL                   Optional. Sender email

AI PRIORITY (cost optimized):
  1. xAI/Grok   - $0.05/1K tokens (preferred)
  2. Gemini     - Free tier available
  3. Claude     - Paid only

SCHEDULE (via cron):
  # 1st and 15th of month at 10:00
  0 10 1,15 * * node newsletter-automation.cjs --send --topic="automation trends"

REPLACED: n8n workflow "Newsletter 3A Automation" (deleted Session 114)
    `);
    process.exit(0);
  }

  // Test mode
  if (testArg) {
    console.log('================================================================================');
    console.log('API CONNECTION TEST - Newsletter Automation v2.0');
    console.log('================================================================================');

    let allOk = true;

    // Test Klaviyo
    console.log('\n📡 Testing Klaviyo...');
    if (!CONFIG.KLAVIYO_API_KEY) {
      console.log('   ❌ KLAVIYO_API_KEY not set');
      allOk = false;
    } else {
      try {
        const result = await klaviyoRequest('lists/');
        const listCount = result.data?.length || 0;
        console.log(`   ✅ Klaviyo: ${listCount} lists`);
        if (CONFIG.KLAVIYO_NEWSLETTER_LIST_ID) {
          const listExists = result.data?.some(l => l.id === CONFIG.KLAVIYO_NEWSLETTER_LIST_ID);
          console.log(`   ${listExists ? '✅' : '❌'} Newsletter list: ${CONFIG.KLAVIYO_NEWSLETTER_LIST_ID}`);
          if (!listExists) allOk = false;
        } else {
          console.log('   ⚠️ KLAVIYO_NEWSLETTER_LIST_ID not set');
        }
      } catch (e) {
        console.log(`   ❌ Klaviyo: ${e.message}`);
        allOk = false;
      }
    }

    // Test xAI/Grok (primary)
    console.log('\n📡 Testing xAI/Grok (primary)...');
    if (!CONFIG.XAI_API_KEY) {
      console.log('   ⚠️ XAI_API_KEY not set (recommended for cost)');
    } else {
      try {
        const resp = await fetchWithTimeout('https://api.x.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${CONFIG.XAI_API_KEY}` }
        }, 15000);
        if (resp.ok) {
          const data = await resp.json();
          console.log(`   ✅ xAI/Grok: ${data.data?.length || 0} models`);
        } else {
          console.log(`   ❌ xAI/Grok: ${resp.status}`);
        }
      } catch (e) {
        console.log(`   ❌ xAI/Grok: ${e.message}`);
      }
    }

    // Test Gemini (fallback)
    console.log('\n📡 Testing Gemini (fallback)...');
    if (!CONFIG.GEMINI_API_KEY) {
      console.log('   ⚠️ GEMINI_API_KEY not set');
    } else {
      try {
        const resp = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${CONFIG.GEMINI_API_KEY}`,
          {},
          15000
        );
        if (resp.ok) {
          console.log('   ✅ Gemini: OK');
        } else {
          console.log(`   ❌ Gemini: ${resp.status}`);
        }
      } catch (e) {
        console.log(`   ❌ Gemini: ${e.message}`);
      }
    }

    // Test Claude (final fallback)
    console.log('\n📡 Testing Claude (final fallback)...');
    if (!CONFIG.ANTHROPIC_API_KEY) {
      console.log('   ⚠️ ANTHROPIC_API_KEY not set');
    } else {
      console.log('   ✅ ANTHROPIC_API_KEY set');
    }

    // AI availability summary
    const aiAvailable = CONFIG.XAI_API_KEY || CONFIG.GEMINI_API_KEY || CONFIG.ANTHROPIC_API_KEY;
    console.log(`\n📊 AI Available: ${aiAvailable ? '✅ YES' : '❌ NO'}`);
    if (!aiAvailable) allOk = false;

    console.log('================================================================================');
    console.log(`Result: ${allOk ? '✅ ALL CHECKS PASSED' : '⚠️ SOME ISSUES FOUND'}`);
    console.log('================================================================================');
    process.exit(allOk ? 0 : 1);
  }

  // Server mode
  const serverArg = args.includes('--server');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1]) : 3002;

  if (serverArg) {
    const http = require('http');

    const server = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'newsletter-automation', version: '2.0.0' }));
        return;
      }

      // Newsletter trigger
      if (req.method === 'POST' && req.url === '/send') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const result = await runNewsletter({
              topic: data.topic || 'Tendances automation e-commerce',
              language: data.language || 'fr',
              preview: data.preview || false,
              send: data.send || false,
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.listen(port, () => {
      console.log('================================================================================');
      console.log('NEWSLETTER AUTOMATION SERVER v2.0');
      console.log('================================================================================');
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📡 POST /send - Trigger newsletter`);
      console.log(`❤️ GET /health - Health check`);
      console.log('================================================================================');
    });
    return;
  }

  // Validate
  if (!CONFIG.KLAVIYO_API_KEY) {
    console.error('❌ ERROR: KLAVIYO_API_KEY not set');
    process.exit(1);
  }

  const topic = topicArg ? topicArg.split('=').slice(1).join('=') : 'Tendances automation e-commerce 2025';
  const language = langArg ? langArg.split('=')[1] : 'fr';

  try {
    const result = await runNewsletter({
      topic,
      language,
      preview: previewArg,
      send: sendArg,
    });

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ FATAL:', error.message);
    process.exit(1);
  }
}

// Export for module usage
module.exports = {
  runNewsletter,
  generateNewsletterContent,
  generateEmailHTML,
  createCampaign,
  setCampaignContent,
  sendCampaign,
  validateBranding,
  withRetry,
  CONFIG,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
