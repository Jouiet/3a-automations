#!/usr/bin/env node
/**
 * GEO-MARKETS MODULE
 * Core geographic market definitions for CRM segmentation
 *
 * Usage:
 *   const { MARKETS, getMarketByCountry, getMarketStats } = require('./geo-markets.cjs');
 *
 * Markets:
 * - Europe (EU/EEA) → French content + EUR
 * - Maghreb (MA, DZ, TN) → French content + MAD
 * - North America (US, CA) → English content + USD
 * - UK & Commonwealth → English content + USD/GBP
 * - LATAM → Spanish content + USD
 * - Asia Pacific → English content + USD
 * - Rest of World → English content + USD
 *
 * Date: 2025-12-19
 * Version: 1.0
 * Author: 3A Automation
 */

// Market definitions
const MARKETS = {
  europe: {
    id: 'europe',
    name: 'Europe',
    displayName: 'Europe (EU/EEA)',
    countries: [
      // EU Members
      'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'IE', 'FI',
      'GR', 'MT', 'CY', 'SK', 'SI', 'EE', 'LV', 'LT', 'HR', 'PL',
      'CZ', 'HU', 'RO', 'BG', 'SE', 'DK',
      // EEA + CH
      'NO', 'IS', 'LI', 'CH', 'LU', 'MC', 'AD', 'SM', 'VA'
    ],
    language: 'fr',
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Paris',
    emailSendTime: '10:00',
    tags: ['geo:europe', 'lang:fr', 'currency:eur']
  },

  maghreb: {
    id: 'maghreb',
    name: 'Maghreb',
    displayName: 'Afrique du Nord',
    countries: ['MA', 'DZ', 'TN', 'LY', 'MR'],
    language: 'fr',
    currency: 'MAD',
    currencySymbol: 'DH',
    timezone: 'Africa/Casablanca',
    emailSendTime: '10:00',
    tags: ['geo:maghreb', 'lang:fr', 'currency:mad']
  },

  north_america: {
    id: 'north_america',
    name: 'North America',
    displayName: 'Amérique du Nord',
    countries: ['US', 'CA', 'MX'],
    language: 'en',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/New_York',
    emailSendTime: '09:00',
    tags: ['geo:north-america', 'lang:en', 'currency:usd']
  },

  uk_commonwealth: {
    id: 'uk_commonwealth',
    name: 'UK & Commonwealth',
    displayName: 'Royaume-Uni & Commonwealth',
    countries: ['GB', 'AU', 'NZ', 'SG', 'HK', 'IN', 'ZA'],
    language: 'en',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'Europe/London',
    emailSendTime: '09:00',
    tags: ['geo:uk-commonwealth', 'lang:en', 'currency:usd']
  },

  latam: {
    id: 'latam',
    name: 'LATAM',
    displayName: 'Amérique Latine',
    countries: ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY'],
    language: 'es',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/Sao_Paulo',
    emailSendTime: '10:00',
    tags: ['geo:latam', 'lang:es', 'currency:usd']
  },

  asia_pacific: {
    id: 'asia_pacific',
    name: 'Asia Pacific',
    displayName: 'Asie Pacifique',
    countries: ['JP', 'KR', 'TW', 'PH', 'ID', 'MY', 'TH', 'VN'],
    language: 'en',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'Asia/Tokyo',
    emailSendTime: '10:00',
    tags: ['geo:apac', 'lang:en', 'currency:usd']
  },

  middle_east: {
    id: 'middle_east',
    name: 'Middle East',
    displayName: 'Moyen-Orient',
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'EG'],
    language: 'en',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'Asia/Dubai',
    emailSendTime: '09:00',
    tags: ['geo:middle-east', 'lang:en', 'currency:usd']
  },

  rest_of_world: {
    id: 'rest_of_world',
    name: 'Rest of World',
    displayName: 'Reste du Monde',
    countries: [], // Catch-all
    language: 'en',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'UTC',
    emailSendTime: '10:00',
    tags: ['geo:row', 'lang:en', 'currency:usd']
  }
};

// Exchange rates (base: EUR) - Update periodically
const EXCHANGE_RATES = {
  EUR: 1.00,
  USD: 1.08,
  MAD: 10.90,
  GBP: 0.83
};

/**
 * Get market by country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {object} Market definition or rest_of_world
 */
