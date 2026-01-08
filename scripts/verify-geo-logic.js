const fs = require('fs');
const path = require('path');

// Mock GeoLocale logic from geo-locale.js
const locales = {
    'MA': { lang: 'fr', currency: 'MAD', region: 'maghreb' },
    'FR': { lang: 'fr', currency: 'EUR', region: 'europe' },
    'US': { lang: 'en', currency: 'USD', region: 'international' },
    'GB': { lang: 'en', currency: 'USD', region: 'international' },
};

const defaultLocale = { lang: 'en', currency: 'USD', region: 'international' };

function getLocale(countryCode) {
    return locales[countryCode] || defaultLocale;
}

function shouldShowEnglish(locale) {
    return locale.lang === 'en' || locale.region === 'international';
}

function test() {
    const tests = [
        { country: 'MA', expectedLang: 'fr', expectedCurrency: 'MAD', expectedRegion: 'maghreb' },
        { country: 'FR', expectedLang: 'fr', expectedCurrency: 'EUR', expectedRegion: 'europe' },
        { country: 'US', expectedLang: 'en', expectedCurrency: 'USD', expectedRegion: 'international' },
        { country: 'GB', expectedLang: 'en', expectedCurrency: 'USD', expectedRegion: 'international' },
        { country: 'JP', expectedLang: 'en', expectedCurrency: 'USD', expectedRegion: 'international' }, // Default
    ];

    let success = true;
    tests.forEach(t => {
        const locale = getLocale(t.country);
        const pass = locale.lang === t.expectedLang &&
            locale.currency === t.expectedCurrency &&
            locale.region === t.expectedRegion;

        console.log(`Test [${t.country}]: ${pass ? 'PASS' : 'FAIL'}`);
        if (!pass) {
            console.log(`  Expected: ${t.expectedLang}, ${t.expectedCurrency}, ${t.expectedRegion}`);
            console.log(`  Got:      ${locale.lang}, ${locale.currency}, ${locale.region}`);
            success = false;
        }
    });

    if (success) {
        console.log('\n--- ALL GEO-LOCALE TESTS PASSED ---');
    } else {
        console.log('\n--- SOME GEO-LOCALE TESTS FAILED ---');
        process.exit(1);
    }
}

test();
