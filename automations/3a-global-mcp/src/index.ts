import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const REGISTRY_PATH = path.resolve(__dirname, "../../automations-registry.json");

// Observability Logger
const logger = {
    info: (message: string, data?: any) => {
        const entry = {
            timestamp: new Date().toISOString(),
            level: "INFO",
            message,
            ...data
        };
        console.error(JSON.stringify(entry));
    },
    error: (message: string, error?: any) => {
        const entry = {
            timestamp: new Date().toISOString(),
            level: "ERROR",
            message,
            error: error?.message || error
        };
        console.error(JSON.stringify(entry));
    }
};

// Load Registry
const loadRegistry = () => {
    try {
        const data = fs.readFileSync(REGISTRY_PATH, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        logger.error("Failed to load registry", e);
        return { automations: [], categories: {} };
    }
};

// Define the server
const server = new Server(
    {
        name: "3a-global-mcp",
        version: "1.1.0",
    },
    {
        capabilities: {
            tools: {},
            logging: {},
            prompt_caching: {}
        },
    }
);

// Map registry to MCP tools
const registry = loadRegistry();
const TOOLS = registry.automations.map((tool: any) => ({
    name: tool.id.replace(/-/g, "_"),
    description: tool.semantic_description || tool.name_en || tool.id,
    inputSchema: {
        type: "object",
        properties: {
            payload: { type: "object", description: "JSON payload for the tool" },
            test_mode: { type: "boolean" }
        }
    }
}));

// Add Meta Tools
TOOLS.push({
    name: "get_global_status",
    description: "Returns the status of the 3A Global MCP Router.",
    inputSchema: { type: "object", properties: {}, required: [] },
}, {
    name: "get_tool_catalog",
    description: "Returns the full catalog of 118+ proprietary automations with their categories.",
    inputSchema: { type: "object", properties: {}, required: [] },
});

// Add Tool Chaining Utility (Orchestrator Logic)
TOOLS.push({
    name: "chain_tools",
    description: "Execute a sequence of tools in a single session with dependency logic.",
    inputSchema: {
        type: "object",
        properties: {
            tasks: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        tool: { type: "string" },
                        args: { type: "object" }
                    },
                    required: ["tool"]
                }
            }
        },
        required: ["tasks"]
    }
});

// Handle List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS,
    };
});

// Handle Tool Call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "get_global_status") {
        return {
            content: [{ type: "text", text: JSON.stringify({ status: "online", version: "1.1.0", tool_count: TOOLS.length, engine: "Ultrathink v3" }, null, 2) }],
        };
    }

    if (name === "get_tool_catalog") {
        return {
            content: [{ type: "text", text: JSON.stringify(registry.categories, null, 2) }],
        };
    }

    if (name === "chain_tools") {
        const tasks = (args as any).tasks || [];
        const results: { task: string; status: string; output?: string; error?: string; duration_ms?: number }[] = [];

        logger.info("Chain execution started", { task_count: tasks.length });

        for (const task of tasks) {
            const toolEntry = registry.automations.find((t: any) => t.id.replace(/-/g, "_") === task.tool);

            if (!toolEntry) {
                results.push({
                    task: task.tool,
                    status: "error",
                    error: `Tool ${task.tool} not found in registry`
                });
                if (task.stopOnError !== false) continue;
            } else if (!toolEntry.script) {
                results.push({
                    task: task.tool,
                    status: "skipped",
                    error: "External tool (no script path)"
                });
            } else {
                const scriptPath = path.resolve(__dirname, "../../../automations", toolEntry.script);
                const startTime = Date.now();

                try {
                    const result = await new Promise<{ success: boolean; output: string; error: string }>((resolve) => {
                        const proc = spawn("node", [scriptPath, JSON.stringify(task.args || {})]);
                        let output = "";
                        let error = "";

                        proc.stdout.on("data", (data) => { output += data.toString(); });
                        proc.stderr.on("data", (data) => { error += data.toString(); });

                        proc.on("close", (code) => {
                            resolve({ success: code === 0, output, error });
                        });

                        // Timeout after 60 seconds
                        setTimeout(() => {
                            proc.kill();
                            resolve({ success: false, output, error: "Timeout after 60s" });
                        }, 60000);
                    });

                    const duration = Date.now() - startTime;
                    results.push({
                        task: task.tool,
                        status: result.success ? "success" : "error",
                        output: result.output.slice(0, 1000), // Truncate for safety
                        error: result.error || undefined,
                        duration_ms: duration
                    });

                    logger.info(`Tool ${task.tool} completed`, {
                        success: result.success,
                        duration_ms: duration
                    });

                    // Stop chain on error if requested
                    if (!result.success && task.stopOnError === true) {
                        logger.info("Chain stopped due to error", { failed_tool: task.tool });
                        break;
                    }
                } catch (e: any) {
                    results.push({
                        task: task.tool,
                        status: "error",
                        error: e.message || "Unknown execution error"
                    });
                }
            }
        }

        logger.info("Chain execution completed", {
            total: tasks.length,
            success: results.filter(r => r.status === "success").length,
            errors: results.filter(r => r.status === "error").length
        });

        return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
    }

    // Find script in registry
    const toolEntry = registry.automations.find((t: any) => t.id.replace(/-/g, "_") === name);

    if (toolEntry && toolEntry.script) {
        const scriptPath = path.resolve(__dirname, "../../../automations", toolEntry.script);

        return new Promise((resolve) => {
            logger.info(`Executing tool: ${name}`, { script: scriptPath });

            const process = spawn("node", [scriptPath, JSON.stringify(args || {})]);
            let output = "";
            let error = "";

            process.stdout.on("data", (data) => { output += data.toString(); });
            process.stderr.on("data", (data) => { error += data.toString(); });

            process.on("close", (code) => {
                if (code === 0) {
                    resolve({ content: [{ type: "text", text: output || "Execution completed successfully." }] });
                } else {
                    resolve({
                        content: [{ type: "text", text: `Error: ${error}` }],
                        isError: true
                    });
                }
            });
        });
    }

    return {
        content: [{ type: "text", text: `Tool ${name} not implemented or missing script.` }],
        isError: true,
    };
});

// Start Server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("3A Global MCP Router started", { tool_count: TOOLS.length });
}

main().catch((error) => {
    logger.error("Server error", error);
    process.exit(1);
});
