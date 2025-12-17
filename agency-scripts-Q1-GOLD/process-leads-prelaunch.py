#!/usr/bin/env python3
"""
HENDERSON SHOP - PRE-LAUNCH LEAD PROCESSING AUTOMATION
Purpose: Process B2C customer leads from Contest/Giveaway, Facebook Lead Ads, and manual imports
Cost: $0 (Python + GitHub Actions)
Sources: 3 (Contest, Facebook, Import Staging)
"""

import os
import re
import hashlib
from datetime import datetime
from typing import List, Dict, Optional
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import shopify

# =====================================================
# CONFIGURATION
# =====================================================

SHOPIFY_STORE = os.getenv('SHOPIFY_STORE', 'jqp1x4-7e.myshopify.com')
SHOPIFY_ACCESS_TOKEN = os.getenv('SHOPIFY_ACCESS_TOKEN')
SHOPIFY_API_VERSION = '2024-10'

GOOGLE_SHEET_NAME = "Henderson PRE-LAUNCH Leads 2025"
GOOGLE_CREDS_PATH = os.getenv('GOOGLE_CREDS_PATH', '.credentials/google-sheets-service-account.json')

# Lead scoring thresholds
SCORE_A_MIN_FIELDS = 6  # Email + Name + Phone + Location + Motorcycle + Why
SCORE_B_MIN_FIELDS = 4  # Email + Name + Motorcycle Type
SCORE_C_MIN_FIELDS = 2  # Email + Name only

# Motorcycle type to persona mapping
PERSONA_MAP = {
    'Sport bike': 'Sport Rider',
    'Cruiser': 'Cruiser Enthusiast',
    'Adventure': 'Adventure Seeker',
    'Street bike': 'Urban Commuter',
    'Touring': 'Long Distance Rider',
    'Planning to buy': 'Prospective Rider'
}

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

def get_worksheet(client, sheet_name: str, worksheet_name: str):
    """Get specific worksheet from Google Sheet"""
    try:
        sheet = client.open(sheet_name)
        worksheet = sheet.worksheet(worksheet_name)
        return worksheet
    except gspread.exceptions.WorksheetNotFound:
        print(f"⚠️ Worksheet '{worksheet_name}' not found. Creating...")
        sheet = client.open(sheet_name)
        worksheet = sheet.add_worksheet(title=worksheet_name, rows=1000, cols=20)
        return worksheet

# =====================================================
# SHOPIFY CLIENT
# =====================================================

def init_shopify():
    """Initialize Shopify API session"""
    shop_url = f"https://{SHOPIFY_STORE}/admin/api/{SHOPIFY_API_VERSION}"
    shopify.ShopifyResource.set_site(shop_url)
    shopify.ShopifyResource.headers = {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    }

# =====================================================
# DATA CLEANING & VALIDATION
# =====================================================

def clean_email(email: str) -> Optional[str]:
    """Validate and clean email address"""
    if not email or not isinstance(email, str):
        return None

    email = email.strip().lower()

    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return None

    # Block B2B business emails (common patterns)
    b2b_patterns = ['info@', 'contact@', 'sales@', 'support@', 'admin@', 'service@']
    if any(email.startswith(pattern) for pattern in b2b_patterns):
        return None

    return email

def clean_name(name: str) -> str:
    """Capitalize and clean name"""
    if not name or not isinstance(name, str):
        return ""
    return name.strip().title()

def clean_phone(phone: str) -> str:
    """Clean phone number (digits only)"""
    if not phone or not isinstance(phone, str):
        return ""
    return re.sub(r'\D', '', phone.strip())

def generate_lead_id(email: str, source: str) -> str:
    """Generate unique lead ID from email + source"""
    hash_input = f"{email.lower()}_{source}".encode('utf-8')
    return hashlib.md5(hash_input).hexdigest()[:12].upper()

# =====================================================
# LEAD SCORING
# =====================================================

