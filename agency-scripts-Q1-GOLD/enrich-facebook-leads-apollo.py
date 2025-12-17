#!/usr/bin/env python3
"""
Enrich Facebook leads with emails using Apollo.io API

Usage:
    # Test with 10 leads first
    python scripts/enrich-facebook-leads-apollo.py \
        --input /Users/mac/Downloads/facebook_MASTER_consolidated.csv \
        --output /Users/mac/Downloads/apollo_enriched_TEST_10.csv \
        --limit 10

    # Full run with 50 credits (after verifying test results)
    python scripts/enrich-facebook-leads-apollo.py \
        --input /Users/mac/Downloads/facebook_MASTER_consolidated.csv \
        --output /Users/mac/Downloads/apollo_enriched_FULL_50.csv \
        --limit 50 \
        --prioritize-domains

Features:
    - Apollo.io API with reveal_personal_emails=true
    - Conservative credit usage (test before full run)
    - Detailed stats reporting
    - Error handling and retry logic
"""

import csv
import json
import os
import sys
import time
import argparse
import requests
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/mac/Desktop/henderson-shopify/.env.local')

APOLLO_API_KEY = os.getenv('APOLLO_API_KEY')
APOLLO_ENDPOINT = 'https://api.apollo.io/api/v1/people/match'


def split_name(full_name: str) -> tuple[str, str]:
    """Split full name into first and last name"""
    if not full_name or not full_name.strip():
        return ("", "")

    parts = full_name.strip().split()

    if len(parts) == 0:
        return ("", "")
    elif len(parts) == 1:
        return (parts[0], "")
    else:
        first_name = parts[0]
        last_name = " ".join(parts[1:])
        return (first_name, last_name)


def extract_domain_from_bio(bio: str) -> Optional[str]:
    """Extract domain from Bio field (simplified version)"""
    import re

    if not bio or not bio.strip():
        return None

    # Look for explicit URLs
    url_pattern = r'https?://(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+)'
    match = re.search(url_pattern, bio)
    if match:
        domain = match.group(1).split('/')[0]
        return domain

    return None


def enrich_person_apollo(
    first_name: str,
    last_name: str,
    company_domain: Optional[str] = None
) -> Dict:
    """
    Call Apollo.io API to enrich person with email

    Args:
        first_name: Person's first name
        last_name: Person's last name
        company_domain: Optional company domain for better matching

    Returns:
        Dict with status, email, confidence, source
    """
    if not APOLLO_API_KEY:
        return {
            'status': 'error',
            'error': 'APOLLO_API_KEY not found in .env.local'
        }

    # Build request parameters
    params = {
        'first_name': first_name,
        'last_name': last_name,
        'reveal_personal_emails': 'true',  # KEY PARAMETER for B2C emails
        'reveal_phone_number': 'false'  # Save credits
    }

    if company_domain:
        params['organization_domain'] = company_domain

    headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': APOLLO_API_KEY,
        'Cache-Control': 'no-cache'
    }

    try:
        response = requests.post(
            APOLLO_ENDPOINT,
            headers=headers,
            params=params,
            timeout=30
        )

        # Handle rate limiting
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            print(f"⚠️  Rate limited. Waiting {retry_after}s...")
            time.sleep(retry_after)
            # Retry once
            response = requests.post(
                APOLLO_ENDPOINT,
                headers=headers,
                params=params,
                timeout=30
            )

        response.raise_for_status()
        data = response.json()

        # Parse response
        person = data.get('person', {})

        # Extract email (prioritize personal, fallback to professional)
        email = person.get('personal_email') or person.get('email')

        if email:
            return {
                'status': 'success',
                'email': email,
                'email_type': 'personal' if person.get('personal_email') else 'professional',
                'phone': person.get('phone_number', ''),
                'linkedin_url': person.get('linkedin_url', ''),
                'title': person.get('title', ''),
                'company': person.get('organization_name', ''),
                'credits_used': 1
            }
        else:
            return {
                'status': 'no_match',
                'credits_used': 1  # Apollo charges even for no match
            }

    except requests.exceptions.HTTPError as e:
        return {
            'status': 'error',
            'error': f"HTTP {e.response.status_code}: {e.response.text[:200]}",
            'credits_used': 0
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)[:200],
            'credits_used': 0
        }


