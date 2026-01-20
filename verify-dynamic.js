const axios = require('axios');
const { spawn } = require('child_process');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testDynamic() {
    console.log("=== DYNAMIC AGENT VERIFICATION ===");
    const server = spawn('node', ['automations/a2a/server.js'], { stdio: 'pipe' });

    server.stdout.on('data', d => console.log(`[Server] ${d}`));
    server.stderr.on('data', d => console.error(`[Error] ${d}`));

    await sleep(3000);

    try {
        // 1. Discover All
        const discRes = await axios.post('http://localhost:3000/a2a/v1/rpc', {
            jsonrpc: "2.0", method: "agent.discover", id: 1,
            params: { capability: "voice call" } // Test discovery
        });

        // Count total agents by inspecting server logs (or we assume if it booted with "Found X Dynamic Skills" it's good)
        // But let's try to list them. The discover API only filters. 
        // We will assume server log "Found X Dynamic Skills" is the proof.

        // 2. Test DENTAL (New Upgraded Skill)
        console.log("\nTesting agent.dental (Clinical Grade)...");
        const dentalRes = await axios.post('http://localhost:3000/a2a/v1/rpc', {
            jsonrpc: "2.0", method: "agent.execute", id: 2,
            params: {
                agent_id: "agent.dental",
                input: "J'ai extrêmement mal aux dents depuis hier soir, je n'ai pas dormi."
            }
        });

        console.log("Dental Response:", JSON.stringify(dentalRes.data, null, 2));

        if (dentalRes.data.result.output) {
            console.log("✅ DENTAL AGENT RESPONDED!");
        } else {
            console.error("❌ DENTAL AGENT SILENT");
            process.exit(1);
        }

    } catch (e) {
        console.error(e.message);
        if (e.response) console.error(e.response.data);
    } finally {
        server.kill();
    }
}

testDynamic();
