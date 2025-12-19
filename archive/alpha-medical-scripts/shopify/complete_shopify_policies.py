# Type: agency
# Category: shopify
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Complete ALL missing Shopify Policies via Admin API
- Terms of Service
- Shipping Policy
- Contact Information
- Purchase Options Cancellation Policy
"""

import os
import requests
import json
from dotenv import load_dotenv

load_dotenv('.env.admin')

SHOPIFY_ADMIN_ACCESS_TOKEN = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')
SHOPIFY_STORE_DOMAIN = os.getenv('SHOPIFY_STORE_DOMAIN')
API_VERSION = '2025-10'

BASE_URL = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/{API_VERSION}"
graphql_url = f"{BASE_URL}/graphql.json"

HEADERS = {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
    'Content-Type': 'application/json'
}

def check_current_policies():
    """Check current policy status"""
    print("\n" + "="*60)
    print("CHECKING CURRENT POLICY STATUS")
    print("="*60)

    query = """
    {
      shop {
        termsOfService {
          id
          body
          url
        }
        shippingPolicy {
          id
          body
          url
        }
        refundPolicy {
          id
          body
          url
        }
        privacyPolicy {
          id
          body
          url
        }
      }
    }
    """

    response = requests.post(graphql_url, headers=HEADERS, json={'query': query})

    if response.status_code != 200:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
        return None

    data = response.json()

    if 'errors' in data:
        print(f"❌ GraphQL ERROR: {data['errors']}")
        return None

    shop = data.get('data', {}).get('shop', {})

    print(f"\n📋 POLICY STATUS:")
    print(f"  - Terms of Service: {'✅ EXISTS' if shop.get('termsOfService') and shop['termsOfService'].get('body') else '❌ MISSING'}")
    print(f"  - Shipping Policy: {'✅ EXISTS' if shop.get('shippingPolicy') and shop['shippingPolicy'].get('body') else '❌ MISSING'}")
    print(f"  - Refund Policy: {'✅ EXISTS' if shop.get('refundPolicy') and shop['refundPolicy'].get('body') else '❌ MISSING'}")
    print(f"  - Privacy Policy: {'✅ EXISTS' if shop.get('privacyPolicy') and shop['privacyPolicy'].get('body') else '❌ MISSING'}")

    return shop


def update_terms_of_service():
    """Update Terms of Service"""
    print("\n" + "="*60)
    print("UPDATING TERMS OF SERVICE")
    print("="*60)

    terms_content = """# Terms of Service

**Last Updated:** December 2025

## Agreement to Terms

By accessing and using Alpha Medical Care ("we," "us," or "our") website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

## Eligibility

You must be at least 18 years of age to use this website and purchase products. By using this site, you represent and warrant that you are at least 18 years old. If you are under 18, you may only use this site with the involvement of a parent or guardian.

## Use of Service

### Permitted Use
- Browse and purchase medical support products
- Create and manage your account
- Access customer support and resources
- Receive marketing communications (with consent)

### Prohibited Use
- Violate any laws or regulations
- Infringe on intellectual property rights
- Transmit harmful code or malware
- Engage in fraudulent activities
- Resell products without authorization

## Product Information

We strive to provide accurate product descriptions, images, and specifications. However:
- Product colors may vary due to screen settings
- We reserve the right to correct errors
- Products are subject to availability
- Prices may change without notice

## Orders and Payment

### Order Acceptance
- Orders are subject to acceptance and availability
- We reserve the right to refuse or cancel orders
- Payment must be received before shipping

### Pricing
- All prices are in USD
- Prices include applicable taxes where required
- Shipping costs calculated at checkout

## Shipping and Delivery

- Shipping times are estimates only
- We are not responsible for carrier delays
- Risk of loss transfers upon delivery
- See our Shipping Policy for full details

## Returns and Refunds

- 30-day return policy (see Refund Policy)
- Products must be unused and in original condition
- Return shipping costs may apply
- See our Refund Policy for full details

## Medical Disclaimer

**IMPORTANT:** Our products are not intended to diagnose, treat, cure, or prevent any disease or medical condition. They are designed to provide support and comfort only.

- Always consult healthcare professionals
- Products are not substitutes for medical advice
- Individual results may vary
- Read all product instructions carefully

