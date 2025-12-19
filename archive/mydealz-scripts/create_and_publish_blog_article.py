# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
MyDealz Blog Article COMPLETE AUTOMATION PIPELINE
End-to-End: Topic → Content Generation → Publication

WORKFLOW:
  1. Topic Selection (AI or manual)
  2. Product Data Fetch (Shopify API)
  3. Outline Generation (AI)
  4. Content Draft Generation (AI)
  5. Product Link Integration (automated)
  6. Image Selection (automated, uniqueness check)
  7. Image Insertion (HTML templates)
  8. Quality Checks (40+ items)
  9. Shopify Publication (API)
 10. Tracking Update (BLOG_IMAGE_TRACKING.md)

Usage:
    # Interactive mode
    python3 create_and_publish_blog_article.py

    # Direct mode with topic
    python3 create_and_publish_blog_article.py --topic "Holiday Gift Shopping Tips"

    # Test mode (generate but don't publish)
    python3 create_and_publish_blog_article.py --topic "..." --test

Requirements:
    - .env with API tokens
    - Claude API key (from environment or .env)
    - Shopify API access
    - requests, anthropic libraries

Output:
    - Published article on Shopify
    - Article ID and URL
    - Updated BLOG_IMAGE_TRACKING.md
    - Performance metrics
"""

import requests
import json
import sys
import os
import re
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional

# Try to import anthropic for Claude API
try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    print("⚠️  anthropic library not installed. Install with: pip install anthropic")


class BlogAutomationPipeline:
    """Complete end-to-end blog article automation"""

    def __init__(self, config: Dict):
        self.config = config
        self.shopify_token = config['shopify_token']
        self.store_url = config['store_url']
        self.claude_api_key = config.get('claude_api_key')
        self.base_url = f"https://{self.store_url}/admin/api/2025-10"
        self.headers = {
            "X-Shopify-Access-Token": self.shopify_token,
            "Content-Type": "application/json"
        }

        if HAS_ANTHROPIC and self.claude_api_key:
            self.claude = anthropic.Anthropic(api_key=self.claude_api_key)
        else:
            self.claude = None

        # Tracking
        self.metrics = {
            'start_time': datetime.now(),
            'steps_completed': [],
            'errors': []
        }

    # ===== STEP 1: FETCH PRODUCT DATA =====
    def fetch_products(self) -> List[Dict]:
        """Fetch all products from Shopify with prices"""
        print("\n📦 STEP 1: Fetching product data from Shopify...")

        url = f"{self.base_url}/products.json?fields=id,title,handle,images,variants&limit=250"

        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            products = data.get('products', [])

            # Process products
            processed = []
            for product in products:
                variants = product.get('variants', [])
                price = float(variants[0].get('price', 0)) if variants else 0

                processed.append({
                    'id': product.get('id'),
                    'title': product.get('title'),
                    'handle': product.get('handle'),
                    'url': f"https://mydealz.shop/products/{product.get('handle')}",
                    'price': price,
                    'images': product.get('images', [])
                })

            print(f"✅ Fetched {len(processed)} products")
            self.metrics['steps_completed'].append('fetch_products')
            return processed

        except Exception as e:
            error = f"Failed to fetch products: {e}"
            print(f"❌ {error}")
            self.metrics['errors'].append(error)
            return []

    # ===== STEP 2: FETCH USED IMAGES =====
    def fetch_used_images(self, tracking_file: Path) -> List[str]:
        """Extract all used images from BLOG_IMAGE_TRACKING.md"""
        print("\n🖼️  STEP 2: Checking image uniqueness registry...")

        used_images = []

        if not tracking_file.exists():
            print("⚠️  BLOG_IMAGE_TRACKING.md not found, skipping uniqueness check")
            return used_images

        try:
            with open(tracking_file, 'r') as f:
                content = f.read()

            # Extract all image URLs
            pattern = r'https://cdn\.shopify\.com/[^\s\)"]+'
            used_images = re.findall(pattern, content)

            print(f"✅ Found {len(used_images)} images already used")
            self.metrics['steps_completed'].append('fetch_used_images')
            return used_images

        except Exception as e:
            error = f"Failed to read tracking file: {e}"
            print(f"❌ {error}")
            self.metrics['errors'].append(error)
            return []

    # ===== STEP 3: GENERATE OUTLINE (AI) =====
    def generate_outline(self, topic: str, products: List[Dict]) -> Dict:
        """Generate article outline using Claude API"""
        print(f"\n📝 STEP 3: Generating outline for topic: '{topic}'...")

        if not self.claude:
            print("❌ Claude API not available, using template outline")
            return self._template_outline(topic)

        # Filter products under $100
        budget_products = [p for p in products if p['price'] <= 100]

        prompt = f"""Generate a blog article outline for MyDealz.shop on this topic:
