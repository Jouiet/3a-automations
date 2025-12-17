# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""List all collections in Shopify store"""

import requests

SHOPIFY_ADMIN_ACCESS_TOKEN = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')
SHOPIFY_STORE_DOMAIN = 'azffej-as.myshopify.com'

url = f'https://{SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/collections.json'
headers = {'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    collections = response.json().get('custom_collections', [])

    print("=" * 60)
    print(f"COLLECTIONS ({len(collections)} total)")
    print("=" * 60)

    for c in collections:
        print(f"Title: {c['title']}")
        print(f"Handle: {c['handle']}")
        print(f"URL: https://alphamedical.shop/collections/{c['handle']}")
        print(f"Products: {c.get('products_count', 'unknown')}")
        print()
else:
    print(f"Error: HTTP {response.status_code}")
    print(response.text)
