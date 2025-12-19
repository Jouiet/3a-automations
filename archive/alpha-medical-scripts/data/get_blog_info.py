# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""Get blog information from Shopify"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv('.env.admin')

SHOPIFY_STORE_DOMAIN = os.getenv("SHOPIFY_STORE_DOMAIN")
SHOPIFY_ADMIN_ACCESS_TOKEN = os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN")

GRAPHQL_URL = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json"

headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": SHOPIFY_ADMIN_ACCESS_TOKEN
}

query = """
{
  blogs(first: 5) {
    edges {
      node {
        id
        handle
        title
        articlesCount {
          count
        }
      }
    }
  }
}
"""

response = requests.post(GRAPHQL_URL, json={"query": query}, headers=headers)
print(json.dumps(response.json(), indent=2))
