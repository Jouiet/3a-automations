#!/usr/bin/env node
/**
 * GOOGLE MAPS → KLAVIYO PIPELINE
 *
 * Complete B2B local lead generation workflow:
 * 1. Scrape Google Maps businesses (Apify)
 * 2. Intelligent segmentation by business category
 * 3. Push to Klaviyo with rich properties
 * 4. Send personalized emails per segment
 *
 * USAGE:
 *   node google-maps-to-klaviyo-pipeline.cjs --query="plombier" --location="Paris" --max=50
 *   node google-maps-to-klaviyo-pipeline.cjs --input=businesses.json
 *   node google-maps-to-klaviyo-pipeline.cjs --test  (dry run with mock data)
 *
 * SEGMENTS (adapted for local businesses):
 *   decision_maker - Service professionals (consultant, avocat, expert-comptable)
 *   marketing      - Agencies (marketing, pub, communication)
 *   sales          - Commercial services (distribution, grossiste)
 *   tech           - Tech services (informatique, web, IT)
 *   hr             - HR services (recrutement, interim)
 *   other          - Local businesses (restaurant, plombier, artisan...)
 *
 * OUTPUT:
 *   - Profiles in Klaviyo with segment property
 *   - Segment-specific lists
 *   - Event "Google Maps Lead Captured"
 *   - Personalized email content stored as properties
 *
 * Created: 2025-12-29 | Session 113
 * Category: B2B Local Lead Generation Pipeline
 * Reusable: YES - Core agency workflow
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');

// Import Google Maps scraper module
const googleMapsScraper = require('../generic/scrape-google-maps-businesses.cjs');

// Import shared B2B email templates
const {
  EMAIL_TEMPLATES,
  SEGMENT_KEYWORDS,
  SEGMENT_LISTS,
  detectSegment: detectSegmentByTitle,
  personalizeEmail,
  getSegmentDisplayName,
  validateAllTemplates,
} = require('./templates/b2b-email-templates.cjs');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Klaviyo
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY,
  KLAVIYO_API_URL: 'https://a.klaviyo.com/api',
  KLAVIYO_REVISION: '2024-02-15',

  // Apify
  APIFY_TOKEN: process.env.APIFY_TOKEN,

  // Lists per segment (auto-created if don't exist)
  GOOGLE_MAPS_LISTS: {
    decision_maker: 'Google Maps - Decision Makers',
    marketing: 'Google Maps - Marketing',
    sales: 'Google Maps - Sales',
    tech: 'Google Maps - Tech',
    hr: 'Google Maps - HR',
    other: 'Google Maps - Local Businesses',
  },

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),

  // Rate limiting
  DELAY_BETWEEN_PROFILES: 200, // ms
};

// ========================================
// SEGMENTATION FOR LOCAL BUSINESSES
// ========================================

/**
 * Business category keywords for segment detection
 * Maps Google Maps categories to B2B segments
 */
const CATEGORY_SEGMENTS = {
  decision_maker: [
    'consultant', 'consulting', 'conseil',
    'avocat', 'cabinet juridique', 'notaire',
    'expert-comptable', 'comptable', 'audit', 'finance',
    'architecte', 'bureau d\'études',
    'coach', 'formation', 'training',
    'médecin', 'clinique', 'cabinet médical',
    'dentiste', 'dermatologue', 'ophtalmologue',
    'vétérinaire', 'kinésithérapeute',
  ],

  marketing: [
    'agence marketing', 'agence de communication',
    'agence web', 'agence digitale', 'agence pub',
    'studio créatif', 'graphiste', 'design',
    'photographe', 'vidéaste', 'production',
    'event', 'événementiel',
    'social media', 'influence',
  ],

  sales: [
    'commercial', 'distribution', 'grossiste',
    'import-export', 'négoce',
    'courtier', 'agent immobilier', 'immobilier',
    'concessionnaire', 'vendeur',
  ],

  tech: [
    'informatique', 'it', 'software',
    'développeur', 'développement web',
    'agence web', 'digital',
    'saas', 'startup tech',
    'réparation ordinateur', 'dépannage informatique',
    'télécommunications', 'telecom',
    'data center', 'hébergement',
  ],

  hr: [
    'recrutement', 'cabinet de recrutement',
    'intérim', 'agence d\'intérim',
    'ressources humaines', 'rh',
    'formation professionnelle',
    'travail temporaire',
  ],
};

