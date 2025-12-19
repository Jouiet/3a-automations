# Type: agency
# Category: shopify
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
COMPLETE ALL SHOPIFY POLICIES - FINAL VERSION
Sets ALL required Shopify policies with professional email using correct GraphQL types
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv('.env.admin')

SHOPIFY_ADMIN_ACCESS_TOKEN = os.getenv('SHOPIFY_ADMIN_ACCESS_TOKEN')
SHOPIFY_STORE_DOMAIN = os.getenv('SHOPIFY_STORE_DOMAIN')
API_VERSION = '2025-10'
GRAPHQL_URL = f'https://{SHOPIFY_STORE_DOMAIN}/admin/api/{API_VERSION}/graphql.json'

HEADERS = {
    'X-Shopify-Access-TOKEN': SHOPIFY_ADMIN_ACCESS_TOKEN,
    'Content-Type': 'application/json'
}

PROFESSIONAL_EMAIL = 'contact@alphamedical.shop'


def update_policy(policy_type, content, description):
    """Generic function to update any Shopify policy via GraphQL"""

    mutation = """
    mutation shopPolicyUpdate($shopPolicy: ShopPolicyInput!) {
      shopPolicyUpdate(shopPolicy: $shopPolicy) {
        shopPolicy {
          id
          type
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
            "type": policy_type,
            "body": content
        }
    }

    response = requests.post(
        GRAPHQL_URL,
        headers=HEADERS,
        json={'query': mutation, 'variables': variables}
    )

    result = response.json()

    if 'errors' in result:
        print(f"❌ {description} GraphQL ERROR: {result['errors']}")
        return False

    data = result.get('data', {}).get('shopPolicyUpdate', {})

    if data.get('userErrors'):
        print(f"❌ {description} USER ERRORS: {data['userErrors']}")
        return False

    print(f"✅ {description}: UPDATED")
    return True


def main():
    print("=" * 80)
    print("COMPLETE ALL SHOPIFY POLICIES - FINAL VERSION")
    print("=" * 80)
    print(f"\nProfessional Email: {PROFESSIONAL_EMAIL}\n")

    results = {}

    # 1. TERMS OF SERVICE
    terms_content = f"""# Terms of Service

**Last Updated:** December 2025

## Agreement to Terms

Welcome to Alpha Medical Care ("Company", "we", "our", "us"). By accessing our website at alphamedical.shop and purchasing our products, you agree to be bound by these Terms of Service and all applicable laws and regulations.

## Eligibility

You must be at least 18 years of age to use this website and purchase our products. By using this site, you represent and warrant that you are at least 18 years old.

## Products and Services

Alpha Medical Care specializes in medical equipment including knee braces, posture correctors, and therapy devices. All products are described with accuracy to the best of our ability. We reserve the right to:

- Refuse or cancel any order
- Limit quantities purchased
- Discontinue products at any time
- Change prices without notice

## Contact Information

If you have any questions about these Terms of Service, please contact us:

**Alpha Medical Care**
- Email: {PROFESSIONAL_EMAIL}
- Address: 611 South Dupont Highway Suite 102, Harrington, DE 19901, United States
- Website: alphamedical.shop

**Effective Date:** December 2025
**Last Reviewed:** December 4, 2025
"""
    results["Terms of Service"] = update_policy("TERMS_OF_SERVICE", terms_content, "Terms of Service")

    # 2. SHIPPING POLICY
    shipping_content = f"""# Shipping & Delivery Policy

**Last Updated:** December 2025

## Shipping Information

At Alpha Medical Care, we strive to process and ship your orders as quickly as possible.

### Processing Time

- **Standard Orders:** 1-2 business days
- **Custom/Special Orders:** 3-5 business days

### Shipping Methods & Delivery Times

**Within the United States:**

1. **Standard Shipping** (5-7 business days) - FREE on orders $50+
2. **Express Shipping** (2-3 business days) - $9.99
3. **Priority Shipping** (1-2 business days) - $19.99

## Contact Us

**Alpha Medical Care**
- Email: {PROFESSIONAL_EMAIL}
- Address: 611 South Dupont Highway Suite 102, Harrington, DE 19901, United States
- Website: alphamedical.shop

**Last Reviewed:** December 4, 2025
"""
    results["Shipping Policy"] = update_policy("SHIPPING_POLICY", shipping_content, "Shipping Policy")

    # 3. REFUND POLICY
    refund_content = f"""# Refund Policy

**Last Updated:** December 2025

## 30-Day Return Window

We offer a 30-day return window from the date of delivery for most products.

### Eligibility

- Products must be unopened and unused
- Original packaging required
- Hygiene products are non-returnable
- Proof of purchase required

### Process

1. Contact us at {PROFESSIONAL_EMAIL} within 30 days
2. Provide order number and reason for return
3. Receive return authorization and prepaid label
4. Ship item back within 14 days
5. Refund processed within 5-7 business days of receipt

### Refund Amount

- Product cost: 100% refund
- Original shipping: Non-refundable (unless defective item)
- Return shipping: Customer's responsibility

## Defective or Damaged Items

If you receive a defective or damaged item:

- Contact us at {PROFESSIONAL_EMAIL} within 48 hours
- Provide photos of defect or damage
- Receive prepaid return label
- Full refund including shipping costs

## Contact Information

**Alpha Medical Care**
- Email: {PROFESSIONAL_EMAIL}
- Address: 611 South Dupont Highway Suite 102, Harrington, DE 19901, United States

**Last Reviewed:** December 4, 2025
"""
    results["Refund Policy"] = update_policy("REFUND_POLICY", refund_content, "Refund Policy")

    # 4. SUBSCRIPTION POLICY (Purchase Options Cancellation)
    subscription_content = f"""# Purchase Options & Cancellation Policy

**Last Updated:** December 2025

## Order Cancellation

### Before Shipment

If your order has not yet shipped, you may cancel it for a full refund:

- **Time Window:** Cancel within 24 hours of order placement
- **How to Cancel:** Email {PROFESSIONAL_EMAIL} with your order number
- **Refund:** Full refund to original payment method within 5-7 business days

### After Shipment

Once your order has shipped:

- Cancellation is no longer available
- You may refuse delivery and return to sender
- Standard return policy applies

## Subscription Management

### Future Feature

Alpha Medical Care plans to offer subscription services for regular product deliveries. When available:

- **Cancellation:** Cancel anytime from your account dashboard
- **Pausing:** Pause subscriptions for up to 3 months
- **Frequency Changes:** Modify delivery frequency
- **No Penalties:** No cancellation fees

### Current Status

Subscription services are not yet active. All current purchases are one-time orders.

## Contact Information

**Alpha Medical Care**
- Email: {PROFESSIONAL_EMAIL}
- Address: 611 South Dupont Highway Suite 102, Harrington, DE 19901, United States

**Last Reviewed:** December 4, 2025
"""
    results["Subscription Policy"] = update_policy("SUBSCRIPTION_POLICY", subscription_content, "Subscription Policy (Purchase Options)")

    # SUMMARY
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    for policy, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status}: {policy}")

    success_count = sum(1 for v in results.values() if v)
    total_count = len(results)

    print(f"\n📊 COMPLETION: {success_count}/{total_count} policies updated")

    if success_count == total_count:
        print(f"\n✅ ALL POLICIES COMPLETE with {PROFESSIONAL_EMAIL}")
        print("\n🎯 SHOPIFY ADMIN REQUIREMENTS: 100% SATISFIED")
        return 0
    else:
        print(f"\n⚠️  {total_count - success_count} policies failed")
        return 1


if __name__ == "__main__":
    exit(main())
