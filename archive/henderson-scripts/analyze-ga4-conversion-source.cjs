#!/usr/bin/env node
/**
 * ANALYZE GA4 CONVERSION SOURCE - $309 Sale
 *
 * CRITICAL: Cette vente est la SEULE conversion réelle à ce jour.
 * Identifier la source = comprendre quel canal fonctionne.
 *
 * Date transaction: 15 Nov 2025, 16:41 PST
 * Order ID: #1001
 * Revenue: $309.00
 * Product: Beginner Confidence Builder (Bundle)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const GA4_PROPERTY_ID = '465925975'; // G-HFRWK3TR61
const TRANSACTION_DATE = '2025-11-15';
const TRANSACTION_ID = '1001'; // or order name from Shopify
const TRANSACTION_REVENUE = 309.00;

console.log('='.repeat(80));
console.log('🔍 GA4 CONVERSION SOURCE ANALYSIS - $309 Sale');
console.log('='.repeat(80));
console.log('');
console.log('Transaction Details:');
console.log('  Date:       ', TRANSACTION_DATE, '16:41 PST');
console.log('  Order ID:   ', TRANSACTION_ID);
console.log('  Revenue:    $', TRANSACTION_REVENUE);
console.log('  Product:    ', 'Beginner Confidence Builder (Bundle)');
console.log('');
console.log('='.repeat(80));
console.log('');

/**
 * REQUIREMENTS TO RUN:
 *
 * 1. Google Analytics Data API credentials required
 * 2. Service account key JSON file
 * 3. Property ID: 465925975
 *
 * MANUAL ALTERNATIVE (if API access not available):
 *
 * 1. Go to: https://analytics.google.com/
 * 2. Select Property: Henderson Shop (G-HFRWK3TR61)
 * 3. Navigate: Reports > Monetization > Ecommerce purchases
 * 4. Filter by date: November 15, 2025
 * 5. Look for transaction with revenue = $309.00
 * 6. Check dimensions:
 *    - Source/Medium (where did traffic come from?)
 *    - Campaign (if from paid ads)
 *    - Landing page (first page visited)
 *    - Device category (mobile/desktop)
 *    - Country/City
 *
 * KEY QUESTIONS TO ANSWER:
 * - Organic search? (google/organic)
 * - Direct traffic? (direct/none)
 * - Paid ads? (google/cpc, facebook/cpc)
 * - Referral? (another site)
 * - Social? (instagram/social, tiktok/social)
 */

console.log('⚠️  MANUAL ANALYSIS REQUIRED');
console.log('');
console.log('This script provides the framework for GA4 analysis.');
console.log('To get actual data, you need to:');
console.log('');
console.log('OPTION 1: Manual GA4 Dashboard');
console.log('  1. Visit: https://analytics.google.com/');
console.log('  2. Property: Henderson Shop (G-HFRWK3TR61)');
console.log('  3. Date filter: November 15, 2025');
console.log('  4. Find $309 transaction');
console.log('  5. Check Source/Medium');
console.log('');
console.log('OPTION 2: Google Analytics Data API');
console.log('  Requirements:');
console.log('  - Service account credentials');
console.log('  - @google-analytics/data npm package');
console.log('  - Property access permissions');
console.log('');
console.log('CRITICAL DATA POINTS TO EXTRACT:');
console.log('  □ Source (google, facebook, direct, etc.)');
console.log('  □ Medium (organic, cpc, referral, social, etc.)');
console.log('  □ Campaign name (if applicable)');
console.log('  □ Landing page URL');
console.log('  □ Device (mobile/desktop/tablet)');
console.log('  □ Location (country, city)');
console.log('  □ Session duration before purchase');
console.log('  □ Pages viewed before checkout');
console.log('');
console.log('='.repeat(80));
console.log('WHY THIS MATTERS:');
console.log('='.repeat(80));
console.log('');
console.log('Cette vente = SEULE conversion à ce jour.');
console.log('');
console.log('Si source = Organic Search → Investir dans SEO');
console.log('Si source = Direct → Comprendre comment customer a découvert site');
console.log('Si source = Paid Ads → Scaler ce canal');
console.log('Si source = Social → Doubler efforts social media');
console.log('Si source = Referral → Identifier partenaire & amplifier');
console.log('');
console.log('Sans cette donnée = Marketing à l\'aveugle.');
console.log('Avec cette donnée = Roadmap marketing data-driven.');
console.log('');

