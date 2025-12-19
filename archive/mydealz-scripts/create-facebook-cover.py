# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Facebook Cover Photo Generator for MyDealz
Creates 1640x856px cover with product collage
"""

import json
import os
import sys
import ssl
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from io import BytesIO

# Facebook cover dimensions
COVER_WIDTH = 1640
COVER_HEIGHT = 856

# Brand colors
BRAND_COLOR = "#EF4444"  # Red
DARK_BG = "#1F2937"      # Dark gray
LIGHT_TEXT = "#FFFFFF"   # White

def download_image(url):
    """Download image from URL"""
    try:
        # Create unverified SSL context (for Shopify CDN)
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(url, timeout=10, context=context) as response:
            return Image.open(BytesIO(response.read()))
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

def create_cover_photo(products_file, output_path):
    """Create Facebook cover photo from product images"""

    # Load products data
    with open(products_file) as f:
        data = json.load(f)
        products = data.get('products', [])

    # Create base image with gradient background
    cover = Image.new('RGB', (COVER_WIDTH, COVER_HEIGHT), DARK_BG)
    draw = ImageDraw.Draw(cover)

    # Categories to feature
    categories = {
        'Electronics': [],
        'Apparel & Accessories': [],
        'Home & Garden': [],
        'Office Supplies': [],
        'Toys & Games': []
    }

    # Group products by category
    for p in products:
        if not p.get('images'):
            continue
        ptype = p.get('product_type', '')
        if ptype in categories:
            categories[ptype].append(p['images'][0]['src'])

    # Select 4 representative images (1 per major category)
    selected_images = []
    for cat, urls in categories.items():
        if urls:
            selected_images.append(urls[0])  # 1 per category
            if len(selected_images) >= 4:
                break

    selected_images = selected_images[:4]

    print(f"Selected {len(selected_images)} product images")

    # Download and prepare images
    product_imgs = []
    for i, url in enumerate(selected_images):
        print(f"Downloading image {i+1}/{len(selected_images)}...")
        img = download_image(url)
        if img:
            product_imgs.append(img)

    if len(product_imgs) < 3:
        print("Error: Not enough product images downloaded")
        return False

    # Magazine-style creative layout with overlapping images and shadows
    # Leave space at bottom for branding text

    grid_height = 600  # Top 600px for product grid

    # Create a temporary canvas for layered composition
    temp_canvas = Image.new('RGBA', (COVER_WIDTH, COVER_HEIGHT), (31, 41, 55, 255))

    # Define magazine-style layout with (x, y, width, height, rotation, corner_radius)
    # Overlapping, varied sizes, strategic positioning
    layouts = [
        # Large featured image - slightly rotated, top left
        (50, 40, 680, 480, -2, 15),
        # Medium image - overlapping on right
        (650, 80, 550, 380, 1, 12),
        # Medium image - bottom left, slight overlap
        (100, 320, 500, 350, 1.5, 12),
        # Accent image - top right corner
        (1250, 30, 350, 280, -1, 10),
    ]

    # Place images with shadows and rounded corners
    for i, img in enumerate(product_imgs[:4]):
        if i >= len(layouts):
            break

        x, y, img_width, img_height, rotation, corner_radius = layouts[i]

        # Resize and crop to fit
        img_resized = img.copy()
        img_resized.thumbnail((img_width * 2, img_height * 2), Image.Resampling.LANCZOS)

        # Center crop
        left = (img_resized.width - img_width) // 2
        top = (img_resized.height - img_height) // 2
        img_cropped = img_resized.crop((left, top, left + img_width, top + img_height))

        # Create rounded corners mask
        mask = Image.new('L', (img_width, img_height), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, img_width, img_height],
                                    radius=corner_radius, fill=255)

        # Create shadow layer
        shadow = Image.new('RGBA', (img_width + 20, img_height + 20), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        # Multiple shadows for depth
        for offset in range(8, 0, -1):
            alpha = int(60 / offset)
            shadow_draw.rounded_rectangle(
                [offset, offset, img_width + offset, img_height + offset],
                radius=corner_radius,
                fill=(0, 0, 0, alpha)
            )

        # Convert cropped image to RGBA
        img_rgba = img_cropped.convert('RGBA')

        # Apply rounded corners
        img_rgba.putalpha(mask)

        # Rotate if needed
        if rotation != 0:
            shadow = shadow.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)
            img_rgba = img_rgba.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)

        # Paste shadow first
        shadow_x = x - 10
        shadow_y = y - 10
        temp_canvas.paste(shadow, (shadow_x, shadow_y), shadow)

        # Paste image on top
        temp_canvas.paste(img_rgba, (x, y), img_rgba)

    # Convert back to RGB
    cover = temp_canvas.convert('RGB')

    # Create gradient overlay at bottom for text
    overlay = Image.new('RGBA', (COVER_WIDTH, COVER_HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    # Draw gradient rectangle at bottom
    for i in range(200):
        alpha = int((i / 200) * 180)
        overlay_draw.rectangle([0, grid_height + i, COVER_WIDTH, grid_height + i + 1],
                              fill=(31, 41, 55, alpha))

    cover = Image.alpha_composite(cover.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(cover)

    # Add text overlay
    try:
        # Try to use a nice font
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 80)
        font_medium = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    except:
        # Fallback to default
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Main text
    text1 = "MyDealz"
    text2 = "Curated Deals • Verified Savings"
    text3 = "Electronics | Fashion | Home | Office"

    # Center text at bottom
    y_base = grid_height + 50

    # Draw text with shadow for better readability
    # Shadow
    draw.text((COVER_WIDTH//2 + 3, y_base + 3), text1, fill=(0, 0, 0),
             font=font_large, anchor="mm")
    # Main text
    draw.text((COVER_WIDTH//2, y_base), text1, fill=BRAND_COLOR,
             font=font_large, anchor="mm")

    # Tagline
    draw.text((COVER_WIDTH//2 + 2, y_base + 92), text2, fill=(0, 0, 0),
             font=font_medium, anchor="mm")
    draw.text((COVER_WIDTH//2, y_base + 90), text2, fill=LIGHT_TEXT,
             font=font_medium, anchor="mm")

    # Categories
    draw.text((COVER_WIDTH//2 + 2, y_base + 147), text3, fill=(0, 0, 0),
             font=font_small, anchor="mm")
    draw.text((COVER_WIDTH//2, y_base + 145), text3, fill="#9CA3AF",
             font=font_small, anchor="mm")

    # Save cover photo
    cover.save(output_path, 'JPEG', quality=95, optimize=True)
    print(f"\n✓ Cover photo saved: {output_path}")
    print(f"  Dimensions: {COVER_WIDTH}x{COVER_HEIGHT}px")
    print(f"  Size: {os.path.getsize(output_path) // 1024}KB")

    return True

if __name__ == "__main__":
    products_file = "/tmp/products_images.json"
    output_path = "/Users/mac/Desktop/MyDealz/assets/facebook-cover.jpg"

    if not os.path.exists(products_file):
        print("Error: Products data file not found")
        print("Run the Shopify API fetch first")
        sys.exit(1)

    # Create assets directory if needed
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    success = create_cover_photo(products_file, output_path)

    if success:
        print("\n✅ Facebook cover photo ready!")
        print(f"Upload to: https://www.facebook.com/profile.php?id=61582995367438")
    else:
        print("\n❌ Failed to create cover photo")
        sys.exit(1)
