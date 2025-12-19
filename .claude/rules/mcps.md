# Configuration MCPs - 3A Automation

## MCPs Fonctionnels (Testés OK)

| MCP | Package | Config |
|-----|---------|--------|
| chrome-devtools | `chrome-devtools-mcp` | Debug browser, screenshots |
| playwright | `@playwright/mcp` | Browser automation |
| github | `@modelcontextprotocol/server-github` | GITHUB_TOKEN requis |
| hostinger | `hostinger-api-mcp` | HOSTINGER_API_TOKEN |
| klaviyo | `klaviyo-mcp-server` | KLAVIYO_API_KEY |
| gemini | `github:rlabs-inc/gemini-mcp` | GEMINI_API_KEY |
| google-analytics | `mcp-server-google-analytics` | Service Account JSON |
| google-sheets | `mcp-gsheets` | Service Account JSON |

## MCPs à Configurer

| MCP | Package | Action Requise |
|-----|---------|----------------|
| shopify | `shopify-mcp` | Créer Dev Store sur partners.shopify.com |
| n8n | SSE remote | Générer API key sur n8n.srv1168256.hstgr.cloud |
| wordpress | `claudeus-wp-mcp` | Créer wp-sites.json |
| apify | `@apify/actors-mcp-server` | Tester token |

## Fichier de Configuration

Chemin: `~/.config/claude-code/mcp.json`

## Variables d'Environnement Requises

```bash
# GitHub
GITHUB_TOKEN=ghp_xxx

# Hostinger
HOSTINGER_API_TOKEN=xxx

# Klaviyo
KLAVIYO_API_KEY=pk_xxx

# Google (Service Account)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Gemini
GEMINI_API_KEY=xxx

# xAI (optionnel)
XAI_API_KEY=xai-xxx
```

## Règle Critique

**JAMAIS de credentials clients dans les MCPs de l'agence.**
Les MCPs agence utilisent des comptes de test ou des credentials agence uniquement.
