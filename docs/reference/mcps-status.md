# MCPs Status (Verified 26/01/2026 - Session 168quinquies)

## Stack MCP (14 serveurs)

### Global (8) - `~/.config/claude-code/mcp.json`

| MCP | Status | Notes |
|-----|--------|-------|
| chrome-devtools | ✅ OK | list_pages, screenshots, console |
| playwright | ✅ OK | browser_tabs, automation |
| gemini | ✅ OK | gemini-2.5-pro-latest |
| hostinger | ✅ OK | VPS 1168256 |
| github | ✅ OK | Repo access working |
| wordpress | ⚠️ Config | Needs wp-sites.json |
| google-analytics | ⚠️ API | GA4 API disabled in console |
| gmail | ⚠️ OAuth | Needs local auth |

### Projet (6) - `.mcp.json`

| MCP | Status | Notes |
|-----|--------|-------|
| **3a-global-mcp** | ✅ OK | **124 tools (121 automations + 3 meta)** |
| grok | ✅ OK | XAI_API_KEY configured |
| google-sheets | ✅ OK | Service account |
| klaviyo | ⚠️ SSL | Local cert issue, API works direct |
| shopify-dev | ✅ OK | API docs, no auth needed |
| shopify-admin | ✅ OK | Store management |

### Built-in (3)

| MCP | Status |
|-----|--------|
| filesystem | ✅ OK |
| memory | ✅ OK |
| claude-mcp | ✅ OK |

## Removed - Session 168ter

| MCP | Reason |
|-----|--------|
| powerbi-remote | Entra ID not configured |
| meta-ads | META_PAGE_ACCESS_TOKEN empty |
| apify | Token invalid/expired |
| shopify (global) | Empty credentials |
| slack | Empty credentials |
| stitch | Auth incompatible (use stitch-api.cjs) |

## 3A-MCP Custom Servers

### 3a-global-mcp ✅ OPERATIONAL

| Aspect | Valeur |
|--------|--------|
| Location | `automations/3a-global-mcp/` |
| Version | 1.1.0 |
| Tools | **124** (121 automations + 3 meta) |
| Meta Tools | `get_global_status`, `get_tool_catalog`, `chain_tools` |
| Engine | Ultrathink v3 |
| Registry | `automations-registry.json` |

### alibaba-mcp ⚠️ NEEDS CREDENTIALS

| Aspect | Valeur |
|--------|--------|
| Location | `automations/alibaba-mcp/` |
| Tools | `search_products` (AliExpress) |
| Requires | `ALIBABA_APP_KEY`, `ALIBABA_APP_SECRET` |

## Scripts Direct API (sans MCP communautaire)

```
tiktok-ads-sensor, omnisend-b2c-ecommerce, bigbuy-supplier-sync,
supplier-health-sensor, dropshipping-order-flow, at-risk-customer-flow,
birthday-anniversary-flow, price-drop-alerts, referral-program-automation,
replenishment-reminder, review-request-automation, sms-automation-resilient,
ga4-budget-optimizer-agentic
```

**Note:** Ces scripts sont exposés via 3a-global-mcp (124 tools)

## Service Account

```
id-a-automation-service@a-automation-agency.iam.gserviceaccount.com
```

GA4 Property: 516832662
Sheets ID: 1OPJmd6lBxhnBfmX5F2nDkDEPjykGjCbC6UAQHV6Fy8w
