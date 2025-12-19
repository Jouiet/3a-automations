#!/usr/bin/env node
/**
 * SYNC GOOGLE FORMS TO KLAVIYO
 *
 * Generic B2B lead automation: Google Forms → Klaviyo list
 * Works with any Google Form via webhook or manual CSV import
 *
 * USAGE:
 * 1. Via webhook (Apps Script installed):
 *    - Form submission triggers Apps Script
 *    - Apps Script calls this endpoint or Klaviyo directly
 *
 * 2. Via CSV import:
 *    node sync-google-forms-to-klaviyo.cjs --csv=/path/to/responses.csv
 *
 * 3. Via Google Sheets API:
 *    node sync-google-forms-to-klaviyo.cjs --sheet=SPREADSHEET_ID
 *
 * SETUP:
 * 1. Create Klaviyo list for form leads
 * 2. Get Klaviyo API key (pk_xxx)
 * 3. Configure .env with KLAVIYO_API_KEY and KLAVIYO_LIST_ID
 *
 * Created: 2025-12-19 | Session 26
 * Category: B2B Lead Generation
 * Reusable: YES - Generic pattern
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Klaviyo
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY,
  KLAVIYO_LIST_ID: process.env.KLAVIYO_B2B_LIST_ID || process.env.KLAVIYO_LIST_ID,

  // Google Sheets (optional)
  GOOGLE_SHEET_ID: process.env.GOOGLE_FORMS_SHEET_ID,

  // Processing
  BATCH_SIZE: 100,
  RATE_LIMIT_DELAY: 500,
};

// ========================================
// KLAVIYO API
// ========================================

/**
 * Create or update Klaviyo profile
 */
