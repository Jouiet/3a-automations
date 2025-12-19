#!/usr/bin/env node
/**
 * SCRAPE LINKEDIN PROFILES VIA APIFY
 *
 * B2B lead generation: Extract LinkedIn profile data at scale
 * Uses Apify actors for compliant scraping
 *
 * USAGE:
 *   node scrape-linkedin-profiles.cjs --urls=urls.txt
 *   node scrape-linkedin-profiles.cjs --search="marketing director Paris"
 *   node scrape-linkedin-profiles.cjs --company="3A Automation"
 *
 * OUTPUT:
 *   - JSON file with structured profile data
 *   - Optional: Push to Google Sheets
 *   - Optional: Push to Klaviyo
 *
 * APIFY ACTORS USED:
 *   - curious_coder/linkedin-profile-scraper (profiles)
 *   - caprolok/linkedin-employees-scraper (company employees)
 *
 * LIMITS:
 *   - Max 500 profiles/day per LinkedIn account
 *   - Cost: ~$10/1000 profiles
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
  // Apify
  APIFY_TOKEN: process.env.APIFY_TOKEN,

  // Actor IDs (from Apify Store)
  ACTORS: {
    PROFILE_SCRAPER: 'curious_coder/linkedin-profile-scraper',
    EMPLOYEE_SCRAPER: 'caprolok/linkedin-employees-scraper',
    SEARCH_SCRAPER: 'dev_fusion/linkedin-profile-scraper', // No cookies required
  },

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),

  // Limits
  MAX_PROFILES_PER_RUN: 100,
  POLL_INTERVAL: 5000, // 5 seconds
  MAX_WAIT_TIME: 600000, // 10 minutes
};

// ========================================
// APIFY API
// ========================================

/**
 * Run an Apify actor and wait for results
 */
async function runApifyActor(actorId, input) {
  if (!CONFIG.APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN not configured in .env');
  }

  console.log(`\n🚀 Starting Apify actor: ${actorId}`);
  console.log(`   Input: ${JSON.stringify(input).substring(0, 100)}...`);

  // Start actor run
  const startUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${CONFIG.APIFY_TOKEN}`;

  const startResponse = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!startResponse.ok) {
    const error = await startResponse.text();
    throw new Error(`Failed to start actor: ${startResponse.status} - ${error}`);
  }

  const runData = await startResponse.json();
  const runId = runData.data.id;
  console.log(`   Run ID: ${runId}`);

  // Poll for completion
  console.log('   Waiting for completion...');

  const startTime = Date.now();
  let status = 'RUNNING';

  while (status === 'RUNNING' || status === 'READY') {
    if (Date.now() - startTime > CONFIG.MAX_WAIT_TIME) {
      throw new Error('Actor run timed out');
    }

    await new Promise(r => setTimeout(r, CONFIG.POLL_INTERVAL));

    const statusUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${CONFIG.APIFY_TOKEN}`;
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();

    status = statusData.data.status;
    console.log(`   Status: ${status}`);
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Actor run failed with status: ${status}`);
  }

  // Get results
  const datasetId = runData.data.defaultDatasetId;
  const dataUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${CONFIG.APIFY_TOKEN}`;

  const dataResponse = await fetch(dataUrl);
  const results = await dataResponse.json();

  console.log(`✅ Got ${results.length} results`);

  return results;
}

/**
 * Scrape profiles by URL list
 */
async function scrapeProfilesByUrls(urls) {
  // Validate URLs
  const validUrls = urls.filter(url =>
    url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/')
  );

  if (validUrls.length === 0) {
    throw new Error('No valid LinkedIn URLs provided');
  }

  console.log(`\n📋 Processing ${validUrls.length} LinkedIn URLs...`);

  const input = {
    profileUrls: validUrls.slice(0, CONFIG.MAX_PROFILES_PER_RUN),
    proxyConfiguration: {
      useApifyProxy: true,
    },
  };

  return await runApifyActor(CONFIG.ACTORS.PROFILE_SCRAPER, input);
}

/**
 * Search and scrape profiles by query
 */
