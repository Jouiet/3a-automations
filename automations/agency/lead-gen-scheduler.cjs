#!/usr/bin/env node
/**
 * LEAD GENERATION SCHEDULER - 3A Automation
 *
 * Centralized scheduler for all lead generation pipelines
 * Designed to run via GitHub Actions cron
 *
 * PIPELINES:
 * 1. LinkedIn → Klaviyo (B2B professionals)
 * 2. Google Maps → Klaviyo (Local businesses)
 * 3. Newsletter (Bi-monthly content)
 *
 * SCHEDULING STRATEGY:
 * - LinkedIn: Daily at 6AM UTC (rotate through markets)
 * - Google Maps: Daily at 8AM UTC (rotate through cities)
 * - Newsletter: 1st and 15th of month at 10AM UTC
 *
 * USAGE:
 *   node lead-gen-scheduler.cjs --pipeline=linkedin --market=france
 *   node lead-gen-scheduler.cjs --pipeline=gmaps --query="consultant" --location="Paris"
 *   node lead-gen-scheduler.cjs --pipeline=newsletter --topic="automation"
 *   node lead-gen-scheduler.cjs --pipeline=all --tier=1
 *   node lead-gen-scheduler.cjs --status
 *
 * Created: 2025-12-29 | Session 114
 * Version: 1.0.0
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const path = require('path');
const fs = require('fs');

// Security utilities
const { secureRandomElement } = require('./lib/security-utils.cjs');

// Import market configuration
const { MARKETS, MARKET_GROUPS, getMarketsByPriority } = require('./config/markets.cjs');

// Import pipelines
const linkedinPipeline = require('./linkedin-to-klaviyo-pipeline.cjs');
const linkedinLeadAutomation = require('./linkedin-lead-automation.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Scheduling
  LINKEDIN_MAX_LEADS_PER_RUN: parseInt(process.env.LINKEDIN_MAX_LEADS || '25'),
  GMAPS_MAX_LEADS_PER_RUN: parseInt(process.env.GMAPS_MAX_LEADS || '50'),

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),
  LOG_FILE: path.join(__dirname, '..', '..', 'outputs', 'lead-gen-runs.json'),

  // Market rotation (which markets to run on which day of week)
  // PHASE 1 (6 mois): Maroc + MENA + Europe uniquement
  // USA/UK/Oceania = Phase 2 après stabilisation
  DAILY_ROTATION: {
    0: ['morocco', 'tunisia', 'algeria'],           // Sunday - Maghreb
    1: ['france', 'belgium', 'switzerland'],        // Monday - Francophone Europe
    2: ['united_arab_emirates', 'saudi_arabia'],    // Tuesday - Gulf
    3: ['germany', 'netherlands'],                  // Wednesday - Germanic
    4: ['spain', 'italy', 'portugal'],              // Thursday - Southern Europe
    5: ['egypt', 'morocco'],                        // Friday - MENA refresh
    6: ['france', 'united_arab_emirates'],          // Saturday - Priority markets
  },

  // Search queries for LinkedIn
  LINKEDIN_QUERIES: [
    'ecommerce director',
    'marketing manager ecommerce',
    'digital marketing director',
    'head of growth',
    'founder startup',
    'ceo ecommerce',
    'shopify expert',
    'automation consultant',
  ],

  // Search queries for Google Maps
  GMAPS_QUERIES: [
    'agence marketing digital',
    'agence ecommerce',
    'consultant shopify',
    'expert automation',
    'agence web',
    'consultant digital',
  ],
};

// ============================================================================
// LOGGING
// ============================================================================

function loadRunLog() {
  try {
    if (fs.existsSync(CONFIG.LOG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG.LOG_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load run log:', e.message);
  }
  return { runs: [] };
}

function saveRunLog(log) {
  fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(log, null, 2));
}

function logRun(pipeline, market, results) {
  const log = loadRunLog();
  log.runs.push({
    timestamp: new Date().toISOString(),
    pipeline,
    market,
    results,
  });
  // Keep last 1000 runs
  if (log.runs.length > 1000) {
    log.runs = log.runs.slice(-1000);
  }
  saveRunLog(log);
}

// ============================================================================
// PIPELINE RUNNERS
// ============================================================================

/**
 * Run LinkedIn pipeline for a specific market
 */
async function runLinkedInPipeline(marketKey, options = {}) {
  const market = MARKETS[marketKey];
  if (!market) {
    throw new Error(`Unknown market: ${marketKey}`);
  }

  console.log(`\n📋 LinkedIn Pipeline: ${market.name}`);

  // Build search query (using cryptographically secure random selection)
  const query = options.query || secureRandomElement(CONFIG.LINKEDIN_QUERIES);
  const location = options.location || market.cities[0];
  const searchQuery = `${query} ${location}`;

  console.log(`   Query: "${searchQuery}"`);
  console.log(`   Max leads: ${CONFIG.LINKEDIN_MAX_LEADS_PER_RUN}`);

  if (options.dryRun) {
    console.log('   ⚠️ DRY RUN - No actual scraping');
    return { success: true, dryRun: true, market: marketKey, query: searchQuery };
  }

  try {
    // Use the linkedin-lead-automation which has the full pipeline
    const result = await linkedinLeadAutomation.runPipeline({
      searchQuery: searchQuery,
      maxResults: CONFIG.LINKEDIN_MAX_LEADS_PER_RUN,
    });

    logRun('linkedin', marketKey, result);
    return { success: true, market: marketKey, ...result };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    logRun('linkedin', marketKey, { error: error.message });
    return { success: false, market: marketKey, error: error.message };
  }
}