## Intellectual Property

### Our Rights
- All content is owned by Alpha Medical Care
- Trademarks, logos, and designs are protected
- Unauthorized use is prohibited

### Your License
- Limited, non-exclusive, non-transferable license to use
- For personal, non-commercial purposes only
- May not modify, reproduce, or distribute

## Privacy

Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.

## Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW:
- We are not liable for indirect, incidental, or consequential damages
- Our liability is limited to the amount you paid for products
- We do not guarantee uninterrupted or error-free service
- Products are provided "as is" without warranties

## Indemnification

You agree to indemnify and hold harmless Alpha Medical Care from any claims, damages, or expenses arising from:
- Your use of our products or services
- Your violation of these terms
- Your violation of any third-party rights

## Dispute Resolution

### Governing Law
These terms are governed by the laws of the United States and the state where our business is registered.

### Informal Resolution
We encourage you to contact us first to resolve any disputes informally.

### Arbitration
Any disputes not resolved informally shall be resolved through binding arbitration, except where prohibited by law.

## Changes to Terms

We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use constitutes acceptance of the modified terms.

## Severability

If any provision of these terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.

## Contact Us

For questions about these Terms of Service:
- **Email:** support@alphamedical.shop
- **Phone:** 1-888-XXX-XXXX (TBD)
- **Address:** [Business Address - TBD]

## Entire Agreement

These Terms of Service, together with our Privacy Policy, Refund Policy, and Shipping Policy, constitute the entire agreement between you and Alpha Medical Care.

---

**By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.**"""

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
            "body": terms_content
        }
    }

    response = requests.post(graphql_url, headers=HEADERS, json={'query': mutation, 'variables': variables})

    if response.status_code != 200:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
        return False

    result = response.json()

    if 'errors' in result:
        print(f"❌ GraphQL ERROR: {result['errors']}")
        return False

    user_errors = result.get('data', {}).get('shopPolicyUpdate', {}).get('userErrors', [])

    if user_errors:
        print(f"❌ USER ERRORS: {user_errors}")
        return False

    print("✅ Terms of Service updated successfully")
    return True


def update_shipping_policy():
    """Update Shipping Policy"""
    print("\n" + "="*60)
    print("UPDATING SHIPPING POLICY")
    print("="*60)

    shipping_content = """# Shipping & Delivery Policy

**Last Updated:** December 2025

## Shipping Information

### Processing Time
- **Standard Orders:** 1-2 business days
- **Custom Orders:** 2-3 business days
- Orders placed after 2 PM EST ship next business day

### Shipping Methods

**United States:**
- **Standard Shipping:** 5-7 business days - FREE on orders $50+
- **Express Shipping:** 2-3 business days - $9.99
- **Priority Shipping:** 1-2 business days - $19.99

**International Shipping:**
- Currently unavailable - Coming soon
- US domestic shipping only

### Shipping Costs
- Calculated at checkout based on:
  - Order weight and dimensions
  - Delivery address
  - Shipping method selected
- Free standard shipping on orders $50 or more

## Delivery

### Tracking
- Tracking number provided via email once shipped
- Track your order at: [Carrier Website]
- Allow 24 hours for tracking to update

### Delivery Times
Delivery times are **estimates only** and begin after order ships:
- Standard: 5-7 business days
- Express: 2-3 business days
- Priority: 1-2 business days

**Note:** Delivery times do not include processing time.

### Delivery Confirmation
- Signature may be required for high-value orders
- Safe place delivery available (at your risk)
- We are not responsible for stolen packages

## Shipping Restrictions

### We Cannot Ship To:
- PO Boxes (for certain carriers)
- APO/FPO addresses (currently unavailable)
- International addresses (coming soon)

### Product Restrictions
Some products may have additional shipping restrictions due to:
- Size or weight limitations
- Carrier regulations
- State or local laws

## Customs and Duties (International - Future)

When international shipping becomes available:
- Customer responsible for customs fees
- Duties and taxes determined by destination country
- We cannot estimate customs charges
- Refused shipments subject to return fees

## Order Issues

### Lost Packages
- Contact us if package not received within estimated timeframe
- We will work with carrier to locate package
- Replacement or refund issued if package confirmed lost

