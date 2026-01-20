const fs = require('fs');
const path = require('path');
const gateway = require('../../../automations/agency/core/gateways/llm-global-gateway.cjs');

// SOVEREIGN GSD ENGINE - RECURSIVE SPAWN (NODE.JS)
// Version: 2.0 (Faldown Enabled)
// Context: Stateless Sub-Agent Spawner with Depth Control & Multi-Provider Fallback

async function main() {
    // 1. Parse Arguments
    const args = process.argv.slice(2);
    const promptArgIndex = args.indexOf('--prompt');
    const filesArgIndex = args.indexOf('--files');
    const depthArgIndex = args.indexOf('--depth');

    if (promptArgIndex === -1) {
        console.error("Usage: node spawn_agent.js --prompt 'Task' --files file1.js file2.js --depth 0");
        process.exit(1);
    }

    const taskPrompt = args[promptArgIndex + 1];
    let depth = 0;
    if (depthArgIndex !== -1) {
        depth = parseInt(args[depthArgIndex + 1], 10);
    }

    // 2. SOVEREIGN SAFETY: RECURSION BLOCKER
    if (depth > 0) {
        console.error("SOVEREIGN PROTOCOL: Recursion depth limit reached (Max: 0). Sub-agents cannot spawn sub-agents.");
        process.exit(1);
    }

    // 3. Context Buildup
    let fileContext = "";
    if (filesArgIndex !== -1) {
        // Collect files until next flag or end
        let i = filesArgIndex + 1;
        while (i < args.length && !args[i].startsWith('--')) {
            const filePath = args[i];
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                fileContext += `\n\n--- FILE: ${filePath} ---\n${content}\n--- END FILE ---\n`;
            } catch (e) {
                console.warn(`Warning: Could not read ${filePath}: ${e.message}`);
            }
            i++;
        }
    }

    // 4. Prompt Engineering (Sovereign L5 Spec)
    const systemPrompt = `You are a Sovereign Sub-Agent (Level 5).
You have been spawned to execute a specific task in isolation.
You do not have access to the main conversation history.
Focus ONLY on the requested task. Return RAW output (code or text) without conversational filler.
If responding with code, output ONLY valid code within code blocks.`;

    const fullMessage = `${systemPrompt}\n\nCONTEXT FILES:\n${fileContext}\n\nTASK:\n${taskPrompt}`;

    // 5. Execution via Faldown Gateway
    try {
        console.error("⚡ Spawning Sovereign Agent via Faldown Protocol...");
        const result = await gateway.generateWithFallback(fullMessage);

        // Output result to STDOUT for the parent process to capture
        console.log(result);
    } catch (e) {
        console.error(`CRITICAL SPAWN ERROR: ${e.message}`);
        process.exit(1);
    }
}

main();
