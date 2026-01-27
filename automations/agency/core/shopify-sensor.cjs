#!/usr/bin/env node
/**
 * Shopify Store Health Sensor
 *
 * Role: Non-agentic data fetcher. Monitors Shopify store health metrics.
 * Metrics: Products, Orders, Inventory, Fulfillment status
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

async function fetchShopifyData(shop, token, endpoint) {
    const url = `https://${shop}/admin/api/2024-01/${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error(`Shopify API Error: ${response.status} - ${await response.text()}`);
    return response.json();
}

async function getStoreHealth(shop, token) {
    const metrics = {
        products: { total: 0, active: 0, outOfStock: 0 },
        orders: { today: 0, pending: 0, unfulfilled: 0 },
        inventory: { lowStock: 0, totalVariants: 0 }
    };

    try {
        // Get products count
        const productsData = await fetchShopifyData(shop, token, 'products/count.json');
        metrics.products.total = productsData.count || 0;

        // Get active products
        const activeData = await fetchShopifyData(shop, token, 'products/count.json?status=active');
        metrics.products.active = activeData.count || 0;

        // Get orders (last 24h)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const ordersData = await fetchShopifyData(shop, token, `orders.json?status=any&created_at_min=${yesterday.toISOString()}&limit=250`);
        metrics.orders.today = ordersData.orders?.length || 0;

        // Count unfulfilled orders
        const unfulfilledData = await fetchShopifyData(shop, token, 'orders.json?fulfillment_status=unfulfilled&limit=250');
        metrics.orders.unfulfilled = unfulfilledData.orders?.length || 0;

        // Count pending orders
        const pendingData = await fetchShopifyData(shop, token, 'orders.json?financial_status=pending&limit=250');
        metrics.orders.pending = pendingData.orders?.length || 0;

    } catch (e) {
        console.error(`Shopify API Error: ${e.message}`);
    }

    return metrics;
}

function calculatePressure(metrics) {
    let pressure = 0;

    // High pressure if many unfulfilled orders
    if (metrics.orders.unfulfilled > 10) pressure += 30;
    else if (metrics.orders.unfulfilled > 5) pressure += 15;

    // High pressure if pending payments
    if (metrics.orders.pending > 5) pressure += 20;

    // Low orders = acquisition pressure
    if (metrics.orders.today === 0) pressure += 25;
    else if (metrics.orders.today < 3) pressure += 10;

    // No active products = critical
    if (metrics.products.active === 0) pressure += 50;

    return Math.min(pressure, 100);
}

function updateGPM(pressure, metrics) {
    if (!fs.existsSync(GPM_PATH)) {
        console.log('GPM file not found, skipping update');
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    gpm.sectors = gpm.sectors || {};
    gpm.sectors.operations = gpm.sectors.operations || {};
    gpm.sectors.operations.shopify = {
        pressure: pressure,
        trend: pressure > (gpm.sectors.operations.shopify?.pressure || 0) ? 'UP' : 'DOWN',
        last_check: new Date().toISOString(),
        sensor_data: {
            products_total: metrics.products.total,
            products_active: metrics.products.active,
            orders_today: metrics.orders.today,
            orders_unfulfilled: metrics.orders.unfulfilled,
            orders_pending: metrics.orders.pending
        }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📡 GPM Updated: Shopify Pressure is ${pressure}`);
    console.log(`   Products: ${metrics.products.active}/${metrics.products.total} active`);
    console.log(`   Orders Today: ${metrics.orders.today}, Unfulfilled: ${metrics.orders.unfulfilled}`);
}

/**
 * Multi-tenant execution with context injection
 * @param {Object} context - Tenant execution context
 * @returns {Promise<Object>} - Sensor result
 */
async function runWithContext(context) {
    const { secrets, logger, tenantId } = context;

    const shop = secrets.SHOPIFY_STORE || secrets.SHOPIFY_STORE_DOMAIN;
    const token = secrets.SHOPIFY_ACCESS_TOKEN || secrets.SHOPIFY_ADMIN_ACCESS_TOKEN;

    logger.info(`Running Shopify sensor for tenant ${tenantId}`);

    if (!shop || !token) {
        logger.warn('Shopify credentials missing');
        return {
            success: false,
            error: 'Missing credentials',
            metrics: null,
            pressure: 95
        };
    }

    try {
        const metrics = await getStoreHealth(shop, token);
        const pressure = calculatePressure(metrics);

        logger.info(`Shopify health check complete`, {
            store: shop,
            pressure,
            products: metrics.products.active,
            orders: metrics.orders.today
        });

        return {
            success: true,
            tenantId,
            store: shop,
            metrics,
            pressure,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error(`Shopify sensor failed: ${error.message}`);
        return {
            success: false,
            error: error.message,
            metrics: null,
            pressure: 80
        };
    }
}

/**
 * Legacy run function (backward compatibility)
 */
async function run(params = {}) {
    const shop = process.env.SHOPIFY_STORE || process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!shop || !token) {
        return { success: false, error: 'Missing credentials' };
    }

    const metrics = await getStoreHealth(shop, token);
    const pressure = calculatePressure(metrics);

    return {
        success: true,
        metrics,
        pressure,
        timestamp: new Date().toISOString()
    };
}

async function main() {
    // Handle --health check - REAL API TEST (fixed Session 168quaterdecies)
    if (process.argv.includes('--health')) {
        const shop = process.env.SHOPIFY_STORE || process.env.SHOPIFY_STORE_DOMAIN;
        const token = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

        const health = {
            status: 'checking',
            sensor: 'shopify-sensor',
            version: '1.1.0',
            credentials: {
                SHOPIFY_STORE: shop ? 'set' : 'missing',
                SHOPIFY_ACCESS_TOKEN: token ? 'set' : 'missing'
            },
            gpm_path: GPM_PATH,
            gpm_exists: fs.existsSync(GPM_PATH),
            metrics: ['products', 'orders', 'inventory'],
            timestamp: new Date().toISOString()
        };

        // REAL API TEST
        if (!shop) {
            health.status = 'error';
            health.error = 'SHOPIFY_STORE not set';
        } else if (!token) {
            health.status = 'error';
            health.error = 'SHOPIFY_ACCESS_TOKEN not set';
        } else {
            try {
                const productsData = await fetchShopifyData(shop, token, 'products/count.json');
                health.status = 'ok';
                health.api_test = 'passed';
                health.products_count = productsData.count || 0;
                health.store = shop;
            } catch (e) {
                health.status = 'error';
                health.api_test = 'failed';
                health.error = e.message.split('\n')[0];
            }
        }

        console.log(JSON.stringify(health, null, 2));
        process.exit(health.status === 'ok' ? 0 : 1);
    }

    const shop = process.env.SHOPIFY_STORE || process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!shop || !token) {
        console.log('⚠️ Shopify credentials missing. Reporting CRITICAL GAP.');
        updateGPM(95, { products: { total: 0, active: 0 }, orders: { today: 0, unfulfilled: 0, pending: 0 } });
        return;
    }

    try {
        console.log(`🏪 Fetching Shopify store health for ${shop}...`);
        const metrics = await getStoreHealth(shop, token);
        const pressure = calculatePressure(metrics);
        updateGPM(pressure, metrics);
    } catch (e) {
        console.error(`❌ Shopify Sensor Failure: ${e.message}`);
        updateGPM(80, { products: { total: 0, active: 0 }, orders: { today: 0, unfulfilled: 0, pending: 0 } });
    }
}

// Export for multi-tenant usage
module.exports = { run, runWithContext };

// CLI execution
if (require.main === module) {
    main();
}
