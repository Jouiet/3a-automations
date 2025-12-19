#!/usr/bin/env python3
"""
HENDERSON SHOP - PARSE INSTANT DATA SCRAPER FACEBOOK GROUP EXPORT
Purpose: Convert Instant Data Scraper messy CSV to clean format
Input: CSV with CSS class names as columns (x1i10hfl, xdmh292, html-span, etc.)
Output: Clean CSV with Name, Profile URL, Bio, Location, etc.
"""

import csv
import re
import sys
from urllib.parse import urlparse, parse_qs

def extract_fb_user_id(url):
    """Extract Facebook user ID from profile URL"""
    if not url or 'facebook.com' not in url:
        return None

    # Match patterns:
    # /user/618715726/
    # /user/100083493205297/
    # /61584489676212/
    match = re.search(r'/user/(\d+)', url)
    if match:
        return match.group(1)

    match = re.search(r'/(\d{10,})/', url)
    if match:
        return match.group(1)

    return None

def is_profile_url(value):
    """Check if value is a Facebook profile URL"""
    if not isinstance(value, str):
        return False
    return 'facebook.com/groups/' in value and '/user/' in value

def is_name(value):
    """Check if value looks like a name"""
    if not isinstance(value, str) or len(value) < 2 or len(value) > 50:
        return False

    # Should be mostly letters, spaces, hyphens
    if not re.match(r'^[A-ZÀ-ÿa-z\s\'-]+$', value):
        return False

    # Should have at least one uppercase letter (names are capitalized)
    if not re.search(r'[A-ZÀ-Ÿ]', value):
        return False

    # Exclude common Facebook UI text
    excluded = [
        'Membre', 'Admin', 'Ajouter', 'Voir tout', 'En savoir plus',
        'Inviter', 'Partager', 'Discussion', 'Personnes', 'Fichiers',
        'Travaille chez', 'Membre depuis', 'points'
    ]
    if any(exc in value for exc in excluded):
        return False

    return True

def is_bio_info(value):
    """Check if value looks like bio/work info"""
    if not isinstance(value, str) or len(value) < 5:
        return False

    # Bio indicators
    bio_patterns = [
        r'Travaille chez',
        r'à\s+[A-Z]',  # "à Company Name"
        r'CEO|CTO|Manager|Engineer|Developer|Designer',
        r'motorcycle|bike|rider|chopper',
        r'High School|University|College'
    ]

    return any(re.search(pattern, value, re.IGNORECASE) for pattern in bio_patterns)

def is_location(value):
    """Check if value looks like a location"""
    if not isinstance(value, str) or len(value) < 3:
        return False

    # Location patterns
    location_patterns = [
        r'^[A-Z][a-z]+,\s*[A-Z][a-z]+',  # "City, State"
        r'^[A-Z][a-z]+,\s*[A-Z]{2}$',     # "City, NY"
        r'New York|California|Texas|Florida',
        r'Los Angeles|San Francisco|Miami'
    ]

    return any(re.search(pattern, value) for pattern in location_patterns)

def parse_instant_data_scraper_row(row):
    """
    Parse a single row from Instant Data Scraper export
    Extract: Name, Profile URL, Bio, Location, Member Since
    """

    # Convert to list for easier processing
    values = list(row.values())

    # Initialize result
    result = {
        'name': None,
        'profile_url': None,
        'fb_user_id': None,
        'bio': None,
        'location': None,
        'member_since': None
    }

    # Find profile URL (most reliable anchor)
    for value in values:
        if is_profile_url(value):
            result['profile_url'] = value
            result['fb_user_id'] = extract_fb_user_id(value)
            break

    # If no profile URL found, skip this row
    if not result['profile_url']:
        return None

    # Find name (should appear near profile URL)
    names_found = []
    for value in values:
        if is_name(value):
            names_found.append(value)

    # Take first valid name (usually the member's name, not group name)
    if names_found:
        # Filter out group name "American chopper motorcycle"
        names_found = [n for n in names_found if 'chopper' not in n.lower() and 'motorcycle' not in n.lower()]
        if names_found:
            result['name'] = names_found[0]

    # Find bio/work info
    for value in values:
        if is_bio_info(value):
            result['bio'] = value
            break

    # Find location
    for value in values:
        if is_location(value):
            result['location'] = value
            break

    # Find "Membre depuis" pattern
    for value in values:
        if isinstance(value, str) and 'Membre depuis' in value:
            result['member_since'] = value
            break

    return result

def main():
    if len(sys.argv) < 2:
        print("\n❌ Usage: python parse-instant-data-scraper-fb.py <input.csv>")
        print("\nExample:")
        print("  python parse-instant-data-scraper-fb.py '/Users/mac/Downloads/facebook (5).csv'")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = input_file.replace('.csv', '_cleaned.csv')

    print("="*60)
    print("INSTANT DATA SCRAPER FB - CSV PARSER")
    print("="*60)
    print(f"Input:  {input_file}")
    print(f"Output: {output_file}")
    print()

    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)

            leads = []
            skipped = 0

            for i, row in enumerate(reader):
                if i == 0:
                    # Skip first data row if it's just navigation/header junk
                    if '[object Object]' in str(row.values()):
                        skipped += 1
                        continue

                result = parse_instant_data_scraper_row(row)

                if result and result['name']:
                    leads.append(result)
                else:
                    skipped += 1

            print(f"📊 Parsing Results:")
            print(f"   Total rows: {i + 1}")
            print(f"   Valid leads: {len(leads)}")
            print(f"   Skipped: {skipped}")
            print()

        # Write cleaned CSV
        with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            fieldnames = ['Name', 'Profile URL', 'FB User ID', 'Bio', 'Location', 'Member Since']
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()

            for lead in leads:
                writer.writerow({
                    'Name': lead['name'] or '',
                    'Profile URL': lead['profile_url'] or '',
                    'FB User ID': lead['fb_user_id'] or '',
                    'Bio': lead['bio'] or '',
                    'Location': lead['location'] or '',
                    'Member Since': lead['member_since'] or ''
                })

        print(f"✅ Cleaned CSV created: {output_file}")
        print()
        print(f"📋 Sample data (first 5 leads):")
        for i, lead in enumerate(leads[:5], 1):
            print(f"   {i}. {lead['name']}")
            print(f"      Bio: {lead['bio'][:50] if lead['bio'] else 'N/A'}...")
            print(f"      Location: {lead['location'] or 'N/A'}")
            print()

        print("="*60)
        print("NEXT STEPS:")
        print("="*60)
        print(f"1. Review cleaned CSV: {output_file}")
        print(f"2. Email enrichment:")
        print(f"   python scripts/prepare-fb-leads-for-enrichment.py \\")
        print(f"     '{output_file}' hunter")
        print(f"3. Upload to Hunter.io, get emails")
        print(f"4. Import to Henderson:")
        print(f"   python scripts/import-fb-group-scraping-leads.py \\")
        print(f"     enriched.csv 'American Chopper Motorcycle Group'")
        print("="*60)

    except FileNotFoundError:
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
