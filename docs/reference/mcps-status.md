# MCPs Status (Verified 06/02/2026 - Session 191ter)

## Stack MCP (13 serveurs)

### Global (7) - `~/.config/claude-code/mcp.json`

| MCP | Status | Notes |
|:----|:------:|:------|
| chrome-devtools | ✅ OK | list_pages, screenshots, console |
| playwright | ✅ OK | browser_tabs, automation |
| gemini | ✅ OK | gemini-3-flash-preview |
| hostinger | ✅ OK | VPS 1168256 |
| github | ✅ OK | Repo access working |
| filesystem | ✅ OK | Built-in |
| memory | ✅ OK | Built-in |

### Projet (6) - `.mcp.json`

| MCP | Status | Notes |
|:----|:------:|:------|
| **3a-global-mcp** | ✅ OK | **124 tools (121 automations + 3 meta), 99/99 tests** |
| grok | ✅ OK | XAI_API_KEY configured |
| google-sheets | ✅ OK | Service account |
| klaviyo | ⚠️ SSL | Local cert issue, API works direct |
| shopify-dev | ✅ OK | API docs, no auth needed |
| shopify-admin | ✅ OK | Store management |

### Supprimés (Session 168ter → 191)

| MCP | Raison |
|:----|:-------|
| wordpress | Needs wp-sites.json (removed S191) |
| google-analytics | GA4 API disabled (removed S191) |
| gmail | OAuth not configured (removed S191) |
| n8n-mcp | Stack n8n supprimé (removed S191) |
| powerbi-remote | Entra ID not configured |
| meta-ads | META_PAGE_ACCESS_TOKEN empty |
| apify (global) | Token invalid/expired |
| slack | Empty credentials |
| stitch | Auth incompatible (use stitch-api.cjs) |

## 3A-MCP Custom Server

### 3a-global-mcp ✅ OPERATIONAL

| Aspect | Valeur |
|:-------|:-------|
| Location | `automations/3a-global-mcp/` |
| Version | 1.5.0 |
| SDK | @modelcontextprotocol/sdk ^1.25.3 |
| Tools | **124** (121 automations + 3 meta) |
| Tests | **99/99 (100%)** + 78 S8 = **177/177 total** |
| Meta Tools | `get_global_status`, `get_tool_catalog`, `chain_tools` |
| Transport | stdio, http |
| Auth | Bearer token (optional) |
| Registry | `automations-registry.json` (121 entries) |

## Service Account

```
id-a-automation-service@a-automation-agency.iam.gserviceaccount.com
```

GA4 Property: 516832662
Sheets ID: 1OPJmd6lBxhnBfmX5F2nDkDEPjykGjCbC6UAQHV6Fy8w

*Màj: 06/02/2026 - Session 191ter*