def calculate_lead_score(lead: Dict) -> str:
    """Calculate lead score A/B/C based on data completeness"""
    field_count = sum([
        bool(lead.get('email')),
        bool(lead.get('first_name')),
        bool(lead.get('last_name')),
        bool(lead.get('phone')),
        bool(lead.get('location')),
        bool(lead.get('motorcycle_type')),
        bool(lead.get('why_ride'))
    ])

    if field_count >= SCORE_A_MIN_FIELDS:
        return 'A'
    elif field_count >= SCORE_B_MIN_FIELDS:
        return 'B'
    else:
        return 'C'

def detect_persona(motorcycle_type: str) -> str:
    """Map motorcycle type to rider persona"""
    if not motorcycle_type:
        return 'Unknown'

    for bike_type, persona in PERSONA_MAP.items():
        if bike_type.lower() in motorcycle_type.lower():
            return persona

    return 'General Rider'

# =====================================================
# LEAD PROCESSING FUNCTIONS
# =====================================================

def process_contest_leads(client) -> List[Dict]:
    """Process Contest/Giveaway entries from Google Forms"""
    worksheet = get_worksheet(client, GOOGLE_SHEET_NAME, "Contest Giveaway Entries")
    records = worksheet.get_all_records()

    processed = []
    for row in records:
        # Skip if already processed
        if row.get('Processed') == 'YES':
            continue

        # Use actual Google Form column names
        email = clean_email(row.get("What's your email address?", ""))
        if not email:
            continue  # Skip invalid emails

        # Parse full name into first/last
        full_name = row.get("What's your full name?", "")
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0] if len(name_parts) > 0 else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        lead = {
            'lead_id': generate_lead_id(email, 'contest'),
            'source': 'Contest PRE-LAUNCH',
            'date_collected': row.get('Horodateur', datetime.now().strftime('%Y-%m-%d')),
            'email': email,
            'first_name': clean_name(first_name),
            'last_name': clean_name(last_name),
            'phone': clean_phone(row.get('Phone number (optional)', '')),
            'location': row.get('City and State', ''),
            'motorcycle_type': row.get('What type of motorcycle do you ride?', ''),
            'why_ride': row.get('What do you love most about riding?', ''),
            'marketing_consent': 'Yes' if row.get('Contest Terms & Marketing') else 'No'
        }

        # Score and persona
        lead['lead_score'] = calculate_lead_score(lead)
        lead['persona'] = detect_persona(lead['motorcycle_type'])

        processed.append(lead)

    print(f"✅ Contest: {len(processed)} new leads processed")
    return processed

def process_facebook_leads(client) -> List[Dict]:
    """Process Facebook Lead Ads entries"""
    worksheet = get_worksheet(client, GOOGLE_SHEET_NAME, "Facebook Lead Ads")
    records = worksheet.get_all_records()

    processed = []
    for row in records:
        # Skip if already processed
        if row.get('Processed') == 'YES':
            continue

        email = clean_email(row.get('Email'))
        if not email:
            continue

        lead = {
            'lead_id': generate_lead_id(email, 'facebook'),
            'source': 'Facebook Lead Ads',
            'date_collected': row.get('Created Time', datetime.now().strftime('%Y-%m-%d')),
            'email': email,
            'first_name': clean_name(row.get('First Name', '')),
            'last_name': clean_name(row.get('Last Name', '')),
            'phone': clean_phone(row.get('Phone', '')),
            'location': '',
            'motorcycle_type': row.get('Motorcycle Type', ''),
            'why_ride': '',
            'marketing_consent': 'Yes'  # Facebook Lead Ads are opt-in
        }

        lead['lead_score'] = calculate_lead_score(lead)
        lead['persona'] = detect_persona(lead['motorcycle_type'])

        processed.append(lead)

    print(f"✅ Facebook: {len(processed)} new leads processed")
    return processed

