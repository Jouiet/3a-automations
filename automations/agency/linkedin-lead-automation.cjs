#!/usr/bin/env node
/**
 * LINKEDIN LEAD AUTOMATION - 3A Automation
 *
 * Complete B2B lead pipeline: LinkedIn Scrape → Lead Scoring → Klaviyo Sync → Outreach
 * Replaces n8n workflow "LinkedIn Lead Scraper - Aggressive Outbound" (uses $env → FAILS)
 *
 * PIPELINE:
 * 1. Scrape LinkedIn profiles via Apify
 * 2. Score leads with AI criteria
 * 3. Create/update Klaviyo profiles
 * 4. Trigger outreach sequence
 * 5. Log to dashboard
 *
 * MODES:
 * 1. Scheduled: Run via cron (every 6h like n8n workflow)
 * 2. CLI: node linkedin-lead-automation.cjs --search="marketing director Paris"
 * 3. File: node linkedin-lead-automation.cjs --file=leads.json
 *
 * Created: 2025-12-28 | Session 111
 * Replaces: n8n workflow "LinkedIn Lead Scraper - Aggressive Outbound"
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

// Load environment
const envPath = process.env.CLIENT_ENV_PATH || path.join(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });

// Import B2B email templates (shared module)
const {
  EMAIL_TEMPLATES,
  SEGMENT_KEYWORDS,
  SEGMENT_LISTS,
  detectSegment,
  personalizeEmail,
  getSegmentDisplayName,
} = require('./templates/b2b-email-templates.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Apify
  APIFY_TOKEN: process.env.APIFY_TOKEN,
  APIFY_ACTOR_PROFILE: 'curious_coder/linkedin-profile-scraper',
  APIFY_ACTOR_SEARCH: 'dev_fusion/linkedin-profile-scraper',
  APIFY_ACTOR_COMPANY: 'caprolok/linkedin-employees-scraper',

  // Klaviyo
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY,
  KLAVIYO_LIST_ID: process.env.KLAVIYO_OUTREACH_LIST_ID || process.env.KLAVIYO_LIST_ID,

  // Dashboard API (Google Apps Script)
  DASHBOARD_API_URL: process.env.DASHBOARD_API_URL ||
    'https://script.google.com/macros/s/AKfycbw9JP0YCJV47HL5zahXHweJgjEfNsyiFYFKZXGFUTS9c3SKrmRZdJEg0tcWnvA-P2Jl/exec',

  // Lead scoring thresholds
  MIN_LEAD_SCORE: 60, // Only process leads with score >= 60
  MAX_PROFILES_PER_RUN: 100,

  // API limits
  APIFY_POLL_INTERVAL: 5000, // 5 seconds
  APIFY_MAX_WAIT: 600000, // 10 minutes
  KLAVIYO_RATE_DELAY: 300, // 300ms between calls

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),

  // Brand
  BRAND_NAME: process.env.BRAND_NAME || '3A Automation',
};

// ============================================================================
// APIFY FUNCTIONS
// ============================================================================

/**
 * Run Apify actor and wait for results
 */
