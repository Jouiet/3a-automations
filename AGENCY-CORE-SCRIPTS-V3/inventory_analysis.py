# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
FACTUAL INVENTORY ANALYSIS
Query ALL products to determine what exists for bundle composition
"""

import requests
import json
from pathlib import Path
from collections import Counter

env_path = Path('.env')
env_vars = {}
with open(env_path, 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            env_vars[key.strip()] = value.strip()

shop_url = env_vars['SHOPIFY_STORE_URL']
access_token = env_vars['SHOPIFY_ADMIN_API_TOKEN']
api_version = "2024-10"

headers = {
    "X-Shopify-Access-Token": access_token,
    "Content-Type": "application/json"
}

def get_all_products():
    """Get ALL products with pagination"""
    all_products = []
    url = f"https://{shop_url}/admin/api/{api_version}/products.json?limit=250"
    
    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            break
        
        data = response.json()
        products = data.get('products', [])
        all_products.extend(products)
        
        link_header = response.headers.get('Link', '')
        if 'rel="next"' in link_header:
            next_url = link_header.split(';')[0].strip('<>')
            url = next_url
        else:
            url = None
    
    return all_products

def categorize_inventory(products):
    """Categorize products by type and tags"""
    
    # Exclude bundles from inventory
    inventory = [p for p in products if 'bundle' not in p.get('product_type', '').lower()]
    
    by_category = Counter()
    coffee_products = []
    outdoor_products = []
    office_products = []
    audio_products = []
    
    for product in inventory:
        title = product.get('title', '').lower()
        product_type = product.get('product_type', '')
        tags = ','.join(product.get('tags', [])).lower()
        
        by_category[product_type] += 1
        
        # Coffee detection
        if any(keyword in title or keyword in tags for keyword in ['coffee', 'espresso', 'french press', 'grinder', 'beans']):
            coffee_products.append({
                'title': product['title'],
                'type': product_type,
                'id': product['id']
            })
        
        # Outdoor gear detection
        if any(keyword in title or keyword in tags for keyword in ['tent', 'sleeping bag', 'camping', 'hiking', 'outdoor gear', 'backpack']):
            if 'fashion' not in title and 'coat' not in title:  # Exclude fashion items
                outdoor_products.append({
                    'title': product['title'],
                    'type': product_type,
                    'id': product['id']
                })
        
        # Office products
        if product_type in ['Office Supplies', 'Office & Business']:
            office_products.append({
                'title': product['title'],
                'type': product_type,
                'id': product['id']
            })
        
        # Audio products
        if 'headphone' in title or 'earbud' in title or 'speaker' in title:
            audio_products.append({
                'title': product['title'],
                'type': product_type,
                'id': product['id']
            })
    
    return {
        'total_products': len(inventory),
        'by_category': dict(by_category.most_common(20)),
        'coffee_products': coffee_products,
        'outdoor_products': outdoor_products,
        'office_products': office_products[:10],
        'audio_products': audio_products[:10]
    }

def main():
    print("🔍 FACTUAL INVENTORY ANALYSIS")
    print("="*80)
    
    products = get_all_products()
    print(f"Total products fetched: {len(products)}")
    print()
    
    analysis = categorize_inventory(products)
    
    print(f"📊 INVENTORY BREAKDOWN:")
    print(f"   Total non-bundle products: {analysis['total_products']}")
    print()
    
    print("🏆 TOP CATEGORIES:")
    for category, count in list(analysis['by_category'].items())[:10]:
        print(f"   • {category}: {count} products")
    print()
    
    print("☕ COFFEE PRODUCTS:")
    if analysis['coffee_products']:
        for p in analysis['coffee_products'][:5]:
            print(f"   • {p['title']} ({p['type']})")
    else:
        print("   ❌ NO COFFEE MAKERS/BEANS FOUND")
    print()
    
    print("🏕️ OUTDOOR GEAR:")
    if analysis['outdoor_products']:
        for p in analysis['outdoor_products'][:5]:
            print(f"   • {p['title']} ({p['type']})")
    else:
        print("   ❌ NO OUTDOOR GEAR FOUND (only fashion/bags)")
    print()
    
    print("💼 OFFICE PRODUCTS (sample):")
    for p in analysis['office_products'][:5]:
        print(f"   • {p['title']}")
    print()
    
    print("🎧 AUDIO PRODUCTS (sample):")
    for p in analysis['audio_products'][:5]:
        print(f"   • {p['title']}")
    print()
    
    # Save
    with open('inventory_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2)
    
    print("="*80)
    print("✅ Analysis saved to inventory_analysis.json")

if __name__ == "__main__":
    main()
