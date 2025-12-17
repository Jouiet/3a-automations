# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Looker Studio - Shopify Data Bridge
Automatically pulls metrics from Shopify API and updates Google Sheet
for Looker Studio investor dashboard

Usage: python3 scripts/looker_studio_shopify_bridge.py
Schedule: Daily via GitHub Actions (2 AM UTC)
"""

import os
import sys
from datetime import datetime, timedelta
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SHOPIFY_TOKEN = os.getenv('SHOPIFY_ADMIN_API_TOKEN')
SHOPIFY_STORE = os.getenv('SHOPIFY_STORE_URL')
SHOPIFY_API_VERSION = '2025-10'

# Google Sheets configuration (will be added after Sheets setup)
# GOOGLE_SHEET_ID = os.getenv('INVESTOR_DASHBOARD_SHEET_ID')
# SERVICE_ACCOUNT_JSON = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')

def get_shopify_metrics():
    """
    Fetch current metrics from Shopify Admin API

    Returns:
        dict: Monthly metrics including revenue, orders, products, etc.
    """
    headers = {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
    }

    base_url = f'https://{SHOPIFY_STORE}/admin/api/{SHOPIFY_API_VERSION}'

    # Current month date range
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1)
    month_start_str = month_start.strftime('%Y-%m-%dT00:00:00Z')

    metrics = {
        'month': now.strftime('%Y-%m'),
        'date_updated': now.strftime('%Y-%m-%d %H:%M:%S UTC')
    }

    try:
        # 1. Get Orders (This Month)
        print("📦 Fetching orders...")
        orders_url = f'{base_url}/orders.json?status=any&created_at_min={month_start_str}&limit=250'
        orders_response = requests.get(orders_url, headers=headers)
        orders_response.raise_for_status()
        orders_data = orders_response.json()

        orders = orders_data.get('orders', [])

        # Calculate revenue metrics
        revenue = sum([float(order['total_price']) for order in orders])
        order_count = len(orders)
        aov = revenue / order_count if order_count > 0 else 0

        metrics['revenue'] = round(revenue, 2)
        metrics['orders'] = order_count
        metrics['aov'] = round(aov, 2)

        print(f"  ✅ Revenue: ${revenue:.2f} ({order_count} orders)")

        # 2. Get Product Count
        print("📦 Fetching product count...")
        products_url = f'{base_url}/products/count.json'
        products_response = requests.get(products_url, headers=headers)
        products_response.raise_for_status()
        products_data = products_response.json()

        metrics['products'] = products_data['count']
        print(f"  ✅ Products: {metrics['products']}")

        # 3. Get Customer Count
        print("👥 Fetching customer count...")
        customers_url = f'{base_url}/customers/count.json'
        customers_response = requests.get(customers_url, headers=headers)
        customers_response.raise_for_status()
        customers_data = customers_response.json()

        metrics['customers'] = customers_data['count']
        print(f"  ✅ Customers: {metrics['customers']}")

        # 4. Get Collection Count
        print("📂 Fetching collection count...")
        collections_url = f'{base_url}/custom_collections/count.json'
        collections_response = requests.get(collections_url, headers=headers)
        collections_response.raise_for_status()
        collections_data = collections_response.json()

        metrics['collections'] = collections_data['count']
        print(f"  ✅ Collections: {metrics['collections']}")

        # 5. Calculate Conversion Rate (if traffic data available)
        # This would come from GA4 API - placeholder for now
        metrics['conversion_rate'] = 0.0

        # 6. Social Media Followers (from META_ACCESS_TOKEN)
        if os.getenv('META_ACCESS_TOKEN') and os.getenv('FACEBOOK_PAGE_ID'):
            print("📱 Fetching Facebook followers...")
            try:
                fb_token = os.getenv('META_ACCESS_TOKEN')
                fb_page_id = os.getenv('FACEBOOK_PAGE_ID')
                fb_url = f'https://graph.facebook.com/v24.0/{fb_page_id}?fields=followers_count,fan_count&access_token={fb_token}'
                fb_response = requests.get(fb_url)
                fb_data = fb_response.json()

                metrics['facebook_followers'] = fb_data.get('followers_count', 0)
                metrics['facebook_likes'] = fb_data.get('fan_count', 0)
                print(f"  ✅ Facebook Followers: {metrics.get('facebook_followers', 0)}")
            except Exception as e:
                print(f"  ⚠️  Facebook API error: {e}")
                metrics['facebook_followers'] = 0
                metrics['facebook_likes'] = 0
        else:
            metrics['facebook_followers'] = 0
            metrics['facebook_likes'] = 0

        # 7. Email Subscribers (from Omnisend if connected)
        # Placeholder - would require Omnisend API integration
        metrics['email_subscribers'] = 0

        print("\n" + "="*50)
        print("📊 METRICS SUMMARY")
        print("="*50)
        for key, value in metrics.items():
            print(f"{key:20s}: {value}")
        print("="*50)

        return metrics

    except requests.exceptions.RequestException as e:
        print(f"❌ API Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        sys.exit(1)


def update_google_sheet(metrics):
    """
    Update Google Sheet with latest metrics
    Requires: google-auth, google-api-python-client

    Args:
        metrics (dict): Monthly metrics to append
    """
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        SHEET_ID = os.getenv('INVESTOR_DASHBOARD_SHEET_ID')
        SERVICE_ACCOUNT_JSON = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')

        if not SHEET_ID or not SERVICE_ACCOUNT_JSON:
            print("⚠️  Google Sheets not configured. Skipping update.")
            print("   Set INVESTOR_DASHBOARD_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON")
            return

        # Parse service account JSON from env var
        import json
        service_account_info = json.loads(SERVICE_ACCOUNT_JSON)

        SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
        creds = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES)

        service = build('sheets', 'v4', credentials=creds)

        # Prepare row data
        row = [
            metrics['month'],
            metrics['revenue'],
            metrics['orders'],
            metrics['aov'],
            metrics['products'],
            metrics['customers'],
            metrics['collections'],
            metrics['email_subscribers'],
            metrics['facebook_followers'],
            metrics['facebook_likes'],
            metrics['conversion_rate'],
            metrics['date_updated']
        ]

        # Append to Google Sheet
        values = [row]
        body = {'values': values}

        result = service.spreadsheets().values().append(
            spreadsheetId=SHEET_ID,
            range='MonthlyMetrics!A:L',  # Adjust sheet name if needed
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()

        print(f"\n✅ Google Sheet updated: {result.get('updates').get('updatedCells')} cells")

    except ImportError:
        print("⚠️  Google API libraries not installed. Install with:")
        print("   pip install google-auth google-api-python-client")
    except Exception as e:
        print(f"❌ Google Sheets update error: {e}")


def save_metrics_locally(metrics):
    """
    Save metrics to local JSON file as backup

    Args:
        metrics (dict): Monthly metrics
    """
    backup_dir = 'data/investor_metrics'
    os.makedirs(backup_dir, exist_ok=True)

    filename = f"{backup_dir}/{metrics['month']}_metrics.json"

    with open(filename, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n💾 Backup saved: {filename}")


if __name__ == '__main__':
    print("=" * 50)
    print("MYDEALZ INVESTOR DASHBOARD - DATA UPDATE")
    print("=" * 50)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n")

    # Fetch metrics from Shopify
    metrics = get_shopify_metrics()

    # Save local backup
    save_metrics_locally(metrics)

    # Update Google Sheet (if configured)
    update_google_sheet(metrics)

    print("\n✅ Update complete!")
    print("=" * 50)
