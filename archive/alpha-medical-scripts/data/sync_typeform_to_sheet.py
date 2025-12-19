# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Sync Typeform Contest Responses to Google Sheet
PHASE 1: PRE-LAUNCH Contest/Giveaway Integration

Fetches contest form responses from Typeform API and appends to Google Sheet.

Requirements:
- Typeform API token (Personal Access Token)
- Google Sheets API credentials
- Form ID from Typeform

Usage:
    python3 sync_typeform_to_sheet.py --form-id FORM_ID --hours 1

Environment Variables:
    TYPEFORM_API_TOKEN: Personal Access Token from Typeform
    GOOGLE_SHEETS_CREDENTIALS: Path to service account JSON file
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

# Configuration
TYPEFORM_API_BASE = "https://api.typeform.com"
TYPEFORM_API_TOKEN = os.getenv("TYPEFORM_API_TOKEN")
GOOGLE_SHEETS_CREDENTIALS = os.getenv("GOOGLE_SHEETS_CREDENTIALS", "google_credentials.json")
SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME", "Alpha Medical - Leads Database")
RAW_LEADS_TAB = "Raw Leads"

# Quality score for contest leads (high - explicit opt-in)
QUALITY_SCORE = 8.5


def validate_env():
    """Validate required environment variables"""
    if not TYPEFORM_API_TOKEN:
        print("ERROR: TYPEFORM_API_TOKEN not set")
        sys.exit(1)

    if not os.path.exists(GOOGLE_SHEETS_CREDENTIALS):
        print(f"ERROR: Google credentials file not found: {GOOGLE_SHEETS_CREDENTIALS}")
        sys.exit(1)


def get_google_sheet():
    """Connect to Google Sheet and return worksheet"""
    try:
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            GOOGLE_SHEETS_CREDENTIALS, scope
        )
        client = gspread.authorize(creds)
        sheet = client.open(SHEET_NAME)
        worksheet = sheet.worksheet(RAW_LEADS_TAB)
        return worksheet
    except Exception as e:
        print(f"ERROR: Failed to connect to Google Sheet: {e}")
        sys.exit(1)


