# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Article Compliance Validator for MyDealz Blog
Validates articles against BLOG_METHODOLOGY.md standards BEFORE publication.

Created: 2025-10-28
Purpose: Prevent non-compliant articles from being published (learned from test article audit)
Usage: python3 validate_article_compliance.py <article_html_file>
"""

import sys
import re
from pathlib import Path

class ArticleValidator:
    """Validates blog article HTML against BLOG_METHODOLOGY.md requirements"""

    def __init__(self, html_content):
        self.html = html_content
        self.violations = []
        self.warnings = []
        self.compliant_items = []

    def validate_all(self):
        """Run all validation checks"""
        self.check_html_wrapper()
        self.check_heading_hierarchy()
        self.check_content_length()
        self.check_product_links()
        self.check_cta_buttons()
        self.check_image_templates()
        self.check_brand_colors()
        self.check_alt_text()

        return {
            'compliant': len(self.violations) == 0,
            'violations': self.violations,
            'warnings': self.warnings,
            'compliant_items': self.compliant_items,
            'compliance_score': self._calculate_score()
        }

    def check_html_wrapper(self):
        """CRITICAL: Check for <div class="blog-post"> wrapper"""
        if not re.search(r'<div[^>]*class=["\']blog-post["\'][^>]*>', self.html):
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'HTML Wrapper (MANDATORY)',
                'violation': 'Missing <div class="blog-post"> wrapper',
                'fix': 'Wrap entire article content in <div class="blog-post">...</div>',
                'reference': 'BLOG_METHODOLOGY.md Line 54-60'
            })
        else:
            self.compliant_items.append('HTML wrapper present ✅')

    def check_heading_hierarchy(self):
        """Check h2 (1 required) and h3 (5-10 required) counts"""
        h2_count = len(re.findall(r'<h2[^>]*>', self.html))
        h3_count = len(re.findall(r'<h3[^>]*>', self.html))

        if h2_count != 1:
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'H2 Title (1 Required)',
                'violation': f'Found {h2_count} h2 tags (need exactly 1)',
                'fix': 'Ensure article has exactly ONE h2 main title',
                'reference': 'BLOG_METHODOLOGY.md Line 77'
            })
        else:
            self.compliant_items.append(f'H2 title count: {h2_count} ✅')

        if h3_count < 5:
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'H3 Sections (5-10 Required)',
                'violation': f'Only {h3_count} h3 sections (minimum 5)',
                'fix': 'Add more major sections to meet minimum requirement',
                'reference': 'BLOG_METHODOLOGY.md Line 78'
            })
        elif h3_count > 10:
            self.warnings.append({
                'severity': 'MINOR',
                'rule': 'H3 Sections (5-10 Recommended)',
                'issue': f'{h3_count} h3 sections (maximum 10 recommended)',
                'suggestion': 'Consider consolidating sections',
                'reference': 'BLOG_METHODOLOGY.md Line 78'
            })
        else:
            self.compliant_items.append(f'H3 section count: {h3_count} ✅')

    def check_content_length(self):
        """Check article length (10,000-20,000 chars)"""
        length = len(self.html)

        if length < 10000:
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'Content Length (10,000-20,000 chars)',
                'violation': f'Article only {length:,} characters (minimum 10,000)',
                'fix': 'Expand content to meet minimum length requirement',
                'reference': 'BLOG_METHODOLOGY.md Line 276-278'
            })
        elif length > 20000:
            self.warnings.append({
                'severity': 'MINOR',
                'rule': 'Content Length (10,000-20,000 chars)',
                'issue': f'Article {length:,} characters (maximum 20,000 recommended)',
                'suggestion': 'Consider reducing length or splitting into multiple articles',
                'reference': 'BLOG_METHODOLOGY.md Line 276-278'
            })
        else:
            self.compliant_items.append(f'Content length: {length:,} chars ✅')

    def check_product_links(self):
        """CRITICAL: Check product link count (8-15 required)"""
        # Find all mydealz.shop/products/ links
        product_links = re.findall(r'href=["\']https://mydealz\.shop/products/([^"\']+)["\']', self.html)
        unique_products = set(product_links)
        unique_count = len(unique_products)

        if unique_count < 8:
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'Product Links (8-15 Required)',
                'violation': f'Only {unique_count} unique product links (minimum 8)',
                'fix': f'Add {8 - unique_count} more unique product links throughout article',
                'reference': 'BLOG_METHODOLOGY.md Line 368'
            })
        elif unique_count > 15:
            self.warnings.append({
                'severity': 'MINOR',
                'rule': 'Product Links (8-15 Recommended)',
                'issue': f'{unique_count} product links (maximum 15 recommended)',
                'suggestion': 'Consider reducing number of product links',
                'reference': 'BLOG_METHODOLOGY.md Line 368'
            })
        else:
            self.compliant_items.append(f'Product links: {unique_count} unique ✅')

    def check_cta_buttons(self):
        """CRITICAL: Check CTA button count (3 required) with #040462"""
        # Find CTA buttons with correct styling
        cta_buttons = re.findall(
            r'<a[^>]*background-color:\s*#040462[^>]*>.*?</a>',
            self.html,
            re.DOTALL
        )

        if len(cta_buttons) < 3:
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'CTA Buttons (3 Required with #040462)',
                'violation': f'Only {len(cta_buttons)} CTA buttons with correct styling (need 3)',
                'fix': 'Add CTA buttons (early, mid, end) styled with background-color: #040462',
                'reference': 'BLOG_METHODOLOGY.md Line 191-204'
            })
        else:
            self.compliant_items.append(f'CTA buttons: {len(cta_buttons)} ✅')

    def check_image_templates(self):
        """CRITICAL: Check image HTML template compliance"""
        # Find all <img> tags
        img_tags = re.findall(r'<img[^>]+>', self.html)

        violations_found = []
        for img in img_tags:
            # Check for required attributes
            has_lazy = 'loading="lazy"' in img or "loading='lazy'" in img
            has_style = 'style=' in img
            has_border_radius = 'border-radius' in img
            has_box_shadow = 'box-shadow' in img

            if not (has_lazy and has_style and has_border_radius and has_box_shadow):
                violations_found.append(img[:100] + '...')

        # Check for wrapper
        wrapped_images = re.findall(
            r'<p[^>]*text-align:\s*center[^>]*>\s*<img[^>]+>\s*</p>',
            self.html
        )

        if violations_found or len(wrapped_images) != len(img_tags):
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'Image HTML Template (MANDATORY)',
                'violation': f'{len(violations_found)} images missing required template formatting',
                'fix': 'Use mandatory template: <p style="text-align: center; margin: 30px 0;"><img style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" loading="lazy" /></p>',
                'reference': 'BLOG_METHODOLOGY.md Line 627-634'
            })
        else:
            self.compliant_items.append(f'Image templates: {len(img_tags)} compliant ✅')

    def check_brand_colors(self):
        """CRITICAL: Check for wrong brand colors"""
        wrong_colors = []

        # Check for Bootstrap blue (#007bff)
        if re.search(r'#007bff', self.html, re.IGNORECASE):
            wrong_colors.append('#007bff (Bootstrap blue - should be #040462)')

        # Check for generic gray (#f0f0f0)
        if re.search(r'#f0f0f0', self.html, re.IGNORECASE):
            wrong_colors.append('#f0f0f0 (generic gray - should be #E0E0FF)')

        if wrong_colors:
            self.violations.append({
                'severity': 'CRITICAL',
                'rule': 'Brand Colors (MANDATORY: #040462 and #E0E0FF)',
                'violation': f'Wrong colors used: {", ".join(wrong_colors)}',
                'fix': 'Replace #007bff → #040462 and #f0f0f0 → #E0E0FF',
                'reference': 'BLOG_METHODOLOGY.md Line 227-235'
            })
        else:
            self.compliant_items.append('Brand colors: Correct ✅')

    def check_alt_text(self):
        """Check alt text length (50-125 chars)"""
        alt_texts = re.findall(r'alt=["\']([^"\']+)["\']', self.html)

        violations_found = []
        for alt in alt_texts:
            if len(alt) < 50:
                violations_found.append(f'Too short ({len(alt)} chars): "{alt[:50]}..."')
            elif len(alt) > 125:
                violations_found.append(f'Too long ({len(alt)} chars): "{alt[:50]}..."')

        if violations_found:
            self.warnings.append({
                'severity': 'MINOR',
                'rule': 'Alt Text Length (50-125 chars)',
                'issue': f'{len(violations_found)} images with non-optimal alt text',
                'suggestion': 'Adjust alt text to 50-125 character range',
                'reference': 'BLOG_METHODOLOGY.md Line 652-654'
            })
        else:
            self.compliant_items.append(f'Alt text: {len(alt_texts)} compliant ✅')

    def _calculate_score(self):
        """Calculate compliance percentage"""
        total_checks = len(self.violations) + len(self.warnings) + len(self.compliant_items)
        if total_checks == 0:
            return 0
        return int((len(self.compliant_items) / total_checks) * 100)


