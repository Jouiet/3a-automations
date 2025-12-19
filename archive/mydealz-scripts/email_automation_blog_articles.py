# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Email Automation for Blog Articles
Checks for new blog articles and sends automated emails to subscribers

Usage:
    python3 scripts/email_automation_blog_articles.py [--dry-run] [--force-send ARTICLE_ID]

Environment Variables Required:
    SHOPIFY_ADMIN_API_TOKEN - Shopify Admin API access token
    SHOPIFY_STORE_URL - Store URL (e.g., 5dc028-dd.myshopify.com)
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent
TRACKING_FILE = BASE_DIR / 'data' / 'email_sent_articles.json'

# Shopify API Configuration
SHOPIFY_ADMIN_API_TOKEN = os.getenv('SHOPIFY_ADMIN_API_TOKEN')
SHOPIFY_STORE_URL = os.getenv('SHOPIFY_STORE_URL', '5dc028-dd.myshopify.com')
SHOPIFY_API_VERSION = os.getenv('SHOPIFY_API_VERSION', '2025-10')

if not SHOPIFY_ADMIN_API_TOKEN:
    logger.error("❌ SHOPIFY_ADMIN_API_TOKEN not found in environment")
    sys.exit(1)

# API Endpoints
SHOPIFY_GRAPHQL_URL = f'https://{SHOPIFY_STORE_URL}/admin/api/{SHOPIFY_API_VERSION}/graphql.json'
SHOPIFY_REST_URL = f'https://{SHOPIFY_STORE_URL}/admin/api/{SHOPIFY_API_VERSION}'

# Headers
HEADERS = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN
}


def load_tracking_data():
    """Load tracking data for sent emails"""
    if not TRACKING_FILE.exists():
        logger.info("📂 No tracking file found, creating new one")
        TRACKING_FILE.parent.mkdir(parents=True, exist_ok=True)
        return {'sent_articles': [], 'last_check': None}

    with open(TRACKING_FILE, 'r') as f:
        return json.load(f)


def save_tracking_data(data):
    """Save tracking data"""
    TRACKING_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TRACKING_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    logger.info(f"💾 Tracking data saved to {TRACKING_FILE}")


def get_blog_articles():
    """Fetch all blog articles from Shopify using REST API"""
    import re

    try:
        # First, get all blogs
        blogs_response = requests.get(
            f'{SHOPIFY_REST_URL}/blogs.json',
            headers=HEADERS,
            timeout=30
        )
        blogs_response.raise_for_status()
        blogs = blogs_response.json().get('blogs', [])

        logger.info(f"📚 Found {len(blogs)} blog(s)")

        # Then fetch articles from each blog
        all_articles = []
        for blog in blogs:
            blog_id = blog['id']
            blog_handle = blog['handle']

            articles_response = requests.get(
                f'{SHOPIFY_REST_URL}/blogs/{blog_id}/articles.json',
                headers=HEADERS,
                params={'limit': 250},  # Max limit
                timeout=30
            )
            articles_response.raise_for_status()
            articles = articles_response.json().get('articles', [])

            for article in articles:
                # Extract excerpt from body_html (first 200 chars, strip HTML)
                excerpt = article.get('summary_html', '')
                if not excerpt and article.get('body_html'):
                    text = re.sub(r'<[^>]+>', '', article['body_html'])
                    excerpt = text[:200].strip()
                    if len(text) > 200:
                        excerpt += "..."

                # Construct public URL
                store_domain = SHOPIFY_STORE_URL.replace('.myshopify.com', '.shop')
                article_url = f"https://{store_domain}/blogs/{blog_handle}/{article['handle']}"

                all_articles.append({
                    'id': str(article['id']),
                    'title': article['title'],
                    'handle': article['handle'],
                    'published_at': article.get('published_at'),
                    'created_at': article.get('created_at'),
                    'url': article_url,
                    'excerpt': excerpt,
                    'blog_handle': blog_handle
                })

        logger.info(f"✅ Fetched {len(all_articles)} article(s) from Shopify")
        return all_articles

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to fetch articles: {e}")
        return []


def get_new_articles(articles, tracking_data):
    """Filter articles that haven't been sent yet"""
    sent_ids = set(tracking_data['sent_articles'])
    new_articles = [a for a in articles if a['id'] not in sent_ids]

    logger.info(f"📊 Total articles: {len(articles)}, Sent: {len(sent_ids)}, New: {len(new_articles)}")
    return new_articles