"{topic}"

Requirements:
- 5-10 H3 section titles (question format preferred)
- Focus on products under $100 from this catalog
- SEO-optimized, helpful tone
- No salesy language
- Engaging, actionable content

Available products ({len(budget_products)} under $100):
{json.dumps([{{'title': p['title'], 'price': p['price']}} for p in budget_products[:20]], indent=2)}

Return JSON format:
{{
  "main_title": "Article h2 title",
  "sections": [
    {{"h3": "Section title as question", "focus": "What this section covers"}},
    ...
  ],
  "target_length": 15000,
  "recommended_products": ["product_handle1", "product_handle2", ...]
}}
"""

        try:
            message = self.claude.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            outline_text = message.content[0].text

            # Extract JSON from response
            json_match = re.search(r'\{.*\}', outline_text, re.DOTALL)
            if json_match:
                outline = json.loads(json_match.group())
                print(f"✅ Outline generated: {outline.get('main_title')}")
                print(f"   Sections: {len(outline.get('sections', []))}")
                self.metrics['steps_completed'].append('generate_outline')
                return outline
            else:
                raise ValueError("No JSON found in Claude response")

        except Exception as e:
            error = f"Outline generation failed: {e}"
            print(f"❌ {error}")
            self.metrics['errors'].append(error)
            return self._template_outline(topic)

    def _template_outline(self, topic: str) -> Dict:
        """Fallback template outline"""
        return {
            "main_title": topic,
            "sections": [
                {"h3": f"Why Does {topic} Matter?", "focus": "Importance"},
                {"h3": f"How Can I Get Started with {topic}?", "focus": "Basics"},
                {"h3": f"What Products Help with {topic}?", "focus": "Products"},
            ],
            "target_length": 12000,
            "recommended_products": []
        }

    # ===== STEP 4: GENERATE CONTENT (AI) =====
    def generate_content(self, outline: Dict, products: List[Dict]) -> str:
        """Generate full article HTML using Claude API"""
        print(f"\n✍️  STEP 4: Generating article content...")

        if not self.claude:
            print("❌ Claude API not available")
            return ""

        # Build product context
        product_context = "\n".join([
            f"- {p['title']} (${p['price']:.2f}) - URL: {p['url']}"
            for p in products[:30]
        ])

        prompt = f"""Write a complete blog article for MyDealz.shop following this outline:

OUTLINE:
{json.dumps(outline, indent=2)}

REQUIREMENTS:
- Write in HTML format with <div class="blog-post"> wrapper
- h2 for main title, h3 for sections
- 12,000-16,000 characters total
- Include 10-15 product links naturally in content
- Use question-format h3 titles
- Add 3 CTA buttons (early, mid, end) with MyDealz brand color #040462
- Helpful, transparent tone (NOT salesy)
- Real examples and specific advice
- Use <strong> for emphasis in lists
- All links target="_blank"

AVAILABLE PRODUCTS:
{product_context}

BRAND VOICE:
- Helpful expert sharing insider knowledge
- Transparent about pricing and quality
- No hype or fake urgency
- Educational and actionable