def print_validation_report(result):
    """Print formatted validation report"""
    print("\n" + "="*80)
    print("📋 ARTICLE COMPLIANCE VALIDATION REPORT")
    print("="*80 + "\n")

    # Compliance status
    if result['compliant']:
        print("✅ COMPLIANCE STATUS: PASSED")
        print(f"   Score: {result['compliance_score']}%\n")
    else:
        print("❌ COMPLIANCE STATUS: FAILED")
        print(f"   Score: {result['compliance_score']}%")
        print(f"   Violations: {len(result['violations'])} critical")
        print(f"   Warnings: {len(result['warnings'])} minor\n")

    # Critical violations
    if result['violations']:
        print("🔴 CRITICAL VIOLATIONS (Must Fix Before Publishing):")
        print("-" * 80)
        for i, v in enumerate(result['violations'], 1):
            print(f"\n{i}. {v['rule']}")
            print(f"   Violation: {v['violation']}")
            print(f"   Fix: {v['fix']}")
            print(f"   Reference: {v['reference']}")
        print()

    # Warnings
    if result['warnings']:
        print("\n🟡 WARNINGS (Recommended Fixes):")
        print("-" * 80)
        for i, w in enumerate(result['warnings'], 1):
            print(f"\n{i}. {w['rule']}")
            print(f"   Issue: {w['issue']}")
            print(f"   Suggestion: {w['suggestion']}")
            print(f"   Reference: {w['reference']}")
        print()

    # Compliant items
    if result['compliant_items']:
        print("\n✅ COMPLIANT ITEMS:")
        print("-" * 80)
        for item in result['compliant_items']:
            print(f"   {item}")
        print()

    # Summary
    print("="*80)
    if result['compliant']:
        print("🚀 READY FOR PUBLICATION")
    else:
        print("⛔ NOT READY - FIX VIOLATIONS BEFORE PUBLISHING")
    print("="*80 + "\n")


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 validate_article_compliance.py <article_html_file>")
        print("Example: python3 validate_article_compliance.py /tmp/article.html")
        sys.exit(1)

    html_file = Path(sys.argv[1])

    if not html_file.exists():
        print(f"❌ Error: File not found: {html_file}")
        sys.exit(1)

    try:
        html_content = html_file.read_text(encoding='utf-8')
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)

    # Run validation
    validator = ArticleValidator(html_content)
    result = validator.validate_all()

    # Print report
    print_validation_report(result)

    # Exit with appropriate code
    sys.exit(0 if result['compliant'] else 1)


if __name__ == '__main__':
    main()
