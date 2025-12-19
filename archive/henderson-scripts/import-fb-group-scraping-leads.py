#!/usr/bin/env python3
"""
HENDERSON SHOP - FACEBOOK GROUP SCRAPING LEADS IMPORT
Purpose: Import FB group members scraped from motorcycle equipment groups
Input: CSV file or direct Google Sheets upload
Output: Google Sheets "Import Staging" → process-leads-prelaunch.py
Lead Quality: HIGH (already interested in motorcycle gear)
"""

import os
import re
import csv
import hashlib
from datetime import datetime
from typing import List, Dict, Optional
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# =====================================================
# CONFIGURATION
# =====================================================

GOOGLE_SHEET_NAME = "Henderson PRE-LAUNCH Leads 2025"
GOOGLE_CREDS_PATH = os.getenv('GOOGLE_CREDS_PATH', '.credentials/google-sheets-service-account.json')

# FB Group Lead Scoring (different from contest leads)
# Based on engagement signals visible in group scraping
SCORE_A_INDICATORS = ['admin', 'moderator', 'frequent_poster', 'verified']
SCORE_B_INDICATORS = ['active_member', 'recent_activity', 'multiple_posts']
# Score C = basic member (email only, minimal activity)

# Expected CSV columns (flexible mapping)
CSV_COLUMN_MAP = {
    # FB scraping tools use different column names
    'email': ['email', 'Email', 'e-mail', 'E-mail', 'mail'],
    'name': ['name', 'Name', 'full_name', 'Full Name', 'display_name'],
    'first_name': ['first_name', 'First Name', 'firstname', 'FirstName'],
    'last_name': ['last_name', 'Last Name', 'lastname', 'LastName'],
    'location': ['location', 'Location', 'city', 'City', 'address'],
    'profile_url': ['profile_url', 'Profile URL', 'fb_profile', 'Facebook Profile'],
    'member_since': ['member_since', 'Member Since', 'joined_date', 'Joined'],
    'activity_level': ['activity', 'Activity', 'engagement', 'Engagement Level'],
    'posts_count': ['posts', 'Posts', 'posts_count', 'Number of Posts'],
    'role': ['role', 'Role', 'member_type', 'Type'],
    'interests': ['interests', 'Interests', 'about', 'Bio'],
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

def get_import_staging_worksheet(client):
    """Get or create Import Staging worksheet"""
    try:
        sheet = client.open(GOOGLE_SHEET_NAME)
        worksheet = sheet.worksheet("Import Staging")
        return worksheet
    except gspread.exceptions.WorksheetNotFound:
        print("⚠️ Creating 'Import Staging' worksheet...")
        sheet = client.open(GOOGLE_SHEET_NAME)
        worksheet = sheet.add_worksheet(title="Import Staging", rows=1000, cols=20)
        # Add headers
        worksheet.update('A1:H1', [[
            'Email', 'First Name', 'Last Name', 'Phone', 'Location',
            'Motorcycle Type', 'Source', 'Notes'
        ]])
        return worksheet

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

    # Block B2B business emails
    b2b_patterns = ['info@', 'contact@', 'sales@', 'support@', 'admin@', 'service@']
    if any(email.startswith(pattern) for pattern in b2b_patterns):
        return None

    return email

def clean_name(name: str) -> str:
    """Capitalize and clean name"""
    if not name or not isinstance(name, str):
        return ""
    return name.strip().title()

def split_full_name(full_name: str) -> tuple:
    """Split full name into first and last"""
    if not full_name:
        return "", ""

    parts = full_name.strip().split(' ', 1)
    first = parts[0] if len(parts) > 0 else ''
    last = parts[1] if len(parts) > 1 else ''
    return first, last

def detect_column_name(headers: List[str], field: str) -> Optional[str]:
    """Detect actual column name from CSV headers"""
    possible_names = CSV_COLUMN_MAP.get(field, [])

    for header in headers:
        if header.strip() in possible_names:
            return header.strip()

    return None

# =====================================================
# FB GROUP LEAD SCORING
# =====================================================

def calculate_fb_lead_score(lead_data: Dict) -> tuple:
    """
    Calculate lead score for FB group members based on engagement signals
    Returns: (score: str, quality_indicator: str)
    """
    role = str(lead_data.get('role', '')).lower()
    activity = str(lead_data.get('activity_level', '')).lower()
    posts_count = int(lead_data.get('posts_count', 0)) if str(lead_data.get('posts_count', '')).isdigit() else 0

    # Score A: High engagement members (admins, frequent posters)
    if any(indicator in role for indicator in SCORE_A_INDICATORS):
        return 'A', f"Admin/Moderator in group"

    if posts_count > 20 or 'frequent' in activity or 'active' in activity:
        return 'A', f"High engagement ({posts_count} posts)"

    # Score B: Active members with moderate engagement
    if posts_count > 5 or any(indicator in activity for indicator in SCORE_B_INDICATORS):
        return 'B', f"Active member ({posts_count} posts)"

    # Score C: Basic members (lurkers, new members)
    return 'C', "Basic member"

def detect_motorcycle_interest(lead_data: Dict) -> str:
    """
    Detect motorcycle type interest from profile data
    Uses: interests, bio, posts content
    """
    interests = str(lead_data.get('interests', '')).lower()

    # Motorcycle type keywords
    if any(word in interests for word in ['sport bike', 'sportbike', 'cbr', 'gsxr', 'r1', 'r6']):
        return 'Sport bike'

    if any(word in interests for word in ['cruiser', 'harley', 'indian', 'v-twin']):
        return 'Cruiser'

    if any(word in interests for word in ['adventure', 'adv', 'gs', 'africa twin', 'touring']):
        return 'Adventure'

    if any(word in interests for word in ['street', 'naked', 'mt', 'monster']):
        return 'Street bike'

    # Default: General interest
    return 'Motorcycle enthusiast (general)'

# =====================================================
# CSV PROCESSING
# =====================================================

def read_csv_file(csv_path: str) -> List[Dict]:
    """Read and parse CSV file with flexible column mapping"""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    leads = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames

        print(f"📋 CSV Headers detected: {headers}")

        # Detect column mappings
        email_col = detect_column_name(headers, 'email')
        name_col = detect_column_name(headers, 'name')
        first_col = detect_column_name(headers, 'first_name')
        last_col = detect_column_name(headers, 'last_name')
        location_col = detect_column_name(headers, 'location')
        profile_col = detect_column_name(headers, 'profile_url')
        member_since_col = detect_column_name(headers, 'member_since')
        activity_col = detect_column_name(headers, 'activity_level')
        posts_col = detect_column_name(headers, 'posts_count')
        role_col = detect_column_name(headers, 'role')
        interests_col = detect_column_name(headers, 'interests')

        if not email_col:
            raise ValueError("❌ Email column not found in CSV! Expected: email, Email, e-mail, etc.")

        print(f"✅ Column mapping:\n  Email: {email_col}\n  Name: {name_col or first_col}\n  Location: {location_col}")

        for row in reader:
            # Get email (required)
            email = clean_email(row.get(email_col, ''))
            if not email:
                continue  # Skip invalid emails

            # Get name (handle full name or first/last separately)
            if first_col and last_col:
                first_name = clean_name(row.get(first_col, ''))
                last_name = clean_name(row.get(last_col, ''))
            elif name_col:
                first_name, last_name = split_full_name(row.get(name_col, ''))
                first_name = clean_name(first_name)
                last_name = clean_name(last_name)
            else:
                first_name = ""
                last_name = ""

            # Build lead data
            lead_data = {
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'location': row.get(location_col, '') if location_col else '',
                'profile_url': row.get(profile_col, '') if profile_col else '',
                'member_since': row.get(member_since_col, '') if member_since_col else '',
                'activity_level': row.get(activity_col, '') if activity_col else '',
                'posts_count': row.get(posts_col, 0) if posts_col else 0,
                'role': row.get(role_col, '') if role_col else '',
                'interests': row.get(interests_col, '') if interests_col else '',
            }

            # Calculate FB-specific score
            score, quality_note = calculate_fb_lead_score(lead_data)
            lead_data['score'] = score
            lead_data['quality_note'] = quality_note

            # Detect motorcycle interest
            lead_data['motorcycle_type'] = detect_motorcycle_interest(lead_data)

            leads.append(lead_data)

    print(f"✅ CSV parsed: {len(leads)} valid leads")
    return leads

# =====================================================
# GOOGLE SHEETS UPLOAD
# =====================================================

def upload_to_import_staging(client, leads: List[Dict], group_name: str):
    """Upload FB group leads to Import Staging worksheet"""
    worksheet = get_import_staging_worksheet(client)

    # Clear existing staging data (start fresh)
    worksheet.clear()

    # Add headers
    worksheet.update('A1:H1', [[
        'Email', 'First Name', 'Last Name', 'Phone', 'Location',
        'Motorcycle Type', 'Source', 'Notes'
    ]])

    # Prepare rows
    rows = []
    for lead in leads:
        source = f"FB Group: {group_name}"
        notes = f"{lead['quality_note']} | Score: {lead['score']}"

        if lead.get('profile_url'):
            notes += f" | Profile: {lead['profile_url']}"

        if lead.get('member_since'):
            notes += f" | Member since: {lead['member_since']}"

        row = [
            lead['email'],
            lead['first_name'],
            lead['last_name'],
            '',  # Phone (not available from FB groups)
            lead.get('location', ''),
            lead.get('motorcycle_type', 'Motorcycle enthusiast'),
            source,
            notes
        ]
        rows.append(row)

    # Upload all rows at once (faster than append_rows for large datasets)
    if rows:
        worksheet.append_rows(rows)
        print(f"✅ Uploaded {len(rows)} leads to Import Staging")

    # Print score breakdown
    score_a = sum(1 for l in leads if l['score'] == 'A')
    score_b = sum(1 for l in leads if l['score'] == 'B')
    score_c = sum(1 for l in leads if l['score'] == 'C')

    print(f"\n📊 Lead Quality Breakdown:")
    print(f"  Score A (High engagement): {score_a} ({score_a/len(leads)*100:.1f}%)")
    print(f"  Score B (Active member): {score_b} ({score_b/len(leads)*100:.1f}%)")
    print(f"  Score C (Basic member): {score_c} ({score_c/len(leads)*100:.1f}%)")

    return len(rows)

# =====================================================
# MAIN EXECUTION
# =====================================================

def main():
    """Main FB group leads import pipeline"""
    import sys

    print("=" * 60)
    print("HENDERSON - FACEBOOK GROUP SCRAPING LEADS IMPORT")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Get CSV file path and group name from args
    if len(sys.argv) < 3:
        print("\n❌ Usage: python import-fb-group-scraping-leads.py <csv_file> <group_name>")
        print("\nExample:")
        print("  python import-fb-group-scraping-leads.py fb_motorcycle_gear.csv 'Motorcycle Gear Enthusiasts'")
        print("\nExpected CSV columns (flexible):")
        print("  - Email (required)")
        print("  - Name or First Name + Last Name")
        print("  - Location (optional)")
        print("  - Activity Level / Posts Count (optional)")
        print("  - Role (admin/moderator/member) (optional)")
        print("  - Interests / Bio (optional)")
        sys.exit(1)

    csv_file = sys.argv[1]
    group_name = sys.argv[2]

    print(f"\n📂 CSV File: {csv_file}")
    print(f"👥 FB Group: {group_name}")

    # Read CSV
    try:
        leads = read_csv_file(csv_file)
    except Exception as e:
        print(f"\n❌ Error reading CSV: {e}")
        sys.exit(1)

    if not leads:
        print("\n⚠️ No valid leads found in CSV. Check email column and data quality.")
        sys.exit(1)

    # Initialize Google Sheets
    try:
        client = get_sheets_client()
    except Exception as e:
        print(f"\n❌ Error connecting to Google Sheets: {e}")
        print("Make sure GOOGLE_CREDS_PATH is set and service account JSON exists.")
        sys.exit(1)

    # Upload to Import Staging
    try:
        uploaded = upload_to_import_staging(client, leads, group_name)
    except Exception as e:
        print(f"\n❌ Error uploading to Google Sheets: {e}")
        sys.exit(1)

    # Final report
    print("\n" + "=" * 60)
    print("IMPORT COMPLETE ✅")
    print("=" * 60)
    print(f"✅ {uploaded} leads uploaded to Import Staging")
    print(f"\n📋 Next Step:")
    print(f"   Run: python scripts/process-leads-prelaunch.py")
    print(f"   This will:")
    print(f"   1. Deduplicate leads")
    print(f"   2. Sync Score A+B to Shopify customers")
    print(f"   3. Update Master Leads Database")
    print(f"   4. Trigger email sequences")
    print("=" * 60)

if __name__ == "__main__":
    main()
