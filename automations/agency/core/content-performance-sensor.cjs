#!/usr/bin/env node
/**
 * Content Performance Sensor
 *
 * Role: Non-agentic data fetcher. Monitors content marketing performance.
 * Metrics: Blog engagement, WordPress stats, content velocity
 * Coverage: 19 content automations in registry
 * Priority: HAUTE
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

async function getWordPressMetrics(siteUrl, appPassword) {
    const metrics = {
        posts: { total: 0, published: 0, draft: 0, thisMonth: 0 },
        pages: { total: 0 },
        comments: { total: 0, pending: 0 },
        media: { total: 0 }
    };

    if (!siteUrl || !appPassword) return metrics;

    try {
        const baseUrl = siteUrl.replace(/\/$/, '');
        const authHeader = `Basic ${Buffer.from(appPassword).toString('base64')}`;

        // Get posts count
        const postsResponse = await httpRequest(`${baseUrl}/wp-json/wp/v2/posts?per_page=1&status=any`, {
            headers: { 'Authorization': authHeader }
        });
        if (postsResponse.status === 200) {
            // WordPress returns total in X-WP-Total header, but we can count from response
            metrics.posts.total = postsResponse.data?.length || 0;
        }

        // Get recent posts (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const recentResponse = await httpRequest(`${baseUrl}/wp-json/wp/v2/posts?after=${thirtyDaysAgo}&per_page=100`, {
            headers: { 'Authorization': authHeader }
        });
        if (recentResponse.status === 200 && Array.isArray(recentResponse.data)) {
            metrics.posts.thisMonth = recentResponse.data.length;
        }

        // Get published posts
        const publishedResponse = await httpRequest(`${baseUrl}/wp-json/wp/v2/posts?status=publish&per_page=100`, {
            headers: { 'Authorization': authHeader }
        });
        if (publishedResponse.status === 200 && Array.isArray(publishedResponse.data)) {
            metrics.posts.published = publishedResponse.data.length;
        }

    } catch (e) {
        console.error(`WordPress API Error: ${e.message}`);
    }

    return metrics;
}

async function getGA4ContentMetrics() {
    // This would use GA4 API to get page views, time on page, etc.
    // For now, return placeholder - GA4 sensor handles this
    return {
        pageViews: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        topPages: []
    };
}

function calculatePressure(metrics) {
    let pressure = 0;

    // No posts published = critical
    if (metrics.posts.published === 0) pressure += 40;

    // No content this month = high pressure
    if (metrics.posts.thisMonth === 0) pressure += 30;
    else if (metrics.posts.thisMonth < 4) pressure += 15; // Less than 1/week

    // Low total content = needs more
    if (metrics.posts.published < 10) pressure += 20;
    else if (metrics.posts.published < 20) pressure += 10;

    // Many pending comments = engagement but needs moderation
    if (metrics.comments.pending > 10) pressure += 10;

    return Math.min(pressure, 100);
}

function updateGPM(pressure, metrics) {
    if (!fs.existsSync(GPM_PATH)) {
        console.log('GPM file not found, skipping update');
        return;
    }

    const gpm = JSON.parse(fs.readFileSync(GPM_PATH, 'utf8'));

    const previousPressure = gpm.sectors?.marketing?.content_performance?.pressure;

    gpm.sectors = gpm.sectors || {};
    gpm.sectors.marketing = gpm.sectors.marketing || {};
    gpm.sectors.marketing.content_performance = {
        label: 'Content Performance',
        pressure: pressure,
        trend: pressure > (previousPressure || 0) ? 'UP' : pressure < (previousPressure || 0) ? 'DOWN' : 'STABLE',
        last_check: new Date().toISOString(),
        sensor_data: {
            posts_total: metrics.posts.published,
            posts_this_month: metrics.posts.thisMonth,
            posts_draft: metrics.posts.draft,
            comments_pending: metrics.comments.pending,
            content_velocity: metrics.posts.thisMonth > 0 ? 'ACTIVE' : 'STALE'
        }
    };

    gpm.last_updated = new Date().toISOString();
    fs.writeFileSync(GPM_PATH, JSON.stringify(gpm, null, 2));
    console.log(`📝 GPM Updated: Content Performance Pressure is ${pressure}`);
    console.log(`   Posts Published: ${metrics.posts.published}`);
    console.log(`   Posts This Month: ${metrics.posts.thisMonth}`);
    console.log(`   Content Velocity: ${metrics.posts.thisMonth > 0 ? 'ACTIVE' : 'STALE'}`);
}

async function main() {
    // Handle --health check - REAL API TEST (fixed Session 168quaterdecies)
    if (process.argv.includes('--health')) {
        const wpSiteUrl = process.env.WP_SITE_URL || process.env.WORDPRESS_URL;
        const wpAppPassword = process.env.WP_APP_PASSWORD || process.env.WORDPRESS_APP_PASSWORD;

        const health = {
            status: 'checking',
            sensor: 'content-performance-sensor',
            version: '1.1.0',
            credentials: {
                WP_SITE_URL: wpSiteUrl ? 'set' : 'missing',
                WP_APP_PASSWORD: wpAppPassword ? 'set' : 'missing'
            },
            metrics: ['posts', 'pages', 'comments', 'media'],
            timestamp: new Date().toISOString()
        };

        // REAL API TEST
        if (!wpSiteUrl) {
            health.status = 'error';
            health.error = 'WP_SITE_URL not set';
        } else {
            try {
                const baseUrl = wpSiteUrl.replace(/\/$/, '');
                const response = await httpRequest(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`);

                if (response.status === 200) {
                    health.status = 'ok';
                    health.api_test = 'passed';
                    health.wordpress_accessible = true;
                } else if (response.status === 401) {
                    health.status = 'degraded';
                    health.api_test = 'auth_required';
                    health.wordpress_accessible = true;
                    health.note = 'WordPress accessible but auth needed for full access';
                } else {
                    health.status = 'error';
                    health.api_test = 'failed';
                    health.http_status = response.status;
                }
            } catch (e) {
                health.status = 'error';
                health.api_test = 'failed';
                health.error = e.message;
            }
        }

        console.log(JSON.stringify(health, null, 2));
        process.exit(health.status === 'ok' ? 0 : (health.status === 'degraded' ? 0 : 1));
    }

    const wpSiteUrl = process.env.WP_SITE_URL || process.env.WORDPRESS_URL;
    const wpAppPassword = process.env.WP_APP_PASSWORD || process.env.WORDPRESS_APP_PASSWORD;

    console.log('📝 Fetching content performance metrics...');

    try {
        const metrics = await getWordPressMetrics(wpSiteUrl, wpAppPassword);
        const pressure = calculatePressure(metrics);
        updateGPM(pressure, metrics);
    } catch (e) {
        console.error(`❌ Content Performance Sensor Failure: ${e.message}`);
        updateGPM(70, {
            posts: { total: 0, published: 0, draft: 0, thisMonth: 0 },
            pages: { total: 0 },
            comments: { total: 0, pending: 0 },
            media: { total: 0 }
        });
    }
}

main();
