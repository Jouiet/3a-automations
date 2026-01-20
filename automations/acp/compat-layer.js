/**
 * ACP Compatibility Layer (The "Bridge")
 * Purpose: Allows legacy ACP agents (IBM Spec) to talk to the new A2A Network (Google Spec).
 * 
 * Logic:
 * POST /acp/tasks -> Converts to A2A 'agent.execute' RPC call.
 */

const express = require('express');
const axios = require('axios');
const app = express();
const { v4: uuidv4 } = require('uuid');

app.use(express.json());

const A2A_ENDPOINT = 'http://localhost:3000/a2a/v1/rpc';

app.post('/acp/v1/tasks', async (req, res) => {
    const { task_type, payload } = req.body;

    // 1. Convert Legacy ACP Payload to A2A RPC
    // Assumption: 'task_type' maps to an agent capability
    const rpcPayload = {
        jsonrpc: '2.0',
        method: 'agent.execute',
        params: {
            agent_id: 'com.3a.generalist', // Default router
            input: task_type,
            details: payload
        },
        id: uuidv4()
    };

    try {
        // 2. Forward to A2A Backbone
        const response = await axios.post(A2A_ENDPOINT, rpcPayload);

        // 3. Convert RPC Response back to ACP REST format
        res.json({
            status: 'success',
            data: response.data.result
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Run
const PORT = process.env.ACP_PORT || 3005;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[ACP-Bridge] Compatibility Layer running on ${PORT}`);
        console.log(`[ACP-Bridge] Forwarding traffic to A2A Backbone.`);
    });
}
