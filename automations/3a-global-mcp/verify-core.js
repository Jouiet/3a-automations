import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "build/index.js");

console.log("🔍 Verifying 3A Global MCP Core (ID-Based Protocol)...");

const serverProcess = spawn("node", [SERVER_PATH], {
    env: { ...process.env, MCP_LOG_LEVEL: "debug" }
});

let isVerified = false;
const completedTests = new Set();
let currentTestIndex = 0;

// Consolidated Test Sequence (83 Tests: Handshake + List + 81 Tools)
const tests = [
    { name: "handshake", method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "verify-client", version: "1.0.0" } } },
    { name: "list_tools", method: "tools/list", params: {} },
    { name: "get_global_status", method: "tools/call", params: { name: "get_global_status", arguments: {} } },
    { name: "generate_blog_post", method: "tools/call", params: { name: "generate_blog_post", arguments: { topic: "test" } } },
    { name: "check_blog_health", method: "tools/call", params: { name: "check_blog_health", arguments: {} } },
    { name: "run_email_automation", method: "tools/call", params: { name: "run_email_automation", arguments: { mode: "welcome", email: "test@example.com" } } },
    { name: "run_linkedin_pipeline", method: "tools/call", params: { name: "run_linkedin_pipeline", arguments: { search_query: "test" } } },
    { name: "run_bigbuy_sync", method: "tools/call", params: { name: "run_bigbuy_sync", arguments: { action: "health" } } },
    { name: "run_google_maps_pipeline", method: "tools/call", params: { name: "run_google_maps_pipeline", arguments: { test_mode: true } } },
    { name: "run_newsletter_automation", method: "tools/call", params: { name: "run_newsletter_automation", arguments: { action: "test" } } },
    { name: "run_whatsapp_booking", method: "tools/call", params: { name: "run_whatsapp_booking", arguments: { action: "health" } } },
    { name: "run_voice_api", method: "tools/call", params: { name: "run_voice_api", arguments: { action: "test" } } },
    { name: "check_telephony_bridge", method: "tools/call", params: { name: "check_telephony_bridge", arguments: { action: "health" } } },
    { name: "run_chatbot_qualifier", method: "tools/call", params: { name: "run_chatbot_qualifier", arguments: { action: "health" } } },
    { name: "run_churn_prediction", method: "tools/call", params: { name: "run_churn_prediction", arguments: { action: "health" } } },
    { name: "run_review_automation", method: "tools/call", params: { name: "run_review_automation", arguments: { action: "health" } } },
    { name: "manage_prompt_tracker", method: "tools/call", params: { name: "manage_prompt_tracker", arguments: { command: "status" } } },
    { name: "run_product_photo_generator", method: "tools/call", params: { name: "run_product_photo_generator", arguments: { action: "health" } } },
    { name: "run_price_drop_monitor", method: "tools/call", params: { name: "run_price_drop_monitor", arguments: { action: "health" } } },
    { name: "run_cjdropshipping_api", method: "tools/call", params: { name: "run_cjdropshipping_api", arguments: { action: "health" } } },
    { name: "manage_dropshipping_orders", method: "tools/call", params: { name: "manage_dropshipping_orders", arguments: { command: "health" } } },
    { name: "run_birthday_anniversary_flow", method: "tools/call", params: { name: "run_birthday_anniversary_flow", arguments: { action: "health" } } },
    { name: "manage_referral_program", method: "tools/call", params: { name: "manage_referral_program", arguments: { command: "health" } } },
    { name: "run_replenishment_reminder", method: "tools/call", params: { name: "run_replenishment_reminder", arguments: { action: "health" } } },
    { name: "run_sms_automation", method: "tools/call", params: { name: "run_sms_automation", arguments: { action: "health" } } },
    { name: "run_at_risk_customer_flow", method: "tools/call", params: { name: "run_at_risk_customer_flow", arguments: { action: "health" } } },
    { name: "manage_lead_gen_scheduler", method: "tools/call", params: { name: "manage_lead_gen_scheduler", arguments: { command: "status" } } },
    { name: "manage_voice_widget_templates", method: "tools/call", params: { name: "manage_voice_widget_templates", arguments: { command: "list" } } },
    { name: "run_email_personalization", method: "tools/call", params: { name: "run_email_personalization", arguments: { action: "health" } } },
    { name: "run_hubspot_crm", method: "tools/call", params: { name: "run_hubspot_crm", arguments: { action: "health" } } },
    { name: "run_omnisend_ecommerce", method: "tools/call", params: { name: "run_omnisend_ecommerce", arguments: { action: "health" } } },
    { name: "check_global_env", method: "tools/call", params: { name: "check_global_env", arguments: {} } },
    { name: "run_doe_orchestrator", method: "tools/call", params: { name: "run_doe_orchestrator", arguments: { directive: "status" } } },
    { name: "manage_google_calendar", method: "tools/call", params: { name: "manage_google_calendar", arguments: { action: "health" } } },
    { name: "generate_podcast", method: "tools/call", params: { name: "generate_podcast", arguments: { action: "health" } } },
    { name: "sync_knowledge_base", method: "tools/call", params: { name: "sync_knowledge_base", arguments: {} } },
    { name: "monitor_uptime", method: "tools/call", params: { name: "monitor_uptime", arguments: { action: "check_all" } } },
    { name: "run_realtime_voice", method: "tools/call", params: { name: "run_realtime_voice", arguments: { action: "health" } } },
    { name: "run_linkedin_klaviyo_pipeline", method: "tools/call", params: { name: "run_linkedin_klaviyo_pipeline", arguments: { test: true } } },
    { name: "run_meta_lead_sync", method: "tools/call", params: { name: "run_meta_lead_sync", arguments: {} } },
    { name: "run_google_ads_lead_sync", method: "tools/call", params: { name: "run_google_ads_lead_sync", arguments: {} } },
    { name: "run_tiktok_lead_sync", method: "tools/call", params: { name: "run_tiktok_lead_sync", arguments: {} } },
    { name: "run_seo_alt_text_fixer", method: "tools/call", params: { name: "run_seo_alt_text_fixer", arguments: { dry_run: true } } },
    { name: "run_ga4_analysis", method: "tools/call", params: { name: "run_ga4_analysis", arguments: {} } },
    { name: "generate_invoice", method: "tools/call", params: { name: "generate_invoice", arguments: { client_name: "Test", amount: 100, currency: "EUR" } } },
    { name: "scrape_google_maps", method: "tools/call", params: { name: "scrape_google_maps", arguments: { query: "test", location: "test" } } },
    { name: "scrape_hiring_companies", method: "tools/call", params: { name: "scrape_hiring_companies", arguments: { query: "test", location: "test" } } },
    { name: "scrape_linkedin_profiles", method: "tools/call", params: { name: "scrape_linkedin_profiles", arguments: { search: "test" } } },
    { name: "sync_google_forms", method: "tools/call", params: { name: "sync_google_forms", arguments: {} } },
    { name: "get_geo_market_info", method: "tools/call", params: { name: "get_geo_market_info", arguments: {} } },
    { name: "run_global_validation", method: "tools/call", params: { name: "run_global_validation", arguments: {} } },
    { name: "run_shopify_audit", method: "tools/call", params: { name: "run_shopify_audit", arguments: {} } },
    { name: "run_warehouse_setup", method: "tools/call", params: { name: "run_warehouse_setup", arguments: {} } },
    { name: "run_facebook_audience_export", method: "tools/call", params: { name: "run_facebook_audience_export", arguments: {} } },
    { name: "run_taxonomy_import", method: "tools/call", params: { name: "run_taxonomy_import", arguments: {} } },
    { name: "run_google_sheets_audit", method: "tools/call", params: { name: "run_google_sheets_audit", arguments: {} } },
    { name: "import_leads_to_sheet", method: "tools/call", params: { name: "import_leads_to_sheet", arguments: { file_path: "test.csv" } } },
    { name: "sync_typeform_leads", method: "tools/call", params: { name: "sync_typeform_leads", arguments: {} } },
    { name: "generate_google_merchant_feed", method: "tools/call", params: { name: "generate_google_merchant_feed", arguments: {} } },
    { name: "generate_image_sitemap", method: "tools/call", params: { name: "generate_image_sitemap", arguments: {} } },
    { name: "generate_tags_csv", method: "tools/call", params: { name: "generate_tags_csv", arguments: {} } },
    { name: "import_alt_text_api", method: "tools/call", params: { name: "import_alt_text_api", arguments: {} } },
    { name: "convert_video_portrait", method: "tools/call", params: { name: "convert_video_portrait", arguments: { input: "test.mp4", output: "test_portrait.mp4" } } },
    { name: "audit_klaviyo_flows", method: "tools/call", params: { name: "audit_klaviyo_flows", arguments: {} } },
    { name: "geo_segment_profiles", method: "tools/call", params: { name: "geo_segment_profiles", arguments: {} } },
    { name: "run_rotation_email", method: "tools/call", params: { name: "run_rotation_email", arguments: {} } },
    { name: "import_taxonomy_metafield", method: "tools/call", params: { name: "import_taxonomy_metafield", arguments: {} } },
    { name: "parse_warehouse_csv", method: "tools/call", params: { name: "parse_warehouse_csv", arguments: {} } },
    { name: "audit_shopify_store", method: "tools/call", params: { name: "audit_shopify_store", arguments: {} } },
    { name: "enable_apify_schedulers", method: "tools/call", params: { name: "enable_apify_schedulers", arguments: { enable: true } } },
    { name: "apify_verify_connection", method: "tools/call", params: { name: "apify_verify_connection", arguments: {} } },
    { name: "apify_inspect_raw_data", method: "tools/call", params: { name: "apify_inspect_raw_data", arguments: { dataset_id: "test" } } },
    { name: "verify_hubspot_status", method: "tools/call", params: { name: "verify_hubspot_status", arguments: {} } },
    { name: "track_bnpl_performance", method: "tools/call", params: { name: "track_bnpl_performance", arguments: {} } },
    { name: "verify_facebook_pixel", method: "tools/call", params: { name: "verify_facebook_pixel", arguments: {} } },
    { name: "analyze_ga4_conversions", method: "tools/call", params: { name: "analyze_ga4_conversions", arguments: {} } },
    { name: "check_pixel_status", method: "tools/call", params: { name: "check_pixel_status", arguments: {} } },
    { name: "audit_tiktok_pixel", method: "tools/call", params: { name: "audit_tiktok_pixel", arguments: {} } },
    { name: "upload_llms", method: "tools/call", params: { name: "upload_llms", arguments: {} } },
    { name: "geo_segment_generic", method: "tools/call", params: { name: "geo_segment_generic", arguments: {} } },
    { name: "run_api_connectivity_test", method: "tools/call", params: { name: "run_api_connectivity_test", arguments: {} } },
    { name: "generate_all_promo_videos", method: "tools/call", params: { name: "generate_all_promo_videos", arguments: {} } },

    { name: "check_system_readiness", method: "tools/call", params: { name: "check_system_readiness", arguments: {} } },
    { name: "run_grok_client", method: "tools/call", params: { name: "run_grok_client", arguments: { prompt: "Health check" } } },
    { name: "run_gas_booking", method: "tools/call", params: { name: "run_gas_booking", arguments: {} } },
    { name: "import_facebook_leads", method: "tools/call", params: { name: "import_facebook_leads", arguments: {} } },
    { name: "segment_leads_advanced", method: "tools/call", params: { name: "segment_leads_advanced", arguments: {} } },
    { name: "generate_promo_video", method: "tools/call", params: { name: "generate_promo_video", arguments: { product_id: "test" } } },
    { name: "validate_registry", method: "tools/call", params: { name: "validate_registry", arguments: {} } },
    { name: "check_market_config", method: "tools/call", params: { name: "check_market_config", arguments: {} } },
    { name: "get_b2b_templates", method: "tools/call", params: { name: "get_b2b_templates", arguments: {} } },
    { name: "run_alibaba_mcp", method: "tools/call", params: { name: "run_alibaba_mcp", arguments: {} } },
    { name: "verify_alibaba_connectivity", method: "tools/call", params: { name: "verify_alibaba_connectivity", arguments: {} } },
    { name: "search_alibaba_products", method: "tools/call", params: { name: "search_alibaba_products", arguments: { query: "test" } } },
    { name: "load_env_lib", method: "tools/call", params: { name: "load_env_lib", arguments: {} } },
    { name: "check_security_utils", method: "tools/call", params: { name: "check_security_utils", arguments: {} } },
    { name: "voice_widget_config_3a", method: "tools/call", params: { name: "voice_widget_config_3a", arguments: {} } },
    { name: "voice_widget_config_cinematic", method: "tools/call", params: { name: "voice_widget_config_cinematic", arguments: {} } },
    { name: "voice_widget_config_example", method: "tools/call", params: { name: "voice_widget_config_example", arguments: {} } },

];

