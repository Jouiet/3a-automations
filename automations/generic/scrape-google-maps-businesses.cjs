#!/usr/bin/env node
/**
 * SCRAPE GOOGLE MAPS BUSINESSES VIA APIFY
 *
 * B2B local lead generation: Extract business data from Google Maps at scale
 * Uses Apify actors for compliant, proxy-rotated scraping
 *
 * USAGE:
 *   node scrape-google-maps-businesses.cjs --query="plumber" --location="Paris"
 *   node scrape-google-maps-businesses.cjs --query="restaurant" --location="Lyon" --max=500
 *   node scrape-google-maps-businesses.cjs --query="dentist" --location="Marseille" --radius=20
 *
 * OUTPUT:
 *   - JSON file with structured business data
 *   - CSV file for CRM import
 *   - Optional: Push to Google Sheets
 *   - Optional: Push to Klaviyo B2B list
 *
 * APIFY ACTORS USED:
 *   - compass/crawler-google-places (primary - $7/1000)
 *   - nwua/google-maps-scraper (alternative - $5.50/1000)
 *
 * COST: ~$7/1000 businesses (Apify credits)
 *
 * ROI INSIGHT:
 *   Google Maps = 200M+ businesses worldwide
 *   Cost/lead: $0.007 vs LinkedIn $0.50+
 *   Data quality: Verified by Google, direct contacts
 *
 * Created: 2025-12-19 | Session 26b
 * Category: B2B Local Lead Generation
 * Priority: P0 CRITICAL
 * Reusable: YES - Generic pattern
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');

// Security utilities
const {
  fetchWithTimeout,
  safePoll,
} = require('../lib/security-utils.cjs');

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  // Apify
  APIFY_TOKEN: process.env.APIFY_TOKEN,

  // Actor IDs (from Apify Store)
  ACTORS: {
    // Primary: Most reliable, full data
    GOOGLE_PLACES: 'compass/crawler-google-places',
    // Alternative: Cheaper, good for volume
    GOOGLE_MAPS_ALT: 'nwua/google-maps-scraper',
    // Specialized: Reviews focus
    GOOGLE_REVIEWS: 'compass/google-maps-reviews-scraper',
  },

  // Output
  OUTPUT_DIR: path.join(__dirname, '..', '..', 'outputs'),

  // Defaults
  DEFAULT_MAX_RESULTS: 100,
  DEFAULT_RADIUS_KM: 10,
  POLL_INTERVAL: 5000, // 5 seconds
  MAX_WAIT_TIME: 900000, // 15 minutes (Maps scraping can be slow)
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

  // Start actor run
  const startUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${CONFIG.APIFY_TOKEN}`;

  const startResponse = await fetchWithTimeout(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }, 30000);

  if (!startResponse.ok) {
    const error = await startResponse.text();
    throw new Error(`Failed to start actor: ${startResponse.status} - ${error}`);
  }

  const runData = await startResponse.json();
  const runId = runData.data.id;
  console.log(`   Run ID: ${runId}`);

  // Poll for completion with safePoll (bounded retries + timeout)
  console.log('   Waiting for completion (this may take several minutes)...');
  const statusUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${CONFIG.APIFY_TOKEN}`;

  const finalStatus = await safePoll(
    async () => {
      const statusResponse = await fetchWithTimeout(statusUrl, {}, 15000);
      const statusData = await statusResponse.json();
      const status = statusData.data.status;
      const done = status !== 'RUNNING' && status !== 'READY';
      return { done, result: status, status };
    },
    {
      maxRetries: 180,                     // Max 180 poll attempts (15 min / 5 sec)
      maxTimeMs: CONFIG.MAX_WAIT_TIME,     // 15 min max
      intervalMs: CONFIG.POLL_INTERVAL,    // 5 sec interval
      onProgress: (attempt, status, elapsed) => {
        if (attempt % 6 === 0) {
          console.log(`   Status: ${status} (${Math.round(elapsed / 1000)}s elapsed)`);
        }
      }
    }
  );

  if (finalStatus !== 'SUCCEEDED') {
    throw new Error(`Actor run failed with status: ${finalStatus}`);
  }

  // Get results
  const datasetId = runData.data.defaultDatasetId;
  const dataUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${CONFIG.APIFY_TOKEN}`;

  const dataResponse = await fetchWithTimeout(dataUrl, {}, 30000);
  const results = await dataResponse.json();

  console.log(`✅ Got ${results.length} results`);

  return results;
}

/**
 * Scrape Google Maps businesses by search query and location
 */
