# Type: agency
# Category: shopify
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Automate Legal Compliance Tasks via Shopify Admin API
- Task #1: Terms Age Restriction
- Task #2: Footer Policy Links (Navigation Menu)
- Task #3: Accessibility Statement Page
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load credentials
load_dotenv('.env.admin')

SHOPIFY_ADMIN_ACCESS_TOKEN = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')
SHOPIFY_STORE_DOMAIN = os.getenv('SHOPIFY_STORE_DOMAIN')
API_VERSION = '2025-10'

BASE_URL = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/{API_VERSION}"

HEADERS = {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
    'Content-Type': 'application/json'
}


def task_1_terms_age_restriction():
    """Add age restriction (18+) to Terms of Service"""
    print("\n" + "="*60)
    print("TASK #1: Terms Age Restriction")
    print("="*60)

    # GraphQL query to get current policy
    graphql_url = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/{API_VERSION}/graphql.json"

    # Query to get shop policies
    query = """
    {
      shop {
        termsOfService {
          id
          body
          url
        }
      }
    }
    """

    response = requests.post(
        graphql_url,
        headers=HEADERS,
        json={'query': query}
    )

    if response.status_code != 200:
        print(f"❌ ERROR: Failed to fetch Terms of Service (Status: {response.status_code})")
        print(f"Response: {response.text}")
        return False

    data = response.json()

    if 'errors' in data:
        print(f"❌ GraphQL ERROR: {data['errors']}")
        return False

    current_body = data.get('data', {}).get('shop', {}).get('termsOfService', {}).get('body', '')

    print(f"✅ Current Terms of Service fetched ({len(current_body)} chars)")

    # Check if age restriction already exists
    if "18 years of age" in current_body or "Eligibility" in current_body:
        print("⚠️  Age restriction already exists in Terms of Service")
        print("✅ TASK #1: ALREADY COMPLETE")
        return True

    # Add Eligibility section after "Acceptance of Terms" or at the end
    age_restriction = """

## Eligibility

You must be at least 18 years of age to use this website and purchase products. By using this site, you represent and warrant that you are at least 18 years old. If you are under 18, you may only use this site with the involvement of a parent or guardian."""

    # Find where to insert (after "Acceptance of Terms" or at beginning)
    if "## Acceptance of Terms" in current_body:
        # Find the next section after Acceptance of Terms
        parts = current_body.split("## Acceptance of Terms")
        if len(parts) == 2:
            # Find next ## section
            remaining = parts[1]
            next_section_idx = remaining.find("\n##")
            if next_section_idx != -1:
                new_body = parts[0] + "## Acceptance of Terms" + remaining[:next_section_idx] + age_restriction + remaining[next_section_idx:]
            else:
                # No next section, add at end
                new_body = current_body + age_restriction
        else:
            new_body = current_body + age_restriction
    else:
        # Insert at beginning
        new_body = age_restriction.strip() + "\n\n" + current_body

    # Update via GraphQL mutation
    mutation = """
    mutation shopPolicyUpdate($shopPolicy: ShopPolicyInput!) {
      shopPolicyUpdate(shopPolicy: $shopPolicy) {
        shopPolicy {
          id
          body
        }
        userErrors {
          field
          message
        }
      }
    }
    """

    variables = {
        "shopPolicy": {
            "type": "TERMS_OF_SERVICE",
            "body": new_body
        }
    }

    response = requests.post(
        graphql_url,
        headers=HEADERS,
        json={'query': mutation, 'variables': variables}
    )

    if response.status_code != 200:
        print(f"❌ ERROR: Failed to update Terms of Service (Status: {response.status_code})")
        print(f"Response: {response.text}")
        return False

    result = response.json()

    if 'errors' in result:
        print(f"❌ GraphQL ERROR: {result['errors']}")
        return False

    user_errors = result.get('data', {}).get('shopPolicyUpdate', {}).get('userErrors', [])

    if user_errors:
        print(f"❌ USER ERRORS: {user_errors}")
        return False

    print("✅ Terms of Service updated with age restriction (18+)")
    print("✅ TASK #1: COMPLETE")
    print(f"🔗 Verify at: https://www.alphamedical.shop/policies/terms-of-service")

    return True


