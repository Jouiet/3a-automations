#!/usr/bin/env python3

"""
LINKEDIN LEAD SCORING BY CATEGORY

Score les leads LinkedIn extraits par catégorie de produits.
Classifier en Score A/B/C selon qualité du profil et intent d'achat.

Usage:
    python scripts/score-linkedin-leads-by-category.py tmp/linkedin-members-all.csv
    python scripts/score-linkedin-leads-by-category.py tmp/linkedin-members-helmets.csv --category helmets

Output:
    - linkedin-leads-scored.csv (tous les leads scorés)
    - linkedin-leads-scored-{category}.csv (par catégorie)
    - linkedin-leads-score-report.json (statistiques)
"""

import csv
import json
import sys
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# ============================================================
# CONFIGURATION
# ============================================================

# Zones shipping Henderson Shop (priorité géographique)
SHIPPING_ZONES = {
    'tier1': ['United States', 'Canada'],  # Priorité absolue
    'tier2': ['United Kingdom', 'Germany', 'France', 'Australia'],  # Bon shipping
    'tier3': ['Spain', 'Italy', 'Netherlands', 'Belgium', 'Austria'],  # OK shipping
}

# Mots-clés riding dans bio (signal B2C consommateur)
RIDING_KEYWORDS = [
    'motorcycle', 'motorbike', 'bike', 'rider', 'riding', 'harley', 'honda',
    'yamaha', 'kawasaki', 'suzuki', 'ducati', 'bmw', 'triumph', 'adventure',
    'touring', 'sport bike', 'cruiser', 'chopper', 'scooter', 'off-road',
    'track day', 'weekend rider', 'daily commute', 'long distance',
]

# Mots-clés B2B à exclure (professionnels, pas consommateurs)
B2B_KEYWORDS = [
    'dealer', 'dealership', 'sales manager', 'distributor', 'wholesale',
    'supplier', 'vendor', 'manufacturer', 'ceo', 'founder', 'owner',
    'marketing director', 'sales director', 'business development',
]

# ============================================================
# SCORING LOGIC
# ============================================================

def score_lead(lead: Dict) -> Dict:
    """
    Score un lead LinkedIn selon critères qualité B2C.

    Scoring breakdown (max 100 points):
        - Email présent: 50 points (CRITIQUE)
        - Profil complet: 20 points (company + job title)
        - Location match: 15 points (shipping zones)
        - Bio riding keywords: 10 points
        - LinkedIn actif: 5 points
        - NOT B2B: Bonus/Penalty

    Classification:
        - Score A (80-100): Email + Profile complete + Location match
        - Score B (60-79): Email + Partial profile
        - Score C (40-59): Email only or Profile without email
    """
    score = 0
    signals = []
    warnings = []

    # ========================================
    # 1. EMAIL (50 points) - CRITIQUE
    # ========================================

    email = lead.get('Email', '').strip()
    if email and '@' in email:
        score += 50
        signals.append('email_present')
    else:
        warnings.append('no_email')
        # Sans email, score max = 50 (Score C max)

    # ========================================
    # 2. PROFIL COMPLET (20 points)
    # ========================================

    company = lead.get('Company', '').strip()
    job_title = lead.get('Job Title', '').strip()

    if company and job_title:
        score += 20
        signals.append('profile_complete')
    elif company or job_title:
        score += 10
        signals.append('profile_partial')
    else:
        warnings.append('profile_incomplete')

    # ========================================
    # 3. LOCATION MATCH (15 points)
    # ========================================

    location = lead.get('Location', '').strip()

    if location:
        # Tier 1 (US/Canada): 15 points
        if any(zone in location for zone in SHIPPING_ZONES['tier1']):
            score += 15
            signals.append('location_tier1')

        # Tier 2 (UK/DE/FR/AU): 10 points
        elif any(zone in location for zone in SHIPPING_ZONES['tier2']):
            score += 10
            signals.append('location_tier2')

        # Tier 3 (Other EU): 5 points
        elif any(zone in location for zone in SHIPPING_ZONES['tier3']):
            score += 5
            signals.append('location_tier3')

        else:
            warnings.append('location_outside_zones')
    else:
        warnings.append('no_location')

    # ========================================
    # 4. BIO RIDING KEYWORDS (10 points)
    # ========================================

    bio = lead.get('Bio', '').strip().lower()

    if bio:
        riding_count = sum(1 for keyword in RIDING_KEYWORDS if keyword.lower() in bio)

        if riding_count >= 3:
            score += 10
            signals.append('bio_high_intent')
        elif riding_count >= 1:
            score += 5
            signals.append('bio_moderate_intent')
        else:
            warnings.append('bio_no_riding_keywords')
    else:
        warnings.append('no_bio')

    # ========================================
    # 5. LINKEDIN ACTIF (5 points)
    # ========================================

    # Note: Dans la vraie implémentation, on vérifierait "profileUpdatedDays"
    # Pour l'instant, on donne le bénéfice du doute
    linkedin_url = lead.get('LinkedIn URL', '').strip()
    if linkedin_url:
        score += 5
        signals.append('linkedin_profile_present')

    # ========================================
    # 6. B2B DETECTION (Penalty -20)
    # ========================================

    combined_text = f"{job_title} {bio}".lower()

    b2b_count = sum(1 for keyword in B2B_KEYWORDS if keyword.lower() in combined_text)

    if b2b_count >= 2:
        score -= 20
        warnings.append('likely_b2b_professional')
        signals.append('b2b_detected')

    # ========================================
    # CLASSIFICATION
    # ========================================

    if score >= 80:
        classification = 'A'
        quality = 'High'
    elif score >= 60:
        classification = 'B'
        quality = 'Good'
    elif score >= 40:
        classification = 'C'
        quality = 'Basic'
    else:
        classification = 'D'
        quality = 'Low'

    return {
        'score': max(0, score),  # Minimum 0
        'classification': classification,
        'quality': quality,
        'signals': ','.join(signals),
        'warnings': ','.join(warnings),
    }

