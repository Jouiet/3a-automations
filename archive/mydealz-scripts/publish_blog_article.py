# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
MyDealz Blog Article Auto-Publisher
Automates complete article publication to Shopify via Admin API

Usage:
    python3 publish_blog_article.py <article_html_path> <blog_id>

Requirements:
    - .env file with SHOPIFY_ADMIN_API_TOKEN
    - Article HTML file ready
    - requests library (pip install requests)

Output:
    - Article published to Shopify
    - Article ID returned
    - BLOG_IMAGE_TRACKING.md entry template created
"""

import requests
import json
import sys
import os
from pathlib import Path
import re
from datetime import datetime

# Import duplicate checker (OPT-2: Automated Image Duplicate Detection)
try:
    from check_image_duplicates import check_duplicates
    DUPLICATE_CHECKER_AVAILABLE = True
except ImportError:
    DUPLICATE_CHECKER_AVAILABLE = False
    print("⚠️  Warning: check_image_duplicates.py not found - duplicate detection disabled")

class BlogArticlePublisher:
    def __init__(self, api_token, store_url):
        self.api_token = api_token
        self.store_url = store_url
        self.base_url = f"https://{store_url}/admin/api/2025-10"
        self.headers = {
            "X-Shopify-Access-Token": api_token,
            "Content-Type": "application/json"
        }

    def read_article_html(self, file_path):
        """Read article HTML from file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def extract_title(self, html_content):
        """Extract h2 title from HTML"""
        match = re.search(r'<h2>(.*?)</h2>', html_content)
        if match:
            return match.group(1)
        return "Untitled Article"

    def extract_image_urls(self, html_content):
        """Extract all image URLs from HTML"""
        pattern = r'<img src="([^"]+)"'
        return re.findall(pattern, html_content)

    def create_article(self, blog_id, title, body_html, tags=None, published=True,
                      featured_image_url=None, metafields=None):
        """
        Create and publish article via Shopify API

        Args:
            blog_id: Shopify blog ID
            title: Article title
            body_html: Article HTML content
            tags: Comma-separated tags (e.g., "holiday, gifts, budget")
            published: Publish immediately (True) or save as draft (False)
            featured_image_url: URL for featured/cover image
            metafields: Additional metadata

        Returns:
            dict: Article data including ID and URL
        """
        url = f"{self.base_url}/blogs/{blog_id}/articles.json"

        # Build article data
        article_data = {
            "article": {
                "title": title,
                "body_html": body_html,
                "published": published,
                "author": "MyDealz Team"
            }
        }

        # Add optional fields
        if tags:
            article_data["article"]["tags"] = tags

        if featured_image_url:
            article_data["article"]["image"] = {
                "src": featured_image_url
            }

        # Make API request
        try:
            response = requests.post(url, headers=self.headers, json=article_data, timeout=30)
            response.raise_for_status()
            result = response.json()

            article = result.get('article', {})
            article_id = article.get('id')
            handle = article.get('handle')
            blog_handle = self._get_blog_handle(blog_id)

            return {
                'success': True,
                'article_id': article_id,
                'handle': handle,
                'url': f"https://mydealz.shop/blogs/{blog_handle}/{handle}",
                'published_at': article.get('published_at'),
                'image_url': article.get('image', {}).get('src') if article.get('image') else None
            }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'response': response.text if 'response' in locals() else None
            }

    def _get_blog_handle(self, blog_id):
        """Get blog handle from blog ID"""
        try:
            url = f"{self.base_url}/blogs/{blog_id}.json"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('blog', {}).get('handle', 'blog')
        except:
            return 'blog'

    def check_image_duplicates(self, image_urls, cover_image_url=None):
        """
        Check if images are duplicates using automated detection (OPT-2)

        Args:
            image_urls: List of in-article image URLs
            cover_image_url: Optional cover image URL

        Returns:
            tuple: (is_unique, duplicates_list)
        """
        if not DUPLICATE_CHECKER_AVAILABLE:
            print("\n⚠️  DUPLICATE CHECKER NOT AVAILABLE")
            print("   Automated detection disabled - manual verification required")
            return None, []

        # Combine all images to check
        all_images = image_urls.copy()
        if cover_image_url:
            all_images.insert(0, cover_image_url)

        if not all_images:
            print("\n⚠️  NO IMAGES TO CHECK")
            return True, []

        print(f"\n🔍 RUNNING AUTOMATED DUPLICATE DETECTION (OPT-2)...")
        print(f"   Checking {len(all_images)} images against registry...")

        try:
            is_unique, duplicates = check_duplicates(all_images)

            if is_unique:
                print(f"✅ DUPLICATE CHECK: PASSED")
                print(f"   All {len(all_images)} images are unique")
            else:
                print(f"❌ DUPLICATE CHECK: FAILED")
                print(f"   Found {len(duplicates)} duplicate(s):")
                for dup in duplicates:
                    print(f"   - {dup['filename']} (used in: {dup['used_in_article']})")

            return is_unique, duplicates

        except Exception as e:
            print(f"\n⚠️  DUPLICATE CHECK ERROR: {e}")
            print("   Falling back to manual verification")
            return None, []

    def generate_tracking_entry(self, article_id, title, image_urls, cover_image_url, published_date, duplicate_check_status="MANUAL"):
        """
        Generate BLOG_IMAGE_TRACKING.md entry

        Args:
            duplicate_check_status: "PASSED", "FAILED", or "MANUAL"
        """
        entry = f"""### Article: {title}
- **Article ID:** {article_id}
- **Published:** {published_date}
- **Cover Image:** {cover_image_url.split('/')[-1] if cover_image_url else 'N/A'}
- **Cover Image URL:** {cover_image_url if cover_image_url else 'N/A'}
- **In-Article Images:**
"""
        for i, img_url in enumerate(image_urls, 1):
            filename = img_url.split('/')[-1].split('?')[0]
            entry += f"  {i}. `{filename}` - URL: `{img_url}`\n"

        # Generate duplication check status
        if duplicate_check_status == "PASSED":
            dup_line = "- **Duplication Check:** ✅ PASSED (automated check via OPT-2)"
        elif duplicate_check_status == "FAILED":
            dup_line = "- **Duplication Check:** ❌ FAILED (automated check detected duplicates)"
        else:
            dup_line = "- **Duplication Check:** ⚠️ MANUAL VERIFICATION REQUIRED (automated check unavailable)"

        entry += f"""- **Total Images:** {len(image_urls) + (1 if cover_image_url else 0)} images ({1 if cover_image_url else 0} cover + {len(image_urls)} in-article)
{dup_line}
- **Status:** ✅ Published

---
"""
        return entry

    def update_tracking_registry(self, tracking_entry):
        """
        Automatically update BLOG_IMAGE_TRACKING.md with new article entry

        Inserts new entry at the top of the "Image Usage Registry" section
        after the header, before existing articles.

        Args:
            tracking_entry: Generated entry from generate_tracking_entry()

        Returns:
            bool: True if successful, False if error
        """
        tracking_file = Path(__file__).parent.parent / 'docs' / 'BLOG_IMAGE_TRACKING.md'

        if not tracking_file.exists():
            print(f"⚠️  Warning: {tracking_file} not found - skipping automatic update")
            return False

        try:
            # Read current tracking file
            with open(tracking_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find the insertion point (after "## 📋 Image Usage Registry" header)
            registry_header = '## 📋 Image Usage Registry'

            if registry_header not in content:
                print(f"⚠️  Warning: Registry header not found - skipping automatic update")
                return False

            # Split at the registry header
            parts = content.split(registry_header, 1)

            if len(parts) != 2:
                print(f"⚠️  Warning: Could not parse tracking file - skipping automatic update")
                return False

            before_registry = parts[0] + registry_header
            after_registry = parts[1]

            # Find where to insert (after the header section, before first article)
            # Look for the first "### Article" line
            lines = after_registry.split('\n')
            insert_index = 0

            for i, line in enumerate(lines):
                if line.startswith('### Article'):
                    insert_index = i
                    break

            # If no articles found, insert after blank lines following header
            if insert_index == 0:
                for i, line in enumerate(lines):
                    if line.strip() and not line.startswith('#'):
                        insert_index = i
                        break

            # Insert new entry
            new_content = before_registry + '\n' + '\n'.join(lines[:insert_index]) + '\n' + tracking_entry + '\n'.join(lines[insert_index:])

            # Write updated file
            with open(tracking_file, 'w', encoding='utf-8') as f:
                f.write(new_content)

            return True

        except Exception as e:
            print(f"⚠️  Error updating tracking file: {e}")
            return False


def main():
    """Main execution"""
    if len(sys.argv) < 3:
        print("Usage: python3 publish_blog_article.py <article_html_path> <blog_id>")
        print("\nAvailable Blog IDs:")
        print("  96799391941 - MyDealz Infos (infos)")
        print("  96818626757 - MyDealz Insights (insights)")
        sys.exit(1)

    article_path = sys.argv[1]
    blog_id = sys.argv[2]

    # Optional arguments
    tags = sys.argv[3] if len(sys.argv) > 3 else "blog, deals, shopping"
    featured_image_url = sys.argv[4] if len(sys.argv) > 4 else None

    # Load environment
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

    api_token = os.environ.get('SHOPIFY_ADMIN_API_TOKEN')
    store_url = os.environ.get('SHOPIFY_STORE_URL', '5dc028-dd.myshopify.com')

    if not api_token:
        print("❌ Error: SHOPIFY_ADMIN_API_TOKEN not found in environment")
        sys.exit(1)

    # Initialize publisher
    publisher = BlogArticlePublisher(api_token, store_url)

    # Read article
    print(f"📄 Reading article from: {article_path}")
    try:
        html_content = publisher.read_article_html(article_path)
        print(f"✅ Article loaded: {len(html_content)} characters")
    except FileNotFoundError:
        print(f"❌ Error: File not found: {article_path}")
        sys.exit(1)

    # Extract metadata
    title = publisher.extract_title(html_content)
    image_urls = publisher.extract_image_urls(html_content)

    print(f"\n📊 Article Metadata:")
    print(f"  Title: {title}")
    print(f"  In-Article Images: {len(image_urls)}")
    print(f"  Tags: {tags}")
    print(f"  Featured Image: {featured_image_url if featured_image_url else 'Auto-select first in-article image'}")

    # Auto-select featured image if not provided
    if not featured_image_url and image_urls:
        featured_image_url = image_urls[0]
        print(f"  → Auto-selected: {featured_image_url}")

    # OPT-2: Automated Image Duplicate Detection (BEFORE publication)
    is_unique, duplicates = publisher.check_image_duplicates(image_urls, featured_image_url)

    # Block publication if duplicates found
    if is_unique is False:
        print(f"\n❌ PUBLICATION BLOCKED: DUPLICATE IMAGES DETECTED")
        print(f"\n⚠️  ACTION REQUIRED:")
        print(f"   1. Replace {len(duplicates)} duplicate image(s) with unique images")
        print(f"   2. Update article HTML with new image URLs")
        print(f"   3. Re-run this script")
        print(f"\nDuplicate Details:")
        for dup in duplicates:
            print(f"  - {dup['filename']}")
            print(f"    Already used in: {dup['used_in_article']}")
            print(f"    Existing URL: {dup['existing_url']}")
            print()
        sys.exit(1)

    # Determine duplicate check status for tracking entry
    if is_unique is True:
        duplicate_check_status = "PASSED"
    elif is_unique is None:
        duplicate_check_status = "MANUAL"
        print(f"\n⚠️  WARNING: Automated duplicate detection unavailable")
        print(f"   You MUST manually verify images against BLOG_IMAGE_TRACKING.md")
    else:
        duplicate_check_status = "FAILED"

    # Confirm publication
    print(f"\n⚠️  READY TO PUBLISH TO BLOG ID: {blog_id}")
    confirm = input("Proceed with publication? (yes/no): ")

    if confirm.lower() != 'yes':
        print("❌ Publication cancelled")
        sys.exit(0)

    # Publish article
    print(f"\n🚀 Publishing article to Shopify...")
    result = publisher.create_article(
        blog_id=blog_id,
        title=title,
        body_html=html_content,
        tags=tags,
        published=True,
        featured_image_url=featured_image_url
    )

    if result['success']:
        print(f"\n✅ ARTICLE PUBLISHED SUCCESSFULLY!\n")
        print(f"Article ID: {result['article_id']}")
        print(f"URL: {result['url']}")
        print(f"Published: {result['published_at']}")
        print(f"Cover Image: {result['image_url']}")

        # Generate tracking entry
        published_date = datetime.fromisoformat(result['published_at'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
        tracking_entry = publisher.generate_tracking_entry(
            article_id=result['article_id'],
            title=title,
            image_urls=image_urls,
            cover_image_url=result['image_url'],
            published_date=published_date,
            duplicate_check_status=duplicate_check_status
        )

        # Automatically update BLOG_IMAGE_TRACKING.md
        print(f"\n📝 Updating BLOG_IMAGE_TRACKING.md...")
        if publisher.update_tracking_registry(tracking_entry):
            print(f"✅ BLOG_IMAGE_TRACKING.md updated successfully")
            tracking_file = Path(__file__).parent.parent / 'docs' / 'BLOG_IMAGE_TRACKING.md'
            print(f"   Location: {tracking_file}")
        else:
            print(f"⚠️  Automatic update failed - saving backup entry")
            backup_file = Path(__file__).parent.parent / 'docs' / 'BLOG_IMAGE_TRACKING_ENTRY_NEW.md'
            with open(backup_file, 'w') as f:
                f.write(tracking_entry)
            print(f"   Backup saved to: {backup_file}")
            print(f"   ➡️  Manually copy this entry to docs/BLOG_IMAGE_TRACKING.md")

    else:
        print(f"\n❌ PUBLICATION FAILED:\n")
        print(f"Error: {result['error']}")
        if result.get('response'):
            print(f"Response: {result['response']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
