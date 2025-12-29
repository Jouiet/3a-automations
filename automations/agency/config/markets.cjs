#!/usr/bin/env node
/**
 * INTERNATIONAL MARKETS CONFIGURATION
 *
 * 26 target markets for B2B lead generation
 * Used by all lead pipelines (LinkedIn, Google Maps, etc.)
 *
 * Created: 2025-12-29 | Session 114
 * Version: 1.0.0
 */

// ============================================================================
// MARKET DEFINITIONS
// ============================================================================

const MARKETS = {
  // Europe - Western
  france: {
    name: 'France',
    code: 'FR',
    language: 'fr',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille', 'Nantes'],
    linkedinSearchTerms: ['france', 'paris', 'lyon', 'french'],
    priority: 1,
  },
  germany: {
    name: 'Germany',
    code: 'DE',
    language: 'de',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Düsseldorf'],
    linkedinSearchTerms: ['germany', 'deutschland', 'berlin', 'munich', 'german'],
    priority: 1,
  },
  united_kingdom: {
    name: 'United Kingdom',
    code: 'GB',
    language: 'en',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Europe/London',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh', 'Glasgow'],
    linkedinSearchTerms: ['united kingdom', 'uk', 'london', 'british', 'england'],
    priority: 1,
  },
  netherlands: {
    name: 'Netherlands',
    code: 'NL',
    language: 'nl',
    currency: 'EUR',
    timezone: 'Europe/Amsterdam',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    linkedinSearchTerms: ['netherlands', 'holland', 'amsterdam', 'dutch'],
    priority: 2,
  },
  belgium: {
    name: 'Belgium',
    code: 'BE',
    language: 'fr',
    currency: 'EUR',
    timezone: 'Europe/Brussels',
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Liège', 'Bruges'],
    linkedinSearchTerms: ['belgium', 'belgique', 'brussels', 'belgian'],
    priority: 2,
  },
  switzerland: {
    name: 'Switzerland',
    code: 'CH',
    language: 'fr',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Europe/Zurich',
    cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'],
    linkedinSearchTerms: ['switzerland', 'suisse', 'schweiz', 'zurich', 'geneva', 'swiss'],
    priority: 2,
  },
  monaco: {
    name: 'Monaco',
    code: 'MC',
    language: 'fr',
    currency: 'EUR',
    timezone: 'Europe/Monaco',
    cities: ['Monaco', 'Monte Carlo'],
    linkedinSearchTerms: ['monaco', 'monte carlo'],
    priority: 3,
  },

  // Europe - Southern
  spain: {
    name: 'Spain',
    code: 'ES',
    language: 'es',
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga', 'Bilbao'],
    linkedinSearchTerms: ['spain', 'españa', 'madrid', 'barcelona', 'spanish'],
    priority: 2,
  },
  italy: {
    name: 'Italy',
    code: 'IT',
    language: 'it',
    currency: 'EUR',
    timezone: 'Europe/Rome',
    cities: ['Milan', 'Rome', 'Turin', 'Naples', 'Florence', 'Bologna'],
    linkedinSearchTerms: ['italy', 'italia', 'milan', 'rome', 'italian'],
    priority: 2,
  },
  portugal: {
    name: 'Portugal',
    code: 'PT',
    language: 'pt',
    currency: 'EUR',
    timezone: 'Europe/Lisbon',
    cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra'],
    linkedinSearchTerms: ['portugal', 'lisbon', 'porto', 'portuguese'],
    priority: 2,
  },
  greece: {
    name: 'Greece',
    code: 'GR',
    language: 'el',
    currency: 'EUR',
    timezone: 'Europe/Athens',
    cities: ['Athens', 'Thessaloniki', 'Patras'],
    linkedinSearchTerms: ['greece', 'athens', 'greek'],
    priority: 3,
  },
  croatia: {
    name: 'Croatia',
    code: 'HR',
    language: 'hr',
    currency: 'EUR',
    timezone: 'Europe/Zagreb',
    cities: ['Zagreb', 'Split', 'Rijeka', 'Dubrovnik'],
    linkedinSearchTerms: ['croatia', 'zagreb', 'croatian'],
    priority: 3,
  },

  // Europe - Northern
  sweden: {
    name: 'Sweden',
    code: 'SE',
    language: 'sv',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Europe/Stockholm',
    cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'],
    linkedinSearchTerms: ['sweden', 'stockholm', 'swedish'],
    priority: 2,
  },
  norway: {
    name: 'Norway',
    code: 'NO',
    language: 'no',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Europe/Oslo',
    cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
    linkedinSearchTerms: ['norway', 'oslo', 'norwegian'],
    priority: 2,
  },
  denmark: {
    name: 'Denmark',
    code: 'DK',
    language: 'da',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Europe/Copenhagen',
    cities: ['Copenhagen', 'Aarhus', 'Odense'],
    linkedinSearchTerms: ['denmark', 'copenhagen', 'danish'],
    priority: 2,
  },
  finland: {
    name: 'Finland',
    code: 'FI',
    language: 'fi',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    cities: ['Helsinki', 'Espoo', 'Tampere', 'Turku'],
    linkedinSearchTerms: ['finland', 'helsinki', 'finnish'],
    priority: 3,
  },
  faroe_islands: {
    name: 'Faroe Islands',
    code: 'FO',
    language: 'fo',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Atlantic/Faroe',
    cities: ['Tórshavn'],
    linkedinSearchTerms: ['faroe islands', 'faroese'],
    priority: 4,
  },

  // Europe - Eastern
  bulgaria: {
    name: 'Bulgaria',
    code: 'BG',
    language: 'bg',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Europe/Sofia',
    cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas'],
    linkedinSearchTerms: ['bulgaria', 'sofia', 'bulgarian'],
    priority: 3,
  },

  // Middle East & North Africa (MENA)
  morocco: {
    name: 'Morocco',
    code: 'MA',
    language: 'fr',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fès', 'Agadir'],
    linkedinSearchTerms: ['morocco', 'maroc', 'casablanca', 'rabat', 'moroccan', 'marocain'],
    priority: 1,
  },
  united_arab_emirates: {
    name: 'United Arab Emirates',
    code: 'AE',
    language: 'en',
    currency: 'USD',  // Facturation en USD
    timezone: 'Asia/Dubai',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
    linkedinSearchTerms: ['uae', 'dubai', 'abu dhabi', 'united arab emirates', 'emirati'],
    priority: 1,
  },
  saudi_arabia: {
    name: 'Saudi Arabia',
    code: 'SA',
    language: 'ar',
    currency: 'USD',  // Facturation en USD
    timezone: 'Asia/Riyadh',
    cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'],
    linkedinSearchTerms: ['saudi arabia', 'riyadh', 'jeddah', 'saudi', 'ksa'],
    priority: 1,
  },
  egypt: {
    name: 'Egypt',
    code: 'EG',
    language: 'ar',
    currency: 'USD',  // Facturation en USD
    timezone: 'Africa/Cairo',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh'],
    linkedinSearchTerms: ['egypt', 'cairo', 'alexandria', 'egyptian'],
    priority: 2,
  },
  tunisia: {
    name: 'Tunisia',
    code: 'TN',
    language: 'fr',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Africa/Tunis',
    cities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan'],
    linkedinSearchTerms: ['tunisia', 'tunisie', 'tunis', 'tunisian'],
    priority: 2,
  },
  algeria: {
    name: 'Algeria',
    code: 'DZ',
    language: 'fr',
    currency: 'EUR',  // Facturation en EUR
    timezone: 'Africa/Algiers',
    cities: ['Algiers', 'Oran', 'Constantine', 'Annaba'],
    linkedinSearchTerms: ['algeria', 'algerie', 'alger', 'algerian'],
    priority: 2,
  },

  // North America
  united_states: {
    name: 'United States',
    code: 'US',
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Seattle', 'Boston'],
    linkedinSearchTerms: ['united states', 'usa', 'us', 'new york', 'california', 'american'],
    priority: 1,
  },
  canada: {
    name: 'Canada',
    code: 'CA',
    language: 'en',
    currency: 'USD',  // Facturation en USD
    timezone: 'America/Toronto',
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
    linkedinSearchTerms: ['canada', 'toronto', 'vancouver', 'montreal', 'canadian'],
    priority: 1,
  },

  // South America
  brazil: {
    name: 'Brazil',
    code: 'BR',
    language: 'pt',
    currency: 'USD',  // Facturation en USD
    timezone: 'America/Sao_Paulo',
    cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
    linkedinSearchTerms: ['brazil', 'brasil', 'sao paulo', 'rio', 'brazilian'],
    priority: 2,
  },

  // Oceania
  australia: {
    name: 'Australia',
    code: 'AU',
    language: 'en',
    currency: 'USD',  // Facturation en USD
    timezone: 'Australia/Sydney',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    linkedinSearchTerms: ['australia', 'sydney', 'melbourne', 'australian'],
    priority: 1,
  },
  new_zealand: {
    name: 'New Zealand',
    code: 'NZ',
    language: 'en',
    currency: 'USD',  // Facturation en USD
    timezone: 'Pacific/Auckland',
    cities: ['Auckland', 'Wellington', 'Christchurch'],
    linkedinSearchTerms: ['new zealand', 'auckland', 'wellington', 'kiwi'],
    priority: 2,
  },

  // Asia
  japan: {
    name: 'Japan',
    code: 'JP',
    language: 'ja',
    currency: 'USD',  // Facturation en USD
    timezone: 'Asia/Tokyo',
    cities: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Kyoto'],
    linkedinSearchTerms: ['japan', 'tokyo', 'osaka', 'japanese'],
    priority: 2,
  },

  // Remote territories (minimal lead gen)
  falkland_islands: {
    name: 'Falkland Islands',
    code: 'FK',
    language: 'en',
    currency: 'USD',  // Facturation en USD
    timezone: 'Atlantic/Stanley',
    cities: ['Stanley'],
    linkedinSearchTerms: ['falkland islands'],
    priority: 5,
  },
};

