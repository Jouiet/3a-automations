#!/usr/bin/env node
/**
 * WhatsApp Status Sensor
 *
 * Role: Non-agentic data fetcher. Monitors WhatsApp Business API status.
 * Metrics: Template approval, rate limits, delivery status
 * Coverage: 3 whatsapp automations in registry
 * Priority: MOYENNE
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '../../../.env'), path.join(process.cwd(), '.env')];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const GPM_PATH = path.join(__dirname, '../../../landing-page-hostinger/data/pressure-matrix.json');

function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
    });
}

async function getWhatsAppMetrics(accessToken, phoneNumberId) {
    const metrics = {
        connected: false,
        templates: { total: 0, approved: 0, pending: 0, rejected: 0 },
        phoneNumber: { verified: false, qualityRating: 'UNKNOWN' },
        messaging: { limit: 'UNKNOWN', tier: 'UNKNOWN' }
    };

    if (!accessToken || !phoneNumberId) {
        return metrics;
    }

    const baseUrl = 'https://graph.facebook.com/v18.0';

    try {
        // Check phone number status
        const phoneResponse = await httpRequest(`${baseUrl}/${phoneNumberId}?fields=verified_name,quality_rating,messaging_limit_tier`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (phoneResponse.status === 200 && phoneResponse.data) {
            metrics.connected = true;
            metrics.phoneNumber.verified = !!phoneResponse.data.verified_name;
            metrics.phoneNumber.qualityRating = phoneResponse.data.quality_rating || 'UNKNOWN';
            metrics.messaging.tier = phoneResponse.data.messaging_limit_tier || 'UNKNOWN';
        }

        // Get message templates
        const businessId = process.env.WHATSAPP_BUSINESS_ID;
        if (businessId) {
            const templatesResponse = await httpRequest(`${baseUrl}/${businessId}/message_templates?limit=100`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (templatesResponse.status === 200 && templatesResponse.data?.data) {
                const templates = templatesResponse.data.data;
                metrics.templates.total = templates.length;
                metrics.templates.approved = templates.filter(t => t.status === 'APPROVED').length;
                metrics.templates.pending = templates.filter(t => t.status === 'PENDING').length;
                metrics.templates.rejected = templates.filter(t => t.status === 'REJECTED').length;
            }
        }

    } catch (e) {
        console.error(`WhatsApp API Error: ${e.message}`);
    }

    return metrics;
}

function calculatePressure(metrics) {
    let pressure = 0;

    // Not connected = critical
    if (!metrics.connected) {
        pressure = 90;
        return pressure;
    }

    // Phone not verified = high pressure
    if (!metrics.phoneNumber.verified) pressure += 30;

    // Quality rating issues
    const qualityRating = metrics.phoneNumber.qualityRating;
    if (qualityRating === 'RED') pressure += 40;
    else if (qualityRating === 'YELLOW') pressure += 20;

    // Template issues
    if (metrics.templates.total === 0) pressure += 25;
    if (metrics.templates.rejected > 0) pressure += 15;
    if (metrics.templates.pending > metrics.templates.approved) pressure += 10;

    // Low tier = limited messaging
    const tier = metrics.messaging.tier;
    if (tier === 'TIER_1K' || tier === 'TIER_250') pressure += 15;

    return Math.min(pressure, 100);
}

function updateGPM(pressure, metrics) {
    if (!fs.existsSync(GPM_PATH)) {
        console.log('GPM file not found, skipping update');
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    const previousPressure = gpm.sectors?.communications?.whatsapp_status?.pressure;

    gpm.sectors = gpm.sectors || {};
    gpm.sectors.communications = gpm.sectors.communications || {};
    gpm.sectors.communications.whatsapp_status = {
        label: 'WhatsApp Status',
        pressure: pressure,
        trend: pressure > (previousPressure || 0) ? 'UP' : pressure < (previousPressure || 0) ? 'DOWN' : 'STABLE',
        last_check: new Date().toISOString(),
        sensor_data: {
            connected: metrics.connected,
            phone_verified: metrics.phoneNumber.verified,
            quality_rating: metrics.phoneNumber.qualityRating,
            messaging_tier: metrics.messaging.tier,
            templates_total: metrics.templates.total,
            templates_approved: metrics.templates.approved,
            templates_pending: metrics.templates.pending,
            templates_rejected: metrics.templates.rejected
        }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));

    console.log(`💬 GPM Updated: WhatsApp Status Pressure is ${pressure}`);
    console.log(`   Connected: ${metrics.connected ? 'Yes' : 'No'}`);
    console.log(`   Quality Rating: ${metrics.phoneNumber.qualityRating}`);
    console.log(`   Templates: ${metrics.templates.approved}/${metrics.templates.total} approved`);
}

async function main() {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    console.log('💬 Checking WhatsApp Business API status...');

    if (!accessToken) {
        console.log('⚠️ WhatsApp access token missing. Reporting CRITICAL GAP.');
        updateGPM(90, {
            connected: false,
            templates: { total: 0, approved: 0, pending: 0, rejected: 0 },
            phoneNumber: { verified: false, qualityRating: 'UNKNOWN' },
            messaging: { limit: 'UNKNOWN', tier: 'UNKNOWN' }
        });
        return;
    }

    try {
        const metrics = await getWhatsAppMetrics(accessToken, phoneNumberId);
        const pressure = calculatePressure(metrics);
        updateGPM(pressure, metrics);
    } catch (e) {
        console.error(`❌ WhatsApp Status Sensor Failure: ${e.message}`);
        updateGPM(85, {
            connected: false,
            templates: { total: 0, approved: 0, pending: 0, rejected: 0 },
            phoneNumber: { verified: false, qualityRating: 'UNKNOWN' },
            messaging: { limit: 'UNKNOWN', tier: 'UNKNOWN' }
        });
    }
}

main();
