# MCPs Status (Verified 03/01/2026)

## Working MCPs (11/11) - 100%

| MCP | Status | Notes |
|-----|--------|-------|
| chrome-devtools | ✅ OK | list_pages, screenshots, console |
| playwright | ✅ OK | browser_tabs, automation |
| gemini | ✅ OK | 6 models, chat |
| hostinger | ✅ OK | VPS 1168256, 3 containers 3A + 2 shared + 2 other |
| github | ✅ OK | Repo access working |
| wordpress | ✅ OK | wp.3a-automation.com |
| shopify | ✅ OK | guqsu3-yj.myshopify.com |
| google-analytics | ✅ OK | Property 516832662, 37 users/7d |
| filesystem | ✅ OK | built-in |
| memory | ✅ OK | built-in |
| claude-mcp | ✅ OK | built-in |

## Removed - APIs Used Directly

| MCP | Session | Reason | Alternative |
|-----|---------|--------|-------------|
| klaviyo | 126 | SSL cert bug in MCP Python SDK ([#870](https://github.com/modelcontextprotocol/python-sdk/issues/870)) | Direct API (10 lists verified) |
| apify | 120 | Package bug | Direct API calls (STARTER $39/mo) |
| google-sheets | 120 | "Dynamic require of fs" | Direct googleapis in scripts |
| grok | 120 | Redundant | Direct xAI API in resilient scripts |
| powerbi-remote | 120 | Not needed | Entra ID not configured |

## Service Account

```
id-a-automation-service@a-automation-agency.iam.gserviceaccount.com
```

GA4 Property: 516832662 (VERIFIED - 37 users/7d)
Sheets ID: 1OPJmd6lBxhnBfmX5F2nDkDEPjykGjCbC6UAQHV6Fy8w
