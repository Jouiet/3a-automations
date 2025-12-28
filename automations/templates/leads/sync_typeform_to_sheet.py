#!/usr/bin/env python3
"""
Typeform to Google Sheets - Daily Sync
Pulls responses from Typeform contest/giveaway form and syncs to Google Sheets

Requirements:
  - typeform (pip install typeform)
  - python-dotenv
  - pandas
  - google-api-python-client

Install: pip install -r requirements.txt

Usage:
  python sync_typeform_to_sheet.py

Environment Variables (in .env):
  - TYPEFORM_API_TOKEN
  - TYPEFORM_FORM_ID
  - GOOGLE_SHEETS_ID
  - GOOGLE_SERVICE_ACCOUNT_FILE

Date: 2025-11-25
"""

import os
import sys
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Try to import required libraries
try:
    import requests
except ImportError:
    print("❌ ERROR: requests library not installed")
    print("📦 Install with: pip install requests")
    sys.exit(1)

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError:
    print("❌ ERROR: google-api-python-client not installed")
    print("📦 Install with: pip install google-api-python-client google-auth")
    sys.exit(1)

# Load environment variables
load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

# Typeform API credentials
TYPEFORM_API_TOKEN = os.getenv('TYPEFORM_API_TOKEN')
TYPEFORM_FORM_ID = os.getenv('TYPEFORM_FORM_ID')

# Google Sheets credentials
GOOGLE_SHEETS_ID = os.getenv('GOOGLE_SHEETS_ID')
SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', '../apify-automation/google-service-account.json')

# Typeform API endpoint
TYPEFORM_API_BASE = 'https://api.typeform.com'

# Output directory for CSV backups
OUTPUT_DIR = 'lead-management/imports'

# ============================================================================
# VALIDATION
# ============================================================================

