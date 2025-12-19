# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Check Shopify Analytics API Access

Tests what analytics data is available via Shopify Admin API.

NOTE: Analytics API access varies by Shopify plan:
- Basic: Limited access
- Shopify: More access
- Advanced/Plus: Full access

Author: Claude Code
Date: 2025-11-03
"""

import os
import requests
import json
from datetime import datetime, timezone

# Load from environment
SHOPIFY_STORE_URL = os.getenv('SHOPIFY_STORE_URL', '5dc028-dd.myshopify.com')
SHOPIFY_ADMIN_API_TOKEN = os.getenv('SHOPIFY_ADMIN_API_TOKEN')

if not SHOPIFY_ADMIN_API_TOKEN:
    print("ERROR: SHOPIFY_ADMIN_API_TOKEN not set in environment")
    print("Run: source .env")
    exit(1)

# API configuration
API_VERSION = '2025-10'
BASE_URL = f"https://{SHOPIFY_STORE_URL}/admin/api/{API_VERSION}"
HEADERS = {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
    'Content-Type': 'application/json'
}


def test_shop_info():
    """Test basic shop info access."""
    print("\n" + "="*80)
    print("TEST 1: Shop Info Access")
    print("="*80)

    url = f"{BASE_URL}/shop.json"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        shop = response.json().get('shop', {})
        print(f"✅ Shop Info Access: SUCCESS")
        print(f"   Shop Name: {shop.get('name')}")
        print(f"   Plan Name: {shop.get('plan_name')}")
        print(f"   Plan Display Name: {shop.get('plan_display_name')}")
        print(f"   Domain: {shop.get('domain')}")
        return shop
    else:
        print(f"❌ Shop Info Access: FAILED")
        print(f"   Status: {response.status_code}")
        print(f"   Error: {response.text}")
        return None


def test_products_access():
    """Test products API access."""
    print("\n" + "="*80)
    print("TEST 2: Products API Access")
    print("="*80)

    url = f"{BASE_URL}/products/count.json"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        count = response.json().get('count', 0)
        print(f"✅ Products API Access: SUCCESS")
        print(f"   Total Products: {count}")
        return True
    else:
        print(f"❌ Products API Access: FAILED")
        print(f"   Status: {response.status_code}")
        return False


def test_analytics_api_access():
    """
    Test Analytics API access.

    NOTE: Shopify Analytics API endpoints vary by plan.
    Common endpoints:
    - /admin/api/2025-10/reports.json (available on most plans)
    - Product/sales analytics may require Shopify or higher plans
    """
    print("\n" + "="*80)
    print("TEST 3: Analytics/Reports API Access")
    print("="*80)

    # Try reports endpoint
    url = f"{BASE_URL}/reports.json"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        reports = response.json().get('reports', [])
        print(f"✅ Reports API Access: SUCCESS")
        print(f"   Available Reports: {len(reports)}")

        if reports:
            print(f"\n   📊 Available Report Types:")
            for report in reports[:10]:  # Show first 10
                print(f"      • {report.get('name')} (ID: {report.get('id')})")
                print(f"        Category: {report.get('category')}")

        return True, reports
    elif response.status_code == 402:
        print(f"⚠️  Reports API Access: BLOCKED (Plan Upgrade Required)")
        print(f"   Status: 402 Payment Required")
        print(f"   Your plan may not include Analytics API access")
        return False, []
    elif response.status_code == 403:
        print(f"❌ Reports API Access: FORBIDDEN")
        print(f"   Status: 403 Forbidden")
        print(f"   API token may not have analytics scope")
        return False, []
    else:
        print(f"⚠️  Reports API Access: FAILED")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        return False, []


def test_product_views_tracking():
    """
    Test if product views are tracked.

    NOTE: Shopify doesn't provide built-in product view tracking via API.
    This would require:
    - Custom analytics implementation (GA4, etc.)
    - Shopify Plus with custom app
    - Third-party analytics app
    """
    print("\n" + "="*80)
    print("TEST 4: Product Views/Conversion Tracking")
    print("="*80)

    print("⚠️  IMPORTANT: Shopify Admin API does NOT provide:")
    print("   ❌ Product page views per product")
    print("   ❌ Add-to-cart rates per product")
    print("   ❌ Conversion rates per product")
    print("   ❌ Revenue per product (without orders)")

    print("\n   ℹ️  For MyDealz (affiliate model):")
    print("   • No Shopify orders (purchases on retailer sites)")
    print("   • Need external analytics: GA4, custom tracking, etc.")
    print("   • USE CASE 4 estimates are the best available approach")

    return False


def test_orders_access():
    """Test orders API access (for completeness, though MyDealz has none)."""
    print("\n" + "="*80)
    print("TEST 5: Orders API Access")
    print("="*80)

    url = f"{BASE_URL}/orders/count.json"
    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        count = response.json().get('count', 0)
        print(f"✅ Orders API Access: SUCCESS")
        print(f"   Total Orders: {count}")

        if count == 0:
            print(f"\n   ℹ️  NOTE: 0 orders is expected for MyDealz")
            print(f"   Affiliate model = purchases happen on retailer sites")

        return True
    else:
        print(f"❌ Orders API Access: FAILED")
        print(f"   Status: {response.status_code}")
        return False


def main():
    """Run all API access tests."""
    print("="*80)
    print("SHOPIFY ANALYTICS API ACCESS CHECK")
    print("="*80)
    print(f"\nStore: {SHOPIFY_STORE_URL}")
    print(f"API Version: {API_VERSION}")
    print(f"Testing at: {datetime.now(timezone.utc).isoformat()}")

    results = {}

    # Test 1: Shop Info
    shop_info = test_shop_info()
    results['shop_info'] = shop_info is not None

    # Test 2: Products
    results['products'] = test_products_access()

    # Test 3: Analytics/Reports
    results['analytics'], reports = test_analytics_api_access()

    # Test 4: Product Views (always False for Shopify API)
    results['product_views'] = test_product_views_tracking()

    # Test 5: Orders
    results['orders'] = test_orders_access()

    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)

    print(f"\n✅ Working:")
    for key, value in results.items():
        if value:
            print(f"   • {key.replace('_', ' ').title()}")

    print(f"\n❌ Not Available:")
    for key, value in results.items():
        if not value:
            print(f"   • {key.replace('_', ' ').title()}")

    # Conclusion for USE CASE 4
    print("\n" + "="*80)
    print("CONCLUSION FOR USE CASE 4")
    print("="*80)

    if results.get('product_views'):
        print("✅ Product conversion data available via API")
        print("   → Can implement exact correlation analysis")
    else:
        print("❌ Product conversion data NOT available via Shopify API")
        print("   → USE CASE 4 estimates are the best available approach")
        print("   → For exact data, need:")
        print("      • Google Analytics 4 (already installed)")
        print("      • Custom product view tracking")
        print("      • Third-party analytics app")

    if shop_info:
        plan = shop_info.get('plan_name', 'unknown')
        print(f"\n📋 Your Plan: {plan}")

        if plan == 'basic':
            print("   ⚠️  Basic plan has limited Analytics API access")
            print("   ⚠️  Product-level analytics require Shopify plan or higher")

    print("\n" + "="*80)


if __name__ == "__main__":
    main()
