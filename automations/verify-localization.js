/**
 * Empiric Verification: Global Localization (3-Tier)
 * Standard:
 * 1. Maghreb -> MAD + FR
 * 2. Europe -> EUR + FR
 * 3. World -> USD + EN
 */

const assert = require('assert');
const axios = require('axios');
const { spawn } = require('child_process');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function verify() {
    console.log("=== STARTING GLOBAL LOCALIZATION VERIFICATION ===");

    // 1. Start Server
    const server = spawn('node', ['automations/a2a/server.js'], { stdio: 'pipe' });
    console.log("[Server] Booting...");
    await sleep(2000);

    try {
        const ENDPOINT = 'http://localhost:3000/api/ucp/products';

        // TEST 1: Morocco (Maghreb)
        console.log("[Test 1] Region: Maghreb (MA)");
        const resMA = await axios.get(ENDPOINT, { headers: { 'x-geo-country': 'MA' } });
        assert.equal(resMA.data.context.currency, 'MAD', "MA Should be MAD");
        assert.equal(resMA.data.context.lang, 'fr', "MA Should be FR");
        console.log("✅ Maghreb OK.");

        // TEST 2: France (Europe)
        console.log("[Test 2] Region: Europe (FR)");
        const resFR = await axios.get(ENDPOINT, { headers: { 'x-geo-country': 'FR' } });
        assert.equal(resFR.data.context.currency, 'EUR', "FR Should be EUR");
        assert.equal(resFR.data.context.lang, 'fr', "FR Should be FR");
        console.log("✅ Europe OK.");

        // TEST 3: USA (International/RoW)
        console.log("[Test 3] Region: International (US)");
        const resUS = await axios.get(ENDPOINT, { headers: { 'x-geo-country': 'US' } });
        assert.equal(resUS.data.context.currency, 'USD', "US Should be USD");
        assert.equal(resUS.data.context.lang, 'en', "US Should be EN");
        console.log("✅ International OK.");

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