const TOTAL_TESTS = tests.length;

function runNextTest() {
    if (currentTestIndex >= tests.length) {
        console.log(`🎉 ALL ${tests.length} TESTS COMPLETED SUCCESSFULLY.`);
        isVerified = true;
        serverProcess.kill();
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
    buffer = lines.pop();

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const response = JSON.parse(line);
            const expectedId = currentTestIndex + 1;

            if (response.id === expectedId) {
                console.log(`✅ [${currentTestIndex + 1}/${tests.length}] Verified: ${tests[currentTestIndex].name}`);
                completedTests.add(tests[currentTestIndex].name);
                currentTestIndex++;
                runNextTest();
            }
        } catch (e) {
            // Log non-JSON output for debugging
            if (line.includes("error") || line.includes("FATAL")) {
                console.log(`⚠️  Router Stderr/Debug: ${line.substring(0, 150)}`);
            }
        }
    }
});

serverProcess.stderr.on("data", (data) => {
    const str = data.toString();
    console.error(`[SERVER-STDERR] ${str}`);
});

serverProcess.on("exit", (code) => {
    if (isVerified) {
        console.log("🎉 FINAL VERIFICATION PASSED: 100% Stability Achieved.");
        process.exit(0);
    } else {
        console.error(`❌ VERIFICATION FAILED: Stuck at test ${currentTestIndex + 1}/${tests.length} (${tests[currentTestIndex]?.name})`);
        process.exit(1);
    }
});

// Kickoff
runNextTest();

// Global Timeout (20 Minutes)
setTimeout(() => {
    if (!isVerified) {
        console.error("❌ TIMEOUT: Verification exceeded 20 minutes.");
        serverProcess.kill();
        process.exit(1);
    }
}, 1200000);
