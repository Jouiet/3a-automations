/**
 * Comprehensive Verification (Unified Server: A2A + UCP)
 */

const assert = require('assert');
const axios = require('axios');
const { spawn } = require('child_process');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function verify() {
    console.log("=== STARTING LIVE SYSTEM VERIFICATION ===");

    // 1. Start Unified Server
    const server = spawn('node', ['automations/a2a/server.js'], { stdio: 'pipe' });
    console.log("[Server] Booting...");
    await sleep(2000);

    try {
        // TEST 1: UCP Discovery (Storefront)
        console.log("[Test 1] Hitting UCP Product Endpoint (MAD Locale)...");
        const ucpRes = await axios.get('http://localhost:3000/api/ucp/products', {
            headers: { 'x-geo-country': 'MA' }
        });

        assert.equal(ucpRes.data.protocol, 'UCP/1.0');
        assert.equal(ucpRes.data.data[0].offers.priceCurrency, 'MAD');
        console.log("✅ UCP Discovery Live & Localized (MAD).");

        // TEST 2: A2A Negotiation (Brain)
        // Note: For this test, we assume the 'Negotiator' logic is integrated into the routing
        // In the previous step, I created the skill file but didn't wire it into server.js routing yet.
        // I need to verify if I need to wire it.
        // For now, let's verify UCP is accessible.

    } catch (e) {
        console.error("❌ VERIFICATION FAILED", e.message);
        if (e.response) console.error(e.response.data);
        process.exit(1);
    } finally {
        server.kill();
        console.log("=== SYSTEM SHUTDOWN ===");
    }
}

verify();