// ============================================================================
// MARKET GROUPS
// ============================================================================

const MARKET_GROUPS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 (6 premiers mois): Maroc + MENA + Europe
  // ═══════════════════════════════════════════════════════════════════════════
  // Raisons: - Moins de concurrence
  //          - Timezone aligné (UTC-1 à UTC+4)
  //          - Templates FR/AR existants
  //          - Mieux dominer 1 région que disperser

  // Tier 1: Marchés prioritaires (run quotidien)
  tier1_priority: ['morocco', 'france', 'united_arab_emirates', 'saudi_arabia'],

  // Tier 2: MENA expansion
  tier2_mena: ['egypt', 'tunisia', 'algeria'],

  // Tier 3: Europe francophone + proche
  tier3_europe_fr: ['belgium', 'switzerland', 'monaco'],

  // Tier 4: Europe germanophone + sud
  tier4_europe_growth: ['germany', 'netherlands', 'spain', 'italy', 'portugal'],

  // Tier 5: Europe nord
  tier5_europe_nord: ['sweden', 'norway', 'denmark', 'finland'],

  // Tier 6: Europe est
  tier6_europe_east: ['greece', 'croatia', 'bulgaria'],

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 (après 6 mois): USA/UK/Oceania
  // ═══════════════════════════════════════════════════════════════════════════
  // À activer quand: - Templates EN testés
  //                  - Process stabilisé
  //                  - Équipe disponible pour timezone US/AU
  tier7_anglophone: ['united_kingdom', 'united_states', 'canada', 'australia', 'new_zealand'],
  tier8_other: ['japan', 'brazil', 'faroe_islands', 'falkland_islands'],

  // Language groups
  french_speaking: ['france', 'belgium', 'switzerland', 'monaco', 'morocco', 'tunisia', 'algeria'],
  arabic_speaking: ['morocco', 'united_arab_emirates', 'saudi_arabia', 'egypt', 'tunisia', 'algeria'],
  english_speaking: ['united_kingdom', 'united_states', 'canada', 'australia', 'new_zealand', 'united_arab_emirates'],
  german_speaking: ['germany', 'switzerland'],

  // Region groups
  mena: ['morocco', 'united_arab_emirates', 'saudi_arabia', 'egypt', 'tunisia', 'algeria'],
  europe: ['france', 'germany', 'united_kingdom', 'netherlands', 'belgium', 'switzerland', 'monaco', 'spain', 'italy', 'portugal', 'greece', 'croatia', 'sweden', 'norway', 'denmark', 'finland', 'faroe_islands', 'bulgaria'],
  north_america: ['united_states', 'canada'],
  oceania: ['australia', 'new_zealand'],
  asia: ['japan'],
  south_america: ['brazil'],

  // Phase 1 Active (6 premiers mois)
  phase1_active: ['morocco', 'france', 'united_arab_emirates', 'saudi_arabia', 'egypt', 'tunisia', 'algeria', 'belgium', 'switzerland', 'germany', 'netherlands', 'spain', 'italy', 'portugal'],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get markets by priority tier
 */
