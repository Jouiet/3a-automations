#!/usr/bin/env python3

"""
IMPORT LINKEDIN LEADS TO HENDERSON PIPELINE

Importe les leads LinkedIn scorés vers le pipeline Henderson Shop:
    1. Upload to Google Sheets "Import Staging"
    2. Segment by product category
    3. Prepare for Shopify sync + email sequences

Usage:
    python scripts/import-linkedin-leads-by-category.py tmp/linkedin-members-all-scored.csv
    python scripts/import-linkedin-leads-by-category.py tmp/linkedin-leads-scored-helmets.csv --category helmets
    python scripts/import-linkedin-leads-by-category.py --min-score B

Requirements:
    - P0.1 RESOLVED: Google Sheets API credentials configured
    - Google Sheets: "Henderson Shop - Lead Import Staging"
    - Scored leads CSV from previous step

Output:
    - Uploads to Google Sheets
    - Triggers Shopify sync (via process-leads-prelaunch.py)
    - Segments email campaigns by category
"""

import csv
import sys
import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    GOOGLE_SHEETS_AVAILABLE = True
except ImportError:
    GOOGLE_SHEETS_AVAILABLE = False
    print("⚠️  Google Sheets API not available. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")

# ============================================================
# CONFIGURATION
# ============================================================

# Google Sheets configuration
GOOGLE_SHEETS_ID = "YOUR_SHEET_ID_HERE"  # TODO: Set in .env
IMPORT_STAGING_TAB = "Import Staging"

# P0.1 Blocker check
CREDENTIALS_PATH = Path("google-apps-script/credentials.json")

# Category-specific email sequences (Klaviyo flow IDs)
CATEGORY_EMAIL_FLOWS = {
    'helmets': {
        'flow_id': 'helmets_nurture_90day',
        'segment': 'Helmet Interest',
        'tags': ['helmet', 'safety', 'protection'],
    },
    'jackets_pants': {
        'flow_id': 'apparel_nurture_90day',
        'segment': 'Apparel Interest',
        'tags': ['jacket', 'pants', 'riding gear'],
    },
    'gloves': {
        'flow_id': 'gloves_nurture_90day',
        'segment': 'Gloves Interest',
        'tags': ['gloves', 'hand protection'],
    },
    'protection': {
        'flow_id': 'protection_nurture_90day',
        'segment': 'Safety Gear Interest',
        'tags': ['protection', 'body armor', 'safety'],
    },
    'boots': {
        'flow_id': 'boots_nurture_90day',
        'segment': 'Boots Interest',
        'tags': ['boots', 'footwear'],
    },
    'accessories': {
        'flow_id': 'accessories_nurture_90day',
        'segment': 'Accessories Interest',
        'tags': ['accessories', 'luggage', 'bags'],
    },
}

# ============================================================
# P0.1 BLOCKER CHECK
# ============================================================

