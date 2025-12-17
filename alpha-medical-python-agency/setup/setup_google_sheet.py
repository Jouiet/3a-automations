# Type: agency
# Category: setup
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Setup Google Sheet for Lead Management System
Uses existing service account credentials to create spreadsheet
"""

import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json
from datetime import datetime

# Credentials file path
CREDENTIALS_FILE = '/Users/mac/Desktop/Alpha-Medical/google_credentials.json'

def setup_google_sheet():
    """Create Google Sheet with proper structure for lead management"""

    print("=" * 70)
    print("ALPHA MEDICAL - GOOGLE SHEET SETUP")
    print("=" * 70)

    # Step 1: Authenticate
    print("\n[1/5] Authenticating with Google Sheets API...")
    try:
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            CREDENTIALS_FILE, scope
        )
        client = gspread.authorize(creds)
        print("✅ Authentication successful")

        # Get service account email
        with open(CREDENTIALS_FILE, 'r') as f:
            creds_data = json.load(f)
            service_email = creds_data['client_email']
            print(f"   Service Account: {service_email}")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return None

    # Step 2: Create spreadsheet
    print("\n[2/5] Creating Google Sheet: 'Alpha Medical - Lead Management'...")
    try:
        spreadsheet = client.create('Alpha Medical - Lead Management')
        sheet_id = spreadsheet.id
        sheet_url = spreadsheet.url
        print(f"✅ Spreadsheet created")
        print(f"   ID: {sheet_id}")
        print(f"   URL: {sheet_url}")
    except Exception as e:
        print(f"❌ Failed to create spreadsheet: {e}")
        print(f"\n   This may be due to Google Drive API restrictions on project:")
        print(f"   astute-quarter-476613-h3")
        return None

    # Step 3: Setup worksheets
    print("\n[3/5] Setting up worksheets...")
    try:
        # Rename first sheet to "Raw Leads"
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
        print(f"❌ Failed to setup worksheets: {e}")
        return None

    # Step 4: Add headers to Raw Leads
    print("\n[4/5] Adding headers to 'Raw Leads' worksheet...")
    try:
        headers_raw = [
            'Lead ID', 'Date Scraped', 'Business Name', 'Email', 'Phone',
            'Website', 'Address', 'City', 'State', 'Zip', 'Rating',
            'Reviews Count', 'Category', 'Source', 'Status', 'Notes',
            'Last Contact', 'Next Follow-Up'
        ]
        worksheet1.update('A1:R1', [headers_raw])

        # Format headers
        worksheet1.format('A1:R1', {
            'textFormat': {'bold': True},
            'backgroundColor': {'red': 0.2, 'green': 0.4, 'blue': 0.8}
        })
        print("✅ Headers added and formatted")
    except Exception as e:
        print(f"❌ Failed to add headers: {e}")

    # Step 5: Add headers to Qualified Leads
    print("\n[5/5] Adding headers to 'Qualified Leads' worksheet...")
    try:
        headers_qualified = [
            'Lead ID', 'Business Name', 'Email', 'Phone', 'Decision Maker',
            'Estimated Size', 'Current Supplier', 'Pain Points', 'Qualification Score',
            'Stage', 'Assigned To', 'Last Contact', 'Next Action', 'Notes',
            'Conversion Probability', 'Expected Deal Value'
        ]
        worksheet2.update('A1:P1', [headers_qualified])

        # Format headers
        worksheet2.format('A1:P1', {
            'textFormat': {'bold': True},
            'backgroundColor': {'red': 0.2, 'green': 0.6, 'blue': 0.2}
        })
        print("✅ Headers added and formatted")
    except Exception as e:
        print(f"❌ Failed to add headers: {e}")

    # Final summary
    print("\n" + "=" * 70)
    print("SETUP COMPLETE")
    print("=" * 70)
    print(f"\nGoogle Sheet URL: {sheet_url}")
    print(f"Sheet ID: {sheet_id}")
    print(f"\nIMPORTANT: Share this sheet with your email to access it:")
    print(f"   1. Open: {sheet_url}")
    print(f"   2. Click 'Share' button")
    print(f"   3. Add: contact@alphamedical.shop (Editor)")
    print(f"\nTo save Sheet ID to .env file:")
    print(f'   echo "GOOGLE_SHEET_ID={sheet_id}" >> .env')

    return {
        'sheet_id': sheet_id,
        'sheet_url': sheet_url,
        'service_account': service_email
    }

if __name__ == '__main__':
    result = setup_google_sheet()

    if result:
        # Save to .env file automatically
        print("\n[AUTO] Saving Sheet ID to .env file...")
        try:
            with open('/Users/mac/Desktop/Alpha-Medical/.env', 'a') as f:
                f.write(f"\n# Google Sheets Lead Management (created {datetime.now().strftime('%Y-%m-%d %H:%M')})\n")
                f.write(f"GOOGLE_SHEET_ID={result['sheet_id']}\n")
            print("✅ Sheet ID saved to .env")
        except Exception as e:
            print(f"⚠️  Could not auto-save to .env: {e}")
            print(f"   Manual command: echo 'GOOGLE_SHEET_ID={result['sheet_id']}' >> .env")
    else:
        print("\n❌ SETUP FAILED")
        print("\nPossible causes:")
        print("   1. Google Drive API not enabled on project astute-quarter-476613-h3")
        print("   2. Service account lacks permissions to create files")
        print("   3. Project has organizational policy restrictions")
        print("\nNext steps:")
        print("   1. Try enabling Google Drive API on the original project")
        print("   2. OR create new service account on 'My Project 66669'")
        print("   3. OR use personal Google account OAuth flow instead")