async function scrapeProfilesBySearch(searchQuery, maxResults = 50) {
  console.log(`\n🔍 Searching LinkedIn for: "${searchQuery}"`);

  const input = {
    searchQuery: searchQuery,
    maxResults: Math.min(maxResults, CONFIG.MAX_PROFILES_PER_RUN),
    proxyConfiguration: {
      useApifyProxy: true,
    },
  };

  return await runApifyActor(CONFIG.ACTORS.SEARCH_SCRAPER, input);
}

/**
 * Scrape employees from a company
 */
async function scrapeCompanyEmployees(companyUrl, maxResults = 100) {
  console.log(`\n🏢 Scraping employees from company...`);

  const input = {
    companyUrls: [companyUrl],
    maxEmployees: Math.min(maxResults, CONFIG.MAX_PROFILES_PER_RUN),
    proxyConfiguration: {
      useApifyProxy: true,
    },
  };

  return await runApifyActor(CONFIG.ACTORS.EMPLOYEE_SCRAPER, input);
}

// ========================================
// DATA PROCESSING
// ========================================

/**
 * Normalize profile data to standard format
 */
function normalizeProfile(rawProfile) {
  return {
    // Basic info
    linkedinUrl: rawProfile.profileUrl || rawProfile.url || rawProfile.linkedInProfileUrl,
    fullName: rawProfile.fullName || rawProfile.name || `${rawProfile.firstName || ''} ${rawProfile.lastName || ''}`.trim(),
    firstName: rawProfile.firstName || rawProfile.fullName?.split(' ')[0] || '',
    lastName: rawProfile.lastName || rawProfile.fullName?.split(' ').slice(1).join(' ') || '',
    headline: rawProfile.headline || rawProfile.title || '',

    // Contact (if available)
    email: rawProfile.email || rawProfile.emails?.[0] || null,
    phone: rawProfile.phone || rawProfile.phoneNumber || null,

    // Professional
    company: rawProfile.company || rawProfile.companyName || rawProfile.currentCompany || '',
    position: rawProfile.position || rawProfile.jobTitle || rawProfile.headline?.split(' at ')[0] || '',
    industry: rawProfile.industry || '',
    location: rawProfile.location || rawProfile.geoRegion || '',

    // Experience
    experienceYears: rawProfile.experienceYears || calculateExperience(rawProfile.experience),
    currentCompanyTenure: rawProfile.currentCompanyTenure || null,

    // Education
    education: rawProfile.education || [],
    skills: rawProfile.skills || [],

    // Network
    connections: rawProfile.connectionsCount || rawProfile.connections || null,
    followers: rawProfile.followersCount || rawProfile.followers || null,

    // Meta
    scrapedAt: new Date().toISOString(),
    source: 'apify_linkedin_scraper',
  };
}

/**
 * Calculate years of experience from experience array
 */