def process_manual_imports(client) -> List[Dict]:
    """Process manually imported lead files"""
    worksheet = get_worksheet(client, GOOGLE_SHEET_NAME, "Import Staging")
    records = worksheet.get_all_records()

    processed = []
    for row in records:
        email = clean_email(row.get('Email'))
        if not email:
            continue

        lead = {
            'lead_id': generate_lead_id(email, 'import'),
            'source': row.get('Source', 'Manual Import'),
            'date_collected': datetime.now().strftime('%Y-%m-%d'),
            'email': email,
            'first_name': clean_name(row.get('First Name', '')),
            'last_name': clean_name(row.get('Last Name', '')),
            'phone': clean_phone(row.get('Phone', '')),
            'location': row.get('Location', ''),
            'motorcycle_type': row.get('Motorcycle Type', ''),
            'why_ride': '',
            'marketing_consent': 'Yes'
        }

        lead['lead_score'] = calculate_lead_score(lead)
        lead['persona'] = detect_persona(lead['motorcycle_type'])

        processed.append(lead)

    # Clear staging area after processing
    if processed:
        worksheet.clear()
        worksheet.update('A1:P1', [[
            'Email', 'First Name', 'Last Name', 'Phone', 'Location',
            'Motorcycle Type', 'Source', 'Notes'
        ]])

    print(f"✅ Manual Import: {len(processed)} new leads processed")
    return processed

# =====================================================
# DEDUPLICATION
# =====================================================

def deduplicate_leads(all_leads: List[Dict], existing_emails: set) -> List[Dict]:
    """Remove duplicate emails (prefer newer/higher scored leads)"""
    unique_leads = {}

    for lead in all_leads:
        email = lead['email']

        # Skip if already in master database
        if email in existing_emails:
            continue

        # If email already in current batch, keep higher scored lead
        if email in unique_leads:
            existing_score = unique_leads[email]['lead_score']
            new_score = lead['lead_score']
            if new_score < existing_score:  # A < B < C
                unique_leads[email] = lead
        else:
            unique_leads[email] = lead

    deduplicated = list(unique_leads.values())
    print(f"✅ Deduplication: {len(all_leads)} → {len(deduplicated)} unique leads")
    return deduplicated

# =====================================================
# SHOPIFY SYNC
# =====================================================

def sync_to_shopify(leads: List[Dict]):
    """Sync Score A+B leads to Shopify customers"""
    init_shopify()

    synced = 0
    errors = 0

    for lead in leads:
        # Only sync Score A and B (skip C = email only)
        if lead['lead_score'] == 'C':
            continue

        try:
            # Create customer
            customer = shopify.Customer()
            customer.email = lead['email']
            customer.first_name = lead['first_name']
            customer.last_name = lead['last_name']
            customer.phone = lead['phone'] if lead.get('phone') else None

            # Marketing consent
            if lead.get('marketing_consent') == 'Yes':
                customer.email_marketing_consent = {
                    'state': 'subscribed',
                    'opt_in_level': 'confirmed_opt_in',
                    'consent_updated_at': datetime.now().isoformat()
                }

            # Tags (filter out None values)
            tags = [
                lead.get('source', 'Unknown'),
                lead.get('persona', 'General'),
                f"Score_{lead.get('lead_score', 'C')}",
                'PRE-LAUNCH-2025'
            ]
            customer.tags = ', '.join([str(t) for t in tags if t])

            # Note
            customer.note = f"Lead collected: {lead['date_collected']}\nMotorcycle: {lead.get('motorcycle_type', 'N/A')}"

            if customer.save():
                lead['shopify_id'] = customer.id
                lead['shopify_status'] = 'Synced'
                synced += 1
            else:
                lead['shopify_status'] = f"Error: {customer.errors.full_messages()}"
                errors += 1

        except Exception as e:
            lead['shopify_status'] = f"Error: {str(e)}"
            errors += 1

    print(f"✅ Shopify Sync: {synced} customers created, {errors} errors")
    return synced, errors

# =====================================================
# MASTER DATABASE UPDATE
# =====================================================