async function runApifyActor(actorId, input) {
  if (!CONFIG.APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN not configured');
  }

  console.log(`\n🚀 Starting Apify actor: ${actorId}`);

  // Start actor run
  const startUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${CONFIG.APIFY_TOKEN}`;

  const startResponse = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!startResponse.ok) {
    const error = await startResponse.text();
    throw new Error(`Apify start failed: ${startResponse.status} - ${error}`);
  }

  const runData = await startResponse.json();
  const runId = runData.data.id;
  console.log(`   Run ID: ${runId}`);

  // Poll for completion
  const startTime = Date.now();
  let status = 'RUNNING';

  while (status === 'RUNNING' || status === 'READY') {
    if (Date.now() - startTime > CONFIG.APIFY_MAX_WAIT) {
      throw new Error('Apify run timed out');
    }

    await new Promise(r => setTimeout(r, CONFIG.APIFY_POLL_INTERVAL));

    const statusUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${CONFIG.APIFY_TOKEN}`;
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();

    status = statusData.data.status;
    process.stdout.write(`   Status: ${status}\r`);
  }

  console.log(`   Status: ${status}`);

  if (status !== 'SUCCEEDED') {
    throw new Error(`Apify run failed: ${status}`);
  }

  // Get results
  const datasetId = runData.data.defaultDatasetId;
  const dataUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${CONFIG.APIFY_TOKEN}`;

  const dataResponse = await fetch(dataUrl);
  const results = await dataResponse.json();

  console.log(`   ✅ Got ${results.length} profiles`);

  return results;
}

/**
 * Scrape profiles by search query
 */
async function scrapeBySearch(searchQuery, maxResults = 50) {
  console.log(`\n🔍 LinkedIn Search: "${searchQuery}"`);

  return await runApifyActor(CONFIG.APIFY_ACTOR_SEARCH, {
    searchQuery,
    maxResults: Math.min(maxResults, CONFIG.MAX_PROFILES_PER_RUN),
    proxyConfiguration: { useApifyProxy: true },
  });
}

/**
 * Scrape company employees
 */
async function scrapeCompanyEmployees(companyUrl, maxResults = 100) {
  console.log(`\n🏢 Scraping company: ${companyUrl}`);

  return await runApifyActor(CONFIG.APIFY_ACTOR_COMPANY, {
    companyUrls: [companyUrl],
    maxEmployees: Math.min(maxResults, CONFIG.MAX_PROFILES_PER_RUN),
    proxyConfiguration: { useApifyProxy: true },
  });
}

// ============================================================================
// LEAD SCORING
// ============================================================================

/**
 * Score a lead (0-100) based on profile data
 * Replaces n8n "AI Lead Scoring" node
 */
function scoreLead(profile) {
  let score = 50; // Base score

  // Job title scoring (+0 to +25)
  const title = (profile.headline || profile.position || '').toLowerCase();
  const titleScores = {
    'ceo': 25, 'cto': 25, 'coo': 25, 'cfo': 20,
    'founder': 25, 'co-founder': 25, 'owner': 20,
    'director': 20, 'head of': 18, 'vp': 18, 'vice president': 18,
    'manager': 12, 'lead': 10, 'senior': 8,
    'marketing': 5, 'ecommerce': 8, 'e-commerce': 8, 'digital': 5,
    'automation': 10, 'growth': 8, 'operations': 5,
  };

  for (const [keyword, points] of Object.entries(titleScores)) {
    if (title.includes(keyword)) {
      score += points;
      break; // Only count highest match
    }
  }

  // Company size indicator (+0 to +15)
  const connections = profile.connections || profile.connectionsCount || 0;
  if (connections >= 500) score += 15;
  else if (connections >= 300) score += 10;
  else if (connections >= 100) score += 5;

  // Has email = much more valuable (+15)
  if (profile.email) score += 15;

  // Industry match (+0 to +10)
  const industry = (profile.industry || '').toLowerCase();
  const targetIndustries = ['retail', 'ecommerce', 'e-commerce', 'fashion', 'consumer goods', 'marketing'];
  if (targetIndustries.some(i => industry.includes(i))) {
    score += 10;
  }

  // Location bonus (+0 to +5)
  const location = (profile.location || '').toLowerCase();
  const targetLocations = ['france', 'paris', 'morocco', 'casablanca', 'europe'];
  if (targetLocations.some(l => location.includes(l))) {
    score += 5;
  }

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Normalize profile data from various Apify formats
 */
function normalizeProfile(raw) {
  return {
    linkedinUrl: raw.profileUrl || raw.url || raw.linkedInProfileUrl || null,
    fullName: raw.fullName || raw.name || `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    firstName: raw.firstName || raw.fullName?.split(' ')[0] || '',
    lastName: raw.lastName || raw.fullName?.split(' ').slice(1).join(' ') || '',
    headline: raw.headline || raw.title || '',
    email: raw.email || raw.emails?.[0] || null,
    phone: raw.phone || raw.phoneNumber || null,
    company: raw.company || raw.companyName || raw.currentCompany || '',
    position: raw.position || raw.jobTitle || '',
    industry: raw.industry || '',
    location: raw.location || raw.geoRegion || '',
    connections: raw.connectionsCount || raw.connections || null,
    scrapedAt: new Date().toISOString(),
  };
}