# ============================================================
# PROCESS CSV
# ============================================================

def process_linkedin_leads(input_csv: Path, category_filter: Optional[str] = None) -> Dict:
    """Process LinkedIn leads CSV and score each lead."""

    print(f"\n🔍 PROCESSING: {input_csv.name}")
    print("=" * 60)

    if not input_csv.exists():
        print(f"❌ File not found: {input_csv}")
        sys.exit(1)

    # Read CSV
    leads = []
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Filter by category if specified
            if category_filter and row.get('Category', '') != category_filter:
                continue
            leads.append(row)

    print(f"📊 Total leads: {len(leads)}")

    if len(leads) == 0:
        print("⚠️  No leads found")
        return {'leads': [], 'stats': {}}

    # Score each lead
    scored_leads = []

    for lead in leads:
        scoring = score_lead(lead)

        # Merge scoring into lead
        scored_lead = {
            **lead,
            'Score': scoring['score'],
            'Classification': scoring['classification'],
            'Quality': scoring['quality'],
            'Signals': scoring['signals'],
            'Warnings': scoring['warnings'],
            'Scored At': datetime.now().isoformat(),
        }

        scored_leads.append(scored_lead)

    # ========================================
    # STATISTICS
    # ========================================

    stats = calculate_statistics(scored_leads)

    print_statistics(stats)

    return {
        'leads': scored_leads,
        'stats': stats,
    }

def calculate_statistics(scored_leads: List[Dict]) -> Dict:
    """Calculate scoring statistics."""

    total = len(scored_leads)

    # By classification
    by_class = {
        'A': [l for l in scored_leads if l['Classification'] == 'A'],
        'B': [l for l in scored_leads if l['Classification'] == 'B'],
        'C': [l for l in scored_leads if l['Classification'] == 'C'],
        'D': [l for l in scored_leads if l['Classification'] == 'D'],
    }

    # By category
    by_category = {}
    for lead in scored_leads:
        cat = lead.get('Category', 'unknown')
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(lead)

    # Quality metrics
    with_email = len([l for l in scored_leads if l.get('Email', '').strip()])
    with_company = len([l for l in scored_leads if l.get('Company', '').strip()])
    with_location = len([l for l in scored_leads if l.get('Location', '').strip()])

    avg_score = sum(l['Score'] for l in scored_leads) / total if total > 0 else 0

    return {
        'total': total,
        'by_classification': {
            'A': {'count': len(by_class['A']), 'percent': len(by_class['A']) / total * 100 if total > 0 else 0},
            'B': {'count': len(by_class['B']), 'percent': len(by_class['B']) / total * 100 if total > 0 else 0},
            'C': {'count': len(by_class['C']), 'percent': len(by_class['C']) / total * 100 if total > 0 else 0},
            'D': {'count': len(by_class['D']), 'percent': len(by_class['D']) / total * 100 if total > 0 else 0},
        },
        'by_category': {
            cat: len(leads) for cat, leads in by_category.items()
        },
        'quality_metrics': {
            'with_email': {'count': with_email, 'percent': with_email / total * 100 if total > 0 else 0},
            'with_company': {'count': with_company, 'percent': with_company / total * 100 if total > 0 else 0},
            'with_location': {'count': with_location, 'percent': with_location / total * 100 if total > 0 else 0},
        },
        'avg_score': round(avg_score, 1),
        'qualified_leads': len(by_class['A']) + len(by_class['B']),  # Score A+B
        'qualified_percent': (len(by_class['A']) + len(by_class['B'])) / total * 100 if total > 0 else 0,
    }