def check_p01_resolved() -> bool:
    """Check if P0.1 (Google Sheets API) is resolved."""

    if not CREDENTIALS_PATH.exists():
        print("\n" + "=" * 70)
        print("❌ P0.1 BLOCKER: Google Sheets API NOT CONFIGURED")
        print("=" * 70)
        print("")
        print("Cannot import leads without Google Sheets API credentials.")
        print("")
        print("REQUIRED ACTION:")
        print("  1. Follow guide: google-apps-script/GOOGLE_SHEETS_API_SETUP.md")
        print("  2. Time required: 30-45 minutes")
        print("  3. Impact: Unlocks 100% of lead processing pipeline")
        print("")
        print("This blocker prevents:")
        print("  ❌ Uploading leads to Google Sheets")
        print("  ❌ Syncing to Shopify customers")
        print("  ❌ Triggering email sequences")
        print("  ❌ Processing ANY leads (Facebook, LinkedIn, Contest)")
        print("")
        print("=" * 70)
        return False

    if not GOOGLE_SHEETS_AVAILABLE:
        print("\n❌ Google Sheets API libraries not installed")
        print("Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        return False

    print("✅ P0.1: Google Sheets API credentials found")
    return True

# ============================================================
# GOOGLE SHEETS CLIENT
# ============================================================

def get_sheets_client():
    """Initialize Google Sheets API client."""

    if not CREDENTIALS_PATH.exists():
        raise FileNotFoundError(f"Credentials not found: {CREDENTIALS_PATH}")

    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

    creds = Credentials.from_service_account_file(
        str(CREDENTIALS_PATH),
        scopes=SCOPES
    )

    service = build('sheets', 'v4', credentials=creds)
    return service.spreadsheets()

# ============================================================
# TRANSFORM LEADS FOR GOOGLE SHEETS
# ============================================================

def transform_lead_for_import(lead: Dict, category: str) -> List:
    """
    Transform scored LinkedIn lead to Google Sheets row format.

    Google Sheets columns:
        [Email, First Name, Last Name, Source, Category, Score,
         Classification, LinkedIn URL, Company, Job Title, Location,
         Imported At, Status]
    """

    # Get category email flow config
    flow_config = CATEGORY_EMAIL_FLOWS.get(category, {})

    return [
        lead.get('Email', '').strip(),
        lead.get('First Name', '').strip(),
        lead.get('Last Name', '').strip(),
        f"LinkedIn - {lead.get('Source Group', 'Unknown')}",
        category,
        lead.get('Score', 0),
        lead.get('Classification', 'C'),
        lead.get('LinkedIn URL', '').strip(),
        lead.get('Company', '').strip(),
        lead.get('Job Title', '').strip(),
        lead.get('Location', '').strip(),
        datetime.now().isoformat(),
        'pending',  # Status: pending, processed, failed
        flow_config.get('flow_id', ''),
        flow_config.get('segment', ''),
        ','.join(flow_config.get('tags', [])),
    ]

# ============================================================
# UPLOAD TO GOOGLE SHEETS
# ============================================================

def upload_to_google_sheets(leads: List[Dict], min_score: str = 'C') -> Dict:
    """
    Upload leads to Google Sheets Import Staging.

    Args:
        leads: List of scored lead dicts
        min_score: Minimum classification (A, B, or C)

    Returns:
        Upload statistics
    """

    print("\n📤 UPLOADING TO GOOGLE SHEETS")
    print("=" * 60)

    # Filter by minimum score
    score_order = {'A': 3, 'B': 2, 'C': 1, 'D': 0}
    min_score_value = score_order.get(min_score, 1)

    filtered_leads = [
        lead for lead in leads
        if score_order.get(lead.get('Classification', 'D'), 0) >= min_score_value
    ]

    print(f"\n📊 Total leads: {len(leads)}")
    print(f"   Min score filter: {min_score}+")
    print(f"   Leads to upload: {len(filtered_leads)}")

    if len(filtered_leads) == 0:
        print("⚠️  No leads meet minimum score requirement")
        return {'uploaded': 0, 'skipped': len(leads)}

    # Get Google Sheets client
    try:
        sheets = get_sheets_client()
    except Exception as e:
        print(f"❌ Cannot connect to Google Sheets: {e}")
        return {'uploaded': 0, 'skipped': len(leads), 'error': str(e)}

    # Prepare data rows
    rows = []
    for lead in filtered_leads:
        category = lead.get('Category', 'unknown')
        row = transform_lead_for_import(lead, category)
        rows.append(row)

    # Header row
    header = [
        'Email', 'First Name', 'Last Name', 'Source', 'Category', 'Score',
        'Classification', 'LinkedIn URL', 'Company', 'Job Title', 'Location',
        'Imported At', 'Status', 'Email Flow ID', 'Segment', 'Tags'
    ]

    # Upload to Google Sheets
    try:
        # Append to Import Staging tab
        body = {
            'values': [header] + rows
        }

        result = sheets.values().append(
            spreadsheetId=GOOGLE_SHEETS_ID,
            range=f"'{IMPORT_STAGING_TAB}'!A1",
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()

        updated_rows = result.get('updates', {}).get('updatedRows', 0)

        print(f"\n✅ Uploaded {updated_rows} leads to Google Sheets")
        print(f"   Sheet: {IMPORT_STAGING_TAB}")
        print(f"   Range: {result.get('updates', {}).get('updatedRange', 'N/A')}")

        return {
            'uploaded': updated_rows - 1,  # Exclude header
            'skipped': len(leads) - len(filtered_leads),
            'sheet_id': GOOGLE_SHEETS_ID,
            'range': result.get('updates', {}).get('updatedRange', ''),
        }

    except Exception as e:
        print(f"❌ Upload error: {e}")
        return {'uploaded': 0, 'skipped': len(leads), 'error': str(e)}

# ============================================================
# SEGMENT BY CATEGORY
# ============================================================

def segment_by_category(leads: List[Dict]) -> Dict[str, List[Dict]]:
    """Segment leads by product category."""

    segments = {}

    for lead in leads:
        category = lead.get('Category', 'unknown')
        if category not in segments:
            segments[category] = []
        segments[category].append(lead)

    return segments

def print_category_breakdown(segments: Dict[str, List[Dict]]):
    """Print category breakdown statistics."""

    print("\n📦 CATEGORY BREAKDOWN")
    print("=" * 60)

    for category, leads in sorted(segments.items(), key=lambda x: len(x[1]), reverse=True):
        total = len(leads)
        score_a = len([l for l in leads if l.get('Classification') == 'A'])
        score_b = len([l for l in leads if l.get('Classification') == 'B'])
        qualified = score_a + score_b

        print(f"\n{category.upper().replace('_', ' ')}:")
        print(f"   Total: {total}")
        print(f"   Score A: {score_a} ({score_a/total*100:.1f}%)")
        print(f"   Score B: {score_b} ({score_b/total*100:.1f}%)")
        print(f"   Qualified (A+B): {qualified} ({qualified/total*100:.1f}%)")

        # Email flow
        if category in CATEGORY_EMAIL_FLOWS:
            flow = CATEGORY_EMAIL_FLOWS[category]
            print(f"   Email Flow: {flow['flow_id']}")
            print(f"   Segment: {flow['segment']}")

# ============================================================
# MAIN
# ============================================================

def main():
    print("\n🚀 IMPORT LINKEDIN LEADS TO HENDERSON PIPELINE")
    print("=" * 60)

    # Check P0.1
    if not check_p01_resolved():
        print("\n⚠️  Cannot proceed without P0.1 resolved")
        print("Resolve P0.1 first, then re-run this script.\n")
        sys.exit(1)

    # Parse arguments
    if len(sys.argv) < 2:
        print("\n❌ Usage: python import-linkedin-leads-by-category.py <scored_csv>")
        print("\nExample:")
        print("  python scripts/import-linkedin-leads-by-category.py tmp/linkedin-members-all-scored.csv")
        print("  python scripts/import-linkedin-leads-by-category.py tmp/linkedin-leads-scored-helmets.csv --min-score B")
        sys.exit(1)

    input_csv = Path(sys.argv[1])

    if not input_csv.exists():
        print(f"❌ File not found: {input_csv}")
        sys.exit(1)

    # Parse options
    min_score = 'C'  # Default: import Score C and above
    if '--min-score' in sys.argv:
        idx = sys.argv.index('--min-score')
        if idx + 1 < len(sys.argv):
            min_score = sys.argv[idx + 1].upper()
            if min_score not in ['A', 'B', 'C', 'D']:
                print(f"❌ Invalid min-score: {min_score} (must be A, B, C, or D)")
                sys.exit(1)

    print(f"\n📂 Input: {input_csv.name}")
    print(f"📏 Min score: {min_score}+")

    # ========================================
    # LOAD SCORED LEADS
    # ========================================

    print("\n📥 LOADING SCORED LEADS")
    print("=" * 60)

    leads = []
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        leads = list(reader)

    print(f"✅ Loaded {len(leads)} leads")

    if len(leads) == 0:
        print("⚠️  No leads to import")
        sys.exit(0)

    # ========================================
    # SEGMENT BY CATEGORY
    # ========================================

    segments = segment_by_category(leads)
    print_category_breakdown(segments)

    # ========================================
    # UPLOAD TO GOOGLE SHEETS
    # ========================================

    result = upload_to_google_sheets(leads, min_score)

    if result.get('error'):
        print(f"\n❌ Upload failed: {result['error']}")
        sys.exit(1)

    print(f"\n📊 IMPORT SUMMARY:")
    print(f"   Uploaded: {result['uploaded']}")
    print(f"   Skipped: {result['skipped']}")

    # ========================================
    # TRIGGER SHOPIFY SYNC
    # ========================================

    print("\n\n🔄 TRIGGERING SHOPIFY SYNC")
    print("=" * 60)

    print("\nNext step: Process leads to create Shopify customers")
    print("Run: python scripts/process-leads-prelaunch.py")
    print("")
    print("This will:")
    print("  1. Read leads from Google Sheets Import Staging")
    print("  2. Create Shopify customers (Score A+B only)")
    print("  3. Trigger email sequences by category")
    print("  4. Update lead status in Google Sheets")
    print("")

    # ========================================
    # ROI SUMMARY
    # ========================================

    qualified = result['uploaded']
    conversion_rate = 0.015  # 1.5%
    aov = 179

    conversions = int(qualified * conversion_rate)
    revenue = conversions * aov

    print("\n💰 EXPECTED ROI")
    print("=" * 60)
    print(f"\nQualified leads uploaded: {qualified:,}")
    print(f"Expected conversions (1.5%): {conversions:,}")
    print(f"Expected revenue (AOV ${aov}): ${revenue:,}")
    print("")

    print("✅ IMPORT COMPLETE!\n")

if __name__ == '__main__':
    main()