// Placeholder for actual API implementation
async function analyzeGA4Transaction() {
  console.log('📊 ATTEMPTING GA4 API ACCESS...');
  console.log('');

  try {
    // Check if we have GA4 credentials
    const hasCredentials = process.env.GA4_SERVICE_ACCOUNT_KEY ||
                          process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!hasCredentials) {
      console.log('❌ No GA4 API credentials found in .env.local');
      console.log('');
      console.log('To enable API access, add to .env.local:');
      console.log('  GA4_SERVICE_ACCOUNT_KEY=path/to/service-account.json');
      console.log('');
      console.log('OR use manual dashboard method above.');
      console.log('');
      return;
    }

    // If we get here, try to load GA4 package
    let BetaAnalyticsDataClient;
    try {
      ({ BetaAnalyticsDataClient } = require('@google-analytics/data'));
    } catch (e) {
      console.log('❌ Package @google-analytics/data not installed');
      console.log('');
      console.log('To install:');
      console.log('  npm install @google-analytics/data');
      console.log('');
      return;
    }

    // Initialize client
    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: process.env.GA4_SERVICE_ACCOUNT_KEY ||
                   process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    console.log('✅ GA4 client initialized');
    console.log('');

    // Query for transaction on Nov 15, 2025
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: TRANSACTION_DATE,
          endDate: TRANSACTION_DATE,
        },
      ],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' },
        { name: 'landingPage' },
        { name: 'deviceCategory' },
        { name: 'country' },
        { name: 'city' },
      ],
      metrics: [
        { name: 'purchaseRevenue' },
        { name: 'transactions' },
        { name: 'itemsViewed' },
        { name: 'sessionsWithEvent' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'purchaseRevenue',
          numericFilter: {
            operation: 'GREATER_THAN',
            value: { doubleValue: 300 }
          }
        }
      }
    });

    console.log('='.repeat(80));
    console.log('📊 GA4 DATA RETRIEVED');
    console.log('='.repeat(80));
    console.log('');

    if (!response.rows || response.rows.length === 0) {
      console.log('⚠️  No transactions found for November 15, 2025');
      console.log('');
      console.log('Possible reasons:');
      console.log('  1. GA4 tracking not active on that date');
      console.log('  2. Transaction not tracked in GA4');
      console.log('  3. Ecommerce events not configured');
      console.log('');
      return;
    }

    // Display results
    response.rows.forEach((row, index) => {
      console.log(`TRANSACTION #${index + 1}:`);
      console.log('  Source:       ', row.dimensionValues[0].value);
      console.log('  Medium:       ', row.dimensionValues[1].value);
      console.log('  Campaign:     ', row.dimensionValues[2].value);
      console.log('  Landing Page: ', row.dimensionValues[3].value);
      console.log('  Device:       ', row.dimensionValues[4].value);
      console.log('  Country:      ', row.dimensionValues[5].value);
      console.log('  City:         ', row.dimensionValues[6].value);
      console.log('  Revenue:      $', row.metricValues[0].value);
      console.log('  Transactions: ', row.metricValues[1].value);
      console.log('');
    });

    // Analysis
    const transaction = response.rows[0];
    const source = transaction.dimensionValues[0].value;
    const medium = transaction.dimensionValues[1].value;

    console.log('='.repeat(80));
    console.log('🎯 MARKETING RECOMMENDATION');
    console.log('='.repeat(80));
    console.log('');

    const channel = `${source}/${medium}`;

    if (medium === 'organic') {
      console.log('✅ ORGANIC SEARCH CONVERSION');
      console.log('');
      console.log('Action plan:');
      console.log('  1. Double down on SEO');
      console.log('  2. Identify converting keywords in GSC');
      console.log('  3. Create more content targeting similar keywords');
      console.log('  4. Optimize product pages for organic search');
    } else if (medium === 'cpc' || medium === 'ppc') {
      console.log('✅ PAID ADVERTISING CONVERSION');
      console.log('');
      console.log('Action plan:');
      console.log('  1. Scale winning campaign:', transaction.dimensionValues[2].value);
      console.log('  2. Analyze ad creative & targeting');
      console.log('  3. Increase budget on this channel');
      console.log('  4. Create lookalike audiences');
    } else if (medium === 'referral') {
      console.log('✅ REFERRAL TRAFFIC CONVERSION');
      console.log('');
      console.log('Action plan:');
      console.log('  1. Identify referring site:', source);
      console.log('  2. Build partnership with this site');
      console.log('  3. Seek more similar referral sources');
      console.log('  4. Consider affiliate program');
    } else if (medium === 'social') {
      console.log('✅ SOCIAL MEDIA CONVERSION');
      console.log('');
      console.log('Action plan:');
      console.log('  1. Amplify efforts on', source);
      console.log('  2. Analyze winning post/content type');
      console.log('  3. Increase posting frequency');
      console.log('  4. Consider paid social ads');
    } else if (source === 'direct' || medium === 'none') {
      console.log('⚠️  DIRECT TRAFFIC CONVERSION');
      console.log('');
      console.log('Direct traffic often means:');
      console.log('  - Customer typed URL directly');
      console.log('  - Bookmark/saved link');
      console.log('  - Email (if not tracked)');
      console.log('  - Dark social (untracked messaging apps)');
      console.log('');
      console.log('Action plan:');
      console.log('  1. Investigate how customer discovered site');
      console.log('  2. Check if email campaigns are tracked');
      console.log('  3. Add UTM parameters to all marketing');
      console.log('  4. Survey customer about discovery method');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error accessing GA4:', error.message);
    console.log('');
    console.log('Fallback to manual dashboard analysis.');
    console.log('');
  }
}

// Run analysis
analyzeGA4Transaction()
  .then(() => {
    console.log('='.repeat(80));
    console.log('Analysis complete.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Document findings in marketing strategy doc');
    console.log('  2. Allocate budget to winning channel');
    console.log('  3. Set up tracking for all future campaigns');
    console.log('  4. Create attribution model for multi-touch');
    console.log('');
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
