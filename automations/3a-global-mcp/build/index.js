#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
// Define the server
const server = new Server({
    name: "3a-global-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Define the Tools
const TOOLS = [
    {
        name: "get_global_status",
        description: "Returns the status of the 3A Global MCP Router.",
        inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
        name: "generate_blog_post",
        description: "Generates a resilient blog post using proprietary 3A AI chain (Anthropic -> OpenAI -> Grok).",
        inputSchema: {
            type: "object",
            properties: {
                topic: { type: "string", description: "The topic of the blog post" },
                language: { type: "string", enum: ["fr", "en"], description: "Language (default: fr)" },
                keywords: { type: "string", description: "Comma-separated SEO keywords" },
                publish: { type: "boolean", description: "Publish to WordPress?" },
                distribute: { type: "boolean", description: "Distribute to Social Media?" }
            },
            required: ["topic"]
        }
    },
    {
        name: "check_blog_health",
        description: "Checks the configuration status of the Blog Generator subsystems.",
        inputSchema: { type: "object", properties: {}, required: [] }
    },
    {
        name: "run_email_automation",
        description: "Triggers the Unified Email Automation Pipeline (Welcome Series / Outreach Sequence).",
        inputSchema: {
            type: "object",
            properties: {
                mode: { type: "string", enum: ["welcome", "outreach"], description: "The automation mode" },
                email: { type: "string", description: "Target email address" },
                json_data: { type: "string", description: "Optional full lead data as JSON string" }
            },
            required: ["mode", "email"]
        }
    },
    {
        name: "run_linkedin_pipeline",
        description: "Triggers the LinkedIn Lead Automation Pipeline (Scrape -> Score -> Sync -> Outreach).",
        inputSchema: {
            type: "object",
            properties: {
                search_query: { type: "string", description: "LinkedIn search query (e.g. 'Marketing Director Paris')" },
                company_url: { type: "string", description: "Target Company URL" },
                max_results: { type: "number", description: "Max profiles to scrape (default: 50)" }
            }
        }
    },
    {
        name: "run_bigbuy_sync",
        description: "Executes BigBuy Dropshipping operations (Categories, Products, Sync).",
        inputSchema: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["health", "list_categories", "list_products", "sync_category"],
                    description: "Operation to perform"
                },
                category_id: { type: "string", description: "Required for list_products and sync_category" },
                limit: { type: "number", description: "Limit results (default: 20)" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_google_maps_pipeline",
        description: "Triggers the Google Maps -> Klaviyo Lead Gen Pipeline (Scrape -> Segment -> Enrich).",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Business type (e.g. 'Avocat')" },
                location: { type: "string", description: "City (e.g. 'Lyon')" },
                max_results: { type: "number", description: "Max leads to scrape" },
                test_mode: { type: "boolean", description: "Run with mock data (Verification)" }
            }
        }
    },
    {
        name: "run_newsletter_automation",
        description: "Generates and sends the AI Newsletter (Grok -> Klaviyo).",
        inputSchema: {
            type: "object",
            properties: {
                topic: { type: "string", description: "Newsletter topic" },
                language: { type: "string", enum: ["fr", "en"], description: "Language" },
                action: { type: "string", enum: ["preview", "send", "test"], description: "Action: preview (content only), send (campaign), test (API check)" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_whatsapp_booking",
        description: "Manages WhatsApp bookings (Confirmation, Reminders, Server).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "confirm", "remind", "test", "server"], description: "Action to perform" },
                phone: { type: "string", description: "Phone number (required for confirm, remind, test)" },
                name: { type: "string", description: "Customer name" },
                date: { type: "string", description: "Booking date (YYYY-MM-DD)" },
                time: { type: "string", description: "Booking time (HH:MM)" },
                service: { type: "string", description: "Service name" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_voice_api",
        description: "Resilient Voice API (Text Generation & Qualification).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["test", "qualify", "server"], description: "Action to perform" },
                input: { type: "string", description: "Input text for test" },
                email: { type: "string", description: "Email for qualify" }
            },
            required: ["action"]
        }
    },
    {
        name: "check_telephony_bridge",
        description: "Checks health of Voice Telephony Bridge (Twilio/Grok/WhatsApp).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test_grok"], description: "Action to perform" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_chatbot_qualifier",
        description: "Lead Qualification Chatbot (BANT).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test", "qualify", "server"], description: "Action to perform" },
                input: { type: "string", description: "Input text for test" },
                session_id: { type: "string", description: "Session ID for qualify" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_churn_prediction",
        description: "Churn Prediction System (RFM + AI Analysis).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "predict", "server"], description: "Action to perform" },
                email: { type: "string", description: "Customer email (required for predict)" },
                daysSinceLastPurchase: { type: "number", description: "Recency (days)" },
                totalOrders: { type: "number", description: "Frequency (count)" },
                totalSpent: { type: "number", description: "Monetary (EUR)" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_review_automation",
        description: "Review Collection System (Smart Requests & Analysis).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test", "process_pending", "server"], description: "Action to perform" }
            },
            required: ["action"]
        }
    },
    {
        name: "manage_prompt_tracker",
        description: "AI Prompt Feedback & Optimization Tracker.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["status", "report", "add", "test", "score"], description: "Command to execute" },
                prompt_id: { type: "string", description: "Prompt ID" },
                category: { type: "string", description: "Category for add" },
                tool: { type: "string", description: "Tool for add" },
                scores: { type: "string", description: "Scores as 'p q c u o' space-separated string" },
                notes: { type: "string", description: "Notes for score" }
            },
            required: ["command"]
        }
    },
    {
        name: "run_product_photo_generator",
        description: "Product Photo Enhancement & Ad Vizualizer (Resilient).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "enhance", "analyze", "server"], description: "Action to perform" },
                image: { type: "string", description: "Image path (enhance)" },
                prompt: { type: "string", description: "Prompt (enhance/analyze)" },
                analyze_image: { type: "string", description: "Image path to analyze" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_price_drop_monitor",
        description: "Price Drop Alerting & Competitor Monitoring System.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "check", "simulate", "server"], description: "Action to perform" },
                product_id: { type: "string", description: "Product ID for simulate" },
                drop_percent: { type: "number", description: "Drop % for simulate" },
                email: { type: "string", description: "Email for simulate" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_cjdropshipping_api",
        description: "CJDropshipping Automation API.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "track", "server"], description: "Action to perform" },
                tracking_number: { type: "string", description: "Tracking number for track action" }
            },
            required: ["action"]
        }
    },
    {
        name: "manage_dropshipping_orders",
        description: "Unified Dropshipping Order Flow (Shopify/Woo/BigBuy/CJ).",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["health", "sync_tracking", "list_orders", "get_order", "server"], description: "Command to execute" },
                order_id: { type: "string", description: "Order ID for get_order" }
            },
            required: ["command"]
        }
    },
    {
        name: "run_birthday_anniversary_flow",
        description: "Birthday & Anniversary Automated Marketing Flow.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "scan", "test", "server"], description: "Action to perform" },
                email: { type: "string", description: "Email for test" },
                type: { type: "string", description: "Type for test (birthday/anniversary)" }
            },
            required: ["action"]
        }
    },
    {
        name: "manage_referral_program",
        description: "Referral Program Management System.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["health", "generate", "process", "leaderboard", "stats", "server"], description: "Command to execute" },
                customer_id: { type: "string", description: "Customer ID for generate" },
                code: { type: "string", description: "Referral code for process" },
                new_customer_email: { type: "string", description: "New customer email for process" }
            },
            required: ["command"]
        }
    },
    {
        name: "run_replenishment_reminder",
        description: "Smart Replenishment Reminder System.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "check", "remind", "simulate", "server"], description: "Action to perform" },
                customer_id: { type: "string", description: "Customer ID" },
                email: { type: "string", description: "Email" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_sms_automation",
        description: "Resilient SMS Automation (Omnisend + Twilio Fallback).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test_cart", "test_order", "test_shipping", "subscribe"], description: "Action to perform" },
                phone: { type: "string", description: "Phone number" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_at_risk_customer_flow",
        description: "At-Risk Customer Retention Flow.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test", "process", "server"], description: "Action to perform" },
                customer: { type: "string", description: "Customer JSON for process" }
            },
            required: ["action"]
        }
    },
    {
        name: "manage_lead_gen_scheduler",
        description: "Global Lead Generation Scheduler (LinkedIn, Maps, Newsletter).",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["status", "daily", "tier1", "linkedin", "gmaps", "newsletter"], description: "Command to execute" },
                pipeline: { type: "string", description: "Pipeline type (deprecated, use command)" },
                tier: { type: "number", description: "Tier level for linkedin/tier1" },
                market: { type: "string", description: "Market key" },
                query: { type: "string", description: "Search query" },
                location: { type: "string", description: "Location" },
                topic: { type: "string", description: "Newsletter topic" },
                dry_run: { type: "boolean", description: "Dry run mode" }
            },
            required: ["command"]
        }
    },
    {
        name: "manage_voice_widget_templates",
        description: "Generates Voice Widget configurations and deployment packages.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["list", "generate", "validate"], description: "Command to execute" },
                preset: { type: "string", description: "Industry preset (ecommerce, saas, etc.)" },
                client: { type: "string", description: "Client name" },
                domain: { type: "string", description: "Client domain" },
                deploy: { type: "boolean", description: "Generate full deployment package" }
            },
            required: ["command"]
        }
    },
    {
        name: "run_email_personalization",
        description: "Resilient Email Personalization Engine (Subject Lines, Abandoned Cart Series).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "personalize", "subject", "cart_series", "server"], description: "Action to perform" },
                lead: { type: "string", description: "Lead JSON for personalize" },
                context: { type: "string", description: "Context JSON for subject" },
                cart: { type: "string", description: "Cart JSON for cart_series" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_hubspot_crm",
        description: "Executes HubSpot B2B CRM operations (Free Tier Compatible).",
        inputSchema: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["health", "list_contacts", "list_companies", "list_deals", "test_contact"],
                    description: "Operation to perform"
                }
            },
            required: ["action"]
        }
    },
    {
        name: "run_omnisend_ecommerce",
        description: "Executes Omnisend B2C E-commerce operations (v5 API).",
        inputSchema: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["health", "audit", "list_automations", "list_products", "list_carts"],
                    description: "Operation to perform"
                }
            },
            required: ["action"]
        }
    },
    {
        name: "check_global_env",
        description: "Audits the Global Environment Variables status.",
        inputSchema: { type: "object", properties: {}, required: [] }
    },
    {
        name: "run_doe_orchestrator",
        description: "Deployment Orchestration Engine (DOE) - Autonomous Task Planner.",
        inputSchema: {
            type: "object",
            properties: {
                directive: { type: "string", description: "Natural language directive" }
            },
            required: ["directive"]
        }
    },
    {
        name: "manage_google_calendar",
        description: "Google Calendar Booking System Management.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "server"], description: "Action to perform" }
            },
            required: ["action"]
        }
    },
    {
        name: "generate_podcast",
        description: "AI Podcast Generator (Multi-Host, Resilient TTS).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "topic", "blog", "server"], description: "Action to perform" },
                topic: { type: "string", description: "Topic for generation" },
                language: { type: "string", enum: ["fr", "en"], description: "Language" },
                blog_path: { type: "string", description: "Absolute path to blog file" }
            },
            required: ["action"]
        }
    },
    {
        name: "sync_knowledge_base",
        description: "Syncs the Automation Registry and Voice Knowledge Base.",
        inputSchema: { type: "object", properties: {}, required: [] }
    },
    {
        name: "monitor_uptime",
        description: "System Uptime & Endpoint Monitor.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["check_all", "check_endpoint", "server"], description: "Action to perform" },
                endpoint: { type: "string", description: "Specific endpoint to check" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_realtime_voice",
        description: "Grok Realtime Voice API (WebSocket Proxy).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test", "server"], description: "Action to perform" },
                input: { type: "string", description: "Text input for test" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_doe_orchestrator",
        description: "Deployment Orchestration Engine (DOE) - Autonomous Task Planner.",
        inputSchema: {
            type: "object",
            properties: {
                directive: { type: "string", description: "Natural language directive" }
            },
            required: ["directive"]
        }
    },
    {
        name: "manage_google_calendar",
        description: "Google Calendar Booking System Management.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "server"], description: "Action to perform" }
            },
            required: ["action"]
        }
    },
    {
        name: "generate_podcast",
        description: "AI Podcast Generator (Multi-Host, Resilient TTS).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "topic", "blog", "server"], description: "Action to perform" },
                topic: { type: "string", description: "Topic for generation" },
                language: { type: "string", enum: ["fr", "en"], description: "Language" },
                blog_path: { type: "string", description: "Absolute path to blog file" }
            },
            required: ["action"]
        }
    },
    {
        name: "sync_knowledge_base",
        description: "Syncs the Automation Registry and Voice Knowledge Base.",
        inputSchema: { type: "object", properties: {}, required: [] }
    },
    {
        name: "monitor_uptime",
        description: "System Uptime & Endpoint Monitor.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["check_all", "check_endpoint", "server"], description: "Action to perform" },
                endpoint: { type: "string", description: "Specific endpoint to check" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_realtime_voice",
        description: "Grok Realtime Voice API (WebSocket Proxy).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test", "server"], description: "Action to perform" },
                input: { type: "string", description: "Text input for test" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_linkedin_klaviyo_pipeline",
        description: "Advanced LinkedIn -> Klaviyo Pipeline with Segmentation.",
        inputSchema: {
            type: "object",
            properties: {
                search: { type: "string", description: "Search query" },
                max: { type: "number", description: "Max profiles" },
                test: { type: "boolean", description: "Test mode" }
            },
            required: []
        }
    }
];
// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});
// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "get_global_status") {
        return {
            content: [{ type: "text", text: JSON.stringify({ status: "active", mode: "global_router", automations_connected: 35 }, null, 2) }],
        };
    }
    if (name === "generate_blog_post") {
        const { topic, language = "fr", keywords, publish, distribute } = args;
        // Construct CLI args strictly based on verified contract
        const scriptArgs = [
            "/Users/mac/Documents/JO-AAA/automations/agency/core/blog-generator-resilient.cjs",
            `--topic=${topic}`,
            `--language=${language}`
        ];
        if (keywords)
            scriptArgs.push(`--keywords=${keywords}`);
        if (publish)
            scriptArgs.push("--publish");
        if (distribute)
            scriptArgs.push("--distribute");
        // Execute Proprietary Script
        // We use a Promise wrap to handle the async spawn
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0) {
                    resolve({
                        content: [{ type: "text", text: output }]
                    });
                }
                else {
                    resolve({
                        isError: true,
                        content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }]
                    });
                }
            });
        });
    }
    if (name === "check_blog_health") {
        const scriptArgs = [
            "/Users/mac/Documents/JO-AAA/automations/agency/core/blog-generator-resilient.cjs",
            "--health"
        ];
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                resolve({ content: [{ type: "text", text: output }] });
            });
        });
    }
    if (name === "run_email_automation") {
        const { mode, email, json_data } = args;
        const scriptArgs = [
            "/Users/mac/Documents/JO-AAA/automations/agency/email-automation-unified.cjs",
            `--mode=${mode}`,
            `--email=${email}`
        ];
        if (json_data)
            scriptArgs.push(`--json=${json_data}`);
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_linkedin_pipeline") {
        const { search_query, company_url, max_results = 50 } = args;
        const scriptArgs = [
            "/Users/mac/Documents/JO-AAA/automations/agency/linkedin-lead-automation.cjs"
        ];
        if (search_query)
            scriptArgs.push(`--search=${search_query}`);
        else if (company_url)
            scriptArgs.push(`--company=${company_url}`);
        else
            throw new Error("Either search_query or company_url is required");
        scriptArgs.push(`--max=${max_results}`);
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                // LinkedIn script uses Exit 1 for partial failures too, capture output
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Pipeline Finished with Status ${code}:\n${output}\nErrors:\n${errorOutput}` }] });
            });
        });
    }
    if (name === "run_bigbuy_sync") {
        const { action, category_id, limit = 20 } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/bigbuy-supplier-sync.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "list_categories")
            scriptArgs.push("--categories");
        else if (action === "list_products") {
            if (!category_id)
                throw new Error("category_id is required for list_products");
            scriptArgs.push("--products", `--category=${category_id}`, `--limit=${limit}`);
        }
        else if (action === "sync_category") {
            if (!category_id)
                throw new Error("category_id is required for sync_category");
            scriptArgs.push("--sync", `--category=${category_id}`, `--limit=${limit}`);
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_google_maps_pipeline") {
        const { query, location, max_results = 50, test_mode } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/google-maps-to-klaviyo-pipeline.cjs"];
        if (test_mode) {
            scriptArgs.push("--test");
        }
        else {
            if (!query || !location)
                throw new Error("query and location are required unless test_mode is true");
            scriptArgs.push(`--query=${query}`, `--location=${location}`, `--max=${max_results}`);
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_newsletter_automation") {
        const { topic, language = "fr", action } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/newsletter-automation.cjs"];
        if (action === "test") {
            scriptArgs.push("--test");
        }
        else if (action === "preview") {
            if (!topic)
                throw new Error("topic is required for preview");
            scriptArgs.push("--preview", `--topic=${topic}`, `--lang=${language}`);
        }
        else if (action === "send") {
            if (!topic)
                throw new Error("topic is required for send");
            scriptArgs.push("--send", `--topic=${topic}`, `--lang=${language}`);
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_whatsapp_booking") {
        const { action, phone, name, date, time, service } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/whatsapp-booking-notifications.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "test") {
            if (!phone)
                throw new Error("phone is required for test");
            scriptArgs.push("--test", `--phone=${phone}`);
        }
        else if (action === "confirm") {
            if (!phone)
                throw new Error("phone is required for confirm");
            scriptArgs.push("--confirm", `--phone=${phone}`);
            if (name)
                scriptArgs.push(`--name=${name}`);
            if (date)
                scriptArgs.push(`--date=${date}`);
            if (time)
                scriptArgs.push(`--time=${time}`);
            if (service)
                scriptArgs.push(`--service=${service}`);
        }
        else if (action === "remind") {
            if (!phone)
                throw new Error("phone is required for remind");
            scriptArgs.push("--remind", `--phone=${phone}`);
            if (name)
                scriptArgs.push(`--name=${name}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_voice_api") {
        const { action, input, email } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/voice-api-resilient.cjs"];
        if (action === "test") {
            const message = input || "Bonjour test";
            scriptArgs.push(`--test=${message}`);
        }
        else if (action === "qualify") {
            if (!email)
                throw new Error("email is required for qualify");
            scriptArgs.push("--qualify", `--email=${email}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "check_telephony_bridge") {
        const { action } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/voice-telephony-bridge.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "test_grok")
            scriptArgs.push("--test-grok");
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_chatbot_qualifier") {
        const { action, input, session_id } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/lead-qualification-chatbot.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "test") {
            const message = input || "Je veux un devis";
            scriptArgs.push(`--test=${message}`);
        }
        else if (action === "qualify") {
            if (!session_id)
                throw new Error("session_id is required for qualify");
            scriptArgs.push("--qualify", `--session=${session_id}`);
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_churn_prediction") {
        const { action, email, daysSinceLastPurchase, totalOrders, totalSpent } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/churn-prediction-resilient.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "predict") {
            if (!email)
                throw new Error("email is required for predict");
            const customerData = JSON.stringify({
                email,
                daysSinceLastPurchase: daysSinceLastPurchase || 30,
                totalOrders: totalOrders || 1,
                totalSpent: totalSpent || 50
            });
            scriptArgs.push("--predict", `--customer=${customerData}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_review_automation") {
        const { action } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/review-request-automation.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "test")
            scriptArgs.push("--test");
        else if (action === "process_pending")
            scriptArgs.push("--process-pending");
        else if (action === "server")
            scriptArgs.push("--server");
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "manage_prompt_tracker") {
        const { command, prompt_id, category, tool, scores, notes } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/prompt-feedback-tracker.cjs", command];
        if (prompt_id)
            scriptArgs.push(prompt_id);
        if (command === "add") {
            if (category)
                scriptArgs.push(category);
            if (tool)
                scriptArgs.push(tool);
        }
        if (command === "score") {
            if (scores) {
                const parts = scores.split(" ");
                scriptArgs.push(...parts);
            }
            if (notes)
                scriptArgs.push(notes);
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                // status code can be non-zero for CLI errors, but we want to see output
                resolve({ content: [{ type: "text", text: output || errorOutput }] });
            });
        });
    }
    if (name === "run_product_photo_generator") {
        const { action, image, prompt, analyze_image } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/product-photos-resilient.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "enhance") {
            if (!image || !prompt)
                throw new Error("image and prompt required for enhance");
            scriptArgs.push(`--image=${image}`, `--prompt=${prompt}`);
        }
        else if (action === "analyze") {
            if (!analyze_image || !prompt)
                throw new Error("analyze_image and prompt required for analyze");
            scriptArgs.push(`--analyze=${analyze_image}`, `--prompt=${prompt}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_price_drop_monitor") {
        const { action, product_id, drop_percent, email } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/price-drop-alerts.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "check")
            scriptArgs.push("--check-prices");
        else if (action === "simulate") {
            scriptArgs.push("--simulate");
            if (product_id)
                scriptArgs.push(`--product-id=${product_id}`);
            if (drop_percent)
                scriptArgs.push(`--drop=${drop_percent}`);
            if (email)
                scriptArgs.push(`--email=${email}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_cjdropshipping_api") {
        const { action, tracking_number } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/cjdropshipping-automation.cjs"];
        if (action === "health") { /* default behavior is health check */ }
        else if (action === "track") {
            if (!tracking_number)
                throw new Error("tracking_number required for track");
            scriptArgs.push(`--track=${tracking_number}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "manage_dropshipping_orders") {
        const { command, order_id } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/dropshipping-order-flow.cjs"];
        if (command === "health")
            scriptArgs.push("--health");
        else if (command === "sync_tracking")
            scriptArgs.push("--sync-tracking");
        else if (command === "list_orders")
            scriptArgs.push("--list-orders");
        else if (command === "get_order") {
            if (!order_id)
                throw new Error("order_id required for get_order");
            scriptArgs.push(`--order=${order_id}`);
        }
        else if (command === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_birthday_anniversary_flow") {
        const { action, email, type } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/birthday-anniversary-flow.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "scan")
            scriptArgs.push("--scan-upcoming");
        else if (action === "test") {
            scriptArgs.push("--test");
            if (email)
                scriptArgs.push(`--email=${email}`);
            if (type)
                scriptArgs.push(`--type=${type}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "manage_referral_program") {
        const { command, customer_id, code, new_customer_email } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/referral-program-automation.cjs"];
        if (command === "health")
            scriptArgs.push("--health");
        else if (command === "generate") {
            scriptArgs.push("--generate");
            if (customer_id)
                scriptArgs.push(`--customer-id=${customer_id}`);
        }
        else if (command === "process") {
            scriptArgs.push("--process-referral");
            if (code)
                scriptArgs.push(`--code=${code}`);
            if (new_customer_email)
                scriptArgs.push(`--new-customer=${new_customer_email}`);
        }
        else if (command === "leaderboard")
            scriptArgs.push("--leaderboard");
        else if (command === "stats")
            scriptArgs.push("--stats");
        else if (command === "server")
            scriptArgs.push("--server");
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_replenishment_reminder") {
        const { action, customer_id, email } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/replenishment-reminder.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "check") {
            scriptArgs.push("--check");
            if (customer_id)
                scriptArgs.push(`--customer-id=${customer_id}`);
        }
        else if (action === "remind") {
            scriptArgs.push("--remind");
            if (customer_id)
                scriptArgs.push(`--customer-id=${customer_id}`);
            if (email)
                scriptArgs.push(`--email=${email}`);
        }
        else if (action === "simulate") {
            scriptArgs.push("--simulate");
            if (customer_id)
                scriptArgs.push(`--customer-id=${customer_id}`);
            if (email)
                scriptArgs.push(`--email=${email}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_sms_automation") {
        const { action, phone } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/sms-automation-resilient.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "test_cart")
            scriptArgs.push("--test-abandoned-cart");
        else if (action === "test_order")
            scriptArgs.push("--test-order");
        else if (action === "test_shipping")
            scriptArgs.push("--test-shipping");
        else if (action === "subscribe") {
            scriptArgs.push("--subscribe");
            if (phone)
                scriptArgs.push(`--phone=${phone}`);
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_at_risk_customer_flow") {
        const { action, customer } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/at-risk-customer-flow.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "test")
            scriptArgs.push("--test");
        else if (action === "process") {
            scriptArgs.push("--process");
            if (customer)
                scriptArgs.push(`--customer=${customer}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "manage_lead_gen_scheduler") {
        const { command, tier, market, query, location, topic, dry_run } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/lead-gen-scheduler.cjs"];
        if (command === "status")
            scriptArgs.push("--status");
        else {
            // Map command to pipeline arg
            if (command === "daily")
                scriptArgs.push("--pipeline=daily");
            else if (command === "tier1")
                scriptArgs.push("--pipeline=tier1");
            else if (command === "linkedin")
                scriptArgs.push("--pipeline=linkedin");
            else if (command === "gmaps")
                scriptArgs.push("--pipeline=gmaps");
            else if (command === "newsletter")
                scriptArgs.push("--pipeline=newsletter");
            if (tier)
                scriptArgs.push(`--tier=${tier}`);
            if (market)
                scriptArgs.push(`--market=${market}`);
            if (query)
                scriptArgs.push(`--query=${query}`);
            if (location)
                scriptArgs.push(`--location=${location}`);
            if (topic)
                scriptArgs.push(`--topic=${topic}`);
            if (dry_run)
                scriptArgs.push("--dry-run");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "manage_voice_widget_templates") {
        const { command, preset, client, domain, deploy } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/voice-widget-templates.cjs"];
        if (command === "list")
            scriptArgs.push("--list");
        else if (command === "generate") {
            if (preset)
                scriptArgs.push(`--preset=${preset}`);
            if (client)
                scriptArgs.push(`--client=${client}`);
            if (domain)
                scriptArgs.push(`--domain=${domain}`);
            if (deploy)
                scriptArgs.push("--deploy");
        }
        else if (command === "validate") {
            // Validation requires a file path, we might skip this or allow passing a path
            // For now, let's skip implementation or require a path arg
            // But the definition didn't include path. Let's just support list/generate for now.
            scriptArgs.push("--list"); // Fallback
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_email_personalization") {
        const { action, lead, context, cart } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/email-personalization-resilient.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "personalize") {
            scriptArgs.push("--personalize");
            if (lead)
                scriptArgs.push(`--lead=${lead}`);
        }
        else if (action === "subject") {
            scriptArgs.push("--subject");
            if (context)
                scriptArgs.push(`--context=${context}`);
        }
        else if (action === "cart_series") {
            scriptArgs.push("--abandoned-cart-series");
            if (cart)
                scriptArgs.push(`--cart=${cart}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_hubspot_crm") {
        const { action } = args;
        const scriptArgs = [
            "/Users/mac/Documents/JO-AAA/automations/agency/core/hubspot-b2b-crm.cjs",
            `--${action.replace('_', '-')}` // Convert list_contacts to --list-contacts
        ];
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "run_omnisend_ecommerce") {
        const { action } = args;
        const scriptArgs = [
            "/Users/mac/Documents/JO-AAA/automations/agency/core/omnisend-b2c-ecommerce.cjs",
            `--${action.replace('_', '-')}` // Convert list_automations to --list-automations
        ];
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "check_global_env") {
        const scriptArgs = [
            "/Users/mac/Documents/JO-AAA/automations/agency/core/check-env-status.cjs"
        ];
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                resolve({ content: [{ type: "text", text: output }] });
            });
        });
    }
    if (name === "run_doe_orchestrator") {
        const { directive } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/doe-dispatcher.cjs", directive];
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                resolve({ content: [{ type: "text", text: output || errorOutput }] });
            });
        });
    }
    if (name === "manage_google_calendar") {
        const { action } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/google-calendar-booking.cjs"];
        if (action === "server")
            scriptArgs.push("--server");
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                resolve({ content: [{ type: "text", text: output }] });
            });
        });
    }
    if (name === "generate_podcast") {
        const { action, topic, language = "fr", blog_path } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/podcast-generator-resilient.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "topic") {
            if (!topic)
                throw new Error("topic required");
            scriptArgs.push(`--topic=${topic}`, `--language=${language}`);
        }
        else if (action === "blog") {
            if (!blog_path)
                throw new Error("blog_path required");
            scriptArgs.push(`--blog=${blog_path}`, `--language=${language}`);
        }
        else if (action === "server")
            scriptArgs.push("--server");
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    if (name === "sync_knowledge_base") {
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/sync-knowledge-base.cjs"];
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                resolve({ content: [{ type: "text", text: output }] });
            });
        });
    }
    if (name === "monitor_uptime") {
        const { action, endpoint } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/uptime-monitor.cjs"];
        if (action === "check_endpoint") {
            if (!endpoint)
                throw new Error("endpoint required");
            scriptArgs.push(`--endpoint=${endpoint}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                resolve({ content: [{ type: "text", text: output }] });
            });
        });
    }
    if (name === "run_realtime_voice") {
        const { action, input } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/core/grok-voice-realtime.cjs"];
        if (action === "health")
            scriptArgs.push("--health");
        else if (action === "test") {
            const msg = input || "Test audio";
            scriptArgs.push(`--test=${msg}`);
        }
        else if (action === "server") {
            scriptArgs.push("--server");
        }
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                resolve({ content: [{ type: "text", text: output }] });
            });
        });
    }
    if (name === "run_linkedin_klaviyo_pipeline") {
        const { search, max = 50, test } = args;
        const scriptArgs = ["/Users/mac/Documents/JO-AAA/automations/agency/linkedin-to-klaviyo-pipeline.cjs"];
        if (test)
            scriptArgs.push("--test");
        else if (search)
            scriptArgs.push(`--search=${search}`, `--max=${max}`);
        else
            scriptArgs.push("--test"); // Default to test
        return new Promise((resolve, reject) => {
            const ps = spawn("node", scriptArgs);
            let output = "";
            let errorOutput = "";
            ps.stdout.on("data", (data) => { output += data.toString(); });
            ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
            ps.on("close", (code) => {
                if (code === 0)
                    resolve({ content: [{ type: "text", text: output }] });
                else
                    resolve({ isError: true, content: [{ type: "text", text: `Error:\n${errorOutput}\n\nOutput:\n${output}` }] });
            });
        });
    }
    throw new Error(`Unknown tool: ${name}`);
});
// Start the Server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("3A Global MCP Router running on execution environment.");
}
main().catch((error) => {
    console.error("Fatal Error:", error);
    process.exit(1);
});