def load_leads(
    input_csv: str,
    limit: int,
    prioritize_domains: bool = False
) -> List[Dict]:
    """
    Load leads from CSV, optionally prioritizing those with domains

    Args:
        input_csv: Path to facebook_MASTER_consolidated.csv
        limit: Max number of leads to load
        prioritize_domains: If True, prioritize leads with Bio (potential domains)

    Returns:
        List of lead dicts
    """
    print(f"📂 Loading leads from {input_csv}...")

    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        all_leads = list(reader)

    print(f"   Total leads available: {len(all_leads)}")

    if prioritize_domains:
        # Separate leads with Bio (potential domains) vs without
        with_bio = [l for l in all_leads if l.get('Bio', '').strip()]
        without_bio = [l for l in all_leads if not l.get('Bio', '').strip()]

        print(f"   With Bio: {len(with_bio)} | Without Bio: {len(without_bio)}")

        # Take from with_bio first, then fill with without_bio
        selected_leads = with_bio[:limit]
        if len(selected_leads) < limit:
            remaining = limit - len(selected_leads)
            selected_leads.extend(without_bio[:remaining])
    else:
        selected_leads = all_leads[:limit]

    print(f"✅ Selected {len(selected_leads)} leads for enrichment\n")

    return selected_leads


def enrich_leads(
    leads: List[Dict],
    output_csv: str
) -> Dict:
    """
    Enrich leads with Apollo.io API and save results

    Args:
        leads: List of lead dicts with Name, Bio fields
        output_csv: Path to save enriched results

    Returns:
        Stats dict
    """
    stats = {
        'total': len(leads),
        'success': 0,
        'no_match': 0,
        'errors': 0,
        'credits_used': 0,
        'personal_emails': 0,
        'professional_emails': 0
    }

    results = []

    print(f"🚀 Starting enrichment ({len(leads)} leads)...\n")

    for i, lead in enumerate(leads, 1):
        # Extract name
        full_name = lead.get('Name', '').strip()
        first_name, last_name = split_name(full_name)

        if not first_name:
            print(f"[{i}/{len(leads)}] ⚠️  Skipping (no name): {full_name}")
            stats['errors'] += 1
            continue

        # Extract domain from Bio
        bio = lead.get('Bio', '')
        company_domain = extract_domain_from_bio(bio)

        # Call Apollo API
        print(f"[{i}/{len(leads)}] 🔍 {first_name} {last_name}", end='')
        if company_domain:
            print(f" @ {company_domain}", end='')
        print("...", end=' ', flush=True)

        result = enrich_person_apollo(first_name, last_name, company_domain)

        # Update stats
        stats['credits_used'] += result.get('credits_used', 0)

        if result['status'] == 'success':
            stats['success'] += 1
            email_type = result.get('email_type', 'unknown')

            if email_type == 'personal':
                stats['personal_emails'] += 1
                print(f"✅ {result['email']} (personal)")
            else:
                stats['professional_emails'] += 1
                print(f"✅ {result['email']} (pro)")

        elif result['status'] == 'no_match':
            stats['no_match'] += 1
            print("❌ No match")

        else:  # error
            stats['errors'] += 1
            error_msg = result.get('error', 'Unknown error')[:50]
            print(f"⚠️  Error: {error_msg}")

        # Build result row
        result_row = {
            'name': full_name,
            'first_name': first_name,
            'last_name': last_name,
            'company_domain': company_domain or '',
            'email': result.get('email', ''),
            'email_type': result.get('email_type', ''),
            'phone': result.get('phone', ''),
            'linkedin_url': result.get('linkedin_url', ''),
            'title': result.get('title', ''),
            'company': result.get('company', ''),
            'profile_url': lead.get('Profile URL', ''),
            'fb_user_id': lead.get('FB User ID', ''),
            'bio': bio,
            'location': lead.get('Location', ''),
            'status': result['status'],
            'error': result.get('error', '')
        }

        results.append(result_row)

        # Rate limiting: pause between requests (Apollo free tier limits)
        if i < len(leads):
            time.sleep(1.5)  # Conservative: ~40 requests/minute

    # Save results to CSV
    print(f"\n💾 Saving results to {output_csv}...")

    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        fieldnames = [
            'name', 'first_name', 'last_name', 'company_domain',
            'email', 'email_type', 'phone', 'linkedin_url',
            'title', 'company', 'profile_url', 'fb_user_id',
            'bio', 'location', 'status', 'error'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    return stats


def print_stats(stats: Dict):
    """Print enrichment statistics"""
    total = stats['total']
    success = stats['success']
    success_rate = (success / total * 100) if total > 0 else 0

    print("\n" + "="*60)
    print("📊 ENRICHMENT RESULTS")
    print("="*60)
    print(f"Total leads processed:  {total}")
    print(f"✅ Emails found:         {success} ({success_rate:.1f}%)")
    print(f"   - Personal emails:   {stats['personal_emails']}")
    print(f"   - Professional:      {stats['professional_emails']}")
    print(f"❌ No match:             {stats['no_match']}")
    print(f"⚠️  Errors:               {stats['errors']}")
    print(f"\n💳 Credits used:         {stats['credits_used']}")

    # Extrapolation to 6,059 leads
    if success_rate > 0:
        total_fb_leads = 6059
        expected_emails = int(total_fb_leads * (success_rate / 100))
        expected_revenue = expected_emails * 0.015 * 179  # 1.5% CR, $179 AOV

        print(f"\n📈 EXTRAPOLATION (6,059 total FB leads):")
        print(f"   Expected emails:     {expected_emails:,}")
        print(f"   Expected revenue:    ${expected_revenue:,.0f}")
        print(f"   (Assuming {success_rate:.1f}% success, 1.5% CR, $179 AOV)")

    # Decision guidance
    print(f"\n🎯 RECOMMENDATION:")
    if success_rate >= 30:
        print("   ✅ EXCELLENT - Continue with remaining credits")
        print(f"   Use --limit 50 --prioritize-domains for best ROI")
    elif success_rate >= 20:
        print("   ✅ GOOD - Acceptable for free tier")
        print(f"   Consider upgrading if results valuable")
    elif success_rate >= 10:
        print("   ⚠️  MODERATE - Evaluate cost/benefit")
        print(f"   Test with domains-only leads for better results")
    else:
        print("   ❌ LOW - Consider alternative strategies")
        print(f"   Focus on SEO/Content marketing instead")

    print("="*60 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='Enrich Facebook leads with Apollo.io API'
    )
    parser.add_argument(
        '--input',
        required=True,
        help='Path to facebook_MASTER_consolidated.csv'
    )
    parser.add_argument(
        '--output',
        required=True,
        help='Path to output enriched CSV'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=10,
        help='Max number of leads to enrich (default: 10)'
    )
    parser.add_argument(
        '--prioritize-domains',
        action='store_true',
        help='Prioritize leads with Bio field (potential domains)'
    )

    args = parser.parse_args()

    # Verify API key
    if not APOLLO_API_KEY:
        print("❌ ERROR: APOLLO_API_KEY not found in .env.local")
        print("   Please add: APOLLO_API_KEY=your_key_here")
        sys.exit(1)

    # Load leads
    leads = load_leads(args.input, args.limit, args.prioritize_domains)

    if not leads:
        print("❌ No leads to enrich")
        sys.exit(1)

    # Enrich leads
    stats = enrich_leads(leads, args.output)

    # Print stats
    print_stats(stats)

    print(f"✅ Results saved to: {args.output}")
    print(f"📊 Import to Shopify/Klaviyo for email marketing\n")


if __name__ == "__main__":
    main()
