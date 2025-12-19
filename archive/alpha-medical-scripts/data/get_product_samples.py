# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Get sample products with images to understand handle mapping
"""
import requests
import json

# Load credentials
def load_env():
    env_vars = {}
    with open('.env.admin', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    return env_vars

env = load_env()
store = env.get('SHOPIFY_STORE_DOMAIN')
token = env.get('SHOPIFY_ADMIN_ACCESS_TOKEN')

headers = {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json'
}

# Get all products
url = f"https://{store}/admin/api/2024-10/products.json?limit=250"
response = requests.get(url, headers=headers)

if response.status_code == 200:
    products = response.json()['products']

    # Filter non-bundle products with images
    regular_products = [p for p in products if 'bundle' not in p.get('tags', '').lower()]

    print(f"🔍 REGULAR PRODUCTS WITH IMAGES (sample of 20):\n")
    print("="*100)

    # Filter products with knee, wrist, ankle, etc.
    keywords = ['knee', 'ankle', 'wrist', 'elbow', 'foot', 'brace', 'support']

    count = 0
    matching_products = []

    for p in regular_products:
        if len(p.get('images', [])) > 0:
            title_lower = p['title'].lower()
            if any(kw in title_lower for kw in keywords):
                matching_products.append({
                    'handle': p['handle'],
                    'title': p['title'],
                    'image_count': len(p['images']),
                    'first_image': p['images'][0]['src']
                })

                print(f"Handle: {p['handle']}")
                print(f"Title: {p['title'][:80]}")
                print(f"Images: {len(p['images'])}")
                print()

                count += 1
                if count >= 20:
                    break

    print("="*100)
    print(f"\n📊 STATS:")
    print(f"Total products (non-bundles): {len(regular_products)}")
    products_with_images = [p for p in regular_products if len(p.get('images', [])) > 0]
    print(f"Products WITH images: {len(products_with_images)}")
    print(f"Medical products found: {len(matching_products)}")

    # Save matching products
    with open('medical_products_with_images.json', 'w') as f:
        json.dump(matching_products, f, indent=2)

    print(f"\n💾 Saved to: medical_products_with_images.json")
else:
    print(f"❌ API Error: {response.status_code}")
