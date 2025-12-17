#!/usr/bin/env python3
"""
HENDERSON SHOP - FACEBOOK LEAD ADS SYNC TO GOOGLE SHEETS
Purpose: Sync Facebook Lead Ads entries directly to Google Sheets (NO Zapier/Make.com)
Cost: $0 (Facebook API direct)
Schedule: GitHub Actions daily
"""

import os
import requests
from datetime import datetime
from typing import List, Dict
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# =====================================================
# CONFIGURATION
# =====================================================

FACEBOOK_ACCESS_TOKEN = os.getenv('FACEBOOK_ACCESS_TOKEN')
FACEBOOK_PAGE_ID = os.getenv('FACEBOOK_PAGE_ID')
FACEBOOK_FORM_ID = os.getenv('FACEBOOK_FORM_ID')  # Lead form ID

GOOGLE_SHEET_NAME = "Henderson PRE-LAUNCH Leads 2025"
GOOGLE_CREDS_PATH = os.getenv('GOOGLE_CREDS_PATH', '.credentials/google-sheets-service-account.json')

# =====================================================
# FACEBOOK API CLIENT
# =====================================================

def get_facebook_leads() -> List[Dict]:
    """Fetch leads from Facebook Lead Ads API"""
    if not FACEBOOK_ACCESS_TOKEN or not FACEBOOK_FORM_ID:
        print("⚠️ Facebook credentials not configured. Skipping.")
        return []

    url = f"https://graph.facebook.com/v19.0/{FACEBOOK_FORM_ID}/leads"
    params = {
        'access_token': FACEBOOK_ACCESS_TOKEN,
        'fields': 'id,created_time,field_data'
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        leads = []
        for lead in data.get('data', []):
            lead_data = {
                'fb_lead_id': lead['id'],
                'created_time': lead['created_time']
            }

            # Parse field_data (Facebook form fields)
            for field in lead.get('field_data', []):
                field_name = field['name'].lower().replace(' ', '_')
                field_value = field['values'][0] if field['values'] else ''
                lead_data[field_name] = field_value

            leads.append(lead_data)

        print(f"✅ Facebook API: {len(leads)} leads fetched")
        return leads

    except requests.exceptions.RequestException as e:
        print(f"❌ Facebook API error: {e}")
        return []

# =====================================================
# GOOGLE SHEETS CLIENT
# =====================================================

def get_sheets_client():
    """Initialize Google Sheets API client"""
    scope = [
        'https://spreadsheets.google.com/feeds',
        'https://www.googleapis.com/auth/drive'
    ]

    creds = ServiceAccountCredentials.from_json_keyfile_name(GOOGLE_CREDS_PATH, scope)
    client = gspread.authorize(creds)
    return client

def append_to_sheet(client, leads: List[Dict]):
    """Append Facebook leads to Google Sheets"""
    if not leads:
        print("ℹ️ No new Facebook leads to sync")
        return 0

    try:
        sheet = client.open(GOOGLE_SHEET_NAME)
        worksheet = sheet.worksheet("Facebook Lead Ads")

        # Get existing lead IDs to avoid duplicates
        existing = worksheet.get_all_records()
        existing_ids = {row.get('FB_Lead_ID') for row in existing if row.get('FB_Lead_ID')}

        # Prepare rows
        rows_to_append = []
        for lead in leads:
            fb_id = lead.get('fb_lead_id')

            # Skip if already synced
            if fb_id in existing_ids:
                continue

            row = [
                lead.get('created_time', ''),
                lead.get('email', ''),
                lead.get('first_name', ''),
                lead.get('last_name', ''),
                lead.get('phone_number', ''),
                lead.get('motorcycle_type', ''),
                'NO',  # Processed flag
                fb_id  # For deduplication
            ]
            rows_to_append.append(row)

        # Append new leads
        if rows_to_append:
            worksheet.append_rows(rows_to_append)
            print(f"✅ Google Sheets: {len(rows_to_append)} new Facebook leads synced")
            return len(rows_to_append)
        else:
            print("ℹ️ All Facebook leads already synced (no duplicates)")
            return 0

    except Exception as e:
        print(f"❌ Google Sheets sync error: {e}")
        return 0

# =====================================================
# MAIN EXECUTION
# =====================================================

def main():
    """Sync Facebook Lead Ads to Google Sheets"""
    print("=" * 60)
    print("FACEBOOK LEAD ADS → GOOGLE SHEETS SYNC")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Fetch leads from Facebook
    leads = get_facebook_leads()

    # Sync to Google Sheets
    client = get_sheets_client()
    synced = append_to_sheet(client, leads)

    print("=" * 60)
    print(f"SYNC COMPLETE: {synced} new leads added")
    print("=" * 60)

if __name__ == "__main__":
    main()
