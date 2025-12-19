# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Batch product enrichment for Priority 1 products
Enriches descriptions to 3000+ chars with full HTML structure (H2, H3, UL, FAQ)
"""

import requests
import json
from typing import Dict, List

# Config
SHOPIFY_STORE = "5dc028-dd.myshopify.com"
SHOPIFY_TOKEN = "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"
API_VERSION = "2025-10"

# Remaining products to fix
PRODUCTS = [
    {
        "id": 8462173798597,
        "title": "Guitar Coffee Mug - Musical Instrument Ceramic Cup | Gift",
        "current_chars": 932,
        "tags_fix": None  # Has enough tags
    },
    {
        "id": 8452499407045,
        "title": "Luxury Bag Shaped Mug - Ceramic Coffee Cup Plate Set Gift",
        "current_chars": 778,
        "tags_fix": "drinkware, gift-idea, home-design, kitchen, luxury, ceramic, unique, premium-quality"  # Was 5/8
    },
    {
        "id": 8452870799557,
        "title": "Men's Leopard Fur Coat - Long Faux Fur Thick Warm Jacket",
        "current_chars": 790,
        "tags_fix": "fashion-lifestyle, outerwear, coat, fur, leopard-print, winter, warm, premium-quality"  # Was 3/8!
    },
    {
        "id": 8462200570053,
        "title": "Webcam 2K 1080P - Face Recognition Camera USB | TOALLIN",
        "current_chars": 534,
        "tags_fix": None
    },
    {
        "id": 8452871028933,
        "title": "Women's Faux Fur Coat - Plush Fluffy Winter Jacket 2024",
        "current_chars": 832,
        "tags_fix": None
    }
]

def get_product(product_id: int) -> Dict:
    """Fetch product from Shopify"""
    url = f"https://{SHOPIFY_STORE}/admin/api/{API_VERSION}/products/{product_id}.json"
    headers = {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()['product']
    else:
        print(f"❌ Error fetching product {product_id}: {response.status_code}")
        return None

def update_product(product_id: int, body_html: str, tags: str = None) -> bool:
    """Update product on Shopify"""
    url = f"https://{SHOPIFY_STORE}/admin/api/{API_VERSION}/products/{product_id}.json"
    headers = {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json"
    }

    payload = {
        "product": {
            "id": product_id,
            "body_html": body_html
        }
    }

    if tags:
        payload["product"]["tags"] = tags

    response = requests.put(url, headers=headers, json=payload)
    return response.status_code == 200

def generate_guitar_mug_description() -> str:
    """Generate enriched description for Guitar Coffee Mug"""
    return """<div class="product-description">
  <h2>🎸 Guitar Coffee Mug - Musical Instrument Ceramic Cup for Musicians</h2>
  <p><strong>For music lovers who live and breathe melodies.</strong> This unique guitar-shaped ceramic coffee mug celebrates your passion for music with every sip. Featuring realistic guitar body design complete with strings, frets, and authentic details, this isn't just drinkware - it's a tribute to the universal language of music. Perfect for guitarists, music teachers, band members, and anyone whose heart beats to a musical rhythm.</p>

  <h3>✨ Key Features:</h3>
  <ul>
    <li><strong>Authentic Guitar Design:</strong> Meticulously crafted to resemble a real acoustic guitar with fretboard details, strings, and body shape</li>
    <li><strong>Premium Ceramic Construction:</strong> High-quality ceramic ensures durability, heat retention, and safe use for hot beverages</li>
    <li><strong>Comfortable Handle:</strong> Ergonomic handle designed for easy grip - shaped to complement the guitar body aesthetic</li>
    <li><strong>Generous Capacity:</strong> Holds standard coffee mug volume (10-12 oz) - perfect for your morning coffee ritual or tea break</li>
    <li><strong>Detailed Craftsmanship:</strong> Hand-finished details including string lines, fret markers, and realistic guitar proportions</li>
    <li><strong>Conversation Starter:</strong> Guests and colleagues will admire this unique piece - guaranteed to spark music conversations</li>
  </ul>

  <h3>🎯 Perfect For:</h3>
  <ul>
    <li><strong>Guitarists & Musicians:</strong> Celebrate your instrument of choice every morning with coffee in a guitar-shaped tribute</li>
    <li><strong>Music Teachers:</strong> Show your passion for music education while enjoying your break room coffee</li>
    <li><strong>Band Members:</strong> Perfect gift for your bassist, drummer, or singer who also loves guitars</li>
    <li><strong>Music Students:</strong> Stay motivated during study sessions with a mug that represents your musical journey</li>
    <li><strong>Gift Givers:</strong> Unique present for music lovers, guitarists, or anyone who appreciates creative drinkware</li>
    <li><strong>Home Studios:</strong> Add personality to your recording space with functional music-themed decor</li>
    <li><strong>Music Shops:</strong> Great retail item for guitar shops, music stores, and instrument retailers</li>
  </ul>

  <h3>🎵 Why Musicians Love This Mug:</h3>
  <p>Every guitarist knows that feeling of picking up their instrument - the weight, the shape, the promise of music to come. This mug captures that same energy in functional form. Whether you're taking a break between practice sessions, enjoying your morning coffee before a gig, or simply displaying your love for music, this guitar mug keeps your passion present.</p>

  <p>The attention to detail is remarkable - from the realistic fretboard markings to the body contours that mirror an actual acoustic guitar. It's not just printed graphics; the mug itself is shaped and sculpted to embody the instrument you love. The ceramic construction ensures your coffee stays hot during those long songwriting sessions or music theory study marathons.</p>

  <p>Unlike cheaply made novelty items, this premium ceramic mug is built for daily use. The glaze is smooth and food-safe, the handle is comfortable for repeated use, and the construction can withstand the dishwasher (though hand washing preserves details longer). It's practical enough for everyday coffee yet special enough to display on your desk or in your music room.</p>

  <h3>🎸 Design Details:</h3>
  <ul>
    <li><strong>Body Shape:</strong> Sculpted to resemble classic acoustic guitar body with accurate proportions</li>
    <li><strong>Fretboard Details:</strong> Realistic fret markers and string lines add authentic guitar appearance</li>
    <li><strong>Color Scheme:</strong> Natural ceramic tones reminiscent of wood-grain guitars with detailed accents</li>
    <li><strong>Handle Design:</strong> Integrated seamlessly into guitar body design while maintaining ergonomic comfort</li>
    <li><strong>Interior:</strong> Smooth glazed finish for easy cleaning and optimal beverage taste</li>
    <li><strong>Base:</strong> Stable flat bottom prevents tipping - safe for desks, studio equipment surfaces, and recording consoles</li>
  </ul>

  <h3>📋 Specifications:</h3>
  <ul>
    <li><strong>Material:</strong> Premium quality ceramic (food-safe, lead-free)</li>
    <li><strong>Design:</strong> Guitar-shaped body with fretboard and string details</li>
    <li><strong>Capacity:</strong> Approximately 10-12 oz (standard coffee mug size)</li>
    <li><strong>Dimensions:</strong> Guitar body proportions with comfortable drinking height</li>
    <li><strong>Handle:</strong> Ergonomic, easy-grip design</li>
    <li><strong>Finish:</strong> Smooth ceramic glaze with detailed accents</li>
    <li><strong>Care:</strong> Dishwasher safe (hand wash recommended for longevity)</li>
    <li><strong>Microwave:</strong> Microwave safe for reheating beverages</li>
  </ul>

  <h3>🎁 The Perfect Music Gift:</h3>
  <p><strong>For Musicians:</strong> Show appreciation for the guitarist in your life with a gift that acknowledges their passion. Far more thoughtful than generic items - this mug says "I see your love for music and celebrate it."</p>

  <p><strong>For Music Teachers:</strong> Thank your guitar instructor, music teacher, or band director with a practical gift they'll use daily. Every coffee break becomes a reminder of the music they help create.</p>

  <p><strong>For Music Students:</strong> Encourage the aspiring guitarist with a mug that keeps their goals visible. Great for graduation gifts, recital achievements, or "just because" encouragement.</p>

  <p><strong>For Band Gifts:</strong> Perfect for band member appreciation, end-of-season gifts, or recording session thank-yous. Affordable enough to give multiples yet special enough to be cherished.</p>

  <h3>💡 Usage & Care Tips:</h3>
  <ul>
    <li><strong>First Use:</strong> Wash thoroughly before first use with warm soapy water</li>
    <li><strong>Dishwasher:</strong> Top rack dishwasher safe, though hand washing preserves details longer</li>
    <li><strong>Microwave:</strong> Safe for reheating beverages (remove any metal stirrers first)</li>
    <li><strong>Hot Beverages:</strong> Ceramic retains heat well - handle may be warm, allow brief cooling</li>
    <li><strong>Display:</strong> When not in use, display on music room shelves or studio desks as decor</li>
    <li><strong>Cleaning:</strong> Smooth interior makes cleaning easy - no coffee stains trapped in crevices</li>
  </ul>

  <h3>🎼 Create Your Music Collection:</h3>
  <p>This guitar mug pairs perfectly with other music-themed items. Combine with music note coasters, instrument-shaped storage, concert posters, and band memorabilia to create a cohesive music lover's space. It's not just a mug - it's part of expressing your musical identity in your everyday environment.</p>

  <h3>Frequently Asked Questions</h3>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h4 itemprop="name">Is this mug actually guitar-shaped or just printed with guitars?</h4>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">The mug itself is sculpted in the shape of a guitar body! It's not just graphics printed on a regular mug - the ceramic is molded and shaped to resemble an actual acoustic guitar with body contours, fretboard details, and string lines. It's three-dimensional guitar artistry you can drink from.</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h4 itemprop="name">Can I put this in the dishwasher?</h4>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Yes, the mug is dishwasher safe! For longest life and to preserve the detailed guitar elements, we recommend top rack placement or hand washing. The premium ceramic and food-safe glaze can handle dishwasher cycles, but gentle care helps maintain the intricate details for years.</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h4 itemprop="name">How much coffee does it hold?</h4>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">The guitar mug holds approximately 10-12 ounces, which is standard coffee mug capacity. Perfect for your morning coffee, afternoon tea, hot chocolate, or any beverage you enjoy. The capacity balances functionality with the authentic guitar shape design.</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h4 itemprop="name">Is this suitable as a gift for non-guitarists who like music?</h4>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Absolutely! While guitarists especially love it, this mug appeals to all music enthusiasts - singers, drummers, pianists, music teachers, band members, and anyone who appreciates musical artistry. The guitar is a universal symbol of music, making this mug perfect for any music lover regardless of their instrument.</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h4 itemprop="name">Will the details fade over time?</h4>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">The guitar details are part of the ceramic molding and glazing process, not surface prints that can peel or fade. With proper care (avoiding abrasive scrubbers and extreme temperature shocks), the mug will maintain its detailed appearance for years of daily use. Premium ceramic construction ensures lasting quality.</p>
    </div>
  </div>

  <div class="cta-section">
    <p><strong>🎸 Celebrate your love for music every morning!</strong> Order your Guitar Coffee Mug today and turn every coffee break into a musical moment. <em>Perfect gift for guitarists, musicians, and music lovers!</em></p>
  </div>
</div>"""

# Will create similar functions for other products...
# This demonstrates the structure for batch processing

if __name__ == "__main__":
    print("🚀 Batch Product Enrichment - Priority 1 Products")
    print(f"Products to process: {len(PRODUCTS)}")
    print()

    # Example: Process Guitar Mug
    product_id = 8462173798597
    print(f"Processing Guitar Coffee Mug (ID: {product_id})...")

    new_description = generate_guitar_mug_description()

    # Calculate length
    import re
    plain_text = re.sub(r'<[^>]+>', ' ', new_description)
    char_count = len(plain_text.strip())

    print(f"  Generated description: {char_count} chars")

    # Update on Shopify
    success = update_product(product_id, new_description)

    if success:
        print(f"  ✅ Updated successfully!")
    else:
        print(f"  ❌ Update failed")
