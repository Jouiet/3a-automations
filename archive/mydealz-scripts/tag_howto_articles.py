# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Tag Instructional Articles for HowTo Schema

Automatically identifies and tags articles that contain how-to/guide content
based on title analysis. The HowTo schema will then render automatically.

Usage:
  python3 scripts/tag_howto_articles.py [--dry-run]

Options:
  --dry-run  Show which articles would be tagged without actually tagging them
"""

import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

SHOPIFY_STORE = os.getenv('SHOPIFY_STORE_URL', '5dc028-dd.myshopify.com')
SHOPIFY_TOKEN = os.getenv('SHOPIFY_ADMIN_API_TOKEN')

BASE_URL = f"https://{SHOPIFY_STORE}/admin/api/2024-10"
HEADERS = {
    'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    'Content-Type': 'application/json'
}

# Keywords that indicate how-to/instructional content
HOWTO_KEYWORDS = [
    'how to', 'how-to', 'guide to', 'complete guide',
    'ultimate guide', 'tutorial', 'step by step',
    'steps to', 'strategy', 'tips for', 'how mydealz'
]

def get_all_articles():
    """Fetch all blog articles from Shopify"""

    all_articles = []
    url = f"{BASE_URL}/articles.json"
    params = {'limit': 250}

    print("📥 Fetching articles from Shopify...")

    while url:
        response = requests.get(url, headers=HEADERS, params=params)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return []

        data = response.json()
        articles = data.get('articles', [])
        all_articles.extend(articles)

        print(f"   Found {len(articles)} articles...")

        # Check for pagination
        link_header = response.headers.get('Link', '')
        if 'rel="next"' in link_header:
            # Extract next URL from Link header
            next_url = None
            for link in link_header.split(','):
                if 'rel="next"' in link:
                    next_url = link.split('<')[1].split('>')[0]
                    break
            url = next_url
            params = None  # URL already contains params
        else:
            break

    print(f"✅ Total articles fetched: {len(all_articles)}\n")
    return all_articles

def should_have_howto_schema(article):
    """Determine if article should have HowTo schema based on title"""

    title = article.get('title', '').lower()

    for keyword in HOWTO_KEYWORDS:
        if keyword in title:
            return True

    return False

def has_howto_tag(article):
    """Check if article already has a how-to related tag"""

    tags = article.get('tags', '').lower()

    howto_tags = ['how-to', 'guide', 'tutorial', 'step-by-step']

    for tag in howto_tags:
        if tag in tags:
            return True

    return False

def tag_article(article_id, current_tags, dry_run=False):
    """Add 'how-to' tag to article"""

    # Parse existing tags
    tags_list = [t.strip() for t in current_tags.split(',') if t.strip()]

    # Add 'how-to' if not present
    if 'how-to' not in [t.lower() for t in tags_list]:
        tags_list.append('how-to')

    new_tags = ', '.join(tags_list)

    if dry_run:
        print(f"   [DRY RUN] Would tag article {article_id}")
        return True

    # Update article via API
    url = f"{BASE_URL}/articles/{article_id}.json"
    payload = {
        "article": {
            "id": article_id,
            "tags": new_tags
        }
    }

    response = requests.put(url, headers=HEADERS, json=payload)

    if response.status_code == 200:
        print(f"   ✅ Tagged successfully")
        return True
    else:
        print(f"   ❌ Tagging failed: {response.status_code}")
        return False

def main():
    dry_run = '--dry-run' in sys.argv

    print("=" * 70)
    print("HOWTO ARTICLE TAGGING")
    print("=" * 70)
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
    print()

    articles = get_all_articles()

    if not articles:
        print("❌ No articles found")
        return 1

    # Analyze articles
    howto_candidates = []
    already_tagged = []
    regular_articles = []

    for article in articles:
        if should_have_howto_schema(article):
            if has_howto_tag(article):
                already_tagged.append(article)
            else:
                howto_candidates.append(article)
        else:
            regular_articles.append(article)

    # Report
    print(f"📊 Analysis Results:")
    print(f"   Total articles: {len(articles)}")
    print(f"   Already tagged: {len(already_tagged)}")
    print(f"   Need tagging: {len(howto_candidates)}")
    print(f"   Regular articles: {len(regular_articles)}\n")

    if already_tagged:
        print(f"✅ Already tagged articles ({len(already_tagged)}):")
        for article in already_tagged:
            print(f"   - {article['title']}")
        print()

    if howto_candidates:
        print(f"🏷️  Articles to tag ({len(howto_candidates)}):")
        for article in howto_candidates:
            print(f"\n   📝 {article['title']}")
            print(f"      ID: {article['id']}")
            print(f"      Current tags: {article.get('tags', 'None')}")

            success = tag_article(article['id'], article.get('tags', ''), dry_run)

        print()

    if not howto_candidates:
        print("✅ All instructional articles are already tagged!\n")

    print("=" * 70)
    print("TAGGING COMPLETE")
    print("=" * 70)
    print("\n📋 HowTo Schema will now render on tagged articles")
    print("⏰ Cache: Wait 5-10 minutes for schema to appear")
    print("🧪 Test: curl -s [article-url] | grep '\"@type\": \"HowTo\"'")

    return 0

if __name__ == "__main__":
    exit(main())
