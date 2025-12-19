# Type: agency
# Category: klaviyo
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Upload Professional Templates to Klaviyo via API
This script will UPDATE existing templates with improved HTML
"""

import requests
import json
import os
import glob
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

def read_template_html(filepath):
    """Read HTML from file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def update_klaviyo_template(template_id, html_content, template_name):
    """Update template via Klaviyo API"""
    print(f"\n📤 Uploading: {template_name} (ID: {template_id})")

    # Extract subject and preview from HTML (they're in the HTML as meta/title)
    subject_line = template_name  # Default
    if "Welcome to Alpha Medical" in html_content:
        subject_line = "Welcome to Alpha Medical! Here's 10% OFF 🎉"
    elif "we miss you" in html_content.lower():
        subject_line = "{{ first_name|default:'Hey' }}, we miss you! 🎯"
    # ... (we'll use defaults)

    # Klaviyo Templates API endpoint
    url = f"{BASE_URL}/templates/{template_id}"

    # Payload for PATCH update
    payload = {
        "data": {
            "type": "template",
            "id": template_id,
            "attributes": {
                "html": html_content
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

    # Get all HTML files
    template_files = glob.glob("klaviyo_templates_professional/*.html")

    if not template_files:
        print("\n❌ No template files found in klaviyo_templates_professional/")
        return

    print(f"\n📁 Found {len(template_files)} template files\n")

    success_count = 0
    failed_count = 0

    for filepath in sorted(template_files):
        filename = os.path.basename(filepath)

        # Extract template ID from filename (format: ID_Name.html)
        if "_" not in filename:
            continue

        template_id = filename.split("_")[0]
        template_name = filename.replace(f"{template_id}_", "").replace(".html", "").replace("_", " ")

        # Read HTML content
        html_content = read_template_html(filepath)

        # Update via API
        success = update_klaviyo_template(template_id, html_content, template_name)

        if success:
            success_count += 1
        else:
            failed_count += 1

    print("\n" + "=" * 70)
    print("📊 UPLOAD RESULTS")
    print("=" * 70)
    print(f"\n✅ Successful: {success_count}/{len(template_files)}")
    print(f"❌ Failed: {failed_count}/{len(template_files)}")

    if success_count == len(template_files):
        print("\n🎉 ALL TEMPLATES UPLOADED SUCCESSFULLY!")
        print("\n🎯 Next Steps:")
        print("   1. Go to https://www.klaviyo.com/email-templates")
        print("   2. Verify templates look correct")
        print("   3. Send test emails to yourself")
        print("   4. Templates are already assigned to LIVE flows! ✅")
    else:
        print("\n⚠️  Some templates failed to upload.")
        print("   Manual upload required via Klaviyo UI.")
        print("   Files are in: klaviyo_templates_professional/")

if __name__ == "__main__":
    main()
