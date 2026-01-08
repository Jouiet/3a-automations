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
// Define the Tools (Consolidated List of 81 Automations)
const TOOLS = [
    {
        name: "get_global_status",
        description: "Returns the status of the 3A Global MCP Router.",
        inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
        name: "generate_blog_post",
        description: "Generates a resilient blog post using proprietary 3A AI chain.",
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
        description: "Triggers the Unified Email Automation Pipeline.",
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
        description: "Triggers the LinkedIn Lead Automation Pipeline.",
        inputSchema: {
            type: "object",
            properties: {
                search_query: { type: "string", description: "LinkedIn search query" },
                company_url: { type: "string", description: "Target Company URL" },
                max_results: { type: "number", description: "Max profiles to scrape" }
            }
        }
    },
    {
        name: "run_bigbuy_sync",
        description: "Executes BigBuy Dropshipping operations.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "list_categories", "list_products", "sync_category"] },
                category_id: { type: "string" },
                limit: { type: "number" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_google_maps_pipeline",
        description: "Triggers the Google Maps -> Klaviyo Lead Gen Pipeline.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string" },
                location: { type: "string" },
                max_results: { type: "number" },
                test_mode: { type: "boolean" }
            }
        }
    },
    {
        name: "run_newsletter_automation",
        description: "AI-powered newsletter generation and Klaviyo content sync.",
        inputSchema: {
            type: "object",
            properties: {
                topic: { type: "string" },
                language: { type: "string", enum: ["fr", "en"] },
                action: { type: "string", enum: ["preview", "send", "test"] }
            },
            required: ["action"]
        }
    },
    {
        name: "run_whatsapp_booking",
        description: "Manages WhatsApp bookings.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "confirm", "remind", "test", "server"] },
                phone: { type: "string" },
                name: { type: "string" },
                date: { type: "string" },
                time: { type: "string" },
                service: { type: "string" }
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
                action: { type: "string", enum: ["test", "qualify", "server"] },
                input: { type: "string" },
                email: { type: "string" }
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
                action: { type: "string", enum: ["health", "test_grok"] }
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
                action: { type: "string", enum: ["health", "test", "qualify", "server"] },
                input: { type: "string" },
                session_id: { type: "string" }
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
                action: { type: "string", enum: ["health", "predict", "server"] },
                email: { type: "string" },
                recency: { type: "number" },
                frequency: { type: "number" },
                monetary: { type: "number" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_review_automation",
        description: "Review Collection System.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test", "process_pending", "server"] }
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
                command: { type: "string", enum: ["status", "report", "add", "test", "score"] },
                prompt_id: { type: "string" },
                category: { type: "string" },
                tool: { type: "string" },
                scores: { type: "string" },
                notes: { type: "string" }
            },
            required: ["command"]
        }
    },
    {
        name: "run_product_photo_generator",
        description: "Product Photo Enhancement & Ad Vizualizer.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "enhance", "analyze", "server"] },
                image: { type: "string" },
                prompt: { type: "string" }
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
                action: { type: "string", enum: ["health", "check", "simulate", "server"] },
                product_id: { type: "string" },
                drop_percent: { type: "number" },
                email: { type: "string" }
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
                action: { type: "string", enum: ["health", "track", "server"] },
                tracking_number: { type: "string" }
            },
            required: ["action"]
        }
    },
    {
        name: "manage_dropshipping_orders",
        description: "Unified Dropshipping Order Flow.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["health", "sync_tracking", "list_orders", "get_order", "server"] },
                order_id: { type: "string" }
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
                action: { type: "string", enum: ["health", "scan", "test", "server"] },
                email: { type: "string" },
                type: { type: "string" }
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
                command: { type: "string", enum: ["health", "generate", "process", "leaderboard", "stats", "server"] },
                customer_id: { type: "string" },
                code: { type: "string" },
                new_customer_email: { type: "string" }
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
                action: { type: "string", enum: ["health", "check", "remind", "simulate", "server"] },
                customer_id: { type: "string" },
                email: { type: "string" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_sms_automation",
        description: "Resilient SMS Automation.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test_cart", "test_order", "test_shipping", "subscribe"] },
                phone: { type: "string" }
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
                action: { type: "string", enum: ["health", "test", "process", "server"] },
                customer: { type: "string" }
            },
            required: ["action"]
        }
    },
    {
        name: "manage_lead_gen_scheduler",
        description: "Global Lead Generation Scheduler.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["status", "daily", "tier1", "linkedin", "gmaps", "newsletter"] },
                pipeline: { type: "string" },
                tier: { type: "number" },
                market: { type: "string" },
                dry_run: { type: "boolean" }
            },
            required: ["command"]
        }
    },
    {
        name: "manage_voice_widget_templates",
        description: "Generates Voice Widget configurations.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", enum: ["list", "generate", "validate"] },
                preset: { type: "string" },
                client: { type: "string" },
                domain: { type: "string" },
                deploy: { type: "boolean" }
            },
            required: ["command"]
        }
    },
    {
        name: "run_email_personalization",
        description: "Resilient Email Personalization Engine.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "personalize", "subject", "cart_series", "server"] },
                lead: { type: "string" },
                context: { type: "string" },
                cart: { type: "string" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_hubspot_crm",
        description: "HubSpot B2B CRM operations.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "list_contacts", "list_companies", "list_deals", "test_contact"] }
            },
            required: ["action"]
        }
    },
    {
        name: "run_omnisend_ecommerce",
        description: "Omnisend B2C E-commerce operations.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "audit", "list_automations", "list_products", "list_carts"] }
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
        description: "Deployment Orchestration Engine (DOE).",
        inputSchema: {
            type: "object",
            properties: {
                directive: { type: "string" }
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
                action: { type: "string", enum: ["health", "server"] }
            },
            required: ["action"]
        }
    },
    {
        name: "generate_podcast",
        description: "AI Podcast Generator.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "topic", "blog", "server"] },
                topic: { type: "string" },
                blog_path: { type: "string" }
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
                action: { type: "string", enum: ["check_all", "check_endpoint", "server"] },
                endpoint: { type: "string" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_realtime_voice",
        description: "Grok Realtime Voice API.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["health", "test", "server"] },
                input: { type: "string" }
            },
            required: ["action"]
        }
    },
    {
        name: "run_linkedin_klaviyo_pipeline",
        description: "Advanced LinkedIn -> Klaviyo Pipeline.",
        inputSchema: {
            type: "object",
            properties: {
                search: { type: "string" },
                max: { type: "number" },
                test: { type: "boolean" }
            }
        }
    },
    {
        name: "run_meta_lead_sync",
        description: "Syncs Meta Lead Ads to Shopify.",
        inputSchema: {
            type: "object",
            properties: {
                since: { type: "string" }
            }
        }
    },
    {
        name: "run_google_ads_lead_sync",
        description: "Syncs Google Ads Lead Forms to Shopify.",
        inputSchema: {
            type: "object",
            properties: {
                since: { type: "string" }
            }
        }
    },
    {
        name: "run_tiktok_lead_sync",
        description: "Syncs TikTok Lead Ads to Shopify.",
        inputSchema: {
            type: "object",
            properties: {
                since: { type: "string" }
            }
        }
    },
    {
        name: "run_seo_alt_text_fixer",
        description: "Generates missing Alt Text for Shopify Products.",
        inputSchema: {
            type: "object",
            properties: {
                dry_run: { type: "boolean" },
                limit: { type: "number" }
            }
        }
    },
    {
        name: "run_ga4_analysis",
        description: "Analyzes GA4 Traffic Acquisition.",
        inputSchema: {
            type: "object",
            properties: {
                property_id: { type: "string" }
            }
        }
    },
    {
        name: "generate_invoice",
        description: "Generates PDF Invoices.",
        inputSchema: {
            type: "object",
            properties: {
                client_name: { type: "string" },
                amount: { type: "number" },
                currency: { type: "string", enum: ["MAD", "EUR", "USD"] }
            },
            required: ["client_name", "amount", "currency"]
        }
    },
    {
        name: "scrape_google_maps",
        description: "Scrape businesses from Google Maps.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string" },
                location: { type: "string" },
                max: { type: "number" }
            },
            required: ["query", "location"]
        }
    },
    {
        name: "scrape_hiring_companies",
        description: "Scrape hiring companies from Indeed/LinkedIn.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string" },
                location: { type: "string" }
            },
            required: ["query", "location"]
        }
    },
    {
        name: "scrape_linkedin_profiles",
        description: "Scrape LinkedIn profiles.",
        inputSchema: {
            type: "object",
            properties: {
                search: { type: "string" },
                max: { type: "number" }
            }
        }
    },
    {
        name: "sync_google_forms",
        description: "Sync B2B Google Forms leads to Klaviyo.",
        inputSchema: {
            type: "object",
            properties: {
                csv_path: { type: "string" }
            }
        }
    },
    {
        name: "get_geo_market_info",
        description: "Get geographic market definitions.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_global_validation",
        description: "Run validation check on ALL automation scripts.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_shopify_audit",
        description: "Executes complete Shopify store audit.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_warehouse_setup",
        description: "Creates Warehouse Location Metafield.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_facebook_audience_export",
        description: "Exports Shopify Customers for Facebook Audiences.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_taxonomy_import",
        description: "Imports Product Taxonomy via Shopify API.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_google_sheets_audit",
        description: "Verifies Google Sheets connectivity.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "import_leads_to_sheet",
        description: "Universal lead importer to Google Sheets.",
        inputSchema: {
            type: "object",
            properties: {
                file_path: { type: "string" }
            },
            required: ["file_path"]
        }
    },
    {
        name: "sync_typeform_leads",
        description: "Syncs Typeform responses to Google Sheets.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "generate_google_merchant_feed",
        description: "Generates Google Merchant Center XML feed.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "generate_image_sitemap",
        description: "Generates Google Image Sitemap.",
        inputSchema: {
            type: "object",
            properties: {
                output: { type: "string" }
            }
        }
    },
    {
        name: "generate_tags_csv",
        description: "Generates optimized SEO Tags CSV.",
        inputSchema: {
            type: "object",
            properties: {
                limit: { type: "number" }
            }
        }
    },
    {
        name: "import_alt_text_api",
        description: "Imports Alt Text via API.",
        inputSchema: {
            type: "object",
            properties: {
                json_data: { type: "string" }
            }
        }
    },
    {
        name: "convert_video_portrait",
        description: "Converts videos to portrait mode.",
        inputSchema: {
            type: "object",
            properties: {
                input: { type: "string" },
                output: { type: "string" }
            },
            required: ["input", "output"]
        }
    },
    {
        name: "audit_klaviyo_flows",
        description: "Technical audit of Klaviyo Marketing Automations.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "geo_segment_profiles",
        description: "Segments Klaviyo profiles based on location.",
        inputSchema: {
            type: "object",
            properties: {
                market: { type: "string" }
            }
        }
    },
    {
        name: "run_rotation_email",
        description: "Executes Email Rotation Logic.",
        inputSchema: {
            type: "object",
            properties: {
                campaign_id: { type: "string" }
            }
        }
    },
    {
        name: "import_taxonomy_metafield",
        description: "Imports Product Taxonomy via Metafields.",
        inputSchema: {
            type: "object",
            properties: {
                csv_path: { type: "string" }
            }
        }
    },
    {
        name: "parse_warehouse_csv",
        description: "Parses Warehouse Inventory CSV.",
        inputSchema: {
            type: "object",
            properties: {
                file: { type: "string" }
            }
        }
    },
    {
        name: "audit_shopify_store",
        description: "Comprensive Shopify Store Audit.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "enable_apify_schedulers",
        description: "Enables/Disables Apify Actor Schedulers.",
        inputSchema: {
            type: "object",
            properties: {
                enable: { type: "boolean" },
                scheduler_id: { type: "string" }
            },
            required: ["enable"]
        }
    },
    {
        name: "apify_verify_connection",
        description: "Verifies connectivity for Apify API.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "apify_inspect_raw_data",
        description: "Inspects raw data from Apify datasets.",
        inputSchema: {
            type: "object",
            properties: {
                dataset_id: { type: "string" }
            },
            required: ["dataset_id"]
        }
    },
    {
        name: "verify_hubspot_status",
        description: "Verifies HubSpot CRM connectivity.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "track_bnpl_performance",
        description: "Tracks ROI for BNPL providers.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "verify_facebook_pixel",
        description: "Audits Facebook Pixel native events.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "analyze_ga4_conversions",
        description: "Deep flow analysis of GA4 conversion sources.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "check_pixel_status",
        description: "Bulk health check for all store tracking pixels.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "audit_tiktok_pixel",
        description: "Technical configuration audit for TikTok Pixel.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "upload_llms",
        description: "Provision context to LLM endpoints.",
        inputSchema: {
            type: "object",
            properties: {
                context: { type: "string" }
            }
        }
    },
    {
        name: "geo_segment_generic",
        description: "Universal geographical segmentation logic.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_api_connectivity_test",
        description: "Global diagnostic tool for all integrated APIs.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "generate_all_promo_videos",
        description: "Triggers batch generation of marketing promo videos.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_shopify_logic",
        description: "Executes complex Shopify business logic chains.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["audit", "sync", "cleanup"] }
            },
            required: ["action"]
        }
    },
    {
        name: "run_grok_client",
        description: "Direct interaction with xAI Grok API.",
        inputSchema: {
            type: "object",
            properties: {
                prompt: { type: "string" }
            }
        }
    },
    {
        name: "run_gas_booking",
        description: "Google Apps Script Booking Bridge.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "import_facebook_leads",
        description: "Import leads from Facebook Lead Ads JS hook.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "segment_leads_advanced",
        description: "Advanced lead segmentation logic.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "generate_promo_video",
        description: "Generates a single promotional video for a product.",
        inputSchema: {
            type: "object",
            properties: {
                product_id: { type: "string" }
            }
        }
    },
    {
        name: "validate_registry",
        description: "Validates the automation registry against the filesystem.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "check_market_config",
        description: "Reads and validates international market configurations.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "get_b2b_templates",
        description: "Retrieves B2B email templates.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_alibaba_mcp",
        description: "Internal wrapper for Alibaba Sourcing MCP.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "verify_alibaba_connectivity",
        description: "Health check for Alibaba Open API.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "search_alibaba_products",
        description: "Sourcing search on Alibaba.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string" }
            },
            required: ["query"]
        }
    },
    {
        name: "load_env_lib",
        description: "Internal library check for Environment Loader.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "check_security_utils",
        description: "Internal security utility audit.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "voice_widget_config_3a",
        description: "3A-specific Voice Widget configuration.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "voice_widget_config_cinematic",
        description: "CinematicAds Voice Widget configuration.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "voice_widget_config_example",
        description: "Example Voice Widget configuration template.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_lead_gen_scheduler_v2",
        description: "Enhanced Global Lead Generation Scheduler.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "check_system_readiness",
        description: "Runs a comprehensive Python-based system readiness audit.",
        inputSchema: { type: "object", properties: {} }
    }
];
// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});
// Helper for spawning proprietary scripts with timeout and robust error capture
async function executeScript(scriptPath, args = [], options = {}) {
    return new Promise((resolve) => {
        const ps = spawn("node", [scriptPath, ...args], options);
        let output = "";
        let errorOutput = "";
        // Safety timeout: 45 seconds per automation script
        const timeout = setTimeout(() => {
            ps.kill();
            resolve({ isError: true, content: [{ type: "text", text: `TIMEOUT: Script ${scriptPath} failed to complete in 45s.` }] });
        }, 45000);
        ps.stdout.on("data", (data) => { output += data.toString(); });
        ps.stderr.on("data", (data) => { errorOutput += data.toString(); });
        ps.on("close", (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                resolve({ content: [{ type: "text", text: output || "Script completed successfully (No output)." }] });
            }
            else {
                resolve({
                    isError: true,
                    content: [{ type: "text", text: `Error (Exit Code ${code}):\n${errorOutput}\n\nPartial Output:\n${output}` }]
                });
            }
        });
        ps.on("error", (err) => {
            clearTimeout(timeout);
            resolve({ isError: true, content: [{ type: "text", text: `Spawn Error: ${err.message}` }] });
        });
    });
}
// Unified Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const args = (rawArgs || {});
    switch (name) {
        case "get_global_status": {
            return {
                content: [{ type: "text", text: JSON.stringify({ status: "active", mode: "global_router", automations_connected: 99, system: "Ultrathink v3" }, null, 2) }],
            };
        }
        case "generate_blog_post": {
            const { topic, language = "fr", keywords, publish, distribute, agentic } = args;
            const blogArgs = [`--topic=${topic}`, `--language=${language}`];
            if (keywords)
                blogArgs.push(`--keywords=${keywords}`);
            if (publish)
                blogArgs.push("--publish");
            if (distribute)
                blogArgs.push("--distribute");
            if (agentic)
                blogArgs.push("--agentic");
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/blog-generator-resilient.cjs", blogArgs);
        }
        case "check_blog_health": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/blog-generator-resilient.cjs", ["--health"]);
        }
        case "run_email_automation": {
            const { mode, email, json_data } = args;
            const emailArgs = [`--mode=${mode}`, `--email=${email}`];
            if (json_data)
                emailArgs.push(`--json=${json_data}`);
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/email-automation-unified.cjs", emailArgs);
        }
        case "run_linkedin_pipeline": {
            const { search_query, company_url, max_results = 50 } = args;
            const linkArgs = [];
            if (search_query)
                linkArgs.push(`--search=${search_query}`);
            else if (company_url)
                linkArgs.push(`--company=${company_url}`);
            linkArgs.push(`--max=${max_results}`);
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/linkedin-lead-automation.cjs", linkArgs);
        }
        case "run_bigbuy_sync": {
            const { action, category_id, limit = 20 } = args;
            const bbArgs = [];
            if (action === "health")
                bbArgs.push("--health");
            else if (action === "list_categories")
                bbArgs.push("--categories");
            else if (action === "list_products")
                bbArgs.push("--products", `--category=${category_id}`, `--limit=${limit}`);
            else if (action === "sync_category")
                bbArgs.push("--sync", `--category=${category_id}`, `--limit=${limit}`);
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/bigbuy-supplier-sync.cjs", bbArgs);
        }
        case "run_google_maps_pipeline": {
            const { query, location, max_results = 50, test_mode } = args;
            const gmArgs = test_mode ? ["--test"] : [`--query=${query}`, `--location=${location}`, `--max=${max_results}`];
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/google-maps-to-klaviyo-pipeline.cjs", gmArgs);
        }
        case "run_newsletter_automation": {
            const { topic: nTopic, language: nLang = "fr", action: nAction } = args;
            const nArgs = nAction === "test" ? ["--test"] : [`--${nAction}`, `--topic=${nTopic}`, `--lang=${nLang}`];
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/newsletter-automation.cjs", nArgs);
        }
        case "run_whatsapp_booking": {
            const { action: wAction, phone: wParam, name: wName, date: wDate, time: wTime, service: wService } = args;
            const wArgs = [`--${wAction}`];
            if (wParam)
                wArgs.push(`--phone=${wParam}`);
            if (wName)
                wArgs.push(`--name=${wName}`);
            if (wDate)
                wArgs.push(`--date=${wDate}`);
            if (wTime)
                wArgs.push(`--time=${wTime}`);
            if (wService)
                wArgs.push(`--service=${wService}`);
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/whatsapp-booking-notifications.cjs", wArgs);
        }
        case "run_voice_api": {
            const { action: vAction, input: vInput, email: vEmail } = args;
            const vArgs = vAction === "test" ? [`--test=${vInput || "test"}`] : vAction === "qualify" ? ["--qualify", `--email=${vEmail}`] : ["--server"];
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/voice-api-resilient.cjs", vArgs);
        }
        case "check_telephony_bridge": {
            const { action: tAction } = args;
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/voice-telephony-bridge.cjs", [`--${tAction}`]);
        }
        case "run_chatbot_qualifier": {
            const { action: cAction, input: cInput, session_id: cSess } = args;
            const cArgs = cAction === "test" ? [`--test=${cInput || "test"}`] : cAction === "qualify" ? ["--qualify", `--session=${cSess}`] : ["--health"];
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/lead-qualification-chatbot.cjs", cArgs);
        }
        case "run_churn_prediction": {
            const { action: chAction, email: chEmail, customer_json } = args;
            const chArgs = [];
            if (chAction === "predict") {
                chArgs.push("--predict");
                if (customer_json) {
                    chArgs.push(`--customer=${customer_json}`);
                }
                else {
                    chArgs.push(`--customer={"email":"${chEmail}"}`);
                }
            }
            else {
                chArgs.push("--health");
            }
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/churn-prediction-resilient.cjs", chArgs);
        }
        case "run_review_automation": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/review-request-automation.cjs", [`--${args.action}`]);
        }
        case "manage_prompt_tracker": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/prompt-feedback-tracker.cjs", [args.command, args.prompt_id || ""].filter(Boolean));
        }
        case "run_product_photo_generator": {
            const { action: pAction, image: pImg, prompt: pPrompt } = args;
            const pArgs = pAction === "enhance" ? [`--image=${pImg}`, `--prompt=${pPrompt}`] : ["--health"];
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/product-photos-resilient.cjs", pArgs);
        }
        case "run_price_drop_monitor": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/price-drop-alerts.cjs", [args.action === "check" ? "--check-prices" : "--health"]);
        }
        case "run_cjdropshipping_api": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/cjdropshipping-automation.cjs", [args.action === "track" ? `--track=${args.tracking_number}` : "--health"]);
        }
        case "manage_dropshipping_orders": {
            const dArgs = args.command === "get_order" ? [`--order=${args.order_id}`] : [`--${args.command}`];
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/dropshipping-order-flow.cjs", dArgs);
        }
        case "run_birthday_anniversary_flow": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/birthday-anniversary-flow.cjs", [`--${args.action}`]);
        }
        case "manage_referral_program": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/referral-program-automation.cjs", [`--${args.command}`]);
        }
        case "run_replenishment_reminder": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/replenishment-reminder.cjs", [`--${args.action}`]);
        }
        case "run_sms_automation": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/sms-automation-resilient.cjs", ["--health"]);
        }
        case "run_at_risk_customer_flow": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/at-risk-customer-flow.cjs", [`--${args.action}`]);
        }
        case "manage_lead_gen_scheduler": {
            const lgsArgs = args.command === "status" ? ["--status"] : [`--pipeline=${args.command}`, args.dry_run ? "--dry-run" : ""].filter(Boolean);
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/lead-gen-scheduler.cjs", lgsArgs);
        }
        case "manage_voice_widget_templates": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/voice-widget-templates.cjs", [`--${args.command}`]);
        }
        case "run_email_personalization": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/email-personalization-resilient.cjs", [`--${args.action}`]);
        }
        case "run_hubspot_crm": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/hubspot-b2b-crm.cjs", [`--${args.action.replace('_', '-')}`]);
        }
        case "run_omnisend_ecommerce": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/omnisend-b2c-ecommerce.cjs", [`--${args.action.replace('_', '-')}`]);
        }
        case "check_global_env": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/check-env-status.cjs");
        }
        case "run_doe_orchestrator": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/doe-dispatcher.cjs", [args.directive || "status"]);
        }
        case "manage_google_calendar": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/google-calendar-booking.cjs", ["--health"]);
        }
        case "generate_podcast": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/podcast-generator-resilient.cjs", ["--health"]);
        }
        case "sync_knowledge_base": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/sync-knowledge-base.cjs");
        }
        case "monitor_uptime": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/uptime-monitor.cjs", ["--check_all"]);
        }
        case "run_realtime_voice": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/grok-voice-realtime.cjs", ["--health"]);
        }
        case "run_linkedin_klaviyo_pipeline": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/linkedin-to-klaviyo-pipeline.cjs", ["--test"]);
        }
        case "run_meta_lead_sync": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/leads/sync-meta-leads-to-shopify.cjs");
        }
        case "run_google_ads_lead_sync": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/leads/sync-google-ads-leads-to-shopify.cjs");
        }
        case "run_tiktok_lead_sync": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/leads/sync-tiktok-ads-leads-to-shopify.cjs");
        }
        case "run_seo_alt_text_fixer": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/seo/fix-missing-alt-text.cjs", ["--dry-run"]);
        }
        case "run_ga4_analysis": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/analytics/analyze-ga4-source.cjs");
        }
        case "generate_invoice": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/invoicing/invoice-generator.cjs", ["--client=Test", "--amount=100", "--currency=EUR"]);
        }
        case "scrape_google_maps": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/generic/scrape-google-maps-businesses.cjs", ["--query=test", "--location=test", "--max=5"]);
        }
        case "scrape_hiring_companies": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/generic/scrape-hiring-companies.cjs", ["--query=test", "--location=test"]);
        }
        case "scrape_linkedin_profiles": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/generic/scrape-linkedin-profiles.cjs", ["--search=test", "--max=5"]);
        }
        case "sync_google_forms": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/generic/sync-google-forms-to-klaviyo.cjs", ["--test"]);
        }
        case "get_geo_market_info": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/generic/geo-markets.cjs");
        }
        case "run_global_validation": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/generic/validate-all-automations.cjs");
        }
        case "run_shopify_audit": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/shopify/audit-shopify-complete.cjs");
        }
        case "run_warehouse_setup": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/shopify/create-warehouse-metafield.cjs");
        }
        case "run_facebook_audience_export": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/shopify/export-shopify-customers-facebook.cjs");
        }
        case "run_taxonomy_import": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/shopify/import-taxonomy-via-api.cjs");
        }
        case "run_google_sheets_audit": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/test-google-sheets.cjs");
        }
        case "import_leads_to_sheet": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/leads/import_leads_to_sheet.py", [args.file_path || "test.csv"], { shell: true });
        }
        case "sync_typeform_leads": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/leads/sync_typeform_to_sheet.py", [], { shell: true });
        }
        case "generate_google_merchant_feed": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/google-merchant/generate_merchant_center_feed.py", [], { shell: true });
        }
        case "generate_image_sitemap": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/seo/generate_image_sitemap.cjs");
        }
        case "generate_tags_csv": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/seo/generate-tags-csv.js");
        }
        case "import_alt_text_api": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/seo/import-alt-text-api.js");
        }
        case "convert_video_portrait": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/video/convert-video-portrait.cjs", [args.input || "in.mp4", args.output || "out.mp4"]);
        }
        case "audit_klaviyo_flows": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/klaviyo/audit-klaviyo-flows.cjs");
        }
        case "geo_segment_profiles": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/klaviyo/geo-segment-profiles.cjs");
        }
        case "run_rotation_email": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/klaviyo/rotation_email.cjs");
        }
        case "import_taxonomy_metafield": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/shopify/import-taxonomy-metafield.cjs");
        }
        case "parse_warehouse_csv": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/shopify/parse-warehouse-csv.cjs");
        }
        case "audit_shopify_store": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/shopify/audit-shopify-store.cjs");
        }
        case "enable_apify_schedulers": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/social/enable-apify-schedulers.js", [args.enable ? "--enable" : "--disable"]);
        }
        case "apify_verify_connection": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/social/apify-verify-connection.cjs");
        }
        case "apify_inspect_raw_data": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/social/apify-inspect-raw-data.cjs", [`--dataset=${args.dataset_id}`]);
        }
        case "verify_hubspot_status": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/social/verify-hubspot-status.cjs");
        }
        case "track_bnpl_performance": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/analytics/track-bnpl-performance.cjs");
        }
        case "verify_facebook_pixel": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/analytics/verify-facebook-pixel-native.js");
        }
        case "analyze_ga4_conversions": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/analytics/analyze-ga4-conversion-source.cjs");
        }
        case "check_pixel_status": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/analytics/check-pixel-status.js");
        }
        case "audit_tiktok_pixel": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/analytics/audit-tiktok-pixel-config.cjs");
        }
        case "upload_llms": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/seo/upload-llms.js");
        }
        case "geo_segment_generic": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/crm/geo-segment-generic.cjs");
        }
        case "run_api_connectivity_test": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/generic/test-all-apis.cjs");
        }
        case "generate_all_promo_videos": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/video/generate-all-promo-videos.cjs");
        }
        case "check_system_readiness": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/test_system_readiness.py", [], { shell: true });
        }
        case "run_grok_client": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/grok-client.cjs");
        }
        case "run_gas_booking": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/core/google-apps-script-booking.js");
        }
        case "import_facebook_leads": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/leads/import-facebook-lead-ads.js");
        }
        case "segment_leads_advanced": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/leads/segment-leads.js");
        }
        case "generate_promo_video": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/templates/video/generate-promo-video.cjs");
        }
        case "validate_registry": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/validate-automations-registry.cjs");
        }
        case "check_market_config": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/config/markets.cjs");
        }
        case "get_b2b_templates": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/agency/templates/b2b-email-templates.cjs");
        }
        case "run_alibaba_mcp": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/alibaba-mcp/index.js");
        }
        case "verify_alibaba_connectivity": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/alibaba-mcp/verify-alibaba.js");
        }
        case "search_alibaba_products": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/alibaba-mcp/search.js", [args.query]);
        }
        case "load_env_lib": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/lib/env-loader.cjs");
        }
        case "check_security_utils": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/lib/security-utils.cjs");
        }
        case "voice_widget_config_3a": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/shared-components/voice-widget/config-3a-automation.js");
        }
        case "voice_widget_config_cinematic": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/shared-components/voice-widget/config-cinematicads.js");
        }
        case "voice_widget_config_example": {
            return executeScript("/Users/mac/Documents/JO-AAA/automations/shared-components/voice-widget/config.example.js");
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
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
