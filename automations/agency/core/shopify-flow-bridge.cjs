#!/usr/bin/env node
/**
 * 3A AUTOMATION - Shopify Flow Agentic Bridge
 * 
 * ROLE: Listening for Shopify Flow HTTP requests and triggering agentic workflows.
 * INTEGRATION: Shopify Flow -> HTTP Action -> This Bridge -> DOE Orchestrator
 * 
 * @version 1.0.0
 * @date 2026-01-20
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Load env
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const PORT = process.env.SHOPIFY_BRIDGE_PORT || 3010;
const AUTH_TOKEN = process.env.SHOPIFY_FLOW_SECRET; // Shared secret between Flow and Bridge

const server = http.createServer(async (req, res) => {
    // 1. Auth check
    const token = req.headers['x-shopify-flow-secret'];
    if (AUTH_TOKEN && token !== AUTH_TOKEN) {
        console.warn(`[Shopify Bridge] Unauthorized attempt from ${req.socket.remoteAddress}`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    if (req.method === 'POST' && req.url === '/flow-trigger') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                console.log(`[Shopify Bridge] Received Flow Trigger: ${data.topic || 'Generic'}`);

                // Topic Handling (Hardened ACRA v2.0)
                if (data.topic === 'product_created') {
                    handleProductCreated(data.payload);
                } else if (data.topic === 'order_paid') {
                    handleOrderPaid(data.payload);
                } else if (data.topic === 'order_refunded') {
                    handleOrderRefunded(data.payload);
                } else if (data.topic === 'subscription_cancelled') {
                    handleSubscriptionCancelled(data.payload);
                } else if (data.topic === 'loyalty_tier_upgraded') {
                    handleLoyaltyTierUpgraded(data.payload);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ACCEPTED', timestamp: new Date().toISOString() }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

/**
 * Trigger Creative Mastery Pipeline
 */
function handleProductCreated(payload) {
    const productId = payload.id;
    const title = payload.title;
    console.log(`[Shopify Bridge] Initiating Creative Mastery for: ${title} (${productId})`);

    // Level 5 Sovereign: Let DOE Dispatcher handle the plan
    const directive = `Generate high-end photo and video for Shopify product "${title}" and update its metadata.`;

    // In a real production scenario, we'd use the DOE Orchestrator API
    // Here we simulate the call to our dispatcher
    const scriptPath = path.join(__dirname, 'doe-dispatcher.cjs');
    dispatchDirective(directive);
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC HANDLERS (Hardened ACRA v2.0)
// ─────────────────────────────────────────────────────────────────────────────

function handleOrderRefunded(payload) {
    const customerEmail = payload.customer?.email || 'unknown';
    console.log(`[Shopify Bridge] Refund Detected for ${customerEmail}. Triggering Churn Rescue...`);

    // Directive for the Sovereign Brain
    const directive = `Analyze refund context for ${customerEmail}. Initiate high-priority "Win-Back" rescue sequence. Check GA4 for behavioral signals and trigger personalized Grok-4.1 offer if propensity is high.`;
    dispatchDirective(directive);
}

function handleSubscriptionCancelled(payload) {
    const customerEmail = payload.customer?.email || 'unknown';
    console.log(`[Shopify Bridge] Subscription Cancelled by ${customerEmail}. Starting Exit Interview flow.`);

    const directive = `Initialize "Exit Interview" Voice AI trigger for ${customerEmail}. Inquire about cancellation reason and offer "Pause" skip instead of cancel.`;
    dispatchDirective(directive);
}

function handleLoyaltyTierUpgraded(payload) {
    const customerEmail = payload.customer?.email || 'unknown';
    const tier = payload.new_tier;
    console.log(`[Shopify Bridge] Loyalty Upgrade: ${customerEmail} is now ${tier}. Triggering Advocacy loop.`);

    const directive = `Customer ${customerEmail} reached ${tier} tier. Send "VIP Gift" notification and trigger "Referral Engine" invite. Initiate Leonard.ai to generate custom greeting card.`;
    dispatchDirective(directive);
}

function handleOrderPaid(payload) {
    const customerEmail = payload.customer?.email || 'unknown';
    const orderNumber = payload.order_number;
    console.log(`[Shopify Bridge] Order Paid: ${orderNumber}. Triggering Advanced Retention Workflow for ${customerEmail}.`);

    const directive = `Initiate Retention & Advocacy workflow for order ${orderNumber} (Email: ${customerEmail}). Send NPS survey in 7 days and check for advocacy potential.`;
    dispatchDirective(directive);
}

function dispatchDirective(directive) {
    const scriptPath = path.resolve(__dirname, 'doe-dispatcher.cjs');
    exec(`node "${scriptPath}" "${directive}" --execute`, (err, stdout, stderr) => {
        if (err) console.error(`[Shopify Bridge] Orchestration Error: ${err.message}`);
        console.log(`[Shopify Bridge] Orchestration Output: ${stdout}`);
    });
}

server.listen(PORT, () => {
    console.log(`🚀 [Shopify Bridge] Sovereign Agentic Hook active on port ${PORT}`);
});
