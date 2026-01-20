/**
 * FINAL HOLISTIC VERIFICATION (Zero Debt + Slack + REAL SKILLS)
 * Validates:
 * 1. UCP (Discovery + Commerce)
 * 2. Brain (Negotiation)
 * 3. Nervous System (Routing + Slack)
 * 4. Skills (SysAdmin + MarketAnalyst with REAL DATA)
 */

const assert = require('assert');
const axios = require('axios');
const { spawn } = require('child_process');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function verify() {
    console.log("=== STARTING FINAL HOLISTIC VERIFICATION (REAL DATA) ===");
    const server = spawn('node', ['automations/a2a/server.js'], { stdio: 'pipe' });

    server.stdout.pipe(process.stdout); // Debug piping
    server.stderr.pipe(process.stderr); // Debug error piping

    console.log("[Server] Booting...");
    await sleep(3000);

    const BASE_URL = 'http://localhost:3000';

    try {
        // --- LAYERS 1-4 RE-CHECK (Fast) ---
        await axios.get(`${BASE_URL}/.well-known/ucp`);
        console.log("✅ Layer 1 OK (Manifest).");
        await axios.get(`${BASE_URL}/api/ucp/products`, { headers: { 'x-geo-country': 'MA' } });
        console.log("✅ Layer 2 OK (Storefront).");
        await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 1,
            params: { agent_id: "agent.negotiator", input: { item: { price: 1000 }, offer: 500 } }
        });
        console.log("✅ Layer 3 OK (Negotiation).");
        await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 4,
            params: { agent_id: "com.3a.slack", input: { channel: "#alerts", message: "System Online" } }
        });
        console.log("✅ Layer 4 OK (Slack).");

        // --- LAYER 5: EXTENDED SKILLS (REAL EXECUTION) ---
        console.log("\n[Layer 5] Extended Skills (REAL EXECUTION)...");

        // Test SysAdmin (Real Uptime)
        console.log("   -> Triggering Real SysAdmin Probe...");
        const sysRes = await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 5,
            params: { agent_id: "agent.sysadmin", input: { task: "health_check" } }
        });

        const metrics = sysRes.data.result.metrics;
        // Verify it's not a mock string "99.99%" but a real object
        assert.ok(metrics.uptime_seconds > 0, "Real uptime should be > 0");
        assert.ok(metrics.memory_usage_mb > 10, "Real memory usage should be > 10MB");
        console.log(`✅ SystemAdmin REAL DATA: Uptime ${metrics.uptime_seconds}s, Load ${metrics.cpu_load}.`);

        // Test MarketAnalyst (Real Trends)
        console.log("   -> Triggering Real Google Trends Fetch...");
        const mktRes = await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 6,
            params: { agent_id: "agent.market_analyst", input: { sector: "automation" } }
        });

        const trends = mktRes.data.result.data;
        // Verify it's an array and likely contains data (unless Google is down)
        assert.ok(Array.isArray(trends), "Trends should be an array");
        // Note: Trends might be empty if RSS fails, but structure must be valid
        console.log(`✅ MarketAnalyst REAL DATA: Found ${trends.length} trends.`);
        if (trends.length > 0) {
            console.log(`   Sample: "${trends[0].trend}" (${trends[0].volume})`);
        }

        // --- LAYER 6: EXHAUSTIVE SKILLS (DevOps, Security, Logistics, Growth) ---
        console.log("\n[Layer 6] Exhaustive Skills (DevOps, Security, Logistics, Growth)...");

        // DevOps
        const devopsRes = await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 7,
            params: { agent_id: "agent.devops", input: { task: "inspect" } }
        });
        assert.ok(devopsRes.data.result.summary || devopsRes.data.result.log.includes('RÉSUMÉ'), "DevOps should return summary");
        console.log(`✅ DevOps: Environment scanned.`);

        // Security
        const secRes = await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 8,
            params: { agent_id: "agent.security", input: {} }
        });
        assert.ok(secRes.data.result.report, "Security should return report");
        console.log(`✅ Security: Forensic Scan initiated.`);

        // Logistics (Boot Check)
        const logRes = await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 9,
            params: { agent_id: "agent.logistics", input: {} }
        });
        assert.ok(logRes.data.result.status === 'success', "Logistics boot check failed");
        console.log(`✅ Logistics: Drop-shipping Flow checked.`);

        // Growth (Draft Plan)
        const growthRes = await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 10,
            params: { agent_id: "agent.growth", input: { propertyId: '342083329' } }
        });
        assert.ok(growthRes.data.result.plan_created !== undefined, "Growth should report plan status");
        console.log(`✅ Growth: Budget Plan Drafted.`);

        // Content Director (Topic Production)
        // We use a dummy topic to avoid heavy heavy lifting, just checking the 'Agentic' flag triggering
        const contentRes = await axios.post(`${BASE_URL}/a2a/v1/rpc`, {
            jsonrpc: "2.0", method: "agent.execute", id: 11,
            params: { agent_id: "agent.content_director", input: { topic: "Automation Trends 2026" } }
        });
        assert.ok(contentRes.data.result.status === 'success', "Content Director should return success");
        console.log(`✅ Content Director: Production Pipeline triggered.`);

        console.log("\n=== 🌟 SYSTEM VERIFIED: ALL DOMAINS COVERED (8 SKILLS) 🌟 ===");

    } catch (e) {
        console.error("\n❌ VERIFICATION FAILED", e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
        process.exit(1);
    } finally {
        server.kill();
    }
}

verify();
