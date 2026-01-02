# MCPs Status (Verified 02/01/2026)

## Working MCPs (10/16)

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

## Needs Configuration (3) - ROOT CAUSE VERIFIED 02/01/2026

| MCP | Issue | Root Cause | Fix |
|-----|-------|------------|-----|
| apify | MCP package bug | Token WORKS via API (STARTER $39/mo ACTIVE), MCP fails | Use direct API calls (Apify tools available) |
| google-analytics | Permissions | SA not added as user to GA4 property 471058655 | Add `id-a-automation-service@a-automation-agency.iam.gserviceaccount.com` to GA4 |
| google-sheets | Permissions | Sheets not shared with SA | Share specific sheets with SA email |

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

GA4 Property: 471058655
Sheets ID: 1OPJmd6lBxhnBfmX5F2nDkDEPjykGjCbC6UAQHV6Fy8w
