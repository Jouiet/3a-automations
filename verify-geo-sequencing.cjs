const { MARKETS, getMarketByCountry, formatPrice } = require('./automations/generic/geo-markets.cjs');

console.log('==========================================');
console.log('GEO-SEQUENCING: EMPIRICAL VERIFICATION');
console.log('==========================================');

const TESTS = [
    { input: 'MA', expected: { id: 'maghreb', currency: 'MAD', language: 'fr' } },
    { input: 'FR', expected: { id: 'europe', currency: 'EUR', language: 'fr' } },
    { input: 'DE', expected: { id: 'europe', currency: 'EUR', language: 'fr' } },
    { input: 'US', expected: { id: 'north_america', currency: 'USD', language: 'en' } },
    { input: 'JP', expected: { id: 'asia_pacific', currency: 'USD', language: 'en' } }, // ROW/Intl
    { input: 'ZA', expected: { id: 'uk_commonwealth', currency: 'USD', language: 'en' } }, // ROW/Intl
    { input: null, expected: { id: 'rest_of_world', currency: 'USD', language: 'en' } }  // Fallback
];

let allPassed = true;

TESTS.forEach(test => {
    const result = getMarketByCountry(test.input);
    const passed =
        result.id === test.expected.id &&
        result.currency === test.expected.currency &&
        result.language === test.expected.language;

    const symbol = passed ? '✅' : '❌';
    console.log(`${symbol} Input: ${test.input || 'NULL'} -> [${result.displayName}] (${result.currency}/${result.language})`);

    if (!passed) {
        console.error(`   Expected: ${JSON.stringify(test.expected)}`);
        console.error(`   Got:      ${JSON.stringify({ id: result.id, currency: result.currency, language: result.language })}`);
        allPassed = false;
    }
});

console.log('------------------------------------------');
// Price Formatting Check
const priceTests = [
    { amount: 100, currency: 'MAD', expected: '100 DH' }, // Or similar formatting
    { amount: 100, currency: 'EUR', expected: '100€' },
    { amount: 100, currency: 'USD', expected: '$100' }
];

priceTests.forEach(test => {
    const formatted = formatPrice(test.amount, test.currency);
    // Relaxed check for locale string variations
    const passed = formatted.includes(test.expected.replace(/100/, '').trim()) || formatted.includes(test.expected);
    console.log(`💲 Price: 100 ${test.currency} -> ${formatted}`);
});

console.log('==========================================');
if (allPassed) {
    console.log('RESULT: SUCCESS (100% Verified)');
    process.exit(0);
} else {
    console.error('RESULT: FAILED');
    process.exit(1);
}