// ============================================================================
// KLAVIYO INTEGRATION
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

    throw new Error(`Klaviyo ${response.status}: ${errorText}`);
  }

  if (response.status === 204) return { success: true };

  const text = await response.text();
  if (!text || text.trim() === '') return { success: true };

  return JSON.parse(text);
}

/**
 * Create or update Klaviyo profile for a lead with segment and personalized email
 */
async function syncLeadToKlaviyo(lead, segment, emailContent) {
  const profileData = {
    data: {
      type: 'profile',
      attributes: {
        email: lead.email,
        first_name: lead.firstName || '',
        last_name: lead.lastName || '',
        organization: lead.company || null,
        title: lead.position || null,
        properties: {
          source: 'linkedin_scrape',
          linkedin_url: lead.linkedinUrl || null,
          lead_score: lead.leadScore || 0,
          industry: lead.industry || null,
          connections: lead.connections || null,
          location: lead.location || null,
          scraped_at: lead.scrapedAt,
          automation_type: 'linkedin_outreach',
          // B2B Segmentation (aligned with linkedin-to-klaviyo model)
          segment: segment,
          segment_display: getSegmentDisplayName(segment),
          email_subject: emailContent.subject,
          email_body: emailContent.body,
        }
      }
    }
  };

  // Clean null values from properties
  const props = profileData.data.attributes.properties;
  Object.keys(props).forEach(k => props[k] === null && delete props[k]);

  const result = await klaviyoRequest('profiles/', 'POST', profileData);

  if (result.duplicate && result.existingId) {
    return { id: result.existingId, updated: true };
  }

  return result.data;
}

/**
 * Add profile to Klaviyo list
 */
async function addToKlaviyoList(profileId, listId) {
  if (!listId) return false;

  await klaviyoRequest(`lists/${listId}/relationships/profiles/`, 'POST', {
    data: [{ type: 'profile', id: profileId }]
  });

  return true;
}

/**
 * Create Klaviyo event to trigger outreach flow (segment-specific)
 */
async function triggerOutreachEvent(email, lead, segment, emailContent) {
  // Segment-specific event name for targeted Klaviyo flows
  const eventName = `linkedin_qualified_${segment}`;

  const eventData = {
    data: {
      type: 'event',
      attributes: {
        profile: { data: { type: 'profile', attributes: { email } } },
        metric: { data: { type: 'metric', attributes: { name: eventName } } },
        properties: {
          first_name: lead.firstName || '',
          company: lead.company || '',
          position: lead.position || '',
          lead_score: lead.leadScore || 0,
          linkedin_url: lead.linkedinUrl || '',
          source: 'linkedin_lead_automation',
          brand: CONFIG.BRAND_NAME,
          // B2B Segment data
          segment: segment,
          segment_display: getSegmentDisplayName(segment),
          email_subject: emailContent.subject,
          email_body: emailContent.body,
        },
        time: new Date().toISOString(),
      }
    }
  };

  return klaviyoRequest('events/', 'POST', eventData);
}

// ============================================================================
// DASHBOARD LOGGING
// ============================================================================

/**
 * Log lead to dashboard CRM
 */
