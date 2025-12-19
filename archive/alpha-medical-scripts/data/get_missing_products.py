# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Script pour obtenir les détails des 23 produits non-optimisés
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
BASE_URL = f"https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}"

headers = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

def get_all_products():
    """Récupère tous les produits"""
    all_products = []
    url = f"{BASE_URL}/products.json?limit=250"

    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            break

        data = response.json()
        all_products.extend(data.get("products", []))

        link_header = response.headers.get('Link', '')
        url = None
        if 'rel="next"' in link_header:
            for link in link_header.split(','):
                if 'rel="next"' in link:
                    url = link.split(';')[0].strip('<> ')
                    break

    return all_products

def main():
    products = get_all_products()

    # Filtrer les non-optimisés
    not_optimized = []
    for product in products:
        title = product.get('title', '')
        tags = product.get('tags', '')

        if len(title) > 70 or len(tags) < 20:
            not_optimized.append({
                'id': product['id'],
                'title': title,
                'tags': tags,
                'body_html': product.get('body_html', ''),
                'product_type': product.get('product_type', ''),
                'vendor': product.get('vendor', '')
            })

    print(f"Total produits non-optimisés: {len(not_optimized)}\n")
    print("=" * 80)

    for i, prod in enumerate(not_optimized, 1):
        print(f"\n{i}. PRODUIT ID: {prod['id']}")
        print(f"   Title actuel: {prod['title']}")
        print(f"   Title length: {len(prod['title'])} chars")
        print(f"   Tags actuels: {prod['tags']}")
        print(f"   Product type: {prod['product_type']}")
        print(f"   Vendor: {prod['vendor']}")
        print(f"   Body HTML length: {len(prod['body_html'])} chars")
        print("   " + "-" * 76)

if __name__ == "__main__":
    main()
