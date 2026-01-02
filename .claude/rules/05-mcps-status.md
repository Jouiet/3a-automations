# MCPs Status (Verified 02/01/2026)

## Working MCPs (11/16)

| MCP | Status | Notes |
|-----|--------|-------|
| chrome-devtools | ✅ OK | list_pages |
| playwright | ✅ OK | browser_tabs |
| gemini | ✅ OK | 6 models |
| hostinger | ✅ OK | VPS 1168256, 4 Docker projects |
| klaviyo | ✅ OK | 10 lists (verified) |
| github | ✅ OK | Repo access working |
| filesystem | ✅ OK | built-in |
| memory | ✅ OK | built-in |
| claude-mcp | ✅ OK | built-in |
| shopify | ✅ OK | guqsu3-yj.myshopify.com |
| google-analytics | ✅ OK | Property 516832662, 37 users/7d (Session 120 verified) |

## Needs Configuration (2) - ROOT CAUSE VERIFIED 02/01/2026

| MCP | Issue | Root Cause | Fix |
|-----|-------|------------|-----|
| apify | MCP package bug | Token WORKS via API (STARTER $39/mo ACTIVE), MCP fails | Use direct API calls (Apify tools available) |
| google-sheets | MCP package bug | API WORKS (Sheet accessible: "3A-Dashboard-Database", 5 sheets), MCP fails with "Dynamic require of fs" error | Use direct googleapis calls in scripts |

## Not Configured (1)

| MCP | Status |
|-----|--------|
| powerbi-remote | Entra ID required |

## Removed (Session 119)

| MCP | Reason |
|-----|--------|
| n8n | All 5 workflows replaced by native scripts |
| grok | Replaced by direct API calls in scripts |

## Service Account

```
id-a-automation-service@a-automation-agency.iam.gserviceaccount.com
```

GA4 Property: 516832662 (VERIFIED - 37 users/7d)
Sheets ID: 1OPJmd6lBxhnBfmX5F2nDkDEPjykGjCbC6UAQHV6Fy8w
