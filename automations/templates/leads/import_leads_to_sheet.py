#!/usr/bin/env python3
"""
Generic Lead Import to Google Sheets
Imports leads from CSV, JSON, or XLSX files directly to Google Sheets

This is a universal import script that can handle various lead sources.

Requirements:
  - pandas
  - google-api-python-client
  - openpyxl (for Excel files)

Install: pip install -r requirements.txt

Usage:
  python import_leads_to_sheet.py <file_path> [source_name]

Examples:
  python import_leads_to_sheet.py imports/leads.csv "Trade Show 2025"
  python import_leads_to_sheet.py imports/partners.xlsx "Partner ABC"
  python import_leads_to_sheet.py imports/data.json "External Source"

Date: 2025-11-25
"""

import os
import sys
import json
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

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

GOOGLE_SHEETS_ID = os.getenv('GOOGLE_SHEETS_ID')
SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', '../apify-automation/google-service-account.json')

# Column mapping - flexible field name recognition
FIELD_MAPPINGS = {
    'email': ['email', 'e-mail', 'email_address', 'mail'],
    'first_name': ['first_name', 'firstname', 'first', 'prenom', 'prénom'],
    'last_name': ['last_name', 'lastname', 'last', 'nom', 'surname'],
    'phone': ['phone', 'phone_number', 'telephone', 'tel', 'mobile'],
    'city': ['city', 'ville', 'location', 'locality'],
    'country': ['country', 'pays', 'nation'],
    'interest': ['interest', 'product_interest', 'interest_product', 'interet', 'intérêt'],
    'budget': ['budget', 'budget_range', 'price_range']
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def find_field_value(row, field_name):
    """Find value for a field using flexible field name matching"""
    possible_names = FIELD_MAPPINGS.get(field_name, [field_name])

    for name in possible_names:
        # Try exact match (case-insensitive)
        for col in row.index:
            if col.lower() == name.lower():
                return row[col]

    return ''

def validate_email(email):
    """Basic email validation"""
    if not email or '@' not in str(email):
        return False
    return True

# ============================================================================
# FILE PARSING
# ============================================================================

def parse_file(file_path):
    """Parse CSV, XLSX, or JSON file"""
    file_ext = os.path.splitext(file_path)[1].lower()

    try:
        if file_ext == '.csv':
            df = pd.read_csv(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif file_ext == '.json':
            with open(file_path, 'r') as f:
                data = json.load(f)
                # Handle both list of dicts and single dict
                if isinstance(data, dict):
                    data = [data]
                df = pd.DataFrame(data)
        else:
            print(f"❌ ERROR: Unsupported file format: {file_ext}")
            print("   Supported formats: .csv, .xlsx, .xls, .json")
            return None

        print(f"✅ Parsed {len(df)} rows from {os.path.basename(file_path)}")
        return df

    except Exception as e:
        print(f"❌ ERROR parsing file: {e}")
        return None

def structure_leads(df, source_name):
    """Structure leads according to Google Sheets format"""
    structured_leads = []
    skipped_count = 0

    for idx, row in df.iterrows():
        try:
            # Extract email (required)
            email = find_field_value(row, 'email')

            if not validate_email(email):
                skipped_count += 1
                continue

            # Build structured lead
            lead = {
                'lead_id': f'IMPORT_{datetime.now().strftime("%Y%m%d")}_{idx+1}',
                'created_time': datetime.now().isoformat(),
                'source': source_name or 'Manual Import',
                'campaign_name': '',
                'ad_name': '',
                'first_name': find_field_value(row, 'first_name'),
                'last_name': find_field_value(row, 'last_name'),
                'email': email,
                'phone': find_field_value(row, 'phone'),
                'city': find_field_value(row, 'city'),
                'interest': find_field_value(row, 'interest'),
                'budget': find_field_value(row, 'budget')
            }

            structured_leads.append(lead)

        except Exception as e:
            print(f"⚠️  Error processing row {idx}: {e}")
            skipped_count += 1
            continue

    if skipped_count > 0:
        print(f"⚠️  Skipped {skipped_count} rows (invalid or missing email)")

    return structured_leads

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

def append_to_sheet(leads):
    """Append leads to Google Sheets RAW LEADS tab"""
    if not leads:
        print("⚠️  No leads to append")
        return False

    try:
        sheets = get_sheets_client()
        if not sheets:
            return False

        # Convert to rows format
        rows = []
        for lead in leads:
            row = [
                lead['lead_id'],
                lead['created_time'],
                lead['source'],
                lead['campaign_name'],
                lead['ad_name'],
                lead['first_name'],
                lead['last_name'],
                lead['email'],
                lead['phone'],
                lead['city'],
                lead['interest'],
                lead['budget'],
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

        print(f"✅ Appended {rows_added} leads to Google Sheets")
        return True

    except Exception as e:
        print(f"❌ ERROR appending to Google Sheets: {e}")
        return False

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main execution"""
    print("═══════════════════════════════════════")
    print("📥 GENERIC LEAD IMPORT TO GOOGLE SHEETS")
    print("═══════════════════════════════════════")
    print()

    # Validate arguments
    if len(sys.argv) < 2:
        print("❌ ERROR: Missing file path argument")
        print()
        print("Usage:")
        print("  python import_leads_to_sheet.py <file_path> [source_name]")
        print()
        print("Examples:")
        print("  python import_leads_to_sheet.py imports/leads.csv \"Trade Show 2025\"")
        print("  python import_leads_to_sheet.py imports/partners.xlsx \"Partner ABC\"")
        sys.exit(1)

    file_path = sys.argv[1]
    source_name = sys.argv[2] if len(sys.argv) > 2 else 'Manual Import'

    # Validate file exists
    if not os.path.exists(file_path):
        print(f"❌ ERROR: File not found: {file_path}")
        sys.exit(1)

    print(f"📄 File: {os.path.basename(file_path)}")
    print(f"📌 Source: {source_name}")
    print()

    # Parse file
    print("🔄 Parsing file...")
    df = parse_file(file_path)
    if df is None:
        sys.exit(1)
    print()

    # Structure leads
    print("🔄 Structuring leads...")
    leads = structure_leads(df, source_name)
    print(f"✅ Structured {len(leads)} valid leads")
    print()

    if not leads:
        print("❌ No valid leads found")
        sys.exit(1)

    # Append to Google Sheets
    print("📤 Uploading to Google Sheets...")
    success = append_to_sheet(leads)
    print()

    if success:
        print("═══════════════════════════════════════")
        print("✅ IMPORT COMPLETED")
        print(f"📊 Total leads imported: {len(leads)}")
        print()
        print("📋 View Google Sheet:")
        print(f"   https://docs.google.com/spreadsheets/d/{GOOGLE_SHEETS_ID}")
        print()
        print("📌 Next step:")
        print("   Run segmentation: node segment-leads.js")
        print("═══════════════════════════════════════")
    else:
        print("❌ Import failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
