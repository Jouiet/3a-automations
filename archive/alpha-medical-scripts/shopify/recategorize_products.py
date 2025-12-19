# Type: agency
# Category: shopify
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
Automated Product Recategorization Script
Implements the 3-category taxonomy via Shopify Admin API
"""

import requests
import json
import sys
from typing import List, Dict

# Load Shopify credentials
SHOPIFY_STORE = None
SHOPIFY_ACCESS_TOKEN = None

try:
    with open('.env.admin', 'r') as f:
        for line in f:
            if line.startswith('SHOPIFY_ADMIN_ACCESS_TOKEN='):
                SHOPIFY_ACCESS_TOKEN = line.split('=', 1)[1].strip()
            elif line.startswith('SHOPIFY_STORE_DOMAIN='):
                SHOPIFY_STORE = line.split('=', 1)[1].strip()
except FileNotFoundError:
    print("❌ ERROR: .env.admin not found")
    sys.exit(1)

if not SHOPIFY_STORE or not SHOPIFY_ACCESS_TOKEN:
    print("❌ ERROR: Missing credentials in .env.admin")
    sys.exit(1)

API_VERSION = "2025-10"
BASE_URL = f"https://{SHOPIFY_STORE}/admin/api/{API_VERSION}"
HEADERS = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json"
}

# 13 beauty products to move (from analysis)
BEAUTY_PRODUCT_HANDLES = [
    "4-in-1-cavitation-body-slimming-machine-40k-ultrasound",
    "7-color-led-face-mask-red-light-therapy",
    "7-color-led-light-therapy-face-mask-anti-aging",
    "electric-medical-cupping-therapy-set-beauty-massager-glass-jars-anti-cellulite-cupping-vacuum-slimming-guasha",
    "ems-v-face-lifting-device-6-modes-microcurrent-massager",
    "face-lifting-device-red-light-skin-rejuvenation-v-face",
    "foreverlily-7-color-led-mask-face-neck-skin-rejuvenation",
    "foreverlily-led-face-neck-mask-7-colors-3d-flexible",
    "hello-face-red-light-therapy-mask-face-neck-infrared-led",
    "led-facial-mask-with-neck-7-colors-photon-anti-aging",
    "neck-led-lift-mask-anti-wrinkle-skin-tightening",
    "professional-7-color-led-mask-facial-light-therapy",
    "v-line-face-slimming-ems-lifting-microcurrent-device"
]


def get_collection_id(handle: str) -> int:
    """Get collection ID by handle"""
    url = f"{BASE_URL}/custom_collections.json"
    params = {"handle": handle}
    response = requests.get(url, headers=HEADERS, params=params)
    
    if response.status_code == 200:
        collections = response.json().get('custom_collections', [])
        if collections:
            return collections[0]['id']
    
    # Try smart collections
    url = f"{BASE_URL}/smart_collections.json"
    response = requests.get(url, headers=HEADERS, params=params)
    
    if response.status_code == 200:
        collections = response.json().get('smart_collections', [])
        if collections:
            return collections[0]['id']
    
    return None


def get_product_by_handle(handle: str) -> Dict:
    """Get product by handle"""
    url = f"{BASE_URL}/products.json"
    params = {"handle": handle}
    response = requests.get(url, headers=HEADERS, params=params)
    
    if response.status_code == 200:
        products = response.json().get('products', [])
        if products:
            return products[0]
    return None


def create_collection(title: str, handle: str, description: str) -> int:
    """Create a new custom collection"""
    print(f"\n📦 Creating collection '{title}'...")
    
    payload = {
        "custom_collection": {
            "title": title,
            "handle": handle,
            "body_html": description,
            "published": True
        }
    }
    
    url = f"{BASE_URL}/custom_collections.json"
    response = requests.post(url, headers=HEADERS, json=payload)
    
    if response.status_code in [200, 201]:
        collection_id = response.json()['custom_collection']['id']
        print(f"✅ Collection created: ID {collection_id}")
        return collection_id
    else:
        print(f"❌ Failed to create collection: {response.status_code}")
        print(response.text)
        return None


def add_product_to_collection(product_id: int, collection_id: int):
    """Add product to collection via collect"""
    payload = {
        "collect": {
            "product_id": product_id,
            "collection_id": collection_id
        }
    }
    
    url = f"{BASE_URL}/collects.json"
    response = requests.post(url, headers=HEADERS, json=payload)
    
    return response.status_code in [200, 201]


def remove_product_from_collection(product_id: int, collection_id: int):
    """Remove product from collection"""
    # Get collect ID first
    url = f"{BASE_URL}/collects.json"
    params = {"product_id": product_id, "collection_id": collection_id}
    response = requests.get(url, headers=HEADERS, params=params)
    
    if response.status_code == 200:
        collects = response.json().get('collects', [])
        for collect in collects:
            delete_url = f"{BASE_URL}/collects/{collect['id']}.json"
            requests.delete(delete_url, headers=HEADERS)
    
    return True


def get_all_products_in_collection(collection_id: int) -> List[int]:
    """Get all product IDs in a collection"""
    url = f"{BASE_URL}/collects.json"
    params = {"collection_id": collection_id, "limit": 250}
    response = requests.get(url, headers=HEADERS, params=params)
    
    if response.status_code == 200:
        collects = response.json().get('collects', [])
        return [c['product_id'] for c in collects]
    return []


def delete_collection(collection_id: int, collection_type="custom"):
    """Delete a collection"""
    if collection_type == "custom":
        url = f"{BASE_URL}/custom_collections/{collection_id}.json"
    else:
        url = f"{BASE_URL}/smart_collections/{collection_id}.json"
    
    response = requests.delete(url, headers=HEADERS)
    return response.status_code == 200


def main():
    print("=" * 80)
    print("AUTOMATED PRODUCT RECATEGORIZATION")
    print("=" * 80)
    print(f"\n🏪 Store: {SHOPIFY_STORE}")
    print(f"📅 API Version: {API_VERSION}")
    
    # STEP 1: Create Beauty & Anti-Aging collection
    print("\n" + "=" * 80)
    print("STEP 1: Create 'Beauty & Anti-Aging' Collection")
    print("=" * 80)
    
    beauty_collection_id = get_collection_id("beauty-anti-aging")
    if beauty_collection_id:
        print(f"✅ Collection already exists: ID {beauty_collection_id}")
    else:
        description = "Professional LED therapy masks, face lifting devices, body slimming equipment. Advanced cosmetic technology for anti-aging, skin rejuvenation, and body contouring."
        beauty_collection_id = create_collection(
            "Beauty & Anti-Aging",
            "beauty-anti-aging",
            description
        )
        if not beauty_collection_id:
            print("❌ Failed to create collection. Aborting.")
            return 1
    
    # STEP 2: Move beauty products
    print("\n" + "=" * 80)
    print(f"STEP 2: Move {len(BEAUTY_PRODUCT_HANDLES)} Beauty Products")
    print("=" * 80)
    
    pain_relief_id = get_collection_id("pain-relief-recovery")
    therapy_id = get_collection_id("therapy-wellness")
    
    if not pain_relief_id or not therapy_id:
        print("❌ Could not find core collections. Aborting.")
        return 1
    
    print(f"📌 Pain Relief & Recovery ID: {pain_relief_id}")
    print(f"📌 Therapy & Wellness ID: {therapy_id}")
    print(f"📌 Beauty & Anti-Aging ID: {beauty_collection_id}")
    
    moved_count = 0
    for handle in BEAUTY_PRODUCT_HANDLES:
        print(f"\n🔄 Processing: {handle}")
        product = get_product_by_handle(handle)
        
        if not product:
            print(f"  ⚠️  Product not found")
            continue
        
        product_id = product['id']
        product_title = product['title']
        print(f"  📦 Found: {product_title} (ID: {product_id})")
        
        # Remove from Pain Relief
        print(f"  ➖ Removing from Pain Relief & Recovery...")
        remove_product_from_collection(product_id, pain_relief_id)
        
        # Remove from Therapy
        print(f"  ➖ Removing from Therapy & Wellness...")
        remove_product_from_collection(product_id, therapy_id)
        
        # Add to Beauty
        print(f"  ➕ Adding to Beauty & Anti-Aging...")
        if add_product_to_collection(product_id, beauty_collection_id):
            print(f"  ✅ Successfully moved!")
            moved_count += 1
        else:
            print(f"  ❌ Failed to add")
    
    print(f"\n✅ Moved {moved_count}/{len(BEAUTY_PRODUCT_HANDLES)} beauty products")
    
    # STEP 3: Move Posture products to Pain Relief
    print("\n" + "=" * 80)
    print("STEP 3: Move Posture Products to Pain Relief")
    print("=" * 80)
    
    posture_id = get_collection_id("posture-support")
    if posture_id:
        print(f"📌 Posture & Support ID: {posture_id}")
        posture_products = get_all_products_in_collection(posture_id)
        print(f"📦 Found {len(posture_products)} products in Posture & Support")
        
        for product_id in posture_products:
            # Add to Pain Relief (don't remove from posture yet)
            if add_product_to_collection(product_id, pain_relief_id):
                print(f"  ✅ Moved product ID {product_id}")
        
        print(f"\n✅ All posture products added to Pain Relief & Recovery")
    else:
        print("⚠️  Posture & Support collection not found (may already be deleted)")
    
    # STEP 4: Delete old collections
    print("\n" + "=" * 80)
    print("STEP 4: Delete Obsolete Collections")
    print("=" * 80)
    
    # Delete Complete Care Kits (0 products)
    care_kits_id = get_collection_id("complete-care-kits")
    if care_kits_id:
        print(f"\n🗑️  Deleting 'Complete Care Kits' (ID: {care_kits_id})...")
        if delete_collection(care_kits_id):
            print("✅ Deleted Complete Care Kits")
        else:
            print("❌ Failed to delete Complete Care Kits")
    
    # Delete Posture & Support
    if posture_id:
        print(f"\n🗑️  Deleting 'Posture & Support' (ID: {posture_id})...")
        if delete_collection(posture_id):
            print("✅ Deleted Posture & Support")
        else:
            print("❌ Failed to delete Posture & Support")
    
    # FINAL SUMMARY
    print("\n" + "=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    
    # Get final counts
    pain_count = len(get_all_products_in_collection(pain_relief_id))
    therapy_count = len(get_all_products_in_collection(therapy_id))
    beauty_count = len(get_all_products_in_collection(beauty_collection_id))
    
    print(f"\n✅ Pain Relief & Recovery: {pain_count} products")
    print(f"✅ Therapy & Wellness: {therapy_count} products")
    print(f"✅ Beauty & Anti-Aging: {beauty_count} products")
    print(f"\n🎉 Recategorization COMPLETE!")
    print(f"\n🌐 Verify at: https://{SHOPIFY_STORE.replace('.myshopify.com', '')}.shop/collections")
    
    return 0


if __name__ == "__main__":
    exit(main())