/**
 * Segment a business based on category
 * @param {Object} business - Normalized business data
 * @returns {string} - Segment key
 */
function detectSegmentByCategory(business) {
  const searchText = [
    business.category,
    business.name,
    ...(business.subcategories || []),
  ].join(' ').toLowerCase();

  // Check each segment
  for (const [segment, keywords] of Object.entries(CATEGORY_SEGMENTS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return segment;
      }
    }
  }

  // Default for local businesses
  return 'other';
}

// ========================================
// KLAVIYO API
// ========================================

/**
 * Make Klaviyo API request
 */
async function klaviyoRequest(endpoint, method = 'GET', body = null) {
  const url = `${CONFIG.KLAVIYO_API_URL}${endpoint}`;
  const headers = {
    'Authorization': `Klaviyo-API-Key ${CONFIG.KLAVIYO_API_KEY}`,
    'revision': CONFIG.KLAVIYO_REVISION,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Klaviyo API error: ${response.status} - ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Get or create a Klaviyo list by name
 */
async function getOrCreateList(listName) {
  // First, try to find existing list
  const listsResponse = await klaviyoRequest('/lists');
  const existingList = listsResponse?.data?.find(l => l.attributes.name === listName);

  if (existingList) {
    return existingList.id;
  }

  // Create new list
  const createResponse = await klaviyoRequest('/lists', 'POST', {
    data: {
      type: 'list',
      attributes: { name: listName },
    },
  });

  return createResponse.data.id;
}

/**
 * Create or update a profile in Klaviyo
 */
async function createOrUpdateProfile(business, segment, emailContent) {
  // Extract contact info
  const email = business.email || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@contact-pending.local`;
  const firstName = extractFirstName(business.name);

  const profileData = {
    data: {
      type: 'profile',
      attributes: {
        email: email,
        phone_number: business.phone || undefined,
        first_name: firstName,
        last_name: '',
        organization: business.name,
        location: {
          address1: business.address,
          city: business.city,
          zip: business.postalCode,
          country: business.country,
        },
        properties: {
          // Source
          source: 'google_maps_scraper',
          scraped_at: business.scrapedAt,

          // Segment
          segment: segment,
          segment_display: getSegmentDisplayName(segment),

          // Business info
          business_name: business.name,
          business_category: business.category,
          business_subcategories: (business.subcategories || []).join(', '),
          website: business.website,
          google_maps_url: business.googleMapsUrl,
          place_id: business.placeId,

          // Metrics
          rating: business.rating,
          review_count: business.reviewCount,
          data_quality: business.dataQuality,

          // Personalized email (ready for flows)
          email_subject: emailContent.subject,
          email_body: emailContent.body,

          // Pipeline metadata
          pipeline: 'google-maps-to-klaviyo',
          pipeline_version: '1.0',
          processed_at: new Date().toISOString(),
        },
      },
    },
  };

  const response = await klaviyoRequest('/profiles', 'POST', profileData);
  return response?.data?.id;
}

/**
 * Add profile to segment-specific list
 */
async function addToList(profileId, listId) {
  await klaviyoRequest(`/lists/${listId}/relationships/profiles`, 'POST', {
    data: [{ type: 'profile', id: profileId }],
  });
}

/**
 * Track event for Klaviyo flows
 */
async function trackEvent(email, eventName, properties) {
  await klaviyoRequest('/events', 'POST', {
    data: {
      type: 'event',
      attributes: {
        profile: { email },
        metric: { name: eventName },
        properties: properties,
        time: new Date().toISOString(),
      },
    },
  });
}

/**
 * Extract a reasonable first name from business name
 */
function extractFirstName(businessName) {
  // For businesses, use first word or generic greeting
  const words = businessName.split(' ').filter(w => w.length > 2);
  if (words.length > 0 && words[0].length <= 15) {
    return words[0];
  }
  return 'Responsable';
}

// ========================================
// PIPELINE PROCESSING
// ========================================

/**
 * Process a single business through the pipeline
 */
async function processBusiness(business, isDryRun = false) {
  // Skip if no email and no website (low quality lead)
  if (!business.email && !business.website && business.dataQuality < 40) {
    return { skipped: true, reason: 'low_quality', dataQuality: business.dataQuality };
  }

  // Detect segment
  const segment = detectSegmentByCategory(business);

  // Get personalized email template
  const template = EMAIL_TEMPLATES[segment] || EMAIL_TEMPLATES.other;
  const leadData = {
    first_name: extractFirstName(business.name),
    company: business.name,
    email: business.email,
    website: business.website,
  };
  const emailContent = personalizeEmail(template, leadData);

  if (isDryRun) {
    return {
      success: true,
      isDryRun: true,
      business: business.name,
      segment,
      segmentDisplay: getSegmentDisplayName(segment),
      emailSubject: emailContent.subject,
    };
  }

  // Create/update Klaviyo profile
  const profileId = await createOrUpdateProfile(business, segment, emailContent);

  // Add to segment-specific list
  const listName = CONFIG.GOOGLE_MAPS_LISTS[segment];
  const listId = await getOrCreateList(listName);
  await addToList(profileId, listId);

  // Track event
  await trackEvent(business.email || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@contact-pending.local`, `googlemaps_qualified_${segment}`, {
    business_name: business.name,
    category: business.category,
    segment: segment,
    rating: business.rating,
    review_count: business.reviewCount,
  });

  return {
    success: true,
    profileId,
    listName,
    segment,
    segmentDisplay: getSegmentDisplayName(segment),
    business: business.name,
  };
}

/**
 * Process batch of businesses
 */
async function processBusinessBatch(businesses, isDryRun = false) {
  const results = {
    total: businesses.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    bySegment: {},
  };

  console.log(`\n📊 Processing ${businesses.length} businesses...`);

  for (const business of businesses) {
    try {
      const result = await processBusiness(business, isDryRun);

      if (result.skipped) {
        results.skipped++;
        console.log(`   ⏭️  Skipped: ${business.name} (${result.reason})`);
      } else if (result.success) {
        results.processed++;
        const segment = result.segment;
        results.bySegment[segment] = (results.bySegment[segment] || 0) + 1;

        if (isDryRun) {
          console.log(`   📋 ${business.name} → ${result.segmentDisplay}`);
          console.log(`      Subject: ${result.emailSubject}`);
        } else {
          console.log(`   ✅ ${business.name} → ${result.segmentDisplay} (${result.listName})`);
        }
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_PROFILES));

    } catch (error) {
      results.failed++;
      console.log(`   ❌ ${business.name}: ${error.message}`);
    }
  }

  return results;
}

