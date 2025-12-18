#!/usr/bin/env python3
"""
Convert Facebook leads to Emailsearch.io CSV format

Usage:
    python scripts/convert-fb-leads-to-emailsearch-format.py \
        --input /Users/mac/Downloads/facebook_MASTER_consolidated.csv \
        --output /Users/mac/Downloads/facebook_emailsearch_upload.csv \
        --extract-domains

Features:
    - Splits full names into first/last
    - Extracts company domains from Bio (optional)
    - Validates name quality
    - Generates Emailsearch.io compatible CSV
"""

import csv
import re
import argparse
from typing import Optional, Tuple


def split_name(full_name: str) -> Tuple[str, str]:
    """
    Split full name into first and last name.

    Examples:
        "John Smith" -> ("John", "Smith")
        "Jean-Pierre Dupont" -> ("Jean-Pierre", "Dupont")
        "John" -> ("John", "")
    """
    if not full_name or not full_name.strip():
        return ("", "")

    parts = full_name.strip().split()

    if len(parts) == 0:
        return ("", "")
    elif len(parts) == 1:
        return (parts[0], "")
    else:
        # First word = first_name, rest = last_name
        first_name = parts[0]
        last_name = " ".join(parts[1:])
        return (first_name, last_name)


def extract_company_domain(bio: str) -> Optional[str]:
    """
    Extract company domain from Bio text.

    Patterns matched:
        - "CEO at Company" -> company.com
        - "Works at Company Inc" -> company.com
        - "Founder, Company" -> company.com
        - URLs in bio -> extract domain

    Returns:
        Domain string (e.g., "company.com") or None
    """
    if not bio or not bio.strip():
        return None

    bio = bio.strip()

    # Pattern 1: Extract explicit URLs
    url_pattern = r'https?://(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+)'
    url_match = re.search(url_pattern, bio)
    if url_match:
        domain = url_match.group(1)
        # Clean up (remove trailing slashes, paths)
        domain = domain.split('/')[0]
        return domain

    # Pattern 2: Company mentions
    company_patterns = [
        r'(?:CEO|Founder|Owner|Director|Manager)\s+(?:at|@|à|chez)\s+([A-Za-z0-9\s&\'-]+?)(?:\s*[,\.]|$)',
        r'(?:Works?|Travaille|Working)\s+(?:at|@|à|chez)\s+([A-Za-z0-9\s&\'-]+?)(?:\s*[,\.]|$)',
        r'(?:Company|Entreprise|Company):\s*([A-Za-z0-9\s&\'-]+?)(?:\s*[,\.]|$)',
    ]

    for pattern in company_patterns:
        match = re.search(pattern, bio, re.IGNORECASE)
        if match:
            company_name = match.group(1).strip()

            # Filter out non-company terms
            excluded = [
                'self employed', 'self-employed', 'freelance', 'independent',
                'retired', 'unemployed', 'student', 'n/a', 'none'
            ]

            if company_name.lower() not in excluded and len(company_name) > 2:
                # Convert company name to domain guess
                # "LVMH" -> "lvmh.com"
                # "Business Tech" -> "businesstech.com"
                domain_guess = company_name.lower()
                domain_guess = re.sub(r'[^a-z0-9]', '', domain_guess)  # Remove spaces, special chars

                if len(domain_guess) > 2:
                    return f"{domain_guess}.com"

    return None


def convert_to_emailsearch_format(
    input_csv: str,
    output_csv: str,
    extract_domains: bool = False
) -> dict:
    """
    Convert Facebook leads CSV to Emailsearch.io format.

    Args:
        input_csv: Path to facebook_MASTER_consolidated.csv
        output_csv: Path to output CSV for Emailsearch.io upload
        extract_domains: Whether to extract domains from Bio (default: False)

    Returns:
        Stats dictionary with conversion metrics
    """
    stats = {
        'total_leads': 0,
        'valid_names': 0,
        'with_domain': 0,
        'without_domain': 0,
        'skipped': 0
    }

    output_rows = []

    print(f"Reading {input_csv}...")

    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            stats['total_leads'] += 1

            # Extract full name
            full_name = row.get('Name', '').strip()

            if not full_name:
                stats['skipped'] += 1
                continue

            # Split name
            first_name, last_name = split_name(full_name)

            if not first_name:
                stats['skipped'] += 1
                continue

            stats['valid_names'] += 1

            # Extract domain if requested
            company_domain = ""
            if extract_domains:
                bio = row.get('Bio', '')
                domain = extract_company_domain(bio)
                if domain:
                    company_domain = domain
                    stats['with_domain'] += 1
                else:
                    stats['without_domain'] += 1
            else:
                stats['without_domain'] += 1

            # Build output row (Emailsearch.io format)
            output_rows.append({
                'first_name': first_name,
                'last_name': last_name,
                'company_domain': company_domain,
                '': ''  # Trailing empty column (format quirk)
            })

    # Write output CSV
    print(f"Writing {output_csv}...")

    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        # Header with trailing comma (matches example format)
        fieldnames = ['first_name', 'last_name', 'company_domain', '']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    return stats


def main():
    parser = argparse.ArgumentParser(
        description='Convert Facebook leads to Emailsearch.io format'
    )
    parser.add_argument(
        '--input',
        required=True,
        help='Path to facebook_MASTER_consolidated.csv'
    )
    parser.add_argument(
        '--output',
        required=True,
        help='Path to output CSV for Emailsearch.io'
    )
    parser.add_argument(
        '--extract-domains',
        action='store_true',
        help='Extract company domains from Bio field'
    )

    args = parser.parse_args()

    # Convert
    stats = convert_to_emailsearch_format(
        args.input,
        args.output,
        extract_domains=args.extract_domains
    )

    # Print stats
    print("\n" + "="*50)
    print("CONVERSION COMPLETE")
    print("="*50)
    print(f"Total leads:         {stats['total_leads']}")
    print(f"Valid names:         {stats['valid_names']} ({stats['valid_names']/stats['total_leads']*100:.1f}%)")
    print(f"Skipped (no name):   {stats['skipped']}")

    if args.extract_domains:
        print(f"\nDomain Extraction:")
        print(f"  With domain:       {stats['with_domain']} ({stats['with_domain']/stats['valid_names']*100:.1f}%)")
        print(f"  Without domain:    {stats['without_domain']} ({stats['without_domain']/stats['valid_names']*100:.1f}%)")

    print(f"\n✅ Output saved to: {args.output}")
    print(f"📤 Ready for upload to Emailsearch.io")


if __name__ == "__main__":
    main()