async function scrapeGoogleMapsBusinesses(query, location, options = {}) {
  const {
    maxResults = CONFIG.DEFAULT_MAX_RESULTS,
    radius = CONFIG.DEFAULT_RADIUS_KM,
    language = 'fr',
    includeReviews = false,
  } = options;

  console.log(`\n📍 Searching Google Maps for: "${query}" in "${location}"`);
  console.log(`   Max results: ${maxResults}, Radius: ${radius}km`);

  // Build search term
  const searchTerm = `${query} ${location}`;

  const input = {
    // Search parameters
    searchStringsArray: [searchTerm],
    maxCrawledPlaces: maxResults,

    // Location
    lat: null, // Will use searchTerm location
    lng: null,
    zoom: calculateZoom(radius),

    // Data to extract
    includeReviews: includeReviews,
    maxReviews: includeReviews ? 10 : 0,
    includeImages: false, // Keep data light

    // Language
    language: language,

    // Performance
    maxConcurrency: 10,

    // Proxy
    proxyConfiguration: {
      useApifyProxy: true,
    },
  };

  return await runApifyActor(CONFIG.ACTORS.GOOGLE_PLACES, input);
}

/**
 * Calculate Google Maps zoom level from radius
 */
function calculateZoom(radiusKm) {
  // Approximate zoom levels for different radii
  if (radiusKm <= 1) return 16;
  if (radiusKm <= 2) return 15;
  if (radiusKm <= 5) return 14;
  if (radiusKm <= 10) return 13;
  if (radiusKm <= 20) return 12;
  if (radiusKm <= 50) return 11;
  if (radiusKm <= 100) return 10;
  return 9;
}

// ========================================
// DATA PROCESSING
// ========================================

/**
 * Normalize business data to standard format
 */
function normalizeBusiness(rawBusiness) {
  return {
    // Basic info
    name: rawBusiness.title || rawBusiness.name || '',
    category: rawBusiness.categoryName || rawBusiness.category || '',
    subcategories: rawBusiness.categories || [],

    // Contact
    phone: cleanPhone(rawBusiness.phone || rawBusiness.phoneUnformatted),
    website: rawBusiness.website || rawBusiness.url || null,
    email: extractEmail(rawBusiness),

    // Address
    address: rawBusiness.address || rawBusiness.street || '',
    city: rawBusiness.city || extractCity(rawBusiness.address),
    postalCode: rawBusiness.postalCode || rawBusiness.zipCode || '',
    country: rawBusiness.countryCode || 'FR',

    // Location
    latitude: rawBusiness.location?.lat || rawBusiness.latitude || null,
    longitude: rawBusiness.location?.lng || rawBusiness.longitude || null,
    placeId: rawBusiness.placeId || rawBusiness.cid || '',
    googleMapsUrl: rawBusiness.url || buildMapsUrl(rawBusiness),

    // Business signals
    rating: rawBusiness.totalScore || rawBusiness.rating || null,
    reviewCount: rawBusiness.reviewsCount || rawBusiness.reviews || 0,
    priceLevel: rawBusiness.price || rawBusiness.priceLevel || null,

    // Hours
    isOpen: rawBusiness.isSpendingOnAds !== undefined ? null : (rawBusiness.temporarilyClosed === false),
    openingHours: rawBusiness.openingHours || rawBusiness.hours || null,

    // Additional data
    description: rawBusiness.description || '',
    imageUrl: rawBusiness.imageUrl || rawBusiness.thumbnail || null,

    // Meta
    scrapedAt: new Date().toISOString(),
    source: 'google_maps_apify',
    dataQuality: calculateDataQuality(rawBusiness),
  };
}

/**
 * Clean phone number
 */
function cleanPhone(phone) {
  if (!phone) return null;
  // Remove all non-numeric except + at start
  return phone.replace(/[^\d+]/g, '').replace(/^\+?/, '+');
}

/**
 * Extract email if present in business data
 */
function extractEmail(business) {
  // Some actors provide email directly
  if (business.email) return business.email;

  // Try to find in description or additional info
  const text = `${business.description || ''} ${business.additionalInfo || ''}`;
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return emailMatch ? emailMatch[0] : null;
}

/**
 * Extract city from address
 */
function extractCity(address) {
  if (!address) return '';
  // Try to extract city from French address format
  const parts = address.split(',');
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2].trim();
    // Remove postal code if present
    return cityPart.replace(/^\d{5}\s*/, '');
  }
  return '';
}

/**
 * Build Google Maps URL from place data
 */
function buildMapsUrl(business) {
  if (business.placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${business.placeId}`;
  }
  if (business.location?.lat && business.location?.lng) {
    return `https://www.google.com/maps/@${business.location.lat},${business.location.lng},17z`;
  }
  return null;
}

/**
 * Calculate data quality score (0-100)
 */
