/**
 * Slack Bridge (A2A Wrapper)
 * Connects the A2A Nervous System to the Slack MCP/API.
 * 
 * Capability: "send_alert", "notify_human"
 */

const { WebClient } = require('@slack/web-api');

// Defaults to process.env or fails gracefully
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);

module.exports = async function (params) {
    console.log("[SlackBridge] Received Task:", params);

    if (!token) {
        console.error("[SlackBridge] ERROR: SLACK_BOT_TOKEN is missing.");
        return { status: "error", message: "Missing Token" };
    }

    const { channel = "#general", message } = params;

    try {
        const result = await web.chat.postMessage({
            channel: channel,
            text: message,
        });
        return { status: "success", ts: result.ts };
    } catch (error) {
        console.error("[SlackBridge] API Error:", error.message);
        return { status: "error", message: error.message };
    }
};
