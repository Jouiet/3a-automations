#!/usr/bin/env python3
"""
Low Stock Monitoring - Henderson Shop
Automation: Alert on low stock items (< 10 units)
Runs: Daily cron job
ROI: $5k-10k/year (prevents bestseller stockouts)
"""

import os
import sys
import requests
import json
from datetime import datetime

# Load credentials (Secure - from environment variables)
SHOPIFY_STORE = "jqp1x4-7e.myshopify.com"
API_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN")
API_VERSION = "2024-10"

# Security validation
if not API_TOKEN:
    print("ERROR: SHOPIFY_ACCESS_TOKEN environment variable not set")
    print("Please set it in .env.local or environment")
    sys.exit(1)

HEADERS = {
    "X-Shopify-Access-Token": API_TOKEN,
    "Content-Type": "application/json"
}

BASE_URL = f"https://{SHOPIFY_STORE}/admin/api/{API_VERSION}"

# Alert thresholds
CRITICAL_STOCK = 0    # Out of stock
LOW_STOCK = 10        # Low stock warning

def get_all_products_with_inventory():
    """Fetch all products with inventory levels"""
    products = []
    url = f"{BASE_URL}/products.json?limit=250&fields=id,title,variants"

    while url:
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            print(f"❌ Error fetching products: {response.status_code}")
            return []

        data = response.json()
        products.extend(data.get("products", []))

        # Check for next page
        link_header = response.headers.get("Link", "")
        if 'rel="next"' in link_header:
            next_url = link_header.split(';')[0].strip('<>')
            url = next_url
        else:
            url = None

    return products

def analyze_inventory():
    """Analyze inventory and categorize by stock level"""
    print("="*80)
    print("📦 LOW STOCK MONITORING - HENDERSON SHOP")
    print("="*80)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Store: {SHOPIFY_STORE}")
    print()

    # Fetch products
    print("📥 Fetching products with inventory...")
    products = get_all_products_with_inventory()
    print(f"✅ Found {len(products)} products")
    print()

    # Analyze inventory
    out_of_stock = []
    low_stock = []
    healthy_stock = []

    total_variants = 0

    for product in products:
        product_title = product.get("title", "Unknown")
        product_id = product.get("id")

        for variant in product.get("variants", []):
            total_variants += 1
            variant_title = variant.get("title", "Default")
            inventory_qty = variant.get("inventory_quantity", 0)
            sku = variant.get("sku", "No SKU")
            price = variant.get("price", "0.00")

            item = {
                "product_title": product_title,
                "variant_title": variant_title,
                "sku": sku,
                "price": price,
                "inventory": inventory_qty,
                "product_id": product_id,
                "variant_id": variant.get("id")
            }

            if inventory_qty == CRITICAL_STOCK:
                out_of_stock.append(item)
            elif inventory_qty < LOW_STOCK:
                low_stock.append(item)
            else:
                healthy_stock.append(item)

    # Sort by inventory level
    out_of_stock.sort(key=lambda x: x["inventory"])
    low_stock.sort(key=lambda x: x["inventory"])

    # Display results
    print("="*80)
    print("🚨 CRITICAL - OUT OF STOCK (0 units)")
    print("="*80)
    if out_of_stock:
        for i, item in enumerate(out_of_stock[:10], 1):  # Show top 10
            print(f"{i}. {item['product_title']} - {item['variant_title']}")
            print(f"   SKU: {item['sku']} | Price: ${item['price']} | Stock: {item['inventory']}")
        if len(out_of_stock) > 10:
            print(f"\n   ... and {len(out_of_stock) - 10} more out of stock items")
    else:
        print("✅ No products out of stock")

    print()
    print("="*80)
    print("⚠️  LOW STOCK WARNING (1-9 units)")
    print("="*80)
    if low_stock:
        for i, item in enumerate(low_stock[:10], 1):  # Show top 10
            print(f"{i}. {item['product_title']} - {item['variant_title']}")
            print(f"   SKU: {item['sku']} | Price: ${item['price']} | Stock: {item['inventory']}")
        if len(low_stock) > 10:
            print(f"\n   ... and {len(low_stock) - 10} more low stock items")
    else:
        print("✅ No low stock warnings")

    print()
    print("="*80)
    print("📊 INVENTORY SUMMARY")
    print("="*80)
    print(f"Total Variants: {total_variants}")
    print(f"🚨 Out of Stock: {len(out_of_stock)} ({len(out_of_stock)/total_variants*100:.1f}%)")
    print(f"⚠️  Low Stock (1-9): {len(low_stock)} ({len(low_stock)/total_variants*100:.1f}%)")
    print(f"✅ Healthy Stock (10+): {len(healthy_stock)} ({len(healthy_stock)/total_variants*100:.1f}%)")
    print()

    # Save detailed report
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_variants": total_variants,
            "out_of_stock": len(out_of_stock),
            "low_stock": len(low_stock),
            "healthy_stock": len(healthy_stock)
        },
        "critical_items": out_of_stock,
        "low_stock_items": low_stock
    }

    report_file = f"inventory_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"💾 Detailed report saved: {report_file}")
    print()

    if out_of_stock or low_stock:
        print("💡 RECOMMENDED ACTIONS:")
        if out_of_stock:
            print("   1. 🚨 URGENT: Restock out-of-stock items immediately")
            print("   2. Consider hiding OOS variants from store")
        if low_stock:
            print("   3. ⚠️  Create restock orders for low stock items")
            print("   4. Update DSers for auto-fulfillment")

    print()
    print("="*80)

    return report

if __name__ == "__main__":
    try:
        report = analyze_inventory()
        sys.exit(0)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        sys.exit(1)
