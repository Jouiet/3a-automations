/**
 * UCP Product Discovery Endpoint (Single Source of Truth)
 * Standard: Universal Commerce Protocol v1.0
 * Features:
 * - ACO (Agentic Commerce Optimization): JSON-LD output
 * - Localization: Handles MAD/EUR/USD logic based on 'x-geo-country' header
 * - Data Source: data/ucp-services.json (NOT hardcoded)
 */

const fs = require('fs');
const path = require('path');

// Load services from external data file
const loadServices = () => {
    const dataPath = path.join(__dirname, '../../../data/ucp-services.json');

    if (!fs.existsSync(dataPath)) {
        console.error('[UCP] Services data file not found:', dataPath);
        return { services: [], localization: {} };
    }

    try {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return data;
    } catch (e) {
        console.error('[UCP] Failed to load services:', e.message);
        return { services: [], localization: {} };
    }
};

// Localization Utility
const getLocalizedPrice = (basePriceEUR, countryCode, localization) => {
    const MAGHREB_GROUP = localization.MAGHREB_COUNTRIES || ['MA', 'DZ', 'TN'];
    const EURO_GROUP = localization.EURO_COUNTRIES || ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT', 'IE', 'FI'];
    const MAD_RATE = localization.MAD_RATE || 10.5;
    const USD_RATE = localization.USD_RATE || 1.08;

    if (MAGHREB_GROUP.includes(countryCode)) {
        return { amount: basePriceEUR * MAD_RATE, currency: 'MAD', lang: 'fr' };
    }
    if (EURO_GROUP.includes(countryCode)) {
        return { amount: basePriceEUR, currency: 'EUR', lang: 'fr' };
    }
    // International (USD)
    return { amount: basePriceEUR * USD_RATE, currency: 'USD', lang: 'en' };
};

module.exports = function handler(req, res) {
    // Load services data
    const serviceData = loadServices();
    const { services, localization } = serviceData;

    if (services.length === 0) {
        const errorResponse = {
            protocol: "UCP/1.0",
            error: {
                code: "SERVICE_DATA_UNAVAILABLE",
                message: "Services catalog could not be loaded"
            }
        };
        if (res.status) {
            return res.status(500).json(errorResponse);
        }
        res.statusCode = 500;
        return res.json(errorResponse);
    }

    // Agentic Header Detection
    const country = req.headers['x-geo-country'] || 'FR';
    const agentId = req.headers['user-agent'] || 'Unknown Agent';

    const products = services.map(item => {
        const local = getLocalizedPrice(item.basePrice, country, localization);

        const product = {
            "@context": "https://schema.org",
            "@type": item.type === 'subscription' ? "Service" : "Product",
            "sku": item.id,
            "name": item.name,
            "description": item.description,
            "category": item.category,
            "language": local.lang,
            "offers": {
                "@type": "Offer",
                "price": local.amount.toFixed(2),
                "priceCurrency": local.currency,
                "availability": "https://schema.org/InStock"
            },
            "ucp:negotiation": {
                "enabled": item.basePrice > 0,
                "endpoint": "/a2a/v1/rpc"
            }
        };

        // Add subscription-specific fields
        if (item.type === 'subscription') {
            product.offers["@type"] = "Offer";
            product.offers.billingIncrement = "P1M";
            product.offers.billingDuration = "Monthly";
            product["ucp:subscription"] = {
                "billingCycle": item.billingCycle,
                "hoursIncluded": item.hoursIncluded
            };
        }

        // Add delivery info for one-shot
        if (item.deliveryDays) {
            product["ucp:delivery"] = {
                "estimatedDays": item.deliveryDays
            };
        }

        return product;
    });

    // UCP Standard Response wrapper
    const response = {
        protocol: "UCP/1.0",
        version: serviceData.version,
        context: {
            country,
            currency: products[0]?.offers.priceCurrency || 'EUR',
            timestamp: new Date().toISOString()
        },
        provider: serviceData.provider,
        data: products,
        meta: {
            total: products.length,
            source: "data/ucp-services.json"
        }
    };

    // Support both Next.js (res.status.json) and Express (res.json)
    if (res.status) {
        res.status(200).json(response);
    } else {
        res.json(response);
    }
};