async function createKlaviyoProfile(lead) {
  const url = 'https://a.klaviyo.com/api/profiles/';

  const profileData = {
    data: {
      type: 'profile',
      attributes: {
        email: lead.email,
        first_name: lead.firstName || lead.name?.split(' ')[0] || '',
        last_name: lead.lastName || lead.name?.split(' ').slice(1).join(' ') || '',
        phone_number: lead.phone || null,
        organization: lead.company || lead.organization || null,
        title: lead.jobTitle || lead.title || null,
        properties: {
          source: lead.source || 'google_forms',
          form_name: lead.formName || 'B2B Lead Form',
          submitted_at: lead.timestamp || new Date().toISOString(),
          website: lead.website || null,
          message: lead.message || null,
          service_interest: lead.service || null,
          company_size: lead.companySize || null,
          budget: lead.budget || null,
          lead_type: 'b2b',
        }
      }
    }
  };

  // Remove null properties
  Object.keys(profileData.data.attributes.properties).forEach(key => {
    if (profileData.data.attributes.properties[key] === null) {
      delete profileData.data.attributes.properties[key];
    }
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Check if profile already exists (409 conflict)
    if (response.status === 409) {
      console.log(`  ⚠️ Profile exists, updating: ${lead.email}`);
      // Extract profile ID from error and update
      const errorData = JSON.parse(errorText);
      const existingId = errorData.errors?.[0]?.meta?.duplicate_profile_id;
      if (existingId) {
        return await updateKlaviyoProfile(existingId, lead);
      }
    }

    throw new Error(`Klaviyo API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update existing Klaviyo profile
 */
async function updateKlaviyoProfile(profileId, lead) {
  const url = `https://a.klaviyo.com/api/profiles/${profileId}/`;

  const updateData = {
    data: {
      type: 'profile',
      id: profileId,
      attributes: {
        properties: {
          last_form_submission: new Date().toISOString(),
          form_submissions_count: '$incrementBy:1',
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    console.warn(`  ⚠️ Could not update profile ${profileId}`);
    return null;
  }

  return { id: profileId, updated: true };
}

/**
 * Add profile to Klaviyo list
 */
async function addToKlaviyoList(profileId, listId) {
  const url = `https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
    },
    body: JSON.stringify({
      data: [{ type: 'profile', id: profileId }]
    }),
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    console.warn(`  ⚠️ Could not add to list: ${errorText}`);
    return false;
  }

  return true;
}

/**
 * Track form submission event in Klaviyo
 */
async function trackFormEvent(lead) {
  const url = 'https://a.klaviyo.com/api/events/';

  const eventData = {
    data: {
      type: 'event',
      attributes: {
        profile: {
          email: lead.email,
        },
        metric: {
          name: 'B2B Form Submitted',
        },
        properties: {
          form_name: lead.formName || 'B2B Lead Form',
          source: lead.source || 'google_forms',
          service_interest: lead.service || 'general',
          timestamp: lead.timestamp || new Date().toISOString(),
        },
        time: new Date().toISOString(),
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
    },
    body: JSON.stringify(eventData),
  });

  return response.ok;
}

// ========================================
// CSV PROCESSING
// ========================================

/**
 * Parse CSV file with Google Forms responses
 */
function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const headers = parseCSVLine(lines[0]);
  const leads = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const lead = {};

    headers.forEach((header, index) => {
      const normalizedHeader = normalizeHeader(header);
      lead[normalizedHeader] = values[index] || '';
    });

    // Map common Google Forms fields
    const mappedLead = mapGoogleFormsFields(lead);
    if (mappedLead.email) {
      leads.push(mappedLead);
    }
  }

  return leads;
}

/**
 * Parse a single CSV line handling quotes
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Normalize header names
 */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Map Google Forms common field names to standard lead fields
 */
function mapGoogleFormsFields(lead) {
  const fieldMappings = {
    // Email
    email: ['email', 'email_address', 'adresse_email', 'e_mail', 'courriel'],
    // Name
    name: ['name', 'nom', 'full_name', 'nom_complet', 'votre_nom'],
    firstName: ['first_name', 'prenom', 'pr_nom'],
    lastName: ['last_name', 'nom_de_famille', 'nom_famille'],
    // Company
    company: ['company', 'entreprise', 'societe', 'organisation', 'company_name', 'nom_entreprise'],
    // Phone
    phone: ['phone', 'telephone', 't_l_phone', 'phone_number', 'numero'],
    // Job
    jobTitle: ['job_title', 'titre', 'fonction', 'poste', 'role'],
    // Website
    website: ['website', 'site_web', 'url', 'site'],
    // Message
    message: ['message', 'commentaire', 'question', 'details', 'description'],
    // Service
    service: ['service', 'service_interest', 'type_de_service', 'besoin'],
    // Timestamp
    timestamp: ['timestamp', 'horodatage', 'date', 'submitted_at'],
  };

  const mappedLead = { source: 'google_forms' };

  for (const [standardField, possibleNames] of Object.entries(fieldMappings)) {
    for (const name of possibleNames) {
      if (lead[name]) {
        mappedLead[standardField] = lead[name];
        break;
      }
    }
  }

  return mappedLead;
}

// ========================================
// MAIN PROCESSING
// ========================================

/**
 * Process a single lead
 */
async function processLead(lead) {
  try {
    // 1. Create/update Klaviyo profile
    const profile = await createKlaviyoProfile(lead);

    if (!profile) {
      return { success: false, email: lead.email, error: 'Profile creation failed' };
    }

    const profileId = profile.id;

    // 2. Add to list if configured
    if (CONFIG.KLAVIYO_LIST_ID) {
      await addToKlaviyoList(profileId, CONFIG.KLAVIYO_LIST_ID);
    }

    // 3. Track form submission event
    await trackFormEvent(lead);

    return { success: true, email: lead.email, profileId };
  } catch (error) {
    return { success: false, email: lead.email, error: error.message };
  }
}

/**
 * Process all leads from CSV
 */
async function processLeadsFromCSV(csvPath) {
  console.log('================================================================================');
  console.log('GOOGLE FORMS → KLAVIYO SYNC');
  console.log('================================================================================');
  console.log(`CSV File: ${csvPath}`);
  console.log(`Klaviyo List: ${CONFIG.KLAVIYO_LIST_ID || 'Not configured'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================\n');

  // Validate config
  if (!CONFIG.KLAVIYO_API_KEY) {
    console.error('❌ ERROR: KLAVIYO_API_KEY not set in .env');
    process.exit(1);
  }

  // Parse CSV
  console.log('📥 Parsing CSV file...');
  const leads = parseCSV(csvPath);
  console.log(`✅ Found ${leads.length} leads\n`);

  // Process leads
  console.log('📤 Syncing to Klaviyo...\n');

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    console.log(`Processing ${i + 1}/${leads.length}: ${lead.email}`);

    const result = await processLead(lead);

    if (result.success) {
      console.log(`  ✅ Synced: ${result.profileId}`);
      results.success++;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      results.failed++;
      results.errors.push(result);
    }

    // Rate limiting
    if (i < leads.length - 1) {
      await new Promise(r => setTimeout(r, CONFIG.RATE_LIMIT_DELAY));
    }
  }

  // Summary
  console.log('\n================================================================================');
  console.log('SYNC COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n📋 Failed leads:');
    results.errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
  }

  return results;
}

/**
 * Process a single lead from webhook/API call
 */
async function processSingleLead(leadData) {
  if (!CONFIG.KLAVIYO_API_KEY) {
    throw new Error('KLAVIYO_API_KEY not configured');
  }

  const lead = mapGoogleFormsFields(leadData);

  if (!lead.email) {
    throw new Error('Email is required');
  }

  return await processLead(lead);
}

// ========================================
// CLI
// ========================================

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const csvArg = args.find(a => a.startsWith('--csv='));
  const jsonArg = args.find(a => a.startsWith('--json='));
  const helpArg = args.includes('--help') || args.includes('-h');

  if (helpArg) {
    console.log(`
USAGE:
  node sync-google-forms-to-klaviyo.cjs --csv=/path/to/responses.csv
  node sync-google-forms-to-klaviyo.cjs --json='{"email":"test@example.com"}'

OPTIONS:
  --csv=PATH    Path to Google Forms CSV export
  --json=DATA   JSON string with lead data (for testing)
  --help, -h    Show this help

ENVIRONMENT VARIABLES:
  KLAVIYO_API_KEY       Required. Your Klaviyo API key
  KLAVIYO_B2B_LIST_ID   Optional. Klaviyo list ID for B2B leads
    `);
    process.exit(0);
  }

  if (csvArg) {
    const csvPath = csvArg.split('=')[1];
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`);
      process.exit(1);
    }
    await processLeadsFromCSV(csvPath);
  } else if (jsonArg) {
    const jsonData = jsonArg.split('=').slice(1).join('=');
    try {
      const lead = JSON.parse(jsonData);
      const result = await processSingleLead(lead);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error('❌ Invalid JSON:', e.message);
      process.exit(1);
    }
  } else {
    console.log('❌ No input provided. Use --csv=PATH or --json=DATA');
    console.log('   Run with --help for usage information');
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  processSingleLead,
  processLeadsFromCSV,
  createKlaviyoProfile,
  addToKlaviyoList,
  trackFormEvent,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
