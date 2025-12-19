# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
AUTOMATION AUIDT TOOL
Fetches Webhooks and ScriptTags to identify active apps and automations.
"""

import requests
import json
import os

# Configuration (using token from previous scripts)
SHOPIFY_STORE = "5dc028-dd.myshopify.com"
SHOPIFY_TOKEN = "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"
API_VERSION = "2025-10"

HEADERS = {
    "X-Shopify-Access-Token": SHOPIFY_TOKEN,
    "Content-Type": "application/json"
}

def fetch_resource(resource):
    url = f"https://{SHOPIFY_STORE}/admin/api/{API_VERSION}/{resource}.json"
    try:
        r = requests.get(url, headers=HEADERS)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def main():
    print("🚀 AUTOMATION INFRASTRUCTURE AUDIT")
    print("="*40)
    
    # 1. Webhooks (Triggers for Flow, Node Apps, Omnisend)
    webhooks = fetch_resource("webhooks")
    if "webhooks" in webhooks:
        print(f"\n📡 ACTIVE WEBHOOKS ({len(webhooks['webhooks'])})")
        for w in webhooks['webhooks']:
            print(f"- Topic: {w['topic']}")
            print(f"  Address: {w['address']}")
            print(f"  Format: {w['format']}")
    else:
        print(f"❌ Error fetching webhooks: {webhooks}")

    # 2. ScriptTags (Frontend JS for Apps like Omnisend, Pixels)
    scripts = fetch_resource("script_tags")
    if "script_tags" in scripts:
        print(f"\n📜 ACTIVE SCRIPT TAGS ({len(scripts['script_tags'])})")
        for s in scripts['script_tags']:
            print(f"- Event: {s['event']}")
            print(f"  Src: {s['src']}")
    else:
        print(f"❌ Error fetching script tags: {scripts}")

if __name__ == "__main__":
    main()