def create_email_campaign(article, dry_run=False):
    """
    Create and send email campaign for article

    Note: Shopify Email doesn't have a direct API for campaigns.
    This function prepares the email data structure.

    Alternative approaches:
    1. Use Shopify Marketing API (if available)
    2. Use third-party email service (SendGrid, Mailchimp)
    3. Manual: Generate email template HTML and instructions
    """

    # Email content
    subject = f"🆕 New Guide: {article['title']}"

    # Extract featured snippet (first 100-150 chars of excerpt)
    snippet = article['excerpt'][:150] if article['excerpt'] else f"Discover our complete guide to {article['title'].lower()}"
    if len(article['excerpt']) > 150:
        snippet += "..."

    email_body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
        .header {{ background-color: #040462; padding: 40px 20px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; }}
        .content {{ padding: 40px 20px; }}
        .content h2 {{ color: #040462; font-size: 20px; margin-top: 0; }}
        .content p {{ color: #333333; line-height: 1.6; font-size: 16px; }}
        .cta {{ text-align: center; padding: 30px 20px; }}
        .cta a {{ background-color: #040462; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }}
        .cta a:hover {{ background-color: #E0E0FF; color: #040462; }}
        .footer {{ background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MyDealz</h1>
        </div>
        <div class="content">
            <h2>{article['title']}</h2>
            <p>{snippet}</p>
            <p>We've analyzed dozens of products to help you make the best choice for your needs.</p>
            <p><strong>What you'll find inside:</strong></p>
            <ul>
                <li>✅ Detailed product comparisons</li>
                <li>✅ Expert recommendations</li>
                <li>✅ Price analysis</li>
                <li>✅ Buying guide</li>
            </ul>
        </div>
        <div class="cta">
            <a href="{article['url']}">Read the Full Guide →</a>
        </div>
        <div class="footer">
            <p>You're receiving this email because you subscribed to MyDealz updates.</p>
            <p><a href="{{{{ unsubscribe_url }}}}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
    """

    email_data = {
        'subject': subject,
        'body_html': email_body_html,
        'article': article,
        'created_at': datetime.now(timezone.utc).isoformat()
    }

    if dry_run:
        logger.info(f"🧪 DRY RUN - Would send email:")
        logger.info(f"   Subject: {subject}")
        logger.info(f"   Article: {article['title']}")
        logger.info(f"   URL: {article['url']}")
        return True

    # Save email template to file for manual sending
    email_file = BASE_DIR / 'data' / 'email_templates' / f"article_{article['id']}_email.html"
    email_file.parent.mkdir(parents=True, exist_ok=True)

    with open(email_file, 'w') as f:
        f.write(email_body_html)

    # Save email data as JSON
    json_file = email_file.with_suffix('.json')
    with open(json_file, 'w') as f:
        json.dump(email_data, f, indent=2)

    logger.info(f"📧 Email template saved:")
    logger.info(f"   HTML: {email_file}")
    logger.info(f"   JSON: {json_file}")
    logger.info(f"   Subject: {subject}")

    return True


def send_emails_for_articles(articles, tracking_data, dry_run=False, force_article_id=None):
    """Send emails for new articles"""

    if force_article_id:
        articles = [a for a in articles if a['id'] == force_article_id]
        if not articles:
            logger.error(f"❌ Article ID {force_article_id} not found")
            return False
        logger.info(f"🔄 FORCE SEND mode for article: {articles[0]['title']}")

    if not articles:
        logger.info("✅ No new articles to send emails for")
        return True

    logger.info(f"📧 Preparing to send {len(articles)} email(s)")

    sent_count = 0
    for article in articles:
        logger.info(f"\n📝 Processing article: {article['title']}")
        logger.info(f"   ID: {article['id']}")
        logger.info(f"   Published: {article['published_at']}")
        logger.info(f"   URL: {article['url']}")

        success = create_email_campaign(article, dry_run=dry_run)

        if success:
            sent_count += 1
            # Mark as sent
            if not dry_run and force_article_id is None:
                tracking_data['sent_articles'].append(article['id'])

    logger.info(f"\n✅ Processed {sent_count}/{len(articles)} email(s)")

    # Update tracking
    if not dry_run:
        tracking_data['last_check'] = datetime.now(timezone.utc).isoformat()
        save_tracking_data(tracking_data)

    return True


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Email automation for blog articles')
    parser.add_argument('--dry-run', action='store_true', help='Simulate without sending')
    parser.add_argument('--force-send', type=str, help='Force send email for specific article ID')
    parser.add_argument('--list', action='store_true', help='List all articles and exit')
    args = parser.parse_args()

    logger.info("=" * 80)
    logger.info("EMAIL AUTOMATION - Blog Articles")
    logger.info("=" * 80)
    logger.info(f"Store: {SHOPIFY_STORE_URL}")
    logger.info(f"Mode: {'DRY RUN' if args.dry_run else 'PRODUCTION'}")
    if args.force_send:
        logger.info(f"Force send: Article ID {args.force_send}")
    logger.info("")

    # Load tracking data
    tracking_data = load_tracking_data()
    logger.info(f"📊 Tracking: {len(tracking_data['sent_articles'])} articles already sent")

    # Fetch articles
    logger.info("🔍 Fetching blog articles from Shopify...")
    all_articles = get_blog_articles()

    if not all_articles:
        logger.error("❌ No articles found")
        sys.exit(1)

    # List mode
    if args.list:
        logger.info("\n📋 ALL ARTICLES:")
        for i, article in enumerate(all_articles, 1):
            status = "✅ SENT" if article['id'] in tracking_data['sent_articles'] else "🆕 NEW"
            logger.info(f"{i}. [{status}] ID: {article['id']} - {article['title']}")
        sys.exit(0)

    # Get new articles or force send specific article
    if args.force_send:
        articles_to_send = [a for a in all_articles if a['id'] == args.force_send]
    else:
        articles_to_send = get_new_articles(all_articles, tracking_data)

    # Send emails
    success = send_emails_for_articles(
        articles_to_send,
        tracking_data,
        dry_run=args.dry_run,
        force_article_id=args.force_send
    )

    if success:
        logger.info("\n" + "=" * 80)
        logger.info("✅ EMAIL AUTOMATION COMPLETE")
        logger.info("=" * 80)

        if not args.dry_run:
            logger.info(f"\n📧 Next steps:")
            logger.info(f"1. Open Shopify Email app")
            logger.info(f"2. Create new campaign")
            logger.info(f"3. Copy HTML from: data/email_templates/article_*_email.html")
            logger.info(f"4. Send to all subscribers")
    else:
        logger.error("\n❌ EMAIL AUTOMATION FAILED")
        sys.exit(1)


if __name__ == '__main__':
    main()