// ========================================
// MOCK DATA FOR TESTING
// ========================================

function generateMockBusinesses() {
  return [
    {
      name: 'Cabinet Martin & Associés',
      category: 'Expert-comptable',
      subcategories: ['Comptable', 'Audit'],
      phone: '+33145678901',
      email: 'contact@martin-associes.fr',
      website: 'https://www.martin-associes.fr',
      address: '45 Rue de la Pompe',
      city: 'Paris',
      postalCode: '75016',
      country: 'FR',
      rating: 4.7,
      reviewCount: 89,
      dataQuality: 95,
      googleMapsUrl: 'https://maps.google.com/...',
      placeId: 'ChIJ_mock1',
      scrapedAt: new Date().toISOString(),
    },
    {
      name: 'Agence WebFlow Digital',
      category: 'Agence web',
      subcategories: ['Marketing digital', 'Création site web'],
      phone: '+33156781234',
      email: 'hello@webflow-digital.fr',
      website: 'https://webflow-digital.fr',
      address: '12 Rue du Commerce',
      city: 'Lyon',
      postalCode: '69002',
      country: 'FR',
      rating: 4.9,
      reviewCount: 156,
      dataQuality: 100,
      googleMapsUrl: 'https://maps.google.com/...',
      placeId: 'ChIJ_mock2',
      scrapedAt: new Date().toISOString(),
    },
    {
      name: 'Maître Dupont Avocat',
      category: 'Avocat',
      subcategories: ['Droit des affaires', 'Droit commercial'],
      phone: '+33178904567',
      email: 'contact@dupont-avocat.fr',
      website: 'https://dupont-avocat.fr',
      address: '8 Place de la Bourse',
      city: 'Bordeaux',
      postalCode: '33000',
      country: 'FR',
      rating: 4.8,
      reviewCount: 67,
      dataQuality: 90,
      googleMapsUrl: 'https://maps.google.com/...',
      placeId: 'ChIJ_mock3',
      scrapedAt: new Date().toISOString(),
    },
    {
      name: 'Restaurant Le Petit Jardin',
      category: 'Restaurant',
      subcategories: ['Restaurant français', 'Gastronomie'],
      phone: '+33156789012',
      email: null,
      website: 'https://lepetitjardin.fr',
      address: '23 Rue Mouffetard',
      city: 'Paris',
      postalCode: '75005',
      country: 'FR',
      rating: 4.5,
      reviewCount: 412,
      dataQuality: 75,
      googleMapsUrl: 'https://maps.google.com/...',
      placeId: 'ChIJ_mock4',
      scrapedAt: new Date().toISOString(),
    },
    {
      name: 'TechRepair Pro',
      category: 'Réparation ordinateur',
      subcategories: ['Dépannage informatique', 'IT Support'],
      phone: '+33678901234',
      email: 'support@techrepairpro.fr',
      website: 'https://techrepairpro.fr',
      address: '67 Avenue Gambetta',
      city: 'Marseille',
      postalCode: '13001',
      country: 'FR',
      rating: 4.6,
      reviewCount: 234,
      dataQuality: 95,
      googleMapsUrl: 'https://maps.google.com/...',
      placeId: 'ChIJ_mock5',
      scrapedAt: new Date().toISOString(),
    },
    {
      name: 'Talents RH Conseil',
      category: 'Cabinet de recrutement',
      subcategories: ['Recrutement', 'RH', 'Conseil'],
      phone: '+33145901234',
      email: 'contact@talents-rh.fr',
      website: 'https://talents-rh-conseil.fr',
      address: '15 Boulevard Haussmann',
      city: 'Paris',
      postalCode: '75009',
      country: 'FR',
      rating: 4.4,
      reviewCount: 45,
      dataQuality: 90,
      googleMapsUrl: 'https://maps.google.com/...',
      placeId: 'ChIJ_mock6',
      scrapedAt: new Date().toISOString(),
    },
  ];
}

