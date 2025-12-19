/**
 * MYDEALZ FACEBOOK B2C LEAD SCRAPER
 *
 * ⚠️ MyDealz = B2C (Business-to-Consumer)
 * Target: END CONSUMERS (Moms, Students, Deal Hunters, Fashion Lovers)
 * NOT: Professionals, executives, businesses
 *
 * Primary tool: Instant Data Scraper (Chrome Extension)
 * This script processes CSV exports from Instant Data Scraper
 *
 * Last Updated: 2025-12-11 (Session 101 - B2C CORRECTION)
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Process CSV export from Instant Data Scraper
 *
 * @param {string} csvPath - Path to CSV file exported from IDS
 * @param {object} metadata - Group info (name, country, segment)
 * @returns {array} Processed leads
 */
function processInstantDataScraperCSV(csvPath, metadata) {
  console.log(`\n[Facebook] Processing: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error(`  File not found: ${csvPath}`);
    return [];
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  if (lines.length < 2) {
    console.log('  Empty or invalid CSV');
    return [];
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  console.log(`  Headers: ${headers.join(', ')}`);

  // Process rows
  const leads = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const lead = {};

    headers.forEach((header, idx) => {
      lead[header] = values[idx] || '';
    });

    // Enrich with metadata and scoring
    const enrichedLead = enrichLead(lead, metadata);
    leads.push(enrichedLead);
  }

  console.log(`  Processed: ${leads.length} leads`);
  return leads;
}

/**
 * Parse CSV line handling quoted values
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
 * Enrich lead with B2C scoring and metadata
 */
function enrichLead(lead, metadata) {
  // Detect consumer segment from bio/group
  const segment = detectConsumerSegment(lead, metadata);

  // Calculate B2C lead score
  const score = calculateB2CScore(lead, metadata, segment);

  return {
    // Source info
    source_platform: 'Facebook',
    source_group: metadata.groupName || '',
    source_country: metadata.country || 'Unknown',
    source_segment: segment,

    // Profile data (from Instant Data Scraper)
    profile_id: lead.profile_id || lead.id || lead.user_id || '',
    full_name: lead.name || lead.full_name || lead.member_name || '',
    profile_url: lead.profile_url || lead.url || lead.link || '',
    bio: lead.bio || lead.about || lead.description || '',
    location: lead.location || lead.city || '',

    // Interests (detected from groups/bio)
    interests: detectInterests(lead, metadata),

    // Timestamps
    join_date: lead.join_date || lead.joined || '',
    scraped_date: new Date().toISOString(),

    // B2C Scoring
    lead_score: score,
    segment_match: segment,
    qualified: score >= 60, // B2C threshold

    // Status
    status: 'New'
  };
}

/**
 * Detect consumer segment from lead data
 */
function detectConsumerSegment(lead, metadata) {
  const bio = (lead.bio || '').toLowerCase();
  const groupName = (metadata.groupName || '').toLowerCase();

  // Priority order based on conversion rates
  if (groupName.includes('deal') || groupName.includes('coupon') ||
      groupName.includes('frugal') || groupName.includes('bargain')) {
    return 'Deal Hunter';
  }

  if (groupName.includes('mom') || groupName.includes('parent') ||
      groupName.includes('family') || bio.includes('mom') || bio.includes('mother')) {
    return 'Mom/Family';
  }

  if (groupName.includes('fashion') || groupName.includes('style') ||
      groupName.includes('clothing') || groupName.includes('outfit')) {
    return 'Fashion Lover';
  }

  if (groupName.includes('student') || groupName.includes('university') ||
      groupName.includes('college') || bio.includes('student')) {
    return 'Student';
  }

  if (groupName.includes('tech') || groupName.includes('gadget') ||
      groupName.includes('electronic')) {
    return 'Tech Consumer';
  }

  if (groupName.includes('home') || groupName.includes('decor') ||
      groupName.includes('diy')) {
    return 'Home Enthusiast';
  }

  if (groupName.includes('travel') || groupName.includes('vacation') ||
      groupName.includes('adventure')) {
    return 'Traveler';
  }

  return 'General Consumer';
}

/**
 * Detect interests from bio and group membership
 */
function detectInterests(lead, metadata) {
  const interests = [];
  const bio = (lead.bio || '').toLowerCase();
  const groupName = (metadata.groupName || '').toLowerCase();

  // Interest keywords to detect
  const interestMap = {
    'fashion': ['fashion', 'style', 'clothing', 'outfit', 'dress'],
    'tech': ['tech', 'gadget', 'electronic', 'smart home', 'gaming'],
    'deals': ['deal', 'coupon', 'discount', 'sale', 'bargain', 'saving'],
    'travel': ['travel', 'vacation', 'trip', 'adventure', 'explore'],
    'home': ['home', 'decor', 'diy', 'kitchen', 'garden'],
    'family': ['mom', 'parent', 'family', 'kids', 'children'],
    'fitness': ['fitness', 'gym', 'workout', 'health', 'yoga'],
    'outdoor': ['outdoor', 'hiking', 'camping', 'nature']
  };

  for (const [interest, keywords] of Object.entries(interestMap)) {
    if (keywords.some(k => bio.includes(k) || groupName.includes(k))) {
      interests.push(interest);
    }
  }

  return interests.join(', ') || 'general';
}

/**
 * Calculate B2C lead score (0-100)
 *
 * B2C Scoring (NOT B2B!):
 * - Location: 30 pts (shipping feasibility)
 * - Segment: 25 pts (consumer type match)
 * - Group: 25 pts (group relevance)
 * - Engagement: 20 pts (profile quality)
 */
function calculateB2CScore(lead, metadata, segment) {
  const scoring = config.leadScoring.b2c;
  let score = 0;

  // Location scoring (30 points max)
  const location = (lead.location || metadata.country || '').toLowerCase();
  if (location.includes('canada') || metadata.country === 'CA') {
    score += scoring.location['Canada'];
  } else if (location.includes('united states') || location.includes('usa') || metadata.country === 'US') {
    score += scoring.location['United States'];
  } else if (location.includes('united kingdom') || location.includes('uk') || metadata.country === 'UK') {
    score += scoring.location['United Kingdom'];
  } else if (location.includes('europe') || metadata.country === 'EU') {
    score += scoring.location['Europe'];
  } else {
    score += scoring.location['default'];
  }

  // Segment scoring (25 points max)
  if (segment === 'Deal Hunter') {
    score += scoring.segment['Deal Hunter'];
  } else if (segment === 'Mom/Family') {
    score += scoring.segment['Mom/Family'];
  } else if (segment === 'Fashion Lover') {
    score += scoring.segment['Fashion Lover'];
  } else if (segment === 'Student') {
    score += scoring.segment['Student'];
  } else if (segment === 'Tech Consumer') {
    score += scoring.segment['Tech Consumer'];
  } else {
    score += scoring.segment['default'];
  }

  // Group relevance scoring (25 points max)
  const groupPriority = metadata.priority || 'P2';
  score += scoring.groupRelevance[groupPriority] || scoring.groupRelevance['default'];

  // Engagement scoring (20 points max)
  const hasProfile = lead.profile_url || lead.url;
  const hasBio = lead.bio && lead.bio.length > 10;
  const hasLocation = lead.location;

  if (hasProfile && hasBio && hasLocation) {
    score += scoring.engagement['Profile Complete'];
  } else if (hasProfile && (hasBio || hasLocation)) {
    score += 7;
  } else {
    score += scoring.engagement['default'];
  }

  return Math.min(score, 100);
}

/**
 * Filter and qualify leads
 */
function filterQualifiedLeads(leads, minScore = 60) {
  const qualified = leads.filter(lead => lead.lead_score >= minScore);

  console.log(`\n[Filter] ${leads.length} total -> ${qualified.length} qualified (score >= ${minScore})`);

  // Breakdown by segment
  const bySegment = {};
  qualified.forEach(lead => {
    bySegment[lead.segment_match] = (bySegment[lead.segment_match] || 0) + 1;
  });

  console.log('  By Segment:');
  for (const [segment, count] of Object.entries(bySegment)) {
    console.log(`    ${segment}: ${count}`);
  }

  return qualified;
}

/**
 * Format leads for Google Sheets export
 */
function formatForSheets(leads) {
  const columns = config.sheetsConfig.b2cColumns;

  return leads.map(lead => {
    return columns.map(col => lead[col] || '');
  });
}

/**
 * Save leads to JSON backup
 */
function saveToJSON(leads, filename) {
  const filepath = path.join(__dirname, 'logs', filename);
  fs.writeFileSync(filepath, JSON.stringify(leads, null, 2));
  console.log(`\n[Save] ${leads.length} leads saved to ${filepath}`);
}

/**
 * Process multiple CSV files from a directory
 */
async function processDirectory(directory, metadata = {}) {
  console.log('='.repeat(60));
  console.log('MYDEALZ FACEBOOK B2C LEAD PROCESSOR');
  console.log('='.repeat(60));
  console.log(`Directory: ${directory}`);

  const allLeads = [];

  // Find all CSV files
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.csv'));

  if (files.length === 0) {
    console.log('\nNo CSV files found.');
    console.log('\nTo use this script:');
    console.log('1. Use Instant Data Scraper to export FB group members');
    console.log('2. Save CSV files to apify-automation/imports/');
    console.log('3. Run: node facebook-scraper.js');
    return [];
  }

  console.log(`\nFound ${files.length} CSV files`);

  for (const file of files) {
    const csvPath = path.join(directory, file);

    // Extract metadata from filename (format: GroupName_Country_Segment.csv)
    const parts = file.replace('.csv', '').split('_');
    const fileMetadata = {
      ...metadata,
      groupName: parts[0] || 'Unknown Group',
      country: parts[1] || 'CA',
      segment: parts[2] || 'General',
      priority: 'P0'
    };

    const leads = processInstantDataScraperCSV(csvPath, fileMetadata);
    allLeads.push(...leads);
  }

  // Filter qualified leads
  const qualifiedLeads = filterQualifiedLeads(allLeads, 60);

  // Format for sheets
  const sheetsData = formatForSheets(qualifiedLeads);

  // Save backups
  const timestamp = new Date().toISOString().split('T')[0];
  saveToJSON(allLeads, `facebook_raw_${timestamp}.json`);
  saveToJSON(qualifiedLeads, `facebook_qualified_${timestamp}.json`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total raw leads: ${allLeads.length}`);
  console.log(`Qualified leads (60+): ${qualifiedLeads.length}`);
  console.log(`Qualification rate: ${((qualifiedLeads.length / allLeads.length) * 100).toFixed(1)}%`);

  return {
    raw: allLeads,
    qualified: qualifiedLeads,
    sheetsData: sheetsData
  };
}

// Export functions
module.exports = {
  processInstantDataScraperCSV,
  enrichLead,
  calculateB2CScore,
  detectConsumerSegment,
  filterQualifiedLeads,
  formatForSheets,
  processDirectory
};

// Run if called directly
if (require.main === module) {
  // Default import directory
  const importDir = path.join(__dirname, 'imports');

  // Create imports directory if not exists
  if (!fs.existsSync(importDir)) {
    fs.mkdirSync(importDir, { recursive: true });
    console.log(`Created imports directory: ${importDir}`);
    console.log('\nNext steps:');
    console.log('1. Export FB group members using Instant Data Scraper');
    console.log('2. Save CSV files to: apify-automation/imports/');
    console.log('3. Name files: GroupName_Country_Segment.csv');
    console.log('   Example: CanadianMoms_CA_Mom.csv');
    console.log('4. Run: node facebook-scraper.js');
    process.exit(0);
  }

  processDirectory(importDir)
    .then(results => {
      if (results.qualified && results.qualified.length > 0) {
        console.log('\nFacebook B2C lead processing complete!');
        console.log('Ready for Google Sheets export.');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
