import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const APP_KEY = process.env.ALIBABA_APP_KEY;
const APP_SECRET = process.env.ALIBABA_APP_SECRET;
const API_URL = process.env.ALIBABA_API_URL || "https://api-sg.aliexpress.com/rest";

if (!APP_KEY || !APP_SECRET) {
    console.error("Missing ALIBABA_APP_KEY or ALIBABA_APP_SECRET in .env");
    process.exit(1);
}

// --- Helper: Sign Request (TOP Protocol) ---
function signRequest(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    let str = secret;
    for (const key of sortedKeys) {
        if (params[key] !== undefined && params[key] !== null) {
            str += key + params[key];
        }
    }
    str += secret;
    return crypto.createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

async function callAlibabaApi(method, params, session = null) {
    // Verified Logic: UTC Format YYYY-MM-DD HH:mm:ss
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const publicParams = {
        method: method,
        app_key: APP_KEY,
        timestamp: timestamp,
        format: "json",
        v: "2.0",
        sign_method: "md5",
        ...(session ? { session: session } : {})
    };

    const allParams = { ...publicParams, ...params };
    const sign = signRequest(allParams, APP_SECRET);

    const requestParams = new URLSearchParams();
    for (const [key, value] of Object.entries(allParams)) {
        requestParams.append(key, String(value));
    }
    requestParams.append("sign", sign);

    try {
        const response = await axios.post(API_URL, requestParams);
        if (response.data.error_response) {
            throw new Error(`API Error: ${JSON.stringify(response.data.error_response)}`);
        }
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`HTTP Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

const server = new Server(
    {
        name: "alibaba-sourcing-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_products",
                description: "Search for products on AliExpress/Alibaba.",
                inputSchema: {
                    type: "object",
                    properties: {
                        keywords: { type: "string" }
                    },
                    required: ["keywords"],
                },
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === "search_products") {
            const apiMethod = "aliexpress.affiliate.product.query";
            const params = {
                keywords: args.keywords,
                target_currency: "USD",
                target_language: "EN",
                tracking_id: "accio_agent_verified",
                page_size: 5
            };

            const result = await callAlibabaApi(apiMethod, params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
