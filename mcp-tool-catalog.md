# MCP Tool Catalog - 3A Automation

This catalog documents all tools exposed via the 3A Global MCP Router. These tools are designed for autonomous use by AI agents (Claude, Gemini, Grok, GPT) to interact with the 3A Automation ecosystem.

## Statistics

- **Total Tools:** 118
- **Agentic Maturity:** Level 4 (Autonomous)
- **High-Agency Tools (Level 3/4):** 18

## Agentic Levels (DOE Framework)

- **Level 1 (Deterministic):** Basic data sync and migration.
- **Level 2 (Conditional):** Logical triggers and reactive flows.
- **Level 3 (Reasoning):** LLM-powered analysis and generation.
- **Level 4 (Autonomous):** Self-correcting loops and interactive Voice AI.

---

## Tool List

### 🎙️ Voice AI & Telephony (Level 4)

- **voice-closer-alpha**: High-conversion autonomous voice agent for lead closing.
- **voice-appointment-setter**: AI agent for managing calendar bookings via phone.
- **voice-customer-support**: Real-time voice assistance for Shopify stores.
- **voice-callback-agent**: Reactive voice agent for missed call recovery.

### 🧠 Content & SEO Intelligence (Level 3)

- **blog-generator-resilient**: Multi-agent loop for SEO-optimized blog creation.
- **seo-keyword-analyst**: Deep reasoning tool for identifying low-competition/high-ROI keywords.
- **competitor-content-audit**: Systematic analysis of competitor content strategies.
- **social-media-trend-spotter**: Identifies viral opportunities in real-time.

### ✉️ Marketing Automation (Level 2)

- **klaviyo-dynamic-segmentation**: Behavioral-based email list management.
- **checkout-recovery-optimized**: High-intent cart abandonment recovery.
- **whatsapp-lead-nurture**: Automated conversational sequence on WhatsApp.

### ⚙️ Core Infrastructure (Level 1)

- **meta-leads-sync**: Meta Ads → Shopify customer data synchronization.
- **google-ads-sync**: Google Ads → Shopify lead synchronization.
- **shopify-inventory-sync**: Multi-location inventory management.

---

## Usage for Agents

Agents can invoke these tools using the following pattern:
`call_3a_tool(tool_id, parameters)`

All tools require a valid `3A_API_KEY` and are subject to rate limiting and forensic logging.
