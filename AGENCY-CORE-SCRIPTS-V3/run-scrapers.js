/**
 * MYDEALZ B2C LEAD SCRAPER - MAIN ENTRY POINT
 *
 * ⚠️ MyDealz = B2C (Business-to-Consumer)
 * Target: END CONSUMERS (Moms, Students, Deal Hunters, Fashion Lovers)
 * NOT: Professionals, executives, businesses (B2B)
 *
 * Platform Priority:
 * 1. FACEBOOK (70%) - Primary B2C platform
 * 2. INSTAGRAM (20%) - Visual products
 * 3. TIKTOK (10%) - Young consumers
 * 4. LinkedIn (0%) - NOT FOR B2C
 *
 * Last Updated: 2025-12-11 (Session 101 - B2C CORRECTION)
 */

const facebookScraper = require('./facebook-scraper');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Store results for export
global.scrapingResults = {
  facebook: { raw: [], qualified: [], sheetsData: [] },
  instagram: { raw: [], qualified: [] },
  tiktok: { raw: [], qualified: [] },
  summary: {
    startTime: null,
    endTime: null,
    totalLeads: 0,
    qualifiedLeads: 0,
    platforms: {},
    businessModel: 'B2C'
  }
};

/**
 * Run Facebook B2C scraper (PRIMARY - 70% effort)
 *
 * Uses CSV exports from Instant Data Scraper
 */
async function runFacebookScraper() {
  console.log('\n' + '='.repeat(60));
  console.log('FACEBOOK B2C SCRAPER (PRIMARY - 70% effort)');
  console.log('='.repeat(60));
  console.log('Target: Consumers (Moms, Deal Hunters, Fashion Lovers, Students)');

  try {
    const importDir = path.join(__dirname, 'imports');

    if (!fs.existsSync(importDir)) {
      fs.mkdirSync(importDir, { recursive: true });
    }

    const csvFiles = fs.readdirSync(importDir).filter(f => f.endsWith('.csv'));

    if (csvFiles.length === 0) {
      console.log('\n[INFO] No CSV files in imports/ directory');
      console.log('\nTo scrape Facebook groups:');
      console.log('1. Install Instant Data Scraper Chrome extension');
      console.log('2. Join Facebook groups (see FACEBOOK_GROUPS_LEAD_SCRAPING_TARGETS.md)');
      console.log('3. Go to group → Members tab');
      console.log('4. Use Instant Data Scraper to export members');
      console.log('5. Save CSV to: apify-automation/imports/');
      console.log('6. Name format: GroupName_Country_Segment.csv');
      console.log('   Example: CanadianMoms_CA_Mom.csv');

      global.scrapingResults.summary.platforms.facebook = {
        raw: 0,
        qualified: 0,
        status: 'waiting_for_csv_import'
      };
      return { raw: [], qualified: [], sheetsData: [] };
    }

    const results = await facebookScraper.processDirectory(importDir);

    global.scrapingResults.facebook = results;
    global.scrapingResults.summary.platforms.facebook = {
      raw: results.raw.length,
      qualified: results.qualified.length,
      status: 'success'
    };

    return results;

  } catch (error) {
    console.error('Facebook scraper error:', error.message);
    global.scrapingResults.summary.platforms.facebook = {
      raw: 0,
      qualified: 0,
      status: 'error',
      error: error.message
    };
    return { raw: [], qualified: [], sheetsData: [] };
  }
}

/**
 * Run Instagram B2C scraper (SECONDARY - 20% effort)
 */
async function runInstagramScraper() {
  console.log('\n' + '='.repeat(60));
  console.log('INSTAGRAM B2C SCRAPER (SECONDARY - 20% effort)');
  console.log('='.repeat(60));
  console.log('Target: Fashion lovers, Style-conscious consumers');
  console.log('[INFO] Instagram scraper - implementation pending');
  console.log('[INFO] Use Apify actor: apify/instagram-hashtag-scraper');

  global.scrapingResults.summary.platforms.instagram = {
    raw: 0,
    qualified: 0,
    status: 'not_implemented'
  };

  return { raw: [], qualified: [] };
}

/**
 * Run TikTok B2C scraper (TERTIARY - 10% effort)
 */
async function runTikTokScraper() {
  console.log('\n' + '='.repeat(60));
  console.log('TIKTOK B2C SCRAPER (TERTIARY - 10% effort)');
  console.log('='.repeat(60));
  console.log('Target: Gen Z and young millennials');
  console.log('[INFO] TikTok scraper - implementation pending');
  console.log('[INFO] Use Apify actor: clockworks/tiktok-scraper');

  global.scrapingResults.summary.platforms.tiktok = {
    raw: 0,
    qualified: 0,
    status: 'not_implemented'
  };

  return { raw: [], qualified: [] };
}

