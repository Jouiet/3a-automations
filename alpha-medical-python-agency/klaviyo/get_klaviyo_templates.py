# Type: agency
# Category: klaviyo
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Get all Klaviyo templates to find the correct IDs
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

def get_all_templates():
    """Get all templates from Klaviyo"""
    url = f"{BASE_URL}/templates"

    print("🔍 Fetching all templates from Klaviyo...\n")

    try:
        response = requests.get(url, headers=HEADERS)

        if response.status_code == 200:
            data = response.json()
            templates = data.get('data', [])

            print(f"✅ Found {len(templates)} templates:\n")
            print("=" * 80)

            for template in templates:
                template_id = template.get('id')
                attrs = template.get('attributes', {})
                name = attrs.get('name', 'Unnamed')
                created = attrs.get('created', '')
                updated = attrs.get('updated', '')

                print(f"ID: {template_id}")
                print(f"Name: {name}")
                print(f"Created: {created}")
                print(f"Updated: {updated}")
                print("-" * 80)

            return templates

        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Error: {response.text}")
            return []

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return []

if __name__ == "__main__":
    get_all_templates()
