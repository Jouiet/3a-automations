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

                // Topic Handling
                if (data.topic === 'product_created') {
                    handleProductCreated(data.payload);
                } else if (data.topic === 'order_paid') {
                    handleOrderPaid(data.payload);
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
    exec(`node "${scriptPath}" "${directive}" --execute`, (err, stdout, stderr) => {
        if (err) console.error(`[Shopify Bridge] Orchestration Error: ${err.message}`);
        console.log(`[Shopify Bridge] Orchestration Output: ${stdout}`);
    });
}

function handleOrderPaid(payload) {
    console.log(`[Shopify Bridge] Order Paid: ${payload.order_number}. Triggering Retention Flow.`);
    // Trigger GPM pressure update or direct retention script
}

server.listen(PORT, () => {
    console.log(`🚀 [Shopify Bridge] Sovereign Agentic Hook active on port ${PORT}`);
});
