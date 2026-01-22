#!/usr/bin/env node
/**
 * 3A AUTOMATION - Geo-Locale Engine (Sovereign L5)
 * 
 * ROLE: Detects geographic region to set optimal Language and Currency.
 * MARKETS:
 * 1. Maghreb/Maroc -> FR / MAD
 * 2. Europe -> FR / EUR
 * 3. International -> EN / USD
 * 
 * @version 1.0.0
 * @date 2026-01-20
 */

const FINANCIAL_CONFIG = require('./agency-financial-config.cjs');

const LOCALE_MATRIX = {
    MAGHREB: {
        countries: ['MA', 'DZ', 'TN'],
        language: 'FR',
        currency: 'MAD'
    },
    EUROPE: {
        countries: ['FR', 'BE', 'CH', 'LU', 'MC', 'ES', 'IT', 'DE', 'NL', 'PT'], // Main FR-speaking or targeted EU
        language: 'FR',
        currency: 'EUR'
    },
    GLOBAL: {
        language: 'EN',
        currency: 'USD'
    }
};

/**
 * Detects locale based on Country Code
 * @param {string} countryCode - ISO 3166-1 alpha-2
 */
function getLocaleConfig(countryCode) {
    if (!countryCode) return LOCALE_MATRIX.GLOBAL;

    const code = countryCode.toUpperCase();

    if (LOCALE_MATRIX.MAGHREB.countries.includes(code)) {
        return LOCALE_MATRIX.MAGHREB;
    }

    // Default Europe for EU countries
    const isEU = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'].includes(code);
    if (isEU || LOCALE_MATRIX.EUROPE.countries.includes(code)) {
        return LOCALE_MATRIX.EUROPE;
    }

    return LOCALE_MATRIX.GLOBAL;
}

/**
 * Real-world detection via ip-api (No Mock)
 */
async function detectLocation() {
    try {
        const response = await fetch('http://ip-api.com/json/');
        if (!response.ok) throw new Error('IP Detection Failed');
        const data = await response.json();

        const config = getLocaleConfig(data.countryCode);
        return {
            detectedCountry: data.countryCode,
            detectedCity: data.city,
            config: config,
            financials: FINANCIAL_CONFIG.currencies[config.currency]
        };
    } catch (e) {
        console.warn(`[Locale] Detection failed, falling back to GLOBAL. Error: ${e.message}`);
        return {
            detectedCountry: 'Unknown',
            config: LOCALE_MATRIX.GLOBAL,
            financials: FINANCIAL_CONFIG.currencies.USD
        };
    }
}

if (require.main === module) {
    detectLocation().then(res => {
        console.log("🌐 [Sovereign Locale] Detection Result:");
        console.log(JSON.stringify(res, null, 2));
    });
}

module.exports = { getLocaleConfig, detectLocation, LOCALE_MATRIX };