### Damaged Items
- Inspect package upon delivery
- Report damage within 48 hours
- Photos required for damage claims
- See our Refund Policy for returns

### Wrong Address
- Double-check shipping address at checkout
- We cannot change address once order ships
- Returned packages subject to reshipping fees

### Undeliverable Packages
- Packages returned as undeliverable incur:
  - Return shipping costs
  - Restocking fees (if applicable)
- Refund issued minus fees

## Weather and Delays

We are not responsible for shipping delays due to:
- Weather conditions
- Natural disasters
- Carrier delays or strikes
- Holidays
- Other circumstances beyond our control

## Contact Us

Questions about shipping?
- **Email:** shipping@alphamedical.shop
- **Phone:** 1-888-XXX-XXXX (TBD)
- **Hours:** Monday-Friday, 9 AM - 5 PM EST

---

**For returns and refunds, please see our Refund Policy.**"""

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
            "type": "SHIPPING_POLICY",
            "body": shipping_content
        }
    }

    response = requests.post(graphql_url, headers=HEADERS, json={'query': mutation, 'variables': variables})

    if response.status_code != 200:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
        return False

    result = response.json()

    if 'errors' in result:
        print(f"❌ GraphQL ERROR: {result['errors']}")
        return False

    user_errors = result.get('data', {}).get('shopPolicyUpdate', {}).get('userErrors', [])

    if user_errors:
        print(f"❌ USER ERRORS: {user_errors}")
        return False

    print("✅ Shipping Policy updated successfully")
    return True


def update_contact_information():
    """Update Store Contact Information via Shop API"""
    print("\n" + "="*60)
    print("UPDATING CONTACT INFORMATION")
    print("="*60)

    # Note: Contact info is set via Settings, not policies
    # Using GraphQL to update shop details

    mutation = """
    mutation shopUpdate($input: ShopInput!) {
      shopUpdate(input: $input) {
        shop {
          id
          email
          customerEmail
        }
        userErrors {
          field
          message
        }
      }
    }
    """

    variables = {
        "input": {
            "email": "support@alphamedical.shop",
            "customerEmail": "support@alphamedical.shop"
        }
    }

    response = requests.post(graphql_url, headers=HEADERS, json={'query': mutation, 'variables': variables})

    if response.status_code != 200:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
        print("\n⚠️  Contact Information update may require manual UI configuration")
        print("   Navigate to: Settings → Store details")
        return False

    result = response.json()

    if 'errors' in result:
        print(f"❌ GraphQL ERROR: {result['errors']}")
        print("\n⚠️  Contact Information update may require manual UI configuration")
        return False

    user_errors = result.get('data', {}).get('shopUpdate', {}).get('userErrors', [])

    if user_errors:
        print(f"❌ USER ERRORS: {user_errors}")
        print("\n⚠️  Contact Information update may require manual UI configuration")
        return False

    print("✅ Contact Information updated successfully")
    return True


def update_cancellation_policy():
    """Create Cancellation/Subscription Policy"""
    print("\n" + "="*60)
    print("UPDATING PURCHASE OPTIONS CANCELLATION POLICY")
    print("="*60)

    print("\n⚠️  NOTE: Purchase Options Cancellation Policy is for SUBSCRIPTIONS")
    print("   Alpha Medical does NOT currently offer subscriptions")
    print("   Creating standard cancellation policy for future use\n")

    cancellation_content = """# Purchase Options & Cancellation Policy

**Last Updated:** December 2025

## Order Cancellation

### Before Shipment
You may cancel your order **before it ships** by contacting us immediately:
- **Email:** support@alphamedical.shop
- **Phone:** 1-888-XXX-XXXX (TBD)

**Cancellation Process:**
1. Provide order number and reason for cancellation
2. We will confirm if order can be cancelled
3. Full refund issued within 5-7 business days
4. Cancellation must be requested within 24 hours of order placement

### After Shipment
Once your order has shipped:
- Cancellation is not possible
- You may refuse delivery (return shipping fees apply)
- Or complete our return process (see Refund Policy)

## Subscription Products (Future)

**Note:** We do not currently offer subscription products. When available:

### Subscription Terms
- Monthly or annual billing options
- Automatic renewal unless cancelled
- Cancel anytime before renewal date
- No cancellation fees

