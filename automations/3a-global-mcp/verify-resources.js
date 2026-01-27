import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "build/index.js");

console.log("🔍 Verifying 3A Global MCP Resources & Prompts...");

const serverProcess = spawn("node", [SERVER_PATH], {
    env: { ...process.env, MCP_LOG_LEVEL: "debug" }
});

let isVerified = false;
let currentTestIndex = 0;

// Test Sequence: Handshake -> Resources -> Prompts
const tests = [
    { name: "handshake", method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "verify-resources", version: "1.0.0" } } },
    { name: "list_resources", method: "resources/list", params: {} },
    { name: "read_resource_automations", method: "resources/read", params: { uri: "3a://registry/automations" } },
    { name: "read_resource_pressure", method: "resources/read", params: { uri: "3a://sensors/pressure-matrix" } },
    { name: "list_prompts", method: "prompts/list", params: {} },
    { name: "get_prompt_health_report", method: "prompts/get", params: { name: "client_health_report", arguments: { client_id: "test-client" } } }
];

function runNextTest() {
    if (currentTestIndex >= tests.length) {
        console.log(`🎉 ALL ${tests.length} RESOURCE/PROMPT TESTS COMPLETED SUCCESSFULLY.`);
        isVerified = true;
        serverProcess.stdin.end(); // Close stdin to allow clean exit
        return;
    }

    const test = tests[currentTestIndex];
    const requestId = currentTestIndex + 1;
    const request = {
        jsonrpc: "2.0",
        id: requestId,
        method: test.method,
        params: test.params
    };

    console.log(`🚀 [${currentTestIndex + 1}/${tests.length}] Testing: ${test.name} (ID: ${requestId})`);
    serverProcess.stdin.write(JSON.stringify(request) + "\n");
}

let buffer = "";
serverProcess.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const response = JSON.parse(line);
            const expectedId = currentTestIndex + 1;

            if (response.id === expectedId) {
                // Additional validation
                if (response.error) {
                    console.error(`❌ Error in ${tests[currentTestIndex].name}:`, response.error);
                    process.exit(1);
                }

                // Check content validity
                if (tests[currentTestIndex].name === "read_resource_automations") {
                    const content = JSON.parse(response.result.contents[0].text);
                    console.log(`   ℹ️  Registry content: ${content.total} automations`);
                }

                console.log(`✅ [${currentTestIndex + 1}/${tests.length}] Verified: ${tests[currentTestIndex].name}`);
                currentTestIndex++;
                runNextTest();
            }
        } catch (e) {
            // Ignore non-JSON debug logs
            if (line.includes("error") || line.includes("FATAL")) {
                console.log(`⚠️  Stderr/Debug: ${line.substring(0, 150)}`);
            }
        }
    }
});

serverProcess.stderr.on("data", (data) => {
    // console.error(`[STDERR] ${data}`); // Verify strict mode
});

serverProcess.on("exit", (code) => {
    if (isVerified) {
        console.log("🎉 VERIFICATION RESULT: RESOURCES & PROMPTS ARE FUNCTIONAL.");
        process.exit(0);
    } else {
        console.error(`❌ VERIFICATION FAILED at test ${currentTestIndex + 1}`);
        process.exit(1);
    }
});

// Kickoff
runNextTest();

// Timeout
setTimeout(() => {
    if (!isVerified) {
        console.error("❌ TIMEOUT: Verification exceeded 30 seconds.");
        serverProcess.kill();
        process.exit(1);
    }
}, 30000);
