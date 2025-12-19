#!/bin/bash
# ============================================
# SHOPIFY MCP SERVER ACTIVATION SCRIPT
# Alpha Medical - Claude Code Integration
# ============================================
# This script reads the Shopify Admin Access Token from .env.admin
# and configures the Shopify MCP server for Claude Code
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}SHOPIFY MCP SERVER ACTIVATION${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if .env.admin exists
ENV_FILE="/Users/mac/Desktop/Alpha-Medical/.env.admin"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ ERROR: .env.admin not found at $ENV_FILE${NC}"
    exit 1
fi

# Extract SHOPIFY_ADMIN_ACCESS_TOKEN from .env.admin
TOKEN=$(grep "SHOPIFY_ADMIN_ACCESS_TOKEN" "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ ERROR: SHOPIFY_ADMIN_ACCESS_TOKEN not found in .env.admin${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found Shopify Admin Access Token${NC}"

# Store domain
DOMAIN="azffej-as.myshopify.com"

# MCP config file location
MCP_CONFIG="/Users/mac/.config/claude-code/mcp.json"

# Create backup
if [ -f "$MCP_CONFIG" ]; then
    cp "$MCP_CONFIG" "${MCP_CONFIG}.backup"
    echo -e "${GREEN}✅ Created backup: ${MCP_CONFIG}.backup${NC}"
fi

# Update MCP config with actual token
cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "n8n-alpha-medical": {
      "url": "https://n8n.srv1168256.hstgr.cloud/mcp-server/http",
      "transport": {
        "type": "sse",
        "headers": {
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWQ5MzQ1ZS1kYjk0LTQ1MDYtOTQzNC1lNjUyNWJkMjcxOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjE5MmUwMDg4LWYyOWItNDA2OS04NmZlLTkzNTg2ZDhlOTdmNSIsImlhdCI6MTc2NDYyNTczMn0.vXYG6FauIcQaJIOwDyCeYBUtCVUwxb1x2mWyJ8enrwE"
        }
      }
    },
    "klaviyo": {
      "command": "uvx",
      "args": ["klaviyo-mcp-server@latest"],
      "env": {
        "PRIVATE_API_KEY": "pk_5ea06571b22f82d09dbc157f2c3bd2f0f7",
        "READ_ONLY": "false",
        "ALLOW_USER_GENERATED_CONTENT": "false"
      }
    },
    "shopify": {
      "command": "npx",
      "args": [
        "shopify-mcp",
        "--accessToken",
        "$TOKEN",
        "--domain",
        "$DOMAIN"
      ]
    }
  }
}
EOF

echo -e "${GREEN}✅ Updated MCP configuration with Shopify server${NC}"

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✅ SHOPIFY MCP SERVER CONFIGURED${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "MCP Servers now available:"
echo -e "  1. ${GREEN}n8n-alpha-medical${NC} - Workflow automation"
echo -e "  2. ${GREEN}klaviyo${NC} - Email marketing"
echo -e "  3. ${GREEN}shopify${NC} - Store management (NEW)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Restart Claude Code to activate the Shopify MCP server${NC}"
echo ""
echo -e "After restart, you can use natural language queries like:"
echo -e "  - 'List all products in the store'"
echo -e "  - 'Show orders from last week'"
echo -e "  - 'Get customer segments'"
echo ""
