/**
 * UCP Product Discovery Endpoint (Single Source of Truth)
 * Standard: Universal Commerce Protocol v1.0
 * Features: 
 * - ACO (Agentic Commerce Optimization): JSON-LD output
 * - Localization: Handles MAD/EUR/USD logic based on 'x-geo-country' header
 */

// Simulated Database Inventory (The "Real" Data)
const INVENTORY = [
    {
        id: "svc-audit",
        name: "Audit L5",
        description: "Audit complet de votre infrastructure agentique. Conformité UCP/ACP.",
        basePrice: 5000,
        currency: "EUR"
    },
    {
        id: "svc-setup",
        name: "Setup Dropshipping",
        basePrice: 2500,
        description: "Boutique Shopify + Agents Sourcing/Support configurés.",
        currency: "EUR"
    }
];

// Localization Utility
const getLocalizedPrice = (basePriceEUR, countryCode) => {
    // 1. Strict Geo-Localization Logic (3-Tier)
    const MAGHREB_GROUP = ['MA', 'DZ', 'TN'];
    const EURO_GROUP = ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT', 'IE', 'FI'];

    if (MAGHREB_GROUP.includes(countryCode)) {
        return { amount: basePriceEUR * 10.5, currency: 'MAD', lang: 'fr' };
    }
    if (EURO_GROUP.includes(countryCode)) {
        return { amount: basePriceEUR, currency: 'EUR', lang: 'fr' };
    }
    // 3. International (USD)
    return { amount: basePriceEUR * 1.08, currency: 'USD', lang: 'en' };
};

module.exports = function handler(req, res) {
    // Agentic Header Detection
    const country = req.headers['x-geo-country'] || 'FR';
    const agentId = req.headers['user-agent'] || 'Unknown Agent';

    const products = INVENTORY.map(item => {
        const local = getLocalizedPrice(item.basePrice, country);

        return {
            "@context": "https://schema.org",
            "@type": "Product",
            "sku": item.id,
            "name": item.name,
            "description": item.description,
            "language": local.lang,
            "offers": {
                "@type": "Offer",
                "price": local.amount.toFixed(2),
                "priceCurrency": local.currency,
                "availability": "https://schema.org/InStock"
            },
            "ucp:negotiation": {
                "enabled": true,
                "endpoint": "/a2a/v1/rpc"
            }
        };
    });

    // UCP Standard Response wrapper
    // Support both Next.js (res.status.json) and Express (res.json)
    if (res.status) {
        res.status(200).json({
            protocol: "UCP/1.0",
            context: { country, currency: products[0].offers.priceCurrency },
            data: products
        });
    } else {
        res.json({
            protocol: "UCP/1.0",
            context: { country, currency: products[0].offers.priceCurrency },
            data: products
        });
    }
};