def print_statistics(stats: Dict):
    """Print statistics to console."""

    print("\n📈 SCORING STATISTICS")
    print("=" * 60)

    print(f"\nTotal leads: {stats['total']:,}")
    print(f"Average score: {stats['avg_score']}")

    print("\n📊 By Classification:")
    for cls in ['A', 'B', 'C', 'D']:
        data = stats['by_classification'][cls]
        print(f"   Score {cls}: {data['count']:,} ({data['percent']:.1f}%)")

    print(f"\n✅ Qualified leads (A+B): {stats['qualified_leads']:,} ({stats['qualified_percent']:.1f}%)")

    print("\n📋 By Category:")
    for cat, count in stats['by_category'].items():
        print(f"   {cat}: {count:,}")

    print("\n🎯 Quality Metrics:")
    for metric, data in stats['quality_metrics'].items():
        print(f"   {metric.replace('_', ' ').title()}: {data['count']:,} ({data['percent']:.1f}%)")

# ============================================================
# SAVE RESULTS
# ============================================================

def save_scored_leads(scored_leads: List[Dict], output_path: Path):
    """Save scored leads to CSV."""

    if len(scored_leads) == 0:
        print("⚠️  No leads to save")
        return

    # Get all fieldnames
    fieldnames = list(scored_leads[0].keys())

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scored_leads)

    print(f"\n💾 Saved: {output_path}")

def save_report(stats: Dict, output_path: Path):
    """Save statistics report to JSON."""

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)

    print(f"💾 Report: {output_path}")

# ============================================================
# MAIN
# ============================================================

def main():
    print("\n🎯 LINKEDIN LEAD SCORING BY CATEGORY")
    print("=" * 60)

    if len(sys.argv) < 2:
        print("\n❌ Usage: python score-linkedin-leads-by-category.py <input_csv>")
        print("\nExample:")
        print("  python scripts/score-linkedin-leads-by-category.py tmp/linkedin-members-all.csv")
        print("  python scripts/score-linkedin-leads-by-category.py tmp/linkedin-members-helmets.csv --category helmets")
        sys.exit(1)

    input_csv = Path(sys.argv[1])

    # Check for category filter
    category_filter = None
    if '--category' in sys.argv:
        idx = sys.argv.index('--category')
        if idx + 1 < len(sys.argv):
            category_filter = sys.argv[idx + 1]
            print(f"\n📂 Category filter: {category_filter}")

    # Process leads
    result = process_linkedin_leads(input_csv, category_filter)

    if len(result['leads']) == 0:
        print("\n⚠️  No leads processed")
        sys.exit(0)

    # ========================================
    # SAVE RESULTS
    # ========================================

    print("\n💾 SAVING RESULTS")
    print("=" * 60)

    output_dir = input_csv.parent
    base_name = input_csv.stem

    # Save scored leads CSV
    if category_filter:
        output_csv = output_dir / f"linkedin-leads-scored-{category_filter}.csv"
    else:
        output_csv = output_dir / f"{base_name}-scored.csv"

    save_scored_leads(result['leads'], output_csv)

    # Save report JSON
    if category_filter:
        report_path = output_dir / f"linkedin-leads-score-report-{category_filter}.json"
    else:
        report_path = output_dir / f"{base_name}-score-report.json"

    save_report(result['stats'], report_path)

    # ========================================
    # ROI PROJECTION
    # ========================================

    print("\n\n💰 ROI PROJECTION")
    print("=" * 60)

    qualified = result['stats']['qualified_leads']
    conversion_rate = 0.015  # 1.5% conservative
    aov = 179  # AOV Henderson Shop

    conversions = int(qualified * conversion_rate)
    revenue = conversions * aov
    cost = 65  # Apify + HubSpot monthly
    profit = revenue - cost
    roi = (profit / cost * 100) if cost > 0 else 0

    print(f"\nQualified leads (A+B):  {qualified:,}")
    print(f"Conversion rate:        {conversion_rate * 100}%")
    print(f"Expected conversions:   {conversions:,}")
    print(f"Revenue (AOV ${aov}):   ${revenue:,}")
    print(f"Cost (monthly):         ${cost}")
    print(f"Profit:                 ${profit:,}")
    print(f"ROI:                    {roi:,.0f}%")

    print("\n\n✅ SCORING COMPLETE!\n")
    print("Next steps:")
    print("1. Review scored leads CSV")
    print("2. Import to Henderson pipeline:")
    print("   python scripts/import-linkedin-leads-by-category.py")
    print("")

if __name__ == '__main__':
    main()
