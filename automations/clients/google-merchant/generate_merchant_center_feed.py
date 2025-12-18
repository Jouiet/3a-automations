# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Google Merchant Center Product Feed Generator
Generates product feed XML for Google Shopping FREE listings
Priority: Phase 0.5 Week 1 (Session 77 corrections)
"""

import os
import json
from datetime import datetime
from dotenv import load_dotenv
import requests

load_dotenv()

# Shopify credentials
SHOPIFY_STORE = '5dc028-dd.myshopify.com'  # From user context
SHOPIFY_TOKEN = os.getenv('SHOPIFY_ADMIN_API_TOKEN')
API_VERSION = '2025-10'

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
        '<title>MyDealz - Premium Deals</title>',
        '<link>https://mydealz.shop</link>',
        '<description>Premium winter coats, travel bags, and quality products curated for value</description>',
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
            import re
            description = re.sub(r'<[^>]+>', '', description)
            description = description[:5000]  # Google max 5000 chars
            
            link = f"https://mydealz.shop/products/{product['handle']}"
            if len(product['variants']) > 1:
                link += f"?variant={variant['id']}"
            
            image_link = product['image']['src'] if product.get('image') else ''
            
            # Price
            price = f"{variant['price']} USD"
            availability = "in stock" if variant['inventory_quantity'] > 0 else "out of stock"
            
            # Condition: new (all products new)
            condition = "new"
            
            # Product type and Google category
            product_type = product.get('product_type', 'General')
            
            # Google product category (approximate mapping)
            google_category = "166"  # Default: Apparel & Accessories
            if 'coat' in title.lower() or 'jacket' in title.lower():
                google_category = "5598"  # Clothing > Outerwear > Coats & Jackets
            elif 'bag' in title.lower() or 'backpack' in title.lower():
                google_category = "100"  # Luggage & Bags
            elif 'electronic' in product_type.lower():
                google_category = "222"  # Electronics
            
            # Brand
            brand = product.get('vendor', 'MyDealz')
            
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
    print("🛍️ Google Merchant Center Feed Generator")
    print("=" * 50)
    print(f"Fetching products from {SHOPIFY_STORE}...")
    
    products = fetch_products()
    print(f"✅ Fetched {len(products)} products")
    
    # Count variants
    total_variants = sum(len(p['variants']) for p in products)
    print(f"📦 Total product variants: {total_variants}")
    
    print("\n🔨 Generating Google Merchant Center XML feed...")
    feed_xml = generate_merchant_center_feed(products)
    
    # Save to file
    output_file = 'google-merchant-center-feed.xml'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(feed_xml)
    
    file_size = os.path.getsize(output_file)
    print(f"\n✅ Feed generated: {output_file}")
    print(f"📏 File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\n📋 NEXT STEPS (Manual - 30 min):")
    print("1. Go to https://merchants.google.com")
    print("2. Create account (Business name: MyDealz)")
    print("3. Verify website ownership (mydealz.shop)")
    print("4. Upload feed:")
    print(f"   - Method: Upload file")
    print(f"   - File: {output_file}")
    print("   OR")
    print("   - Method: Scheduled fetch")
    print("   - URL: https://mydealz.shop/google-merchant-center-feed.xml")
    print("   (Upload feed to Shopify Files first)")
    print("\n5. Submit for review (3-7 days)")
    print("\n💰 ROI: +500-2,000 FREE visitors/month (Month 3+)")

if __name__ == '__main__':
    main()