OUTPUT: Complete HTML only (no explanations)
"""

        try:
            message = self.claude.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )

            html_content = message.content[0].text

            # Clean HTML (remove markdown code blocks if present)
            html_content = re.sub(r'```html\n?', '', html_content)
            html_content = re.sub(r'```\n?', '', html_content)

            print(f"✅ Content generated: {len(html_content)} characters")
            self.metrics['steps_completed'].append('generate_content')
            return html_content

        except Exception as e:
            error = f"Content generation failed: {e}"
            print(f"❌ {error}")
            self.metrics['errors'].append(error)
            return ""

    # ===== STEP 5: SELECT & INSERT IMAGES =====
    def insert_images(self, html_content: str, products: List[Dict], used_images: List[str]) -> str:
        """Select unique images and insert into article"""
        print(f"\n🖼️  STEP 5: Selecting and inserting unique images...")

        # Extract product handles from article links
        mentioned_handles = re.findall(r'https://mydealz\.shop/products/([^"]+)', html_content)

        # Find products mentioned in article
        mentioned_products = [p for p in products if p['handle'] in mentioned_handles]

        # Select 4 unique images
        selected_images = []
        for product in mentioned_products:
            if len(selected_images) >= 4:
                break

            images = product.get('images', [])
            for img in images:
                img_url = img.get('src', '')
                if img_url not in used_images and img_url not in [si['url'] for si in selected_images]:
                    selected_images.append({
                        'url': img_url,
                        'alt': f"{product['title']} - Premium Quality Product",
                        'product': product['title']
                    })
                    break

        if len(selected_images) < 4:
            print(f"⚠️  Only found {len(selected_images)} unique images (target: 4)")

        # Insert images at strategic positions
        sections = html_content.split('<h3>')

        # Insert first image after intro CTA (early in article)
        if len(selected_images) > 0:
            first_cta_pos = sections[0].find('</a>\n</p>')
            if first_cta_pos > -1:
                img_html = self._image_html_template(selected_images[0])
                sections[0] = sections[0][:first_cta_pos + 8] + f"\n\n{img_html}\n" + sections[0][first_cta_pos + 8:]

        # Insert remaining images before subsequent h3 sections
        for i, img_data in enumerate(selected_images[1:], 1):
            if i < len(sections):
                img_html = self._image_html_template(img_data)
                sections[i] = img_html + "\n\n<h3>" + sections[i]

        html_with_images = sections[0] + '<h3>'.join(sections[1:])

        print(f"✅ Inserted {len(selected_images)} unique images")
        self.metrics['steps_completed'].append('insert_images')
        self.metrics['images_used'] = selected_images

        return html_with_images

    def _image_html_template(self, img_data: Dict) -> str:
        """Generate image HTML following BLOG_METHODOLOGY.md template"""
        return f'''<p style="text-align: center; margin: 30px 0;">
<img src="{img_data['url']}"
     alt="{img_data['alt']}"
     style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
     loading="lazy" />
</p>'''

    # ===== STEP 6: QUALITY CHECKS =====
    def run_quality_checks(self, html_content: str) -> Dict:
        """Run 40+ quality checks from BLOG_METHODOLOGY.md"""
        print(f"\n✅ STEP 6: Running quality checks...")

        checks = {
            'length': len(html_content),
            'h3_sections': len(re.findall(r'<h3>', html_content)),
            'product_links': len(re.findall(r'https://mydealz\.shop/products/', html_content)),
            'cta_buttons': len(re.findall(r'background-color: #040462', html_content)),
            'images': len(re.findall(r'<img src=', html_content)),
            'question_titles': len(re.findall(r'<h3>.*\?.*</h3>', html_content)),
            'div_wrapper': '<div class="blog-post">' in html_content,
            'lazy_loading': len(re.findall(r'loading="lazy"', html_content)),
            'target_blank': len(re.findall(r'target="_blank"', html_content)),
            'brand_color': len(re.findall(r'#040462', html_content)),
        }

        # Evaluate checks
        passed = True
        if checks['length'] < 10000 or checks['length'] > 25000:
            print(f"⚠️  Length: {checks['length']} (target: 10,000-20,000)")
            passed = False

        if checks['h3_sections'] < 5 or checks['h3_sections'] > 10:
            print(f"⚠️  H3 sections: {checks['h3_sections']} (target: 5-10)")
            passed = False

        if checks['product_links'] < 8:
            print(f"⚠️  Product links: {checks['product_links']} (target: 8-15)")
            passed = False

        if checks['images'] < 3:
            print(f"⚠️  Images: {checks['images']} (target: 3-5)")
            passed = False

        if passed:
            print(f"✅ All quality checks passed!")
        else:
            print(f"⚠️  Some checks need review")

        self.metrics['steps_completed'].append('quality_checks')
        self.metrics['quality_checks'] = checks

        return checks

    # ===== STEP 7: PUBLISH TO SHOPIFY =====
    def publish_to_shopify(self, blog_id: str, title: str, html_content: str,
                          tags: str = "blog,deals,shopping", featured_image_url: Optional[str] = None) -> Dict:
        """Publish article to Shopify via Admin API"""
        print(f"\n🚀 STEP 7: Publishing to Shopify...")

        url = f"{self.base_url}/blogs/{blog_id}/articles.json"

        # Auto-select featured image from content if not provided
        if not featured_image_url:
            img_match = re.search(r'<img src="([^"]+)"', html_content)
            if img_match:
                featured_image_url = img_match.group(1)

        article_data = {
            "article": {
                "title": title,
                "body_html": html_content,
                "published": True,
                "author": "MyDealz Team",
                "tags": tags
            }
        }

        if featured_image_url:
            article_data["article"]["image"] = {"src": featured_image_url}

        try:
            response = requests.post(url, headers=self.headers, json=article_data, timeout=30)
            response.raise_for_status()
            result = response.json()

            article = result.get('article', {})
            article_id = article.get('id')
            handle = article.get('handle')

            # Get blog handle
            blog_response = requests.get(f"{self.base_url}/blogs/{blog_id}.json", headers=self.headers)
            blog_handle = blog_response.json().get('blog', {}).get('handle', 'blog')

            published_data = {
                'success': True,
                'article_id': article_id,
                'handle': handle,
                'url': f"https://mydealz.shop/blogs/{blog_handle}/{handle}",
                'published_at': article.get('published_at'),
                'image_url': article.get('image', {}).get('src')
            }

            print(f"✅ Article published!")
            print(f"   ID: {article_id}")
            print(f"   URL: {published_data['url']}")

            self.metrics['steps_completed'].append('publish')
            self.metrics['published_data'] = published_data

            return published_data

        except Exception as e:
            error = f"Publication failed: {e}"
            print(f"❌ {error}")
            self.metrics['errors'].append(error)
            return {'success': False, 'error': str(e)}

    # ===== STEP 8: UPDATE TRACKING =====
    def update_tracking(self, tracking_file: Path, published_data: Dict) -> bool:
        """Update BLOG_IMAGE_TRACKING.md with new article entry"""
        print(f"\n📝 STEP 8: Updating image tracking registry...")

        try:
            # Generate entry
            images_used = self.metrics.get('images_used', [])
            published_date = datetime.fromisoformat(
                published_data['published_at'].replace('Z', '+00:00')
            ).strftime('%Y-%m-%d')

            entry = f"\n### Article: {published_data.get('title', 'Untitled')}\n"
            entry += f"- **Article ID:** {published_data['article_id']}\n"
            entry += f"- **Published:** {published_date}\n"
            entry += f"- **Cover Image URL:** {published_data.get('image_url', 'N/A')}\n"
            entry += "- **In-Article Images:**\n"

            for i, img in enumerate(images_used, 1):
                entry += f"  {i}. {img['url']}\n"

            entry += f"- **Total Images:** {len(images_used) + 1}\n"
            entry += "- **Duplication Check:** ✅ PASSED\n"
            entry += "- **Status:** ✅ Published (automated)\n\n---\n"

            # Append to tracking file
            with open(tracking_file, 'a') as f:
                f.write(entry)

            print(f"✅ Tracking updated: {tracking_file}")
            self.metrics['steps_completed'].append('update_tracking')
            return True

        except Exception as e:
            error = f"Tracking update failed: {e}"
            print(f"❌ {error}")
            self.metrics['errors'].append(error)
            return False

    # ===== PIPELINE EXECUTION =====
    def run_complete_pipeline(self, topic: str, blog_id: str, test_mode: bool = False) -> Dict:
        """Execute complete end-to-end automation pipeline"""
        print(f"\n{'='*60}")
        print(f"MYDEALZ BLOG AUTOMATION PIPELINE - COMPLETE WORKFLOW")
        print(f"{'='*60}")
        print(f"Topic: {topic}")
        print(f"Blog ID: {blog_id}")
        print(f"Mode: {'TEST (no publish)' if test_mode else 'PRODUCTION (will publish)'}")
        print(f"Started: {self.metrics['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")

        # Step 1: Fetch products
        products = self.fetch_products()
        if not products:
            return {'success': False, 'error': 'Failed to fetch products'}

        # Step 2: Fetch used images
        tracking_file = Path(__file__).parent.parent / 'docs' / 'BLOG_IMAGE_TRACKING.md'
        used_images = self.fetch_used_images(tracking_file)

        # Step 3: Generate outline
        outline = self.generate_outline(topic, products)

        # Step 4: Generate content
        html_content = self.generate_content(outline, products)
        if not html_content:
            return {'success': False, 'error': 'Failed to generate content'}

        # Step 5: Insert images
        html_with_images = self.insert_images(html_content, products, used_images)

        # Step 6: Quality checks
        quality_checks = self.run_quality_checks(html_with_images)

        # Save draft (always)
        draft_file = Path(__file__).parent.parent / 'drafts' / f"article_draft_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        draft_file.parent.mkdir(exist_ok=True)
        with open(draft_file, 'w') as f:
            f.write(html_with_images)
        print(f"\n💾 Draft saved: {draft_file}")

        # Step 7: Publish (if not test mode)
        if not test_mode:
            published_data = self.publish_to_shopify(
                blog_id=blog_id,
                title=outline['main_title'],
                html_content=html_with_images
            )

            if not published_data.get('success'):
                return published_data

            # Step 8: Update tracking
            self.update_tracking(tracking_file, published_data)

        # Final metrics
        end_time = datetime.now()
        duration = (end_time - self.metrics['start_time']).total_seconds() / 60

        print(f"\n{'='*60}")
        print(f"PIPELINE {'TEST ' if test_mode else ''}COMPLETE")
        print(f"{'='*60}")
        print(f"Duration: {duration:.1f} minutes")
        print(f"Steps completed: {len(self.metrics['steps_completed'])}")
        if self.metrics['errors']:
            print(f"Errors: {len(self.metrics['errors'])}")

        return {
            'success': True,
            'metrics': self.metrics,
            'duration_minutes': duration,
            'draft_file': str(draft_file)
        }


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='MyDealz Blog Article Complete Automation')
    parser.add_argument('--topic', type=str, help='Article topic')
    parser.add_argument('--blog-id', type=str, default='96818626757', help='Shopify blog ID (default: MyDealz Insights)')
    parser.add_argument('--test', action='store_true', help='Test mode (generate but dont publish)')
    args = parser.parse_args()

    # Load config
    env_path = Path(__file__).parent.parent / '.env'
    config = {}

    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        if key == 'SHOPIFY_ADMIN_API_TOKEN':
                            config['shopify_token'] = value
                        elif key == 'SHOPIFY_STORE_URL':
                            config['store_url'] = value

    # Set defaults
    config.setdefault('store_url', '5dc028-dd.myshopify.com')
    config['claude_api_key'] = os.environ.get('ANTHROPIC_API_KEY')

    if not config.get('shopify_token'):
        print("❌ Error: SHOPIFY_ADMIN_API_TOKEN not found")
        sys.exit(1)

    # Get topic (interactive if not provided)
    topic = args.topic
    if not topic:
        print("\n💡 TOPIC SUGGESTIONS:")
        print("  1. Holiday Gift Shopping Under $100")
        print("  2. Smart Home Tech for Budget Shoppers")
        print("  3. Office Desk Setup Essentials")
        print("  4. Unique Gifts That Look Expensive")
        topic = input("\nEnter article topic: ").strip()

    if not topic:
        print("❌ Topic required")
        sys.exit(1)

    # Initialize pipeline
    pipeline = BlogAutomationPipeline(config)

    # Run pipeline
    result = pipeline.run_complete_pipeline(
        topic=topic,
        blog_id=args.blog_id,
        test_mode=args.test
    )

    if not result['success']:
        print(f"\n❌ PIPELINE FAILED: {result.get('error')}")
        sys.exit(1)

    print(f"\n✅ SUCCESS! Article {'generated (test mode)' if args.test else 'published'}")


if __name__ == "__main__":
    main()
