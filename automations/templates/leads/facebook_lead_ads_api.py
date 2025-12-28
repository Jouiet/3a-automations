#!/usr/bin/env python3
"""
Facebook Lead Ads API - Daily Automated Pull
Pulls leads from Facebook Lead Ads forms and exports to CSV
for import to Google Sheets

Requirements:
  - facebook-business library
  - python-dotenv
  - pandas

Install: pip install facebook-business python-dotenv pandas

Usage:
  python facebook_lead_ads_api.py

Environment Variables (in .env):
  - FACEBOOK_ACCESS_TOKEN
  - FACEBOOK_APP_SECRET
  - FACEBOOK_APP_ID
  - FACEBOOK_LEAD_FORM_ID

Date: 2025-11-25
"""

import os
import sys
import json
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Try to import Facebook SDK
try:
    from facebook_business.api import FacebookAdsApi
    from facebook_business.adobjects.leadgenform import LeadgenForm
except ImportError:
    print("❌ ERROR: facebook-business library not installed")
    print("📦 Install with: pip install facebook-business")
    sys.exit(1)

# Load environment variables
load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

# Facebook API credentials
ACCESS_TOKEN = os.getenv('FACEBOOK_ACCESS_TOKEN')
APP_SECRET = os.getenv('FACEBOOK_APP_SECRET')
APP_ID = os.getenv('FACEBOOK_APP_ID')
FORM_ID = os.getenv('FACEBOOK_LEAD_FORM_ID')

# Output directory
OUTPUT_DIR = 'lead-management/imports'

# ============================================================================
# VALIDATION
# ============================================================================

def validate_config():
    """Validate that all required environment variables are set"""
    missing = []

    if not ACCESS_TOKEN:
        missing.append('FACEBOOK_ACCESS_TOKEN')
    if not APP_SECRET:
        missing.append('FACEBOOK_APP_SECRET')
    if not APP_ID:
        missing.append('FACEBOOK_APP_ID')
    if not FORM_ID:
        missing.append('FACEBOOK_LEAD_FORM_ID')

    if missing:
        print("❌ ERROR: Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        print("\n📝 Create a .env file with these variables")
        print("   See .env.example for template")
        sys.exit(1)

    print("✅ Configuration validated")

# ============================================================================
# FACEBOOK API
# ============================================================================

def init_api():
    """Initialize Facebook Ads API"""
    try:
        FacebookAdsApi.init(
            app_id=APP_ID,
            app_secret=APP_SECRET,
            access_token=ACCESS_TOKEN
        )
        print("✅ Facebook API initialized")
        return True
    except Exception as e:
        print(f"❌ ERROR initializing Facebook API: {e}")
        return False

def get_leads_since_yesterday():
    """Pull leads from last 24 hours"""
    try:
        form = LeadgenForm(FORM_ID)

        # Calculate timestamp (last 24h)
        yesterday = datetime.now() - timedelta(days=1)
        timestamp = int(yesterday.timestamp())

        print(f"📅 Fetching leads since: {yesterday.strftime('%Y-%m-%d %H:%M:%S')}")

        # Get leads
        params = {
            'filtering': [{
                'field': 'time_created',
                'operator': 'GREATER_THAN',
                'value': timestamp
            }]
        }

        leads = form.get_leads(params=params)
        leads_list = list(leads)

        print(f"📥 Found {len(leads_list)} leads from last 24h")
        return leads_list

    except Exception as e:
        print(f"❌ ERROR fetching leads: {e}")
        return []

def extract_lead_data(leads):
    """Extract and structure lead data"""
    structured_leads = []

    for lead in leads:
        try:
            # Get field data
            field_data = {}
            if 'field_data' in lead:
                for field in lead['field_data']:
                    field_name = field.get('name', '')
                    field_values = field.get('values', [])
                    if field_values:
                        field_data[field_name] = field_values[0]

            # Structure lead according to Google Sheets format
            structured_lead = {
                'lead_id': lead.get('id', ''),
                'created_time': lead.get('created_time', ''),
                'source': 'Facebook Lead Ads',
                'campaign_name': '',  # Will be filled by campaign data if available
                'ad_name': '',  # Will be filled by ad data if available
                'form_name': 'Facebook Lead Ads Form',
                'first_name': field_data.get('first_name', ''),
                'last_name': field_data.get('last_name', ''),
                'email': field_data.get('email', ''),
                'phone': field_data.get('phone_number', field_data.get('phone', '')),
                'city': field_data.get('city', ''),
                'country': field_data.get('country', 'Canada'),
                'interest': field_data.get('product_interest', field_data.get('interest', '')),
                'budget': field_data.get('budget_range', field_data.get('budget', ''))
            }

            structured_leads.append(structured_lead)

        except Exception as e:
            print(f"⚠️  Error processing lead {lead.get('id', 'unknown')}: {e}")
            continue

    return structured_leads

def export_to_csv(leads):
    """Export leads to CSV"""
    if not leads:
        print("⚠️  No leads to export")
        return None

    try:
        # Create DataFrame
        df = pd.DataFrame(leads)

        # Generate filename with date
        date_str = datetime.now().strftime('%Y-%m-%d')
        filename = f"{OUTPUT_DIR}/facebook-leads-{date_str}.csv"

        # Ensure directory exists
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Export to CSV
        df.to_csv(filename, index=False)

        print(f"✅ Exported {len(leads)} leads to {filename}")
        return filename

    except Exception as e:
        print(f"❌ ERROR exporting to CSV: {e}")
        return None

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main execution"""
    print("═══════════════════════════════════════")
    print("📱 FACEBOOK LEAD ADS API - DAILY PULL")
    print("═══════════════════════════════════════")
    print()

    # Validate configuration
    validate_config()
    print()

    # Initialize API
    if not init_api():
        sys.exit(1)
    print()

    # Get leads
    print("📥 Fetching leads from Facebook...")
    leads_raw = get_leads_since_yesterday()
    print()

    if not leads_raw:
        print("✅ No new leads in the last 24 hours")
        print("═══════════════════════════════════════")
        sys.exit(0)

    # Extract and structure
    print("🔄 Processing leads...")
    leads_structured = extract_lead_data(leads_raw)
    print(f"✅ Processed {len(leads_structured)} leads")
    print()

    # Export to CSV
    print("💾 Exporting to CSV...")
    csv_file = export_to_csv(leads_structured)
    print()

    if csv_file:
        print("═══════════════════════════════════════")
        print("✅ FACEBOOK LEADS PULL COMPLETED")
        print(f"📊 Total leads: {len(leads_structured)}")
        print(f"📄 File: {csv_file}")
        print()
        print("📌 Next steps:")
        print(f"   1. Import to Google Sheets:")
        print(f"      node import-facebook-lead-ads.js {csv_file} \"Facebook Lead Ads - {datetime.now().strftime('%Y-%m-%d')}\"")
        print()
        print(f"   2. Or use the generic import script:")
        print(f"      python import_leads_to_sheet.py {csv_file}")
        print("═══════════════════════════════════════")
    else:
        print("❌ Export failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
