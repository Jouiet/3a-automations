# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Récupérer les GIDs des fichiers hero-slide uploadés
"""

import requests
import json
from pathlib import Path

# Load token
env_file = Path(__file__).parent / '.env.admin'
ACCESS_TOKEN = None

if env_file.exists():
    with open(env_file, 'r') as f:
        for line in f:
            if line.startswith('SHOPIFY_ADMIN_ACCESS_TOKEN='):
                ACCESS_TOKEN = line.split('=', 1)[1].strip()
                break

SHOPIFY_DOMAIN = "azffej-as.myshopify.com"
API_VERSION = "2025-10"

headers = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

def query_hero_slides():
    """Query pour récupérer les hero-slide images"""
    graphql_url = f"https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}/graphql.json"

    query = """
    {
      files(first: 50, query: "filename:hero-slide") {
        edges {
          node {
            ... on MediaImage {
              id
              alt
              image {
                url
              }
            }
          }
        }
      }
    }
    """

    response = requests.post(
        graphql_url,
        headers=headers,
        json={"query": query}
    )

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        return

    data = response.json()
    files = data['data']['files']['edges']

    print(f"✅ {len(files)} hero-slide images trouvées\n")

    for file in files:
        node = file['node']
        print(f"GID: {node['id']}")
        print(f"URL: {node['image']['url']}")
        print(f"Alt: {node['alt']}")
        print()

if __name__ == "__main__":
    query_hero_slides()
