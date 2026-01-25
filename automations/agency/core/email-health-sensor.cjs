#!/usr/bin/env node
/**
 * Email Health Sensor
 *
 * Role: Non-agentic data fetcher. Monitors email marketing health.
 * Metrics: Bounce rate, Open rate, Spam complaints, Deliverability
 * Coverage: 11 email automations in registry
 * Priority: CRITIQUE (email = canal principal)
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

// Thresholds for pressure calculation
const THRESHOLDS = {
    bounceRate: { warning: 2, critical: 5 },      // percentage
    spamRate: { warning: 0.1, critical: 0.5 },    // percentage
    openRate: { warning: 15, critical: 10 },      // percentage (lower = bad)
    clickRate: { warning: 2, critical: 1 }        // percentage (lower = bad)
};

// Latest Klaviyo API revision (January 2026)
const KLAVIYO_API_REVISION = '2026-01-15';

async function klaviyoRequest(endpoint, apiKey) {
    const cleanEndpoint = endpoint.replace(/^\//, '').replace(/\/$/, '');
    const response = await fetch(`https://a.klaviyo.com/api/${cleanEndpoint}`, {
        headers: {
            'Authorization': `Klaviyo-API-Key ${apiKey}`,
            'revision': KLAVIYO_API_REVISION,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`Klaviyo API Error: ${response.status} - ${errorBody.substring(0, 100)}`);
    }
    return response.json();
}

async function getEmailHealthMetrics(apiKey) {
    const metrics = {
        deliverability: {
            bounceRate: 0,
            spamRate: 0,
            unsubscribeRate: 0
        },
        engagement: {
            openRate: 0,
            clickRate: 0,
            conversionRate: 0
        },
        lists: {
            total: 0,
            growthRate: 0,
            suppressedCount: 0
        },
        campaigns: {
            sent: 0,
            delivered: 0,
            failed: 0
        }
    };

    try {
        // Get metrics aggregates from Klaviyo
        const metricsData = await klaviyoRequest('metrics', apiKey);

        // Get lists for subscriber health
        const listsData = await klaviyoRequest('lists', apiKey);
        metrics.lists.total = listsData.data?.length || 0;

        // Get campaigns with required channel filter
        let campaigns = [];
        try {
            const campaignsData = await klaviyoRequest('campaigns?filter=equals(messages.channel,"email")', apiKey);
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            campaigns = (campaignsData.data || []).filter(c => {
                const createdAt = new Date(c.attributes?.created_at).getTime();
                return createdAt >= thirtyDaysAgo;
            });
        } catch (e) {
            console.log('⚠️ Campaigns fetch skipped');
        }
        metrics.campaigns.sent = campaigns.length;

        // Calculate aggregate metrics from campaigns
        let totalOpens = 0;
        let totalClicks = 0;
        let totalBounces = 0;
        let totalDelivered = 0;

        for (const campaign of campaigns.slice(0, 10)) { // Last 10 campaigns
            const stats = campaign.attributes?.send_options || {};
            if (stats.delivered) totalDelivered += stats.delivered;
            if (stats.opened) totalOpens += stats.opened;
            if (stats.clicked) totalClicks += stats.clicked;
            if (stats.bounced) totalBounces += stats.bounced;
        }

        // Calculate rates
        if (totalDelivered > 0) {
            metrics.engagement.openRate = Math.round((totalOpens / totalDelivered) * 100 * 10) / 10;
            metrics.engagement.clickRate = Math.round((totalClicks / totalDelivered) * 100 * 10) / 10;
        }

        const totalSent = totalDelivered + totalBounces;
        if (totalSent > 0) {
            metrics.deliverability.bounceRate = Math.round((totalBounces / totalSent) * 100 * 10) / 10;
        }

        metrics.campaigns.delivered = totalDelivered;
        metrics.campaigns.failed = totalBounces;

    } catch (e) {
        console.error(`Klaviyo API Error: ${e.message}`);
    }

    return metrics;
}

function calculatePressure(metrics) {
    let pressure = 0;

    // Bounce rate pressure (high bounce = high pressure)
    if (metrics.deliverability.bounceRate >= THRESHOLDS.bounceRate.critical) pressure += 30;
    else if (metrics.deliverability.bounceRate >= THRESHOLDS.bounceRate.warning) pressure += 15;

    // Spam rate pressure
    if (metrics.deliverability.spamRate >= THRESHOLDS.spamRate.critical) pressure += 35;
    else if (metrics.deliverability.spamRate >= THRESHOLDS.spamRate.warning) pressure += 20;

    // Open rate pressure (low open = high pressure)
    if (metrics.engagement.openRate <= THRESHOLDS.openRate.critical) pressure += 25;
    else if (metrics.engagement.openRate <= THRESHOLDS.openRate.warning) pressure += 10;

    // Click rate pressure (low click = medium pressure)
    if (metrics.engagement.clickRate <= THRESHOLDS.clickRate.critical) pressure += 15;
    else if (metrics.engagement.clickRate <= THRESHOLDS.clickRate.warning) pressure += 5;

    // No lists = critical
    if (metrics.lists.total === 0) pressure += 30;

    // No campaigns sent = acquisition pressure
    if (metrics.campaigns.sent === 0) pressure += 20;

    return Math.min(pressure, 100);
}

function determineTrend(current, previous) {
    if (!previous) return 'STABLE';
    const diff = current - previous;
    if (diff > 5) return 'UP';
    if (diff < -5) return 'DOWN';
    return 'STABLE';
}

function updateGPM(pressure, metrics) {
    if (!fs.existsSync(GPM_PATH)) {
        console.log('GPM file not found, skipping update');
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    const previousPressure = gpm.sectors?.marketing?.email_health?.pressure;

    gpm.sectors = gpm.sectors || {};
    gpm.sectors.marketing = gpm.sectors.marketing || {};
    gpm.sectors.marketing.email_health = {
        label: 'Email Health',
        pressure: pressure,
        trend: determineTrend(pressure, previousPressure),
        last_check: new Date().toISOString(),
        sensor_data: {
            bounce_rate: metrics.deliverability.bounceRate,
            spam_rate: metrics.deliverability.spamRate,
            open_rate: metrics.engagement.openRate,
            click_rate: metrics.engagement.clickRate,
            lists_total: metrics.lists.total,
            campaigns_sent_30d: metrics.campaigns.sent,
            campaigns_delivered: metrics.campaigns.delivered
        }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📧 GPM Updated: Email Health Pressure is ${pressure}`);
    console.log(`   Bounce Rate: ${metrics.deliverability.bounceRate}%`);
    console.log(`   Open Rate: ${metrics.engagement.openRate}%`);
    console.log(`   Click Rate: ${metrics.engagement.clickRate}%`);
    console.log(`   Lists: ${metrics.lists.total}, Campaigns (30d): ${metrics.campaigns.sent}`);
}

async function main() {
    const apiKey = process.env.KLAVIYO_API_KEY || process.env.KLAVIYO_PRIVATE_API_KEY;

    if (!apiKey) {
        console.log('⚠️ Klaviyo API key missing. Reporting CRITICAL GAP.');
        updateGPM(95, {
            deliverability: { bounceRate: 0, spamRate: 0, unsubscribeRate: 0 },
            engagement: { openRate: 0, clickRate: 0, conversionRate: 0 },
            lists: { total: 0, growthRate: 0, suppressedCount: 0 },
            campaigns: { sent: 0, delivered: 0, failed: 0 }
        });
        return;
    }

    try {
        console.log('📧 Fetching email health metrics from Klaviyo...');
        const metrics = await getEmailHealthMetrics(apiKey);
        const pressure = calculatePressure(metrics);
        updateGPM(pressure, metrics);
    } catch (e) {
        console.error(`❌ Email Health Sensor Failure: ${e.message}`);
        updateGPM(80, {
            deliverability: { bounceRate: 0, spamRate: 0, unsubscribeRate: 0 },
            engagement: { openRate: 0, clickRate: 0, conversionRate: 0 },
            lists: { total: 0, growthRate: 0, suppressedCount: 0 },
            campaigns: { sent: 0, delivered: 0, failed: 0 }
        });
    }
}

main();