function calculateExperience(experience) {
  if (!experience || !Array.isArray(experience)) return null;

  const now = new Date();
  let totalMonths = 0;

  for (const job of experience) {
    const startDate = parseDate(job.startDate || job.start);
    const endDate = job.endDate || job.end ? parseDate(job.endDate || job.end) : now;

    if (startDate && endDate) {
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                     (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
  }

  return Math.round(totalMonths / 12);
}

/**
 * Parse various date formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  // Try parsing common formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // Try "Month Year" format
  const monthYearMatch = dateStr.match(/(\w+)\s+(\d{4})/);
  if (monthYearMatch) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex(m => monthYearMatch[1].toLowerCase().startsWith(m));
    if (monthIndex >= 0) {
      return new Date(parseInt(monthYearMatch[2]), monthIndex, 1);
    }
  }

  return null;
}

// ========================================
// OUTPUT
// ========================================

/**
 * Save results to JSON file
 */
function saveToJSON(profiles, filename) {
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(profiles, null, 2));
  console.log(`\n📁 Saved to: ${outputPath}`);

  return outputPath;
}

/**
 * Save results to CSV file
 */
function saveToCSV(profiles, filename) {
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);

  const headers = [
    'linkedinUrl', 'fullName', 'email', 'company', 'position',
    'location', 'industry', 'connections', 'scrapedAt'
  ];

  const csvLines = [headers.join(',')];

  for (const profile of profiles) {
    const values = headers.map(h => {
      const value = profile[h] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(outputPath, csvLines.join('\n'));
  console.log(`📁 Saved CSV to: ${outputPath}`);

  return outputPath;
}

// ========================================
// MAIN
// ========================================

async function main() {
  console.log('================================================================================');
  console.log('LINKEDIN PROFILE SCRAPER (via Apify)');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================');

  // Parse arguments
  const args = process.argv.slice(2);
  const urlsArg = args.find(a => a.startsWith('--urls='));
  const searchArg = args.find(a => a.startsWith('--search='));
  const companyArg = args.find(a => a.startsWith('--company='));
  const helpArg = args.includes('--help') || args.includes('-h');

  if (helpArg) {
    console.log(`
USAGE:
  node scrape-linkedin-profiles.cjs --urls=urls.txt
  node scrape-linkedin-profiles.cjs --search="marketing director"
  node scrape-linkedin-profiles.cjs --company="https://linkedin.com/company/..."

OPTIONS:
  --urls=FILE       Text file with LinkedIn URLs (one per line)
  --search=QUERY    Search query for LinkedIn profiles
  --company=URL     Company LinkedIn URL to scrape employees
  --max=NUMBER      Maximum profiles to scrape (default: 50)
  --help, -h        Show this help

ENVIRONMENT VARIABLES:
  APIFY_TOKEN       Required. Your Apify API token

LIMITS:
  - Max 500 profiles/day per LinkedIn account
  - Cost: ~$10/1000 profiles

OUTPUT:
  Saves to outputs/linkedin-profiles-YYYY-MM-DD.json
    `);
    process.exit(0);
  }

  // Validate Apify token
  if (!CONFIG.APIFY_TOKEN) {
    console.error('❌ ERROR: APIFY_TOKEN not set in .env');
    console.error('   Get your token at: https://console.apify.com/account/integrations');
    process.exit(1);
  }

  let results = [];
  const timestamp = new Date().toISOString().split('T')[0];

  try {
    if (urlsArg) {
      // Scrape by URL list
      const urlsFile = urlsArg.split('=')[1];
      if (!fs.existsSync(urlsFile)) {
        console.error(`❌ File not found: ${urlsFile}`);
        process.exit(1);
      }

      const urls = fs.readFileSync(urlsFile, 'utf-8')
        .split('\n')
        .map(u => u.trim())
        .filter(u => u);

      const rawResults = await scrapeProfilesByUrls(urls);
      results = rawResults.map(normalizeProfile);

    } else if (searchArg) {
      // Search profiles
      const searchQuery = searchArg.split('=').slice(1).join('=');
      const maxArg = args.find(a => a.startsWith('--max='));
      const max = maxArg ? parseInt(maxArg.split('=')[1]) : 50;

      const rawResults = await scrapeProfilesBySearch(searchQuery, max);
      results = rawResults.map(normalizeProfile);

    } else if (companyArg) {
      // Company employees
      const companyUrl = companyArg.split('=').slice(1).join('=');
      const maxArg = args.find(a => a.startsWith('--max='));
      const max = maxArg ? parseInt(maxArg.split('=')[1]) : 100;

      const rawResults = await scrapeCompanyEmployees(companyUrl, max);
      results = rawResults.map(normalizeProfile);

    } else {
      console.log('❌ No input provided. Use --urls, --search, or --company');
      console.log('   Run with --help for usage information');
      process.exit(1);
    }

    // Save results
    if (results.length > 0) {
      saveToJSON(results, `linkedin-profiles-${timestamp}.json`);
      saveToCSV(results, `linkedin-profiles-${timestamp}.csv`);

      // Summary
      console.log('\n================================================================================');
      console.log('SCRAPE COMPLETE');
      console.log('================================================================================');
      console.log(`✅ Profiles scraped: ${results.length}`);
      console.log(`📧 With email: ${results.filter(p => p.email).length}`);
      console.log(`🏢 With company: ${results.filter(p => p.company).length}`);

      // Sample output
      if (results.length > 0) {
        console.log('\n📋 Sample profile:');
        console.log(JSON.stringify(results[0], null, 2));
      }
    } else {
      console.log('\n⚠️ No profiles found');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  scrapeProfilesByUrls,
  scrapeProfilesBySearch,
  scrapeCompanyEmployees,
  normalizeProfile,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