/**
 * Run Google Maps pipeline for a specific location
 */
async function runGoogleMapsPipeline(query, location, options = {}) {
  console.log(`\n📍 Google Maps Pipeline: "${query}" in "${location}"`);
  console.log(`   Max results: ${CONFIG.GMAPS_MAX_LEADS_PER_RUN}`);

  if (options.dryRun) {
    console.log('   ⚠️ DRY RUN - No actual scraping');
    return { success: true, dryRun: true, query, location };
  }

  try {
    // Dynamic import to avoid loading if not needed
    const gmapsPipeline = require('./google-maps-to-klaviyo-pipeline.cjs');
    const result = await gmapsPipeline.runPipeline({
      query,
      location,
      maxResults: CONFIG.GMAPS_MAX_LEADS_PER_RUN,
    });

    logRun('gmaps', location, result);
    return { success: true, query, location, ...result };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    logRun('gmaps', location, { error: error.message });
    return { success: false, query, location, error: error.message };
  }
}

/**
 * Run Newsletter pipeline
 */
async function runNewsletterPipeline(topic, options = {}) {
  console.log(`\n📰 Newsletter Pipeline: "${topic}"`);

  if (options.dryRun) {
    console.log('   ⚠️ DRY RUN - Preview only');
  }

  try {
    const newsletterPipeline = require('./newsletter-automation.cjs');
    const result = await newsletterPipeline.runNewsletter({
      topic,
      language: options.language || 'fr',
      preview: options.dryRun || options.preview,
      send: options.send || false,
    });

    logRun('newsletter', topic, result);
    return { success: true, topic, ...result };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    logRun('newsletter', topic, { error: error.message });
    return { success: false, topic, error: error.message };
  }
}

/**
 * Run daily rotation (called by cron)
 */
async function runDailyRotation(options = {}) {
  const dayOfWeek = new Date().getDay();
  const marketsToday = CONFIG.DAILY_ROTATION[dayOfWeek] || [];

  console.log('================================================================================');
  console.log('DAILY LEAD GENERATION ROTATION');
  console.log('================================================================================');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Day: ${dayOfWeek} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]})`);
  console.log(`Markets today: ${marketsToday.join(', ')}`);
  console.log('================================================================================');

  const results = [];

  for (const marketKey of marketsToday) {
    const result = await runLinkedInPipeline(marketKey, options);
    results.push(result);

    // Rate limit between markets
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log('\n================================================================================');
  console.log('DAILY ROTATION COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Success: ${results.filter(r => r.success).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
  console.log('================================================================================');

  return results;
}

/**
 * Run all tier 1 markets
 */
async function runTier1Markets(options = {}) {
  console.log('================================================================================');
  console.log('TIER 1 MARKETS - Priority Lead Generation');
  console.log('================================================================================');

  const tier1 = MARKET_GROUPS.tier1_priority;
  console.log(`Markets: ${tier1.join(', ')}`);
  console.log('================================================================================');

  const results = [];

  for (const marketKey of tier1) {
    const result = await runLinkedInPipeline(marketKey, options);
    results.push(result);
    await new Promise(r => setTimeout(r, 5000));
  }

  return results;
}

// ============================================================================
// STATUS
// ============================================================================

async function showStatus() {
  console.log('================================================================================');
  console.log('LEAD GENERATION STATUS');
  console.log('================================================================================');

  const log = loadRunLog();
  const last10 = log.runs.slice(-10);

  console.log(`\nTotal runs logged: ${log.runs.length}`);
  console.log('\nLast 10 runs:');
  last10.forEach(run => {
    const status = run.results?.success ? '✅' : '❌';
    console.log(`  ${status} ${run.timestamp} | ${run.pipeline} | ${run.market}`);
  });

  console.log('\nMarkets configured:');
  console.log(`  Total: ${Object.keys(MARKETS).length}`);
  console.log(`  Tier 1 (Priority): ${MARKET_GROUPS.tier1_priority.join(', ')}`);
  console.log(`  Tier 2 (MENA): ${MARKET_GROUPS.tier2_mena.join(', ')}`);
  console.log(`  Phase 1 Active: ${MARKET_GROUPS.phase1_active.length} countries`);

  console.log('\nScheduling:');
  for (const [day, markets] of Object.entries(CONFIG.DAILY_ROTATION)) {
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
    console.log(`  ${dayName}: ${markets.join(', ')}`);
  }

  console.log('================================================================================');
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const helpArg = args.includes('--help') || args.includes('-h');
  const statusArg = args.includes('--status');
  const dryRunArg = args.includes('--dry-run');
  const pipelineArg = args.find(a => a.startsWith('--pipeline='));
  const marketArg = args.find(a => a.startsWith('--market='));
  const queryArg = args.find(a => a.startsWith('--query='));
  const locationArg = args.find(a => a.startsWith('--location='));
  const topicArg = args.find(a => a.startsWith('--topic='));
  const tierArg = args.find(a => a.startsWith('--tier='));

  if (helpArg) {
    console.log(`