async function logToDashboard(lead, action = 'linkedin_lead') {
  try {
    await fetch(CONFIG.DASHBOARD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: `log_${action}`,
        data: {
          email: lead.email,
          name: lead.fullName || '',
          company: lead.company || '',
          position: lead.position || '',
          linkedin_url: lead.linkedinUrl || '',
          lead_score: lead.leadScore || 0,
          timestamp: new Date().toISOString(),
          source: 'linkedin-lead-automation',
        }
      }),
      redirect: 'follow',
    });
    return true;
  } catch (error) {
    console.warn(`   ⚠️ Dashboard log failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Process a single lead through the pipeline (with B2B segmentation)
 */
async function processLead(lead) {
  const email = lead.email;
  const score = lead.leadScore;

  // B2B Segmentation - detect persona from job title
  const segment = detectSegment(lead);
  const template = EMAIL_TEMPLATES[segment] || EMAIL_TEMPLATES.other;
  const emailContent = personalizeEmail(template, lead);

  console.log(`\n  📧 ${email} (score: ${score}, segment: ${getSegmentDisplayName(segment)})`);

  try {
    // 1. Sync to Klaviyo with segment + personalized email
    const profile = await syncLeadToKlaviyo(lead, segment, emailContent);
    const profileId = profile.id;
    console.log(`     ✅ Klaviyo profile: ${profileId}`);

    // 2. Add to outreach list
    if (CONFIG.KLAVIYO_LIST_ID) {
      await addToKlaviyoList(profileId, CONFIG.KLAVIYO_LIST_ID);
      console.log(`     ✅ Added to list`);
    }

    // 3. Trigger segment-specific outreach event (for Klaviyo flow)
    await triggerOutreachEvent(email, lead, segment, emailContent);
    console.log(`     ✅ Event: linkedin_qualified_${segment}`);

    // 4. Log to dashboard
    await logToDashboard(lead);
    console.log(`     ✅ Logged to dashboard`);

    // Rate limiting
    await new Promise(r => setTimeout(r, CONFIG.KLAVIYO_RATE_DELAY));

    return { success: true, email, profileId, segment };

  } catch (error) {
    console.error(`     ❌ Error: ${error.message}`);
    return { success: false, email, error: error.message };
  }
}

/**
 * Run full pipeline: Scrape → Score → Sync → Outreach
 */
async function runPipeline(options = {}) {
  const { searchQuery, companyUrl, maxResults = 50 } = options;

  console.log('================================================================================');
  console.log('LINKEDIN LEAD AUTOMATION PIPELINE');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Apify: ${CONFIG.APIFY_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`Klaviyo: ${CONFIG.KLAVIYO_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`Min Lead Score: ${CONFIG.MIN_LEAD_SCORE}`);
  console.log('================================================================================');

  // Validate
  if (!CONFIG.APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN not configured');
  }
  if (!CONFIG.KLAVIYO_API_KEY) {
    throw new Error('KLAVIYO_API_KEY not configured');
  }

  // Step 1: Scrape profiles
  let rawProfiles = [];

  if (searchQuery) {
    rawProfiles = await scrapeBySearch(searchQuery, maxResults);
  } else if (companyUrl) {
    rawProfiles = await scrapeCompanyEmployees(companyUrl, maxResults);
  } else {
    throw new Error('Provide --search or --company');
  }

  if (rawProfiles.length === 0) {
    console.log('\n⚠️ No profiles found');
    return { total: 0, qualified: 0, processed: 0, failed: 0 };
  }

  // Step 2: Normalize and score
  console.log('\n📊 Scoring leads...');

  const leads = rawProfiles
    .map(normalizeProfile)
    .map(lead => ({
      ...lead,
      leadScore: scoreLead(lead),
    }));

  // Step 3: Filter qualified leads (with email and score >= threshold)
  const qualifiedLeads = leads.filter(lead =>
    lead.email && lead.leadScore >= CONFIG.MIN_LEAD_SCORE
  );

  console.log(`   Total scraped: ${leads.length}`);
  console.log(`   With email: ${leads.filter(l => l.email).length}`);
  console.log(`   Score >= ${CONFIG.MIN_LEAD_SCORE}: ${leads.filter(l => l.leadScore >= CONFIG.MIN_LEAD_SCORE).length}`);
  console.log(`   ✅ Qualified (email + score): ${qualifiedLeads.length}`);

  // Step 4: Process qualified leads
  if (qualifiedLeads.length === 0) {
    console.log('\n⚠️ No qualified leads to process');

    // Still save raw results
    saveResults(leads, 'all');

    return { total: leads.length, qualified: 0, processed: 0, failed: 0 };
  }

  console.log('\n🔄 Processing qualified leads...');

  const results = [];
  for (const lead of qualifiedLeads) {
    const result = await processLead(lead);
    results.push(result);
  }

  // Step 5: Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n================================================================================');
  console.log('PIPELINE COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Total scraped:    ${leads.length}`);
  console.log(`✅ Qualified:        ${qualifiedLeads.length}`);
  console.log(`✅ Synced to Klaviyo: ${successful}`);
  console.log(`❌ Failed:           ${failed}`);
  console.log('================================================================================');

  // Save results
  saveResults(leads, 'all');
  saveResults(qualifiedLeads, 'qualified');

  return {
    total: leads.length,
    qualified: qualifiedLeads.length,
    processed: successful,
    failed,
  };
}

/**
 * Save results to JSON file
 */
function saveResults(leads, suffix) {
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `linkedin-leads-${suffix}-${timestamp}.json`;
  const filepath = path.join(CONFIG.OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(leads, null, 2));
  console.log(`📁 Saved: ${filepath}`);

  return filepath;
}

/**
 * Process leads from file (already scraped)
 */
async function processFromFile(filePath) {
  console.log('================================================================================');
  console.log('LINKEDIN LEAD AUTOMATION - FILE MODE');
  console.log('================================================================================');
  console.log(`File: ${filePath}`);
  console.log(`Klaviyo: ${CONFIG.KLAVIYO_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log('================================================================================');

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  if (!CONFIG.KLAVIYO_API_KEY) {
    throw new Error('KLAVIYO_API_KEY not configured');
  }

  const leads = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Add scores if missing
  const scoredLeads = leads.map(lead => ({
    ...lead,
    leadScore: lead.leadScore || scoreLead(lead),
  }));

  // Filter qualified
  const qualifiedLeads = scoredLeads.filter(lead =>
    lead.email && lead.leadScore >= CONFIG.MIN_LEAD_SCORE
  );

  console.log(`   Total in file: ${leads.length}`);
  console.log(`   Qualified: ${qualifiedLeads.length}`);

  if (qualifiedLeads.length === 0) {
    console.log('\n⚠️ No qualified leads');
    return { total: leads.length, qualified: 0, processed: 0, failed: 0 };
  }

  console.log('\n🔄 Processing...');

  const results = [];
  for (const lead of qualifiedLeads) {
    const result = await processLead(lead);
    results.push(result);
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n================================================================================');
  console.log(`✅ Processed: ${successful} | ❌ Failed: ${failed}`);
  console.log('================================================================================');

  return {
    total: leads.length,
    qualified: qualifiedLeads.length,
    processed: successful,
    failed,
  };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const helpArg = args.includes('--help') || args.includes('-h');
  const searchArg = args.find(a => a.startsWith('--search='));
  const companyArg = args.find(a => a.startsWith('--company='));
  const fileArg = args.find(a => a.startsWith('--file='));
  const maxArg = args.find(a => a.startsWith('--max='));
  const testArg = args.includes('--test');

  if (helpArg) {
    console.log(`
LINKEDIN LEAD AUTOMATION - ${CONFIG.BRAND_NAME}

USAGE:
  # Search LinkedIn profiles
  node linkedin-lead-automation.cjs --search="marketing director Paris" --max=50

  # Scrape company employees
  node linkedin-lead-automation.cjs --company="https://linkedin.com/company/acme"

  # Process existing leads file
  node linkedin-lead-automation.cjs --file=outputs/linkedin-profiles.json

  # Test API connections
  node linkedin-lead-automation.cjs --test

OPTIONS:
  --search=QUERY    LinkedIn search query
  --company=URL     Company LinkedIn URL
  --file=PATH       Process leads from JSON file
  --max=NUMBER      Max profiles to scrape (default: 50)
  --test            Test Apify and Klaviyo connections
  --help, -h        Show this help

ENVIRONMENT VARIABLES:
  APIFY_TOKEN            Required. Apify API token
  KLAVIYO_API_KEY        Required. Klaviyo private API key
  KLAVIYO_OUTREACH_LIST_ID   Optional. List for outreach leads
  DASHBOARD_API_URL      Optional. Dashboard webhook URL

PIPELINE:
  1. Scrape profiles (Apify)
  2. Score leads (title, connections, email, industry)
  3. Filter qualified (score >= 60, has email)
  4. Sync to Klaviyo (profile + list + event)
  5. Log to dashboard

REPLACES: n8n workflow "LinkedIn Lead Scraper - Aggressive Outbound"
    `);
    process.exit(0);
  }

  // Test mode
  if (testArg) {
    console.log('================================================================================');
    console.log('API CONNECTION TEST');
    console.log('================================================================================');

    // Test Apify
    console.log('\n📡 Testing Apify...');
    if (!CONFIG.APIFY_TOKEN) {
      console.log('   ❌ APIFY_TOKEN not set');
    } else {
      try {
        const resp = await fetch(`https://api.apify.com/v2/users/me?token=${CONFIG.APIFY_TOKEN}`);
        if (resp.ok) {
          const data = await resp.json();
          console.log(`   ✅ Apify: ${data.username || 'OK'}`);
        } else {
          console.log(`   ❌ Apify: ${resp.status}`);
        }
      } catch (e) {
        console.log(`   ❌ Apify: ${e.message}`);
      }
    }

    // Test Klaviyo
    console.log('\n📡 Testing Klaviyo...');
    if (!CONFIG.KLAVIYO_API_KEY) {
      console.log('   ❌ KLAVIYO_API_KEY not set');
    } else {
      try {
        const result = await klaviyoRequest('lists/');
        console.log(`   ✅ Klaviyo: ${result.data?.length || 0} lists`);
      } catch (e) {
        console.log(`   ❌ Klaviyo: ${e.message}`);
      }
    }

    console.log('================================================================================');
    process.exit(0);
  }

  // Validate required env
  if (!CONFIG.APIFY_TOKEN && !fileArg) {
    console.error('❌ ERROR: APIFY_TOKEN not set');
    process.exit(1);
  }
  if (!CONFIG.KLAVIYO_API_KEY) {
    console.error('❌ ERROR: KLAVIYO_API_KEY not set');
    process.exit(1);
  }

  try {
    let result;

    if (fileArg) {
      const filePath = fileArg.split('=').slice(1).join('=');
      result = await processFromFile(filePath);
    } else {
      const maxResults = maxArg ? parseInt(maxArg.split('=')[1]) : 50;
      const searchQuery = searchArg ? searchArg.split('=').slice(1).join('=') : null;
      const companyUrl = companyArg ? companyArg.split('=').slice(1).join('=') : null;

      result = await runPipeline({ searchQuery, companyUrl, maxResults });
    }

    process.exit(result.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ FATAL:', error.message);
    process.exit(1);
  }
}

// Export for module usage
module.exports = {
  runPipeline,
  processFromFile,
  scrapeBySearch,
  scrapeCompanyEmployees,
  scoreLead,
  normalizeProfile,
  syncLeadToKlaviyo,
  triggerOutreachEvent,
  CONFIG,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
