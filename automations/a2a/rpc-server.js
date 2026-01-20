/**
 * A2A (Agent 2 Agent) - Peer-to-Peer Protocol (Google Spec)
 * Implements JSON-RPC 2.0 Server over HTTP.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Load Agent Cards
const AGENT_CARDS = {};
const SKILLS_DIR = path.join(__dirname, '../../.agent/skills');

const loadCapabilities = () => {
    // In a real system, this would crawl the network.
    // Here we crawl the local skills folder to build the registry dynamically.
    if (fs.existsSync(SKILLS_DIR)) {
        // ... Logic to parse SKILL.md and generate cards ...
        // For demonstration rigor, we hardcode the known compliant structure
        AGENT_CARDS['agency-sales'] = {
            id: 'agency-sales',
            protocol: 'A2A',
            rpc_endpoint: 'http://localhost:3001/a2a/rpc',
            capabilities: ['qualify', 'book_audit']
        };
    }
};
loadCapabilities();

/**
 * JSON-RPC 2.0 Processor
 */
const rpcProcess = async (body) => {
    const { jsonrpc, method, params, id } = body;

    if (jsonrpc !== '2.0') {
        return { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null };
    }

    // Routing Logic
    // method: "agent.capability" e.g., "agency-sales.qualify"

    const [agent, capability] = method.split('.');

    if (!AGENT_CARDS[agent]) {
        return { jsonrpc: '2.0', error: { code: -32601, message: 'Agent not found' }, id };
    }

    // Execute logic (Simulated)
    console.log(`[A2A] RPC Call: ${agent} -> ${capability}`, params);

    return {
        jsonrpc: '2.0',
        result: { status: 'success', data: `Processed ${capability} for ${agent}` },
        id
    };
};

/**
 * POST /a2a/rpc
 * The main entry point for Inter-Agent Communication.
 */
app.post('/a2a/rpc', async (req, res) => {
    const response = await rpcProcess(req.body);
    res.json(response);
});

// Run
const PORT = process.env.A2A_PORT || 3001;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[A2A] JSON-RPC Node running on port ${PORT}`);
    });
}

module.exports = app;