LEAD GENERATION SCHEDULER - 3A Automation

USAGE:
  # Run LinkedIn pipeline for a market
  node lead-gen-scheduler.cjs --pipeline=linkedin --market=france

  # Run Google Maps pipeline
  node lead-gen-scheduler.cjs --pipeline=gmaps --query="consultant" --location="Paris"

  # Run Newsletter
  node lead-gen-scheduler.cjs --pipeline=newsletter --topic="automation tips"

  # Run daily rotation (for cron)
  node lead-gen-scheduler.cjs --pipeline=daily

  # Run all tier 1 markets
  node lead-gen-scheduler.cjs --pipeline=linkedin --tier=1

  # Show status
  node lead-gen-scheduler.cjs --status

  # Dry run (no actual API calls)
  node lead-gen-scheduler.cjs --pipeline=linkedin --market=france --dry-run

OPTIONS:
  --pipeline=TYPE   linkedin | gmaps | newsletter | daily | all
  --market=KEY      Market key (france, germany, united_states, etc.)
  --tier=N          Run all markets in tier N (1, 2, 3, 4)
  --query=TEXT      Search query (for LinkedIn or Google Maps)
  --location=PLACE  Location (for Google Maps)
  --topic=TEXT      Newsletter topic
  --dry-run         Test without making API calls
  --status          Show run history and configuration
  --help, -h        Show this help

MARKETS (${Object.keys(MARKETS).length} total - Phase 1: MENA + Europe):
  Tier 1: ${MARKET_GROUPS.tier1_priority.join(', ')}
  Tier 2 MENA: ${MARKET_GROUPS.tier2_mena.join(', ')}
  Phase 1 Active: ${MARKET_GROUPS.phase1_active.length} countries

SCHEDULING (GitHub Actions cron):
  LinkedIn: Daily at 6AM UTC (rotating markets)
  Google Maps: Daily at 8AM UTC (rotating cities)
  Newsletter: 1st & 15th at 10AM UTC
    `);
    process.exit(0);
  }

  if (statusArg) {
    await showStatus();
    process.exit(0);
  }

  const pipeline = pipelineArg ? pipelineArg.split('=')[1] : null;
  const market = marketArg ? marketArg.split('=')[1] : null;
  const query = queryArg ? queryArg.split('=').slice(1).join('=') : null;
  const location = locationArg ? locationArg.split('=').slice(1).join('=') : null;
  const topic = topicArg ? topicArg.split('=').slice(1).join('=') : null;
  const tier = tierArg ? parseInt(tierArg.split('=')[1]) : null;

  if (!pipeline) {
    console.error('❌ ERROR: --pipeline is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  const options = { dryRun: dryRunArg, query, location };

  try {
    switch (pipeline) {
      case 'linkedin':
        if (tier) {
          const tierMarkets = getMarketsByPriority(tier);
          console.log(`Running LinkedIn for tier ${tier} (${tierMarkets.length} markets)...`);
          for (const m of tierMarkets) {
            await runLinkedInPipeline(m.key, options);
            await new Promise(r => setTimeout(r, 5000));
          }
        } else if (market) {
          await runLinkedInPipeline(market, options);
        } else {
          console.error('❌ ERROR: --market or --tier is required for LinkedIn pipeline');
          process.exit(1);
        }
        break;

      case 'gmaps':
        if (!query || !location) {
          console.error('❌ ERROR: --query and --location are required for Google Maps pipeline');
          process.exit(1);
        }
        await runGoogleMapsPipeline(query, location, options);
        break;

      case 'newsletter':
        if (!topic) {
          console.error('❌ ERROR: --topic is required for Newsletter pipeline');
          process.exit(1);
        }
        await runNewsletterPipeline(topic, options);
        break;

      case 'daily':
        await runDailyRotation(options);
        break;

      case 'tier1':
        await runTier1Markets(options);
        break;

      default:
        console.error(`❌ ERROR: Unknown pipeline "${pipeline}"`);
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ FATAL:', error.message);
    process.exit(1);
  }
}

// Export for module usage
module.exports = {
  runLinkedInPipeline,
  runGoogleMapsPipeline,
  runNewsletterPipeline,
  runDailyRotation,
  runTier1Markets,
  showStatus,
  CONFIG,
  MARKETS,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal:', error.message);
    process.exit(1);
  });
}
