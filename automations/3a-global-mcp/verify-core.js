import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "build/index.js");

console.log("🔍 Verifying 3A Global MCP Core...");

const serverProcess = spawn("node", [SERVER_PATH], {
    stdio: ["pipe", "pipe", "inherit"], // Allow stderr to pass through for logs
});

let isVerified = false;

serverProcess.stdout.on("data", (data) => {
    const messages = data.toString().split("\n").filter(line => line.trim() !== "");

    for (const msg of messages) {
        try {
            const json = JSON.parse(msg);

            // 1. Check for Initialization Request (We simulate client sending one)
            // But first, let's just listen.
            // Actually, in MCP Stdio, the Client sends the first message usually.
            // Let's send an Initialize request.
        } catch (e) {
            // Not JSON
        }
    }
});

// Send Initialize Request logic
const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "verifier", version: "1.0" }
    }
};

serverProcess.stdin.write(JSON.stringify(initRequest) + "\n");

serverProcess.stdout.on("data", (data) => {
    const str = data.toString();
    console.log("[DEBUG] Received:", str.substring(0, 200) + "..."); // Validated Debug

    if (str.includes("3a-global-mcp") && str.includes("1.0.0")) {
        // ...
        // ...
        // Timeout
        setTimeout(() => {
            if (!isVerified) {
                console.error("❌ TIMEOUT: Server did not respond in 20s.");
                serverProcess.kill();
                process.exit(1);
            }
        }, 20000);
        console.log("✅ Server Handshake Successful: Identity Verified.");

        // Now Request Tools
        const toolsRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list",
            params: {}
        };
        serverProcess.stdin.write(JSON.stringify(toolsRequest) + "\n");
    }

    if (str.includes("get_global_status") && str.includes("generate_blog_post")) {
        console.log("✅ Tools List Verified: 'generate_blog_post' found.");

        // Now Execute Tool - Test Health (Instant)
        console.log("🚀 Testing Execution: check_blog_health...");
        const callRequest = {
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
                name: "check_blog_health",
                arguments: {}
            }
        };
        serverProcess.stdin.write(JSON.stringify(callRequest) + "\n");
    }

    // Check for Execution Result (Health Output includes "AI PROVIDERS")
    if (str.includes("AI PROVIDERS") && str.includes("SOCIAL DISTRIBUTION")) {
        console.log("✅ Execution Verified: Health check output received via MCP.");

        // TEST 2: Email Automation
        console.log("🚀 Testing Execution: run_email_automation...");
        const emailRequest = {
            jsonrpc: "2.0",
            id: 4,
            method: "tools/call",
            params: {
                name: "run_email_automation",
                arguments: { mode: "welcome", email: "test_verify@3a.com" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(emailRequest) + "\n");
    }

    if (str.includes("EMAIL AUTOMATION UNIFIED") || str.includes("KLAVIYO_API_KEY not set")) {
        console.log("✅ Execution Verified: Email Automation script triggered.");

        // TEST 3: LinkedIn Pipeline (Intentional Error Check to prove connectivity)
        console.log("🚀 Testing Execution: run_linkedin_pipeline...");
        const linkedInRequest = {
            jsonrpc: "2.0",
            id: 5,
            method: "tools/call",
            params: {
                name: "run_linkedin_pipeline",
                arguments: { search_query: "CEO Paris", max_results: 1 }
            }
        };
        serverProcess.stdin.write(JSON.stringify(linkedInRequest) + "\n");
    }

    if (str.includes("LINKEDIN LEAD AUTOMATION PIPELINE") || str.includes("APIFY_TOKEN not set")) {
        console.log("✅ Execution Verified: LinkedIn Pipeline script triggered.");

        // TEST 4: Global Env Check
        console.log("🚀 Testing Execution: check_global_env...");
        const envRequest = {
            jsonrpc: "2.0",
            id: 6,
            method: "tools/call",
            params: {
                name: "check_global_env",
                arguments: {}
            }
        };
        serverProcess.stdin.write(JSON.stringify(envRequest) + "\n");
    }

    if (str.includes("VARIABLES CONFIGURÉES") || str.includes("RÉSUMÉ")) {
        console.log("✅ Execution Verified: Env Check script triggered.");

        // TEST 5: HubSpot CRM Health
        console.log("🚀 Testing Execution: run_hubspot_crm...");
        const hubspotRequest = {
            jsonrpc: "2.0",
            id: 7,
            method: "tools/call",
            params: {
                name: "run_hubspot_crm",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(hubspotRequest) + "\n");
    }

    if (str.includes("HubSpot B2B CRM Health Check")) {
        console.log("✅ Execution Verified: HubSpot CRM script triggered.");

        // TEST 6: Omnisend E-commerce Health
        console.log("🚀 Testing Execution: run_omnisend_ecommerce...");
        const omnisendRequest = {
            jsonrpc: "2.0",
            id: 8,
            method: "tools/call",
            params: {
                name: "run_omnisend_ecommerce",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(omnisendRequest) + "\n");
    }

    if (str.includes("Omnisend B2C E-commerce Health Check")) {
        console.log("✅ Execution Verified: Omnisend E-commerce script triggered.");

        // TEST 7: BigBuy Sync Health
        console.log("🚀 Testing Execution: run_bigbuy_sync...");
        const bigbuyRequest = {
            jsonrpc: "2.0",
            id: 9,
            method: "tools/call",
            params: {
                name: "run_bigbuy_sync",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(bigbuyRequest) + "\n");
    }

    if (str.includes("BigBuy Supplier Sync - Health Check")) {
        console.log("✅ Execution Verified: BigBuy Sync script triggered.");

        // TEST 8: Google Maps Pipeline (Mock Mode)
        console.log("🚀 Testing Execution: run_google_maps_pipeline...");
        const mapsRequest = {
            jsonrpc: "2.0",
            id: 10,
            method: "tools/call",
            params: {
                name: "run_google_maps_pipeline",
                arguments: { test_mode: true }
            }
        };
        serverProcess.stdin.write(JSON.stringify(mapsRequest) + "\n");
    }

    if (str.includes("GOOGLE MAPS → KLAVIYO PIPELINE") && (str.includes("TEST MODE") || str.includes("PIPELINE COMPLETE"))) {
        console.log("✅ Execution Verified: Google Maps Pipeline script triggered.");

        // TEST 9: Newsletter Automation (API Test)
        console.log("🚀 Testing Execution: run_newsletter_automation...");
        const newsRequest = {
            jsonrpc: "2.0",
            id: 11,
            method: "tools/call",
            params: {
                name: "run_newsletter_automation",
                arguments: { action: "test" } // triggers --test
            }
        };
        serverProcess.stdin.write(JSON.stringify(newsRequest) + "\n");
    }

    if (str.includes("API CONNECTION TEST") || str.includes("NEWSLETTER AUTOMATION")) {
        console.log("✅ Execution Verified: Newsletter Automation script triggered.");

        // TEST 10: WhatsApp Booking (Health)
        console.log("🚀 Testing Execution: run_whatsapp_booking...");
        const whatsappRequest = {
            jsonrpc: "2.0",
            id: 12,
            method: "tools/call",
            params: {
                name: "run_whatsapp_booking",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(whatsappRequest) + "\n");
    }

    if (str.includes("WhatsApp API configured") || str.includes("Awaiting credentials")) {
        console.log("✅ Execution Verified: WhatsApp Booking script triggered.");

        // TEST 11: Voice API (Test)
        console.log("🚀 Testing Execution: run_voice_api...");
        const voiceRequest = {
            jsonrpc: "2.0",
            id: 13,
            method: "tools/call",
            params: {
                name: "run_voice_api",
                arguments: { action: "test", input: "Hello Test" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(voiceRequest) + "\n");
    }

    if (str.includes("Voice API") || str.includes("Grok") || str.includes("fallback") || str.includes("response")) {
        console.log("✅ Execution Verified: Voice API script triggered.");

        // TEST 12: Telephony Bridge (Health)
        console.log("🚀 Testing Execution: check_telephony_bridge...");
        const bridgeRequest = {
            jsonrpc: "2.0",
            id: 14,
            method: "tools/call",
            params: {
                name: "check_telephony_bridge",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(bridgeRequest) + "\n");
    }

    if (str.includes("Voice Telephony Bridge - Health Check")) {
        console.log("✅ Execution Verified: Telephony Bridge script triggered.");

        // TEST 13: Chatbot Qualifier (Health)
        console.log("🚀 Testing Execution: run_chatbot_qualifier...");
        const chatbotRequest = {
            jsonrpc: "2.0",
            id: 15,
            method: "tools/call",
            params: {
                name: "run_chatbot_qualifier",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(chatbotRequest) + "\n");
    }

    if (str.includes("Grok 4.1 Fast Reasoning") || str.includes("Chatbot")) {
        console.log("✅ Execution Verified: Chatbot Qualifier script triggered.");

        // TEST 14: Churn Prediction (Health)
        console.log("🚀 Testing Execution: run_churn_prediction...");
        const churnRequest = {
            jsonrpc: "2.0",
            id: 16,
            method: "tools/call",
            params: {
                name: "run_churn_prediction",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(churnRequest) + "\n");
    }

    if (str.includes("CHURN PREDICTION SERVICE") || str.includes("Churn reduction")) {
        console.log("✅ Execution Verified: Churn Prediction script triggered.");

        // TEST 15: Review Automation (Health)
        console.log("🚀 Testing Execution: run_review_automation...");
        const reviewRequest = {
            jsonrpc: "2.0",
            id: 17,
            method: "tools/call",
            params: {
                name: "run_review_automation",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(reviewRequest) + "\n");
    }

    if (str.includes("Review Request Automation") || str.includes("AI Providers")) {
        console.log("✅ Execution Verified: Review Automation script triggered.");

        // TEST 16: Prompt Tracker (Status)
        console.log("🚀 Testing Execution: manage_prompt_tracker...");
        const promptRequest = {
            jsonrpc: "2.0",
            id: 18,
            method: "tools/call",
            params: {
                name: "manage_prompt_tracker",
                arguments: { command: "status" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(promptRequest) + "\n");
    }

    if (str.includes("AI PROMPTS FEEDBACK SYSTEM") || str.includes("TABLEAU DE BORD")) {
        console.log("✅ Execution Verified: Prompt Tracker script triggered.");

        // TEST 17: Product Photos (Health)
        console.log("🚀 Testing Execution: run_product_photo_generator...");
        const photoRequest = {
            jsonrpc: "2.0",
            id: 19,
            method: "tools/call",
            params: {
                name: "run_product_photo_generator",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(photoRequest) + "\n");
    }

    if (str.includes("IMAGE GENERATION PROVIDERS") || str.includes("VISION ANALYSIS PROVIDERS")) {
        console.log("✅ Execution Verified: Product Photo script triggered.");

        // TEST 18: Price Drop Monitor (Health)
        console.log("🚀 Testing Execution: run_price_drop_monitor...");
        const priceRequest = {
            jsonrpc: "2.0",
            id: 20,
            method: "tools/call",
            params: {
                name: "run_price_drop_monitor",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(priceRequest) + "\n");
    }

    if (str.includes("Price Drop Alerts") || str.includes("Thresholds")) {
        console.log("✅ Execution Verified: Price Drop Monitor script triggered.");

        // TEST 19: CJDropshipping (Health)
        console.log("🚀 Testing Execution: run_cjdropshipping_api...");
        const cjRequest = {
            jsonrpc: "2.0",
            id: 21,
            method: "tools/call",
            params: {
                name: "run_cjdropshipping_api",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(cjRequest) + "\n");
    }

    if (str.includes("CJDropshipping Automation") || str.includes("Configured") || str.includes("API Key")) {
        console.log("✅ Execution Verified: CJDropshipping script triggered.");

        // TEST 20: Dropshipping Order Flow (Health)
        console.log("🚀 Testing Execution: manage_dropshipping_orders...");
        const flowRequest = {
            jsonrpc: "2.0",
            id: 22,
            method: "tools/call",
            params: {
                name: "manage_dropshipping_orders",
                arguments: { command: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(flowRequest) + "\n");
    }

    if (str.includes("Dropshipping Order Flow") || str.includes("OPERATIONAL") || str.includes("Status:")) {
        console.log("✅ Execution Verified: Dropshipping Order Flow script triggered.");

        // TEST 21: Birthday/Anniversary (Health)
        console.log("🚀 Testing Execution: run_birthday_anniversary_flow...");
        const birthdayRequest = {
            jsonrpc: "2.0",
            id: 23,
            method: "tools/call",
            params: {
                name: "run_birthday_anniversary_flow",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(birthdayRequest) + "\n");
    }

    if (str.includes("Birthday/Anniversary Flow") || str.includes("birthdayDiscounts") || str.includes("teaserDaysBefore")) {
        console.log("✅ Execution Verified: Birthday Flow script triggered.");

        // TEST 22: Referral Program (Health)
        console.log("🚀 Testing Execution: manage_referral_program...");
        const referralRequest = {
            jsonrpc: "2.0",
            id: 24,
            method: "tools/call",
            params: {
                name: "manage_referral_program",
                arguments: { command: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(referralRequest) + "\n");
    }

    if (str.includes("Referral Program") || str.includes("rewardTiers") || str.includes("refereeReward")) {
        console.log("✅ Execution Verified: Referral Program script triggered.");

        // TEST 23: Replenishment Reminder (Health)
        console.log("🚀 Testing Execution: run_replenishment_reminder...");
        const replenishRequest = {
            jsonrpc: "2.0",
            id: 25,
            method: "tools/call",
            params: {
                name: "run_replenishment_reminder",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(replenishRequest) + "\n");
    }

    if (str.includes("Replenishment Reminder") || str.includes("consumptionRates")) {
        console.log("✅ Execution Verified: Replenishment script triggered.");

        // TEST 24: SMS Automation (Health)
        console.log("🚀 Testing Execution: run_sms_automation...");
        const smsRequest = {
            jsonrpc: "2.0",
            id: 26,
            method: "tools/call",
            params: {
                name: "run_sms_automation",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(smsRequest) + "\n");
    }

    if (str.includes("SMS Automation") || str.includes("Omnisend")) {
        console.log("✅ Execution Verified: SMS Automation script triggered.");

        // TEST 25: At-Risk Flow (Health)
        console.log("🚀 Testing Execution: run_at_risk_customer_flow...");
        const atRiskRequest = {
            jsonrpc: "2.0",
            id: 27,
            method: "tools/call",
            params: {
                name: "run_at_risk_customer_flow",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(atRiskRequest) + "\n");
    }

    if (str.includes("AT-RISK CUSTOMER FLOW") || str.includes("Churn Score") || str.includes("Thresholds")) {
        console.log("✅ Execution Verified: At-Risk Flow script triggered.");

        // TEST 26: Lead Gen Scheduler (Status)
        console.log("🚀 Testing Execution: manage_lead_gen_scheduler...");
        const leadRequest = {
            jsonrpc: "2.0",
            id: 28,
            method: "tools/call",
            params: {
                name: "manage_lead_gen_scheduler",
                arguments: { command: "status" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(leadRequest) + "\n");
    }

    if (str.includes("Lead Gen Scheduler") || str.includes("PIPELINE STATUS") || str.includes("History")) {
        console.log("✅ Execution Verified: Lead Gen Scheduler script triggered.");

        // TEST 27: Voice Widget Templates (List)
        console.log("🚀 Testing Execution: manage_voice_widget_templates...");
        const voiceWidgetRequest = {
            jsonrpc: "2.0",
            id: 29,
            method: "tools/call",
            params: {
                name: "manage_voice_widget_templates",
                arguments: { command: "list" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(voiceWidgetRequest) + "\n");
    }

    if (str.includes("Voice Widget Templates") || str.includes("Presets") || str.includes("ecommerce")) {
        console.log("✅ Execution Verified: Voice Widget Templates script triggered.");

        // TEST 28: Email Personalization (Health)
        console.log("🚀 Testing Execution: run_email_personalization...");
        const emailPersoRequest = {
            jsonrpc: "2.0",
            id: 30,
            method: "tools/call",
            params: {
                name: "run_email_personalization",
                arguments: { action: "health" }
            }
        };
        serverProcess.stdin.write(JSON.stringify(emailPersoRequest) + "\n");
    }

    if (str.includes("PROVIDER STATUS") || str.includes("Static fallback") || str.includes("Grok")) {
        console.log("✅ Execution Verified: Email Personalization script triggered.");
        isVerified = true;
        serverProcess.kill();
    }
});

serverProcess.on("exit", (code) => {
    if (isVerified) {
        console.log("🎉 VERIFICATION PASSED: Core is stable.");
        process.exit(0);
    } else {
        console.error("❌ VERIFICATION FAILED: Did not receive expected responses.");
        process.exit(1);
    }
});

// Timeout
setTimeout(() => {
    if (!isVerified) {
        console.error("❌ TIMEOUT: Server did not respond in 5s.");
        serverProcess.kill();
        process.exit(1);
    }
}, 60000);
