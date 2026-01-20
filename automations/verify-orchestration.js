/**
 * Comprehensive Verification (Routing + Negotiation + Registry)
 */

const assert = require('assert');
const axios = require('axios');
const { spawn } = require('child_process');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function verify() {
    console.log("=== STARTING CLUSTER ORCHESTRATION VERIFICATION ===");

    // 1. Start Server
    const server = spawn('node', ['automations/a2a/server.js'], { stdio: 'pipe' });
    let serverOutput = '';
    server.stdout.on('data', d => serverOutput += d.toString());
    console.log("[Server] Booting...");
    await sleep(2000);

    try {
        const URL = 'http://localhost:3000/a2a/v1/rpc';

        // TEST 1: Negotiation Logic via RPC
        console.log("[Test 1] Negotation Brain via RPC...");
        const negRes = await axios.post(URL, {
            jsonrpc: "2.0",
            method: "agent.execute",
            params: {
                agent_id: "agent.negotiator",
                input: {
                    item: { price: 1000 },
                    offer: 500
                }
            },
            id: 1
        });

        assert.equal(negRes.data.result.action, 'REJECT');
        console.log("✅ Negotiator RPC logic verified.");

        // TEST 2: Strategic Routing (Compliance -> Claude)
        console.log("[Test 2] Strategic Routing (Compliance)...");
        const routeRes = await axios.post(URL, {
            jsonrpc: "2.0",
            method: "agent.execute",
            params: {
                agent_id: "com.3a.generalist", // Generic entry
                input: "Audit this contract",
                tags: ["compliance"]
            },
            id: 2
        });

        // Current implementation is mock fallback for Gemini/Claude, check if output reflects redirect
        assert.ok(routeRes.data.result.agent.includes('claude'), "Should route to Claude");
        console.log("✅ Routing to Claude Verified.");

        // TEST 3: Registry (Voice Script)
        console.log("[Test 3] Calling Registered Script Agent...");
        const voiceRes = await axios.post(URL, {
            jsonrpc: "2.0",
            method: "agent.execute",
            params: {
                agent_id: "com.3a.voice",
                input: "Call +123456"
            },
            id: 3
        });
        assert.equal(voiceRes.data.result.status, 'queued');
        console.log("✅ Voice Agent Registry Verified.");

    } catch (e) {
        console.error("❌ VERIFICATION FAILED", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
        console.error("Server Log:", serverOutput);
        process.exit(1);
    } finally {
        server.kill();
        console.log("=== SYSTEM SHUTDOWN ===");
    }
}

verify();