function getMarketsByPriority(priority) {
  return Object.entries(MARKETS)
    .filter(([_, m]) => m.priority === priority)
    .map(([key, market]) => ({ key, ...market }));
}

/**
 * Get markets by group
 */
function getMarketsByGroup(groupName) {
  const group = MARKET_GROUPS[groupName];
  if (!group) return [];
  return group.map(key => ({ key, ...MARKETS[key] }));
}

/**
 * Get all cities for a list of markets
 */
function getCitiesForMarkets(marketKeys) {
  return marketKeys.flatMap(key => MARKETS[key]?.cities || []);
}

/**
 * Get LinkedIn search terms for a list of markets
 */
function getLinkedInTermsForMarkets(marketKeys) {
  return marketKeys.flatMap(key => MARKETS[key]?.linkedinSearchTerms || []);
}

/**
 * Get all market keys
 */
function getAllMarketKeys() {
  return Object.keys(MARKETS);
}

/**
 * Get market by code (FR, US, etc.)
 */
function getMarketByCode(code) {
  const entry = Object.entries(MARKETS).find(([_, m]) => m.code === code);
  return entry ? { key: entry[0], ...entry[1] } : null;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  MARKETS,
  MARKET_GROUPS,
  getMarketsByPriority,
  getMarketsByGroup,
  getCitiesForMarkets,
  getLinkedInTermsForMarkets,
  getAllMarketKeys,
  getMarketByCode,

  // Quick access - Phase 1 (6 mois)
  TIER1_MARKETS: MARKET_GROUPS.tier1_priority,
  TIER2_MARKETS: MARKET_GROUPS.tier2_mena,
  TIER3_MARKETS: MARKET_GROUPS.tier3_europe_fr,
  TIER4_MARKETS: MARKET_GROUPS.tier4_europe_growth,

  // Language groups
  FRENCH_MARKETS: MARKET_GROUPS.french_speaking,
  ARABIC_MARKETS: MARKET_GROUPS.arabic_speaking,
  ENGLISH_MARKETS: MARKET_GROUPS.english_speaking,

  // Region groups
  MENA_MARKETS: MARKET_GROUPS.mena,
  EUROPE_MARKETS: MARKET_GROUPS.europe,
  PHASE1_ACTIVE: MARKET_GROUPS.phase1_active,
};