function getMarketByCountry(countryCode) {
  if (!countryCode) return MARKETS.rest_of_world;

  const code = countryCode.toUpperCase();

  for (const [key, market] of Object.entries(MARKETS)) {
    if (market.countries.includes(code)) {
      return market;
    }
  }

  return MARKETS.rest_of_world;
}

/**
 * Convert price from EUR to target currency
 * @param {number} amountEUR - Price in EUR
 * @param {string} currency - Target currency code
 * @returns {number} Converted price (rounded)
 */
function convertPrice(amountEUR, currency) {
  const rate = EXCHANGE_RATES[currency] || 1;
  return Math.round(amountEUR * rate);
}

/**
 * Format price with currency symbol
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted price
 */
function formatPrice(amount, currency) {
  const market = Object.values(MARKETS).find(m => m.currency === currency);
  const symbol = market?.currencySymbol || currency;

  if (currency === 'MAD') {
    return `${amount.toLocaleString('fr-MA')} ${symbol}`;
  } else if (currency === 'EUR') {
    return `${amount.toLocaleString('fr-FR')}${symbol}`;
  } else {
    return `${symbol}${amount.toLocaleString('en-US')}`;
  }
}

/**
 * Get all defined country codes
 * @returns {string[]} Array of country codes
 */
function getAllCountryCodes() {
  const countries = new Set();
  Object.values(MARKETS).forEach(market => {
    market.countries.forEach(c => countries.add(c));
  });
  return Array.from(countries);
}

/**
 * Get statistics about profiles by market
 * @param {array} profiles - Array of profile objects with location.country
 * @returns {object} Statistics by market
 */
function getMarketStats(profiles) {
  const stats = {};

  // Initialize stats
  Object.keys(MARKETS).forEach(key => {
    stats[key] = { count: 0, percentage: 0 };
  });

  // Count by market
  profiles.forEach(profile => {
    const country = profile.location?.country || profile.country || null;
    const market = getMarketByCountry(country);
    stats[market.id].count++;
  });

  // Calculate percentages
  const total = profiles.length || 1;
  Object.keys(stats).forEach(key => {
    stats[key].percentage = ((stats[key].count / total) * 100).toFixed(1);
  });

  return stats;
}

/**
 * Generate CRM segment definitions for all markets
 * @param {string} crmType - CRM type (klaviyo, hubspot, mailchimp, etc.)
 * @returns {array} Segment definitions
 */
function generateSegmentDefinitions(crmType = 'generic') {
  return Object.entries(MARKETS).map(([key, market]) => ({
    id: key,
    name: `Geo - ${market.name}`,
    displayName: market.displayName,
    countries: market.countries,
    language: market.language,
    currency: market.currency,
    tags: market.tags,
    // CRM-specific filter
    filter: crmType === 'klaviyo'
      ? {
          type: 'profile-property',
          property: 'location.country',
          operator: market.countries.length > 0 ? 'is-in-list' : 'is-not-null',
          value: market.countries.length > 0 ? market.countries : null
        }
      : {
          field: 'country',
          operator: market.countries.length > 0 ? 'IN' : 'NOT_IN',
          value: market.countries.length > 0 ? market.countries : getAllCountryCodes()
        }
  }));
}

// Export for use in other scripts
module.exports = {
  MARKETS,
  EXCHANGE_RATES,
  getMarketByCountry,
  convertPrice,
  formatPrice,
  getAllCountryCodes,
  getMarketStats,
  generateSegmentDefinitions
};

// CLI mode
if (require.main === module) {
  console.log('🌍 GEO-MARKETS MODULE');
  console.log('====================\n');

  console.log('📊 Markets définis:');
  Object.entries(MARKETS).forEach(([key, market]) => {
    console.log(`\n${market.name} (${key}):`);
    console.log(`   Pays: ${market.countries.length > 0 ? market.countries.slice(0, 5).join(', ') + (market.countries.length > 5 ? '...' : '') : 'Catch-all'}`);
    console.log(`   Langue: ${market.language}`);
    console.log(`   Devise: ${market.currency} (${market.currencySymbol})`);
    console.log(`   Timezone: ${market.timezone}`);
  });

  console.log('\n💱 Taux de change (base EUR):');
  Object.entries(EXCHANGE_RATES).forEach(([currency, rate]) => {
    console.log(`   1 EUR = ${rate} ${currency}`);
  });

  console.log('\n📋 Exemple de prix convertis (100€):');
  Object.keys(EXCHANGE_RATES).forEach(currency => {
    const converted = convertPrice(100, currency);
    console.log(`   ${formatPrice(converted, currency)}`);
  });
}