def fetch_typeform_responses(form_id: str, hours_ago: int = 24) -> List[Dict]:
    """
    Fetch Typeform responses from the last N hours

    Args:
        form_id: Typeform form ID
        hours_ago: Fetch responses from last N hours (default: 24)

    Returns:
        List of response dictionaries
    """
    print(f"Fetching Typeform responses from last {hours_ago} hours...")

    # Calculate since timestamp (ISO 8601 format)
    since = (datetime.utcnow() - timedelta(hours=hours_ago)).isoformat() + "Z"

    # API endpoint
    url = f"{TYPEFORM_API_BASE}/forms/{form_id}/responses"

    # Headers
    headers = {
        "Authorization": f"Bearer {TYPEFORM_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # Query parameters
    params = {
        "since": since,
        "page_size": 1000,  # Max allowed per request
        "sort": "submitted_at,desc"
    }

    all_responses = []
    page_count = 0

    try:
        while True:
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            items = data.get("items", [])

            if not items:
                break

            all_responses.extend(items)
            page_count += 1

            print(f"  Page {page_count}: Fetched {len(items)} responses")

            # Check if there are more pages
            page_count_total = data.get("page_count", 1)
            if page_count >= page_count_total:
                break

            # Update params for next page
            params["before"] = items[-1]["token"]

        print(f"Total responses fetched: {len(all_responses)}")
        return all_responses

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to fetch Typeform responses: {e}")
        return []


def parse_typeform_response(response: Dict) -> Optional[Dict]:
    """
    Parse Typeform response into lead data

    Args:
        response: Typeform response object

    Returns:
        Dictionary with lead data or None if invalid
    """
    try:
        # Extract submitted timestamp
        submitted_at = response.get("submitted_at", "")
        response_id = response.get("response_id", "")

        # Extract answers
        answers = response.get("answers", [])

        # Initialize lead data
        lead = {
            "timestamp": submitted_at,
            "name": "",
            "email": "",
            "phone": "",
            "location": "",
            "preferences": "",
            "source": "contest_typeform",
            "quality_score": QUALITY_SCORE,
            "response_id": response_id
        }

        # Map answers to fields (flexible field matching)
        for answer in answers:
            field_type = answer.get("type", "")
            field_title = answer.get("field", {}).get("ref", "").lower()

            # Email
            if field_type == "email":
                lead["email"] = answer.get("email", "")

            # Text fields - map by field reference
            elif field_type == "text" or field_type == "short_text":
                value = answer.get("text", "")
                if "name" in field_title or "nom" in field_title:
                    lead["name"] = value
                elif "phone" in field_title or "telephone" in field_title:
                    lead["phone"] = value
                elif "location" in field_title or "ville" in field_title or "city" in field_title:
                    lead["location"] = value

            # Choice fields (preferences)
            elif field_type == "choice":
                choice = answer.get("choice", {})
                if isinstance(choice, dict):
                    lead["preferences"] += choice.get("label", "") + "; "

            # Multiple choice
            elif field_type == "choices":
                choices = answer.get("choices", {})
                if isinstance(choices, dict):
                    labels = choices.get("labels", [])
                    lead["preferences"] += "; ".join(labels) + "; "

        # Clean preferences (remove trailing semicolon)
        lead["preferences"] = lead["preferences"].rstrip("; ")

        # Validate email (required)
        if not lead["email"] or "@" not in lead["email"]:
            print(f"  WARNING: Skipping response {response_id} - invalid email")
            return None

        return lead

    except Exception as e:
        print(f"  ERROR: Failed to parse response: {e}")
        return None


def append_to_sheet(worksheet, leads: List[Dict]):
    """
    Append leads to Google Sheet (batch operation for performance)

    Args:
        worksheet: Google Sheet worksheet object
        leads: List of lead dictionaries
    """
    if not leads:
        print("No leads to append.")
        return

    print(f"Appending {len(leads)} leads to Google Sheet...")

    try:
        # Get existing emails to avoid duplicates
        existing_data = worksheet.get_all_values()
        existing_emails = set()
        if len(existing_data) > 1:  # Skip header row
            email_col_idx = 2  # Column C (0-indexed column 2)
            for row in existing_data[1:]:  # Skip header
                if len(row) > email_col_idx:
                    existing_emails.add(row[email_col_idx].lower())

        print(f"  Found {len(existing_emails)} existing leads in sheet")

        # Prepare rows to append
        rows_to_append = []
        duplicates = 0

        for lead in leads:
            # Check for duplicate
            if lead["email"].lower() in existing_emails:
                duplicates += 1
                continue

            # Format row (matches Raw Leads sheet structure)
            row = [
                lead["timestamp"],          # A: Timestamp
                lead["name"],                # B: Name
                lead["email"],               # C: Email
                lead["phone"],               # D: Phone
                lead["location"],            # E: Location
                lead["source"],              # F: Platform
                "",                          # G: Bio/Description (empty)
                "",                          # H: Engagement Score (empty)
                lead["preferences"],         # I: Notes/Preferences
                lead["quality_score"],       # J: Quality Score
                "",                          # K: Persona (will be filled by clean script)
                "",                          # L: Status (default: new)
                lead["response_id"],         # M: Source ID
                "",                          # N: Instagram URL (empty)
                "",                          # O: Facebook URL (empty)
                "",                          # P: TikTok URL (empty)
                ""                           # Q: Processed (FALSE)
            ]

            rows_to_append.append(row)
            existing_emails.add(lead["email"].lower())

        # Batch append
        if rows_to_append:
            worksheet.append_rows(rows_to_append, value_input_option="USER_ENTERED")
            print(f"✅ Successfully appended {len(rows_to_append)} new leads")
        else:
            print("  No new leads to append (all duplicates)")

        if duplicates > 0:
            print(f"  Skipped {duplicates} duplicate leads")

    except Exception as e:
        print(f"ERROR: Failed to append leads to sheet: {e}")
        sys.exit(1)


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(
        description="Sync Typeform contest responses to Google Sheet"
    )
    parser.add_argument(
        "--form-id",
        required=True,
        help="Typeform form ID"
    )
    parser.add_argument(
        "--hours",
        type=int,
        default=1,
        help="Fetch responses from last N hours (default: 1)"
    )
    parser.add_argument(
        "--source-tag",
        default="contest_typeform",
        help="Source tag for leads (default: contest_typeform)"
    )

    args = parser.parse_args()

    print("="*60)
    print("TYPEFORM → GOOGLE SHEET SYNC")
    print("="*60)
    print(f"Form ID: {args.form_id}")
    print(f"Time window: Last {args.hours} hour(s)")
    print(f"Source tag: {args.source_tag}")
    print(f"Quality score: {QUALITY_SCORE}")
    print("="*60)

    # Validate environment
    validate_env()

    # Connect to Google Sheet
    worksheet = get_google_sheet()
    print(f"✅ Connected to Google Sheet: {SHEET_NAME}")

    # Fetch Typeform responses
    responses = fetch_typeform_responses(args.form_id, args.hours)

    if not responses:
        print("No responses found. Exiting.")
        return

    # Parse responses
    print(f"\nParsing {len(responses)} responses...")
    leads = []
    for response in responses:
        lead = parse_typeform_response(response)
        if lead:
            # Override source tag if provided
            lead["source"] = args.source_tag
            leads.append(lead)

    print(f"✅ Parsed {len(leads)} valid leads")

    # Append to sheet
    append_to_sheet(worksheet, leads)

    print("\n" + "="*60)
    print("SYNC COMPLETE")
    print("="*60)


if __name__ == "__main__":
    main()
