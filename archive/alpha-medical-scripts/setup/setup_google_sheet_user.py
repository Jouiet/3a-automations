# Type: agency
# Category: setup
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Setup Google Sheet using USER OAuth2 (not service account)
This bypasses service account storage quota issues
"""

import gspread
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle
import os.path
from datetime import datetime

# OAuth2 scopes
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
]

def get_user_credentials():
    """Get OAuth2 credentials from user (interactive browser login)"""
    creds = None

    # Check if we have saved credentials
    if os.path.exists('/Users/mac/Desktop/Alpha-Medical/token.pickle'):
        print("Found saved credentials...")
        with open('/Users/mac/Desktop/Alpha-Medical/token.pickle', 'rb') as token:
            creds = pickle.load(token)

    # If no valid credentials, let user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired credentials...")
            creds.refresh(Request())
        else:
            print("\n" + "=" * 70)
            print("OAUTH2 USER LOGIN REQUIRED")
            print("=" * 70)
            print("\nYou need to create OAuth2 credentials:")
            print("\n1. Go to: https://console.cloud.google.com/apis/credentials?project=my-project-66669")
            print("2. Click 'CREATE CREDENTIALS' > 'OAuth client ID'")
            print("3. Application type: 'Desktop app'")
            print("4. Name: 'Lead Management Script'")
            print("5. Click 'CREATE'")
            print("6. Click 'DOWNLOAD JSON'")
            print("7. Save as: /Users/mac/Desktop/Alpha-Medical/oauth_credentials.json")
            print("\nThen run this script again.")
            return None

        # Save credentials for next time
        with open('/Users/mac/Desktop/Alpha-Medical/token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return creds

def setup_google_sheet_with_user_auth():
    """Create Google Sheet using user OAuth2 credentials"""

    print("=" * 70)
    print("ALPHA MEDICAL - GOOGLE SHEET SETUP (USER AUTH)")
    print("=" * 70)

    # Step 1: Get user credentials
    print("\n[1/5] Getting user credentials...")

    # Check if OAuth credentials file exists
    if not os.path.exists('/Users/mac/Desktop/Alpha-Medical/oauth_credentials.json'):
        print("❌ OAuth credentials file not found")
        print("\nPlease create OAuth2 credentials:")
        print("1. Visit: https://console.cloud.google.com/apis/credentials?project=my-project-66669")
        print("2. Click 'CREATE CREDENTIALS' > 'OAuth client ID'")
        print("3. Application type: 'Desktop app'")
        print("4. Name: 'Lead Management Script'")
        print("5. Download JSON and save as:")
        print("   /Users/mac/Desktop/Alpha-Medical/oauth_credentials.json")
        return None

    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            '/Users/mac/Desktop/Alpha-Medical/oauth_credentials.json',
            SCOPES
        )
        creds = flow.run_local_server(port=0)

        # Save credentials
        with open('/Users/mac/Desktop/Alpha-Medical/token.pickle', 'wb') as token:
            pickle.dump(creds, token)

        print("✅ User authenticated successfully")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return None

    # Step 2: Create spreadsheet
    print("\n[2/5] Creating Google Sheet...")
    try:
        client = gspread.authorize(creds)
        spreadsheet = client.create('Alpha Medical - Lead Management')
        sheet_id = spreadsheet.id
        sheet_url = spreadsheet.url
        print(f"✅ Spreadsheet created in YOUR Google Drive")
        print(f"   URL: {sheet_url}")
    except Exception as e:
        print(f"❌ Failed to create spreadsheet: {e}")
        return None

    # Step 3: Setup worksheets
    print("\n[3/5] Setting up worksheets...")
    try:
        worksheet1 = spreadsheet.sheet1
        worksheet1.update_title('Raw Leads')
        worksheet2 = spreadsheet.add_worksheet(title='Qualified Leads', rows=1000, cols=20)
        worksheet3 = spreadsheet.add_worksheet(title='Analytics', rows=100, cols=15)
        print("✅ Created 3 worksheets")
    except Exception as e:
        print(f"❌ Failed to setup worksheets: {e}")

    # Step 4: Add headers
    print("\n[4/5] Adding headers...")
    try:
        headers_raw = [
            'Lead ID', 'Date Scraped', 'Business Name', 'Email', 'Phone',
            'Website', 'Address', 'City', 'State', 'Zip', 'Rating',
            'Reviews Count', 'Category', 'Source', 'Status', 'Notes',
            'Last Contact', 'Next Follow-Up'
        ]
        worksheet1.update('A1:R1', [headers_raw])
        worksheet1.format('A1:R1', {
            'textFormat': {'bold': True},
            'backgroundColor': {'red': 0.2, 'green': 0.4, 'blue': 0.8}
        })

        headers_qualified = [
            'Lead ID', 'Business Name', 'Email', 'Phone', 'Decision Maker',
            'Estimated Size', 'Current Supplier', 'Pain Points', 'Qualification Score',
            'Stage', 'Assigned To', 'Last Contact', 'Next Action', 'Notes',
            'Conversion Probability', 'Expected Deal Value'
        ]
        worksheet2.update('A1:P1', [headers_qualified])
        worksheet2.format('A1:P1', {
            'textFormat': {'bold': True},
            'backgroundColor': {'red': 0.2, 'green': 0.6, 'blue': 0.2}
        })
        print("✅ Headers configured")
    except Exception as e:
        print(f"❌ Failed to add headers: {e}")

    # Step 5: Share with service account for automation
    print("\n[5/5] Sharing with service account for automation...")
    try:
        service_account_email = 'ecom-317@astute-quarter-476613-h3.iam.gserviceaccount.com'
        spreadsheet.share(service_account_email, perm_type='user', role='writer')
        print(f"✅ Shared with: {service_account_email}")
        print("   This allows automation scripts to write data")
    except Exception as e:
        print(f"⚠️  Could not auto-share: {e}")
        print(f"   Manual step: Share sheet with {service_account_email}")

    # Save configuration
    print("\n" + "=" * 70)
    print("SETUP COMPLETE")
    print("=" * 70)
    print(f"\nGoogle Sheet: {sheet_url}")
    print(f"Sheet ID: {sheet_id}")

    # Auto-save to .env
    try:
        with open('/Users/mac/Desktop/Alpha-Medical/.env', 'a') as f:
            f.write(f"\n# Google Sheets Lead Management (created {datetime.now().strftime('%Y-%m-%d %H:%M')})\n")
            f.write(f"GOOGLE_SHEET_ID={sheet_id}\n")
        print(f"\n✅ Sheet ID saved to .env file")
    except Exception as e:
        print(f"\n⚠️  Could not save to .env: {e}")

    return {'sheet_id': sheet_id, 'sheet_url': sheet_url}

if __name__ == '__main__':
    setup_google_sheet_with_user_auth()
