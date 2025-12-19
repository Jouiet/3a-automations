#!/usr/bin/env node
/**
 * SCRAPE HIRING COMPANIES VIA APIFY
 *
 * B2B growth signal detection: Extract companies actively hiring
 * Hiring = Growth = Budget = Qualified B2B Prospect
 *
 * USAGE:
 *   node scrape-hiring-companies.cjs --source=indeed --query="marketing manager" --location="France"
 *   node scrape-hiring-companies.cjs --source=linkedin --query="sales director" --location="Paris"
 *   node scrape-hiring-companies.cjs --source=both --query="developer" --location="Lyon" --max=500
 *
 * OUTPUT:
 *   - Company names with job counts (unique)
 *   - Growth score based on hiring volume
 *   - Contact info when available
 *   - Optional: Enrich with company data
 *
 * BUSINESS INSIGHT:
 *   Companies hiring = Companies growing = Companies with budget
 *   More jobs = Higher growth signal
 *   Senior hires (VP, Director) = Major expansion
 *
 * APIFY ACTORS USED:
 *   - hynek.svacha/indeed-scraper (Indeed jobs)
 *   - bebity/linkedin-jobs-scraper (LinkedIn jobs)
 *
 * Created: 2025-12-19 | Session 26b
 * Category: B2B Lead Generation - Growth Signals
 * Priority: P1 HIGH
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
    INDEED: 'hynek.svacha/indeed-scraper',
    LINKEDIN_JOBS: 'bebity/linkedin-jobs-scraper',
    GLASSDOOR: 'petr_cermak/glassdoor-jobs-scraper',
  },

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),

  // Defaults
  DEFAULT_MAX_RESULTS: 200,
  POLL_INTERVAL: 5000,
  MAX_WAIT_TIME: 600000, // 10 minutes
};

// ========================================
// GROWTH SCORING
// ========================================

/**
 * Growth signal weights
 */
const GROWTH_SIGNALS = {
  // Job count signals
  JOB_COUNT_BASE: 10, // Base score per job
  JOB_COUNT_MULTIPLIER: {
    '1-2': 1.0,
    '3-5': 1.5,
    '6-10': 2.0,
    '11-20': 2.5,
    '21+': 3.0,
  },

  // Seniority signals (higher = more budget authority)
  SENIORITY_KEYWORDS: {
    'vp': 30,
    'vice president': 30,
    'director': 25,
    'head of': 25,
    'chief': 35,
    'cto': 35,
    'cfo': 35,
    'cmo': 35,
    'coo': 35,
    'manager': 15,
    'lead': 12,
    'senior': 10,
  },

  // Role type signals
  ROLE_SIGNALS: {
    'sales': 20, // Expansion mode
    'marketing': 15,
    'business development': 25,
    'account executive': 20,
    'growth': 25,
    'revenue': 20,
  },
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
  console.log(`   Input: ${JSON.stringify(input).substring(0, 200)}...`);

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
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Actor run failed with status: ${status}`);
  }

  const datasetId = runData.data.defaultDatasetId;
  const dataUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${CONFIG.APIFY_TOKEN}`;

  const dataResponse = await fetch(dataUrl);
  const results = await dataResponse.json();

  console.log(`✅ Got ${results.length} job listings`);

  return results;
}

/**
 * Scrape Indeed jobs
 */
async function scrapeIndeedJobs(query, location, maxResults = 200) {
  console.log(`\n🔍 Searching Indeed for: "${query}" in "${location}"`);

  const input = {
    country: detectCountryCode(location),
    position: query,
    location: location,
    maxItems: maxResults,
    parseCompanyDetails: true,
    saveOnlyUniqueItems: true,
    followApplyRedirects: false,
  };

  return await runApifyActor(CONFIG.ACTORS.INDEED, input);
}

/**
 * Scrape LinkedIn jobs
 */