def task_2_footer_policy_links():
    """Add 5 policy links to footer menu"""
    print("\n" + "="*60)
    print("TASK #2: Footer Policy Links")
    print("="*60)

    # Step 1: Find or create "Footer menu"
    # Get all menus
    url = f"{BASE_URL}/menus.json"
    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        print(f"❌ ERROR: Failed to fetch menus (Status: {response.status_code})")
        return False

    menus = response.json().get('menus', [])
    footer_menu = None

    for menu in menus:
        if 'footer' in menu.get('title', '').lower():
            footer_menu = menu
            break

    if not footer_menu:
        print("⚠️  Footer menu not found, searching in navigation...")
        # Try navigation API
        nav_url = f"{BASE_URL}/navigation.json"
        # Note: This endpoint might not exist, fallback to creating menu
        print("⚠️  Will need to create footer menu manually or use GraphQL")
        return False

    print(f"✅ Footer menu found: {footer_menu.get('title')} (ID: {footer_menu.get('id')})")

    # Menu items to add
    menu_items = [
        {"title": "Privacy Policy", "url": "/policies/privacy-policy"},
        {"title": "Terms of Service", "url": "/policies/terms-of-service"},
        {"title": "Refund Policy", "url": "/policies/refund-policy"},
        {"title": "Shipping Policy", "url": "/pages/shipping-delivery"},
        {"title": "Accessibility", "url": "/pages/accessibility"}
    ]

    # Note: Shopify Admin API doesn't have direct menu manipulation
    # Need to use GraphQL or manual Shopify Admin
    print("⚠️  NOTE: Menu manipulation requires GraphQL Admin API or Shopify Admin UI")
    print("📋 Menu items to add:")
    for item in menu_items:
        print(f"   - {item['title']}: {item['url']}")

    print("\n✅ TASK #2: MANUAL ACTION REQUIRED")
    print("Use Shopify Admin: Online Store → Navigation → Footer menu")

    return None  # Requires manual action


def task_3_accessibility_statement():
    """Create Accessibility Statement page"""
    print("\n" + "="*60)
    print("TASK #3: Accessibility Statement Page")
    print("="*60)

    # Check if page already exists
    url = f"{BASE_URL}/pages.json"
    response = requests.get(url, headers=HEADERS, params={'title': 'Accessibility Statement'})

    if response.status_code != 200:
        print(f"❌ ERROR: Failed to fetch pages (Status: {response.status_code})")
        return False

    pages = response.json().get('pages', [])

    for page in pages:
        if page.get('title', '').lower() == 'accessibility statement':
            print(f"⚠️  Page already exists: {page.get('title')} (ID: {page.get('id')})")
            print(f"🔗 URL: https://www.alphamedical.shop/pages/{page.get('handle')}")
            print("✅ TASK #3: ALREADY COMPLETE")
            return True

    # Create page
    accessibility_content = """<h1>Accessibility Statement</h1>

<p>Alpha Medical Care is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>

<h2>Conformance Status</h2>
<p>We are committed to WCAG 2.1 Level AA conformance.</p>

<h2>Features</h2>
<ul>
<li>Keyboard navigation support</li>
<li>Screen reader compatibility</li>
<li>Alt text for all images</li>
<li>Clear heading structure</li>
<li>Sufficient color contrast</li>
</ul>

<h2>Feedback</h2>
<p>If you experience any difficulty accessing our site, please contact us:</p>
<ul>
<li>Email: accessibility@alphamedical.shop</li>
<li>Phone: 1-888-XXX-XXXX (TBD)</li>
</ul>

<p>Last updated: December 2025</p>"""

    page_data = {
        "page": {
            "title": "Accessibility Statement",
            "body_html": accessibility_content,
            "published": True,
            "handle": "accessibility"
        }
    }

    response = requests.post(
        f"{BASE_URL}/pages.json",
        headers=HEADERS,
        json=page_data
    )

    if response.status_code not in [200, 201]:
        print(f"❌ ERROR: Failed to create page (Status: {response.status_code})")
        print(f"Response: {response.text}")
        return False

    created_page = response.json().get('page', {})

    print(f"✅ Page created: {created_page.get('title')} (ID: {created_page.get('id')})")
    print(f"🔗 URL: https://www.alphamedical.shop/pages/{created_page.get('handle')}")
    print("✅ TASK #3: COMPLETE")

    return True


def main():
    """Execute all legal compliance tasks"""
    print("\n🚀 AUTOMATING LEGAL COMPLIANCE TASKS")
    print(f"Store: {SHOPIFY_STORE_DOMAIN}")
    print(f"API Version: {API_VERSION}")

    results = {
        "task_1": task_1_terms_age_restriction(),
        "task_2": task_2_footer_policy_links(),
        "task_3": task_3_accessibility_statement()
    }

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Task #1 (Terms Age): {'COMPLETE' if results['task_1'] else 'FAILED'}")
    print(f"⚠️  Task #2 (Footer Links): MANUAL ACTION REQUIRED")
    print(f"✅ Task #3 (Accessibility): {'COMPLETE' if results['task_3'] else 'FAILED'}")
    print("="*60)

    return results


if __name__ == "__main__":
    main()
