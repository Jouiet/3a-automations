#!/usr/bin/env node
/**
 * Alpha Medical - UCP Product Proxy
 *
 * Fetches products from Alpha Medical Shopify store
 * and exposes them via 3A's A2A/UCP infrastructure.
 *
 * Architecture: Twin Sovereignty - 3A orchestrates, Alpha Medical executes
 *
 * Version: 1.0.0 | Session 143 | 23/01/2026
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STORE_ID = 'alpha-medical';
const STORE_NAME = 'Alpha Medical';
const STORE_DOMAIN = process.env.ALPHA_MEDICAL_DOMAIN || 'alphamedical.shop';
const SHOPIFY_STORE = process.env.ALPHA_MEDICAL_SHOPIFY_STORE || 'alpha-medical-store.myshopify.com';
const SHOPIFY_TOKEN = process.env.ALPHA_MEDICAL_SHOPIFY_TOKEN;

// Cache for products (5 min TTL)
let productsCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch products from Shopify Admin API
 */
async function fetchShopifyProducts() {
    if (!SHOPIFY_TOKEN) {
        console.warn(`[${STORE_ID}] Shopify token not configured`);
        return [];
    }

    try {
        const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?status=active&limit=250`;
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Shopify API ${response.status}`);
        }

        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error(`[${STORE_ID}] Failed to fetch products: ${error.message}`);
        return [];
    }
}

/**
 * Transform Shopify products to UCP JSON-LD format
 */
function transformToUCP(products, countryCode = 'FR') {
    return products.map(product => {
        const variant = product.variants?.[0] || {};
        const price = parseFloat(variant.price) || 0;

        // Localization
        let currency = 'EUR';
        let localPrice = price;
        if (['MA', 'DZ', 'TN'].includes(countryCode)) {
            currency = 'MAD';
            localPrice = price * 10.5;
        } else if (!['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT', 'IE', 'FI'].includes(countryCode)) {
            currency = 'USD';
            localPrice = price * 1.08;
        }

        return {
            "@context": "https://schema.org",
            "@type": "Product",
            "sku": variant.sku || product.handle,
            "name": product.title,
            "description": product.body_html?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
            "category": product.product_type || 'Medical Equipment',
            "image": product.images?.[0]?.src || '',
            "brand": {
                "@type": "Brand",
                "name": product.vendor || STORE_NAME
            },
            "offers": {
                "@type": "Offer",
                "price": localPrice.toFixed(2),
                "priceCurrency": currency,
                "availability": variant.inventory_quantity > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                "url": `https://${STORE_DOMAIN}/products/${product.handle}`
            },
            "ucp:negotiation": {
                "enabled": false, // Medical products typically don't negotiate
                "endpoint": null
            },
            "ucp:compliance": {
                "ce_marked": true,
                "medical_device_class": "I", // Assumed Class I for basic equipment
                "region": "EU"
            },
            "ucp:source": {
                "store_id": STORE_ID,
                "store_name": STORE_NAME,
                "platform": "shopify"
            }
        };
    });
}

/**
 * Get products with caching
 */
async function getProducts(countryCode = 'FR') {
    const now = Date.now();

    if (productsCache && (now - cacheTime) < CACHE_TTL) {
        return transformToUCP(productsCache, countryCode);
    }

    productsCache = await fetchShopifyProducts();
    cacheTime = now;

    return transformToUCP(productsCache, countryCode);
}

/**
 * Get store manifest (Agent Card)
 */
function getManifest() {
    return {
        protocol_version: "1.0",
        store_id: STORE_ID,
        merchant: {
            name: STORE_NAME,
            domain: STORE_DOMAIN,
            platform: "shopify"
        },
        capabilities: {
            catalog: {
                endpoint: `/api/subsidiaries/${STORE_ID}/products`,
                methods: ["GET"],
                filters: ["category", "availability"]
            },
            checkout: {
                endpoint: `https://${STORE_DOMAIN}/cart`,
                methods: ["REDIRECT"],
                note: "Checkout handled by Shopify"
            }
        },
        compliance: {
            ce_marking: true,
            medical_device_regulations: ["MDR 2017/745"],
            region: "EU"
        },
        transports: ["REST"],
        parent_orchestrator: "3a-automation.com"
    };
}

/**
 * Express router factory
 */
function createRouter(express) {
    const router = express.Router();

    // Manifest/Agent Card
    router.get('/manifest', (req, res) => {
        res.json(getManifest());
    });

    // Products endpoint
    router.get('/products', async (req, res) => {
        const country = req.headers['x-geo-country'] || req.query.country || 'FR';

        try {
            const products = await getProducts(country);
            res.json({
                protocol: "UCP/1.0",
                store_id: STORE_ID,
                store_name: STORE_NAME,
                context: {
                    country,
                    timestamp: new Date().toISOString()
                },
                data: products,
                meta: {
                    total: products.length,
                    cached: productsCache !== null
                }
            });
        } catch (error) {
            res.status(500).json({
                protocol: "UCP/1.0",
                error: {
                    code: "FETCH_FAILED",
                    message: error.message
                }
            });
        }
    });

    // Health check
    router.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            store_id: STORE_ID,
            shopify_configured: !!SHOPIFY_TOKEN,
            cache_age_ms: productsCache ? Date.now() - cacheTime : null,
            timestamp: new Date().toISOString()
        });
    });

    return router;
}

// CLI mode
if (require.main === module) {
    if (process.argv.includes('--health')) {
        console.log(JSON.stringify({
            status: 'ok',
            store_id: STORE_ID,
            shopify_configured: !!SHOPIFY_TOKEN,
            store_domain: STORE_DOMAIN
        }, null, 2));
        process.exit(0);
    }

    if (process.argv.includes('--products')) {
        getProducts().then(products => {
            console.log(JSON.stringify({ total: products.length, products }, null, 2));
            process.exit(0);
        });
    } else {
        console.log('Usage: node alpha-medical-proxy.cjs [--health|--products]');
    }
}

module.exports = { createRouter, getProducts, getManifest, STORE_ID };
