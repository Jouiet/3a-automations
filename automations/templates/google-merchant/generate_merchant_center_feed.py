#!/usr/bin/env python3
"""
Google Merchant Center Product Feed Generator - Generic Version
Generates product feed XML for Google Shopping FREE listings

Usage:
  python generate_merchant_center_feed.py

Environment Variables (required):
  - SHOPIFY_STORE_DOMAIN: Store domain (e.g., mystore.myshopify.com)
  - SHOPIFY_ACCESS_TOKEN: Admin API token
  - STORE_URL: Public store URL (e.g., https://mystore.com)
  - STORE_NAME: Store name for feed title
  - CURRENCY: Currency code (default: USD)
"""

import os
import sys
import json
import re
from datetime import datetime
from pathlib import Path

# Find project root and load .env
project_root = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / '.env')

import requests

# Configuration from environment
SHOPIFY_STORE = os.getenv('SHOPIFY_STORE_DOMAIN')
SHOPIFY_TOKEN = os.getenv('SHOPIFY_ACCESS_TOKEN')
STORE_URL = os.getenv('STORE_URL') or os.getenv('SHOPIFY_STORE_URL')
STORE_NAME = os.getenv('STORE_NAME', 'My Store')
CURRENCY = os.getenv('CURRENCY', 'USD')
API_VERSION = os.getenv('SHOPIFY_API_VERSION', '2024-01')

# Validate required config
missing = []
if not SHOPIFY_STORE:
    missing.append('SHOPIFY_STORE_DOMAIN')
if not SHOPIFY_TOKEN:
    missing.append('SHOPIFY_ACCESS_TOKEN')
if not STORE_URL:
    missing.append('STORE_URL or SHOPIFY_STORE_URL')

if missing:
    print(f"❌ ERREUR: Variables manquantes: {', '.join(missing)}")
    print("\nAjoutez ces variables à votre .env:")
    for var in missing:
        print(f"  {var}=...")
    sys.exit(1)


def fetch_products():
    """Fetch all published products from Shopify"""
    url = f"https://{SHOPIFY_STORE}/admin/api/{API_VERSION}/products.json"
    headers = {'X-Shopify-Access-Token': SHOPIFY_TOKEN}
    params = {'status': 'active', 'limit': 250}

    products = []
    while url:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        products.extend(data['products'])

        # Pagination
        link_header = response.headers.get('Link', '')
        url = None
        if 'rel="next"' in link_header:
            for link in link_header.split(','):
                if 'rel="next"' in link:
                    url = link[link.find('<')+1:link.find('>')]
        params = None  # URL already contains params

    return products


def generate_merchant_center_feed(products):
    """Generate Google Merchant Center XML feed"""

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
        '<channel>',
        f'<title>{STORE_NAME}</title>',
        f'<link>{STORE_URL}</link>',
        f'<description>Products from {STORE_NAME}</description>',
    ]

    for product in products:
        # Skip draft products
        if product['status'] != 'active':
            continue

        for variant in product['variants']:
            # Required fields
            product_id = f"shopify_US_{product['id']}_{variant['id']}"
            title = product['title']
            if len(product['variants']) > 1 and variant['title'] != 'Default Title':
                title = f"{product['title']} - {variant['title']}"

            description = product['body_html'] or product['title']
            # Strip HTML tags for Google
            description = re.sub(r'<[^>]+>', '', description)
            description = description[:5000]  # Google max 5000 chars

            link = f"{STORE_URL}/products/{product['handle']}"
            if len(product['variants']) > 1:
                link += f"?variant={variant['id']}"

            image_link = product['image']['src'] if product.get('image') else ''

            # Price
            price = f"{variant['price']} {CURRENCY}"
            availability = "in stock" if variant.get('inventory_quantity', 0) > 0 else "out of stock"

            # Condition: new (all products new)
            condition = "new"

            # Product type and Google category
            product_type = product.get('product_type', 'General')

            # Google product category (approximate mapping)
            google_category = "166"  # Default: Apparel & Accessories
            title_lower = title.lower()
            if 'coat' in title_lower or 'jacket' in title_lower:
                google_category = "5598"  # Clothing > Outerwear > Coats & Jackets
            elif 'bag' in title_lower or 'backpack' in title_lower:
                google_category = "100"  # Luggage & Bags
            elif 'electronic' in product_type.lower():
                google_category = "222"  # Electronics
            elif 'medical' in title_lower or 'health' in title_lower:
                google_category = "491"  # Health & Beauty

            # Brand
            brand = product.get('vendor', STORE_NAME)

            # GTIN/MPN optional but recommended
            gtin = variant.get('barcode', '')

            # Age group, gender (if applicable)
            age_group = "adult"
            gender = "unisex"

            # Build item XML
            item_xml = f"""
<item>
<g:id>{product_id}</g:id>
<g:title><![CDATA[{title[:150]}]]></g:title>
<g:description><![CDATA[{description}]]></g:description>
<g:link>{link}</g:link>
<g:image_link>{image_link}</g:image_link>
<g:availability>{availability}</g:availability>
<g:price>{price}</g:price>
<g:condition>{condition}</g:condition>
<g:google_product_category>{google_category}</g:google_product_category>
<g:product_type>{product_type}</g:product_type>
<g:brand>{brand}</g:brand>
<g:age_group>{age_group}</g:age_group>
<g:gender>{gender}</g:gender>"""

            if gtin:
                item_xml += f"\n<g:gtin>{gtin}</g:gtin>"

            item_xml += "\n</item>"
            xml_lines.append(item_xml)

    xml_lines.extend(['</channel>', '</rss>'])
    return '\n'.join(xml_lines)


def main():
    print("🛍️ Google Merchant Center Feed Generator - Generic")
    print("=" * 60)
    print(f"Store: {SHOPIFY_STORE}")
    print(f"URL: {STORE_URL}")
    print(f"Currency: {CURRENCY}")
    print("=" * 60)
    print(f"\nFetching products...")

    try:
        products = fetch_products()
        print(f"✅ Fetched {len(products)} products")

        # Count variants
        total_variants = sum(len(p['variants']) for p in products)
        print(f"📦 Total product variants: {total_variants}")

        print("\n🔨 Generating Google Merchant Center XML feed...")
        feed_xml = generate_merchant_center_feed(products)

        # Save to outputs directory
        outputs_dir = project_root / 'outputs'
        outputs_dir.mkdir(exist_ok=True)

        store_slug = SHOPIFY_STORE.replace('.myshopify.com', '')
        output_file = outputs_dir / f'google-merchant-feed-{store_slug}.xml'

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(feed_xml)

        file_size = os.path.getsize(output_file)
        print(f"\n✅ Feed generated: {output_file}")
        print(f"📏 File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
        print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        print("\n📋 NEXT STEPS:")
        print("1. Go to https://merchants.google.com")
        print(f"2. Create account (Business name: {STORE_NAME})")
        print(f"3. Verify website ownership ({STORE_URL})")
        print("4. Upload feed:")
        print(f"   - File: {output_file}")
        print("   OR set up scheduled fetch URL")
        print("5. Submit for review (3-7 days)")

    except requests.exceptions.HTTPError as e:
        print(f"\n❌ API Error: {e}")
        if '401' in str(e):
            print("   → Vérifiez SHOPIFY_ACCESS_TOKEN")
        elif '404' in str(e):
            print("   → Vérifiez SHOPIFY_STORE_DOMAIN")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