### How to Cancel Subscriptions
1. Log in to your account
2. Navigate to "Subscriptions"
3. Select subscription to cancel
4. Click "Cancel Subscription"
5. Confirm cancellation

### Cancellation Timing
- Cancel at least 24 hours before renewal date
- Cancellation effective at end of current billing period
- No refunds for partial periods
- Access continues until period end

### Refunds
- No refunds for cancelled subscriptions (access until period end)
- Exceptions for service issues (contact support)
- Annual subscriptions: Pro-rated refunds within 14 days only

## Digital Products (Future)

**Note:** We do not currently offer digital products. When available:

### Digital Product Cancellation
- Digital products are **non-refundable** once accessed/downloaded
- 14-day refund window for un-accessed products
- Contact support for technical issues

## Custom Orders

### Made-to-Order Products
- Custom orders cannot be cancelled once production begins
- Cancellation possible within 2 hours of order placement
- 50% restocking fee for cancelled custom orders after production starts

## Modification vs Cancellation

### Order Changes
Before cancelling, consider modifying your order:
- Change shipping address
- Update product selections
- Adjust quantities

**Contact us immediately** if you need to modify an order.

## Refunds

For information about refunds after receiving products:
- See our **Refund Policy**
- 30-day return window for most products
- Products must be unused and in original condition

## Force Majeure

We reserve the right to cancel orders in circumstances beyond our control:
- Natural disasters
- Supply chain disruptions
- Product unavailability
- Technical errors in pricing or inventory

**Full refund issued** for orders we cancel.

## Contact Us

Questions about cancellations?
- **Email:** support@alphamedical.shop
- **Phone:** 1-888-XXX-XXXX (TBD)
- **Hours:** Monday-Friday, 9 AM - 5 PM EST

---

**For returns and refunds, please see our Refund Policy.**"""

    # Cancellation policy stored as a page (no specific policy type in GraphQL)
    # Check if page exists first
    pages_url = f"{BASE_URL}/pages.json"
    response = requests.get(pages_url, headers=HEADERS, params={'title': 'Purchase Options Cancellation Policy'})

    if response.status_code == 200:
        pages = response.json().get('pages', [])
        for page in pages:
            if 'cancellation' in page.get('title', '').lower():
                print(f"✅ Cancellation policy page already exists (ID: {page['id']})")
                return True

    # Create page
    page_data = {
        "page": {
            "title": "Purchase Options Cancellation Policy",
            "body_html": cancellation_content.replace('\n', '<br>'),
            "published": True,
            "handle": "cancellation-policy"
        }
    }

    response = requests.post(f"{BASE_URL}/pages.json", headers=HEADERS, json=page_data)

    if response.status_code not in [200, 201]:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
        return False

    created_page = response.json().get('page', {})
    print(f"✅ Cancellation Policy page created (ID: {created_page.get('id')})")
    print(f"🔗 URL: https://www.alphamedical.shop/pages/{created_page.get('handle')}")

    return True


def main():
    """Execute policy completion"""
    print("\n🚀 COMPLETING ALL SHOPIFY POLICIES")
    print(f"Store: {SHOPIFY_STORE_DOMAIN}")
    print(f"API Version: {API_VERSION}")

    # Check current status
    current = check_current_policies()

    # Update policies
    results = {
        "terms": update_terms_of_service(),
        "shipping": update_shipping_policy(),
        "contact": update_contact_information(),
        "cancellation": update_cancellation_policy()
    }

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Terms of Service: {'COMPLETE' if results['terms'] else 'FAILED'}")
    print(f"✅ Shipping Policy: {'COMPLETE' if results['shipping'] else 'FAILED'}")
    print(f"⚠️  Contact Information: {'COMPLETE' if results['contact'] else 'REQUIRES MANUAL UI'}")
    print(f"✅ Cancellation Policy: {'COMPLETE' if results['cancellation'] else 'FAILED'}")
    print("="*60)

    print("\n📝 NEXT STEPS:")
    print("1. Verify policies at: https://admin.shopify.com/store/azffej-as/settings/legal")
    print("2. Check Contact Information at: Settings → Store details")
    print("3. Ensure all policies appear in footer")

    return results


if __name__ == "__main__":
    main()