async function scrapeLinkedInJobs(query, location, maxResults = 200) {
  console.log(`\n🔍 Searching LinkedIn Jobs for: "${query}" in "${location}"`);

  const input = {
    searchQueries: [`${query} ${location}`],
    maxResults: maxResults,
    proxyConfiguration: {
      useApifyProxy: true,
    },
  };

  return await runApifyActor(CONFIG.ACTORS.LINKEDIN_JOBS, input);
}

/**
 * Detect country code from location
 */
function detectCountryCode(location) {
  const locationLower = location.toLowerCase();

  const countryMappings = {
    'france': 'FR',
    'paris': 'FR',
    'lyon': 'FR',
    'marseille': 'FR',
    'united states': 'US',
    'usa': 'US',
    'new york': 'US',
    'uk': 'GB',
    'london': 'GB',
    'germany': 'DE',
    'berlin': 'DE',
    'spain': 'ES',
    'italy': 'IT',
    'canada': 'CA',
  };

  for (const [key, code] of Object.entries(countryMappings)) {
    if (locationLower.includes(key)) {
      return code;
    }
  }

  return 'FR'; // Default
}

// ========================================
// DATA PROCESSING
// ========================================

/**
 * Extract and aggregate companies from job listings
 */
function extractCompanies(jobs, source) {
  const companies = new Map();

  for (const job of jobs) {
    // Extract company name based on source
    let companyName = '';
    let jobTitle = '';
    let jobUrl = '';
    let salary = null;

    if (source === 'indeed') {
      companyName = job.company || job.companyName || '';
      jobTitle = job.positionName || job.title || '';
      jobUrl = job.url || job.externalApplyLink || '';
      salary = job.salary || null;
    } else if (source === 'linkedin') {
      companyName = job.company || job.companyName || '';
      jobTitle = job.title || job.position || '';
      jobUrl = job.url || job.jobUrl || '';
      salary = job.salary || job.salaryInfo || null;
    }

    if (!companyName) continue;

    // Normalize company name
    companyName = normalizeCompanyName(companyName);

    // Get or create company entry
    if (!companies.has(companyName)) {
      companies.set(companyName, {
        name: companyName,
        jobCount: 0,
        jobs: [],
        seniorityScore: 0,
        roleScore: 0,
        sources: new Set(),
      });
    }

    const company = companies.get(companyName);
    company.jobCount++;
    company.sources.add(source);
    company.jobs.push({
      title: jobTitle,
      url: jobUrl,
      salary: salary,
    });

    // Calculate seniority score
    const titleLower = jobTitle.toLowerCase();
    for (const [keyword, score] of Object.entries(GROWTH_SIGNALS.SENIORITY_KEYWORDS)) {
      if (titleLower.includes(keyword)) {
        company.seniorityScore += score;
        break;
      }
    }

    // Calculate role score
    for (const [keyword, score] of Object.entries(GROWTH_SIGNALS.ROLE_SIGNALS)) {
      if (titleLower.includes(keyword)) {
        company.roleScore += score;
        break;
      }
    }
  }

  return companies;
}

/**
 * Normalize company name
 */
function normalizeCompanyName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s&.-]/g, '')
    .replace(/\b(inc|ltd|llc|corp|gmbh|sarl|sas|sa)\b\.?$/i, '')
    .trim();
}

/**
 * Calculate growth score for a company
 */
function calculateGrowthScore(company) {
  let score = 0;

  // Job count score
  const jobCount = company.jobCount;
  let multiplier = 1.0;

  if (jobCount >= 21) multiplier = 3.0;
  else if (jobCount >= 11) multiplier = 2.5;
  else if (jobCount >= 6) multiplier = 2.0;
  else if (jobCount >= 3) multiplier = 1.5;

  score += GROWTH_SIGNALS.JOB_COUNT_BASE * jobCount * multiplier;

  // Seniority bonus
  score += company.seniorityScore;

  // Role bonus
  score += company.roleScore;

  // Multi-source bonus
  if (company.sources.size > 1) {
    score *= 1.2; // 20% bonus for appearing on multiple platforms
  }

  return Math.round(score);
}

