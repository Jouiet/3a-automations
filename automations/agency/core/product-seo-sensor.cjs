#!/usr/bin/env node
/**
 * Product SEO Receptor (Sensor)
 * 
 * Role: Non-agentic data fetcher. Updates GPM pressure based on Product SEO Quality.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

async function fetchShopifyProducts(shop, token) {
    if (!shop || !token) throw new Error('Shopify credentials missing');
    const url = `https://${shop}/admin/api/2024-01/products.json?limit=250&fields=id,title,body_html,images,tags`;
    const response = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`Shopify API Error: ${response.status}`);
    const data = await response.json();
    return data.products;
}

function calculateSEOStatus(products) {
    if (!products || products.length === 0) return 0;

    let poorSEOCount = 0;
    products.forEach(p => {
        const hasDescription = p.body_html && p.body_html.length > 200;
        const hasImages = p.images && p.images.length >= 3;
        const hasTags = p.tags && p.tags.split(',').length >= 5;

        if (!hasDescription || !hasImages || !hasTags) {
            poorSEOCount++;
        }
    });

    const poorRatio = poorSEOCount / products.length;
    // Pressure mapping: 100% poor = 95 pressure, 0% poor = 10 pressure
    return Math.min(95, Math.max(10, Math.floor(poorRatio * 100)));
}

function updateGPM(pressure, stats) {
    if (!fs.existsSync(GPM_PATH)) return;
    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    gpm.sectors.seo.product_enrichment = {
        pressure: pressure,
        trend: (gpm.sectors.seo.product_enrichment && pressure > gpm.sectors.seo.product_enrichment.pressure) ? "UP" : "DOWN",
        last_check: new Date().toISOString(),
        sensor_data: stats
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: Product SEO Pressure is ${pressure}`);
}

async function main() {
    try {
        const shop = process.env.SHOPIFY_SHOP || process.env.SHOPIFY_STORE || process.env.SHOPIFY_STORE_DOMAIN;
        const token = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

        if (!shop || !token) {
            console.warn("⚠️ Shopify credentials missing. Skipping product SEO sensor.");
            return;
        }

        const products = await fetchShopifyProducts(shop, token);
        const pressure = calculateSEOStatus(products);
        updateGPM(pressure, { product_count: products.length, poor_seo_ratio: (pressure / 100).toFixed(2) });
    } catch (e) {
        console.error("Product SEO Sensor Failure:", e.message);
    }
}

main();