def update_master_database(client, new_leads: List[Dict]):
    """Append new leads to Master Leads Database"""
    worksheet = get_worksheet(client, GOOGLE_SHEET_NAME, "Master Leads Database")

    # Get existing data
    existing = worksheet.get_all_records()
    existing_emails = {row['Email'].lower() for row in existing if row.get('Email')}

    # Prepare rows
    rows_to_append = []
    for lead in new_leads:
        if lead['email'] not in existing_emails:
            row = [
                lead.get('lead_id', ''),
                lead.get('source', ''),
                lead.get('date_collected', ''),
                lead.get('email', ''),
                lead.get('first_name', ''),
                lead.get('last_name', ''),
                lead.get('phone', ''),
                lead.get('location', ''),
                lead.get('motorcycle_type', ''),
                lead.get('why_ride', ''),
                lead.get('persona', ''),
                lead.get('lead_score', ''),
                lead.get('marketing_consent', ''),
                lead.get('shopify_id', ''),
                lead.get('shopify_status', 'Pending'),
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')  # Last Updated
            ]
            rows_to_append.append(row)

    # Append to sheet
    if rows_to_append:
        worksheet.append_rows(rows_to_append)
        print(f"✅ Master Database: {len(rows_to_append)} new leads appended")
    else:
        print("ℹ️ No new leads to append to Master Database")

# =====================================================
# MARK AS PROCESSED
# =====================================================

def mark_source_as_processed(client, source_name: str, count: int):
    """Mark source rows as processed"""
    if count == 0:
        return

    worksheet = get_worksheet(client, GOOGLE_SHEET_NAME, source_name)
    records = worksheet.get_all_records()

    # Find 'Processed' column or create it
    headers = worksheet.row_values(1)
    if 'Processed' not in headers:
        col_index = len(headers) + 1
        worksheet.update_cell(1, col_index, 'Processed')
    else:
        col_index = headers.index('Processed') + 1

    # Mark first `count` unprocessed rows
    marked = 0
    for i, row in enumerate(records, start=2):
        if row.get('Processed') != 'YES':
            worksheet.update_cell(i, col_index, 'YES')
            marked += 1
            if marked >= count:
                break

    print(f"✅ {source_name}: Marked {marked} rows as processed")

# =====================================================
# MAIN EXECUTION
# =====================================================

def main():
    """Main lead processing pipeline"""
    print("=" * 60)
    print("HENDERSON PRE-LAUNCH LEAD PROCESSING")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Initialize Google Sheets client
    client = get_sheets_client()

    # Process all sources
    contest_leads = process_contest_leads(client)
    facebook_leads = process_facebook_leads(client)
    import_leads = process_manual_imports(client)

    all_leads = contest_leads + facebook_leads + import_leads

    if not all_leads:
        print("\nℹ️ No new leads to process. Exiting.")
        return

    # Get existing emails from Master Database
    master_ws = get_worksheet(client, GOOGLE_SHEET_NAME, "Master Leads Database")
    existing = master_ws.get_all_records()
    existing_emails = {row['Email'].lower() for row in existing if row.get('Email')}

    # Deduplicate
    unique_leads = deduplicate_leads(all_leads, existing_emails)

    if not unique_leads:
        print("\n⚠️ All leads are duplicates. Nothing to add.")
        return

    # Sync to Shopify
    synced, errors = sync_to_shopify(unique_leads)

    # Update Master Database
    update_master_database(client, unique_leads)

    # Mark sources as processed
    mark_source_as_processed(client, "Contest Giveaway Entries", len(contest_leads))
    mark_source_as_processed(client, "Facebook Lead Ads", len(facebook_leads))

    # Final report
    print("\n" + "=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    print(f"Total processed: {len(all_leads)} leads")
    print(f"New unique leads: {len(unique_leads)} leads")
    print(f"Shopify synced: {synced} customers")
    print(f"Shopify errors: {errors} failed")
    print(f"\nLead Score Breakdown:")
    score_a = sum(1 for l in unique_leads if l['lead_score'] == 'A')
    score_b = sum(1 for l in unique_leads if l['lead_score'] == 'B')
    score_c = sum(1 for l in unique_leads if l['lead_score'] == 'C')
    print(f"  Score A (Premium): {score_a}")
    print(f"  Score B (Good): {score_b}")
    print(f"  Score C (Basic): {score_c}")
    print("=" * 60)

if __name__ == "__main__":
    main()