/**
 * Enrich company with additional data
 */
function enrichCompany(company) {
  return {
    // Basic info
    name: company.name,
    jobCount: company.jobCount,

    // Scoring
    growthScore: calculateGrowthScore(company),
    seniorityScore: company.seniorityScore,
    roleScore: company.roleScore,

    // Growth tier
    growthTier: getGrowthTier(calculateGrowthScore(company)),

    // Job details
    topJobs: company.jobs.slice(0, 5).map(j => j.title),
    jobUrls: company.jobs.slice(0, 3).map(j => j.url).filter(u => u),

    // Sources
    sources: Array.from(company.sources),

    // Meta
    scrapedAt: new Date().toISOString(),
    source: 'job_boards_apify',
  };
}

/**
 * Get growth tier label
 */
function getGrowthTier(score) {
  if (score >= 200) return 'HYPERGROWTH';
  if (score >= 100) return 'RAPID';
  if (score >= 50) return 'GROWING';
  if (score >= 25) return 'MODERATE';
  return 'STABLE';
}

// ========================================
// OUTPUT
// ========================================

/**
 * Save results to JSON
 */
function saveToJSON(companies, filename) {
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);

  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));
  console.log(`\n📁 Saved JSON to: ${outputPath}`);

  return outputPath;
}

/**
 * Save results to CSV
 */