// ========================================
// MAIN
// ========================================

async function main() {
  console.log('================================================================================');
  console.log('GOOGLE MAPS → KLAVIYO PIPELINE');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================');

  // Parse arguments
  const args = process.argv.slice(2);
  const queryArg = args.find(a => a.startsWith('--query='));
  const locationArg = args.find(a => a.startsWith('--location='));
  const maxArg = args.find(a => a.startsWith('--max='));
  const inputArg = args.find(a => a.startsWith('--input='));
  const testMode = args.includes('--test');
  const helpArg = args.includes('--help') || args.includes('-h');

  if (helpArg) {
    console.log(`
USAGE:
  node google-maps-to-klaviyo-pipeline.cjs --query="plombier" --location="Paris"
  node google-maps-to-klaviyo-pipeline.cjs --query="avocat" --location="Lyon" --max=100
  node google-maps-to-klaviyo-pipeline.cjs --input=businesses.json
  node google-maps-to-klaviyo-pipeline.cjs --test  (dry run with mock data)

OPTIONS:
  --query=QUERY       Business type to search (e.g., "plombier", "avocat")
  --location=PLACE    City or area to search (e.g., "Paris", "Lyon")
  --max=NUMBER        Maximum businesses to scrape (default: 50)
  --input=FILE        JSON file with pre-scraped businesses
  --test              Dry run with mock data (no API calls)
  --help, -h          Show this help

SEGMENTS:
  decision_maker   Service professionals (consultant, avocat, expert-comptable)
  marketing        Agencies (marketing, pub, communication)
  sales            Commercial services (distribution, grossiste)
  tech             Tech services (informatique, web, IT)
  hr               HR services (recrutement, interim)
  other            Local businesses (restaurant, plombier, artisan...)

ENVIRONMENT VARIABLES:
  KLAVIYO_API_KEY    Required for Klaviyo integration
  APIFY_TOKEN        Required for Google Maps scraping

OUTPUT:
  - Profiles synced to Klaviyo with segment properties
  - Added to segment-specific lists
  - Events triggered for automation flows
    `);
    process.exit(0);
  }

  // Validate branding
  console.log('\n🔍 Validating email branding...');
  const brandingValid = validateAllTemplates();
  if (!brandingValid) {
    console.error('❌ Branding validation failed');
    process.exit(1);
  }
  console.log('✅ Email branding validated');

  let businesses = [];

  // Test mode with mock data
  if (testMode) {
    console.log('\n🧪 TEST MODE - Using mock data');
    businesses = generateMockBusinesses();
  }
  // Load from input file
  else if (inputArg) {
    const inputPath = inputArg.split('=').slice(1).join('=');
    console.log(`\n📂 Loading from: ${inputPath}`);

    if (!fs.existsSync(inputPath)) {
      console.error(`❌ File not found: ${inputPath}`);
      process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    businesses = Array.isArray(rawData) ? rawData : rawData.businesses || rawData.data || [];
  }
  // Scrape from Google Maps
  else if (queryArg && locationArg) {
    // Validate APIs
    if (!CONFIG.APIFY_TOKEN) {
      console.error('❌ APIFY_TOKEN not set in .env');
      process.exit(1);
    }
    if (!CONFIG.KLAVIYO_API_KEY) {
      console.error('❌ KLAVIYO_API_KEY not set in .env');
      process.exit(1);
    }

    const query = queryArg.split('=').slice(1).join('=');
    const location = locationArg.split('=').slice(1).join('=');
    const maxResults = maxArg ? parseInt(maxArg.split('=')[1]) : 50;

    console.log(`\n📍 Scraping Google Maps: "${query}" in "${location}" (max: ${maxResults})`);

    const rawResults = await googleMapsScraper.scrapeGoogleMapsBusinesses(query, location, { maxResults });

    if (rawResults.length === 0) {
      console.log('⚠️ No businesses found');
      process.exit(0);
    }

    // Normalize
    businesses = rawResults.map(googleMapsScraper.normalizeBusiness);
    businesses = googleMapsScraper.deduplicateBusinesses(businesses);

    // Save raw data
    const timestamp = new Date().toISOString().split('T')[0];
    const safeQuery = query.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const safeLocation = location.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const outputPath = path.join(CONFIG.OUTPUT_DIR, `gmaps-pipeline-${safeQuery}-${safeLocation}-${timestamp}.json`);

    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(businesses, null, 2));
    console.log(`📁 Saved raw data: ${outputPath}`);
  }
  else {
    console.error('❌ Missing required arguments. Use --help for usage.');
    process.exit(1);
  }

  // Validate Klaviyo API for non-test mode
  if (!testMode && !CONFIG.KLAVIYO_API_KEY) {
    console.error('❌ KLAVIYO_API_KEY not set in .env');
    process.exit(1);
  }

  // Process through pipeline
  const results = await processBusinessBatch(businesses, testMode);

  // Summary
  console.log('\n================================================================================');
  console.log('PIPELINE COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Processed: ${results.processed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('\n📊 By segment:');
  for (const [segment, count] of Object.entries(results.bySegment)) {
    console.log(`   ${getSegmentDisplayName(segment)}: ${count}`);
  }

  if (testMode) {
    console.log('\n🧪 TEST MODE - No changes made to Klaviyo');
  }
}

// Export for use as module
module.exports = {
  processBusiness,
  processBusinessBatch,
  detectSegmentByCategory,
  CATEGORY_SEGMENTS,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
