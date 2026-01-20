/**
 * Empiric Verification: UCP Manifest & Endpoints
 * Tests:
 * 1. GET /.well-known/ucp (Discovery)
 * 2. GET /api/ucp/products (Storefront)
 */

const assert = require('assert');
const axios = require('axios');
const { spawn } = require('child_process');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function verify() {
    console.log("=== STARTING MANIFEST VERIFICATION ===");

    // 1. Start Server
    const server = spawn('node', ['automations/a2a/server.js'], { stdio: 'pipe' });
    console.log("[Server] Booting...");
    await sleep(2000);

    try {
        // TEST 1: Manifest Discovery
        console.log("[Test 1] Fetching Manifest at /.well-known/ucp...");
        const manRes = await axios.get('http://localhost:3000/.well-known/ucp');
        assert.equal(manRes.data.protocol_version, '1.0');
        console.log("✅ Manifest Found & Valid.");

        // TEST 2: Products Endpoint
        console.log("[Test 2] Hitting Storefront...");
        const prodRes = await axios.get('http://localhost:3000/api/ucp/products');
        assert.equal(prodRes.data.protocol, 'UCP/1.0');
        console.log("✅ Storefront Accessible.");

    } catch (e) {
        console.error("❌ VERIFICATION FAILED", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
        process.exit(1);
    } finally {
        server.kill();
        console.log("=== SYSTEM SHUTDOWN ===");
    }
}

verify();