function saveToCSV(companies, filename) {
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);

  const headers = [
    'name', 'jobCount', 'growthScore', 'growthTier',
    'topJobs', 'sources', 'scrapedAt'
  ];

  const csvLines = [headers.join(',')];

  for (const company of companies) {
    const values = [
      `"${company.name}"`,
      company.jobCount,
      company.growthScore,
      company.growthTier,
      `"${company.topJobs.join('; ')}"`,
      `"${company.sources.join(', ')}"`,
      company.scrapedAt,
    ];
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
  console.log('HIRING COMPANIES SCRAPER (Growth Signal Detection)');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================');

  // Parse arguments
  const args = process.argv.slice(2);
  const sourceArg = args.find(a => a.startsWith('--source='));
  const queryArg = args.find(a => a.startsWith('--query='));
  const locationArg = args.find(a => a.startsWith('--location='));
  const maxArg = args.find(a => a.startsWith('--max='));
  const helpArg = args.includes('--help') || args.includes('-h');

  if (helpArg) {
    console.log(`
USAGE:
  node scrape-hiring-companies.cjs --source=indeed --query="marketing" --location="Paris"
  node scrape-hiring-companies.cjs --source=linkedin --query="developer" --location="France"
  node scrape-hiring-companies.cjs --source=both --query="sales" --location="Lyon" --max=500

OPTIONS:
  --source=SOURCE     Job board: indeed, linkedin, or both
  --query=QUERY       Job title or keyword to search
  --location=PLACE    City or country
  --max=NUMBER        Max job listings to scrape (default: 200)
  --help, -h          Show this help

ENVIRONMENT VARIABLES:
  APIFY_TOKEN         Required. Your Apify API token

BUSINESS INSIGHT:
  Hiring companies = Growing companies = Companies with budget

  Growth Tiers:
    HYPERGROWTH (200+ score) = Explosive growth
    RAPID (100-199 score)    = Fast growing
    GROWING (50-99 score)    = Steady expansion
    MODERATE (25-49 score)   = Some growth
    STABLE (0-24 score)      = Maintaining

  Score factors:
    - Job count (more jobs = more growth)
    - Senior hires (VP, Director = major budget)
    - Sales/Growth roles = expansion mode

OUTPUT:
  outputs/hiring-companies-QUERY-LOCATION-YYYY-MM-DD.json
  outputs/hiring-companies-QUERY-LOCATION-YYYY-MM-DD.csv
    `);
    process.exit(0);
  }

  // Validate arguments
  if (!queryArg || !locationArg) {
    console.error('❌ ERROR: --query and --location are required');
    console.error('   Example: node scrape-hiring-companies.cjs --source=indeed --query="marketing" --location="Paris"');
    process.exit(1);
  }

  if (!CONFIG.APIFY_TOKEN) {
    console.error('❌ ERROR: APIFY_TOKEN not set in .env');
    process.exit(1);
  }

  // Parse options
  const source = sourceArg ? sourceArg.split('=')[1] : 'indeed';
  const query = queryArg.split('=').slice(1).join('=');
  const location = locationArg.split('=').slice(1).join('=');
  const maxResults = maxArg ? parseInt(maxArg.split('=')[1]) : CONFIG.DEFAULT_MAX_RESULTS;

  try {
    let allJobs = [];
    const companiesMap = new Map();

    // Scrape based on source
    if (source === 'indeed' || source === 'both') {
      const indeedJobs = await scrapeIndeedJobs(query, location, maxResults);
      allJobs = allJobs.concat(indeedJobs);

      const indeedCompanies = extractCompanies(indeedJobs, 'indeed');
      for (const [name, data] of indeedCompanies) {
        if (companiesMap.has(name)) {
          // Merge
          const existing = companiesMap.get(name);
          existing.jobCount += data.jobCount;
          existing.jobs = existing.jobs.concat(data.jobs);
          existing.seniorityScore += data.seniorityScore;
          existing.roleScore += data.roleScore;
          data.sources.forEach(s => existing.sources.add(s));
        } else {
          companiesMap.set(name, data);
        }
      }
    }

    if (source === 'linkedin' || source === 'both') {
      const linkedinJobs = await scrapeLinkedInJobs(query, location, maxResults);
      allJobs = allJobs.concat(linkedinJobs);

      const linkedinCompanies = extractCompanies(linkedinJobs, 'linkedin');
      for (const [name, data] of linkedinCompanies) {
        if (companiesMap.has(name)) {
          const existing = companiesMap.get(name);
          existing.jobCount += data.jobCount;
          existing.jobs = existing.jobs.concat(data.jobs);
          existing.seniorityScore += data.seniorityScore;
          existing.roleScore += data.roleScore;
          data.sources.forEach(s => existing.sources.add(s));
        } else {
          companiesMap.set(name, data);
        }
      }
    }

    if (allJobs.length === 0) {
      console.log('\n⚠️ No jobs found for this search');
      process.exit(0);
    }

    // Enrich and sort companies
    console.log('\n📊 Processing companies...');
    const enrichedCompanies = Array.from(companiesMap.values())
      .map(enrichCompany)
      .sort((a, b) => b.growthScore - a.growthScore);

    // Save files
    const timestamp = new Date().toISOString().split('T')[0];
    const safeQuery = query.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const safeLocation = location.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileBase = `hiring-companies-${safeQuery}-${safeLocation}-${timestamp}`;

    saveToJSON(enrichedCompanies, `${fileBase}.json`);
    saveToCSV(enrichedCompanies, `${fileBase}.csv`);

    // Summary
    console.log('\n================================================================================');
    console.log('SCRAPE COMPLETE');
    console.log('================================================================================');
    console.log(`✅ Total jobs scraped: ${allJobs.length}`);
    console.log(`🏢 Unique companies: ${enrichedCompanies.length}`);

    // Growth tier breakdown
    const tiers = {};
    for (const c of enrichedCompanies) {
      tiers[c.growthTier] = (tiers[c.growthTier] || 0) + 1;
    }

    console.log('\n📈 Growth Tier Breakdown:');
    for (const [tier, count] of Object.entries(tiers).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${tier}: ${count} companies`);
    }

    // Top 10 companies
    console.log('\n🔥 Top 10 Fastest Growing Companies:');
    enrichedCompanies.slice(0, 10).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} - ${c.jobCount} jobs - Score: ${c.growthScore} (${c.growthTier})`);
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  scrapeIndeedJobs,
  scrapeLinkedInJobs,
  extractCompanies,
  calculateGrowthScore,
  enrichCompany,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