def validate_config():
    """Validate that all required environment variables are set"""
    missing = []

    if not TYPEFORM_API_TOKEN:
        missing.append('TYPEFORM_API_TOKEN')
    if not TYPEFORM_FORM_ID:
        missing.append('TYPEFORM_FORM_ID')
    if not GOOGLE_SHEETS_ID:
        missing.append('GOOGLE_SHEETS_ID')

    if missing:
        print("❌ ERROR: Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        print("\n📝 Create a .env file with these variables")
        print("   See .env.example for template")
        sys.exit(1)

    print("✅ Configuration validated")

# ============================================================================
# TYPEFORM API
# ============================================================================

def get_typeform_responses(since_hours=24):
    """Fetch Typeform responses from the last X hours"""
    try:
        # Calculate timestamp (since parameter)
        since_time = datetime.now() - timedelta(hours=since_hours)
        since_timestamp = since_time.isoformat() + 'Z'

        print(f"📅 Fetching responses since: {since_time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Make API request
        url = f"{TYPEFORM_API_BASE}/forms/{TYPEFORM_FORM_ID}/responses"
        headers = {
            'Authorization': f'Bearer {TYPEFORM_API_TOKEN}'
        }
        params = {
            'page_size': 1000,  # Max responses per request
            'since': since_timestamp
        }

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()

        data = response.json()
        responses = data.get('items', [])

        print(f"📥 Found {len(responses)} responses from last {since_hours} hours")
        return responses

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            print("❌ ERROR: Invalid Typeform API token")
        elif e.response.status_code == 404:
            print("❌ ERROR: Typeform form not found. Check TYPEFORM_FORM_ID")
        else:
            print(f"❌ ERROR fetching Typeform responses: {e}")
        return []
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return []

def extract_response_data(responses):
    """Extract and structure response data"""
    structured_responses = []

    for response in responses:
        try:
            # Get response metadata
            response_id = response.get('response_id', '')
            submitted_at = response.get('submitted_at', '')
            landed_at = response.get('landed_at', '')

            # Extract answers
            answers = {}
            for answer in response.get('answers', []):
                field_ref = answer.get('field', {}).get('ref', '')
                field_type = answer.get('type', '')

                # Extract value based on type
                if field_type == 'email':
                    answers[field_ref] = answer.get('email', '')
                elif field_type == 'text':
                    answers[field_ref] = answer.get('text', '')
                elif field_type == 'choice':
                    answers[field_ref] = answer.get('choice', {}).get('label', '')
                elif field_type == 'choices':
                    labels = [c.get('label', '') for c in answer.get('choices', {}).get('labels', [])]
                    answers[field_ref] = ', '.join(labels)
                elif field_type == 'phone_number':
                    answers[field_ref] = answer.get('phone_number', '')
                else:
                    # Generic fallback
                    answers[field_ref] = str(answer.get(field_type, ''))

            # Structure according to Google Sheets format
            structured_response = {
                'lead_id': response_id,
                'created_time': submitted_at,
                'source': 'Contest - Typeform',
                'campaign_name': 'Winter Coat Giveaway Nov 2025',
                'ad_name': 'Organic Entry',
                'form_name': 'Contest Entry Form',
                'first_name': answers.get('first_name', ''),
                'last_name': answers.get('last_name', ''),
                'email': answers.get('email', ''),
                'phone': answers.get('phone', ''),
                'city': answers.get('city', answers.get('location', '')),
                'country': 'Canada',
                'interest': answers.get('interest', answers.get('product_interest', '')),
                'budget': answers.get('budget', answers.get('budget_range', ''))
            }

            structured_responses.append(structured_response)

        except Exception as e:
            print(f"⚠️  Error processing response {response.get('response_id', 'unknown')}: {e}")
            continue

    return structured_responses

# ============================================================================
# GOOGLE SHEETS
# ============================================================================

def get_sheets_client():
    """Initialize Google Sheets API client"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        service = build('sheets', 'v4', credentials=credentials)
        return service.spreadsheets()
    except Exception as e:
        print(f"❌ ERROR initializing Google Sheets client: {e}")
        return None

def append_to_sheet(responses):
    """Append responses directly to Google Sheets RAW LEADS tab"""
    if not responses:
        print("⚠️  No responses to append")
        return False

    try:
        sheets = get_sheets_client()
        if not sheets:
            return False

        # Convert to rows format
        rows = []
        for resp in responses:
            row = [
                resp['lead_id'],
                resp['created_time'],
                resp['source'],
                resp['campaign_name'],
                resp['ad_name'],
                resp['first_name'],
                resp['last_name'],
                resp['email'],
                resp['phone'],
                resp['city'],
                resp['interest'],
                resp['budget'],
                '',  # Lead Quality (calculated by formula)
                'New',  # Status
                '',  # Notes
                '',  # Assigned To
                '',  # Last Contact
                ''   # Next Follow-up
            ]
            rows.append(row)

        # Append to RAW LEADS tab
        range_name = 'RAW LEADS!A:R'
        body = {
            'values': rows
        }

        result = sheets.values().append(
            spreadsheetId=GOOGLE_SHEETS_ID,
            range=range_name,
            valueInputOption='USER_ENTERED',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()

        updates = result.get('updates', {})
        rows_added = updates.get('updatedRows', 0)

        print(f"✅ Appended {rows_added} responses to Google Sheets")
        return True

    except Exception as e:
        print(f"❌ ERROR appending to Google Sheets: {e}")
        return False

def export_to_csv_backup(responses):
    """Export responses to CSV as backup"""
    if not responses:
        return None

    try:
        # Create DataFrame
        df = pd.DataFrame(responses)

        # Generate filename with date
        date_str = datetime.now().strftime('%Y-%m-%d')
        filename = f"{OUTPUT_DIR}/typeform-leads-{date_str}.csv"

        # Ensure directory exists
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Export to CSV
        df.to_csv(filename, index=False)

        print(f"💾 CSV backup saved: {filename}")
        return filename

    except Exception as e:
        print(f"⚠️  Error saving CSV backup: {e}")
        return None

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main execution"""
    print("═══════════════════════════════════════")
    print("📝 TYPEFORM → GOOGLE SHEETS SYNC")
    print("═══════════════════════════════════════")
    print()

    # Validate configuration
    validate_config()
    print()

    # Fetch Typeform responses (last 24 hours)
    print("📥 Fetching Typeform responses...")
    responses_raw = get_typeform_responses(since_hours=24)
    print()

    if not responses_raw:
        print("✅ No new responses in the last 24 hours")
        print("═══════════════════════════════════════")
        sys.exit(0)

    # Extract and structure
    print("🔄 Processing responses...")
    responses_structured = extract_response_data(responses_raw)
    print(f"✅ Processed {len(responses_structured)} responses")
    print()

    # Append to Google Sheets
    print("📤 Syncing to Google Sheets...")
    success = append_to_sheet(responses_structured)
    print()

    # Create CSV backup
    print("💾 Creating CSV backup...")
    csv_file = export_to_csv_backup(responses_structured)
    print()

    if success:
        print("═══════════════════════════════════════")
        print("✅ TYPEFORM SYNC COMPLETED")
        print(f"📊 Total responses: {len(responses_structured)}")
        if csv_file:
            print(f"💾 Backup: {csv_file}")
        print()
        print("📋 View Google Sheet:")
        print(f"   https://docs.google.com/spreadsheets/d/{GOOGLE_SHEETS_ID}")
        print("═══════════════════════════════════════")
    else:
        print("❌ Sync failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