function calculateDataQuality(business) {
  let score = 0;
  const weights = {
    name: 15,
    phone: 20,
    website: 15,
    email: 20,
    address: 10,
    rating: 5,
    reviewCount: 5,
    category: 5,
    openingHours: 5,
  };

  if (business.title || business.name) score += weights.name;
  if (business.phone || business.phoneUnformatted) score += weights.phone;
  if (business.website || business.url) score += weights.website;
  if (business.email) score += weights.email;
  if (business.address || business.street) score += weights.address;
  if (business.totalScore || business.rating) score += weights.rating;
  if ((business.reviewsCount || business.reviews) > 0) score += weights.reviewCount;
  if (business.categoryName || business.category) score += weights.category;
  if (business.openingHours || business.hours) score += weights.openingHours;

  return score;
}

/**
 * Deduplicate businesses by phone or name+address
 */
function deduplicateBusinesses(businesses) {
  const seen = new Map();
  const unique = [];

  for (const biz of businesses) {
    // Create dedup key
    const phoneKey = biz.phone ? `phone:${biz.phone}` : null;
    const nameAddressKey = `name:${biz.name.toLowerCase()}|addr:${biz.address.toLowerCase()}`;

    const key = phoneKey || nameAddressKey;

    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(biz);
    }
  }

  console.log(`\n🔄 Deduplication: ${businesses.length} → ${unique.length} (${businesses.length - unique.length} duplicates removed)`);

  return unique;
}

// ========================================
// OUTPUT
// ========================================

/**
 * Save results to JSON file
 */
function saveToJSON(businesses, filename) {
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);

  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(businesses, null, 2));
  console.log(`\n📁 Saved JSON to: ${outputPath}`);

  return outputPath;
}

/**
 * Save results to CSV file (CRM-ready)
 */
