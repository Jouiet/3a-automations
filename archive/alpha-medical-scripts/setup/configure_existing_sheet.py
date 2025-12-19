# Type: agency
# Category: setup
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Configure an EXISTING Google Sheet for Lead Management
Use this after manually creating a blank Google Sheet

STEPS:
1. Go to: https://sheets.google.com
2. Create new blank spreadsheet
3. Name it: "Alpha Medical - Lead Management"
4. Click "Share" button
5. Add: ecom-317@astute-quarter-476613-h3.iam.gserviceaccount.com (Editor)
6. Copy the Sheet ID from URL (between /d/ and /edit)
7. Run this script with the Sheet ID as argument
"""

import gspread
from oauth2client.service_account import ServiceAccountCredentials
import sys
from datetime import datetime

CREDENTIALS_FILE = '/Users/mac/Desktop/Alpha-Medical/google_credentials.json'

def configure_sheet(sheet_id):
    """Configure existing Google Sheet with proper structure"""

    print("=" * 70)
    print("CONFIGURING EXISTING GOOGLE SHEET")
    print("=" * 70)
    print(f"\nSheet ID: {sheet_id}")

    # Authenticate
    print("\n[1/4] Authenticating...")
    try:
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            CREDENTIALS_FILE, scope
        )
        client = gspread.authorize(creds)
        print("✅ Authenticated")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return False

    # Open spreadsheet
    print("\n[2/4] Opening spreadsheet...")
    try:
        spreadsheet = client.open_by_key(sheet_id)
        sheet_url = spreadsheet.url
        print(f"✅ Opened: {spreadsheet.title}")
        print(f"   URL: {sheet_url}")
    except Exception as e:
        print(f"❌ Failed to open spreadsheet: {e}")
        print("\nMake sure you:")
        print("1. Shared the sheet with: ecom-317@astute-quarter-476613-h3.iam.gserviceaccount.com")
        print("2. Gave 'Editor' permissions")
        print("3. Used the correct Sheet ID from the URL")
        return False

    # Setup worksheets
    print("\n[3/4] Setting up worksheets...")
    try:
        # Rename first sheet
        worksheet1 = spreadsheet.sheet1
        worksheet1.update_title('Raw Leads')

        # Create additional worksheets
        worksheet2 = spreadsheet.add_worksheet(title='Qualified Leads', rows=1000, cols=20)
        worksheet3 = spreadsheet.add_worksheet(title='Analytics', rows=100, cols=15)

        print("✅ Created 3 worksheets:")
        print("   - Raw Leads")
        print("   - Qualified Leads")
        print("   - Analytics")
    except Exception as e:
        print(f"❌ Failed to create worksheets: {e}")
        return False

    # Add headers
    print("\n[4/4] Adding headers and formatting...")
    try:
        # Raw Leads headers
        headers_raw = [
            'Lead ID', 'Date Scraped', 'Business Name', 'Email', 'Phone',
            'Website', 'Address', 'City', 'State', 'Zip', 'Rating',
            'Reviews Count', 'Category', 'Source', 'Status', 'Notes',
            'Last Contact', 'Next Follow-Up'
        ]
        worksheet1.update('A1:R1', [headers_raw])
        worksheet1.format('A1:R1', {
            'textFormat': {'bold': True, 'fontSize': 10},
            'backgroundColor': {'red': 0.2, 'green': 0.4, 'blue': 0.8},
            'horizontalAlignment': 'CENTER'
        })

        # Freeze header row
        worksheet1.freeze(rows=1)

        # Qualified Leads headers
        headers_qualified = [
            'Lead ID', 'Business Name', 'Email', 'Phone', 'Decision Maker',
            'Estimated Size', 'Current Supplier', 'Pain Points', 'Qualification Score',
            'Stage', 'Assigned To', 'Last Contact', 'Next Action', 'Notes',
            'Conversion Probability', 'Expected Deal Value'
        ]
        worksheet2.update('A1:P1', [headers_qualified])
        worksheet2.format('A1:P1', {
            'textFormat': {'bold': True, 'fontSize': 10},
            'backgroundColor': {'red': 0.2, 'green': 0.6, 'blue': 0.2},
            'horizontalAlignment': 'CENTER'
        })
        worksheet2.freeze(rows=1)

        # Analytics headers
        headers_analytics = [
            'Metric', 'Value', 'Target', 'Status', 'Last Updated'
        ]
        worksheet3.update('A1:E1', [headers_analytics])
        worksheet3.format('A1:E1', {
            'textFormat': {'bold': True, 'fontSize': 10},
            'backgroundColor': {'red': 0.8, 'green': 0.4, 'blue': 0.2},
            'horizontalAlignment': 'CENTER'
        })

        # Add initial analytics rows
        analytics_metrics = [
            ['Total Leads Scraped', '0', '1000', 'Pending', datetime.now().strftime('%Y-%m-%d')],
            ['Qualified Leads', '0', '100', 'Pending', datetime.now().strftime('%Y-%m-%d')],
            ['Emails Sent', '0', '500', 'Pending', datetime.now().strftime('%Y-%m-%d')],
            ['Responses Received', '0', '50', 'Pending', datetime.now().strftime('%Y-%m-%d')],
            ['Conversion Rate', '0%', '10%', 'Pending', datetime.now().strftime('%Y-%m-%d')]
        ]
        worksheet3.update('A2:E6', analytics_metrics)

        print("✅ Headers configured and formatted")
    except Exception as e:
        print(f"❌ Failed to configure headers: {e}")
        return False

    # Save to .env
    print("\n" + "=" * 70)
    print("CONFIGURATION COMPLETE")
    print("=" * 70)
    print(f"\nSheet URL: {sheet_url}")
    print(f"Sheet ID: {sheet_id}")

    try:
        # Check if ID already in .env
        env_path = '/Users/mac/Desktop/Alpha-Medical/.env'
        existing_content = ''
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                existing_content = f.read()

        if sheet_id not in existing_content:
            with open(env_path, 'a') as f:
                f.write(f"\n# Google Sheets Lead Management (configured {datetime.now().strftime('%Y-%m-%d %H:%M')})\n")
                f.write(f"GOOGLE_SHEET_ID={sheet_id}\n")
            print("\n✅ Sheet ID saved to .env file")
        else:
            print("\n✅ Sheet ID already in .env file")
    except Exception as e:
        print(f"\n⚠️  Could not save to .env: {e}")
        print(f"   Manual command: echo 'GOOGLE_SHEET_ID={sheet_id}' >> .env")

    print("\n✅ READY FOR AUTOMATION!")
    print("\nNext steps:")
    print("1. Run lead scraping: python3 market-analysis/lead_generation_scraper.py")
    print("2. Setup cron job for daily automation")
    print("3. Setup Gmail Apps Script for email automation")

    return True

if __name__ == '__main__':
    import os

    if len(sys.argv) < 2:
        print("=" * 70)
        print("USAGE: python3 configure_existing_sheet.py <SHEET_ID>")
        print("=" * 70)
        print("\nSTEPS TO GET SHEET ID:")
        print("\n1. Open: https://sheets.google.com")
        print("2. Click: '+ Blank' to create new spreadsheet")
        print("3. Name it: 'Alpha Medical - Lead Management'")
        print("4. Click 'Share' button (top right)")
        print("5. Add email: ecom-317@astute-quarter-476613-h3.iam.gserviceaccount.com")
        print("6. Set role: 'Editor'")
        print("7. Click 'Send'")
        print("8. Copy Sheet ID from URL:")
        print("   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit")
        print("\n9. Run:")
        print("   python3 configure_existing_sheet.py SHEET_ID_HERE")
        print("\n" + "=" * 70)
        sys.exit(1)

    sheet_id = sys.argv[1]
    success = configure_sheet(sheet_id)

    if success:
        print("\n🎉 CONFIGURATION SUCCESSFUL!")
    else:
        print("\n❌ CONFIGURATION FAILED")
        sys.exit(1)
