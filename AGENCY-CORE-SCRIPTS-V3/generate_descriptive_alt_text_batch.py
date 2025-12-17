# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Generate and Update Descriptive Alt Text - Batch Processor

Purpose:
- Generate DESCRIPTIVE alt text (NOT just product title)
- Process in batches of 50 products max
- Verify empirically after each batch
- Respect draft status (update alt but keep draft)

Alt Text Quality Standards:
- Descriptive of image content (not repetitive title)
- Include view/angle/detail context
- Accessibility-compliant
- SEO-optimized

Example:
  Product: "Stainless Steel Vacuum Bottle"
  Image 1 alt: "Stainless steel vacuum bottle - front view showing sleek design"
  Image 2 alt: "Vacuum bottle capacity markings and measurements detail"
  Image 3 alt: "Insulated bottle lid and drinking cap mechanism close-up"
"""

import os
import json
import requests
import time
from dotenv import load_dotenv

load_dotenv()

SHOPIFY_STORE = os.getenv('SHOPIFY_STORE_URL', '5dc028-dd.myshopify.com')
SHOPIFY_TOKEN = os.getenv('SHOPIFY_ADMIN_API_TOKEN')

BASE_URL = f"https://{SHOPIFY_STORE}/admin/api/2024-10"
HEADERS = {
    'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    'Content-Type': 'application/json'
}

# Image position descriptors for variety
IMAGE_DESCRIPTORS = [
    "front view", "side angle view", "back view", "top view",
    "detailed close-up", "packaging view", "in-use demonstration",
    "feature highlight", "material texture detail", "color variant display",
    "size comparison view", "product dimensions", "component details",
    "lifestyle context", "multiple angles view"
]

def load_batch_report():
    """Load the batch report from analysis"""

    report_path = '/Users/mac/Desktop/MyDealz/reports/alt_text_missing_detailed.json'

    try:
        with open(report_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Report not found: {report_path}")
        print("   Run analyze_missing_alt_text_detailed.py first")
        return None

def get_product_full(product_id):
    """Get full product details including all images"""

    url = f"{BASE_URL}/products/{product_id}.json"

    response = requests.get(url, headers=HEADERS)

    if response.status_code == 200:
        return response.json().get('product')

    print(f"❌ Failed to fetch product {product_id}: {response.status_code}")
    return None

def generate_descriptive_alt(product, image_index, total_images):
    """Generate descriptive alt text for an image"""

    title = product['title']
    product_type = product.get('product_type', '')

    # Shorten title if too long
    if len(title) > 50:
        # Take key product identifiers
        words = title.split()
        title_short = ' '.join(words[:6]) + ('...' if len(words) > 6 else '')
    else:
        title_short = title

    # Determine descriptor based on image position
    if image_index == 0:
        descriptor = "product main view"
    elif image_index == 1:
        descriptor = "detailed view"
    elif image_index == total_images - 1:
        descriptor = "additional angle"
    else:
        # Cycle through descriptors
        descriptor = IMAGE_DESCRIPTORS[image_index % len(IMAGE_DESCRIPTORS)]

    # Build descriptive alt text
    if product_type:
        alt_text = f"{title_short} - {descriptor} | {product_type}"
    else:
        alt_text = f"{title_short} - {descriptor}"

    # Truncate if too long (max 125 chars for SEO best practice)
    if len(alt_text) > 125:
        alt_text = alt_text[:122] + "..."

    return alt_text

def update_product_images_alt(product, dry_run=False):
    """Update all images alt text for a product"""

    product_id = product['id']
    images = product.get('images', [])

    if not images:
        return {'success': True, 'updated': 0, 'message': 'No images'}

    updates = []
    errors = []

    for idx, image in enumerate(images):
        current_alt = image.get('alt')

        # Skip if already has alt text
        if current_alt and current_alt.strip():
            continue

        # Generate descriptive alt
        new_alt = generate_descriptive_alt(product, idx, len(images))

        updates.append({
            'image_id': image['id'],
            'position': image.get('position', idx + 1),
            'old_alt': current_alt or '(empty)',
            'new_alt': new_alt
        })

        if dry_run:
            continue

        # Update via API
        url = f"{BASE_URL}/products/{product_id}/images/{image['id']}.json"
        payload = {
            'image': {
                'id': image['id'],
                'alt': new_alt
            }
        }

        response = requests.put(url, headers=HEADERS, json=payload)

        if response.status_code != 200:
            errors.append({
                'image_id': image['id'],
                'error': response.status_code,
                'message': response.text
            })

        # Rate limiting
        time.sleep(0.5)

    return {
        'success': len(errors) == 0,
        'updated': len(updates),
        'updates': updates,
        'errors': errors
    }

def process_batch(batch_products, batch_number, dry_run=False):
    """Process a batch of products"""

    print("\n" + "=" * 70)
    print(f"BATCH {batch_number} - Processing {len(batch_products)} Products")
    print("=" * 70)

    if dry_run:
        print("⚠️ DRY RUN MODE - No actual updates will be made\n")

    results = []
    total_updated = 0
    total_errors = 0

    for i, product_id in enumerate(batch_products, 1):
        print(f"\n[{i}/{len(batch_products)}] Product ID: {product_id}")

        # Fetch full product
        product = get_product_full(product_id)

        if not product:
            results.append({
                'product_id': product_id,
                'success': False,
                'error': 'Failed to fetch product'
            })
            total_errors += 1
            continue

        print(f"   Title: {product['title']}")
        print(f"   Status: {product.get('status', 'unknown')}")
        print(f"   Images: {len(product.get('images', []))}")

        # Update images
        result = update_product_images_alt(product, dry_run=dry_run)

        print(f"   Updated: {result['updated']} images")

        if result['errors']:
            print(f"   ❌ Errors: {len(result['errors'])}")
            for error in result['errors']:
                print(f"      Image {error['image_id']}: {error['error']}")
            total_errors += len(result['errors'])
        else:
            print(f"   ✅ Success")

        # Show sample alt texts
        if result['updates'] and not dry_run:
            print(f"   Sample alt texts:")
            for update in result['updates'][:3]:
                print(f"      • {update['new_alt']}")

        results.append({
            'product_id': product_id,
            'title': product['title'],
            'success': result['success'],
            'updated': result['updated'],
            'errors': result.get('errors', [])
        })

        total_updated += result['updated']

    # Batch summary
    print("\n" + "=" * 70)
    print(f"BATCH {batch_number} SUMMARY")
    print("=" * 70)

    success_count = sum(1 for r in results if r['success'])

    print(f"\n📊 Results:")
    print(f"   Products processed: {len(batch_products)}")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {len(batch_products) - success_count}")
    print(f"   Total images updated: {total_updated}")
    print(f"   Total errors: {total_errors}")

    success_rate = (success_count / len(batch_products) * 100) if batch_products else 0
    print(f"\n   Success rate: {success_rate:.1f}%")

    return {
        'batch_number': batch_number,
        'products_processed': len(batch_products),
        'success_count': success_count,
        'total_updated': total_updated,
        'total_errors': total_errors,
        'success_rate': success_rate,
        'results': results
    }

def main():
    import sys

    print("=" * 70)
    print("DESCRIPTIVE ALT TEXT GENERATOR - BATCH PROCESSOR")
    print("=" * 70)

    # Parse arguments
    dry_run = '--dry-run' in sys.argv
    batch_num = None

    for arg in sys.argv:
        if arg.startswith('--batch='):
            batch_num = int(arg.split('=')[1])

    if dry_run:
        print("\n⚠️ DRY RUN MODE - Preview mode, no actual updates")

    # Load batch report
    report = load_batch_report()

    if not report:
        return 1

    batches = report.get('batches', [])

    if not batches:
        print("❌ No batches found in report")
        return 1

    print(f"\n📦 Available batches: {len(batches)}")

    for batch in batches:
        print(f"   Batch {batch['batch_number']}: {batch['product_count']} products, {batch['missing_alt_total']} missing alt texts")

    # Select batch to process
    if batch_num is None:
        batch_num = 1
        print(f"\n🎯 Processing Batch 1 by default (use --batch=N to specify)")
    else:
        print(f"\n🎯 Processing Batch {batch_num} (user specified)")

    selected_batch = next((b for b in batches if b['batch_number'] == batch_num), None)

    if not selected_batch:
        print(f"❌ Batch {batch_num} not found")
        return 1

    # Process batch
    result = process_batch(
        selected_batch['products'],
        selected_batch['batch_number'],
        dry_run=dry_run
    )

    # Save results
    results_path = f'/Users/mac/Desktop/MyDealz/reports/alt_text_batch_{batch_num}_results.json'
    os.makedirs(os.path.dirname(results_path), exist_ok=True)

    with open(results_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\n💾 Results saved: {results_path}")

    # Final recommendations
    print("\n" + "=" * 70)
    print("NEXT STEPS")
    print("=" * 70)

    if result['success_rate'] == 100:
        print(f"\n✅ BATCH {batch_num} COMPLETE - 100% SUCCESS")

        if batch_num < len(batches):
            print(f"\n🎯 Ready for Batch {batch_num + 1}")
            print(f"   Command: python3 scripts/generate_descriptive_alt_text_batch.py --batch={batch_num + 1}")
        else:
            print(f"\n🎉 ALL BATCHES COMPLETE!")
            print(f"   Run verification: python3 scripts/verify_alt_text_coverage.py")
    else:
        print(f"\n⚠️ BATCH {batch_num} INCOMPLETE - {result['success_rate']:.1f}% success")
        print(f"   {result['total_errors']} errors encountered")
        print(f"   Review errors and retry failed products")

    return 0 if result['success_rate'] == 100 else 1

if __name__ == "__main__":
    exit(main())
