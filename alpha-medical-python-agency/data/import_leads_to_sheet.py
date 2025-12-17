# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
IMPORT EXTERNAL LEADS (XLSX/CSV/JSON) TO GOOGLE SHEETS
Import fichiers externes fournis par user → Google Sheet centralisé

Usage:
    python3 import_leads_to_sheet.py leads_file.xlsx
    python3 import_leads_to_sheet.py leads_file.csv
    python3 import_leads_to_sheet.py leads_file.json

Features:
- Supports xlsx, csv, json, and jsonl formats
- Auto-detects columns (flexible mapping)
- Validates email format
- Removes duplicates
- Adds source tag: "import_externe"
- Syncs to Google Sheet "Raw Leads"

Requirements:
    pip install pandas openpyxl gspread oauth2client

Setup:
    1. Google Sheet exists: "Alpha Medical - Lead Management"
    2. Service account has Editor access
    3. Credentials: google_credentials.json (in project root or market-analysis/)
"""

import pandas as pd
import sys
import re
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
from pathlib import Path

# Configuration
CREDENTIALS_FILE = Path(__file__).parent / "google_credentials.json"
if not CREDENTIALS_FILE.exists():
    CREDENTIALS_FILE = Path(__file__).parent / "market-analysis" / "google_credentials.json"

SHEET_NAME = "Alpha Medical - Lead Management"
WORKSHEET_NAME = "Raw Leads"

def validate_email(email):
    """Validate email format"""
    if not email or pd.isna(email):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, str(email)))

def validate_phone(phone):
    """Validate and format US phone number"""
    if not phone or pd.isna(phone):
        return ''
    # Remove all non-digits
    digits = re.sub(r'\D', '', str(phone))
    # US phone: 10 digits
    if len(digits) == 10:
        return f"+1{digits}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"+{digits}"
    else:
        return ''  # Invalid

def detect_columns(df):
    """Auto-detect column mapping (flexible)"""
    columns = df.columns.str.lower()

    mapping = {
        'name': None,
        'email': None,
        'phone': None,
        'location': None,
        'source': None,
        'notes': None
    }

    # Detect name column
    name_patterns = ['name', 'full name', 'fullname', 'nom', 'contact name']
    for pattern in name_patterns:
        matches = [col for col in columns if pattern in col]
        if matches:
            mapping['name'] = matches[0]
            break

    # Detect email column
    email_patterns = ['email', 'e-mail', 'mail', 'courriel']
    for pattern in email_patterns:
        matches = [col for col in columns if pattern in col]
        if matches:
            mapping['email'] = matches[0]
            break

    # Detect phone column
    phone_patterns = ['phone', 'telephone', 'tel', 'mobile', 'cell']
    for pattern in phone_patterns:
        matches = [col for col in columns if pattern in col]
        if matches:
            mapping['phone'] = matches[0]
            break

    # Detect location column
    location_patterns = ['location', 'address', 'city', 'state', 'zip', 'adresse', 'ville']
    for pattern in location_patterns:
        matches = [col for col in columns if pattern in col]
        if matches:
            mapping['location'] = matches[0]
            break

    # Detect source column
    source_patterns = ['source', 'origin', 'origine', 'provenance']
    for pattern in source_patterns:
        matches = [col for col in columns if pattern in col]
        if matches:
            mapping['source'] = matches[0]
            break

    # Detect notes/comments column
    notes_patterns = ['notes', 'comments', 'remarks', 'commentaires']
    for pattern in notes_patterns:
        matches = [col for col in columns if pattern in col]
        if matches:
            mapping['notes'] = matches[0]
            break

    return mapping

def import_leads(file_path):
    """Import leads from xlsx/csv to Google Sheet"""

    # Check file exists
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"❌ ERROR: File not found: {file_path}")
        return False

    # Check credentials exist
    if not CREDENTIALS_FILE.exists():
        print(f"❌ ERROR: Credentials file not found: {CREDENTIALS_FILE}")
        print(f"   Please ensure google_credentials.json exists in project root or market-analysis/")
        return False

    # Load file
    print(f"📂 Loading file: {file_path}")
    try:
        if file_path.suffix.lower() in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif file_path.suffix.lower() == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix.lower() == '.json':
            # Try to read as JSON (array of objects or JSON Lines)
            try:
                df = pd.read_json(file_path, orient='records')
            except ValueError:
                # Try JSON Lines format (one JSON object per line)
                df = pd.read_json(file_path, lines=True)
        elif file_path.suffix.lower() == '.jsonl':
            # JSON Lines format
            df = pd.read_json(file_path, lines=True)
        else:
            print(f"❌ ERROR: Unsupported file format: {file_path.suffix}")
            print(f"   Supported formats: .xlsx, .xls, .csv, .json, .jsonl")
            return False

        print(f"✅ Loaded {len(df)} rows from {file_path.name}")
        print(f"   Columns detected: {list(df.columns)}")
    except Exception as e:
        print(f"❌ ERROR loading file: {e}")
        return False

    # Auto-detect columns
    mapping = detect_columns(df)
    print(f"\n📋 Column mapping:")
    for key, col in mapping.items():
        if col:
            print(f"   {key}: '{col}'")
        else:
            print(f"   {key}: NOT FOUND")

    # Validate required columns
    if not mapping['email']:
        print(f"\n❌ ERROR: Email column not found")
        print(f"   Please ensure your file has a column named 'email', 'Email', or similar")
        return False

    # Process leads
    print(f"\n🔄 Processing leads...")
    processed_leads = []
    skipped = {'no_email': 0, 'invalid_email': 0, 'duplicate': 0}
    emails_seen = set()

    for idx, row in df.iterrows():
        # Extract email
        email = row[mapping['email']] if mapping['email'] else None

        # Skip if no email
        if not email or pd.isna(email):
            skipped['no_email'] += 1
            continue

        email = str(email).strip().lower()

        # Validate email
        if not validate_email(email):
            skipped['invalid_email'] += 1
            print(f"   ⚠️  Row {idx+2}: Invalid email '{email}'")
            continue

        # Skip duplicates (within file)
        if email in emails_seen:
            skipped['duplicate'] += 1
            continue
        emails_seen.add(email)

        # Extract other fields
        name = str(row[mapping['name']]) if mapping['name'] and not pd.isna(row[mapping['name']]) else ''
        phone_raw = row[mapping['phone']] if mapping['phone'] else None
        phone = validate_phone(phone_raw)
        location = str(row[mapping['location']]) if mapping['location'] and not pd.isna(row[mapping['location']]) else ''
        source_original = str(row[mapping['source']]) if mapping['source'] and not pd.isna(row[mapping['source']]) else ''
        notes = str(row[mapping['notes']]) if mapping['notes'] and not pd.isna(row[mapping['notes']]) else ''

        # Prepare lead data
        lead = {
            'timestamp': datetime.now().isoformat(),
            'platform': 'import_externe',
            'type': 'import',
            'name': name,
            'email': email,
            'phone': phone,
            'location': location,
            'source_original': source_original,
            'notes': notes,
            'file_name': file_path.name,
            'quality_score': 7.0 if name and (phone or location) else 5.0,  # Basic scoring
            'status': 'new'
        }

        processed_leads.append(lead)
        print(f"   [{idx+1}/{len(df)}] ✅ {name or email[:20]} (score: {lead['quality_score']})")

    # Summary of processing
    print(f"\n📊 Processing Summary:")
    print(f"   Total rows: {len(df)}")
    print(f"   ✅ Valid leads: {len(processed_leads)}")
    print(f"   ⚠️  Skipped (no email): {skipped['no_email']}")
    print(f"   ⚠️  Skipped (invalid email): {skipped['invalid_email']}")
    print(f"   ⚠️  Skipped (duplicates): {skipped['duplicate']}")

    if len(processed_leads) == 0:
        print(f"\n❌ No valid leads to import")
        return False

    # Authenticate with Google Sheets
    print(f"\n🔐 Authenticating with Google Sheets...")
    try:
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]
        creds = ServiceAccountCredentials.from_json_keyfile_name(str(CREDENTIALS_FILE), scope)
        client = gspread.authorize(creds)
        print(f"✅ Authenticated with Google Sheets API")
    except Exception as e:
        print(f"❌ ERROR authenticating: {e}")
        return False

    # Open the sheet
    print(f"📋 Opening Google Sheet: {SHEET_NAME}...")
    try:
        spreadsheet = client.open(SHEET_NAME)
        worksheet = spreadsheet.worksheet(WORKSHEET_NAME)
        print(f"✅ Opened worksheet: {WORKSHEET_NAME}")
    except gspread.exceptions.SpreadsheetNotFound:
        print(f"❌ ERROR: Spreadsheet '{SHEET_NAME}' not found")
        print(f"   Sheet should exist at: https://docs.google.com/spreadsheets/d/1KyE_H8OPLLJfgRjehNZLS_RcMJToHRQ9gny1Sgoa_JE")
        return False
    except Exception as e:
        print(f"❌ ERROR opening sheet: {e}")
        return False

    # Sync to Google Sheet
    print(f"\n📤 Syncing {len(processed_leads)} leads to Google Sheet...")
    synced_count = 0
    errors = []

    for i, lead in enumerate(processed_leads, 1):
        try:
            # Prepare row (match "Raw Leads" structure)
            row = [
                lead['timestamp'],           # A: Timestamp
                lead['platform'],            # B: Platform (import_externe)
                lead['type'],                # C: Type (import)
                lead['name'],                # D: Name
                lead['email'],               # E: Email (primary contact)
                lead['phone'],               # F: Phone
                lead['location'],            # G: Location
                '',                          # H: Engagement (N/A for imports)
                '',                          # I: Rating (N/A for imports)
                '',                          # J: Review Count (N/A for imports)
                lead['quality_score'],       # K: Quality Score
                '',                          # L: Persona Match (will be added by segmentation script)
                '',                          # M: Lead URL (N/A for imports)
                lead['source_original'],     # N: Source Original
                lead['file_name'],           # O: File Name
                lead['notes'],               # P: Notes
                lead['status']               # Q: Status (new)
            ]

            # Append to sheet
            worksheet.append_row(row, value_input_option='USER_ENTERED')
            synced_count += 1
            print(f"   [{i}/{len(processed_leads)}] ✅ {lead['name'] or lead['email'][:30]}")

        except Exception as e:
            error_msg = f"Row {i}: {lead['email']} - {str(e)}"
            errors.append(error_msg)
            print(f"   [{i}/{len(processed_leads)}] ❌ Error: {error_msg}")

    # Final summary
    print("\n" + "="*80)
    print(f"IMPORT COMPLETE")
    print("="*80)
    print(f"✅ Successfully imported: {synced_count}/{len(processed_leads)} leads")
    print(f"📋 Google Sheet: {SHEET_NAME} → {WORKSHEET_NAME}")
    if errors:
        print(f"❌ Errors: {len(errors)}")
        for error in errors[:3]:
            print(f"   - {error}")

    print(f"\n📊 Next Steps:")
    print(f"   1. Open Google Sheet: https://docs.google.com/spreadsheets/d/1KyE_H8OPLLJfgRjehNZLS_RcMJToHRQ9gny1Sgoa_JE")
    print(f"   2. Check 'Raw Leads' tab for imported data")
    print(f"   3. Run clean_and_segment_leads.py to process into 'Qualified Leads'")

    return synced_count > 0

def main():
    print("="*80)
    print("IMPORT EXTERNAL LEADS TO GOOGLE SHEET")
    print("="*80)

    if len(sys.argv) < 2:
        print("\n❌ Usage: python3 import_leads_to_sheet.py <file.xlsx|file.csv>")
        print("\nExamples:")
        print("  python3 import_leads_to_sheet.py my_leads.xlsx")
        print("  python3 import_leads_to_sheet.py customer_list.csv")
        print("\nSupported formats: .xlsx, .xls, .csv")
        print("\nRequired columns (flexible names):")
        print("  - email (REQUIRED)")
        print("  - name (optional)")
        print("  - phone (optional)")
        print("  - location/address/city (optional)")
        print("  - source (optional)")
        print("  - notes (optional)")
        sys.exit(1)

    file_path = sys.argv[1]

    success = import_leads(file_path)

    if success:
        print("\n🎉 Import successful! Leads synced to Google Sheet.")
        sys.exit(0)
    else:
        print("\n⚠️  Import failed or completed with errors")
        sys.exit(1)

if __name__ == "__main__":
    main()