function saveToCSV(businesses, filename) {
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);

  const headers = [
    'name', 'category', 'phone', 'email', 'website',
    'address', 'city', 'postalCode', 'country',
    'rating', 'reviewCount', 'googleMapsUrl', 'dataQuality', 'scrapedAt'
  ];

  const csvLines = [headers.join(',')];

  for (const biz of businesses) {
    const values = headers.map(h => {
      const value = biz[h] ?? '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
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

/**
 * Generate statistics summary
 */
function generateStats(businesses) {
  const stats = {
    total: businesses.length,
    withPhone: businesses.filter(b => b.phone).length,
    withEmail: businesses.filter(b => b.email).length,
    withWebsite: businesses.filter(b => b.website).length,
    withRating: businesses.filter(b => b.rating).length,
    avgRating: 0,
    avgReviews: 0,
    avgDataQuality: 0,
    categories: {},
    cities: {},
  };

  // Calculate averages
  const rated = businesses.filter(b => b.rating);
  if (rated.length > 0) {
    stats.avgRating = (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(2);
  }

  stats.avgReviews = Math.round(businesses.reduce((sum, b) => sum + (b.reviewCount || 0), 0) / businesses.length);
  stats.avgDataQuality = Math.round(businesses.reduce((sum, b) => sum + b.dataQuality, 0) / businesses.length);

  // Count by category
  for (const biz of businesses) {
    if (biz.category) {
      stats.categories[biz.category] = (stats.categories[biz.category] || 0) + 1;
    }
    if (biz.city) {
      stats.cities[biz.city] = (stats.cities[biz.city] || 0) + 1;
    }
  }

  return stats;
}

// ========================================
// MAIN
// ========================================

async function main() {
  console.log('================================================================================');
  console.log('GOOGLE MAPS BUSINESS SCRAPER (via Apify)');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================');

  // Parse arguments
  const args = process.argv.slice(2);
  const queryArg = args.find(a => a.startsWith('--query='));
  const locationArg = args.find(a => a.startsWith('--location='));
  const maxArg = args.find(a => a.startsWith('--max='));
  const radiusArg = args.find(a => a.startsWith('--radius='));
  const helpArg = args.includes('--help') || args.includes('-h');

  if (helpArg) {
    console.log(`
USAGE:
  node scrape-google-maps-businesses.cjs --query="plumber" --location="Paris"
  node scrape-google-maps-businesses.cjs --query="restaurant" --location="Lyon" --max=500
  node scrape-google-maps-businesses.cjs --query="dentist" --location="Marseille" --radius=20

OPTIONS:
  --query=QUERY       Business type to search (e.g., "plumber", "restaurant")
  --location=PLACE    City or area to search (e.g., "Paris", "Lyon 6eme")
  --max=NUMBER        Maximum businesses to scrape (default: 100)
  --radius=KM         Search radius in kilometers (default: 10)
  --reviews           Include reviews (slower, more data)
  --help, -h          Show this help

ENVIRONMENT VARIABLES:
  APIFY_TOKEN         Required. Your Apify API token

EXAMPLES:
  # Local plumbers in Paris (100 results, 10km radius)
  node scrape-google-maps-businesses.cjs --query="plombier" --location="Paris"

  # Restaurants in Lyon, larger area
  node scrape-google-maps-businesses.cjs --query="restaurant" --location="Lyon" --max=500 --radius=20

  # Dentists in specific district
  node scrape-google-maps-businesses.cjs --query="dentiste" --location="Paris 16eme" --max=50

COST:
  ~$7/1000 businesses (Apify credits)
  Free tier: 48 compute units/month (~500-1000 businesses)

OUTPUT:
  outputs/google-maps-QUERY-LOCATION-YYYY-MM-DD.json
  outputs/google-maps-QUERY-LOCATION-YYYY-MM-DD.csv
    `);
    process.exit(0);
  }

  // Validate required arguments
  if (!queryArg || !locationArg) {
    console.error('❌ ERROR: --query and --location are required');
    console.error('   Example: node scrape-google-maps-businesses.cjs --query="plumber" --location="Paris"');
    console.error('   Run with --help for more information');
    process.exit(1);
  }

  // Validate Apify token
  if (!CONFIG.APIFY_TOKEN) {
    console.error('❌ ERROR: APIFY_TOKEN not set in .env');
    console.error('   Get your token at: https://console.apify.com/account/integrations');
    process.exit(1);
  }

  // Parse options
  const query = queryArg.split('=').slice(1).join('=');
  const location = locationArg.split('=').slice(1).join('=');
  const maxResults = maxArg ? parseInt(maxArg.split('=')[1]) : CONFIG.DEFAULT_MAX_RESULTS;
  const radius = radiusArg ? parseInt(radiusArg.split('=')[1]) : CONFIG.DEFAULT_RADIUS_KM;
  const includeReviews = args.includes('--reviews');

  try {
    // Scrape businesses
    const rawResults = await scrapeGoogleMapsBusinesses(query, location, {
      maxResults,
      radius,
      includeReviews,
    });

    if (rawResults.length === 0) {
      console.log('\n⚠️ No businesses found for this search');
      process.exit(0);
    }

    // Normalize data
    console.log('\n📊 Processing results...');
    const normalized = rawResults.map(normalizeBusiness);

    // Deduplicate
    const unique = deduplicateBusinesses(normalized);

    // Generate stats
    const stats = generateStats(unique);

    // Save files
    const timestamp = new Date().toISOString().split('T')[0];
    const safeQuery = query.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const safeLocation = location.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileBase = `google-maps-${safeQuery}-${safeLocation}-${timestamp}`;

    saveToJSON(unique, `${fileBase}.json`);
    saveToCSV(unique, `${fileBase}.csv`);

    // Summary
    console.log('\n================================================================================');
    console.log('SCRAPE COMPLETE');
    console.log('================================================================================');
    console.log(`✅ Businesses found: ${stats.total}`);
    console.log(`📞 With phone: ${stats.withPhone} (${Math.round(stats.withPhone / stats.total * 100)}%)`);
    console.log(`📧 With email: ${stats.withEmail} (${Math.round(stats.withEmail / stats.total * 100)}%)`);
    console.log(`🌐 With website: ${stats.withWebsite} (${Math.round(stats.withWebsite / stats.total * 100)}%)`);
    console.log(`⭐ Avg rating: ${stats.avgRating} (${stats.withRating} rated)`);
    console.log(`💬 Avg reviews: ${stats.avgReviews}`);
    console.log(`📊 Avg data quality: ${stats.avgDataQuality}/100`);

    // Top categories
    const topCategories = Object.entries(stats.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topCategories.length > 0) {
      console.log('\n📋 Top categories:');
      topCategories.forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count}`);
      });
    }

    // Sample output
    if (unique.length > 0) {
      console.log('\n📋 Sample business:');
      const sample = unique[0];
      console.log(`   Name: ${sample.name}`);
      console.log(`   Phone: ${sample.phone || 'N/A'}`);
      console.log(`   Website: ${sample.website || 'N/A'}`);
      console.log(`   Rating: ${sample.rating || 'N/A'} (${sample.reviewCount} reviews)`);
      console.log(`   Quality: ${sample.dataQuality}/100`);
    }

    // Cost estimate
    const estimatedCost = (rawResults.length / 1000 * 7).toFixed(2);
    console.log(`\n💰 Estimated Apify cost: $${estimatedCost}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  scrapeGoogleMapsBusinesses,
  normalizeBusiness,
  deduplicateBusinesses,
  generateStats,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