/**
 * LinkedIn scraper - NOT RECOMMENDED FOR B2C
 */
async function runLinkedInScraper() {
  console.log('\n' + '='.repeat(60));
  console.log('LINKEDIN SCRAPER - NOT RECOMMENDED');
  console.log('='.repeat(60));
  console.log('⚠️ WARNING: MyDealz is B2C (Business-to-Consumer)');
  console.log('⚠️ LinkedIn is a B2B platform - NOT suitable for B2C lead gen');
  console.log('⚠️ Use Facebook/Instagram/TikTok instead');
  console.log('\nSkipping LinkedIn scraper...');

  global.scrapingResults.summary.platforms.linkedin = {
    raw: 0,
    qualified: 0,
    status: 'skipped_b2b_not_for_b2c'
  };

  return { raw: [], qualified: [] };
}

/**
 * Generate summary report
 */
function generateSummary() {
  const summary = global.scrapingResults.summary;
  summary.endTime = new Date().toISOString();

  // Calculate totals
  let totalRaw = 0;
  let totalQualified = 0;

  for (const platform of Object.keys(summary.platforms)) {
    totalRaw += summary.platforms[platform].raw || 0;
    totalQualified += summary.platforms[platform].qualified || 0;
  }

  summary.totalLeads = totalRaw;
  summary.qualifiedLeads = totalQualified;

  // Log summary
  console.log('\n' + '='.repeat(60));
  console.log('B2C SCRAPING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Business Model: B2C (Business-to-Consumer)`);
  console.log(`Start: ${summary.startTime}`);
  console.log(`End: ${summary.endTime}`);

  console.log(`\nPlatform Priority (B2C):`);
  console.log(`  1. FACEBOOK (70%) - Primary for B2C consumers`);
  console.log(`  2. INSTAGRAM (20%) - Visual/fashion consumers`);
  console.log(`  3. TIKTOK (10%) - Young consumers`);
  console.log(`  4. LinkedIn (0%) - NOT FOR B2C`);

  console.log(`\nResults by Platform:`);
  for (const [platform, stats] of Object.entries(summary.platforms)) {
    console.log(`  ${platform.toUpperCase()}:`);
    console.log(`    Raw: ${stats.raw}`);
    console.log(`    Qualified: ${stats.qualified}`);
    console.log(`    Status: ${stats.status}`);
  }

  console.log(`\nTOTAL:`);
  console.log(`  Raw Leads: ${totalRaw}`);
  console.log(`  Qualified Leads: ${totalQualified}`);

  // Save summary to file
  const timestamp = new Date().toISOString().split('T')[0];
  const summaryPath = path.join(__dirname, 'logs', `b2c_scraping_summary_${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(global.scrapingResults, null, 2));
  console.log(`\nSummary saved to: ${summaryPath}`);

  return summary;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('MYDEALZ B2C LEAD SCRAPER');
  console.log('='.repeat(60));
  console.log('\n⚠️ BUSINESS MODEL: B2C (Business-to-Consumer)');
  console.log('Target: End consumers who buy for PERSONAL use');
  console.log('NOT: Businesses, professionals, B2B leads\n');

  global.scrapingResults.summary.startTime = new Date().toISOString();
  global.scrapingResults.summary.businessModel = 'B2C';

  // Determine which platforms to scrape
  const platforms = (process.env.SCRAPE_PLATFORMS || 'facebook').split(',');

  console.log(`Platforms requested: ${platforms.join(', ')}`);

  // Validate B2C platforms
  const b2cPlatforms = ['facebook', 'instagram', 'tiktok'];
  const validPlatforms = platforms.filter(p => {
    const platform = p.trim().toLowerCase();
    if (platform === 'linkedin') {
      console.log(`\n⚠️ Skipping LinkedIn - NOT suitable for B2C`);
      return false;
    }
    return b2cPlatforms.includes(platform);
  });

  // Run scrapers based on B2C priority
  for (const platform of validPlatforms) {
    switch (platform.trim().toLowerCase()) {
      case 'facebook':
        await runFacebookScraper();
        break;
      case 'instagram':
        await runInstagramScraper();
        break;
      case 'tiktok':
        await runTikTokScraper();
        break;
    }
  }

  // If LinkedIn was requested, show warning
  if (platforms.includes('linkedin')) {
    await runLinkedInScraper();
  }

  // Generate and display summary
  const summary = generateSummary();

  console.log('\n' + '='.repeat(60));
  console.log('B2C SCRAPING COMPLETE');
  console.log('='.repeat(60));

  return global.scrapingResults;
}

// Export for use by export-to-sheets.js
module.exports = { main, scrapingResults: global.scrapingResults };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\nAll B2C scrapers finished!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
