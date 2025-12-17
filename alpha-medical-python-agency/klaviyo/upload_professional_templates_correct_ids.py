# Type: agency
# Category: klaviyo
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Upload Professional Templates to Klaviyo with CORRECT IDs
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Klaviyo API configuration - NEVER hardcode API keys!
API_KEY = os.getenv('KLAVIYO_PRIVATE_API_KEY')
if not API_KEY:
    raise ValueError("KLAVIYO_PRIVATE_API_KEY not found in .env - see .env for configuration")
BASE_URL = "https://a.klaviyo.com/api"

HEADERS = {
    "Authorization": f"Klaviyo-API-Key {API_KEY}",
    "revision": "2024-10-15",
    "Content-Type": "application/json"
}

# CORRECT Template IDs (from Klaviyo API)
TEMPLATE_MAPPING = {
    "Cross-Sell Recommendations": "TkM5gz",
    "Repeat Purchase - Ready for Next Order": "X2g6CV",
    "Repeat Purchase Email #2 - Free Shipping Offer": "UAPavP",
    "Review Request - Get 10% OFF": "TXN7Tc",
    "Welcome Email #1 - Welcome + 10% OFF": "RR6t2A",
    "Welcome Email #2 - Education": "VrWe3y",
    "Welcome Email #3 - Best Sellers": "WBm4Vq",
    "Welcome Email #4 - Last Chance Discount": "VYk2iM",
    "Winback Email #1 - We Miss You": "VuMJfS",
    "Winback Email #2 - Last Chance": "WEcz9J"
}

def read_template_html(template_name):
    """Read HTML from generated files"""
    # Map template name to filename
    filename_map = {
        "Cross-Sell Recommendations": "WDQ5dR_Cross-Sell_Recommendations.html",
        "Repeat Purchase - Ready for Next Order": "TXiRXR_Repeat_Purchase_-_Ready_for_Next_Order.html",
        "Repeat Purchase Email #2 - Free Shipping Offer": "RgyqGq_Repeat_Purchase_Email_2_-_Free_Shipping_Offer.html",
        "Review Request - Get 10% OFF": "RxRVQK_Review_Request_-_Get_10%_OFF.html",
        "Welcome Email #1 - Welcome + 10% OFF": "XCMTkd_Welcome_Email_1_-_Welcome_+_10%_OFF.html",
        "Welcome Email #2 - Education": "RCvcc9_Welcome_Email_2_-_Education.html",
        "Welcome Email #3 - Best Sellers": "WZLQHA_Welcome_Email_3_-_Best_Sellers.html",
        "Welcome Email #4 - Last Chance Discount": "QZu9zw_Welcome_Email_4_-_Last_Chance_Discount.html",
        "Winback Email #1 - We Miss You": "RH8sxx_Winback_Email_1_-_We_Miss_You.html",
        "Winback Email #2 - Last Chance": "SfweNL_Winback_Email_2_-_Last_Chance.html"
    }

    filename = filename_map.get(template_name)
    if not filename:
        return None

    filepath = f"klaviyo_templates_professional/{filename}"

    if not os.path.exists(filepath):
        print(f"   ⚠️  File not found: {filepath}")
        return None

    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def update_template(template_id, html_content, template_name):
    """Update template via Klaviyo API"""
    url = f"{BASE_URL}/templates/{template_id}"

    payload = {
        "data": {
            "type": "template",
            "id": template_id,
            "attributes": {
                "html": html_content,
                "name": template_name
            }
        }
    }

    try:
        response = requests.patch(url, headers=HEADERS, json=payload)

        if response.status_code == 200:
            print(f"   ✅ Successfully updated!")
            return True
        else:
            print(f"   ❌ Failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False

    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("📤 UPLOADING PROFESSIONAL TEMPLATES TO KLAVIYO")
    print("=" * 70)
    print(f"\n📋 Updating {len(TEMPLATE_MAPPING)} templates...\n")

    success_count = 0
    failed_count = 0

    for template_name, template_id in sorted(TEMPLATE_MAPPING.items()):
        print(f"\n📤 {template_name}")
        print(f"   ID: {template_id}")

        # Read HTML
        html_content = read_template_html(template_name)

        if not html_content:
            print(f"   ❌ Could not read HTML")
            failed_count += 1
            continue

        print(f"   📄 HTML loaded ({len(html_content)} chars)")

        # Update via API
        success = update_template(template_id, html_content, template_name)

        if success:
            success_count += 1
        else:
            failed_count += 1

    print("\n" + "=" * 70)
    print("📊 UPLOAD RESULTS")
    print("=" * 70)
    print(f"\n✅ Successful: {success_count}/{len(TEMPLATE_MAPPING)}")
    print(f"❌ Failed: {failed_count}/{len(TEMPLATE_MAPPING)}")

    if success_count == len(TEMPLATE_MAPPING):
        print("\n🎉 ALL TEMPLATES UPLOADED SUCCESSFULLY!")
        print("\n✨ IMPROVEMENTS DEPLOYED:")
        print("   ✓ Legal footer with unsubscribe link")
        print("   ✓ Klaviyo dynamic variables ({{ first_name }}, etc.)")
        print("   ✓ Product URLs with UTM tracking")
        print("   ✓ Responsive mobile design")
        print("   ✓ Social proof & trust badges")
        print("   ✓ Professional Alpha Medical branding")
        print("\n🎯 Next Steps:")
        print("   1. Templates are LIVE in your flows! ✅")
        print("   2. Send test email to verify appearance")
        print("   3. Monitor performance in Klaviyo dashboard")
    elif success_count > 0:
        print(f"\n⚠️  {failed_count} templates failed.")
        print("   Check error messages above.")
    else:
        print("\n❌ All uploads failed.")
        print("   Manual upload may be required.")

if __name__ == "__main__":
    main()
